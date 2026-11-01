import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { BatteryCharging, Plus, Unplug } from 'lucide-react';
import { CircuitElementData, ComponentType } from '../../../types/circuit';
import { computeEffectiveBatteryVoltage } from '../../../physics/batterySoC';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { TRANSLATIONS } from '../../../i18n/translations';
import { NodeInfoPopover } from './NodeInfoPopover';

/**
 * SVG Metallic Coil Spring Overlay for Battery Holder Chambers.
 * Animates with `transform: scaleY(0.6)` when a battery is inserted into the slot.
 */
const SpringOverlay: React.FC<{
  isCompressed: boolean;
  anchorOrigin: 'top' | 'bottom';
  className?: string;
}> = ({ isCompressed, anchorOrigin, className = '' }) => (
  <svg
    viewBox="0 0 40 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`pointer-events-none transition-transform duration-300 ease-out ${className}`}
    style={{
      transform: isCompressed ? 'scaleY(0.6)' : 'scaleY(1)',
      transformOrigin: anchorOrigin === 'bottom' ? 'center bottom' : 'center top',
    }}
  >
    <path
      d="M5 3H35L7 10L33 17L9 24L31 31L12 34H28"
      stroke="#E2E8F0"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 3H35L7 10L33 17L9 24L31 31L12 34H28"
      stroke="#94A3B8"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Dual AA Battery Holder Node (`type: 'battery-holder'`).
 * Clean, direct asset-first presentation (like SocketNode/BulbNode):
 * - Canvas shows the physical dual-slot holder directly with spring contacts and installed cells.
 * - Detailed telemetry, cell count controls, and SoC appear inside NodeInfoPopover on select.
 *
 * Time Complexity: O(1) render.
 */
export const BatteryHolderNode: React.FC<NodeProps<CircuitElementData>> = ({
  id,
  data,
  selected,
}) => {
  const updateComponentData = useCircuitStore((state) => state.updateComponentData);
  const ejectBatteryFromHolder = useCircuitStore((state) => state.ejectBatteryFromHolder);
  const language = useCircuitStore((state) => state.language);
  const t = TRANSLATIONS[language].nodes.holder;

  const [isDragOver, setIsDragOver] = useState(false);

  const batteryCount = Math.min(2, Math.max(0, data.batteryCount ?? (data.hasBattery ? 2 : 0)));
  const hasBattery = batteryCount > 0;
  const hasSlot1 = batteryCount >= 1;
  const hasSlot2 = batteryCount >= 2;

  const nominalBaseVoltage = batteryCount * 1.5;
  const charge = Math.max(0, Math.min(100, data.currentCharge ?? 100));
  const effectiveVoltage =
    data.calculatedVoltage ??
    (hasBattery ? computeEffectiveBatteryVoltage(nominalBaseVoltage, charge) : 0);
  const isDead = hasBattery && charge <= 0;
  const isSagActive = hasBattery && charge > 0 && charge < 20;

  const outputVoltage = effectiveVoltage;
  const current = Math.abs(data.calculatedCurrent ?? 0);
  const isShorted = data.isShortCircuit;

  const handleInsertBattery = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (batteryCount >= 2) return;
    const nextCount = Math.min(2, batteryCount + 1);
    updateComponentData(id, {
      hasBattery: true,
      batteryCount: nextCount,
      voltage: nextCount * 1.5,
    });
  };

  const handleEjectBattery = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (batteryCount <= 0) return;
    ejectBatteryFromHolder(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    const draggedType = e.dataTransfer.getData('application/reactflow') as ComponentType | '';
    if (draggedType === 'battery' && batteryCount < 2) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      if (!isDragOver) setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    const draggedType = e.dataTransfer.getData('application/reactflow') as ComponentType | '';
    if (draggedType === 'battery' && batteryCount < 2) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const nextCount = Math.min(2, batteryCount + 1);
      updateComponentData(id, {
        hasBattery: true,
        batteryCount: nextCount,
        voltage: nextCount * 1.5,
      });
    }
  };

  const isIndonesian = language === 'id';

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="group relative select-none cursor-grab active:cursor-grabbing flex flex-col items-center"
      style={{
        width: 140,
        height: 206,
        overflow: 'visible',
      }}
    >
      {/* Positive Terminal Handle (+) at Top Lead */}
      <Handle
        type="source"
        position={Position.Top}
        id="pos"
        className="!bg-red-500 !border-2 !border-white !w-3.5 !h-3.5 !-top-1.5 z-30 shadow-sm"
      />
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-red-400 pointer-events-none select-none whitespace-nowrap">
        + ({outputVoltage.toFixed(1)}V)
      </div>

      {/* Main Artwork Frame: Crisp Direct Asset */}
      <div
        className={`relative flex h-full w-full items-center justify-center rounded-xl outline outline-1 outline-offset-2 transition-all duration-150 ${
          isShorted
            ? 'outline-red-500'
            : isDragOver
            ? 'outline-emerald-400 outline-2 scale-[1.02]'
            : selected
            ? 'outline-amber-400 shadow-md'
            : 'outline-transparent group-hover:outline-slate-400/50'
        }`}
        style={{ zIndex: 10 }}
      >
        {/* Base Battery Holder Chassis (tightly cropped 491x733) */}
        <img
          src="/assets/processed/battery-holder.png"
          alt={t.title}
          draggable={false}
          className="w-full h-full object-fill pointer-events-none select-none drop-shadow-md"
        />

        {/* ================= LEFT CHAMBER (SLOT 1) ================= */}
        {hasSlot1 && (
          <div
            className="absolute bg-[#32353B] rounded-xs pointer-events-none"
            style={{
              left: '14%',
              top: '68%',
              width: '31%',
              height: '19%',
            }}
          />
        )}

        {/* Animated Bottom Spring for Slot 1 */}
        <SpringOverlay
          isCompressed={hasSlot1}
          anchorOrigin="bottom"
          className="absolute left-[15.5%] bottom-[13%] w-[28%] h-[17%] z-10"
        />

        {/* Slot 1 AA Battery */}
        {hasSlot1 && (
          <img
            src="/assets/processed/battery-aa.png"
            alt="AA Cell 1 (1.5V)"
            draggable={false}
            className="absolute left-[13.5%] top-[13.5%] w-[32%] h-[63.5%] object-fill z-20 pointer-events-none drop-shadow-sm transition-all duration-300"
          />
        )}

        {/* ================= RIGHT CHAMBER (SLOT 2) ================= */}
        {hasSlot2 && (
          <div
            className="absolute bg-[#32353B] rounded-xs pointer-events-none"
            style={{
              left: '55%',
              top: '13%',
              width: '31%',
              height: '19%',
            }}
          />
        )}

        {/* Animated Top Spring for Slot 2 */}
        <SpringOverlay
          isCompressed={hasSlot2}
          anchorOrigin="top"
          className="absolute left-[56.5%] top-[13%] w-[28%] h-[17%] z-10"
        />

        {/* Slot 2 AA Battery */}
        {hasSlot2 && (
          <img
            src="/assets/processed/battery-aa.png"
            alt="AA Cell 2 (1.5V)"
            draggable={false}
            className="absolute left-[54.5%] top-[23%] w-[32%] h-[63.5%] object-fill rotate-180 z-20 pointer-events-none drop-shadow-sm transition-all duration-300"
          />
        )}

        {/* Dead Battery Indicator Badge */}
        {isDead && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center">
            <span className="bg-void-950/90 text-red-400 border border-red-500/40 text-[8px] font-mono font-bold px-1 py-0.5 rounded shadow">
              0V / DEAD
            </span>
          </div>
        )}
      </div>

      {/* Negative Terminal Handle (-) at Bottom Lead */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-slate-400 pointer-events-none select-none">
        -
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="neg"
        className="!bg-slate-700 !border-2 !border-white !w-3.5 !h-3.5 !-bottom-1.5 z-30 shadow-sm"
      />

      {/* Detailed Telemetry & Controls: ONLY when selected */}
      {selected && (
        <NodeInfoPopover placement="right" width={220}>
          {/* Header */}
          <div className="mb-2 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="p-1 rounded-md bg-electric-500/10 text-electric-400 border border-electric-500/20">
                <BatteryCharging className="w-3.5 h-3.5" />
              </div>
              <div className="truncate text-xs font-bold text-slate-100">
                {t.title}
              </div>
            </div>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-200">
              {batteryCount}/2 AA
            </span>
          </div>

          {/* SoC Progress Bar */}
          {hasBattery && (
            <div className="mb-2 space-y-1">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-400 font-sans text-[9px]">{isIndonesian ? 'Daya Tersimpan' : 'Charge'}</span>
                <span className={`font-bold ${isDead ? 'text-red-400' : isSagActive ? 'text-amber-400' : charge < 50 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                  {charge.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-void-950 border border-white/10 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isDead ? 'bg-red-500/40' : isSagActive ? 'bg-red-500' : charge < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${charge}%` }}
                />
              </div>
            </div>
          )}

          {/* Electrical Readout */}
          <div className="rounded-lg bg-void-950 p-1.5 border border-white/10 font-mono text-xs space-y-1 mb-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px]">{t.outputVoltage}</span>
              <span className={`font-semibold ${isDead ? 'text-red-400' : isSagActive ? 'text-amber-400' : 'text-slate-100'}`}>
                {outputVoltage.toFixed(1)} V {hasBattery && '(Seri)'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px]">{t.current}</span>
              <span className={isShorted ? 'text-red-400 font-bold' : 'text-emerald-400 font-semibold'}>
                {current < 1 ? `${(current * 1000).toFixed(0)} mA` : `${current.toFixed(2)} A`}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <button
              type="button"
              onClick={handleInsertBattery}
              disabled={batteryCount >= 2}
              className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-electric-600 hover:bg-electric-500 disabled:opacity-40 text-white text-[10px] font-semibold transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>{isIndonesian ? 'Pasang Sel' : 'Insert Cell'}</span>
            </button>
            <button
              type="button"
              onClick={handleEjectBattery}
              disabled={batteryCount <= 0}
              className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-void-800 hover:bg-void-700 disabled:opacity-40 text-slate-200 text-[10px] font-semibold border border-white/10 transition-all active:scale-95 cursor-pointer"
            >
              <Unplug className="w-3 h-3" />
              <span>{isIndonesian ? 'Lepas Sel' : 'Eject'}</span>
            </button>
          </div>

          {/* Drag Hint */}
          <div className="text-[9px] text-center text-slate-400 italic leading-tight">
            {t.emptyHint}
          </div>
        </NodeInfoPopover>
      )}
    </div>
  );
};
