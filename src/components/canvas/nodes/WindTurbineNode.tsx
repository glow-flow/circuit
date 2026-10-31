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
        className={`relative flex flex-col items-center select-none transition-all duration-200 group w-[144px] ${
          selected ? 'filter drop-shadow-[0_0_18px_rgba(34,211,238,0.6)]' : ''
        }`}
      >
        {/* Top Floating Control & Voltage Pill */}
        <div className="nodrag mb-1 w-full px-2 py-1.5 rounded-2xl bg-void-950/90 backdrop-blur-md border border-cyan-400/40 shadow-[0_8px_20px_rgba(0,0,0,0.45)] flex flex-col gap-1 z-30">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="flex items-center gap-1 font-bold text-cyan-300 truncate">
              <Wind
                className={`w-3 h-3 text-cyan-400 shrink-0 ${
                  speed > 0 ? 'animate-pulse' : ''
                }`}
              />
              <span>{isId ? 'Turbin' : 'Turbine'}</span>
            </span>
            <span className="flex items-center gap-1 font-bold text-amber-300 shrink-0">
              <Zap className="w-2.5 h-2.5 text-amber-400" />
              {outputVoltage.toFixed(1)}V
              {powerWatts > 0.01 ? ` · ${powerWatts.toFixed(1)}W` : ''}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={speed}
              onChange={handleSpeedChange}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-full h-1.5 bg-void-900 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
              aria-label="Wind Turbine Speed"
            />
            <span className="text-[9px] font-mono font-bold text-cyan-200 w-7 text-right shrink-0">
              {speed}%
            </span>
          </div>

          <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 pt-0.5 border-t border-white/10">
            <span className="text-cyan-300/90">AC→DC Rectifier</span>
            {data.isBlockingDiodeActive ? (
              <span className="text-emerald-300 font-bold">
                {isId ? '🛡️ Anti-Arus Balik' : '🛡️ Diode Active'}
              </span>
            ) : (
              <span>Schottky Diode</span>
            )}
          </div>
        </div>

        {/* Physical Wind Turbine Assembly: Mast Base Anchored at Bottom-0 */}
        <div className="relative w-[144px] h-[184px] flex items-end justify-center overflow-visible">
          {/* Stationary Tapered Tower Mast (height 144px, hub center at 7.54% from top = 133.1px from bottom) */}
          <img
            src="/assets/wind-turbine-mast.png"
            alt="Turbine Mast"
            className="h-[144px] w-auto object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)] pointer-events-none select-none z-10"
            draggable={false}
          />

          {/* 3-Blade Rotor Locked to Exact Nacelle Hub Center (left: 50%, bottom: 133.1px) */}
          <div
            className="absolute w-[142px] h-[142px] flex items-center justify-center z-20 pointer-events-none"
            style={{
              left: '50%',
              bottom: '133.1px',
              transform: 'translate(-50%, 50%)',
            }}
          >
            {/* Dynamic Motion-Blur Smear Frame Disc */}
            {speed >= 25 && (
              <div
                className="absolute inset-2 rounded-full pointer-events-none transition-opacity duration-300"
                style={{
                  opacity: smearOpacity,
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0.38) 0%, rgba(186,230,253,0.22) 45%, rgba(255,255,255,0.06) 66%, transparent 72%)',
                  filter: `blur(${Math.max(1, speed * 0.035)}px)`,
                }}
                aria-hidden="true"
              />
            )}

            {/* High-Speed Radial Streak Smear Layer */}
            {speed >= 50 && (
              <div
                className="absolute inset-3 rounded-full pointer-events-none animate-spin-turbine transition-opacity duration-300"
                style={{
                  opacity: smearOpacity * 0.65,
                  animationDuration: `${animationDurationSec}s`,
                  background:
                    'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.28) 60deg, transparent 120deg, rgba(255,255,255,0.28) 180deg, transparent 240deg, rgba(255,255,255,0.28) 300deg, transparent 360deg)',
                  filter: 'blur(2px)',
                }}
                aria-hidden="true"
              />
            )}

            {/* Spinning 3-Blade Rotor Image */}
            <img
              src="/assets/wind-turbine-rotor.png"
              alt="Turbine Rotor"
              className={`w-full h-full object-contain pointer-events-none select-none ${
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

          {/* High-Visibility Terminals (+ and -) Positioned at Lower Service Box ABOVE Grass Line! */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="pos"
            style={{ left: '34%', bottom: '18px', transform: 'translateX(-50%)' }}
            className="!w-5 !h-5 !bg-red-500 !border-2 !border-white !rounded-full shadow-[0_0_12px_rgba(239,68,68,0.95)] hover:!scale-125 transition-transform cursor-crosshair z-40 flex items-center justify-center"
            title={isId ? 'Kutub Positif (+)' : 'Positive Terminal (+)'}
          >
            <span className="text-[10px] font-mono font-black text-white leading-none pointer-events-none">
              +
            </span>
          </Handle>
          <Handle
            type="source"
            position={Position.Bottom}
            id="neg"
            style={{ left: '66%', bottom: '18px', transform: 'translateX(-50%)' }}
            className="!w-5 !h-5 !bg-sky-500 !border-2 !border-white !rounded-full shadow-[0_0_12px_rgba(56,189,248,0.95)] hover:!scale-125 transition-transform cursor-crosshair z-40 flex items-center justify-center"
            title={isId ? 'Kutub Negatif (-)' : 'Negative Terminal (-)'}
          >
            <span className="text-[11px] font-mono font-black text-white leading-none pointer-events-none">
              -
            </span>
          </Handle>
        </div>
      </div>
    );
  }
);

WindTurbineNode.displayName = 'WindTurbineNode';
