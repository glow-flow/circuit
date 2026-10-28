import React, { useEffect, useState, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  BookOpen,
  Lightbulb,
} from 'lucide-react';
import { TUTORIAL_STEPS, getTutorialStep } from '../../constants/tutorialSteps';
import { markTutorialAsSeen } from '../../utils/presetStorage';
import { useCircuitStore } from '../../store/useCircuitStore';
import { TutorialStepStage } from './tutorial/TutorialStepStage';

export interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Interactive 4-Step Lab Manual & Onboarding Modal (`TutorialModal.tsx`).
 *
 * Features:
 * - Void Dark Mode blueprint aesthetic with neon cyan tactile controls.
 * - Live interactive physics & UI stage per step (`TutorialStepStage`).
 * - Responsive mobile layout (`max-h-[80vh] overflow-y-auto`) with keyboard navigation.
 * - Persists completion state to `localStorage` under key `'has_seen_tutorial'`.
 *
 * Time Complexity: O(1) per step transition and render.
 */
export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const language = useCircuitStore((state) => state.language);
  const isId = language === 'id';

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const totalSteps = TUTORIAL_STEPS.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const activeStep = getTutorialStep(currentStepIndex);

  // Reset to Step 1 whenever the modal is opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  const handleCompleteAndClose = useCallback(() => {
    markTutorialAsSeen();
    onClose();
  }, [onClose]);

  const handleNextStep = useCallback(() => {
    if (isLastStep) {
      handleCompleteAndClose();
    } else {
      setCurrentStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
    }
  }, [isLastStep, handleCompleteAndClose, totalSteps]);

  const handlePrevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  // Keyboard navigation (Left/Right arrows + Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCompleteAndClose();
      } else if (event.key === 'ArrowRight') {
        handleNextStep();
      } else if (event.key === 'ArrowLeft') {
        handlePrevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCompleteAndClose, handleNextStep, handlePrevStep]);

  if (!isOpen) return null;

  const moduleCode = isId ? activeStep.moduleCodeId : activeStep.moduleCodeEn;
  const stepTitle = isId ? activeStep.titleId : activeStep.titleEn;
  const stepDescription = isId ? activeStep.descriptionId : activeStep.descriptionEn;
  const labNoteTitle = isId ? activeStep.labNoteTitleId : activeStep.labNoteTitleEn;
  const labNoteBody = isId ? activeStep.labNoteBodyId : activeStep.labNoteBodyEn;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 select-none"
      onClick={handleCompleteAndClose}
    >
      <div
        className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl bg-void-900 border border-cyan-500/30 shadow-[0_0_50px_rgba(0,0,0,0.85),0_0_25px_rgba(34,211,238,0.12)] flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Blueprint Header Bar */}
        <div className="sticky top-0 z-20 px-4 py-3 border-b border-white/10 bg-void-900/95 backdrop-blur-md flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono font-bold tracking-wider text-cyan-400 uppercase truncate">
                {moduleCode}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {isId ? 'Panduan Praktikum IPA Kelas 9' : 'Interactive Physics Lab Guide'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2 py-0.5 rounded-md bg-void-950 border border-white/10 text-[10px] font-mono text-slate-300">
              {currentStepIndex + 1} / {totalSteps}
            </span>
            <button
              type="button"
              onClick={handleCompleteAndClose}
              aria-label={isId ? 'Tutup panduan' : 'Close tutorial'}
              className="w-8 h-8 rounded-lg bg-void-850 hover:bg-void-800 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Interactive Visual Blueprint Stage */}
          <TutorialStepStage stepId={activeStep.id} language={language} />

          {/* Step Headline & Formula Pill */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                id="tutorial-modal-title"
                className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug"
              >
                {stepTitle}
              </h2>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/30 text-[10px] font-mono font-semibold text-cyan-300">
                {activeStep.formulaBadge}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {stepDescription}
            </p>
          </div>

          {/* Educational Physics Insight Box (Catatan Praktikum) */}
          <div className="rounded-xl bg-void-950/90 border border-amber-400/25 p-3 flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-300 shrink-0 mt-0.5">
              <Lightbulb className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-amber-300 tracking-tight">
                {labNoteTitle}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                {labNoteBody}
              </p>
            </div>
          </div>
        </div>

        {/* Sticky Footer: Step Indicator Dots + Prev/Next Neon Cyan Controls */}
        <div className="sticky bottom-0 z-20 px-4 py-3 border-t border-white/10 bg-void-900/95 backdrop-blur-md flex items-center justify-between gap-3">
          {/* Step Indicator Dots */}
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Tutorial steps">
            {TUTORIAL_STEPS.map((step, index) => {
              const isCurrent = index === currentStepIndex;
              return (
                <button
                  key={step.id}
                  type="button"
                  role="tab"
                  aria-selected={isCurrent}
                  aria-label={`Step ${index + 1}`}
                  onClick={() => setCurrentStepIndex(index)}
                  className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                    isCurrent
                      ? 'w-6 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                      : 'w-2 bg-slate-600 hover:bg-slate-400'
                  }`}
                />
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-void-950 hover:bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{isId ? 'Sebelumnya' : 'Prev'}</span>
              </button>
            )}

            {isLastStep ? (
              <button
                type="button"
                onClick={handleCompleteAndClose}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-void-950 text-xs sm:text-sm font-bold shadow-[0_0_18px_rgba(34,211,238,0.5)] transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isId ? 'Mulai Eksperimen!' : 'Start Experimenting!'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-200 text-xs font-bold shadow-[0_0_14px_rgba(34,211,238,0.25)] transition-all active:scale-95 cursor-pointer"
              >
                <span>{isId ? 'Selanjutnya' : 'Next'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
