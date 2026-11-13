import { Edge, Node } from 'reactflow';
import {
  BULB_CATALOG,
  BulbType,
  computeBulbPhotometrics,
  getBulbSpec,
} from '../constants/bulbCatalog';
import { CircuitElementData, SimulationResult, WireConnection } from '../types/circuit';
import {
  getComponentEffectiveResistance,
  getComponentPinIdentifiers,
  getSocketForwardThreshold,
  isTransmissionNodeActive,
  resolveCircuitPinNets,
  SHORT_CIRCUIT_CURRENT_THRESHOLD,
} from './mnaSolver';
import { SignalPolarityState, computeOscilloscopeSample } from './oscilloscopeTelemetry';
import {
  THERMAL_STRESS_CURRENT_THRESHOLD,
  computeTransmissionTelemetry,
} from './transmissionPhysics';

/** Available visualization modes on the Physics Lens dock. */
export type PhysicsLensMode = 'normal' | 'thermal' | 'probe';

/** Target selected or hovered by the interactive touch/pointer probe. */
export interface ProbeTarget {
  kind: 'node' | 'wire';
  id: string;
}

/** Discrete FLIR thermal heat classification bands (paired with text/temp labels). */
export type ThermalHeatBand = 'ambient' | 'warm' | 'hot' | 'critical';

/** Calibrated infrared thermal telemetry for an electrical conductor edge. */
export interface WireThermalMetrics {
  currentAmps: number;
  jouleHeatWatts: number;
  thermalRatio: number;
  estimatedTempCelsius: number;
  heatBand: ThermalHeatBand;
  strokeHex: string;
  haloHex: string;
}

/** Calibrated thermal dissipation profile for a single canvas node. */
export interface NodeThermalMetrics {
  nodeId: string;
  powerWatts: number;
  thermalRatio: number;
  temperatureCelsius: number;
  heatBand: ThermalHeatBand;
  isShorted: boolean;
  isBlown: boolean;
}

/** Instantaneous electrical reading extracted when probing any node or wire. */
export interface ProbePointReading {
  target: ProbeTarget;
  label: string;
  kind: 'wire' | 'node';
  potentialVolts: number;
  secondaryPotentialVolts?: number;
  deltaVoltageVolts: number;
  currentAmps: number;
  signedCurrentAmps: number;
  powerWatts: number;
  resistanceOhms: number | null;
  polarity: SignalPolarityState;
  isShorted: boolean;
  isOpenCircuit: boolean;
  statusNoteId: string;
  statusNoteEn: string;
}

/** Potential difference comparison between pinned Probe A (+) and Reference Probe B (-). */
export interface DualProbeComparison {
  pointA: ProbePointReading;
  pointB: ProbePointReading;
  voltageDiffVolts: number;
  direction: 'A_to_B' | 'B_to_A' | 'equipotential';
  explanationId: string;
  explanationEn: string;
}

const AMBIENT_TEMP_CELSIUS = 26;
const STANDARD_LAB_WIRE_RESISTANCE_OHMS = 0.08;
const BULB_TYPES_SET = new Set<string>(BULB_CATALOG.map((item) => item.type));

const SOURCE_TYPES_SET = new Set<string>([
  'battery',
  'battery9v',
  'battery-holder',
  'solar-panel',
  'solar_panel',
  'wind-turbine',
  'wind_turbine',
  'hydro-turbine',
  'hydro_turbine',
  'bess-substation',
  'bess_substation',
]);

/**
 * Classifies a normalized 0..1 thermal intensity into a discrete physical heat band.
 * Time Complexity: O(1).
 */
export function classifyThermalHeatBand(
  thermalRatio: number,
  isShorted = false
): ThermalHeatBand {
  if (isShorted || thermalRatio >= 0.78) return 'critical';
  if (thermalRatio >= 0.42) return 'hot';
  if (thermalRatio >= 0.08) return 'warm';
  return 'ambient';
}

/**
 * Resolves calibrated dark/light contrast-safe FLIR colors for a thermal band.
 * Time Complexity: O(1).
 *
 * @param band - Thermal heat classification band
 * @param theme - Active UI theme ('dark' | 'light')
 * @returns Foreground stroke hex and subtle backdrop halo hex
 */
export function getThermalPaletteColors(
  band: ThermalHeatBand,
  theme: 'dark' | 'light' = 'dark'
): { strokeHex: string; haloHex: string } {
  switch (band) {
    case 'critical':
      return { strokeHex: '#EF4444', haloHex: '#DC2626' };
    case 'hot':
      return {
        strokeHex: theme === 'light' ? '#D97706' : '#F59E0B',
        haloHex: '#F59E0B',
      };
    case 'warm':
      return {
        strokeHex: theme === 'light' ? '#0D9488' : '#2DD4BF',
        haloHex: '#14B8A6',
      };
    default:
      return {
        strokeHex: theme === 'light' ? '#475569' : '#334155',
        haloHex: '#1E293B',
      };
  }
}

/**
 * Computes conductor FLIR temperature and color profile using Joule heating (P = I^2 * R).
 * Used uniformly by both standard lab wires and SUTET transmission spans.
 * Time Complexity: O(1).
 *
 * @param wireCurrentAmps - Magnitude of branch current through the wire (A)
 * @param isShortCircuit - Whether wire participates in a short-circuit fault
 * @param isStepUpHv - True if wire belongs to a 240V HV stepped-up transmission span
 * @param lineResistanceOhms - Line resistance in Ohms for transmission spans
 * @param theme - Active visual theme ('dark' | 'light')
 * @returns Calibrated WireThermalMetrics
 */
export function computeWireThermalMetrics(
  wireCurrentAmps: number,
  isShortCircuit: boolean,
  isStepUpHv = false,
  lineResistanceOhms = STANDARD_LAB_WIRE_RESISTANCE_OHMS,
  theme: 'dark' | 'light' = 'dark'
): WireThermalMetrics {
  const safeCurrent = Number.isFinite(wireCurrentAmps) ? Math.abs(wireCurrentAmps) : 0;
  const effectiveLineCurrent = isStepUpHv ? safeCurrent / 20 : safeCurrent;
  const safeR =
    Number.isFinite(lineResistanceOhms) && lineResistanceOhms > 0
      ? lineResistanceOhms
      : STANDARD_LAB_WIRE_RESISTANCE_OHMS;
  const jouleHeatWatts = effectiveLineCurrent * effectiveLineCurrent * safeR;

  let thermalRatio = 0;
  if (isShortCircuit) {
    thermalRatio = 1;
  } else if (safeCurrent > 1e-4) {
    const currentStress = effectiveLineCurrent / (THERMAL_STRESS_CURRENT_THRESHOLD * 2.2);
    const heatStress = Math.sqrt(jouleHeatWatts / 1.8);
    thermalRatio = Math.min(0.95, Math.max(0.08, Math.max(currentStress, heatStress)));
  }

  const heatBand = classifyThermalHeatBand(thermalRatio, isShortCircuit);
  const { strokeHex, haloHex } = getThermalPaletteColors(heatBand, theme);
  const estimatedTempCelsius = Math.round(AMBIENT_TEMP_CELSIUS + thermalRatio * 96);

  return {
    currentAmps: safeCurrent,
    jouleHeatWatts: Number(jouleHeatWatts.toFixed(3)),
    thermalRatio: Number(thermalRatio.toFixed(3)),
    estimatedTempCelsius,
    heatBand,
    strokeHex,
    haloHex,
  };
}

/**
 * Resolves the effective BulbSpec attached to a socket or pin-socket, if present.
 * Time Complexity: O(1).
 */
function resolveSocketBulbSpec(data: CircuitElementData) {
  const rawBulb = data.installedBulb;
  const bulbType =
    rawBulb && typeof rawBulb === 'object'
      ? rawBulb.bulbType
      : typeof rawBulb === 'string' && BULB_TYPES_SET.has(rawBulb)
      ? (rawBulb as BulbType)
      : undefined;
  return bulbType ? getBulbSpec(bulbType) : undefined;
}

/**
 * Computes physical heat dissipation and equilibrium temperature for any single component.
 * Distinguishes hot incandescent filaments from efficient cool LEDs and highlights
 * SUTET conductor cooling when step-up 240V transformation is engaged.
 * Time Complexity: O(1).
 *
 * @param component - Target circuit component data
 * @param simulation - Latest MNA SimulationResult
 * @param theme - Active UI theme
 * @returns NodeThermalMetrics for FLIR visualization
 */
export function computeNodeThermalMetrics(
  component: CircuitElementData,
  simulation: Pick<SimulationResult, 'branchCurrents' | 'shortCircuitBranches'>,
  theme: 'dark' | 'light' = 'dark'
): NodeThermalMetrics {
  const rawCurrent = Math.abs(
    simulation?.branchCurrents?.[component.id] ?? component.calculatedCurrent ?? 0
  );
  const safeCurrent = Number.isFinite(rawCurrent) ? rawCurrent : 0;
  const isShorted =
    Boolean(component.isShortCircuit) ||
    Boolean(simulation?.shortCircuitBranches?.includes(component.id)) ||
    safeCurrent >= SHORT_CIRCUIT_CURRENT_THRESHOLD;
  const isBlown = Boolean(component.isBlown);

  let powerWatts = 0;
  let thermalRatio = 0;

  if (
    component.type === 'socket' ||
    component.type === 'pin-socket' ||
    component.type === 'socket-pin'
  ) {
    const spec = resolveSocketBulbSpec(component);
    if (spec && !isBlown) {
      const customResistance =
        component.installedBulb && typeof component.installedBulb === 'object'
          ? component.installedBulb.resistance
          : undefined;
      const resistance = Math.max(0.1, customResistance ?? spec.resistance);
      const photo = computeBulbPhotometrics(safeCurrent, resistance, spec);
      powerWatts = photo.powerWatts;
      const isCoolLed =
        spec.type === 'led_standard' || spec.type === 'led_rgb' || spec.type === 'led_green';
      if (photo.heatLevel === 'overheat' || isShorted) {
        thermalRatio = 0.96;
      } else if (photo.heatLevel === 'hot') {
        thermalRatio = isCoolLed ? 0.34 : 0.72;
      } else if (photo.heatLevel === 'warm') {
        thermalRatio = isCoolLed ? 0.16 : 0.42;
      } else if (safeCurrent > 1e-4) {
        thermalRatio = isCoolLed ? 0.08 : 0.18;
      }
    }
  } else if (component.type === 'resistor') {
    const r = Math.max(0.1, component.resistance ?? 100);
    powerWatts = safeCurrent * safeCurrent * r;
    if (safeCurrent > 1e-4) {
      thermalRatio = Math.min(0.98, Math.max(0.1, Math.sqrt(powerWatts / 3.5)));
    }
  } else if (
    component.type === 'transmission-tower' ||
    component.type === 'transmission_tower' ||
    component.type === 'distribution-panel' ||
    component.type === 'distribution_panel'
  ) {
    const stepUpV =
      component.stepUpVoltage ??
      (component.transmissionVoltageMode === 'step_up' ? 240 : 12);
    const telemetry = computeTransmissionTelemetry({
      loadCurrent: safeCurrent,
      voltageMode: stepUpV,
      lineResistance: component.lineResistance ?? 4.0,
      generatorVoltage: 12.0,
    });
    powerWatts = telemetry.jouleLossWatts;
    if (safeCurrent > 1e-4) {
      thermalRatio = telemetry.isOverheated
        ? Math.min(0.95, 0.58 + telemetry.jouleLossWatts / 12)
        : Math.max(0.06, Math.min(0.35, telemetry.jouleLossWatts / 4));
    }
  } else if (SOURCE_TYPES_SET.has(component.type)) {
    const defaultRInt = component.type === 'battery9v' ? 2.0 : 0.12;
    const rInt = Math.max(0.05, component.internalResistance ?? defaultRInt);
    powerWatts = safeCurrent * safeCurrent * rInt;
    if (isShorted) {
      thermalRatio = 1;
    } else if (safeCurrent > 1e-4) {
      thermalRatio = Math.min(0.88, Math.max(0.08, Math.sqrt(powerWatts / 2.2)));
    }
  } else if (component.type !== 'ground' && component.type !== 'voltmeter' && component.type !== 'bulb') {
    const r = getComponentEffectiveResistance(component);
    if (r < 1e6) {
      powerWatts = safeCurrent * safeCurrent * r;
      if (isShorted) {
        thermalRatio = 1;
      } else if (safeCurrent > 1e-4) {
        thermalRatio = Math.min(0.6, Math.max(0.05, Math.sqrt(powerWatts / 2.0)));
      }
    }
  }

  void theme;
  const heatBand = classifyThermalHeatBand(thermalRatio, isShorted);
  const temperatureCelsius = Math.round(AMBIENT_TEMP_CELSIUS + thermalRatio * 98);

  return {
    nodeId: component.id,
    powerWatts: Number(powerWatts.toFixed(3)),
    thermalRatio: Number(thermalRatio.toFixed(3)),
    temperatureCelsius,
    heatBand,
    isShorted,
    isBlown,
  };
}

/**
 * Computes FLIR thermal metrics for all nodes in a single O(N) pass.
 * Time Complexity: O(N).
 */
export function computeAllNodeThermals(
  nodes: ReadonlyArray<Node<CircuitElementData>>,
  simulation: Pick<SimulationResult, 'branchCurrents' | 'shortCircuitBranches'>,
  theme: 'dark' | 'light' = 'dark'
): Map<string, NodeThermalMetrics> {
  const map = new Map<string, NodeThermalMetrics>();
  if (!Array.isArray(nodes)) return map;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node?.data) continue;
    map.set(node.id, computeNodeThermalMetrics(node.data, simulation, theme));
  }
  return map;
}

/**
 * Finds the hottest thermally active component on the canvas for quick hotspot navigation.
 * Time Complexity: O(N).
 */
export function findHottestThermalNode(
  nodes: ReadonlyArray<Node<CircuitElementData>>,
  thermals: Map<string, NodeThermalMetrics>
): NodeThermalMetrics | null {
  let hottest: NodeThermalMetrics | null = null;
  for (let i = 0; i < nodes.length; i++) {
    const metrics = thermals.get(nodes[i].id);
    if (!metrics || metrics.thermalRatio < 0.05) continue;
    if (!hottest || metrics.temperatureCelsius > hottest.temperatureCelsius) {
      hottest = metrics;
    }
  }
  return hottest;
}

/**
 * Builds an O(1)-lookup map from `"componentId:handleId"` pin key to solved nodal voltage (V)
 * by reusing MNA's canonical Union-Find pin-net resolution.
 * Time Complexity: O(P * α(P) + W).
 */
export function buildPinPotentialLookup(
  nodes: ReadonlyArray<Node<CircuitElementData>>,
  edges: ReadonlyArray<Edge>,
  nodeVoltages: Record<string, number>
): Map<string, number> {
  const pinPotentials = new Map<string, number>();
  if (!Array.isArray(nodes) || nodes.length === 0) return pinPotentials;

  try {
    const components = nodes.map((n) => n.data);
    const wires: WireConnection[] = (edges ?? []).map((e) => ({
      id: e.id,
      source: e.source,
      sourceHandle: e.sourceHandle ?? 'p1',
      target: e.target,
      targetHandle: e.targetHandle ?? 'p2',
    }));

    const { pinToNetMap } = resolveCircuitPinNets(components, wires);

    for (const component of components) {
      const pins = getComponentPinIdentifiers(component);
      for (const pinKey of pins) {
        const netRoot = pinToNetMap.get(pinKey);
        if (netRoot !== undefined && Number.isFinite(nodeVoltages?.[netRoot])) {
          pinPotentials.set(pinKey, Number(nodeVoltages[netRoot].toFixed(3)));
        }
      }
    }
  } catch (error) {
    console.warn('Failed to build pin potential lookup:', error);
  }

  return pinPotentials;
}

/**
 * Resolves exact electric potential (Volts) on any specific terminal handle, with fallback to 0V.
 * Time Complexity: O(1).
 */
export function resolvePinPotentialVolts(
  pinPotentials: Map<string, number>,
  componentId: string,
  handleId?: string | null
): number {
  const directKey = `${componentId}:${handleId ?? 'p1'}`;
  const directVal = pinPotentials.get(directKey);
  if (directVal !== undefined && Number.isFinite(directVal)) {
    return directVal;
  }
  const fallbackKeys = [`${componentId}:pos`, `${componentId}:p1`, `${componentId}:neg`, `${componentId}:p2`, `${componentId}:gnd`];
  for (let i = 0; i < fallbackKeys.length; i++) {
    const v = pinPotentials.get(fallbackKeys[i]);
    if (v !== undefined && Number.isFinite(v)) {
      return v;
    }
  }
  return 0;
}

/**
 * Computes complete electrical telemetry and clear physical diagnostics for a probed wire or component.
 * Time Complexity: O(N + E) worst-case when resolving edge endpoints, O(1) for pin map lookup.
 *
 * @param target - Probed wire or component target
 * @param nodes - Current canvas nodes
 * @param edges - Current canvas wires
 * @param simulation - Solved MNA simulation state
 * @param pinPotentials - Precomputed pin potential lookup map
 * @returns ProbePointReading or null if target no longer exists
 */
export function computeProbeReading(
  target: ProbeTarget | null,
  nodes: ReadonlyArray<Node<CircuitElementData>>,
  edges: ReadonlyArray<Edge>,
  simulation: SimulationResult,
  pinPotentials: Map<string, number>
): ProbePointReading | null {
  if (!target) return null;

  if (target.kind === 'wire') {
    const edge = edges.find((e) => e.id === target.id);
    if (!edge) return null;

    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    const sourceV = resolvePinPotentialVolts(pinPotentials, edge.source, edge.sourceHandle);
    const potentialVolts = Number.isFinite(sourceV)
      ? sourceV
      : resolvePinPotentialVolts(pinPotentials, edge.target, edge.targetHandle);

    const srcI = Math.abs(simulation.branchCurrents[edge.source] ?? 0);
    const dstI = Math.abs(simulation.branchCurrents[edge.target] ?? 0);
    const wireCurrent = edge.source.startsWith('wp_')
      ? edge.target.startsWith('wp_')
        ? Math.max(srcI, dstI)
        : dstI
      : edge.target.startsWith('wp_')
      ? srcI
      : Math.min(srcI, dstI);

    const isShorted =
      simulation.isShortCircuit &&
      (simulation.shortCircuitBranches.includes(edge.source) ||
        simulation.shortCircuitBranches.includes(edge.target));

    const label = `${sourceNode?.data.label ?? edge.source} -> ${targetNode?.data.label ?? edge.target}`;
    const powerWatts = Number((Math.abs(potentialVolts) * wireCurrent).toFixed(3));
    const isZero = wireCurrent < 1e-4;

    return {
      target,
      label,
      kind: 'wire',
      potentialVolts: Number(potentialVolts.toFixed(2)),
      deltaVoltageVolts: 0,
      currentAmps: Number(wireCurrent.toFixed(4)),
      signedCurrentAmps: Number(wireCurrent.toFixed(4)),
      powerWatts,
      resistanceOhms: STANDARD_LAB_WIRE_RESISTANCE_OHMS,
      polarity: isZero ? 'idle' : 'forward',
      isShorted,
      isOpenCircuit: isZero,
      statusNoteId: isShorted
        ? 'Korsleting pada jalur kawat ini: arus melonjak tanpa hambatan!'
        : isZero
        ? `Titik potensial ${potentialVolts.toFixed(2)}V dalam kondisi siaga (arus 0 A).`
        : `Konduktor berada pada potensial ${potentialVolts.toFixed(2)}V dan mengalirkan ${(wireCurrent * 1000 < 1000 ? `${(wireCurrent * 1000).toFixed(1)} mA` : `${wireCurrent.toFixed(2)} A`)}.`,
      statusNoteEn: isShorted
        ? 'Short-circuit fault on this conductor branch!'
        : isZero
        ? `Wire node sits at ${potentialVolts.toFixed(2)}V with 0 A flowing.`
        : `Conductor potential at ${potentialVolts.toFixed(2)}V carrying ${(wireCurrent * 1000 < 1000 ? `${(wireCurrent * 1000).toFixed(1)} mA` : `${wireCurrent.toFixed(2)} A`)}.`,
    };
  }

  const node = nodes.find((n) => n.id === target.id);
  if (!node) return null;

  const pins = getComponentPinIdentifiers(node.data);
  const firstPinHandle = pins[0]?.split(':')[1] ?? 'p1';
  const secondPinHandle = pins[1]?.split(':')[1] ?? 'p2';
  const vPos = resolvePinPotentialVolts(pinPotentials, node.id, firstPinHandle);
  const vNeg = pins.length >= 2 ? resolvePinPotentialVolts(pinPotentials, node.id, secondPinHandle) : 0;
  const deltaV = Number((vPos - vNeg).toFixed(2));

  const scopeSample = computeOscilloscopeSample(node.id, nodes, simulation);
  const isShorted =
    Boolean(node.data.isShortCircuit) ||
    simulation.shortCircuitBranches.includes(node.id) ||
    scopeSample.current >= SHORT_CIRCUIT_CURRENT_THRESHOLD;

  const isSwitchOpen = node.data.type === 'switch' && Boolean(node.data.isOpen);
  const isMcbOff =
    (node.data.type === 'distribution-panel' ||
      node.data.type === 'distribution_panel' ||
      node.data.type === 'transmission-tower' ||
      node.data.type === 'transmission_tower') &&
    !isTransmissionNodeActive(node.data);
  const isReverseLed = Boolean(
    node.data.isReverseBiased || simulation.reverseBiasedBranches?.includes(node.id)
  );
  const forwardThreshold = getSocketForwardThreshold(node.data);
  const isSubThresholdLed =
    forwardThreshold > 0 && !isReverseLed && scopeSample.current < 1e-6 && deltaV > 0 && deltaV <= forwardThreshold;

  const effectiveR = getComponentEffectiveResistance(node.data);
  const resistanceOhms =
    effectiveR >= 1e8 || SOURCE_TYPES_SET.has(node.data.type) ? null : Number(effectiveR.toFixed(2));

  let statusNoteId = `Tegangan jatuh ${Math.abs(deltaV).toFixed(2)}V (${vPos.toFixed(2)}V -> ${vNeg.toFixed(2)}V).`;
  let statusNoteEn = `Potential drop ${Math.abs(deltaV).toFixed(2)}V (${vPos.toFixed(2)}V -> ${vNeg.toFixed(2)}V).`;

  if (isShorted) {
    statusNoteId = 'Bahaya korsleting: arus berlebih melewati jalur berhambatan hampir nol!';
    statusNoteEn = 'Short-circuit fault: extreme current across near-zero load resistance!';
  } else if (isMcbOff) {
    statusNoteId = node.data.isMcbTripped
      ? 'MCB Panel Distribusi TRIP otomatis memutus arus korslet.'
      : 'Sakelar MCB dalam posisi OFF (rangkaian terputus).';
    statusNoteEn = node.data.isMcbTripped
      ? 'MCB Breaker TRIPPED to protect the circuit.'
      : 'MCB Breaker is OFF (open circuit).';
  } else if (isSwitchOpen) {
    statusNoteId = `Sakelar terbuka: beda potensial ${Math.abs(deltaV).toFixed(2)}V menumpuk di celah kontak.`;
    statusNoteEn = `Open switch: ${Math.abs(deltaV).toFixed(2)}V waits across open contacts.`;
  } else if (isReverseLed) {
    statusNoteId = 'LED terpasang terbalik (Anoda < Katoda): dioda memblokir arus.';
    statusNoteEn = 'LED is reverse biased (Anode < Cathode): diode blocks current.';
  } else if (isSubThresholdLed) {
    statusNoteId = `Tegangan maju ${deltaV.toFixed(2)}V di bawah ambang nyala LED (${forwardThreshold.toFixed(1)}V).`;
    statusNoteEn = `Forward bias ${deltaV.toFixed(2)}V is below LED knee voltage (${forwardThreshold.toFixed(1)}V).`;
  } else if (scopeSample.polarity === 'charging') {
    statusNoteId = 'Baterai sedang menerima arus pengisian (charging) dari sumber lebih tinggi.';
    statusNoteEn = 'Battery is actively absorbing charging current from a higher-potential bus.';
  } else if (scopeSample.polarity === 'supplying') {
    statusNoteId = `Sumber aktif menyuplai daya ${scopeSample.power.toFixed(2)}W pada ${Math.abs(deltaV).toFixed(2)}V.`;
    statusNoteEn = `Active source delivering ${scopeSample.power.toFixed(2)}W at ${Math.abs(deltaV).toFixed(2)}V.`;
  } else if (scopeSample.current < 1e-5) {
    statusNoteId = 'Belum ada arus mengalir pada komponen ini (rangkaian terbuka/kosong).';
    statusNoteEn = 'No current flowing yet (open loop or unloaded component).';
  }

  return {
    target,
    label: node.data.label || target.id,
    kind: 'node',
    potentialVolts: Number(vPos.toFixed(2)),
    secondaryPotentialVolts: pins.length >= 2 ? Number(vNeg.toFixed(2)) : undefined,
    deltaVoltageVolts: Number(Math.abs(deltaV).toFixed(2)),
    currentAmps: Number(scopeSample.current.toFixed(4)),
    signedCurrentAmps: Number(scopeSample.signedCurrent.toFixed(4)),
    powerWatts: Number(scopeSample.power.toFixed(3)),
    resistanceOhms,
    polarity: scopeSample.polarity,
    isShorted,
    isOpenCircuit: scopeSample.current < 1e-5,
    statusNoteId,
    statusNoteEn,
  };
}

/**
 * Compares electric potential between Point A (Red Probe +) and Point B (Black Probe -).
 * Time Complexity: O(1).
 *
 * @param pointA - Primary probe reading
 * @param pointB - Reference probe reading
 * @returns DualProbeComparison with signed differential and physical explanation
 */
export function compareDualProbes(
  pointA: ProbePointReading,
  pointB: ProbePointReading
): DualProbeComparison {
  const diff = Number((pointA.potentialVolts - pointB.potentialVolts).toFixed(2));
  const absDiff = Math.abs(diff);

  let direction: DualProbeComparison['direction'] = 'equipotential';
  let explanationId =
    '0.00 V: Titik A dan B berada pada simpul ekipotensial yang sama, sehingga tidak ada dorongan beda potensial.';
  let explanationEn =
    '0.00 V: Points A and B share an equipotential node, so no net potential difference exists between them.';

  if (absDiff >= 0.01) {
    if (diff > 0) {
      direction = 'A_to_B';
      explanationId = `Beda potensial +${absDiff.toFixed(2)} V: arus konvensional terdorong dari A (${pointA.potentialVolts.toFixed(2)}V) menuju B (${pointB.potentialVolts.toFixed(2)}V).`;
      explanationEn = `+${absDiff.toFixed(2)} V potential difference: drives conventional current from A (${pointA.potentialVolts.toFixed(2)}V) toward B (${pointB.potentialVolts.toFixed(2)}V).`;
    } else {
      direction = 'B_to_A';
      explanationId = `Potensial A lebih rendah ${diff.toFixed(2)} V dibanding B: arus konvensional terdorong dari B (${pointB.potentialVolts.toFixed(2)}V) ke A (${pointA.potentialVolts.toFixed(2)}V).`;
      explanationEn = `Point A is ${diff.toFixed(2)} V relative to B: conventional current flows from B (${pointB.potentialVolts.toFixed(2)}V) toward A (${pointA.potentialVolts.toFixed(2)}V).`;
    }
  }

  return {
    pointA,
    pointB,
    voltageDiffVolts: diff,
    direction,
    explanationId,
    explanationEn,
  };
}

/** Shared wire presentation overrides when Physics Lens ('thermal' or 'probe') is active. */
export interface WireLensPresentation {
  probeRole: 'A' | 'B' | 'hover' | null;
  thermal: WireThermalMetrics | null;
  strokeColor: string;
  strokeWidth: number;
  haloColor: string | null;
  haloWidth: number;
  haloOpacity: number;
  thermalBadgeText: string | null;
}

export interface WireLensInput {
  edgeId: string;
  physicsLensMode: PhysicsLensMode;
  wireCurrent: number;
  isBranchShortCircuit: boolean;
  isStepUp: boolean;
  lineResistanceOhms?: number;
  isTransmissionWire?: boolean;
  theme: 'dark' | 'light';
  probeTargetA: ProbeTarget | null;
  probeTargetB: ProbeTarget | null;
  hoveredProbeTarget: ProbeTarget | null;
  defaultStrokeColor: string;
  defaultStrokeWidth: number;
}

/**
 * Resolves unified wire visual stroke, halo, and thermal telemetry badge across
 * both Lab wires (`WireEdge`) and SUTET outdoor spans (`TransmissionWireEdge`).
 * Time Complexity: O(1).
 */
export function resolveWireLensPresentation(input: WireLensInput): WireLensPresentation {
  const {
    edgeId,
    physicsLensMode,
    wireCurrent,
    isBranchShortCircuit,
    isStepUp,
    lineResistanceOhms,
    isTransmissionWire = false,
    theme,
    probeTargetA,
    probeTargetB,
    hoveredProbeTarget,
    defaultStrokeColor,
    defaultStrokeWidth,
  } = input;

  if (physicsLensMode === 'thermal') {
    const thermal = computeWireThermalMetrics(
      wireCurrent,
      isBranchShortCircuit,
      isStepUp,
      lineResistanceOhms,
      theme
    );
    const hasActivity = wireCurrent > 1e-4 || isBranchShortCircuit || isTransmissionWire;
    const isHotOrCritical = thermal.heatBand === 'hot' || thermal.heatBand === 'critical';
    return {
      probeRole: null,
      thermal,
      strokeColor: thermal.strokeHex,
      strokeWidth: Math.max(defaultStrokeWidth, 3 + thermal.thermalRatio * 2.5),
      haloColor: isHotOrCritical || thermal.thermalRatio >= 0.08 ? thermal.haloHex : null,
      haloWidth: 9 + thermal.thermalRatio * 6,
      haloOpacity: isHotOrCritical ? 0.34 : 0.22,
      thermalBadgeText: hasActivity
        ? `${thermal.estimatedTempCelsius}°C · ${thermal.jouleHeatWatts.toFixed(2)}W`
        : null,
    };
  }

  if (physicsLensMode === 'probe') {
    const isProbeA = probeTargetA?.kind === 'wire' && probeTargetA.id === edgeId;
    const isProbeB = probeTargetB?.kind === 'wire' && probeTargetB.id === edgeId;
    const isHovered = hoveredProbeTarget?.kind === 'wire' && hoveredProbeTarget.id === edgeId;

    if (isProbeA) {
      const cyan = theme === 'light' ? '#0284C7' : '#06B6D4';
      return {
        probeRole: 'A',
        thermal: null,
        strokeColor: cyan,
        strokeWidth: Math.max(defaultStrokeWidth, 4.5),
        haloColor: cyan,
        haloWidth: 10,
        haloOpacity: 0.28,
        thermalBadgeText: null,
      };
    }

    if (isProbeB) {
      const amber = theme === 'light' ? '#D97706' : '#F59E0B';
      return {
        probeRole: 'B',
        thermal: null,
        strokeColor: amber,
        strokeWidth: Math.max(defaultStrokeWidth, 4.5),
        haloColor: amber,
        haloWidth: 10,
        haloOpacity: 0.28,
        thermalBadgeText: null,
      };
    }

    if (isHovered) {
      const sky = theme === 'light' ? '#0369A1' : '#38BDF8';
      return {
        probeRole: 'hover',
        thermal: null,
        strokeColor: sky,
        strokeWidth: Math.max(defaultStrokeWidth, 4),
        haloColor: sky,
        haloWidth: 8,
        haloOpacity: 0.2,
        thermalBadgeText: null,
      };
    }
  }

  return {
    probeRole: null,
    thermal: null,
    strokeColor: defaultStrokeColor,
    strokeWidth: defaultStrokeWidth,
    haloColor: null,
    haloWidth: 0,
    haloOpacity: 0,
    thermalBadgeText: null,
  };
}
