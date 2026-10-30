import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  ConnectionLineType,
  ConnectionMode,
  Edge,
  Node,
  ReactFlowInstance,
  ReactFlowProvider,
} from 'reactflow';
import {
  Droplets,
  Eraser,
  Flame,
  Hand,
  Layers,
  RotateCcw,
  Sparkles,
  Sprout,
  Zap,
} from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';
import {
  CircuitElementData,
  ExplosionEvent,
  TerrainBrushTool,
} from '../../types/circuit';
import { PALETTE_DRAG_MIME, getPaletteEntry } from '../../constants/componentCatalog';
import {
  doesComponentTouchWater,
  getComponentBoundingBox,
  GRID_COLS,
  GRID_ROWS,
} from '../../physics/terrainGrid';
import { SolarPanelNode } from './nodes/SolarPanelNode';
import { WindTurbineNode } from './nodes/WindTurbineNode';
import { TransmissionTowerNode } from './nodes/TransmissionTowerNode';
import { WaypointNode } from './nodes/WaypointNode';
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
import { WireEdge } from './WireEdge';

/**
 * Radial particle vectors for the Water Short-Circuit Explosion animation.
 */
const EXPLOSION_PARTICLES: ReadonlyArray<{
  tx: string;
  ty: string;
  colorClass: string;
  sizeClass: string;
}> = [
  { tx: '-85px', ty: '-75px', colorClass: 'bg-red-500', sizeClass: 'w-4 h-4' },
  { tx: '85px', ty: '-70px', colorClass: 'bg-amber-400', sizeClass: 'w-3.5 h-3.5' },
  { tx: '-95px', ty: '20px', colorClass: 'bg-yellow-300', sizeClass: 'w-3 h-3' },
  { tx: '95px', ty: '25px', colorClass: 'bg-orange-500', sizeClass: 'w-4 h-4' },
  { tx: '-55px', ty: '85px', colorClass: 'bg-red-400', sizeClass: 'w-3.5 h-3.5' },
  { tx: '60px', ty: '80px', colorClass: 'bg-yellow-400', sizeClass: 'w-3 h-3' },
  { tx: '0px', ty: '-105px', colorClass: 'bg-amber-300', sizeClass: 'w-4 h-4' },
  { tx: '-40px', ty: '-95px', colorClass: 'bg-orange-400', sizeClass: 'w-2.5 h-2.5' },
  { tx: '45px', ty: '-90px', colorClass: 'bg-red-500', sizeClass: 'w-3 h-3' },
  { tx: '-75px', ty: '-30px', colorClass: 'bg-cyan-300', sizeClass: 'w-2.5 h-2.5' },
  { tx: '75px', ty: '-35px', colorClass: 'bg-yellow-200', sizeClass: 'w-3 h-3' },
  { tx: '0px', ty: '95px', colorClass: 'bg-orange-500', sizeClass: 'w-3.5 h-3.5' },
];

/**
 * Renders a single Water Short-Circuit Explosion burst at the component's coordinates.
 */
const WaterExplosionEffect: React.FC<{ explosion: ExplosionEvent }> = ({ explosion }) => {
  const centerX = explosion.x + explosion.width / 2;
  const centerY = explosion.y + explosion.height / 2;

  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        left: `${centerX}px`,
        top: `${centerY}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Core Expanding Fireball (CSS scale-up + opacity 0) */}
      <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-red-600 via-amber-400 to-yellow-200 blur-md shadow-[0_0_60px_rgba(239,68,68,0.95)] animate-water-explode-core flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-white/90 blur-xs" />
      </div>

      {/* Shockwave Ring */}
      <div className="absolute inset-0 rounded-full border-4 border-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.9)] animate-water-explode-core" />

      {/* Red / Yellow / Orange Particle Sparks */}
      {EXPLOSION_PARTICLES.map((particle, index) => (
        <span
          key={index}
          style={
            {
              '--tx': particle.tx,
              '--ty': particle.ty,
            } as React.CSSProperties
          }
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.95)] animate-water-explode-particle ${particle.colorClass} ${particle.sizeClass}`}
        />
      ))}

      {/* Floating Short-Circuit Alert Pill */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-red-600/95 border border-yellow-300 text-white font-mono text-xs font-bold shadow-[0_0_24px_rgba(239,68,68,0.9)] flex items-center gap-1.5 animate-bounce">
        <Flame className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
        <span>BOOM! KORSLETING AIR!</span>
      </div>
    </div>
  );
};

const OutdoorSandboxInner: React.FC = () => {
  const nodes = useCircuitStore((state) => state.nodes);
  const edges = useCircuitStore((state) => state.edges);
  const onNodesChange = useCircuitStore((state) => state.onNodesChange);
  const onEdgesChange = useCircuitStore((state) => state.onEdgesChange);
  const onConnect = useCircuitStore((state) => state.onConnect);
  const selectNode = useCircuitStore((state) => state.selectNode);
  const selectEdge = useCircuitStore((state) => state.selectEdge);
  const splitEdgeWithWaypoint = useCircuitStore((state) => state.splitEdgeWithWaypoint);
  const language = useCircuitStore((state) => state.language);

  const terrainGrid = useCircuitStore((state) => state.terrainGrid);
  const terrainBrush = useCircuitStore((state) => state.terrainBrush);
  const setTerrainBrush = useCircuitStore((state) => state.setTerrainBrush);
  const paintTerrainCell = useCircuitStore((state) => state.paintTerrainCell);
  const tickTerrainPhysics = useCircuitStore((state) => state.tickTerrainPhysics);
  const resetOutdoorTerrain = useCircuitStore((state) => state.resetOutdoorTerrain);
  const placeOutdoorComponent = useCircuitStore((state) => state.placeOutdoorComponent);
  const settleOutdoorNodeAfterDrag = useCircuitStore(
    (state) => state.settleOutdoorNodeAfterDrag
  );
  const explosions = useCircuitStore((state) => state.explosions);

  const isId = language === 'id';
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [isPaintingTerrain, setIsPaintingTerrain] = useState(false);

  // Store each node's initial position before dragging so overlap rejection can snap it back
  const dragStartPositionsRef = useRef<Record<string, { x: number; y: number }>>({});

  // Filter nodes & edges belonging to the 'outside' world
  const outdoorNodes = useMemo(
    () => nodes.filter((n) => n.data.worldMode === 'outside'),
    [nodes]
  );

  const outdoorEdges = useMemo(() => {
    const outdoorIds = new Set(outdoorNodes.map((n) => n.id));
    return edges.filter((e) => outdoorIds.has(e.source) && outdoorIds.has(e.target));
  }, [edges, outdoorNodes]);

  // Run Gravity (falling Dirt/Water) and 3-Second Grass Growth physics loop
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      tickTerrainPhysics(Date.now());
    }, 80);
    return () => window.clearInterval(intervalId);
  }, [tickTerrainPhysics]);

  // Check if newly fallen/painted water touches any existing outdoor component -> trigger explosion!
  useEffect(() => {
    if (!containerRef.current || outdoorNodes.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    for (const node of outdoorNodes) {
      if (node.data.type === 'waypoint') continue;
      const box = getComponentBoundingBox(node.position, node.data.type);
      if (doesComponentTouchWater(box, terrainGrid, rect.width, rect.height)) {
        settleOutdoorNodeAfterDrag(node.id, node.position, {
          width: rect.width,
          height: rect.height,
        });
        break;
      }
    }
  }, [terrainGrid, outdoorNodes, settleOutdoorNodeAfterDrag]);

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
      solar_panel: SolarPanelNode,
      'transmission-tower': TransmissionTowerNode,
      transmission_tower: TransmissionTowerNode,
      'wind-turbine': WindTurbineNode,
      wind_turbine: WindTurbineNode,
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

  /**
   * Handles dropping a component from the left SidebarPalette onto the OutdoorSandbox.
   * Checks both Water Hazard (Explode!) and AABB Overlap before placing.
   */
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const droppedEntry = getPaletteEntry(event.dataTransfer.getData(PALETTE_DRAG_MIME));
      if (!droppedEntry || !containerRef.current) return;

      const bounds = containerRef.current.getBoundingClientRect();
      const rawX = event.clientX - bounds.left - 80;
      const rawY = event.clientY - bounds.top - 90;

      const clampedPosition = {
        x: Math.max(12, Math.min(bounds.width - 190, rawX)),
        y: Math.max(12, Math.min(bounds.height - 220, rawY)),
      };

      placeOutdoorComponent(
        droppedEntry.type,
        clampedPosition,
        { width: bounds.width, height: bounds.height },
        droppedEntry.placement
      );
    },
    [placeOutdoorComponent]
  );

  const onNodeDragStart = useCallback(
    (_event: React.MouseEvent, draggedNode: Node<CircuitElementData>) => {
      dragStartPositionsRef.current[draggedNode.id] = {
        x: draggedNode.position.x,
        y: draggedNode.position.y,
      };
    },
    []
  );

  /**
   * Handles releasing a dragged outdoor component:
   * 1. Checks if dropped on WATER -> triggers Explosion, deletes node, shows toast.
   * 2. Checks if bounding box overlaps another outdoor component -> rejects & returns to start position.
   */
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, draggedNode: Node<CircuitElementData>) => {
      if (!containerRef.current) return;
      const bounds = containerRef.current.getBoundingClientRect();
      const previousPosition = dragStartPositionsRef.current[draggedNode.id] ?? {
        x: 60,
        y: 80,
      };

      settleOutdoorNodeAfterDrag(draggedNode.id, previousPosition, {
        width: bounds.width,
        height: bounds.height,
      });
    },
    [settleOutdoorNodeAfterDrag]
  );

  const onEdgeDoubleClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      if (!containerRef.current) return;
      const bounds = containerRef.current.getBoundingClientRect();
      splitEdgeWithWaypoint(edge.id, {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    },
    [splitEdgeWithWaypoint]
  );

  /**
   * Paints terrain cells when the user clicks or drags with a terrain brush ('DIRT' | 'WATER' | 'EMPTY').
   */
  const handleTerrainPointerAction = useCallback(
    (clientX: number, clientY: number) => {
      if (terrainBrush === 'cursor' || !containerRef.current) return;
      const bounds = containerRef.current.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) return;

      const relX = clientX - bounds.left;
      const relY = clientY - bounds.top;
      const col = Math.floor((relX / bounds.width) * GRID_COLS);
      const row = Math.floor((relY / bounds.height) * GRID_ROWS);

      if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
        paintTerrainCell(row, col, terrainBrush, false);
      }
    },
    [terrainBrush, paintTerrainCell]
  );

  /**
   * Spawns a ready-to-use Outdoor Renewable Power Station (Solar Panel 12V + Wind Turbine + Transmission Tower)
   * on the grassy plateau and wires them in parallel to the Transmission Tower!
   */
  const handleSpawnOutdoorPowerStation = useCallback(() => {
    const state = useCircuitStore.getState();
    const bounds = containerRef.current?.getBoundingClientRect();
    const canvasHeight = bounds && bounds.height > 300 ? bounds.height : 680;
    const groundY = Math.max(90, Math.round(canvasHeight * 0.72) - 235);

    // Clear existing outdoor nodes first to avoid overlap
    const nonOutdoorNodes = state.nodes.filter((n) => n.data.worldMode !== 'outside');
    const outdoorNodeIds = new Set(
      state.nodes.filter((n) => n.data.worldMode === 'outside').map((n) => n.id)
    );
    const nonOutdoorEdges = state.edges.filter(
      (e) => !outdoorNodeIds.has(e.source) && !outdoorNodeIds.has(e.target)
    );

    const solarId = `solar_out_${Date.now()}`;
    const turbineId = `wind_out_${Date.now() + 1}`;
    const towerId = `tower_out_${Date.now() + 2}`;

    const newOutdoorNodes: Node<CircuitElementData>[] = [
      {
        id: solarId,
        type: 'solar-panel',
        position: { x: 45, y: groundY + 45 },
        data: {
          id: solarId,
          type: 'solar-panel',
          worldMode: 'outside',
          sunlight: 100,
          voltage: 12.0,
          internalResistance: 0.2,
          label: isId ? 'Panel Surya Alam' : 'Outdoor Solar Panel',
        },
      },
      {
        id: turbineId,
        type: 'wind-turbine',
        position: { x: 265, y: Math.max(30, groundY - 45) },
        data: {
          id: turbineId,
          type: 'wind-turbine',
          worldMode: 'outside',
          speed: 100,
          voltage: 12.0,
          internalResistance: 0.1,
          label: isId ? 'Turbin Angin Alam' : 'Outdoor Wind Turbine',
        },
      },
      {
        id: towerId,
        type: 'transmission-tower',
        position: { x: 500, y: Math.max(40, groundY - 15) },
        data: {
          id: towerId,
          type: 'transmission-tower',
          worldMode: 'outside',
          label: isId ? 'Menara Transmisi Luar' : 'Outdoor Transmission Tower',
        },
      },
    ];

    const newOutdoorEdges: Edge[] = [
      {
        id: `wire_out_solar_pos_${Date.now()}`,
        type: 'wire',
        source: solarId,
        sourceHandle: 'pos',
        target: towerId,
        targetHandle: 'pos',
      },
      {
        id: `wire_out_solar_neg_${Date.now() + 1}`,
        type: 'wire',
        source: solarId,
        sourceHandle: 'neg',
        target: towerId,
        targetHandle: 'neg',
      },
      {
        id: `wire_out_wind_pos_${Date.now() + 2}`,
        type: 'wire',
        source: turbineId,
        sourceHandle: 'pos',
        target: towerId,
        targetHandle: 'pos',
      },
      {
        id: `wire_out_wind_neg_${Date.now() + 3}`,
        type: 'wire',
        source: turbineId,
        sourceHandle: 'neg',
        target: towerId,
        targetHandle: 'neg',
      },
    ];

    useCircuitStore.setState({
      edges: [...nonOutdoorEdges, ...newOutdoorEdges],
    });
    state.setNodes([...nonOutdoorNodes, ...newOutdoorNodes]);
    state.notify(
      isId
        ? '⚡ Pembangkit Listrik Alam (Solar + Turbin + Menara Transmisi) siap menyalurkan 12V ke Lab!'
        : '⚡ Outdoor Power Station (Solar + Wind + Transmission Tower) ready to transmit 12V to Lab!'
    );
  }, [isId]);

  const brushButtons: Array<{
    id: TerrainBrushTool;
    label: string;
    icon: React.ReactNode;
    activeClass: string;
  }> = [
    {
      id: 'cursor',
      label: isId ? 'Geser & Kabel' : 'Move & Wire',
      icon: <Hand className="w-3.5 h-3.5" />,
      activeClass: 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.3)]',
    },
    {
      id: 'DIRT',
      label: isId ? '+ Tanah (Gravity)' : '+ Dirt (Gravity)',
      icon: <Layers className="w-3.5 h-3.5 text-amber-400" />,
      activeClass: 'bg-amber-600/30 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
    },
    {
      id: 'WATER',
      label: isId ? '+ Air (Bahaya!)' : '+ Water (Hazard!)',
      icon: <Droplets className="w-3.5 h-3.5 text-sky-400" />,
      activeClass: 'bg-sky-500/30 border-sky-400 text-sky-100 shadow-[0_0_12px_rgba(56,189,248,0.35)]',
    },
    {
      id: 'EMPTY',
      label: isId ? 'Gali / Hapus' : 'Dig / Erase',
      icon: <Eraser className="w-3.5 h-3.5 text-rose-400" />,
      activeClass: 'bg-rose-500/25 border-rose-400 text-rose-200',
    },
  ];

  return (
    <div
      ref={containerRef}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onPointerDown={(e) => {
        if (terrainBrush !== 'cursor') {
          setIsPaintingTerrain(true);
          handleTerrainPointerAction(e.clientX, e.clientY);
        }
      }}
      onPointerMove={(e) => {
        if (isPaintingTerrain && terrainBrush !== 'cursor') {
          handleTerrainPointerAction(e.clientX, e.clientY);
        }
      }}
      onPointerUp={() => setIsPaintingTerrain(false)}
      onPointerLeave={() => setIsPaintingTerrain(false)}
      className={`w-full h-full relative overflow-hidden select-none ${
        terrainBrush !== 'cursor' ? 'cursor-crosshair' : ''
      }`}
    >
      {/* ====================================================================
          LAYER 0 (z-0): Blue Sky Nature Background (`nature-sunny.png`)
         ==================================================================== */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none z-0"
        style={{
          backgroundImage: "url('/assets/nature-sunny.png')",
        }}
      >
        {/* Subtle atmospheric sky gradient for crisp UI contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-950/25 via-transparent to-black/25" />
      </div>

      {/* ====================================================================
          LAYER 1 (z-10): 40x20 2D Terrain Grid (DIRT & Transparent WATER)
         ==================================================================== */}
      <div
        className="absolute inset-0 grid pointer-events-none z-10"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
        }}
      >
        {terrainGrid.map((rowCells, rIdx) =>
          rowCells.map((cellType, cIdx) => {
            const key = `${rIdx}-${cIdx}`;
            if (cellType === 'EMPTY') {
              return (
                <div
                  key={key}
                  className={
                    terrainBrush !== 'cursor'
                      ? 'border-[0.5px] border-white/[0.04]'
                      : ''
                  }
                />
              );
            }

            if (cellType === 'WATER') {
              return (
                <div
                  key={key}
                  className="w-full h-full relative overflow-hidden transition-all duration-75"
                  style={{
                    backgroundImage: "url('/assets/tile-water.png')",
                    backgroundSize: '100% 100%',
                    opacity: 0.6,
                  }}
                >
                  {/* Top surface water ripple highlight if air is above */}
                  {(rIdx === 0 || terrainGrid[rIdx - 1]?.[cIdx] === 'EMPTY') && (
                    <div className="absolute inset-x-0 top-0 h-1 bg-cyan-200/70 shadow-[0_0_8px_rgba(103,232,249,0.9)]" />
                  )}
                </div>
              );
            }

            // Both 'DIRT' and 'GRASS' have a solid 'tile-dirt.png' earth foundation
            return (
              <div
                key={key}
                className="w-full h-full relative transition-transform duration-75"
                style={{
                  backgroundImage: "url('/assets/tile-dirt.png')",
                  backgroundSize: '100% 100%',
                }}
              />
            );
          })
        )}
      </div>

      {/* ====================================================================
          LAYER 2 (z-20): Free-Position Power Source Components & Wires
          (React Flow locked 1:1 to terrain coordinates, snapToGrid={false})
         ==================================================================== */}
      <div
        className={`absolute inset-0 z-20 ${
          terrainBrush !== 'cursor' ? 'pointer-events-none' : 'pointer-events-auto'
        }`}
      >
        <ReactFlow
          nodes={outdoorNodes}
          edges={outdoorEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={(instance) => {
            setReactFlowInstance(instance);
            instance.setViewport({ x: 0, y: 0, zoom: 1 });
          }}
          onNodeDragStart={onNodeDragStart}
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
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={1}
          maxZoom={1}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          snapToGrid={false}
          deleteKeyCode={['Backspace', 'Delete']}
          className="bg-transparent w-full h-full"
        />
      </div>

      {/* ====================================================================
          LAYER 3 (z-30, HIGHEST OVER GRID & COMPONENTS): Grass Layer Overlay
          Uses `grass-layer.png` with `pointer-events: none` so placed components
          look naturally embedded / sunken into the lush green grass blades!
         ==================================================================== */}
      <div
        className="absolute inset-0 grid pointer-events-none z-30"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
        }}
      >
        {terrainGrid.map((rowCells, rIdx) =>
          rowCells.map((cellType, cIdx) => {
            const key = `grass-${rIdx}-${cIdx}`;
            if (cellType !== 'GRASS') {
              return <div key={key} />;
            }

            return (
              <div key={key} className="relative w-full h-full overflow-visible">
                <img
                  src="/assets/grass-layer.png"
                  alt=""
                  draggable={false}
                  className="absolute inset-x-0 -top-[65%] w-[108%] -left-[4%] h-[145%] max-w-none object-cover pointer-events-none select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
                />
              </div>
            );
          })
        )}
      </div>

      {/* ====================================================================
          LAYER 4 (z-40): Water Short-Circuit Explosion Particle Overlay
         ==================================================================== */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {explosions.map((exp) => (
          <WaterExplosionEffect key={exp.id} explosion={exp} />
        ))}
      </div>

      {/* ====================================================================
          TOP FLOATING SANDBOX TOOLBAR (Terrain Brushes & Power Station Spawner)
         ==================================================================== */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-3 left-3 right-3 z-40 flex flex-wrap items-center justify-between gap-2 pointer-events-none"
      >
        {/* Left: Terrain Brush Selector */}
        <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-void-950/90 backdrop-blur-md border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.65)] pointer-events-auto">
          <span className="hidden xl:flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-emerald-400 px-1.5 font-bold">
            <Sprout className="w-3.5 h-3.5" />
            {isId ? 'Medan 40×20:' : '40×20 Terrain:'}
          </span>

          {brushButtons.map((btn) => {
            const isActive = terrainBrush === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => setTerrainBrush(btn.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all active:scale-95 cursor-pointer ${
                  isActive
                    ? btn.activeClass
                    : 'bg-void-900/90 hover:bg-void-800 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                {btn.icon}
                <span>{btn.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={resetOutdoorTerrain}
            title={isId ? 'Reset Medan Alam' : 'Reset Terrain'}
            className="flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-medium bg-void-900/90 hover:bg-void-800 border border-white/10 text-slate-300 hover:text-white active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">{isId ? 'Reset Medan' : 'Reset'}</span>
          </button>
        </div>

        {/* Right: Quick Demo Generator & Physics Rules Hint */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={handleSpawnOutdoorPowerStation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 text-[11px] font-bold shadow-[0_8px_24px_rgba(16,185,129,0.25)] backdrop-blur-md active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>
              {isId
                ? '⚡ Pasang Pembangkit Alam (12V)'
                : '⚡ Spawn Outdoor Station (12V)'}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom-Left Educational Physics Legend */}
      <div className="hidden sm:flex absolute bottom-3 left-3 z-40 items-center gap-3 px-3.5 py-2 rounded-2xl bg-void-950/85 backdrop-blur-md border border-white/15 text-[11px] text-slate-200 shadow-xl pointer-events-none">
        <span className="flex items-center gap-1 text-emerald-300 font-medium">
          <Sprout className="w-3.5 h-3.5 text-emerald-400" />
          {isId
            ? 'Tanah terpapar udara 3 detik → Tumbuh Rumput'
            : 'Air-exposed Dirt (3s) → Grows Grass'}
        </span>
        <span className="text-white/20">|</span>
        <span className="flex items-center gap-1 text-sky-300 font-medium">
          <Droplets className="w-3.5 h-3.5 text-sky-400" />
          {isId
            ? 'Jatuhkan komponen ke Air → Meledak Korsleting!'
            : 'Drop component on Water → Short-Circuit Explosion!'}
        </span>
        <span className="text-white/20">|</span>
        <span className="flex items-center gap-1 text-amber-300 font-medium">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          {isId
            ? 'Sambung ke Menara Transmisi untuk kirim daya ke Lab'
            : 'Wire to Transmission Tower to send power to Lab'}
        </span>
      </div>

      {/* Suppress unused reactFlowInstance lint warning while keeping reference */}
      {reactFlowInstance ? null : null}
    </div>
  );
};

export const OutdoorSandbox: React.FC = () => {
  return (
    <ReactFlowProvider>
      <OutdoorSandboxInner />
    </ReactFlowProvider>
  );
};
