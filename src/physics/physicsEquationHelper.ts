import { CircuitElementData } from '../types/circuit';
import { getBulbSpec } from '../constants/bulbCatalog';
import {
  getComponentEffectiveResistance,
  getSocketForwardThreshold,
  getSourceDischargeResistance,
  getVoltageSourceNominalVoltage,
  isSocketWithUnidirectionalLed,
} from './mnaSolver';

export interface ComponentPhysicsEquationModel {
  category: 'source' | 'led-diode' | 'switch-meter' | 'ohmic-load';
  effectiveResistanceOhms: number;
  isInfiniteResistance: boolean;
  forwardThresholdVolts: number;
  voltageLawLabel: string;
  voltageFormulaTitle: string;
  voltageEquationText: string;
  thermalLawLabel: string;
  thermalFormulaTitle: string;
  thermalEquationText: string;
}

function isSourceOrGridType(type: CircuitElementData['type']): boolean {
  return (
    type === 'battery' ||
    type === 'battery9v' ||
    type === 'battery-holder' ||
    type === 'solar-panel' ||
    type === 'solar_panel' ||
    type === 'wind-turbine' ||
    type === 'wind_turbine' ||
    type === 'hydro-turbine' ||
    type === 'hydro_turbine' ||
    type === 'bess-substation' ||
    type === 'bess_substation' ||
    type === 'distribution-panel' ||
    type === 'distribution_panel' ||
    type === 'transmission-tower' ||
    type === 'transmission_tower'
  );
}

function formatOhmsCompact(resistance: number): string {
  if (resistance >= 1e6) {
    return `${(resistance / 1e6).toFixed(1)} MΩ`;
  }
  if (resistance >= 1e3) {
    return `${(resistance / 1e3).toFixed(2)} kΩ`;
  }
  if (resistance < 0.05) {
    return `${(resistance * 1000).toFixed(1)} mΩ`;
  }
  return `${resistance.toFixed(2)} Ω`;
}

/**
 * Resolves component-accurate physics equations and live numerical substitutions
 * for the Inspector tabs without conflating sources, diodes, or meters with a 100Ω resistor.
 *
 * Time Complexity: O(1).
 */
export function resolveComponentPhysicsEquationModel(
  componentData: CircuitElementData,
  signedBranchCurrent: number,
  terminalVoltageVolts: number,
  isIndonesian: boolean
): ComponentPhysicsEquationModel {
  const absCurrent = Math.abs(signedBranchCurrent);
  const absVoltage = Math.abs(terminalVoltageVolts);

  if (isSourceOrGridType(componentData.type)) {
    const rInt =
      componentData.type === 'transmission-tower' ||
      componentData.type === 'transmission_tower'
        ? Math.max(0.01, componentData.internalResistance ?? 0.2)
        : getSourceDischargeResistance(componentData);
    const openCircuitEmf =
      componentData.type === 'transmission-tower' ||
      componentData.type === 'transmission_tower'
        ? absVoltage
        : getVoltageSourceNominalVoltage(componentData);
    const isCharging = signedBranchCurrent > 1e-4;
    const internalLoss = absCurrent * absCurrent * rInt;
    const computedTermV = isCharging
      ? Math.min(absVoltage, openCircuitEmf + absCurrent * rInt)
      : Math.max(0, openCircuitEmf - absCurrent * rInt);

    return {
      category: 'source',
      effectiveResistanceOhms: rInt,
      isInfiniteResistance: false,
      forwardThresholdVolts: 0,
      voltageLawLabel: isIndonesian
        ? 'Tegangan Terminal Sumber:'
        : 'Source Terminal Voltage:',
      voltageFormulaTitle: isCharging ? 'V_term = E₀ + I·R_int' : 'V_term = E₀ - I·R_int',
      voltageEquationText: isCharging
        ? `V_term = ${absVoltage.toFixed(2)} V (E₀=${openCircuitEmf.toFixed(2)}V, +I charging)`
        : `V_term = ${openCircuitEmf.toFixed(2)}V - (${absCurrent.toFixed(3)}A × ${formatOhmsCompact(rInt)}) = ${Math.min(openCircuitEmf, Math.abs(absVoltage > 0 ? absVoltage : computedTermV)).toFixed(2)} V`,
      thermalLawLabel: isIndonesian
        ? 'Rugi Kalor Internal (R_int):'
        : 'Internal Thermal Loss (R_int):',
      thermalFormulaTitle: 'P_loss = I² × R_int',
      thermalEquationText: `P_loss = (${absCurrent.toFixed(3)} A)² × (${formatOhmsCompact(rInt)}) = ${internalLoss.toFixed(4)} W`,
    };
  }

  if (isSocketWithUnidirectionalLed(componentData)) {
    const forwardThreshold = getSocketForwardThreshold(componentData);
    const bulbObj =
      typeof componentData.installedBulb === 'object' ? componentData.installedBulb : null;
    const bulbType = bulbObj ? bulbObj.bulbType : componentData.bulbType;
    const rSeries = bulbObj?.resistance ?? componentData.resistance ?? getBulbSpec(bulbType).resistance;
    const isBlocked = Boolean(componentData.isReverseBiased) || absCurrent < 1e-6;
    const seriesDrop = forwardThreshold + absCurrent * rSeries;

    return {
      category: 'led-diode',
      effectiveResistanceOhms: rSeries,
      isInfiniteResistance: isBlocked,
      forwardThresholdVolts: forwardThreshold,
      voltageLawLabel: isIndonesian
        ? 'Model Dioda LED Searah:'
        : 'Unidirectional LED Diode Model:',
      voltageFormulaTitle: forwardThreshold > 0 ? 'V = V_f + I·R_s' : 'V = I × R_LED',
      voltageEquationText: componentData.isReverseBiased
        ? isIndonesian
          ? `Reverse Bias (${absVoltage.toFixed(2)} V diblokir, I = 0 A)`
          : `Reverse Biased (${absVoltage.toFixed(2)} V blocked, I = 0 A)`
        : forwardThreshold > 0
        ? `V = ${forwardThreshold.toFixed(1)}V + (${absCurrent.toFixed(3)}A × ${formatOhmsCompact(rSeries)}) = ${(isBlocked ? absVoltage : seriesDrop).toFixed(2)} V`
        : `V = (${absCurrent.toFixed(3)} A) × (${formatOhmsCompact(rSeries)}) = ${absVoltage.toFixed(2)} V`,
      thermalLawLabel: isIndonesian
        ? 'Daya Disipasi LED:'
        : 'LED Thermal/Optical Dissipation:',
      thermalFormulaTitle: 'P = I² × R_s',
      thermalEquationText: `P = (${absCurrent.toFixed(3)} A)² × (${formatOhmsCompact(rSeries)}) = ${(absCurrent * absCurrent * rSeries).toFixed(4)} W`,
    };
  }

  if (
    componentData.type === 'switch' ||
    componentData.type === 'ammeter' ||
    componentData.type === 'voltmeter'
  ) {
    const effR = getComponentEffectiveResistance(componentData);
    const isOpen = effR >= 1e8;
    const dropV = isOpen ? absVoltage : absCurrent * effR;
    const lossW = isOpen ? 0 : absCurrent * absCurrent * effR;

    return {
      category: 'switch-meter',
      effectiveResistanceOhms: effR,
      isInfiniteResistance: isOpen,
      forwardThresholdVolts: 0,
      voltageLawLabel: isIndonesian
        ? 'Karakteristik R_dalam Alat/Sakelar:'
        : 'Instrument / Switch Drop:',
      voltageFormulaTitle: 'V = I × R_eff',
      voltageEquationText: isOpen
        ? isIndonesian
          ? `Terbuka (R ≈ ∞, V_celah = ${absVoltage.toFixed(2)} V, I = 0 A)`
          : `Open Circuit (R ≈ ∞, ΔV = ${absVoltage.toFixed(2)} V, I = 0 A)`
        : `V = (${absCurrent.toFixed(3)} A) × (${formatOhmsCompact(effR)}) = ${dropV.toFixed(4)} V`,
      thermalLawLabel: isIndonesian
        ? 'Disipasi Kontak / Shunt:'
        : 'Contact / Shunt Loss:',
      thermalFormulaTitle: 'P = I² × R_eff',
      thermalEquationText: isOpen
        ? 'P = 0.0000 W (Open)'
        : `P = (${absCurrent.toFixed(3)} A)² × (${formatOhmsCompact(effR)}) = ${lossW.toFixed(5)} W`,
    };
  }

  // Standard Ohmic Load (resistor or resistive bulb socket)
  const rLoad =
    componentData.type === 'socket' ||
    componentData.type === 'pin-socket' ||
    componentData.type === 'socket-pin'
      ? getComponentEffectiveResistance(componentData)
      : Math.max(0.1, componentData.resistance ?? 100);
  const isOpen = rLoad >= 1e8;
  const computedDrop = isOpen ? absVoltage : absCurrent * rLoad;
  const jouleLoss = isOpen ? 0 : absCurrent * absCurrent * rLoad;

  return {
    category: 'ohmic-load',
    effectiveResistanceOhms: rLoad,
    isInfiniteResistance: isOpen,
    forwardThresholdVolts: 0,
    voltageLawLabel: isIndonesian
      ? 'Hukum Ohm (Beda Potensial):'
      : "Ohm's Law (Voltage Drop):",
    voltageFormulaTitle: 'V = I × R',
    voltageEquationText: isOpen
      ? isIndonesian
        ? 'Fiting Kosong / Putus (R = ∞, I = 0 A)'
        : 'Empty / Blown Socket (R = ∞, I = 0 A)'
      : `V = (${absCurrent.toFixed(3)} A) × (${formatOhmsCompact(rLoad)}) = ${computedDrop.toFixed(3)} V`,
    thermalLawLabel: isIndonesian
      ? 'Disipasi Kalor Resistif:'
      : 'Resistive Thermal Dissipation:',
    thermalFormulaTitle: 'P = I² × R',
    thermalEquationText: isOpen
      ? 'P = 0.000 W'
      : `P = (${absCurrent.toFixed(3)} A)² × (${formatOhmsCompact(rLoad)}) = ${jouleLoss.toFixed(3)} W`,
  };
}
