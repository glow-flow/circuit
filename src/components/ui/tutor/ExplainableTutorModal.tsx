import React, { useMemo, useState } from 'react';
import {
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Calculator,
  Compass,
  Zap,
  Info,
  Lightbulb,
} from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { analyzeExplainableCircuit } from '../../../tutor/explainableTutor';
import { useModalKeyboardClose } from '../../../hooks/useModalKeyboardClose';
import { FormattedMathView } from './FormattedMathView';

interface ExplainableTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExplainableTutorModal: React.FC<ExplainableTutorModalProps> = ({ isOpen, onClose }) => {
  useModalKeyboardClose(isOpen, onClose);
  const nodes = useCircuitStore((state) => state.nodes);
  const edges = useCircuitStore((state) => state.edges);
  const simulation = useCircuitStore((state) => state.simulation);
  const selectedNodeId = useCircuitStore((state) => state.selectedNodeId);
  const selectNode = useCircuitStore((state) => state.selectNode);
  const language = useCircuitStore((state) => state.language);
  const isId = language === 'id';

  const [expandedStepIndex, setExpandedStepIndex] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<'derivation' | 'phenomena' | 'whatif'>('derivation');

  // Compute deterministic circuit physics explanation
  const analysis = useMemo(
    () => analyzeExplainableCircuit(nodes, edges, simulation, selectedNodeId),
    [nodes, edges, simulation, selectedNodeId]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 overflow-y-auto min-h-[100dvh]">
      <div className="w-full max-w-4xl h-[100dvh] sm:h-[90vh] sm:max-h-[92vh] rounded-none sm:rounded-2xl bg-void-950 border-0 sm:border sm:border-white/10 shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-white/10 bg-void-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400 shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-electric-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-lg font-bold tracking-tight text-white leading-tight truncate">
                  {isId ? 'Tutor Fisika Rangkaian Terjelaskan' : 'Explainable Circuit Physics Tutor'}
                </h2>
                <span className="hidden sm:inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-electric-500/20 text-electric-300 border border-electric-500/30 shrink-0">
                  CIRCUIT 4.0
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
                {isId
                  ? 'Analisis fisika deterministik berbasis graf & pembuktian matematis langkah demi langkah (KCL, KVL, Hukum Ohm).'
                  : 'Deterministic graph-based physics analysis & step-by-step mathematical proofs (KCL, KVL, Ohm\'s Law).'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors active:scale-95 cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Circuit Summary & Live Physical Telemetry Bar */}
        <div className="px-4 sm:px-5 py-2.5 sm:py-3.5 bg-void-900/60 border-b border-white/5 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 max-w-md min-w-0">
            <Compass className="w-4 h-4 text-electric-400 shrink-0" />
            <p className="text-xs text-slate-200 font-medium truncate">
              {isId ? analysis.summaryId : analysis.summaryEn}
            </p>
          </div>

          {/* Key Metrics Quick Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-mono">
            <div className="px-2 sm:px-2.5 py-1 rounded-lg bg-void-950 border border-white/10">
              <span className="text-slate-400">Vs: </span>
              <strong className="text-white">{analysis.totalSourcesVoltage}V</strong>
            </div>
            <div className="px-2 sm:px-2.5 py-1 rounded-lg bg-void-950 border border-white/10">
              <span className="text-slate-400">Req: </span>
              <strong className="text-amber-400">{analysis.equivalentResistanceOhms.toFixed(1)}Ω</strong>
            </div>
            <div className="px-2 sm:px-2.5 py-1 rounded-lg bg-void-950 border border-white/10">
              <span className="text-slate-400">I: </span>
              <strong className="text-emerald-400">
                {(analysis.totalLoopCurrentAmps * 1000).toFixed(1)}mA
              </strong>
            </div>
            <div className="px-2 sm:px-2.5 py-1 rounded-lg bg-void-950 border border-white/10">
              <span className="text-slate-400">P: </span>
              <strong className="text-purple-400">{analysis.totalPowerWatts}W</strong>
            </div>
          </div>
        </div>

        {/* Tab Navigation: Smooth horizontal scroll on mobile */}
        <div className="px-3 sm:px-5 pt-2 sm:pt-3 border-b border-white/10 flex items-center gap-1.5 sm:gap-2 bg-void-950 shrink-0 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            type="button"
            onClick={() => setActiveTab('derivation')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 border-b-2 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'derivation'
                ? 'border-electric-400 text-electric-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4 shrink-0" />
            <span>{isId ? 'Pembuktian Matematis' : 'Mathematical Derivations'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-electric-500/20 text-electric-300 font-mono">
              {analysis.derivationSteps.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('phenomena')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 border-b-2 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'phenomena'
                ? 'border-electric-400 text-electric-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{isId ? 'Diagnosa Fenomena Listrik' : 'Diagnosed Phenomena'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-void-850 text-slate-300 font-mono border border-white/10">
              {analysis.phenomena.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('whatif')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 border-b-2 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'whatif'
                ? 'border-electric-400 text-electric-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Lightbulb className="w-4 h-4 shrink-0" />
            <span>{isId ? 'Eksplorasi Hipotesis (What-If)' : 'What-If Predictions'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-void-850 text-slate-300 font-mono border border-white/10">
              {analysis.whatIfPredictions.length}
            </span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: Mathematical Derivations */}
          {activeTab === 'derivation' && (
            <div className="space-y-3">
              {analysis.derivationSteps.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-void-900 border border-white/5 text-slate-400 text-sm">
                  {isId
                    ? 'Sambungkan minimal 1 sumber tegangan dan 1 beban untuk melihat penurunan rumus matematis.'
                    : 'Connect at least 1 voltage source and 1 load to view step-by-step mathematical derivations.'}
                </div>
              ) : (
                analysis.derivationSteps.map((step, idx) => {
                  const isExpanded = expandedStepIndex === idx;
                  return (
                    <div
                      key={step.stepNumber}
                      className="rounded-xl bg-void-900 border border-white/10 overflow-hidden transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedStepIndex(isExpanded ? null : idx)}
                        onMouseEnter={() => {
                          if (step.relevantComponentIds.length > 0) {
                            selectNode(step.relevantComponentIds[0]);
                          }
                        }}
                        className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-electric-500/15 border border-electric-500/30 flex items-center justify-center font-mono font-bold text-xs text-electric-400">
                            {step.stepNumber}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{isId ? step.titleId : step.titleEn}</span>
                              <span className="text-[10px] font-mono font-normal text-slate-400 px-1.5 py-0.5 rounded bg-void-950 border border-white/5">
                                {step.lawOrTheorem}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-emerald-400/90 mt-0.5">
                              {step.verifiedResult}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-300" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-white/5 bg-void-950/60 space-y-3">
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {isId ? step.calculationDescriptionId : step.calculationDescriptionEn}
                          </p>

                          {/* Mathematical Formula & Substitution Box */}
                          <div className="p-3 rounded-lg bg-void-950 border border-white/10 font-mono text-xs space-y-2">
                            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                              {isId ? 'Rumus Fisika:' : 'Physics Formula:'}
                            </div>
                            <FormattedMathView formula={step.formulaLatex} variant="block" />
                            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold pt-1">
                              {isId ? 'Substitusi Nilai Aktif Rangkaian:' : 'Substituted Active Telemetry:'}
                            </div>
                            <FormattedMathView formula={step.substitutedFormula} variant="block" />
                          </div>

                          {/* Components Highlight Notice */}
                          {step.relevantComponentIds.length > 0 && (
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <Zap className="w-3.5 h-3.5 text-electric-400" />
                              <span>
                                {isId ? 'Komponen terkait: ' : 'Involved components: '}
                                <strong className="text-slate-200">
                                  {step.relevantComponentIds.join(', ')}
                                </strong>
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: Diagnosed Phenomena */}
          {activeTab === 'phenomena' && (
            <div className="space-y-3">
              {analysis.phenomena.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-void-900 border border-white/5 text-slate-400 text-sm">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  {isId
                    ? 'Rangkaian berjalan normal tanpa gangguan atau anomali kelistrikan yang terdeteksi.'
                    : 'Circuit is operating normally with no electrical anomalies or faults detected.'}
                </div>
              ) : (
                analysis.phenomena.map((phenomenon) => {
                  const isCritical = phenomenon.severity === 'critical';
                  const isWarning = phenomenon.severity === 'warning';
                  return (
                    <div
                      key={phenomenon.id}
                      className={`p-4 rounded-xl border flex flex-col gap-2 ${
                        isCritical
                          ? 'bg-rose-500/10 border-rose-500/30'
                          : isWarning
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-void-900 border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isCritical ? (
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <Info className="w-4 h-4 text-electric-400 shrink-0" />
                        )}
                        <h4
                          className={`text-xs font-bold ${
                            isCritical
                              ? 'text-rose-300'
                              : isWarning
                              ? 'text-amber-300'
                              : 'text-white'
                          }`}
                        >
                          {isId ? phenomenon.titleId : phenomenon.titleEn}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {isId ? phenomenon.explanationId : phenomenon.explanationEn}
                      </p>

                      {phenomenon.affectedComponentIds.length > 0 && (
                        <div className="text-[11px] text-slate-400 font-mono mt-1">
                          {isId ? 'Komponen: ' : 'Target Components: '}{' '}
                          <span className="text-slate-200">
                            {phenomenon.affectedComponentIds.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: What-If Predictions */}
          {activeTab === 'whatif' && (
            <div className="space-y-3">
              {analysis.whatIfPredictions.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-void-900 border border-white/5 text-slate-400 text-sm">
                  {isId
                    ? 'Tambahkan komponen sumber dan resistor pada kanvas untuk mengaktifkan eksplorasi hipotesis What-If.'
                    : 'Add source and resistor components on the canvas to activate What-If exploratory hypotheses.'}
                </div>
              ) : (
                analysis.whatIfPredictions.map((whatIf) => (
                  <div
                    key={whatIf.id}
                    className="p-4 rounded-xl bg-void-900 border border-white/10 space-y-2.5"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{isId ? whatIf.titleId : whatIf.titleEn}</span>
                    </div>

                    <div className="p-3 rounded-lg bg-void-950 border border-white/5 space-y-1.5 text-xs">
                      <div className="text-slate-400 font-medium">
                        {isId ? whatIf.hypothesisId : whatIf.hypothesisEn}
                      </div>
                      <div className="text-emerald-300 font-semibold leading-relaxed">
                        {isId ? whatIf.predictedOutcomeId : whatIf.predictedOutcomeEn}
                      </div>
                      <div className="pt-2 border-t border-white/5 space-y-1">
                        <div className="font-mono text-[11px] text-slate-400">
                          {isId ? 'Pembuktian Rumus:' : 'Formula Proof:'}
                        </div>
                        <FormattedMathView formula={whatIf.mathematicalProof} variant="block" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
