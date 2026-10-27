/**
 * Zustand State Store for Circuit Sandbox.
 * 
 * Manages nodes, edges, simulation loop, active selection,
 * component parameter adjustments, and preset circuits.
 */

import { create } from 'zustand';
import {
  Node,
  Edge,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import {
  CircuitElementData,
  ComponentType,
  SimulationResult,
  WireConnection,
} from '../types/circuit';
import { solveCircuitMNA } from '../physics/mnaSolver';
import { AppLanguage } from '../i18n/translations';

interface CircuitState {
  nodes: Node<CircuitElementData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  simulation: SimulationResult;
  isSimulating: boolean;
  language: AppLanguage;

  // React Flow Handlers
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  // Circuit Operations
  setLanguage: (language: AppLanguage) => void;
  addComponent: (type: ComponentType, position: { x: number; y: number }) => void;
  updateComponentData: (id: string, partialData: Partial<CircuitElementData>) => void;
  removeComponent: (id: string) => void;
  insertBatteryIntoHolder: (batteryNodeId: string, holderNodeId: string) => void;
  ejectBatteryFromHolder: (holderNodeId: string) => void;
  splitEdgeWithWaypoint: (edgeId: string, position: { x: number; y: number }) => void;
  selectNode: (id: string | null) => void;
  toggleSwitch: (id: string) => void;
  clearCanvas: () => void;
  setIsSimulating: (isSimulating: boolean) => void;
  runSimulation: () => void;
  loadPreset: (presetName: 'simple-lamp' | 'voltage-divider' | 'parallel-bulbs' | 'short-circuit-demo') => void;
}

const DEFAULT_SIMULATION: SimulationResult = {
  nodeVoltages: {},
  branchCurrents: {},
  isShortCircuit: false,
  shortCircuitBranches: [],
  totalPowerDrawn: 0,
  timestamp: Date.now(),
};

/**
 * Executes MNA physics solver across current store state.
 */
function recalculateCircuit(
  nodes: Node<CircuitElementData>[],
  edges: Edge[]
): { simulation: SimulationResult; updatedNodes: Node<CircuitElementData>[] } {
  const components: CircuitElementData[] = nodes.map((node) => node.data);
  const wires: WireConnection[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    sourceHandle: edge.sourceHandle ?? 'p1',
    target: edge.target,
    targetHandle: edge.targetHandle ?? 'p2',
  }));

  const simulation = solveCircuitMNA({ components, wires });

  // Update node data with calculated voltages, currents, and status
  const updatedNodes = nodes.map((node) => {
    const branchCurrent = simulation.branchCurrents[node.id] ?? 0;
    const isBlown = node.data.type === 'bulb' && Math.abs(branchCurrent) > 2.5; // Max 2.5A bulb rating
    const isShortCircuit = simulation.shortCircuitBranches.includes(node.id);

    return {
      ...node,
      data: {
        ...node.data,
        calculatedCurrent: branchCurrent,
        isShortCircuit,
        isBlown: node.data.isBlown || isBlown,
      },
    };
  });

  return { simulation, updatedNodes };
}

export const useCircuitStore = create<CircuitState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  simulation: DEFAULT_SIMULATION,
  isSimulating: true,
  language: 'id',

  setLanguage: (language: AppLanguage) => {
    set({ language });
  },

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    const nextEdges = applyEdgeChanges(changes, get().edges);
    const { simulation, updatedNodes } = recalculateCircuit(get().nodes, nextEdges);
    set({
      edges: nextEdges,
      simulation,
      nodes: updatedNodes,
    });
  },

  onConnect: (connection: Connection) => {
    const customEdge: Edge = {
      ...connection,
      id: `wire_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'wire',
      source: connection.source!,
      target: connection.target!,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    };

    const nextEdges = addEdge(customEdge, get().edges);
    const { simulation, updatedNodes } = recalculateCircuit(get().nodes, nextEdges);

    set({
      edges: nextEdges,
      simulation,
      nodes: updatedNodes,
    });
  },

  addComponent: (type: ComponentType, position: { x: number; y: number }) => {
    const componentId = `${type}_${Date.now()}`;
    const isId = get().language === 'id';
    let defaultData: CircuitElementData = {
      id: componentId,
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
    };

    switch (type) {
      case 'battery':
        defaultData = {
          ...defaultData,
          voltage: 1.5,
          label: isId ? 'Baterai AA 1.5V' : '1.5V AA Battery',
        };
        break;
      case 'battery-holder':
        defaultData = {
          ...defaultData,
          hasBattery: false,
          batteryCount: 0,
          voltage: 0,
          label: isId ? 'Wadah Baterai AA' : 'Dual AA Holder',
        };
        break;
      case 'resistor':
        defaultData = {
          ...defaultData,
          resistance: 100,
          label: isId ? 'Resistor 100Ω' : '100Ω Resistor',
        };
        break;
      case 'bulb':
        defaultData = {
          ...defaultData,
          resistance: 10,
          powerRating: 5.0,
          label: isId ? 'Lampu Bohlam' : 'Light Bulb',
        };
        break;
      case 'switch':
        defaultData = {
          ...defaultData,
          isOpen: false,
          label: isId ? 'Saklar Listrik' : 'SPST Switch',
        };
        break;
      case 'ground':
        defaultData = {
          ...defaultData,
          label: isId ? 'Ground (0V)' : '0V Earth Ground',
        };
        break;
      case 'voltmeter':
        defaultData = {
          ...defaultData,
          label: isId ? 'Voltmeter Digital' : 'Digital Voltmeter',
        };
        break;
      case 'ammeter':
        defaultData = {
          ...defaultData,
          label: isId ? 'Amperemeter Digital' : 'Digital Ammeter',
        };
        break;
    }

    const newNode: Node<CircuitElementData> = {
      id: componentId,
      type,
      position,
      data: defaultData,
    };

    const nextNodes = [...get().nodes, newNode];
    const { simulation, updatedNodes } = recalculateCircuit(nextNodes, get().edges);

    set({
      nodes: updatedNodes,
      simulation,
      selectedNodeId: componentId,
    });
  },

  updateComponentData: (id: string, partialData: Partial<CircuitElementData>) => {
    const nextNodes = get().nodes.map((node) => {
      if (node.id === id) {
        return {
          ...node,
          data: {
            ...node.data,
            ...partialData,
          },
        };
      }
      return node;
    });

    const { simulation, updatedNodes } = recalculateCircuit(nextNodes, get().edges);
    set({
      nodes: updatedNodes,
      simulation,
    });
  },

  removeComponent: (id: string) => {
    const targetNode = get().nodes.find((n) => n.id === id);
    let nextEdges = [...get().edges];

    // Auto-heal wires when deleting a waypoint anchor
    if (targetNode?.data.type === 'waypoint') {
      const incomingEdge = nextEdges.find((e) => e.target === id);
      const outgoingEdge = nextEdges.find((e) => e.source === id);

      if (incomingEdge && outgoingEdge) {
        const bridgedEdge: Edge = {
          id: `wire_${Date.now()}_healed`,
          type: 'wire',
          source: incomingEdge.source,
          sourceHandle: incomingEdge.sourceHandle,
          target: outgoingEdge.target,
          targetHandle: outgoingEdge.targetHandle,
        };
        nextEdges = nextEdges.filter(
          (e) => e.id !== incomingEdge.id && e.id !== outgoingEdge.id
        );
        nextEdges.push(bridgedEdge);
      } else {
        nextEdges = nextEdges.filter((e) => e.source !== id && e.target !== id);
      }
    } else {
      nextEdges = nextEdges.filter((e) => e.source !== id && e.target !== id);
    }

    const nextNodes = get().nodes.filter((node) => node.id !== id);
    const { simulation, updatedNodes } = recalculateCircuit(nextNodes, nextEdges);

    set({
      nodes: updatedNodes,
      edges: nextEdges,
      simulation,
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    });
  },

  insertBatteryIntoHolder: (batteryNodeId: string, holderNodeId: string) => {
    const currentNodes = get().nodes;
    const holderNode = currentNodes.find(
      (n) => n.id === holderNodeId && n.data.type === 'battery-holder'
    );
    const batteryNode = currentNodes.find(
      (n) => n.id === batteryNodeId && n.data.type === 'battery'
    );

    if (!holderNode || !batteryNode) return;

    const currentCount = holderNode.data.batteryCount ?? (holderNode.data.hasBattery ? 2 : 0);
    if (currentCount >= 2) return; // Holder already full (max 2 AA cells)

    const nextCount = Math.min(2, currentCount + 1);
    const nextVoltage = nextCount * 1.5;

    // Remove the dropped BatteryNode and any edges connected to it
    const nextEdges = get().edges.filter(
      (edge) => edge.source !== batteryNodeId && edge.target !== batteryNodeId
    );
    const nextNodes = currentNodes
      .filter((node) => node.id !== batteryNodeId)
      .map((node) => {
        if (node.id === holderNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              hasBattery: true,
              batteryCount: nextCount,
              voltage: nextVoltage,
            },
          };
        }
        return node;
      });

    const { simulation, updatedNodes } = recalculateCircuit(nextNodes, nextEdges);

    set({
      nodes: updatedNodes,
      edges: nextEdges,
      simulation,
      selectedNodeId: holderNodeId,
    });
  },

  ejectBatteryFromHolder: (holderNodeId: string) => {
    const currentNodes = get().nodes;
    const holderNode = currentNodes.find(
      (n) => n.id === holderNodeId && n.data.type === 'battery-holder'
    );
    if (!holderNode) return;

    const currentCount = holderNode.data.batteryCount ?? (holderNode.data.hasBattery ? 2 : 0);
    if (currentCount <= 0) return;

    const nextCount = Math.max(0, currentCount - 1);
    const nextVoltage = nextCount * 1.5;

    const ejectedId = `battery_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const ejectedBatteryNode: Node<CircuitElementData> = {
      id: ejectedId,
      type: 'battery',
      position: {
        x: holderNode.position.x - 160,
        y: holderNode.position.y + (currentCount === 2 ? 0 : 40),
      },
      data: {
        id: ejectedId,
        type: 'battery',
        voltage: 1.5,
        label: '1.5V AA Battery',
      },
    };

    const nextNodes = [
      ...currentNodes.map((node) => {
        if (node.id === holderNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              hasBattery: nextCount > 0,
              batteryCount: nextCount,
              voltage: nextVoltage,
            },
          };
        }
        return node;
      }),
      ejectedBatteryNode,
    ];

    const { simulation, updatedNodes } = recalculateCircuit(nextNodes, get().edges);

    set({
      nodes: updatedNodes,
      simulation,
      selectedNodeId: holderNodeId,
    });
  },

  splitEdgeWithWaypoint: (edgeId: string, position: { x: number; y: number }) => {
    const currentEdges = get().edges;
    const targetEdge = currentEdges.find((e) => e.id === edgeId);
    if (!targetEdge) return;

    const waypointId = `wp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const waypointNode: Node<CircuitElementData> = {
      id: waypointId,
      type: 'waypoint',
      position: { x: position.x - 10, y: position.y - 10 },
      data: {
        id: waypointId,
        type: 'waypoint',
        label: 'Anchor',
      },
    };

    const edgeToWaypoint: Edge = {
      id: `wire_${Date.now()}_a`,
      type: 'wire',
      source: targetEdge.source,
      sourceHandle: targetEdge.sourceHandle,
      target: waypointId,
      targetHandle: 'p1',
    };

    const edgeFromWaypoint: Edge = {
      id: `wire_${Date.now()}_b`,
      type: 'wire',
      source: waypointId,
      sourceHandle: 'p2',
      target: targetEdge.target,
      targetHandle: targetEdge.targetHandle,
    };

    const remainingEdges = currentEdges.filter((e) => e.id !== edgeId);
    const nextEdges = [...remainingEdges, edgeToWaypoint, edgeFromWaypoint];
    const nextNodes = [...get().nodes, waypointNode];

    const { simulation, updatedNodes } = recalculateCircuit(nextNodes, nextEdges);

    set({
      nodes: updatedNodes,
      edges: nextEdges,
      simulation,
      selectedNodeId: waypointId,
    });
  },

  selectNode: (id: string | null) => {
    set({ selectedNodeId: id });
  },

  toggleSwitch: (id: string) => {
    const targetNode = get().nodes.find((n) => n.id === id);
    if (!targetNode || targetNode.data.type !== 'switch') return;

    get().updateComponentData(id, { isOpen: !targetNode.data.isOpen });
  },

  clearCanvas: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      simulation: DEFAULT_SIMULATION,
    });
  },

  setIsSimulating: (isSimulating: boolean) => {
    set({ isSimulating });
  },

  runSimulation: () => {
    const { simulation, updatedNodes } = recalculateCircuit(get().nodes, get().edges);
    set({ simulation, nodes: updatedNodes });
  },

  loadPreset: (presetName) => {
    let presetNodes: Node<CircuitElementData>[] = [];
    let presetEdges: Edge[] = [];

    if (presetName === 'simple-lamp') {
      presetNodes = [
        {
          id: 'bat_extra',
          type: 'battery',
          position: { x: -80, y: 155 },
          data: { id: 'bat_extra', type: 'battery', voltage: 1.5, label: '1.5V AA Cell' },
        },
        {
          id: 'holder_1',
          type: 'battery-holder',
          position: { x: 100, y: 120 },
          data: {
            id: 'holder_1',
            type: 'battery-holder',
            hasBattery: true,
            batteryCount: 2,
            voltage: 3.0,
            label: 'Dual AA Holder',
          },
        },
        {
          id: 'sw_1',
          type: 'switch',
          position: { x: 320, y: 75 },
          data: { id: 'sw_1', type: 'switch', isOpen: false, label: 'Power Switch' },
        },
        {
          id: 'bulb_1',
          type: 'bulb',
          position: { x: 520, y: 135 },
          data: { id: 'bulb_1', type: 'bulb', resistance: 5, label: '3V Lamp (5Ω)' },
        },
      ];
      presetEdges = [
        { id: 'e1', source: 'holder_1', sourceHandle: 'pos', target: 'sw_1', targetHandle: 'p1', type: 'wire' },
        { id: 'e2', source: 'sw_1', sourceHandle: 'p2', target: 'bulb_1', targetHandle: 'p1', type: 'wire' },
        { id: 'e3', source: 'bulb_1', sourceHandle: 'p2', target: 'holder_1', targetHandle: 'neg', type: 'wire' },
      ];
    } else if (presetName === 'voltage-divider') {
      presetNodes = [
        {
          id: 'bat_1',
          type: 'battery',
          position: { x: 80, y: 180 },
          data: { id: 'bat_1', type: 'battery', voltage: 12, label: '12V Source' },
        },
        {
          id: 'res_1',
          type: 'resistor',
          position: { x: 320, y: 100 },
          data: { id: 'res_1', type: 'resistor', resistance: 100, label: 'R1: 100Ω' },
        },
        {
          id: 'res_2',
          type: 'resistor',
          position: { x: 320, y: 260 },
          data: { id: 'res_2', type: 'resistor', resistance: 100, label: 'R2: 100Ω' },
        },
        {
          id: 'v_meter',
          type: 'voltmeter',
          position: { x: 540, y: 260 },
          data: { id: 'v_meter', type: 'voltmeter', label: 'Midpoint Voltmeter' },
        },
      ];
      presetEdges = [
        { id: 'e1', source: 'bat_1', sourceHandle: 'pos', target: 'res_1', targetHandle: 'p1', type: 'wire' },
        { id: 'e2', source: 'res_1', sourceHandle: 'p2', target: 'res_2', targetHandle: 'p1', type: 'wire' },
        { id: 'e3', source: 'res_2', sourceHandle: 'p2', target: 'bat_1', targetHandle: 'neg', type: 'wire' },
        { id: 'e4', source: 'res_1', sourceHandle: 'p2', target: 'v_meter', targetHandle: 'p1', type: 'wire' },
        { id: 'e5', source: 'res_2', sourceHandle: 'p2', target: 'v_meter', targetHandle: 'p2', type: 'wire' },
      ];
    } else if (presetName === 'parallel-bulbs') {
      presetNodes = [
        {
          id: 'bat_1',
          type: 'battery',
          position: { x: 100, y: 200 },
          data: { id: 'bat_1', type: 'battery', voltage: 9, label: '9V Battery' },
        },
        {
          id: 'bulb_1',
          type: 'bulb',
          position: { x: 350, y: 100 },
          data: { id: 'bulb_1', type: 'bulb', resistance: 20, label: 'Bulb A (20Ω)' },
        },
        {
          id: 'bulb_2',
          type: 'bulb',
          position: { x: 350, y: 280 },
          data: { id: 'bulb_2', type: 'bulb', resistance: 20, label: 'Bulb B (20Ω)' },
        },
      ];
      presetEdges = [
        { id: 'e1', source: 'bat_1', sourceHandle: 'pos', target: 'bulb_1', targetHandle: 'p1', type: 'wire' },
        { id: 'e2', source: 'bat_1', sourceHandle: 'pos', target: 'bulb_2', targetHandle: 'p1', type: 'wire' },
        { id: 'e3', source: 'bulb_1', sourceHandle: 'p2', target: 'bat_1', targetHandle: 'neg', type: 'wire' },
        { id: 'e4', source: 'bulb_2', sourceHandle: 'p2', target: 'bat_1', targetHandle: 'neg', type: 'wire' },
      ];
    } else if (presetName === 'short-circuit-demo') {
      presetNodes = [
        {
          id: 'bat_1',
          type: 'battery',
          position: { x: 140, y: 180 },
          data: { id: 'bat_1', type: 'battery', voltage: 9, label: '9V Battery' },
        },
        {
          id: 'sw_1',
          type: 'switch',
          position: { x: 380, y: 180 },
          data: { id: 'sw_1', type: 'switch', isOpen: true, label: 'Dead Short Switch' },
        },
      ];
      presetEdges = [
        { id: 'e1', source: 'bat_1', sourceHandle: 'pos', target: 'sw_1', targetHandle: 'p1', type: 'wire' },
        { id: 'e2', source: 'sw_1', sourceHandle: 'p2', target: 'bat_1', targetHandle: 'neg', type: 'wire' },
      ];
    }

    const { simulation, updatedNodes } = recalculateCircuit(presetNodes, presetEdges);
    set({
      nodes: updatedNodes,
      edges: presetEdges,
      simulation,
      selectedNodeId: null,
    });
  },
}));
