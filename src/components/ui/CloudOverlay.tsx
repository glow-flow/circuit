import React from 'react';
import { Cloud, FlaskConical, Trees } from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';

/**
 * CloudOverlay Component (`fixed inset-0 z-[9999]`).
 *
 * Renders a 2-second pure CSS volumetric cloud transition when switching
 * between `'lab'` (Indoor Dark Lab) and `'outside'` (Outdoor Terrain Sandbox):
 * - 0.0s - 0.5s: Clouds fade-in and scale-up from both sides (`0% -> 25%`)
 * - 0.5s - 1.5s: Dense cloud bank covers the entire viewport while `worldMode` switches (`25% -> 75%`)
 * - 1.5s - 2.0s: Clouds part and fade-out (`75% -> 100%`)
 *
 * Time Complexity: O(1) static DOM cluster render.
 */
export const CloudOverlay: React.FC = () => {
  const isTransitioningWorld = useCircuitStore((state) => state.isTransitioningWorld);
  const transitionTargetMode = useCircuitStore((state) => state.transitionTargetMode);
  const language = useCircuitStore((state) => state.language);

  if (!isTransitioningWorld) {
    return null;
  }

  const isGoingOutside = transitionTargetMode === 'outside';
  const isId = language === 'id';

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-auto overflow-hidden flex items-center justify-center select-none animate-cloud-overlay"
      aria-live="polite"
      role="status"
    >
      {/* Base Atmospheric Mist Veil */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-100/95 via-white/98 to-slate-200/95 backdrop-blur-xl" />

      {/* Left Sweeping Volumetric Cloud Bank (Multiple 50% border-radius divs + blur) */}
      <div className="absolute inset-0 pointer-events-none animate-cloud-left">
        <div
          className="absolute -top-24 -left-24 w-[58vw] h-[58vh] rounded-[50%] bg-white blur-2xl opacity-95 shadow-[0_0_120px_rgba(255,255,255,1)]"
        />
        <div
          className="absolute top-[12%] -left-16 w-[52vw] h-[54vh] rounded-[50%] bg-slate-100 blur-xl opacity-95"
        />
        <div
          className="absolute bottom-[-15%] left-[-10%] w-[64vw] h-[58vh] rounded-[50%] bg-slate-200/95 blur-2xl"
        />
        <div
          className="absolute top-[25%] left-[18%] w-[45vw] h-[45vh] rounded-[50%] bg-white blur-lg shadow-[inset_0_-24px_48px_rgba(148,163,184,0.35)]"
        />
      </div>

      {/* Right Sweeping Volumetric Cloud Bank (Multiple 50% border-radius divs + blur) */}
      <div className="absolute inset-0 pointer-events-none animate-cloud-right">
        <div
          className="absolute -top-20 -right-24 w-[60vw] h-[58vh] rounded-[50%] bg-white blur-2xl opacity-95 shadow-[0_0_120px_rgba(255,255,255,1)]"
        />
        <div
          className="absolute top-[18%] -right-12 w-[54vw] h-[52vh] rounded-[50%] bg-slate-100 blur-xl opacity-95"
        />
        <div
          className="absolute -bottom-24 right-[-12%] w-[65vw] h-[60vh] rounded-[50%] bg-slate-200/95 blur-2xl"
        />
        <div
          className="absolute top-[28%] right-[16%] w-[46vw] h-[46vh] rounded-[50%] bg-white blur-lg shadow-[inset_0_-24px_48px_rgba(148,163,184,0.35)]"
        />
      </div>

      {/* Central Cumulus Core Puffs */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[70vw] h-[65vh] rounded-[50%] bg-white/95 blur-2xl" />
        <div className="absolute w-[42vw] h-[42vh] rounded-[50%] bg-slate-100/90 blur-xl -translate-x-24 -translate-y-12" />
        <div className="absolute w-[42vw] h-[42vh] rounded-[50%] bg-slate-200/80 blur-xl translate-x-24 translate-y-12" />
      </div>

      {/* Center World Transition Pill Badge */}
      <div className="relative z-10 flex flex-col items-center gap-3 px-7 py-5 rounded-3xl bg-slate-900/90 border border-slate-700/60 text-white shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-2xl border ${
              isGoingOutside
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                : 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
            }`}
          >
            {isGoingOutside ? (
              <Trees className="w-6 h-6 animate-bounce" />
            ) : (
              <FlaskConical className="w-6 h-6 animate-pulse" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1">
              <Cloud className="w-3 h-3 text-sky-300" />
              {isId ? 'Transisi Dunia' : 'World Transition'}
            </span>
            <span className="text-base sm:text-lg font-bold tracking-tight text-white">
              {isGoingOutside
                ? isId
                  ? 'Menuju Alam Terbuka...'
                  : 'Entering Outdoor Sandbox...'
                : isId
                ? 'Kembali ke Laboratorium...'
                : 'Returning to Indoor Lab...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
