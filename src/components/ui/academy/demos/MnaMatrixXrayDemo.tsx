import React, { useState } from 'react';
import { useCircuitStore } from '../../../../store/useCircuitStore';
import { MiniLabFrame, MiniSliderControl } from './MiniLabFrame';

/**
 * Interactive MNA Matrix X-Ray & Internal Battery Resistance (-R_int) SVG Micro-Lab.
 * Exposes how MNA solves [G B; C D] * x = z cleanly even as R_load approaches 0 Ohm.
 *
 * Time Complexity: O(1).
 */
export const MnaMatrixXrayDemo: React.FC = () => {
  const language = useCircuitStore((state) => state.language);
  const isId = language === 'id';

  const [rLoad, setRLoad] = useState<number>(20);
  const [rInt, setRInt] = useState<number>(1.0);

  const eSource = 9.0;
  const gLoad = 1 / Math.max(0.5, rLoad);
  const currentA = eSource / (rLoad + rInt);
  const vTerminal = eSource - currentA * rInt;
  const isStressTested = rLoad <= 5 && rInt >= 3.0;

  return (
    <MiniLabFrame
      title={isId ? 'Lab Visual: X-Ray Matriks MNA & -R_int' : 'Visual Lab: MNA Matrix & -R_int'}
      formula="[A]·[x] = [z]"
      challengeText={
        isStressTested
          ? isId
            ? `Terlihat! Beban berat (${rLoad}Ω) + R_int (${rInt.toFixed(1)}Ω) bikin V_terminal turun ke ${vTerminal.toFixed(2)}V.`
            : `Observed! Heavy load (${rLoad}Ω) + R_int (${rInt.toFixed(1)}Ω) pulls V_terminal down to ${vTerminal.toFixed(2)}V.`
          : isId
          ? 'Misi Mini: Turunkan R_load <= 5Ω lalu naikkan R_int >= 3.0Ω untuk amati drop tegangan!'
          : 'Mini Goal: Lower R_load <= 5Ω and raise R_int >= 3.0Ω to watch terminal droop!'
      }
      isChallengeMet={isStressTested}
    >
      {/* Matrix + Telemetry Side-by-Side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="rounded-xl bg-void-900 border border-control p-3 flex flex-col justify-center">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
            {isId ? 'Stempel Matriks MNA (2x2)' : '2x2 MNA Stamp'}
          </div>
          <div className="font-mono text-xs tabular-nums bg-void-950 rounded-lg border border-control p-2.5 space-y-1">
            <div className="flex justify-between text-sky-300">
              <span>[ {gLoad.toFixed(3)}</span>
              <span>1.000 ]</span>
              <span className="text-slate-400">·</span>
              <span className="text-emerald-300">[ V₁ ]</span>
              <span className="text-slate-400">=</span>
              <span className="text-ink">[ 0 ]</span>
            </div>
            <div className="flex justify-between text-sky-300">
              <span>[ 1.000</span>
              <span className="text-rose-400 font-bold">-{rInt.toFixed(1)} ]</span>
              <span className="text-slate-400">·</span>
              <span className="text-amber-300">[ I_s ]</span>
              <span className="text-slate-400">=</span>
              <span className="text-ink">[ {eSource.toFixed(0)} ]</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
            {isId
              ? 'Elemen -R_int di diagonal mencegah matriks singular (error pembagian nol).'
              : 'The -R_int diagonal prevents a singular matrix error under heavy load.'}
          </p>
        </div>

        <div className="rounded-xl bg-void-900 border border-control p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">{isId ? 'Tegangan Terminal (V₁)' : 'Terminal Voltage (V₁)'}</span>
            <span className="font-mono font-bold tabular-nums text-emerald-400">{vTerminal.toFixed(2)} V</span>
          </div>
          <div className="w-full h-2 rounded-full bg-void-950 border border-control overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-150"
              style={{ width: `${Math.min(100, (vTerminal / eSource) * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-slate-400">{isId ? 'Arus Keluar Baterai (I_s)' : 'Source Current (I_s)'}</span>
            <span className="font-mono font-bold tabular-nums text-amber-400">{currentA.toFixed(2)} A</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">{isId ? 'Rugi Dalam Baterai' : 'Internal Drop'}</span>
            <span className="font-mono font-bold tabular-nums text-rose-400">
              -{(eSource - vTerminal).toFixed(2)} V
            </span>
          </div>
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <MiniSliderControl
          label={isId ? 'Hambatan Beban (R_load)' : 'Load Resistance (R_load)'}
          valueDisplay={`${rLoad} Ω`}
          value={rLoad}
          min={2}
          max={50}
          step={1}
          accentClass="sky"
          onChange={setRLoad}
        />
        <MiniSliderControl
          label={isId ? 'Resistansi Dalam (-R_int)' : 'Internal Resistance (-R_int)'}
          valueDisplay={`${rInt.toFixed(1)} Ω`}
          value={rInt}
          min={0.2}
          max={5.0}
          step={0.2}
          accentClass="rose"
          onChange={setRInt}
        />
      </div>
    </MiniLabFrame>
  );
};
