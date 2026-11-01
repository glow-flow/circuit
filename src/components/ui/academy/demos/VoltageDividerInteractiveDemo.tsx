import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { useCircuitStore } from '../../../../store/useCircuitStore';

/**
 * Interactive Voltage Divider Calculator & Live Visual Demonstration.
 * Demonstrates V_out = V_in * (R2 / (R1 + R2)) with real-time sliders.
 * 
 * Time Complexity: O(1).
 */
export const VoltageDividerInteractiveDemo: React.FC = () => {
  const language = useCircuitStore((state) => state.language);
  const isId = language === 'id';

  const [vIn, setVIn] = useState<number>(12.0);
  const [r1, setR1] = useState<number>(100.0);
  const [r2, setR2] = useState<number>(200.0);

  const totalResistance = r1 + r2;
  const current = totalResistance > 0 ? vIn / totalResistance : 0;
  const vOut = totalResistance > 0 ? vIn * (r2 / totalResistance) : 0;
  const v1 = totalResistance > 0 ? vIn * (r1 / totalResistance) : 0;

  return (
    <div className="p-4 rounded-2xl bg-void-950 border border-electric-500/30 space-y-4 text-xs font-sans">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-electric-400" />
          <span className="font-bold text-slate-100 text-sm tracking-tight">
            {isId ? 'Laboratorium Interaktif: Pembagi Tegangan' : 'Interactive Lab: Voltage Divider'}
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-electric-500/20 text-electric-300 font-mono text-[11px] font-bold">
          V_out = V_in × R₂ / (R₁ + R₂)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* V_in */}
        <div className="p-3 rounded-xl bg-void-900 border border-white/5 space-y-1.5">
          <div className="flex justify-between items-center text-slate-300 font-medium">
            <span>V_in</span>
            <span className="font-mono text-sky-400 font-bold">{vIn.toFixed(1)} V</span>
          </div>
          <input
            type="range"
            min="3.0"
            max="24.0"
            step="1.0"
            value={vIn}
            onChange={(e) => setVIn(parseFloat(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer"
          />
        </div>

        {/* R1 */}
        <div className="p-3 rounded-xl bg-void-900 border border-white/5 space-y-1.5">
          <div className="flex justify-between items-center text-slate-300 font-medium">
            <span>R₁</span>
            <span className="font-mono text-amber-400 font-bold">{r1.toFixed(0)} Ω</span>
          </div>
          <input
            type="range"
            min="50"
            max="500"
            step="10"
            value={r1}
            onChange={(e) => setR1(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* R2 */}
        <div className="p-3 rounded-xl bg-void-900 border border-white/5 space-y-1.5">
          <div className="flex justify-between items-center text-slate-300 font-medium">
            <span>R₂</span>
            <span className="font-mono text-emerald-400 font-bold">{r2.toFixed(0)} Ω</span>
          </div>
          <input
            type="range"
            min="50"
            max="500"
            step="10"
            value={r2}
            onChange={(e) => setR2(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-void-900 border border-amber-500/20 space-y-1">
          <div className="text-slate-400 text-[11px]">{isId ? 'Drop Tegangan R₁ (V₁)' : 'Drop across R₁ (V₁)'}</div>
          <div className="text-lg font-mono font-bold text-amber-300">{v1.toFixed(2)} V</div>
          <div className="text-[10px] text-slate-500 font-mono">
            {((v1 / vIn) * 100).toFixed(1)}% {isId ? 'dari total' : 'of total'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-void-900 border border-emerald-500/20 space-y-1">
          <div className="text-slate-400 text-[11px]">{isId ? 'Tegangan Keluaran V_out (R₂)' : 'Output Voltage V_out (R₂)'}</div>
          <div className="text-lg font-mono font-bold text-emerald-300">{vOut.toFixed(2)} V</div>
          <div className="text-[10px] text-slate-500 font-mono">
            {((vOut / vIn) * 100).toFixed(1)}% {isId ? 'dari total' : 'of total'}
          </div>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-void-900 border border-white/5 text-[11px] text-slate-400 space-y-1 font-mono">
        <div>Arus Loop Seri = {current.toFixed(4)} A ({(current * 1000).toFixed(1)} mA)</div>
        <div>KVL: V_in = V₁ + V₂ = {v1.toFixed(2)}V + {vOut.toFixed(2)}V = {(v1 + vOut).toFixed(2)} V</div>
      </div>
    </div>
  );
};
