import React, { useState } from 'react';
import { useCircuitStore } from '../../../../store/useCircuitStore';
import { MiniLabFrame, MiniSliderControl } from './MiniLabFrame';

/**
 * Interactive Voltage Divider SVG Micro-Lab.
 * Shows stacked R1 -> V_out -> R2 ladder and liquid voltage tank gauges.
 *
 * Time Complexity: O(1).
 */
export const VoltageDividerInteractiveDemo: React.FC = () => {
  const language = useCircuitStore((state) => state.language);
  const isId = language === 'id';

  const [vIn, setVIn] = useState<number>(12);
  const [r1, setR1] = useState<number>(100);
  const [r2, setR2] = useState<number>(200);

  const totalR = r1 + r2;
  const v1 = totalR > 0 ? vIn * (r1 / totalR) : 0;
  const vOut = totalR > 0 ? vIn * (r2 / totalR) : 0;
  const loopMa = totalR > 0 ? (vIn / totalR) * 1000 : 0;
  const ratioR2 = totalR > 0 ? (r2 / totalR) * 100 : 0;
  const isHalfSplit = Math.abs(vOut - vIn / 2) <= 0.3;

  return (
    <MiniLabFrame
      title={isId ? 'Lab Visual: Pembagi Tegangan' : 'Visual Lab: Voltage Divider'}
      formula="V_out = V_in × R₂ / (R₁ + R₂)"
      challengeText={
        isHalfSplit
          ? isId
            ? `Pas! Karena R₁ ≈ R₂, V_out tepat setengah dari V_in (${vOut.toFixed(1)} V).`
            : `Exact! With R₁ ≈ R₂, V_out splits V_in in half (${vOut.toFixed(1)} V).`
          : isId
          ? `Misi Mini: Atur R₁ & R₂ agar V_out tepat setengah dari V_in (~${(vIn / 2).toFixed(1)} V).`
          : `Mini Goal: Tune R₁ & R₂ so V_out is half of V_in (~${(vIn / 2).toFixed(1)} V).`
      }
      isChallengeMet={isHalfSplit}
    >
      {/* Visual SVG Ladder + Dual Voltage Tanks */}
      <div className="rounded-xl bg-void-900 border border-white/10 p-2.5">
        <svg
          viewBox="0 0 360 144"
          className="w-full h-auto max-h-44 select-none"
          role="img"
          aria-label={isId ? 'Tangga pembagi tegangan' : 'Voltage divider ladder'}
        >
          {/* Left Vertical Ladder Schematic */}
          <g transform="translate(22, 12)">
            {/* Vin Badge */}
            <circle cx="52" cy="14" r="12" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.8" />
            <text
              x="52"
              y="18"
              textAnchor="middle"
              fill="#7dd3fc"
              fontSize="9"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
            >
              {vIn}V
            </text>
            <line x1="52" y1="26" x2="52" y2="38" stroke="#38bdf8" strokeWidth="2.5" />

            {/* R1 Top Resistor */}
            <rect
              x="22"
              y="38"
              width="60"
              height="24"
              rx="6"
              fill="#0f172a"
              stroke="#fbbf24"
              strokeWidth="1.6"
            />
            <text
              x="52"
              y="54"
              textAnchor="middle"
              fill="#fde68a"
              fontSize="10"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
            >
              R₁ {r1}Ω
            </text>

            {/* Tap Wire -> V_out Node */}
            <line x1="52" y1="62" x2="52" y2="80" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="52" y1="71" x2="112" y2="71" stroke="#34d399" strokeWidth="2.5" />
            <circle cx="52" cy="71" r="4.5" fill="#10b981" />
            <rect
              x="104"
              y="58"
              width="62"
              height="26"
              rx="7"
              fill="#090d16"
              stroke="#10b981"
              strokeWidth="1.6"
            />
            <text
              x="135"
              y="75"
              textAnchor="middle"
              fill="#34d399"
              fontSize="11"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
            >
              {vOut.toFixed(1)}V
            </text>

            {/* R2 Bottom Resistor */}
            <rect
              x="22"
              y="80"
              width="60"
              height="24"
              rx="6"
              fill="#0f172a"
              stroke="#10b981"
              strokeWidth="1.6"
            />
            <text
              x="52"
              y="96"
              textAnchor="middle"
              fill="#6ee7b7"
              fontSize="10"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
            >
              R₂ {r2}Ω
            </text>

            {/* Ground Symbol */}
            <line x1="52" y1="104" x2="52" y2="114" stroke="#64748b" strokeWidth="2" />
            <line x1="38" y1="114" x2="66" y2="114" stroke="#64748b" strokeWidth="2" />
            <line x1="44" y1="119" x2="60" y2="119" stroke="#64748b" strokeWidth="1.5" />
          </g>

          {/* Right Split Ratio Tank Bars */}
          <g transform="translate(202, 14)">
            <rect
              x="0"
              y="0"
              width="142"
              height="116"
              rx="10"
              fill="#090d16"
              stroke="#1e293b"
              strokeWidth="1.5"
            />
            <text x="12" y="20" fill="#94a3b8" fontSize="10" fontWeight="600">
              {isId ? 'Pembagian Potensial' : 'Voltage Split'}
            </text>

            {/* V1 Drop */}
            <text x="12" y="42" fill="#fde68a" fontSize="10" fontFamily="JetBrains Mono, monospace">
              V₁: {v1.toFixed(1)}V ({(100 - ratioR2).toFixed(0)}%)
            </text>
            <rect x="12" y="47" width="118" height="10" rx="5" fill="#0f172a" />
            <rect
              x="12"
              y="47"
              width={Math.max(4, (118 * (100 - ratioR2)) / 100)}
              height="10"
              rx="5"
              fill="#fbbf24"
            />

            {/* V_out Drop */}
            <text x="12" y="75" fill="#6ee7b7" fontSize="10" fontFamily="JetBrains Mono, monospace">
              V_out: {vOut.toFixed(1)}V ({ratioR2.toFixed(0)}%)
            </text>
            <rect x="12" y="80" width="118" height="10" rx="5" fill="#0f172a" />
            <rect
              x="12"
              y="80"
              width={Math.max(4, (118 * ratioR2) / 100)}
              height="10"
              rx="5"
              fill="#10b981"
            />

            <text
              x="12"
              y="107"
              fill="#7dd3fc"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
            >
              I_loop: {loopMa.toFixed(1)} mA
            </text>
          </g>
        </svg>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <MiniSliderControl
          label="V_in"
          valueDisplay={`${vIn.toFixed(0)} V`}
          value={vIn}
          min={3}
          max={24}
          step={1}
          accentClass="sky"
          onChange={setVIn}
        />
        <MiniSliderControl
          label="R₁ (Atas)"
          valueDisplay={`${r1.toFixed(0)} Ω`}
          value={r1}
          min={50}
          max={500}
          step={10}
          accentClass="amber"
          onChange={setR1}
        />
        <MiniSliderControl
          label="R₂ (Bawah)"
          valueDisplay={`${r2.toFixed(0)} Ω`}
          value={r2}
          min={50}
          max={500}
          step={10}
          accentClass="emerald"
          onChange={setR2}
        />
      </div>
    </MiniLabFrame>
  );
};
