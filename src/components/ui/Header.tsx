import React, { useState } from 'react';
import {
  Trash2,
  AlertOctagon,
  RotateCcw,
  Globe,
  BookmarkPlus,
  X,
  FolderOpen,
  HelpCircle,
  Trees,
  FlaskConical,
  LayoutGrid,
  Trophy,
  Activity,
  Share2,
  Sun,
  Moon,
  GraduationCap,
  Wrench,
  Cpu,
} from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { startTour } from '../../utils/tour';

// Code-splitting secondary modals to optimize initial bundle size & time-to-interactive
const CreditsModal = React.lazy(() =>
  import('./CreditsModal').then((m) => ({ default: m.CreditsModal }))
);
const PresetGalleryModal = React.lazy(() =>
  import('./presets/PresetGalleryModal').then((m) => ({ default: m.PresetGalleryModal }))
);
const MissionModal = React.lazy(() =>
  import('./missions/MissionModal').then((m) => ({ default: m.MissionModal }))
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

export interface HeaderProps {
  /** Opens the Teacher & Student Quick-Start Guide / Interactive Practice modal. */
  onOpenWelcomeGuide?: () => void;
  /** Controlled state for the Save Custom Circuit modal (accessible from Header & Mobile Menu). */
  isSaveModalOpen?: boolean;
  /** Setter for the Save Custom Circuit modal state. */
  onSaveModalOpenChange?: (isOpen: boolean) => void;
}

/**
 * Top Application Header (`Header.tsx`).
 *
 * Implements Option A ("Clean Classroom Dock"):
 * - On mobile (`< lg`), eliminates the 10-icon unlabeled clutter and duplicate Gallery/Academy
 *   icons. Displays only:
 *   1. Brand Logo (`CreditsModal`)
 *   2. Labeled 2-Mode Segmented World Switcher (`[Lab Rangkaian]` | `[Alam EBT]`)
 *   3. Labeled `[? Panduan]` button
 *   4. Labeled `[Reset]` button
 * - On desktop (`lg:`), displays the full horizontal studio bar.
 *
 * Time Complexity: O(1) render.
 */
export const Header: React.FC<HeaderProps> = ({
  onOpenWelcomeGuide,
  isSaveModalOpen: externalSaveModalOpen,
  onSaveModalOpenChange,
}) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const clearCanvas = useCircuitStore((state) => state.clearCanvas);
  const loadPreset = useCircuitStore((state) => state.loadPreset);
  const runSimulation = useCircuitStore((state) => state.runSimulation);
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
  const theme = useCircuitStore((state) => state.theme);
  const toggleTheme = useCircuitStore((state) => state.toggleTheme);

  const [internalSaveModalOpen, setInternalSaveModalOpen] = useState<boolean>(false);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState<boolean>(false);
  const [presetNameInput, setPresetNameInput] = useState<string>('');

  const isSaveModalOpen = externalSaveModalOpen ?? internalSaveModalOpen;
  const setIsSaveModalOpen = onSaveModalOpenChange ?? setInternalSaveModalOpen;

  const t = TRANSLATIONS[language].header;
  const isId = language === 'id';

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

  return (
    <>
      <header
        id="app-header"
        className="h-13 sm:h-14 border-b border-white/10 bg-void-900 px-2 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-2 z-20 shrink-0 select-none w-full max-w-full"
      >
        {/* Left: Brand Identity & Desktop Feature Launchers */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink-0">
          <button
            type="button"
            onClick={() => setIsCreditsModalOpen(true)}
            title={
              isId
                ? 'Circuit Sandbox · Karya SMPN 12 Surabaya (Klik untuk Info & Referensi)'
                : 'Circuit Sandbox · By SMPN 12 Surabaya (Click for Credits)'
            }
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-void-950 hover:bg-void-850 border border-white/15 shrink-0 transition-transform active:scale-95 cursor-pointer overflow-hidden"
          >
            <img
              src="/assets/logo-circuit-sandbox.png"
              alt="Circuit Sandbox"
              width={32}
              height={32}
              fetchPriority="high"
              className="w-full h-full object-contain pointer-events-none select-none"
            />
          </button>

          <div className="hidden md:block min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-slate-100 tracking-tight flex items-center gap-1.5 whitespace-nowrap leading-[1.1] pb-0.5">
              <span>Circuit Sandbox</span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden xl:block truncate">
              {t.appSubtitle}
            </p>
          </div>

          {/* Desktop Quick-Access Top Pills (Hidden on Mobile where Bottom Dock & Menu Lab organize them cleanly) */}
          <div className="hidden lg:flex items-center gap-1 pl-1">
            <button
              type="button"
              onClick={() => setActiveModal('academy')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
              title={isId ? 'Akademi Kelistrikan & Kurikulum' : 'Electrical Academy & Curriculum'}
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isId ? 'Akademi' : 'Academy'}</span>
            </button>

            <button
              id="tour-dropdown-contoh"
              type="button"
              onClick={() => setActiveModal('gallery')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-void-950 hover:bg-void-850 text-slate-200 hover:text-white border border-white/10 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              title={isId ? 'Buka Contoh Rangkaian Visual' : 'Open Visual Preset Gallery'}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
              <span>{isId ? 'Contoh (5)' : 'Presets (5)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('missions')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-void-950 hover:bg-void-850 text-slate-200 hover:text-white border border-white/10 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              title={isId ? 'Misi & Tantangan Praktikum IPA' : 'Missions & Challenges'}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{isId ? 'Misi' : 'Missions'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('troubleshooting')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-void-950 hover:bg-void-850 text-slate-200 hover:text-white border border-white/10 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              title={isId ? 'Lab Pemecahan Masalah & Diagnostik Gangguan' : 'Troubleshooting & Fault Injection Lab'}
            >
              <Wrench className="w-3.5 h-3.5 text-slate-300" />
              <span>{isId ? 'Korsleting' : 'Fault Lab'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('renewable')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-void-950 hover:bg-void-850 text-slate-200 hover:text-white border border-white/10 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              title={isId ? 'Digital Twin Energi Terbarukan & Microgrid' : 'Renewable Energy & Microgrid Digital Twin'}
            >
              <Sun className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isId ? 'Microgrid' : 'Microgrid'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('tutor')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-void-950 hover:bg-void-850 text-slate-200 hover:text-white border border-white/10 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              title={isId ? 'Tutor Fisika Rangkaian Terjelaskan' : 'Explainable Circuit Physics Tutor'}
            >
              <Cpu className="w-3.5 h-3.5 text-electric-400" />
              <span>Tutor</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('oscilloscope')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-void-950 hover:bg-void-850 text-slate-200 hover:text-white border border-white/10 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              title={isId ? 'Oskiloskop & Analitik Listrik' : 'Oscilloscope & Analytics'}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Scope</span>
            </button>

            <button
              id="tour-btn-save"
              type="button"
              onClick={() => setIsSaveModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-void-950 hover:bg-void-850 text-electric-300 border border-white/10 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              title={t.savePresetModalTitle}
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-electric-400" />
              <span>{t.savePresetBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('share')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-void-950 hover:bg-void-850 text-slate-200 hover:text-white border border-white/10 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              title={isId ? 'Ekspor, Impor & Bagikan QR' : 'Share & Export'}
            >
              <Share2 className="w-3.5 h-3.5 text-electric-400" />
              <span>{isId ? 'Bagikan' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Center: Segmented 2-Mode World Switcher Capsule (Clear on Mobile & Desktop!) */}
        <div
          id="tour-btn-world"
          role="group"
          aria-label={isId ? 'Pilih Dunia Simulasi' : 'Select Simulation World'}
          className="flex items-center bg-void-950 border border-white/15 rounded-xl p-0.5 shadow-inner shrink-0"
        >
          <button
            type="button"
            disabled={isTransitioningWorld}
            onClick={() => {
              if (worldMode !== 'lab') triggerWorldTransition('lab');
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${
              worldMode === 'lab'
                ? 'bg-electric-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 shrink-0" />
            <span>{isId ? 'Lab Rangkaian' : 'Lab Mode'}</span>
          </button>

          <button
            type="button"
            disabled={isTransitioningWorld}
            onClick={() => {
              if (worldMode !== 'outside') triggerWorldTransition('outside');
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${
              worldMode === 'outside'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10'
            }`}
          >
            <Trees className="w-3.5 h-3.5 shrink-0" />
            <span>{isId ? 'Alam EBT' : 'Outdoor EBT'}</span>
          </button>
        </div>

        {/* Right: Labeled Guide & Reset Buttons (+ Desktop Theme/Lang Utility) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Short-Circuit Alert Pill */}
          {simulation.isShortCircuit && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl bg-danger-500/15 border border-danger-500/40 text-danger-500 text-[10px] sm:text-xs font-semibold animate-pulse whitespace-nowrap shrink-0">
              <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">{t.statusShort}</span>
              <span className="md:hidden">{isId ? 'Korslet' : 'Short'}</span>
            </div>
          )}

          {/* Labeled Interactive Guide Button (Always has text label on mobile!) */}
          <button
            id="tour-btn-help"
            type="button"
            onClick={handleGuideClick}
            title={isId ? 'Buka Panduan & Contekan Guru' : 'Open Guide & Teacher Cards'}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-void-950 hover:bg-void-850 border border-electric-500/35 text-slate-100 hover:text-white text-[11px] sm:text-xs font-bold transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-electric-400 shrink-0" />
            <span>{isId ? 'Panduan' : 'Guide'}</span>
          </button>

          {/* Desktop-Only Theme & Language Buttons (On mobile, these live with full labels inside 'Menu Lab') */}
          <div className="hidden lg:flex items-center bg-void-950 border border-white/10 rounded-xl p-0.5 shadow-inner shrink-0">
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
                  ? 'Mode Gelap (Dark Mode)'
                  : 'Dark Mode'
              }
              aria-label="Toggle Theme"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-xs font-mono font-bold transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-electric-400" />
              )}
            </button>

            <div className="w-px h-4 bg-white/10 shrink-0" />

            <button
              type="button"
              onClick={toggleLanguage}
              title={t.langToggleTitle}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-xs font-mono font-bold transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{language === 'id' ? 'ID' : 'EN'}</span>
            </button>

            <div className="w-px h-4 bg-white/10 shrink-0" />

            <button
              type="button"
              onClick={() => loadPreset('simple-lamp')}
              onClickCapture={runSimulation}
              title={t.resetTitle}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-xs font-medium transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Labeled Clear / Reset Canvas Button */}
          <button
            id="tour-btn-reset"
            type="button"
            onClick={clearCanvas}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-red-200 hover:text-white text-[11px] sm:text-xs font-bold transition-all active:scale-95 shrink-0 cursor-pointer"
            title={t.clearTitle}
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>{isId ? 'Reset' : 'Clear'}</span>
          </button>
        </div>
      </header>

      {/* Code-split Secondary Modals with Suspense */}
      <React.Suspense fallback={null}>
        {activeModal === 'academy' && (
          <AcademyModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'troubleshooting' && (
          <TroubleshootingModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'renewable' && (
          <RenewableLabModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'tutor' && (
          <ExplainableTutorModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'gallery' && (
          <PresetGalleryModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'missions' && (
          <MissionModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'oscilloscope' && (
          <OscilloscopeModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'share' && (
          <CircuitShareModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}

        {isCreditsModalOpen && (
          <CreditsModal
            isOpen={true}
            onClose={() => setIsCreditsModalOpen(false)}
          />
        )}
      </React.Suspense>

      {/* Modal: Save Custom Preset */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-void-900 border border-white/15 shadow-2xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between bg-void-850">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-4 h-4 text-electric-400" />
                <h2 className="text-sm font-bold text-slate-100">
                  {t.savePresetModalTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePresetSubmit} className="p-4 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                {isId
                  ? 'Rangkaian yang kamu buat akan disimpan di cache browser (LocalStorage) agar tidak hilang dan bisa dibuka kapan saja dari daftar Contoh Rangkaian.'
                  : 'Your custom circuit will be saved in your browser cache (LocalStorage) and available anytime under the Presets gallery.'}
              </p>

              <div>
                <input
                  type="text"
                  value={presetNameInput}
                  onChange={(e) => setPresetNameInput(e.target.value)}
                  placeholder={t.savePresetPlaceholder}
                  autoFocus
                  maxLength={50}
                  className="w-full px-3 py-2 rounded-xl bg-void-950 border border-white/15 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-electric-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-void-850 hover:bg-white/5 text-slate-300 border border-white/10 active:scale-95 transition-all cursor-pointer"
                >
                  {isId ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!presetNameInput.trim()}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-electric-500 hover:bg-electric-400 text-white disabled:opacity-50 active:scale-95 transition-all cursor-pointer font-bold shadow-sm"
                >
                  {isId ? 'Simpan' : 'Save'}
                </button>
              </div>

              {customPresets.length > 0 && (
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-electric-400" />
                    <span>{isId ? 'Preset Tersimpan di Browser' : 'Saved Browser Presets'}</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {customPresets.map((preset) => (
                      <div
                        key={preset.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-void-950 border border-white/5 text-xs"
                      >
                        <span className="text-slate-200 truncate pr-2">★ {preset.name}</span>
                        <button
                          type="button"
                          onClick={() => deleteCustomPreset(preset.id)}
                          className="p-1 rounded hover:bg-red-950/60 text-slate-500 hover:text-red-400 transition-colors"
                          title={isId ? 'Hapus' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
