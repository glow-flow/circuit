import React from 'react';
import { Compass, Sparkles, X, Zap } from 'lucide-react';
import { markTutorialAsSeen } from '../../utils/presetStorage';
import { startTour } from '../../utils/tour';
import { useCircuitStore } from '../../store/useCircuitStore';

export interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BLUEPRINT_BANNER_GRID: React.CSSProperties = {
  backgroundImage:
    'radial-gradient(rgba(34, 211, 238, 0.18) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)',
  backgroundSize: '14px 14px, 56px 56px, 56px 56px',
};

/**
 * First-visit Welcome Modal (`WelcomeModal.tsx`).
 *
 * Greets new users with a clean Void Dark Mode blueprint card and lets them
 * either launch the interactive 9-step `driver.js` spotlight tour ("Mulai Tutorial")
 * or skip directly to the canvas ("Lewati"). Persists `has_seen_tutorial` in localStorage.
 *
 * Time Complexity: O(1) render and interaction handlers.
 */
export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const language = useCircuitStore((state) => state.language);
  const isId = language === 'id';

  if (!isOpen) return null;

  const handleStartTour = () => {
    markTutorialAsSeen();
    onClose();
    // Launch the driver.js spotlight tour on the next frame after modal unmounts
    window.requestAnimationFrame(() => {
      startTour();
    });
  };

  const handleSkip = () => {
    markTutorialAsSeen();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none"
      onClick={handleSkip}
    >
      <div
        className="w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-2xl bg-void-900 border border-cyan-500/35 shadow-[0_0_50px_rgba(0,0,0,0.85),0_0_25px_rgba(34,211,238,0.14)] text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Blueprint Visual Stage */}
        <div
          className="relative px-5 pt-5 pb-4 border-b border-white/10 bg-void-950"
          style={BLUEPRINT_BANNER_GRID}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-400/35 text-[10px] font-mono font-bold text-cyan-300 tracking-wider uppercase">
              <Zap className="w-3 h-3 fill-cyan-300" />
              {isId ? 'Lab Fisika Virtual • IPA Kelas 9' : 'Virtual Physics Lab • Circuit Sandbox'}
            </span>
            <button
              type="button"
              onClick={handleSkip}
              aria-label={isId ? 'Lewati' : 'Skip'}
              className="w-7 h-7 rounded-lg bg-void-900/90 hover:bg-void-800 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mini Blueprint Schematic Preview */}
          <div className="relative flex items-center justify-between px-4 py-2 rounded-xl bg-void-900/90 border border-white/10">
            <svg
              viewBox="0 0 280 64"
              className="absolute inset-0 w-full h-full pointer-events-none"
              preserveAspectRatio="none"
            >
              <path
                d="M 56 32 L 224 32"
                fill="none"
                stroke="#0891b2"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <path
                d="M 56 32 L 224 32"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                className="animate-wire-flow"
              />
            </svg>

            <div className="relative z-10 flex items-center gap-2 bg-void-950/95 border border-white/10 rounded-lg px-2.5 py-1.5">
              <img
                src="/assets/battery-9v.png"
                alt="9V Battery"
                className="w-6 h-8 object-contain"
              />
              <div>
                <div className="text-[10px] font-bold text-slate-100">9.0 V</div>
                <div className="text-[9px] font-mono text-amber-300">Sumber</div>
              </div>
            </div>

            <span className="relative z-10 px-2 py-0.5 rounded-full bg-void-950 border border-cyan-400/40 text-[10px] font-mono font-bold text-cyan-300">
              V = I × R
            </span>

            <div className="relative z-10 flex items-center gap-2 bg-void-950/95 border border-amber-400/35 rounded-lg px-2.5 py-1.5">
              <img
                src="/assets/bulb-incandescent.png"
                alt="Lamp"
                className="w-6 h-8 object-contain drop-shadow-[0_0_6px_rgba(251,191,36,0.75)]"
              />
              <div>
                <div className="text-[10px] font-bold text-slate-100">Lampu</div>
                <div className="text-[9px] font-mono text-cyan-300">P = I²R</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Copy & Action Buttons */}
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <h2
              id="welcome-modal-title"
              className="text-lg sm:text-xl font-bold text-white tracking-tight"
            >
              {isId
                ? 'Selamat Datang di Circuit Sandbox'
                : 'Welcome to Circuit Sandbox'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isId
                ? 'Rangkai baterai, berbagai jenis lampu, saklar, dan alat ukur listrik secara interaktif. Baru pertama kali mencoba? Ikuti tur singkat 1 menit yang menunjuk langsung ke tombol-tombol aplikasi.'
                : 'Build series and parallel circuits with batteries, lamps, switches, and meters in real time. New here? Take a quick 1-minute interactive spotlight tour.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleStartTour}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-void-950 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all active:scale-95 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>{isId ? 'Mulai Tutorial' : 'Start Tutorial'}</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2.5 rounded-xl bg-void-850 hover:bg-void-800 border border-white/10 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer"
            >
              {isId ? 'Lewati' : 'Skip'}
            </button>
          </div>

          <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
            <span>
              {isId
                ? 'Karya Orisinal: Kenzie Raka Romero (SMPN 12 Surabaya)'
                : 'Created by: Kenzie Raka Romero (SMPN 12 Surabaya)'}
            </span>
            <span className="text-cyan-400 font-semibold">v2.5 PLN & Alam</span>
          </div>
        </div>
      </div>
    </div>
  );
};
