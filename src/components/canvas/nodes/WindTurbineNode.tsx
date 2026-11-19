import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CircuitElementData } from '../../../types/circuit';
import { Wind, Zap, Mountain, TrendingDown, ShieldCheck } from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { WIND_AVR_MAX_VOLTAGE } from '../../../physics/terrainClimateEngine';
import { usePendingPinHandleForNode } from '../../../hooks/useTapToConnectHandlers';

/**
 * WindTurbineNode Component.
 *
 * Simulates a renewable wind turbine generator.
 * Features:
 * - Dynamic rotor rotational CSS animation with variable duration based on speed.
 * - Progressive anime/cinema motion-blur smear frame overlay when spinning fast.
 * - Slider from 0% to 100% controlling rotor speed and AVR-regulated DC output EMF (0V to 12V).
 * - Dual terminals (Positive and Negative) at bottom base of the mast.
 * - Strictly calibrated 260px height (`justify-end`) so the mast base stays flush on the ground.
 *
 * Time Complexity: O(1) per render.
 */
export const WindTurbineNode: React.FC<NodeProps<CircuitElementData>> = memo(
  ({ id, data, selected }) => {
    const updateComponentData = useCircuitStore((state) => state.updateComponentData);
    const simulation = useCircuitStore((state) => state.simulation);
    const language = useCircuitStore((state) => state.language);
    const pendingPinHandle = usePendingPinHandleForNode(id);
    const isId = language === 'id';

    const baseSpeed = data.speed ?? 50;
    const effectiveSpeed = data.effectiveSpeed ?? baseSpeed;
    const outputVoltage = Math.min(
      WIND_AVR_MAX_VOLTAGE,
      data.voltage ?? (effectiveSpeed / 100) * WIND_AVR_MAX_VOLTAGE
    );
    const elevationBonus = data.elevationBonusPercent ?? 0;

    const currentAmperes = Math.abs(simulation.branchCurrents[id] ?? data.calculatedCurrent ?? 0);
    const powerWatts = outputVoltage * currentAmperes;

    // Rotational duration in seconds: Faster on hilltops (+RPM bonus) and slower in valleys
    // 100% -> 0.45s, 50% -> 0.9s, 10% -> 3.5s, 0% -> Paused
    const animationDurationSec =
      effectiveSpeed > 0 ? (45 / Math.max(8, effectiveSpeed * 1.1)).toFixed(2) : '0';

    // Smear Frame calculations (starts appearing above 25% effective speed)
    const smearOpacity =
      effectiveSpeed >= 25 ? Math.min(0.85, (effectiveSpeed - 20) / 75) : 0;
    const bladeBlurPx =
      effectiveSpeed >= 40 ? (((effectiveSpeed - 40) / 60) * 1.8).toFixed(1) : '0';

    const handleSpeedChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const nextSpeed = parseInt(e.target.value, 10);
        updateComponentData(id, {
          speed: nextSpeed,
          voltage: Math.min(WIND_AVR_MAX_VOLTAGE, (nextSpeed / 100) * WIND_AVR_MAX_VOLTAGE),
        });
      },
      [id, updateComponentData]
    );

    return (
      <div
        className={`relative flex flex-col items-center justify-end select-none transition-colors duration-200 group w-[144px] overflow-visible ${
          selected ? 'ring-2 ring-electric-400 rounded-xl' : ''
        }`}
        style={{ height: '260px' }}
      >
        {/* Top Floating Control & Voltage Pill */}
        <div className="nodrag mb-1 w-full px-2 py-1.5 rounded-xl bg-void-950 border border-control shadow-lg text-ink flex flex-col gap-1 z-30">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="flex items-center gap-1 font-bold text-electric-400 truncate">
              <Wind className="w-3 h-3 text-electric-400 shrink-0" aria-hidden="true" />
              <span>{isId ? 'Turbin' : 'Turbine'}</span>
            </span>
            <span className="flex items-center gap-1 font-bold text-amber-400 shrink-0 tabular-nums">
              <Zap className="w-2.5 h-2.5 text-amber-400" aria-hidden="true" />
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
              value={baseSpeed}
              onChange={handleSpeedChange}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-full h-2 bg-void-900 rounded-lg cursor-pointer accent-electric-500"
              aria-label={isId ? 'Kecepatan Putaran Turbin Angin' : 'Wind Turbine Speed'}
            />
            <span className="text-[9px] font-mono font-bold text-electric-300 w-7 text-right shrink-0 tabular-nums">
              {baseSpeed}%
            </span>
          </div>

          {/* Orographic Wind Shear Elevation Badge */}
          {elevationBonus > 0 && (
            <div
              id="turbine-elevation-bonus"
              className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/60 text-[8px] font-mono font-bold text-cyan-200 text-center flex items-center justify-center gap-1 shadow-sm"
            >
              <Mountain className="w-2.5 h-2.5 text-cyan-400 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {isId
                  ? `Puncak Bukit +${elevationBonus}% RPM & Daya`
                  : `Hilltop +${elevationBonus}% RPM & Power`}
              </span>
            </div>
          )}
          {elevationBonus < 0 && (
            <div
              id="turbine-elevation-penalty"
              className="px-1.5 py-0.5 rounded bg-void-900 border border-amber-500/50 text-[8px] font-mono font-bold text-amber-300 text-center flex items-center justify-center gap-1 shadow-sm"
            >
              <TrendingDown className="w-2.5 h-2.5 text-amber-400 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {isId
                  ? `Lembah ${elevationBonus}% RPM & Daya`
                  : `Valley ${elevationBonus}% RPM & Power`}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 pt-0.5 border-t border-ink/15">
            <span className="text-electric-400">AC→DC Rectifier</span>
            {data.isBlockingDiodeActive ? (
              <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-400 shrink-0" aria-hidden="true" />
                {isId ? 'Anti-Arus Balik' : 'Diode Active'}
              </span>
            ) : (
              <span>Schottky Diode</span>
            )}
          </div>
        </div>

        {/* Physical Wind Turbine Assembly: Mast Base Anchored at Bottom-0 */}
        <div className="relative w-[144px] h-[184px] flex items-end justify-center overflow-visible shrink-0">
          <img
            src="/assets/wind-turbine-mast.png"
            alt="Turbine Mast"
            width={144}
            height={144}
            className="h-[144px] w-full object-contain drop-shadow-md pointer-events-none select-none z-10"
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
            {effectiveSpeed >= 25 && (
              <div
                className="absolute inset-2 rounded-full pointer-events-none transition-opacity duration-300"
                style={{
                  opacity: smearOpacity,
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0.38) 0%, rgba(186,230,253,0.22) 45%, rgba(255,255,255,0.06) 66%, transparent 72%)',
                  filter: `blur(${Math.max(1, effectiveSpeed * 0.035)}px)`,
                }}
                aria-hidden="true"
              />
            )}

            {effectiveSpeed >= 50 && (
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

            <img
              src="/assets/wind-turbine-rotor.png"
              alt="Turbine Rotor"
              width={142}
              height={142}
              className={`w-full h-full object-contain pointer-events-none select-none ${
                effectiveSpeed > 0 ? 'animate-spin-turbine' : ''
              }`}
              style={{
                animationDuration: `${animationDurationSec}s`,
                animationPlayState: effectiveSpeed === 0 ? 'paused' : 'running',
                filter: `blur(${bladeBlurPx}px)`,
              }}
              draggable={false}
            />
          </div>

          <Handle
            type="source"
            position={Position.Bottom}
            id="pos"
            style={{ left: '34%', bottom: '30px', transform: 'translateX(-50%)' }}
            className={`!w-6 !h-6 md:!w-5 md:!h-5 !bg-red-600 !border-2 !border-white !rounded-full shadow-sm hover:!scale-125 transition-transform cursor-crosshair z-40 flex items-center justify-center ${
              pendingPinHandle === 'pos' ? '!ring-4 !ring-emerald-400 !scale-125' : ''
            }`}
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
            style={{ left: '66%', bottom: '30px', transform: 'translateX(-50%)' }}
            className={`!w-6 !h-6 md:!w-5 md:!h-5 !bg-sky-600 !border-2 !border-white !rounded-full shadow-sm hover:!scale-125 transition-transform cursor-crosshair z-40 flex items-center justify-center ${
              pendingPinHandle === 'neg' ? '!ring-4 !ring-emerald-400 !scale-125' : ''
            }`}
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
