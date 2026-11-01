import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Battery, BatteryCharging, RotateCcw, Zap } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { computeEffectiveBatteryVoltage } from '../../../physics/batterySoC';
import { NodeInfoPopover } from './NodeInfoPopover';

/**
 * 9V Alkaline Battery Node (`type: 'battery9v'`).
 * Clean, direct asset-first presentation (like BulbNode):
 * - Canvas shows the realistic 9V battery casing directly with top terminals.
 * - Detailed telemetry, State of Charge (SoC), and controls appear inside NodeInfoPopover on select.
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
  const updateComponentData = useCircuitStore((state) => state.updateComponentData);

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

  const formattedCurrent =
    current === 0
      ? '0 mA'
      : current < 1
      ? `${(current * 1000).toFixed(1)} mA`
      : `${current.toFixed(2)} A`;

  const handleRecharge = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateComponentData(id, {
      currentCharge: 100,
      chargeState: 'idle',
      isBlown: false,
    });
  };

  const isIndonesian = language === 'id';

  return (
    <div
      className="group relative select-none cursor-grab active:cursor-grabbing flex flex-col items-center"
      style={{
        width: 88,
        height: 124,
        overflow: 'visible',
      }}
    >
      {/* Top Positive (+) Handle — Aligned above Left Round Terminal */}
      <div
        className="absolute -top-3 -translate-x-1/2 flex flex-col items-center z-20"
        style={{ left: '34%' }}
      >
        <Handle
          type="source"
          position={Position.Top}
          id="pos"
          className="!relative !left-0 !top-0 !transform-none !bg-red-500 !border-2 !border-white !w-3.5 !h-3.5 shadow-sm"
        />
        <span className="mt-0.5 text-[8px] font-mono font-bold text-red-400 pointer-events-none select-none">
          +
        </span>
      </div>

      {/* Top Negative (-) Handle — Aligned above Right Hexagonal Terminal */}
      <div
        className="absolute -top-3 -translate-x-1/2 flex flex-col items-center z-20"
        style={{ left: '66%' }}
      >
        <Handle
          type="source"
          position={Position.Top}
          id="neg"
          className="!relative !left-0 !top-0 !transform-none !bg-slate-700 !border-2 !border-white !w-3.5 !h-3.5 shadow-sm"
        />
        <span className="mt-0.5 text-[8px] font-mono font-bold text-slate-400 pointer-events-none select-none">
          -
        </span>
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
          src="/assets/battery-9v.png"
          alt={data.label || 'Baterai 9V'}
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
      </div>

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
                {isIndonesian ? 'Baterai Kotak 9V' : '9V Alkaline Battery'}
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
              <span className="text-slate-400 font-sans text-[9px]">
                {isIndonesian ? 'Daya Tersimpan' : 'Charge'}
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
              <span className="text-slate-400 text-[10px]">
                {isIndonesian ? 'Tegangan' : 'Voltage'}
              </span>
              <span className={`font-semibold ${isDead ? 'text-red-400' : isSagActive ? 'text-amber-400' : 'text-slate-100'}`}>
                {effectiveVoltage.toFixed(effectiveVoltage < 1 && effectiveVoltage > 0 ? 2 : 1)} V
                {isSagActive && <span className="text-[8px] font-sans ml-1 text-red-400 font-normal">(Sag)</span>}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px]">
                {isIndonesian ? 'Arus Beban' : 'Current'}
              </span>
              <span className={isShorted ? 'text-red-400 font-bold' : 'text-emerald-400 font-semibold'}>
                {formattedCurrent}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-400 font-sans">
                {isIndonesian ? 'Hambatan Dalam' : 'Internal R'}
              </span>
              <span className="text-slate-300 font-mono">{internalResistance.toFixed(1)} Ω</span>
            </div>
          </div>

          {/* Quick Actions */}
          {isDead && (
            <button
              type="button"
              onClick={handleRecharge}
              className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isIndonesian ? 'Isi Ulang 100%' : 'Recharge 100%'}</span>
            </button>
          )}
        </NodeInfoPopover>
      )}
    </div>
  );
};
