import { describe, it, expect, beforeEach } from 'vitest';
import { useCircuitStore } from '../useCircuitStore';
import { BULB_CATALOG, BulbType, canBulbFitSocket, canBulbFitPinSocket } from '../../constants/bulbCatalog';
import { getBulbSnapPosition, SOCKET_NOTICES } from '../../utils/socketSnap';

/** Places a socket and a bulb, and drops the bulb exactly on the socket's snap point. */
function placeSocketAndBulb(bulbType: BulbType): { socketId: string; bulbId: string } {
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

  it('canBulbFitPinSocket accepts halogen and rejects screw bulbs', () => {
    expect(canBulbFitPinSocket('halogen')).toBe(true);
    expect(canBulbFitPinSocket('incandescent')).toBe(false);
    expect(canBulbFitPinSocket('edison')).toBe(false);
    expect(canBulbFitPinSocket('cfl')).toBe(false);
    expect(canBulbFitPinSocket('led_standard')).toBe(false);
    expect(canBulbFitPinSocket('led_rgb')).toBe(false);
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

  it('allows direct wiring to indicator LED but blocks direct wiring to screw bulbs and halogen', () => {
    useCircuitStore.getState().addComponent('battery9v', { x: 0, y: 0 });
    useCircuitStore.getState().addComponent('bulb', { x: 200, y: 0 }, { bulbType: 'led_green' }); // loose DIP indicator
    useCircuitStore.getState().addComponent('bulb', { x: 400, y: 0 }, { bulbType: 'halogen' }); // needs pin-socket
    useCircuitStore.getState().addComponent('bulb', { x: 600, y: 0 }, { bulbType: 'incandescent' }); // screw base

    const currentNodes = useCircuitStore.getState().nodes;
    const bat = currentNodes.find((n) => n.data.type === 'battery9v')!;
    const ledGreen = currentNodes.find((n) => n.data.bulbType === 'led_green')!;
    const halogen = currentNodes.find((n) => n.data.bulbType === 'halogen')!;
    const incand = currentNodes.find((n) => n.data.bulbType === 'incandescent')!;

    // Connecting to loose indicator LED (led_green) should succeed
    useCircuitStore.getState().onConnect({
      source: bat.id,
      sourceHandle: 'pos',
      target: ledGreen.id,
      targetHandle: 'p1',
    });
    expect(useCircuitStore.getState().edges).toHaveLength(1);

    // Connecting to detached halogen should fail with notification
    useCircuitStore.getState().onConnect({
      source: bat.id,
      sourceHandle: 'pos',
      target: halogen.id,
      targetHandle: 'p1',
    });
    expect(useCircuitStore.getState().edges).toHaveLength(1); // unchanged
    expect(useCircuitStore.getState().notification?.message).toContain('Lampu Halogen');

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

  it('snaps a CFL screw bulb into a nearby E27 SocketNode and installs it into socket without hidden wires', () => {
    const { socketId, bulbId } = placeSocketAndBulb('cfl' as any);
    useCircuitStore.getState().settleBulbAfterDrag(bulbId);

    const { nodes, edges, notification } = useCircuitStore.getState();
    const socketNode = nodes.find((n) => n.id === socketId);

    expect(socketNode?.data.installedBulb).toBeDefined();
    expect((socketNode?.data.installedBulb as any)?.bulbType).toBe('cfl');
    expect(nodes.find((n) => n.id === bulbId)).toBeUndefined();
    expect(edges.filter((e) => e.hidden)).toHaveLength(0);
    expect(notification).toBeNull();
  });

  it('snaps Halogen into a nearby pin-socket and absorbs it into installedBulb', () => {
    const store = useCircuitStore.getState();
    store.addComponent('pin-socket', { x: 400, y: 400 });
    store.addComponent('bulb', { x: 0, y: 0 }, { bulbType: 'halogen' });

    const placedNodes = useCircuitStore.getState().nodes;
    const pinSocketNode = placedNodes.find((n) => n.data.type === 'pin-socket')!;
    const halogenNode = placedNodes.find((n) => n.data.type === 'bulb')!;

    useCircuitStore.setState({
      nodes: placedNodes.map((n) =>
        n.id === halogenNode.id ? { ...n, position: getBulbSnapPosition(pinSocketNode.position) } : n
      ),
    });

    useCircuitStore.getState().settleBulbAfterDrag(halogenNode.id);

    const { nodes, notification } = useCircuitStore.getState();
    const updatedSocket = nodes.find((n) => n.id === pinSocketNode.id);

    expect(updatedSocket?.data.installedBulb).toBeDefined();
    expect((updatedSocket?.data.installedBulb as any)?.bulbType).toBe('halogen');
    expect(nodes.find((n) => n.id === halogenNode.id)).toBeUndefined();
    expect(notification).toBeNull();
  });

  it('rejects a screw bulb when dropped onto a pin-socket', () => {
    const store = useCircuitStore.getState();
    store.addComponent('pin-socket', { x: 400, y: 400 });
    store.addComponent('bulb', { x: 0, y: 0 }, { bulbType: 'incandescent' });

    const placedNodes = useCircuitStore.getState().nodes;
    const pinSocketNode = placedNodes.find((n) => n.data.type === 'pin-socket')!;
    const screwBulbNode = placedNodes.find((n) => n.data.type === 'bulb')!;

    useCircuitStore.setState({
      nodes: placedNodes.map((n) =>
        n.id === screwBulbNode.id ? { ...n, position: getBulbSnapPosition(pinSocketNode.position) } : n
      ),
    });

    useCircuitStore.getState().settleBulbAfterDrag(screwBulbNode.id);

    const { nodes, notification } = useCircuitStore.getState();
    const updatedSocket = nodes.find((n) => n.id === pinSocketNode.id);

    expect(updatedSocket?.data.installedBulb).toBeUndefined();
    expect(nodes.find((n) => n.id === screwBulbNode.id)).toBeDefined();
    expect(notification?.message).toBe(SOCKET_NOTICES.pinOnly.id);
  });

  it('rejects a CFL screw bulb when dropped onto a pin-socket with push away', () => {
    const store = useCircuitStore.getState();
    store.addComponent('pin-socket', { x: 400, y: 400 });
    store.addComponent('bulb', { x: 0, y: 0 }, { bulbType: 'cfl' });

    const placedNodes = useCircuitStore.getState().nodes;
    const pinSocketNode = placedNodes.find((n) => n.data.type === 'pin-socket')!;
    const cflBulbNode = placedNodes.find((n) => n.data.type === 'bulb')!;

    useCircuitStore.setState({
      nodes: placedNodes.map((n) =>
        n.id === cflBulbNode.id ? { ...n, position: getBulbSnapPosition(pinSocketNode.position) } : n
      ),
    });

    useCircuitStore.getState().settleBulbAfterDrag(cflBulbNode.id);

    const { nodes, notification } = useCircuitStore.getState();
    const updatedSocket = nodes.find((n) => n.id === pinSocketNode.id);
    const rejectedCfl = nodes.find((n) => n.id === cflBulbNode.id);

    expect(updatedSocket?.data.installedBulb).toBeUndefined();
    expect(rejectedCfl).toBeDefined();
    // Bulb is pushed away to the side
    expect(rejectedCfl?.position.x).toBeGreaterThan(pinSocketNode.position.x);
    expect(notification?.message).toBe(SOCKET_NOTICES.pinOnly.id);
  });

  it('detaches Halogen from pin-socket, recreating standalone bulb node on canvas', () => {
    const store = useCircuitStore.getState();
    store.addComponent('pin-socket', { x: 400, y: 400 });
    store.addComponent('bulb', { x: 0, y: 0 }, { bulbType: 'halogen' });

    const placedNodes = useCircuitStore.getState().nodes;
    const pinSocketNode = placedNodes.find((n) => n.data.type === 'pin-socket')!;
    const halogenNode = placedNodes.find((n) => n.data.type === 'bulb')!;

    useCircuitStore.setState({
      nodes: placedNodes.map((n) =>
        n.id === halogenNode.id ? { ...n, position: getBulbSnapPosition(pinSocketNode.position) } : n
      ),
    });

    useCircuitStore.getState().settleBulbAfterDrag(halogenNode.id);
    useCircuitStore.getState().detachBulbFromSocket(pinSocketNode.id);

    const { nodes } = useCircuitStore.getState();
    const restoredHalogen = nodes.find((n) => n.id === halogenNode.id);
    const emptySocket = nodes.find((n) => n.id === pinSocketNode.id);

    expect(restoredHalogen).toBeDefined();
    expect(restoredHalogen?.data.bulbType).toBe('halogen');
    expect(emptySocket?.data.installedBulb).toBeUndefined();
  });

  it('an empty PinSocketNode acts as an open circuit (0 current through pin-socket)', () => {
    const store = useCircuitStore.getState();
    store.addComponent('battery9v', { x: 0, y: 0 });
    const batteryId = useCircuitStore.getState().nodes.find((n) => n.data.type === 'battery9v')!.id;
    store.addComponent('pin-socket', { x: 400, y: 400 });
    const pinSocketId = useCircuitStore.getState().nodes.find((n) => n.data.type === 'pin-socket')!.id;

    useCircuitStore.setState({
      edges: [
        { id: 'pw1', source: batteryId, sourceHandle: 'pos', target: pinSocketId, targetHandle: 'p1', type: 'wire' },
        { id: 'pw2', source: pinSocketId, sourceHandle: 'p2', target: batteryId, targetHandle: 'neg', type: 'wire' },
      ],
    });
    useCircuitStore.getState().runSimulation();

    const { simulation } = useCircuitStore.getState();
    expect(Math.abs(simulation.branchCurrents[pinSocketId] ?? 0)).toBe(0);
    expect(simulation.isShortCircuit).toBe(false);
  });

  it('loads ultimate-power-grid preset with screw sockets, pin-socket for halogen, and direct bulb for indicator LED', () => {
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

    expect(halogen?.type).toBe('pin-socket');
    expect(ledGreen?.type).toBe('bulb');
    expect(incand?.type).toBe('socket');
    expect(edison?.type).toBe('socket');
    expect(cfl?.type).toBe('socket');
    expect(ledRgb?.type).toBe('socket');
    expect(ledStd?.type).toBe('socket');
  });
});
