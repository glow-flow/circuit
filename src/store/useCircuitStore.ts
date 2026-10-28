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
import {
  BulbType,
  computeBulbPhotometrics,
  getAdjacentBulbSpec,
  getBulbSpec,
} from '../constants/bulbCatalog';
import { AppLanguage } from '../i18n/translations';
import {
  CustomCircuitPreset,
  loadCustomPresetsFromStorage,
  saveCustomPresetsToStorage,
  saveWorkspaceAutosave,
} from '../utils/presetStorage';

interface CircuitState {
  nodes: Node<CircuitElementData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  simulation: SimulationResult;
  isSimulating: boolean;
  language: AppLanguage;
  customPresets: CustomCircuitPreset[];
  fitViewTrigger: number;

  // React Flow Handlers
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (
    updater:
      | Node<CircuitElementData>[]
      | ((prevNodes: Node<CircuitElementData>[]) => Node<CircuitElementData>[])
  ) => void;

  // Circuit Operations
  setLanguage: (language: AppLanguage) => void;
  addComponent: (type: ComponentType, position: { x: number; y: number }) => void;
  updateComponentData: (id: string, partialData: Partial<CircuitElementData>) => void;
  cycleBulbType: (id: string, direction: 'prev' | 'next') => void;
  setBulbType: (id: string, bulbType: BulbType) => void;
  removeComponent: (id: string) => void;
  removeEdge: (edgeId: string) => void;
  insertBatteryIntoHolder: (batteryNodeId: string, holderNodeId: string) => void;
  ejectBatteryFromHolder: (holderNodeId: string) => void;
  splitEdgeWithWaypoint: (edgeId: string, position: { x: number; y: number }) => void;
  splitEdgeAtMidpoint: (edgeId: string) => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  toggleSwitch: (id: string) => void;
  clearCanvas: () => void;
  setIsSimulating: (isSimulating: boolean) => void;
  runSimulation: () => void;
  loadPreset: (presetName: 'simple-lamp' | 'voltage-divider' | 'parallel-bulbs' | 'short-circuit-demo') => void;
  saveCustomPreset: (name: string) => void;
  loadCustomPreset: (presetId: string) => void;
  deleteCustomPreset: (presetId: string) => void;
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
 * Executes MNA physics solver across current store state and persists autosave backup.
 * Synchronizes real-time branch current, voltage drop, and dissipated power (P = I^2 * R)
 * into each node's data object.
 * Time Complexity: O(N + M^3) where N is node count and M is active MNA matrix dimension.
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

  // Update node data with calculated voltages, currents, power, and thermal overload status
  const updatedNodes = nodes.map((node) => {
    const branchCurrent = simulation.branchCurrents[node.id] ?? 0;
    const isShortCircuit = simulation.shortCircuitBranches.includes(node.id);

    if (node.data.type === 'bulb') {
      const spec = getBulbSpec(node.data.bulbType);
      const effectiveResistance = node.data.resistance ?? spec.resistance;
      const { powerWatts, voltageDrop, isOverloaded } = computeBulbPhotometrics(
        branchCurrent,
        effectiveResistance,
        spec
      );
      const isBlown = Boolean(
        node.data.isBlown || isOverloaded || Math.abs(branchCurrent) > 2.5
      );

      return {
        ...node,
        data: {
          ...node.data,
          bulbType: node.data.bulbType ?? 'incandescent',
          resistance: effectiveResistance,
          powerRating: node.data.powerRating ?? spec.maxPower,
          power: powerWatts,
          calculatedCurrent: branchCurrent,
          calculatedVoltage: voltageDrop,
          calculatedPower: powerWatts,
          isShortCircuit,
          isBlown,
        },
      };
    }

    return {
      ...node,
      data: {
        ...node.data,
        calculatedCurrent: branchCurrent,
        isShortCircuit,
      },
    };
  });

  saveWorkspaceAutosave(updatedNodes, edges);

  return { simulation, updatedNodes };
}

export const useCircuitStore = create<CircuitState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  simulation: DEFAULT_SIMULATION,
  isSimulating: true,
  language: 'id',
  customPresets: loadCustomPresetsFromStorage(),
  fitViewTrigger: 0,

  setLanguage: (language: AppLanguage) => {
    set({ language });
  },

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  setNodes: (updater) => {
    const currentNodes = get().nodes;
    const nextRawNodes = typeof updater === 'function' ? updater(currentNodes) : updater;
    const { simulation, updatedNodes } = recalculateCircuit(nextRawNodes, get().edges);
    set({
      nodes: updatedNodes,
      simulation,
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    const nextEdges = applyEdgeChanges(changes, get().edges);
    const { simulation, updatedNodes } = recalculateCircuit(get().nodes, nextEdges);
    const isSelectedEdgeStillPresent = nextEdges.some((e) => e.id === get().selectedEdgeId);
    set({
      edges: nextEdges,
      simulation,
      nodes: updatedNodes,
      selectedEdgeId: isSelectedEdgeStillPresent ? get().selectedEdgeId : null,
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
      case 'bulb': {
        const defaultBulbSpec = getBulbSpec('incandescent');
        defaultData = {
          ...defaultData,
          bulbType: 'incandescent',
          resistance: defaultBulbSpec.resistance,
          power: 0,
          powerRating: defaultBulbSpec.maxPower,
          label: isId ? defaultBulbSpec.label : defaultBulbSpec.labelEn,
        };
        break;
      }
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

  cycleBulbType: (id: string, direction: 'prev' | 'next') => {
    const targetNode = get().nodes.find((n) => n.id === id);
    if (!targetNode || targetNode.data.type !== 'bulb') return;

    const nextSpec = getAdjacentBulbSpec(targetNode.data.bulbType, direction);
    const isId = get().language === 'id';

    get().updateComponentData(id, {
      bulbType: nextSpec.type,
      label: isId ? nextSpec.label : nextSpec.labelEn,
      resistance: nextSpec.resistance,
      powerRating: nextSpec.maxPower,
      isBlown: false,
    });
  },

  setBulbType: (id: string, bulbType: BulbType) => {
    const nextSpec = getBulbSpec(bulbType);
    const isId = get().language === 'id';

    get().updateComponentData(id, {
      bulbType: nextSpec.type,
      label: isId ? nextSpec.label : nextSpec.labelEn,
      resistance: nextSpec.resistance,
      powerRating: nextSpec.maxPower,
      isBlown: false,
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
      selectedEdgeId: null,
    });
  },

  /**
   * Splits an existing wire edge at the geometric midpoint between its source and target nodes.
   * Useful for single-tap mobile users via the top floating toolbar.
   * Time Complexity: O(N + E)
   */
  splitEdgeAtMidpoint: (edgeId: string) => {
    const currentEdges = get().edges;
    const currentNodes = get().nodes;
    const targetEdge = currentEdges.find((e) => e.id === edgeId);
    if (!targetEdge) return;

    const sourceNode = currentNodes.find((n) => n.id === targetEdge.source);
    const targetNode = currentNodes.find((n) => n.id === targetEdge.target);

    const midX =
      sourceNode && targetNode
        ? (sourceNode.position.x + targetNode.position.x) / 2 + 60
        : 300;
    const midY =
      sourceNode && targetNode
        ? (sourceNode.position.y + targetNode.position.y) / 2 + 60
        : 200;

    get().splitEdgeWithWaypoint(edgeId, { x: midX, y: midY });
  },

  /**
   * Removes a wire connection between components and immediately recalculates the circuit.
   * Time Complexity: O(E) where E is the number of wire edges (typically < 50).
   * @param edgeId Unique identifier of the edge to be removed
   */
  removeEdge: (edgeId: string) => {
    const currentEdges = get().edges;
    const nextEdges = currentEdges.filter((edge) => edge.id !== edgeId);
    if (nextEdges.length === currentEdges.length) return; // Edge not found

    const nextSelectedEdgeId = get().selectedEdgeId === edgeId ? null : get().selectedEdgeId;
    const { simulation, updatedNodes } = recalculateCircuit(get().nodes, nextEdges);

    set({
      edges: nextEdges,
      simulation,
      nodes: updatedNodes,
      selectedEdgeId: nextSelectedEdgeId,
    });
  },

  selectNode: (id: string | null) => {
    set({
      selectedNodeId: id,
      selectedEdgeId: id ? null : get().selectedEdgeId,
      edges: id ? get().edges.map((edge) => ({ ...edge, selected: false })) : get().edges,
    });
  },

  selectEdge: (id: string | null) => {
    set({
      selectedEdgeId: id,
      selectedNodeId: id ? null : get().selectedNodeId,
      edges: get().edges.map((edge) => ({
        ...edge,
        selected: edge.id === id,
      })),
    });
  },

  toggleSwitch: (id: string) => {
    const targetNode = get().nodes.find((n) => n.id === id);
    if (!targetNode || targetNode.data.type !== 'switch') return;

    get().updateComponentData(id, { isOpen: !targetNode.data.isOpen });
  },

  clearCanvas: () => {
    saveWorkspaceAutosave([], []);
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
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
          position: { x: -220, y: 150 },
          data: { id: 'bat_extra', type: 'battery', voltage: 1.5, label: 'Baterai AA 1.5V' },
        },
        {
          id: 'holder_1',
          type: 'battery-holder',
          position: { x: 20, y: 110 },
          data: {
            id: 'holder_1',
            type: 'battery-holder',
            hasBattery: true,
            batteryCount: 2,
            voltage: 3.0,
            label: 'Wadah AA (3.0V)',
          },
        },
        {
          id: 'sw_1',
          type: 'switch',
          position: { x: 340, y: 20 },
          data: { id: 'sw_1', type: 'switch', isOpen: false, label: 'Saklar Utama' },
        },
        {
          id: 'bulb_1',
          type: 'bulb',
          position: { x: 640, y: 130 },
          data: {
            id: 'bulb_1',
            type: 'bulb',
            bulbType: 'incandescent',
            resistance: 800,
            powerRating: 40,
            label: 'Lampu Pijar',
          },
        },
        {
          id: 'wp_s1',
          type: 'waypoint',
          position: { x: 840, y: 430 },
          data: { id: 'wp_s1', type: 'waypoint', label: 'Sudut Kanan Bawah' },
        },
        {
          id: 'wp_s2',
          type: 'waypoint',
          position: { x: 115, y: 430 },
          data: { id: 'wp_s2', type: 'waypoint', label: 'Sudut Kiri Bawah' },
        },
      ];
      presetEdges = [
        { id: 'e1', source: 'holder_1', sourceHandle: 'pos', target: 'sw_1', targetHandle: 'p1', type: 'wire' },
        { id: 'e2', source: 'sw_1', sourceHandle: 'p2', target: 'bulb_1', targetHandle: 'p1', type: 'wire' },
        { id: 'e3', source: 'bulb_1', sourceHandle: 'p2', target: 'wp_s1', targetHandle: 'p1', type: 'wire' },
        { id: 'e4', source: 'wp_s1', sourceHandle: 'p2', target: 'wp_s2', targetHandle: 'p1', type: 'wire' },
        { id: 'e5', source: 'wp_s2', sourceHandle: 'p2', target: 'holder_1', targetHandle: 'neg', type: 'wire' },
      ];
    } else if (presetName === 'voltage-divider') {
      // Textbook SERI Circuit: V source on Left, R1 on Top, R2 on Right, R3 on Bottom (I = I1 = I2 = I3)
      presetNodes = [
        {
          id: 'holder_1',
          type: 'battery-holder',
          position: { x: 20, y: 190 },
          data: {
            id: 'holder_1',
            type: 'battery-holder',
            hasBattery: true,
            batteryCount: 2,
            voltage: 3.0,
            label: 'Sumber V (3.0V)',
          },
        },
        {
          id: 'bulb_1',
          type: 'bulb',
          position: { x: 380, y: 10 },
          data: {
            id: 'bulb_1',
            type: 'bulb',
            bulbType: 'incandescent',
            resistance: 800,
            powerRating: 40,
            label: 'Lampu Pijar',
          },
        },
        {
          id: 'bulb_2',
          type: 'bulb',
          position: { x: 740, y: 190 },
          data: {
            id: 'bulb_2',
            type: 'bulb',
            bulbType: 'incandescent',
            resistance: 800,
            powerRating: 40,
            label: 'Lampu Pijar',
          },
        },
        {
          id: 'bulb_3',
          type: 'bulb',
          position: { x: 380, y: 410 },
          data: {
            id: 'bulb_3',
            type: 'bulb',
            bulbType: 'incandescent',
            resistance: 800,
            powerRating: 40,
            label: 'Lampu Pijar',
          },
        },
        {
          id: 'wp_tl',
          type: 'waypoint',
          position: { x: 115, y: 110 },
          data: { id: 'wp_tl', type: 'waypoint', label: 'Sudut Atas Kiri' },
        },
        {
          id: 'wp_tr',
          type: 'waypoint',
          position: { x: 690, y: 110 },
          data: { id: 'wp_tr', type: 'waypoint', label: 'Sudut Atas Kanan' },
        },
        {
          id: 'wp_br',
          type: 'waypoint',
          position: { x: 950, y: 510 },
          data: { id: 'wp_br', type: 'waypoint', label: 'Sudut Bawah Kanan' },
        },
        {
          id: 'wp_bl',
          type: 'waypoint',
          position: { x: 115, y: 510 },
          data: { id: 'wp_bl', type: 'waypoint', label: 'Sudut Bawah Kiri' },
        },
      ];
      presetEdges = [
        { id: 's1', source: 'holder_1', sourceHandle: 'pos', target: 'wp_tl', targetHandle: 'p1', type: 'wire' },
        { id: 's2', source: 'wp_tl', sourceHandle: 'p2', target: 'bulb_1', targetHandle: 'p1', type: 'wire' },
        { id: 's3', source: 'bulb_1', sourceHandle: 'p2', target: 'wp_tr', targetHandle: 'p1', type: 'wire' },
        { id: 's4', source: 'wp_tr', sourceHandle: 'p2', target: 'bulb_2', targetHandle: 'p1', type: 'wire' },
        { id: 's5', source: 'bulb_2', sourceHandle: 'p2', target: 'wp_br', targetHandle: 'p1', type: 'wire' },
        { id: 's6', source: 'wp_br', sourceHandle: 'p2', target: 'bulb_3', targetHandle: 'p2', type: 'wire' },
        { id: 's7', source: 'bulb_3', sourceHandle: 'p1', target: 'wp_bl', targetHandle: 'p1', type: 'wire' },
        { id: 's8', source: 'wp_bl', sourceHandle: 'p2', target: 'holder_1', targetHandle: 'neg', type: 'wire' },
      ];
    } else if (presetName === 'parallel-bulbs') {
      // Textbook PARALEL Circuit: V source on Left, 3 Side-by-Side Parallel Branches (R1, R2, R3) with Top & Bottom Rails
      presetNodes = [
        {
          id: 'holder_1',
          type: 'battery-holder',
          position: { x: 20, y: 170 },
          data: {
            id: 'holder_1',
            type: 'battery-holder',
            hasBattery: true,
            batteryCount: 2,
            voltage: 3.0,
            label: 'Sumber V (3.0V)',
          },
        },
        {
          id: 'bulb_1',
          type: 'bulb',
          position: { x: 350, y: 180 },
          data: {
            id: 'bulb_1',
            type: 'bulb',
            bulbType: 'incandescent',
            resistance: 800,
            powerRating: 40,
            label: 'Lampu Pijar',
          },
        },
        {
          id: 'bulb_2',
          type: 'bulb',
          position: { x: 640, y: 180 },
          data: {
            id: 'bulb_2',
            type: 'bulb',
            bulbType: 'edison',
            resistance: 1200,
            powerRating: 30,
            label: 'Lampu Edison',
          },
        },
        {
          id: 'bulb_3',
          type: 'bulb',
          position: { x: 930, y: 180 },
          data: {
            id: 'bulb_3',
            type: 'bulb',
            bulbType: 'led_rgb',
            resistance: 6000,
            powerRating: 7,
            label: 'Smart LED',
          },
        },
        // Top Rail Junctions (+)
        {
          id: 'wp_top_1',
          type: 'waypoint',
          position: { x: 320, y: 50 },
          data: { id: 'wp_top_1', type: 'waypoint', label: 'Simpul Atas 1' },
        },
        {
          id: 'wp_top_2',
          type: 'waypoint',
          position: { x: 610, y: 50 },
          data: { id: 'wp_top_2', type: 'waypoint', label: 'Simpul Atas 2' },
        },
        {
          id: 'wp_top_3',
          type: 'waypoint',
          position: { x: 900, y: 50 },
          data: { id: 'wp_top_3', type: 'waypoint', label: 'Simpul Atas 3' },
        },
        // Bottom Rail Junctions (-)
        {
          id: 'wp_bot_1',
          type: 'waypoint',
          position: { x: 550, y: 490 },
          data: { id: 'wp_bot_1', type: 'waypoint', label: 'Simpul Bawah 1' },
        },
        {
          id: 'wp_bot_2',
          type: 'waypoint',
          position: { x: 840, y: 490 },
          data: { id: 'wp_bot_2', type: 'waypoint', label: 'Simpul Bawah 2' },
        },
        {
          id: 'wp_bot_3',
          type: 'waypoint',
          position: { x: 1130, y: 490 },
          data: { id: 'wp_bot_3', type: 'waypoint', label: 'Simpul Bawah 3' },
        },
      ];
      presetEdges = [
        // Top Rail (+)
        { id: 'p_t1', source: 'holder_1', sourceHandle: 'pos', target: 'wp_top_1', targetHandle: 'p1', type: 'wire' },
        { id: 'p_t2', source: 'wp_top_1', sourceHandle: 'p2', target: 'wp_top_2', targetHandle: 'p1', type: 'wire' },
        { id: 'p_t3', source: 'wp_top_2', sourceHandle: 'p2', target: 'wp_top_3', targetHandle: 'p1', type: 'wire' },
        // Branch Inputs (from Top Rail into R1, R2, R3)
        { id: 'p_in1', source: 'wp_top_1', sourceHandle: 'p2', target: 'bulb_1', targetHandle: 'p1', type: 'wire' },
        { id: 'p_in2', source: 'wp_top_2', sourceHandle: 'p2', target: 'bulb_2', targetHandle: 'p1', type: 'wire' },
        { id: 'p_in3', source: 'wp_top_3', sourceHandle: 'p2', target: 'bulb_3', targetHandle: 'p1', type: 'wire' },
        // Branch Outputs (from R1, R2, R3 down to Bottom Rail)
        { id: 'p_out1', source: 'bulb_1', sourceHandle: 'p2', target: 'wp_bot_1', targetHandle: 'p1', type: 'wire' },
        { id: 'p_out2', source: 'bulb_2', sourceHandle: 'p2', target: 'wp_bot_2', targetHandle: 'p1', type: 'wire' },
        { id: 'p_out3', source: 'bulb_3', sourceHandle: 'p2', target: 'wp_bot_3', targetHandle: 'p1', type: 'wire' },
        // Bottom Rail (-) returning to Holder (-)
        { id: 'p_b3', source: 'wp_bot_3', sourceHandle: 'p2', target: 'wp_bot_2', targetHandle: 'p1', type: 'wire' },
        { id: 'p_b2', source: 'wp_bot_2', sourceHandle: 'p2', target: 'wp_bot_1', targetHandle: 'p1', type: 'wire' },
        { id: 'p_b1', source: 'wp_bot_1', sourceHandle: 'p2', target: 'holder_1', targetHandle: 'neg', type: 'wire' },
      ];
    } else if (presetName === 'short-circuit-demo') {
      presetNodes = [
        {
          id: 'holder_1',
          type: 'battery-holder',
          position: { x: 80, y: 150 },
          data: {
            id: 'holder_1',
            type: 'battery-holder',
            hasBattery: true,
            batteryCount: 2,
            voltage: 3.0,
            label: 'Wadah AA (3.0V)',
          },
        },
        {
          id: 'sw_1',
          type: 'switch',
          position: { x: 420, y: 200 },
          data: { id: 'sw_1', type: 'switch', isOpen: true, label: 'Saklar Korsleting' },
        },
      ];
      presetEdges = [
        { id: 'e1', source: 'holder_1', sourceHandle: 'pos', target: 'sw_1', targetHandle: 'p1', type: 'wire' },
        { id: 'e2', source: 'sw_1', sourceHandle: 'p2', target: 'holder_1', targetHandle: 'neg', type: 'wire' },
      ];
    }

    const { simulation, updatedNodes } = recalculateCircuit(presetNodes, presetEdges);
    set({
      nodes: updatedNodes,
      edges: presetEdges,
      simulation,
      selectedNodeId: null,
      selectedEdgeId: null,
      fitViewTrigger: get().fitViewTrigger + 1,
    });
  },

  /**
   * Saves the current canvas nodes and edges as a named custom preset in browser localStorage.
   */
  saveCustomPreset: (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const newPreset: CustomCircuitPreset = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: trimmedName,
      createdAt: Date.now(),
      nodes: get().nodes.map((node) => ({ ...node, selected: false })),
      edges: get().edges.map((edge) => ({ ...edge, selected: false })),
    };

    const nextPresets = [newPreset, ...get().customPresets];
    saveCustomPresetsToStorage(nextPresets);
    set({ customPresets: nextPresets });
  },

  /**
   * Loads a user-saved custom preset by ID onto the canvas and recalculates MNA physics.
   */
  loadCustomPreset: (presetId: string) => {
    const targetPreset = get().customPresets.find((p) => p.id === presetId);
    if (!targetPreset) return;

    const { simulation, updatedNodes } = recalculateCircuit(
      targetPreset.nodes,
      targetPreset.edges
    );
    set({
      nodes: updatedNodes,
      edges: targetPreset.edges,
      simulation,
      selectedNodeId: null,
      selectedEdgeId: null,
      fitViewTrigger: get().fitViewTrigger + 1,
    });
  },

  /**
   * Deletes a user-saved custom preset from browser localStorage.
   */
  deleteCustomPreset: (presetId: string) => {
    const nextPresets = get().customPresets.filter((p) => p.id !== presetId);
    saveCustomPresetsToStorage(nextPresets);
    set({ customPresets: nextPresets });
  },
}));

