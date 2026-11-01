import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  BackgroundVariant,
  ReactFlowInstance,
  ReactFlowProvider,
  ConnectionLineType,
  ConnectionMode,
  Edge,
  Node,
} from 'reactflow';
import { useCircuitStore } from '../../store/useCircuitStore';
import { CircuitElementData } from '../../types/circuit';
import { PALETTE_DRAG_MIME, getPaletteEntry } from '../../constants/componentCatalog';
import { BatteryNode } from './nodes/BatteryNode';
import { Battery9VNode } from './nodes/Battery9VNode';
import { BatteryHolderNode } from './nodes/BatteryHolderNode';
import { ResistorNode } from './nodes/ResistorNode';
import { BulbNode } from './nodes/BulbNode';
import { SwitchNode } from './nodes/SwitchNode';
import { SocketNode } from './nodes/SocketNode';
import { PinSocketNode } from './nodes/PinSocketNode';
import { GroundNode } from './nodes/GroundNode';
import { VoltmeterNode } from './nodes/VoltmeterNode';
import { AmmeterNode } from './nodes/AmmeterNode';
import { WaypointNode } from './nodes/WaypointNode';
import { SolarPanelNode } from './nodes/SolarPanelNode';
import { TransmissionTowerNode } from './nodes/TransmissionTowerNode';
import { PanelDistribusiNode } from './nodes/PanelDistribusiNode';
import { WindTurbineNode } from './nodes/WindTurbineNode';
import { WireEdge } from './WireEdge';

interface CircuitCanvasInnerProps {
  reactFlowWrapper: React.RefObject<HTMLDivElement | null>;
}

const CircuitCanvasInner: React.FC<CircuitCanvasInnerProps> = ({ reactFlowWrapper }) => {
  const nodes = useCircuitStore((state) => state.nodes);
  const edges = useCircuitStore((state) => state.edges);
  const onNodesChange = useCircuitStore((state) => state.onNodesChange);
  const onEdgesChange = useCircuitStore((state) => state.onEdgesChange);
  const onConnect = useCircuitStore((state) => state.onConnect);
  const addComponent = useCircuitStore((state) => state.addComponent);
  const selectNode = useCircuitStore((state) => state.selectNode);
  const selectEdge = useCircuitStore((state) => state.selectEdge);
  const splitEdgeWithWaypoint = useCircuitStore((state) => state.splitEdgeWithWaypoint);
  const insertBatteryIntoHolder = useCircuitStore((state) => state.insertBatteryIntoHolder);
  const fitViewTrigger = useCircuitStore((state) => state.fitViewTrigger);
  const settleBulbAfterDrag = useCircuitStore((state) => state.settleBulbAfterDrag);
  const syncSnappedBulbPosition = useCircuitStore((state) => state.syncSnappedBulbPosition);
  const theme = useCircuitStore((state) => state.theme);

  const labNodes = useMemo(
    () => nodes.filter((n) => (n.data.worldMode ?? 'lab') === 'lab'),
    [nodes]
  );

  const labEdges = useMemo(() => {
    const labNodeIdSet = new Set(labNodes.map((n) => n.id));
    return edges.filter((e) => labNodeIdSet.has(e.source) && labNodeIdSet.has(e.target));
  }, [edges, labNodes]);

  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null);

  // Automatically frame the circuit whenever a built-in or custom preset is loaded
  useEffect(() => {
    if (!reactFlowInstance || fitViewTrigger === 0) return;
    const timer = window.setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.24, minZoom: 0.12, duration: 400 });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [fitViewTrigger, reactFlowInstance]);

  const nodeTypes = useMemo(
    () => ({
      battery: BatteryNode,
      battery9v: Battery9VNode,
      'battery-holder': BatteryHolderNode,
      resistor: ResistorNode,
      bulb: BulbNode,
      switch: SwitchNode,
      socket: SocketNode,
      'pin-socket': PinSocketNode,
      'socket-pin': PinSocketNode,
      ground: GroundNode,
      voltmeter: VoltmeterNode,
      ammeter: AmmeterNode,
      waypoint: WaypointNode,
      'solar-panel': SolarPanelNode,
      'solar_panel': SolarPanelNode,
      'transmission-tower': TransmissionTowerNode,
      'transmission_tower': TransmissionTowerNode,
      'distribution-panel': PanelDistribusiNode,
      'distribution_panel': PanelDistribusiNode,
      'wind-turbine': WindTurbineNode,
      'wind_turbine': WindTurbineNode,
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      wire: WireEdge,
      smoothstep: WireEdge,
      default: WireEdge,
    }),
    []
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'wire',
      animated: false,
    }),
    []
  );

  const connectionLineStyle = useMemo(
    () => ({
      stroke: '#38BDF8',
      strokeWidth: 3,
      strokeLinecap: 'round' as const,
    }),
    []
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const droppedEntry = getPaletteEntry(
        event.dataTransfer.getData(PALETTE_DRAG_MIME)
      );

      if (!droppedEntry || !reactFlowInstance || !reactFlowWrapper.current) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      addComponent(droppedEntry.type, position, droppedEntry.placement);
    },
    [reactFlowInstance, addComponent, reactFlowWrapper]
  );

  /**
   * Keeps a bulb that is snapped into a socket moving together with that socket.
   * Time Complexity: O(N) per drag tick.
   */
  const onNodeDrag = useCallback(
    (_event: React.MouseEvent, draggedNode: Node<CircuitElementData>) => {
      if (
        (draggedNode.data?.type === 'socket' || draggedNode.data?.type === 'pin-socket') &&
        draggedNode.data.bulbId
      ) {
        syncSnappedBulbPosition(draggedNode.id, draggedNode.position);
      }
    },
    [syncSnappedBulbPosition]
  );

  /**
   * Drop handling:
   * - Bulb      -> snap into a nearby free socket (or reject pin-base bulbs with a toast).
   * - AA battery -> insert into a nearby battery holder.
   * Time Complexity: O(N) where N is the number of nodes on the canvas.
   */
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, draggedNode: Node<CircuitElementData>) => {
      if (draggedNode.data?.type === 'bulb') {
        settleBulbAfterDrag(draggedNode.id);
        return;
      }
      if (draggedNode.data?.type !== 'battery') return;

      const batteryCenterX = draggedNode.position.x + 24;
      const batteryCenterY = draggedNode.position.y + 68;

      const targetHolder = nodes.find((candidate) => {
        if (candidate.id === draggedNode.id || candidate.data.type !== 'battery-holder') {
          return false;
        }
        const currentCells =
          candidate.data.batteryCount ?? (candidate.data.hasBattery ? 2 : 0);
        if (currentCells >= 2) return false; // Holder is full

        const holderCenterX = candidate.position.x + 70;
        const holderCenterY = candidate.position.y + 103;

        const deltaX = Math.abs(batteryCenterX - holderCenterX);
        const deltaY = Math.abs(batteryCenterY - holderCenterY);
        return deltaX < 135 && deltaY < 155;
      });

      if (targetHolder) {
        insertBatteryIntoHolder(draggedNode.id, targetHolder.id);
      }
    },
    [nodes, insertBatteryIntoHolder, settleBulbAfterDrag]
  );

  // Allow double-clicking any edge directly to insert a Waypoint anchor bend
  const onEdgeDoubleClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      if (!reactFlowInstance) return;
      const clickPosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      splitEdgeWithWaypoint(edge.id, clickPosition);
    },
    [reactFlowInstance, splitEdgeWithWaypoint]
  );

  return (
    <div
      className={`w-full h-full absolute inset-0 overflow-hidden transition-colors duration-300 ${
        theme === 'light' ? 'bg-[#F8FAFC]' : 'bg-void-950'
      }`}
      ref={reactFlowWrapper}
    >
      <ReactFlow
        nodes={labNodes}
        edges={labEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onEdgeDoubleClick={onEdgeDoubleClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType={ConnectionLineType.Bezier}
        connectionMode={ConnectionMode.Loose}
        connectionLineStyle={connectionLineStyle}
        onNodeClick={(_, node) => {
          selectEdge(null);
          selectNode(node.id);
        }}
        onEdgeClick={(_, edge) => {
          selectNode(null);
          selectEdge(edge.id);
        }}
        onPaneClick={() => {
          selectNode(null);
          selectEdge(null);
        }}
        fitView
        fitViewOptions={{ padding: 0.24, minZoom: 0.12 }}
        minZoom={0.12}
        maxZoom={2.5}
        snapToGrid
        snapGrid={[15, 15]}
        deleteKeyCode={['Backspace', 'Delete']}
        className="bg-transparent relative z-10"
      >
        <Background
          variant={BackgroundVariant.Lines}
          gap={20}
          size={1}
          color={theme === 'light' ? '#CBD5E1' : '#27272A'}
        />
        <Controls
          className="!bg-void-900 !border !border-white/10 !rounded-lg !overflow-hidden [&>button]:!bg-void-900 [&>button]:!border-b [&>button]:!border-white/10 [&>button]:!text-slate-300 hover:[&>button]:!bg-void-800"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
};

export const CircuitCanvas: React.FC = () => {
  const reactFlowWrapper = React.useRef<HTMLDivElement | null>(null);

  return (
    <ReactFlowProvider>
      <CircuitCanvasInner reactFlowWrapper={reactFlowWrapper} />
    </ReactFlowProvider>
  );
};
