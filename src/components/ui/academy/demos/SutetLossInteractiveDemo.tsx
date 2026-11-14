import React, { useState } from 'react';
import { useCircuitStore } from '../../../../store/useCircuitStore';
import { MiniLabFrame, MiniSliderControl } from './MiniLabFrame';

/**
 * Interactive SUTET High-Voltage Transmission & Outdoor-to-Lab Efficiency SVG Micro-Lab.
 * Compares 12V direct loss (I^2 R) vs 240V Step-Up SUTET delivery into the Lab charger.
 *
 * Time Complexity: O(1).
 */
export const SutetLossInteractiveDemo: React.FC = () => {
  const language = useCircuitStore((state) => state.language);
  const isId = language === 'id';

  const [useSutet, setUseSutet] = useState<boolean>(true);
  const [genPowerWatts, setGenPowerWatts] = useState<number>(240);
  const [distanceMeters, setDistanceMeters] = useState<number>(300);

  const txVoltage = useSutet ? 240 : 12;
  const lineResistance = 0.01 * distanceMeters; // e.g., 3.0 Ohm at 300m
  const lineCurrent = genPowerWatts / txVoltage;
  const rawLossWatts = lineCurrent * lineCurrent * lineResistance;
  const actualLossWatts = Math.min(genPowerWatts, rawLossWatts);
  const deliveredWatts = Math.max(0, genPowerWatts - actualLossWatts);
  const efficiencyPercent = genPowerWatts > 0 ? (deliveredWatts / genPowerWatts) * 100 : 0;

  const isChallengeMet = useSutet && distanceMeters >= 400 && efficiencyPercent >= 95;

  return (
    <MiniLabFrame
      title={isId ? 'Lab Visual: Transmisi SUTET Alam → Lab' : 'Visual Lab: SUTET Grid Transmission'}
      formula="P_rugi = I² × R_kabel"
      challengeText={
        isChallengeMet
          ? isId
            ? `Hebat! Efisiensi kirim mencapai ${efficiencyPercent.toFixed(1)}% meski jarak ${distanceMeters}m!`
            : `Awesome! Transmission reaches ${efficiencyPercent.toFixed(1)}% efficiency at ${distanceMeters}m!`
          : isId
          ? 'Misi Mini: Pakai Step-Up SUTET 240V di jarak >= 400m dan capai efisiensi > 95%.'
          : 'Mini Goal: Enable 240V SUTET at >= 400m distance and achieve > 95% efficiency.'
      }
      isChallengeMet={isChallengeMet}
    >
      {/* Mode Selector */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setUseSutet(false)}
          className={`min-h-[40px] rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
            !useSutet
              ? 'bg-rose-500/20 border-rose-500/60 text-rose-200'
              : 'bg-void-900 border-white/10 text-slate-400 hover:text-slate-200'
          }`}
        >
          {isId ? 'Langsung 12V (Tanpa SUTET)' : 'Direct 12V (No SUTET)'}
        </button>
        <button
          type="button"
          onClick={() => setUseSutet(true)}
          className={`min-h-[40px] rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
            useSutet
              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200'
              : 'bg-void-900 border-white/10 text-slate-400 hover:text-slate-200'
          }`}
        >
          {isId ? 'Step-Up SUTET 240V' : 'Step-Up SUTET 240V'}
        </button>
      </div>

      {/* SVG Pylon -> Lab Diagram */}
      <div className="rounded-xl bg-void-900 border border-white/10 p-2.5">
        <svg viewBox="0 0 360 124" className="w-full h-auto max-h-36 select-none">
          {/* SUTET Line */}
          <line
            x1="82"
            y1="52"
            x2="276"
            y2="52"
            stroke={efficiencyPercent < 50 ? '#f43f5e' : useSutet ? '#10b981' : '#fb923c'}
            strokeWidth="3.5"
            strokeDasharray={efficiencyPercent < 50 ? '6 4' : undefined}
          />

          {/* Outdoor Plant Box */}
          <rect x="14" y="24" width="78" height="60" rx="10" fill="#090d16" stroke="#fbbf24" strokeWidth="1.5" />
          <text x="53" y="46" textAnchor="middle" fill="#fde68a" fontSize="10" fontWeight="700">
            {isId ? 'PLTS/Bayu' : 'Solar/Wind'}
          </text>
          <text x="53" y="66" textAnchor="middle" fill="#7dd3fc" fontSize="11" fontWeight="700" fontFamily="JetBrains Mono, monospace">
            {genPowerWatts}W
          </text>

          {/* Mid-line Telemetry Bubble */}
          <rect x="116" y="16" width="128" height="30" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
          <text x="180" y="29" textAnchor="middle" fill="#94a3b8" fontSize="8.5" fontFamily="JetBrains Mono, monospace">
            {txVoltage}V · {isId ? 'Arus' : 'Current'} {lineCurrent.toFixed(1)}A
          </text>
          <text
            x="180"
            y="41"
            textAnchor="middle"
            fill={actualLossWatts > 20 ? '#fb7185' : '#34d399'}
            fontSize="9"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            {isId ? 'Rugi Panas:' : 'Heat Loss:'} -{actualLossWatts.toFixed(0)}W
          </text>

          {/* Lab Charger Box */}
          <rect
            x="268"
            y="24"
            width="78"
            height="60"
            rx="10"
            fill="#090d16"
            stroke={efficiencyPercent >= 90 ? '#10b981' : '#f43f5e'}
            strokeWidth="1.5"
          />
          <text x="307" y="44" textAnchor="middle" fill="#cbd5e1" fontSize="9.5" fontWeight="700">
            {isId ? 'Cas Lab 9V' : 'Lab 9V Bus'}
          </text>
          <text
            x="307"
            y="62"
            textAnchor="middle"
            fill={efficiencyPercent >= 90 ? '#34d399' : '#fda4af'}
            fontSize="11"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            {deliveredWatts.toFixed(0)}W
          </text>
          <text x="307" y="76" textAnchor="middle" fill="#94a3b8" fontSize="8.5" fontFamily="JetBrains Mono, monospace">
            Eff {efficiencyPercent.toFixed(0)}%
          </text>

          {/* Bottom Wire Resistance Info */}
          <text x="180" y="106" textAnchor="middle" fill="#64748b" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
            {isId ? 'Jarak SUTET' : 'SUTET Span'}: {distanceMeters}m (R_{isId ? 'kabel' : 'line'} = {lineResistance.toFixed(1)} Ω)
          </text>
        </svg>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <MiniSliderControl
          label={isId ? 'Daya Pembangkit (P_gen)' : 'Plant Power (P_gen)'}
          valueDisplay={`${genPowerWatts} W`}
          value={genPowerWatts}
          min={120}
          max={480}
          step={40}
          accentClass="amber"
          onChange={setGenPowerWatts}
        />
        <MiniSliderControl
          label={isId ? 'Jarak Transmisi ke Lab' : 'Distance to Lab'}
          valueDisplay={`${distanceMeters} m`}
          value={distanceMeters}
          min={50}
          max={500}
          step={50}
          accentClass="sky"
          onChange={setDistanceMeters}
        />
      </div>
    </MiniLabFrame>
  );
};
