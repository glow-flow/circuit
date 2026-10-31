import { describe, it, expect, beforeEach } from 'vitest';
import { useCircuitStore } from '../useCircuitStore';
import { Node, Edge } from 'reactflow';
import { CircuitElementData } from '../../types/circuit';

describe('useCircuitStore - Lab Panel MCB Protection & Recovery', () => {
  beforeEach(() => {
    useCircuitStore.setState({
      nodes: [],
      edges: [],
      worldMode: 'lab',
      isSimulating: true,
      language: 'id',
    });
  });

  it('rejects MCB reset and alerts user when dead short circuit remains wired', () => {
    // 1. Outdoor Solar Panel (12V) connected to Outdoor Transmission Tower
    const solarNode: Node<CircuitElementData> = {
      id: 'solar_outdoor',
      type: 'solar-panel',
      position: { x: -200, y: 0 },
      data: {
        id: 'solar_outdoor',
        type: 'solar-panel',
        label: 'Panel Surya',
        worldMode: 'outside',
        voltage: 12.0,
        sunlight: 100,
      },
    };

    const outdoorTowerNode: Node<CircuitElementData> = {
      id: 'tower_outdoor',
      type: 'transmission-tower',
      position: { x: 0, y: 0 },
      data: {
        id: 'tower_outdoor',
        type: 'transmission-tower',
        label: 'Menara Transmisi Luar',
        worldMode: 'outside',
        isMcbOn: true,
        isMcbTripped: false,
      },
    };

    // 2. Indoor Lab Panel (receives power from virtual grid)
    const labPanelNode: Node<CircuitElementData> = {
      id: 'panel_indoor',
      type: 'transmission-tower',
      position: { x: 100, y: 100 },
      data: {
        id: 'panel_indoor',
        type: 'transmission-tower',
        label: 'Panel Distribusi Lab',
        worldMode: 'lab',
        isMcbOn: true,
        isMcbTripped: false,
      },
    };

    // 3. Target component where both panel wires are shorted to the same pin (user screenshot scenario)
    const batteryNode: Node<CircuitElementData> = {
      id: 'bat_1',
      type: 'battery',
      position: { x: 100, y: 300 },
      data: {
        id: 'bat_1',
        type: 'battery',
        label: 'Baterai AA',
        voltage: 1.5,
      },
    };

    // Wires:
    // Solar -> Outdoor Tower
    // Indoor Panel pos & neg -> bat_1:pos (DEAD SHORT)
    const circuitEdges: Edge[] = [
      {
        id: 'wire_solar_pos',
        source: 'solar_outdoor',
        sourceHandle: 'pos',
        target: 'tower_outdoor',
        targetHandle: 'pos',
      },
      {
        id: 'wire_solar_neg',
        source: 'solar_outdoor',
        sourceHandle: 'neg',
        target: 'tower_outdoor',
        targetHandle: 'neg',
      },
      {
        id: 'wire_short_1',
        source: 'panel_indoor',
        sourceHandle: 'pos',
        target: 'bat_1',
        targetHandle: 'pos',
      },
      {
        id: 'wire_short_2',
        source: 'panel_indoor',
        sourceHandle: 'neg',
        target: 'bat_1',
        targetHandle: 'pos',
      },
    ];

    useCircuitStore.setState({
      nodes: [solarNode, outdoorTowerNode, labPanelNode, batteryNode],
      edges: circuitEdges,
    });

    // Run simulation: MCB should automatically trip to protect equipment
    useCircuitStore.getState().runSimulation();
    const trippedPanel = useCircuitStore
      .getState()
      .nodes.find((n) => n.id === 'panel_indoor');
    expect(trippedPanel?.data.isMcbTripped).toBe(true);
    expect(trippedPanel?.data.isMcbOn).toBe(false);

    // User attempts to click Reset while wires are STILL shorted
    const resetSuccess = useCircuitStore
      .getState()
      .resetLabPanelMcb('panel_indoor');
    expect(resetSuccess).toBe(false);

    // Panel must remain tripped to protect the circuit
    const postResetPanel = useCircuitStore
      .getState()
      .nodes.find((n) => n.id === 'panel_indoor');
    expect(postResetPanel?.data.isMcbTripped).toBe(true);

    // Notification must clearly explain why it failed
    const notification = useCircuitStore.getState().notification;
    expect(notification?.message).toContain('korsleting');
  });

  it('disconnects shorted wires and cleanly restores MCB with disconnectAndResetMcb', () => {
    const labPanelNode: Node<CircuitElementData> = {
      id: 'panel_indoor',
      type: 'transmission-tower',
      position: { x: 100, y: 100 },
      data: {
        id: 'panel_indoor',
        type: 'transmission-tower',
        label: 'Panel Distribusi Lab',
        worldMode: 'lab',
        isMcbOn: false,
        isMcbTripped: true,
      },
    };

    const shortEdges: Edge[] = [
      {
        id: 'wire_short_1',
        source: 'panel_indoor',
        sourceHandle: 'pos',
        target: 'bat_1',
        targetHandle: 'pos',
      },
    ];

    useCircuitStore.setState({
      nodes: [labPanelNode],
      edges: shortEdges,
    });

    // One-tap cut and reset
    useCircuitStore.getState().disconnectAndResetMcb('panel_indoor');

    // Edges connected to panel must be removed
    const remainingEdges = useCircuitStore.getState().edges;
    expect(remainingEdges.length).toBe(0);

    // Panel MCB must be reset to ON and not tripped
    const restoredPanel = useCircuitStore
      .getState()
      .nodes.find((n) => n.id === 'panel_indoor');
    expect(restoredPanel?.data.isMcbTripped).toBe(false);
    expect(restoredPanel?.data.isMcbOn).toBe(true);

    // Toast notification must confirm recovery
    const notification = useCircuitStore.getState().notification;
    expect(notification?.message).toContain('berhasil di-reset');
  });
});
