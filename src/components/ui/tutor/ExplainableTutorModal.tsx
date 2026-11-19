import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Info,
  Play,
} from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { analyzeExplainableCircuit } from '../../../tutor/explainableTutor';
import { useModalFocusTrap } from '../../../hooks/useModalKeyboardClose';
import { LabModalHeader } from '../common/LabModalHeader';
import { FormattedMathView } from './FormattedMathView';

interface ExplainableTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Explainable Circuit Physics Tutor Modal (`ExplainableTutorModal.tsx`).
 *
 * Computes deterministic graph-based circuit derivations (KCL, KVL, Ohm's Law),
 * anomaly diagnostics, and What-If hypotheses.
 *
 * Time Complexity: O(V + E) derivation analysis memoized over circuit graph state.
 */
export const ExplainableTutorModal: React.FC<ExplainableTutorModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalFocusTrap(isOpen, dialogRef, onClose);

  const nodes = useCircuitStore((state) => state.nodes);
  const edges = useCircuitStore((state) => state.edges);
  const simulation = useCircuitStore((state) => state.simulation);
  const selectedNodeId = useCircuitStore((state) => state.selectedNodeId);
  const selectNode = useCircuitStore((state) => state.selectNode);
  const loadPreset = useCircuitStore((state) => state.loadPreset);
  const runSimulation = useCircuitStore((state) => state.runSimulation);
  const language = useCircuitStore((state) => state.language);
  const isId = language === 'id';

  const [expandedStepIndex, setExpandedStepIndex] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<'derivation' | 'phenomena' | 'whatif'>('derivation');

  const analysis = useMemo(
    () => analyzeExplainableCircuit(nodes, edges, simulation, selectedNodeId),
    [nodes, edges, simulation, selectedNodeId]
  );

  if (!isOpen) return null;

  const isCanvasEmpty = nodes.length === 0;

  const handleLoadSampleCircuit = () => {
    loadPreset('simple-lamp');
    runSimulation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/75 p-0 sm:p-4 overflow-y-auto min-h-[100dvh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutor-modal-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-4xl h-[100dvh] sm:h-[90dvh] sm:max-h-[92dvh] rounded-none sm:rounded-2xl bg-void-950 border-0 sm:border sm:border-control shadow-2xl flex flex-col overflow-hidden text-ink font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <LabModalHeader
          titleId="tutor-modal-title"
          eyebrow={isId ? 'ANALISIS MNA DETERMINISTIK' : 'DETERMINISTIC MNA ANALYSIS'}
          title={isId ? 'Tutor Fisika Rangkaian Terjelaskan' : 'Explainable Circuit Physics Tutor'}
          subtitle={
            isId
              ? 'Penurunan rumus langkah demi langkah berdasarkan KCL, KVL, dan Hukum Ohm.'
              : 'Step-by-step mathematical proofs based on KCL, KVL, and Ohm’s Law.'
          }
          onClose={onClose}
          closeLabel={isId ? 'Tutup' : 'Close'}
        />

        {/* Circuit Status & Instrument Readout Strip */}
        <div className="px-4 sm:px-6 py-3 bg-void-900 border-b border-ink/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-300 leading-snug max-w-xl">
            {isId ? analysis.summaryId : analysis.summaryEn}
          </p>

          {!isCanvasEmpty && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-[11px] font-mono tabular-nums shrink-0">
              <div className="px-2.5 py-1.5 rounded-lg bg-void-950 border border-control flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase">Vs</span>
                <strong className="text-ink">{analysis.totalSourcesVoltage}V</strong>
              </div>
              <div className="px-2.5 py-1.5 rounded-lg bg-void-950 border border-control flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase">Req</span>
                <strong className="text-ink">{analysis.equivalentResistanceOhms.toFixed(1)}Ω</strong>
              </div>
              <div className="px-2.5 py-1.5 rounded-lg bg-void-950 border border-control flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase">Arus (I)</span>
                <strong className="text-electric-400">
                  {(analysis.totalLoopCurrentAmps * 1000).toFixed(1)}mA
                </strong>
              </div>
              <div className="px-2.5 py-1.5 rounded-lg bg-void-950 border border-control flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase">Daya (P)</span>
                <strong className="text-ink">{analysis.totalPowerWatts}W</strong>
              </div>
            </div>
          )}
        </div>

        {/* Clean Typographic Tab Navigation */}
        <div
          role="tablist"
          className="px-4 sm:px-6 border-b border-ink/15 flex items-center gap-1 sm:gap-3 bg-void-950 shrink-0 overflow-x-auto no-scrollbar"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'derivation'}
            onClick={() => setActiveTab('derivation')}
            className={`min-h-[44px] flex items-center gap-1.5 px-3 py-2.5 border-b-2 text-xs font-semibold transition-colors active:scale-95 cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'derivation'
                ? 'border-electric-500 text-ink font-bold'
                : 'border-transparent text-slate-400 hover:text-ink'
            }`}
          >
            <span>{isId ? 'Pembuktian Matematis' : 'Mathematical Proofs'}</span>
            {analysis.derivationSteps.length > 0 && (
              <span className="text-[10px] font-mono tabular-nums text-electric-400">
                ({analysis.derivationSteps.length})
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'phenomena'}
            onClick={() => setActiveTab('phenomena')}
            className={`min-h-[44px] flex items-center gap-1.5 px-3 py-2.5 border-b-2 text-xs font-semibold transition-colors active:scale-95 cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'phenomena'
                ? 'border-electric-500 text-ink font-bold'
                : 'border-transparent text-slate-400 hover:text-ink'
            }`}
          >
            <span>{isId ? 'Diagnosa Fenomena' : 'Diagnosed Phenomena'}</span>
            {analysis.phenomena.length > 0 && (
              <span className="text-[10px] font-mono tabular-nums text-electric-400">
                ({analysis.phenomena.length})
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'whatif'}
            onClick={() => setActiveTab('whatif')}
            className={`min-h-[44px] flex items-center gap-1.5 px-3 py-2.5 border-b-2 text-xs font-semibold transition-colors active:scale-95 cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'whatif'
                ? 'border-electric-500 text-ink font-bold'
                : 'border-transparent text-slate-400 hover:text-ink'
            }`}
          >
            <span>{isId ? 'Hipotesis What-If' : 'What-If Predictions'}</span>
            {analysis.whatIfPredictions.length > 0 && (
              <span className="text-[10px] font-mono tabular-nums text-electric-400">
                ({analysis.whatIfPredictions.length})
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: Mathematical Derivations */}
          {activeTab === 'derivation' && (
            <div className="space-y-3">
              {analysis.derivationSteps.length === 0 ? (
                <div className="p-6 sm:p-8 rounded-2xl bg-void-900 border border-control flex flex-col items-center text-center max-w-md mx-auto my-4 space-y-3">
                  <div className="text-sm font-bold text-ink">
                    {isId
                      ? 'Belum Ada Rangkaian Tertutup di Kanvas'
                      : 'No Closed Circuit Loop on Canvas'}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isId
                      ? 'Sambungkan minimal 1 sumber tegangan (baterai) dan 1 beban (lampu atau resistor) untuk melihat penurunan rumus fisika secara langsung.'
                      : 'Connect at least 1 voltage source and 1 load to view real-time mathematical derivations.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleLoadSampleCircuit}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-700 text-white text-xs font-bold flex items-center gap-2 transition-colors active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                    <span>
                      {isId
                        ? 'Muat Rangkaian Contoh (Hukum Ohm)'
                        : 'Load Sample Ohm’s Law Circuit'}
                    </span>
                  </button>
                </div>
              ) : (
                analysis.derivationSteps.map((step, idx) => {
                  const isExpanded = expandedStepIndex === idx;
                  return (
                    <div
                      key={step.stepNumber}
                      className="rounded-xl bg-void-900 border border-control overflow-hidden transition-colors"
                    >
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedStepIndex(isExpanded ? null : idx)}
                        onMouseEnter={() => {
                          if (step.relevantComponentIds.length > 0) {
                            selectNode(step.relevantComponentIds[0]);
                          }
                        }}
                        className="w-full min-h-[44px] px-4 py-3.5 flex items-center justify-between text-left hover:bg-void-850 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-void-950 border border-control flex items-center justify-center font-mono font-bold tabular-nums text-xs text-electric-400 shrink-0">
                            {step.stepNumber}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-ink flex flex-wrap items-center gap-2">
                              <span>{isId ? step.titleId : step.titleEn}</span>
                              <span className="text-[10px] font-mono font-normal text-slate-400 px-1.5 py-0.5 rounded bg-void-950 border border-control">
                                {step.lawOrTheorem}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono tabular-nums text-electric-300 mt-0.5">
                              {step.verifiedResult}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-slate-400 shrink-0 ml-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-300" aria-hidden="true" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t border-ink/15 bg-void-950 space-y-3">
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {isId ? step.calculationDescriptionId : step.calculationDescriptionEn}
                          </p>

                          <div className="p-3 rounded-lg bg-void-900 border border-control font-mono text-xs space-y-2">
                            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                              {isId ? 'Rumus Fisika:' : 'Physics Formula:'}
                            </div>
                            <FormattedMathView formula={step.formulaLatex} variant="block" />
                            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold pt-1">
                              {isId ? 'Substitusi Nilai Aktif Rangkaian:' : 'Substituted Active Telemetry:'}
                            </div>
                            <FormattedMathView formula={step.substitutedFormula} variant="block" />
                          </div>

                          {step.relevantComponentIds.length > 0 && (
                            <div className="text-[11px] text-slate-400 font-mono">
                              {isId ? 'Komponen terkait: ' : 'Involved components: '}
                              <strong className="text-ink">
                                {step.relevantComponentIds.join(', ')}
                              </strong>
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
                <div className="p-6 sm:p-8 text-center rounded-2xl bg-void-900 border border-control text-slate-300 text-xs sm:text-sm max-w-md mx-auto my-4 space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" aria-hidden="true" />
                  <p className="leading-relaxed">
                    {isId
                      ? 'Rangkaian berjalan normal tanpa gangguan atau anomali kelistrikan yang terdeteksi.'
                      : 'Circuit is operating normally with no electrical anomalies or faults detected.'}
                  </p>
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
                          ? 'bg-danger-500/10 border-danger-500/45'
                          : isWarning
                          ? 'bg-amber-500/10 border-amber-500/45'
                          : 'bg-void-900 border-control'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isCritical ? (
                          <AlertTriangle className="w-4 h-4 text-danger-400 shrink-0" aria-hidden="true" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                        ) : (
                          <Info className="w-4 h-4 text-electric-400 shrink-0" aria-hidden="true" />
                        )}
                        <h4
                          className={`text-xs font-bold ${
                            isCritical
                              ? 'text-danger-400'
                              : isWarning
                              ? 'text-amber-300'
                              : 'text-ink'
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
                          <span className="text-ink">
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
                <div className="p-6 sm:p-8 text-center rounded-2xl bg-void-900 border border-control max-w-md mx-auto my-4 space-y-3">
                  <div className="text-sm font-bold text-ink">
                    {isId ? 'Eksplorasi Hipotesis Belum Aktif' : 'What-If Hypotheses Inactive'}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isId
                      ? 'Tambahkan komponen sumber tegangan dan beban pada kanvas untuk mengaktifkan simulasi perbandingan What-If.'
                      : 'Add source and load components on the canvas to activate What-If exploratory hypotheses.'}
                  </p>
                  {isCanvasEmpty && (
                    <button
                      type="button"
                      onClick={handleLoadSampleCircuit}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-700 text-white text-xs font-bold inline-flex items-center gap-2 transition-colors active:scale-95 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                      <span>
                        {isId ? 'Muat Rangkaian Contoh' : 'Load Sample Circuit'}
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                analysis.whatIfPredictions.map((whatIf) => (
                  <div
                    key={whatIf.id}
                    className="p-4 rounded-xl bg-void-900 border border-control space-y-2.5"
                  >
                    <div className="text-xs font-bold text-ink">
                      {isId ? whatIf.titleId : whatIf.titleEn}
                    </div>

                    <div className="p-3 rounded-lg bg-void-950 border border-control space-y-1.5 text-xs">
                      <div className="text-slate-300 font-medium">
                        {isId ? whatIf.hypothesisId : whatIf.hypothesisEn}
                      </div>
                      <div className="text-electric-300 font-semibold leading-relaxed">
                        {isId ? whatIf.predictedOutcomeId : whatIf.predictedOutcomeEn}
                      </div>
                      <div className="pt-2 border-t border-ink/15 space-y-1">
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
