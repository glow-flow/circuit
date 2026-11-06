import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { TRANSLATIONS } from '../../../i18n/translations';
import { NodeInfoPopover } from './NodeInfoPopover';

/**
 * SPST Knife Switch Node (`type: 'switch'`).
 * Renders the physical `/assets/switch-knife.png` hardware asset with left and right brass terminals.
 * Clicking the switch directly toggles its state between OPEN and CLOSED.
 *
 * Time Complexity: O(1) render.
 */
export const SwitchNode: React.FC<NodeProps<CircuitElementData>> = ({ id, data, selected }) => {
  const toggleSwitch = useCircuitStore((state) => state.toggleSwitch);
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);
  const t = TRANSLATIONS[language].nodes.switch;
  const [hasImageError, setHasImageError] = useState(false);

  const isOpen = data.isOpen ?? false;
  const current = Math.abs(simulation.branchCurrents[id] ?? 0);
  const isShorted = simulation.shortCircuitBranches.includes(id);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSwitch(id);
  };

  const isIndonesian = language === 'id';

  return (
    <div
      className="group relative select-none cursor-pointer flex items-center justify-center"
      style={{
        width: 108,
        height: 82,
        overflow: 'visible',
      }}
      onClick={handleToggle}
      title={isOpen ? t.clickToClose : t.clickToOpen}
    >
      {/* Terminal 1 Handle (Left Brass Post) */}
      <Handle
        type="source"
        position={Position.Left}
        id="p1"
        style={{ left: 6, top: '62%' }}
        className="!bg-amber-600 !border-2 !border-white !w-3.5 !h-3.5 z-20 shadow-sm"
      />

      {/* Main Switch Hardware Asset */}
      <div
        className={`relative flex h-full w-full items-center justify-center rounded-xl transition-all duration-150 active:scale-95 ${
          selected ? 'ring-2 ring-electric-400 ring-offset-2 ring-offset-void-950' : ''
        }`}
        style={{ zIndex: 10 }}
      >
        {!hasImageError ? (
          <img
            src="/assets/switch-knife.png"
            alt={t.title}
            width={108}
            height={82}
            draggable={false}
            onError={() => setHasImageError(true)}
            className={`w-full h-full object-contain pointer-events-none select-none drop-shadow-md transition-transform duration-200 ${
              isOpen ? '' : 'translate-y-[4px] scale-y-90 brightness-110'
            }`}
          />
        ) : (
          <div className="w-full h-12 rounded-xl bg-void-900 border border-white/15" />
        )}

        {/* Status Indicator Chip */}
        <span
          className={`absolute -bottom-1.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border shadow-sm ${
            isOpen
              ? 'bg-void-950 text-slate-300 border-white/15'
              : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
          }`}
        >
          {isOpen ? t.openBadge : t.closedBadge}
        </span>
      </div>

      {/* Terminal 2 Handle (Right Brass Post) */}
      <Handle
        type="source"
        position={Position.Right}
        id="p2"
        style={{ right: 6, top: '62%' }}
        className="!bg-amber-600 !border-2 !border-white !w-3.5 !h-3.5 z-20 shadow-sm"
      />

      {/* Detailed Telemetry & Controls: ONLY when selected */}
      {selected && (
        <NodeInfoPopover placement="bottom" width={190}>
          <div className="mb-2 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className={`p-1 rounded-md border ${
                  isOpen
                    ? 'bg-void-950 text-slate-300 border-white/15'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}
              >
                {isOpen ? (
                  <ToggleLeft className="w-3.5 h-3.5" />
                ) : (
                  <ToggleRight className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="truncate text-xs font-bold text-slate-100">
                {t.title}
              </div>
            </div>
            <span
              className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold ${
                isOpen
                  ? 'bg-void-950 text-slate-300 border border-white/10'
                  : 'bg-emerald-500/15 text-emerald-300'
              }`}
            >
              {isOpen ? t.openBadge : t.closedBadge}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            className="w-full py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer bg-electric-600 hover:bg-electric-500 text-white"
          >
            {isOpen
              ? isIndonesian
                ? 'Tutup Saklar (ON)'
                : 'Close Switch (ON)'
              : isIndonesian
              ? 'Buka Saklar (OFF)'
              : 'Open Switch (OFF)'}
          </button>

          {!isOpen && (
            <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400">
                {isIndonesian ? 'Arus:' : 'Current:'}
              </span>
              <span className={isShorted ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                {current < 1 ? `${(current * 1000).toFixed(0)} mA` : `${current.toFixed(2)} A`}
              </span>
            </div>
          )}
        </NodeInfoPopover>
      )}
    </div>
  );
};
