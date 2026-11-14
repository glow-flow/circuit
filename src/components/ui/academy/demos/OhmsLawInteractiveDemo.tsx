import React, { useState } from 'react';
import { useCircuitStore } from '../../../../store/useCircuitStore';
import { MiniLabFrame, MiniSliderControl } from './MiniLabFrame';

/**
 * Computes normalized SVG animation speed and bulb luminance metrics from Ohm's Law state.
 * Time Complexity: O(1).
 */
function computeOhmVisualMetrics(voltage: number, resistance: number) {
  const currentAmperes = resistance > 0 ? voltage / resistance : 0;
  const currentMa = currentAmperes * 1000;
  const powerWatts = voltage * currentAmperes;
  // Electron speed animation duration in seconds (shorter = faster flow)
  const animDurationSec =
    currentMa <= 1 ? 0 : Math.max(0.45, Math.min(3.5, 110 / Math.max(20, currentMa)));
  const glowOpacity = Math.min(0.95, Math.max(0.08, currentMa / 120));
  const isOptimalRange = currentMa >= 40 && currentMa <= 60;
  const isOverheated = currentMa > 150;

  return {
    currentAmperes,
    currentMa,
    powerWatts,
    animDurationSec,
    glowOpacity,
    isOptimalRange,
    isOverheated,
  };
}

/**
 * Interactive Ohm's Law Visual SVG Micro-Lab.
 * Visualizes electron flow velocity, filament brightness, and V = I * R live.
 *
 * Time Complexity: O(1).
 */
export const OhmsLawInteractiveDemo: React.FC = () => {
  const language = useCircuitStore((state) => state.language);
  const isId = language === 'id';

  const [voltage, setVoltage] = useState<number>(9.0);
  const [resistance, setResistance] = useState<number>(150);

  const metrics = computeOhmVisualMetrics(voltage, resistance);

  return (
    <MiniLabFrame
      title={isId ? 'Lab Visual: Hukum Ohm' : 'Visual Lab: Ohm\'s Law'}
      formula="V = I × R"
      challengeText={
        metrics.isOptimalRange
          ? isId
            ? `Mantap! Arus ${metrics.currentMa.toFixed(1)} mA masuk zona aman LED (40 - 60 mA).`
            : `Nice! Current ${metrics.currentMa.toFixed(1)} mA is in the optimal 40 - 60 mA LED zone.`
          : isId
          ? 'Misi Mini: Atur V dan R agar arus tepat di 40 - 60 mA.'
          : 'Mini Goal: Tune V and R so current lands between 40 - 60 mA.'
      }
      isChallengeMet={metrics.isOptimalRange}
    >
      {/* Interactive SVG Circuit Stage */}
      <div className="rounded-xl bg-void-900 border border-white/10 p-2.5 overflow-hidden">
        <svg
          viewBox="0 0 360 150"
          className="w-full h-auto max-h-44 select-none"
          role="img"
          aria-label={isId ? 'Diagram interaktif Hukum Ohm' : 'Interactive Ohm Law circuit'}
        >
          {/* Closed Wire Loop */}
          <path
            id="ohmLoopPath"
            d="M 55 40 L 295 40 L 295 112 L 55 112 Z"
            fill="none"
            stroke={metrics.isOverheated ? '#f43f5e' : '#38bdf8'}
            strokeWidth="3"
            strokeOpacity="0.45"
          />

          {/* Animated Electron Flow Dots: real electron drift travels (-) -> load -> (+) */}
          {metrics.animDurationSec > 0 &&
            [0, 0.25, 0.5, 0.75].map((offsetFraction) => (
              <circle
                key={offsetFraction}
                r="4"
                fill={metrics.isOverheated ? '#fb7185' : '#38bdf8'}
              >
                <animateMotion
                  dur={`${metrics.animDurationSec.toFixed(2)}s`}
                  repeatCount="indefinite"
                  begin={`${-(offsetFraction * metrics.animDurationSec).toFixed(2)}s`}
                  keyPoints="1;0"
                  keyTimes="0;1"
                  calcMode="linear"
                >
                  <mpath href="#ohmLoopPath" />
                </animateMotion>
              </circle>
            ))}

          {/* Left: Battery Block */}
          <g transform="translate(22, 48)">
            <rect
              x="0"
              y="0"
              width="66"
              height="56"
              rx="10"
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            <line x1="20" y1="20" x2="46" y2="20" stroke="#38bdf8" strokeWidth="3" />
            <text x="53" y="23" fill="#38bdf8" fontSize="9" fontWeight="700">+</text>
            <line x1="27" y1="30" x2="39" y2="30" stroke="#94a3b8" strokeWidth="2.5" />
            <text x="53" y="33" fill="#94a3b8" fontSize="10" fontWeight="700">-</text>
            <text
              x="33"
              y="47"
              textAnchor="middle"
              fill="#7dd3fc"
              fontSize="11"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
            >
              {voltage.toFixed(1)}V
            </text>
          </g>

          {/* Right: Live Glowing Load Bulb */}
          <g transform="translate(263, 42)">
            <circle
              cx="32"
              cy="34"
              r={18 + metrics.glowOpacity * 16}
              fill={metrics.isOverheated ? '#f43f5e' : '#facc15'}
              fillOpacity={metrics.glowOpacity * 0.35}
            />
            <circle
              cx="32"
              cy="34"
              r="18"
              fill="#0f172a"
              stroke={metrics.isOverheated ? '#fb7185' : '#fbbf24'}
              strokeWidth="1.8"
            />
            <path
              d="M 24 38 L 28 28 L 32 36 L 36 28 L 40 38"
              fill="none"
              stroke={metrics.isOverheated ? '#fda4af' : '#fde047'}
              strokeWidth="2.2"
              strokeOpacity={Math.max(0.25, metrics.glowOpacity)}
            />
            <text
              x="32"
              y="66"
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
            >
              {metrics.powerWatts.toFixed(2)}W
            </text>
          </g>

          {/* Bottom: Variable Resistor */}
          <g transform="translate(125, 96)">
            <rect
              x="0"
              y="0"
              width="110"
              height="32"
              rx="8"
              fill="#0f172a"
              stroke="#fbbf24"
              strokeWidth="1.5"
            />
            <path
              d="M 10 16 L 18 9 L 26 23 L 34 9 L 42 23 L 50 16"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
            />
            <text
              x="80"
              y="20"
              textAnchor="middle"
              fill="#fde68a"
              fontSize="11"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
            >
              {resistance.toFixed(0)} Ω
            </text>
          </g>

          {/* Center Ammeter Readout */}
          <g transform="translate(132, 22)">
            <rect
              x="0"
              y="0"
              width="96"
              height="36"
              rx="9"
              fill="#090d16"
              stroke={metrics.isOptimalRange ? '#10b981' : '#475569'}
              strokeWidth="1.5"
            />
            <text
              x="48"
              y="14"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="9"
              fontWeight="600"
            >
              {isId ? 'ARUS (I)' : 'CURRENT (I)'}
            </text>
            <text
              x="48"
              y="29"
              textAnchor="middle"
              fill={
                metrics.isOptimalRange
                  ? '#34d399'
                  : metrics.isOverheated
                  ? '#fb7185'
                  : '#38bdf8'
              }
              fontSize="12"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
            >
              {metrics.currentMa.toFixed(1)} mA
            </text>
          </g>

          {/* Electron Drift Direction Caption */}
          <text
            x="180"
            y="144"
            textAnchor="middle"
            fill="#64748b"
            fontSize="8.5"
            fontFamily="JetBrains Mono, monospace"
          >
            {isId
              ? 'e⁻ (Aliran Elektron): (−) → (+)  |  I (Konvensional): (+) → (−)'
              : 'e⁻ (Electron Drift): (−) → (+)  |  I (Conventional): (+) → (−)'}
          </text>
        </svg>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <MiniSliderControl
          label={isId ? 'Dorongan Baterai (V)' : 'Battery Push (V)'}
          valueDisplay={`${voltage.toFixed(1)} V`}
          value={voltage}
          min={1}
          max={24}
          step={0.5}
          accentClass="sky"
          onChange={setVoltage}
        />
        <MiniSliderControl
          label={isId ? 'Rem Resistor (R)' : 'Resistor Brake (R)'}
          valueDisplay={`${resistance.toFixed(0)} Ω`}
          value={resistance}
          min={20}
          max={500}
          step={5}
          accentClass="amber"
          onChange={setResistance}
        />
      </div>
    </MiniLabFrame>
  );
};
