import React, { useState } from 'react';
import {
  Zap,
  Trash2,
  BookOpen,
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
} from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { startTour } from '../../utils/tour';
import { CreditsModal } from './CreditsModal';
import { PresetGalleryModal } from './presets/PresetGalleryModal';
import { MissionModal } from './missions/MissionModal';
import { AcademyModal } from './academy/AcademyModal';
import { TroubleshootingModal } from './troubleshooting/TroubleshootingModal';
import { OscilloscopeModal } from './analytics/OscilloscopeModal';
import { CircuitShareModal } from './workspace/CircuitShareModal';

export const Header: React.FC = () => {
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

  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState<boolean>(false);
  const [presetNameInput, setPresetNameInput] = useState<string>('');

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

  return (
    <>
      <header className="h-12 sm:h-14 border-b border-white/10 bg-void-900/95 backdrop-blur-md px-2 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-3 z-20 shrink-0 select-none">
        {/* Left: Brand Identity & Feature Launchers */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink-0">
          <button
            type="button"
            onClick={() => setIsCreditsModalOpen(true)}
            title={
              isId
                ? 'Circuit Sandbox — Karya SMPN 12 Surabaya'
                : 'Circuit Sandbox — By SMPN 12 Surabaya'
            }
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-electric-500/15 hover:bg-electric-500/25 border border-electric-500/30 text-electric-400 shrink-0 transition-transform active:scale-95 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-electric-400" />
          </button>
          <div className="hidden sm:block min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-slate-100 tracking-tight flex items-center gap-1.5 whitespace-nowrap leading-[1.1]">
              <span>Circuit Sandbox</span>
              <span className="hidden lg:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-electric-500/10 text-electric-400 border border-electric-500/20 font-medium whitespace-nowrap">
                IPA Kelas 9
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden md:block truncate">
              {t.appSubtitle}
            </p>
          </div>

          {/* Quick-Access Top Pills: Academy, Preset Gallery, Missions, Oscilloscope */}
          <div className="hidden lg:flex items-center gap-1 pl-1">
            <button
              type="button"
              onClick={() => setActiveModal('academy')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-electric-500/15 hover:bg-electric-500/25 text-electric-300 border border-electric-500/30 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
              title={isId ? 'Akademi Kelistrikan & Kurikulum' : 'Electrical Academy & Curriculum'}
            >
              <GraduationCap className="w-3.5 h-3.5 text-electric-400" />
              <span>{isId ? 'Akademi' : 'Academy'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('gallery')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-void-950 hover:bg-void-850 text-slate-200 hover:text-white border border-white/10 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              title={isId ? 'Buka Galeri Rangkaian Visual' : 'Open Visual Preset Gallery'}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-electric-400" />
              <span>{isId ? 'Galeri' : 'Gallery'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('missions')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              title={isId ? 'Misi & Tantangan Praktikum IPA' : 'Missions & Challenges'}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{isId ? 'Tantangan' : 'Challenges'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('troubleshooting')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              title={isId ? 'Lab Pemecahan Masalah & Diagnostik Gangguan' : 'Troubleshooting & Fault Injection Lab'}
            >
              <Wrench className="w-3.5 h-3.5 text-rose-400" />
              <span>{isId ? 'Troubleshoot' : 'Troubleshoot'}</span>
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

        {/* Center: Unified Gallery & Save Capsule (Lab Mode) or Nature Badge (Outdoor Mode) */}
        {worldMode === 'lab' ? (
          <div className="flex items-center bg-void-950/95 border border-white/10 rounded-xl p-0.5 shadow-inner shrink-0">
            {/* Direct Academy Trigger Pill */}
            <button
              type="button"
              onClick={() => setActiveModal('academy')}
              title={isId ? 'Buka Akademi Kelistrikan' : 'Open Circuit Academy'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-electric-500/15 hover:bg-electric-500/25 text-electric-300 transition-all active:scale-95 cursor-pointer text-[11px] sm:text-xs font-semibold"
            >
              <GraduationCap className="w-3.5 h-3.5 text-electric-400 shrink-0" />
              <span>{isId ? 'Akademi' : 'Academy'}</span>
            </button>

            <div className="w-px h-4 bg-white/10 shrink-0 mx-0.5" />

            {/* Direct Visual Gallery Trigger Pill */}
            <button
              id="tour-dropdown-contoh"
              type="button"
              onClick={() => setActiveModal('gallery')}
              title={isId ? 'Buka Galeri Rangkaian Interaktif' : 'Open Interactive Circuit Gallery'}
              aria-label="Open Circuit Gallery"
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg hover:bg-white/10 text-slate-200 hover:text-white transition-all active:scale-95 cursor-pointer text-[11px] sm:text-xs font-semibold"
            >
              <BookOpen className="w-3.5 h-3.5 text-electric-400 shrink-0" />
              <span>{isId ? 'Galeri Rangkaian' : 'Circuit Gallery'}</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-electric-500/20 text-electric-300 font-bold border border-electric-500/30">
                5
              </span>
            </button>

            <div className="w-px h-4 bg-white/10 shrink-0 mx-0.5" />

            {/* Save Custom Preset Action inside Unified Capsule */}
            <button
              id="tour-btn-save"
              type="button"
              onClick={() => setIsSaveModalOpen(true)}
              title={t.savePresetModalTitle}
              aria-label={t.savePresetModalTitle}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-electric-500/15 hover:bg-electric-500/25 text-electric-400 text-[11px] sm:text-xs font-semibold transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">{t.savePresetBtn}</span>
            </button>

            <button
              id="tour-btn-reset"
              type="button"
              onClick={() => loadPreset('simple-lamp')}
              className="hidden lg:flex p-1.5 ml-0.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all active:scale-95 shrink-0 cursor-pointer"
              title={t.resetTitle}
              onClickCapture={runSimulation}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-void-950 border border-emerald-500/30 text-emerald-300 text-[10px] sm:text-xs font-mono font-semibold truncate min-w-0">
            <Trees className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">
              {isId ? 'Zona Alam Terbuka' : 'Outdoor Sandbox'}
            </span>
          </div>
        )}

        {/* Right: World Switcher + Unified Dark-Glass Utility Dock */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Primary World Mode Switcher Pill */}
          <button
            id="tour-btn-world"
            type="button"
            disabled={isTransitioningWorld}
            onClick={() => triggerWorldTransition()}
            title={
              worldMode === 'lab'
                ? isId
                  ? 'Keluar ke Alam Terbuka (Outdoor Sandbox)'
                  : 'Go Outside (Outdoor Sandbox)'
                : isId
                ? 'Kembali ke Dalam Laboratorium'
                : 'Go Inside (Back to Lab)'
            }
            aria-label="Toggle World Mode"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-semibold transition-all active:scale-95 shrink-0 cursor-pointer disabled:opacity-50 ${
              worldMode === 'outside'
                ? 'bg-electric-500/15 hover:bg-electric-500/25 border-electric-400/40 text-electric-300'
                : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-400/40 text-emerald-300'
            }`}
          >
            {worldMode === 'outside' ? (
              <FlaskConical className="w-3.5 h-3.5 text-electric-400 shrink-0" />
            ) : (
              <Trees className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}
            <span className="tracking-tight">
              {worldMode === 'outside' ? (
                <>
                  <span className="hidden sm:inline">
                    {isId ? 'Masuk Lab' : 'Lab Mode'}
                  </span>
                  <span className="sm:hidden">{isId ? 'Lab' : 'Lab'}</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">
                    {isId ? 'Ke Alam' : 'Outside'}
                  </span>
                  <span className="sm:hidden">{isId ? 'Alam' : 'Outside'}</span>
                </>
              )}
            </span>
          </button>

          {/* Short-Circuit Alert Pill */}
          {simulation.isShortCircuit && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl bg-danger-500/15 border border-danger-500/40 text-danger-500 text-[10px] sm:text-xs font-semibold animate-pulse whitespace-nowrap shrink-0">
              <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">{t.statusShort}</span>
              <span className="md:hidden">{isId ? 'Korslet' : 'Short'}</span>
            </div>
          )}

          {/* Unified Dark-Glass Utility Dock */}
          <div className="flex items-center bg-void-950/95 border border-white/10 rounded-xl p-0.5 shadow-inner shrink-0">
            {/* Interactive Spotlight Tour Trigger */}
            <button
              id="tour-btn-help"
              type="button"
              onClick={() => startTour()}
              title={isId ? 'Mulai Panduan Interaktif' : 'Start Interactive Tour'}
              aria-label={isId ? 'Mulai Panduan Interaktif' : 'Start Interactive Tour'}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-[11px] font-medium transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-electric-400" />
              <span className="hidden lg:inline">{isId ? 'Panduan' : 'Guide'}</span>
            </button>

            <div className="w-px h-4 bg-white/10 shrink-0" />

            {/* Theme Toggle (Dark Mode / Buku Lab Light Mode) */}
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
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-[10px] sm:text-xs font-mono font-bold transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-electric-400" />
              )}
            </button>

            <div className="w-px h-4 bg-white/10 shrink-0" />

            {/* Language Switcher (ID / EN) */}
            <button
              type="button"
              onClick={toggleLanguage}
              title={t.langToggleTitle}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-[10px] sm:text-xs font-mono font-bold transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
              <span>{language === 'id' ? 'ID' : 'EN'}</span>
            </button>

            <div className="w-px h-4 bg-white/10 shrink-0" />

            {/* Clear Canvas Button */}
            <button
              id="tour-btn-reset"
              type="button"
              onClick={clearCanvas}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 text-xs font-medium transition-all active:scale-95 shrink-0 cursor-pointer"
              title={t.clearTitle}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.clearAll}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Circuit Academy Modal */}
      <AcademyModal
        isOpen={activeModal === 'academy'}
        onClose={() => setActiveModal(null)}
      />

      {/* Fault Injection & Troubleshooting Lab Modal */}
      <TroubleshootingModal
        isOpen={activeModal === 'troubleshooting'}
        onClose={() => setActiveModal(null)}
      />

      {/* Preset Gallery Modal */}
      <PresetGalleryModal
        isOpen={activeModal === 'gallery'}
        onClose={() => setActiveModal(null)}
      />

      {/* Mission & Challenge Mode Modal */}
      <MissionModal
        isOpen={activeModal === 'missions'}
        onClose={() => setActiveModal(null)}
      />

      {/* Live Oscilloscope & Electrical Analytics Modal */}
      <OscilloscopeModal
        isOpen={activeModal === 'oscilloscope'}
        onClose={() => setActiveModal(null)}
      />

      {/* Workspace Persistence, QR Code & Share Modal */}
      <CircuitShareModal
        isOpen={activeModal === 'share'}
        onClose={() => setActiveModal(null)}
      />

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
                  : 'Your custom circuit will be saved in your browser cache (LocalStorage) and available anytime under the Presets dropdown.'}
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

      {/* Credits Modal */}
      <CreditsModal
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
      />
    </>
  );
};
