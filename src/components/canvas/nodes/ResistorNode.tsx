import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Activity } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';

export const ResistorNode: React.FC<NodeProps<CircuitElementData>> = ({ id, data, selected }) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const current = Math.abs(simulation.branchCurrents[id] ?? 0);
  const resistance = data.resistance ?? 100;
  const voltageDrop = current * resistance;
  const power = voltageDrop * current;

  return (
    <div
      className={`relative rounded-xl border bg-void-900 px-4 py-3 shadow-2xl transition-all duration-150 min-w-[170px] ${
        selected ? 'border-electric-500 shadow-glow' : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Terminal 1 Handle (Left) */}
      <div className="absolute top-1/2 -left-3 -translate-y-1/2 flex items-center z-10">
        <Handle
          type="source"
          position={Position.Left}
          id="p1"
          className="!bg-void-800 !border-amber-400 !w-3 !h-3"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-200 tracking-tight">Resistor</span>
        </div>
        <span className="text-[10px] font-mono font-medium text-amber-400">
          {resistance >= 1000 ? `${(resistance / 1000).toFixed(1)}kΩ` : `${resistance}Ω`}
        </span>
      </div>

      {/* Realistic Processed Resistor Asset */}
      <div className="flex justify-center items-center py-1">
        <div className="relative w-36 h-12 flex items-center justify-center">
          <img
            src="/assets/processed/resistor.png"
            alt="Axial Resistor"
            className="w-full h-full object-contain pointer-events-none select-none drop-shadow-sm"
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="bg-void-950/80 rounded-lg p-2 border border-white/5 space-y-1 mt-1 text-[10px]">
        <div className="flex justify-between items-baseline font-mono">
          <span className="text-slate-400">Voltage:</span>
          <span className="text-slate-200">{voltageDrop.toFixed(2)} V</span>
        </div>
        <div className="flex justify-between items-baseline font-mono">
          <span className="text-slate-400">Current:</span>
          <span className="text-electric-400">
            {current < 1 ? `${(current * 1000).toFixed(0)} mA` : `${current.toFixed(2)} A`}
          </span>
        </div>
        <div className="flex justify-between items-baseline font-mono">
          <span className="text-slate-400">Power:</span>
          <span className="text-slate-400">
            {power < 1 ? `${(power * 1000).toFixed(0)} mW` : `${power.toFixed(2)} W`}
          </span>
        </div>
      </div>

      {/* Terminal 2 Handle (Right) */}
      <div className="absolute top-1/2 -right-3 -translate-y-1/2 flex items-center z-10">
        <Handle
          type="source"
          position={Position.Right}
          id="p2"
          className="!bg-void-800 !border-amber-400 !w-3 !h-3"
        />
      </div>
    </div>
  );
};
