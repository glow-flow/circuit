import React, { useState } from 'react';
import { useCircuitStore } from '../../../../store/useCircuitStore';
import { MiniLabFrame, MiniSliderControl } from './MiniLabFrame';

/**
 * Interactive Joule Heating & Filament Safety SVG Micro-Lab.
 * Demonstrates P = I^2 * R thermal dissipation and filament burnout above 25W.
 *
 * Time Complexity: O(1).
 */
export const JoulePowerInteractiveDemo: React.FC = () => {
  const language = useCircuitStore((state) => state.language);
  const isId = language === 'id';

  const [current, setCurrent] = useState<number>(1.0);
  const [resistance, setResistance] = useState<number>(10);

  const voltage = current * resistance;
  const powerWatts = current * current * resistance;
  const maxGaugeWatts = 40;
  const fillPercent = Math.min(100, (powerWatts / maxGaugeWatts) * 100);
  const isOverloaded = powerWatts > 25;
  const isWarmOptimal = powerWatts >= 6 && powerWatts <= 12;

  const coilStroke = isOverloaded
    ? '#f43f5e'
    : powerWatts >= 12
    ? '#fb923c'
    : isWarmOptimal
    ? '#facc15'
    : '#38bdf8';

  return (
    <MiniLabFrame
      title={isId ? 'Lab Visual: Panas Joule & Daya' : 'Visual Lab: Joule Heating'}
      formula="P = I² × R"
      challengeText={
        isOverloaded
          ? isId
            ? `AWAS PUTUS! ${powerWatts.toFixed(1)} W melampaui batas filamen 25 W.`
            : `BURNED OUT! ${powerWatts.toFixed(1)} W exceeds the 25 W filament limit.`
          : isWarmOptimal
          ? isId
            ? `Ideal! Panas ${powerWatts.toFixed(1)} W menyala terang dan aman (6 - 12 W).`
            : `Ideal! ${powerWatts.toFixed(1)} W runs bright and safely within 6 - 12 W.`
          : isId
          ? 'Misi Mini: Atur I dan R ke zona terang aman 6 - 12 W tanpa putus.'
          : 'Mini Goal: Adjust I and R into the safe bright 6 - 12 W band.'
      }
      isChallengeMet={isWarmOptimal}
    >
      {/* Visual SVG Filament + Thermal Column */}
      <div className="rounded-xl bg-void-900 border border-white/10 p-2.5">
        <svg
          viewBox="0 0 360 132"
          className="w-full h-auto max-h-40 select-none"
          role="img"
          aria-label={isId ? 'Visualisasi filamen kalor Joule' : 'Joule heating filament'}
        >
          {/* Left Bulb Chamber */}
          <g transform="translate(24, 10)">
            <circle
              cx="65"
              cy="54"
              r={26 + Math.min(20, powerWatts * 0.7)}
              fill={coilStroke}
              fillOpacity={isOverloaded ? 0.25 : Math.min(0.45, 0.1 + powerWatts * 0.015)}
            />
            <circle
              cx="65"
              cy="54"
              r="34"
              fill="#0f172a"
              stroke={isOverloaded ? '#fb7185' : '#475569'}
              strokeWidth="2"
            />
            {isOverloaded ? (
              <>
                <path
                  d="M 46 68 L 53 45 L 59 54"
                  fill="none"
                  stroke="#fb7185"
                  strokeWidth="2.5"
                />
                <path
                  d="M 71 54 L 77 45 L 84 68"
                  fill="none"
                  stroke="#fb7185"
                  strokeWidth="2.5"
                />
                <text
                  x="65"
                  y="36"
                  textAnchor="middle"
                  fill="#fda4af"
                  fontSize="10"
                  fontWeight="700"
                >
                  {isId ? 'PUTUS!' : 'BLOWN!'}
                </text>
              </>
            ) : (
              <path
                d="M 46 68 L 52 44 L 58 64 L 65 40 L 72 64 L 78 44 L 84 68"
                fill="none"
                stroke={coilStroke}
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}
            <rect x="52" y="88" width="26" height="14" rx="4" fill="#334155" />
          </g>

          {/* Telemetry & Thermal Meter on Right */}
          <g transform="translate(152, 16)">
            <rect
              x="0"
              y="0"
              width="192"
              height="98"
              rx="10"
              fill="#090d16"
              stroke="#1e293b"
              strokeWidth="1.5"
            />
            <text x="14" y="22" fill="#94a3b8" fontSize="10" fontWeight="600">
              {isId ? 'Laju Kalor Filamen (P)' : 'Thermal Power (P)'}
            </text>
            <text
              x="14"
              y="46"
              fill={coilStroke}
              fontSize="20"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
            >
              {powerWatts.toFixed(1)} W
            </text>
            <text
              x="178"
              y="44"
              textAnchor="end"
              fill="#7dd3fc"
              fontSize="11"
              fontFamily="JetBrains Mono, monospace"
            >
              V = {voltage.toFixed(1)}V
            </text>

            {/* Progress Thermometer Track */}
            <rect x="14" y="62" width="164" height="12" rx="6" fill="#0f172a" />
            <rect
              x="14"
              y="62"
              width={Math.max(4, (164 * fillPercent) / 100)}
              height="12"
              rx="6"
              fill={coilStroke}
            />
            {/* 25W Burnout Marker Line */}
            <line
              x1={14 + (164 * 25) / maxGaugeWatts}
              y1="57"
              x2={14 + (164 * 25) / maxGaugeWatts}
              y2="79"
              stroke="#f43f5e"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
            <text x="14" y="90" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono, monospace">
              0W
            </text>
            <text
              x={14 + (164 * 25) / maxGaugeWatts}
              y="90"
              textAnchor="middle"
              fill="#fb7185"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
            >
              25W MAX
            </text>
          </g>
        </svg>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <MiniSliderControl
          label={isId ? 'Arus Mengalir (I)' : 'Current Flow (I)'}
          valueDisplay={`${current.toFixed(1)} A`}
          value={current}
          min={0.2}
          max={3.0}
          step={0.1}
          accentClass="amber"
          onChange={setCurrent}
        />
        <MiniSliderControl
          label={isId ? 'Hambatan Kawat (R)' : 'Wire Resistance (R)'}
          valueDisplay={`${resistance.toFixed(0)} Ω`}
          value={resistance}
          min={2}
          max={30}
          step={1}
          accentClass="sky"
          onChange={setResistance}
        />
      </div>
    </MiniLabFrame>
  );
};
