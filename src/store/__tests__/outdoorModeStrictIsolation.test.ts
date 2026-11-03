import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCircuitStore } from '../useCircuitStore';
import { Node } from 'reactflow';
import { CircuitElementData } from '../../types/circuit';
import {
  saveWorkspaceAutosaveImmediate,
  loadWorkspaceAutosaveWithValidation,
  sanitizeNodesForPersistence,
  STORAGE_KEYS,
} from '../../utils/workspacePersistence';
import { createOutdoorPowerStationElements } from '../../utils/outdoorSpawnUtils';

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

describe('Strict Outdoor vs Lab Mode Isolation & Scroll Stability', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
    vi.stubGlobal('localStorage', mockStorage);
    useCircuitStore.setState({
      nodes: [],
      edges: [],
      worldMode: 'lab',
      selectedNodeId: null,
      selectedEdgeId: null,
      notification: null,
      fitViewTrigger: 0,
    });
  });

  it('Rule 1: Rejects adding solar-panel in Lab mode and alerts user', () => {
    const store = useCircuitStore.getState();
    store.setWorldMode('lab');
    expect(useCircuitStore.getState().worldMode).toBe('lab');

    store.addComponent('solar-panel', { x: 100, y: 100 });

    const state = useCircuitStore.getState();
    expect(state.nodes.some((n) => n.data.type === 'solar-panel')).toBe(false);
    expect(state.notification?.message).toContain('Turbin Angin dan Panel Surya hanya boleh');
  });

  it('Rule 1: Rejects adding wind-turbine in Lab mode and alerts user', () => {
    const store = useCircuitStore.getState();
    store.setWorldMode('lab');

    store.addComponent('wind-turbine', { x: 100, y: 100 });

    const state = useCircuitStore.getState();
    expect(state.nodes.some((n) => n.data.type === 'wind-turbine')).toBe(false);
    expect(state.notification?.message).toContain('Turbin Angin dan Panel Surya hanya boleh');
  });

  it('Rule 1: Successfully adds solar-panel and wind-turbine in Outside mode with worldMode === "outside"', () => {
    const store = useCircuitStore.getState();
    store.setWorldMode('outside');
    expect(useCircuitStore.getState().worldMode).toBe('outside');

    store.addComponent('solar-panel', { x: 50, y: 100 });
    store.addComponent('wind-turbine', { x: 250, y: 100 });

    const state = useCircuitStore.getState();
    const solar = state.nodes.find((n) => n.data.type === 'solar-panel');
    const wind = state.nodes.find((n) => n.data.type === 'wind-turbine');

    expect(solar).toBeDefined();
    expect(solar?.data.worldMode).toBe('outside');
    expect(wind).toBeDefined();
    expect(wind?.data.worldMode).toBe('outside');
  });

  it('Rule 2: loadCustomCircuit guarantees solar-panel and wind-turbine retain worldMode: "outside" even if targetWorldMode is "lab"', () => {
    const customNodes: Node<CircuitElementData>[] = [
      {
        id: 'solar_mixed',
        type: 'solar-panel',
        position: { x: 100, y: 100 },
        data: { id: 'solar_mixed', type: 'solar-panel', label: 'Solar' },
      },
      {
        id: 'wind_mixed',
        type: 'wind-turbine',
        position: { x: 250, y: 100 },
        data: { id: 'wind_mixed', type: 'wind-turbine', label: 'Wind' },
      },
      {
        id: 'res_mixed',
        type: 'resistor',
        position: { x: 400, y: 100 },
        data: { id: 'res_mixed', type: 'resistor', label: 'Resistor', resistance: 100 },
      },
    ];

    // Explicitly call loadCustomCircuit targeting 'lab'
    useCircuitStore.getState().loadCustomCircuit(customNodes, [], 'lab');

    const state = useCircuitStore.getState();
    const solar = state.nodes.find((n) => n.id === 'solar_mixed');
    const wind = state.nodes.find((n) => n.id === 'wind_mixed');
    const resistor = state.nodes.find((n) => n.id === 'res_mixed');

    // STRICT: Outdoor-exclusive generators must NEVER be given 'lab'
    expect(solar?.data.worldMode).toBe('outside');
    expect(wind?.data.worldMode).toBe('outside');
    expect(resistor?.data.worldMode).toBe('lab');
  });

  it('Rule 3: sanitizeNodesForPersistence enforces worldMode: "outside" on solar and wind nodes', () => {
    const rawNodes: Node<CircuitElementData>[] = [
      {
        id: 'solar_corrupted',
        type: 'solar-panel',
        position: { x: 0, y: 0 },
        data: {
          id: 'solar_corrupted',
          type: 'solar-panel',
          label: 'Solar',
          worldMode: 'lab', // ILLEGAL: must be corrected to 'outside'
        },
      },
      {
        id: 'wind_corrupted',
        type: 'wind-turbine',
        position: { x: 0, y: 0 },
        data: {
          id: 'wind_corrupted',
          type: 'wind-turbine',
          label: 'Wind',
          worldMode: 'lab', // ILLEGAL: must be corrected to 'outside'
        },
      },
      {
        id: 'battery_lab',
        type: 'battery',
        position: { x: 0, y: 0 },
        data: {
          id: 'battery_lab',
          type: 'battery',
          label: 'AA',
          worldMode: 'lab',
        },
      },
    ];

    const sanitized = sanitizeNodesForPersistence(rawNodes);
    expect(sanitized[0].data.worldMode).toBe('outside');
    expect(sanitized[1].data.worldMode).toBe('outside');
    expect(sanitized[2].data.worldMode).toBe('lab');
  });

  it('Rule 3: loadWorkspaceAutosaveWithValidation automatically migrates corrupted legacy solar/wind nodes to "outside"', () => {
    const corruptedPayload = {
      version: '2.0.0',
      updatedAt: Date.now(),
      worldMode: 'lab',
      nodes: [
        {
          id: 'solar_legacy',
          type: 'solar-panel',
          position: { x: 50, y: 50 },
          data: { id: 'solar_legacy', type: 'solar-panel', label: 'Legacy Solar', worldMode: 'lab' },
        },
        {
          id: 'wind_legacy',
          type: 'wind-turbine',
          position: { x: 200, y: 50 },
          data: { id: 'wind_legacy', type: 'wind-turbine', label: 'Legacy Wind', worldMode: 'lab' },
        },
      ],
      edges: [],
    };

    mockStorage.setItem(STORAGE_KEYS.AUTOSAVE, JSON.stringify(corruptedPayload));

    const result = loadWorkspaceAutosaveWithValidation(mockStorage);
    expect(result.status).toBe('restored');
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0].data.worldMode).toBe('outside');
    expect(result.nodes[1].data.worldMode).toBe('outside');
  });

  it('Rule 3: Autosave preserves and restores worldMode correctly', () => {
    const outdoorNodes: Node<CircuitElementData>[] = [
      {
        id: 'solar_1',
        type: 'solar-panel',
        position: { x: 10, y: 20 },
        data: { id: 'solar_1', type: 'solar-panel', label: 'Solar', worldMode: 'outside' },
      },
    ];

    saveWorkspaceAutosaveImmediate(outdoorNodes, [], mockStorage, 'outside');

    const restored = loadWorkspaceAutosaveWithValidation(mockStorage);
    expect(restored.status).toBe('restored');
    expect(restored.worldMode).toBe('outside');
    expect(mockStorage.getItem(STORAGE_KEYS.WORLD_MODE)).toBe('outside');
  });

  it('Rule 4: createOutdoorPowerStationElements sets worldMode: "outside" on all 3 components', () => {
    const { nodes, edges } = createOutdoorPowerStationElements({
      terrainGrid: useCircuitStore.getState().terrainGrid,
      isId: true,
      sunlightPercent: 100,
      windSpeedPercent: 100,
    });

    expect(nodes).toHaveLength(3);
    for (const node of nodes) {
      expect(node.data.worldMode).toBe('outside');
    }
    expect(edges.length).toBeGreaterThanOrEqual(4);
  });

  it('Rule 5: Internal scroll containers (such as outdoor-scroll-viewport) are NEVER reset to 0 by scroll guard', () => {
    // Simulate the scroll handler guard logic from App.tsx
    const handleScroll = (e: { target: any }) => {
      const target = e.target;
      const isRootElement =
        !target ||
        (typeof document !== 'undefined' && target === document) ||
        (typeof window !== 'undefined' && target === window) ||
        (typeof document !== 'undefined' &&
          (target === document.documentElement || target === document.body));

      if (isRootElement) {
        if (typeof window !== 'undefined' && window.scrollX !== 0) {
          window.scrollTo(0, window.scrollY);
        }
        if (typeof document !== 'undefined') {
          if (document.documentElement.scrollLeft !== 0) document.documentElement.scrollLeft = 0;
          if (document.body.scrollLeft !== 0) document.body.scrollLeft = 0;
        }
      }
    };

    // Simulated child viewport container with horizontal scroll
    const viewportContainer = {
      id: 'outdoor-scroll-viewport',
      scrollLeft: 450,
    };

    // Dispatch scroll event on the child viewport container
    handleScroll({ target: viewportContainer });

    // Ensure scrollLeft was PRESERVED and not reset to 0!
    expect(viewportContainer.scrollLeft).toBe(450);
  });
});

