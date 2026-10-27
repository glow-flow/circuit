import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Lightbulb, RotateCcw } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';

export const BulbNode: React.FC<NodeProps<CircuitElementData>> = ({ id, data, selected }) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const updateComponentData = useCircuitStore((state) => state.updateComponentData);

  const current = Math.abs(simulation.branchCurrents[id] ?? 0);
  const resistance = data.resistance ?? 20;
  const power = current * current * resistance; // Watts (P = I²R)
  const isBlown = data.isBlown || current > 2.5;

  // Normalized brightness factor between 0.0 and 1.0 (reaches full glow around 3-5 Watts)
  const brightness = Math.min(1.0, power / 4.0);

  const handleResetBulb = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateComponentData(id, { isBlown: false });
  };

  return (
    <div
      className={`relative rounded-xl border bg-void-900 px-4 py-3 shadow-2xl transition-all duration-150 min-w-[170px] ${
        selected ? 'border-electric-500 shadow-glow' : 'border-white/10 hover:border-white/20'
      } ${isBlown ? 'border-red-900/60' : ''}`}
    >
      {/* Terminal 1 Handle (Left) */}
      <div className="absolute top-1/2 -left-3 -translate-y-1/2 flex items-center">
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
          <div
            className={`p-1 rounded transition-colors duration-300 ${
              isBlown
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : brightness > 0.05
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                : 'bg-void-800 text-slate-400 border border-white/5'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-200 tracking-tight">Lamp Bulb</span>
        </div>
        {isBlown && (
          <button
            onClick={handleResetBulb}
            title="Reset blown filament"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-950/80 hover:bg-red-900 border border-red-800 text-[9px] text-red-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-2.5 h-2.5" /> Reset
          </button>
        )}
      </div>

      {/* Real Lamp Asset with CSS mix-blend-mode: screen (preserving pristine glow) */}
      <div className="flex flex-col items-center justify-center py-1 relative overflow-hidden">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <img
            src="/assets/bulb-on.png"
            alt="Lamp Bulb"
            className="w-full h-full object-contain pointer-events-none select-none"
            style={{
              mixBlendMode: 'screen',
              transition: 'filter 300ms, opacity 300ms',
              filter: isBlown
                ? 'grayscale(100%) brightness(0.5)'
                : brightness > 0.05
                ? `brightness(${1 + brightness * 0.4}) saturate(1.2)`
                : 'grayscale(85%) brightness(0.45)',
              opacity: isBlown ? 0.3 : brightness > 0 ? Math.min(1.0, 0.5 + brightness * 0.5) : 0.5,
            }}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="bg-void-950/80 rounded-lg p-2 border border-white/5 space-y-1 text-[10px] font-mono">
        <div className="flex justify-between items-baseline">
          <span className="text-slate-400 font-sans">Brightness:</span>
          <span
            className={
              isBlown
                ? 'text-red-400 font-bold'
                : brightness > 0
                ? 'text-amber-300 font-bold'
                : 'text-slate-500'
            }
          >
            {isBlown ? '0% (Burned)' : `${(brightness * 100).toFixed(0)}%`}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-slate-400 font-sans">Power:</span>
          <span className="text-slate-200">{power.toFixed(2)} W</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-slate-400 font-sans">Current:</span>
          <span className="text-electric-400">
            {current < 1 ? `${(current * 1000).toFixed(0)} mA` : `${current.toFixed(2)} A`}
          </span>
        </div>
      </div>

      {/* Terminal 2 Handle (Right) */}
      <div className="absolute top-1/2 -right-3 -translate-y-1/2 flex items-center">
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
