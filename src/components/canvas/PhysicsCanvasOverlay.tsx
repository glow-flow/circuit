import React, { useMemo } from 'react';
import { Edge, Node, useNodes, useViewport } from 'reactflow';
import { Flame, Thermometer } from 'lucide-react';
import { CircuitElementData, WorldMode } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import {
  ProbeTarget,
  buildPinPotentialLookup,
  compareDualProbes,
  computeAllNodeThermals,
  computeProbeReading,
  resolvePinPotentialVolts,
} from '../../physics/physicsLensEngine';
import { getComponentPinIdentifiers } from '../../physics/mnaSolver';

interface FlowAnchor {
  cx: number;
  cy: number;
  width: number;
  height: number;
}

export interface PhysicsCanvasOverlayProps {
  /** Restricts rendering strictly to the active canvas world ('lab' or 'outside'). */
  worldScope: WorldMode;
}

/**
 * Estimates fallback Flow-space node bounding box when ReactFlow DOM measurements are pending.
 * Time Complexity: O(1).
 */
function resolveNodeBox(node: Node<CircuitElementData>): FlowAnchor {
  const w = typeof node.width === 'number' && node.width > 0 ? node.width : 112;
  const h = typeof node.height === 'number' && node.height > 0 ? node.height : 84;
  return {
    cx: node.position.x + w / 2,
    cy: node.position.y + h / 2,
    width: w,
    height: h,
  };
}

/**
 * Computes Flow-space anchor center for either a node or wire target in O(1).
 */
function resolveTargetAnchor(
  target: ProbeTarget | null,
  nodeBoxes: Map<string, FlowAnchor>,
  edges: ReadonlyArray<Edge>
): { cx: number; cy: number; width: number; height: number } | null {
  if (!target) return null;
  if (target.kind === 'node') {
    return nodeBoxes.get(target.id) ?? null;
  }
  const edge = edges.find((e) => e.id === target.id);
  if (!edge) return null;
  const srcBox = nodeBoxes.get(edge.source);
  const dstBox = nodeBoxes.get(edge.target);
  if (!srcBox || !dstBox) return null;
  return {
    cx: (srcBox.cx + dstBox.cx) / 2,
    cy: (srcBox.cy + dstBox.cy) / 2,
    width: 44,
    height: 44,
  };
}

/**
 * Hardware-synchronized SVG & floating badge X-Ray layer mounted inside ReactFlow.
 *
 * Uses `useViewport()` CSS transform tracking so overlays stay 1:1 locked to nodes and wires
 * across zoom/pan gestures on both Lab Rangkaian and Alam EBT without editing individual nodes.
 *
 * Time Complexity: O(P * α(P) + W) per simulation frame (O(1) fast-exit in 'normal' mode).
 */
export const PhysicsCanvasOverlay: React.FC<PhysicsCanvasOverlayProps> = ({ worldScope }) => {
  const viewport = useViewport();
  const flowNodes = useNodes<CircuitElementData>();
  const allEdges = useCircuitStore((state) => state.edges);
  const simulation = useCircuitStore((state) => state.simulation);
  const theme = useCircuitStore((state) => state.theme);
  const physicsLensMode = useCircuitStore((state) => state.physicsLensMode);
  const probeTargetA = useCircuitStore((state) => state.probeTargetA);
  const probeTargetB = useCircuitStore((state) => state.probeTargetB);
  const hoveredProbeTarget = useCircuitStore((state) => state.hoveredProbeTarget);

  const scopedEdges = useMemo(() => {
    const idSet = new Set(flowNodes.map((n) => n.id));
    return allEdges.filter((e) => idSet.has(e.source) && idSet.has(e.target));
  }, [allEdges, flowNodes]);

  const nodeBoxes = useMemo(() => {
    const map = new Map<string, FlowAnchor>();
    for (let i = 0; i < flowNodes.length; i++) {
      const node = flowNodes[i];
      if (!node) continue;
      map.set(node.id, resolveNodeBox(node));
    }
    return map;
  }, [flowNodes]);

  const nodeThermals = useMemo(() => {
    if (physicsLensMode !== 'thermal') return null;
    return computeAllNodeThermals(flowNodes, simulation, theme);
  }, [flowNodes, physicsLensMode, simulation, theme]);

  const pinPotentials = useMemo(() => {
    if (physicsLensMode !== 'probe') return null;
    return buildPinPotentialLookup(flowNodes, scopedEdges, simulation.nodeVoltages);
  }, [flowNodes, physicsLensMode, scopedEdges, simulation.nodeVoltages]);

  const dualComparison = useMemo(() => {
    if (physicsLensMode !== 'probe' || !pinPotentials || !probeTargetA || !probeTargetB) {
      return null;
    }
    const readA = computeProbeReading(
      probeTargetA,
      flowNodes,
      scopedEdges,
      simulation,
      pinPotentials
    );
    const readB = computeProbeReading(
      probeTargetB,
      flowNodes,
      scopedEdges,
      simulation,
      pinPotentials
    );
    if (!readA || !readB) return null;
    return compareDualProbes(readA, readB);
  }, [
    flowNodes,
    physicsLensMode,
    pinPotentials,
    probeTargetA,
    probeTargetB,
    scopedEdges,
    simulation,
  ]);

  if (physicsLensMode === 'normal') {
    return null;
  }

  const anchorA =
    physicsLensMode === 'probe' ? resolveTargetAnchor(probeTargetA, nodeBoxes, scopedEdges) : null;
  const anchorB =
    physicsLensMode === 'probe' ? resolveTargetAnchor(probeTargetB, nodeBoxes, scopedEdges) : null;
  const anchorHover =
    physicsLensMode === 'probe'
      ? resolveTargetAnchor(hoveredProbeTarget, nodeBoxes, scopedEdges)
      : null;

  const hoverReading =
    physicsLensMode === 'probe' && hoveredProbeTarget && pinPotentials
      ? computeProbeReading(hoveredProbeTarget, flowNodes, scopedEdges, simulation, pinPotentials)
      : null;

  return (
    <div
      data-physics-overlay={physicsLensMode}
      data-world-scope={worldScope}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden z-[15]"
    >
      <div
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        {/* LAYER 1: SVG Vector Field Layer (Thermal signatures + Dual-Probe ΔV vector) */}
        <svg
          className="overflow-visible pointer-events-none"
          style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 1 }}
        >
          <defs>
            <radialGradient id={`thermal-hot-${worldScope}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.48" />
              <stop offset="55%" stopColor="#F59E0B" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`thermal-warm-${worldScope}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.34" />
              <stop offset="65%" stopColor="#0D9488" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#0D9488" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Thermal Mode Heat Fields */}
          {physicsLensMode === 'thermal' &&
            nodeThermals &&
            flowNodes.map((node) => {
              const metrics = nodeThermals.get(node.id);
              const box = nodeBoxes.get(node.id);
              if (!metrics || !box || metrics.thermalRatio < 0.05) return null;
              const radius = Math.max(box.width, box.height) * (0.68 + metrics.thermalRatio * 0.42);
              const isHot = metrics.heatBand === 'critical' || metrics.heatBand === 'hot';
              return (
                <circle
                  key={`heat-${node.id}`}
                  cx={box.cx}
                  cy={box.cy}
                  r={radius}
                  fill={`url(#${isHot ? 'thermal-hot' : 'thermal-warm'}-${worldScope})`}
                />
              );
            })}

          {/* Probe Mode: Hover Ring */}
          {physicsLensMode === 'probe' && anchorHover && (
            <circle
              cx={anchorHover.cx}
              cy={anchorHover.cy}
              r={Math.max(anchorHover.width, anchorHover.height) * 0.56}
              fill="none"
              stroke={theme === 'light' ? '#0284C7' : '#38BDF8'}
              strokeWidth={2}
              strokeDasharray="5 4"
              strokeOpacity={0.85}
            />
          )}

          {/* Probe Mode: Pinned A Ring */}
          {physicsLensMode === 'probe' && anchorA && (
            <g>
              <circle
                cx={anchorA.cx}
                cy={anchorA.cy}
                r={Math.max(anchorA.width, anchorA.height) * 0.58}
                fill="none"
                stroke="#06B6D4"
                strokeWidth={2.5}
              />
              <circle cx={anchorA.cx} cy={anchorA.cy} r={5} fill="#06B6D4" />
            </g>
          )}

          {/* Probe Mode: Pinned B Ring */}
          {physicsLensMode === 'probe' && anchorB && (
            <g>
              <circle
                cx={anchorB.cx}
                cy={anchorB.cy}
                r={Math.max(anchorB.width, anchorB.height) * 0.6}
                fill="none"
                stroke="#F59E0B"
                strokeWidth={2.5}
              />
              <circle cx={anchorB.cx} cy={anchorB.cy} r={5} fill="#F59E0B" />
            </g>
          )}

          {/* Probe Mode: Dual-Probe Potential Vector Line between A and B */}
          {physicsLensMode === 'probe' && anchorA && anchorB && dualComparison && (
            <line
              x1={anchorA.cx}
              y1={anchorA.cy}
              x2={anchorB.cx}
              y2={anchorB.cy}
              stroke={dualComparison.direction === 'equipotential' ? '#94A3B8' : '#FBBF24'}
              strokeWidth={2.5}
              strokeDasharray="7 5"
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* LAYER 2: Crisp Flow-Space Diagnostic Chips */}
        {physicsLensMode === 'thermal' &&
          nodeThermals &&
          flowNodes.map((node) => {
            if (node.data.type === 'waypoint') return null;
            const metrics = nodeThermals.get(node.id);
            const box = nodeBoxes.get(node.id);
            if (!metrics || !box || metrics.thermalRatio < 0.05) return null;

            const isCritical = metrics.heatBand === 'critical';
            const isHot = metrics.heatBand === 'hot';
            return (
              <div
                key={`thermal-chip-${node.id}`}
                style={{
                  position: 'absolute',
                  left: box.cx,
                  top: box.cy - box.height / 2 - 10,
                  transform: 'translate(-50%, -100%)',
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border shadow-md whitespace-nowrap font-mono text-[10px] font-bold ${
                  isCritical
                    ? 'bg-red-950/95 border-red-400 text-red-100'
                    : isHot
                    ? 'bg-amber-950/95 border-amber-400 text-amber-100'
                    : 'bg-slate-950/95 border-teal-400/70 text-teal-100'
                }`}
              >
                {isCritical || isHot ? (
                  <Flame className="w-3 h-3 text-amber-300 shrink-0" />
                ) : (
                  <Thermometer className="w-3 h-3 text-teal-300 shrink-0" />
                )}
                <span>
                  {metrics.temperatureCelsius}°C
                  {metrics.powerWatts >= 0.05 ? ` · ${metrics.powerWatts.toFixed(1)}W` : ''}
                </span>
              </div>
            );
          })}

        {/* Probe Mode: Node Terminal Potential Tags when Zoom >= 0.45 */}
        {physicsLensMode === 'probe' &&
          pinPotentials &&
          viewport.zoom >= 0.45 &&
          flowNodes.map((node) => {
            if (node.data.type === 'waypoint') return null;
            const box = nodeBoxes.get(node.id);
            if (!box) return null;
            const pins = getComponentPinIdentifiers(node.data);
            const h1 = pins[0]?.split(':')[1] ?? 'p1';
            const v1 = resolvePinPotentialVolts(pinPotentials, node.id, h1);
            const isProbed =
              (probeTargetA?.kind === 'node' && probeTargetA.id === node.id) ||
              (probeTargetB?.kind === 'node' && probeTargetB.id === node.id) ||
              (hoveredProbeTarget?.kind === 'node' && hoveredProbeTarget.id === node.id);

            if (Math.abs(v1) < 0.01 && !isProbed) return null;

            return (
              <div
                key={`v-tag-${node.id}`}
                style={{
                  position: 'absolute',
                  left: box.cx,
                  top: box.cy - box.height / 2 - 8,
                  transform: 'translate(-50%, -100%)',
                }}
                className="px-1.5 py-0.5 rounded-md bg-slate-950/95 border border-cyan-400/50 text-cyan-200 font-mono text-[10px] font-bold shadow-sm whitespace-nowrap"
              >
                {v1.toFixed(1)}V
              </div>
            );
          })}

        {/* Probe A Badge Marker */}
        {physicsLensMode === 'probe' && anchorA && (
          <div
            style={{
              position: 'absolute',
              left: anchorA.cx + anchorA.width / 2 - 4,
              top: anchorA.cy - anchorA.height / 2 - 4,
              transform: 'translate(-50%, -50%)',
            }}
            className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 border-2 border-white font-mono text-[11px] font-black flex items-center justify-center shadow-md"
          >
            A
          </div>
        )}

        {/* Probe B Badge Marker */}
        {physicsLensMode === 'probe' && anchorB && (
          <div
            style={{
              position: 'absolute',
              left: anchorB.cx + anchorB.width / 2 - 4,
              top: anchorB.cy - anchorB.height / 2 - 4,
              transform: 'translate(-50%, -50%)',
            }}
            className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 border-2 border-white font-mono text-[11px] font-black flex items-center justify-center shadow-md"
          >
            B
          </div>
        )}

        {/* Midpoint ΔV Callout Between Probe A and Probe B */}
        {physicsLensMode === 'probe' && anchorA && anchorB && dualComparison && (
          <div
            style={{
              position: 'absolute',
              left: (anchorA.cx + anchorB.cx) / 2,
              top: (anchorA.cy + anchorB.cy) / 2,
              transform: 'translate(-50%, -50%)',
            }}
            className="px-2.5 py-1 rounded-full bg-slate-950/95 border border-amber-400/80 text-amber-200 font-mono text-[11px] font-bold shadow-md whitespace-nowrap"
          >
            ΔV = {dualComparison.voltageDiffVolts >= 0 ? '+' : ''}
            {dualComparison.voltageDiffVolts.toFixed(2)}V
          </div>
        )}

        {/* Live Pointer Hover Preview Chip */}
        {physicsLensMode === 'probe' && anchorHover && hoverReading && (
          <div
            style={{
              position: 'absolute',
              left: anchorHover.cx,
              top: anchorHover.cy + anchorHover.height / 2 + 10,
              transform: 'translate(-50%, 0)',
            }}
            className="px-2 py-0.5 rounded-full bg-slate-950/95 border border-sky-400/70 text-sky-100 font-mono text-[10px] font-bold shadow-md whitespace-nowrap"
          >
            {hoverReading.potentialVolts.toFixed(2)}V ·{' '}
            {hoverReading.currentAmps < 1
              ? `${(hoverReading.currentAmps * 1000).toFixed(0)} mA`
              : `${hoverReading.currentAmps.toFixed(2)} A`}
          </div>
        )}
      </div>
    </div>
  );
};
