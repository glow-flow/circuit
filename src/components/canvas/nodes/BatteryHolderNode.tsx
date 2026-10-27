import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { BatteryCharging, Zap, AlertTriangle, RotateCcw, Plus } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';

/**
 * BatteryHolderNode (Dual AA Series Holder - 0V / 1.5V / 3.0V).
 * 
 * Features:
 * - Displays processed /assets/processed/battery-holder.png
 * - Accepts dragged BatteryNode (1.5V AA) from canvas or palette
 * - Auto-rotates battery 180deg so (-) terminal presses against the coil spring
 *   and (+) terminal touches the flat contact plate
 * - Transparent SVG coil spring overlay that compresses with transform: scaleY(0.6)
 *   when hasBattery is true
 */
export const BatteryHolderNode: React.FC<NodeProps<CircuitElementData>> = ({
  id,
  data,
  selected,
}) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const updateComponentData = useCircuitStore((state) => state.updateComponentData);
  const ejectBatteryFromHolder = useCircuitStore((state) => state.ejectBatteryFromHolder);

  const [isDragOver, setIsDragOver] = useState(false);

  const batteryCount = data.batteryCount ?? (data.hasBattery ? 2 : 0);
  const hasBattery = Boolean(data.hasBattery && batteryCount > 0);
  const hasSlot1 = hasBattery && batteryCount >= 1;
  const hasSlot2 = hasBattery && batteryCount >= 2;

  const totalVoltage = hasBattery ? batteryCount * 1.5 : 0.0;
  const current = simulation.branchCurrents[id] ?? 0;
  const isShortCircuit = simulation.shortCircuitBranches.includes(id);

  // Allow dropping a 'battery' directly from the SidebarPalette onto this holder
  const handleDragOver = (e: React.DragEvent) => {
    const draggedType = e.dataTransfer.getData('application/reactflow');
    if (draggedType === 'battery' || e.dataTransfer.types.includes('application/reactflow')) {
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
    setIsDragOver(false);
    const draggedType = e.dataTransfer.getData('application/reactflow');
    if (draggedType === 'battery') {
      e.preventDefault();
      e.stopPropagation();
      const nextCount = Math.min(2, batteryCount + 1);
      updateComponentData(id, {
        hasBattery: true,
        batteryCount: nextCount,
        voltage: nextCount * 1.5,
      });
    }
  };

  const handleQuickAddBattery = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextCount = Math.min(2, batteryCount + 1);
    updateComponentData(id, {
      hasBattery: true,
      batteryCount: nextCount,
      voltage: nextCount * 1.5,
    });
  };

  const handleEject = (e: React.MouseEvent) => {
    e.stopPropagation();
    ejectBatteryFromHolder(id);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-xl border bg-void-900 px-4 py-3 shadow-2xl transition-all duration-200 min-w-[195px] ${
        isDragOver
          ? 'border-neon-400 ring-4 ring-neon-500/30 scale-105'
          : selected
          ? 'border-electric-500 shadow-glow'
          : 'border-white/10 hover:border-white/20'
      } ${isShortCircuit ? 'border-danger-500 shadow-glow-danger animate-pulse' : ''}`}
    >
      {/* Positive Terminal Handle (Top) */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
        <span className="text-[10px] font-bold text-red-400 font-mono select-none drop-shadow">
          +
        </span>
        <Handle
          type="source"
          position={Position.Top}
          id="pos"
          className="handle-positive !bg-red-500 !border-red-300 !w-3 !h-3"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <BatteryCharging className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-200 tracking-tight">
            AA Holder (2x)
          </span>
        </div>
        {isShortCircuit ? (
          <div className="flex items-center gap-1 text-danger-500 text-[10px] font-bold uppercase animate-bounce">
            <AlertTriangle className="w-3.5 h-3.5" /> Short
          </div>
        ) : (
          <Zap
            className={`w-3.5 h-3.5 ${
              hasBattery ? 'text-cyan-400 fill-cyan-400/30' : 'text-slate-600'
            }`}
          />
        )}
      </div>

      {/* Interactive Dual-Slot Holder Graphic with Spring SVG & Auto-Rotated Batteries */}
      <div className="relative flex justify-center items-center py-1 my-1">
        <div className="relative w-32 h-36 flex items-center justify-center">
          {/* Base Processed Holder Image */}
          <img
            src="/assets/processed/battery-holder.png"
            alt="Dual AA Battery Holder"
            className="w-full h-full object-contain pointer-events-none select-none drop-shadow-lg"
          />

          {/* SLOT 1 (Left Chamber): Flat contact at TOP, Spring at BOTTOM */}
          <div className="absolute left-[23%] top-[14%] bottom-[14%] w-[24%] flex flex-col items-center justify-between pointer-events-none">
            {/* Flat Top Contact Plate (+) */}
            <div className="w-4 h-1 bg-slate-300/80 rounded-full" />

            {/* Inserted AA Battery in Slot 1 (Oriented 0deg: + top, - bottom on spring) */}
            {hasSlot1 && (
              <img
                src="/assets/processed/battery-aa.png"
                alt="AA Cell 1"
                className="w-full h-[76%] object-contain z-10 transition-all duration-300 drop-shadow-md"
                style={{ transform: 'rotate(0deg)' }}
              />
            )}

            {/* Transparent SVG Coil Spring Overlay at Bottom of Slot 1 */}
            <svg
              viewBox="0 0 36 28"
              className="w-6 h-6 text-slate-300/90 overflow-visible transition-transform duration-300 ease-out origin-bottom"
              style={{
                transform: hasSlot1 ? 'scaleY(0.6)' : 'scaleY(1)',
              }}
            >
              <path
                d="M 10 2 L 26 5 L 8 10 L 28 15 L 6 20 L 29 25 L 4 27"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* SLOT 2 (Right Chamber): Spring at TOP, Flat contact at BOTTOM */}
          <div className="absolute right-[23%] top-[14%] bottom-[14%] w-[24%] flex flex-col items-center justify-between pointer-events-none">
            {/* Transparent SVG Coil Spring Overlay at Top of Slot 2 */}
            <svg
              viewBox="0 0 36 28"
              className="w-6 h-6 text-slate-300/90 overflow-visible transition-transform duration-300 ease-out origin-top"
              style={{
                transform: hasSlot2 ? 'scaleY(0.6)' : 'scaleY(1)',
              }}
            >
              <path
                d="M 4 1 L 29 3 L 6 8 L 28 13 L 8 18 L 26 23 L 10 26"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Inserted AA Battery in Slot 2: AUTO-ROTATED 180deg so (-) presses top spring and (+) touches bottom flat plate */}
            {hasSlot2 && (
              <img
                src="/assets/processed/battery-aa.png"
                alt="AA Cell 2 (Rotated 180°)"
                className="w-full h-[76%] object-contain z-10 transition-all duration-300 drop-shadow-md"
                style={{ transform: 'rotate(180deg)' }}
              />
            )}

            {/* Flat Bottom Contact Plate (+) */}
            <div className="w-4 h-1 bg-slate-300/80 rounded-full" />
          </div>
        </div>
      </div>

      {/* Quick Action Bar for Inserting / Ejecting AA Cells */}
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <span className="text-[10px] font-mono text-slate-400">
          Cells: <b className="text-cyan-400">{batteryCount}/2 AA</b>
        </span>
        <div className="flex items-center gap-1">
          {batteryCount < 2 && (
            <button
              type="button"
              onClick={handleQuickAddBattery}
              title="Insert 1.5V AA Battery into slot"
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-[9px] font-semibold text-cyan-300 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-2.5 h-2.5" /> 1.5V
            </button>
          )}
          {hasBattery && (
            <button
              type="button"
              onClick={handleEject}
              title="Eject AA Battery back to canvas"
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-void-800 hover:bg-void-700 border border-white/10 text-[9px] text-slate-300 transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" /> Eject
            </button>
          )}
        </div>
      </div>

      {/* Telemetry Readout */}
      <div className="bg-void-950/80 rounded-lg p-2 border border-white/5 space-y-1">
        <div className="flex justify-between items-baseline">
          <span className="text-[10px] text-slate-400 font-medium">Output EMF:</span>
          <span
            className={`text-xs font-mono font-bold ${
              hasBattery ? 'text-cyan-400' : 'text-slate-500'
            }`}
          >
            {totalVoltage.toFixed(1)} V {batteryCount === 2 ? '(Series)' : ''}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[10px] text-slate-400 font-medium">Current:</span>
          <span
            className={`text-xs font-mono font-semibold ${
              isShortCircuit
                ? 'text-danger-500 font-bold'
                : Math.abs(current) > 0.001
                ? 'text-electric-400'
                : 'text-slate-500'
            }`}
          >
            {Math.abs(current) < 1
              ? `${(Math.abs(current) * 1000).toFixed(0)} mA`
              : `${Math.abs(current).toFixed(2)} A`}
          </span>
        </div>
      </div>

      {/* Negative Terminal Handle (Bottom) */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
        <Handle
          type="source"
          position={Position.Bottom}
          id="neg"
          className="handle-negative !bg-blue-500 !border-blue-300 !w-3 !h-3"
        />
        <span className="text-[10px] font-bold text-blue-400 font-mono select-none drop-shadow">
          -
        </span>
      </div>
    </div>
  );
};
