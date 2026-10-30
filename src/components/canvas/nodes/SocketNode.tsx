import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Unplug } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { getBulbSpec } from '../../../constants/bulbCatalog';
import { SOCKET_NODE_SIZE } from '../../../utils/socketSnap';
import { NodeInfoPopover } from './NodeInfoPopover';

/** Horizontal position (percent) of the socket's two metal terminal screws in the cropped artwork. */
const SOCKET_TERMINALS = { p1: '35%', p2: '65%' } as const;

/**
 * Minimal Bulb Socket ("Fiting") Node for screw-base (ulir) bulbs.
 *
 * Shows only the socket artwork; the two wire handles sit on its bottom terminal screws.
 * Drop a screw-base bulb on top of it to snap the bulb in (see `settleBulbAfterDrag`);
 * pin-base bulbs such as Halogen are rejected with a notification.
 * Its info panel is shown only while selected.
 *
 * Time Complexity: O(1) render.
 */
export const SocketNode: React.FC<NodeProps<CircuitElementData>> = ({ id, data, selected }) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);
  const bulbNode = useCircuitStore((state) =>
    data.bulbId ? state.nodes.find((n) => n.id === data.bulbId) : undefined
  );
  const detachBulbFromSocket = useCircuitStore((state) => state.detachBulbFromSocket);

  const isId = language === 'id';
  const current = Math.abs(simulation.branchCurrents[id] ?? 0);
  const installedSpec = bulbNode ? getBulbSpec(bulbNode.data.bulbType) : undefined;

  const handleClass =
    '!bg-void-800 !border-2 !border-amber-400 !w-3 !h-3 !min-w-0 !min-h-0 !rounded-full';
  const handleStyle = (left: string): React.CSSProperties => ({
    left,
    bottom: -4,
    transform: 'translateX(-50%)',
  });

  return (
    <div
      className="group relative select-none"
      style={{ width: SOCKET_NODE_SIZE.width, height: SOCKET_NODE_SIZE.height }}
    >
      <Handle
        type="source"
        position={Position.Bottom}
        id="p1"
        className={handleClass}
        style={handleStyle(SOCKET_TERMINALS.p1)}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="p2"
        className={handleClass}
        style={handleStyle(SOCKET_TERMINALS.p2)}
      />

      <div
        className={`relative h-full w-full rounded-lg outline outline-1 outline-offset-2 transition-[outline-color] duration-150 ${
          selected ? 'outline-cyan-300' : 'outline-transparent group-hover:outline-cyan-400/80'
        }`}
      >
        <img
          src="/assets/socket.png"
          alt={isId ? 'Fiting lampu ulir' : 'Screw bulb socket'}
          draggable={false}
          className="pointer-events-none h-full w-full select-none object-contain"
          style={{
            mixBlendMode: 'screen',
            filter:
              current > 0.0005 && installedSpec
                ? `drop-shadow(0 -4px 10px ${installedSpec.glowColor})`
                : undefined,
          }}
        />
      </div>

      {selected && (
        <NodeInfoPopover>
          <div className="mb-1.5 text-xs font-bold tracking-tight text-slate-100">
            {isId ? 'Fiting Lampu' : 'Bulb Socket'}
            <span className="ml-1 font-mono text-[10px] text-cyan-300">
              {isId ? 'Ulir (screw)' : 'Screw'}
            </span>
          </div>
          <div className="space-y-1 rounded-lg border border-white/5 bg-void-950/85 p-2 font-mono text-[10px]">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-sans text-slate-400">{isId ? 'Lampu:' : 'Bulb:'}</span>
              <span className={installedSpec ? 'truncate text-amber-300' : 'text-slate-500'}>
                {installedSpec
                  ? isId
                    ? installedSpec.label
                    : installedSpec.labelEn
                  : isId
                  ? 'Kosong'
                  : 'Empty'}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-sans text-slate-400">{isId ? 'Kuat Arus (I):' : 'Current (I):'}</span>
              <span className="text-electric-400">
                {current < 1 ? `${(current * 1000).toFixed(1)} mA` : `${current.toFixed(2)} A`}
              </span>
            </div>
          </div>
          <p className="mt-1.5 text-[10px] leading-snug text-slate-400">
            {installedSpec
              ? isId
                ? 'Seret lampu menjauh atau tekan Lepas untuk melepasnya.'
                : 'Drag the bulb away or press Unscrew to remove it.'
              : isId
              ? 'Seret lampu ulir ke atas fiting ini untuk memasangnya.'
              : 'Drag a screw-base bulb onto this socket to install it.'}
          </p>
          {bulbNode && (
            <button
              type="button"
              onClick={() => detachBulbFromSocket(bulbNode.id)}
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-1 rounded border border-cyan-400/40 bg-cyan-500/10 px-1.5 py-1 text-[10px] font-bold text-cyan-200 transition-colors hover:bg-cyan-500/20 active:scale-95"
            >
              <Unplug className="h-3 w-3" /> {isId ? 'Lepas lampu' : 'Unscrew bulb'}
            </button>
          )}
        </NodeInfoPopover>
      )}
    </div>
  );
};
