import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CircuitElementData } from '../../../types/circuit';
import { Wind, Zap } from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';

/**
 * WindTurbineNode Component.
 *
 * Simulates a renewable wind turbine generator.
 * Features:
 * - Dynamic rotor rotational CSS animation with variable duration based on speed.
 * - Progressive anime/cinema motion-blur smear frame overlay when spinning fast.
 * - Slider from 0% to 100% controlling rotor speed and linear output EMF (0V to 12V).
 * - Dual terminals (Positive and Negative) at bottom base of the mast.
 *
 * Time Complexity: O(1) per render.
 */
export const WindTurbineNode: React.FC<NodeProps<CircuitElementData>> = memo(
  ({ id, data, selected }) => {
    const updateComponentData = useCircuitStore((state) => state.updateComponentData);
    const language = useCircuitStore((state) => state.language);
    const isId = language === 'id';

    const speed = data.speed ?? 50;
    const outputVoltage = (speed / 100) * 12.0;

    const currentAmperes = Math.abs(data.calculatedCurrent ?? 0);
    const powerWatts = outputVoltage * currentAmperes;

    // Rotational duration in seconds: Faster as speed increases
    // 100% -> 0.45s, 50% -> 0.9s, 10% -> 3.5s, 0% -> Paused
    const animationDurationSec =
      speed > 0 ? (45 / Math.max(8, speed * 1.1)).toFixed(2) : '0';

    // Smear Frame calculations (starts appearing above 25% speed)
    const smearOpacity =
      speed >= 25 ? Math.min(0.85, (speed - 20) / 75) : 0;
    const bladeBlurPx =
      speed >= 40 ? (((speed - 40) / 60) * 1.8).toFixed(1) : '0';

    const handleSpeedChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const nextSpeed = parseInt(e.target.value, 10);
        updateComponentData(id, {
          speed: nextSpeed,
          voltage: (nextSpeed / 100) * 12.0,
        });
      },
      [id, updateComponentData]
    );

    return (
      <div
        className={`relative flex flex-col items-center select-none transition-all duration-200 group ${
          selected ? 'filter drop-shadow-[0_0_18px_rgba(34,211,238,0.55)]' : ''
        }`}
      >
        {/* Main Graphic Container */}
        <div className="relative w-48 flex flex-col items-center">
          {/* Top Voltage & Status Tag */}
          <div className="mb-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-tight shadow-lg backdrop-blur-md border border-cyan-500/30 bg-cyan-950/70 text-cyan-300">
            <Wind
              className={`w-3.5 h-3.5 text-cyan-400 ${
                speed > 0 ? 'animate-pulse' : ''
              }`}
            />
            <span>
              {isId ? 'Turbin Angin' : 'Wind Turbine'}:{' '}
              <strong className="text-white font-bold">
                {outputVoltage.toFixed(1)} V
              </strong>
            </span>
          </div>

          {/* Visual Turbine Assembly: Mast + Rotor */}
          <div className="relative w-44 h-60 flex items-center justify-center overflow-visible">
            {/* Stationary Mast (Vertical pole and nacelle base) */}
            <div className="absolute inset-x-0 bottom-1 flex justify-center z-10 pointer-events-none">
              <img
                src="/assets/wind-turbine-mast.png"
                alt="Turbine Mast"
                className="w-28 h-auto object-contain drop-shadow-md pointer-events-none"
                draggable={false}
              />
            </div>

            {/* Rotor Hub Pivot Point Container (Center at top hub: x=50%, y=28%) */}
            <div
              className="absolute top-2 w-36 h-36 flex items-center justify-center z-20 pointer-events-none"
              style={{ transformOrigin: 'center center' }}
            >
              {/* Dynamic Anime/Cinema Motion-Blur Smear Frame Disc */}
              {speed >= 25 && (
                <div
                  className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-300"
                  style={{
                    opacity: smearOpacity,
                    background:
                      'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(200,240,255,0.25) 45%, rgba(255,255,255,0.08) 68%, transparent 72%)',
                    filter: `blur(${Math.max(1, speed * 0.04)}px)`,
                  }}
                  aria-hidden="true"
                />
              )}

              {/* High-Speed Radial Streak Smear Layer */}
              {speed >= 50 && (
                <div
                  className="absolute inset-1 rounded-full pointer-events-none animate-spin-turbine transition-opacity duration-300"
                  style={{
                    opacity: smearOpacity * 0.7,
                    animationDuration: `${animationDurationSec}s`,
                    background:
                      'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.3) 60deg, transparent 120deg, rgba(255,255,255,0.3) 180deg, transparent 240deg, rgba(255,255,255,0.3) 300deg, transparent 360deg)',
                    filter: 'blur(2px)',
                  }}
                  aria-hidden="true"
                />
              )}

              {/* Spinning 3-Blade Rotor Image */}
              <img
                src="/assets/wind-turbine-rotor.png"
                alt="Turbine Rotor"
                className={`w-full h-full object-contain pointer-events-none transition-all ${
                  speed > 0 ? 'animate-spin-turbine' : ''
                }`}
                style={{
                  animationDuration: `${animationDurationSec}s`,
                  animationPlayState: speed === 0 ? 'paused' : 'running',
                  filter: `blur(${bladeBlurPx}px) drop-shadow(0 4px 6px rgba(0,0,0,0.3))`,
                }}
                draggable={false}
              />
            </div>
          </div>

          {/* Bottom Terminals at Base */}
          <div className="relative w-28 h-2 -mt-1 z-30">
            {/* Positive (+) Terminal Handle (Left Foot at 35%) */}
            <Handle
              type="source"
              position={Position.Bottom}
              id="pos"
              style={{ left: '35%', bottom: '-4px' }}
              className="!w-3.5 !h-3.5 !bg-red-500 !border-2 !border-white !rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] hover:!scale-125 transition-transform cursor-crosshair z-30"
              title={isId ? 'Kutub Positif (+)' : 'Positive Terminal (+)'}
            />

            {/* Negative (-) Terminal Handle (Right Foot at 65%) */}
            <Handle
              type="source"
              position={Position.Bottom}
              id="neg"
              style={{ left: '65%', bottom: '-4px' }}
              className="!w-3.5 !h-3.5 !bg-blue-500 !border-2 !border-white !rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] hover:!scale-125 transition-transform cursor-crosshair z-30"
              title={isId ? 'Kutub Negatif (-)' : 'Negative Terminal (-)'}
            />
          </div>

          {/* Interactive Control & Live Metrics Panel */}
          <div className="mt-3 w-full px-3 py-2 rounded-xl bg-void-900/90 border border-white/10 text-slate-200 text-xs backdrop-blur-md shadow-xl flex flex-col gap-2">
            {/* Speed Slider Control */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] text-slate-300 font-medium">
                <span className="flex items-center gap-1">
                  <Wind className="w-3 h-3 text-cyan-400" />
                  {isId ? 'Kecepatan Baling-baling' : 'Rotor Speed'}
                </span>
                <span className="font-mono font-bold text-cyan-300">
                  {speed}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={speed}
                onChange={handleSpeedChange}
                className="w-full h-1.5 bg-void-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
                aria-label="Wind Turbine Speed"
              />
            </div>

            {/* Live Electrical Measurements */}
            <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px] font-mono">
              <div className="flex items-center gap-1 text-amber-300">
                <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                <span>{outputVoltage.toFixed(1)} V</span>
              </div>
              <div className="text-slate-400">
                {currentAmperes >= 1
                  ? `${currentAmperes.toFixed(2)} A`
                  : `${Math.round(currentAmperes * 1000)} mA`}
              </div>
              <div className="text-emerald-400 font-semibold">
                {powerWatts.toFixed(2)} W
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

WindTurbineNode.displayName = 'WindTurbineNode';
