import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Flame,
  GitCompareArrows,
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
 * or thermal load ripple without requiring heavy charting dependencies.
 * Time Complexity: O(1) (fixed 18 samples).
 */
function buildSparklinePoints(
  potentialVolts: number,
  currentAmps: number,
  isShorted: boolean
): string {
  const width = 160;
  const height = 28;
  const normalizedLevel = Math.min(1, Math.max(0.08, Math.abs(potentialVolts) / 14));
  const baseY = height - 4 - normalizedLevel * (height - 10);
  const rippleAmp = isShorted ? 5.5 : Math.min(3.5, currentAmps * 0.45);

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
 * Live Physics X-Ray HUD rendered alongside the canvas when `Thermal` or `Probe` lens is active.
 *
 * Implements three explicit UI states (Empty Prompt, Live Telemetry, Fault/Alert) plus keyboard-accessible
 * quick target chips so users on phones or keyboards can inspect every component and wire effortlessly.
 *
 * Time Complexity: O(P * α(P) + W) when recalculating pin potentials per simulation frame.
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

  const [isCollapsed, setIsCollapsed] = useState(false);

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
    let totalHeatWatts = 0;
    thermals.forEach((m) => {
      totalHeatWatts += m.powerWatts;
    });
    return {
      hottest,
      hottestLabel: hottestNode?.data.label ?? null,
      totalHeatWatts: Number(totalHeatWatts.toFixed(2)),
    };
  }, [physicsLensMode, scopedNodes, simulation, theme]);

  if (isHidden || physicsLensMode === 'normal') {
    return null;
  }

  const cardAnchorClass =
    worldMode === 'outside'
      ? 'top-[64px] left-1/2 -translate-x-1/2 w-[min(94vw,356px)] md:left-auto md:translate-x-0 md:top-[68px] md:right-3 md:w-[336px]'
      : 'bottom-[62px] left-1/2 -translate-x-1/2 w-[min(94vw,356px)] md:left-auto md:translate-x-0 md:top-3 md:right-3 md:bottom-auto md:w-[336px]';

  const surfaceClass = isLight
    ? 'bg-white/95 border-slate-300 text-slate-900 shadow-lg'
    : 'bg-slate-950/95 border-white/15 text-slate-50 shadow-lg';

  const mutedTextClass = isLight ? 'text-slate-600' : 'text-slate-300';
  const metricCellClass = isLight
    ? 'bg-slate-100 border-slate-200 text-slate-900'
    : 'bg-slate-900 border-white/10 text-slate-100';

  // THERMAL MODE HUD CARD
  if (physicsLensMode === 'thermal') {
    return (
      <section
        id="physics-thermal-hud"
        aria-label={isId ? 'Monitor Termal FLIR' : 'FLIR Thermal Monitor'}
        onPointerDown={(event) => event.stopPropagation()}
        className={`absolute ${cardAnchorClass} z-30 pointer-events-auto rounded-2xl border p-3 ${surfaceClass}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-400 text-slate-950 shrink-0">
              <Flame className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xs font-bold leading-tight truncate">
                {isId ? 'Lensa Termal FLIR (P = I²R)' : 'FLIR Thermal Lens (P = I²R)'}
              </h2>
              <p className={`text-[11px] leading-tight truncate ${mutedTextClass}`}>
                {thermalSummary?.hottest
                  ? isId
                    ? `Terpanas: ${thermalSummary.hottestLabel} (${thermalSummary.hottest.temperatureCelsius}°C)`
                    : `Hottest: ${thermalSummary.hottestLabel} (${thermalSummary.hottest.temperatureCelsius}°C)`
                  : isId
                  ? 'Semua jalur dalam kondisi dingin (~26°C)'
                  : 'All paths remain cool (~26°C ambient)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPhysicsLensMode('normal')}
            aria-label={isId ? 'Tutup mode termal' : 'Exit thermal lens'}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border cursor-pointer active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
              isLight
                ? 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
                : 'border-white/15 bg-slate-900 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Scale Legend with Explicit Text Bands */}
        <div className="mt-2.5 grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono font-bold">
          <div className="rounded-lg py-1 px-1 bg-slate-800 text-slate-100 border border-slate-600">
            26°C {isId ? 'Dingin' : 'Cool'}
          </div>
          <div className="rounded-lg py-1 px-1 bg-teal-900 text-teal-100 border border-teal-500/60">
            45°C {isId ? 'Hangat' : 'Warm'}
          </div>
          <div className="rounded-lg py-1 px-1 bg-amber-400 text-slate-950 border border-amber-500">
            70°C {isId ? 'Panas' : 'Hot'}
          </div>
          <div className="rounded-lg py-1 px-1 bg-red-600 text-white border border-red-400">
            95°C+ {isId ? 'Kritis' : 'Crit'}
          </div>
        </div>
      </section>
    );
  }

  // PROBE MODE HUD CARD
  const quickTargetNodes = scopedNodes.filter((n) => n.data.type !== 'waypoint').slice(0, 8);
  const isFaultState = Boolean(
    primaryReading &&
      (primaryReading.isShorted || primaryReading.isOpenCircuit || primaryReading.polarity === 'reverse')
  );

  return (
    <section
      id="physics-probe-hud"
      aria-label={isId ? 'Probe Multimeter Langsung' : 'Live Finger Probe HUD'}
      onPointerDown={(event) => event.stopPropagation()}
      className={`absolute ${cardAnchorClass} z-30 pointer-events-auto rounded-2xl border p-3 ${surfaceClass}`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${
              isLight ? 'bg-sky-700 text-white' : 'bg-cyan-400 text-slate-950'
            }`}
          >
            <Crosshair className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xs font-bold leading-tight truncate">
              {primaryReading
                ? primaryReading.label
                : isId
                ? 'Probe Jari Multimeter'
                : 'Touch Probe Multimeter'}
            </h2>
            <p className={`text-[11px] leading-tight truncate ${mutedTextClass}`}>
              {isPickingProbeB
                ? isId
                  ? 'Ketuk titik kedua untuk ukur ΔV...'
                  : 'Tap second point for ΔV...'
                : probeTargetA
                ? isId
                  ? 'Probe A terkunci (ketuk elemen lain untuk pindah)'
                  : 'Probe A pinned (tap any item to move)'
                : isId
                ? 'Arahkan atau ketuk komponen / kabel'
                : 'Hover or tap any part / wire'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-expanded={!isCollapsed}
            aria-label={isId ? 'Ciutkan panel probe' : 'Toggle probe details'}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border cursor-pointer active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              isLight
                ? 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
                : 'border-white/15 bg-slate-900 text-slate-200 hover:bg-slate-800'
            }`}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

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
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border cursor-pointer active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              isLight
                ? 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
                : 'border-white/15 bg-slate-900 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="mt-2.5 space-y-2.5">
          {/* STATE 1: EMPTY PROMPT STATE */}
          {!primaryReading ? (
            <div className={`rounded-xl border p-2.5 text-xs ${metricCellClass}`}>
              <p className="font-semibold">
                {isId
                  ? 'Sentuh komponen atau kabel mana saja untuk membedah tegangan simpul dan arusnya.'
                  : 'Tap any circuit element or wire to inspect live nodal potential and branch current.'}
              </p>
            </div>
          ) : (
            <>
              {/* STATE 2 & 3: LIVE TELEMETRY OR FAULT DIAGNOSTIC */}
              <div className="grid grid-cols-3 gap-1.5">
                <div className={`rounded-xl border p-2 ${metricCellClass}`}>
                  <div className={`text-[10px] font-medium ${mutedTextClass}`}>
                    {primaryReading.secondaryPotentialVolts !== undefined
                      ? 'V1 -> V2'
                      : isId
                      ? 'Potensial'
                      : 'Potential'}
                  </div>
                  <div className="font-mono text-sm font-bold leading-tight mt-0.5">
                    {primaryReading.potentialVolts.toFixed(2)}V
                  </div>
                  {primaryReading.secondaryPotentialVolts !== undefined && (
                    <div className={`font-mono text-[10px] ${mutedTextClass}`}>
                      ΔV {primaryReading.deltaVoltageVolts.toFixed(2)}V
                    </div>
                  )}
                </div>

                <div className={`rounded-xl border p-2 ${metricCellClass}`}>
                  <div className={`text-[10px] font-medium ${mutedTextClass}`}>
                    {isId ? 'Arus (I)' : 'Current (I)'}
                  </div>
                  <div className="font-mono text-sm font-bold leading-tight mt-0.5">
                    {formatCurrentDisplay(primaryReading.currentAmps)}
                  </div>
                  <div className={`font-mono text-[10px] ${mutedTextClass}`}>
                    {primaryReading.resistanceOhms !== null
                      ? `${primaryReading.resistanceOhms} Ω`
                      : primaryReading.kind === 'wire'
                      ? isId
                        ? 'Kawat'
                        : 'Wire'
                      : isId
                      ? 'Sumber'
                      : 'Source'}
                  </div>
                </div>

                <div className={`rounded-xl border p-2 ${metricCellClass}`}>
                  <div className={`text-[10px] font-medium ${mutedTextClass}`}>
                    {isId ? 'Daya (P)' : 'Power (P)'}
                  </div>
                  <div className="font-mono text-sm font-bold leading-tight mt-0.5">
                    {primaryReading.powerWatts.toFixed(2)}W
                  </div>
                  <div className={`font-mono text-[10px] ${mutedTextClass}`}>
                    {primaryReading.polarity}
                  </div>
                </div>
              </div>

              {/* Compact SVG Signal Sparkline */}
              <div
                className={`rounded-xl border px-2.5 py-1.5 flex items-center justify-between gap-2 ${metricCellClass}`}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-mono shrink-0">
                  <Activity className="w-3.5 h-3.5 text-cyan-500" />
                  <span>{isId ? 'Jejak DC' : 'DC Trace'}</span>
                </div>
                <svg
                  viewBox="0 0 160 28"
                  className="w-36 h-7 overflow-visible"
                  aria-hidden="true"
                >
                  <line
                    x1="0"
                    y1="25"
                    x2="160"
                    y2="25"
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
                      primaryReading.potentialVolts,
                      primaryReading.currentAmps,
                      primaryReading.isShorted
                    )}
                  />
                </svg>
              </div>

              {/* Explicit Fault vs Normal Diagnosis Callout */}
              <div
                role="status"
                className={`rounded-xl border px-2.5 py-2 text-[11px] leading-snug flex items-start gap-2 ${
                  primaryReading.isShorted
                    ? 'bg-red-950/90 border-red-400 text-red-100'
                    : isFaultState
                    ? isLight
                      ? 'bg-amber-50 border-amber-400 text-amber-950'
                      : 'bg-amber-950/85 border-amber-400/70 text-amber-100'
                    : isLight
                    ? 'bg-sky-50 border-sky-300 text-slate-900'
                    : 'bg-slate-900 border-cyan-400/40 text-slate-100'
                }`}
              >
                {isFaultState && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />}
                <span>{isId ? primaryReading.statusNoteId : primaryReading.statusNoteEn}</span>
              </div>

              {/* Dual-Probe ΔV Comparator Action & Readout */}
              {probeTargetA && (
                <div className="space-y-1.5">
                  <button
                    type="button"
                    data-testid="probe-compare-b-btn"
                    onClick={() => setIsPickingProbeB(!isPickingProbeB)}
                    className={`w-full min-h-[44px] px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                      isPickingProbeB
                        ? 'bg-amber-400 text-slate-950 border-amber-500'
                        : isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
                        : 'bg-slate-900 hover:bg-slate-800 text-amber-200 border-amber-400/50'
                    }`}
                  >
                    <GitCompareArrows className="w-4 h-4 shrink-0" />
                    <span>
                      {isPickingProbeB
                        ? isId
                          ? 'Batal Pilih Titik B'
                          : 'Cancel Point B Pick'
                        : secondaryReading
                        ? isId
                          ? 'Ganti Titik Referensi B'
                          : 'Change Reference Point B'
                        : isId
                        ? '+ Bandingkan Titik B (ΔV)'
                        : '+ Compare Point B (ΔV)'}
                    </span>
                  </button>

                  {dualComparison && (
                    <div className={`rounded-xl border p-2.5 text-[11px] space-y-1 ${metricCellClass}`}>
                      <div className="flex items-center justify-between font-mono font-bold">
                        <span>
                          A ({dualComparison.pointA.potentialVolts.toFixed(2)}V) vs B (
                          {dualComparison.pointB.potentialVolts.toFixed(2)}V)
                        </span>
                        <span
                          className={
                            isLight ? 'text-amber-700 font-black' : 'text-amber-300 font-black'
                          }
                        >
                          ΔV = {dualComparison.voltageDiffVolts >= 0 ? '+' : ''}
                          {dualComparison.voltageDiffVolts.toFixed(2)}V
                        </span>
                      </div>
                      <p className={`leading-snug ${mutedTextClass}`}>
                        {isId ? dualComparison.explanationId : dualComparison.explanationEn}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Keyboard & Mobile Thumb Quick-Pick Component Bar */}
          {quickTargetNodes.length > 0 && (
            <div className={`pt-1.5 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <div className={`text-[10px] font-semibold mb-1.5 ${mutedTextClass}`}>
                {isPickingProbeB
                  ? isId
                    ? 'Pilih Target B:'
                    : 'Pick Target B:'
                  : isId
                  ? 'Pilih Cepat Komponen:'
                  : 'Quick-Pick Part:'}
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
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
