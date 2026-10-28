import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Flame, Lightbulb, RotateCcw, Snowflake } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { computeBulbPhotometrics, getBulbSpec } from '../../../constants/bulbCatalog';
import { TRANSLATIONS } from '../../../i18n/translations';

/**
 * Light Bulb Node. The bulb model (incandescent, halogen, LED, ...) is chosen in the
 * component palette when the part is placed; this node only renders and simulates it.
 *
 * Time Complexity: O(1) render & photometric calculation.
 */
export const BulbNode: React.FC<NodeProps<CircuitElementData>> = ({ id, data, selected }) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const updateComponentData = useCircuitStore((state) => state.updateComponentData);
  const language = useCircuitStore((state) => state.language);

  const t = TRANSLATIONS[language].nodes.bulb;

  // 1. Resolve active bulb specification (defaults to 'incandescent' 800Ω)
  const bulbSpec = getBulbSpec(data.bulbType);

  // 2. Electrical & photometric calculations (P = I^2 * R)
  const resistance = data.resistance ?? bulbSpec.resistance;
  const current = Math.abs(simulation.branchCurrents[id] ?? 0);
  const { powerWatts, voltageDrop, brightness, heatLevel, isOverloaded } =
    computeBulbPhotometrics(current, resistance, bulbSpec);

  const isBlown = Boolean(data.isBlown || isOverloaded);
  const displayLabel = language === 'id' ? bulbSpec.label : bulbSpec.labelEn;
  const displayTraits = language === 'id' ? bulbSpec.traits : bulbSpec.traitsEn;

  const handleResetBulb = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateComponentData(id, { isBlown: false });
  };

  // Format power cleanly (mW for micro/milliwatt ranges, W for >= 0.1W)
  const formattedPower =
    powerWatts === 0
      ? '0.00 W'
      : powerWatts < 0.1
      ? `${(powerWatts * 1000).toFixed(1)} mW`
      : `${powerWatts.toFixed(2)} W`;

  const formattedCurrent =
    current === 0
      ? '0 mA'
      : current < 0.001
      ? `${(current * 1000).toFixed(2)} mA`
      : current < 1
      ? `${(current * 1000).toFixed(1)} mA`
      : `${current.toFixed(2)} A`;

  return (
    <div
      className={`group relative rounded-xl border bg-void-900 px-3.5 py-3 shadow-2xl transition-all duration-150 w-[198px] select-none ${
        selected ? 'border-electric-500 shadow-glow' : 'border-white/10 hover:border-white/20'
      } ${isBlown ? 'border-red-500/70 shadow-glow-danger' : ''}`}
    >
      {/* Terminal 1 Handle (Left) */}
      <div className="absolute top-1/2 -left-3 -translate-y-1/2 flex items-center z-20">
        <Handle
          type="source"
          position={Position.Left}
          id="p1"
          className="!bg-void-800 !border-amber-400 !w-3.5 !h-3.5"
        />
      </div>

      {/* Top Header: Icon + Max Power + Thermal Badge */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`p-1 rounded transition-colors duration-300 shrink-0 ${
              isBlown
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : brightness > 0.05
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                : 'bg-void-800 text-slate-400 border border-white/5'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {language === 'id' ? 'Maks' : 'Max'} {bulbSpec.maxPower}W
          </span>
        </div>

        {/* Thermal / Heat Status Indicator */}
        {isBlown ? (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleResetBulb}
            title={t.replaceBtn}
            className="nodrag flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-950/90 hover:bg-red-900 border border-red-500/50 text-[9px] font-bold text-red-200 transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-2.5 h-2.5" /> Reset
          </button>
        ) : heatLevel === 'hot' || heatLevel === 'warm' ? (
          <span
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono border shrink-0 ${
              heatLevel === 'hot'
                ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/25'
            }`}
            title={displayTraits}
          >
            <Flame className="w-2.5 h-2.5" />
            {heatLevel === 'hot'
              ? language === 'id'
                ? 'Panas'
                : 'Hot'
              : language === 'id'
              ? 'Hangat'
              : 'Warm'}
          </span>
        ) : (
          <span
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[9px] font-mono shrink-0"
            title={displayTraits}
          >
            <Snowflake className="w-2.5 h-2.5" />
            {language === 'id' ? 'Dingin' : 'Cool'}
          </span>
        )}
      </div>

      {/* Fixed-size image stage (w-20 h-24) so node geometry is identical for every bulb model */}
      <div className="relative flex items-center justify-center py-1 my-0.5">
        <div className="relative w-20 h-24 flex items-center justify-center">
          {/* Dynamic Radial Glow Aura scaled by P = I^2 * R */}
          {!isBlown && brightness > 0.02 && (
            <div
              className="absolute inset-0 rounded-full pointer-events-none transition-all duration-300"
              style={{
                background: `radial-gradient(circle, ${bulbSpec.glowColor} 0%, transparent 70%)`,
                opacity: Math.min(1, 0.25 + brightness * 0.75),
                transform: `scale(${0.9 + brightness * 0.45})`,
                filter: 'blur(10px)',
              }}
            />
          )}

          <img
            src={bulbSpec.image}
            alt={displayLabel}
            className={`z-10 object-contain pointer-events-none select-none transition-all duration-300 ${
              bulbSpec.imageRotated
                ? 'absolute left-1/2 top-1/2 w-24 h-20 max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90'
                : 'relative w-full h-full'
            }`}
            style={{
              filter: isBlown
                ? 'grayscale(100%) brightness(0.4) contrast(1.15)'
                : brightness > 0.01
                ? `brightness(${0.75 + brightness * 0.55}) saturate(${0.9 + brightness * 0.35}) drop-shadow(0 0 ${Math.round(
                    3 + brightness * 14
                  )}px ${bulbSpec.glowColor})`
                : 'grayscale(80%) brightness(0.48)',
              opacity: isBlown
                ? 0.35
                : brightness > 0.01
                ? Math.min(1.0, 0.65 + brightness * 0.35)
                : 0.5,
            }}
          />
        </div>
      </div>

      {/* Caption Under Image: {label} ({resistance}Ω) */}
      <div className="text-center mb-2">
        <div className="text-xs font-bold text-slate-100 tracking-tight truncate">
          {displayLabel} <span className="text-cyan-300 font-mono">({resistance}Ω)</span>
        </div>
        <div className="text-[10px] text-slate-400 truncate mt-0.5" title={displayTraits}>
          {bulbSpec.category} • {bulbSpec.glowTag}
        </div>
      </div>

      {/* Live Telemetry Metrics */}
      <div className="bg-void-950/85 rounded-lg p-2 border border-white/5 space-y-1 text-[10px] font-mono">
        <div className="flex justify-between items-baseline">
          <span className="text-slate-400 font-sans">{t.brightness}</span>
          <span
            className={
              isBlown
                ? 'text-red-400 font-bold animate-pulse'
                : brightness > 0
                ? 'text-amber-300 font-bold'
                : 'text-slate-500'
            }
          >
            {isBlown
              ? `💥 ${t.overloaded} (${voltageDrop.toFixed(1)}V)`
              : `${(brightness * 100).toFixed(0)}%`}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-slate-400 font-sans">{t.power}</span>
          <span className="text-slate-200">{formattedPower}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-slate-400 font-sans">{t.current}</span>
          <span className="text-electric-400">{formattedCurrent}</span>
        </div>
      </div>

      {/* Terminal 2 Handle (Right) */}
      <div className="absolute top-1/2 -right-3 -translate-y-1/2 flex items-center z-20">
        <Handle
          type="source"
          position={Position.Right}
          id="p2"
          className="!bg-void-800 !border-amber-400 !w-3.5 !h-3.5"
        />
      </div>
    </div>
  );
};
