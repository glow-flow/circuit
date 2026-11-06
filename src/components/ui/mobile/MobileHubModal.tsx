import React from 'react';
import {
  X,
  GraduationCap,
  Wrench,
  Sun,
  Cpu,
  LayoutGrid,
  Share2,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { startTour } from '../../../utils/tour';
import { useModalKeyboardClose } from '../../../hooks/useModalKeyboardClose';

interface MobileHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Mobile Feature Hub & Navigation Drawer (`MobileHubModal.tsx`).
 *
 * Provides 1-tap mobile touch access to all 4 laboratory modules,
 * preset gallery, sharing, and preferences with a unified neutral slate palette
 * and single primary accent (`electric-500`).
 *
 * Time Complexity: O(1) render.
 */
export const MobileHubModal: React.FC<MobileHubModalProps> = ({ isOpen, onClose }) => {
  useModalKeyboardClose(isOpen, onClose);
  const language = useCircuitStore((state) => state.language);
  const setActiveModal = useCircuitStore((state) => state.setActiveModal);
  const loadPreset = useCircuitStore((state) => state.loadPreset);
  const runSimulation = useCircuitStore((state) => state.runSimulation);
  const isId = language === 'id';

  if (!isOpen) return null;

  const handleLaunchModal = (
    modalType: 'academy' | 'troubleshooting' | 'renewable' | 'tutor' | 'gallery' | 'share'
  ) => {
    onClose();
    setActiveModal(modalType);
  };

  const handleRestartTour = () => {
    onClose();
    startTour();
  };

  const handleResetSimpleLamp = () => {
    onClose();
    loadPreset('simple-lamp');
    runSimulation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Pusat Navigasi Modul"
    >
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-void-950 border border-white/10 shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden text-slate-100 font-sans">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-void-900">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/assets/logo-circuit-sandbox.png"
              alt="Circuit Sandbox"
              width={28}
              height={28}
              className="w-7 h-7 object-contain shrink-0"
            />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white tracking-tight truncate">
                {isId ? 'Modul & Alat Laboratorium' : 'Lab Modules & Tools'}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {isId ? 'Pilih modul pembelajaran atau alat ukur' : 'Select a learning module or tool'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-xl bg-void-850 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Hub Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Section 1: Core Modules */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-1">
              {isId ? 'Modul Pembelajaran Utama' : 'Core Lab Modules'}
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleLaunchModal('academy')}
                className="text-left p-3.5 rounded-xl bg-void-900 hover:bg-void-850 border border-electric-500/35 transition-all active:scale-95 cursor-pointer flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between">
                  <GraduationCap className="w-4 h-4 text-electric-400" />
                  <span className="text-[10px] font-mono text-electric-400 font-semibold">
                    Level 1-6
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {isId ? 'Akademi Kelistrikan' : 'Circuit Academy'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {isId ? 'Kurikulum, Kuis & XP' : 'Curriculum & Quizzes'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchModal('troubleshooting')}
                className="text-left p-3.5 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 transition-all active:scale-95 cursor-pointer flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Wrench className="w-4 h-4 text-slate-300" />
                  <span className="text-[10px] font-mono text-slate-400">
                    6 Kasus
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {isId ? 'Lab Troubleshooting' : 'Fault Lab'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {isId ? 'Diagnosa Korslet & Putus' : 'Isolate & Repair'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchModal('renewable')}
                className="text-left p-3.5 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 transition-all active:scale-95 cursor-pointer flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Sun className="w-4 h-4 text-slate-300" />
                  <span className="text-[10px] font-mono text-slate-400">
                    Microgrid
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {isId ? 'Twin Energi Terbarukan' : 'Renewable Twin'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {isId ? 'PLTS, Turbin & BESS' : 'Solar, Wind & Storage'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchModal('tutor')}
                className="text-left p-3.5 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 transition-all active:scale-95 cursor-pointer flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Cpu className="w-4 h-4 text-slate-300" />
                  <span className="text-[10px] font-mono text-slate-400">
                    KCL & KVL
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {isId ? 'Tutor Fisika' : 'Physics Tutor'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {isId ? 'Bukti Rumus & What-If' : 'Derivations & Proofs'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Quick Tools */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-1">
              {isId ? 'Alat & Pintasan Kanvas' : 'Canvas Shortcuts'}
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleLaunchModal('gallery')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 text-left transition-all active:scale-95 cursor-pointer"
              >
                <LayoutGrid className="w-4 h-4 text-electric-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-100 truncate">
                    {isId ? 'Galeri Rangkaian' : 'Circuit Gallery'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {isId ? '5 Contoh Siap Pakai' : '5 Ready Presets'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchModal('share')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 text-left transition-all active:scale-95 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-slate-300 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-100 truncate">
                    {isId ? 'Bagikan & QR' : 'Share & QR'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {isId ? 'Ekspor / Impor JSON' : 'Export / Import JSON'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleRestartTour}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 text-left transition-all active:scale-95 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-slate-300 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-100 truncate">
                    {isId ? 'Panduan Interaktif' : 'Interactive Tour'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {isId ? 'Tur 9 Langkah' : '9-Step Spotlight'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleResetSimpleLamp}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 text-left transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-300 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-100 truncate">
                    {isId ? 'Reset Rangkaian' : 'Reset Circuit'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {isId ? 'Muat Lampu Dasar' : 'Load Basic Lamp'}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
