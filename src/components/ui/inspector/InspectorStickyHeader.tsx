import React from 'react';
import {
  Sliders,
  Scissors,
  Trash2,
  X,
  Zap,
  Gauge,
  Flame,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { getComponentDisplayName } from '../../../utils/nodeLocalization';

export type InspectorTabType = 'overview' | 'properties' | 'live' | 'formula';

interface InspectorStickyHeaderProps {
  componentData: CircuitElementData;
  nodeId: string;
  hasWires: boolean;
  activeTab: InspectorTabType;
  onTabChange: (tab: InspectorTabType) => void;
  isMobileDrawer?: boolean;
  onCloseMobile?: () => void;
}

/**
 * Sticky Header for Component Inspector.
 * Displays component identity, tactile wire cutting and deletion controls,
 * pinned real-time electrical gauges (V, I, P, Status), and navigation tabs.
 *
 * Time Complexity: O(1)
 */
export const InspectorStickyHeader: React.FC<InspectorStickyHeaderProps> = ({
  componentData,
  nodeId,
  hasWires,
  activeTab,
  onTabChange,
  isMobileDrawer,
  onCloseMobile,
}) => {
  const language = useCircuitStore((state) => state.language);
  const removeComponent = useCircuitStore((state) => state.removeComponent);
  const disconnectNodeWires = useCircuitStore((state) => state.disconnectNodeWires);
  const disconnectAndResetMcb = useCircuitStore((state) => state.disconnectAndResetMcb);
  const simulation = useCircuitStore((state) => state.simulation);

  const isId = language === 'id';

  const branchCurrent = Math.abs(simulation.branchCurrents[nodeId] ?? 0);
  const voltage = Math.abs(
    componentData.calculatedVoltage ?? (componentData.voltage ?? 0)
  );
  const power = componentData.calculatedPower ?? voltage * branchCurrent;
  const isShort = componentData.isShortCircuit || simulation.shortCircuitBranches.includes(nodeId);
  const isBlown = Boolean(componentData.isBlown);

  return (
    <div className="border-b border-white/10 bg-void-850 shrink-0 select-none">
      {/* Title & Action Toolbar */}
      <div className="p-3 sm:p-3.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400 shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-slate-100 truncate leading-tight">
              {getComponentDisplayName(componentData, language)}
            </h2>
            <p className="text-[10px] text-electric-400 font-mono uppercase tracking-wider truncate">
              {componentData.type}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {hasWires && (
            <button
              type="button"
              onClick={() => {
                if (componentData.isMcbTripped) {
                  disconnectAndResetMcb(nodeId);
                } else {
                  disconnectNodeWires(nodeId);
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-500/40 text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
              title={
                isId
                  ? componentData.isMcbTripped
                    ? 'Putus kabel & reset MCB'
                    : 'Putus semua kabel'
                  : 'Cut all wires'
              }
            >
              <Scissors className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">
                {componentData.isMcbTripped
                  ? isId
                    ? 'Putus & Reset'
                    : 'Cut & Reset'
                  : isId
                  ? 'Putus Kabel'
                  : 'Cut Wires'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              removeComponent(nodeId);
              if (isMobileDrawer && onCloseMobile) onCloseMobile();
            }}
            className="p-1.5 rounded-lg bg-void-900 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-white/10 transition-colors active:scale-95 cursor-pointer"
            title={isId ? 'Hapus komponen ini' : 'Delete this component'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {isMobileDrawer && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg bg-void-900 text-slate-400 hover:text-white border border-white/10 active:scale-95 cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Pinned Telemetry Ribbon (Always visible regardless of active tab) */}
      <div className="px-3 pb-3 grid grid-cols-4 gap-1.5 font-mono text-center">
        {/* Voltage */}
        <div className="p-1.5 rounded-lg bg-void-950/80 border border-white/5">
          <div className="text-[9px] text-slate-400 font-sans flex items-center justify-center gap-1">
            <Zap className="w-3 h-3 text-sky-400" />
            <span>Volt</span>
          </div>
          <div className="text-xs font-bold text-sky-300 truncate">
            {voltage.toFixed(1)}V
          </div>
        </div>

        {/* Current */}
        <div className="p-1.5 rounded-lg bg-void-950/80 border border-white/5">
          <div className="text-[9px] text-slate-400 font-sans flex items-center justify-center gap-1">
            <Gauge className="w-3 h-3 text-amber-400" />
            <span>Arus</span>
          </div>
          <div className="text-xs font-bold text-amber-300 truncate">
            {branchCurrent < 1
              ? `${(branchCurrent * 1000).toFixed(0)}mA`
              : `${branchCurrent.toFixed(2)}A`}
          </div>
        </div>

        {/* Power */}
        <div className="p-1.5 rounded-lg bg-void-950/80 border border-white/5">
          <div className="text-[9px] text-slate-400 font-sans flex items-center justify-center gap-1">
            <Flame className="w-3 h-3 text-emerald-400" />
            <span>Daya</span>
          </div>
          <div className="text-xs font-bold text-emerald-300 truncate">
            {power < 10 ? power.toFixed(2) : power.toFixed(1)}W
          </div>
        </div>

        {/* Status */}
        <div
          className={`p-1.5 rounded-lg border font-sans truncate ${
            isShort
              ? 'bg-red-950/80 border-red-500/40 text-red-300 animate-pulse'
              : isBlown
              ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
              : 'bg-void-950/80 border-white/5 text-emerald-400'
          }`}
        >
          <div className="text-[9px] text-slate-400 flex items-center justify-center gap-0.5">
            {isShort || isBlown ? (
              <AlertTriangle className="w-3 h-3 text-amber-400" />
            ) : (
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
            )}
            <span>Status</span>
          </div>
          <div className="text-[10px] font-bold truncate">
            {isShort
              ? isId
                ? 'Korslet'
                : 'Short'
              : isBlown
              ? isId
                ? 'Putus'
                : 'Blown'
              : isId
              ? 'Normal'
              : 'OK'}
          </div>
        </div>
      </div>

      {/* 4-Tab Navigation Bar */}
      <div className="flex border-t border-white/10 text-xs font-semibold">
        {[
          { id: 'overview', labelId: 'Ringkasan', labelEn: 'Overview' },
          { id: 'properties', labelId: 'Properti', labelEn: 'Properties' },
          { id: 'live', labelId: 'Data Live', labelEn: 'Live Data' },
          { id: 'formula', labelId: 'Rumus & Sumber', labelEn: 'Formulas' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id as InspectorTabType)}
              className={`flex-1 min-h-[40px] py-2 text-center transition-all cursor-pointer border-b-2 text-[11px] sm:text-xs truncate ${
                isActive
                  ? 'border-electric-400 text-electric-400 bg-electric-500/10 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {isId ? tab.labelId : tab.labelEn}
            </button>
          );
        })}
      </div>
    </div>
  );
};
