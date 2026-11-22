import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Sun, CloudSun, Moon, AlertTriangle, ShieldCheck } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { TRANSLATIONS } from '../../../i18n/translations';
import { getSolarPanelVoltage } from '../../../physics/solarPanel';
import { usePendingPinHandleForNode } from '../../../hooks/useTapToConnectHandlers';

/**
 * Photovoltaic Solar Panel Node (`type: 'solar-panel'`).
 *
 * Characteristics:
 * - Adjustable solar irradiance (0% to 100% -> 0.0V to 12.0V DC) via in-node slider
 *   and quick weather preset buttons (Terik 12V, Mendung 5V, Gelap 0V).
 * - Bottom dual copper terminal pins: Positive (+) at 38% and Negative (-) at 62%.
 * - Outer height strictly calibrated to 156px (`justify-end`) matching `COMPONENT_DIMENSIONS['solar-panel']`
 *   so ground support stakes rest flush on the terrain surface without sinking into the dirt layer.
 *
 * Time Complexity: O(1) render.
 */
export const SolarPanelNode: React.FC<NodeProps<CircuitElementData>> = ({
  id,
  data,
  selected,
}) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);
  const updateComponentData = useCircuitStore((state) => state.updateComponentData);
  const sunTimeOfDay = useCircuitStore((state) => state.sunTimeOfDay);
  const worldMode = useCircuitStore((state) => state.worldMode);
  const pendingPinHandle = usePendingPinHandleForNode(id);

  const t = TRANSLATIONS[language].nodes.solarPanel;
  const isId = language === 'id';
  const isOutdoor = data.worldMode === 'outside' || worldMode === 'outside';

  const baseSunlight = data.baseSunlight ?? data.sunlight ?? 100;
  const sunlight = baseSunlight;
  const isShaded = Boolean(data.isShaded);
  const effectiveSunlight =
    data.effectiveSunlight ?? (isOutdoor && isShaded ? Math.round(baseSunlight * 0.15 * 10) / 10 : baseSunlight);
  const nominalVoltage = data.voltage ?? getSolarPanelVoltage(effectiveSunlight);
  const current = Math.abs(simulation.branchCurrents[id] ?? 0);
  const isShorted = simulation.shortCircuitBranches.includes(id);

  const isDark = nominalVoltage <= 0.1;
  const isSunny = nominalVoltage >= 9.0;

  const formattedCurrent =
    current === 0
      ? '0 mA'
      : current < 1
      ? `${(current * 1000).toFixed(1)} mA`
      : `${current.toFixed(2)} A`;

  const powerWatts = (nominalVoltage * current).toFixed(2);

  const handleSunlightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextSunlight = parseInt(e.target.value, 10);
      const isShadedNow = isOutdoor && Boolean(data.isShaded);
      const nextEffective = isShadedNow ? Math.round(nextSunlight * 0.15 * 10) / 10 : nextSunlight;
      updateComponentData(id, {
        sunlight: nextSunlight,
        baseSunlight: nextSunlight,
        effectiveSunlight: nextEffective,
        voltage: getSolarPanelVoltage(nextEffective),
      });
    },
    [id, isOutdoor, data.isShaded, updateComponentData]
  );

  const applyWeatherPreset = useCallback(
    (targetVoltage: number, targetSunlight: number) => {
      const isShadedNow = isOutdoor && Boolean(data.isShaded);
      const nextEffective = isShadedNow ? Math.round(targetSunlight * 0.15 * 10) / 10 : targetSunlight;
      updateComponentData(id, {
        sunlight: targetSunlight,
        baseSunlight: targetSunlight,
        effectiveSunlight: nextEffective,
        voltage: isShadedNow ? getSolarPanelVoltage(nextEffective) : targetVoltage,
      });
    },
    [id, isOutdoor, data.isShaded, updateComponentData]
  );

  return (
    <div
      className={`relative flex flex-col items-center justify-end select-none transition-colors duration-200 w-[144px] group overflow-visible ${
        selected ? 'ring-2 ring-amber-400 rounded-xl' : ''
      }`}
      style={{ height: '156px' }}
    >
      {/* Top Floating Control & Status Pill: Compact when unselected, full controls when selected */}
      {selected ? (
        <div
          className={`nodrag mb-1.5 w-[168px] px-2.5 py-2 rounded-xl border shadow-xl flex flex-col gap-1.5 z-30 ${
            isShorted
              ? 'bg-danger-950 border-danger-500 text-danger-200'
              : 'bg-void-950/95 border-control text-ink'
          }`}
        >
          <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
            <span className="flex items-center gap-1 font-bold text-ink truncate">
              {isShorted ? (
                <AlertTriangle className="w-3 h-3 text-danger-400 shrink-0" aria-hidden="true" />
              ) : isSunny ? (
                <Sun className="w-3 h-3 text-amber-400 shrink-0" aria-hidden="true" />
              ) : !isDark ? (
                <CloudSun className="w-3 h-3 text-sky-400 shrink-0" aria-hidden="true" />
              ) : (
                <Moon className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
              )}
              <span className="truncate">{t.title}</span>
            </span>
            <span
              className={`font-bold shrink-0 tabular-nums ${
                isSunny
                  ? 'text-amber-400'
                  : !isDark
                  ? 'text-electric-400'
                  : 'text-slate-400'
              }`}
            >
              {nominalVoltage.toFixed(1)}V
              {current > 0.001 ? ` · ${powerWatts}W` : ''}
            </span>
          </div>

          {/* Weather Presets (Terik 12V, Mendung 5V, Gelap 0V) */}
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              aria-pressed={sunlight >= 90}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => applyWeatherPreset(12.0, 100)}
              className={`px-1 py-1 rounded-lg text-[9px] font-mono font-bold border transition-colors active:scale-95 cursor-pointer flex items-center justify-center gap-0.5 ${
                sunlight >= 90
                  ? 'bg-[#B45309] text-white border-amber-500'
                  : 'bg-void-900 text-slate-300 border-control hover:text-ink'
              }`}
            >
              <Sun className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
              <span>12V</span>
            </button>
            <button
              type="button"
              aria-pressed={sunlight >= 30 && sunlight < 90}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => applyWeatherPreset(5.0, 42)}
              className={`px-1 py-1 rounded-lg text-[9px] font-mono font-bold border transition-colors active:scale-95 cursor-pointer flex items-center justify-center gap-0.5 ${
                sunlight >= 30 && sunlight < 90
                  ? 'bg-electric-600 text-white border-electric-500'
                  : 'bg-void-900 text-slate-300 border-control hover:text-ink'
              }`}
            >
              <CloudSun className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
              <span>5V</span>
            </button>
            <button
              type="button"
              aria-pressed={sunlight < 30}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => applyWeatherPreset(0.0, 0)}
              className={`px-1 py-1 rounded-lg text-[9px] font-mono font-bold border transition-colors active:scale-95 cursor-pointer flex items-center justify-center gap-0.5 ${
                sunlight < 30
                  ? 'bg-slate-600 text-white border-control'
                  : 'bg-void-900 text-slate-300 border-control hover:text-ink'
              }`}
            >
              <Moon className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
              <span>0V</span>
            </button>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={baseSunlight}
            onChange={handleSunlightChange}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full h-2 bg-void-900 rounded-lg cursor-pointer accent-amber-500"
            aria-label={isId ? 'Intensitas Cahaya Panel Surya' : 'Solar Irradiance'}
          />

          {isOutdoor && (
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-void-900 border border-control text-[8.5px] font-mono text-slate-300">
              <span className="font-semibold text-amber-400">
                {sunTimeOfDay === 'morning'
                  ? isId ? 'Pagi (35°)' : 'Morning (35°)'
                  : sunTimeOfDay === 'noon'
                  ? isId ? 'Siang (75°)' : 'Noon (75°)'
                  : isId ? 'Sore (35°)' : 'Afternoon (35°)'}
              </span>
              <span className="text-slate-400">
                {data.isShaded
                  ? isId
                    ? 'Bayangan 15%'
                    : 'Shaded 15%'
                  : isId
                  ? 'Terik Penuh'
                  : 'Full Sun'}
              </span>
            </div>
          )}

          {data.isBlockingDiodeActive && (
            <div className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/60 text-[8.5px] font-mono font-bold text-emerald-300 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>{isId ? 'Dioda Anti-Balik' : 'Blocking Diode'}</span>
            </div>
          )}

          {data.isShaded && (
            <div
              id="solar-shadow-warning"
              className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-500/70 text-[8.5px] font-mono font-bold text-amber-300 text-center flex items-center justify-center gap-1 shadow-sm"
            >
              <AlertTriangle className="w-2.5 h-2.5 text-amber-400 shrink-0" aria-hidden="true" />
              <span>{isId ? 'Bayangan Tebing (15%)' : 'Cliff Shadow (15%)'}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-1.5 flex flex-col items-center gap-1 z-30 pointer-events-auto">
          <div
            className={`px-2.5 py-1 rounded-full border shadow-md flex items-center gap-1.5 text-[10px] font-mono font-bold whitespace-nowrap tabular-nums ${
              isShorted
                ? 'bg-danger-950 border-danger-500 text-danger-200'
                : 'bg-void-950/95 border-control text-ink'
            }`}
          >
            {isShorted ? (
              <AlertTriangle className="w-3 h-3 text-danger-400 shrink-0" aria-hidden="true" />
            ) : isSunny ? (
              <Sun className="w-3 h-3 text-amber-400 shrink-0" aria-hidden="true" />
            ) : !isDark ? (
              <CloudSun className="w-3 h-3 text-sky-400 shrink-0" aria-hidden="true" />
            ) : (
              <Moon className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
            )}
            <span>{isId ? 'Surya' : 'Solar'}</span>
            <span className={isSunny ? 'text-amber-400' : !isDark ? 'text-electric-400' : 'text-slate-400'}>
              {nominalVoltage.toFixed(1)}V
            </span>
            {current > 0.001 && <span className="text-emerald-400">· {powerWatts}W</span>}
          </div>

          {data.isShaded && (
            <div
              id="solar-shadow-warning"
              className="px-2 py-0.5 rounded-full bg-amber-950/95 border border-amber-500/70 text-[8.5px] font-mono font-bold text-amber-300 flex items-center gap-1 whitespace-nowrap shadow-sm"
            >
              <AlertTriangle className="w-2.5 h-2.5 text-amber-400 shrink-0" aria-hidden="true" />
              <span>{isId ? 'Bayangan 15%' : 'Shaded 15%'}</span>
            </div>
          )}
        </div>
      )}

      {/* Physical Photovoltaic Panel + Ground Support Stand */}
      <div className="relative w-[136px] h-[82px] flex flex-col items-center justify-end pb-1 overflow-visible shrink-0">
        {data.isShaded && (
          <div
            className="absolute inset-x-3 top-2.5 bottom-6 bg-slate-950/40 rounded-[2px] pointer-events-none z-20"
            aria-hidden="true"
          />
        )}
        <img
          src="/assets/solar-panel.png"
          alt={t.title}
          width={136}
          height={72}
          draggable={false}
          className={`w-full h-[72px] object-contain pointer-events-none select-none transition-opacity duration-300 z-10 drop-shadow-md ${
            isDark ? 'opacity-65 grayscale-[0.45]' : ''
          }`}
        />

        {/* Metallic Ground Support Stakes */}
        <div className="w-[46%] flex justify-between px-1 -mt-1 pointer-events-none z-0">
          <div className="w-2 h-3 bg-gradient-to-b from-slate-300 to-slate-600 rounded-b-sm shadow" />
          <div className="w-2 h-3 bg-gradient-to-b from-slate-300 to-slate-600 rounded-b-sm shadow" />
        </div>

        {isDark && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <span className="bg-void-950 text-ink border border-control text-[9px] font-mono font-semibold px-2 py-0.5 rounded shadow">
              {isId ? '0V / Gelap' : '0V / Dark'}
            </span>
          </div>
        )}

        <Handle
          type="source"
          position={Position.Bottom}
          id="pos"
          style={{ left: '38%', bottom: '22px', transform: 'translateX(-50%)' }}
          className={`!w-6 !h-6 md:!w-5 md:!h-5 !bg-red-600 !border-2 !border-white !rounded-full shadow-sm hover:!scale-125 active:!scale-90 transition-transform cursor-crosshair z-40 flex items-center justify-center ${
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
          style={{ left: '62%', bottom: '22px', transform: 'translateX(-50%)' }}
          className={`!w-6 !h-6 md:!w-5 md:!h-5 !bg-sky-600 !border-2 !border-white !rounded-full shadow-sm hover:!scale-125 active:!scale-90 transition-transform cursor-crosshair z-40 flex items-center justify-center ${
            pendingPinHandle === 'neg' ? '!ring-4 !ring-emerald-400 !scale-125' : ''
          }`}
          title={`${formattedCurrent} (-)`}
        >
          <span className="text-[11px] font-mono font-black text-white leading-none pointer-events-none">
            -
          </span>
        </Handle>
      </div>
    </div>
  );
};
