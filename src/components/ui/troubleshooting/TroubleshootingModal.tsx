import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  Play,
  ShieldAlert,
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

interface TroubleshootingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TroubleshootingModal: React.FC<TroubleshootingModalProps> = ({ isOpen, onClose }) => {
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

  // Timer interval loop
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, sessionStartTime]);

  // Reset state when opening modal
  useEffect(() => {
    if (isOpen) {
      setProgress(loadTroubleshootingProgress());
      setValidationFeedback(null);
      setLastScoreResult(null);
    }
  }, [isOpen]);

  const activeScenario: TroubleshootingScenario = useMemo(() => {
    return (
      TROUBLESHOOTING_SCENARIOS.find((s) => s.id === activeScenarioId) ??
      TROUBLESHOOTING_SCENARIOS[0]
    );
  }, [activeScenarioId]);

  const bestRecord = progress.bestScores[activeScenario.id];

  // Load starter faulty circuit onto the canvas
  const handleLoadFaultCircuit = () => {
    useCircuitStore.getState().setNodes(activeScenario.starterCircuit.nodes);
    useCircuitStore.setState({
      edges: activeScenario.starterCircuit.edges,
    });
    useCircuitStore.getState().runSimulation();

    setSessionStartTime(Date.now());
    setElapsedSeconds(0);
    setHintsRevealed(0);
    setValidationFeedback(null);
    setLastScoreResult(null);

    notify(
      isId
        ? `Skenario Gangguan "${isId ? activeScenario.titleId : activeScenario.titleEn}" dimuat ke kanvas!`
        : `Fault scenario "${isId ? activeScenario.titleId : activeScenario.titleEn}" loaded onto canvas!`
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

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#38bdf8', '#f59e0b'],
      });

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-void-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-5xl h-[92dvh] max-h-[850px] bg-void-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden font-sans">
        {/* Header Dock */}
        <header className="px-4 py-3 sm:px-6 sm:py-4 border-b border-white/10 bg-void-950 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight leading-none">
                  {isId ? 'Laboratorium Diagnostik Gangguan' : 'Fault Troubleshooting Lab'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-semibold">
                  Praktik Lapangan
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate hidden sm:block">
                {isId
                  ? 'Temukan Gangguan, Lakukan Pengukuran Tegangan & Arus, dan Perbaiki Sirkit'
                  : 'Isolate Electrical Faults, Measure Potentials & Repair Broken Networks'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-void-900 border border-white/10 font-mono text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {Math.floor(elapsedSeconds / 60)}:
                {(elapsedSeconds % 60).toString().padStart(2, '0')}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-void-850 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Content Two-Column Layout */}
        <div className="flex flex-1 min-h-0 divide-x divide-white/10">
          {/* Left Column: Scenario Selector */}
          <aside className="w-72 sm:w-80 flex flex-col bg-void-950/40 shrink-0 min-h-0">
            <div className="p-3 border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-slate-400">
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
                    onClick={() => {
                      setActiveScenarioId(scen.id);
                      setHintsRevealed(0);
                      setValidationFeedback(null);
                      setLastScoreResult(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all active:scale-95 cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/40 text-white shadow-sm'
                        : 'bg-void-900/60 border-white/5 hover:bg-void-850 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {scen.difficulty} · ~{scen.estimatedMinutes} min
                      </span>
                      {record && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono font-bold">
                          {'★'.repeat(record.stars)} {record.score}
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
          <main className="flex-1 flex flex-col min-h-0 bg-void-900 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Title & Metadata */}
            <div className="space-y-2 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold uppercase">
                  {activeScenario.category.replace('_', ' ')}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-void-800 text-slate-400 text-[10px] uppercase font-mono">
                  {activeScenario.difficulty}
                </span>
                {bestRecord && (
                  <span className="text-amber-400 text-xs font-mono font-bold">
                    ★ {isId ? 'Skor Tertinggi:' : 'High Score:'} {bestRecord.score} pts
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
                {isId ? activeScenario.titleId : activeScenario.titleEn}
              </h3>
            </div>

            {/* Observable Symptoms */}
            <div className="p-4 rounded-xl bg-void-950 border border-white/5 space-y-2">
              <div className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>{isId ? 'Gejala & Indikasi Kerusakan' : 'Observable Fault Symptoms'}</span>
              </div>
              <ul className="space-y-1 text-xs text-slate-400 list-disc list-inside">
                {(isId ? activeScenario.symptomsId : activeScenario.symptomsEn).map((sym, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {sym}
                  </li>
                ))}
              </ul>
            </div>

            {/* Target Expected Behavior */}
            <div className="p-4 rounded-xl bg-void-950 border border-emerald-500/20 space-y-1">
              <div className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold">
                {isId ? 'Target Kondisi Normal (Kriteria Selesai):' : 'Expected Normal Behavior:'}
              </div>
              <div className="text-xs text-slate-200 leading-relaxed font-sans">
                {isId ? activeScenario.expectedBehaviorId : activeScenario.expectedBehaviorEn}
              </div>
            </div>

            {/* Progressive 3-Stage Hint System */}
            <div className="p-4 rounded-xl bg-void-950 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-sky-400" />
                  <span>{isId ? 'Petunjuk Diagnostik Bertingkat' : 'Progressive Diagnostic Hints'}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {hintsRevealed} / 3 {isId ? 'terbuka' : 'revealed'}
                </span>
              </div>

              <div className="space-y-2">
                {activeScenario.hints.map((hint, idx) => {
                  const isVisible = idx < hintsRevealed;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs leading-relaxed transition-all ${
                        isVisible
                          ? 'bg-void-900 border-sky-500/30 text-slate-200'
                          : 'bg-void-900/30 border-white/5 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] font-bold pb-1 text-sky-400">
                        <span>
                          {isId ? `Petunjuk Tahap ${hint.stage}` : `Stage ${hint.stage} Hint`}
                        </span>
                        <span className="text-amber-400/80">-{hint.scorePenalty} pts</span>
                      </div>
                      {isVisible ? (
                        <div>{isId ? hint.textId : hint.textEn}</div>
                      ) : (
                        <div className="italic text-slate-600">
                          🔒 {isId ? 'Petunjuk terkunci. Klik tombol di bawah untuk membuka.' : 'Hint locked. Click below to reveal.'}
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
                  className="px-3.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-semibold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
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
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  validationFeedback.success
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                    : 'bg-red-500/15 border-red-500/40 text-red-200'
                }`}
              >
                {validationFeedback.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
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
              <div className="p-4 rounded-xl bg-void-950 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 text-xs">
                    {isId ? 'Rincian Penilaian Diagnostik:' : 'Diagnostic Score Breakdown:'}
                  </span>
                  <span className="text-amber-400 font-mono font-bold text-sm">
                    {'★'.repeat(lastScoreResult.stars)} ({lastScoreResult.stars} Bintang)
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
                  <div className="p-2 rounded bg-void-900 border border-white/5">
                    <div className="text-[10px] text-slate-500">Base</div>
                    <div className="font-bold text-slate-200">{lastScoreResult.baseScore}</div>
                  </div>
                  <div className="p-2 rounded bg-void-900 border border-white/5">
                    <div className="text-[10px] text-slate-500">Hints</div>
                    <div className="font-bold text-red-400">-{lastScoreResult.hintPenalty}</div>
                  </div>
                  <div className="p-2 rounded bg-void-900 border border-white/5">
                    <div className="text-[10px] text-slate-500">Time</div>
                    <div className="font-bold text-amber-400">-{lastScoreResult.timePenalty}</div>
                  </div>
                  <div className="p-2 rounded bg-amber-500/20 border border-amber-500/40">
                    <div className="text-[10px] text-amber-400">Total</div>
                    <div className="font-bold text-white text-sm">{lastScoreResult.finalScore}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons Dock */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleLoadFaultCircuit}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-void-800 hover:bg-void-750 text-slate-200 border border-white/10 font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 text-electric-400" />
                <span>{isId ? 'Muat Gangguan ke Kanvas' : 'Load Fault to Canvas'}</span>
              </button>

              <button
                type="button"
                onClick={handleVerifyRepair}
                className="w-full sm:flex-1 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isId ? 'Verifikasi Perbaikan Listrik' : 'Verify Electrical Repair'}</span>
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
