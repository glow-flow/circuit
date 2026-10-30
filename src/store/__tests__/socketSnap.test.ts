import { describe, it, expect, beforeEach } from 'vitest';
import { useCircuitStore } from '../useCircuitStore';
import { BULB_CATALOG, canBulbFitSocket } from '../../constants/bulbCatalog';
import { getBulbSnapPosition, SOCKET_NOTICES } from '../../utils/socketSnap';

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

describe('Socket (fiting) snapping & MNA physics', () => {
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

  it('snaps a screw bulb into a nearby socket and installs it into socket without hidden wires', () => {
    const { socketId, bulbId } = placeSocketAndBulb('incandescent');
    useCircuitStore.getState().settleBulbAfterDrag(bulbId);

    const { nodes, edges, notification } = useCircuitStore.getState();
    const socketNode = nodes.find((n) => n.id === socketId);
    
    // Bulb is installed directly into the socket node
    expect(socketNode?.data.installedBulb).toBeDefined();
    expect((socketNode?.data.installedBulb as any)?.bulbType).toBe('incandescent');
    // Bulb is absorbed from the standalone nodes list
    expect(nodes.find((n) => n.id === bulbId)).toBeUndefined();
    // No hidden wires needed
    expect(edges.filter((e) => e.hidden)).toHaveLength(0);
    expect(notification).toBeNull();
  });

  it('rejects a pin-base Halogen bulb with the screw-only notification', () => {
    const { socketId, bulbId } = placeSocketAndBulb('halogen');
    useCircuitStore.getState().settleBulbAfterDrag(bulbId);

    const { nodes, edges, notification } = useCircuitStore.getState();
    const socketNode = nodes.find((n) => n.id === socketId);
    
    expect(socketNode?.data.installedBulb).toBeUndefined();
    expect(nodes.find((n) => n.id === bulbId)).toBeDefined();
    expect(edges).toHaveLength(0);
    expect(notification?.message).toBe(SOCKET_NOTICES.screwOnly.id);
  });

  it('powers the socket with installedBulb through socket handles (MNA works directly on SocketNode)', () => {
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
    // Current flows through SocketNode based on incandescent bulb resistance (800Ω)
    expect(Math.abs(simulation.branchCurrents[socketId])).toBeGreaterThan(0.005); // ~9V / 800Ω ≈ 0.011A
    expect(Math.abs(simulation.branchCurrents[bulbId])).toBeCloseTo(
      Math.abs(simulation.branchCurrents[socketId]),
      6
    );
  });

  it('an empty socket acts as an open circuit (0 current)', () => {
    const store = useCircuitStore.getState();
    store.addComponent('battery9v', { x: 0, y: 0 });
    const batteryId = useCircuitStore.getState().nodes.find((n) => n.data.type === 'battery9v')!.id;
    store.addComponent('socket', { x: 400, y: 400 });
    const socketId = useCircuitStore.getState().nodes.find((n) => n.data.type === 'socket')!.id;

    useCircuitStore.setState({
      edges: [
        { id: 'w1', source: batteryId, sourceHandle: 'pos', target: socketId, targetHandle: 'p1', type: 'wire' },
        { id: 'w2', source: socketId, sourceHandle: 'p2', target: batteryId, targetHandle: 'neg', type: 'wire' },
      ],
    });
    useCircuitStore.getState().runSimulation();

    const { simulation } = useCircuitStore.getState();
    expect(Math.abs(simulation.branchCurrents[socketId] ?? 0)).toBe(0);
    expect(simulation.isShortCircuit).toBe(false);
  });

  it('detaches the bulb into a standalone node when detached, and empty socket stops conducting', () => {
    const { socketId, bulbId } = placeSocketAndBulb('incandescent');
    useCircuitStore.getState().settleBulbAfterDrag(bulbId);

    // Detach bulb from socket
    useCircuitStore.getState().detachBulbFromSocket(bulbId);
    let state = useCircuitStore.getState();
    
    // Bulb is restored as a standalone node on canvas
    const restoredBulb = state.nodes.find((n) => n.id === bulbId);
    expect(restoredBulb).toBeDefined();
    expect(restoredBulb?.data.type).toBe('bulb');
    
    // Socket is now empty
    const socket = state.nodes.find((n) => n.id === socketId);
    expect(socket?.data.installedBulb).toBeUndefined();
    expect(socket?.data.bulbId).toBeUndefined();
  });

  it('ejects the bulb when its type is switched to a pin-base model inside a socket', () => {
    const { socketId, bulbId } = placeSocketAndBulb('incandescent');
    useCircuitStore.getState().settleBulbAfterDrag(bulbId);

    useCircuitStore.getState().setBulbType(bulbId, 'halogen');
    const { nodes, notification } = useCircuitStore.getState();
    
    // Bulb should be ejected back to canvas
    expect(nodes.find((n) => n.id === socketId)?.data.installedBulb).toBeUndefined();
    expect(nodes.find((n) => n.id === bulbId)).toBeDefined();
    expect(notification).not.toBeNull();
  });

  it('allows direct wiring to pin-base bulbs but blocks direct wiring to screw bulbs', () => {
    useCircuitStore.getState().addComponent('battery9v', { x: 0, y: 0 });
    useCircuitStore.getState().addComponent('bulb', { x: 200, y: 0 }, { bulbType: 'halogen' }); // pin base
    useCircuitStore.getState().addComponent('bulb', { x: 400, y: 0 }, { bulbType: 'incandescent' }); // screw base

    const currentNodes = useCircuitStore.getState().nodes;
    const bat = currentNodes.find((n) => n.data.type === 'battery9v')!;
    const halogen = currentNodes.find((n) => n.data.bulbType === 'halogen')!;
    const incand = currentNodes.find((n) => n.data.bulbType === 'incandescent')!;

    // Connecting to pin bulb (Halogen) should succeed
    useCircuitStore.getState().onConnect({
      source: bat.id,
      sourceHandle: 'pos',
      target: halogen.id,
      targetHandle: 'p1',
    });
    expect(useCircuitStore.getState().edges).toHaveLength(1);

    // Connecting to screw bulb should fail with notification
    useCircuitStore.getState().onConnect({
      source: bat.id,
      sourceHandle: 'pos',
      target: incand.id,
      targetHandle: 'p1',
    });
    expect(useCircuitStore.getState().edges).toHaveLength(1); // unchanged
    expect(useCircuitStore.getState().notification?.message).toContain('Lampu ulir');
  });

  it('loads ultimate-power-grid preset with pin bulbs (halogen & led_green) as direct bulbs and screw bulbs as sockets', () => {
    const store = useCircuitStore.getState();
    store.loadPreset('ultimate-power-grid');

    const nodes = useCircuitStore.getState().nodes;
    const halogen = nodes.find((n) => n.id === 'bulb_halogen');
    const ledGreen = nodes.find((n) => n.id === 'bulb_led_green');
    const incand = nodes.find((n) => n.id === 'bulb_incandescent');
    const edison = nodes.find((n) => n.id === 'bulb_edison');
    const cfl = nodes.find((n) => n.id === 'bulb_cfl');
    const ledRgb = nodes.find((n) => n.id === 'bulb_led_rgb');
    const ledStd = nodes.find((n) => n.id === 'bulb_led_standard');

    expect(halogen?.type).toBe('bulb');
    expect(ledGreen?.type).toBe('bulb');
    expect(incand?.type).toBe('socket');
    expect(edison?.type).toBe('socket');
    expect(cfl?.type).toBe('socket');
    expect(ledRgb?.type).toBe('socket');
    expect(ledStd?.type).toBe('socket');
  });
});
