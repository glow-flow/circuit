import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Flame,
  GitCompareArrows,
  Info,
  ListFilter,
  Power,
  X,
} from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import {
  buildPinPotentialLookup,
  compareDualProbes,
  computeAllNodeThermals,
  computeProbeReading,
  findHottestThermalNode,
} from '../../../physics/physicsLensEngine';
import { isOutdoorOnlyComponent } from '../../../types/circuit';

/**
 * Formats branch currents into crisp human-readable mA or A units.
 * Time Complexity: O(1).
 */
function formatCurrentDisplay(amps: number): string {
  const safe = Number.isFinite(amps) ? Math.abs(amps) : 0;
  if (safe < 1e-4) return '0.0 mA';
  if (safe < 1) return `${(safe * 1000).toFixed(1)} mA`;
  return `${safe.toFixed(2)} A`;
}

/**
 * Generates deterministic 18-point SVG polyline coordinates representing live signal stability
 * or thermal load ripple without heavy charting dependencies.
 * Time Complexity: O(1).
 */
function buildSparklinePoints(
  potentialVolts: number,
  currentAmps: number,
  isShorted: boolean
): string {
  const width = 140;
  const height = 24;
  const normalizedLevel = Math.min(1, Math.max(0.08, Math.abs(potentialVolts) / 14));
  const baseY = height - 4 - normalizedLevel * (height - 8);
  const rippleAmp = isShorted ? 4.5 : Math.min(3.0, currentAmps * 0.45);

  const pts: string[] = [];
  for (let i = 0; i < 18; i++) {
    const x = (i / 17) * width;
    const wave =
      rippleAmp > 0.05 ? Math.sin(i * 1.15) * rippleAmp * (isShorted ? 1 : 0.65) : 0;
    const y = Math.min(height - 3, Math.max(3, baseY + wave));
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

export interface ProbeReadoutHudProps {
  /** Hides telemetry HUD cleanly when bottom sheets or guided tutorials are visible. */
  isHidden?: boolean;
}

/**
 * Compact, non-intrusive Physics X-Ray HUD rendered near the top edge of the canvas
 * so mobile and desktop circuits remain unobstructed while zooming, panning, or tapping.
 *
 * Uses progressive disclosure: defaults to a sleek compact metric bar with expand-on-demand
 * details, DC sparkline, Dual-Probe ΔV comparison, and keyboard-accessible quick-pick chips.
 *
 * Time Complexity: O(P * α(P) + W) per simulation update.
 */
export const ProbeReadoutHud: React.FC<ProbeReadoutHudProps> = ({ isHidden = false }) => {
  const nodes = useCircuitStore((state) => state.nodes);
  const edges = useCircuitStore((state) => state.edges);
  const simulation = useCircuitStore((state) => state.simulation);
  const worldMode = useCircuitStore((state) => state.worldMode);
  const language = useCircuitStore((state) => state.language);
  const theme = useCircuitStore((state) => state.theme);
  const physicsLensMode = useCircuitStore((state) => state.physicsLensMode);
  const probeTargetA = useCircuitStore((state) => state.probeTargetA);
  const probeTargetB = useCircuitStore((state) => state.probeTargetB);
  const hoveredProbeTarget = useCircuitStore((state) => state.hoveredProbeTarget);
  const isPickingProbeB = useCircuitStore((state) => state.isPickingProbeB);
  const setPhysicsLensMode = useCircuitStore((state) => state.setPhysicsLensMode);
  const selectProbeTarget = useCircuitStore((state) => state.selectProbeTarget);
  const setIsPickingProbeB = useCircuitStore((state) => state.setIsPickingProbeB);
  const clearProbeTargets = useCircuitStore((state) => state.clearProbeTargets);
  const toggleSwitch = useCircuitStore((state) => state.toggleSwitch);

  const [showDetails, setShowDetails] = useState(false);

  const isId = language === 'id';
  const isLight = theme === 'light';

  const scopedNodes = useMemo(
    () =>
      nodes.filter((n) =>
        worldMode === 'outside'
          ? (n.data.worldMode ?? 'lab') === 'outside' || isOutdoorOnlyComponent(n.data.type)
          : (n.data.worldMode ?? 'lab') === 'lab' && !isOutdoorOnlyComponent(n.data.type)
      ),
    [nodes, worldMode]
  );

  const scopedEdges = useMemo(() => {
    const idSet = new Set(scopedNodes.map((n) => n.id));
    return edges.filter((e) => idSet.has(e.source) && idSet.has(e.target));
  }, [edges, scopedNodes]);

  const pinPotentials = useMemo(() => {
    if (physicsLensMode !== 'probe') return new Map<string, number>();
    return buildPinPotentialLookup(scopedNodes, scopedEdges, simulation.nodeVoltages);
  }, [physicsLensMode, scopedEdges, scopedNodes, simulation.nodeVoltages]);

  const activeTarget = probeTargetA ?? hoveredProbeTarget;

  const primaryReading = useMemo(() => {
    if (physicsLensMode !== 'probe') return null;
    return computeProbeReading(activeTarget, scopedNodes, scopedEdges, simulation, pinPotentials);
  }, [activeTarget, physicsLensMode, pinPotentials, scopedEdges, scopedNodes, simulation]);

  const secondaryReading = useMemo(() => {
    if (physicsLensMode !== 'probe' || !probeTargetB) return null;
    return computeProbeReading(probeTargetB, scopedNodes, scopedEdges, simulation, pinPotentials);
  }, [physicsLensMode, pinPotentials, probeTargetB, scopedEdges, scopedNodes, simulation]);

  const dualComparison = useMemo(() => {
    if (!primaryReading || !secondaryReading) return null;
    return compareDualProbes(primaryReading, secondaryReading);
  }, [primaryReading, secondaryReading]);

  const thermalSummary = useMemo(() => {
    if (physicsLensMode !== 'thermal') return null;
    const thermals = computeAllNodeThermals(scopedNodes, simulation, theme);
    const hottest = findHottestThermalNode(scopedNodes, thermals);
    const hottestNode = hottest ? scopedNodes.find((n) => n.id === hottest.nodeId) : null;
    return {
      hottest,
      hottestLabel: hottestNode?.data.label ?? null,
    };
  }, [physicsLensMode, scopedNodes, simulation, theme]);

  if (isHidden || physicsLensMode === 'normal') {
    return null;
  }

  // Anchor near top so bottom dock and main central circuit stay unobstructed on phones
  const cardAnchorClass =
    worldMode === 'outside'
      ? 'top-[98px] left-1/2 -translate-x-1/2 w-[min(94vw,360px)] md:left-auto md:translate-x-0 md:top-[68px] md:right-3 md:w-[312px]'
      : 'top-2.5 left-1/2 -translate-x-1/2 w-[min(94vw,360px)] md:left-auto md:translate-x-0 md:top-3 md:right-3 md:w-[312px]';

  const surfaceClass = isLight
    ? 'bg-white/95 border-slate-300 text-slate-900 shadow-lg'
    : 'bg-slate-950/95 border-white/15 text-slate-50 shadow-lg';

  const mutedTextClass = isLight ? 'text-slate-600' : 'text-slate-300';
  const subtleCellClass = isLight
    ? 'bg-slate-100 border-slate-200 text-slate-900'
    : 'bg-slate-900 border-white/10 text-slate-100';

  const iconBtnClass = isLight
    ? 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
    : 'border-white/15 bg-slate-900 text-slate-200 hover:bg-slate-800';

  // THERMAL MODE COMPACT HUD BAR
  if (physicsLensMode === 'thermal') {
    return (
      <section
        id="physics-thermal-hud"
        aria-label={isId ? 'Monitor Termal FLIR' : 'FLIR Thermal Monitor'}
        onPointerDown={(event) => event.stopPropagation()}
        className={`absolute ${cardAnchorClass} z-30 pointer-events-auto touch-none rounded-2xl border px-2.5 py-2 ${surfaceClass}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-400 text-slate-950 shrink-0">
              <Flame className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[11px] font-bold leading-tight truncate">
                {isId ? 'Termal FLIR (P = I²R)' : 'FLIR Thermal (P = I²R)'}
              </h2>
              <p className={`text-[10px] leading-tight truncate ${mutedTextClass}`}>
                {thermalSummary?.hottest
                  ? isId
                    ? `Terpanas: ${thermalSummary.hottestLabel} (${thermalSummary.hottest.temperatureCelsius}°C)`
                    : `Hottest: ${thermalSummary.hottestLabel} (${thermalSummary.hottest.temperatureCelsius}°C)`
                  : isId
                  ? 'Semua jalur dingin (~26°C)'
                  : 'All paths cool (~26°C)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPhysicsLensMode('normal')}
            aria-label={isId ? 'Tutup mode termal' : 'Exit thermal lens'}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border cursor-pointer active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${iconBtnClass}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-1.5 grid grid-cols-4 gap-1 text-center text-[9px] font-mono font-bold">
          <div className="rounded-md py-0.5 bg-slate-800 text-slate-100 border border-slate-600">
            26° Dingin
          </div>
          <div className="rounded-md py-0.5 bg-teal-900 text-teal-100 border border-teal-500/60">
            45° Hangat
          </div>
          <div className="rounded-md py-0.5 bg-amber-400 text-slate-950 border border-amber-500">
            70° Panas
          </div>
          <div className="rounded-md py-0.5 bg-red-600 text-white border border-red-400">
            95°+ Kritis
          </div>
        </div>
      </section>
    );
  }

  // PROBE MODE COMPACT HUD
  const quickTargetNodes = scopedNodes.filter((n) => n.data.type !== 'waypoint').slice(0, 8);
  const probedNode =
    probeTargetA?.kind === 'node'
      ? scopedNodes.find((n) => n.id === probeTargetA.id) ?? null
      : null;
  const isProbedSwitch = probedNode?.data.type === 'switch';
  const isProbedSwitchOpen = Boolean(probedNode?.data.isOpen);

  const isFaultState = Boolean(
    primaryReading &&
      (primaryReading.isShorted ||
        primaryReading.isOpenCircuit ||
        primaryReading.polarity === 'reverse')
  );

  const hasComponentTerminals = Boolean(
    primaryReading && primaryReading.secondaryPotentialVolts !== undefined
  );
  const headlineVoltage = primaryReading
    ? hasComponentTerminals
      ? primaryReading.deltaVoltageVolts
      : primaryReading.potentialVolts
    : 0;

  return (
    <section
      id="physics-probe-hud"
      aria-label={isId ? 'Probe Multimeter Langsung' : 'Live Finger Probe HUD'}
      onPointerDown={(event) => event.stopPropagation()}
      className={`absolute ${cardAnchorClass} z-30 pointer-events-auto touch-none rounded-2xl border px-2.5 py-2 ${surfaceClass}`}
    >
      {/* Row 1: Compact Single-Line Header + Inline Actions */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded-lg shrink-0 ${
              isLight ? 'bg-sky-700 text-white' : 'bg-cyan-400 text-slate-950'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[11px] font-bold leading-tight truncate">
              {primaryReading
                ? primaryReading.label
                : isId
                ? 'Probe Jari'
                : 'Touch Probe'}
            </h2>
            <p className={`text-[10px] leading-tight truncate ${mutedTextClass}`}>
              {isPickingProbeB
                ? isId
                  ? 'Ketuk titik B untuk ukur ΔV...'
                  : 'Tap Point B for ΔV...'
                : primaryReading
                ? probeTargetA
                  ? isId
                    ? 'Terkunci · ketuk komponen lain / kabel'
                    : 'Pinned · tap part / wire'
                  : isId
                  ? 'Pratinjau · ketuk untuk kunci'
                  : 'Preview · tap to pin'
                : isId
                ? 'Ketuk komponen / kabel di kanvas'
                : 'Tap any part or wire'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Compact Inline +B Toggle when Primary Probe A exists */}
          {probeTargetA && (
            <button
              type="button"
              data-testid="probe-compare-b-btn"
              onClick={() => setIsPickingProbeB(!isPickingProbeB)}
              title={isId ? 'Bandingkan dengan titik B (ΔV)' : 'Compare with Point B (ΔV)'}
              className={`min-h-[44px] px-2 rounded-xl border text-[11px] font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                isPickingProbeB
                  ? 'bg-amber-400 text-slate-950 border-amber-500'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-400/50'
              }`}
            >
              <GitCompareArrows className="w-3.5 h-3.5 shrink-0" />
              <span>{isPickingProbeB ? (isId ? 'Batal' : 'Cancel') : 'ΔV'}</span>
            </button>
          )}

          {/* Expand/Collapse Quick-Pick & Trace Details */}
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            aria-expanded={showDetails}
            aria-label={
              primaryReading
                ? isId
                  ? 'Detail telemetri & pilih komponen'
                  : 'Telemetry details & quick-pick'
                : isId
                ? 'Pilih cepat komponen'
                : 'Quick-pick components'
            }
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border cursor-pointer active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${iconBtnClass}`}
          >
            {!primaryReading ? (
              <ListFilter className="w-4 h-4" />
            ) : showDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Clear Pin or Exit Probe Lens */}
          <button
            type="button"
            onClick={() => {
              if (probeTargetA || probeTargetB) {
                clearProbeTargets();
              } else {
                setPhysicsLensMode('normal');
              }
            }}
            aria-label={
              probeTargetA || probeTargetB
                ? isId
                  ? 'Hapus pin probe'
                  : 'Clear pinned probes'
                : isId
                ? 'Tutup mode probe'
                : 'Close probe lens'
            }
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border cursor-pointer active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${iconBtnClass}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row 2: Slim 1-Row Live Telemetry Strip (Only when active target exists) */}
      {primaryReading && (
        <div className={`mt-1.5 grid grid-cols-3 gap-1.5 rounded-xl border p-1.5 ${subtleCellClass}`}>
          <div className="min-w-0">
            <div className={`text-[9px] font-medium truncate ${mutedTextClass}`}>
              {hasComponentTerminals
                ? isId
                  ? 'Beda V'
                  : 'Drop ΔV'
                : isId
                ? 'Potensial'
                : 'Potential'}
            </div>
            <div className="font-mono text-xs font-bold leading-tight truncate">
              {headlineVoltage.toFixed(2)}V
            </div>
            {hasComponentTerminals && (
              <div className={`font-mono text-[9px] truncate ${mutedTextClass}`}>
                {primaryReading.potentialVolts.toFixed(1)}V /{' '}
                {primaryReading.secondaryPotentialVolts!.toFixed(1)}V
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className={`text-[9px] font-medium truncate ${mutedTextClass}`}>
              {isId ? 'Arus (I)' : 'Current'}
            </div>
            <div className="font-mono text-xs font-bold leading-tight truncate">
              {formatCurrentDisplay(primaryReading.currentAmps)}
            </div>
            <div className={`font-mono text-[9px] truncate ${mutedTextClass}`}>
              {primaryReading.resistanceOhms !== null
                ? `${primaryReading.resistanceOhms}Ω`
                : primaryReading.kind === 'wire'
                ? isId
                  ? 'Kawat'
                  : 'Wire'
                : isId
                ? 'Sumber'
                : 'Source'}
            </div>
          </div>

          <div className="min-w-0">
            <div className={`text-[9px] font-medium truncate ${mutedTextClass}`}>
              {isId ? 'Daya (P)' : 'Power'}
            </div>
            <div className="font-mono text-xs font-bold leading-tight truncate">
              {primaryReading.powerWatts.toFixed(2)}W
            </div>
            <div
              className={`font-mono text-[9px] truncate font-semibold ${
                primaryReading.isShorted
                  ? 'text-red-400'
                  : isFaultState
                  ? isLight
                    ? 'text-amber-700'
                    : 'text-amber-300'
                  : mutedTextClass
              }`}
            >
              {primaryReading.isShorted
                ? isId
                  ? 'KORSLET'
                  : 'SHORT'
                : primaryReading.polarity}
            </div>
          </div>
        </div>
      )}

      {/* Slim Dual-Probe Result Bar */}
      {dualComparison && (
        <div
          className={`mt-1.5 rounded-xl border px-2 py-1 text-[10px] font-mono font-bold flex items-center justify-between gap-2 ${
            isLight
              ? 'bg-amber-50 border-amber-400 text-amber-950'
              : 'bg-amber-950/85 border-amber-400/70 text-amber-100'
          }`}
        >
          <span className="truncate">
            A ({dualComparison.pointA.potentialVolts.toFixed(1)}V) - B (
            {dualComparison.pointB.potentialVolts.toFixed(1)}V)
          </span>
          <span className="shrink-0 font-black">
            ΔV = {dualComparison.voltageDiffVolts >= 0 ? '+' : ''}
            {dualComparison.voltageDiffVolts.toFixed(2)}V
          </span>
        </div>
      )}

      {/* Inline Live Switch Tester (only when a switch is actively pinned in Probe mode) */}
      {isProbedSwitch && probedNode && (
        <button
          type="button"
          data-testid="probe-switch-toggle-btn"
          onClick={() => toggleSwitch(probedNode.id)}
          className={`mt-1.5 w-full min-h-[44px] rounded-xl border px-3 py-1.5 text-[11px] font-bold flex items-center justify-between gap-2 cursor-pointer active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            isProbedSwitchOpen
              ? isLight
                ? 'bg-amber-100 hover:bg-amber-200 border-amber-500 text-amber-950'
                : 'bg-amber-950/80 hover:bg-amber-900/90 border-amber-400/70 text-amber-100'
              : isLight
              ? 'bg-emerald-100 hover:bg-emerald-200 border-emerald-600 text-emerald-950'
              : 'bg-emerald-950/80 hover:bg-emerald-900/90 border-emerald-400/70 text-emerald-100'
          }`}
        >
          <span className="flex items-center gap-1.5 truncate">
            <Power className="w-3.5 h-3.5 shrink-0" />
            <span>
              {isProbedSwitchOpen
                ? isId
                  ? 'Status: Sakelar Terbuka (OFF)'
                  : 'State: Switch Open (OFF)'
                : isId
                ? 'Status: Sakelar Tertutup (ON)'
                : 'State: Switch Closed (ON)'}
            </span>
          </span>
          <span className="shrink-0 font-mono text-[10px] underline">
            {isProbedSwitchOpen
              ? isId
                ? 'Tutup (ON)'
                : 'Close (ON)'
              : isId
              ? 'Buka (OFF)'
              : 'Open (OFF)'}
          </span>
        </button>
      )}

      {/* Slim Contextual Status & Fault Insight Strip */}
      {primaryReading && (
        <div
          role={isFaultState ? 'status' : undefined}
          className={`mt-1.5 rounded-xl border px-2 py-1 text-[10px] leading-snug flex items-center gap-1.5 ${
            primaryReading.isShorted
              ? 'bg-red-950/90 border-red-400 text-red-100'
              : isFaultState
              ? isLight
                ? 'bg-amber-50 border-amber-400 text-amber-950'
                : 'bg-amber-950/85 border-amber-400/70 text-amber-100'
              : subtleCellClass
          }`}
        >
          {isFaultState ? (
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          ) : (
            <Info className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-sky-700' : 'text-cyan-400'}`} />
          )}
          <span className="line-clamp-2">
            {isId ? primaryReading.statusNoteId : primaryReading.statusNoteEn}
          </span>
        </div>
      )}

      {/* Progressive Disclosure Details Drawer (Closed by default to keep canvas clear!) */}
      {showDetails && (
        <div className="mt-2 space-y-2">
          {primaryReading && (
            <>
              <div
                className={`rounded-xl border px-2 py-1 flex items-center justify-between gap-2 ${subtleCellClass}`}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-mono shrink-0">
                  <Activity className="w-3.5 h-3.5 text-cyan-500" />
                  <span>{isId ? 'Jejak DC' : 'DC Trace'}</span>
                </div>
                <svg
                  viewBox="0 0 140 24"
                  className="w-32 h-6 overflow-visible"
                  aria-hidden="true"
                >
                  <line
                    x1="0"
                    y1="21"
                    x2="140"
                    y2="21"
                    stroke={isLight ? '#CBD5E1' : '#334155'}
                    strokeWidth="1"
                  />
                  <polyline
                    fill="none"
                    stroke={
                      primaryReading.isShorted
                        ? '#EF4444'
                        : isLight
                        ? '#0369A1'
                        : '#22D3EE'
                    }
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={buildSparklinePoints(
                      headlineVoltage,
                      primaryReading.currentAmps,
                      primaryReading.isShorted
                    )}
                  />
                </svg>
              </div>

              {dualComparison && (
                <p className={`text-[10px] leading-snug px-0.5 ${mutedTextClass}`}>
                  {isId ? dualComparison.explanationId : dualComparison.explanationEn}
                </p>
              )}
            </>
          )}

          {quickTargetNodes.length > 0 && (
            <div className={`pt-1.5 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {quickTargetNodes.map((node) => {
                  const isA = probeTargetA?.kind === 'node' && probeTargetA.id === node.id;
                  const isB = probeTargetB?.kind === 'node' && probeTargetB.id === node.id;
                  return (
                    <button
                      key={`qp-${node.id}`}
                      type="button"
                      onClick={() => selectProbeTarget({ kind: 'node', id: node.id })}
                      className={`min-h-[44px] px-2.5 rounded-xl border text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                        isA
                          ? isLight
                            ? 'bg-sky-700 text-white border-sky-800'
                            : 'bg-cyan-400 text-slate-950 border-cyan-300 font-bold'
                          : isB
                          ? 'bg-amber-400 text-slate-950 border-amber-500 font-bold'
                          : isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-white/15'
                      }`}
                    >
                      {isA ? '[A] ' : isB ? '[B] ' : ''}
                      {node.data.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
