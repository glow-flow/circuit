import { beforeEach, describe, expect, it } from 'vitest';
import { useCircuitStore } from '../useCircuitStore';

describe('Workspace Undo & 1-Tap Quick Socket/Bulb Mounting', () => {
  beforeEach(() => {
    useCircuitStore.setState({
      nodes: [],
      edges: [],
      undoStack: [],
      canUndo: false,
      worldMode: 'lab',
      language: 'id',
      notification: null,
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  });

  it('restores a deleted component and its wire after undo()', () => {
    const store = useCircuitStore.getState();
    store.addComponent('battery9v', { x: 0, y: 0 });
    store.addComponent('resistor', { x: 200, y: 0 });
    const [bat, res] = useCircuitStore.getState().nodes;

    useCircuitStore.getState().onConnect({
      source: bat.id,
      sourceHandle: 'pos',
      target: res.id,
      targetHandle: 'p1',
    });

    expect(useCircuitStore.getState().nodes).toHaveLength(2);
    expect(useCircuitStore.getState().edges).toHaveLength(1);
    expect(useCircuitStore.getState().canUndo).toBe(true);

    // Delete the resistor (also deletes attached wire)
    useCircuitStore.getState().removeComponent(res.id);
    expect(useCircuitStore.getState().nodes).toHaveLength(1);
    expect(useCircuitStore.getState().edges).toHaveLength(0);

    // Undo restores both resistor and its wire
    useCircuitStore.getState().undo();
    expect(useCircuitStore.getState().nodes).toHaveLength(2);
    expect(useCircuitStore.getState().edges).toHaveLength(1);
  });

  it('restores a cleared canvas via undo() and enforces 20-step bounded history', () => {
    for (let i = 0; i < 25; i++) {
      useCircuitStore.getState().addComponent('resistor', { x: i * 10, y: 0 });
    }
    expect(useCircuitStore.getState().undoStack.length).toBeLessThanOrEqual(20);

    useCircuitStore.getState().clearCanvas();
    expect(useCircuitStore.getState().nodes).toHaveLength(0);

    useCircuitStore.getState().undo();
    expect(useCircuitStore.getState().nodes).toHaveLength(25);
  });

  it('quickInstallBulbInSocket installs compatible bulbs in 1 tap and rejects incompatible bases', () => {
    useCircuitStore.getState().addComponent('socket', { x: 100, y: 100 });
    useCircuitStore.getState().addComponent('pin-socket', { x: 300, y: 100 });
    const e27 = useCircuitStore.getState().nodes.find((n) => n.data.type === 'socket')!;
    const pin = useCircuitStore.getState().nodes.find((n) => n.data.type === 'pin-socket')!;

    // Reject pin bulb in E27 socket
    expect(useCircuitStore.getState().quickInstallBulbInSocket(e27.id, 'halogen')).toBe(false);
    // Accept LED in E27 socket
    expect(useCircuitStore.getState().quickInstallBulbInSocket(e27.id, 'led_standard')).toBe(true);
    const updatedE27 = useCircuitStore.getState().nodes.find((n) => n.id === e27.id)!;
    expect((updatedE27.data.installedBulb as { bulbType: string })?.bulbType).toBe('led_standard');

    // Reject screw bulb in Pin socket
    expect(useCircuitStore.getState().quickInstallBulbInSocket(pin.id, 'incandescent')).toBe(false);
    // Accept green indicator LED in Pin socket
    expect(useCircuitStore.getState().quickInstallBulbInSocket(pin.id, 'led_green')).toBe(true);
    const updatedPin = useCircuitStore.getState().nodes.find((n) => n.id === pin.id)!;
    expect((updatedPin.data.installedBulb as { bulbType: string })?.bulbType).toBe('led_green');
  });

  it('quickMountBulbWithSocket spawns the matching E27 or Pin socket and mounts the bulb in 1 tap', () => {
    useCircuitStore.getState().addComponent('bulb', { x: 100, y: 100 }, { bulbType: 'cfl' });
    useCircuitStore.getState().addComponent('bulb', { x: 300, y: 100 }, { bulbType: 'halogen' });
    const cflBulb = useCircuitStore.getState().nodes.find((n) => n.data.bulbType === 'cfl')!;
    const halogenBulb = useCircuitStore.getState().nodes.find((n) => n.data.bulbType === 'halogen')!;

    expect(useCircuitStore.getState().quickMountBulbWithSocket(cflBulb.id)).toBe(true);
    expect(useCircuitStore.getState().quickMountBulbWithSocket(halogenBulb.id)).toBe(true);

    const nodes = useCircuitStore.getState().nodes;
    expect(nodes.filter((n) => n.data.type === 'bulb')).toHaveLength(0);
    const e27Socket = nodes.find((n) => n.data.type === 'socket');
    const pinSocket = nodes.find((n) => n.data.type === 'pin-socket');
    expect((e27Socket?.data.installedBulb as { bulbType: string })?.bulbType).toBe('cfl');
    expect((pinSocket?.data.installedBulb as { bulbType: string })?.bulbType).toBe('halogen');

    // Undo restores the loose halogen bulb
    useCircuitStore.getState().undo();
    expect(useCircuitStore.getState().nodes.some((n) => n.id === halogenBulb.id)).toBe(true);
  });
});
