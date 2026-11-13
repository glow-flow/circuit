import React, { useMemo } from 'react';
import { Edge, useNodes, useViewport } from 'reactflow';
import { Flame, Thermometer } from 'lucide-react';
import { CircuitElementData, WorldMode } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import {
  LensNodeAnchorBox,
  ProbeTarget,
  buildPinPotentialLookup,
  compareDualProbes,
  computeAllNodeThermals,
  computeProbeReading,
  resolveLensNodeAnchorBox,
  resolvePinPotentialVolts,
} from '../../physics/physicsLensEngine';
import { getComponentPinIdentifiers } from '../../physics/mnaSolver';

export interface PhysicsCanvasOverlayProps {
  /** Restricts rendering strictly to the active canvas world ('lab' or 'outside'). */
  worldScope: WorldMode;
}

interface TargetAnchor extends LensNodeAnchorBox {
  kind: 'node' | 'wire';
}

/**
 * Computes Flow-space anchor center & dimensions for either a node or wire target in O(1).
 */
function resolveTargetAnchor(
  target: ProbeTarget | null,
  nodeBoxes: Map<string, LensNodeAnchorBox>,
  edges: ReadonlyArray<Edge>
): TargetAnchor | null {
  if (!target) return null;
  if (target.kind === 'node') {
    const box = nodeBoxes.get(target.id);
    return box ? { ...box, kind: 'node' } : null;
  }
  const edge = edges.find((e) => e.id === target.id);
  if (!edge) return null;
  const srcBox = nodeBoxes.get(edge.source);
  const dstBox = nodeBoxes.get(edge.target);
  if (!srcBox || !dstBox) return null;
  return {
    cx: (srcBox.cx + dstBox.cx) / 2,
    cy: (srcBox.cy + dstBox.cy) / 2,
    width: 24,
    height: 24,
    kind: 'wire',
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
    const map = new Map<string, LensNodeAnchorBox>();
    for (let i = 0; i < flowNodes.length; i++) {
      const node = flowNodes[i];
      if (!node) continue;
      map.set(node.id, resolveLensNodeAnchorBox(node));
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

  const isLight = theme === 'light';
  const probeFramePadA = 6;
  const probeFramePadB = 9;
  const probeFramePadHover = 5;

  return (
    <div
      data-physics-overlay={physicsLensMode}
      data-world-scope={worldScope}
      aria-hidden="true"
      className="pointer-events-none touch-none absolute inset-0 overflow-hidden z-[15]"
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
        {/* LAYER 1: SVG Vector Field Layer (Proportional Thermal silhouettes + Tight Probe frames + Dual-Probe ΔV vector) */}
        <svg
          className="overflow-visible pointer-events-none"
          style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 1 }}
        >
          <defs>
            <radialGradient id={`thermal-hot-${worldScope}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.46" />
              <stop offset="58%" stopColor="#F59E0B" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`thermal-warm-${worldScope}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.32" />
              <stop offset="65%" stopColor="#0D9488" stopOpacity="0.11" />
              <stop offset="100%" stopColor="#0D9488" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Thermal Mode Heat Fields (Elliptical match hugs bulbs + holders accurately) */}
          {physicsLensMode === 'thermal' &&
            nodeThermals &&
            flowNodes.map((node) => {
              const metrics = nodeThermals.get(node.id);
              const box = nodeBoxes.get(node.id);
              if (!metrics || !box || metrics.thermalRatio < 0.05) return null;
              const rx = box.width * (0.62 + metrics.thermalRatio * 0.28);
              const ry = box.height * (0.58 + metrics.thermalRatio * 0.25);
              const isHot = metrics.heatBand === 'critical' || metrics.heatBand === 'hot';
              return (
                <ellipse
                  key={`heat-${node.id}`}
                  cx={box.cx}
                  cy={box.cy}
                  rx={rx}
                  ry={ry}
                  fill={`url(#${isHot ? 'thermal-hot' : 'thermal-warm'}-${worldScope})`}
                />
              );
            })}

          {/* Probe Mode: Hover Outline Frame (Nodes only; wires glow natively in WireEdge) */}
          {physicsLensMode === 'probe' && anchorHover && anchorHover.kind === 'node' && (
            <rect
              x={anchorHover.cx - anchorHover.width / 2 - probeFramePadHover}
              y={anchorHover.cy - anchorHover.height / 2 - probeFramePadHover}
              width={anchorHover.width + probeFramePadHover * 2}
              height={anchorHover.height + probeFramePadHover * 2}
              rx={14}
              fill={isLight ? '#0284C7' : '#38BDF8'}
              fillOpacity={0.05}
              stroke={isLight ? '#0284C7' : '#38BDF8'}
              strokeWidth={1.75}
              strokeDasharray="5 4"
              strokeOpacity={0.9}
            />
          )}

          {/* Probe Mode: Pinned Probe A Tight Bounding Frame */}
          {physicsLensMode === 'probe' && anchorA && anchorA.kind === 'node' && (
            <rect
              x={anchorA.cx - anchorA.width / 2 - probeFramePadA}
              y={anchorA.cy - anchorA.height / 2 - probeFramePadA}
              width={anchorA.width + probeFramePadA * 2}
              height={anchorA.height + probeFramePadA * 2}
              rx={14}
              fill={isLight ? '#0284C7' : '#22D3EE'}
              fillOpacity={0.08}
              stroke={isLight ? '#0284C7' : '#22D3EE'}
              strokeWidth={2.5}
            />
          )}

          {/* Probe Mode: Pinned Probe B Tight Bounding Frame */}
          {physicsLensMode === 'probe' && anchorB && anchorB.kind === 'node' && (
            <rect
              x={anchorB.cx - anchorB.width / 2 - probeFramePadB}
              y={anchorB.cy - anchorB.height / 2 - probeFramePadB}
              width={anchorB.width + probeFramePadB * 2}
              height={anchorB.height + probeFramePadB * 2}
              rx={16}
              fill={isLight ? '#D97706' : '#FBBF24'}
              fillOpacity={0.08}
              stroke={isLight ? '#D97706' : '#FBBF24'}
              strokeWidth={2.5}
            />
          )}

          {/* Probe Mode: Dual-Probe Potential Vector Line + Endpoints between A and B */}
          {physicsLensMode === 'probe' && anchorA && anchorB && dualComparison && (
            <g>
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
              <circle cx={anchorA.cx} cy={anchorA.cy} r={4} fill="#22D3EE" stroke="#0F172A" strokeWidth={1.5} />
              <circle cx={anchorB.cx} cy={anchorB.cy} r={4} fill="#FBBF24" stroke="#0F172A" strokeWidth={1.5} />
            </g>
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

        {/* Probe Mode: Node Terminal Potential Tags when Zoom >= 0.45 (skipped on active A/B nodes to stay clutter-free) */}
        {physicsLensMode === 'probe' &&
          pinPotentials &&
          viewport.zoom >= 0.45 &&
          flowNodes.map((node) => {
            if (node.data.type === 'waypoint') return null;
            const isPinnedA = probeTargetA?.kind === 'node' && probeTargetA.id === node.id;
            const isPinnedB = probeTargetB?.kind === 'node' && probeTargetB.id === node.id;
            if (isPinnedA || isPinnedB) return null;

            const box = nodeBoxes.get(node.id);
            if (!box) return null;
            const pins = getComponentPinIdentifiers(node.data);
            const h1 = pins[0]?.split(':')[1] ?? 'p1';
            const v1 = resolvePinPotentialVolts(pinPotentials, node.id, h1);
            const isHovered = hoveredProbeTarget?.kind === 'node' && hoveredProbeTarget.id === node.id;

            if (Math.abs(v1) < 0.01 && !isHovered) return null;

            return (
              <div
                key={`v-tag-${node.id}`}
                style={{
                  position: 'absolute',
                  left: box.cx,
                  top: box.cy - box.height / 2 - 12,
                  transform: 'translate(-50%, -100%)',
                }}
                className={`px-1.5 py-0.5 rounded-md border font-mono text-[10px] font-bold shadow-sm whitespace-nowrap ${
                  isLight
                    ? 'bg-white/95 border-sky-600 text-slate-900'
                    : 'bg-slate-950/95 border-cyan-400/60 text-cyan-200'
                }`}
              >
                {v1.toFixed(1)}V
              </div>
            );
          })}

        {/* Probe A Badge Marker (anchored to top-right corner of the tight bounding frame) */}
        {physicsLensMode === 'probe' && anchorA && anchorA.kind === 'node' && (
          <div
            style={{
              position: 'absolute',
              left: anchorA.cx + anchorA.width / 2 + probeFramePadA,
              top: anchorA.cy - anchorA.height / 2 - probeFramePadA,
              transform: 'translate(-50%, -50%)',
            }}
            className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 border-2 border-white font-mono text-[11px] font-black flex items-center justify-center shadow-md"
          >
            A
          </div>
        )}

        {/* Probe B Badge Marker (anchored to top-right corner of the tight bounding frame) */}
        {physicsLensMode === 'probe' && anchorB && anchorB.kind === 'node' && (
          <div
            style={{
              position: 'absolute',
              left: anchorB.cx + anchorB.width / 2 + probeFramePadB,
              top: anchorB.cy - anchorB.height / 2 - probeFramePadB,
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
            className={`px-2.5 py-1 rounded-full border font-mono text-[11px] font-bold shadow-md whitespace-nowrap ${
              isLight
                ? 'bg-amber-50 border-amber-500 text-amber-950'
                : 'bg-slate-950/95 border-amber-400/80 text-amber-200'
            }`}
          >
            ΔV = {dualComparison.voltageDiffVolts >= 0 ? '+' : ''}
            {dualComparison.voltageDiffVolts.toFixed(2)}V
          </div>
        )}

        {/* Live Pointer Hover Preview Chip */}
        {physicsLensMode === 'probe' && anchorHover && anchorHover.kind === 'node' && hoverReading && (
          <div
            style={{
              position: 'absolute',
              left: anchorHover.cx,
              top: anchorHover.cy + anchorHover.height / 2 + 12,
              transform: 'translate(-50%, 0)',
            }}
            className={`px-2 py-0.5 rounded-full border font-mono text-[10px] font-bold shadow-md whitespace-nowrap ${
              isLight
                ? 'bg-white border-sky-600 text-slate-900'
                : 'bg-slate-950/95 border-sky-400/70 text-sky-100'
            }`}
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
