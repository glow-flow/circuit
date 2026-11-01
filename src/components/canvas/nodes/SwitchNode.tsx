import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { TRANSLATIONS } from '../../../i18n/translations';
import { NodeInfoPopover } from './NodeInfoPopover';

/**
 * SPST Knife Switch Node (`type: 'switch'`).
 * Clean, direct asset-first presentation (like SocketNode/BulbNode):
 * - Canvas shows the physical knife switch directly with left and right brass terminals.
 * - Clicking the switch lever directly flips it open or closed with tactile feedback.
 * - Detailed telemetry and controls appear inside NodeInfoPopover on select.
 *
 * Time Complexity: O(1) render.
 */
export const SwitchNode: React.FC<NodeProps<CircuitElementData>> = ({ id, data, selected }) => {
  const toggleSwitch = useCircuitStore((state) => state.toggleSwitch);
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);
  const t = TRANSLATIONS[language].nodes.switch;

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
        width: 96,
        height: 52,
        overflow: 'visible',
      }}
      onClick={handleToggle}
      title={isOpen ? t.clickToClose : t.clickToOpen}
    >
      {/* Terminal 1 Handle (Left) */}
      <Handle
        type="source"
        position={Position.Left}
        id="p1"
        className="!bg-amber-600 !border-2 !border-white !w-3.5 !h-3.5 !-left-1.5 z-20 shadow-sm"
      />

      {/* Main Switch Artwork: Knife Switch Casing */}
      <div
        className={`relative flex h-full w-full items-center justify-center rounded-xl bg-void-900/90 border border-white/10 shadow-md transition-all duration-150 active:scale-95 ${
          selected
            ? 'outline outline-1 outline-offset-2 outline-amber-400 shadow-md'
            : 'group-hover:border-slate-400/50'
        }`}
        style={{ zIndex: 10 }}
      >
        <svg width="78" height="36" viewBox="0 0 78 36" className="overflow-visible">
          {/* Base mounting plate */}
          <rect x="4" y="8" width="70" height="20" rx="4" fill="#1E2330" stroke="#334155" strokeWidth="1.2" />

          {/* Left Brass Terminal Post */}
          <circle cx="16" cy="18" r="5" fill="#D97706" stroke="#92400E" strokeWidth="1.2" />
          <circle cx="16" cy="18" r="2" fill="#FDE68A" />

          {/* Right Brass Terminal Post */}
          <circle cx="62" cy="18" r="5" fill="#D97706" stroke="#92400E" strokeWidth="1.2" />
          <circle cx="62" cy="18" r="2" fill="#FDE68A" />

          {/* Knife Switch Lever Arm */}
          {isOpen ? (
            <g className="transition-all duration-200">
              {/* Open Lever Blade angled at ~30 degrees */}
              <line
                x1="16"
                y1="18"
                x2="52"
                y2="5"
                stroke="#D97706"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <line
                x1="16"
                y1="18"
                x2="52"
                y2="5"
                stroke="#FDE68A"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* Insulated handle grip */}
              <circle cx="53" cy="5" r="4" fill="#DC2626" />
            </g>
          ) : (
            <g className="transition-all duration-200">
              {/* Closed Lever Blade contacting both terminals */}
              <line
                x1="16"
                y1="18"
                x2="62"
                y2="18"
                stroke="#D97706"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <line
                x1="16"
                y1="18"
                x2="62"
                y2="18"
                stroke="#FDE68A"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* Insulated handle grip */}
              <circle cx="62" cy="18" r="3.5" fill="#10B981" />
            </g>
          )}
        </svg>

        {/* Status Chip */}
        <span
          className={`absolute -bottom-2 px-1.5 py-0.2 rounded text-[8px] font-mono font-bold border ${
            isOpen
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}
        >
          {isOpen ? t.openBadge : t.closedBadge}
        </span>
      </div>

      {/* Terminal 2 Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="p2"
        className="!bg-amber-600 !border-2 !border-white !w-3.5 !h-3.5 !-right-1.5 z-20 shadow-sm"
      />

      {/* Detailed Telemetry & Controls: ONLY when selected */}
      {selected && (
        <NodeInfoPopover placement="bottom" width={190}>
          {/* Header */}
          <div className="mb-2 flex items-center justify-between gap-1.5">
            <div className="truncate text-xs font-bold text-slate-100">
              {t.title}
            </div>
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                isOpen
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {isOpen ? t.openBadge : t.closedBadge}
            </span>
          </div>

          {/* Current readout */}
          <div className="rounded-lg bg-void-950 p-1.5 border border-white/10 font-mono text-xs space-y-1 mb-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px]">
                {isIndonesian ? 'Arus Lewat' : 'Current'}
              </span>
              <span className={isShorted ? 'text-red-400 font-bold' : 'text-emerald-400 font-semibold'}>
                {isOpen ? '0 mA' : current < 1 ? `${(current * 1000).toFixed(0)} mA` : `${current.toFixed(2)} A`}
              </span>
            </div>
          </div>

          {/* Toggle Action Button */}
          <button
            type="button"
            onClick={handleToggle}
            className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-white text-[11px] font-semibold transition-all active:scale-95 cursor-pointer ${
              isOpen
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-amber-600 hover:bg-amber-500'
            }`}
          >
            {isOpen ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
            <span>{isOpen ? t.clickToClose : t.clickToOpen}</span>
          </button>
        </NodeInfoPopover>
      )}
    </div>
  );
};
