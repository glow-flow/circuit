import React from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { RotateCcw, Info } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import {
  getBulbSpec,
} from '../../../constants/bulbCatalog';
import { BULB_NODE_SIZE } from '../../../utils/socketSnap';
import { NodeInfoPopover } from './NodeInfoPopover';

/**
 * Pure Inventory Light Bulb Node:
 *
 * 1. Screw-Base Bulbs ('incandescent', 'edison', 'cfl', 'led_standard', 'led_rgb'):
 *    - Standalone inventory items with ZERO handles (cannot connect wires directly).
 *    - Must be snapped into an E27 SocketNode (fiting ulir) to conduct current.
 *
 * 2. Pin-Base Bulbs ('halogen', 'led_green'):
 *    - Standalone inventory items with ZERO handles when loose on canvas.
 *    - Must be snapped into a PinSocketNode (fiting keramik putih) to conduct current.
 *
 * Time Complexity: O(1) render.
 *
 * @param props - React Flow NodeProps containing component data and selection state
 * @returns React component representing the bulb inventory tile
 */
export const BulbNode: React.FC<NodeProps<CircuitElementData>> = ({ id, data, selected }) => {
  const updateComponentData = useCircuitStore((state) => state.updateComponentData);
  const language = useCircuitStore((state) => state.language);

  const isIndonesian = language === 'id';
  const bulbSpec = getBulbSpec(data.bulbType);
  const isPinBase = bulbSpec.baseType === 'pin';

  const resistance = data.resistance ?? bulbSpec.resistance;
  const isBlown = Boolean(data.isBlown);

  const displayLabel = isIndonesian ? bulbSpec.label : bulbSpec.labelEn;
  const displayTraits = isIndonesian ? bulbSpec.traits : bulbSpec.traitsEn;

  // Pure optical filter: clean appearance in palette and inventory on canvas
  const imageFilter = isBlown
    ? 'grayscale(100%) brightness(0.42) contrast(1.15)'
    : 'saturate(0.55) brightness(0.82) contrast(1.02)';

  return (
    <div
      className="group relative select-none cursor-grab active:cursor-grabbing"
      style={{
        width: BULB_NODE_SIZE.width,
        height: BULB_NODE_SIZE.height,
        overflow: 'visible',
      }}
    >
      {/* Main artwork card */}
      <div
        className={`relative flex h-full w-full items-center justify-center rounded-lg outline outline-1 outline-offset-2 transition-all duration-150 ${
          selected
            ? 'outline-cyan-300 shadow-md'
            : 'outline-transparent group-hover:outline-cyan-400/80'
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
            opacity: isBlown ? 0.5 : 0.94,
          }}
        />

        {/* Hazard indicator when filament is burnt out */}
        {isBlown && (
          <span className="absolute right-1 top-1 z-20 h-2.5 w-2.5 animate-pulse rounded-full bg-red-500 shadow-glow-danger" />
        )}

        {/* Anti-confusion helper badge: indicates bulb needs socket */}
        <div className="absolute -bottom-2.5 inset-x-0 flex justify-center pointer-events-none z-30">
          <span className="bg-slate-950/95 border border-amber-500/70 text-amber-300 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-1 backdrop-blur-sm whitespace-nowrap">
            ⚠️ {isPinBase ? (isIndonesian ? 'Butuh Fiting Pin' : 'Needs Pin Socket') : (isIndonesian ? 'Butuh Fiting' : 'Needs Socket')}
          </span>
        </div>
      </div>

      {/* 
        ELECTRICAL DROP INTERCEPTOR HANDLE:
        - Invisible full-area target handle that intercepts wire drops.
        - Triggers onConnect in useCircuitStore so user receives instant educational feedback
          instead of silent connection rejection.
      */}
      <Handle
        type="target"
        position={Position.Top}
        id="bulb-wire-target"
        className="!w-full !h-full !inset-0 !opacity-0 !cursor-not-allowed !pointer-events-auto !rounded-lg !border-0"
        title={isIndonesian ? 'Bohlam butuh fiting lampu' : 'Bulb requires lamp socket'}
      />

      {/* Popover Details: ONLY when selected */}
      {selected && (
        <NodeInfoPopover placement="bottom">
          <div className="mb-1.5 flex items-center justify-between gap-1.5">
            <div className="min-w-0">
              <div className="truncate text-xs font-bold tracking-tight text-slate-100">
                {displayLabel} <span className="font-mono text-cyan-300">({resistance}Ω)</span>
              </div>
              <div className="truncate text-[10px] text-slate-400" title={displayTraits}>
                {bulbSpec.category} • {isPinBase ? (isIndonesian ? 'Pin (Butuh Fiting Keramik)' : 'Pin Base (Needs Ceramic Socket)') : (isIndonesian ? 'Ulir E27 (Butuh Fiting)' : 'Screw E27 (Needs Socket)')}
              </div>
            </div>
          </div>

          <div className="space-y-1 rounded-lg border border-white/5 bg-void-950/85 p-2 font-mono text-[10px]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
              <Info className="h-3 w-3 text-cyan-400 shrink-0" />
              <span>
                {isPinBase
                  ? isIndonesian
                    ? `${displayLabel}: Pasang ke fiting keramik putih (Pin Socket) untuk mengalirkan arus.`
                    : `${displayLabel}: Install into a ceramic pin socket to conduct electrical current.`
                  : isIndonesian
                  ? `${displayLabel}: Pasang ke fiting lampu (Socket) untuk mengalirkan arus.`
                  : `${displayLabel}: Install into a lamp socket to conduct electrical current.`}
              </span>
            </div>
          </div>

          {isBlown && (
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
