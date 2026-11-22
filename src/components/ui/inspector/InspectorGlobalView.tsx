import React from 'react';
import {
  Activity,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { countVisibleWires } from '../../../utils/socketSnap';
import { TRANSLATIONS } from '../../../i18n/translations';
import { PlnCostCalculatorCard } from '../PlnCostCalculatorCard';

interface InspectorGlobalViewProps {
  isMobileDrawer?: boolean;
  onCloseMobile?: () => void;
}

/**
 * Inspector Global View displayed when no specific component is selected on the canvas.
 * Presents circuit-wide telemetry, safety status, quick links to Tutor & Oscilloscope,
 * PLN cost calculator, and physics formulas.
 */
export const InspectorGlobalView: React.FC<InspectorGlobalViewProps> = ({
  isMobileDrawer = false,
  onCloseMobile,
}) => {
  const nodes = useCircuitStore((state) => state.nodes);
  const edges = useCircuitStore((state) => state.edges);
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);
  const setActiveModal = useCircuitStore((state) => state.setActiveModal);

  const t = TRANSLATIONS[language].inspector;
  const isId = language === 'id';

  const openInstrumentModal = (modal: 'tutor' | 'oscilloscope') => {
    if (isMobileDrawer && onCloseMobile) {
      onCloseMobile();
    }
    setActiveModal(modal);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* Desktop Top Header (MobileBottomSheet renders its own header on mobile) */}
      {!isMobileDrawer && (
        <div className="p-3.5 border-b border-ink/15 flex items-center justify-between shrink-0 bg-void-850">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-electric-500/15 border border-electric-500/35 flex items-center justify-center text-electric-400 shrink-0">
              <Cpu className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-ink uppercase tracking-wider">
                {t.title}
              </h2>
              <p className="text-[10px] text-slate-400">
                {t.globalBadge}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Body with Momentum Scroll */}
      <div className="p-4 space-y-3.5 flex-1 overflow-y-auto overscroll-contain text-xs font-sans">
        {/* Direct Measurement Tools (Formula Tutor & Live Oscilloscope) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => openInstrumentModal('tutor')}
            className="min-h-[44px] px-2.5 py-2 rounded-xl bg-void-950 hover:bg-void-850 border border-control text-ink text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-electric-400 shrink-0" aria-hidden="true" />
            <span className="truncate">{isId ? 'Langkah Rumus' : 'Formula Steps'}</span>
          </button>

          <button
            type="button"
            onClick={() => openInstrumentModal('oscilloscope')}
            className="min-h-[44px] px-2.5 py-2 rounded-xl bg-void-950 hover:bg-void-850 border border-control text-ink text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
            <span className="truncate">{isId ? 'Grafik Scope' : 'Waveforms'}</span>
          </button>
        </div>

        {/* Status Box */}
        <div
          className={`rounded-2xl p-3.5 border ${
            simulation.isShortCircuit
              ? 'bg-danger-500/10 border-danger-500/40'
              : 'bg-void-950 border-ink/15'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            {simulation.isShortCircuit ? (
              <AlertTriangle className="w-4 h-4 text-danger-500" aria-hidden="true" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            )}
            <span className="text-xs font-semibold text-ink">
              {simulation.isShortCircuit ? t.hazardTitle : t.normalTitle}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {simulation.isShortCircuit ? t.hazardDesc : t.normalDesc}
          </p>
        </div>

        {/* Telemetry Metrics */}
        <div className="bg-void-950 rounded-xl p-3 border border-ink/15 space-y-2 font-mono tabular-nums text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-sans text-[11px]">{t.totalComponents}</span>
            <span className="text-ink font-bold">{nodes.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-sans text-[11px]">{t.totalWires}</span>
            <span className="text-ink font-bold">{countVisibleWires(edges)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-sans text-[11px]">{t.totalPower}</span>
            <span className="text-electric-400 font-bold">
              {simulation.totalPowerDrawn.toFixed(2)} W
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-sans text-[11px]">{t.maxVoltage}</span>
            <span className="text-amber-400 font-bold">
              {Math.max(0, ...Object.values(simulation.nodeVoltages)).toFixed(2)} V
            </span>
          </div>
        </div>

        {/* Interactive PLN Electricity Bill & Green Energy Simulator */}
        <PlnCostCalculatorCard />

        {/* Grade 9 Physics Cheat Sheet */}
        <div className="p-3 rounded-xl bg-electric-500/5 border border-electric-500/25 text-[11px] space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-electric-400">
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.formulaTitle}</span>
          </div>
          <div className="font-mono tabular-nums text-[10px] text-ink bg-void-950 px-2 py-1 rounded border border-ink/15">
            {t.formulaOhm}
          </div>
          <div className="font-mono tabular-nums text-[10px] text-ink bg-void-950 px-2 py-1 rounded border border-ink/15">
            {t.formulaPower}
          </div>
          <div className="font-mono tabular-nums text-[10px] text-emerald-400 bg-void-950 px-2 py-1 rounded border border-ink/15">
            {t.formulaSeries}
          </div>
        </div>

        {/* Educational Note */}
        <div className="p-3 rounded-xl bg-void-950 border border-ink/15 text-[11px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300">{t.quickTipTitle}</div>
          <p className="leading-relaxed">{t.quickTipDesc}</p>
        </div>
      </div>
    </div>
  );
};
