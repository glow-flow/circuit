import { describe, it, expect, beforeEach } from 'vitest';
import { useCircuitStore } from '../useCircuitStore';
import { BULB_CATALOG, canBulbFitSocket } from '../../constants/bulbCatalog';
import { getBulbSnapPosition } from '../../utils/socketSnap';

/** Places a socket and a bulb, and drops the bulb exactly on the socket's snap point. */
function placeSocketAndBulb(bulbType: 'incandescent' | 'halogen'): { socketId: string; bulbId: string } {
  const store = useCircuitStore.getState();
  store.addComponent('socket', { x: 400, y: 400 });
  store.addComponent('bulb', { x: 0, y: 0 }, { bulbType });

  const placedNodes = useCircuitStore.getState().nodes;
  const socketNode = placedNodes.find((n) => n.data.type === 'socket')!;
  const bulbNode = placedNodes.find((n) => n.data.type === 'bulb')!;

  useCircuitStore.setState({
    nodes: placedNodes.map((n) =>
      n.id === bulbNode.id ? { ...n, position: getBulbSnapPosition(socketNode.position) } : n
    ),
  });
  return { socketId: socketNode.id, bulbId: bulbNode.id };
}

describe('Bulb base types', () => {
  it('marks Halogen and Green Indicator LED as pin base; the 5 threaded bulbs as screw', () => {
    const baseByType = Object.fromEntries(BULB_CATALOG.map((b) => [b.type, b.baseType]));
    expect(baseByType.halogen).toBe('pin');
    expect(baseByType.led_green).toBe('pin');
    expect(baseByType.incandescent).toBe('screw');
    expect(baseByType.edison).toBe('screw');
    expect(baseByType.cfl).toBe('screw');
    expect(baseByType.led_standard).toBe('screw');
    expect(baseByType.led_rgb).toBe('screw');
  });

  it('canBulbFitSocket accepts screw bulbs and rejects pin bulbs', () => {
    expect(canBulbFitSocket('incandescent')).toBe(true);
    expect(canBulbFitSocket('halogen')).toBe(false);
    expect(canBulbFitSocket('led_green')).toBe(false);
  });
});

describe('Socket (fiting) snapping', () => {
  beforeEach(() => {
    useCircuitStore.setState({
      nodes: [],
      edges: [],
      language: 'id',
      notification: null,
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  });

  it('snaps a screw bulb into a nearby socket and links both nodes with hidden wires', () => {
    const { socketId, bulbId } = placeSocketAndBulb('incandescent');
    useCircuitStore.getState().settleBulbAfterDrag(bulbId);

    const { nodes, edges, notification } = useCircuitStore.getState();
    expect(nodes.find((n) => n.id === bulbId)?.data.socketId).toBe(socketId);
    expect(nodes.find((n) => n.id === socketId)?.data.bulbId).toBe(bulbId);
    expect(edges.filter((e) => e.hidden)).toHaveLength(2);
    expect(notification).toBeNull();
  });

  it('rejects a pin-base Halogen bulb with the screw-only notification', () => {
    const { socketId, bulbId } = placeSocketAndBulb('halogen');
    useCircuitStore.getState().settleBulbAfterDrag(bulbId);

    const { nodes, edges, notification } = useCircuitStore.getState();
    expect(nodes.find((n) => n.id === bulbId)?.data.socketId).toBeUndefined();
    expect(nodes.find((n) => n.id === socketId)?.data.bulbId).toBeUndefined();
    expect(edges).toHaveLength(0);
    expect(notification?.message).toBe('Fiting ini hanya untuk lampu ulir (screw)!');
  });

  it('powers the snapped bulb through socket wiring (MNA still works)', () => {
    const store = useCircuitStore.getState();
    store.addComponent('battery9v', { x: 0, y: 0 });
    const batteryId = useCircuitStore.getState().nodes.find((n) => n.data.type === 'battery9v')!.id;
    const { socketId, bulbId } = placeSocketAndBulb('incandescent');
    useCircuitStore.getState().settleBulbAfterDrag(bulbId);

    useCircuitStore.setState({
      edges: [
        ...useCircuitStore.getState().edges,
        { id: 'w1', source: batteryId, sourceHandle: 'pos', target: socketId, targetHandle: 'p1', type: 'wire' },
        { id: 'w2', source: socketId, sourceHandle: 'p2', target: batteryId, targetHandle: 'neg', type: 'wire' },
      ],
    });
    useCircuitStore.getState().runSimulation();

    const { simulation } = useCircuitStore.getState();
    expect(Math.abs(simulation.branchCurrents[bulbId])).toBeGreaterThan(0.005); // ~9V / 800Ω
    expect(Math.abs(simulation.branchCurrents[socketId])).toBeCloseTo(
      Math.abs(simulation.branchCurrents[bulbId]),
      6
    );
  });

  it('detaches the bulb and removes hidden wires, then clears links when the socket is deleted', () => {
    const { socketId, bulbId } = placeSocketAndBulb('incandescent');
    useCircuitStore.getState().settleBulbAfterDrag(bulbId);

    useCircuitStore.getState().detachBulbFromSocket(bulbId);
    let state = useCircuitStore.getState();
    expect(state.edges).toHaveLength(0);
    expect(state.nodes.find((n) => n.id === bulbId)?.data.socketId).toBeUndefined();

    useCircuitStore.getState().settleBulbAfterDrag(bulbId); // re-snap
    useCircuitStore.getState().removeComponent(socketId);
    state = useCircuitStore.getState();
    expect(state.nodes.find((n) => n.id === bulbId)?.data.socketId).toBeUndefined();
    expect(state.edges).toHaveLength(0);
  });

  it('ejects the bulb when its type is switched to a pin-base model inside a socket', () => {
    const { bulbId } = placeSocketAndBulb('incandescent');
    useCircuitStore.getState().settleBulbAfterDrag(bulbId);

    useCircuitStore.getState().setBulbType(bulbId, 'halogen');
    const { nodes, notification } = useCircuitStore.getState();
    expect(nodes.find((n) => n.id === bulbId)?.data.socketId).toBeUndefined();
    expect(notification).not.toBeNull();
  });
});
