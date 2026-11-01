import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ShieldAlert, Zap } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { TRANSLATIONS } from '../../../i18n/translations';
import { NodeInfoPopover } from './NodeInfoPopover';

/**
 * Digital Ammeter Node (`type: 'ammeter'`).
 * Clean, direct asset-first presentation (like SocketNode/BulbNode):
 * - Canvas displays a compact digital meter pod with in (p1) and out (p2) inline terminals.
 * - Measured series current is rendered clearly on the LCD screen.
 * - Detailed telemetry and connection guides appear inside NodeInfoPopover on select.
 *
 * Time Complexity: O(1) render.
 */
export const AmmeterNode: React.FC<NodeProps<CircuitElementData>> = ({ id, selected }) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);
  const t = TRANSLATIONS[language].nodes.ammeter;

  const current = simulation.branchCurrents[id] ?? 0;
  const isShortCircuit = simulation.shortCircuitBranches.includes(id);

  const formattedCurrent =
    Math.abs(current) < 1
      ? `${(Math.abs(current) * 1000).toFixed(1)} mA`
      : `${Math.abs(current).toFixed(3)} A`;

  const isIndonesian = language === 'id';

  return (
    <div
      className="group relative select-none cursor-grab active:cursor-grabbing flex items-center justify-center"
      style={{
        width: 92,
        height: 48,
        overflow: 'visible',
      }}
    >
      {/* Input Handle (Left) */}
      <Handle
        type="source"
        position={Position.Left}
        id="p1"
        className="!bg-emerald-600 !border-2 !border-white !w-3.5 !h-3.5 !-left-1.5 z-20 shadow-sm"
      />

      {/* Main Meter Pod Casing */}
      <div
        className={`relative flex flex-col items-center justify-center h-full w-full rounded-xl bg-void-900 border px-2 py-1 shadow-md transition-all duration-150 ${
          isShortCircuit
            ? 'border-red-500 bg-red-950/40 animate-pulse'
            : selected
            ? 'border-amber-400 outline outline-1 outline-offset-2 outline-amber-400 shadow-md'
            : 'border-white/10 group-hover:border-slate-400/50'
        }`}
        style={{ zIndex: 10 }}
      >
        <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">
          AMPERE
        </span>
        <div
          className={`text-sm font-mono font-bold tracking-tight leading-tight ${
            isShortCircuit ? 'text-red-400' : 'text-emerald-400'
          }`}
        >
          {formattedCurrent}
        </div>
      </div>

      {/* Output Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="p2"
        className="!bg-emerald-600 !border-2 !border-white !w-3.5 !h-3.5 !-right-1.5 z-20 shadow-sm"
      />

      {/* Detailed Telemetry: ONLY when selected */}
      {selected && (
        <NodeInfoPopover placement="bottom" width={190}>
          <div className="mb-2 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div className="truncate text-xs font-bold text-slate-100">
                {t.title}
              </div>
            </div>
            {isShortCircuit ? (
              <span className="flex items-center gap-1 text-[9px] font-bold text-red-400 uppercase">
                <ShieldAlert className="w-3 h-3" /> OVERLOAD
              </span>
            ) : (
              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-white/5 text-slate-300">
                SERI
              </span>
            )}
          </div>

          <div className="rounded-lg bg-void-950 p-2 border border-white/10 font-mono text-center mb-1.5">
            <div
              className={`text-base font-bold ${
                isShortCircuit ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {formattedCurrent}
            </div>
            <div className="text-[9px] text-slate-400 font-sans mt-0.5">
              {t.seriesCurrent}
            </div>
          </div>

          <div className="text-[9px] text-center text-slate-400 leading-tight">
            {isIndonesian
              ? 'Pasang secara seri dalam satu jalur kabel untuk mengukur arus listrik.'
              : 'Connect in series along a wire branch to measure electrical current.'}
          </div>
        </NodeInfoPopover>
      )}
    </div>
  );
};
