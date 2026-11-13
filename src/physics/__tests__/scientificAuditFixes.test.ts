import { describe, it, expect } from 'vitest';
import { Node } from 'reactflow';
import { CircuitElementData, SimulationResult, WireConnection } from '../../types/circuit';
import { solveCircuitMNA } from '../mnaSolver';
import { calculatePlnCostEstimate } from '../plnCostCalculator';
import { computeOscilloscopeSample } from '../oscilloscopeTelemetry';
import {
  getSolarDynamicInternalResistance,
  getSolarOpenCircuitVoltageLogarithmic,
  SOLAR_PANEL_INTERNAL_RESISTANCE,
} from '../solarPanel';
import { calculateHydroOperatingPoint } from '../hydroPhysics';
import { computeBulbPhotometrics, getBulbSpec } from '../../constants/bulbCatalog';

function makeFlowNode(
  id: string,
  data: Partial<CircuitElementData> & Pick<CircuitElementData, 'type' | 'label'>
): Node<CircuitElementData> {
  return {
    id,
    type: 'circuitNode',
    position: { x: 0, y: 0 },
    data: {
      id,
      ...data,
    },
  };
}

describe('Scientific Audit Fixes - Physics & Telemetry Verification', () => {
  describe('MNA Solver: Energy Conservation & Charging Battery Double-Count Fix', () => {
    it('counts only delivered EMF power in totalPowerDrawn when 12V solar panel charges a 9V battery', () => {
      const solar: CircuitElementData = {
        id: 'solar_1',
        type: 'solar-panel',
        label: 'Solar 12V',
        sunlight: 100,
        voltage: 12.0,
        internalResistance: 0.2,
      };
      const battery9v: CircuitElementData = {
        id: 'bat9v_1',
        type: 'battery9v',
        label: '9V Rechargeable',
        voltage: 9.0,
        currentCharge: 80,
        internalResistance: 2.0,
      };
      const seriesLimitResistor: CircuitElementData = {
        id: 'res_limit',
        type: 'resistor',
        label: '1 Ohm Series',
        resistance: 1.0,
      };

      const wires: WireConnection[] = [
        { id: 'w1', source: 'solar_1', sourceHandle: 'pos', target: 'res_limit', targetHandle: 'p1' },
        { id: 'w2', source: 'res_limit', sourceHandle: 'p2', target: 'bat9v_1', targetHandle: 'pos' },
        { id: 'w3', source: 'bat9v_1', sourceHandle: 'neg', target: 'solar_1', targetHandle: 'neg' },
      ];

      const result = solveCircuitMNA({
        components: [solar, battery9v, seriesLimitResistor],
        wires,
      });

      const solarCurrent = result.branchCurrents['solar_1'];
      const batteryCurrent = result.branchCurrents['bat9v_1'];

      // Solar supplies (j < 0), 9V battery absorbs/charges (j > 0)
      expect(solarCurrent).toBeLessThan(0);
      expect(batteryCurrent).toBeGreaterThan(0);
      expect(Math.abs(solarCurrent)).toBeCloseTo(batteryCurrent, 4);

      // Generated EMF power comes strictly from the supplying source (12V * I),
      // NOT double-counted as (12V + V_bat) * I
      const expectedSuppliedPower = 12.0 * Math.abs(solarCurrent);
      expect(result.totalPowerDrawn).toBeCloseTo(expectedSuppliedPower, 4);
      expect(result.totalPowerDrawn).toBeLessThan(12.0);
    });
  });

  describe('MNA Solver: Discrete Semiconductor LED Forward Voltage Threshold (Vf)', () => {
    it('blocks forward current below Vf=2.0V without mislabeling as Reverse Bias, and conducts (V - Vf)/R above threshold', () => {
      const ledGreenSpec = getBulbSpec('led_green');
      expect(ledGreenSpec.forwardVoltage).toBeCloseTo(2.0, 4);

      // 1. Sub-threshold forward bias: 1.5V AA cell across 2.0V green LED
      const aaBattery: CircuitElementData = {
        id: 'bat_15',
        type: 'battery',
        label: 'AA 1.5V',
        voltage: 1.5,
      };
      const pinSocketSub: CircuitElementData = {
        id: 'sock_sub',
        type: 'pin-socket',
        label: 'Pin Socket',
        installedBulb: { id: 'led_sub', bulbType: 'led_green' },
      };

      const subThresholdResult = solveCircuitMNA({
        components: [aaBattery, pinSocketSub],
        wires: [
          { id: 's1', source: 'bat_15', sourceHandle: 'pos', target: 'sock_sub', targetHandle: 'p1' },
          { id: 's2', source: 'sock_sub', sourceHandle: 'p2', target: 'bat_15', targetHandle: 'neg' },
        ],
      });

      expect(Math.abs(subThresholdResult.branchCurrents['sock_sub'] ?? 0)).toBe(0);
      expect(subThresholdResult.reverseBiasedBranches ?? []).not.toContain('sock_sub');

      // 2. Above threshold: 3.0V dual-AA holder across Vf=2.0V, R=5000Ω LED
      const holder3v: CircuitElementData = {
        id: 'holder_3v',
        type: 'battery-holder',
        label: 'Holder 3V',
        hasBattery: true,
        batteryCount: 2,
        voltage: 3.0,
      };
      const pinSocketFwd: CircuitElementData = {
        id: 'sock_fwd',
        type: 'pin-socket',
        label: 'Pin Socket',
        installedBulb: { id: 'led_fwd', bulbType: 'led_green' },
      };

      const forwardResult = solveCircuitMNA({
        components: [holder3v, pinSocketFwd],
        wires: [
          { id: 'f1', source: 'holder_3v', sourceHandle: 'pos', target: 'sock_fwd', targetHandle: 'p1' },
          { id: 'f2', source: 'sock_fwd', sourceHandle: 'p2', target: 'holder_3v', targetHandle: 'neg' },
        ],
      });

      const expectedCurrent = (3.0 - 2.0) / (5000 + 0.1);
      expect(forwardResult.branchCurrents['sock_fwd']).toBeCloseTo(expectedCurrent, 6);
      expect(forwardResult.reverseBiasedBranches ?? []).not.toContain('sock_fwd');

      const photo = computeBulbPhotometrics(expectedCurrent, 5000, ledGreenSpec);
      expect(photo.voltageDrop).toBeCloseTo(2.0 + expectedCurrent * 5000, 4);
      expect(photo.powerWatts).toBeCloseTo(photo.voltageDrop * expectedCurrent, 5);

      // 3. True reverse bias: anode (p1) connected to negative terminal
      const reverseResult = solveCircuitMNA({
        components: [holder3v, pinSocketFwd],
        wires: [
          { id: 'r1', source: 'holder_3v', sourceHandle: 'neg', target: 'sock_fwd', targetHandle: 'p1' },
          { id: 'r2', source: 'sock_fwd', sourceHandle: 'p2', target: 'holder_3v', targetHandle: 'pos' },
        ],
      });

      expect(Math.abs(reverseResult.branchCurrents['sock_fwd'] ?? 0)).toBe(0);
      expect(reverseResult.reverseBiasedBranches ?? []).toContain('sock_fwd');
    });
  });

  describe('MNA Solver: Virtual SUTET Transmission Grid Shared Line Impedance', () => {
    it('routes parallel outdoor Wind + Solar power through single shared line resistance and reduces loss under 240V step-up', () => {
      const makeGridComponents = (stepUpVoltage: number): CircuitElementData[] => [
        {
          id: 'solar_out',
          type: 'solar-panel',
          label: 'PLTS 12V',
          worldMode: 'outside',
          sunlight: 100,
          voltage: 12.0,
          internalResistance: 0.2,
        },
        {
          id: 'wind_out',
          type: 'wind-turbine',
          label: 'PLTB 12V',
          worldMode: 'outside',
          speed: 100,
          voltage: 12.0,
          internalResistance: 0.2,
        },
        {
          id: 'tower_out',
          type: 'transmission-tower',
          label: 'SUTET',
          worldMode: 'outside',
          hasTransformer: true,
          stepUpVoltage,
          transmissionVoltageMode: stepUpVoltage >= 240 ? 'step_up' : 'direct',
          lineResistance: 4.0,
          isMcbOn: true,
        },
        {
          id: 'panel_lab',
          type: 'distribution-panel',
          label: 'Panel Lab',
          worldMode: 'lab',
          isMcbOn: true,
        },
        {
          id: 'load_lab',
          type: 'resistor',
          label: 'Beban 10 Ohm',
          worldMode: 'lab',
          resistance: 10.0,
        },
      ];

      const wires: WireConnection[] = [
        { id: 'w1', source: 'solar_out', sourceHandle: 'pos', target: 'tower_out', targetHandle: 'pos' },
        { id: 'w2', source: 'solar_out', sourceHandle: 'neg', target: 'tower_out', targetHandle: 'neg' },
        { id: 'w3', source: 'wind_out', sourceHandle: 'pos', target: 'tower_out', targetHandle: 'pos' },
        { id: 'w4', source: 'wind_out', sourceHandle: 'neg', target: 'tower_out', targetHandle: 'neg' },
        { id: 'w5', source: 'panel_lab', sourceHandle: 'pos', target: 'load_lab', targetHandle: 'p1' },
        { id: 'w6', source: 'load_lab', sourceHandle: 'p2', target: 'panel_lab', targetHandle: 'neg' },
      ];

      // Direct 12V mode: R_line = 4.0Ω in series with 10Ω load + ~0.1Ω parallel source R_int
      const directRes = solveCircuitMNA({ components: makeGridComponents(12), wires });
      const directLoadI = Math.abs(directRes.branchCurrents['load_lab']);
      expect(directLoadI).toBeCloseTo(12.0 / 14.1, 2);
      expect(Math.abs(directRes.branchCurrents['tower_out'])).toBeCloseTo(directLoadI, 2);
      expect(Math.abs(directRes.branchCurrents['panel_lab'])).toBeCloseTo(directLoadI, 2);

      // Step-Up 240V mode: R_referred = 4.0 / (240/12)^2 = 0.01Ω
      const stepUpRes = solveCircuitMNA({ components: makeGridComponents(240), wires });
      const stepUpLoadI = Math.abs(stepUpRes.branchCurrents['load_lab']);
      expect(stepUpLoadI).toBeCloseTo(12.0 / 10.11, 2);
      expect(stepUpLoadI).toBeGreaterThan(directLoadI);
    });
  });

  describe('PLN Cost Calculator: Charging Exclusion, 9V Default & Hydro Green Share', () => {
    it('excludes charging 9V battery from fossil energy, defaults 9V EMF accurately, and credits hydro as renewable', () => {
      const solarNode = makeFlowNode('solar_1', {
        type: 'solar-panel',
        label: 'PLTS',
        sunlight: 100,
        voltage: 12.0,
      });
      const charging9vNode = makeFlowNode('bat9_1', {
        type: 'battery9v',
        label: 'Baterai 9V',
        // Intentionally omit voltage to verify 9.0V default (previously wrongly fell back to 1.5V)
      });
      const bulbLoadNode = makeFlowNode('sock_1', {
        type: 'socket',
        label: 'Fiting Pijar',
        installedBulb: { id: 'b_inc', bulbType: 'incandescent', resistance: 800 },
      });

      const chargingEstimate = calculatePlnCostEstimate(
        [solarNode, charging9vNode, bulbLoadNode],
        {
          branchCurrents: {
            solar_1: -0.5, // Supplying
            bat9_1: 0.485, // Charging (+ current) while solar is active Supplier
            sock_1: 0.015,
          },
          totalPowerDrawn: 6.0,
        }
      );

      expect(chargingEstimate.nonRenewablePowerWatts).toBe(0);
      expect(chargingEstimate.greenEnergySharePercent).toBe(100);

      // Supplying battery9v without defined data.voltage must use 9.0V (not 1.5V)
      const discharging9vEstimate = calculatePlnCostEstimate(
        [charging9vNode, bulbLoadNode],
        {
          branchCurrents: {
            bat9_1: -1.0,
            sock_1: 1.0,
          },
          totalPowerDrawn: 9.0,
        }
      );
      expect(discharging9vEstimate.nonRenewablePowerWatts).toBeCloseTo(9.0, 2);
      expect(discharging9vEstimate.greenEnergySharePercent).toBe(0);

      // Hydro turbine must contribute to renewablePowerWatts (100% green energy)
      const hydroNode = makeFlowNode('hydro_1', {
        type: 'hydro-turbine',
        label: 'PLTMH',
        voltage: 12.0,
      });
      const hydroEstimate = calculatePlnCostEstimate(
        [hydroNode, bulbLoadNode],
        {
          branchCurrents: {
            hydro_1: -2.0,
            sock_1: 2.0,
          },
          totalPowerDrawn: 24.0,
        }
      );
      expect(hydroEstimate.renewablePowerWatts).toBeCloseTo(24.0, 2);
      expect(hydroEstimate.nonRenewablePowerWatts).toBe(0);
      expect(hydroEstimate.greenEnergySharePercent).toBe(100);
    });
  });

  describe('Oscilloscope Telemetry: Multi-Voltage Global & Polarity Sign Fix', () => {
    it('prevents 240V SUTET potentials from distorting Global circuit current and classifies battery charging vs supplying', () => {
      const solarNode = makeFlowNode('solar_1', {
        type: 'solar-panel',
        label: 'PLTS',
        voltage: 12.0,
      });
      const batteryNode = makeFlowNode('bat_ch', {
        type: 'battery9v',
        label: 'Bat 9V',
        voltage: 9.0,
      });
      const ledSocketNode = makeFlowNode('sock_led', {
        type: 'pin-socket',
        label: 'LED Socket',
        isReverseBiased: true,
        installedBulb: { id: 'led_1', bulbType: 'led_green' },
      });

      const sim: Pick<
        SimulationResult,
        'nodeVoltages' | 'branchCurrents' | 'totalPowerDrawn' | 'reverseBiasedBranches'
      > = {
        nodeVoltages: {
          sutet_hv_net: 240,
          lab_bus: 12,
          gnd: 0,
        },
        branchCurrents: {
          solar_1: -1.0,
          bat_ch: 0.5,
          sock_led: 0,
        },
        totalPowerDrawn: 12.0,
        reverseBiasedBranches: ['sock_led'],
      };

      const nodes = [solarNode, batteryNode, ledSocketNode];

      // Global mode uses supplying source currents (1.0A) -> 12V effective, NOT 12/240 = 0.05A
      const globalSample = computeOscilloscopeSample(null, nodes, sim);
      expect(globalSample.current).toBeCloseTo(1.0, 4);
      expect(globalSample.voltage).toBeCloseTo(12.0, 4);
      expect(globalSample.polarity).toBe('supplying');

      // Probed charging battery reports 'charging'
      const batSample = computeOscilloscopeSample('bat_ch', nodes, sim);
      expect(batSample.polarity).toBe('charging');
      expect(batSample.signedCurrent).toBeCloseTo(0.5, 4);

      // Probed reverse-biased LED reports 'reverse'
      const ledSample = computeOscilloscopeSample('sock_led', nodes, sim);
      expect(ledSample.polarity).toBe('reverse');
    });
  });

  describe('Solar Panel & Micro-Hydro Physics Calibrations', () => {
    it('computes silicon logarithmic Voc(G) and dynamic series resistance under cloud shading', () => {
      expect(getSolarOpenCircuitVoltageLogarithmic(100)).toBe(12);
      // At 20% diffuse irradiance, silicon diode Voc stays around ~10.31V instead of dropping linearly to 2.4V
      expect(getSolarOpenCircuitVoltageLogarithmic(20)).toBeCloseTo(10.31, 2);
      expect(getSolarOpenCircuitVoltageLogarithmic(0)).toBe(0);
      expect(getSolarOpenCircuitVoltageLogarithmic(Number.NaN)).toBe(12);

      expect(getSolarDynamicInternalResistance(100, SOLAR_PANEL_INTERNAL_RESISTANCE)).toBe(0.2);
      expect(getSolarDynamicInternalResistance(20, SOLAR_PANEL_INTERNAL_RESISTANCE)).toBe(1.0);
      expect(getSolarDynamicInternalResistance(0, SOLAR_PANEL_INTERNAL_RESISTANCE)).toBe(4.0);
    });

    it('computes physically dimensional Pelton runner RPM (~344 RPM at 2.0m head) and handles zero flow safely', () => {
      const activeHydro = calculateHydroOperatingPoint(100, 2.0);
      // jetV = sqrt(2*9.81*2) = 6.264 m/s, u_runner = 0.46 * jetV = 2.8815 m/s
      // RPM = (60 * 2.8815) / (pi * 0.16) ≈ 344 RPM
      expect(activeHydro.rpm).toBe(344);
      expect(activeHydro.isGenerating).toBe(true);
      expect(activeHydro.rotationDurationSeconds).toBeCloseTo(60 / 344, 2);

      const dryHydro = calculateHydroOperatingPoint(0, 2.0);
      expect(dryHydro.rpm).toBe(0);
      expect(dryHydro.rotationDurationSeconds).toBeNull();
      expect(dryHydro.isGenerating).toBe(false);
    });
  });
});
