import React, { useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { ChevronLeft, ChevronRight, Flame, Lightbulb, RotateCcw, Snowflake } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import {
  BULB_CATALOG,
  computeBulbPhotometrics,
  getAdjacentBulbSpec,
  getBulbSpec,
} from '../../../constants/bulbCatalog';
import { TRANSLATIONS } from '../../../i18n/translations';

/**
 * Interactive 7-Type Light Bulb Node with inline Carousel (< and >),
 * fixed geometry container, CSS screen-blend glow physics, and thermal overload indicator.
 *
 * Time Complexity:
 * - Render & Photometric Calculation: O(1)
 * - Carousel Switch Handler: O(N) where N is canvas node count (triggers MNA solver)
 */
export const BulbNode: React.FC<NodeProps<CircuitElementData>> = ({ id, data, selected }) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const setStoreNodes = useCircuitStore((state) => state.setNodes);
  const updateComponentData = useCircuitStore((state) => state.updateComponentData);
  const language = useCircuitStore((state) => state.language);
  const { setNodes: setReactFlowNodes } = useReactFlow();

  const [isFading, setIsFading] = useState(false);

  const t = TRANSLATIONS[language].nodes.bulb;

  // 1. Resolve active bulb specification (defaults to 'incandescent' 800Ω)
  const activeBulbType = data.bulbType ?? 'incandescent';
  const bulbSpec = getBulbSpec(activeBulbType);
  const catalogIndex = BULB_CATALOG.findIndex((item) => item.type === bulbSpec.type);

  // 2. Electrical & Photometric calculations (P = I^2 * R)
  const resistance = data.resistance ?? bulbSpec.resistance;
  const current = Math.abs(simulation.branchCurrents[id] ?? 0);
  const { powerWatts, voltageDrop, brightness, heatLevel, isOverloaded } =
    computeBulbPhotometrics(current, resistance, bulbSpec);

  const isBlown = Boolean(data.isBlown || isOverloaded);
  const displayLabel = language === 'id' ? bulbSpec.label : bulbSpec.labelEn;
  const displayTraits = language === 'id' ? bulbSpec.traits : bulbSpec.traitsEn;

  /**
   * Cycles to the previous or next bulb type in the 7-bulb catalog,
   * synchronizing `bulbType`, `resistance`, `powerRating`, `power`, and `label`
   * into both React Flow's `setNodes` and the Zustand MNA store.
   */
  const handleCycleBulb = (e: React.MouseEvent, direction: 'prev' | 'next') => {
    e.stopPropagation();
    setIsFading(true);
    window.setTimeout(() => setIsFading(false), 180);

    const nextSpec = getAdjacentBulbSpec(activeBulbType, direction);
    const nextLabel = language === 'id' ? nextSpec.label : nextSpec.labelEn;
    const nextPower = current * current * nextSpec.resistance;

    // Update via React Flow's setNodes as well as Zustand store for real-time MNA sync
    setReactFlowNodes((nds) =>
      nds.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                bulbType: nextSpec.type,
                label: nextLabel,
                resistance: nextSpec.resistance,
                powerRating: nextSpec.maxPower,
                power: nextPower,
                isBlown: false,
              },
            }
          : node
      )
    );

    setStoreNodes((nds) =>
      nds.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                bulbType: nextSpec.type,
                label: nextLabel,
                resistance: nextSpec.resistance,
                powerRating: nextSpec.maxPower,
                power: nextPower,
                isBlown: false,
              },
            }
          : node
      )
    );
  };

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

      {/* Top Header: Icon + Carousel Index Badge + Thermal Badge */}
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
            {catalogIndex + 1}/{BULB_CATALOG.length} • Maks {bulbSpec.maxPower}W
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

      {/* Fixed-Size Image Stage + Left/Right Carousel Buttons (< and >) */}
      <div className="relative flex items-center justify-center py-1 my-0.5">
        {/* Left Carousel Button (<) */}
        <button
          type="button"
          aria-label="Previous bulb type"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => handleCycleBulb(e, 'prev')}
          className="nodrag absolute left-0 z-10 w-7 h-7 rounded-lg bg-void-950/75 hover:bg-cyan-500/20 border border-cyan-400/50 hover:border-cyan-300 text-cyan-300 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-all duration-150 active:scale-90 cursor-pointer shadow-[0_0_10px_rgba(34,211,238,0.2)]"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Fixed Image Container (w-20 h-24 flex items-center justify-center) so node never resizes */}
        <div className="relative w-20 h-24 flex items-center justify-center overflow-hidden">
          {/* Dynamic Radial Glow Aura scaled by P = I^2 * R */}
          {!isBlown && brightness > 0.02 && (
            <div
              className="absolute inset-1 rounded-full pointer-events-none transition-all duration-300"
              style={{
                background: `radial-gradient(circle, ${bulbSpec.glowColor} 0%, transparent 72%)`,
                opacity: Math.min(1, 0.2 + brightness * 0.8),
                transform: `scale(${0.85 + brightness * 0.4})`,
                filter: 'blur(8px)',
              }}
            />
          )}

          <img
            src={bulbSpec.image}
            alt={displayLabel}
            className={`w-full h-full object-contain pointer-events-none select-none transition-all duration-300 ${
              isFading ? 'opacity-25 scale-95' : 'opacity-100 scale-100'
            }`}
            style={{
              mixBlendMode: 'screen',
              filter: isBlown
                ? 'grayscale(100%) brightness(0.35) contrast(1.2)'
                : brightness > 0.01
                ? `brightness(${0.65 + brightness * 0.85}) saturate(${0.85 + brightness * 0.5}) drop-shadow(0 0 ${Math.round(
                    4 + brightness * 18
                  )}px ${bulbSpec.glowColor})`
                : 'grayscale(85%) brightness(0.42)',
              opacity: isBlown
                ? 0.28
                : isFading
                ? 0.25
                : brightness > 0.01
                ? Math.min(1.0, 0.48 + brightness * 0.52)
                : 0.42,
            }}
          />
        </div>

        {/* Right Carousel Button (>) */}
        <button
          type="button"
          aria-label="Next bulb type"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => handleCycleBulb(e, 'next')}
          className="nodrag absolute right-0 z-10 w-7 h-7 rounded-lg bg-void-950/75 hover:bg-cyan-500/20 border border-cyan-400/50 hover:border-cyan-300 text-cyan-300 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-all duration-150 active:scale-90 cursor-pointer shadow-[0_0_10px_rgba(34,211,238,0.2)]"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Caption Under Image: {label} ({resistance}Ω) with smooth CSS fade */}
      <div
        className={`text-center mb-2 transition-opacity duration-300 ${
          isFading ? 'opacity-30' : 'opacity-100'
        }`}
      >
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
