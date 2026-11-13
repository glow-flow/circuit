import React from 'react';
import {
  Activity,
  BookmarkPlus,
  Cpu,
  Globe,
  HelpCircle,
  Moon,
  RotateCcw,
  Share2,
  Sun,
  Trophy,
  Wrench,
  X,
} from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { useModalKeyboardClose } from '../../../hooks/useModalKeyboardClose';

export interface MobileHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Callback to open the Save Custom Circuit modal. */
  onOpenSavePresetModal?: () => void;
  /** Callback to open the Interactive Teacher & Student Guide modal. */
  onOpenWelcomeGuide?: () => void;
}

/**
 * Reorganized Mobile Feature Hub & Settings Drawer (`MobileHubModal.tsx`).
 *
 * Replaces the old "Menu 4.0" drawer with a logical, teacher-friendly
 * "Menu Lab & Alat Praktikum" sheet that organizes:
 * 1. Praktikum, Evaluasi & Alat Ukur (Misi Praktikum, Oskiloskop/Scope, Tutor Fisika,
 *    Lab Diagnostik Korsleting, Digital Twin EBT).
 * 2. Simpan, Bagikan & Pengaturan Kelas (Simpan Rangkaian, Bagikan QR, Tema Terang/Gelap,
 *    Bahasa ID/EN, Panduan Cepat Guru, Reset Lampu Dasar) — zero duplicate Gallery buttons!
 *
 * Time Complexity: O(1) render.
 */
export const MobileHubModal: React.FC<MobileHubModalProps> = ({
  isOpen,
  onClose,
  onOpenSavePresetModal,
  onOpenWelcomeGuide,
}) => {
  useModalKeyboardClose(isOpen, onClose);
  const language = useCircuitStore((state) => state.language);
  const setLanguage = useCircuitStore((state) => state.setLanguage);
  const theme = useCircuitStore((state) => state.theme);
  const toggleTheme = useCircuitStore((state) => state.toggleTheme);
  const setActiveModal = useCircuitStore((state) => state.setActiveModal);
  const loadPreset = useCircuitStore((state) => state.loadPreset);
  const runSimulation = useCircuitStore((state) => state.runSimulation);
  const isId = language === 'id';

  if (!isOpen) return null;

  const handleLaunchModal = (
    modalType:
      | 'missions'
      | 'oscilloscope'
      | 'troubleshooting'
      | 'renewable'
      | 'tutor'
      | 'share'
  ) => {
    onClose();
    setActiveModal(modalType);
  };

  const handleOpenGuide = () => {
    onClose();
    if (onOpenWelcomeGuide) {
      onOpenWelcomeGuide();
    }
  };

  const handleOpenSaveModal = () => {
    onClose();
    if (onOpenSavePresetModal) {
      onOpenSavePresetModal();
    }
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
      aria-label={isId ? 'Menu Lab & Pengaturan' : 'Lab Menu & Settings'}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-void-950 border border-white/15 shadow-2xl flex flex-col max-h-[86dvh] overflow-hidden text-slate-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-void-900">
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
                {isId ? 'Menu Lab & Alat Praktikum' : 'Lab Menu & Instruments'}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {isId
                  ? 'Misi evaluasi, alat ukur lanjut, simpan & pengaturan tampilan'
                  : 'Missions, advanced instruments, save & display settings'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-void-850 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
            aria-label={isId ? 'Tutup' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Hub Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Section 1: Praktikum, Evaluasi & Alat Ukur */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-1">
              {isId
                ? '1. Evaluasi, Alat Ukur & Diagnostik'
                : '1. Assessment, Instruments & Diagnostics'}
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleLaunchModal('missions')}
                className="text-left p-3 rounded-xl bg-void-900 hover:bg-void-850 border border-amber-500/35 transition-all active:scale-95 cursor-pointer flex flex-col justify-between space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-mono text-amber-300 font-semibold">
                    {isId ? 'Ujian Praktik' : 'Challenges'}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {isId ? 'Misi Praktikum' : 'Lab Missions'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {isId ? 'Target merangkai otomatis dinilai' : 'Auto-graded circuit tasks'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchModal('oscilloscope')}
                className="text-left p-3 rounded-xl bg-void-900 hover:bg-void-850 border border-emerald-500/35 transition-all active:scale-95 cursor-pointer flex flex-col justify-between space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-mono text-emerald-300 font-semibold">
                    Scope V/I/P
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {isId ? 'Oskiloskop Live' : 'Live Oscilloscope'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {isId ? 'Grafik gelombang tegangan & arus' : 'Real-time V & I waveforms'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchModal('tutor')}
                className="text-left p-3 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 transition-all active:scale-95 cursor-pointer flex flex-col justify-between space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <Cpu className="w-4 h-4 text-electric-400" />
                  <span className="text-[10px] font-mono text-slate-400">
                    KCL & KVL
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {isId ? 'Tutor Rumus Fisika' : 'Physics Formula Tutor'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {isId ? 'Langkah hitungan & bukti rumus' : 'Step-by-step derivations'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchModal('troubleshooting')}
                className="text-left p-3 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 transition-all active:scale-95 cursor-pointer flex flex-col justify-between space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <Wrench className="w-4 h-4 text-slate-300" />
                  <span className="text-[10px] font-mono text-slate-400">
                    6 Kasus
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {isId ? 'Lab Korsleting' : 'Fault Diagnosis Lab'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {isId ? 'Cari penyebab lampu mati/korslet' : 'Find & repair circuit faults'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchModal('renewable')}
                className="col-span-2 text-left p-3 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 transition-all active:scale-95 cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Sun className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {isId
                        ? 'Simulasi Panel Microgrid Energi Terbarukan'
                        : 'Renewable Microgrid Digital Twin'}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {isId
                        ? 'Analisis keseimbangan daya PLTS, Turbin Angin & Baterai BESS'
                        : 'Analyze Solar PV, Wind Turbine & BESS storage balance'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold shrink-0">
                  Microgrid
                </span>
              </button>
            </div>
          </div>

          {/* Section 2: Simpan, Bagikan & Pengaturan Tampilan */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-1">
              {isId
                ? '2. Simpan, Bagikan & Pengaturan Tampilan'
                : '2. Save, Share & Display Settings'}
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleOpenSaveModal}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 text-left transition-all active:scale-95 cursor-pointer"
              >
                <BookmarkPlus className="w-4 h-4 text-electric-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-100 truncate">
                    {isId ? 'Simpan Rangkaian' : 'Save Circuit'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {isId ? 'Simpan ke memori browser' : 'Save to browser storage'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchModal('share')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 text-left transition-all active:scale-95 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-electric-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-100 truncate">
                    {isId ? 'Bagikan & QR' : 'Share & QR'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {isId ? 'Kirim link ke siswa/guru' : 'Share link or JSON'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 text-left transition-all active:scale-95 cursor-pointer"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Moon className="w-4 h-4 text-electric-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-100 truncate">
                    {theme === 'dark'
                      ? isId
                        ? 'Mode Terang'
                        : 'Light Mode'
                      : isId
                      ? 'Mode Gelap'
                      : 'Dark Mode'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {theme === 'dark'
                      ? isId
                        ? 'Ganti ke warna kertas'
                        : 'Switch to lab paper'
                      : isId
                      ? 'Ganti ke layar gelap'
                      : 'Switch to dark slate'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 text-left transition-all active:scale-95 cursor-pointer"
              >
                <Globe className="w-4 h-4 text-electric-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-100 truncate">
                    {isId ? 'Bahasa: Indonesia' : 'Language: English'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {isId ? 'Ketuk untuk English (EN)' : 'Tap for Indonesia (ID)'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleOpenGuide}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 text-left transition-all active:scale-95 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-100 truncate">
                    {isId ? 'Contekan Guru' : 'Teacher Guide'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {isId ? 'Praktikum 3 langkah & kartu' : '3-step practice & cards'}
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
                    {isId ? 'Muat Lampu Dasar' : 'Load Basic Lamp'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {isId ? 'Kembali ke contoh awal' : 'Restore default circuit'}
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
