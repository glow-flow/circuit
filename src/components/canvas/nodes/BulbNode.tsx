import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { RotateCcw, Info, Flame, Snowflake } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import {
  computeBulbPhotometrics,
  getBulbSpec,
  getBulbTerminalLayout,
} from '../../../constants/bulbCatalog';
import { BULB_NODE_SIZE } from '../../../utils/socketSnap';
import { NodeInfoPopover } from './NodeInfoPopover';

/** Formats current in mA (< 1 A) or A. */
function formatCurrent(amperes: number): string {
  if (amperes === 0) return '0 mA';
  if (amperes < 0.001) return `${(amperes * 1000).toFixed(2)} mA`;
  if (amperes < 1) return `${(amperes * 1000).toFixed(1)} mA`;
  return `${amperes.toFixed(2)} A`;
}

/** Formats electrical power in mW (< 0.1 W) or W. */
function formatPower(watts: number): string {
  if (watts === 0) return '0.00 W';
  if (watts < 0.1) return `${(watts * 1000).toFixed(1)} mW`;
  return `${watts.toFixed(2)} W`;
}

/**
 * Dual-Mode Light Bulb Node:
 *
 * 1. Screw-Base Bulbs ('incandescent', 'edison', 'cfl', 'led_standard', 'led_rgb'):
 *    - Standalone inventory items with ZERO handles (cannot connect wires directly).
 *    - Must be snapped into an E27 SocketNode to conduct current.
 *
 * 2. Pin-Base Bulbs ('halogen', 'led_green'):
 *    - Direct-wired circuit components (G4/G9 bi-pin capsule & 5mm DIP indicator diode).
 *    - Feature 2 physical pin handles (p1, p2) matching their metal prongs/legs.
 *    - Conduct electricity directly, dissipate power P = I²R, and glow with borderless bloom.
 *
 * Time Complexity: O(1) render & photometric calculation.
 *
 * @param props - React Flow NodeProps containing component data and selection state
 * @returns React component representing the bulb
 */
export const BulbNode: React.FC<NodeProps<CircuitElementData>> = ({ id, data, selected }) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const updateComponentData = useCircuitStore((state) => state.updateComponentData);
  const language = useCircuitStore((state) => state.language);

  const isIndonesian = language === 'id';
  const bulbSpec = getBulbSpec(data.bulbType);
  const isPinBulb = bulbSpec.baseType === 'pin';
  const terminalLayout = getBulbTerminalLayout(bulbSpec.type);

  const resistance = data.resistance ?? bulbSpec.resistance;
  const isBlown = Boolean(data.isBlown);

  const displayLabel = isIndonesian ? bulbSpec.label : bulbSpec.labelEn;
  const displayTraits = isIndonesian ? bulbSpec.traits : bulbSpec.traitsEn;

  // Active current & photometrics for direct-wired pin bulbs
  const current = isPinBulb
    ? Math.abs(simulation.branchCurrents[id] ?? data.calculatedCurrent ?? 0)
    : 0;

  const photometrics = isPinBulb
    ? computeBulbPhotometrics(current, resistance, bulbSpec)
    : { powerWatts: 0, voltageDrop: 0, brightness: 0, heatLevel: 'cold' as const, isOverloaded: false };

  const { powerWatts, voltageDrop, brightness, heatLevel, isOverloaded } = photometrics;
  const effectiveIsBlown = isBlown || isOverloaded;

  // Pure optical filter: NO drop-shadow on the image itself to prevent bounding box clipping!
  const imageFilter = effectiveIsBlown
    ? 'grayscale(100%) brightness(0.42) contrast(1.15)'
    : isPinBulb && brightness > 0.01
    ? `brightness(${0.96 + brightness * 0.42}) saturate(${1.0 + brightness * 0.35})`
    : 'saturate(0.48) brightness(0.78) contrast(1.04)';

  const handleClass =
    '!bg-void-800 !border-2 !border-amber-400 !w-2.5 !h-2.5 !min-w-0 !min-h-0 !rounded-full transition-transform hover:scale-125';
  const handleStyle = (leftPercent: string): React.CSSProperties => ({
    left: leftPercent,
    bottom: -3,
    transform: 'translateX(-50%)',
    zIndex: 40,
  });

  return (
    <div
      className="group relative select-none cursor-grab active:cursor-grabbing"
      style={{
        width: BULB_NODE_SIZE.width,
        height: BULB_NODE_SIZE.height,
        overflow: 'visible',
      }}
    >
      {/* 
        NATURAL MULTI-TIER GLOW (zIndex: 14):
        Rendered for active pin-base bulbs when energized. Zero rectangular boundary clipping.
      */}
      {isPinBulb && !effectiveIsBlown && brightness > 0.01 && (
        <div
          className="pointer-events-none absolute select-none"
          style={{
            left: '50%',
            top: bulbSpec.type === 'led_green' ? 30 : 42,
            transform: 'translate(-50%, -50%)',
            zIndex: 14,
            width: 0,
            height: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Tier 3: Soft ambient atmospheric radiance (190px - 280px) */}
          <div
            className="absolute rounded-full transition-all duration-300"
            style={{
              width: Math.round(190 + brightness * 90),
              height: Math.round(190 + brightness * 90),
              background: `radial-gradient(circle, ${bulbSpec.glowColor} 0%, rgba(0,0,0,0) 70%)`,
              opacity: Math.min(0.85, 0.25 + brightness * 0.6),
              filter: 'blur(22px)',
            }}
          />
          {/* Tier 2: Glass globe corona (75px - 120px) */}
          <div
            className="absolute rounded-full transition-all duration-300"
            style={{
              width: Math.round(75 + brightness * 45),
              height: Math.round(75 + brightness * 45),
              background: `radial-gradient(circle, ${bulbSpec.glowColor} 15%, rgba(0,0,0,0) 72%)`,
              opacity: Math.min(0.9, 0.4 + brightness * 0.5),
              filter: 'blur(8px)',
            }}
          />
          {/* Tier 1: Specular optical core / filament center (32px - 50px) */}
          <div
            className="absolute rounded-full transition-all duration-300"
            style={{
              width: Math.round(32 + brightness * 18),
              height: Math.round(32 + brightness * 18),
              background: `radial-gradient(circle, rgba(255,255,255,0.95) 0%, ${bulbSpec.glowColor} 55%, rgba(0,0,0,0) 80%)`,
              opacity: Math.min(1.0, 0.5 + brightness * 0.5),
              filter: 'blur(3px)',
            }}
          />
        </div>
      )}

      {/* Main artwork card */}
      <div
        className={`relative flex h-full w-full items-center justify-center rounded-lg outline outline-1 outline-offset-2 transition-all duration-150 ${
          selected
            ? 'outline-cyan-300 shadow-md'
            : isPinBulb
            ? 'outline-transparent group-hover:outline-cyan-400/80'
            : 'outline-transparent'
        }`}
        style={{ zIndex: 20 }}
      >
        <img
          src={bulbSpec.image}
          alt={displayLabel}
          draggable={false}
          className={`pointer-events-none z-10 select-none object-contain transition-all duration-300 ${
            bulbSpec.imageRotated
              ? 'absolute left-1/2 top-1/2 h-[76px] w-[106px] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90'
              : 'relative h-full w-full'
          }`}
          style={{
            filter: imageFilter,
            opacity: effectiveIsBlown ? 0.5 : brightness > 0.01 ? 1 : 0.94,
          }}
        />

        {/* Hazard indicator when filament is burnt out */}
        {effectiveIsBlown && (
          <span className="absolute right-1 top-1 z-20 h-2.5 w-2.5 animate-pulse rounded-full bg-red-500 shadow-glow-danger" />
        )}
      </div>

      {/* 
        ELECTRICAL HANDLES:
        - Pin-base bulbs ('halogen', 'led_green') HAVE 2 physical pin handles at the bottom.
        - Screw-base bulbs have NO handles (must be snapped into SocketNode).
      */}
      {isPinBulb && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="p1"
            title={isIndonesian ? 'Pin 1 (Positif)' : 'Pin 1 (Positive)'}
            className={handleClass}
            style={handleStyle(terminalLayout.p1)}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="p2"
            title={isIndonesian ? 'Pin 2 (Negatif)' : 'Pin 2 (Negative)'}
            className={handleClass}
            style={handleStyle(terminalLayout.p2)}
          />
        </>
      )}

      {/* Popover Details: ONLY when selected */}
      {selected && (
        <NodeInfoPopover placement="bottom">
          <div className="mb-1.5 flex items-center justify-between gap-1.5">
            <div className="min-w-0">
              <div className="truncate text-xs font-bold tracking-tight text-slate-100">
                {displayLabel} <span className="font-mono text-cyan-300">({resistance}Ω)</span>
              </div>
              <div className="truncate text-[10px] text-slate-400" title={displayTraits}>
                {bulbSpec.category} • {isPinBulb ? (isIndonesian ? 'Kaki Pin Langsung' : 'Direct Pin Base') : (isIndonesian ? 'Ulir E27' : 'Screw E27')}
              </div>
            </div>

            {isPinBulb && (
              heatLevel === 'hot' || heatLevel === 'warm' ? (
                <span
                  className={`flex shrink-0 items-center gap-0.5 rounded border px-1.5 py-0.5 font-mono text-[9px] ${
                    heatLevel === 'hot'
                      ? 'border-orange-500/30 bg-orange-500/15 text-orange-300'
                      : 'border-amber-500/30 bg-amber-500/15 text-amber-300'
                  }`}
                >
                  <Flame className="h-2.5 w-2.5" />
                  {heatLevel === 'hot' ? (isIndonesian ? 'Panas' : 'Hot') : (isIndonesian ? 'Hangat' : 'Warm')}
                </span>
              ) : (
                <span className="flex shrink-0 items-center gap-0.5 rounded border border-blue-500/30 bg-blue-500/15 px-1.5 py-0.5 font-mono text-[9px] text-blue-300">
                  <Snowflake className="h-2.5 w-2.5" />
                  {isIndonesian ? 'Dingin' : 'Cool'}
                </span>
              )
            )}
          </div>

          {isPinBulb ? (
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-white/5 bg-void-950/85 p-2 font-mono text-[10px]">
              <div>
                <span className="text-slate-500">{isIndonesian ? 'Arus:' : 'Current:'} </span>
                <span className="font-bold text-yellow-300">{formatCurrent(current)}</span>
              </div>
              <div>
                <span className="text-slate-500">{isIndonesian ? 'Tegangan:' : 'Voltage:'} </span>
                <span className="font-bold text-blue-300">{voltageDrop.toFixed(2)} V</span>
              </div>
              <div>
                <span className="text-slate-500">{isIndonesian ? 'Daya:' : 'Power:'} </span>
                <span className="font-bold text-amber-400">{formatPower(powerWatts)}</span>
              </div>
              <div>
                <span className="text-slate-500">{isIndonesian ? 'Terang:' : 'Bright:'} </span>
                <span className="font-bold text-emerald-400">{Math.round(brightness * 100)}%</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1 rounded-lg border border-white/5 bg-void-950/85 p-2 font-mono text-[10px]">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                <Info className="h-3 w-3 text-cyan-400 shrink-0" />
                <span>
                  {isIndonesian
                    ? 'Lampu ulir E27: Pasang ke fiting lampu (Socket) untuk mengalirkan arus.'
                    : 'E27 screw bulb: Install into a lamp socket to conduct electrical current.'}
                </span>
              </div>
            </div>
          )}

          {effectiveIsBlown && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => updateComponentData(id, { isBlown: false })}
                className="flex w-full cursor-pointer items-center justify-center gap-1 rounded border border-red-500/50 bg-red-950/90 px-1.5 py-1 text-[10px] font-bold text-red-200 transition-colors hover:bg-red-900 active:scale-95"
              >
                <RotateCcw className="h-3 w-3" /> {isIndonesian ? 'Ganti Filamen' : 'Reset Filament'}
              </button>
            </div>
          )}
        </NodeInfoPopover>
      )}
    </div>
  );
};
