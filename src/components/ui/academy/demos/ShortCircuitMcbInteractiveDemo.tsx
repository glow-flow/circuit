import React, { useState } from 'react';
import { Scissors, ShieldAlert, Zap } from 'lucide-react';
import { useCircuitStore } from '../../../../store/useCircuitStore';
import { MiniLabFrame } from './MiniLabFrame';

/**
 * Interactive Short Circuit, MCB Trip & PUIL Cable Safety SVG Micro-Lab.
 * Lets students cut the faulted bypass wire, reset the MCB, and compare thin vs PUIL 2.5mm² wire ratings.
 *
 * Time Complexity: O(1).
 */
export const ShortCircuitMcbInteractiveDemo: React.FC = () => {
  const language = useCircuitStore((state) => state.language);
  const isId = language === 'id';

  const [hasBypassFault, setHasBypassFault] = useState<boolean>(true);
  const [mcbClosed, setMcbClosed] = useState<boolean>(false);
  const [wireGauge, setWireGauge] = useState<'thin' | 'puil'>('puil');

  const batteryV = 12;
  const loadR = 15; // 0.8 A normal load
  const rWire = wireGauge === 'thin' ? 1.8 : 0.2;

  const isTrippedByShort = hasBypassFault && mcbClosed;
  const faultCurrent = hasBypassFault ? batteryV / Math.max(0.05, 0.05) : 0;
  const loadCurrent = !hasBypassFault && mcbClosed ? batteryV / (loadR + rWire) : 0;
  const wireHeatWatts =
    isTrippedByShort ? 120 : loadCurrent * loadCurrent * rWire;
  const isCured = !hasBypassFault && mcbClosed && wireGauge === 'puil';

  const handleToggleMcb = () => {
    setMcbClosed((prev) => !prev);
  };

  return (
    <MiniLabFrame
      title={isId ? 'Lab Visual: Korsleting, MCB & Kabel PUIL' : 'Visual Lab: Short Circuit, MCB & Wire Gauge'}
      formula="I_short = V / 0Ω → TRIP"
      challengeText={
        isCured
          ? isId
            ? 'Sempurna! Kawat korslet diputus, MCB aktif, kabel 2.5mm² dingin aman.'
            : 'Cured! Bypass fault removed, MCB armed, and 2.5mm² wire stays cool.'
          : isTrippedByShort
          ? isId
            ? 'MCB ANJLOK! Arus kejut >10A terdeteksi. Putus kabel korslet merah dahulu!'
            : 'MCB TRIPPED! >10A surge fault. Cut the red bypass wire first!'
          : isId
          ? 'Misi Mini: Gunting kabel bypass merah, pilih Kabel 2.5mm², lalu ON-kan MCB!'
          : 'Mini Goal: Cut the red bypass wire, choose 2.5mm² wire, then turn MCB ON!'
      }
      isChallengeMet={isCured}
    >
      {/* Interactive SVG Circuit */}
      <div className="rounded-xl bg-void-900 border border-white/10 p-2.5">
        <svg viewBox="0 0 360 140" className="w-full h-auto max-h-40 select-none">
          {/* Main Rails */}
          <path d="M 64 42 L 295 42" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
          <path d="M 64 106 L 295 106" fill="none" stroke="#64748b" strokeWidth="2.5" />

          {/* 12V Battery */}
          <rect x="16" y="38" width="54" height="72" rx="9" fill="#090d16" stroke="#38bdf8" strokeWidth="1.5" />
          <text
            x="43"
            y="68"
            textAnchor="middle"
            fill={isTrippedByShort ? '#fb7185' : '#7dd3fc'}
            fontSize="12"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            {isTrippedByShort ? '0.0V' : '12V'}
          </text>
          <text x="43" y="88" textAnchor="middle" fill="#94a3b8" fontSize="8.5" fontFamily="JetBrains Mono, monospace">
            {isTrippedByShort ? 'DROP!' : 'STABIL'}
          </text>

          {/* Clickable MCB Switch */}
          <g onClick={handleToggleMcb} className="cursor-pointer">
            <rect
              x="92"
              y="22"
              width="72"
              height="38"
              rx="8"
              fill="#090d16"
              stroke={isTrippedByShort ? '#f43f5e' : mcbClosed ? '#10b981' : '#f59e0b'}
              strokeWidth="1.8"
            />
            <text x="128" y="37" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontWeight="700">
              MCB 10A
            </text>
            <text
              x="128"
              y="52"
              textAnchor="middle"
              fill={isTrippedByShort ? '#fb7185' : mcbClosed ? '#34d399' : '#fbbf24'}
              fontSize="10"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
            >
              {isTrippedByShort ? 'TRIP!' : mcbClosed ? 'ON' : 'OFF'}
            </text>
          </g>

          {/* Clickable Red Bypass Fault Wire */}
          <g onClick={() => setHasBypassFault((v) => !v)} className="cursor-pointer">
            {hasBypassFault ? (
              <>
                <path
                  d="M 205 42 C 218 65, 192 85, 205 106"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="3.5"
                />
                <circle cx="205" cy="74" r="13" fill="#4c0519" stroke="#f43f5e" strokeWidth="1.5" />
                <text x="205" y="78" textAnchor="middle" fill="#fda4af" fontSize="9" fontWeight="700">
                  CUT
                </text>
                <text x="205" y="124" textAnchor="middle" fill="#fb7185" fontSize="8.5" fontWeight="600">
                  Kawat 0Ω!
                </text>
              </>
            ) : (
              <>
                <line x1="205" y1="42" x2="205" y2="56" stroke="#334155" strokeWidth="2" />
                <line x1="205" y1="92" x2="205" y2="106" stroke="#334155" strokeWidth="2" />
                <text x="205" y="77" textAnchor="middle" fill="#34d399" fontSize="8.5" fontWeight="700">
                  PUTUS OK
                </text>
              </>
            )}
          </g>

          {/* Right Lab Load Bulb */}
          <g transform="translate(274, 52)">
            <line x1="21" y1="-10" x2="21" y2="54" stroke="#334155" strokeWidth="2" />
            {loadCurrent > 0 && <circle cx="21" cy="22" r="26" fill="#facc15" fillOpacity="0.3" />}
            <circle
              cx="21"
              cy="22"
              r="18"
              fill="#090d16"
              stroke={loadCurrent > 0 ? '#facc15' : '#475569'}
              strokeWidth="2"
            />
            <text x="21" y="25" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="700">
              {loadCurrent > 0 ? 'NYALA' : 'MATI'}
            </text>
            <text x="21" y="72" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="JetBrains Mono, monospace">
              {isTrippedByShort
                ? `${faultCurrent.toFixed(0)}A`
                : `${loadCurrent.toFixed(2)}A`}
            </text>
          </g>
        </svg>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setHasBypassFault((v) => !v)}
          className={`min-h-[42px] rounded-xl border px-3 py-1.5 flex items-center justify-center gap-1.5 font-semibold text-xs transition-all active:scale-95 ${
            hasBypassFault
              ? 'bg-rose-500/20 border-rose-500/60 text-rose-200'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          {hasBypassFault
            ? isId ? 'Gunting Kawat Korslet' : 'Cut Short Wire'
            : isId ? 'Kabel Korslet Bersih' : 'Fault Cleared'}
        </button>

        <button
          type="button"
          onClick={handleToggleMcb}
          className={`min-h-[42px] rounded-xl border px-3 py-1.5 flex items-center justify-center gap-1.5 font-semibold text-xs transition-all active:scale-95 ${
            isTrippedByShort
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-200'
              : mcbClosed
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
              : 'bg-electric-500/20 border-electric-500/50 text-electric-200'
          }`}
        >
          {isTrippedByShort ? <ShieldAlert className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
          {mcbClosed
            ? isTrippedByShort
              ? isId ? 'Reset MCB' : 'Reset MCB'
              : isId ? 'MCB: ON (Aman)' : 'MCB: ON (Safe)'
            : isId ? 'Aktifkan MCB' : 'Turn MCB ON'}
        </button>

        <button
          type="button"
          onClick={() => setWireGauge((g) => (g === 'puil' ? 'thin' : 'puil'))}
          className={`min-h-[42px] rounded-xl border px-3 py-1.5 font-semibold text-xs transition-all active:scale-95 ${
            wireGauge === 'puil'
              ? 'bg-sky-500/15 border-sky-500/40 text-sky-200'
              : 'bg-amber-500/15 border-amber-500/40 text-amber-200'
          }`}
        >
          {wireGauge === 'puil'
            ? `Kabel 2.5mm² (${wireHeatWatts.toFixed(1)}W)`
            : `Kabel 0.5mm² (${wireHeatWatts.toFixed(1)}W!)`}
        </button>
      </div>
    </MiniLabFrame>
  );
};
