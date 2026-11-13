import { describe, it, expect } from 'vitest';
import { Edge, Node } from 'reactflow';
import { CircuitElementData } from '../../types/circuit';
import { solveCircuitMNA } from '../../physics/mnaSolver';
import { analyzeExplainableCircuit } from '../explainableTutor';

function makeNode(
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

function makeEdge(
  id: string,
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string
): Edge {
  return { id, source, sourceHandle, target, targetHandle };
}

function solveForTutor(nodes: Node<CircuitElementData>[], edges: Edge[]) {
  return solveCircuitMNA({
    components: nodes.map((n) => n.data),
    wires: edges.map((e) => ({
      id: e.id,
      source: e.source,
      sourceHandle: e.sourceHandle ?? 'pos',
      target: e.target,
      targetHandle: e.targetHandle ?? 'neg',
    })),
  });
}

describe('Explainable Tutor Audit Fixes - Parallel Banks, Series Chain & Parallel What-If', () => {
  it('preserves 12V bus EMF when two 12V batteries are wired in parallel instead of summing to 24V', () => {
    const nodes: Node<CircuitElementData>[] = [
      makeNode('bat1', { type: 'battery', label: 'Bat 12V A', voltage: 12 }),
      makeNode('bat2', { type: 'battery', label: 'Bat 12V B', voltage: 12 }),
      makeNode('load1', { type: 'resistor', label: 'R 10 Ohm', resistance: 10 }),
    ];
    const edges: Edge[] = [
      makeEdge('e1', 'bat1', 'pos', 'bat2', 'pos'),
      makeEdge('e2', 'bat2', 'pos', 'load1', 'p1'),
      makeEdge('e3', 'load1', 'p2', 'bat2', 'neg'),
      makeEdge('e4', 'bat2', 'neg', 'bat1', 'neg'),
    ];

    const sim = solveForTutor(nodes, edges);
    const analysis = analyzeExplainableCircuit(nodes, edges, sim);

    expect(analysis.totalSourcesVoltage).toBe(12);
    expect(analysis.totalLoopCurrentAmps).toBeCloseTo(1.2, 1);
  });

  it('subtracts opposing series battery EMFs rather than adding them together', () => {
    const nodes: Node<CircuitElementData>[] = [
      makeNode('bat_12', { type: 'battery', label: 'Bat 12V', voltage: 12 }),
      makeNode('bat_9', { type: 'battery9v', label: 'Bat 9V', voltage: 9 }),
      makeNode('load_op', { type: 'resistor', label: 'R 10 Ohm', resistance: 10 }),
    ];
    // Opposing: bat_12(+) -> bat_9(+), bat_9(-) -> load_op(p1), load_op(p2) -> bat_12(-)
    const edges: Edge[] = [
      makeEdge('e1', 'bat_12', 'pos', 'bat_9', 'pos'),
      makeEdge('e2', 'bat_9', 'neg', 'load_op', 'p1'),
      makeEdge('e3', 'load_op', 'p2', 'bat_12', 'neg'),
    ];

    const sim = solveForTutor(nodes, edges);
    const analysis = analyzeExplainableCircuit(nodes, edges, sim);

    expect(analysis.totalSourcesVoltage).toBe(3);
  });

  it('classifies a single series chain with closed switch, waypoint, and 2 bulbs (>= 4 edges) as series_loop', () => {
    const nodes: Node<CircuitElementData>[] = [
      makeNode('bat', { type: 'battery', label: 'Bat 9V', voltage: 9 }),
      makeNode('sw', { type: 'switch', label: 'Sakelar', isOpen: false }),
      makeNode('wp', { type: 'waypoint', label: 'Belokan' }),
      makeNode('b1', {
        type: 'socket',
        label: 'Lampu 1',
        installedBulb: { id: 'unit_1', bulbType: 'incandescent', resistance: 10 },
      }),
      makeNode('b2', {
        type: 'socket',
        label: 'Lampu 2',
        installedBulb: { id: 'unit_2', bulbType: 'incandescent', resistance: 10 },
      }),
    ];
    const edges: Edge[] = [
      makeEdge('e1', 'bat', 'pos', 'sw', 'p1'),
      makeEdge('e2', 'sw', 'p2', 'wp', 'p1'),
      makeEdge('e3', 'wp', 'p2', 'b1', 'p1'),
      makeEdge('e4', 'b1', 'p2', 'b2', 'p1'),
      makeEdge('e5', 'b2', 'p2', 'bat', 'neg'),
    ];

    const sim = solveForTutor(nodes, edges);
    const analysis = analyzeExplainableCircuit(nodes, edges, sim);

    expect(analysis.topologyType).toBe('series_loop');
    expect(analysis.equivalentResistanceOhms).toBe(20);
  });

  it('computes reciprocal parallel Req (10||10 -> 10||20 = 6.67 Ohm) for parallel whatif_double_resistance', () => {
    const nodes: Node<CircuitElementData>[] = [
      makeNode('bat', { type: 'battery', label: 'Bat 12V', voltage: 12 }),
      makeNode('wp_top', { type: 'waypoint', label: 'Rel Atas' }),
      makeNode('wp_bot', { type: 'waypoint', label: 'Rel Bawah' }),
      makeNode('s1', {
        type: 'socket',
        label: 'Cabang A',
        installedBulb: { id: 'b_a', bulbType: 'incandescent', resistance: 10 },
      }),
      makeNode('s2', {
        type: 'socket',
        label: 'Cabang B',
        installedBulb: { id: 'b_b', bulbType: 'incandescent', resistance: 10 },
      }),
    ];
    const edges: Edge[] = [
      makeEdge('e1', 'bat', 'pos', 'wp_top', 'p1'),
      makeEdge('e2', 'wp_top', 'p1', 's1', 'p1'),
      makeEdge('e3', 'wp_top', 'p1', 's2', 'p1'),
      makeEdge('e4', 's1', 'p2', 'wp_bot', 'p1'),
      makeEdge('e5', 's2', 'p2', 'wp_bot', 'p1'),
      makeEdge('e6', 'wp_bot', 'p1', 'bat', 'neg'),
    ];

    const sim = solveForTutor(nodes, edges);
    const analysis = analyzeExplainableCircuit(nodes, edges, sim);

    expect(analysis.topologyType).toBe('parallel_branches');
    expect(analysis.equivalentResistanceOhms).toBe(5);

    const doubleResWhatIf = analysis.whatIfPredictions.find(
      (item) => item.id === 'whatif_double_resistance'
    );
    expect(doubleResWhatIf).toBeDefined();
    // 1 / (1/10 + 1/20) = 20/3 = 6.67Ω -> 12V / 6.67Ω = 1.799 A
    expect(doubleResWhatIf?.mathematicalProof).toContain('6.67');
    expect(doubleResWhatIf?.mathematicalProof).toContain('1.799');
  });
});
