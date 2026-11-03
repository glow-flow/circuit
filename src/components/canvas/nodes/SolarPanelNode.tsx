import React, { useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Sun, CloudSun, Moon, AlertTriangle } from 'lucide-react';
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
 * - Bottom dual copper terminal pins: Positive (+) at 38.6% and Negative (-) at 61.3%.
 * - Works seamlessly in both Outdoor Sandbox and Lab modes with MNA Union-Find Transmission Towers.
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

  const t = TRANSLATIONS[language].nodes.solarPanel;
  const isId = language === 'id';

  const sunlight = data.sunlight ?? 100;
  const nominalVoltage = data.voltage ?? getSolarPanelVoltage(sunlight);
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
      updateComponentData(id, {
        sunlight: nextSunlight,
        voltage: getSolarPanelVoltage(nextSunlight),
      });
    },
    [id, updateComponentData]
  );

  const applyWeatherPreset = useCallback(
    (targetVoltage: number, targetSunlight: number) => {
      updateComponentData(id, {
        sunlight: targetSunlight,
        voltage: targetVoltage,
      });
    },
    [id, updateComponentData]
  );

  return (
    <div
      className={`relative flex flex-col items-center select-none transition-all duration-200 w-[144px] group ${
        selected ? 'filter drop-shadow-[0_0_18px_rgba(245,158,11,0.55)]' : ''
      }`}
    >
      {/* Top Floating Control & Weather Pill */}
      <div
        className={`nodrag mb-1 w-full px-2 py-1.5 rounded-2xl backdrop-blur-md border shadow-[0_8px_20px_rgba(0,0,0,0.45)] flex flex-col gap-1 z-30 ${
          isShorted
            ? 'bg-red-950/90 border-danger-500 animate-pulse'
            : 'bg-void-950/90 border-amber-400/40'
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
            className={`font-bold shrink-0 ${
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
            className={`px-1 py-0.5 rounded text-[9px] font-mono font-bold border transition-all active:scale-95 cursor-pointer ${
              sunlight >= 90
                ? 'bg-amber-500/25 text-amber-300 border-amber-400/50'
                : 'bg-void-900/90 text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            ☀️ 12V
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => applyWeatherPreset(5.0, 42)}
            className={`px-1 py-0.5 rounded text-[9px] font-mono font-bold border transition-all active:scale-95 cursor-pointer ${
              sunlight >= 30 && sunlight < 90
                ? 'bg-sky-500/25 text-sky-300 border-sky-400/50'
                : 'bg-void-900/90 text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            ⛅ 5V
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => applyWeatherPreset(0.0, 0)}
            className={`px-1 py-0.5 rounded text-[9px] font-mono font-bold border transition-all active:scale-95 cursor-pointer ${
              sunlight < 30
                ? 'bg-slate-700/60 text-slate-200 border-slate-400/40'
                : 'bg-void-900/90 text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            🌙 0V
          </button>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={sunlight}
          onChange={handleSunlightChange}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full h-1.5 bg-void-900 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
          aria-label="Solar Irradiance"
        />

        {data.isBlockingDiodeActive && (
          <div className="px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-400/50 text-[8px] font-mono font-bold text-emerald-300 text-center">
            {isId ? '🛡️ Dioda Penahan Arus Balik' : '🛡️ Blocking Diode Active'}
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

      {/* Physical Photovoltaic Panel + Ground Support Stand (Elevates Terminals Above Grass!) */}
      <div className="relative w-[136px] h-[98px] flex flex-col items-center justify-end pb-3.5 overflow-visible">
        {data.isShaded && (
          <div className="absolute inset-x-2 top-3 bottom-5 bg-slate-950/45 rounded pointer-events-none z-20 border border-indigo-400/30 flex items-center justify-center">
            <span className="text-[8px] font-mono font-bold text-amber-200/95 bg-black/70 px-1 py-0.5 rounded shadow">
              {isId ? 'Bayangan Bukit' : 'Hill Shadow'}
            </span>
          </div>
        )}
        <img
          src="/assets/solar-panel.png"
          alt={t.title}
          draggable={false}
          className={`w-full h-[84px] object-contain pointer-events-none select-none transition-all duration-300 z-10 ${
            isDark ? 'opacity-60 grayscale-[0.45]' : ''
          } ${
            isGenerating
              ? 'drop-shadow-[0_6px_18px_rgba(245,158,11,0.55)]'
              : 'drop-shadow-[0_6px_10px_rgba(0,0,0,0.55)]'
          }`}
        />

        {/* Metallic Ground Support Stakes (planted into grass so terminals stay clearly visible above grass) */}
        <div className="w-[46%] flex justify-between px-1 -mt-1 pointer-events-none z-0">
          <div className="w-2 h-4 bg-gradient-to-b from-slate-300 to-slate-600 rounded-b-sm shadow" />
          <div className="w-2 h-4 bg-gradient-to-b from-slate-300 to-slate-600 rounded-b-sm shadow" />
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
          style={{ left: '62%', bottom: '12px', transform: 'translateX(-50%)' }}
          className="!w-5 !h-5 !bg-sky-500 !border-2 !border-white !rounded-full shadow-[0_0_12px_rgba(56,189,248,0.95)] hover:!scale-125 transition-transform cursor-crosshair z-40 flex items-center justify-center"
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
