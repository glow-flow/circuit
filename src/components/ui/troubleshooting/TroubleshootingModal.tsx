import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Lock,
  Play,
  ShieldAlert,
  Star,
  ArrowLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { TROUBLESHOOTING_SCENARIOS } from '../../../troubleshooting/troubleshootingCatalog';
import {
  calculateTroubleshootingScore,
  loadTroubleshootingProgress,
  recordTroubleshootingRun,
} from '../../../troubleshooting/troubleshootingScoring';
import {
  TroubleshootingScenario,
  TroubleshootingProgress,
  TroubleshootingScoreResult,
} from '../../../types/troubleshooting';
import { useModalFocusTrap } from '../../../hooks/useModalKeyboardClose';
import { LabModalHeader } from '../common/LabModalHeader';

interface TroubleshootingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TroubleshootingModal: React.FC<TroubleshootingModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalFocusTrap(isOpen, dialogRef, onClose);

  const nodes = useCircuitStore((state) => state.nodes);
  const edges = useCircuitStore((state) => state.edges);
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);
  const notify = useCircuitStore((state) => state.notify);
  const isId = language === 'id';

  const [activeScenarioId, setActiveScenarioId] = useState<string>(
    TROUBLESHOOTING_SCENARIOS[0].id
  );
  const [hintsRevealed, setHintsRevealed] = useState<number>(0);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [progress, setProgress] = useState<TroubleshootingProgress>(() =>
    loadTroubleshootingProgress()
  );
  const [lastScoreResult, setLastScoreResult] = useState<TroubleshootingScoreResult | null>(null);
  const [validationFeedback, setValidationFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  // Reset view state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMobileView('list');
      setValidationFeedback(null);
      setProgress(loadTroubleshootingProgress());
      setLastScoreResult(null);
    }
  }, [isOpen]);

  // Timer interval loop
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, sessionStartTime]);

  const activeScenario: TroubleshootingScenario = useMemo(() => {
    return (
      TROUBLESHOOTING_SCENARIOS.find((s) => s.id === activeScenarioId) ??
      TROUBLESHOOTING_SCENARIOS[0]
    );
  }, [activeScenarioId]);

  const bestRecord = progress.bestScores[activeScenario.id];

  // Load starter faulty circuit onto the canvas
  const handleLoadFaultCircuit = () => {
    const starterNodes = JSON.parse(JSON.stringify(activeScenario.starterCircuit.nodes));
    const starterEdges = JSON.parse(JSON.stringify(activeScenario.starterCircuit.edges));

    const targetWorld = activeScenario.targetWorldMode ?? 'lab';
    useCircuitStore.getState().loadCustomCircuit(starterNodes, starterEdges, targetWorld);

    setSessionStartTime(Date.now());
    setElapsedSeconds(0);
    setHintsRevealed(0);
    setValidationFeedback(null);
    setLastScoreResult(null);

    notify(
      isId
        ? `Skenario Gangguan "${activeScenario.titleId}" dimuat ke kanvas!`
        : `Fault scenario "${activeScenario.titleEn}" loaded onto canvas!`
    );
    onClose();
  };

  // Reveal next progressive hint
  const handleRevealNextHint = () => {
    if (hintsRevealed < 3) {
      setHintsRevealed((prev) => prev + 1);
    }
  };

  // Validate physical repair against real MNA simulation and topology
  const handleVerifyRepair = () => {
    const result = activeScenario.validateRepair({ nodes, edges, simulation });

    if (result.isRepaired) {
      const scoreResult = calculateTroubleshootingScore(hintsRevealed, elapsedSeconds);
      const updatedProgress = recordTroubleshootingRun(
        activeScenario.id,
        scoreResult,
        hintsRevealed
      );
      setProgress(updatedProgress);
      setLastScoreResult(scoreResult);
      setValidationFeedback({
        success: true,
        message: isId ? result.feedbackMessageId : result.feedbackMessageEn,
      });

      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#38bdf8', '#f59e0b'],
        });
      } catch {
        // Ignore confetti errors in headless runs
      }

      notify(
        isId
          ? `Perbaikan Terverifikasi! Skor: ${scoreResult.finalScore} Poin (${scoreResult.stars} Bintang)!`
          : `Repair Verified! Score: ${scoreResult.finalScore} Pts (${scoreResult.stars} Stars)!`
      );
    } else {
      setValidationFeedback({
        success: false,
        message: isId ? result.feedbackMessageId : result.feedbackMessageEn,
      });
    }
  };

  if (!isOpen) return null;

  const timerSlot = (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-void-900 border border-control font-mono text-xs tabular-nums text-ink shrink-0"
      aria-label={isId ? 'Waktu sesi diagnostik' : 'Diagnostic elapsed timer'}
    >
      <Clock className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
      <span>
        {Math.floor(elapsedSeconds / 60)}:
        {(elapsedSeconds % 60).toString().padStart(2, '0')}
      </span>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-scrim/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="troubleshooting-modal-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="flex flex-col w-full max-w-5xl h-[100dvh] sm:h-[92dvh] sm:max-h-[850px] bg-void-900 border-0 sm:border sm:border-control rounded-none sm:rounded-2xl shadow-2xl overflow-hidden font-sans text-ink"
        onClick={(e) => e.stopPropagation()}
      >
        <LabModalHeader
          titleId="troubleshooting-modal-title"
          eyebrow={isId ? 'PRAKTIK LAPANGAN' : 'FIELD DIAGNOSTICS'}
          title={isId ? 'Laboratorium Diagnostik Gangguan' : 'Fault Troubleshooting Lab'}
          subtitle={
            isId
              ? 'Temukan gangguan, ukur tegangan serta arus, dan perbaiki sirkit yang rusak'
              : 'Isolate electrical faults, measure potentials & repair broken networks'
          }
          rightSlot={timerSlot}
          onClose={onClose}
          closeLabel={isId ? 'Tutup Lab Diagnostik' : 'Close Fault Lab'}
        />

        {/* Main Content Two-Column Layout */}
        <div className="flex flex-1 min-h-0 divide-x-0 md:divide-x divide-ink/15">
          {/* Left Column: Scenario Selector */}
          <aside
            className={`w-full md:w-72 lg:w-80 flex-col bg-void-950 shrink-0 min-h-0 ${
              mobileView === 'detail' ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="p-3 border-b border-ink/15 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              {isId ? 'Daftar Kasus Gangguan Listrik' : 'Fault Case Studies'}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {TROUBLESHOOTING_SCENARIOS.map((scen) => {
                const isSelected = activeScenarioId === scen.id;
                const record = progress.bestScores[scen.id];

                return (
                  <button
                    key={scen.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setActiveScenarioId(scen.id);
                      setHintsRevealed(0);
                      setValidationFeedback(null);
                      setLastScoreResult(null);
                      setMobileView('detail');
                    }}
                    className={`w-full min-h-[44px] text-left p-3 rounded-xl border transition-colors active:scale-95 cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/60 text-ink'
                        : 'bg-void-900 border-control hover:bg-void-850 text-ink'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono tabular-nums text-slate-400 uppercase">
                        {scen.difficulty} · ~{scen.estimatedMinutes} min
                      </span>
                      {record && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-mono font-bold tabular-nums">
                          <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                          <span>
                            {record.stars}/3 ({record.score})
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-xs leading-snug line-clamp-1">
                      {isId ? scen.titleId : scen.titleEn}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Column: Scenario Details, Symptoms, Hints & Verifier */}
          <main
            className={`flex-1 flex-col min-h-0 bg-void-900 overflow-y-auto p-4 sm:p-6 space-y-6 ${
              mobileView === 'list' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Mobile Back Button */}
            <div className="md:hidden flex items-center justify-between pb-3 border-b border-ink/15">
              <button
                type="button"
                onClick={() => setMobileView('list')}
                className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-void-950 border border-control text-xs font-semibold text-amber-400 hover:text-ink transition-colors active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isId ? 'Kasus Lain' : 'All Cases'}</span>
              </button>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/40 uppercase">
                {activeScenario.difficulty}
              </span>
            </div>

            {/* Title & Metadata */}
            <div className="space-y-2 border-b border-ink/15 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/40 font-mono text-[10px] font-bold uppercase">
                  {activeScenario.category.replace('_', ' ')}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-void-850 border border-control text-slate-300 text-[10px] uppercase font-mono">
                  {activeScenario.difficulty}
                </span>
                {bestRecord && (
                  <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-mono font-bold tabular-nums">
                    <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                    <span>
                      {isId ? 'Skor Tertinggi:' : 'High Score:'} {bestRecord.score} pts
                    </span>
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                {isId ? activeScenario.titleId : activeScenario.titleEn}
              </h3>
            </div>

            {/* Observable Symptoms */}
            <div className="p-4 rounded-xl bg-void-950 border border-control space-y-2">
              <div className="font-semibold text-xs text-ink flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span>{isId ? 'Gejala & Indikasi Kerusakan' : 'Observable Fault Symptoms'}</span>
              </div>
              <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                {(isId ? activeScenario.symptomsId : activeScenario.symptomsEn).map((sym, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {sym}
                  </li>
                ))}
              </ul>
            </div>

            {/* Target Expected Behavior */}
            <div className="p-4 rounded-xl bg-void-950 border border-emerald-500/45 space-y-1">
              <div className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold">
                {isId ? 'Target Kondisi Normal (Kriteria Selesai):' : 'Expected Normal Behavior:'}
              </div>
              <div className="text-xs text-ink leading-relaxed font-sans">
                {isId ? activeScenario.expectedBehaviorId : activeScenario.expectedBehaviorEn}
              </div>
            </div>

            {/* Progressive 3-Stage Hint System */}
            <div className="p-4 rounded-xl bg-void-950 border border-control space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-xs text-ink flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-sky-400" aria-hidden="true" />
                  <span>{isId ? 'Petunjuk Diagnostik Bertingkat' : 'Progressive Diagnostic Hints'}</span>
                </div>
                <span className="text-[10px] font-mono tabular-nums text-slate-400">
                  {hintsRevealed} / 3 {isId ? 'terbuka' : 'revealed'}
                </span>
              </div>

              <div className="space-y-2">
                {activeScenario.hints.map((hint, idx) => {
                  const isVisible = idx < hintsRevealed;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs leading-relaxed transition-colors ${
                        isVisible
                          ? 'bg-void-900 border-sky-500/45 text-ink'
                          : 'bg-void-900 border-control text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] font-bold pb-1 text-sky-400">
                        <span>
                          {isId ? `Petunjuk Tahap ${hint.stage}` : `Stage ${hint.stage} Hint`}
                        </span>
                        <span className="text-amber-400 tabular-nums">-{hint.scorePenalty} pts</span>
                      </div>
                      {isVisible ? (
                        <div>{isId ? hint.textId : hint.textEn}</div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>
                            {isId
                              ? 'Petunjuk terkunci. Klik tombol di bawah untuk membuka.'
                              : 'Hint locked. Click below to reveal.'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {hintsRevealed < 3 && (
                <button
                  type="button"
                  onClick={handleRevealNextHint}
                  className="min-h-[44px] px-3.5 py-2 rounded-lg bg-void-900 hover:bg-void-850 border border-sky-500/50 text-sky-300 text-xs font-semibold transition-colors active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
                  <span>
                    {isId
                      ? `Buka Petunjuk Tahap ${hintsRevealed + 1} (-${
                          activeScenario.hints[hintsRevealed].scorePenalty
                        } Poin)`
                      : `Reveal Stage ${hintsRevealed + 1} Hint (-${
                          activeScenario.hints[hintsRevealed].scorePenalty
                        } Pts)`}
                  </span>
                </button>
              )}
            </div>

            {/* Validation Feedback Banner */}
            {validationFeedback && (
              <div
                role="status"
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  validationFeedback.success
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
                    : 'bg-danger-500/15 border-danger-500/50 text-danger-300'
                }`}
              >
                {validationFeedback.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-danger-400 shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <div className="space-y-1">
                  <div className="font-bold text-xs">
                    {validationFeedback.success
                      ? isId
                        ? 'Verifikasi Berhasil!'
                        : 'Verification Successful!'
                      : isId
                      ? 'Gangguan Belum Tuntas'
                      : 'Fault Still Active'}
                  </div>
                  <div className="text-xs leading-relaxed">{validationFeedback.message}</div>
                </div>
              </div>
            )}

            {/* Score Result Card */}
            {lastScoreResult && (
              <div className="p-4 rounded-xl bg-void-950 border border-amber-500/50 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-ink text-xs">
                    {isId ? 'Rincian Penilaian Diagnostik:' : 'Diagnostic Score Breakdown:'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-amber-400 font-mono font-bold tabular-nums text-sm">
                    <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                    <span>
                      {lastScoreResult.stars}/3 ({lastScoreResult.stars}{' '}
                      {isId ? 'Bintang' : 'Stars'})
                    </span>
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono tabular-nums text-xs">
                  <div className="p-2 rounded bg-void-900 border border-control">
                    <div className="text-[10px] text-slate-400">Base</div>
                    <div className="font-bold text-ink">{lastScoreResult.baseScore}</div>
                  </div>
                  <div className="p-2 rounded bg-void-900 border border-control">
                    <div className="text-[10px] text-slate-400">Hints</div>
                    <div className="font-bold text-danger-400">-{lastScoreResult.hintPenalty}</div>
                  </div>
                  <div className="p-2 rounded bg-void-900 border border-control">
                    <div className="text-[10px] text-slate-400">Time</div>
                    <div className="font-bold text-amber-400">-{lastScoreResult.timePenalty}</div>
                  </div>
                  <div className="p-2 rounded bg-amber-500/20 border border-amber-500/50">
                    <div className="text-[10px] text-amber-300">Total</div>
                    <div className="font-bold text-ink text-sm">{lastScoreResult.finalScore}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons Dock */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleLoadFaultCircuit}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-void-850 hover:bg-void-800 text-ink border border-control font-bold text-xs transition-colors active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 text-electric-400" aria-hidden="true" />
                <span>{isId ? 'Muat Gangguan ke Kanvas' : 'Load Fault to Canvas'}</span>
              </button>

              <button
                type="button"
                onClick={handleVerifyRepair}
                className="w-full sm:flex-1 min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>{isId ? 'Verifikasi Perbaikan Listrik' : 'Verify Electrical Repair'}</span>
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
