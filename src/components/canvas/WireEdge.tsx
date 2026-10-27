import React from 'react';
import { BaseEdge, EdgeProps, getBezierPath, Position, useReactFlow } from 'reactflow';
import { Scissors } from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { TRANSLATIONS } from '../../i18n/translations';

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
 * Custom Wire Edge with dynamic current glow, animated electron flow,
 * permanent high-contrast visibility, interactive click-to-select,
 * one-tap wire cutting/removal button, and double-click waypoint bend creation.
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
  const splitEdgeWithWaypoint = useCircuitStore((state) => state.splitEdgeWithWaypoint);
  const selectedEdgeId = useCircuitStore((state) => state.selectedEdgeId);
  const selectEdge = useCircuitStore((state) => state.selectEdge);
  const removeEdge = useCircuitStore((state) => state.removeEdge);
  const language = useCircuitStore((state) => state.language);
  const t = TRANSLATIONS[language].wire;
  const reactFlow = useReactFlow();

  const isShortCircuit = simulation.isShortCircuit;
  const isWireSelected = selected || selectedEdgeId === id;

  // Derive current through this wire by checking source or target component current
  const sourceCurrent = Math.max(
    Math.abs(simulation.branchCurrents[source] ?? 0),
    Math.abs(simulation.branchCurrents[target] ?? 0)
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

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition: effectiveSourcePos,
    targetX,
    targetY,
    targetPosition: effectiveTargetPos,
    curvature: 0.25,
  });

  // Solid, high-contrast permanent wire styling
  let strokeColor = '#64748B'; // Crisp slate-500 (100% visible on dark void background)
  let strokeWidth = 3;
  let glowFilter: string | undefined = undefined;
  let animationSpeed = '0s';

  if (isWireSelected) {
    strokeColor = '#F59E0B'; // Highlight amber for selected wire
    strokeWidth = 4;
    glowFilter = 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.8))';
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

  // Handle single-click to select this wire
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    selectEdge(id);
  };

  // Handle cutting/removing wire
  const handleCutWire = (event: React.MouseEvent) => {
    event.stopPropagation();
    removeEdge(id);
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
          strokeWidth={8}
          strokeOpacity={0.25}
          className="pointer-events-none animate-pulse"
        />
      )}

      {/* Animated electron flow pulse when current flows through circuit */}
      {hasCurrent && !isShortCircuit && !isWireSelected && (
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

      {/* Invisible thick hit-area path for easy tap/click to select or double-click to add waypoints */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={32}
        className="cursor-pointer pointer-events-auto"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />

      {/* Quick Action Button directly on the wire when selected: Cut / Remove Wire */}
      {isWireSelected ? (
        <foreignObject
          width={130}
          height={32}
          x={labelX - 65}
          y={labelY - 16}
          className="pointer-events-auto z-50 overflow-visible"
        >
          <div className="flex items-center justify-center h-full">
            <button
              type="button"
              onClick={handleCutWire}
              title={t.cutWire}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold text-[11px] shadow-[0_0_15px_rgba(239,68,68,0.7)] border border-red-300 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>{t.cutWireShort}</span>
            </button>
          </div>
        </foreignObject>
      ) : hasCurrent ? (
        /* Current badge on wire when active and not selected (tapping it also selects wire) */
        <foreignObject
          width={64}
          height={24}
          x={labelX - 32}
          y={labelY - 12}
          className="pointer-events-auto cursor-pointer"
          onClick={handleClick}
        >
          <div className="flex items-center justify-center h-full">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-void-950/95 border border-white/20 text-sky-300 font-semibold shadow-md hover:border-amber-400 hover:text-amber-300 transition-colors">
              {sourceCurrent < 1
                ? `${(sourceCurrent * 1000).toFixed(0)}mA`
                : `${sourceCurrent.toFixed(2)}A`}
            </span>
          </div>
        </foreignObject>
      ) : null}
    </>
  );
};
