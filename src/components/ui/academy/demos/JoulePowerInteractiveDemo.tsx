import React, { useState } from 'react';
import { Flame } from 'lucide-react';
import { useCircuitStore } from '../../../../store/useCircuitStore';

/**
 * Interactive Joule Power & Thermal Dissipation Demo.
 * Demonstrates P = V * I = I^2 * R with thermal bar visualization.
 * 
 * Time Complexity: O(1).
 */
export const JoulePowerInteractiveDemo: React.FC = () => {
  const language = useCircuitStore((state) => state.language);
  const isId = language === 'id';

  const [current, setCurrent] = useState<number>(1.2);
  const [resistance, setResistance] = useState<number>(50.0);

  const voltage = current * resistance;
  const powerWatts = current * current * resistance;

  // Normalized thermal intensity (0 to 100 W)
  const thermalPercent = Math.min(100, (powerWatts / 100) * 100);

  return (
    <div className="p-4 rounded-2xl bg-void-950 border border-amber-500/30 space-y-4 text-xs font-sans">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-slate-100 text-sm tracking-tight">
            {isId ? 'Laboratorium Interaktif: Hukum Joule & Kalor' : 'Interactive Lab: Joule Heating'}
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold">
          P = I² × R
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Slider */}
        <div className="p-3 rounded-xl bg-void-900 border border-white/5 space-y-2">
          <div className="flex justify-between items-center text-slate-300 font-medium">
            <span>{isId ? 'Kuat Arus (I)' : 'Current (I)'}</span>
            <span className="font-mono text-amber-400 font-bold">{current.toFixed(2)} A</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.1"
            value={current}
            onChange={(e) => setCurrent(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Resistance Slider */}
        <div className="p-3 rounded-xl bg-void-900 border border-white/5 space-y-2">
          <div className="flex justify-between items-center text-slate-300 font-medium">
            <span>{isId ? 'Hambatan (R)' : 'Resistance (R)'}</span>
            <span className="font-mono text-sky-400 font-bold">{resistance.toFixed(0)} Ω</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={resistance}
            onChange={(e) => setResistance(parseFloat(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Live Outputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-void-900 border border-sky-500/20 space-y-1">
          <div className="text-slate-400 text-[11px]">{isId ? 'Tegangan Ekivalen (V)' : 'Equivalent Voltage (V)'}</div>
          <div className="text-lg font-mono font-bold text-sky-300">{voltage.toFixed(1)} V</div>
          <div className="font-mono text-[10px] text-slate-500">V = I × R</div>
        </div>

        <div className="p-3 rounded-xl bg-void-900 border border-red-500/20 space-y-1">
          <div className="text-slate-400 text-[11px]">{isId ? 'Laju Panas / Daya (P)' : 'Thermal Power (P)'}</div>
          <div className="text-lg font-mono font-bold text-red-400">{powerWatts.toFixed(1)} W</div>
          <div className="font-mono text-[10px] text-slate-500">P = I² × R</div>
        </div>
      </div>

      {/* Thermal Bar */}
      <div className="space-y-1.5 p-3 rounded-xl bg-void-900 border border-white/5">
        <div className="flex justify-between items-center text-[11px] text-slate-400">
          <span>{isId ? 'Intensitas Pelepasan Kalor Kawat' : 'Conductor Heat Dissipation Intensity'}</span>
          <span className="font-mono text-amber-300 font-semibold">{thermalPercent.toFixed(0)}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-void-950 overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 transition-all duration-150"
            style={{ width: `${thermalPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
