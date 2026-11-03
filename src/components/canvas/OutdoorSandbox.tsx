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
  ChevronLeft,
  ChevronRight,
  Compass,
  Droplets,
  Eraser,
  Flame,
  Hand,
  Layers,
  RotateCcw,
  Sparkles,
  Sprout,
  Sun,
} from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';
import {
  CircuitElementData,
  ExplosionEvent,
  TerrainBrushTool,
} from '../../types/circuit';
import { PALETTE_DRAG_MIME, getPaletteEntry } from '../../constants/componentCatalog';
import {
  evaluateComponentDropPhysics,
  getHillEdgeSlopeSide,
  GRID_COLS,
  GRID_ROWS,
  OUTDOOR_WORLD_MIN_WIDTH,
} from '../../physics/terrainGrid';
import {
  computeTerrainShadowPolygons,
} from '../../physics/terrainClimateEngine';
import { createOutdoorPowerStationElements } from '../../utils/outdoorSpawnUtils';
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
import { TransmissionWireEdge } from './TransmissionWireEdge';
import { BessSubstationNode } from './nodes/BessSubstationNode';
import { HydroTurbineNode } from './nodes/HydroTurbineNode';


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

      {/* Floating Short-Circuit / Impact Alert Pill */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-red-600/95 border border-yellow-300 text-white font-mono text-xs font-bold shadow-[0_0_24px_rgba(239,68,68,0.9)] flex items-center gap-1.5 animate-bounce">
        <Flame className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
        <span>
          {explosion.reason === 'height'
            ? 'BOOM! HANCUR JATUH DARI KETINGGIAN!'
            : 'BOOM! KORSLETING AIR!'}
        </span>
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
  const dirtExposureMap = useCircuitStore((state) => state.dirtExposureMap);
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
  const sunTimeOfDay = useCircuitStore((state) => state.sunTimeOfDay);
  const setSunTimeOfDay = useCircuitStore((state) => state.setSunTimeOfDay);

  const shadowPolygons = useMemo(() => {
    return computeTerrainShadowPolygons(
      terrainGrid,
      OUTDOOR_WORLD_MIN_WIDTH,
      680,
      sunTimeOfDay
    );
  }, [terrainGrid, sunTimeOfDay]);

  const isId = language === 'id';
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [isPaintingTerrain, setIsPaintingTerrain] = useState(false);
  const [cameraScrollX, setCameraScrollX] = useState(0);
  const [maxCameraScrollX, setMaxCameraScrollX] = useState(800);

  // Track sky/terrain drag-to-pan state when terrainBrush === 'cursor'
  const panDragStateRef = useRef<{
    isPanning: boolean;
    startClientX: number;
    startScrollLeft: number;
  }>({
    isPanning: false,
    startClientX: 0,
    startScrollLeft: 0,
  });

  // Store each node's initial position before dragging so overlap rejection can snap it back
  const dragStartPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  // Track actively dragged node ID so terrain gravity effects NEVER interrupt an active drag
  const activeDraggedNodeIdRef = useRef<string | null>(null);

  // Filter nodes & edges belonging to the 'outside' world
  const outdoorNodes = useMemo(
    () =>
      nodes.filter(
        (n) =>
          n.data.worldMode === 'outside' ||
          n.data.type === 'solar-panel' ||
          n.data.type === 'solar_panel' ||
          n.data.type === 'wind-turbine' ||
          n.data.type === 'wind_turbine'
      ),
    [nodes]
  );

  const outdoorEdges = useMemo(() => {
    const outdoorIds = new Set(outdoorNodes.map((n) => n.id));
    return edges.filter((e) => outdoorIds.has(e.source) && outdoorIds.has(e.target));
  }, [edges, outdoorNodes]);

  // Keep camera scroll slider synchronized with viewport size & scroll position
  const syncCameraScrollMetrics = useCallback(() => {
    const vp = scrollViewportRef.current;
    if (!vp) return;
    const maxScroll = Math.max(0, vp.scrollWidth - vp.clientWidth);
    setMaxCameraScrollX(maxScroll);
    setCameraScrollX(Math.round(vp.scrollLeft));
  }, []);

  useEffect(() => {
    syncCameraScrollMetrics();
    const vp = scrollViewportRef.current;
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && vp) {
      resizeObserver = new ResizeObserver(() => {
        syncCameraScrollMetrics();
      });
      resizeObserver.observe(vp);
    }
    window.addEventListener('resize', syncCameraScrollMetrics);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', syncCameraScrollMetrics);
    };
  }, [syncCameraScrollMetrics]);

  const scrollWorldBy = useCallback((deltaX: number) => {
    const vp = scrollViewportRef.current;
    if (!vp) return;
    vp.scrollBy({ left: deltaX, behavior: 'smooth' });
  }, []);

  // Run Gravity (falling Dirt/Water + Liquid Leveling) and 3-Second Grass Growth physics loop
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      tickTerrainPhysics(Date.now());
    }, 80);
    return () => window.clearInterval(intervalId);
  }, [tickTerrainPhysics]);

  // When terrainGrid changes (e.g. dirt dug out under a component or water poured onto a component),
  // apply gravity & hazard checks ONLY to non-dragging outdoor components.
  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const currentOutdoorNodes = useCircuitStore
      .getState()
      .nodes.filter((n) => n.data.worldMode === 'outside');

    for (const node of currentOutdoorNodes) {
      if (node.data.type === 'waypoint') continue;
      if (activeDraggedNodeIdRef.current === node.id) continue;

      const outcome = evaluateComponentDropPhysics(
        node.position,
        node.data.type,
        node.id,
        currentOutdoorNodes,
        terrainGrid,
        { width: rect.width, height: rect.height }
      );

      if (
        outcome.status === 'explode-water' ||
        outcome.status === 'explode-height' ||
        (outcome.status === 'settled' &&
          Math.abs(outcome.settledPosition.y - node.position.y) > 2)
      ) {
        settleOutdoorNodeAfterDrag(node.id, node.position, {
          width: rect.width,
          height: rect.height,
        });
        break;
      }
    }
  }, [terrainGrid, settleOutdoorNodeAfterDrag]);

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
      'bess-substation': BessSubstationNode,
      bess_substation: BessSubstationNode,
      'hydro-turbine': HydroTurbineNode,
      hydro_turbine: HydroTurbineNode,
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      wire: TransmissionWireEdge,
      smoothstep: TransmissionWireEdge,
      default: TransmissionWireEdge,
      transmission: TransmissionWireEdge,
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
      activeDraggedNodeIdRef.current = draggedNode.id;
      setIsPaintingTerrain(false);
      dragStartPositionsRef.current[draggedNode.id] = {
        x: draggedNode.position.x,
        y: draggedNode.position.y,
      };
    },
    []
  );

  /**
   * Handles releasing a dragged outdoor component:
   * 1. Checks if dropped from too high (> MAX_SAFE_DROP_ROWS) -> explodes on impact!
   * 2. Checks if dropped on WATER -> triggers Explosion, deletes node, shows toast.
   * 3. Checks if bounding box overlaps another outdoor component -> rejects & returns to start position.
   * 4. Otherwise settles the component down onto the terrain surface by gravity.
   */
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, draggedNode: Node<CircuitElementData>) => {
      activeDraggedNodeIdRef.current = null;
      if (!containerRef.current) return;
      const bounds = containerRef.current.getBoundingClientRect();
      const previousPosition = dragStartPositionsRef.current[draggedNode.id] ?? {
        x: 30,
        y: 120,
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
   * grounded directly on the grassy terrain surface across the spacious 1360px panoramic world!
   */
  const handleSpawnOutdoorPowerStation = useCallback(() => {
    const state = useCircuitStore.getState();
    const bounds = containerRef.current?.getBoundingClientRect();
    const canvasWidth =
      bounds && bounds.width >= OUTDOOR_WORLD_MIN_WIDTH
        ? bounds.width
        : OUTDOOR_WORLD_MIN_WIDTH;
    const canvasHeight = bounds && bounds.height > 250 ? bounds.height : 680;

    // Clear existing outdoor nodes first to avoid overlap, and purge any rogue solar/wind nodes from nonOutdoor
    const nonOutdoorNodes = state.nodes.filter(
      (n) =>
        n.data.worldMode !== 'outside' &&
        n.data.type !== 'solar-panel' &&
        n.data.type !== 'solar_panel' &&
        n.data.type !== 'wind-turbine' &&
        n.data.type !== 'wind_turbine'
    );
    const outdoorNodeIds = new Set(
      state.nodes
        .filter(
          (n) =>
            n.data.worldMode === 'outside' ||
            n.data.type === 'solar-panel' ||
            n.data.type === 'solar_panel' ||
            n.data.type === 'wind-turbine' ||
            n.data.type === 'wind_turbine'
        )
        .map((n) => n.id)
    );
    const nonOutdoorEdges = state.edges.filter(
      (e) => !outdoorNodeIds.has(e.source) && !outdoorNodeIds.has(e.target)
    );

    const { nodes: newOutdoorNodes, edges: newOutdoorEdges } = createOutdoorPowerStationElements({
      terrainGrid: state.terrainGrid,
      canvasWidth,
      canvasHeight,
      isId,
      sunlightPercent: 100,
      windSpeedPercent: 100,
    });

    useCircuitStore.setState({
      edges: [...nonOutdoorEdges, ...newOutdoorEdges],
      worldMode: 'outside',
    });
    state.setNodes([...nonOutdoorNodes, ...newOutdoorNodes]);
    scrollViewportRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
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
    <div className="w-full h-full absolute inset-0 overflow-hidden select-none">
      {/* ====================================================================
          PANORAMIC SCROLLABLE WORLD VIEWPORT (1360px Minimum Width)
          Allows panning across the entire 40-column landscape on mobile & desktop!
         ==================================================================== */}
      <div
        id="outdoor-scroll-viewport"
        ref={scrollViewportRef}
        onScroll={syncCameraScrollMetrics}
        className="w-full h-full overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x select-none"
      >
        <div
          id="outdoor-world-stage"
          ref={containerRef}
          style={{ minWidth: `${OUTDOOR_WORLD_MIN_WIDTH}px` }}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onPointerDown={(e) => {
            // Never block or hijack pointer events when touching a component node, handle, or wire!
            const targetEl = e.target as HTMLElement | null;
            if (
              targetEl?.closest(
                '.react-flow__node, .react-flow__handle, .react-flow__edge, button, input'
              )
            ) {
              return;
            }
            if (terrainBrush !== 'cursor') {
              setIsPaintingTerrain(true);
              handleTerrainPointerAction(e.clientX, e.clientY);
            } else if (scrollViewportRef.current && e.pointerType !== 'touch') {
              // In 'Geser & Kabel' mode, mouse dragging empty sky/terrain smoothly pans the camera horizontally!
              // For touch screens (mobile phones), native touch-pan-x handles momentum scrolling smoothly.
              panDragStateRef.current = {
                isPanning: true,
                startClientX: e.clientX,
                startScrollLeft: scrollViewportRef.current.scrollLeft,
              };
              if (e.pointerType === 'mouse') {
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch {
                  // Ignore pointer capture errors in testing/virtual DOM environments
                }
              }
            }
          }}
          onPointerMove={(e) => {
            if (
              isPaintingTerrain &&
              terrainBrush !== 'cursor' &&
              !activeDraggedNodeIdRef.current
            ) {
              handleTerrainPointerAction(e.clientX, e.clientY);
            } else if (
              panDragStateRef.current.isPanning &&
              terrainBrush === 'cursor' &&
              !activeDraggedNodeIdRef.current &&
              scrollViewportRef.current &&
              e.pointerType !== 'touch'
            ) {
              const deltaX = e.clientX - panDragStateRef.current.startClientX;
              scrollViewportRef.current.scrollLeft =
                panDragStateRef.current.startScrollLeft - deltaX;
            }
          }}
          onPointerUp={(e) => {
            setIsPaintingTerrain(false);
            panDragStateRef.current.isPanning = false;
            try {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
            } catch {
              // Ignore
            }
          }}
          onPointerCancel={(e) => {
            setIsPaintingTerrain(false);
            panDragStateRef.current.isPanning = false;
            try {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
            } catch {
              // Ignore
            }
          }}
          onPointerLeave={() => {
            if (!panDragStateRef.current.isPanning) {
              setIsPaintingTerrain(false);
            }
          }}
          className={`w-full h-full relative overflow-hidden select-none ${
            terrainBrush !== 'cursor'
              ? 'cursor-crosshair'
              : 'cursor-grab active:cursor-grabbing'
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
              LAYER 1 (z-10): 40x20 2D Terrain Grid (DIRT & Cohesive Liquid WATER)
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
                  const isTopWaterSurface =
                    rIdx === 0 || terrainGrid[rIdx - 1]?.[cIdx] === 'EMPTY';
                  return (
                    <div
                      key={key}
                      className="w-[calc(100%+1px)] h-[calc(100%+1px)] relative overflow-hidden bg-sky-500/25"
                      style={{
                        backgroundImage: "url('/assets/tile-water.png')",
                        backgroundSize: '120px 120px',
                        backgroundPosition: `-${(cIdx % 6) * 20}px -${(rIdx % 6) * 20}px`,
                        opacity: 0.72,
                      }}
                    >
                      {/* Continuous liquid surface crest highlight only on top-most water row */}
                      {isTopWaterSurface && (
                        <div className="absolute inset-x-0 top-0 h-[3px] bg-cyan-200/85 shadow-[0_0_8px_rgba(103,232,249,0.95)]" />
                      )}
                    </div>
                  );
                }

                // Both 'DIRT' and 'GRASS' have a solid 'tile-dirt.png' earth foundation.
                // After 3 seconds of air exposure on a hill edge, the sharp 90° corner slumps
                // into a smooth diagonal slope ('left' = / ramp, 'right' = \ ramp).
                const slopeSide = getHillEdgeSlopeSide(
                  terrainGrid,
                  dirtExposureMap,
                  rIdx,
                  cIdx
                );
                const dirtClipPath =
                  slopeSide === 'left'
                    ? 'polygon(0% 100%, 100% 0%, 100% 100%)'
                    : slopeSide === 'right'
                    ? 'polygon(0% 0%, 100% 100%, 0% 100%)'
                    : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';

                return (
                  <div
                    key={key}
                    className="w-[calc(100%+1px)] h-[calc(100%+1px)] relative transition-[clip-path] duration-500 ease-out"
                    style={{
                      backgroundImage: "url('/assets/tile-dirt.png')",
                      backgroundSize: '100% 100%',
                      clipPath: dirtClipPath,
                    }}
                  />
                );
              })
            )}
          </div>

          {/* ====================================================================
              LAYER 1.5 (z-15): Smooth 1D Topographic Terrain Shadow Projections
              Renders realistic shadows cast by dirt hills across plains and valleys.
             ==================================================================== */}
          {shadowPolygons.length > 0 && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-15 mix-blend-multiply"
              viewBox={`0 0 ${OUTDOOR_WORLD_MIN_WIDTH} 680`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="terrain-hill-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#090d16" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#090d16" stopOpacity="0.30" />
                </linearGradient>
              </defs>
              {shadowPolygons.map((poly, idx) => (
                <path
                  key={`shadow-${poly.startCol}-${poly.endCol}-${idx}`}
                  d={poly.pathData}
                  fill="url(#terrain-hill-shadow)"
                />
              ))}
            </svg>
          )}

          {/* ====================================================================
              LAYER 2 (z-20): Free-Position Power Source Components & Wires
              (Always pointer-events-auto on nodes so dragging NEVER gets stuck!)
             ==================================================================== */}
          <div className={`absolute inset-0 z-20 pointer-events-auto ${terrainBrush === 'cursor' ? '[&_.react-flow__pane]:touch-pan-x' : '[&_.react-flow__pane]:touch-none'}`}>
            <ReactFlow
              nodes={outdoorNodes}
              edges={outdoorEdges}
              proOptions={{ hideAttribution: true }}
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
              connectionRadius={40}
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
              className={`bg-transparent w-full h-full ${terrainBrush === 'cursor' ? 'touch-pan-x' : 'touch-none'}`}
            />
          </div>

          {/* ====================================================================
              LAYER 3 (z-30, LOW-PROFILE GRASS BLADES): Grass Layer Overlay
              Uses `-top-[24%] h-[108%]` with `pointer-events: none` so component
              feet look naturally planted in grass WITHOUT covering `+` / `-` handles!
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

                const slopeSide = getHillEdgeSlopeSide(
                  terrainGrid,
                  dirtExposureMap,
                  rIdx,
                  cIdx
                );

                return (
                  <div
                    key={key}
                    className="relative w-full h-full overflow-visible"
                  >
                    <img
                      src="/assets/grass-layer.png"
                      alt=""
                      draggable={false}
                      style={
                        slopeSide === 'left'
                          ? {
                              position: 'absolute',
                              width: '142%',
                              height: '100%',
                              left: '0%',
                              top: '100%',
                              transform: 'rotate(-45deg) translateY(-24%)',
                              transformOrigin: '0% 0%',
                            }
                          : slopeSide === 'right'
                          ? {
                              position: 'absolute',
                              width: '142%',
                              height: '100%',
                              left: '0%',
                              top: '0%',
                              transform: 'rotate(45deg) translateY(-24%)',
                              transformOrigin: '0% 0%',
                            }
                          : undefined
                      }
                      className={
                        slopeSide
                          ? 'max-w-none object-cover pointer-events-none select-none transition-transform duration-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]'
                          : 'absolute inset-x-0 -top-[24%] w-[108%] -left-[4%] h-[108%] max-w-none object-cover pointer-events-none select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]'
                      }
                    />
                  </div>
                );
              })
            )}
          </div>

          {/* ====================================================================
              LAYER 4 (z-40): Water / Height Explosion Particle Overlay
             ==================================================================== */}
          <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
            {explosions.map((exp) => (
              <WaterExplosionEffect key={exp.id} explosion={exp} />
            ))}
          </div>
        </div>
      </div>

      {/* ====================================================================
          TOP FLOATING SANDBOX TOOLBAR (Fixed to Screen Viewport)
         ==================================================================== */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-3 left-3 right-3 z-40 flex flex-wrap items-center justify-between gap-2 pointer-events-none"
      >
        {/* Left: Terrain Brush Selector */}
        <div
          id="tour-outdoor-brushes"
          className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-void-950/90 backdrop-blur-md border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.65)] pointer-events-auto"
        >
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

        {/* Center: Sun Position / Time of Day (Mikroklimat Bayangan Matahari) */}
        <div
          id="tour-outdoor-sun-time"
          className="flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-void-950/90 backdrop-blur-md border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.65)] pointer-events-auto"
        >
          <span className="hidden md:flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-amber-400 px-1 font-bold">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            {isId ? 'Matahari:' : 'Sun:'}
          </span>

          <button
            type="button"
            onClick={() => setSunTimeOfDay('morning')}
            title={isId ? 'Matahari Pagi (Bayangan ke Timur)' : 'Morning Sun (Shadows East-to-West)'}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-semibold border transition-all active:scale-95 cursor-pointer ${
              sunTimeOfDay === 'morning'
                ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-void-900/90 hover:bg-void-800 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <span>🌅</span>
            <span>{isId ? 'Pagi (35°)' : 'Morning (35°)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSunTimeOfDay('noon')}
            title={isId ? 'Matahari Siang (Tinggi di Atas)' : 'Noon Sun (High Overhead)'}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-semibold border transition-all active:scale-95 cursor-pointer ${
              sunTimeOfDay === 'noon'
                ? 'bg-yellow-500/25 border-yellow-400 text-yellow-200 shadow-[0_0_12px_rgba(234,179,8,0.3)]'
                : 'bg-void-900/90 hover:bg-void-800 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <span>☀️</span>
            <span>{isId ? 'Siang (75°)' : 'Noon (75°)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSunTimeOfDay('afternoon')}
            title={isId ? 'Matahari Sore (Bayangan ke Barat)' : 'Afternoon Sun (Shadows West-to-East)'}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-semibold border transition-all active:scale-95 cursor-pointer ${
              sunTimeOfDay === 'afternoon'
                ? 'bg-orange-500/25 border-orange-400 text-orange-200 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                : 'bg-void-900/90 hover:bg-void-800 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <span>🌇</span>
            <span>{isId ? 'Sore (35°)' : 'Afternoon (35°)'}</span>
          </button>
        </div>

        {/* Right: Quick Demo Generator */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            id="tour-outdoor-spawn"
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

      {/* ====================================================================
          BOTTOM WORLD CAMERA NAVIGATION BAR (Visible when World > Viewport)
         ==================================================================== */}
      {maxCameraScrollX > 10 && (
        <div
          id="tour-outdoor-camera"
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-void-950/90 backdrop-blur-md border border-white/15 shadow-[0_8px_25px_rgba(0,0,0,0.65)] pointer-events-auto max-w-[92vw]"
        >
          <button
            type="button"
            onClick={() => scrollWorldBy(-280)}
            className="p-1 rounded-full bg-void-850 hover:bg-void-800 text-cyan-300 border border-white/10 active:scale-95 cursor-pointer"
            title={isId ? 'Geser Kamera ke Kiri' : 'Pan Camera Left'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 min-w-[140px] sm:min-w-[200px]">
            <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <input
              type="range"
              min={0}
              max={maxCameraScrollX}
              value={Math.min(cameraScrollX, maxCameraScrollX)}
              onChange={(e) => {
                const nextX = Number(e.target.value);
                setCameraScrollX(nextX);
                if (scrollViewportRef.current) {
                  scrollViewportRef.current.scrollLeft = nextX;
                }
              }}
              className="w-full h-1.5 bg-void-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 touch-none"
              aria-label={isId ? 'Geser Kamera Dunia Alam' : 'Pan Outdoor World Camera'}
            />
          </div>

          <button
            type="button"
            onClick={() => scrollWorldBy(280)}
            className="p-1 rounded-full bg-void-850 hover:bg-void-800 text-cyan-300 border border-white/10 active:scale-95 cursor-pointer"
            title={isId ? 'Geser Kamera ke Kanan (Sungai)' : 'Pan Camera Right (River)'}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

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
