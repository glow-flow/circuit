import React from 'react';
import {
  X,
  GraduationCap,
  Wrench,
  Sun,
  Compass,
  Cpu,
  LayoutGrid,
  Share2,
  HelpCircle,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { startTour } from '../../../utils/tour';
import { useModalKeyboardClose } from '../../../hooks/useModalKeyboardClose';

interface MobileHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * High-Taste Mobile Feature Hub & Navigation Drawer (CIRCUIT 4.0)
 *
 * Provides instant 1-tap mobile touch access to all 4 Academy modules,
 * preset gallery, sharing, and preferences without cluttering viewports.
 *
 * Adheres strictly to Anti-Slop UI & Taste-Skill guidelines:
 * - Rich neutral dark glass (`bg-void-950/95`)
 * - Tactile active scale transforms (`active:scale-95`)
 * - WCAG AA contrast compliance (4.5:1 ratio)
 * - Geist/Inter typography with tight tracking
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Pusat Navigasi Modul"
    >
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-void-950 border border-white/10 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-100 font-sans animate-in slide-in-from-bottom duration-250">
        {/* Top Handle & Close Header */}
        <div className="px-5 pt-4 pb-3 border-b border-white/10 flex items-center justify-between shrink-0 bg-void-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400">
              <Compass className="w-4 h-4 text-electric-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {isId ? 'Menu & Modul CIRCUIT 4.0' : 'CIRCUIT 4.0 Modules & Tools'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isId ? 'Pilih fitur atau modul pembelajaran' : 'Select an academy module or tool'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-void-850 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Hub Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Section 1: Major Circuit 4.0 Modules */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-1">
              {isId ? 'Modul Pembelajaran Utama' : 'Core Academy Modules'}
            </span>

            <div className="grid grid-cols-2 gap-2">
              {/* 1. Academy */}
              <button
                type="button"
                onClick={() => handleLaunchModal('academy')}
                className="text-left p-3 rounded-xl bg-electric-500/10 hover:bg-electric-500/20 border border-electric-500/30 transition-all active:scale-95 cursor-pointer flex flex-col justify-between space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-electric-500/20 flex items-center justify-center text-electric-300">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-electric-500/20 text-electric-300 font-bold border border-electric-500/30">
                    Lvl 1-6
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {isId ? 'Akademi Kelistrikan' : 'Circuit Academy'}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {isId ? 'Kurikulum, Kuis & XP' : 'Curriculum & Badges'}
                  </div>
                </div>
              </button>

              {/* 2. Troubleshooting Lab */}
              <button
                type="button"
                onClick={() => handleLaunchModal('troubleshooting')}
                className="text-left p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all active:scale-95 cursor-pointer flex flex-col justify-between space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-300">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                    6 Kasus
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {isId ? 'Lab Troubleshooting' : 'Fault Lab'}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {isId ? 'Diagnosa Korslet & Putus' : 'Isolate & Repair'}
                  </div>
                </div>
              </button>

              {/* 3. Renewable Twin */}
              <button
                type="button"
                onClick={() => handleLaunchModal('renewable')}
                className="text-left p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all active:scale-95 cursor-pointer flex flex-col justify-between space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                    <Sun className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Microgrid
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {isId ? 'Twin Energi Terbarukan' : 'Renewable Twin'}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {isId ? 'PLTS, Turbin & BESS' : 'Solar, Wind & Storage'}
                  </div>
                </div>
              </button>

              {/* 4. Explainable Tutor */}
              <button
                type="button"
                onClick={() => handleLaunchModal('tutor')}
                className="text-left p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-all active:scale-95 cursor-pointer flex flex-col justify-between space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-300">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                    Fisika MNA
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {isId ? 'Tutor Fisika' : 'Physics Tutor'}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {isId ? 'Bukti KCL, KVL & What-If' : 'Derivations & Proofs'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Circuit Tools & Actions */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-1">
              {isId ? 'Koleksi & Berbagi' : 'Circuit Collection & Sharing'}
            </span>

            <div className="space-y-1.5">
              {/* Visual Preset Gallery */}
              <button
                type="button"
                onClick={() => handleLaunchModal('gallery')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-void-900 border border-white/5 hover:bg-void-850 transition-all active:scale-95 cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-void-950 border border-white/10 flex items-center justify-center text-electric-400">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      {isId ? 'Galeri Rangkaian Interaktif' : 'Interactive Preset Gallery'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {isId ? 'Contoh seri, paralel, saklar & jembatan Wheatstone' : '5 curated circuits'}
                    </div>
                  </div>
                </div>
                <BookOpen className="w-4 h-4 text-slate-500" />
              </button>

              {/* Share & QR Code */}
              <button
                type="button"
                onClick={() => handleLaunchModal('share')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-void-900 border border-white/5 hover:bg-void-850 transition-all active:scale-95 cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-void-950 border border-white/10 flex items-center justify-center text-electric-400">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      {isId ? 'Ekspor, Impor & Bagikan QR' : 'Share & Export Workspace'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {isId ? 'Kirim rangkaian ke teman atau guru' : 'Generate URL or QR code'}
                    </div>
                  </div>
                </div>
                <Share2 className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Section 3: Utilities */}
          <div className="space-y-2 pt-1 border-t border-white/10">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleRestartTour}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-void-900 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-electric-400" />
                <span>{isId ? 'Panduan Ulang' : 'Restart Tour'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetSimpleLamp}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-void-900 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>{isId ? 'Reset Contoh Lampu' : 'Reset Simple Lamp'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
