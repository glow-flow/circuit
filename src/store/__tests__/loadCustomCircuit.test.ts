import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCircuitStore } from '../useCircuitStore';
import { Node, Edge } from 'reactflow';
import { CircuitElementData } from '../../types/circuit';
import { loadWorkspaceAutosaveWithValidation } from '../../utils/workspacePersistence';

class MockStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

describe('useCircuitStore — loadCustomCircuit & Edge Filter validation', () => {
  beforeEach(() => {
    const mockStorage = new MockStorage();
    vi.stubGlobal('localStorage', mockStorage);
    useCircuitStore.setState({
      nodes: [],
      edges: [],
      worldMode: 'lab',
      selectedNodeId: null,
      selectedEdgeId: null,
      fitViewTrigger: 0,
    });
  });

  it('atomically loads custom nodes, edges, calculates simulation, and increments fitViewTrigger', () => {
    const testNodes: Node<CircuitElementData>[] = [
      {
        id: 'bat_test',
        type: 'battery',
        position: { x: 100, y: 100 },
        data: { id: 'bat_test', type: 'battery', label: 'Battery', voltage: 9.0 },
      },
      {
        id: 'res_test',
        type: 'resistor',
        position: { x: 300, y: 100 },
        data: { id: 'res_test', type: 'resistor', label: 'Resistor', resistance: 100 },
      },
    ];

    const testEdges: Edge[] = [
      { id: 'e1', source: 'bat_test', sourceHandle: 'pos', target: 'res_test', targetHandle: 'p1', type: 'wire' },
      { id: 'e2', source: 'res_test', sourceHandle: 'p2', target: 'bat_test', targetHandle: 'neg', type: 'wire' },
    ];

    const initialFitView = useCircuitStore.getState().fitViewTrigger;
    useCircuitStore.getState().loadCustomCircuit(testNodes, testEdges, 'lab');

    const state = useCircuitStore.getState();
    expect(state.nodes).toHaveLength(2);
    expect(state.edges).toHaveLength(2);
    expect(state.worldMode).toBe('lab');
    expect(state.fitViewTrigger).toBe(initialFitView + 1);

    // Verify MNA simulation calculated branch current (I = 9V / 100Ω = 0.09 A)
    const current = Math.abs(state.simulation.branchCurrents['bat_test'] ?? 0);
    expect(current).toBeCloseTo(0.09, 2);

    // Verify immediate autosave persistence
    const autosave = loadWorkspaceAutosaveWithValidation();
    expect(autosave.status).toBe('restored');
    if (autosave.status === 'restored') {
      expect(autosave.nodes).toHaveLength(2);
    }
  });

  it('preserves valid wires connecting different handles on the exact same node (terminal short circuit)', () => {
    const shortedNodes: Node<CircuitElementData>[] = [
      {
        id: 'bat_dead_short',
        type: 'battery',
        position: { x: 50, y: 50 },
        data: { id: 'bat_dead_short', type: 'battery', label: 'Battery', voltage: 1.5, internalResistance: 0.1 },
      },
    ];

    // Wire connecting pos directly to neg on the exact same battery
    const shortingEdges: Edge[] = [
      {
        id: 'w_direct_short',
        source: 'bat_dead_short',
        sourceHandle: 'pos',
        target: 'bat_dead_short',
        targetHandle: 'neg',
        type: 'wire',
      },
    ];

    useCircuitStore.getState().loadCustomCircuit(shortedNodes, shortingEdges, 'lab');
    const state = useCircuitStore.getState();

    expect(state.edges).toHaveLength(1);
    expect(state.simulation.isShortCircuit).toBe(true);
    expect(state.simulation.shortCircuitBranches).toContain('bat_dead_short');
  });

  it('rejects wires connecting the same handle to itself (accidental self-loop on same terminal)', () => {
    const nodes: Node<CircuitElementData>[] = [
      {
        id: 'bat_1',
        type: 'battery',
        position: { x: 50, y: 50 },
        data: { id: 'bat_1', type: 'battery', label: 'Battery', voltage: 1.5 },
      },
    ];

    // Accidental same-pin connection: pos to pos
    const badEdges: Edge[] = [
      {
        id: 'w_bad_same_pin',
        source: 'bat_1',
        sourceHandle: 'pos',
        target: 'bat_1',
        targetHandle: 'pos',
      },
    ];

    useCircuitStore.getState().loadCustomCircuit(nodes, badEdges, 'lab');
    const state = useCircuitStore.getState();

    // MNA recalculation removes same-pin edges
    expect(state.simulation.isShortCircuit).toBe(false);
  });
});
