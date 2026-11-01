import React, { useState } from 'react';
import { Zap, Gauge } from 'lucide-react';
import { useCircuitStore } from '../../../../store/useCircuitStore';

/**
 * Interactive Ohm's Law Calculator & Live Visual Demonstration.
 * Demonstrates V = I * R with real-time sliders and tactile feedback.
 * 
 * Time Complexity: O(1) calculations.
 */
export const OhmsLawInteractiveDemo: React.FC = () => {
  const language = useCircuitStore((state) => state.language);
  const isId = language === 'id';

  const [voltage, setVoltage] = useState<number>(9.0);
  const [resistance, setResistance] = useState<number>(100.0);

  const currentAmperes = resistance > 0 ? voltage / resistance : 0;
  const currentMilliamperes = currentAmperes * 1000;
  const powerWatts = voltage * currentAmperes;

  // Normalized current ratio for visual bar (capped at 500 mA)
  const currentPercent = Math.min(100, (currentMilliamperes / 200) * 100);

  return (
    <div className="p-4 rounded-2xl bg-void-950 border border-electric-500/30 space-y-4 text-xs font-sans">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-electric-400" />
          <span className="font-bold text-slate-100 text-sm tracking-tight">
            {isId ? 'Laboratorium Interaktif: Hukum Ohm' : 'Interactive Lab: Ohm\'s Law'}
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-electric-500/20 text-electric-300 font-mono text-[11px] font-bold">
          V = I × R
        </span>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Voltage Slider */}
        <div className="p-3 rounded-xl bg-void-900 border border-white/5 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 font-medium">
              {isId ? 'Tegangan Baterai (V)' : 'Battery Voltage (V)'}
            </span>
            <span className="font-mono text-sky-400 font-bold text-sm">
              {voltage.toFixed(1)} V
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="24.0"
            step="0.5"
            value={voltage}
            onChange={(e) => setVoltage(parseFloat(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>1.0 V</span>
            <span>12.0 V</span>
            <span>24.0 V</span>
          </div>
        </div>

        {/* Resistance Slider */}
        <div className="p-3 rounded-xl bg-void-900 border border-white/5 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 font-medium">
              {isId ? 'Hambatan Resistor (R)' : 'Resistor Value (R)'}
            </span>
            <span className="font-mono text-amber-400 font-bold text-sm">
              {resistance.toFixed(0)} Ω
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="500"
            step="5"
            value={resistance}
            onChange={(e) => setResistance(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>10 Ω</span>
            <span>250 Ω</span>
            <span>500 Ω</span>
          </div>
        </div>
      </div>

      {/* Live Calculated Output Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-void-900 border border-electric-500/20 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>{isId ? 'Kuat Arus Terhitung (I)' : 'Calculated Current (I)'}</span>
            <Gauge className="w-3.5 h-3.5 text-electric-400" />
          </div>
          <div className="text-lg font-mono font-bold text-electric-300">
            {currentMilliamperes.toFixed(1)} <span className="text-xs font-sans text-electric-400">mA</span>
          </div>
          <div className="font-mono text-[10px] text-slate-500">
            I = {voltage.toFixed(1)}V / {resistance.toFixed(0)}Ω = {currentAmperes.toFixed(4)} A
          </div>
        </div>

        <div className="p-3 rounded-xl bg-void-900 border border-emerald-500/20 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>{isId ? 'Daya Diserap (P)' : 'Power Dissipated (P)'}</span>
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-mono font-bold text-emerald-300">
            {powerWatts.toFixed(2)} <span className="text-xs font-sans text-emerald-400">Watt</span>
          </div>
          <div className="font-mono text-[10px] text-slate-500">
            P = V × I = {voltage.toFixed(1)}V × {currentAmperes.toFixed(3)}A
          </div>
        </div>
      </div>

      {/* Dynamic Electron Flow / Current Visualization */}
      <div className="space-y-1.5 p-3 rounded-xl bg-void-900 border border-white/5">
        <div className="flex justify-between items-center text-[11px] text-slate-400">
          <span>{isId ? 'Visualisasi Aliran Muatan (Laju Arus)' : 'Current Flow Velocity'}</span>
          <span className="font-mono text-slate-300 font-semibold">{currentPercent.toFixed(0)}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-void-950 overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-electric-400 transition-all duration-150"
            style={{ width: `${currentPercent}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 italic pt-1">
          {isId
            ? '💡 Perhatikan: Saat hambatan (R) diperbesar dengan tegangan tetap, kuat arus (I) menurun secara proporsional.'
            : '💡 Notice: When resistance (R) increases with constant voltage, current (I) decreases proportionally.'}
        </p>
      </div>
    </div>
  );
};
