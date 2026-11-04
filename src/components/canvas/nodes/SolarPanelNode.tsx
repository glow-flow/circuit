import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Sun, CloudSun, Moon, AlertTriangle, ShieldCheck } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { TRANSLATIONS } from '../../../i18n/translations';
import { getSolarPanelVoltage } from '../../../physics/solarPanel';

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

  const isGenerating = nominalVoltage > 0 && current > 0;
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
      className={`relative flex flex-col items-center justify-end select-none transition-all duration-200 w-[144px] group overflow-visible ${
        selected ? 'filter drop-shadow-[0_0_14px_rgba(245,158,11,0.45)]' : ''
      }`}
      style={{ height: '156px' }}
    >
      {/* Top Floating Control & Weather Pill */}
      <div
        className={`nodrag mb-1 w-full px-2 py-1.5 rounded-xl backdrop-blur-md border shadow-[0_8px_20px_rgba(0,0,0,0.45)] flex flex-col gap-1 z-30 ${
          isShorted
            ? 'bg-red-950/95 border-danger-500 animate-pulse'
            : 'bg-void-950/95 border-white/15'
        }`}
      >
        <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
          <span className="flex items-center gap-1 font-bold text-slate-100 truncate">
            {isShorted ? (
              <AlertTriangle className="w-3 h-3 text-danger-500 shrink-0" />
            ) : isSunny ? (
              <Sun className="w-3 h-3 text-amber-400 shrink-0" />
            ) : !isDark ? (
              <CloudSun className="w-3 h-3 text-sky-400 shrink-0" />
            ) : (
              <Moon className="w-3 h-3 text-slate-400 shrink-0" />
            )}
            <span className="truncate">{t.title}</span>
          </span>
          <span
            className={`font-bold shrink-0 tabular-nums ${
              isSunny
                ? 'text-amber-300'
                : !isDark
                ? 'text-sky-300'
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
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => applyWeatherPreset(12.0, 100)}
            className={`px-1 py-0.5 rounded text-[9px] font-mono font-bold border transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-0.5 ${
              sunlight >= 90
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                : 'bg-void-900 text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            <Sun className="w-2.5 h-2.5 shrink-0" />
            <span>12V</span>
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => applyWeatherPreset(5.0, 42)}
            className={`px-1 py-0.5 rounded text-[9px] font-mono font-bold border transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-0.5 ${
              sunlight >= 30 && sunlight < 90
                ? 'bg-sky-500/20 text-sky-300 border-sky-400/50'
                : 'bg-void-900 text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            <CloudSun className="w-2.5 h-2.5 shrink-0" />
            <span>5V</span>
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => applyWeatherPreset(0.0, 0)}
            className={`px-1 py-0.5 rounded text-[9px] font-mono font-bold border transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-0.5 ${
              sunlight < 30
                ? 'bg-slate-700/60 text-slate-200 border-slate-400/40'
                : 'bg-void-900 text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            <Moon className="w-2.5 h-2.5 shrink-0" />
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
          className="w-full h-1.5 bg-void-900 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
          aria-label="Solar Irradiance"
        />

        {isOutdoor && (
          <div className="flex items-center justify-between px-1.5 py-0.5 rounded bg-void-900/90 border border-white/10 text-[8.5px] font-mono text-slate-300">
            <span className="font-semibold text-amber-300">
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
          <div className="px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-400/50 text-[8px] font-mono font-bold text-emerald-300 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
            <span>{isId ? 'Dioda Penahan Arus Balik' : 'Blocking Diode Active'}</span>
          </div>
        )}

        {data.isShaded && (
          <div
            id="solar-shadow-warning"
            className="px-1.5 py-0.5 rounded bg-amber-950/90 border border-amber-500/70 text-[8px] font-mono font-bold text-amber-300 text-center flex items-center justify-center gap-1 shadow-sm"
          >
            <AlertTriangle className="w-2.5 h-2.5 text-amber-400 shrink-0" />
            <span className="truncate">
              {isId
                ? 'Terhalang Bayangan Tebing - Daya 15%'
                : 'Cliff Shadow - Power 15%'}
            </span>
          </div>
        )}
      </div>

      {/* Physical Photovoltaic Panel + Ground Support Stand (Anchored flush at bottom-0 = 156px!) */}
      <div className="relative w-[136px] h-[82px] flex flex-col items-center justify-end pb-1 overflow-visible shrink-0">
        {data.isShaded && (
          <div className="absolute inset-x-2 top-2 bottom-4 bg-slate-950/45 rounded pointer-events-none z-20 border border-amber-400/30 flex items-center justify-center">
            <span className="text-[8px] font-mono font-bold text-amber-200/95 bg-black/75 px-1.5 py-0.5 rounded shadow">
              {isId ? 'Bayangan Bukit' : 'Hill Shadow'}
            </span>
          </div>
        )}
        <img
          src="/assets/solar-panel.png"
          alt={t.title}
          draggable={false}
          className={`w-full h-[72px] object-contain pointer-events-none select-none transition-all duration-300 z-10 ${
            isDark ? 'opacity-60 grayscale-[0.45]' : ''
          } ${
            isGenerating
              ? 'drop-shadow-[0_6px_14px_rgba(245,158,11,0.45)]'
              : 'drop-shadow-[0_6px_10px_rgba(0,0,0,0.55)]'
          }`}
        />

        {/* Metallic Ground Support Stakes (resting flush on terrain surface) */}
        <div className="w-[46%] flex justify-between px-1 -mt-1 pointer-events-none z-0">
          <div className="w-2 h-3 bg-gradient-to-b from-slate-300 to-slate-600 rounded-b-sm shadow" />
          <div className="w-2 h-3 bg-gradient-to-b from-slate-300 to-slate-600 rounded-b-sm shadow" />
        </div>

        {isDark && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <span className="bg-void-950/90 text-slate-300 border border-white/15 text-[9px] font-mono font-semibold px-2 py-0.5 rounded shadow">
              {isId ? '0V / Gelap' : '0V / Dark'}
            </span>
          </div>
        )}

        {/* Elevated, High-Visibility Terminals (+ and -) Clearly Above the Grass Line */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="pos"
          style={{ left: '38%', bottom: '12px', transform: 'translateX(-50%)' }}
          className="!w-5 !h-5 !bg-red-500 !border-2 !border-white !rounded-full shadow-[0_0_10px_rgba(239,68,68,0.85)] hover:!scale-125 active:!scale-90 transition-transform cursor-crosshair z-40 flex items-center justify-center"
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
          style={{ left: '62%', bottom: '12px', transform: 'translateX(-50%)' }}
          className="!w-5 !h-5 !bg-sky-500 !border-2 !border-white !rounded-full shadow-[0_0_10px_rgba(56,189,248,0.85)] hover:!scale-125 active:!scale-90 transition-transform cursor-crosshair z-40 flex items-center justify-center"
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
