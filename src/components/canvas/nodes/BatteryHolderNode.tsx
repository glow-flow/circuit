import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { BatteryCharging, Plus, RotateCcw, Zap } from 'lucide-react';
import { CircuitElementData, ComponentType } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { TRANSLATIONS } from '../../../i18n/translations';

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

  const outputVoltage = batteryCount * 1.5;
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

  // Support dragging a Battery item directly from SidebarPalette onto the Holder
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

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-xl bg-void-900 border-2 transition-all duration-200 p-3 min-w-[196px] select-none ${
        isShorted
          ? 'border-danger-500 shadow-glow-danger animate-pulse'
          : isDragOver
          ? 'border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.45)] scale-[1.03]'
          : selected
          ? 'border-electric-500 shadow-glow-blue'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Positive Terminal Handle (Top Red Lead) */}
      <Handle
        type="source"
        position={Position.Top}
        id="pos"
        className="!bg-red-500 !border-red-200 !w-4 !h-4 !-top-2"
      />
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-red-400 pointer-events-none whitespace-nowrap">
        + ({outputVoltage.toFixed(1)}V)
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="p-1.5 rounded-lg bg-electric-500/10 border border-electric-500/30 text-electric-400">
            <BatteryCharging className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-100 tracking-tight">
            {t.title}
          </span>
        </div>
        {hasBattery && (
          <Zap
            className={`w-3.5 h-3.5 ${
              isShorted
                ? 'text-danger-500'
                : current > 0
                ? 'text-electric-400 animate-pulse'
                : 'text-emerald-400'
            }`}
          />
        )}
      </div>

      {/* Visual Dual AA Holder Container calibrated to cropped battery-holder.png (491x733) */}
      <div className="relative flex justify-center items-center my-1 py-1 bg-void-950/60 rounded-lg border border-white/5">
        <div className="relative w-[136px] h-[203px] flex items-center justify-center">
          {/* Base Battery Holder Image (tightly cropped 491x733) */}
          <img
            src="/assets/processed/battery-holder.png"
            alt={t.title}
            className="w-full h-full object-fill pointer-events-none select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)]"
            draggable={false}
          />

          {/* ================= LEFT CHAMBER (SLOT 1) ================= */}
          {/* Mask native uncompressed bottom spring when battery 1 is inserted */}
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

          {/* Animated Bottom Spring for Slot 1 (- terminal at bottom, + plate at top) */}
          <SpringOverlay
            isCompressed={hasSlot1}
            anchorOrigin="bottom"
            className="absolute left-[15.5%] bottom-[13%] w-[28%] h-[17%] z-10"
          />

          {/* Slot 1 AA Battery: Upright (0 deg) so (+) button touches top flat plate and (-) touches bottom spring */}
          {hasSlot1 && (
            <img
              src="/assets/processed/battery-aa.png"
              alt="AA Cell 1 (1.5V)"
              draggable={false}
              className="absolute left-[13.5%] top-[13.5%] w-[32%] h-[63.5%] object-fill z-20 pointer-events-none drop-shadow-[0_3px_6px_rgba(0,0,0,0.85)] transition-all duration-300"
            />
          )}

          {/* ================= RIGHT CHAMBER (SLOT 2) ================= */}
          {/* Mask native uncompressed top spring when battery 2 is inserted */}
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

          {/* Animated Top Spring for Slot 2 (- spring at top, + flat plate at bottom) */}
          <SpringOverlay
            isCompressed={hasSlot2}
            anchorOrigin="top"
            className="absolute left-[56.5%] top-[13%] w-[28%] h-[17%] z-10"
          />

          {/* Slot 2 AA Battery: Auto-rotated 180deg so (-) flat end presses top spring and (+) button touches bottom plate */}
          {hasSlot2 && (
            <img
              src="/assets/processed/battery-aa.png"
              alt="AA Cell 2 (1.5V Rotated 180°)"
              draggable={false}
              style={{ transform: 'rotate(180deg)' }}
              className="absolute left-[54.5%] top-[23%] w-[32%] h-[63.5%] object-fill z-20 pointer-events-none drop-shadow-[0_3px_6px_rgba(0,0,0,0.85)] transition-all duration-300"
            />
          )}

          {/* Drop Zone Highlight Overlay */}
          {isDragOver && (
            <div className="absolute inset-0 rounded-lg bg-emerald-500/20 border border-dashed border-emerald-400 flex items-center justify-center z-30 pointer-events-none">
              <span className="text-[10px] font-mono font-bold text-emerald-200 bg-void-950/90 px-2 py-1 rounded text-center">
                {t.dropNow}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Slot Controls (for both touch/mobile and desktop) */}
      <div className="flex items-center justify-between gap-1.5 mt-2 mb-2">
        <span className="text-[10px] font-mono text-slate-400">
          {t.filledCount}{' '}
          <b className="text-slate-200">{batteryCount}/2 AA</b>
        </span>
        <div className="flex items-center gap-1">
          {batteryCount < 2 && (
            <button
              type="button"
              onClick={handleInsertBattery}
              title="Insert 1.5V AA Battery"
              className="px-2 py-0.5 rounded bg-electric-500/15 hover:bg-electric-500/25 text-electric-400 border border-electric-500/30 text-[10px] font-mono font-semibold flex items-center gap-0.5 active:scale-95 transition-all"
            >
              <Plus className="w-3 h-3" />
              1.5V
            </button>
          )}
          {batteryCount > 0 && (
            <button
              type="button"
              onClick={handleEjectBattery}
              title="Eject 1.5V AA Battery"
              className="px-2 py-0.5 rounded bg-void-800 hover:bg-void-700 text-slate-300 border border-white/10 text-[10px] font-mono flex items-center gap-0.5 active:scale-95 transition-all"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              {t.ejectBtn}
            </button>
          )}
        </div>
      </div>

      {/* Telemetry Readout */}
      <div className="bg-void-950 rounded-lg p-2 border border-white/5 font-mono text-xs space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-[10px]">{t.outputVoltage}</span>
          <span
            className={`font-semibold ${
              hasBattery ? 'text-electric-400' : 'text-slate-500'
            }`}
          >
            {outputVoltage.toFixed(1)} V{' '}
            {batteryCount === 2
              ? t.seriesTag
              : batteryCount === 1
              ? t.singleTag
              : t.emptyTag}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-[10px]">{t.current}</span>
          <span
            className={
              isShorted
                ? 'text-danger-500 font-bold'
                : 'text-neon-400 font-semibold'
            }
          >
            {current < 1
              ? `${(current * 1000).toFixed(0)} mA`
              : `${current.toFixed(2)} A`}
          </span>
        </div>
      </div>

      {/* Negative Terminal Handle (Bottom Black Lead) */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-slate-400 pointer-events-none">
        - (0V)
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="neg"
        className="!bg-blue-500 !border-blue-200 !w-4 !h-4 !-bottom-2"
      />
    </div>
  );
};
