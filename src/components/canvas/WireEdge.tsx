import React from 'react';
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
function resolveEdgeBranchCurrent(
  source: string,
  target: string,
  branchCurrents: Record<string, number>
): number {
  const rawSourceI = Math.abs(branchCurrents[source] ?? 0);
  const rawTargetI = Math.abs(branchCurrents[target] ?? 0);
  const isSourceWaypoint = source.startsWith('wp_');
  const isTargetWaypoint = target.startsWith('wp_');

  if (!isSourceWaypoint && !isTargetWaypoint) {
    // Between two active/passive components (e.g. Ammeter -> Zone Switch, or Resistor -> Bulb),
    // the wire carries the branch's series/split current
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

/**
 * Custom Wire Edge with dynamic current glow, animated electron flow,
 * permanent high-contrast visibility, single-tap selection (which opens the
 * top floating toolbar to cut the wire), double-click waypoint anchor creation,
 * and support for both smoothstep orthogonal routing (`type: 'smoothstep'`) and bezier curves.
 */
export const WireEdge: React.FC<EdgeProps> = ({
  id,
  source,
  target,
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
  const selectEdge = useCircuitStore((state) => state.selectEdge);
  const reactFlow = useReactFlow();

  const isShortCircuit = simulation.isShortCircuit;
  const isWireSelected = selected || selectedEdgeId === id;

  // Derive current through this wire segment
  const sourceCurrent = resolveEdgeBranchCurrent(
    source,
    target,
    simulation.branchCurrents
  );
  const hasCurrent = sourceCurrent > 0.0001;

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

  const [edgePath, labelX, labelY] =
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

  // Solid, high-contrast permanent wire styling
  let strokeColor = '#64748B'; // Crisp slate-500 (100% visible on dark void background)
  let strokeWidth = 3;
  let glowFilter: string | undefined = undefined;
  let animationSpeed = '0s';

  if (isWireSelected) {
    strokeColor = '#F59E0B'; // Highlight amber for selected wire
    strokeWidth = 4;
    glowFilter = 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.85))';
  } else if (isShortCircuit) {
    strokeColor = '#EF4444'; // Neon danger red
    strokeWidth = 3.5;
    glowFilter = 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.9))';
  } else if (hasCurrent) {
    strokeColor = '#38BDF8'; // Vibrant electric sky blue
    strokeWidth = 3;
    glowFilter = 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.7))';
    const speed = Math.max(0.4, 2.0 / Math.max(1, sourceCurrent * 10));
    animationSpeed = `${speed.toFixed(2)}s`;
  }

  // Handle single-click to select this wire (shows floating Cut/Anchor toolbar at top)
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    selectEdge(id);
  };

  // Handle double-click to add a Waypoint Node (Anchor point) without cutting the wire
  const handleDoubleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const clickPosition = reactFlow.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    splitEdgeWithWaypoint(id, clickPosition);
  };

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
          filter: glowFilter,
          opacity: 1,
        }}
      />

      {/* Outer focus halo when wire is actively selected */}
      {isWireSelected && (
        <path
          d={edgePath}
          fill="none"
          stroke="#FBBF24"
          strokeWidth={9}
          strokeOpacity={0.28}
          className="pointer-events-none animate-pulse"
        />
      )}

      {/* Animated electron flow pulse when current flows through circuit */}
      {hasCurrent && !isShortCircuit && (
        <path
          d={edgePath}
          fill="none"
          stroke="#E0F2FE"
          strokeWidth={2}
          strokeDasharray="6 12"
          className="animate-wire-flow pointer-events-none"
          style={{ animationDuration: animationSpeed }}
        />
      )}

      {/* Sparks/hazard pulsating effect when short circuit occurs */}
      {isShortCircuit && (
        <path
          d={edgePath}
          fill="none"
          stroke="#FEE2E2"
          strokeWidth={2.5}
          strokeDasharray="4 8"
          className="animate-pulse pointer-events-none"
        />
      )}

      {/* Invisible thick hit-area path for tap-to-select and double-click to add Waypoint */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={30}
        className="cursor-pointer pointer-events-auto"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />

      {/* Current badge on wire (non-blocking for double-click waypoint creation) */}
      {hasCurrent && (
        <foreignObject
          width={64}
          height={24}
          x={labelX - 32}
          y={labelY - 12}
          className="pointer-events-none"
        >
          <div className="flex items-center justify-center h-full">
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-void-950/95 border font-semibold shadow-md transition-colors ${
                isWireSelected
                  ? 'border-amber-400 text-amber-300'
                  : 'border-white/20 text-sky-300'
              }`}
            >
              {sourceCurrent < 1
                ? `${(sourceCurrent * 1000).toFixed(0)}mA`
                : `${sourceCurrent.toFixed(2)}A`}
            </span>
          </div>
        </foreignObject>
      )}
    </>
  );
};
