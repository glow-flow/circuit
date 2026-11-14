import { describe, it, expect, beforeEach } from 'vitest';
import { Edge, Node } from 'reactflow';
import { CircuitElementData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import {
  buildOutdoorRadarMarkers,
  computeEdgeAutoPanVelocity,
  extractPointerClientPoint,
  findNearestOffscreenTowerJump,
  findQuickWireTargets,
  getConnectableHandlesForComponent,
  getHandleDisplayName,
} from '../canvasWireAssist';

function makeOutdoorNode(
  id: string,
  type: CircuitElementData['type'],
  label: string,
  x: number,
  y: number = 300
): Node<CircuitElementData> {
  return {
    id,
    type,
    position: { x, y },
    data: {
      id,
      type,
      label,
      worldMode: 'outside',
    },
  };
}

describe('Cross-Viewport Wiring & Panoramic Navigation (canvasWireAssist)', () => {
  beforeEach(() => {
    useCircuitStore.getState().clearPendingWireStart();
  });

  it('classifies connectable handles cleanly and ignores unmounted bulbs', () => {
    expect(getConnectableHandlesForComponent('bulb')).toEqual([]);
    expect(getConnectableHandlesForComponent('hydro-turbine').map((h) => h.handleId)).toEqual([
      'pos',
      'neg',
    ]);
    expect(getConnectableHandlesForComponent('switch').map((h) => h.handleId)).toEqual([
      'p1',
      'p2',
    ]);
    expect(getHandleDisplayName('pos', true)).toBe('+');
    expect(getHandleDisplayName('neg', true)).toBe('-');
  });

  it('prioritizes off-screen Transmission Tower when user taps Hydro pin on mobile viewport', () => {
    const nodes: Node<CircuitElementData>[] = [
      makeOutdoorNode('solar_1', 'solar-panel', 'Panel Surya', 120),
      makeOutdoorNode('tower_1', 'transmission-tower', 'Menara Transmisi', 440),
      makeOutdoorNode('hydro_1', 'hydro-turbine', 'Turbin Mikrohidro', 900),
    ];

    // Mobile camera panned far right around the river & Hydro Turbine (360px screen: 850..1210)
    const targets = findQuickWireTargets(
      nodes,
      [],
      { nodeId: 'hydro_1', handleId: 'pos', worldScope: 'outside' },
      { left: 850, right: 1210 },
      true
    );

    expect(targets.length).toBe(2);
    expect(targets[0].nodeId).toBe('tower_1');
    expect(targets[0].isPriorityTower).toBe(true);
    expect(targets[0].handleId).toBe('pos');
    expect(targets[0].isOffscreen).toBe(true);
    expect(targets[0].offscreenDirection).toBe('left');
  });

  it('skips already-wired pin pairs and suggests remaining polarity handle on the tower', () => {
    const nodes: Node<CircuitElementData>[] = [
      makeOutdoorNode('tower_1', 'transmission-tower', 'Menara Transmisi', 440),
      makeOutdoorNode('hydro_1', 'hydro-turbine', 'Turbin Mikrohidro', 900),
    ];
    const edges: Edge[] = [
      {
        id: 'w1',
        source: 'hydro_1',
        sourceHandle: 'pos',
        target: 'tower_1',
        targetHandle: 'pos',
      },
    ];

    const targets = findQuickWireTargets(
      nodes,
      edges,
      { nodeId: 'hydro_1', handleId: 'neg', worldScope: 'outside' },
      { left: 850, right: 1210 },
      true
    );

    expect(targets[0].nodeId).toBe('tower_1');
    expect(targets[0].handleId).toBe('neg');
  });

  it('computes accurate panoramic radar markers and off-screen Menara quick-jump target', () => {
    const nodes: Node<CircuitElementData>[] = [
      makeOutdoorNode('solar_1', 'solar-panel', 'Panel Surya', 120),
      makeOutdoorNode('tower_1', 'transmission-tower', 'Menara Transmisi', 440),
      makeOutdoorNode('hydro_1', 'hydro-turbine', 'Turbin Mikrohidro', 900),
    ];

    const markers = buildOutdoorRadarMarkers(nodes, 1360);
    expect(markers).toHaveLength(3);
    const towerMarker = markers.find((m) => m.id === 'tower_1')!;
    expect(towerMarker.category).toBe('tower');
    expect(towerMarker.ratioX).toBeGreaterThan(0.3);
    expect(towerMarker.ratioX).toBeLessThan(0.5);

    const jump = findNearestOffscreenTowerJump(nodes, 850, 360, 1360, true);
    expect(jump).not.toBeNull();
    expect(jump!.nodeId).toBe('tower_1');
    expect(jump!.direction).toBe('left');
    expect(jump!.label).toBe('Menara');
    expect(jump!.isTower).toBe(true);
  });

  it('returns directional edge auto-pan velocities only near left/right viewport margins', () => {
    const rect = { left: 0, right: 360 };
    expect(computeEdgeAutoPanVelocity(180, rect)).toBe(0);
    expect(computeEdgeAutoPanVelocity(10, rect)).toBeLessThan(0);
    expect(computeEdgeAutoPanVelocity(350, rect)).toBeGreaterThan(0);
    expect(computeEdgeAutoPanVelocity(Number.NaN, rect)).toBe(0);
  });

  it('extracts pointer coordinates safely from MouseEvent, TouchEvent, or null', () => {
    expect(extractPointerClientPoint(null)).toBeNull();
    expect(extractPointerClientPoint({ clientX: 120, clientY: 240 })).toEqual({
      clientX: 120,
      clientY: 240,
    });
    expect(
      extractPointerClientPoint({
        changedTouches: [{ clientX: 88, clientY: 312 }],
      } as unknown as TouchEvent)
    ).toEqual({
      clientX: 88,
      clientY: 312,
    });
  });

  it('completes Two-Tap Pin Wiring in Zustand store across off-screen components and prevents self-loops', () => {
    const store = useCircuitStore.getState();
    store.setWorldMode('outside');
    store.clearCanvas();

    store.placeOutdoorComponent('hydro-turbine', { x: 900, y: 300 }, { width: 1360, height: 680 });
    store.placeOutdoorComponent(
      'transmission-tower',
      { x: 440, y: 260 },
      { width: 1360, height: 680 }
    );

    const freshNodes = useCircuitStore.getState().nodes;
    const hydro = freshNodes.find((n) => n.data.type === 'hydro-turbine')!;
    const tower = freshNodes.find((n) => n.data.type === 'transmission-tower')!;
    expect(hydro).toBeDefined();
    expect(tower).toBeDefined();

    // Tap Pin 1: Hydro (+)
    useCircuitStore.getState().setPendingWireStart({
      nodeId: hydro.id,
      handleId: 'pos',
      worldScope: 'outside',
    });
    expect(useCircuitStore.getState().pendingWireStart?.nodeId).toBe(hydro.id);

    // Self-loop guard: tapping Hydro (-) cancels cleanly without adding an edge
    const edgeCountBefore = useCircuitStore.getState().edges.length;
    const selfLoopResult = useCircuitStore.getState().completePendingWireConnection(hydro.id, 'neg');
    expect(selfLoopResult).toBe(false);
    expect(useCircuitStore.getState().edges.length).toBe(edgeCountBefore);
    expect(useCircuitStore.getState().pendingWireStart).toBeNull();

    // Valid 2-tap cross-viewport connection: Hydro (+) -> off-screen Tower (+)
    useCircuitStore.getState().setPendingWireStart({
      nodeId: hydro.id,
      handleId: 'pos',
      worldScope: 'outside',
    });
    const wiredResult = useCircuitStore.getState().completePendingWireConnection(tower.id, 'pos');
    expect(wiredResult).toBe(true);
    expect(useCircuitStore.getState().edges.length).toBe(edgeCountBefore + 1);
    expect(useCircuitStore.getState().pendingWireStart).toBeNull();
  });
});
