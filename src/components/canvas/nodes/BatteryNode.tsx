import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Battery, BatteryCharging, Zap } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { TRANSLATIONS } from '../../../i18n/translations';
import { computeEffectiveBatteryVoltage } from '../../../physics/batterySoC';

/**
 * Individual 1.5V AA Battery Node.
 * Supports dynamic State of Charge (SoC), realistic voltage sag below 20%,
 * Coulombic charging/discharging, and drag-and-drop into BatteryHolderNode.
 */
export const BatteryNode: React.FC<NodeProps<CircuitElementData>> = ({ data, selected }) => {
  const language = useCircuitStore((state) => state.language);
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

  return (
    <div
      className={`relative rounded-xl bg-void-900 border-2 transition-all duration-200 p-3 min-w-[152px] select-none ${
        isShorted
          ? 'border-danger-500 shadow-glow-danger animate-pulse'
          : selected
          ? 'border-electric-500 shadow-glow-blue'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Positive Terminal Handle (+) */}
      <Handle
        type="source"
        position={Position.Top}
        id="pos"
        className="!bg-red-500 !border-red-200 !w-4 !h-4 !-top-2"
      />
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-red-400 pointer-events-none">
        +
      </div>

      {/* Component Header */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Battery className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-100 tracking-tight">
            {t.title}
          </span>
        </div>
        <Zap
          className={`w-3.5 h-3.5 ${
            isShorted
              ? 'text-danger-500'
              : current > 0
              ? 'text-amber-400 animate-pulse'
              : 'text-slate-600'
          }`}
        />
      </div>

      {/* Cropped Transparent AA Battery Asset (266x780) */}
      <div className="flex justify-center my-1.5 py-1 bg-void-950/50 rounded-lg border border-white/5 relative">
        <img
          src="/assets/processed/battery-aa.png"
          alt="1.5V AA Battery"
          className={`w-10 h-28 object-contain pointer-events-none select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.65)] transition-opacity duration-300 ${
            isDead ? 'opacity-40 grayscale' : ''
          }`}
          draggable={false}
        />
        {isDead && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-void-950/90 text-red-400 border border-red-500/40 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow">
              {language === 'id' ? '0V / MATI' : '0V / DEAD'}
            </span>
          </div>
        )}
      </div>

      <div className="text-[9px] text-center text-slate-400 mb-1.5 italic leading-tight">
        {t.dragHint}
      </div>

      {/* State of Charge (SoC) Progress Bar & Dynamic Status Badge */}
      <div
        className="mb-2 space-y-1"
        title={`${Math.round((charge * capacity) / 100)} / ${capacity} mAh`}
      >
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

        {/* Bar Track */}
        <div className="w-full h-1.5 rounded-full bg-void-950 border border-white/10 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isDead
                ? 'bg-red-500/40'
                : isSagActive
                ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                : charge < 50
                ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
            }`}
            style={{ width: `${charge}%` }}
          />
        </div>

        {/* Dynamic Badge */}
        {chargeState === 'charging' && (
          <div className="flex items-center justify-center gap-1 py-0.5 px-1.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono font-bold animate-pulse">
            <Zap className="w-2.5 h-2.5" />
            <span>⚡ CHARGING</span>
          </div>
        )}
        {chargeState === 'discharging' && (
          <div className="flex items-center justify-center gap-1 py-0.5 px-1.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[9px] font-mono font-bold">
            <BatteryCharging className="w-2.5 h-2.5" />
            <span>🔋 DISCHARGING</span>
          </div>
        )}
      </div>

      {/* Telemetry Readout */}
      <div className="bg-void-950 rounded-lg p-2 border border-white/5 font-mono text-xs space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-[10px]">{t.voltage}</span>
          <span
            className={`font-semibold ${
              isDead ? 'text-red-400' : isSagActive ? 'text-amber-400' : 'text-slate-100'
            }`}
          >
            {effectiveVoltage.toFixed(effectiveVoltage < 1 && effectiveVoltage > 0 ? 2 : 1)} V
            {isSagActive && (
              <span className="text-[8px] font-sans ml-1 text-red-400 font-normal">
                (Sag)
              </span>
            )}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-[10px]">{t.current}</span>
          <span
            className={
              isShorted ? 'text-danger-500 font-bold' : 'text-neon-400 font-semibold'
            }
          >
            {current < 1
              ? `${(current * 1000).toFixed(0)} mA`
              : `${current.toFixed(2)} A`}
          </span>
        </div>
      </div>

      {/* Negative Terminal Handle (-) */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-blue-400 pointer-events-none">
        -
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
