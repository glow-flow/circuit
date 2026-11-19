import React from 'react';
import { TeacherQuickCard } from '../../../tutorial/interactiveTutorialConfig';
import { KnifeSwitchGraphic } from '../common/KnifeSwitchGraphic';

export interface WelcomeQuickCardVisualProps {
  /** Identifier of the teacher quick-start card (`'basic-switch'` | `'series-parallel'` | `'nature-ebt'` | `'short-circuit'`). */
  cardId: TeacherQuickCard['id'];
}

/**
 * Renders a compact, pure-SVG schematic illustration for each of the 4 Teacher Quick-Start
 * cards so teachers and students can recognize the circuit topology visually at a glance
 * without reading long paragraphs.
 *
 * Time Complexity: O(1) stateless SVG render.
 */
export const WelcomeQuickCardVisual: React.FC<WelcomeQuickCardVisualProps> = ({
  cardId,
}) => {
  if (cardId === 'basic-switch') {
    return (
      <svg
        viewBox="0 0 160 48"
        className="w-full h-11 rounded-lg bg-[#0B0F14] border border-electric-500/35 p-1"
        aria-hidden="true"
      >
        {/* 9V Battery */}
        <rect
          x="10"
          y="13"
          width="24"
          height="22"
          rx="3"
          fill="#0f172a"
          stroke="#38bdf8"
          strokeWidth="1.5"
        />
        <text
          x="22"
          y="27"
          textAnchor="middle"
          fill="#bae6fd"
          fontSize="8"
          fontFamily="monospace"
          fontWeight="bold"
        >
          9V
        </text>
        {/* Top wire to switch */}
        <path
          d="M 34 18 L 62 18"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Closed Switch Symbol */}
        <circle cx="64" cy="18" r="2.5" fill="#f59e0b" />
        <line
          x1="64"
          y1="18"
          x2="88"
          y2="14"
          stroke="#fbbf24"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="90" cy="18" r="2.5" fill="#f59e0b" />
        {/* Wire to Glowing Lamp */}
        <path
          d="M 92 18 L 122 18"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Return bottom wire */}
        <path
          d="M 34 30 L 122 30"
          stroke="#64748b"
          strokeWidth="1.75"
          strokeDasharray="3 2"
        />
        {/* Glowing Bulb */}
        <circle cx="132" cy="24" r="13" fill="#facc15" fillOpacity="0.22" />
        <circle
          cx="132"
          cy="24"
          r="8"
          fill="#fef08a"
          stroke="#f59e0b"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  if (cardId === 'series-parallel') {
    return (
      <svg
        viewBox="0 0 160 48"
        className="w-full h-11 rounded-lg bg-[#0B0F14] border border-amber-500/35 p-1"
        aria-hidden="true"
      >
        {/* Source node */}
        <rect
          x="8"
          y="14"
          width="22"
          height="20"
          rx="3"
          fill="#0f172a"
          stroke="#fbbf24"
          strokeWidth="1.5"
        />
        <text
          x="19"
          y="27"
          textAnchor="middle"
          fill="#fde68a"
          fontSize="7.5"
          fontFamily="monospace"
          fontWeight="bold"
        >
          I=2x
        </text>
        {/* Parallel Branch 1 (Top) */}
        <path
          d="M 30 20 L 52 12 L 128 12"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.75"
        />
        {/* Parallel Branch 2 (Bottom) */}
        <path
          d="M 30 28 L 52 36 L 128 36"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.75"
        />
        {/* Junction dots */}
        <circle cx="52" cy="12" r="2.2" fill="#38bdf8" />
        <circle cx="52" cy="36" r="2.2" fill="#38bdf8" />
        {/* Two Equally Bright Parallel Lamps */}
        <circle cx="94" cy="12" r="9" fill="#facc15" fillOpacity="0.25" />
        <circle
          cx="94"
          cy="12"
          r="5.5"
          fill="#fef08a"
          stroke="#f59e0b"
          strokeWidth="1.4"
        />
        <circle cx="94" cy="36" r="9" fill="#facc15" fillOpacity="0.25" />
        <circle
          cx="94"
          cy="36"
          r="5.5"
          fill="#fef08a"
          stroke="#f59e0b"
          strokeWidth="1.4"
        />
        <text
          x="138"
          y="27"
          textAnchor="middle"
          fill="#fde68a"
          fontSize="7.5"
          fontFamily="monospace"
          fontWeight="bold"
        >
          L1=L2
        </text>
      </svg>
    );
  }

  if (cardId === 'nature-ebt') {
    return (
      <svg
        viewBox="0 0 160 48"
        className="w-full h-11 rounded-lg bg-[#0B0F14] border border-emerald-500/35 p-1"
        aria-hidden="true"
      >
        {/* Sun icon */}
        <circle cx="18" cy="13" r="5.5" fill="#facc15" />
        {/* Solar Panel */}
        <polygon
          points="12,36 32,26 42,36 22,42"
          fill="#0284c7"
          stroke="#38bdf8"
          strokeWidth="1.2"
        />
        {/* Wind Turbine */}
        <line x1="68" y1="20" x2="68" y2="41" stroke="#cbd5e1" strokeWidth="2" />
        <circle cx="68" cy="20" r="2" fill="#34d399" />
        <line x1="68" y1="20" x2="68" y2="9" stroke="#e2e8f0" strokeWidth="1.6" />
        <line x1="68" y1="20" x2="77" y2="26" stroke="#e2e8f0" strokeWidth="1.6" />
        <line x1="68" y1="20" x2="59" y2="26" stroke="#e2e8f0" strokeWidth="1.6" />
        {/* Green grid wire to SUTET */}
        <path
          d="M 38 32 Q 86 28 118 22"
          fill="none"
          stroke="#34d399"
          strokeWidth="2"
          strokeDasharray="3 2"
        />
        {/* SUTET Tower */}
        <polygon
          points="126,10 118,41 134,41"
          fill="none"
          stroke="#34d399"
          strokeWidth="1.5"
        />
        <line x1="115" y1="18" x2="137" y2="18" stroke="#34d399" strokeWidth="1.5" />
        <text
          x="146"
          y="36"
          textAnchor="middle"
          fill="#6ee7b7"
          fontSize="7.5"
          fontFamily="monospace"
          fontWeight="bold"
        >
          12V
        </text>
      </svg>
    );
  }

  // 'short-circuit': Battery 0V + Direct red short wire
  return (
    <svg
      viewBox="0 0 160 48"
      className="w-full h-11 rounded-lg bg-[#0B0F14] border border-danger-500/40 p-1"
      aria-hidden="true"
    >
      {/* Battery at 0.0V */}
      <rect
        x="10"
        y="12"
        width="34"
        height="24"
        rx="3.5"
        fill="#1e1b4b"
        stroke="#f43f5e"
        strokeWidth="1.6"
      />
      <text
        x="27"
        y="27"
        textAnchor="middle"
        fill="#fda4af"
        fontSize="8"
        fontFamily="monospace"
        fontWeight="bold"
      >
        0.0V!
      </text>
      {/* Direct short-circuit loop with zero load */}
      <path
        d="M 44 17 L 134 17 L 134 31 L 44 31"
        fill="none"
        stroke="#f43f5e"
        strokeWidth="2.2"
        strokeDasharray="4 2"
      />
      {/* Hazard Spark in center */}
      <circle cx="94" cy="24" r="10" fill="#f43f5e" fillOpacity="0.22" />
      <polygon
        points="96,13 88,25 94,25 91,35 101,22 95,22"
        fill="#fb7185"
      />
      <text
        x="134"
        y="12"
        textAnchor="middle"
        fill="#fda4af"
        fontSize="7"
        fontFamily="monospace"
        fontWeight="bold"
      >
        R=0Ω
      </text>
    </svg>
  );
};

export interface WelcomeMiniCircuitDemoProps {
  /** True when the preview Knife Switch is open (OFF); false when closed (ON). */
  isOpen: boolean;
  /** Callback fired when the user taps anywhere on the mini-circuit strip. */
  onToggle: () => void;
  /** True for Indonesian copy, false for English. */
  isId: boolean;
}

/**
 * Interactive Mini-Circuit Header inside `WelcomeModal.tsx`.
 * Lets the user tap the Knife Switch and immediately see a 9V battery light up
 * a glowing bulb with animated current flow.
 *
 * Time Complexity: O(1) render.
 */
export const WelcomeMiniCircuitDemo: React.FC<WelcomeMiniCircuitDemoProps> = ({
  isOpen,
  onToggle,
  isId,
}) => {
  const isLampLit = !isOpen;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isLampLit}
      aria-label={
        isOpen
          ? isId
            ? 'Saklar demo terbuka, arus 0 ampere. Ketuk untuk menutup saklar.'
            : 'Demo switch open, 0 ampere. Tap to close switch.'
          : isId
          ? 'Saklar demo tertutup, lampu menyala. Ketuk untuk membuka saklar.'
          : 'Demo switch closed, bulb lit. Tap to open switch.'
      }
      className={`w-full text-left flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl border cursor-pointer transition-colors active:scale-[0.99] ${
        isLampLit
          ? 'bg-void-900 border-emerald-500/60'
          : 'bg-void-900 hover:bg-void-850 border-control'
      }`}
    >
      {/* Left: 9V Battery + Knife Switch + Interactive Lamp */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Mini 9V Battery Badge */}
        <div
          className={`px-1.5 py-1 rounded-lg border font-mono text-[11px] font-bold transition-colors ${
            isLampLit
              ? 'bg-electric-600 border-electric-700 text-white'
              : 'bg-void-950 border-control text-slate-300'
          }`}
        >
          9V
        </div>

        {/* Pure-Code Knife Switch */}
        <div className="w-16 h-11 shrink-0 flex items-center justify-center rounded-lg bg-[#0B0F14] px-1">
          <KnifeSwitchGraphic isOpen={isOpen} isCurrentFlowing={isLampLit} />
        </div>

        {/* Reactive Mini Bulb SVG */}
        <div className="w-9 h-9 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 36 36" className="w-8 h-8" aria-hidden="true">
            {isLampLit && (
              <circle
                cx="18"
                cy="16"
                r="14"
                fill="#facc15"
                fillOpacity="0.32"
              />
            )}
            <circle
              cx="18"
              cy="15"
              r="8.5"
              fill={isLampLit ? '#fef08a' : '#1e293b'}
              stroke={isLampLit ? '#f59e0b' : '#475569'}
              strokeWidth="1.8"
            />
            <path
              d="M 15 16 Q 18 10 21 16"
              fill="none"
              stroke={isLampLit ? '#d97706' : '#64748b'}
              strokeWidth="1.5"
            />
            <rect
              x="14"
              y="23"
              width="8"
              height="5"
              rx="1.5"
              fill="#94a3b8"
            />
          </svg>
        </div>
      </div>

      {/* Right: Concise Status Badge + 1-Line Prompt */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tabular-nums ${
              isOpen
                ? 'bg-[#B45309] text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {isOpen
              ? isId
                ? 'SAKLAR OFF · 0.0A'
                : 'SWITCH OFF · 0.0A'
              : isId
              ? 'SAKLAR ON · LAMPU NYALA!'
              : 'SWITCH ON · LAMP LIT!'}
          </span>
        </div>
        <p className="text-xs text-slate-300 mt-1 leading-snug">
          {isOpen
            ? isId
              ? 'Ketuk saklar di samping untuk menyalakan lampu!'
              : 'Tap the switch on the left to light the bulb!'
            : isId
            ? 'Rangkaian tertutup! Semua alat di kanvas bisa disentuh.'
            : 'Circuit closed! Every part on the canvas is touchable.'}
        </p>
      </div>
    </button>
  );
};
