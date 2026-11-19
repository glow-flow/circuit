import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Hand,
  HelpCircle,
  Play,
  X,
} from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import {
  INTERACTIVE_TUTORIAL_MISSIONS,
  evaluateInteractiveMissionCompletion,
  executeMissionOneClickAssist,
  getInteractiveMissionByIndex,
  prepareCanvasForInteractiveMissionOne,
} from '../../../tutorial/interactiveTutorialConfig';
import { markTutorialAsSeen } from '../../../utils/presetStorage';

export interface InteractiveTutorialBannerProps {
  /** Whether the hands-on interactive mission coach is currently visible on the canvas. */
  isOpen: boolean;
  /** Callback to dismiss the interactive mission coach. */
  onClose: () => void;
  /** Callback to open the full Teacher Quick-Guide & Cheat-Sheet modal. */
  onOpenFullGuide: () => void;
}

/**
 * Interactive Hands-On Practice Coach Banner (`InteractiveTutorialBanner.tsx`).
 *
 * Replaces passive text-only reading tours with an active "Learn-by-Doing" 3-mission
 * canvas coach designed for non-digital science teachers and grade-9 students:
 * - Mission 1: Tap the code-rendered Knife Switch on the Lab canvas to light up the lamp.
 * - Mission 2: Load a 2-lamp Parallel circuit and inspect current splitting / PLN costs.
 * - Mission 3: Switch to Nature Mode and deploy the 12V Solar + Wind + SUTET station.
 *
 * Automatically detects when the user completes each physical action on the canvas
 * in O(N) time and celebrates before advancing to the next step.
 *
 * Time Complexity: O(N) reactive state check per store update (N <= 50 nodes).
 */
export const InteractiveTutorialBanner: React.FC<InteractiveTutorialBannerProps> = ({
  isOpen,
  onClose,
  onOpenFullGuide,
}) => {
  const nodes = useCircuitStore((state) => state.nodes);
  const worldMode = useCircuitStore((state) => state.worldMode);
  const language = useCircuitStore((state) => state.language);
  const isId = language === 'id';

  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isAllCompleted, setIsAllCompleted] = useState<boolean>(false);

  const activeMission = getInteractiveMissionByIndex(activeStepIndex);

  const isCurrentStepDone = Boolean(
    activeMission &&
      evaluateInteractiveMissionCompletion(activeMission.id, nodes, worldMode)
  );

  // When first opened at step 0, ensure a circuit with an OPEN switch is ready in Lab mode
  useEffect(() => {
    if (!isOpen) return;
    setActiveStepIndex(0);
    setIsAllCompleted(false);
    const state = useCircuitStore.getState();
    const hasOpenSwitchInLab =
      state.worldMode === 'lab' &&
      state.nodes.some((n) => n.data?.type === 'switch' && n.data.isOpen === true);
    if (!hasOpenSwitchInLab) {
      prepareCanvasForInteractiveMissionOne();
    }
  }, [isOpen]);

  if (!isOpen || !activeMission) return null;

  const handleNextStep = () => {
    if (activeStepIndex + 1 < INTERACTIVE_TUTORIAL_MISSIONS.length) {
      const nextIndex = activeStepIndex + 1;
      setActiveStepIndex(nextIndex);
      const nextMission = getInteractiveMissionByIndex(nextIndex);
      if (nextMission?.targetWorldMode === 'outside' && worldMode !== 'outside') {
        useCircuitStore.getState().setWorldMode('outside');
      } else if (nextMission?.targetWorldMode === 'lab' && worldMode !== 'lab') {
        useCircuitStore.getState().setWorldMode('lab');
      }
    } else {
      setIsAllCompleted(true);
      markTutorialAsSeen();
    }
  };

  const handleFinishAndClose = () => {
    markTutorialAsSeen();
    onClose();
  };

  return (
    <div
      id="interactive-tutorial-coach"
      role="region"
      aria-label={isId ? 'Panduan Praktikum Interaktif' : 'Interactive Lab Coach'}
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute top-2.5 left-2 right-2 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-xl z-30 pointer-events-auto"
    >
      <div className="rounded-2xl bg-void-900 border border-electric-500/60 shadow-2xl px-3.5 py-2.5 text-ink">
        {isAllCompleted ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/45 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-emerald-400">
                  {isId
                    ? 'Selamat! 3 Misi Praktikum Dasar Selesai!'
                    : 'Congratulations! All 3 Hands-On Missions Complete!'}
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {isId
                    ? 'Gunakan tombol Akademi atau Contoh di bawah untuk materi mengajar lengkap.'
                    : 'Use Academy or Presets below for full classroom lessons.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              <button
                type="button"
                onClick={onOpenFullGuide}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-void-950 hover:bg-void-850 border border-control text-ink text-[11px] font-semibold active:scale-95 transition-colors cursor-pointer"
              >
                {isId ? 'Contekan Guru' : 'Teacher Guide'}
              </button>
              <button
                type="button"
                onClick={handleFinishAndClose}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold active:scale-95 transition-colors cursor-pointer"
              >
                {isId ? 'Tutup Panduan' : 'Finish'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header Row: Step Progress Pills + Quick Actions */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="px-2 py-0.5 rounded-md bg-electric-500/15 border border-electric-500/40 text-electric-400 font-mono tabular-nums text-[10px] font-bold shrink-0">
                  {isId
                    ? `LANGKAH ${activeMission.stepNumber}/3`
                    : `STEP ${activeMission.stepNumber}/3`}
                </span>
                <h3 className="text-xs font-bold text-ink truncate">
                  {isId ? activeMission.titleId : activeMission.titleEn}
                </h3>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={onOpenFullGuide}
                  title={isId ? 'Buka Kartu Contekan Guru' : 'Open Teacher Cheat-Sheet'}
                  className="flex items-center gap-1 min-h-[34px] px-2.5 py-1 rounded-lg bg-void-950 hover:bg-void-850 border border-control text-slate-300 hover:text-ink text-[10px] font-semibold active:scale-95 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3 h-3 text-electric-400" aria-hidden="true" />
                  <span>{isId ? 'Contekan' : 'Cards'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleFinishAndClose}
                  aria-label={isId ? 'Tutup Panduan' : 'Close Guide'}
                  className="min-w-[34px] min-h-[34px] p-1 rounded-lg bg-void-950 hover:bg-void-850 border border-control text-slate-400 hover:text-ink flex items-center justify-center active:scale-95 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Body Row: Instruction or Completion Celebration + 1-Click Assist / Next Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-0.5">
              <p
                className={`text-[11px] leading-snug ${
                  isCurrentStepDone ? 'text-emerald-400 font-semibold' : 'text-slate-300'
                }`}
              >
                {isCurrentStepDone
                  ? isId
                    ? activeMission.successMessageId
                    : activeMission.successMessageEn
                  : isId
                  ? activeMission.instructionId
                  : activeMission.instructionEn}
              </p>

              <div className="flex items-center gap-1.5 shrink-0">
                {!isCurrentStepDone && (
                  <button
                    type="button"
                    onClick={() => executeMissionOneClickAssist(activeMission.id)}
                    className="flex-1 sm:flex-initial min-h-[38px] px-3 py-1.5 rounded-xl bg-electric-600 hover:bg-electric-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-colors cursor-pointer"
                  >
                    <Hand className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      {isId
                        ? activeMission.assistButtonLabelId
                        : activeMission.assistButtonLabelEn}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNextStep}
                  className={`min-h-[38px] px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-colors cursor-pointer ${
                    isCurrentStepDone
                      ? 'flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-void-950 hover:bg-void-850 border border-control text-slate-300 hover:text-ink'
                  }`}
                >
                  {isCurrentStepDone ? (
                    <>
                      <Play className="w-3 h-3 fill-current" aria-hidden="true" />
                      <span>
                        {activeStepIndex === INTERACTIVE_TUTORIAL_MISSIONS.length - 1
                          ? isId
                            ? 'Selesai'
                            : 'Finish'
                          : isId
                          ? 'Lanjut Misi Berikutnya'
                          : 'Next Mission'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>{isId ? 'Lewati' : 'Skip'}</span>
                      <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
