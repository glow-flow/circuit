import React, { memo, useState } from 'react';
import {
  BaseEdge,
  EdgeProps,
  getBezierPath,
  Position,
  useReactFlow,
} from 'reactflow';
import { useCircuitStore } from '../../store/useCircuitStore';
import {
  resolveEdgeBranchCurrent,
  resolveWirePolarity,
} from './WireEdge';
import { THERMAL_STRESS_CURRENT_THRESHOLD } from '../../physics/transmissionPhysics';

/**
 * Computes natural tangent orientation for Waypoint anchor nodes so wires
 * never form awkward loops.
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
 * TransmissionWireEdge Component
 * 
 * Specialized edge renderer for Nature Mode overhead transmission wires:
 * 1. Physical Catenary Sag: Overhead lines naturally sag under gravity between
 *    transmission tower cross-arms and generators/loads.
 * 2. Thermal Stress Visualization (Hukum Joule P = I^2 * R):
 *    - On Low Voltage (12V Direct): High current (I >= 0.4A) causes the conductor to
 *      glow warm red with an active thermal stress pulse and high Joule loss badge.
 *    - On High Voltage (240V Step-Up): Line current drops by 20x, slashing Joule loss
 *      by 400x. The conductor cools down to normal neutral slate with a cool cyan glow.
 * 
 * Time Complexity: O(1) render per edge.
 */
export const TransmissionWireEdge: React.FC<EdgeProps> = memo(({
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
  const nodes = useCircuitStore((state) => state.nodes);
  const simulation = useCircuitStore((state) => state.simulation);
  const selectedEdgeId = useCircuitStore((state) => state.selectedEdgeId);
  const selectedNodeId = useCircuitStore((state) => state.selectedNodeId);
  const selectEdge = useCircuitStore((state) => state.selectEdge);
  const splitEdgeWithWaypoint = useCircuitStore((state) => state.splitEdgeWithWaypoint);
  const language = useCircuitStore((state) => state.language);
  const reactFlow = useReactFlow();

  const [isHovered, setIsHovered] = useState<boolean>(false);
  const isId = language === 'id';

  // Determine if this edge connects to a transmission tower
  const sourceNode = nodes.find((n) => n.id === source);
  const targetNode = nodes.find((n) => n.id === target);

  const isSourceTower =
    sourceNode?.data.type === 'transmission-tower' ||
    sourceNode?.data.type === 'transmission_tower';
  const isTargetTower =
    targetNode?.data.type === 'transmission-tower' ||
    targetNode?.data.type === 'transmission_tower';
  const isTransmissionWire = isSourceTower || isTargetTower;

  // Resolve tower voltage mode & step-up status
  const towerNode = isSourceTower ? sourceNode : targetNode;
  const stepUpVoltage = towerNode?.data.stepUpVoltage ?? 12;
  const isStepUp = stepUpVoltage === 240;

  // Real simulation branch current through this wire
  const wireCurrent = resolveEdgeBranchCurrent(
    source,
    target,
    simulation.branchCurrents
  );
  const hasCurrent = wireCurrent > 0.0001;

  // Thermal stress condition: current >= threshold on low voltage
  const isOverheated =
    isTransmissionWire &&
    hasCurrent &&
    wireCurrent >= THERMAL_STRESS_CURRENT_THRESHOLD &&
    !isStepUp;

  // Wire selection and short-circuit flags
  const isWireSelected = selected || selectedEdgeId === id;
  const isOverallShortCircuit = simulation.isShortCircuit;
  const isBranchShortCircuit =
    isOverallShortCircuit &&
    (simulation.shortCircuitBranches.includes(source) ||
      simulation.shortCircuitBranches.includes(target));

  const polarity = resolveWirePolarity(sourceHandleId, targetHandleId);
  const isConnectedToSelectedNode = Boolean(
    selectedNodeId &&
      (source === selectedNodeId || target === selectedNodeId) &&
      hasCurrent
  );

  // 1. Path Calculation: Physical Catenary Sag for Transmission Wires
  let edgePath: string;
  let labelX: number;
  let labelY: number;

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const spanDistance = Math.hypot(dx, dy);

  if (isTransmissionWire) {
    // Overhead high-voltage line sag (andongan kawat SUTET)
    // Sag depth scales with span distance: min 24px, max 70px
    const sagDepth = Math.min(70, Math.max(24, spanDistance * 0.14));

    // Cubic Bezier control points dipping downward naturally under gravity
    const control1X = sourceX + dx * 0.25;
    const control1Y = sourceY + dy * 0.25 + sagDepth;
    const control2X = sourceX + dx * 0.75;
    const control2Y = sourceY + dy * 0.75 + sagDepth;

    edgePath = `M ${sourceX} ${sourceY} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${targetX} ${targetY}`;
    labelX = (sourceX + targetX) / 2;
    labelY = (sourceY + targetY) / 2 + sagDepth * 0.72;
  } else {
    // Non-transmission outdoor wire uses standard smoothstep/bezier routing
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

    const [defaultPath, defaultLabelX, defaultLabelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition: effectiveSourcePos,
      targetX,
      targetY,
      targetPosition: effectiveTargetPos,
      curvature: 0.25,
    });

    edgePath = defaultPath;
    labelX = defaultLabelX;
    labelY = defaultLabelY;
  }

  // 2. Conductor Appearance & Colors
  let strokeColor = '#64748B'; // Default neutral ACSR conductor
  let strokeWidth = 3;
  let animationSpeed = '1.2s';

  if (isWireSelected) {
    strokeColor = '#F59E0B'; // Amber for selection
    strokeWidth = 4;
  } else if (isBranchShortCircuit) {
    strokeColor = '#DC2626'; // Red for short circuit
    strokeWidth = 4.5;
  } else if (isOverheated) {
    strokeColor = '#EF4444'; // Warm incandescent glowing red (thermal stress)
    strokeWidth = 4;
    animationSpeed = '0.5s';
  } else if (isTransmissionWire && isStepUp && hasCurrent) {
    strokeColor = '#38BDF8'; // Cool high-voltage transmission cyan
    strokeWidth = 3.2;
    animationSpeed = '0.8s';
  } else if (isConnectedToSelectedNode) {
    strokeColor = '#0284C7';
    strokeWidth = 3.5;
  } else if (hasCurrent) {
    if (polarity === 'positive') {
      strokeColor = '#D97706'; // Copper supply
      strokeWidth = 3.2;
    } else if (polarity === 'negative') {
      strokeColor = '#334155'; // Dark return
      strokeWidth = 3.2;
    } else {
      strokeColor = '#475569';
      strokeWidth = 3;
    }
  }

  // Handle single-tap to select this wire
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    selectEdge(id);
  };

  // Handle double-click to add a Waypoint Node
  const handleDoubleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const clickPosition = reactFlow.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    splitEdgeWithWaypoint(id, clickPosition);
  };

  // Joule loss calculation for badge display
  const lineResistance = towerNode?.data.lineResistance ?? 4.0;
  const transmittedCurrent = isStepUp ? wireCurrent / 20 : wireCurrent;
  const jouleLoss = transmittedCurrent * transmittedCurrent * lineResistance;

  return (
    <>
      {/* Official React Flow BaseEdge */}
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
        }}
      />

      {/* Focus outline when wire is actively selected */}
      {isWireSelected && (
        <path
          d={edgePath}
          fill="none"
          stroke="#F59E0B"
          strokeWidth={8}
          strokeOpacity={0.25}
          className="pointer-events-none"
        />
      )}

      {/* THERMAL STRESS GLOW HALO: Conductor glows warm red with thermal stress pulse under 12V overload */}
      {isOverheated && (
        <>
          <path
            d={edgePath}
            fill="none"
            stroke="#DC2626"
            strokeWidth={14}
            strokeOpacity={0.35}
            className="animate-pulse pointer-events-none blur-xs"
          />
          <path
            d={edgePath}
            fill="none"
            stroke="#F87171"
            strokeWidth={7}
            strokeOpacity={0.65}
            className="animate-pulse pointer-events-none"
          />
        </>
      )}

      {/* COOL HIGH-VOLTAGE TRANSMISSION HALO: Wire cools down with subtle cyan field on 240V Step-Up */}
      {isTransmissionWire && isStepUp && hasCurrent && (
        <path
          d={edgePath}
          fill="none"
          stroke="#38BDF8"
          strokeWidth={6}
          strokeOpacity={0.22}
          className="pointer-events-none"
        />
      )}

      {/* Animated electron flow dashes when live current is flowing */}
      {hasCurrent && !isBranchShortCircuit && (
        <path
          d={edgePath}
          fill="none"
          stroke={
            isOverheated
              ? '#FDE047'
              : isStepUp
              ? '#E0F2FE'
              : polarity === 'positive'
              ? '#FDE68A'
              : '#CBD5E1'
          }
          strokeWidth={isOverheated ? 2.8 : 2}
          strokeDasharray={isOverheated ? '4 6' : '6 8'}
          className="animate-wire-flow pointer-events-none"
          style={{ animationDuration: animationSpeed }}
        />
      )}

      {/* Invisible generous hitbox for tap-to-select and double-click */}
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

      {/* Real-Time Electrical Telemetry Badge & Tooltip */}
      <foreignObject
        width={180}
        height={54}
        x={labelX - 90}
        y={labelY - 27}
        className="pointer-events-none overflow-visible"
      >
        <div className="flex flex-col items-center justify-center h-full select-none">
          {/* Main Telemetry Badge */}
          {hasCurrent || isWireSelected || isHovered ? (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-lg backdrop-blur-md transition-all ${
                isBranchShortCircuit
                  ? 'bg-red-950/95 border-red-500 text-red-300 animate-pulse'
                  : isOverheated
                  ? 'bg-red-950/95 border-red-500/80 text-red-200 ring-2 ring-red-500/40 animate-pulse shadow-[0_0_14px_rgba(239,68,68,0.5)]'
                  : isTransmissionWire && isStepUp
                  ? 'bg-slate-950/95 border-cyan-400/60 text-cyan-200 shadow-[0_0_14px_rgba(56,189,248,0.4)]'
                  : isWireSelected
                  ? 'bg-void-950 border-amber-400 text-amber-300 ring-2 ring-amber-400/20'
                  : polarity === 'positive'
                  ? 'bg-void-950/95 border-orange-400/50 text-orange-300'
                  : 'bg-void-950/95 border-sky-400/50 text-sky-300'
              }`}
            >
              {/* Status Indicator Dot */}
              <div
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isBranchShortCircuit || isOverheated
                    ? 'bg-red-500 animate-ping'
                    : isTransmissionWire && isStepUp
                    ? 'bg-cyan-400'
                    : hasCurrent
                    ? polarity === 'positive'
                      ? 'bg-orange-400'
                      : 'bg-sky-400'
                    : 'bg-slate-500'
                }`}
              />

              <span className="text-[10px] font-mono font-bold whitespace-nowrap">
                {isBranchShortCircuit
                  ? isId
                    ? 'Korslet!'
                    : 'Short!'
                  : isOverheated
                  ? isId
                    ? `🔥 12V Panas (${jouleLoss.toFixed(1)}W Rugi)`
                    : `🔥 12V Hot (${jouleLoss.toFixed(1)}W Loss)`
                  : isTransmissionWire && isStepUp
                  ? isId
                    ? `❄️ 240V Dingin (${Math.round(transmittedCurrent * 1000)}mA)`
                    : `❄️ 240V Cool (${Math.round(transmittedCurrent * 1000)}mA)`
                  : wireCurrent < 1
                  ? `${Math.round(wireCurrent * 1000)} mA`
                  : `${wireCurrent.toFixed(2)} A`}
              </span>
            </div>
          ) : null}

          {/* Hover Tooltip with Physics Details */}
          {(isWireSelected || isHovered) && isTransmissionWire && (
            <div className="mt-1 px-2.5 py-1 rounded-md bg-slate-950/95 border border-white/20 text-[9px] font-sans text-slate-200 shadow-2xl whitespace-nowrap">
              {isOverheated ? (
                <span className="text-red-300 font-semibold">
                  {isId
                    ? '⚠️ Rugi Panas I²R Tinggi! Aktifkan Gardu Trafo Step-Up 240V'
                    : '⚠️ High I²R Loss! Enable Step-Up 240V on Tower Substation'}
                </span>
              ) : isStepUp ? (
                <span className="text-cyan-300 font-semibold">
                  {isId
                    ? '✓ Transmisi Tegangan Tinggi 240V: Rugi Turun 400×, Kabel Dingin'
                    : '✓ High-Voltage 240V: 400× Loss Reduction, Cool Conductor'}
                </span>
              ) : (
                <span className="text-slate-300">
                  {isId ? 'Kawat Transmisi SUTET' : 'Transmission Line'}
                </span>
              )}
            </div>
          )}
        </div>
      </foreignObject>
    </>
  );
});

TransmissionWireEdge.displayName = 'TransmissionWireEdge';
