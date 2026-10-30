import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Flame, RotateCcw, Snowflake, Unplug } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import {
  BASE_TERMINAL_LAYOUT,
  computeBulbPhotometrics,
  getBulbSpec,
} from '../../../constants/bulbCatalog';
import { BULB_NODE_SIZE } from '../../../utils/socketSnap';
import { TRANSLATIONS } from '../../../i18n/translations';
import { NodeInfoPopover } from './NodeInfoPopover';

/** Formats amperes as mA (< 1 A) or A. */
function formatCurrent(currentAmps: number): string {
  if (currentAmps === 0) return '0 mA';
  if (currentAmps < 0.001) return `${(currentAmps * 1000).toFixed(2)} mA`;
  if (currentAmps < 1) return `${(currentAmps * 1000).toFixed(1)} mA`;
  return `${currentAmps.toFixed(2)} A`;
}

/** Formats watts as mW (< 0.1 W) or W. */
function formatPower(powerWatts: number): string {
  if (powerWatts === 0) return '0.00 W';
  if (powerWatts < 0.1) return `${(powerWatts * 1000).toFixed(1)} mW`;
  return `${powerWatts.toFixed(2)} W`;
}

/**
 * Minimal Light Bulb Node: shows ONLY the lamp artwork on the canvas (no card).
 * Details (voltage, current, power, reset / unscrew buttons) appear in a popover
 * only while the node is selected. Wire handles sit at the base of the lamp
 * (screw contact or the two capsule pins). The bulb model is chosen in the palette.
 *
 * Time Complexity: O(1) render & photometric calculation.
 */
export const BulbNode: React.FC<NodeProps<CircuitElementData>> = ({ id, data, selected }) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const updateComponentData = useCircuitStore((state) => state.updateComponentData);
  const detachBulbFromSocket = useCircuitStore((state) => state.detachBulbFromSocket);
  const language = useCircuitStore((state) => state.language);

  const t = TRANSLATIONS[language].nodes.bulb;
  const isId = language === 'id';

  const bulbSpec = getBulbSpec(data.bulbType);
  const resistance = data.resistance ?? bulbSpec.resistance;
  const current = Math.abs(simulation.branchCurrents[id] ?? 0);
  const { powerWatts, voltageDrop, brightness, heatLevel, isOverloaded } =
    computeBulbPhotometrics(current, resistance, bulbSpec);

  const isBlown = Boolean(data.isBlown || isOverloaded);
  const isSnapped = Boolean(data.socketId);
  const displayLabel = isId ? bulbSpec.label : bulbSpec.labelEn;
  const displayTraits = isId ? bulbSpec.traits : bulbSpec.traitsEn;
  const terminals = BASE_TERMINAL_LAYOUT[bulbSpec.baseType];

  // Handles of a snapped bulb are wired internally to the socket, so hide + lock them
  const handleStyle = (left: string): React.CSSProperties => ({
    left,
    bottom: -6,
    transform: 'translateX(-50%)',
    opacity: isSnapped ? 0 : 1,
    pointerEvents: isSnapped ? 'none' : 'auto',
  });
  const handleClass =
    '!bg-void-800 !border-2 !border-amber-400 !w-3 !h-3 !min-w-0 !min-h-0 !rounded-full';

  const imageFilter = isBlown
    ? 'grayscale(100%) brightness(0.4) contrast(1.15)'
    : brightness > 0.01
    ? `brightness(${0.75 + brightness * 0.55}) saturate(${0.9 + brightness * 0.35}) drop-shadow(0 0 ${Math.round(
        3 + brightness * 14
      )}px ${bulbSpec.glowColor})`
    : 'grayscale(80%) brightness(0.55)';

  return (
    <div
      className="group relative select-none"
      style={{ width: BULB_NODE_SIZE.width, height: BULB_NODE_SIZE.height }}
    >
      {/* Terminal handles at the lamp base (Position.Bottom for both) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="p1"
        isConnectable={!isSnapped}
        className={handleClass}
        style={handleStyle(terminals.p1)}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="p2"
        isConnectable={!isSnapped}
        className={handleClass}
        style={handleStyle(terminals.p2)}
      />

      {/* Image-only stage: thin neon-cyan outline on hover, stronger when selected */}
      <div
        className={`relative flex h-full w-full items-center justify-center rounded-lg outline outline-1 outline-offset-2 transition-[outline-color] duration-150 ${
          selected
            ? 'outline-cyan-300'
            : 'outline-transparent group-hover:outline-cyan-400/80'
        }`}
      >
        {/* Radial glow aura scaled by P = I^2 * R */}
        {!isBlown && brightness > 0.02 && (
          <div
            className="pointer-events-none absolute inset-0 rounded-full transition-all duration-300"
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
          draggable={false}
          className={`pointer-events-none z-10 select-none object-contain transition-all duration-300 ${
            bulbSpec.imageRotated
              ? 'absolute left-1/2 top-1/2 h-[72px] w-[100px] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90'
              : 'relative h-full w-full'
          }`}
          style={{
            mixBlendMode: 'screen',
            filter: imageFilter,
            opacity: isBlown ? 0.4 : brightness > 0.01 ? Math.min(1, 0.7 + brightness * 0.3) : 0.6,
          }}
        />

        {/* Tiny hazard dot so a blown bulb is noticeable even when unselected */}
        {isBlown && (
          <span className="absolute right-1 top-1 z-20 h-2.5 w-2.5 animate-pulse rounded-full bg-red-500 shadow-glow-danger" />
        )}
      </div>

      {/* Details: ONLY while selected */}
      {selected && (
        <NodeInfoPopover placement={isSnapped ? 'top' : 'bottom'}>
          <div className="mb-1.5 flex items-center justify-between gap-1.5">
            <div className="min-w-0">
              <div className="truncate text-xs font-bold tracking-tight text-slate-100">
                {displayLabel} <span className="font-mono text-cyan-300">({resistance}Ω)</span>
              </div>
              <div className="truncate text-[10px] text-slate-400" title={displayTraits}>
                {bulbSpec.category} • {bulbSpec.baseType === 'screw' ? (isId ? 'Ulir' : 'Screw') : (isId ? 'Pin' : 'Pin')}
              </div>
            </div>
            {heatLevel === 'hot' || heatLevel === 'warm' ? (
              <span
                className={`flex shrink-0 items-center gap-0.5 rounded border px-1.5 py-0.5 font-mono text-[9px] ${
                  heatLevel === 'hot'
                    ? 'border-orange-500/30 bg-orange-500/15 text-orange-300'
                    : 'border-amber-500/25 bg-amber-500/10 text-amber-300'
                }`}
              >
                <Flame className="h-2.5 w-2.5" />
                {heatLevel === 'hot' ? (isId ? 'Panas' : 'Hot') : isId ? 'Hangat' : 'Warm'}
              </span>
            ) : (
              <span className="flex shrink-0 items-center gap-0.5 rounded border border-sky-500/20 bg-sky-500/10 px-1.5 py-0.5 font-mono text-[9px] text-sky-300">
                <Snowflake className="h-2.5 w-2.5" />
                {isId ? 'Dingin' : 'Cool'}
              </span>
            )}
          </div>

          <div className="space-y-1 rounded-lg border border-white/5 bg-void-950/85 p-2 font-mono text-[10px]">
            <div className="flex items-baseline justify-between">
              <span className="font-sans text-slate-400">{t.brightness}</span>
              <span
                className={
                  isBlown
                    ? 'animate-pulse font-bold text-red-400'
                    : brightness > 0
                    ? 'font-bold text-amber-300'
                    : 'text-slate-500'
                }
              >
                {isBlown ? `💥 ${t.overloaded}` : `${(brightness * 100).toFixed(0)}%`}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-sans text-slate-400">{isId ? 'Tegangan (V):' : 'Voltage (V):'}</span>
              <span className="text-slate-200">{voltageDrop.toFixed(2)} V</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-sans text-slate-400">{t.current}</span>
              <span className="text-electric-400">{formatCurrent(current)}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-sans text-slate-400">{t.power}</span>
              <span className="text-slate-200">{formatPower(powerWatts)}</span>
            </div>
          </div>

          {(isBlown || isSnapped) && (
            <div className="mt-2 flex gap-1.5">
              {isBlown && (
                <button
                  type="button"
                  onClick={() => updateComponentData(id, { isBlown: false })}
                  title={t.replaceBtn}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded border border-red-500/50 bg-red-950/90 px-1.5 py-1 text-[10px] font-bold text-red-200 transition-colors hover:bg-red-900 active:scale-95"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              )}
              {isSnapped && (
                <button
                  type="button"
                  onClick={() => detachBulbFromSocket(id)}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded border border-cyan-400/40 bg-cyan-500/10 px-1.5 py-1 text-[10px] font-bold text-cyan-200 transition-colors hover:bg-cyan-500/20 active:scale-95"
                >
                  <Unplug className="h-3 w-3" /> {isId ? 'Lepas' : 'Unscrew'}
                </button>
              )}
            </div>
          )}
        </NodeInfoPopover>
      )}
    </div>
  );
};
