import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ShieldAlert, Zap } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';

export const AmmeterNode: React.FC<NodeProps<CircuitElementData>> = ({ id, selected }) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const current = simulation.branchCurrents[id] ?? 0;
  const isShortCircuit = simulation.shortCircuitBranches.includes(id);

  return (
    <div
      className={`relative rounded-xl border bg-void-900 px-4 py-3 shadow-2xl transition-all duration-150 min-w-[160px] ${
        selected ? 'border-electric-500 shadow-glow' : 'border-white/10 hover:border-white/20'
      } ${isShortCircuit ? 'border-danger-500 shadow-glow-danger' : ''}`}
    >
      {/* Input Handle (Left) */}
      <div className="absolute top-1/2 -left-3 -translate-y-1/2 flex items-center">
        <Handle
          type="source"
          position={Position.Left}
          id="p1"
          className="!bg-void-800 !border-neon-400"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded bg-neon-500/10 text-neon-400 border border-neon-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-200 tracking-tight">Ammeter</span>
        </div>
        {isShortCircuit ? (
          <span className="flex items-center gap-1 text-[9px] font-bold text-danger-500 uppercase">
            <ShieldAlert className="w-3 h-3" /> OVERLOAD
          </span>
        ) : (
          <span className="text-[9px] font-mono text-slate-400 uppercase">1mΩ In-line</span>
        )}
      </div>

      {/* Digital LCD Segment Display */}
      <div className="bg-[#050507] rounded-lg p-2.5 border border-white/10 flex flex-col items-center justify-center shadow-inner">
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest self-start">
          CURRENT
        </span>
        <div
          className={`text-lg font-mono font-bold tracking-wider ${
            isShortCircuit ? 'text-danger-500 animate-pulse' : 'text-neon-400'
          }`}
        >
          {Math.abs(current) < 1
            ? `${(Math.abs(current) * 1000).toFixed(1)} mA`
            : `${Math.abs(current).toFixed(3)} A`}
        </div>
      </div>

      {/* Output Handle (Right) */}
      <div className="absolute top-1/2 -right-3 -translate-y-1/2 flex items-center">
        <Handle
          type="source"
          position={Position.Right}
          id="p2"
          className="!bg-void-800 !border-neon-400"
        />
      </div>
    </div>
  );
};
