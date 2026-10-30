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
  Sun,
  CloudSun,
} from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { startTour } from '../../utils/tour';

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
  const environment = useCircuitStore((state) => state.environment);
  const cycleEnvironment = useCircuitStore((state) => state.cycleEnvironment);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');

  const t = TRANSLATIONS[language].header;

  const toggleLanguage = () => {
    setLanguage(language === 'id' ? 'en' : 'id');
  };

  const handlePresetSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;

    if (val.startsWith('custom:')) {
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
      <header className="h-13 sm:h-14 border-b border-white/10 bg-void-900 px-2.5 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-2 z-20 shrink-0">
        {/* Brand & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-electric-500/15 border border-electric-500/30 text-electric-400 shadow-glow shrink-0">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-electric-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2 whitespace-nowrap">
              <span className="hidden xs:inline">Circuit Sandbox</span>
              <span className="xs:hidden">Circuit</span>
              <span className="hidden lg:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-electric-500/10 text-electric-400 border border-electric-500/20 font-medium whitespace-nowrap">
                IPA Kelas 9
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden md:block truncate">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Center Presets Dropdown + Save Custom Preset Button */}
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 mr-0.5 shrink-0">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <select
            id="tour-dropdown-contoh"
            onChange={handlePresetSelectChange}
            defaultValue=""
            aria-label="Circuit Presets"
            className="text-[11px] sm:text-xs bg-void-950 border border-white/10 text-slate-200 rounded-lg px-2 sm:px-2.5 py-1.5 max-w-[115px] xs:max-w-[155px] sm:max-w-[230px] truncate focus:outline-none focus:border-electric-500 transition-colors cursor-pointer"
          >
            <option value="" disabled>
              {t.selectPreset}
            </option>
            <optgroup label={t.builtinGroup}>
              <option value="simple-lamp">{t.presetSimpleLamp}</option>
              <option value="voltage-divider">{t.presetSeriesDivider}</option>
              <option value="parallel-bulbs">{t.presetParallelBulbs}</option>
              <option value="short-circuit-demo">{t.presetShortCircuit}</option>
              <option value="ultimate-power-grid">{t.presetUltimatePowerGrid}</option>
            </optgroup>
            {customPresets.length > 0 && (
              <optgroup label={t.customGroup}>
                {customPresets.map((preset) => (
                  <option key={preset.id} value={`custom:${preset.id}`}>
                    ★ {preset.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {/* Save Custom Preset to Browser Cache Button */}
          <button
            id="tour-btn-save"
            type="button"
            onClick={() => setIsSaveModalOpen(true)}
            title={t.savePresetModalTitle}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-electric-500/15 hover:bg-electric-500/25 border border-electric-500/30 text-electric-400 text-[11px] sm:text-xs font-semibold transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">{t.savePresetBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => loadPreset('simple-lamp')}
            className="p-1.5 rounded-lg bg-void-850 hover:bg-void-800 border border-white/10 text-slate-300 hover:text-white transition-all active:scale-95 shrink-0 cursor-pointer"
            title={t.resetTitle}
            onClickCapture={runSimulation}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Help Button, Language Toggle, Circuit Health & Clear */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Environment / Weather Toggle Button */}
          <button
            type="button"
            onClick={cycleEnvironment}
            title={t.environmentToggleTitle}
            aria-label={t.environmentToggleTitle}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] sm:text-xs font-semibold transition-all active:scale-95 shrink-0 cursor-pointer ${
              environment === 'sunny'
                ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : environment === 'cloudy'
                ? 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-400/50 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                : 'bg-void-850 hover:bg-void-800 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            {environment === 'sunny' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : environment === 'cloudy' ? (
              <CloudSun className="w-3.5 h-3.5 text-sky-300 shrink-0" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span className="font-mono text-[10px] sm:text-[11px] font-bold">
              {environment === 'sunny'
                ? t.environmentSunny
                : environment === 'cloudy'
                ? t.environmentCloudy
                : t.environmentLab}
            </span>
          </button>

          {/* Help / Interactive Spotlight Tour Button */}
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
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 text-[10px] sm:text-xs font-semibold transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">
              {language === 'id' ? 'Panduan' : 'Guide'}
            </span>
          </button>

          {/* Language Switcher Button (ID / EN) */}
          <button
            type="button"
            onClick={toggleLanguage}
            title={t.langToggleTitle}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-electric-500/15 hover:bg-electric-500/25 border border-electric-500/30 text-electric-400 text-[10px] sm:text-xs font-mono font-bold transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{language === 'id' ? 'ID' : 'EN'}</span>
          </button>

          {simulation.isShortCircuit ? (
            <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-danger-500/15 border border-danger-500/40 text-danger-500 text-[10px] sm:text-xs font-semibold animate-pulse shadow-glow-danger whitespace-nowrap">
              <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">{t.statusShort}</span>
              <span className="md:hidden">Korslet!</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-medium whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="hidden md:inline">{t.statusStable}</span>
              <span className="md:hidden">{language === 'id' ? 'Aman' : 'Stable'}</span>
            </div>
          )}

          <button
            id="tour-btn-reset"
            type="button"
            onClick={clearCanvas}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-void-850 hover:bg-red-950/40 border border-white/10 hover:border-red-500/30 text-xs text-slate-300 hover:text-red-300 transition-all active:scale-95 shrink-0 cursor-pointer"
            title={t.clearTitle}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.clearAll}</span>
          </button>
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
    </>
  );
};

