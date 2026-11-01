import { describe, it, expect } from 'vitest';
import { Node, Edge } from 'reactflow';
import { CircuitElementData, SimulationResult } from '../../types/circuit';
import { analyzeExplainableCircuit } from '../explainableTutor';

describe('Explainable Circuit Tutor - Multi-Topology Physics Validation', () => {
  it('correctly verifies a series circuit with KVL loop summation', () => {
    const nodes: Node<CircuitElementData>[] = [
      {
        id: 'bat1',
        type: 'battery',
        position: { x: 0, y: 0 },
        data: { id: 'bat1', type: 'battery', label: 'Baterai 1.5V', voltage: 1.5 },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { id: 'r1', type: 'resistor', label: 'R1', resistance: 10 },
      },
      {
        id: 'r2',
        type: 'resistor',
        position: { x: 200, y: 0 },
        data: { id: 'r2', type: 'resistor', label: 'R2', resistance: 20 },
      },
    ];

    const edges: Edge[] = [
      { id: 'e1', source: 'bat1', target: 'r1' },
      { id: 'e2', source: 'r1', target: 'r2' },
      { id: 'e3', source: 'r2', target: 'bat1' },
    ];

    // Total R = 30Ω, I = 1.5 / 30 = 0.05A
    const simulation: SimulationResult = {
      nodeVoltages: { net1: 1.5, net2: 1.0, net0: 0 },
      branchCurrents: { bat1: -0.05, r1: 0.05, r2: 0.05 },
      isShortCircuit: false,
      shortCircuitBranches: [],
      totalPowerDrawn: 0.075,
      timestamp: Date.now(),
    };

    const analysis = analyzeExplainableCircuit(nodes, edges, simulation);

    expect(analysis.topologyType).toBe('series_loop');
    expect(analysis.equivalentResistanceOhms).toBe(30);
    expect(analysis.totalLoopCurrentAmps).toBeCloseTo(0.05, 3);

    // Step 5 should verify KVL
    const kvlStep = analysis.derivationSteps.find((s) => s.stepNumber === 5);
    expect(kvlStep).toBeDefined();
    expect(kvlStep?.lawOrTheorem).toContain('KVL');
  });

  it('correctly calculates independent branch currents and verifies KCL in a parallel circuit', () => {
    const nodes: Node<CircuitElementData>[] = [
      {
        id: 'bat1',
        type: 'battery9v',
        position: { x: 0, y: 0 },
        data: { id: 'bat1', type: 'battery9v', label: 'Baterai 9V', voltage: 9.0 },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { id: 'r1', type: 'resistor', label: 'R1 (10Ω)', resistance: 10 },
      },
      {
        id: 'r2',
        type: 'resistor',
        position: { x: 100, y: 100 },
        data: { id: 'r2', type: 'resistor', label: 'R2 (10Ω)', resistance: 10 },
      },
    ];

    const edges: Edge[] = [
      { id: 'e1', source: 'bat1', target: 'r1' },
      { id: 'e2', source: 'bat1', target: 'r2' },
      { id: 'e3', source: 'r1', target: 'bat1' },
      { id: 'e4', source: 'r2', target: 'bat1' },
    ];

    // In parallel 10Ω || 10Ω = 5Ω. Total I = 9V / 5Ω = 1.8A.
    // Branch I1 = 0.9A, Branch I2 = 0.9A.
    const simulation: SimulationResult = {
      nodeVoltages: { net_pos: 9.0, net_neg: 0.0 },
      branchCurrents: { bat1: -1.8, r1: 0.9, r2: 0.9 },
      isShortCircuit: false,
      shortCircuitBranches: [],
      totalPowerDrawn: 16.2,
      timestamp: Date.now(),
    };

    const analysis = analyzeExplainableCircuit(nodes, edges, simulation);

    expect(analysis.topologyType).toBe('parallel_branches');
    expect(analysis.equivalentResistanceOhms).toBe(5);
    expect(analysis.totalLoopCurrentAmps).toBeCloseTo(1.8, 2);

    // Step 4 should display branch currents (0.9A each), NOT the full 1.8A!
    const branchStep = analysis.derivationSteps.find((s) => s.stepNumber === 4);
    expect(branchStep).toBeDefined();
    expect(branchStep?.substitutedFormula).toContain('0.9');

    // Step 5 must be KCL verification
    const kclStep = analysis.derivationSteps.find((s) => s.stepNumber === 5);
    expect(kclStep).toBeDefined();
    expect(kclStep?.lawOrTheorem).toContain('KCL');
    expect(kclStep?.substitutedFormula).toContain('0.9A + 0.9A = 1.8 A');
  });

  it('correctly flags an open circuit and halts electron flow', () => {
    const nodes: Node<CircuitElementData>[] = [
      {
        id: 'bat1',
        type: 'battery',
        position: { x: 0, y: 0 },
        data: { id: 'bat1', type: 'battery', label: 'Baterai', voltage: 1.5 },
      },
      {
        id: 'sw1',
        type: 'switch',
        position: { x: 100, y: 0 },
        data: { id: 'sw1', type: 'switch', label: 'Sakelar', isOpen: true },
      },
    ];

    const edges: Edge[] = [{ id: 'e1', source: 'bat1', target: 'sw1' }];

    const simulation: SimulationResult = {
      nodeVoltages: { net1: 1.5 },
      branchCurrents: { bat1: 0, sw1: 0 },
      isShortCircuit: false,
      shortCircuitBranches: [],
      totalPowerDrawn: 0,
      timestamp: Date.now(),
    };

    const analysis = analyzeExplainableCircuit(nodes, edges, simulation);

    expect(analysis.topologyType).toBe('open_circuit');
    expect(analysis.totalLoopCurrentAmps).toBe(0);
    expect(analysis.phenomena.some((p) => p.category === 'bulb_unlit')).toBe(true);
  });

  it('correctly flags a dead short circuit and alerts critical hazard', () => {
    const nodes: Node<CircuitElementData>[] = [
      {
        id: 'bat1',
        type: 'battery9v',
        position: { x: 0, y: 0 },
        data: { id: 'bat1', type: 'battery9v', label: 'Baterai 9V', voltage: 9.0 },
      },
    ];

    const edges: Edge[] = [{ id: 'e1', source: 'bat1', target: 'bat1' }];

    const simulation: SimulationResult = {
      nodeVoltages: { net0: 0 },
      branchCurrents: { bat1: 4.5 },
      isShortCircuit: true,
      shortCircuitBranches: ['bat1'],
      totalPowerDrawn: 40.5,
      timestamp: Date.now(),
    };

    const analysis = analyzeExplainableCircuit(nodes, edges, simulation);

    expect(analysis.topologyType).toBe('dead_short');
    expect(analysis.phenomena.some((p) => p.category === 'short_circuit' && p.severity === 'critical')).toBe(true);
  });
});
