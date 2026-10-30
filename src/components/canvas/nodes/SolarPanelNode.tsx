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
      className={`relative rounded-xl border bg-void-900/95 backdrop-blur-md px-3.5 pt-3 pb-6 shadow-2xl transition-all duration-200 w-[190px] select-none ${
        isShorted
          ? 'border-danger-500 shadow-glow-danger animate-pulse'
          : selected
          ? 'border-electric-500 shadow-glow'
          : isGenerating
          ? 'border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
          : 'border-white/15 hover:border-white/25'
      }`}
    >
      {/* Component Header */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`p-1 rounded shrink-0 ${
              isShorted
                ? 'bg-danger-500/20 text-danger-500'
                : isSunny
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : !isDark
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'bg-white/5 text-slate-400 border border-white/10'
            }`}
          >
            {isShorted ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : isSunny ? (
              <Sun className="w-3.5 h-3.5" />
            ) : !isDark ? (
              <CloudSun className="w-3.5 h-3.5" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </div>
          <span className="text-[11px] font-bold text-slate-100 tracking-tight truncate">
            {t.title}
          </span>
        </div>

        {/* Output Voltage Badge */}
        <span
          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
            isSunny
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              : !isDark
              ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
              : 'bg-white/5 text-slate-400 border-white/10'
          }`}
        >
          {nominalVoltage.toFixed(1)} V
        </span>
      </div>

      {/* Photovoltaic Panel Die-Cut Asset */}
      <div className="flex flex-col items-center justify-center py-0.5 relative">
        <div className="relative w-32 h-24 flex items-center justify-center">
          <img
            src="/assets/solar-panel.png"
            alt={t.title}
            className={`w-full h-full object-contain pointer-events-none select-none transition-all duration-300 ${
              isDark ? 'opacity-50 grayscale-[0.5]' : ''
            } ${
              isGenerating
                ? 'drop-shadow-[0_6px_18px_rgba(245,158,11,0.5)]'
                : 'drop-shadow-[0_4px_10px_rgba(0,0,0,0.65)]'
            }`}
          />
          {isDark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="bg-void-950/90 text-slate-300 border border-white/10 text-[9px] font-mono font-semibold px-2 py-0.5 rounded shadow">
                {isId ? '0V / Gelap' : '0V / Dark'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* In-Node Weather & Irradiance Controls (nodrag so slider/buttons don't drag the node) */}
      <div className="nodrag mb-2 space-y-1.5 bg-void-950/75 p-1.5 rounded-lg border border-white/10">
        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => applyWeatherPreset(12.0, 100)}
            className={`px-1 py-0.5 rounded text-[9px] font-mono font-bold border transition-all active:scale-95 cursor-pointer ${
              Math.abs(nominalVoltage - 12.0) < 0.3
                ? 'bg-amber-500/25 text-amber-300 border-amber-400/50'
                : 'bg-void-900 text-slate-400 border-white/5 hover:text-white'
            }`}
          >
            ☀️ 12V
          </button>
          <button
            type="button"
            onClick={() => applyWeatherPreset(5.0, 42)}
            className={`px-1 py-0.5 rounded text-[9px] font-mono font-bold border transition-all active:scale-95 cursor-pointer ${
              Math.abs(nominalVoltage - 5.0) < 0.3
                ? 'bg-sky-500/25 text-sky-300 border-sky-400/50'
                : 'bg-void-900 text-slate-400 border-white/5 hover:text-white'
            }`}
          >
            ⛅ 5V
          </button>
          <button
            type="button"
            onClick={() => applyWeatherPreset(0.0, 0)}
            className={`px-1 py-0.5 rounded text-[9px] font-mono font-bold border transition-all active:scale-95 cursor-pointer ${
              nominalVoltage === 0
                ? 'bg-slate-700/50 text-slate-200 border-slate-400/40'
                : 'bg-void-900 text-slate-400 border-white/5 hover:text-white'
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
          className="w-full h-1.5 bg-void-900 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
          aria-label="Solar Irradiance"
        />
      </div>

      {/* Live Telemetry Readout */}
      <div className="bg-void-950/85 rounded-lg p-1.5 border border-white/5 space-y-0.5 text-[10px] font-mono">
        <div className="flex justify-between items-baseline">
          <span className="text-slate-400 font-sans">{t.current}</span>
          <span
            className={
              isShorted
                ? 'text-danger-500 font-bold'
                : current > 0
                ? 'text-electric-400 font-bold'
                : 'text-slate-400'
            }
          >
            {formattedCurrent}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-slate-400 font-sans">{t.power}</span>
          <span className="text-emerald-400 font-bold">{powerWatts} W</span>
        </div>
      </div>

      {/* Bottom Positive (+) Handle — Aligned with Left Copper Screw Terminal (38.6%) */}
      <div
        className="absolute -bottom-3 -translate-x-1/2 flex flex-col items-center z-20"
        style={{ left: '38.6%' }}
      >
        <span className="mb-0.5 px-1 py-0 rounded bg-red-500/20 border border-red-500/40 text-[9px] font-mono font-bold text-red-400 leading-tight pointer-events-none">
          +
        </span>
        <Handle
          type="source"
          position={Position.Bottom}
          id="pos"
          className="!relative !left-0 !top-0 !transform-none !bg-red-500 !border-2 !border-white !w-3.5 !h-3.5 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
        />
      </div>

      {/* Bottom Negative (-) Handle — Aligned with Right Copper Screw Terminal (61.3%) */}
      <div
        className="absolute -bottom-3 -translate-x-1/2 flex flex-col items-center z-20"
        style={{ left: '61.3%' }}
      >
        <span className="mb-0.5 px-1 py-0 rounded bg-sky-500/20 border border-sky-500/40 text-[9px] font-mono font-bold text-sky-300 leading-tight pointer-events-none">
          -
        </span>
        <Handle
          type="source"
          position={Position.Bottom}
          id="neg"
          className="!relative !left-0 !top-0 !transform-none !bg-sky-400 !border-2 !border-white !w-3.5 !h-3.5 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
        />
      </div>
    </div>
  );
};
