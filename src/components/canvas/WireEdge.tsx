import React, { useState } from 'react';
import {
  BaseEdge,
  EdgeProps,
  getBezierPath,
  getSmoothStepPath,
  Position,
  useReactFlow,
} from 'reactflow';
import { useCircuitStore } from '../../store/useCircuitStore';

/**
 * Computes natural tangent orientation for Waypoint anchor nodes so wires
 * never cross or form a figure-8 loop when routed right-to-left or vertically.
 * Time Complexity: O(1)
 */
function resolveWaypointPositions(
  source: string,
  target: string,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  defaultSourcePos: Position,
  defaultTargetPos: Position
): { effectiveSourcePos: Position; effectiveTargetPos: Position } {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const isHorizontal = Math.abs(dx) >= Math.abs(dy);

  let effectiveSourcePos = defaultSourcePos;
  let effectiveTargetPos = defaultTargetPos;

  if (source.startsWith('wp_')) {
    if (isHorizontal) {
      effectiveSourcePos = dx >= 0 ? Position.Right : Position.Left;
    } else {
      effectiveSourcePos = dy >= 0 ? Position.Bottom : Position.Top;
    }
  }

  if (target.startsWith('wp_')) {
    if (isHorizontal) {
      effectiveTargetPos = dx >= 0 ? Position.Left : Position.Right;
    } else {
      effectiveTargetPos = dy >= 0 ? Position.Top : Position.Bottom;
    }
  }

  return { effectiveSourcePos, effectiveTargetPos };
}

/**
 * Resolves the physical electrical current flowing through a specific wire edge
 * connecting `source` and `target` so parallel/multi-zone branches show their
 * true branch current and turn off cleanly when a zone switch opens.
 * Time Complexity: O(1)
 */
export function resolveEdgeBranchCurrent(
  source: string,
  target: string,
  branchCurrents: Record<string, number>
): number {
  const rawSourceI = Math.abs(branchCurrents[source] ?? 0);
  const rawTargetI = Math.abs(branchCurrents[target] ?? 0);
  const isSourceWaypoint = source.startsWith('wp_');
  const isTargetWaypoint = target.startsWith('wp_');

  if (!isSourceWaypoint && !isTargetWaypoint) {
    return Math.min(rawSourceI, rawTargetI);
  }
  if (!isSourceWaypoint && isTargetWaypoint) {
    return rawSourceI;
  }
  if (isSourceWaypoint && !isTargetWaypoint) {
    return rawTargetI;
  }
  return Math.max(rawSourceI, rawTargetI);
}

export type WirePolarity = 'positive' | 'negative' | 'neutral';

/**
 * Resolves polarity of a wire segment based on pin handles and component types.
 * Accurately distinguishes supply paths (positive potential) from return paths (ground/negative).
 * Time Complexity: O(1)
 */
export function resolveWirePolarity(
  sourceHandle?: string | null,
  targetHandle?: string | null
): WirePolarity {
  if (sourceHandle === 'pos' || targetHandle === 'pos') {
    return 'positive';
  }
  if (
    sourceHandle === 'neg' ||
    targetHandle === 'neg' ||
    sourceHandle === 'gnd' ||
    targetHandle === 'gnd'
  ) {
    return 'negative';
  }
  return 'neutral';
}

/**
 * Advanced Wire Edge Component with:
 * - Simulation-driven electron flow animation (zero fake animation when I = 0)
 * - Polarity-based coloring (positive supply path vs negative return path)
 * - Component current-path tracing on component selection
 * - Targeted short-circuit path highlighting
 * - Interactive click selection and real-time electrical telemetry badge
 * - Double-click Waypoint anchor creation
 *
 * Time Complexity: O(1) per edge render.
 */
export const WireEdge: React.FC<EdgeProps> = ({
  id,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  style = {},
  markerEnd,
}) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const edgeType = useCircuitStore(
    (state) => state.edges.find((e) => e.id === id)?.type ?? 'wire'
  );
  const splitEdgeWithWaypoint = useCircuitStore((state) => state.splitEdgeWithWaypoint);
  const selectedEdgeId = useCircuitStore((state) => state.selectedEdgeId);
  const selectedNodeId = useCircuitStore((state) => state.selectedNodeId);
  const selectEdge = useCircuitStore((state) => state.selectEdge);
  const language = useCircuitStore((state) => state.language);
  const reactFlow = useReactFlow();

  const [isHovered, setIsHovered] = useState<boolean>(false);

  const isWireSelected = selected || selectedEdgeId === id;
  const isOverallShortCircuit = simulation.isShortCircuit;

  // Check if this specific wire participates in a short-circuited branch
  const isBranchShortCircuit =
    isOverallShortCircuit &&
    (simulation.shortCircuitBranches.includes(source) ||
      simulation.shortCircuitBranches.includes(target));

  // Derive real simulation current through this wire segment
  const wireCurrent = resolveEdgeBranchCurrent(
    source,
    target,
    simulation.branchCurrents
  );
  const hasCurrent = wireCurrent > 0.0001;

  // Polarity determination
  const polarity = resolveWirePolarity(sourceHandleId, targetHandleId);

  // Check if connected to currently selected node (current-path highlighting)
  const isConnectedToSelectedNode = Boolean(
    selectedNodeId &&
      (source === selectedNodeId || target === selectedNodeId) &&
      hasCurrent
  );

  const { effectiveSourcePos, effectiveTargetPos } = resolveWaypointPositions(
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition
  );

  const [defaultEdgePath, defaultLabelX, defaultLabelY] =
    edgeType === 'smoothstep'
      ? getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition: effectiveSourcePos,
          targetX,
          targetY,
          targetPosition: effectiveTargetPos,
          borderRadius: 12,
        })
      : getBezierPath({
          sourceX,
          sourceY,
          sourcePosition: effectiveSourcePos,
          targetX,
          targetY,
          targetPosition: effectiveTargetPos,
          curvature: 0.2,
        });

  // When bridging terminals on the same node (e.g. dead-short fault wire across battery terminals or panel posts):
  // 1. Horizontal terminals (e.g. Panel Distribusi +/- at bottom): drop downward 70px as a visible hanging U-loop
  // 2. Vertical terminals (e.g. Battery top/bottom): curve outward 65px to the left
  const isSelfLoop = source === target;
  const isHorizontalTerminals = isSelfLoop && Math.abs(sourceY - targetY) < 30;

  let edgePath = defaultEdgePath;
  let labelX = defaultLabelX;
  let labelY = defaultLabelY;

  if (isSelfLoop) {
    if (isHorizontalTerminals) {
      const dropY = 70;
      edgePath = `M ${sourceX} ${sourceY} C ${sourceX} ${sourceY + dropY}, ${targetX} ${targetY + dropY}, ${targetX} ${targetY}`;
      labelX = (sourceX + targetX) / 2;
      labelY = (sourceY + targetY) / 2 + dropY * 0.75;
    } else {
      const loopOffset = -65;
      edgePath = `M ${sourceX} ${sourceY} C ${sourceX + loopOffset} ${sourceY - 15}, ${targetX + loopOffset} ${targetY + 15}, ${targetX} ${targetY}`;
      labelX = (sourceX + targetX) / 2 + loopOffset;
      labelY = (sourceY + targetY) / 2;
    }
  }

  // Calculate visual appearance based on physical electrical state (Solid, realistic physics colors - no neon glow)
  let strokeColor = '#64748B'; // Default neutral conductor
  let strokeWidth = 3;
  let animationSpeed = '0s';

  if (isWireSelected) {
    strokeColor = '#D97706'; // Solid amber for selected wire
    strokeWidth = 4;
  } else if (isBranchShortCircuit) {
    strokeColor = '#DC2626'; // Solid warning red for short circuits
    strokeWidth = 4;
  } else if (isConnectedToSelectedNode) {
    strokeColor = '#0284C7'; // Connected component conductor
    strokeWidth = 3.5;
    const speed = Math.max(0.35, 1.8 / Math.max(1, wireCurrent * 10));
    animationSpeed = `${speed.toFixed(2)}s`;
  } else if (hasCurrent) {
    if (polarity === 'positive') {
      strokeColor = '#B45309'; // Physical copper supply path
      strokeWidth = 3.2;
    } else if (polarity === 'negative') {
      strokeColor = '#334155'; // Physical dark insulated return path
      strokeWidth = 3.2;
    } else {
      strokeColor = '#475569'; // Standard active conductor
      strokeWidth = 3;
    }
    const speed = Math.max(0.35, 1.8 / Math.max(1, wireCurrent * 10));
    animationSpeed = `${speed.toFixed(2)}s`;
  }

  // Handle single-tap to select this wire
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    selectEdge(id);
  };

  // Handle double-click to add a Waypoint Node (Anchor point)
  const handleDoubleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const clickPosition = reactFlow.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    splitEdgeWithWaypoint(id, clickPosition);
  };

  const isIndonesian = language === 'id';

  return (
    <>
      {/* Official React Flow BaseEdge ensures full SVG pipeline support */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          opacity: 1,
        }}
      />

      {/* Focus outline when wire is actively selected */}
      {isWireSelected && (
        <path
          d={edgePath}
          fill="none"
          stroke="#D97706"
          strokeWidth={8}
          strokeOpacity={0.25}
          className="pointer-events-none"
        />
      )}

      {/* Current path highlight outline when connected component is selected */}
      {isConnectedToSelectedNode && !isWireSelected && (
        <path
          d={edgePath}
          fill="none"
          stroke="#0284C7"
          strokeWidth={6}
          strokeOpacity={0.25}
          className="pointer-events-none"
        />
      )}

      {/* Animated physical electron flow dash ONLY when simulation verifies real current */}
      {hasCurrent && !isBranchShortCircuit && (
        <path
          d={edgePath}
          fill="none"
          stroke={polarity === 'positive' ? '#FDE68A' : '#CBD5E1'}
          strokeWidth={2}
          strokeDasharray="6 8"
          className="animate-wire-flow pointer-events-none"
          style={{ animationDuration: animationSpeed }}
        />
      )}

      {/* Hazardous thermal pulsing along short-circuit branches */}
      {isBranchShortCircuit && (
        <path
          d={edgePath}
          fill="none"
          stroke="#FEE2E2"
          strokeWidth={2.5}
          strokeDasharray="4 8"
          className="animate-pulse pointer-events-none"
        />
      )}

      {/* Invisible thick hit-area path for tap-to-select and double-click waypoint */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={32}
        className="cursor-pointer pointer-events-auto"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Real-time Electrical Telemetry Badge & Tooltip on Wire Midpoint */}
      <foreignObject
        width={140}
        height={48}
        x={labelX - 70}
        y={labelY - 24}
        className="pointer-events-none overflow-visible"
      >
        <div className="flex flex-col items-center justify-center h-full select-none">
          {/* Main Badge */}
          {hasCurrent || isWireSelected || isHovered || isSelfLoop ? (
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border shadow-lg backdrop-blur-md transition-all ${
                isSelfLoop
                  ? 'bg-red-950/95 border-red-500 text-red-200 ring-2 ring-red-500/30'
                  : isWireSelected
                  ? 'bg-void-950 border-amber-400 text-amber-300 ring-2 ring-amber-400/20'
                  : isBranchShortCircuit
                  ? 'bg-red-950 border-red-500 text-red-300 animate-pulse'
                  : polarity === 'positive'
                  ? 'bg-void-950/95 border-orange-400/50 text-orange-300'
                  : 'bg-void-950/95 border-sky-400/50 text-sky-300'
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isSelfLoop || isBranchShortCircuit
                    ? 'bg-red-500 animate-ping'
                    : hasCurrent
                    ? polarity === 'positive'
                      ? 'bg-orange-400'
                      : 'bg-sky-400'
                    : 'bg-slate-500'
                }`}
              />
              <span className="text-[10px] font-mono font-bold">
                {isSelfLoop
                  ? isIndonesian
                    ? 'Korslet (Jumper)'
                    : 'Short (Jumper)'
                  : hasCurrent
                  ? wireCurrent < 1
                    ? `${(wireCurrent * 1000).toFixed(0)} mA`
                    : `${wireCurrent.toFixed(2)} A`
                  : '0.0 mA'}
              </span>
            </div>
          ) : null}

          {/* Expanded Tooltip on Click or Hover */}
          {(isWireSelected || isHovered) && (
            <div className="mt-1 px-2 py-0.5 rounded-md bg-void-950/95 border border-white/15 text-[9px] font-sans text-slate-300 shadow-xl whitespace-nowrap">
              {polarity === 'positive' ? (
                <span className="text-orange-400 font-semibold">
                  {isIndonesian ? '+ Jalur Positif' : '+ Positive Path'}
                </span>
              ) : polarity === 'negative' ? (
                <span className="text-sky-400 font-semibold">
                  {isIndonesian ? '- Jalur Negatif' : '- Return Path'}
                </span>
              ) : (
                <span className="text-slate-400">
                  {isIndonesian ? 'Kabel Penghubung' : 'Conductor'}
                </span>
              )}
            </div>
          )}
        </div>
      </foreignObject>
    </>
  );
};
