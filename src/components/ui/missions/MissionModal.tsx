import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  CheckCircle2,
  Circle,
  HelpCircle,
  Play,
  X,
  Target,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { MISSION_CATALOG } from '../../../missions/missionCatalog';
import { MissionDefinition, MissionValidationResult } from '../../../types/missions';

interface MissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MISSIONS_STORAGE_KEY = 'circuit_sandbox_missions_progress_v1';

/**
 * Interactive Mission & Practical Challenge Mode Modal.
 * Evaluates real circuit topology and MNA simulation outputs live,
 * provides step-by-step pedagogical guidance, and celebrates success with confetti.
 *
 * Time Complexity: O(M * (N + E)) where M is mission count, N is nodes, E is edges.
 */
export const MissionModal: React.FC<MissionModalProps> = ({ isOpen, onClose }) => {
  const nodes = useCircuitStore((state) => state.nodes);
  const edges = useCircuitStore((state) => state.edges);
  const simulation = useCircuitStore((state) => state.simulation);
  const loadPreset = useCircuitStore((state) => state.loadPreset);
  const language = useCircuitStore((state) => state.language);

  const isId = language === 'id';

  const [activeMissionId, setActiveMissionId] = useState<string>(MISSION_CATALOG[0].id);
  const [completedMissionIds, setCompletedMissionIds] = useState<string[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(MISSIONS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch {
      // Ignore storage error
    }
    return [];
  });
  const [hasCelebratedActive, setHasCelebratedActive] = useState<boolean>(false);
  const [showHints, setShowHints] = useState<boolean>(false);

  const activeMission: MissionDefinition = useMemo(() => {
    return (
      MISSION_CATALOG.find((m) => m.id === activeMissionId) ?? MISSION_CATALOG[0]
    );
  }, [activeMissionId]);

  const activeMissionIndex = useMemo(() => {
    const idx = MISSION_CATALOG.findIndex((m) => m.id === activeMissionId);
    return idx >= 0 ? idx : 0;
  }, [activeMissionId]);

  // Real-time circuit validation evaluation
  const validationResult: MissionValidationResult = useMemo(() => {
    return activeMission.validate({ nodes, edges, simulation });
  }, [activeMission, nodes, edges, simulation]);

  // Handle completion celebration and progress persistence
  useEffect(() => {
    if (validationResult.isCompleted && !completedMissionIds.includes(activeMission.id)) {
      const nextCompleted = [...completedMissionIds, activeMission.id];
      setCompletedMissionIds(nextCompleted);
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(nextCompleted));
        }
      } catch {
        // Ignore storage error
      }

      // Fire celebratory confetti!
      if (!hasCelebratedActive) {
        setHasCelebratedActive(true);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#f59e0b', '#10b981', '#a855f7'],
        });
      }
    }
  }, [validationResult.isCompleted, activeMission.id, completedMissionIds, hasCelebratedActive]);

  // Reset celebration state when switching missions
  useEffect(() => {
    setHasCelebratedActive(false);
    setShowHints(false);
  }, [activeMissionId]);

  if (!isOpen) return null;

  const handleLoadStarter = (starterName?: string) => {
    if (starterName) {
      loadPreset(starterName as any);
      onClose();
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            {isId ? 'Pemula' : 'Beginner'}
          </span>
        );
      case 'intermediate':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            {isId ? 'Menengah' : 'Intermediate'}
          </span>
        );
      case 'advanced':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
            {isId ? 'Mahir' : 'Advanced'}
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Tantangan & Misi Praktikum"
    >
      <div className="w-full max-w-4xl max-h-[92dvh] rounded-2xl bg-void-900 border border-white/15 shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-void-850 shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                <span>{isId ? 'Misi & Tantangan Praktikum IPA' : 'Mission & Challenge Mode'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  {completedMissionIds.length} / {MISSION_CATALOG.length} {isId ? 'Selesai' : 'Completed'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">
                {isId
                  ? 'Selesaikan eksperimen praktis dengan validasi topologi dan simulasi listrik nyata'
                  : 'Solve practical laboratory challenges verified by real-time MNA simulation'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-void-900 text-slate-400 hover:text-white border border-white/10 active:scale-95 transition-all cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout (Sidebar Missions List on Desktop / Horizontal Tabs on Mobile) */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* Mission Selector: Compact Horizontal Tab Strip on Mobile (< md), Vertical Sidebar on Desktop (md+) */}
          <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-white/10 bg-void-950/75 p-2.5 md:p-3 shrink-0 select-none overflow-x-auto md:overflow-y-auto no-scrollbar">
            <div className="hidden md:block text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1.5">
              {isId ? 'Daftar Misi Praktikum' : 'Challenge Missions'}
            </div>
            <div className="flex md:flex-col gap-2 min-w-max md:min-w-0">
              {MISSION_CATALOG.map((mission, idx) => {
                const isSelected = mission.id === activeMissionId;
                const isDone = completedMissionIds.includes(mission.id);
                const title = isId ? mission.titleId : mission.titleEn;

                return (
                  <button
                    key={mission.id}
                    type="button"
                    onClick={() => setActiveMissionId(mission.id)}
                    className={`text-left rounded-xl border transition-all active:scale-95 cursor-pointer flex items-center justify-between gap-2.5 shrink-0 ${
                      isSelected
                        ? 'bg-electric-500/15 border-electric-500/40 text-electric-300 shadow-md ring-1 ring-electric-400/30'
                        : 'bg-void-900 hover:bg-void-850 border-white/5 text-slate-300'
                    } px-3 py-2 md:p-3 w-auto md:w-full`}
                  >
                    <div className="min-w-0 max-w-[180px] md:max-w-none">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mb-0.5">
                        <span className="font-bold text-amber-400">#{idx + 1}</span>
                        <span>•</span>
                        <span>{mission.estimatedMinutes}m</span>
                      </div>
                      <div className="text-xs font-bold truncate leading-tight">{title}</div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0 hidden md:block" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Active Mission Workspace Panel */}
          <div className="flex-1 min-h-0 p-5 overflow-y-auto overscroll-contain space-y-5">
            {/* Mission Hero Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {getDifficultyBadge(activeMission.difficulty)}
                  <span className="text-xs text-slate-400 font-mono">
                    ~{activeMission.estimatedMinutes} {isId ? 'menit pengerjaan' : 'minutes duration'}
                  </span>
                </div>

                {activeMission.starterCircuitName && (
                  <button
                    type="button"
                    onClick={() => handleLoadStarter(activeMission.starterCircuitName)}
                    className="min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold bg-void-850 hover:bg-white/10 text-electric-400 border border-electric-500/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-electric-400" />
                    <span>{isId ? 'Muat Starter Kanvas' : 'Load Starter Circuit'}</span>
                  </button>
                )}
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-100">
                {isId ? activeMission.titleId : activeMission.titleEn}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isId ? activeMission.descriptionId : activeMission.descriptionEn}
              </p>
            </div>

            {/* Live Circuit Verification Card */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                validationResult.isCompleted
                  ? 'bg-emerald-950/40 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                  : 'bg-void-950/80 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  {validationResult.isCompleted ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <Target className="w-5 h-5 text-electric-400 shrink-0" />
                  )}
                  <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                    {validationResult.isCompleted
                      ? isId
                        ? 'Misi Berhasil Diselesaikan! 🎉'
                        : 'Mission Completed! 🎉'
                      : isId
                      ? 'Status Validasi Rangkaian Real-Time'
                      : 'Live Circuit Validation Status'}
                  </h4>
                </div>

                <div className="text-xs font-mono font-bold text-slate-200">
                  {validationResult.progressPercent}%
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-void-900 overflow-hidden mb-3.5 border border-white/5">
                <div
                  className={`h-full transition-all duration-300 ${
                    validationResult.isCompleted ? 'bg-emerald-400 shadow-glow' : 'bg-electric-400'
                  }`}
                  style={{ width: `${validationResult.progressPercent}%` }}
                />
              </div>

              {/* Live Objective Checkpoints */}
              <div className="space-y-2 font-sans text-xs">
                {validationResult.objectiveResults.map((obj, i) => {
                  const definition = activeMission.objectives.find((o) => o.id === obj.objectiveId);
                  const desc = definition
                    ? isId
                      ? definition.descriptionId
                      : definition.descriptionEn
                    : obj.objectiveId;

                  return (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-colors ${
                        obj.isSatisfied
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200'
                          : 'bg-void-900/60 border-white/5 text-slate-300'
                      }`}
                    >
                      {obj.isSatisfied ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[11px] sm:text-xs leading-snug">{desc}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {obj.feedbackText}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Feedback Message */}
              <div className="mt-3 text-[11px] font-sans text-slate-300 flex items-center gap-2">
                {validationResult.isCompleted ? (
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span>{validationResult.feedbackMessage}</span>
              </div>
            </div>

            {/* Learning Objectives & Instructions Tabs/Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Learning Objectives */}
              <div className="p-4 rounded-xl bg-void-950/60 border border-white/5 space-y-2">
                <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                  <Target className="w-3.5 h-3.5 text-electric-400" />
                  <span>{isId ? 'Tujuan Pembelajaran IPA' : 'Learning Objectives'}</span>
                </div>
                <ul className="list-disc list-inside space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
                  {(isId ? activeMission.learningObjectivesId : activeMission.learningObjectivesEn).map(
                    (obj, idx) => (
                      <li key={idx}>{obj}</li>
                    )
                  )}
                </ul>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="p-4 rounded-xl bg-void-950/60 border border-white/5 space-y-2">
                <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isId ? 'Panduan Langkah Kerja' : 'Step-by-Step Instructions'}</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
                  {(isId ? activeMission.instructionsId : activeMission.instructionsEn).map(
                    (inst, idx) => (
                      <li key={idx}>{inst}</li>
                    )
                  )}
                </ol>
              </div>
            </div>

            {/* Hints Accordion */}
            <div className="p-3.5 rounded-xl bg-void-950/40 border border-white/5 space-y-2">
              <button
                type="button"
                onClick={() => setShowHints(!showHints)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span>{isId ? 'Butuh Petunjuk Tambahan?' : 'Need Hints & Clues?'}</span>
                </div>
                <span className="text-[10px] text-electric-400 font-mono">
                  {showHints ? (isId ? 'Sembunyikan' : 'Hide') : isId ? 'Tampilkan' : 'Show'}
                </span>
              </button>

              {showHints && (
                <div className="pt-2 border-t border-white/5 text-[11px] text-slate-400 space-y-1">
                  {(isId ? activeMission.hintsId : activeMission.hintsEn).map((hint, idx) => (
                    <p key={idx} className="leading-relaxed">
                      💡 {hint}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Mission Stepper Navigation Footer */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={activeMissionIndex <= 0}
                onClick={() => setActiveMissionId(MISSION_CATALOG[activeMissionIndex - 1].id)}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-void-850 hover:bg-void-800 disabled:opacity-35 disabled:cursor-not-allowed border border-white/10 flex items-center gap-1.5 text-slate-200 transition-all active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{isId ? 'Misi Sebelumnya' : 'Previous Mission'}</span>
              </button>

              <div className="text-xs font-mono font-medium text-slate-400">
                {activeMissionIndex + 1} / {MISSION_CATALOG.length}
              </div>

              <button
                type="button"
                disabled={activeMissionIndex >= MISSION_CATALOG.length - 1}
                onClick={() => setActiveMissionId(MISSION_CATALOG[activeMissionIndex + 1].id)}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-void-850 hover:bg-void-800 disabled:opacity-35 disabled:cursor-not-allowed border border-white/10 flex items-center gap-1.5 text-slate-200 transition-all active:scale-95 cursor-pointer"
              >
                <span>{isId ? 'Misi Selanjutnya' : 'Next Mission'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
