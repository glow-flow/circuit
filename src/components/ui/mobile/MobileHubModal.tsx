import React, { useRef } from 'react';
import {
  Activity,
  BookmarkPlus,
  ClipboardCheck,
  Cpu,
  Download,
  Globe,
  HelpCircle,
  Moon,
  RotateCcw,
  Share2,
  Sun,
  Trophy,
  Wrench,
} from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { useModalFocusTrap } from '../../../hooks/useModalKeyboardClose';
import { LabModalHeader } from '../common/LabModalHeader';

export interface MobileHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Callback to open the Save Custom Circuit modal. */
  onOpenSavePresetModal?: () => void;
  /** Callback to open the Interactive Teacher & Student Guide modal. */
  onOpenWelcomeGuide?: () => void;
}

/**
 * Reorganized Mobile & Tablet Feature Hub & Settings Drawer (`MobileHubModal.tsx`).
 *
 * Provides quick access on mobile/tablet (< 1024px) to:
 * 1. Evaluasi, Alat Ukur & Diagnostik (Misi, LKPD Mode Guru, Oskiloskop, Tutor, Korsleting, Microgrid).
 * 2. Simpan, Bagikan QR, Tema Terang/Gelap, Bahasa ID/EN, Panduan Guru, Muat Lampu Dasar, Mode Offline.
 *
 * Time Complexity: O(1) render.
 */
export const MobileHubModal: React.FC<MobileHubModalProps> = ({
  isOpen,
  onClose,
  onOpenSavePresetModal,
  onOpenWelcomeGuide,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useModalFocusTrap(isOpen, modalRef, onClose);
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
      | 'pwa'
      | 'lkpd'
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-scrim/75 p-0 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-hub-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-void-950 border border-control shadow-2xl flex flex-col max-h-[86dvh] overflow-hidden text-ink font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <LabModalHeader
          titleId="mobile-hub-title"
          eyebrow={isId ? 'MENU LAB & ALAT PRAKTIKUM' : 'LAB MENU & INSTRUMENTS'}
          title={isId ? 'Alat Praktikum & Pengaturan' : 'Instruments & Settings'}
          subtitle={
            isId
              ? 'Misi evaluasi, alat ukur lanjut, simpan & tampilan'
              : 'Missions, advanced instruments, save & display'
          }
          onClose={onClose}
          closeLabel={isId ? 'Tutup menu lab' : 'Close lab menu'}
        />

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
                className="text-left p-3 min-h-[76px] rounded-xl bg-void-900 hover:bg-void-850 border border-amber-500/45 transition-colors active:scale-95 cursor-pointer flex flex-col justify-between space-y-1.5"
              >
                <div className="flex items-center justify-between w-full">
                  <Trophy className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span className="text-[10px] font-mono text-amber-300 font-semibold">
                    {isId ? 'Ujian Praktik' : 'Challenges'}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-ink">
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
                className="text-left p-3 min-h-[76px] rounded-xl bg-void-900 hover:bg-void-850 border border-emerald-500/45 transition-colors active:scale-95 cursor-pointer flex flex-col justify-between space-y-1.5"
              >
                <div className="flex items-center justify-between w-full">
                  <Activity className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  <span className="text-[10px] font-mono text-emerald-300 font-semibold">
                    Scope V/I/P
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-ink">
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
                className="text-left p-3 min-h-[76px] rounded-xl bg-void-900 hover:bg-void-850 border border-control transition-colors active:scale-95 cursor-pointer flex flex-col justify-between space-y-1.5"
              >
                <div className="flex items-center justify-between w-full">
                  <Cpu className="w-4 h-4 text-electric-400" aria-hidden="true" />
                  <span className="text-[10px] font-mono text-slate-400">
                    KCL & KVL
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-ink">
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
                className="text-left p-3 min-h-[76px] rounded-xl bg-void-900 hover:bg-void-850 border border-control transition-colors active:scale-95 cursor-pointer flex flex-col justify-between space-y-1.5"
              >
                <div className="flex items-center justify-between w-full">
                  <Wrench className="w-4 h-4 text-slate-300" aria-hidden="true" />
                  <span className="text-[10px] font-mono text-slate-400">
                    {isId ? '6 Kasus' : '6 Cases'}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-ink">
                    {isId ? 'Lab Korsleting' : 'Fault Diagnosis Lab'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {isId ? 'Cari penyebab lampu mati/korslet' : 'Find & repair circuit faults'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchModal('lkpd')}
                className="col-span-2 text-left p-3 min-h-[60px] rounded-xl bg-void-900 hover:bg-void-850 border border-amber-500/45 transition-colors active:scale-95 cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0">
                    <ClipboardCheck className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-ink truncate">
                      {isId ? 'LKPD & Mode Guru (5 Paket)' : 'LKPD & Teacher Mode (5 Packets)'}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {isId
                        ? 'Lembar kerja Kurikulum Merdeka, kode kumpul & rekap CSV'
                        : 'Kurikulum Merdeka worksheets, submit codes & CSV gradebook'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-amber-400 font-semibold shrink-0">
                  LKPD
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchModal('renewable')}
                className="col-span-2 text-left p-3 min-h-[60px] rounded-xl bg-void-900 hover:bg-void-850 border border-control transition-colors active:scale-95 cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <Sun className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-ink truncate">
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
                className="flex items-center gap-2.5 p-3 min-h-[56px] rounded-xl bg-void-900 hover:bg-void-850 border border-control text-left transition-colors active:scale-95 cursor-pointer"
              >
                <BookmarkPlus className="w-4 h-4 text-electric-400 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-ink truncate">
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
                className="flex items-center gap-2.5 p-3 min-h-[56px] rounded-xl bg-void-900 hover:bg-void-850 border border-control text-left transition-colors active:scale-95 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-electric-400 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-ink truncate">
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
                className="flex items-center gap-2.5 p-3 min-h-[56px] rounded-xl bg-void-900 hover:bg-void-850 border border-control text-left transition-colors active:scale-95 cursor-pointer"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                ) : (
                  <Moon className="w-4 h-4 text-electric-400 shrink-0" aria-hidden="true" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-ink truncate">
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
                        ? 'Ganti ke kertas buku lab'
                        : 'Switch to lab paper'
                      : isId
                      ? 'Ganti ke meja gelap'
                      : 'Switch to dark bench'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
                className="flex items-center gap-2.5 p-3 min-h-[56px] rounded-xl bg-void-900 hover:bg-void-850 border border-control text-left transition-colors active:scale-95 cursor-pointer"
              >
                <Globe className="w-4 h-4 text-electric-400 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-ink truncate">
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
                className="flex items-center gap-2.5 p-3 min-h-[56px] rounded-xl bg-void-900 hover:bg-void-850 border border-control text-left transition-colors active:scale-95 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-ink truncate">
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
                className="flex items-center gap-2.5 p-3 min-h-[56px] rounded-xl bg-void-900 hover:bg-void-850 border border-control text-left transition-colors active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-300 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-ink truncate">
                    {isId ? 'Muat Lampu Dasar' : 'Load Basic Lamp'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {isId ? 'Kembali ke contoh awal' : 'Restore default circuit'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchModal('pwa')}
                className="col-span-2 flex items-center justify-between gap-3 p-3 min-h-[56px] rounded-xl bg-void-900 hover:bg-void-850 border border-electric-500/45 text-left transition-colors active:scale-95 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-electric-500/15 border border-electric-500/40 flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4 text-electric-400" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-ink truncate">
                      {isId ? 'Mode Offline & Pasang Aplikasi' : 'Offline Mode & Install App'}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {isId
                        ? 'Cek cache tanpa internet dan pasang ke layar utama'
                        : 'Verify offline cache and install to home screen'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-electric-400 font-semibold shrink-0">
                  PWA
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
