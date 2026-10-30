import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Zap, AlertTriangle, BatteryCharging } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { computeEffectiveBatteryVoltage } from '../../../physics/batterySoC';

/**
 * 9V Alkaline Battery Node (`type: 'battery9v'`).
 *
 * Features:
 * - High-voltage DC source (nominal 9.0V, internal resistance 2.0Ω) ideal for high-wattage bulbs.
 * - Top-mounted Positive (+) and Negative (-) terminals aligned directly with the
 *   round (left) and hexagonal (right) snap connectors on the 9V battery casing.
 * - Dynamic State of Charge (SoC): Coulombic charging/discharging and realistic voltage sag.
 * - Real-time current telemetry (mA / A), battery percentage bar, and status badge.
 *
 * Time Complexity: O(1) render.
 */
export const Battery9VNode: React.FC<NodeProps<CircuitElementData>> = ({
  id,
  data,
  selected,
}) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);

  const rawNominalVoltage = data.voltage ?? 9.0;
  const internalResistance = data.internalResistance ?? 2.0;
  const current = Math.abs(simulation.branchCurrents[id] ?? 0);
  const isShorted = simulation.shortCircuitBranches.includes(id);

  const charge = Math.max(0, Math.min(100, data.currentCharge ?? 100));
  const capacity = data.capacity ?? 500;
  const chargeState = data.chargeState ?? 'idle';

  const effectiveVoltage =
    data.calculatedVoltage ?? computeEffectiveBatteryVoltage(rawNominalVoltage, charge);

  const isDead = charge <= 0;
  const isSagActive = charge > 0 && charge < 20;

  // Format current cleanly in mA when < 1A, or A when >= 1A
  const formattedCurrent =
    current === 0
      ? '0 mA'
      : current < 1
      ? `${(current * 1000).toFixed(1)} mA`
      : `${current.toFixed(2)} A`;

  return (
    <div
      className={`relative rounded-xl border bg-void-900 px-3.5 pt-5 pb-3 shadow-2xl transition-all duration-150 w-[172px] select-none ${
        isShorted
          ? 'border-danger-500 shadow-glow-danger animate-pulse'
          : selected
          ? 'border-electric-500 shadow-glow'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Top Positive (+) Handle — Aligned above Left Round Terminal */}
      <div
        className="absolute -top-3 -translate-x-1/2 flex flex-col items-center z-20"
        style={{ left: '37%' }}
      >
        <Handle
          type="source"
          position={Position.Top}
          id="pos"
          className="!relative !left-0 !top-0 !transform-none !bg-red-500 !border-2 !border-white !w-3.5 !h-3.5 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
        />
        <span className="mt-0.5 px-1 py-0 rounded bg-red-500/20 border border-red-500/40 text-[9px] font-mono font-bold text-red-400 leading-tight pointer-events-none">
          +
        </span>
      </div>

      {/* Top Negative (-) Handle — Aligned above Right Hexagonal Terminal */}
      <div
        className="absolute -top-3 -translate-x-1/2 flex flex-col items-center z-20"
        style={{ left: '63%' }}
      >
        <Handle
          type="source"
          position={Position.Top}
          id="neg"
          className="!relative !left-0 !top-0 !transform-none !bg-sky-400 !border-2 !border-white !w-3.5 !h-3.5 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
        />
        <span className="mt-0.5 px-1 py-0 rounded bg-sky-500/20 border border-sky-500/40 text-[9px] font-mono font-bold text-sky-300 leading-tight pointer-events-none">
          -
        </span>
      </div>

      {/* 9V Battery Die-Cut Transparent Image */}
      <div className="flex flex-col items-center justify-center pt-1 pb-2 relative">
        <div className="relative w-24 h-32 flex items-center justify-center">
          <img
            src="/assets/battery-9v.png"
            alt={data.label || 'Baterai 9V'}
            className={`w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_6px_14px_rgba(0,0,0,0.75)] transition-opacity duration-300 ${
              isDead ? 'opacity-40 grayscale' : ''
            }`}
          />
          {isDead && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-void-950/90 text-red-400 border border-red-500/40 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow">
                {language === 'id' ? '0V / HABIS' : '0V / DEAD'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Header Label & Effective Voltage Badge */}
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <div className="flex items-center gap-1 min-w-0">
          <div
            className={`p-1 rounded shrink-0 ${
              isShorted
                ? 'bg-danger-500/20 text-danger-500'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}
          >
            {isShorted ? (
              <AlertTriangle className="w-3 h-3" />
            ) : (
              <Zap className="w-3 h-3" />
            )}
          </div>
          <span className="text-[11px] font-bold text-slate-100 tracking-tight truncate">
            {language === 'id' ? 'Baterai 9V' : '9V Battery'}
          </span>
        </div>
        <span
          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
            isDead
              ? 'bg-red-500/15 text-red-400 border-red-500/30'
              : isSagActive
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          }`}
        >
          {effectiveVoltage.toFixed(1)} V
        </span>
      </div>

      {/* State of Charge (SoC) Percentage Bar & Status Badge */}
      <div
        className="mb-2 space-y-1"
        title={`${Math.round((charge * capacity) / 100)} / ${capacity} mAh`}
      >
        <div className="flex justify-between items-center text-[10px] font-mono">
          <span className="text-slate-400 font-sans text-[9px]">
            {language === 'id' ? 'Daya (SoC):' : 'Charge:'}
          </span>
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

        {/* Progress Bar Track */}
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

      {/* Live Telemetry Readout */}
      <div className="bg-void-950/85 rounded-lg p-2 border border-white/5 space-y-1 text-[10px] font-mono">
        <div className="flex justify-between items-baseline">
          <span className="text-slate-400 font-sans">
            {language === 'id' ? 'Arus:' : 'Current:'}
          </span>
          <span
            className={
              isShorted
                ? 'text-danger-500 font-bold'
                : current > 0
                ? 'text-electric-400 font-bold'
                : 'text-slate-400'
            }
          >
            {formattedCurrent}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-slate-400 font-sans">
            {language === 'id' ? 'Hambatan Dlm:' : 'Int. Res:'}
          </span>
          <span className="text-slate-300">{internalResistance.toFixed(1)} Ω</span>
        </div>
      </div>
    </div>
  );
};
