import React from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { RotateCcw, Info, Plug } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { getBulbSpec } from '../../../constants/bulbCatalog';
import { BULB_NODE_SIZE } from '../../../utils/socketSnap';
import { NodeInfoPopover } from './NodeInfoPopover';
import { BulbGraphic } from '../../ui/common/LabComponentArt';

/**
 * Pure Inventory Light Bulb Node:
 * - Standalone inventory item awaiting placement into an E27 or Ceramic Pin socket.
 * - Includes a 1-tap "Pasang ke Fiting Otomatis" helper when selected for beginners.
 *
 * Time Complexity: O(1) render.
 */
export const BulbNode: React.FC<NodeProps<CircuitElementData>> = ({ id, data, selected }) => {
  const updateComponentData = useCircuitStore((state) => state.updateComponentData);
  const quickMountBulbWithSocket = useCircuitStore((state) => state.quickMountBulbWithSocket);
  const language = useCircuitStore((state) => state.language);

  const isIndonesian = language === 'id';
  const bulbSpec = getBulbSpec(data.bulbType);
  const isPinBase = bulbSpec.baseType === 'pin';

  const resistance = data.resistance ?? bulbSpec.resistance;
  const isBlown = Boolean(data.isBlown);

  const displayLabel = isIndonesian ? bulbSpec.label : bulbSpec.labelEn;
  const displayTraits = isIndonesian ? bulbSpec.traits : bulbSpec.traitsEn;

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
        <BulbGraphic
          bulbType={bulbSpec.type}
          brightness={0}
          isBlown={isBlown}
          className="relative z-10 h-full w-full transition-all duration-300"
        />

        {/* Hazard indicator when filament is burnt out */}
        {isBlown && (
          <span className="absolute right-1 top-1 z-20 h-2.5 w-2.5 rounded-full bg-danger-500 border border-pure-white" />
        )}

        {/* Anti-confusion helper badge: indicates bulb needs socket */}
        <div className="absolute -bottom-2.5 inset-x-0 flex justify-center pointer-events-none z-30">
          <span className="bg-void-950 border border-amber-500/70 text-amber-300 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-1 whitespace-nowrap">
            {isPinBase ? (isIndonesian ? 'Butuh Fiting Pin' : 'Needs Pin Socket') : (isIndonesian ? 'Butuh Fiting' : 'Needs Socket')}
          </span>
        </div>
      </div>

      {/*
        ELECTRICAL DROP INTERCEPTOR HANDLE:
        - Invisible full-area target handle that intercepts wire drops so user gets educational feedback.
      */}
      <Handle
        type="target"
        position={Position.Top}
        id="bulb-wire-target"
        className="bulb-wire-interceptor !w-full !h-full !inset-0 !opacity-0 !cursor-not-allowed !pointer-events-auto !rounded-lg !border-0"
        title={isIndonesian ? 'Lampu butuh fiting untuk dihubungkan kabel' : 'Bulb requires a socket to connect wires'}
      />

      {/* Popover Details: ONLY when selected */}
      {selected && (
        <NodeInfoPopover placement="bottom">
          <div className="mb-1.5 flex items-center justify-between gap-1.5">
            <div className="min-w-0">
              <div className="truncate text-xs font-bold tracking-tight text-ink">
                {displayLabel} <span className="font-mono text-electric-400 tabular-nums">({resistance}Ω)</span>
              </div>
              <div className="truncate text-[10px] text-slate-400" title={displayTraits}>
                {bulbSpec.category} · {isPinBase ? (isIndonesian ? 'Pin (Butuh Fiting Keramik)' : 'Pin Base (Needs Ceramic Socket)') : (isIndonesian ? 'Ulir E27 (Butuh Fiting)' : 'Screw E27 (Needs Socket)')}
              </div>
            </div>
          </div>

          <div className="space-y-1 rounded-lg border border-control bg-void-950 p-2 font-mono text-[10px]">
            <div className="flex items-center gap-1.5 text-slate-300 text-[10px]">
              <Info className="h-3 w-3 text-electric-400 shrink-0" aria-hidden="true" />
              <span>
                {isPinBase
                  ? isIndonesian
                    ? `${displayLabel}: Pasang ke fiting keramik putih agar bisa disambung kabel.`
                    : `${displayLabel}: Mount in a ceramic pin socket to connect wires.`
                  : isIndonesian
                  ? `${displayLabel}: Pasang ke fiting ulir E27 agar bisa disambung kabel.`
                  : `${displayLabel}: Mount in an E27 screw socket to connect wires.`}
              </span>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => quickMountBulbWithSocket(id)}
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-electric-600 hover:bg-electric-700 px-2.5 py-1.5 text-[10px] font-bold text-white transition-colors active:scale-95"
            >
              <Plug className="h-3 w-3" aria-hidden="true" />
              <span>
                {isIndonesian ? 'Pasang ke Fiting Otomatis' : 'Auto-Mount in Socket'}
              </span>
            </button>

            {isBlown && (
              <button
                type="button"
                onClick={() => updateComponentData(id, { isBlown: false })}
                className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg bg-danger-600 hover:bg-danger-700 px-2 py-1.5 text-[10px] font-bold text-white transition-colors active:scale-95"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" /> {isIndonesian ? 'Ganti Filamen' : 'Reset Filament'}
              </button>
            )}
          </div>
        </NodeInfoPopover>
      )}
    </div>
  );
};
