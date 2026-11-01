import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CircuitElementData } from '../../../types/circuit';

export const GroundNode: React.FC<NodeProps<CircuitElementData>> = ({ selected }) => {
  return (
    <div
      className={`relative rounded-xl border bg-void-900 px-3 py-2.5 shadow-2xl transition-all duration-150 min-w-[110px] flex flex-col items-center ${
        selected ? 'border-amber-400 outline outline-1 outline-offset-2 outline-amber-400' : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Ground Terminal Handle (Top) */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <Handle
          type="source"
          position={Position.Top}
          id="gnd"
          className="!bg-emerald-500 !border-emerald-300"
        />
      </div>

      <span className="text-[11px] font-semibold text-slate-300 tracking-tight mt-1">Ground (0V)</span>

      {/* Earth Ground Symbol */}
      <div className="py-2">
        <svg width="40" height="28" viewBox="0 0 40 28" className="stroke-emerald-400">
          <line x1="20" y1="0" x2="20" y2="12" strokeWidth="2" strokeLinecap="round" />
          <line x1="6" y1="12" x2="34" y2="12" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="12" y1="18" x2="28" y2="18" strokeWidth="2" strokeLinecap="round" />
          <line x1="17" y1="24" x2="23" y2="24" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};
