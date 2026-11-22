import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { BatteryCharging, Plus, Unplug } from 'lucide-react';
import { CircuitElementData, ComponentType } from '../../../types/circuit';
import {
  computeSeriesHolderTelemetry,
  insertCellIntoHolderState,
  normalizeHolderCellCharges,
} from '../../../physics/batterySoC';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { TRANSLATIONS } from '../../../i18n/translations';
import { NodeInfoPopover } from './NodeInfoPopover';
import { BatteryHolderGraphic } from '../../ui/common/LabComponentArt';

/**
 * Dual AA Battery Holder Node (`type: 'battery-holder'`).
 * Clean matte bakelite vector-instrument chassis:
 * - Canvas shows the dual-slot lab holder directly with brass busbars, springs, and installed cells.
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

  const charge = Math.max(0, Math.min(100, data.currentCharge ?? 100));
  const computedTelemetry = computeSeriesHolderTelemetry(
    normalizeHolderCellCharges(data.cellCharges, batteryCount, charge)
  );
  const effectiveVoltage =
    data.calculatedVoltage ??
    (hasBattery ? computedTelemetry.effectiveVoltage : 0);
  const isDead = hasBattery && charge <= 0;
  const isSagActive = hasBattery && charge > 0 && charge < 20;

  const outputVoltage = effectiveVoltage;
  const current = Math.abs(data.calculatedCurrent ?? 0);
  const isShorted = data.isShortCircuit;

  const handleInsertBattery = (e: React.MouseEvent) => {
    e.stopPropagation();
    const inserted = insertCellIntoHolderState(data, 100);
    if (!inserted) return;
    updateComponentData(id, {
      hasBattery: inserted.hasBattery,
      batteryCount: inserted.batteryCount,
      voltage: inserted.voltage,
      capacity: inserted.capacity,
      currentCharge: inserted.currentCharge,
      cellCharges: inserted.cellCharges,
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
      const inserted = insertCellIntoHolderState(data, 100);
      if (!inserted) return;
      updateComponentData(id, {
        hasBattery: inserted.hasBattery,
        batteryCount: inserted.batteryCount,
        voltage: inserted.voltage,
        capacity: inserted.capacity,
        currentCharge: inserted.currentCharge,
        cellCharges: inserted.cellCharges,
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
      {/* Offset voltage & polarity pill positioned clear of the top red handle */}
      <div className="absolute -top-3.5 left-[calc(50%+14px)] px-1.5 py-0.5 rounded-md bg-void-950/95 border border-red-500/45 text-[9px] font-mono font-bold text-red-400 pointer-events-none select-none whitespace-nowrap shadow-sm tabular-nums z-20">
        + {outputVoltage.toFixed(1)}V
      </div>

      {/* Main Artwork Frame: Unified Pure-SVG Bakelite Battery Holder */}
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
        <BatteryHolderGraphic
          batteryCount={batteryCount}
          isDead={isDead}
          className="w-full h-full drop-shadow-md"
        />

        {isDead && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center">
            <span className="bg-void-950 text-danger-300 border border-danger-500/60 text-[8px] font-mono font-bold px-1 py-0.5 rounded shadow">
              0V / DEAD
            </span>
          </div>
        )}
      </div>

      {/* Negative Terminal Handle (-) at Bottom Lead */}
      <div className="absolute -bottom-3.5 left-[calc(50%+14px)] px-1.5 py-0.5 rounded-md bg-void-950/95 border border-control/60 text-[9px] font-mono font-bold text-slate-300 pointer-events-none select-none leading-tight shadow-sm z-20">
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
          <div className="mb-2 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="p-1 rounded-md bg-electric-500/15 text-electric-400 border border-electric-500/35">
                <BatteryCharging className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
              <div className="truncate text-xs font-bold text-ink">
                {t.title}
              </div>
            </div>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-void-950 border border-control text-ink tabular-nums">
              {batteryCount}/2 AA
            </span>
          </div>

          {hasBattery && (
            <div className="mb-2 space-y-1 tabular-nums">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-400 font-sans text-[9px]">{isIndonesian ? 'Daya Tersimpan' : 'Charge'}</span>
                <span className={`font-bold ${isDead ? 'text-danger-400' : isSagActive ? 'text-amber-400' : charge < 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {charge.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-void-950 border border-control overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isDead ? 'bg-danger-500/50' : isSagActive ? 'bg-danger-500' : charge < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${charge}%` }}
                />
              </div>
            </div>
          )}

          <div className="rounded-lg bg-void-950 p-1.5 border border-control font-mono text-xs space-y-1 mb-2 tabular-nums">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px]">{t.outputVoltage}</span>
              <span className={`font-semibold ${isDead ? 'text-danger-400' : isSagActive ? 'text-amber-400' : 'text-ink'}`}>
                {outputVoltage.toFixed(1)} V {hasBattery && '(Seri)'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px]">{t.current}</span>
              <span className={isShorted ? 'text-danger-400 font-bold' : 'text-emerald-400 font-semibold'}>
                {current < 1 ? `${(current * 1000).toFixed(0)} mA` : `${current.toFixed(2)} A`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mb-1.5">
            <button
              type="button"
              onClick={handleInsertBattery}
              disabled={batteryCount >= 2}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-electric-600 hover:bg-electric-700 disabled:bg-void-850 disabled:text-slate-400 text-white text-[10px] font-semibold transition-colors active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3" aria-hidden="true" />
              <span>{isIndonesian ? 'Pasang Sel' : 'Insert Cell'}</span>
            </button>
            <button
              type="button"
              onClick={handleEjectBattery}
              disabled={batteryCount <= 0}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-void-850 hover:bg-void-800 disabled:bg-void-950 disabled:text-slate-400 text-ink text-[10px] font-semibold border border-control transition-colors active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              <Unplug className="w-3 h-3" aria-hidden="true" />
              <span>{isIndonesian ? 'Lepas Sel' : 'Eject'}</span>
            </button>
          </div>

          <div className="text-[9px] text-center text-slate-400 leading-tight">
            {t.emptyHint}
          </div>
        </NodeInfoPopover>
      )}
    </div>
  );
};
