import { describe, it, expect } from 'vitest';
import { Edge, Node } from 'reactflow';
import { solveCircuitMNA } from '../mnaSolver';
import { CircuitElementData, WireConnection } from '../../types/circuit';
import {
  buildPinPotentialLookup,
  compareDualProbes,
  computeAllNodeThermals,
  computeNodeThermalMetrics,
  computeProbeReading,
  computeWireThermalMetrics,
  findHottestThermalNode,
  resolveWireLensPresentation,
} from '../physicsLensEngine';

function makeNode(data: CircuitElementData, x = 0, y = 0): Node<CircuitElementData> {
  return {
    id: data.id,
    type: data.type,
    position: { x, y },
    data,
  };
}

function makeWire(
  id: string,
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string
): Edge {
  return { id, source, sourceHandle, target, targetHandle, type: 'wire' };
}

describe('physicsLensEngine - FLIR Thermal & Finger Probe Calculations', () => {
  it('handles NaN and non-finite currents safely without throwing', () => {
    const metrics = computeWireThermalMetrics(Number.NaN, false, false, 0, 'dark');
    expect(metrics.currentAmps).toBe(0);
    expect(metrics.jouleHeatWatts).toBe(0);
    expect(metrics.heatBand).toBe('ambient');
    expect(metrics.estimatedTempCelsius).toBeGreaterThanOrEqual(26);
  });

  it('proves 240V SUTET step-up slashes wire Joule heat loss 400x vs 12V direct span', () => {
    const direct12V = computeWireThermalMetrics(2.0, false, false, 4.0, 'dark');
    const stepUp240V = computeWireThermalMetrics(2.0, false, true, 4.0, 'dark');

    // Direct: 2^2 * 4 = 16W; Step-Up: (2/20)^2 * 4 = 0.04W (16 / 0.04 = 400x)
    expect(direct12V.jouleHeatWatts).toBeCloseTo(16, 2);
    expect(stepUp240V.jouleHeatWatts).toBeCloseTo(0.04, 3);
    expect(direct12V.estimatedTempCelsius).toBeGreaterThan(stepUp240V.estimatedTempCelsius + 60);
    expect(direct12V.heatBand).toBe('critical');
    expect(stepUp240V.heatBand).toBe('warm');
  });

  it('distinguishes cool LED dissipation vs hot incandescent filament under real 9V load', () => {
    const incSocket = makeNode({
      id: 'sock_inc',
      type: 'socket',
      label: 'Pijar 5W',
      installedBulb: 'incandescent',
    });
    const ledSocket = makeNode({
      id: 'sock_led',
      type: 'socket',
      label: 'LED Cool',
      installedBulb: 'led_standard',
    });

    // At nominal 9V supply: 800 Ohm incandescent draws 11.25 mA; 4500 Ohm LED draws 2 mA
    const sim = {
      branchCurrents: { sock_inc: 0.01125, sock_led: 0.002 },
      shortCircuitBranches: [] as string[],
    };

    const incThermal = computeNodeThermalMetrics(incSocket.data, sim, 'dark');
    const ledThermal = computeNodeThermalMetrics(ledSocket.data, sim, 'dark');
    const thermals = computeAllNodeThermals([incSocket, ledSocket], sim, 'dark');
    const hottest = findHottestThermalNode([incSocket, ledSocket], thermals);

    expect(incThermal.temperatureCelsius).toBeGreaterThan(ledThermal.temperatureCelsius);
    expect(hottest?.nodeId).toBe('sock_inc');
  });

  it('computes accurate MNA pin potentials, probe readings, and Dual-Probe delta-V across a 9V voltage divider', () => {
    const bat = makeNode({
      id: 'bat1',
      type: 'battery9v',
      label: 'Baterai 9V',
      voltage: 9,
      internalResistance: 0.001,
    });
    const r1 = makeNode({
      id: 'r1',
      type: 'resistor',
      label: 'Resistor 100',
      resistance: 100,
    });
    const r2 = makeNode({
      id: 'r2',
      type: 'resistor',
      label: 'Resistor 200',
      resistance: 200,
    });
    const gnd = makeNode({ id: 'gnd1', type: 'ground', label: 'GND' });

    const nodes = [bat, r1, r2, gnd];
    const edges: Edge[] = [
      makeWire('e_bat_r1', 'bat1', 'pos', 'r1', 'p1'),
      makeWire('e_r1_r2', 'r1', 'p2', 'r2', 'p1'),
      makeWire('e_r2_bat', 'r2', 'p2', 'bat1', 'neg'),
      makeWire('e_gnd', 'bat1', 'neg', 'gnd1', 'gnd'),
    ];

    const wires: WireConnection[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      sourceHandle: e.sourceHandle ?? 'p1',
      target: e.target,
      targetHandle: e.targetHandle ?? 'p2',
    }));

    const sim = solveCircuitMNA({
      components: nodes.map((n) => n.data),
      wires,
    });
    const pinMap = buildPinPotentialLookup(nodes, edges, sim.nodeVoltages);

    const readR1 = computeProbeReading({ kind: 'node', id: 'r1' }, nodes, edges, sim, pinMap);
    const readR2 = computeProbeReading({ kind: 'node', id: 'r2' }, nodes, edges, sim, pinMap);
    const readMidWire = computeProbeReading(
      { kind: 'wire', id: 'e_r1_r2' },
      nodes,
      edges,
      sim,
      pinMap
    );

    expect(readR1).not.toBeNull();
    expect(readR2).not.toBeNull();
    expect(readMidWire).not.toBeNull();

    // 9V / 300 Ohm = 0.03 A; midpoint node = 9V * 200/300 = 6.0V
    expect(readMidWire!.potentialVolts).toBeCloseTo(6.0, 1);
    expect(readR1!.deltaVoltageVolts).toBeCloseTo(3.0, 1);
    expect(readR2!.deltaVoltageVolts).toBeCloseTo(6.0, 1);
    expect(readR1!.currentAmps).toBeCloseTo(0.03, 2);

    const cmpAB = compareDualProbes(readR1!, readR2!);
    expect(cmpAB.voltageDiffVolts).toBeCloseTo(3.0, 1);
    expect(cmpAB.direction).toBe('A_to_B');

    const cmpEquipotential = compareDualProbes(readMidWire!, readR2!);
    expect(cmpEquipotential.voltageDiffVolts).toBeCloseTo(0, 2);
    expect(cmpEquipotential.direction).toBe('equipotential');
  });

  it('diagnoses open switch voltage accumulation & reverse-biased LED faults clearly', () => {
    const sw = makeNode({ id: 'sw1', type: 'switch', label: 'Sakelar', isOpen: true });
    const led = makeNode({
      id: 'sock_led',
      type: 'pin-socket',
      label: 'Fitting LED',
      installedBulb: 'led_standard',
      isReverseBiased: true,
    });
    const sim = {
      nodeVoltages: { 'sw1:p1': 9, 'sw1:p2': 0, 'sock_led:pin_pos': 0, 'sock_led:pin_neg': 9 },
      branchCurrents: { sw1: 0, sock_led: 0 },
      totalPowerDrawn: 0,
      isShortCircuit: false,
      shortCircuitBranches: [] as string[],
      reverseBiasedBranches: ['sock_led'],
      timestamp: Date.now(),
    };
    const pinMap = new Map<string, number>([
      ['sw1:p1', 9],
      ['sw1:p2', 0],
      ['sock_led:pin_pos', 0],
      ['sock_led:pin_neg', 9],
    ]);

    const swRead = computeProbeReading({ kind: 'node', id: 'sw1' }, [sw, led], [], sim, pinMap);
    const ledRead = computeProbeReading({ kind: 'node', id: 'sock_led' }, [sw, led], [], sim, pinMap);

    expect(swRead?.isOpenCircuit).toBe(true);
    expect(swRead?.statusNoteEn).toContain('Open switch');
    expect(ledRead?.statusNoteEn).toContain('reverse biased');
  });

  it('resolves unified wire lens presentation cleanly across thermal, probe, and normal modes', () => {
    const thermalView = resolveWireLensPresentation({
      edgeId: 'e1',
      physicsLensMode: 'thermal',
      wireCurrent: 3.5,
      isBranchShortCircuit: false,
      isStepUp: false,
      lineResistanceOhms: 4,
      isTransmissionWire: true,
      theme: 'dark',
      probeTargetA: null,
      probeTargetB: null,
      hoveredProbeTarget: null,
      defaultStrokeColor: '#64748B',
      defaultStrokeWidth: 3,
    });
    expect(thermalView.thermal?.heatBand).toBe('critical');
    expect(thermalView.thermalBadgeText).toContain('°C');

    const probeView = resolveWireLensPresentation({
      edgeId: 'e1',
      physicsLensMode: 'probe',
      wireCurrent: 0.5,
      isBranchShortCircuit: false,
      isStepUp: false,
      theme: 'light',
      probeTargetA: { kind: 'wire', id: 'e1' },
      probeTargetB: null,
      hoveredProbeTarget: null,
      defaultStrokeColor: '#64748B',
      defaultStrokeWidth: 3,
    });
    expect(probeView.probeRole).toBe('A');
    expect(probeView.strokeWidth).toBeGreaterThanOrEqual(4.5);
  });
});
