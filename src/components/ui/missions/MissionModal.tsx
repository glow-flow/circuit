import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Play,
  Sparkles,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { MISSION_CATALOG } from '../../../missions/missionCatalog';
import { MissionDefinition, MissionValidationResult } from '../../../types/missions';
import { LabModalHeader } from '../common/LabModalHeader';
import { MascotCoachBubble, MascotMood } from '../common/MascotAvatar';
import { useModalKeyboardClose } from '../../../hooks/useModalKeyboardClose';
import {
  MissionTopologyPreview,
  getMissionVisualMeta,
} from './MissionTopologyPreview';

interface MissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MISSIONS_STORAGE_KEY = 'circuit_sandbox_missions_progress_v1';

/**
 * Safely reads persisted completed mission IDs from Web Storage.
 * Time Complexity: O(M) where M = stored mission count.
 */
function loadCompletedMissionIds(): string[] {
  try {
    const raw = localStorage.getItem(MISSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Selects reactive Watt mascot mood & concise feedback tailored to live validation status.
 * Time Complexity: O(1).
 */
function resolveMissionCoachState(
  isShortCircuit: boolean,
  validation: MissionValidationResult,
  isId: boolean
): { mood: MascotMood; message: string; accent: 'emerald' | 'rose' | 'amber' | 'electric' } {
  if (isShortCircuit) {
    return {
      mood: 'angry',
      accent: 'rose',
      message: isId
        ? 'Waduh, ada korsleting aktif di kanvas! Putus dulu kabel bypass sebelum lanjut!'
        : 'Whoa, active short circuit on canvas! Remove the bypass wire first!',
    };
  }
  if (validation.isCompleted) {
    return {
      mood: 'celebrate',
      accent: 'emerald',
      message: validation.feedbackMessage,
    };
  }
  if (validation.progressPercent >= 50) {
    return {
      mood: 'proud',
      accent: 'electric',
      message: `${validation.progressPercent}%! ${validation.feedbackMessage}`,
    };
  }
  return {
    mood: 'confused',
    accent: 'amber',
    message: validation.feedbackMessage,
  };
}

/**
 * Clean, mobile-friendly Missions & Lab Challenges modal with Watt mascot coaching,
 * target schematic previews, live validation pills, and 1-tap collapsible guides.
 *
 * Time Complexity: O(M + V) per evaluation where M = 5 missions, V = circuit node validation.
 */
export const MissionModal: React.FC<MissionModalProps> = ({ isOpen, onClose }) => {
  useModalKeyboardClose(isOpen, onClose);

  const nodes = useCircuitStore((state) => state.nodes);
  const edges = useCircuitStore((state) => state.edges);
  const simulation = useCircuitStore((state) => state.simulation);
  const loadPreset = useCircuitStore((state) => state.loadPreset);
  const language = useCircuitStore((state) => state.language);

  const isId = language === 'id';

  const [activeMissionId, setActiveMissionId] = useState<string>(MISSION_CATALOG[0].id);
  const [completedMissionIds, setCompletedMissionIds] = useState<string[]>(loadCompletedMissionIds);
  const [showGuideDrawer, setShowGuideDrawer] = useState<boolean>(false);

  const activeMission: MissionDefinition = useMemo(() => {
    return MISSION_CATALOG.find((m) => m.id === activeMissionId) || MISSION_CATALOG[0];
  }, [activeMissionId]);

  const activeMeta = useMemo(
    () => getMissionVisualMeta(activeMission.id),
    [activeMission.id]
  );

  const validationResult: MissionValidationResult = useMemo(() => {
    return activeMission.validate({ nodes, edges, simulation });
  }, [activeMission, nodes, edges, simulation]);

  useEffect(() => {
    if (
      validationResult.isCompleted &&
      !completedMissionIds.includes(activeMission.id)
    ) {
      const updated = [...completedMissionIds, activeMission.id];
      setCompletedMissionIds(updated);
      try {
        localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(updated));
        confetti({
          particleCount: 70,
          spread: 65,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#10b981', '#e2e8f0'],
        });
      } catch {
        // Ignore storage or canvas confetti errors in headless runs
      }
    }
  }, [validationResult.isCompleted, activeMission.id, completedMissionIds]);

  const handleLoadStarter = () => {
    if (!activeMission.starterCircuitName) return;
    loadPreset(activeMission.starterCircuitName as Parameters<typeof loadPreset>[0]);
    onClose();
  };

  if (!isOpen) return null;

  const coach = resolveMissionCoachState(
    simulation.isShortCircuit,
    validationResult,
    isId
  );

  const progressPillSlot = (
    <div className="px-3 py-1.5 rounded-xl bg-void-950 border border-white/10 font-mono text-xs font-bold text-electric-300 shrink-0">
      {completedMissionIds.length} / {MISSION_CATALOG.length}{' '}
      {isId ? 'Selesai' : 'Done'}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mission-modal-title"
    >
      <div className="w-full max-w-4xl max-h-[92dvh] flex flex-col rounded-2xl bg-void-900 border border-white/15 shadow-2xl overflow-hidden text-slate-200">
        <LabModalHeader
          titleId="mission-modal-title"
          title={isId ? 'Misi Praktikum Lab' : 'Lab Challenges'}
          rightSlot={progressPillSlot}
          onClose={onClose}
          closeLabel={isId ? 'Tutup Misi' : 'Close Missions'}
        />

        {/* Slim Horizontal Mission Pills */}
        <div className="px-3.5 py-2.5 bg-void-950 border-b border-white/10 flex items-center gap-2 overflow-x-auto shrink-0">
          {MISSION_CATALOG.map((mission, idx) => {
            const isSelected = mission.id === activeMission.id;
            const isDone = completedMissionIds.includes(mission.id);
            const meta = getMissionVisualMeta(mission.id);

            return (
              <button
                key={mission.id}
                type="button"
                onClick={() => {
                  setActiveMissionId(mission.id);
                  setShowGuideDrawer(false);
                }}
                className={`min-h-[42px] px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0 ${
                  isSelected
                    ? 'bg-electric-500 text-void-950 border-electric-400 font-bold'
                    : isDone
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                    : 'bg-void-900 border-white/10 text-slate-300 hover:border-white/25'
                }`}
              >
                <span className="font-mono text-[11px]">#{idx + 1}</span>
                <span>{isId ? meta.shortTabId : meta.shortTabEn}</span>
                {isDone && (
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      isSelected ? 'text-void-950' : 'text-emerald-400'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Clean Scrollable Active Mission Stage */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-void-950 space-y-4">
          {/* Header + 1-Line Summary */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="px-2 py-0.5 rounded-md bg-void-900 border border-white/10 text-electric-300 font-bold uppercase">
                {activeMission.difficulty}
              </span>
              <span>~{activeMission.estimatedMinutes} {isId ? 'menit' : 'min'}</span>
              {completedMissionIds.includes(activeMission.id) && (
                <span className="text-emerald-400 font-bold">
                  · {isId ? 'TUNTAS' : 'COMPLETED'}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
              {isId ? activeMission.titleId : activeMission.titleEn}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isId ? activeMeta.summaryId : activeMeta.summaryEn}
            </p>
          </div>

          {/* Reactive Mascot Coach */}
          <MascotCoachBubble
            mood={coach.mood}
            eyebrow="Watt"
            message={coach.message}
            accent={coach.accent}
            size="sm"
          />

          {/* Compact Visual Target + Live Real-Time Validation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <MissionTopologyPreview missionId={activeMission.id} isId={isId} />

            {/* Live Checklist */}
            <div className="rounded-xl bg-void-900 border border-white/10 p-3.5 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-200">
                    {isId ? 'Cek Kanvas Langsung' : 'Live Canvas Check'}
                  </span>
                  <span className="font-mono font-bold text-electric-300">
                    {validationResult.progressPercent}%
                  </span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-void-950 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      validationResult.isCompleted ? 'bg-emerald-400' : 'bg-electric-500'
                    }`}
                    style={{ width: `${validationResult.progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                {activeMission.objectives.map((obj) => {
                  const res = validationResult.objectiveResults.find(
                    (r) => r.objectiveId === obj.id
                  );
                  const isOk = Boolean(res?.isSatisfied);

                  return (
                    <div
                      key={obj.id}
                      className={`px-2.5 py-2 rounded-lg border text-xs flex items-start gap-2 ${
                        isOk
                          ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-200'
                          : 'bg-void-950 border-white/10 text-slate-300'
                      }`}
                    >
                      {isOk ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium leading-snug">
                          {isId ? obj.descriptionId : obj.descriptionEn}
                        </div>
                        {res?.feedbackText && !isOk && (
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            {res.feedbackText}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Primary Actions Row */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            {activeMission.starterCircuitName && (
              <button
                type="button"
                onClick={handleLoadStarter}
                className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-electric-500 hover:bg-electric-400 text-void-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isId ? 'Muat Starter ke Kanvas' : 'Load Starter Blueprint'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-void-900 hover:bg-void-850 border border-white/15 text-slate-100 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-electric-400" />
              <span>{isId ? 'Lanjut Rangkai di Kanvas' : 'Build on Canvas'}</span>
            </button>
          </div>

          {/* 1-Tap Collapsible Steps & Hint Drawer (Hidden by default to prevent text overload) */}
          <div className="rounded-xl bg-void-900 border border-white/10 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowGuideDrawer((v) => !v)}
              className="w-full min-h-[44px] px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-electric-400" />
                <span>
                  {isId ? 'Lihat Langkah & Petunjuk Teknis' : 'Show Step-by-Step Guide & Hints'}
                </span>
              </span>
              {showGuideDrawer ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showGuideDrawer && (
              <div className="px-3.5 pb-3.5 pt-2 border-t border-white/10 space-y-3 text-xs">
                <div className="space-y-1.5">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    {isId ? 'Langkah Praktikum' : 'Instructions'}
                  </div>
                  {(isId ? activeMission.instructionsId : activeMission.instructionsEn).map(
                    (step, idx) => (
                      <div key={idx} className="text-slate-300 leading-relaxed">
                        {step}
                      </div>
                    )
                  )}
                </div>

                {(isId ? activeMission.hintsId : activeMission.hintsEn).length > 0 && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-200 leading-relaxed">
                    <span className="font-bold">Hint: </span>
                    {(isId ? activeMission.hintsId : activeMission.hintsEn)[0]}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
