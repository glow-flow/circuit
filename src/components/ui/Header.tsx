import React from 'react';
import { Zap, Trash2, BookOpen, AlertOctagon, RotateCcw, Globe } from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { TRANSLATIONS } from '../../i18n/translations';

export const Header: React.FC = () => {
  const simulation = useCircuitStore((state) => state.simulation);
  const clearCanvas = useCircuitStore((state) => state.clearCanvas);
  const loadPreset = useCircuitStore((state) => state.loadPreset);
  const runSimulation = useCircuitStore((state) => state.runSimulation);
  const language = useCircuitStore((state) => state.language);
  const setLanguage = useCircuitStore((state) => state.setLanguage);

  const t = TRANSLATIONS[language].header;

  const toggleLanguage = () => {
    setLanguage(language === 'id' ? 'en' : 'id');
  };

  return (
    <header className="h-13 sm:h-14 border-b border-white/10 bg-void-900 px-2.5 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-2 z-20 shrink-0">
      {/* Brand & Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
        <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-electric-500/15 border border-electric-500/30 text-electric-400 shadow-glow shrink-0">
          <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-electric-400" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xs sm:text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2 whitespace-nowrap">
            <span>Circuit Sandbox</span>
            <span className="hidden lg:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-electric-500/10 text-electric-400 border border-electric-500/20 font-medium whitespace-nowrap">
              IPA Kelas 9
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 hidden md:block truncate">
            {t.appSubtitle}
          </p>
        </div>
      </div>

      {/* Center Presets Dropdown */}
      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 mr-0.5 shrink-0">
          <BookOpen className="w-3.5 h-3.5" />
        </div>
        <select
          onChange={(e) => {
            if (e.target.value) {
              loadPreset(e.target.value as any);
              e.target.value = '';
            }
          }}
          defaultValue=""
          aria-label="Circuit Presets"
          className="text-[11px] sm:text-xs bg-void-950 border border-white/10 text-slate-200 rounded-lg px-2 sm:px-2.5 py-1.5 max-w-[115px] xs:max-w-[150px] sm:max-w-none truncate focus:outline-none focus:border-electric-500 transition-colors cursor-pointer"
        >
          <option value="" disabled>
            {t.selectPreset}
          </option>
          <option value="simple-lamp">{t.presetSimpleLamp}</option>
          <option value="voltage-divider">{t.presetSeriesDivider}</option>
          <option value="parallel-bulbs">{t.presetParallelBulbs}</option>
          <option value="short-circuit-demo">{t.presetShortCircuit}</option>
        </select>

        <button
          onClick={() => loadPreset('simple-lamp')}
          className="p-1.5 rounded-lg bg-void-850 hover:bg-void-800 border border-white/10 text-slate-300 hover:text-white transition-all active:scale-95 shrink-0"
          title={t.resetTitle}
          onClickCapture={runSimulation}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right Language Toggle, Circuit Health & Clear */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Language Switcher Button (ID / EN) */}
        <button
          type="button"
          onClick={toggleLanguage}
          title={t.langToggleTitle}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-electric-500/15 hover:bg-electric-500/25 border border-electric-500/30 text-electric-400 text-[10px] sm:text-xs font-mono font-bold transition-all active:scale-95 shrink-0"
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
          <div className="hidden xs:flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-medium whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="hidden md:inline">{t.statusStable}</span>
            <span className="md:hidden">{language === 'id' ? 'Aman' : 'Stable'}</span>
          </div>
        )}

        <button
          onClick={clearCanvas}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-void-850 hover:bg-red-950/40 border border-white/10 hover:border-red-500/30 text-xs text-slate-300 hover:text-red-300 transition-all active:scale-95 shrink-0"
          title={t.clearTitle}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.clearAll}</span>
        </button>
      </div>
    </header>
  );
};
