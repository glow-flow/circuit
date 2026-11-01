import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Battery, BatteryCharging, RotateCcw, Zap } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { TRANSLATIONS } from '../../../i18n/translations';
import { computeEffectiveBatteryVoltage } from '../../../physics/batterySoC';
import { NodeInfoPopover } from './NodeInfoPopover';

/**
 * Individual 1.5V AA Battery Node.
 * Clean, direct asset-first presentation (like BulbNode):
 * - Canvas shows the realistic AA battery cell directly with top (+) and bottom (-) terminals.
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
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-red-400 pointer-events-none select-none">
        +
      </div>

      {/* Main Artwork Frame: Crisp Direct Asset */}
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
        <img
          src="/assets/processed/battery-aa.png"
          alt="1.5V AA Battery"
          draggable={false}
          className={`h-full w-full object-contain pointer-events-none select-none drop-shadow-md transition-opacity duration-300 ${
            isDead ? 'opacity-40 grayscale' : 'opacity-95'
          }`}
        />

        {/* Dead Battery Indicator Badge */}
        {isDead && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
            <span className="bg-void-950/90 text-red-400 border border-red-500/40 text-[8px] font-mono font-bold px-1 py-0.5 rounded shadow">
              0V / DEAD
            </span>
          </div>
        )}

        {/* Active Charging Indicator Badge on Canvas */}
        {chargeState === 'charging' && (
          <div className="absolute -top-1 -right-3 z-30 pointer-events-none">
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-950/95 border border-emerald-500/70 text-emerald-300 text-[8px] font-mono font-bold shadow-md shadow-emerald-950/60 animate-pulse whitespace-nowrap">
              ⚡ +{charge.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Negative Terminal Handle (-) at Bottom */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-slate-400 pointer-events-none select-none">
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
          {/* Header */}
          <div className="mb-2 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="p-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Battery className="w-3.5 h-3.5" />
              </div>
              <div className="truncate text-xs font-bold text-slate-100">
                {t.title}
              </div>
            </div>
            <Zap
              className={`w-3.5 h-3.5 shrink-0 ${
                isShorted
                  ? 'text-red-500'
                  : current > 0
                  ? 'text-amber-400 animate-pulse'
                  : 'text-slate-500'
              }`}
            />
          </div>

          {/* SoC Progress Bar */}
          <div className="mb-2 space-y-1" title={`${Math.round((charge * capacity) / 100)} / ${capacity} mAh`}>
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-slate-400 font-sans text-[9px]">{t.charge}</span>
              <div className="flex items-center gap-1">
                <span
                  className={`font-bold ${
                    isDead
                      ? 'text-red-400'
                      : isSagActive
                      ? 'text-amber-400'
                      : charge < 50
                      ? 'text-yellow-400'
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

            <div className="w-full h-1.5 rounded-full bg-void-950 border border-white/10 overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isDead
                    ? 'bg-red-500/40'
                    : isSagActive
                    ? 'bg-red-500'
                    : charge < 50
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${charge}%` }}
              />
            </div>

            {chargeState === 'charging' && (
              <div className="flex items-center justify-center gap-1 py-0.5 px-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono font-bold">
                <Zap className="w-2.5 h-2.5" />
                <span>CHARGING</span>
              </div>
            )}
            {chargeState === 'discharging' && (
              <div className="flex items-center justify-center gap-1 py-0.5 px-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[9px] font-mono font-bold">
                <BatteryCharging className="w-2.5 h-2.5" />
                <span>DISCHARGING</span>
              </div>
            )}
          </div>

          {/* Electrical Readout */}
          <div className="rounded-lg bg-void-950 p-1.5 border border-white/10 font-mono text-xs space-y-1 mb-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px]">{t.voltage}</span>
              <span className={`font-semibold ${isDead ? 'text-red-400' : isSagActive ? 'text-amber-400' : 'text-slate-100'}`}>
                {effectiveVoltage.toFixed(effectiveVoltage < 1 && effectiveVoltage > 0 ? 2 : 1)} V
                {isSagActive && <span className="text-[8px] font-sans ml-1 text-red-400 font-normal">(Sag)</span>}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px]">{t.current}</span>
              <span className={isShorted ? 'text-red-400 font-bold' : 'text-emerald-400 font-semibold'}>
                {current < 1 ? `${(current * 1000).toFixed(0)} mA` : `${current.toFixed(2)} A`}
              </span>
            </div>
          </div>

          {/* Quick Actions & Drag Hint */}
          <div className="space-y-1.5">
            {isDead && (
              <button
                type="button"
                onClick={handleRecharge}
                className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === 'id' ? 'Isi Ulang 100%' : 'Recharge 100%'}</span>
              </button>
            )}
            <div className="text-[9px] text-center text-slate-400 italic leading-tight">
              {t.dragHint}
            </div>
          </div>
        </NodeInfoPopover>
      )}
    </div>
  );
};
