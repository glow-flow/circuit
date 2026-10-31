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
  Users,
} from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { startTour } from '../../utils/tour';
import { CreditsModal } from './CreditsModal';

export const Header: React.FC = () => {
  const simulation = useCircuitStore((state) => state.simulation);
  const clearCanvas = useCircuitStore((state) => state.clearCanvas);
  const loadPreset = useCircuitStore((state) => state.loadPreset);
  const runSimulation = useCircuitStore((state) => state.runSimulation);
  const language = useCircuitStore((state) => state.language);
  const setLanguage = useCircuitStore((state) => state.setLanguage);
  const customPresets = useCircuitStore((state) => state.customPresets);
  const saveCustomPreset = useCircuitStore((state) => state.saveCustomPreset);
  const loadCustomPreset = useCircuitStore((state) => state.loadCustomPreset);
  const deleteCustomPreset = useCircuitStore((state) => state.deleteCustomPreset);
  const worldMode = useCircuitStore((state) => state.worldMode);
  const isTransitioningWorld = useCircuitStore((state) => state.isTransitioningWorld);
  const triggerWorldTransition = useCircuitStore((state) => state.triggerWorldTransition);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');

  const t = TRANSLATIONS[language].header;

  const toggleLanguage = () => {
    setLanguage(language === 'id' ? 'en' : 'id');
  };

  const handlePresetSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;

    if (val === 'action:save') {
      setIsSaveModalOpen(true);
    } else if (val.startsWith('custom:')) {
      const customId = val.replace('custom:', '');
      loadCustomPreset(customId);
    } else {
      loadPreset(val as any);
    }
    e.target.value = '';
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
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <button
            type="button"
            onClick={() => setIsCreditsModalOpen(true)}
            title={
              language === 'id'
                ? 'Circuit Sandbox — Karya SMPN 12 Surabaya'
                : 'Circuit Sandbox — By SMPN 12 Surabaya'
            }
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-electric-500/15 hover:bg-electric-500/25 border border-electric-500/30 text-electric-400 shadow-glow shrink-0 transition-transform active:scale-95 cursor-pointer"
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
        </div>

        {/* Center: Unified Preset & Save Capsule (Lab Mode) or Nature Badge (Outdoor Mode) */}
        {worldMode === 'lab' ? (
          <div className="flex-1 min-w-0 max-w-[210px] xs:max-w-[240px] sm:max-w-xs md:max-w-md flex items-center bg-void-950/95 border border-white/10 rounded-xl p-0.5 shadow-inner">
            <div className="hidden md:flex items-center pl-2.5 pr-1 text-slate-400 shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-electric-400" />
            </div>
            <select
              id="tour-dropdown-contoh"
              onChange={handlePresetSelectChange}
              defaultValue=""
              aria-label="Circuit Presets"
              className="flex-1 min-w-0 w-full text-[11px] sm:text-xs bg-transparent text-slate-200 rounded-lg px-2 py-1.5 truncate focus:outline-none cursor-pointer"
            >
              <option value="" disabled className="bg-void-950 text-slate-400">
                {t.selectPreset}
              </option>
              <optgroup label={t.builtinGroup} className="bg-void-950 text-slate-200">
                <option value="simple-lamp">{t.presetSimpleLamp}</option>
                <option value="voltage-divider">{t.presetSeriesDivider}</option>
                <option value="parallel-bulbs">{t.presetParallelBulbs}</option>
                <option value="short-circuit-demo">{t.presetShortCircuit}</option>
                <option value="ultimate-power-grid">{t.presetUltimatePowerGrid}</option>
              </optgroup>
              {customPresets.length > 0 && (
                <optgroup label={t.customGroup} className="bg-void-950 text-slate-200">
                  {customPresets.map((preset) => (
                    <option key={preset.id} value={`custom:${preset.id}`}>
                      ★ {preset.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <option value="action:save" className="bg-void-950 text-electric-400 font-semibold">
                + {t.savePresetBtn}...
              </option>
            </select>

            <div className="w-px h-4 bg-white/10 shrink-0 mx-0.5" />

            {/* Save Custom Preset Action inside Unified Capsule (Zero Overlap!) */}
            <button
              id="tour-btn-save"
              type="button"
              onClick={() => setIsSaveModalOpen(true)}
              title={t.savePresetModalTitle}
              aria-label={t.savePresetModalTitle}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-electric-500/15 hover:bg-electric-500/25 text-electric-400 text-[11px] sm:text-xs font-semibold transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">{t.savePresetBtn}</span>
            </button>

            <button
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
              {language === 'id' ? 'Zona Alam Terbuka' : 'Outdoor Sandbox'}
            </span>
          </div>
        )}

        {/* Right: Cohesive World Switcher + Unified Dark-Glass Utility Dock */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Primary World Mode Switcher Pill */}
          <button
            id="tour-btn-world"
            type="button"
            disabled={isTransitioningWorld}
            onClick={() => triggerWorldTransition()}
            title={
              worldMode === 'lab'
                ? language === 'id'
                  ? 'Keluar ke Alam Terbuka (Outdoor Sandbox)'
                  : 'Go Outside (Outdoor Sandbox)'
                : language === 'id'
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
                    {language === 'id' ? 'Masuk Lab' : 'Lab Mode'}
                  </span>
                  <span className="sm:hidden">Lab</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">
                    {language === 'id' ? 'Ke Alam' : 'Outside'}
                  </span>
                  <span className="sm:hidden">Alam</span>
                </>
              )}
            </span>
          </button>

          {/* Short-Circuit Alert Pill (Only when shorted) */}
          {simulation.isShortCircuit && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl bg-danger-500/15 border border-danger-500/40 text-danger-500 text-[10px] sm:text-xs font-semibold animate-pulse whitespace-nowrap shrink-0">
              <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">{t.statusShort}</span>
              <span className="md:hidden">Korslet</span>
            </div>
          )}

          {/* Unified Dark-Glass Utility Dock (Team, Guide, Language, Clear) */}
          <div className="flex items-center bg-void-950/95 border border-white/10 rounded-xl p-0.5 shadow-inner shrink-0">
            {/* Developers & Contributors Modal Trigger */}
            <button
              id="tour-btn-credits"
              type="button"
              onClick={() => setIsCreditsModalOpen(true)}
              title={
                language === 'id'
                  ? 'Daftar Developer & Kontributor (SMPN 12 Surabaya)'
                  : 'Developers & Contributors (SMPN 12 Surabaya)'
              }
              aria-label={
                language === 'id'
                  ? 'Daftar Developer & Kontributor'
                  : 'Developers & Contributors'
              }
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-[11px] font-medium transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-electric-400" />
              <span className="hidden xl:inline">
                {language === 'id' ? 'Tim' : 'Team'}
              </span>
            </button>

            <div className="w-px h-4 bg-white/10 shrink-0" />

            {/* Interactive Spotlight Tour Trigger */}
            <button
              id="tour-btn-help"
              type="button"
              onClick={() => startTour()}
              title={
                language === 'id'
                  ? 'Mulai Panduan Interaktif'
                  : 'Start Interactive Tour'
              }
              aria-label={
                language === 'id'
                  ? 'Mulai Panduan Interaktif'
                  : 'Start Interactive Tour'
              }
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-[11px] font-medium transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-electric-400" />
              <span className="hidden lg:inline">
                {language === 'id' ? 'Panduan' : 'Guide'}
              </span>
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

      {/* Modal: Save Custom Preset & Manage Cached Browser Presets */}
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
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePresetSubmit} className="p-4 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'id'
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
                  className="px-3.5 py-2 rounded-xl bg-void-850 hover:bg-void-800 border border-white/10 text-xs font-medium text-slate-300 active:scale-95 transition-all"
                >
                  {t.savePresetCancel}
                </button>
                <button
                  type="submit"
                  disabled={!presetNameInput.trim()}
                  className="px-4 py-2 rounded-xl bg-electric-500 hover:bg-electric-400 disabled:opacity-40 text-void-950 text-xs font-bold active:scale-95 transition-all cursor-pointer"
                >
                  {t.savePresetConfirm}
                </button>
              </div>
            </form>

            {/* List of Existing Custom Presets in Browser Cache */}
            {customPresets.length > 0 && (
              <div className="px-4 pb-4 pt-2 border-t border-white/10 bg-void-950/50">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
                  {t.savedPresetsListTitle} ({customPresets.length})
                </span>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {customPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-void-900 border border-white/10 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          loadCustomPreset(preset.id);
                          setIsSaveModalOpen(false);
                        }}
                        className="flex items-center gap-2 text-left text-slate-200 hover:text-electric-400 font-medium truncate flex-1 cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-electric-400 shrink-0" />
                        <span className="truncate">{preset.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCustomPreset(preset.id)}
                        title={language === 'id' ? 'Hapus Preset' : 'Delete Preset'}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Developers & Contributors Roster (SMPN 12 Surabaya) */}
      <CreditsModal
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
      />
    </>
  );
};

