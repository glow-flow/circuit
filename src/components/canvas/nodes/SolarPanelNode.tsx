import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Sun, CloudSun, FlaskConical, AlertTriangle } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { TRANSLATIONS } from '../../../i18n/translations';
import { getSolarPanelVoltage } from '../../../physics/solarPanel';

/**
 * Photovoltaic Solar Panel Node (`type: 'solar-panel'`).
 *
 * Characteristics:
 * - Environment-driven renewable power source:
 *   - 'sunny': 12.0V
 *   - 'cloudy': 5.0V
 *   - 'lab': 0.0V (indoor dark)
 * - Bottom dual copper terminal pins: Positive (+) at 38.6% and Negative (-) at 61.3%.
 * - Charges lower-voltage batteries (e.g. 9V battery or AA cells) when exposed to sunlight.
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
  const environment = useCircuitStore((state) => state.environment);

  const t = TRANSLATIONS[language].nodes.solarPanel;

  const currentEnvironment = data.environment ?? environment;
  const nominalVoltage = data.voltage ?? getSolarPanelVoltage(currentEnvironment);
  const current = Math.abs(simulation.branchCurrents[id] ?? 0);
  const isShorted = simulation.shortCircuitBranches.includes(id);

  const isGenerating = nominalVoltage > 0 && current > 0;
  const isDark = currentEnvironment === 'lab' || nominalVoltage === 0;

  const formattedCurrent =
    current === 0
      ? '0 mA'
      : current < 1
      ? `${(current * 1000).toFixed(1)} mA`
      : `${current.toFixed(2)} A`;

  const powerWatts = (nominalVoltage * current).toFixed(2);

  return (
    <div
      className={`relative rounded-xl border bg-void-900 px-3.5 pt-3 pb-6 shadow-2xl transition-all duration-200 w-[190px] select-none ${
        isShorted
          ? 'border-danger-500 shadow-glow-danger animate-pulse'
          : selected
          ? 'border-electric-500 shadow-glow'
          : isGenerating
          ? 'border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Component Header */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`p-1 rounded shrink-0 ${
              isShorted
                ? 'bg-danger-500/20 text-danger-500'
                : currentEnvironment === 'sunny'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : currentEnvironment === 'cloudy'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'bg-white/5 text-slate-400 border border-white/10'
            }`}
          >
            {isShorted ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : currentEnvironment === 'sunny' ? (
              <Sun className="w-3.5 h-3.5" />
            ) : currentEnvironment === 'cloudy' ? (
              <CloudSun className="w-3.5 h-3.5" />
            ) : (
              <FlaskConical className="w-3.5 h-3.5" />
            )}
          </div>
          <span className="text-[11px] font-bold text-slate-100 tracking-tight truncate">
            {t.title}
          </span>
        </div>

        {/* Ambient Voltage Badge */}
        <span
          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
            currentEnvironment === 'sunny'
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              : currentEnvironment === 'cloudy'
              ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
              : 'bg-white/5 text-slate-400 border-white/10'
          }`}
        >
          {nominalVoltage.toFixed(1)} V
        </span>
      </div>

      {/* Photovoltaic Panel Die-Cut Asset */}
      <div className="flex flex-col items-center justify-center py-1 relative">
        <div className="relative w-36 h-28 flex items-center justify-center">
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
                {language === 'id' ? '0V / Gelap' : '0V / Dark'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Weather Condition Status Pill */}
      <div className="mb-2">
        <div
          className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-[9px] font-mono font-bold border transition-colors ${
            currentEnvironment === 'sunny'
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
              : currentEnvironment === 'cloudy'
              ? 'bg-sky-500/10 text-sky-300 border-sky-500/25'
              : 'bg-white/5 text-slate-400 border-white/10'
          }`}
        >
          {currentEnvironment === 'sunny' && <Sun className="w-3 h-3 text-amber-400 animate-spin-slow" />}
          {currentEnvironment === 'cloudy' && <CloudSun className="w-3 h-3 text-sky-400" />}
          {currentEnvironment === 'lab' && <FlaskConical className="w-3 h-3 text-slate-400" />}
          <span>
            {currentEnvironment === 'sunny'
              ? t.sunnyStatus
              : currentEnvironment === 'cloudy'
              ? t.cloudyStatus
              : t.labStatus}
          </span>
        </div>
      </div>

      {/* Live Telemetry Readout */}
      <div className="bg-void-950/85 rounded-lg p-2 border border-white/5 space-y-1 text-[10px] font-mono">
        <div className="flex justify-between items-baseline">
          <span className="text-slate-400 font-sans">{t.voltage}</span>
          <span
            className={
              isDark
                ? 'text-slate-500'
                : currentEnvironment === 'sunny'
                ? 'text-amber-300 font-bold'
                : 'text-sky-300 font-bold'
            }
          >
            {nominalVoltage.toFixed(1)} V
          </span>
        </div>
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
        {current > 0 && (
          <div className="flex justify-between items-baseline pt-0.5 border-t border-white/5">
            <span className="text-slate-400 font-sans">{t.power}</span>
            <span className="text-emerald-400 font-bold">{powerWatts} W</span>
          </div>
        )}
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
