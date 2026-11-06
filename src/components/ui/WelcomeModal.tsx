import React from 'react';
import { Compass, X } from 'lucide-react';
import { markTutorialAsSeen } from '../../utils/presetStorage';
import { startTour } from '../../utils/tour';
import { useCircuitStore } from '../../store/useCircuitStore';

export interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * First-visit Welcome Modal (`WelcomeModal.tsx`).
 *
 * Greets new users with a clean industrial instrument card and lets them
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
        className="w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-2xl bg-void-900 border border-white/15 shadow-2xl text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Hardware Stage */}
        <div className="relative px-5 pt-5 pb-4 border-b border-white/10 bg-void-950">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <img
                src="/assets/logo-circuit-sandbox.png"
                alt="Circuit Sandbox"
                width={28}
                height={28}
                fetchPriority="high"
                className="w-7 h-7 object-contain"
              />
              <span className="text-[11px] font-mono font-semibold text-slate-300 tracking-wider uppercase">
                {isId ? 'Lab Fisika Virtual · IPA Kelas 9' : 'Virtual Physics Lab · Circuit Sandbox'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSkip}
              aria-label={isId ? 'Lewati' : 'Skip'}
              className="w-9 h-9 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Hardware Specimen Preview */}
          <div className="relative flex items-center justify-between px-4 py-2.5 rounded-xl bg-void-900 border border-white/10">
            <div className="relative z-10 flex items-center gap-2 bg-void-950 border border-white/10 rounded-lg px-2.5 py-1.5">
              <img
                src="/assets/battery-9v.png"
                alt="9V Battery"
                width={24}
                height={32}
                className="w-6 h-8 object-contain"
              />
              <div>
                <div className="text-[10px] font-bold text-slate-100">9.0 V</div>
                <div className="text-[9px] font-mono text-slate-400">Sumber</div>
              </div>
            </div>

            <span className="relative z-10 px-2.5 py-1 rounded-lg bg-void-950 border border-white/10 text-[10px] font-mono font-bold text-electric-400">
              V = I × R
            </span>

            <div className="relative z-10 flex items-center gap-2 bg-void-950 border border-white/10 rounded-lg px-2.5 py-1.5">
              <img
                src="/assets/bulb-incandescent.png"
                alt="Lamp"
                width={24}
                height={32}
                className="w-6 h-8 object-contain"
              />
              <div>
                <div className="text-[10px] font-bold text-slate-100">Lampu</div>
                <div className="text-[9px] font-mono text-slate-400">P = I²R</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Copy & Action Buttons */}
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <h2
              id="welcome-modal-title"
              className="text-lg sm:text-xl font-bold text-white tracking-tight leading-[1.15]"
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
              className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>{isId ? 'Mulai Tutorial' : 'Start Tutorial'}</span>
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-void-850 hover:bg-void-800 border border-white/10 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer"
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
          </div>
        </div>
      </div>
    </div>
  );
};
