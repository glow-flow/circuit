import { describe, it, expect, beforeEach } from 'vitest';
import { useCircuitStore } from '../useCircuitStore';

describe('useCircuitStore.addComponent (variant chosen in palette)', () => {
  beforeEach(() => {
    useCircuitStore.setState({ nodes: [], edges: [], language: 'id' });
  });

  it('places the exact bulb model picked in the palette with its resistance and rating', () => {
    useCircuitStore.getState().addComponent('bulb', { x: 0, y: 0 }, { bulbType: 'halogen' });
    const [placedNode] = useCircuitStore.getState().nodes;

    expect(placedNode.data.bulbType).toBe('halogen');
    expect(placedNode.data.resistance).toBe(1500);
    expect(placedNode.data.powerRating).toBe(50);
    expect(placedNode.data.label).toBe('Lampu Halogen');
  });

  it('falls back to the incandescent bulb when no option is given', () => {
    useCircuitStore.getState().addComponent('bulb', { x: 0, y: 0 });
    const [placedNode] = useCircuitStore.getState().nodes;

    expect(placedNode.data.bulbType).toBe('incandescent');
    expect(placedNode.data.resistance).toBe(800);
  });

  it('keeps non-bulb parts unaffected by placement options', () => {
    useCircuitStore.getState().addComponent('battery9v', { x: 0, y: 0 }, { bulbType: 'led_rgb' });
    const [placedNode] = useCircuitStore.getState().nodes;

    expect(placedNode.data.voltage).toBe(9.0);
    expect(placedNode.data.bulbType).toBeUndefined();
  });
});

describe('Ultimate Power Grid (9V Smart Grid) Preset', () => {
  beforeEach(() => {
    useCircuitStore.setState({ nodes: [], edges: [], language: 'id', fitViewTrigger: 0 });
  });

  it('loads all 7 bulb types, 200Ω & 100Ω resistors, 4 closed switches, 9V battery, voltmeter, and ammeter with active MNA currents', () => {
    useCircuitStore.getState().loadPreset('ultimate-power-grid');
    const state = useCircuitStore.getState();

    expect(state.fitViewTrigger).toBe(1);
    expect(state.simulation.isShortCircuit).toBe(false);

    // Verify all 7 bulb types are mounted in sockets (fiting) and powered
    const socketNodes = state.nodes.filter(
      (n) => n.data.type === 'socket' && Boolean(n.data.installedBulb)
    );
    expect(socketNodes).toHaveLength(7);
    const bulbTypes = socketNodes
      .map((n) =>
        typeof n.data.installedBulb === 'object' && n.data.installedBulb
          ? n.data.installedBulb.bulbType
          : n.data.bulbType
      )
      .sort();
    expect(bulbTypes).toEqual(
      ['cfl', 'edison', 'halogen', 'incandescent', 'led_green', 'led_rgb', 'led_standard'].sort()
    );

    for (const socket of socketNodes) {
      const current = Math.abs(state.simulation.branchCurrents[socket.id] ?? 0);
      expect(current).toBeGreaterThan(0.0005);
    }

    // Verify resistors have exact 200Ω (Zone 1) and 100Ω (Zone 3) values
    const resZone1 = state.nodes.find((n) => n.id === 'res_zone1');
    const resZone3 = state.nodes.find((n) => n.id === 'res_zone3');
    expect(resZone1?.data.resistance).toBe(200);
    expect(resZone3?.data.resistance).toBe(100);

    // Verify all 4 switches are CLOSED (isOpen: false) by default
    const switchNodes = state.nodes.filter((n) => n.data.type === 'switch');
    expect(switchNodes).toHaveLength(4);
    expect(switchNodes.every((s) => s.data.isOpen === false)).toBe(true);

    // Verify edges use smoothstep orthogonal routing
    expect(state.edges.every((e) => e.type === 'smoothstep')).toBe(true);

    // Verify Zone 1 isolation when sw_zone1 is opened
    useCircuitStore.getState().toggleSwitch('sw_zone1');
    const afterZone1Off = useCircuitStore.getState();
    expect(Math.abs(afterZone1Off.simulation.branchCurrents['bulb_incandescent'] ?? 0)).toBeLessThan(
      1e-5
    );
    expect(Math.abs(afterZone1Off.simulation.branchCurrents['bulb_edison'] ?? 0)).toBeGreaterThan(
      0.001
    );
  });
});
