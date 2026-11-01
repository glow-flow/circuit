/**
 * Unit Test Suite for Workspace Persistence & Autosave Engine.
 * 
 * Verifies all 7 critical data-integrity scenarios specified by Guardrails:
 * 1. First-time use (null storage -> 'first_time')
 * 2. Valid empty workspace (intentional user clearing -> 'empty_workspace')
 * 3. Corrupted data (malformed JSON / invalid structure -> 'corrupted' with actionable reason)
 * 4. Schema migration (legacy wired bulbs converted into sockets, dangling edges removed)
 * 5. Rapid edits (debounced write prevents synchronous disk hammering)
 * 6. Reload recovery (round-trip save & restore with stripped volatile telemetry)
 * 7. Page-exit persistence (flushPendingWorkspaceAutosave executes immediate write)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveWorkspaceAutosaveImmediate,
  saveWorkspaceAutosaveDebounced,
  flushPendingWorkspaceAutosave,
  loadWorkspaceAutosaveWithValidation,
  STORAGE_KEYS,
  sanitizeNodesForPersistence,
  sanitizeEdgesForPersistence,
} from '../workspacePersistence';
import { Node, Edge } from 'reactflow';
import { CircuitElementData } from '../../types/circuit';

// In-memory mock Storage implementation
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

describe('Workspace Persistence & Autosave Engine', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
    vi.useRealTimers();
  });

  it('Scenario 1: First-time use detects clean storage and returns "first_time"', () => {
    const result = loadWorkspaceAutosaveWithValidation(mockStorage);
    expect(result.status).toBe('first_time');
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('Scenario 2: Valid empty workspace is preserved and returns "empty_workspace"', () => {
    // User intentionally cleared canvas
    saveWorkspaceAutosaveImmediate([], [], mockStorage);

    const result = loadWorkspaceAutosaveWithValidation(mockStorage);
    expect(result.status).toBe('empty_workspace');
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
    expect(result.updatedAt).toBeDefined();
  });

  it('Scenario 3: Corrupted data handles malformed JSON and schema violations gracefully', () => {
    // 3a. Malformed JSON syntax
    mockStorage.setItem(STORAGE_KEYS.AUTOSAVE, '{ invalid json syntax ...');
    const malformedResult = loadWorkspaceAutosaveWithValidation(mockStorage);
    expect(malformedResult.status).toBe('corrupted');
    expect(malformedResult.errorMessage).toContain('Malformed JSON');

    // 3b. Missing nodes or edges array
    mockStorage.setItem(STORAGE_KEYS.AUTOSAVE, JSON.stringify({ version: '2.0.0', updatedAt: 123 }));
    const invalidSchemaResult = loadWorkspaceAutosaveWithValidation(mockStorage);
    expect(invalidSchemaResult.status).toBe('corrupted');
    expect(invalidSchemaResult.errorMessage).toContain('missing valid nodes or edges arrays');

    // 3c. Empty string in storage
    mockStorage.setItem(STORAGE_KEYS.AUTOSAVE, '   ');
    const emptyResult = loadWorkspaceAutosaveWithValidation(mockStorage);
    expect(emptyResult.status).toBe('corrupted');
  });

  it('Scenario 4: Schema migration converts legacy wired bulbs into sockets and removes dangling edges', () => {
    // Legacy circuit with wired 'bulb' node and a self-looping edge
    const legacyNodes: Node<CircuitElementData>[] = [
      {
        id: 'legacy_bulb_1',
        type: 'bulb',
        position: { x: 100, y: 100 },
        data: {
          id: 'legacy_bulb_1',
          type: 'bulb',
          label: 'Lampu Pijar',
          bulbType: 'incandescent',
          resistance: 40,
        },
      },
      {
        id: 'bat_1',
        type: 'battery',
        position: { x: 50, y: 50 },
        data: {
          id: 'bat_1',
          type: 'battery',
          label: 'Baterai 1.5V',
          voltage: 1.5,
        },
      },
    ];

    const legacyEdges: Edge[] = [
      { id: 'w1', source: 'bat_1', sourceHandle: 'pos', target: 'legacy_bulb_1', targetHandle: 'p1' },
      { id: 'self_loop', source: 'bat_1', target: 'bat_1' }, // Self loop
      { id: 'dangling', source: 'bat_1', target: 'non_existent_node' }, // Dangling
    ];

    mockStorage.setItem(
      STORAGE_KEYS.AUTOSAVE,
      JSON.stringify({
        nodes: legacyNodes,
        edges: legacyEdges,
        updatedAt: Date.now(),
      })
    );

    const result = loadWorkspaceAutosaveWithValidation(mockStorage);
    expect(result.status).toBe('restored');

    // The wired bulb should have migrated to a 'socket' node with installedBulb
    const migratedSocket = result.nodes.find((n) => n.id === 'legacy_bulb_1');
    expect(migratedSocket).toBeDefined();
    expect(migratedSocket?.type).toBe('socket');
    expect(migratedSocket?.data.installedBulb).toBeDefined();

    // Self-loop and dangling edges should be purged
    expect(result.edges.some((e) => e.id === 'self_loop')).toBe(false);
    expect(result.edges.some((e) => e.id === 'dangling')).toBe(false);
    expect(result.edges.length).toBe(1);
    expect(result.edges[0].id).toBe('w1');
  });

  it('Scenario 5: Rapid edits are debounced to avoid disk I/O thrashing', () => {
    vi.useFakeTimers();

    const testNodes: Node<CircuitElementData>[] = [
      {
        id: 'n1',
        type: 'resistor',
        position: { x: 0, y: 0 },
        data: { id: 'n1', type: 'resistor', label: 'R1', resistance: 100 },
      },
    ];

    // Trigger 10 rapid debounced saves
    for (let i = 0; i < 10; i++) {
      saveWorkspaceAutosaveDebounced(testNodes, [], 500, mockStorage);
    }

    // Nothing written immediately
    expect(mockStorage.getItem(STORAGE_KEYS.AUTOSAVE)).toBeNull();

    // Fast-forward by 499ms: still nothing
    vi.advanceTimersByTime(499);
    expect(mockStorage.getItem(STORAGE_KEYS.AUTOSAVE)).toBeNull();

    // Fast-forward by remaining 2ms: debounced write fires once
    vi.advanceTimersByTime(2);
    expect(mockStorage.getItem(STORAGE_KEYS.AUTOSAVE)).not.toBeNull();

    const stored = JSON.parse(mockStorage.getItem(STORAGE_KEYS.AUTOSAVE)!);
    expect(stored.nodes.length).toBe(1);
  });

  it('Scenario 6: Reload recovery preserves user circuit and strips volatile simulation telemetry', () => {
    const rawNodes: Node<CircuitElementData>[] = [
      {
        id: 'r_load',
        type: 'resistor',
        position: { x: 200, y: 150 },
        data: {
          id: 'r_load',
          type: 'resistor',
          label: 'Load Resistor',
          resistance: 220,
          // Volatile simulation properties that should be stripped:
          calculatedVoltage: 8.95,
          calculatedCurrent: 0.0406,
          calculatedPower: 0.363,
          isShortCircuit: false,
          isBlown: false,
        },
      },
    ];

    saveWorkspaceAutosaveImmediate(rawNodes, [], mockStorage);

    // Read raw stored JSON to verify volatile fields were removed
    const storedJson = JSON.parse(mockStorage.getItem(STORAGE_KEYS.AUTOSAVE)!);
    const storedNodeData = storedJson.nodes[0].data;
    expect(storedNodeData.resistance).toBe(220);
    expect(storedNodeData.calculatedVoltage).toBeUndefined();
    expect(storedNodeData.calculatedCurrent).toBeUndefined();
    expect(storedNodeData.calculatedPower).toBeUndefined();

    // Load back via validation engine
    const result = loadWorkspaceAutosaveWithValidation(mockStorage);
    expect(result.status).toBe('restored');
    expect(result.nodes.length).toBe(1);
    expect(result.nodes[0].id).toBe('r_load');
    expect(result.nodes[0].data.resistance).toBe(220);
  });

  it('Scenario 7: Page-exit persistence (flushPendingWorkspaceAutosave) forces immediate save', () => {
    vi.useFakeTimers();

    const testNodes: Node<CircuitElementData>[] = [
      {
        id: 'exit_node',
        type: 'switch',
        position: { x: 50, y: 50 },
        data: { id: 'exit_node', type: 'switch', label: 'Saklar Utama', isOpen: false },
      },
    ];

    // Queue a debounced save with a 3000ms delay
    saveWorkspaceAutosaveDebounced(testNodes, [], 3000, mockStorage);
    expect(mockStorage.getItem(STORAGE_KEYS.AUTOSAVE)).toBeNull();

    // User suddenly closes the tab -> flushPendingWorkspaceAutosave is invoked
    const flushed = flushPendingWorkspaceAutosave(mockStorage);
    expect(flushed).toBe(true);

    // Item must be immediately written to disk
    expect(mockStorage.getItem(STORAGE_KEYS.AUTOSAVE)).not.toBeNull();
    const stored = JSON.parse(mockStorage.getItem(STORAGE_KEYS.AUTOSAVE)!);
    expect(stored.nodes[0].id).toBe('exit_node');
  });

  it('Scenario 8: sanitizeNodesForPersistence and sanitizeEdgesForPersistence strip volatile fields directly', () => {
    const rawNodes: Node<CircuitElementData>[] = [
      {
        id: 'node_1',
        type: 'battery',
        position: { x: 0, y: 0 },
        data: { id: 'node_1', type: 'battery', label: 'Bat', calculatedVoltage: 1.5, voltage: 1.5 },
      },
    ];
    const sanitized = sanitizeNodesForPersistence(rawNodes);
    expect(sanitized[0].data.calculatedVoltage).toBeUndefined();
    expect(sanitized[0].data.voltage).toBe(1.5);

    const edges: Edge[] = [
      { id: 'e1', source: 'node_1', target: 'node_1' }, // self-loop
      { id: 'e2', source: 'node_1', target: 'missing' }, // dangling
    ];
    const cleanEdges = sanitizeEdgesForPersistence(edges, sanitized);
    expect(cleanEdges).toHaveLength(0);
  });
});
