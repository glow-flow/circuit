import React, { useState } from 'react';
import {
  Pin,
  Scissors,
  Sliders,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { TutorialStepId } from '../../../constants/tutorialSteps';
import { AppLanguage } from '../../../i18n/translations';

interface TutorialStepStageProps {
  stepId: TutorialStepId;
  language: AppLanguage;
}

const BLUEPRINT_STAGE_GRID: React.CSSProperties = {
  backgroundImage:
    'radial-gradient(rgba(56, 189, 248, 0.16) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)',
  backgroundSize: '14px 14px, 56px 56px, 56px 56px',
};

/**
 * Interactive Blueprint Workbench Stage for each of the 4 tutorial steps.
 * Lets students test switches, tabs, wire anchors, and Ohm's law voltage levels
 * directly inside the onboarding card.
 *
 * Time Complexity: O(1) render & state transitions.
 */
export const TutorialStepStage: React.FC<TutorialStepStageProps> = ({
  stepId,
  language,
}) => {
  const isId = language === 'id';

  // Step 1 interactive state: mini switch open/closed
  const [isDemoLoopClosed, setIsDemoLoopClosed] = useState(true);

  // Step 2 interactive state: selected mini preview tile
  const [selectedDemoPart, setSelectedDemoPart] = useState<'9v' | 'halogen' | 'rgb'>('halogen');

  // Step 3 interactive state: straight wire vs orthogonal anchor-routed wire
  const [hasDemoAnchor, setHasDemoAnchor] = useState(true);

  // Step 4 interactive state: test voltage in mini inspector (3V, 9V, or 18V overload)
  const [demoVoltage, setDemoVoltage] = useState<3 | 9 | 18>(9);

  if (stepId === 1) {
    const currentMa = isDemoLoopClosed ? '11.2 mA' : '0.0 mA';
    const powerMw = isDemoLoopClosed ? '101.2 mW' : '0.0 mW';

    return (
      <div
        className="relative rounded-xl border border-cyan-500/25 bg-void-950 p-3 sm:p-4 overflow-hidden select-none"
        style={BLUEPRINT_STAGE_GRID}
      >
        {/* Top blueprint telemetry bar */}
        <div className="flex items-center justify-between gap-2 text-[10px] font-mono mb-2.5">
          <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-semibold">
            {isId ? 'SIMULASI INTERAKTIF' : 'LIVE MINI CIRCUIT'}
          </span>
          <span
            className={`px-2 py-0.5 rounded border font-bold transition-colors ${
              isDemoLoopClosed
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                : 'bg-void-900 border-white/10 text-slate-400'
            }`}
          >
            {isDemoLoopClosed
              ? isId
                ? '● RANGKAIAN TERTUTUP (ON)'
                : '● CLOSED LOOP (ON)'
              : isId
              ? '○ RANGKAIAN TERBUKA (OFF)'
              : '○ OPEN LOOP (OFF)'}
          </span>
        </div>

        {/* Interactive Schematic Canvas */}
        <div className="relative flex items-center justify-between gap-2 py-2 px-1 sm:px-3">
          {/* SVG Connecting Wires behind components */}
          <svg
            viewBox="0 0 320 90"
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
          >
            {/* Top wire path */}
            <path
              d="M 55 26 L 160 26 L 265 26"
              fill="none"
              stroke={isDemoLoopClosed ? '#0891b2' : '#27272a'}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Bottom return wire path */}
            <path
              d="M 265 68 L 55 68"
              fill="none"
              stroke={isDemoLoopClosed ? '#0891b2' : '#27272a'}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {isDemoLoopClosed && (
              <>
                <path
                  d="M 55 26 L 160 26 L 265 26"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="3"
                  strokeDasharray="6 6"
                  className="animate-wire-flow"
                />
                <path
                  d="M 265 68 L 55 68"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="3"
                  strokeDasharray="6 6"
                  className="animate-wire-flow"
                />
              </>
            )}
          </svg>

          {/* Left: 9V Battery Card */}
          <div className="relative z-10 flex flex-col items-center bg-void-900/95 border border-white/15 rounded-xl px-2.5 py-2 w-[84px] sm:w-[92px] shadow-lg">
            <img
              src="/assets/battery-9v.png"
              alt="9V Battery"
              className="w-9 h-12 object-contain pointer-events-none"
            />
            <span className="mt-1 text-[10px] font-bold text-slate-200">Baterai 9V</span>
            <span className="text-[9px] font-mono text-amber-300">V = 9.0 V</span>
          </div>

          {/* Center: Interactive Clickable Switch */}
          <button
            type="button"
            onClick={() => setIsDemoLoopClosed((prev) => !prev)}
            className={`relative z-10 flex flex-col items-center px-3 py-2 rounded-xl border transition-all duration-150 active:scale-95 cursor-pointer shadow-lg ${
              isDemoLoopClosed
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                : 'bg-void-900/95 border-amber-400/50 text-slate-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center gap-1 text-[10px] font-mono font-bold">
              {isDemoLoopClosed ? (
                <ToggleRight className="w-4 h-4 text-cyan-300" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-amber-300" />
              )}
              <span>{isDemoLoopClosed ? 'ON' : 'OFF'}</span>
            </div>
            <span className="text-[10px] font-semibold mt-0.5">
              {isId ? 'Ketuk Saklar!' : 'Tap Switch!'}
            </span>
          </button>

          {/* Right: Real Incandescent Bulb with Dynamic Glow */}
          <div
            className={`relative z-10 flex flex-col items-center bg-void-900/95 border rounded-xl px-2.5 py-2 w-[84px] sm:w-[92px] transition-all duration-300 shadow-lg ${
              isDemoLoopClosed ? 'border-amber-400/60' : 'border-white/15'
            }`}
          >
            <div className="relative w-10 h-12 flex items-center justify-center">
              {isDemoLoopClosed && (
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(251,191,36,0.75) 0%, transparent 70%)',
                    filter: 'blur(6px)',
                  }}
                />
              )}
              <img
                src="/assets/bulb-incandescent.png"
                alt="Lamp"
                className="relative z-10 w-full h-full object-contain pointer-events-none transition-all duration-300"
                style={{
                  filter: isDemoLoopClosed
                    ? 'brightness(1.2) drop-shadow(0 0 8px rgba(251,191,36,0.8))'
                    : 'grayscale(85%) brightness(0.45)',
                }}
              />
            </div>
            <span className="mt-1 text-[10px] font-bold text-slate-200">Lampu 800Ω</span>
            <span className="text-[9px] font-mono text-cyan-300">{currentMa}</span>
          </div>
        </div>

        {/* Bottom Live Formula Strip */}
        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-300">
          <span>I = V / R = {currentMa}</span>
          <span className="text-amber-300 font-semibold">P = I²R = {powerMw}</span>
        </div>
      </div>
    );
  }

  if (stepId === 2) {
    const demoItems = {
      '9v': {
        name: 'Baterai 9V',
        spec: '9 V',
        tab: isId ? 'Baterai' : 'Batteries',
        img: '/assets/battery-9v.png',
        desc: isId
          ? 'Tegangan tinggi 9V untuk lampu daya besar.'
          : 'High 9V voltage for high-wattage lamps.',
      },
      halogen: {
        name: 'Lampu Halogen',
        spec: '1500 Ω · 50 W',
        tab: isId ? 'Lampu' : 'Lights',
        img: '/assets/bulb-halogen.png',
        desc: isId
          ? 'Sangat terang, hangat, hambatan 1500 Ω.'
          : 'Very bright warm light, 1500 Ω resistance.',
      },
      rgb: {
        name: 'Smart LED',
        spec: '6000 Ω · 7 W',
        tab: isId ? 'Lampu' : 'Lights',
        img: '/assets/bulb-rgb.png',
        desc: isId
          ? 'Paling hemat daya (7W), warna spektrum RGB.'
          : 'Ultra low power (7W), RGB spectrum.',
      },
    } as const;

    const currentItem = demoItems[selectedDemoPart];

    return (
      <div
        className="rounded-xl border border-cyan-500/25 bg-void-950 p-3 sm:p-3.5 select-none"
        style={BLUEPRINT_STAGE_GRID}
      >
        {/* Simulated Category Tabs */}
        <div className="flex items-center justify-between gap-1.5 mb-2.5">
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { label: isId ? 'Baterai (3)' : 'Batteries (3)', active: selectedDemoPart === '9v' },
              { label: isId ? 'Lampu (7)' : 'Lights (7)', active: selectedDemoPart !== '9v' },
              { label: isId ? 'Pengatur (2)' : 'Control (2)', active: false },
              { label: isId ? 'Ukur (3)' : 'Measure (3)', active: false },
            ].map((tab) => (
              <span
                key={tab.label}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold border whitespace-nowrap ${
                  tab.active
                    ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-300'
                    : 'bg-void-900/80 border-white/10 text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            ))}
          </div>
        </div>

        {/* 3 Interactive Specimen Tiles */}
        <div className="grid grid-cols-3 gap-2">
          {(['9v', 'halogen', 'rgb'] as const).map((key) => {
            const item = demoItems[key];
            const isSelected = selectedDemoPart === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDemoPart(key)}
                className={`text-left rounded-xl border p-1.5 transition-all active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                    : 'border-white/10 bg-void-900/85 hover:border-white/25'
                }`}
              >
                <div className="relative h-14 rounded-lg bg-void-950 flex items-center justify-center overflow-hidden">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="w-10 h-11 object-contain pointer-events-none"
                  />
                  <span className="absolute left-1 bottom-1 px-1 py-0.5 rounded bg-void-900/90 border border-white/10 text-[8px] font-mono text-slate-200">
                    {item.spec}
                  </span>
                </div>
                <div className="mt-1 text-[10px] font-bold text-slate-100 truncate px-0.5">
                  {item.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Simulated Bottom Action Strip */}
        <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2 bg-void-900/90 rounded-lg px-2.5 py-2 border">
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-white truncate">
              1. {currentItem.name}{' '}
              <span className="text-cyan-300 font-mono text-[10px]">({currentItem.spec})</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">{currentItem.desc}</div>
          </div>
          <span className="shrink-0 px-2.5 py-1.5 rounded-lg bg-cyan-500 text-void-950 text-[10px] font-bold shadow-[0_0_12px_rgba(34,211,238,0.35)]">
            2. {isId ? 'Taruh di kanvas' : 'Place on canvas'}
          </span>
        </div>
      </div>
    );
  }

  if (stepId === 3) {
    return (
      <div
        className="rounded-xl border border-cyan-500/25 bg-void-950 p-3 sm:p-4 select-none"
        style={BLUEPRINT_STAGE_GRID}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] font-mono text-amber-300 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-void-800 border-2 border-amber-400 inline-block shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
            {isId ? 'Titik (Dot) Kutub Komponen' : 'Yellow Component Terminal Dots'}
          </span>
          <button
            type="button"
            onClick={() => setHasDemoAnchor((prev) => !prev)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 text-[10px] font-mono font-semibold active:scale-95 transition-all cursor-pointer"
          >
            <Pin className="w-3 h-3" />
            <span>
              {hasDemoAnchor
                ? isId
                  ? 'Mode: Paku Siku (Rapi)'
                  : 'Mode: Orthogonal Bend'
                : isId
                ? 'Mode: Kabel Lurus'
                : 'Mode: Direct Wire'}
            </span>
          </button>
        </div>

        {/* SVG Terminal-to-Terminal Wiring & Waypoint Anchor Demo */}
        <div className="relative h-28 w-full flex items-center justify-between px-3">
          <svg
            viewBox="0 0 340 105"
            className="w-full h-full overflow-visible"
          >
            {/* Left Component Box */}
            <rect
              x="6"
              y="26"
              width="74"
              height="52"
              rx="10"
              fill="#121214"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1.5"
            />
            <text x="43" y="49" textAnchor="middle" fill="#f1f5f9" fontSize="10" fontWeight="bold">
              {isId ? 'Sumber' : 'Source'}
            </text>
            <text x="43" y="63" textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="monospace">
              Kutub (+)
            </text>

            {/* Right Component Box */}
            <rect
              x="260"
              y="26"
              width="74"
              height="52"
              rx="10"
              fill="#121214"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1.5"
            />
            <text x="297" y="49" textAnchor="middle" fill="#f1f5f9" fontSize="10" fontWeight="bold">
              {isId ? 'Lampu' : 'Lamp'}
            </text>
            <text x="297" y="63" textAnchor="middle" fill="#fbbf24" fontSize="9" fontFamily="monospace">
              800 Ω
            </text>

            {/* Wire Base & Flowing Current */}
            <path
              d={hasDemoAnchor ? 'M 80 52 L 170 20 L 260 52' : 'M 80 52 L 260 52'}
              fill="none"
              stroke="#0891b2"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={hasDemoAnchor ? 'M 80 52 L 170 20 L 260 52' : 'M 80 52 L 260 52'}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="3"
              strokeDasharray="6 6"
              className="animate-wire-flow"
            />

            {/* Left Yellow Terminal Dot */}
            <circle
              cx="80"
              cy="52"
              r="7"
              fill="#18181b"
              stroke="#fbbf24"
              strokeWidth="3"
            />
            {/* Right Yellow Terminal Dot */}
            <circle
              cx="260"
              cy="52"
              r="7"
              fill="#18181b"
              stroke="#fbbf24"
              strokeWidth="3"
            />

            {/* Optional Center Waypoint Anchor Pin */}
            {hasDemoAnchor && (
              <g>
                <circle
                  cx="170"
                  cy="20"
                  r="8"
                  fill="#09090b"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />
                <circle cx="170" cy="20" r="3" fill="#38bdf8" />
                <text
                  x="170"
                  y="8"
                  textAnchor="middle"
                  fill="#7dd3fc"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {isId ? 'Paku Tekukan (Ketuk 2x)' : 'Anchor Pin (Double-click)'}
                </text>
              </g>
            )}

            {/* Current Badge on Wire */}
            <rect
              x="142"
              y="66"
              width="56"
              height="18"
              rx="9"
              fill="#09090b"
              stroke="rgba(34,211,238,0.45)"
              strokeWidth="1"
            />
            <text
              x="170"
              y="78"
              textAnchor="middle"
              fill="#22d3ee"
              fontSize="9.5"
              fontFamily="monospace"
              fontWeight="bold"
            >
              11.2 mA
            </text>
          </svg>
        </div>
      </div>
    );
  }

  // Step 4: Cut Wire Pill + Interactive Inspector Voltage Test
  const isOverloaded = demoVoltage === 18;
  const demoCurrent = ((demoVoltage / 4500) * 1000).toFixed(1);

  return (
    <div
      className="rounded-xl border border-cyan-500/25 bg-void-950 p-3 sm:p-3.5 space-y-2.5 select-none"
      style={BLUEPRINT_STAGE_GRID}
    >
      {/* Top: Floating Wire Cut Action Bar Preview */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-full bg-void-900 border border-white/15 shadow-md">
        <span className="text-[10px] font-mono text-slate-300 truncate">
          {isId ? 'Saat kabel diklik:' : 'When a wire is clicked:'}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[10px] font-bold">
            <Pin className="w-3 h-3" />
            {isId ? 'Tekuk' : 'Bend'}
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold shadow-[0_0_10px_rgba(239,68,68,0.5)]">
            <Scissors className="w-3 h-3" />
            {isId ? 'Potong Kabel' : 'Cut Wire'}
          </span>
        </div>
      </div>

      {/* Bottom: Interactive Mini Inspector Demo */}
      <div className="rounded-xl bg-void-900/95 border border-white/10 p-2.5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isId ? 'Panel Inspector: Uji Tegangan ke LED' : 'Inspector: Test Voltage on LED'}</span>
          </div>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              isOverloaded
                ? 'bg-red-500/20 border-red-500/50 text-red-300 animate-pulse'
                : 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300'
            }`}
          >
            {isOverloaded
              ? isId
                ? '💥 PUTUS (OVERLOAD!)'
                : '💥 BLOWN (OVERLOAD!)'
              : `I = ${demoCurrent} mA`}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {([3, 9, 18] as const).map((volt) => (
            <button
              key={volt}
              type="button"
              onClick={() => setDemoVoltage(volt)}
              className={`py-1.5 px-2 rounded-lg font-mono text-[11px] font-bold border transition-all active:scale-95 cursor-pointer ${
                demoVoltage === volt
                  ? volt === 18
                    ? 'bg-red-500/25 border-red-400 text-red-200'
                    : 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                  : 'bg-void-950 border-white/10 text-slate-400 hover:text-slate-200'
              }`}
            >
              {volt === 3
                ? '3.0 V (2×AA)'
                : volt === 9
                ? '9.0 V (Normal)'
                : '18.0 V (Overload)'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
