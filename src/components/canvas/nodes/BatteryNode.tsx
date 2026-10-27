import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Battery, Zap } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { TRANSLATIONS } from '../../../i18n/translations';

/**
 * Individual 1.5V AA Battery Node.
 * Can be wired directly into a circuit OR dragged and dropped onto a BatteryHolderNode.
 */
export const BatteryNode: React.FC<NodeProps<CircuitElementData>> = ({ data, selected }) => {
  const language = useCircuitStore((state) => state.language);
  const t = TRANSLATIONS[language].nodes.battery;

  const isShorted = data.isShortCircuit;
  const current = Math.abs(data.calculatedCurrent ?? 0);
  const nominalVoltage = data.voltage ?? 1.5;

  return (
    <div
      className={`relative rounded-xl bg-void-900 border-2 transition-all duration-200 p-3 min-w-[142px] select-none ${
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
      <div className="flex justify-center my-1.5 py-1 bg-void-950/50 rounded-lg border border-white/5">
        <img
          src="/assets/processed/battery-aa.png"
          alt="1.5V AA Battery"
          className="w-10 h-28 object-contain pointer-events-none select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.65)]"
          draggable={false}
        />
      </div>

      <div className="text-[9px] text-center text-slate-400 mb-1.5 italic leading-tight">
        {t.dragHint}
      </div>

      {/* Telemetry Readout */}
      <div className="bg-void-950 rounded-lg p-2 border border-white/5 font-mono text-xs space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-[10px]">{t.voltage}</span>
          <span className="text-amber-400 font-semibold">{nominalVoltage.toFixed(1)} V</span>
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
