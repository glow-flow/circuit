import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Battery, BatteryCharging, RotateCcw, Zap } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { TRANSLATIONS } from '../../../i18n/translations';
import { computeEffectiveBatteryVoltage } from '../../../physics/batterySoC';
import { NodeInfoPopover } from './NodeInfoPopover';
import { BatteryAAGraphic } from '../../ui/common/LabComponentArt';

/**
 * Individual 1.5V AA Battery Node.
 * Clean, direct vector-instrument presentation:
 * - Canvas shows the unified SVG AA battery cell directly with top (+) and bottom (-) terminals.
 * - Detailed telemetry, State of Charge (SoC), and controls appear inside NodeInfoPopover on select.
 *
 * Time Complexity: O(1) render.
 */
export const BatteryNode: React.FC<NodeProps<CircuitElementData>> = ({ id, data, selected }) => {
  const language = useCircuitStore((state) => state.language);
  const updateComponentData = useCircuitStore((state) => state.updateComponentData);
  const t = TRANSLATIONS[language].nodes.battery;

  const isShorted = data.isShortCircuit;
  const current = Math.abs(data.calculatedCurrent ?? 0);
  const rawVoltage = data.voltage ?? 1.5;
  const charge = Math.max(0, Math.min(100, data.currentCharge ?? 100));
  const capacity = data.capacity ?? 1000;
  const chargeState = data.chargeState ?? 'idle';

  // Effective voltage taking realistic voltage sag into account
  const effectiveVoltage =
    data.calculatedVoltage ?? computeEffectiveBatteryVoltage(rawVoltage, charge);

  const isDead = charge <= 0;
  const isSagActive = charge > 0 && charge < 20;

  const handleRecharge = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateComponentData(id, {
      currentCharge: 100,
      chargeState: 'idle',
      isBlown: false,
    });
  };

  return (
    <div
      className="group relative select-none cursor-grab active:cursor-grabbing flex flex-col items-center"
      style={{
        width: 48,
        height: 136,
        overflow: 'visible',
      }}
    >
      {/* Positive Terminal Handle (+) at Top */}
      <Handle
        type="source"
        position={Position.Top}
        id="pos"
        className="!bg-red-500 !border-2 !border-white !w-3.5 !h-3.5 !-top-1.5 z-20 shadow-sm"
      />
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1 rounded bg-void-950/90 border border-red-500/40 text-[9px] font-mono font-bold text-red-400 pointer-events-none select-none leading-tight">
        +
      </div>

      {/* Main Artwork Frame: Unified Pure-SVG Hardware Instrument */}
      <div
        className={`relative flex h-full w-full items-center justify-center rounded-lg outline outline-1 outline-offset-2 transition-all duration-150 ${
          isShorted
            ? 'outline-red-500'
            : selected
            ? 'outline-amber-400 shadow-md'
            : 'outline-transparent group-hover:outline-slate-400/50'
        }`}
        style={{ zIndex: 10 }}
      >
        <BatteryAAGraphic isDead={isDead} className="h-full w-full drop-shadow-md" />

        {/* Dead Battery Indicator Badge */}
        {isDead && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
            <span className="bg-void-950 text-danger-300 border border-danger-500/60 text-[8px] font-mono font-bold px-1 py-0.5 rounded shadow">
              0V / DEAD
            </span>
          </div>
        )}

        {/* Active Charging Indicator Badge on Canvas */}
        {chargeState === 'charging' && (
          <div className="absolute -top-1 -right-3 z-30 pointer-events-none">
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/70 text-emerald-300 text-[8px] font-mono font-bold shadow-md tabular-nums whitespace-nowrap">
              +{charge.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Negative Terminal Handle (-) at Bottom */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-1 rounded bg-void-950/90 border border-control/60 text-[9px] font-mono font-bold text-slate-300 pointer-events-none select-none leading-tight">
        -
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="neg"
        className="!bg-slate-700 !border-2 !border-white !w-3.5 !h-3.5 !-bottom-1.5 z-20 shadow-sm"
      />

      {/* Detailed Telemetry & Controls: ONLY when selected */}
      {selected && (
        <NodeInfoPopover placement="bottom" width={204}>
          <div className="mb-2 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="p-1 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/35">
                <Battery className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
              <div className="truncate text-xs font-bold text-ink">
                {t.title}
              </div>
            </div>
            <Zap
              aria-hidden="true"
              className={`w-3.5 h-3.5 shrink-0 ${
                isShorted
                  ? 'text-danger-500'
                  : current > 0
                  ? 'text-amber-400'
                  : 'text-slate-400'
              }`}
            />
          </div>

          {/* SoC Progress Bar */}
          <div className="mb-2 space-y-1 tabular-nums" title={`${Math.round((charge * capacity) / 100)} / ${capacity} mAh`}>
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-slate-400 font-sans text-[9px]">{t.charge}</span>
              <div className="flex items-center gap-1">
                <span
                  className={`font-bold ${
                    isDead
                      ? 'text-danger-400'
                      : isSagActive
                      ? 'text-amber-400'
                      : charge < 50
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {charge.toFixed(0)}%
                </span>
                <span className="text-[8px] text-slate-400 font-mono">
                  ({Math.round((charge * capacity) / 100)} mAh)
                </span>
              </div>
            </div>

            <div className="w-full h-1.5 rounded-full bg-void-950 border border-control overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isDead
                    ? 'bg-danger-500/50'
                    : isSagActive
                    ? 'bg-danger-500'
                    : charge < 50
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${charge}%` }}
              />
            </div>

            {chargeState === 'charging' && (
              <div className="flex items-center justify-center gap-1 py-0.5 px-1 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[9px] font-mono font-bold">
                <Zap className="w-2.5 h-2.5" aria-hidden="true" />
                <span>CHARGING</span>
              </div>
            )}
            {chargeState === 'discharging' && (
              <div className="flex items-center justify-center gap-1 py-0.5 px-1 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[9px] font-mono font-bold">
                <BatteryCharging className="w-2.5 h-2.5" aria-hidden="true" />
                <span>DISCHARGING</span>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-void-950 p-1.5 border border-control font-mono text-xs space-y-1 mb-2 tabular-nums">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px]">{t.voltage}</span>
              <span className={`font-semibold ${isDead ? 'text-danger-400' : isSagActive ? 'text-amber-400' : 'text-ink'}`}>
                {effectiveVoltage.toFixed(effectiveVoltage < 1 && effectiveVoltage > 0 ? 2 : 1)} V
                {isSagActive && <span className="text-[8px] font-sans ml-1 text-danger-400 font-normal">(Sag)</span>}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px]">{t.current}</span>
              <span className={isShorted ? 'text-danger-400 font-bold' : 'text-emerald-400 font-semibold'}>
                {current < 1 ? `${(current * 1000).toFixed(0)} mA` : `${current.toFixed(2)} A`}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            {isDead && (
              <button
                type="button"
                onClick={handleRecharge}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>{language === 'id' ? 'Isi Ulang 100%' : 'Recharge 100%'}</span>
              </button>
            )}
            <div className="text-[9px] text-center text-slate-400 leading-tight">
              {t.dragHint}
            </div>
          </div>
        </NodeInfoPopover>
      )}
    </div>
  );
};
