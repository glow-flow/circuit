/**
 * Unit Test Suite for Troubleshooting Lab Validation & Scoring Engine.
 * 
 * Verifies:
 * 1. Controlled fault identification (rejects un-repaired circuits).
 * 2. Physical repair verification via real MNA simulation and topology.
 * 3. Progressive hint penalties (-100, -200, -300) and time penalties.
 * 4. Star rating thresholds (3 stars >= 800, 2 stars >= 600, 1 star < 600).
 * 5. Isolated storage persistence of high scores.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TROUBLESHOOTING_SCENARIOS } from '../troubleshootingCatalog';
import {
  calculateTroubleshootingScore,
  recordTroubleshootingRun,
  loadTroubleshootingProgress,
} from '../troubleshootingScoring';
import { solveCircuitMNA } from '../../physics/mnaSolver';
import { CircuitElementData } from '../../types/circuit';
import { Node, Edge } from 'reactflow';

class MockStorage implements Storage {
  private store = new Map<string, string>();
  get length() { return this.store.size; }
  clear() { this.store.clear(); }
  getItem(key: string) { return this.store.get(key) ?? null; }
  key(index: number) { return Array.from(this.store.keys())[index] ?? null; }
  removeItem(key: string) { this.store.delete(key); }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
}

describe('Troubleshooting Lab — Physical Validation & Scoring', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  it('rejects un-repaired reversed LED circuit and approves valid forward bias repair', () => {
    const scenario = TROUBLESHOOTING_SCENARIOS.find((s) => s.id === 'fault_reversed_led')!;
    expect(scenario).toBeDefined();

    // 1. Initial starter circuit: LED is wired in reverse bias
    const initialNodes = scenario.starterCircuit.nodes;
    const initialEdges = scenario.starterCircuit.edges;
    const initialSim = solveCircuitMNA({
      components: initialNodes.map((n) => n.data),
      wires: initialEdges as any,
    });

    const initialValidation = scenario.validateRepair({
      nodes: initialNodes,
      edges: initialEdges,
      simulation: initialSim,
    });

    expect(initialValidation.isRepaired).toBe(false);
    expect(initialValidation.feedbackMessageEn).toContain('Reverse Bias');

    // 2. Perform Physical Repair: Invert wires so pos -> p1 and neg -> p2 (Forward Bias)
    const repairedEdges: Edge[] = [
      { id: 'w_repaired_1', source: 'bat_1', sourceHandle: 'pos', target: 'sock_1', targetHandle: 'p1' },
      { id: 'w_repaired_2', source: 'sock_1', sourceHandle: 'p2', target: 'bat_1', targetHandle: 'neg' },
    ];

    const repairedSim = solveCircuitMNA({
      components: initialNodes.map((n) => n.data),
      wires: repairedEdges as any,
    });

    const repairedValidation = scenario.validateRepair({
      nodes: initialNodes,
      edges: repairedEdges,
      simulation: repairedSim,
    });

    expect(repairedValidation.isRepaired).toBe(true);
    expect(repairedValidation.measurementsSatisfied).toBe(true);
  });

  it('rejects broken wire circuit and approves complete closed loop repair', () => {
    const scenario = TROUBLESHOOTING_SCENARIOS.find((s) => s.id === 'fault_broken_wire')!;

    // Initial state: missing wire between switch and socket
    const initialNodes = scenario.starterCircuit.nodes;
    const initialEdges = scenario.starterCircuit.edges;
    const initialSim = solveCircuitMNA({
      components: initialNodes.map((n) => n.data),
      wires: initialEdges as any,
    });

    const initialValidation = scenario.validateRepair({
      nodes: initialNodes,
      edges: initialEdges,
      simulation: initialSim,
    });

    expect(initialValidation.isRepaired).toBe(false);

    // Repair: add missing connecting wire
    const repairedEdges: Edge[] = [
      ...initialEdges,
      { id: 'w_bridge', source: 'sw_1', sourceHandle: 'p2', target: 'sock_1', targetHandle: 'p1' },
    ];

    const repairedSim = solveCircuitMNA({
      components: initialNodes.map((n) => n.data),
      wires: repairedEdges as any,
    });

    const repairedValidation = scenario.validateRepair({
      nodes: initialNodes,
      edges: repairedEdges,
      simulation: repairedSim,
    });

    expect(repairedValidation.isRepaired).toBe(true);
  });

  it('rejects short circuit fault and approves when shorting wire is removed', () => {
    const scenario = TROUBLESHOOTING_SCENARIOS.find((s) => s.id === 'fault_dead_short')!;

    // Initial state: direct shorting wire present
    const initialNodes = scenario.starterCircuit.nodes;
    const initialEdges = scenario.starterCircuit.edges;
    const initialSim = solveCircuitMNA({
      components: initialNodes.map((n) => n.data),
      wires: initialEdges as any,
    });

    const initialValidation = scenario.validateRepair({
      nodes: initialNodes,
      edges: initialEdges,
      simulation: initialSim,
    });

    expect(initialValidation.isRepaired).toBe(false);

    // Repair: filter out the shorting wire 'w_short'
    const repairedEdges = initialEdges.filter((e) => e.id !== 'w_short');
    const repairedSim = solveCircuitMNA({
      components: initialNodes.map((n) => n.data),
      wires: repairedEdges as any,
    });

    const repairedValidation = scenario.validateRepair({
      nodes: initialNodes,
      edges: repairedEdges,
      simulation: repairedSim,
    });

    expect(repairedValidation.isRepaired).toBe(true);
    expect(repairedSim.isShortCircuit).toBe(false);
  });

  it('rejects 10k Ohm resistor and approves when calibrated down to 50 Ohm', () => {
    const scenario = TROUBLESHOOTING_SCENARIOS.find((s) => s.id === 'fault_wrong_resistor')!;

    const initialNodes = scenario.starterCircuit.nodes;
    const initialEdges = scenario.starterCircuit.edges;
    const initialSim = solveCircuitMNA({
      components: initialNodes.map((n) => n.data),
      wires: initialEdges as any,
    });

    const initialValidation = scenario.validateRepair({
      nodes: initialNodes,
      edges: initialEdges,
      simulation: initialSim,
    });

    expect(initialValidation.isRepaired).toBe(false);

    // Repair: calibrate resistor from 10,000 Ohm down to 50 Ohm
    const repairedNodes: Node<CircuitElementData>[] = initialNodes.map((n) =>
      n.id === 'r_fault' ? { ...n, data: { ...n.data, resistance: 50 } } : n
    );

    const repairedSim = solveCircuitMNA({
      components: repairedNodes.map((n) => n.data),
      wires: initialEdges as any,
    });

    const repairedValidation = scenario.validateRepair({
      nodes: repairedNodes,
      edges: initialEdges,
      simulation: repairedSim,
    });

    expect(repairedValidation.isRepaired).toBe(true);
  });

  it('strictly computes diagnostic score with progressive hint penalties', () => {
    // 0 hints, 20 seconds -> 1000 - 0 - 10 = 990 (3 stars)
    const score0 = calculateTroubleshootingScore(0, 20);
    expect(score0.finalScore).toBe(990);
    expect(score0.stars).toBe(3);

    // 1 hint (-100), 30 seconds (-15) -> 885 (3 stars)
    const score1 = calculateTroubleshootingScore(1, 30);
    expect(score1.hintPenalty).toBe(100);
    expect(score1.finalScore).toBe(885);
    expect(score1.stars).toBe(3);

    // 2 hints (-300), 60 seconds (-30) -> 670 (2 stars)
    const score2 = calculateTroubleshootingScore(2, 60);
    expect(score2.hintPenalty).toBe(300);
    expect(score2.finalScore).toBe(670);
    expect(score2.stars).toBe(2);

    // 3 hints (-600), 120 seconds (-60) -> 340 (1 star)
    const score3 = calculateTroubleshootingScore(3, 120);
    expect(score3.hintPenalty).toBe(600);
    expect(score3.finalScore).toBe(340);
    expect(score3.stars).toBe(1);
  });

  it('persists troubleshooting high scores in isolated storage namespace', () => {
    const initial = loadTroubleshootingProgress(mockStorage);
    expect(initial.totalRepairsCompleted).toBe(0);

    const scoreResult = calculateTroubleshootingScore(1, 40);
    recordTroubleshootingRun('fault_reversed_led', scoreResult, 1, mockStorage);

    const loaded = loadTroubleshootingProgress(mockStorage);
    expect(loaded.totalRepairsCompleted).toBe(1);
    expect(loaded.bestScores['fault_reversed_led'].score).toBe(scoreResult.finalScore);

    // Ensure autosave key was not modified
    expect(mockStorage.getItem('circuit_sandbox_autosave_v2')).toBeNull();
  });
});
