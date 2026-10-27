import React from 'react';
import { Zap, Trash2, BookOpen, AlertOctagon, RotateCcw } from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';

export const Header: React.FC = () => {
  const simulation = useCircuitStore((state) => state.simulation);
  const clearCanvas = useCircuitStore((state) => state.clearCanvas);
  const loadPreset = useCircuitStore((state) => state.loadPreset);
  const runSimulation = useCircuitStore((state) => state.runSimulation);

  return (
    <header className="h-14 border-b border-white/10 bg-void-900 px-4 flex items-center justify-between z-20 shrink-0">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-electric-500/15 border border-electric-500/30 text-electric-400 shadow-glow">
          <Zap className="w-4 h-4 fill-electric-400" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2">
            Circuit Sandbox
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-electric-500/10 text-electric-400 border border-electric-500/20 font-medium">
              MNA Physics v1.0
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Real-time interactive nodal circuit simulator
          </p>
        </div>
      </div>

      {/* Center Presets Dropdown */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1">
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Presets:</span>
        </div>
        <select
          onChange={(e) => {
            if (e.target.value) {
              loadPreset(e.target.value as any);
              e.target.value = '';
            }
          }}
          defaultValue=""
          className="text-xs bg-void-950 border border-white/10 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-electric-500 transition-colors cursor-pointer"
        >
          <option value="" disabled>
            Select a Circuit Example...
          </option>
          <option value="simple-lamp">Simple Lamp & Switch</option>
          <option value="voltage-divider">Voltage Divider (Ohm's Law)</option>
          <option value="parallel-bulbs">Parallel Light Bulbs</option>
          <option value="short-circuit-demo">Dead Short Circuit Demo</option>
        </select>

        <button
          onClick={runSimulation}
          className="p-1.5 rounded-lg bg-void-850 hover:bg-void-800 border border-white/10 text-slate-300 hover:text-white transition-all active:scale-95"
          title="Re-run MNA Solver"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right Circuit Health & Actions */}
      <div className="flex items-center gap-3">
        {simulation.isShortCircuit ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger-500/15 border border-danger-500/40 text-danger-500 text-xs font-semibold animate-pulse shadow-glow-danger">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>SHORT CIRCUIT DETECTED (&gt;10A)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>MNA Solver Stable</span>
          </div>
        )}

        <button
          onClick={clearCanvas}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-void-850 hover:bg-red-950/40 border border-white/10 hover:border-red-500/30 text-xs text-slate-300 hover:text-red-300 transition-all active:scale-95"
          title="Clear all components"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>
    </header>
  );
};
