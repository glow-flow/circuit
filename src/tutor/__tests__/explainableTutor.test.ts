import { describe, it, expect } from 'vitest';
import { analyzeExplainableCircuit } from '../explainableTutor';
import { Node, Edge } from 'reactflow';
import { CircuitElementData, SimulationResult } from '../../types/circuit';

describe('Explainable Circuit Tutor Physics & Derivation Suite', () => {
  const defaultSimulation: SimulationResult = {
    nodeVoltages: { '1': 9.0, '2': 3.0, '0': 0.0 },
    branchCurrents: { 'b1': 0.03 },
    isShortCircuit: false,
    shortCircuitBranches: [],
    totalPowerDrawn: 0.27,
    timestamp: Date.now(),
  };

  it('handles empty circuit gracefully with educational guidance', () => {
    const analysis = analyzeExplainableCircuit([], [], defaultSimulation);
    expect(analysis.topologyType).toBe('empty');
    expect(analysis.totalSourcesVoltage).toBe(0);
    expect(analysis.derivationSteps.length).toBe(0);
    expect(analysis.summaryId).toContain('Kanvas kosong');
  });

  it('generates 5 step-by-step mathematical derivations for a series circuit', () => {
    const nodes: Node<CircuitElementData>[] = [
      {
        id: 'batt1',
        type: 'battery9v',
        position: { x: 0, y: 0 },
        data: { id: 'batt1', type: 'battery9v', label: 'Baterai 9V', voltage: 9.0 },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { id: 'r1', type: 'resistor', label: 'R1', resistance: 100.0 },
      },
      {
        id: 'r2',
        type: 'resistor',
        position: { x: 200, y: 0 },
        data: { id: 'r2', type: 'resistor', label: 'R2', resistance: 200.0 },
      },
    ];

    const edges: Edge[] = [
      { id: 'e1', source: 'batt1', target: 'r1' },
      { id: 'e2', source: 'r1', target: 'r2' },
      { id: 'e3', source: 'r2', target: 'batt1' },
    ];

    const analysis = analyzeExplainableCircuit(nodes, edges, defaultSimulation);

    expect(analysis.topologyType).toBe('series_loop');
    expect(analysis.totalSourcesVoltage).toBe(9.0);
    expect(analysis.equivalentResistanceOhms).toBe(300.0); // 100 + 200
    expect(analysis.totalLoopCurrentAmps).toBe(0.03); // 9 / 300 = 0.03 A = 30 mA

    // Check step-by-step mathematical proof structure
    expect(analysis.derivationSteps.length).toBe(5);
    expect(analysis.derivationSteps[0].titleEn).toContain('Identify Voltage Sources');
    expect(analysis.derivationSteps[1].titleEn).toContain('Total Series Resistance');
    expect(analysis.derivationSteps[2].titleEn).toContain('Ohm\'s Law');
    expect(analysis.derivationSteps[3].titleEn).toContain('Voltage Drops');
    expect(analysis.derivationSteps[4].titleEn).toContain('Kirchhoff\'s Voltage Law');

    // Verify KVL step substituted formula
    expect(analysis.derivationSteps[4].substitutedFormula).toContain('9V - (3V + 6V)');
  });

  it('diagnoses dead short circuit with critical phenomenon alert', () => {
    const nodes: Node<CircuitElementData>[] = [
      {
        id: 'batt1',
        type: 'battery9v',
        position: { x: 0, y: 0 },
        data: { id: 'batt1', type: 'battery9v', label: 'Baterai 9V', voltage: 9.0 },
      },
    ];
    const edges: Edge[] = [
      { id: 'e_short', source: 'batt1', target: 'batt1' },
    ];

    const shortSim: SimulationResult = {
      ...defaultSimulation,
      isShortCircuit: true,
      shortCircuitBranches: ['batt1'],
    };

    const analysis = analyzeExplainableCircuit(nodes, edges, shortSim);

    expect(analysis.topologyType).toBe('dead_short');
    expect(analysis.phenomena.length).toBeGreaterThan(0);

    const shortPhenomenon = analysis.phenomena.find((p) => p.category === 'short_circuit');
    expect(shortPhenomenon).toBeDefined();
    expect(shortPhenomenon?.severity).toBe('critical');
    expect(shortPhenomenon?.explanationId).toContain('Hukum Ohm');
  });

  it('explains open circuit when a switch is turned OFF', () => {
    const nodes: Node<CircuitElementData>[] = [
      {
        id: 'batt1',
        type: 'battery',
        position: { x: 0, y: 0 },
        data: { id: 'batt1', type: 'battery', label: 'Baterai 1.5V', voltage: 1.5 },
      },
      {
        id: 'sw1',
        type: 'switch',
        position: { x: 100, y: 0 },
        data: { id: 'sw1', type: 'switch', label: 'Sakelar', isOpen: true },
      },
      {
        id: 'bulb1',
        type: 'bulb',
        position: { x: 200, y: 0 },
        data: { id: 'bulb1', type: 'bulb', label: 'Lampu Pijar', resistance: 10 },
      },
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'batt1', target: 'sw1' },
      { id: 'e2', source: 'sw1', target: 'bulb1' },
    ];

    const analysis = analyzeExplainableCircuit(nodes, edges, defaultSimulation);

    expect(analysis.topologyType).toBe('open_circuit');
    const switchPhenomenon = analysis.phenomena.find((p) => p.category === 'bulb_unlit');
    expect(switchPhenomenon).toBeDefined();
    expect(switchPhenomenon?.explanationId).toContain('celah udara');
  });

  it('generates interactive What-If hypothetical predictions', () => {
    const nodes: Node<CircuitElementData>[] = [
      {
        id: 'batt1',
        type: 'battery9v',
        position: { x: 0, y: 0 },
        data: { id: 'batt1', type: 'battery9v', label: 'Baterai 9V', voltage: 9.0 },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { id: 'r1', type: 'resistor', label: 'R1', resistance: 50.0 },
      },
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'batt1', target: 'r1' },
      { id: 'e2', source: 'r1', target: 'batt1' },
    ];

    const analysis = analyzeExplainableCircuit(nodes, edges, defaultSimulation);

    expect(analysis.whatIfPredictions.length).toBeGreaterThan(0);
    const doubleR = analysis.whatIfPredictions.find((w) => w.id === 'whatif_double_resistance');
    expect(doubleR).toBeDefined();
    expect(doubleR?.mathematicalProof).toContain('I_{baru}');
  });
});
