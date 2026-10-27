import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';

export const SwitchNode: React.FC<NodeProps<CircuitElementData>> = ({ id, data, selected }) => {
  const toggleSwitch = useCircuitStore((state) => state.toggleSwitch);
  const isOpen = data.isOpen ?? false;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSwitch(id);
  };

  return (
    <div
      className={`relative rounded-xl border bg-void-900 px-4 py-3 shadow-2xl transition-all duration-150 min-w-[150px] ${
        selected ? 'border-electric-500 shadow-glow' : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Terminal 1 Handle (Left) */}
      <div className="absolute top-1/2 -left-3 -translate-y-1/2 flex items-center">
        <Handle
          type="source"
          position={Position.Left}
          id="p1"
          className="!bg-void-800 !border-slate-400"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-200 tracking-tight">SPST Switch</span>
        <span
          className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
            isOpen
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}
        >
          {isOpen ? 'OPEN' : 'CLOSED'}
        </span>
      </div>

      {/* Switch Interactive Visual Contact */}
      <button
        onClick={handleToggle}
        className="w-full flex flex-col items-center justify-center p-2 rounded-lg bg-void-950/80 border border-white/5 hover:border-white/20 active:scale-95 transition-all cursor-pointer group"
        title="Click to toggle switch state"
      >
        <svg width="70" height="30" viewBox="0 0 70 30" className="stroke-current">
          {/* Terminal points */}
          <circle cx="15" cy="15" r="3.5" fill="#3B82F6" stroke="none" />
          <circle cx="55" cy="15" r="3.5" fill="#3B82F6" stroke="none" />
          
          {/* Switch Blade Arm */}
          {isOpen ? (
            <line
              x1="15"
              y1="15"
              x2="48"
              y2="4"
              stroke="#F59E0B"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="transition-all duration-200"
            />
          ) : (
            <line
              x1="15"
              y1="15"
              x2="55"
              y2="15"
              stroke="#10B981"
              strokeWidth="2.8"
              strokeLinecap="round"
              className="transition-all duration-200"
            />
          )}
        </svg>

        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 group-hover:text-slate-200">
          {isOpen ? <ToggleLeft className="w-3.5 h-3.5 text-amber-400" /> : <ToggleRight className="w-3.5 h-3.5 text-emerald-400" />}
          <span>Toggle Switch</span>
        </div>
      </button>

      {/* Terminal 2 Handle (Right) */}
      <div className="absolute top-1/2 -right-3 -translate-y-1/2 flex items-center">
        <Handle
          type="source"
          position={Position.Right}
          id="p2"
          className="!bg-void-800 !border-slate-400"
        />
      </div>
    </div>
  );
};
