import React, { useState } from 'react';
import { useCircuitStore } from '../../../../store/useCircuitStore';
import { MiniLabFrame, MiniSliderControl } from './MiniLabFrame';

/**
 * Interactive Series vs Parallel & Kirchhoff Current Law (KCL) SVG Micro-Lab.
 * Allows tapping either bulb directly inside the SVG to detach it and compare topologies.
 *
 * Time Complexity: O(1).
 */
export const KclJunctionInteractiveDemo: React.FC = () => {
  const language = useCircuitStore((state) => state.language);
  const isId = language === 'id';

  const [topology, setTopology] = useState<'series' | 'parallel'>('parallel');
  const [bulb1Connected, setBulb1Connected] = useState<boolean>(true);
  const [bulb2Connected, setBulb2Connected] = useState<boolean>(true);
  const [bulb2Ohms, setBulb2Ohms] = useState<number>(100);
  const [testedParallelDetach, setTestedParallelDetach] = useState<boolean>(false);

  const vBattery = 9;
  const bulb1Ohms = 100;

  let i1Ma = 0;
  let i2Ma = 0;
  let v1 = 0;
  let v2 = 0;

  if (topology === 'series') {
    if (bulb1Connected && bulb2Connected) {
      const iTotal = vBattery / (bulb1Ohms + bulb2Ohms);
      i1Ma = iTotal * 1000;
      i2Ma = iTotal * 1000;
      v1 = iTotal * bulb1Ohms;
      v2 = iTotal * bulb2Ohms;
    }
  } else {
    if (bulb1Connected) {
      i1Ma = (vBattery / bulb1Ohms) * 1000;
      v1 = vBattery;
    }
    if (bulb2Connected) {
      i2Ma = (vBattery / bulb2Ohms) * 1000;
      v2 = vBattery;
    }
  }

  const totalMa = topology === 'series' ? i1Ma : i1Ma + i2Ma;

  const handleToggleBulb1 = () => {
    const next = !bulb1Connected;
    setBulb1Connected(next);
    if (topology === 'parallel' && (!next || !bulb2Connected)) {
      setTestedParallelDetach(true);
    }
  };

  const handleToggleBulb2 = () => {
    const next = !bulb2Connected;
    setBulb2Connected(next);
    if (topology === 'parallel' && (!next || !bulb1Connected)) {
      setTestedParallelDetach(true);
    }
  };

  return (
    <MiniLabFrame
      title={isId ? 'Lab Visual: Seri vs Paralel & KCL' : 'Visual Lab: Series vs Parallel & KCL'}
      formula={topology === 'parallel' ? 'I_total = I₁ + I₂' : 'V_total = V₁ + V₂'}
      challengeText={
        testedParallelDetach
          ? isId
            ? 'Terbukti! Di cabang paralel, satu lampu dilepas tidak memadamkan lampu lain.'
            : 'Proven! In a parallel circuit, removing one bulb leaves the other lit.'
          : isId
          ? 'Misi Mini: Ketuk salah satu lampu di gambar SVG untuk melepasnya di mode Paralel!'
          : 'Mini Goal: Tap a bulb in the diagram to detach it while in Parallel mode!'
      }
      isChallengeMet={testedParallelDetach}
    >
      {/* Topology Toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTopology('series')}
          className={`min-h-[40px] rounded-xl border px-3 py-1.5 font-semibold text-xs transition-all active:scale-95 ${
            topology === 'series'
              ? 'bg-electric-500/20 border-electric-500/60 text-electric-200'
              : 'bg-void-900 border-white/10 text-slate-400 hover:text-slate-200'
          }`}
        >
          {isId ? '1 Jalur (Seri)' : 'Single Loop (Series)'}
        </button>
        <button
          type="button"
          onClick={() => setTopology('parallel')}
          className={`min-h-[40px] rounded-xl border px-3 py-1.5 font-semibold text-xs transition-all active:scale-95 ${
            topology === 'parallel'
              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200'
              : 'bg-void-900 border-white/10 text-slate-400 hover:text-slate-200'
          }`}
        >
          {isId ? 'Cabang Ganda (Paralel)' : 'Branched (Parallel)'}
        </button>
      </div>

      {/* Clickable SVG Diagram */}
      <div className="rounded-xl bg-void-900 border border-white/10 p-2.5">
        <svg viewBox="0 0 360 138" className="w-full h-auto max-h-40 select-none">
          {/* Source Battery */}
          <rect
            x="16"
            y="42"
            width="54"
            height="54"
            rx="10"
            fill="#0f172a"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />
          <text
            x="43"
            y="66"
            textAnchor="middle"
            fill="#7dd3fc"
            fontSize="11"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            9.0V
          </text>
          <text
            x="43"
            y="84"
            textAnchor="middle"
            fill="#34d399"
            fontSize="9"
            fontFamily="JetBrains Mono, monospace"
          >
            {totalMa.toFixed(0)}mA
          </text>

          {topology === 'series' ? (
            <>
              <path
                d="M 70 50 L 320 50 L 320 92 L 70 92"
                fill="none"
                stroke={totalMa > 0 ? '#38bdf8' : '#475569'}
                strokeWidth="2.5"
              />
              {/* Bulb 1 clickable */}
              <g onClick={handleToggleBulb1} className="cursor-pointer">
                <circle
                  cx="148"
                  cy="50"
                  r="20"
                  fill="#090d16"
                  stroke={bulb1Connected ? (i1Ma > 0 ? '#facc15' : '#64748b') : '#f43f5e'}
                  strokeWidth="2"
                  strokeDasharray={bulb1Connected ? undefined : '4 3'}
                />
                {i1Ma > 0 && <circle cx="148" cy="50" r="10" fill="#fde047" fillOpacity="0.45" />}
                <text x="148" y="54" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="700">
                  {bulb1Connected ? 'L1' : isId ? 'LEPAS' : 'OPEN'}
                </text>
                <text x="148" y="82" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="JetBrains Mono, monospace">
                  {v1.toFixed(1)}V · {i1Ma.toFixed(0)}mA
                </text>
              </g>

              {/* Bulb 2 clickable */}
              <g onClick={handleToggleBulb2} className="cursor-pointer">
                <circle
                  cx="256"
                  cy="50"
                  r="20"
                  fill="#090d16"
                  stroke={bulb2Connected ? (i2Ma > 0 ? '#facc15' : '#64748b') : '#f43f5e'}
                  strokeWidth="2"
                  strokeDasharray={bulb2Connected ? undefined : '4 3'}
                />
                {i2Ma > 0 && <circle cx="256" cy="50" r="10" fill="#fde047" fillOpacity="0.45" />}
                <text x="256" y="54" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="700">
                  {bulb2Connected ? 'L2' : isId ? 'LEPAS' : 'OPEN'}
                </text>
                <text x="256" y="82" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="JetBrains Mono, monospace">
                  {v2.toFixed(1)}V · {i2Ma.toFixed(0)}mA
                </text>
              </g>
            </>
          ) : (
            <>
              {/* Parallel Bus Bars */}
              <path d="M 70 46 L 285 46" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
              <path d="M 70 98 L 285 98" fill="none" stroke="#64748b" strokeWidth="2.5" />
              <circle cx="155" cy="46" r="4" fill="#10b981" />
              <text x="155" y="34" textAnchor="middle" fill="#6ee7b7" fontSize="9" fontWeight="700">
                {isId ? 'Simpul KCL' : 'KCL Node'}
              </text>

              {/* Branch 1 */}
              <line x1="155" y1="46" x2="155" y2="98" stroke={i1Ma > 0 ? '#38bdf8' : '#334155'} strokeWidth="2" />
              <g onClick={handleToggleBulb1} className="cursor-pointer">
                <circle
                  cx="155"
                  cy="72"
                  r="18"
                  fill="#090d16"
                  stroke={bulb1Connected ? '#facc15' : '#f43f5e'}
                  strokeWidth="2"
                  strokeDasharray={bulb1Connected ? undefined : '4 3'}
                />
                {i1Ma > 0 && <circle cx="155" cy="72" r="9" fill="#fde047" fillOpacity="0.45" />}
                <text x="155" y="75" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="700">
                  {bulb1Connected ? 'L1' : 'OFF'}
                </text>
                <text x="155" y="116" textAnchor="middle" fill="#fde68a" fontSize="9" fontFamily="JetBrains Mono, monospace">
                  {v1.toFixed(0)}V · {i1Ma.toFixed(0)}mA
                </text>
              </g>

              {/* Branch 2 */}
              <line x1="275" y1="46" x2="275" y2="98" stroke={i2Ma > 0 ? '#38bdf8' : '#334155'} strokeWidth="2" />
              <g onClick={handleToggleBulb2} className="cursor-pointer">
                <circle
                  cx="275"
                  cy="72"
                  r="18"
                  fill="#090d16"
                  stroke={bulb2Connected ? '#facc15' : '#f43f5e'}
                  strokeWidth="2"
                  strokeDasharray={bulb2Connected ? undefined : '4 3'}
                />
                {i2Ma > 0 && <circle cx="275" cy="72" r="9" fill="#fde047" fillOpacity="0.45" />}
                <text x="275" y="75" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="700">
                  {bulb2Connected ? 'L2' : 'OFF'}
                </text>
                <text x="275" y="116" textAnchor="middle" fill="#6ee7b7" fontSize="9" fontFamily="JetBrains Mono, monospace">
                  {v2.toFixed(0)}V · {i2Ma.toFixed(0)}mA
                </text>
              </g>
            </>
          )}
        </svg>
        <p className="text-[10px] text-center text-slate-400 mt-1">
          {isId ? 'Ketuk ikon L1 atau L2 langsung pada diagram untuk lepas/pasang lampu.' : 'Tap L1 or L2 directly in the diagram to unscrew/reinstall.'}
        </p>
      </div>

      <MiniSliderControl
        label={isId ? 'Hambatan Lampu L2 (L1 tetap 100 Ω)' : 'L2 Resistance (L1 fixed 100 Ω)'}
        valueDisplay={`${bulb2Ohms} Ω`}
        value={bulb2Ohms}
        min={50}
        max={300}
        step={25}
        accentClass="emerald"
        onChange={setBulb2Ohms}
      />
    </MiniLabFrame>
  );
};
