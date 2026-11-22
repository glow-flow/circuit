import React, { useEffect, useRef, useState } from 'react';
import {
  Trash2,
  AlertOctagon,
  RotateCcw,
  Globe,
  BookmarkPlus,
  Bookmark,
  FolderOpen,
  HelpCircle,
  Trees,
  FlaskConical,
  LayoutGrid,
  Activity,
  Share2,
  Sun,
  Moon,
  GraduationCap,
  Wrench,
  Cpu,
  ChevronDown,
  SlidersHorizontal,
  Download,
  ClipboardCheck,
  Menu,
  UserCheck,
  Undo2,
} from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { startTour } from '../../utils/tour';
import { useModalFocusTrap } from '../../hooks/useModalKeyboardClose';
import { LabModalHeader } from './common/LabModalHeader';

// Code-splitting secondary modals to optimize initial bundle size & time-to-interactive
const CreditsModal = React.lazy(() =>
  import('./CreditsModal').then((m) => ({ default: m.CreditsModal }))
);
const PresetGalleryModal = React.lazy(() =>
  import('./presets/PresetGalleryModal').then((m) => ({ default: m.PresetGalleryModal }))
);
const AcademyModal = React.lazy(() =>
  import('./academy/AcademyModal').then((m) => ({ default: m.AcademyModal }))
);
const TroubleshootingModal = React.lazy(() =>
  import('./troubleshooting/TroubleshootingModal').then((m) => ({
    default: m.TroubleshootingModal,
  }))
);
const RenewableLabModal = React.lazy(() =>
  import('./renewable/RenewableLabModal').then((m) => ({ default: m.RenewableLabModal }))
);
const ExplainableTutorModal = React.lazy(() =>
  import('./tutor/ExplainableTutorModal').then((m) => ({
    default: m.ExplainableTutorModal,
  }))
);
const OscilloscopeModal = React.lazy(() =>
  import('./analytics/OscilloscopeModal').then((m) => ({
    default: m.OscilloscopeModal,
  }))
);
const CircuitShareModal = React.lazy(() =>
  import('./workspace/CircuitShareModal').then((m) => ({
    default: m.CircuitShareModal,
  }))
);
const PwaOfflineModal = React.lazy(() =>
  import('./pwa/PwaOfflineModal').then((m) => ({
    default: m.PwaOfflineModal,
  }))
);
const LkpdTeacherModal = React.lazy(() =>
  import('./lkpd/LkpdTeacherModal').then((m) => ({
    default: m.LkpdTeacherModal,
  }))
);

export interface HeaderProps {
  /** Opens the Teacher & Student Quick-Start Guide / Interactive Practice modal. */
  onOpenWelcomeGuide?: () => void;
  /** Opens the compact Mobile & Tablet Menu & Settings sheet (< 1024px). */
  onOpenMobileHub?: () => void;
  /** Whether the Mobile & Tablet Menu sheet is open. */
  isMobileHubOpen?: boolean;
  /** Controlled state for the Save Custom Circuit modal (accessible from Header & Mobile Menu). */
  isSaveModalOpen?: boolean;
  /** Setter for the Save Custom Circuit modal state. */
  onSaveModalOpenChange?: (isOpen: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenWelcomeGuide,
  onOpenMobileHub,
  isMobileHubOpen = false,
  isSaveModalOpen: externalSaveModalOpen,
  onSaveModalOpenChange,
}) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const clearCanvas = useCircuitStore((state) => state.clearCanvas);
  const canUndo = useCircuitStore((state) => state.canUndo);
  const undo = useCircuitStore((state) => state.undo);
  const loadPreset = useCircuitStore((state) => state.loadPreset);
  const runSimulation = useCircuitStore((state) => state.runSimulation);
  const notify = useCircuitStore((state) => state.notify);
  const language = useCircuitStore((state) => state.language);
  const setLanguage = useCircuitStore((state) => state.setLanguage);
  const customPresets = useCircuitStore((state) => state.customPresets);
  const saveCustomPreset = useCircuitStore((state) => state.saveCustomPreset);
  const deleteCustomPreset = useCircuitStore((state) => state.deleteCustomPreset);
  const worldMode = useCircuitStore((state) => state.worldMode);
  const isTransitioningWorld = useCircuitStore((state) => state.isTransitioningWorld);
  const triggerWorldTransition = useCircuitStore((state) => state.triggerWorldTransition);
  const activeModal = useCircuitStore((state) => state.activeModal);
  const setActiveModal = useCircuitStore((state) => state.setActiveModal);
  const openLkpdModal = useCircuitStore((state) => state.openLkpdModal);
  const theme = useCircuitStore((state) => state.theme);
  const toggleTheme = useCircuitStore((state) => state.toggleTheme);

  const [internalSaveModalOpen, setInternalSaveModalOpen] = useState<boolean>(false);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState<boolean>(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState<boolean>(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState<boolean>(false);
  const [presetNameInput, setPresetNameInput] = useState<string>('');

  const toolsMenuContainerRef = useRef<HTMLDivElement>(null);
  const toolsMenuButtonRef = useRef<HTMLButtonElement>(null);
  const saveModalRef = useRef<HTMLDivElement>(null);
  const resetModalRef = useRef<HTMLDivElement>(null);

  const isSaveModalOpen = externalSaveModalOpen ?? internalSaveModalOpen;
  const setIsSaveModalOpen = onSaveModalOpenChange ?? setInternalSaveModalOpen;

  useModalFocusTrap(isSaveModalOpen, saveModalRef, () => setIsSaveModalOpen(false));
  useModalFocusTrap(isResetDialogOpen, resetModalRef, () => setIsResetDialogOpen(false));

  const t = TRANSLATIONS[language].header;
  const isId = language === 'id';

  // Close desktop "Alat Lab" menu on outside click or Escape
  useEffect(() => {
    if (!isToolsMenuOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (
        toolsMenuContainerRef.current &&
        !toolsMenuContainerRef.current.contains(e.target as Node)
      ) {
        setIsToolsMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsToolsMenuOpen(false);
        toolsMenuButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isToolsMenuOpen]);

  const toggleLanguage = () => {
    setLanguage(language === 'id' ? 'en' : 'id');
  };

  const handleSavePresetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetNameInput.trim()) return;
    saveCustomPreset(presetNameInput.trim());
    setPresetNameInput('');
    setIsSaveModalOpen(false);
  };

  const handleGuideClick = () => {
    if (onOpenWelcomeGuide) {
      onOpenWelcomeGuide();
    } else {
      startTour();
    }
  };

  const handleOpenToolModal = (
    modal:
      | 'missions'
      | 'troubleshooting'
      | 'renewable'
      | 'tutor'
      | 'oscilloscope'
      | 'share'
      | 'pwa'
      | 'lkpd'
  ) => {
    setIsToolsMenuOpen(false);
    setActiveModal(modal);
  };

  const isToolModalActive =
    activeModal === 'missions' ||
    activeModal === 'troubleshooting' ||
    activeModal === 'renewable' ||
    activeModal === 'tutor' ||
    activeModal === 'oscilloscope' ||
    activeModal === 'share' ||
    activeModal === 'pwa' ||
    activeModal === 'lkpd';

  return (
    <>
      <header
        id="app-header"
        className="h-14 border-b border-ink/15 bg-void-900 px-2 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-2.5 z-20 shrink-0 select-none w-full max-w-full"
      >
        {/* Left Zone: Brand Identity & Primary Desktop Curriculum Links */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink-0">
          <button
            type="button"
            onClick={() => setIsCreditsModalOpen(true)}
            aria-label={
              isId
                ? 'Circuit Sandbox SMPN 12 Surabaya, buka info dan rujukan'
                : 'Circuit Sandbox SMPN 12 Surabaya, open credits and references'
            }
            title={
              isId
                ? 'Circuit Sandbox · SMPN 12 Surabaya (Klik untuk Info & Referensi)'
                : 'Circuit Sandbox · SMPN 12 Surabaya (Click for Credits)'
            }
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-void-950 hover:bg-void-850 border border-control shrink-0 transition-colors active:scale-95 cursor-pointer overflow-hidden"
          >
            <img
              src="/assets/logo-circuit-sandbox.png"
              alt="Circuit Sandbox"
              width={32}
              height={32}
              fetchPriority="high"
              className="w-8 h-8 object-contain pointer-events-none select-none"
            />
          </button>

          <div className="hidden md:block min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-ink tracking-tight whitespace-nowrap leading-[1.15]">
              Circuit Sandbox
            </h1>
            <p className="text-[11px] text-slate-400 hidden 2xl:block truncate">
              {t.appSubtitle}
            </p>
          </div>

          {/* Desktop Navigation (Tugas, Contoh, Akademi, Alat Lain) */}
          <nav
            aria-label={isId ? 'Navigasi Modul Utama' : 'Primary Module Navigation'}
            className="hidden lg:flex items-center gap-1.5 pl-1"
          >
            <button
              type="button"
              onClick={() => openLkpdModal({ tab: 'student' })}
              className={`flex items-center gap-1.5 min-h-[40px] px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors active:scale-95 cursor-pointer ${
                activeModal === 'lkpd' || activeModal === 'missions'
                  ? 'bg-electric-600 text-white border-electric-500'
                  : 'bg-void-950 hover:bg-void-850 text-ink border-control'
              }`}
              title={isId ? '5 Tugas Praktikum & LKPD' : '5 Lab Tasks & LKPD'}
            >
              <ClipboardCheck
                className={`w-3.5 h-3.5 shrink-0 ${
                  activeModal === 'lkpd' || activeModal === 'missions' ? 'text-white' : 'text-amber-400'
                }`}
                aria-hidden="true"
              />
              <span>{isId ? 'Tugas' : 'Labs'}</span>
            </button>

            <button
              id="tour-dropdown-contoh"
              type="button"
              onClick={() => setActiveModal('gallery')}
              className={`flex items-center gap-1.5 min-h-[40px] px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors active:scale-95 cursor-pointer ${
                activeModal === 'gallery'
                  ? 'bg-electric-600 text-white border-electric-500'
                  : 'bg-void-950 hover:bg-void-850 text-ink border-control'
              }`}
              title={isId ? 'Buka Contoh Rangkaian Visual' : 'Open Visual Preset Gallery'}
            >
              <LayoutGrid
                className={`w-3.5 h-3.5 shrink-0 ${
                  activeModal === 'gallery' ? 'text-white' : 'text-emerald-400'
                }`}
                aria-hidden="true"
              />
              <span>{isId ? 'Contoh' : 'Presets'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('academy')}
              className={`flex items-center gap-1.5 min-h-[40px] px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors active:scale-95 cursor-pointer ${
                activeModal === 'academy'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-void-950 hover:bg-void-850 text-ink border-control'
              }`}
              title={isId ? 'Akademi Kelistrikan & Kurikulum' : 'Electrical Academy & Curriculum'}
            >
              <GraduationCap
                className={`w-3.5 h-3.5 shrink-0 ${
                  activeModal === 'academy' ? 'text-white' : 'text-emerald-400'
                }`}
                aria-hidden="true"
              />
              <span>{isId ? 'Akademi' : 'Academy'}</span>
            </button>

            {/* Lean Dropdown Menu for Secondary Instruments & Teacher Tools */}
            <div ref={toolsMenuContainerRef} className="relative">
              <button
                ref={toolsMenuButtonRef}
                type="button"
                aria-expanded={isToolsMenuOpen}
                aria-haspopup="menu"
                aria-controls="lab-tools-menu"
                onClick={() => setIsToolsMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 min-h-[40px] px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors active:scale-95 cursor-pointer ${
                  isToolsMenuOpen || isToolModalActive
                    ? 'bg-electric-500/15 border-electric-500 text-ink'
                    : 'bg-void-950 hover:bg-void-850 text-ink border-control'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-electric-400 shrink-0" aria-hidden="true" />
                <span>{isId ? 'Alat Lab' : 'Lab Tools'}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    isToolsMenuOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {isToolsMenuOpen && (
                <div
                  id="lab-tools-menu"
                  role="menu"
                  aria-label={isId ? 'Menu Alat Laboratorium' : 'Laboratory Tools Menu'}
                  className="absolute left-0 top-full mt-2 w-60 rounded-2xl bg-void-900 border border-control shadow-2xl p-1.5 z-50 space-y-1"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      openLkpdModal({ tab: 'packets' });
                    }}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center gap-2.5 text-left hover:bg-void-850 text-ink transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {isId ? 'Mode Guru & LKPD' : 'Teacher Mode & LKPD'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {isId ? 'Bagikan QR, cetak A4 & rekap CSV' : 'Share QR, print A4 & CSV grades'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleOpenToolModal('oscilloscope')}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center gap-2.5 text-left hover:bg-void-850 text-ink transition-colors cursor-pointer"
                  >
                    <Activity className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {isId ? 'Oskiloskop Live' : 'Live Oscilloscope'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {isId ? 'Grafik gelombang V, I, P' : 'Real-time V, I, P waveforms'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleOpenToolModal('tutor')}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center gap-2.5 text-left hover:bg-void-850 text-ink transition-colors cursor-pointer"
                  >
                    <Cpu className="w-4 h-4 text-electric-400 shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {isId ? 'Tutor Langkah Rumus' : 'Formula Step Tutor'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {isId ? 'Hitungan Hukum Ohm & Kirchhoff' : 'Step-by-step circuit math'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleOpenToolModal('troubleshooting')}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center gap-2.5 text-left hover:bg-void-850 text-ink transition-colors cursor-pointer"
                  >
                    <Wrench className="w-4 h-4 text-slate-300 shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {isId ? 'Latihan Perbaikan' : 'Fault Repair Lab'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {isId ? '6 kasus cari gangguan kabel' : '6 fault diagnosis cases'}
                      </div>
                    </div>
                  </button>

                  {worldMode === 'outside' && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleOpenToolModal('renewable')}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center gap-2.5 text-left hover:bg-void-850 text-ink transition-colors cursor-pointer"
                    >
                      <Sun className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {isId ? 'Panel Microgrid EBT' : 'Renewable Microgrid'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {isId ? 'Daya surya, angin & baterai' : 'Solar, wind & BESS balance'}
                        </div>
                      </div>
                    </button>
                  )}

                  <div className="h-px bg-ink/15 my-1" role="separator" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleOpenToolModal('share')}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center gap-2.5 text-left hover:bg-void-850 text-ink transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-electric-400 shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {isId ? 'Bagikan & QR' : 'Share & QR'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {isId ? 'Tautan, QR & berkas .circuit' : 'Link, QR & .circuit file'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleOpenToolModal('pwa')}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center gap-2.5 text-left hover:bg-void-850 text-ink transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {isId ? 'Pasang & Mode Offline' : 'Install & Offline Mode'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {isId ? 'Pasang ke perangkat tanpa kuota' : 'Install for offline classroom'}
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Center Zone: Segmented 2-Mode World Switcher Capsule */}
        <div
          id="tour-btn-world"
          role="group"
          aria-label={isId ? 'Pilih Dunia Simulasi' : 'Select Simulation World'}
          className="flex items-center bg-void-950 border border-control rounded-xl p-0.5 shrink-0"
        >
          <button
            type="button"
            disabled={isTransitioningWorld}
            aria-pressed={worldMode === 'lab'}
            onClick={() => {
              if (worldMode !== 'lab') triggerWorldTransition('lab');
            }}
            className={`flex items-center gap-1 min-h-[36px] px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-colors active:scale-95 cursor-pointer disabled:opacity-50 ${
              worldMode === 'lab'
                ? 'bg-electric-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-ink hover:bg-ink/5'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="sm:hidden">Lab</span>
            <span className="hidden sm:inline">{isId ? 'Lab Rangkaian' : 'Lab Mode'}</span>
          </button>

          <button
            type="button"
            disabled={isTransitioningWorld}
            aria-pressed={worldMode === 'outside'}
            onClick={() => {
              if (worldMode !== 'outside') triggerWorldTransition('outside');
            }}
            className={`flex items-center gap-1 min-h-[36px] px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-colors active:scale-95 cursor-pointer disabled:opacity-50 ${
              worldMode === 'outside'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10'
            }`}
          >
            <Trees className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{isId ? 'Alam EBT' : 'Outdoor EBT'}</span>
          </button>
        </div>

        {/* Right Zone: Short-Circuit Alert, Save, Guide, Theme/Lang (Tablet+Desktop), Safe Reset */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {simulation.isShortCircuit && (
            <div
              role="status"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-danger-600 text-white text-[10px] sm:text-xs font-bold whitespace-nowrap shrink-0"
            >
              <AlertOctagon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden md:inline">{t.statusShort}</span>
              <span className="md:hidden">{isId ? 'Korslet' : 'Short'}</span>
            </div>
          )}

          {/* Save Preset (Desktop) */}
          <button
            id="tour-btn-save"
            type="button"
            onClick={() => setIsSaveModalOpen(true)}
            aria-label={t.savePresetModalTitle}
            className="hidden lg:flex items-center justify-center gap-1.5 min-w-[40px] min-h-[40px] px-2 2xl:px-2.5 py-1.5 rounded-xl bg-void-950 hover:bg-void-850 text-electric-400 border border-control text-xs font-semibold transition-colors active:scale-95 shrink-0 cursor-pointer"
            title={t.savePresetModalTitle}
          >
            <BookmarkPlus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="hidden 2xl:inline">{t.savePresetBtn}</span>
          </button>

          {/* Labeled Interactive Guide Button */}
          <button
            id="tour-btn-help"
            type="button"
            onClick={handleGuideClick}
            title={isId ? 'Buka Panduan & Contekan Guru' : 'Open Guide & Teacher Cards'}
            aria-label={isId ? 'Buka Panduan & Contekan Guru' : 'Open Guide & Teacher Cards'}
            className="flex items-center justify-center gap-1 min-w-[40px] min-h-[40px] px-2 2xl:px-2.5 py-1.5 rounded-xl bg-void-950 hover:bg-void-850 border border-control text-ink text-[11px] sm:text-xs font-bold transition-colors active:scale-95 shrink-0 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-electric-400 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline lg:hidden 2xl:inline">{isId ? 'Panduan' : 'Guide'}</span>
          </button>

          {/* Theme & Language Controls (Tablet >= 768px & Desktop >= 1024px) */}
          <div className="hidden md:flex items-center bg-void-950 border border-control rounded-xl p-0.5 shrink-0">
            <button
              id="tour-btn-theme"
              type="button"
              onClick={toggleTheme}
              title={
                theme === 'dark'
                  ? isId
                    ? 'Mode Buku Lab (Kertas Terang)'
                    : 'Lab Notebook Mode (Light)'
                  : isId
                  ? 'Mode Gelap (Oscilloscope Bench)'
                  : 'Dark Mode (Oscilloscope Bench)'
              }
              aria-label={
                theme === 'dark'
                  ? isId
                    ? 'Ubah ke Mode Terang'
                    : 'Switch to Light Mode'
                  : isId
                  ? 'Ubah ke Mode Gelap'
                  : 'Switch to Dark Mode'
              }
              className="flex items-center justify-center min-w-[36px] min-h-[36px] px-2 rounded-lg text-slate-300 hover:text-ink hover:bg-ink/5 text-xs font-mono font-bold transition-colors active:scale-95 shrink-0 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-electric-400" aria-hidden="true" />
              )}
            </button>

            <div className="w-px h-4 bg-ink/15 shrink-0" />

            <button
              type="button"
              onClick={toggleLanguage}
              title={t.langToggleTitle}
              aria-label={t.langToggleTitle}
              className="flex items-center gap-1 min-h-[36px] px-2 rounded-lg text-slate-300 hover:text-ink hover:bg-ink/5 text-xs font-mono font-bold transition-colors active:scale-95 shrink-0 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span>{language === 'id' ? 'ID' : 'EN'}</span>
            </button>
          </div>

          {/* 1-Tap Undo Button (Tablet & Desktop; mobile gets a thumb-reachable floating pill) */}
          <button
            id="tour-btn-undo"
            type="button"
            disabled={!canUndo}
            onClick={undo}
            aria-label={isId ? 'Batalkan langkah terakhir (Ctrl+Z)' : 'Undo last action (Ctrl+Z)'}
            title={isId ? 'Urungkan (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
            className="hidden sm:flex items-center justify-center gap-1 min-w-[40px] min-h-[40px] px-2 2xl:px-2.5 py-1.5 rounded-xl bg-void-950 hover:bg-void-850 disabled:opacity-40 disabled:cursor-not-allowed border border-control text-ink text-xs font-semibold transition-colors active:scale-95 shrink-0 cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5 text-slate-300 shrink-0" aria-hidden="true" />
            <span className="hidden 2xl:inline">{isId ? 'Urungkan' : 'Undo'}</span>
          </button>

          {/* Safe Reset Button */}
          <button
            id="tour-btn-reset"
            type="button"
            onClick={() => setIsResetDialogOpen(true)}
            aria-label={t.clearTitle || (isId ? 'Reset Rangkaian' : 'Reset Circuit')}
            className="flex items-center justify-center gap-1 min-w-[40px] min-h-[40px] px-2 2xl:px-2.5 py-1.5 rounded-xl bg-danger-950/60 hover:bg-danger-600 hover:text-white border border-danger-500/60 text-danger-300 text-[11px] sm:text-xs font-bold transition-colors active:scale-95 shrink-0 cursor-pointer"
            title={t.clearTitle}
          >
            <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline lg:hidden 2xl:inline">{isId ? 'Reset' : 'Reset'}</span>
          </button>

          {/* Compact Mobile & Tablet Menu Button (< 1024px) */}
          {onOpenMobileHub && (
            <button
              id="tour-btn-menu"
              type="button"
              onClick={onOpenMobileHub}
              aria-label={isId ? 'Buka menu dan pengaturan' : 'Open menu and settings'}
              aria-expanded={isMobileHubOpen}
              className={`lg:hidden flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl border transition-colors active:scale-95 shrink-0 cursor-pointer ${
                isMobileHubOpen
                  ? 'bg-electric-600 text-white border-electric-700'
                  : 'bg-void-950 hover:bg-void-850 border-control text-ink'
              }`}
            >
              <Menu className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      {/* Code-split Secondary Modals with Accessible Suspense Loading Indicator */}
      <React.Suspense
        fallback={
          activeModal || isCreditsModalOpen ? (
            <div
              role="status"
              aria-live="polite"
              className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/60 p-4"
            >
              <div className="px-4 py-2.5 rounded-xl bg-void-900 border border-control text-xs font-mono font-semibold text-ink shadow-xl">
                {isId ? 'Memuat modul praktikum...' : 'Loading lab module...'}
              </div>
            </div>
          ) : null
        }
      >
        {activeModal === 'academy' && (
          <AcademyModal isOpen={true} onClose={() => setActiveModal(null)} />
        )}

        {activeModal === 'troubleshooting' && (
          <TroubleshootingModal isOpen={true} onClose={() => setActiveModal(null)} />
        )}

        {activeModal === 'renewable' && (
          <RenewableLabModal isOpen={true} onClose={() => setActiveModal(null)} />
        )}

        {activeModal === 'tutor' && (
          <ExplainableTutorModal isOpen={true} onClose={() => setActiveModal(null)} />
        )}

        {activeModal === 'gallery' && (
          <PresetGalleryModal isOpen={true} onClose={() => setActiveModal(null)} />
        )}

        {(activeModal === 'missions' || activeModal === 'lkpd') && (
          <LkpdTeacherModal isOpen={true} onClose={() => setActiveModal(null)} />
        )}

        {activeModal === 'oscilloscope' && (
          <OscilloscopeModal isOpen={true} onClose={() => setActiveModal(null)} />
        )}

        {activeModal === 'share' && (
          <CircuitShareModal isOpen={true} onClose={() => setActiveModal(null)} />
        )}

        {activeModal === 'pwa' && (
          <PwaOfflineModal isOpen={true} onClose={() => setActiveModal(null)} />
        )}

        {isCreditsModalOpen && (
          <CreditsModal isOpen={true} onClose={() => setIsCreditsModalOpen(false)} />
        )}
      </React.Suspense>

      {/* Safe Reset Confirmation Dialog */}
      {isResetDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-dialog-title"
          onClick={() => setIsResetDialogOpen(false)}
        >
          <div
            ref={resetModalRef}
            className="w-full max-w-md rounded-2xl bg-void-900 border border-control shadow-2xl overflow-hidden text-ink"
            onClick={(e) => e.stopPropagation()}
          >
            <LabModalHeader
              titleId="reset-dialog-title"
              eyebrow={isId ? 'MANAJEMEN KANVAS' : 'CANVAS RESET'}
              title={isId ? 'Atur Ulang Kanvas?' : 'Reset Circuit Canvas?'}
              subtitle={
                isId
                  ? 'Pilih mulai dari rangkaian kosong atau muat contoh Lampu Dasar.'
                  : 'Choose whether to clear the canvas or restore the Simple Lamp preset.'
              }
              onClose={() => setIsResetDialogOpen(false)}
              closeLabel={isId ? 'Batal atur ulang' : 'Cancel reset'}
            />

            <div className="p-4 sm:p-5 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                {isId
                  ? 'Seluruh komponen dan kabel yang sedang terpasang di kanvas saat ini akan diganti atau dibersihkan.'
                  : 'All components and wires currently placed on the workspace canvas will be replaced or removed.'}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetDialogOpen(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold bg-void-850 hover:bg-void-800 text-ink border border-control active:scale-95 transition-colors cursor-pointer"
                >
                  {isId ? 'Batal' : 'Cancel'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    loadPreset('simple-lamp');
                    runSimulation();
                    setIsResetDialogOpen(false);
                    notify(
                      isId
                        ? 'Rangkaian contoh Lampu Dasar dimuat.'
                        : 'Simple Lamp starter circuit restored.'
                    );
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-void-950 hover:bg-void-850 text-ink border border-control flex items-center justify-center gap-1.5 active:scale-95 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-electric-400" aria-hidden="true" />
                  <span>{isId ? 'Muat Lampu Dasar' : 'Load Simple Lamp'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    clearCanvas();
                    setIsResetDialogOpen(false);
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white flex items-center justify-center gap-1.5 active:scale-95 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isId ? 'Kosongkan Kanvas' : 'Clear Canvas'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Save Custom Preset */}
      {isSaveModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-preset-modal-title"
          onClick={() => setIsSaveModalOpen(false)}
        >
          <div
            ref={saveModalRef}
            className="w-full max-w-md rounded-2xl bg-void-900 border border-control shadow-2xl overflow-hidden text-ink"
            onClick={(e) => e.stopPropagation()}
          >
            <LabModalHeader
              titleId="save-preset-modal-title"
              eyebrow={isId ? 'PENYIMPANAN LOKAL BROWSER' : 'LOCAL BROWSER STORAGE'}
              title={t.savePresetModalTitle}
              onClose={() => setIsSaveModalOpen(false)}
              closeLabel={isId ? 'Tutup dialog simpan' : 'Close save dialog'}
            />

            <form onSubmit={handleSavePresetSubmit} className="p-4 sm:p-5 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                {isId
                  ? 'Rangkaian yang kamu buat akan disimpan di memori browser (LocalStorage) dan bisa dibuka kapan saja dari daftar Contoh Rangkaian.'
                  : 'Your custom circuit will be saved in your browser storage (LocalStorage) and available anytime under the Presets gallery.'}
              </p>

              <div className="space-y-1.5">
                <label
                  htmlFor="presetNameInput"
                  className="block text-xs font-semibold text-ink"
                >
                  {isId ? 'Nama Rangkaian' : 'Circuit Name'}
                </label>
                <input
                  id="presetNameInput"
                  type="text"
                  data-autofocus
                  value={presetNameInput}
                  onChange={(e) => setPresetNameInput(e.target.value)}
                  placeholder={t.savePresetPlaceholder}
                  autoFocus
                  maxLength={50}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-void-950 border border-control text-xs sm:text-sm text-ink placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold bg-void-850 hover:bg-void-800 text-ink border border-control active:scale-95 transition-colors cursor-pointer"
                >
                  {isId ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!presetNameInput.trim()}
                  className="min-h-[44px] px-5 py-2 rounded-xl text-xs font-bold bg-electric-600 hover:bg-electric-500 text-white disabled:opacity-45 active:scale-95 transition-colors cursor-pointer"
                >
                  {isId ? 'Simpan' : 'Save'}
                </button>
              </div>

              {customPresets.length > 0 && (
                <div className="pt-3 border-t border-ink/15 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-electric-400" aria-hidden="true" />
                    <span>{isId ? 'Preset Tersimpan di Browser' : 'Saved Browser Presets'}</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {customPresets.map((preset) => (
                      <div
                        key={preset.id}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-void-950 border border-ink/15 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <Bookmark className="w-3.5 h-3.5 text-copper-text shrink-0" aria-hidden="true" />
                          <span className="text-ink font-medium truncate">{preset.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteCustomPreset(preset.id)}
                          aria-label={`${isId ? 'Hapus preset' : 'Delete preset'} ${preset.name}`}
                          title={isId ? 'Hapus' : 'Delete'}
                          className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center hover:bg-danger-600 hover:text-white text-slate-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
};
