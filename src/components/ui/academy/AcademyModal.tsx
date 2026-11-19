import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Flame,
  Play,
  Trophy,
  ArrowLeft,
  Award,
  BookOpen,
  Cpu,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCircuitStore } from '../../../store/useCircuitStore';
import {
  ACADEMY_LEVELS,
  ACADEMY_LESSONS,
  getLessonsByLevel,
  getLessonById,
} from '../../../academy/academyCatalog';
import {
  loadAcademyProgress,
  completeAcademyLesson,
  ACADEMY_BADGES,
  LEVEL_XP_THRESHOLDS,
} from '../../../academy/academyPersistence';
import {
  AcademyDemoType,
  AcademyLesson,
  AcademyProgress,
} from '../../../types/academy';
import { OhmsLawInteractiveDemo } from './demos/OhmsLawInteractiveDemo';
import { VoltageDividerInteractiveDemo } from './demos/VoltageDividerInteractiveDemo';
import { JoulePowerInteractiveDemo } from './demos/JoulePowerInteractiveDemo';
import { KclJunctionInteractiveDemo } from './demos/KclJunctionInteractiveDemo';
import { LedPolarityInteractiveDemo } from './demos/LedPolarityInteractiveDemo';
import { ShortCircuitMcbInteractiveDemo } from './demos/ShortCircuitMcbInteractiveDemo';
import { SutetLossInteractiveDemo } from './demos/SutetLossInteractiveDemo';
import { MnaMatrixXrayDemo } from './demos/MnaMatrixXrayDemo';
import { useModalFocusTrap } from '../../../hooks/useModalKeyboardClose';
import { LabModalHeader } from '../common/LabModalHeader';
import { MascotCoachBubble, MascotMood } from '../common/MascotAvatar';

interface AcademyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type LessonStep = 'learn' | 'lab' | 'quiz';

/**
 * O(1) lookup table mapping lesson demo identifiers to interactive SVG micro-lab components.
 */
const DEMO_COMPONENT_MAP: Readonly<Record<AcademyDemoType, React.ComponentType>> = {
  ohms_law: OhmsLawInteractiveDemo,
  joule_power: JoulePowerInteractiveDemo,
  kcl_junction: KclJunctionInteractiveDemo,
  voltage_divider: VoltageDividerInteractiveDemo,
  led_polarity: LedPolarityInteractiveDemo,
  short_circuit_mcb: ShortCircuitMcbInteractiveDemo,
  sutet_loss: SutetLossInteractiveDemo,
  mna_matrix: MnaMatrixXrayDemo,
};

/**
 * Computes percentage progress toward the next level threshold.
 * Handles edge case when student hits max level (Level 6).
 *
 * Time Complexity: O(1).
 */
function computeLevelProgressBar(totalXp: number, currentLevel: number) {
  const safeLevelIdx = Math.max(0, Math.min(LEVEL_XP_THRESHOLDS.length - 1, currentLevel - 1));
  const currentFloorXp = LEVEL_XP_THRESHOLDS[safeLevelIdx] ?? 0;
  const nextThresholdXp =
    safeLevelIdx + 1 < LEVEL_XP_THRESHOLDS.length
      ? LEVEL_XP_THRESHOLDS[safeLevelIdx + 1]
      : null;

  if (nextThresholdXp === null) {
    return { percent: 100, label: 'MAX' };
  }

  const span = Math.max(1, nextThresholdXp - currentFloorXp);
  const gained = Math.max(0, totalXp - currentFloorXp);
  const percent = Math.min(100, Math.round((gained / span) * 100));
  return { percent, label: `${totalXp}/${nextThresholdXp} XP` };
}

/**
 * Returns mascot mood & coaching copy for the curriculum path banner.
 * Time Complexity: O(1).
 */
function getCurriculumMascotCoach(
  completedCount: number,
  totalLessons: number,
  totalXp: number,
  isId: boolean
): { mood: MascotMood; message: string } {
  if (completedCount === 0) {
    return {
      mood: 'proud',
      message: isId
        ? 'Hai! Aku Watt. Belajar listrik cukup 3 menit per modul, mainkan Lab SVG-nya & kumpulkan XP!'
        : 'Hi! I am Watt. Each micro-lesson takes 3 minutes: play the SVG lab & earn XP!',
    };
  }
  if (completedCount >= totalLessons) {
    return {
      mood: 'dance',
      message: isId
        ? `Juara! Semua ${totalLessons} modul tamat (${totalXp} XP). Cek tab Lencana!`
        : `Champion! All ${totalLessons} modules cleared (${totalXp} XP). Check your Badges!`,
    };
  }
  return {
    mood: 'celebrate',
    message: isId
      ? `Mantap! ${completedCount}/${totalLessons} modul selesai (${totalXp} XP). Lanjut ke materi berikutnya!`
      : `Awesome! ${completedCount}/${totalLessons} done (${totalXp} XP). Pick your next lesson!`,
  };
}

/**
 * AcademyModal renders a micro-lesson curriculum with the Watt CFL mascot,
 * slim sticky XP bar, 3-step micro-lesson flow, and 8 interactive SVG micro-labs.
 *
 * Time Complexity: O(L) where L = number of catalog lessons (14 constants), O(1) lookups via Set.
 */
export const AcademyModal: React.FC<AcademyModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalFocusTrap(isOpen, dialogRef, onClose);
  const language = useCircuitStore((state) => state.language);
  const loadPreset = useCircuitStore((state) => state.loadPreset);
  const notify = useCircuitStore((state) => state.notify);
  const isId = language === 'id';

  const [progress, setProgress] = useState<AcademyProgress>(() => loadAcademyProgress());
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    ACADEMY_LESSONS[0]?.id ?? 'l1_ohms_law'
  );
  const [viewMode, setViewMode] = useState<'curriculum' | 'badges'>('curriculum');
  const [mobileScreen, setMobileScreen] = useState<'list' | 'detail'>('list');
  const [lessonStep, setLessonStep] = useState<LessonStep>('learn');
  const [showFormulaDrawer, setShowFormulaDrawer] = useState<boolean>(false);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fresh = loadAcademyProgress();
      setProgress(fresh);
      setViewMode('curriculum');
      setMobileScreen('list');
      setLessonStep('learn');
    }
  }, [isOpen]);

  const completedSet = useMemo(
    () => new Set(progress.completedLessonIds),
    [progress.completedLessonIds]
  );

  const activeLesson: AcademyLesson = useMemo(() => {
    return getLessonById(selectedLessonId) || ACADEMY_LESSONS[0];
  }, [selectedLessonId]);

  const nextLesson = useMemo(() => {
    const idx = ACADEMY_LESSONS.findIndex((l) => l.id === activeLesson.id);
    if (idx < 0 || idx + 1 >= ACADEMY_LESSONS.length) return undefined;
    return ACADEMY_LESSONS[idx + 1];
  }, [activeLesson.id]);

  const levelLessons = useMemo(() => getLessonsByLevel(selectedLevel), [selectedLevel]);
  const activeLevelInfo = useMemo(
    () => ACADEMY_LEVELS.find((lvl) => lvl.level === selectedLevel) ?? ACADEMY_LEVELS[0],
    [selectedLevel]
  );
  const xpProgress = useMemo(
    () => computeLevelProgressBar(progress.totalXp, progress.currentLevel),
    [progress.totalXp, progress.currentLevel]
  );

  const selectLesson = (lesson: AcademyLesson) => {
    setSelectedLessonId(lesson.id);
    setSelectedLevel(lesson.level);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setLessonStep('learn');
    setShowFormulaDrawer(false);
    setMobileScreen('detail');
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmitQuiz = () => {
    const questions = activeLesson.quiz;
    let correctCount = 0;

    for (const q of questions) {
      const pickedId = selectedAnswers[q.id];
      const chosenOption = q.options.find((opt) => opt.id === pickedId);
      if (chosenOption?.isCorrect) {
        correctCount++;
      }
    }

    setQuizScore({ correct: correctCount, total: questions.length });
    setQuizSubmitted(true);

    if (correctCount === questions.length && questions.length > 0) {
      const alreadyCompleted = completedSet.has(activeLesson.id);
      const updated = completeAcademyLesson(activeLesson.id, activeLesson.xpReward);
      setProgress(updated);

      try {
        confetti({
          particleCount: 65,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#10b981', '#e2e8f0'],
        });
      } catch {
        // Ignore confetti errors in headless/test environments
      }

      notify(
        alreadyCompleted
          ? isId
            ? `Sempurna! Skor 100% di "${activeLesson.titleId}".`
            : `Perfect! 100% score on "${activeLesson.titleEn}".`
          : isId
          ? `Lulus! +${activeLesson.xpReward} XP diperoleh!`
          : `Passed! +${activeLesson.xpReward} XP earned!`
      );
    }
  };

  const handleRetryQuiz = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  const handleTryInLab = () => {
    if (!activeLesson.starterPresetId) return;
    loadPreset(activeLesson.starterPresetId as Parameters<typeof loadPreset>[0]);
    notify(
      isId
        ? `Rangkaian "${activeLesson.titleId}" dimuat ke kanvas utama!`
        : `"${activeLesson.titleEn}" blueprint loaded onto canvas!`
    );
    onClose();
  };

  if (!isOpen) return null;

  const isAllQuizAnswered = activeLesson.quiz.every((q) => Boolean(selectedAnswers[q.id]));
  const isQuizPassed =
    quizSubmitted && quizScore !== null && quizScore.correct === quizScore.total;

  const pathCoach = getCurriculumMascotCoach(
    progress.completedLessonIds.length,
    ACADEMY_LESSONS.length,
    progress.totalXp,
    isId
  );

  // Determine reactive Watt mood & message for the active lesson detail header
  const getDetailMascot = (): { mood: MascotMood; message: string } => {
    if (lessonStep === 'quiz') {
      if (quizSubmitted && isQuizPassed) {
        return {
          mood: 'celebrate',
          message: isId
            ? `Hebat! Semua jawaban benar. +${activeLesson.xpReward} XP diklaim!`
            : `Brilliant! All answers correct. +${activeLesson.xpReward} XP claimed!`,
        };
      }
      if (quizSubmitted && !isQuizPassed) {
        return {
          mood: 'confused',
          message: isId
            ? 'Ups, ada yang meleset sedikit! Baca petunjuk di bawah atau coba ulang kuisnya.'
            : 'Almost! Check the quick tip below and give the quiz another try.',
        };
      }
      return {
        mood: 'proud',
        message: isId
          ? `Siap uji pemahaman? Jawab ${activeLesson.quiz.length} soal cepat & klaim +${activeLesson.xpReward} XP!`
          : `Ready to test yourself? Ace ${activeLesson.quiz.length} quick questions for +${activeLesson.xpReward} XP!`,
      };
    }

    if (lessonStep === 'lab') {
      return {
        mood: 'dance',
        message: isId
          ? 'Geser tuas atau ketuk komponen di SVG di bawah untuk melihat fisikanya secara langsung!'
          : 'Slide controls or tap SVG parts below to feel the physics live!',
      };
    }

    return {
      mood: 'proud',
      message:
        (isId ? activeLesson.analogyId : activeLesson.analogyEn) ??
        (isId ? activeLesson.summaryId : activeLesson.summaryEn),
    };
  };

  const detailCoach = getDetailMascot();
  const ActiveDemoComponent = activeLesson.interactiveDemoType
    ? DEMO_COMPONENT_MAP[activeLesson.interactiveDemoType]
    : null;

  const switcherSlot = (
    <div className="flex items-center bg-void-950 p-1 rounded-xl border border-control">
      <button
        type="button"
        aria-pressed={viewMode === 'curriculum'}
        onClick={() => setViewMode('curriculum')}
        className={`min-h-[44px] sm:min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer active:scale-95 ${
          viewMode === 'curriculum'
            ? 'bg-electric-600 hover:bg-electric-700 text-white font-bold'
            : 'text-slate-300 hover:text-ink'
        }`}
      >
        {isId ? 'Materi' : 'Learn'}
      </button>
      <button
        type="button"
        aria-pressed={viewMode === 'badges'}
        onClick={() => setViewMode('badges')}
        className={`min-h-[44px] sm:min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer active:scale-95 flex items-center gap-1.5 tabular-nums ${
          viewMode === 'badges'
            ? 'bg-electric-600 hover:bg-electric-700 text-white font-bold'
            : 'text-slate-300 hover:text-ink'
        }`}
      >
        <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
        <span>
          {isId ? 'Lencana' : 'Badges'} ({progress.unlockedBadgeIds.length})
        </span>
      </button>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/75 p-0 sm:p-4 overflow-y-auto min-h-[100dvh] font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="academy-modal-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl h-[100dvh] sm:h-[92dvh] max-h-[860px] flex flex-col rounded-none sm:rounded-2xl bg-void-900 border-0 sm:border sm:border-control shadow-2xl overflow-hidden text-ink"
      >
        <LabModalHeader
          titleId="academy-modal-title"
          eyebrow={isId ? 'MODUL PEMBELAJARAN · FISIKA LISTRIK' : 'CURRICULUM · CIRCUIT PHYSICS'}
          title={isId ? 'Akademi Kelistrikan' : 'Circuit Academy'}
          rightSlot={switcherSlot}
          onClose={onClose}
          closeLabel={isId ? 'Tutup Akademi' : 'Close Academy'}
        />

        {/* Slim sticky XP progress strip */}
        <div className="px-4 py-2 bg-void-950 border-b border-ink/15 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 tabular-nums">
          <div className="flex items-center gap-2.5 flex-1 min-w-[180px]">
            <span className="px-2 py-0.5 rounded-lg bg-electric-500/20 border border-electric-500/45 text-electric-300 font-mono font-bold text-[11px] shrink-0">
              Lv.{progress.currentLevel}
            </span>
            <div className="flex-1 max-w-[180px] h-2 rounded-full bg-void-900 border border-control overflow-hidden">
              <div
                className="h-full bg-electric-600 transition-all duration-300"
                style={{ width: `${xpProgress.percent}%` }}
              />
            </div>
            <span className="font-mono text-[11px] font-semibold text-slate-300 shrink-0">
              {xpProgress.label}
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              {progress.streakDays}d
            </span>
            <span className="text-slate-400" aria-hidden="true">|</span>
            <span className="text-emerald-300 font-semibold">
              {progress.completedLessonIds.length}/{ACADEMY_LESSONS.length}{' '}
              {isId ? 'Modul' : 'Done'}
            </span>
          </div>
        </div>

        {/* Main Content */}
        {viewMode === 'curriculum' ? (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* Left pane: level stepper & curriculum nodes */}
            <div
              className={`${
                mobileScreen === 'detail' ? 'hidden md:flex' : 'flex'
              } w-full md:w-[340px] lg:w-[370px] border-b md:border-b-0 md:border-r border-ink/15 bg-void-900 flex-col min-h-0 shrink-0`}
            >
              <div className="p-3.5 border-b border-ink/15 space-y-3 shrink-0">
                <MascotCoachBubble
                  mood={pathCoach.mood}
                  eyebrow="Coach Watt"
                  message={pathCoach.message}
                  accent={progress.completedLessonIds.length > 0 ? 'emerald' : 'electric'}
                  size="sm"
                />

                {/* 6-Level Selector Pills */}
                <div className="grid grid-cols-6 gap-1.5 tabular-nums">
                  {ACADEMY_LEVELS.map((lvl) => {
                    const isSelected = selectedLevel === lvl.level;
                    const lessonsInLvl = getLessonsByLevel(lvl.level);
                    const doneInLvl = lessonsInLvl.filter((l) => completedSet.has(l.id)).length;
                    const isLvlDone = doneInLvl === lessonsInLvl.length && lessonsInLvl.length > 0;

                    return (
                      <button
                        key={lvl.level}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          setSelectedLevel(lvl.level);
                          if (lessonsInLvl[0]) setSelectedLessonId(lessonsInLvl[0].id);
                        }}
                        className={`min-h-[44px] py-1.5 rounded-xl font-mono text-xs font-bold border flex flex-col items-center justify-center transition-colors cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'bg-electric-600 hover:bg-electric-700 text-white border-electric-500'
                            : isLvlDone
                            ? 'bg-emerald-500/15 border-emerald-500/45 text-emerald-300'
                            : 'bg-void-950 border-control text-slate-300 hover:text-ink hover:border-electric-500/50'
                        }`}
                      >
                        <span>{lvl.level}</span>
                        <span className="text-[10px] font-normal tabular-nums">
                          {doneInLvl}/{lessonsInLvl.length}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-2 px-1">
                  <div className="text-xs font-bold text-ink truncate">
                    {isId ? activeLevelInfo.titleId : activeLevelInfo.titleEn}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {isId ? activeLevelInfo.subtitleId : activeLevelInfo.subtitleEn}
                  </div>
                </div>
              </div>

              {/* Micro-Lesson Cards */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 overscroll-contain">
                {levelLessons.map((lesson, idx) => {
                  const isDone = completedSet.has(lesson.id);
                  const isSelected = lesson.id === activeLesson.id;

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => selectLesson(lesson)}
                      className={`w-full min-h-[44px] text-left p-3.5 rounded-xl border transition-colors cursor-pointer active:scale-[0.98] flex items-center gap-3 ${
                        isSelected
                          ? 'bg-electric-500/15 border-electric-500'
                          : isDone
                          ? 'bg-void-950 border-emerald-500/40 hover:border-emerald-500/60'
                          : 'bg-void-950 border-control hover:border-electric-500/50'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 border tabular-nums ${
                          isDone
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : isSelected
                            ? 'bg-electric-600 text-white border-electric-500'
                            : 'bg-void-900 border-control text-slate-300'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> : idx + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-0.5 tabular-nums">
                          <span className="text-[11px] font-mono text-slate-400">
                            {lesson.estimatedMinutes} {isId ? 'mnt' : 'min'} · +{lesson.xpReward} XP
                          </span>
                          {isDone ? (
                            <span className="text-[10px] font-mono font-bold text-emerald-400">
                              {isId ? 'SELESAI' : 'DONE'}
                            </span>
                          ) : isSelected ? (
                            <span className="text-[10px] font-mono font-bold text-electric-400">
                              {isId ? 'AKTIF' : 'ACTIVE'}
                            </span>
                          ) : null}
                        </div>
                        <div className="font-bold text-sm text-ink leading-snug">
                          {isId ? lesson.titleId : lesson.titleEn}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {isId ? lesson.summaryId : lesson.summaryEn}
                        </p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right pane: 3-step interactive micro-lesson */}
            <div
              className={`${
                mobileScreen === 'list' ? 'hidden md:flex' : 'flex'
              } flex-1 flex-col min-h-0 bg-void-950 overflow-y-auto overscroll-contain`}
            >
              <div className="p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-4">
                {/* Back button (Mobile) & Compact Lesson Heading */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileScreen('list')}
                    className="md:hidden min-h-[44px] px-3 py-1.5 rounded-xl bg-void-900 border border-control text-ink text-xs font-semibold flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    <span>{isId ? 'Peta' : 'Path'}</span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 tabular-nums">
                      <span className="text-electric-400 font-bold">
                        Level {activeLesson.level}
                      </span>
                      <span>·</span>
                      <span>+{activeLesson.xpReward} XP</span>
                      {completedSet.has(activeLesson.id) && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-400 font-bold">
                            {isId ? 'Tuntas' : 'Completed'}
                          </span>
                        </>
                      )}
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight truncate">
                      {isId ? activeLesson.titleId : activeLesson.titleEn}
                    </h2>
                  </div>
                </div>

                {/* Reactive Watt Mascot Bubble */}
                <MascotCoachBubble
                  mood={detailCoach.mood}
                  eyebrow="Watt"
                  message={detailCoach.message}
                  accent={
                    quizSubmitted && isQuizPassed
                      ? 'emerald'
                      : quizSubmitted && !isQuizPassed
                      ? 'amber'
                      : 'electric'
                  }
                  size="sm"
                />

                {/* 3-Tab Micro-Step Bar */}
                <div
                  role="tablist"
                  aria-label={isId ? 'Tahapan modul belajar' : 'Lesson steps'}
                  className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-void-900 border border-control"
                >
                  {(
                    [
                      ['learn', isId ? '1. Intisari' : '1. Basics', BookOpen],
                      ['lab', isId ? '2. Lab Mini' : '2. SVG Lab', Cpu],
                      ['quiz', isId ? '3. Kuis XP' : '3. Quiz', HelpCircle],
                    ] as const
                  ).map(([stepId, label, Icon]) => {
                    const isActive = lessonStep === stepId;
                    return (
                      <button
                        key={stepId}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setLessonStep(stepId)}
                        className={`min-h-[44px] px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95 ${
                          isActive
                            ? 'bg-electric-600 text-white font-bold'
                            : 'text-slate-300 hover:text-ink'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Step 1: bite-sized theory */}
                {lessonStep === 'learn' && (
                  <div className="space-y-3.5">
                    <div className="space-y-2.5">
                      {(isId ? activeLesson.theoryContentId : activeLesson.theoryContentEn).map(
                        (point, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-void-900 border border-ink/15 flex items-start gap-3"
                          >
                            <span className="w-6 h-6 rounded-full bg-electric-500/20 text-electric-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                              {idx + 1}
                            </span>
                            <p className="text-sm text-ink leading-relaxed">{point}</p>
                          </div>
                        )
                      )}
                    </div>

                    {/* Collapsible formulas and learning goals */}
                    <div className="rounded-xl bg-void-900 border border-control overflow-hidden">
                      <button
                        type="button"
                        aria-expanded={showFormulaDrawer}
                        onClick={() => setShowFormulaDrawer((v) => !v)}
                        className="w-full min-h-[44px] px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-200 hover:text-ink cursor-pointer"
                      >
                        <span>
                          {isId ? 'Lihat Rumus & Target Belajar' : 'Show Formulas & Goals'}
                        </span>
                        {showFormulaDrawer ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        )}
                      </button>

                      {showFormulaDrawer && (
                        <div className="px-3.5 pb-3.5 pt-2 border-t border-ink/15 space-y-3">
                          {activeLesson.equations.map((eq, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-lg bg-void-950 border border-electric-500/35 space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-semibold text-electric-300">
                                  {isId ? eq.nameId : eq.nameEn}
                                </span>
                                <span className="font-mono font-bold text-xs text-ink">
                                  {eq.formula}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400">
                                {isId ? eq.explanationId : eq.explanationEn}
                              </p>
                            </div>
                          ))}

                          <ul className="space-y-1.5">
                            {(isId
                              ? activeLesson.learningObjectivesId
                              : activeLesson.learningObjectivesEn
                            ).map((obj, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-xs text-slate-200"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                                <span>{obj}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setLessonStep('lab')}
                      className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer"
                    >
                      <span>{isId ? 'Lanjut: Uji di Lab Mini SVG' : 'Next: Play SVG Micro-Lab'}</span>
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                )}

                {/* Step 2: interactive SVG micro-lab and main canvas action */}
                {lessonStep === 'lab' && (
                  <div className="space-y-3.5">
                    {ActiveDemoComponent && <ActiveDemoComponent />}

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      {activeLesson.starterPresetId && (
                        <button
                          type="button"
                          onClick={handleTryInLab}
                          className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-void-900 hover:bg-void-850 border border-control hover:border-electric-500/50 text-ink font-semibold text-xs flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 text-electric-400 fill-current" aria-hidden="true" />
                          <span>{isId ? 'Muat di Kanvas Lab Utama' : 'Open in Main Lab Canvas'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setLessonStep('quiz')}
                        className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-electric-600 hover:bg-electric-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer tabular-nums"
                      >
                        <span>
                          {isId
                            ? `Siap! Mulai Kuis (+${activeLesson.xpReward} XP)`
                            : `Ready! Take Quiz (+${activeLesson.xpReward} XP)`}
                        </span>
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: quick quiz */}
                {lessonStep === 'quiz' && (
                  <div className="space-y-4">
                    {activeLesson.quiz.map((question, qIdx) => {
                      const pickedOptionId = selectedAnswers[question.id];
                      return (
                        <div
                          key={question.id}
                          className="p-4 rounded-xl bg-void-900 border border-control space-y-3"
                        >
                          <div className="font-bold text-sm text-ink leading-snug">
                            {qIdx + 1}. {isId ? question.questionId : question.questionEn}
                          </div>

                          <div className="space-y-2">
                            {question.options.map((opt) => {
                              const isPicked = pickedOptionId === opt.id;
                              let style =
                                'bg-void-950 border-control text-slate-200 hover:border-electric-500/50';

                              if (quizSubmitted) {
                                if (opt.isCorrect) {
                                  style =
                                    'bg-emerald-500/15 border-emerald-500/60 text-emerald-200 font-semibold';
                                } else if (isPicked && !opt.isCorrect) {
                                  style =
                                    'bg-danger-500/15 border-danger-500/60 text-danger-300';
                                }
                              } else if (isPicked) {
                                style =
                                  'bg-electric-500/15 border-electric-500 text-electric-200 font-semibold';
                              }

                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  aria-pressed={isPicked}
                                  onClick={() => handleSelectOption(question.id, opt.id)}
                                  className={`w-full min-h-[44px] text-left px-3.5 py-2.5 rounded-xl border text-xs transition-colors cursor-pointer active:scale-[0.99] flex items-center justify-between gap-2 ${style}`}
                                >
                                  <span>{isId ? opt.textId : opt.textEn}</span>
                                  {quizSubmitted && opt.isCorrect && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {quizSubmitted && (
                            <div className="p-2.5 rounded-lg bg-void-950 border border-ink/15 text-xs text-slate-200 leading-relaxed">
                              <span className="font-bold text-electric-300">
                                {isId ? 'Kata Watt: ' : 'Watt Tip: '}
                              </span>
                              {isId ? question.explanationId : question.explanationEn}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Quiz Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                      {!quizSubmitted ? (
                        <button
                          type="button"
                          disabled={!isAllQuizAnswered}
                          onClick={handleSubmitQuiz}
                          className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-700 disabled:bg-void-850 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2 tabular-nums"
                        >
                          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                          <span>
                            {isId
                              ? `Periksa & Klaim +${activeLesson.xpReward} XP`
                              : `Check & Claim +${activeLesson.xpReward} XP`}
                          </span>
                        </button>
                      ) : isQuizPassed ? (
                        <>
                          <div className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/45 text-emerald-200 font-bold text-xs flex items-center gap-2 tabular-nums">
                            <Award className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                            <span>
                              {isId
                                ? `Skor ${quizScore?.correct}/${quizScore?.total} Sempurna!`
                                : `${quizScore?.correct}/${quizScore?.total} Perfect!`}
                            </span>
                          </div>
                          {nextLesson && (
                            <button
                              type="button"
                              onClick={() => selectLesson(nextLesson)}
                              className="min-h-[44px] px-4 py-2 rounded-xl bg-electric-600 hover:bg-electric-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
                            >
                              <span>{isId ? 'Modul Berikutnya' : 'Next Lesson'}</span>
                              <ChevronRight className="w-4 h-4" aria-hidden="true" />
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRetryQuiz}
                          className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#B45309] hover:bg-[#92400E] text-white font-bold text-xs transition-colors active:scale-95 cursor-pointer"
                        >
                          {isId ? 'Ulangi Kuis Sekarang' : 'Retry Quiz'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Badges tab */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-void-950 overscroll-contain">
            <div className="max-w-4xl mx-auto space-y-5">
              <MascotCoachBubble
                mood={progress.unlockedBadgeIds.length > 0 ? 'love' : 'bored'}
                eyebrow={isId ? 'Koleksi Lencana' : 'Badge Showcase'}
                message={
                  progress.unlockedBadgeIds.length > 0
                    ? isId
                      ? `Hebat! Kamu sudah mengoleksi ${progress.unlockedBadgeIds.length}/${ACADEMY_BADGES.length} lencana resmi Akademi.`
                      : `Nice! You have unlocked ${progress.unlockedBadgeIds.length}/${ACADEMY_BADGES.length} official Academy badges.`
                    : isId
                    ? 'Belum ada lencana terbuka. Selesaikan modul pertamamu untuk membuka lencana pertama!'
                    : 'No badges yet. Complete your first lesson to unlock your first badge!'
                }
                accent={progress.unlockedBadgeIds.length > 0 ? 'emerald' : 'amber'}
                size="sm"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {ACADEMY_BADGES.map((badge) => {
                  const isUnlocked = progress.unlockedBadgeIds.includes(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-xl border transition-colors flex flex-col justify-between gap-3 ${
                        isUnlocked
                          ? 'bg-void-900 border-emerald-500/45'
                          : 'bg-void-900 border-control'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                            isUnlocked
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                              : 'bg-void-950 border-control text-slate-400'
                          }`}
                        >
                          <Award className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                            isUnlocked
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-void-950 border-control text-slate-400'
                          }`}
                        >
                          {isUnlocked
                            ? isId ? 'TERBUKA' : 'UNLOCKED'
                            : isId ? 'TERKUNCI' : 'LOCKED'}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-ink">
                          {isId ? badge.titleId : badge.titleEn}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {isId ? badge.descriptionId : badge.descriptionEn}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
