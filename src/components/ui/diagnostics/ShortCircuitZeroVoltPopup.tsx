import React, { useEffect, useMemo, useState } from 'react';
import {
  Flame,
  Lightbulb,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { detectShortCircuitZeroVoltState } from '../../../physics/shortCircuitZeroVoltAdvisor';
import { MascotAvatar } from '../common/MascotAvatar';

/**
 * Floating Bottom-Right Short-Circuit `0V` Battery Pop-Up & Interactive Visual Explainer
 * (`ShortCircuitZeroVoltPopup.tsx`).
 *
 * Triggers automatically in Lab Mode when the user closes a switch on a short-circuit
 * path (or drains the battery to `0V` in a closed loop), displaying an inviting
 * floating callout at the bottom-right of the canvas:
 *   "Baterai mu jadi 0V tuh, pengen tahu? Klik aku!"
 *
 * Clicking the callout opens a concise, visual X-Ray explanation of battery internal
 * resistance ($V_{\text{kutub}} = E - I \cdot r_{\text{dalam}} = 0\text{V}$) with an
 * interactive [Korsleting 0V] vs [Normal + Lampu] comparison toggle and 1-click recovery.
 *
 * Time Complexity: O(N + E) store state evaluation via `detectShortCircuitZeroVoltState`.
 */
export const ShortCircuitZeroVoltPopup: React.FC = () => {
  const nodes = useCircuitStore((state) => state.nodes);
  const edges = useCircuitStore((state) => state.edges);
  const simulation = useCircuitStore((state) => state.simulation);
  const worldMode = useCircuitStore((state) => state.worldMode);
  const language = useCircuitStore((state) => state.language);
  const rechargeBattery = useCircuitStore((state) => state.rechargeBattery);
  const toggleSwitch = useCircuitStore((state) => state.toggleSwitch);
  const loadPreset = useCircuitStore((state) => state.loadPreset);

  const isId = language === 'id';

  const advisory = useMemo(
    () =>
      detectShortCircuitZeroVoltState(
        nodes,
        edges,
        simulation,
        worldMode,
        language
      ),
    [nodes, edges, simulation, worldMode, language]
  );

  const [isExplainerModalOpen, setIsExplainerModalOpen] = useState<boolean>(false);
  const [isDismissedForCurrentEvent, setIsDismissedForCurrentEvent] =
    useState<boolean>(false);
  const [visualComparisonMode, setVisualComparisonMode] = useState<
    'short' | 'normal'
  >('short');

  // Reset dismissal automatically whenever the short-circuit state clears and re-triggers
  useEffect(() => {
    if (!advisory.isTriggered) {
      setIsDismissedForCurrentEvent(false);
    }
  }, [advisory.isTriggered]);

  if (!advisory.isTriggered) {
    return null;
  }

  const nominalV = advisory.nominalEmfVolts || 3.0;
  const internalROhms = advisory.internalResistanceOhms || 0.3;
  const shortCurrentA = advisory.peakShortCurrentAmps || 10.0;
  const normalLoadOhms = 10;
  const normalCurrentA = Number(
    (nominalV / (normalLoadOhms + internalROhms)).toFixed(2)
  );
  const normalInternalDropV = Number(
    (normalCurrentA * internalROhms).toFixed(1)
  );
  const normalTerminalV = Number(
    Math.max(0, nominalV - normalInternalDropV).toFixed(1)
  );

  const handleRechargeAndOpenSwitches = () => {
    const currentState = useCircuitStore.getState();
    for (let i = 0; i < currentState.nodes.length; i++) {
      const node = currentState.nodes[i];
      if (!node?.data) continue;
      if (node.data.type === 'switch' && node.data.isOpen === false) {
        toggleSwitch(node.id);
      }
      if (
        node.data.type === 'battery' ||
        node.data.type === 'battery9v' ||
        node.data.type === 'battery-holder'
      ) {
        rechargeBattery(node.id);
      }
    }
    setIsExplainerModalOpen(false);
    setIsDismissedForCurrentEvent(false);
  };

  const handleLoadSafeLampCircuit = () => {
    loadPreset('simple-lamp');
    setIsExplainerModalOpen(false);
    setIsDismissedForCurrentEvent(false);
  };

  return (
    <>
      {/* ====================================================================
          FLOATING BOTTOM-RIGHT POP-UP CALLOUT ("Samping Kanan Agak Bawah")
         ==================================================================== */}
      {!isDismissedForCurrentEvent && (
        <div
          id="short-circuit-zero-volt-popup"
          role="status"
          aria-live="polite"
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 z-30 max-w-[295px] sm:max-w-xs pointer-events-auto animate-fade-in"
        >
          <div className="relative flex items-center gap-2.5 p-2.5 pr-8 rounded-2xl bg-void-950/95 backdrop-blur-xl border-2 border-rose-500/70 shadow-[0_12px_34px_rgba(244,63,94,0.35)] text-slate-100">
            <button
              type="button"
              onClick={() => {
                setVisualComparisonMode('short');
                setIsExplainerModalOpen(true);
              }}
              className="flex items-center gap-2.5 text-left group cursor-pointer active:scale-95 transition-transform"
            >
              {/* Animated Watt Angry + 0.0V Pill */}
              <div className="relative w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-400/60 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(244,63,94,0.35)]">
                <MascotAvatar mood="angry" size="xs" alt="Watt Panics at 0V" />
                <span className="absolute -bottom-1 -right-1 px-1 rounded bg-rose-600 text-[8px] font-mono font-extrabold text-white border border-rose-300/60 leading-tight">
                  0.0V
                </span>
              </div>

              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/25 border border-rose-400/40 text-[9px] font-mono font-bold text-rose-200 uppercase tracking-wider">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  {isId ? 'Deteksi Korsleting' : 'Short-Circuit Alert'}
                </span>
                <p className="text-xs font-bold text-white group-hover:text-amber-200 leading-snug mt-0.5 transition-colors">
                  {advisory.teaserPrompt}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsDismissedForCurrentEvent(true)}
              aria-label={isId ? 'Tutup notifikasi 0V' : 'Dismiss 0V alert'}
              className="absolute top-2 right-2 p-1 rounded-lg bg-void-900/90 hover:bg-void-800 text-slate-400 hover:text-white border border-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          CREATIVE VISUAL X-RAY EXPLAINER MODAL
         ==================================================================== */}
      {isExplainerModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="zero-volt-explainer-title"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setIsExplainerModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl bg-void-900 border border-rose-500/40 shadow-2xl text-slate-100 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-3 border-b border-white/10 bg-void-950">
              <div className="flex items-center gap-2.5 min-w-0">
                <MascotAvatar
                  mood={visualComparisonMode === 'short' ? 'angry' : 'proud'}
                  size="sm"
                  alt="Watt Explainer Mood"
                />
                <div className="min-w-0">
                  <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-rose-300">
                    {isId
                      ? 'Bedah Fisika · Hambatan Dalam Baterai'
                      : 'Physics X-Ray · Battery Internal Resistance'}
                  </span>
                  <h3
                    id="zero-volt-explainer-title"
                    className="text-sm sm:text-base font-bold text-white leading-tight truncate"
                  >
                    {isId
                      ? 'Kenapa Baterai Tiba-Tiba Jadi 0.0V?'
                      : 'Why Did the Battery Drop to 0.0V?'}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsExplainerModalOpen(false)}
                aria-label={isId ? 'Tutup' : 'Close'}
                className="w-8 h-8 rounded-xl bg-void-900 hover:bg-void-800 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 sm:p-4 space-y-3 overflow-y-auto">
              {/* Interactive Comparison Switcher: [Korsleting 0V] vs [Normal + Lampu] */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-void-950 border border-white/10">
                <button
                  type="button"
                  onClick={() => setVisualComparisonMode('short')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all active:scale-95 cursor-pointer ${
                    visualComparisonMode === 'short'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isId ? 'Saat Korsleting (0.0V)' : 'Short-Circuit (0.0V)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisualComparisonMode('normal')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all active:scale-95 cursor-pointer ${
                    visualComparisonMode === 'normal'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isId ? 'Saat Normal (Ada Lampu)' : 'Normal (With Lamp)'}
                  </span>
                </button>
              </div>

              {/* Creative X-Ray Battery Diagram SVG */}
              <div className="rounded-xl bg-void-950 border border-white/10 p-2.5">
                <svg
                  viewBox="0 0 340 148"
                  className="w-full h-auto"
                  role="img"
                  aria-label={
                    isId
                      ? 'Diagram X-Ray Hambatan Dalam Baterai'
                      : 'Battery Internal Resistance X-Ray Diagram'
                  }
                >
                  {/* Outer Battery X-Ray Shell */}
                  <rect
                    x="14"
                    y="20"
                    width="192"
                    height="74"
                    rx="10"
                    fill="#0f172a"
                    stroke={
                      visualComparisonMode === 'short' ? '#f43f5e' : '#38bdf8'
                    }
                    strokeWidth="2"
                  />
                  {/* Battery Positive Cap */}
                  <rect
                    x="206"
                    y="42"
                    width="8"
                    height="30"
                    rx="2"
                    fill={
                      visualComparisonMode === 'short' ? '#fb7185' : '#38bdf8'
                    }
                  />
                  <text
                    x="24"
                    y="33"
                    fill="#94a3b8"
                    fontSize="8.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {isId
                      ? 'X-RAY DALAM BATERAI'
                      : 'INSIDE BATTERY (X-RAY)'}
                  </text>

                  {/* Ideal Chemical Cell (E) */}
                  <rect
                    x="24"
                    y="40"
                    width="68"
                    height="42"
                    rx="6"
                    fill="#1e293b"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                  />
                  <text
                    x="58"
                    y="56"
                    textAnchor="middle"
                    fill="#bae6fd"
                    fontSize="8.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {isId ? 'Kimia (E)' : 'Chem (E)'}
                  </text>
                  <text
                    x="58"
                    y="72"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="12"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    +{nominalV.toFixed(1)}V
                  </text>

                  {/* Internal Connection Line */}
                  <line
                    x1="92"
                    y1="61"
                    x2="108"
                    y2="61"
                    stroke="#94a3b8"
                    strokeWidth="2"
                  />

                  {/* Internal Resistance (r_dalam) Box */}
                  <rect
                    x="108"
                    y="40"
                    width="86"
                    height="42"
                    rx="6"
                    fill={
                      visualComparisonMode === 'short' ? '#4c0519' : '#1e293b'
                    }
                    stroke={
                      visualComparisonMode === 'short' ? '#f43f5e' : '#64748b'
                    }
                    strokeWidth="1.8"
                  />
                  <text
                    x="151"
                    y="55"
                    textAnchor="middle"
                    fill={
                      visualComparisonMode === 'short' ? '#fda4af' : '#cbd5e1'
                    }
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    r_dalam ({internalROhms}Ω)
                  </text>
                  <text
                    x="151"
                    y="72"
                    textAnchor="middle"
                    fill={
                      visualComparisonMode === 'short' ? '#fecdd3' : '#94a3b8'
                    }
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {visualComparisonMode === 'short'
                      ? `-${nominalV.toFixed(1)}V (PANAS!)`
                      : `-${normalInternalDropV.toFixed(1)}V`}
                  </text>

                  {/* External Loop Wires */}
                  <path
                    d="M 214 57 L 296 57 L 296 122 L 14 122 L 14 57"
                    fill="none"
                    stroke={
                      visualComparisonMode === 'short' ? '#f43f5e' : '#34d399'
                    }
                    strokeWidth="2.8"
                    strokeDasharray={
                      visualComparisonMode === 'short' ? '6 3' : '4 2'
                    }
                  />

                  {/* External Load or Direct Short */}
                  {visualComparisonMode === 'short' ? (
                    <g>
                      <rect
                        x="248"
                        y="74"
                        width="82"
                        height="34"
                        rx="7"
                        fill="#4c0519"
                        stroke="#f43f5e"
                        strokeWidth="1.8"
                      />
                      <text
                        x="289"
                        y="89"
                        textAnchor="middle"
                        fill="#fda4af"
                        fontSize="8.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {isId ? 'TANPA BEBAN' : 'ZERO LOAD'}
                      </text>
                      <text
                        x="289"
                        y="101"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        R_luar = 0 Ω
                      </text>
                    </g>
                  ) : (
                    <g>
                      <circle
                        cx="296"
                        cy="90"
                        r="18"
                        fill="#facc15"
                        fillOpacity="0.28"
                      />
                      <circle
                        cx="296"
                        cy="90"
                        r="11"
                        fill="#fef08a"
                        stroke="#f59e0b"
                        strokeWidth="1.8"
                      />
                      <text
                        x="252"
                        y="93"
                        textAnchor="end"
                        fill="#fde68a"
                        fontSize="8.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        Lampu 10Ω
                      </text>
                    </g>
                  )}

                  {/* Terminal Voltage Readout Badge (V_kutub) */}
                  <rect
                    x="60"
                    y="104"
                    width="154"
                    height="32"
                    rx="8"
                    fill={
                      visualComparisonMode === 'short' ? '#881337' : '#064e3b'
                    }
                    stroke={
                      visualComparisonMode === 'short' ? '#fb7185' : '#34d399'
                    }
                    strokeWidth="1.8"
                  />
                  <text
                    x="137"
                    y="117"
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {isId
                      ? 'TEGANGAN KUTUB BATERAI (V_kutub)'
                      : 'BATTERY TERMINAL VOLTAGE'}
                  </text>
                  <text
                    x="137"
                    y="130"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="11.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {visualComparisonMode === 'short'
                      ? `${nominalV.toFixed(1)}V - ${nominalV.toFixed(1)}V = 0.0V!`
                      : `${nominalV.toFixed(1)}V - ${normalInternalDropV.toFixed(1)}V = ${normalTerminalV.toFixed(1)}V`}
                  </text>
                </svg>
              </div>

              {/* Live Formula Strip */}
              <div className="px-3 py-2 rounded-xl bg-void-950 border border-white/10 flex items-center justify-between gap-2 font-mono text-xs">
                <span className="text-slate-400">
                  V<sub>kutub</sub> = E - (I × r<sub>dalam</sub>)
                </span>
                <span
                  className={`font-bold ${
                    visualComparisonMode === 'short'
                      ? 'text-rose-300'
                      : 'text-emerald-300'
                  }`}
                >
                  {visualComparisonMode === 'short'
                    ? `I = ${shortCurrentA}A -> V = 0.0V`
                    : `I = ${normalCurrentA}A -> V = ${normalTerminalV}V`}
                </span>
              </div>

              {/* 3 Short, Punchy Takeaway Cards */}
              <div className="space-y-1.5 text-xs">
                <div className="p-2.5 rounded-xl bg-void-950/90 border border-rose-500/25 flex items-start gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold shrink-0">
                    1
                  </span>
                  <p className="text-slate-200 leading-snug">
                    {isId ? (
                      <>
                        <strong className="text-white">
                          Tegangan Habis di Dalam:
                        </strong>{' '}
                        Karena kabel langsung terhubung tanpa lampu (R = 0 Ω),
                        seluruh {nominalV.toFixed(1)}V tersedot oleh hambatan dalam
                        baterai sendiri (r<sub>dalam</sub>).
                      </>
                    ) : (
                      <>
                        <strong className="text-white">
                          Swallowed Inside:
                        </strong>{' '}
                        With zero external load (R = 0 Ω), 100% of the{' '}
                        {nominalV.toFixed(1)}V drops across the battery&apos;s own
                        internal resistance (r<sub>in</sub>).
                      </>
                    )}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-void-950/90 border border-amber-500/25 flex items-start gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold shrink-0">
                    2
                  </span>
                  <p className="text-slate-200 leading-snug">
                    {isId ? (
                      <>
                        <strong className="text-white">
                          Energi Kimia Terkuras Jadi Panas:
                        </strong>{' '}
                        Arus bocor {shortCurrentA}A mengubah kimia baterai menjadi
                        panas ({advisory.internalHeatWatts}W) hingga kapasitasnya
                        habis ({advisory.batteryChargePercent}%).
                      </>
                    ) : (
                      <>
                        <strong className="text-white">
                          Drained Into Heat:
                        </strong>{' '}
                        A {shortCurrentA}A surge turns chemical energy into heat (
                        {advisory.internalHeatWatts}W), draining capacity to{' '}
                        {advisory.batteryChargePercent}%.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* 1-Click Recovery Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRechargeAndOpenSwitches}
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isId
                      ? 'Isi Ulang 100% & Buka Saklar'
                      : 'Recharge 100% & Open Switch'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadSafeLampCircuit}
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-void-950 hover:bg-void-850 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isId ? 'Pasang Lampu Pengaman' : 'Load Safe Lamp Circuit'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
