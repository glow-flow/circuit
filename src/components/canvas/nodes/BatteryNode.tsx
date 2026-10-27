import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Battery, Zap, AlertTriangle } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';

export const BatteryNode: React.FC<NodeProps<CircuitElementData>> = ({ id, data, selected }) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const current = simulation.branchCurrents[id] ?? 0;
  const isShortCircuit = simulation.shortCircuitBranches.includes(id);

  return (
    <div
      className={`relative rounded-xl border bg-void-900 px-4 py-3 shadow-2xl transition-all duration-150 min-w-[160px] ${
        selected ? 'border-electric-500 shadow-glow' : 'border-white/10 hover:border-white/20'
      } ${isShortCircuit ? 'border-danger-500 shadow-glow-danger animate-pulse' : ''}`}
    >
      {/* Positive Terminal Handle (Top) */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
        <span className="text-[10px] font-bold text-red-400 font-mono select-none drop-shadow">+</span>
        <Handle
          type="source"
          position={Position.Top}
          id="pos"
          className="handle-positive !bg-red-500 !border-red-300 !w-3 !h-3"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded bg-electric-500/10 text-electric-400 border border-electric-500/20">
            <Battery className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-200 tracking-tight">DC Battery</span>
        </div>
        {isShortCircuit ? (
          <div className="flex items-center gap-1 text-danger-500 text-[10px] font-bold uppercase animate-bounce">
            <AlertTriangle className="w-3.5 h-3.5" /> Short
          </div>
        ) : (
          <Zap className="w-3.5 h-3.5 text-amber-400" />
        )}
      </div>

      {/* Realistic Processed Battery Asset */}
      <div className="flex justify-center items-center py-1">
        <div className="relative w-14 h-24 flex items-center justify-center">
          <img
            src="/assets/processed/battery-aa.png"
            alt="AA Battery Cell"
            className="w-full h-full object-contain pointer-events-none select-none drop-shadow-md"
          />
        </div>
      </div>

      {/* Battery Voltage Body */}
      <div className="bg-void-950/80 rounded-lg p-2 border border-white/5 space-y-1">
        <div className="flex justify-between items-baseline">
          <span className="text-[10px] text-slate-400 font-medium">Voltage:</span>
          <span className="text-xs font-mono font-bold text-slate-100">
            {data.voltage?.toFixed(1) ?? '9.0'} V
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
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
        <Handle
          type="source"
          position={Position.Bottom}
          id="neg"
          className="handle-negative !bg-blue-500 !border-blue-300 !w-3 !h-3"
        />
        <span className="text-[10px] font-bold text-blue-400 font-mono select-none drop-shadow">-</span>
      </div>
    </div>
  );
};
