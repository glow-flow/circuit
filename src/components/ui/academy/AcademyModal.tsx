import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Flame,
  Play,
  Sparkles,
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
import { useModalKeyboardClose } from '../../../hooks/useModalKeyboardClose';
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
        : 'Hi! I am Watt. Each micro-lesson takes 3 minutes—play the SVG lab & earn XP!',
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
      : `Awesome! ${completedCount}/${totalLessons} done (${totalXp} XP). Pick your next spark!`,
  };
}

/**
 * AcademyModal renders a Duolingo-inspired gamified curriculum with the Watt CFL mascot,
 * slim sticky XP bar, 3-step micro-lesson flow, and 8 interactive SVG micro-labs.
 *
 * Time Complexity: O(L) where L = number of catalog lessons (14 constants), O(1) lookups via Set.
 */
export const AcademyModal: React.FC<AcademyModalProps> = ({ isOpen, onClose }) => {
  useModalKeyboardClose(isOpen, onClose);
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
    <div className="flex items-center bg-void-950 p-1 rounded-xl border border-white/10">
      <button
        type="button"
        onClick={() => setViewMode('curriculum')}
        className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
          viewMode === 'curriculum'
            ? 'bg-electric-500 text-void-950 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        {isId ? 'Materi' : 'Learn'}
      </button>
      <button
        type="button"
        onClick={() => setViewMode('badges')}
        className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ${
          viewMode === 'badges'
            ? 'bg-electric-500 text-void-950 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Trophy className="w-3.5 h-3.5" />
        <span>
          {isId ? 'Lencana' : 'Badges'} ({progress.unlockedBadgeIds.length})
        </span>
      </button>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="academy-modal-title"
    >
      <div className="relative w-full max-w-6xl h-[92dvh] max-h-[860px] flex flex-col rounded-2xl bg-void-900 border border-white/15 shadow-2xl overflow-hidden text-slate-200">
        <LabModalHeader
          titleId="academy-modal-title"
          title={isId ? 'Akademi Kelistrikan' : 'Circuit Academy'}
          rightSlot={switcherSlot}
          onClose={onClose}
          closeLabel={isId ? 'Tutup Akademi' : 'Close Academy'}
        />

        {/* Slim Sticky Progress Strip (Replaces old bulky 4-card telemetry wall) */}
        <div className="px-4 py-2 bg-void-950 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2.5 flex-1 min-w-[180px]">
            <span className="px-2 py-0.5 rounded-lg bg-electric-500/20 border border-electric-500/40 text-electric-300 font-mono font-bold text-[11px] shrink-0">
              Lv.{progress.currentLevel}
            </span>
            <div className="flex-1 max-w-[180px] h-2 rounded-full bg-void-900 border border-white/10 overflow-hidden">
              <div
                className="h-full bg-electric-500 transition-all duration-300"
                style={{ width: `${xpProgress.percent}%` }}
              />
            </div>
            <span className="font-mono text-[11px] font-semibold text-slate-300 shrink-0">
              {xpProgress.label}
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              {progress.streakDays}d
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-300 font-semibold">
              {progress.completedLessonIds.length}/{ACADEMY_LESSONS.length}{' '}
              {isId ? 'Modul' : 'Done'}
            </span>
          </div>
        </div>

        {/* Main Content */}
        {viewMode === 'curriculum' ? (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* LEFT PANE: Level Stepper & Curriculum Nodes */}
            <div
              className={`${
                mobileScreen === 'detail' ? 'hidden md:flex' : 'flex'
              } w-full md:w-[340px] lg:w-[370px] border-r border-white/10 bg-void-900 flex-col min-h-0 shrink-0`}
            >
              <div className="p-3.5 border-b border-white/10 space-y-3 shrink-0">
                <MascotCoachBubble
                  mood={pathCoach.mood}
                  eyebrow={isId ? 'Coach Watt' : 'Coach Watt'}
                  message={pathCoach.message}
                  accent={progress.completedLessonIds.length > 0 ? 'emerald' : 'electric'}
                  size="sm"
                />

                {/* 6-Level Selector Pills */}
                <div className="grid grid-cols-6 gap-1.5">
                  {ACADEMY_LEVELS.map((lvl) => {
                    const isSelected = selectedLevel === lvl.level;
                    const lessonsInLvl = getLessonsByLevel(lvl.level);
                    const doneInLvl = lessonsInLvl.filter((l) => completedSet.has(l.id)).length;
                    const isLvlDone = doneInLvl === lessonsInLvl.length && lessonsInLvl.length > 0;

                    return (
                      <button
                        key={lvl.level}
                        type="button"
                        onClick={() => {
                          setSelectedLevel(lvl.level);
                          if (lessonsInLvl[0]) setSelectedLessonId(lessonsInLvl[0].id);
                        }}
                        className={`min-h-[44px] py-1.5 rounded-xl font-mono text-xs font-bold border flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'bg-electric-500 text-void-950 border-electric-400'
                            : isLvlDone
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                            : 'bg-void-950 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>{lvl.level}</span>
                        <span className="text-[9px] font-normal opacity-80">
                          {doneInLvl}/{lessonsInLvl.length}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-2 px-1">
                  <div className="text-xs font-bold text-slate-100 truncate">
                    {isId ? activeLevelInfo.titleId : activeLevelInfo.titleEn}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {isId ? activeLevelInfo.subtitleId : activeLevelInfo.subtitleEn}
                  </div>
                </div>
              </div>

              {/* Micro-Lesson Cards */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
                {levelLessons.map((lesson, idx) => {
                  const isDone = completedSet.has(lesson.id);
                  const isSelected = lesson.id === activeLesson.id;

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => selectLesson(lesson)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer active:scale-[0.98] flex items-center gap-3 ${
                        isSelected
                          ? 'bg-electric-500/15 border-electric-500/50'
                          : isDone
                          ? 'bg-void-950 border-emerald-500/30 hover:border-emerald-500/50'
                          : 'bg-void-950 border-white/10 hover:border-white/25'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 border ${
                          isDone
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : isSelected
                            ? 'bg-electric-500 text-void-950 border-electric-400'
                            : 'bg-void-900 border-white/15 text-slate-300'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
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
                        <div className="font-bold text-sm text-slate-100 leading-snug">
                          {isId ? lesson.titleId : lesson.titleEn}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {isId ? lesson.summaryId : lesson.summaryEn}
                        </p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT PANE: 3-Step Interactive Micro-Lesson */}
            <div
              className={`${
                mobileScreen === 'list' ? 'hidden md:flex' : 'flex'
              } flex-1 flex-col min-h-0 bg-void-950 overflow-y-auto`}
            >
              <div className="p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-4">
                {/* Back button (Mobile) & Compact Lesson Heading */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileScreen('list')}
                    className="md:hidden min-h-[44px] px-3 py-1.5 rounded-xl bg-void-900 border border-white/15 text-slate-200 text-xs font-semibold flex items-center gap-1.5 active:scale-95"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{isId ? 'Peta' : 'Path'}</span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
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
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
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
                <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-void-900 border border-white/10">
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
                        onClick={() => setLessonStep(stepId)}
                        className={`min-h-[42px] px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                          isActive
                            ? 'bg-electric-500 text-void-950 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* STEP 1: BITE-SIZED THEORY */}
                {lessonStep === 'learn' && (
                  <div className="space-y-3.5">
                    <div className="space-y-2.5">
                      {(isId ? activeLesson.theoryContentId : activeLesson.theoryContentEn).map(
                        (point, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-void-900 border border-white/10 flex items-start gap-3"
                          >
                            <span className="w-6 h-6 rounded-full bg-electric-500/20 text-electric-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <p className="text-sm text-slate-200 leading-relaxed">{point}</p>
                          </div>
                        )
                      )}
                    </div>

                    {/* Collapsible Formulas & Objectives (Keeps default UI clean) */}
                    <div className="rounded-xl bg-void-900 border border-white/10 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowFormulaDrawer((v) => !v)}
                        className="w-full min-h-[44px] px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                      >
                        <span>
                          {isId ? 'Lihat Rumus & Target Belajar' : 'Show Formulas & Goals'}
                        </span>
                        {showFormulaDrawer ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      {showFormulaDrawer && (
                        <div className="px-3.5 pb-3.5 pt-1 border-t border-white/10 space-y-3">
                          {activeLesson.equations.map((eq, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-lg bg-void-950 border border-electric-500/25 space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-semibold text-electric-300">
                                  {isId ? eq.nameId : eq.nameEn}
                                </span>
                                <span className="font-mono font-bold text-xs text-white">
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
                                className="flex items-start gap-2 text-xs text-slate-300"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
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
                      className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-electric-500 hover:bg-electric-400 text-void-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                    >
                      <span>{isId ? 'Lanjut: Uji di Lab Mini SVG' : 'Next: Play SVG Micro-Lab'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* STEP 2: INTERACTIVE SVG MICRO-LAB + MAIN CANVAS JUMP */}
                {lessonStep === 'lab' && (
                  <div className="space-y-3.5">
                    {ActiveDemoComponent && <ActiveDemoComponent />}

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      {activeLesson.starterPresetId && (
                        <button
                          type="button"
                          onClick={handleTryInLab}
                          className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-void-900 hover:bg-void-850 border border-white/15 text-slate-100 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 text-electric-400 fill-current" />
                          <span>{isId ? 'Muat di Kanvas Lab Utama' : 'Open in Main Lab Canvas'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setLessonStep('quiz')}
                        className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-electric-500 hover:bg-electric-400 text-void-950 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                      >
                        <span>
                          {isId
                            ? `Siap! Mulai Kuis (+${activeLesson.xpReward} XP)`
                            : `Ready! Take Quiz (+${activeLesson.xpReward} XP)`}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: QUICK GAMIFIED QUIZ */}
                {lessonStep === 'quiz' && (
                  <div className="space-y-4">
                    {activeLesson.quiz.map((question, qIdx) => {
                      const pickedOptionId = selectedAnswers[question.id];
                      return (
                        <div
                          key={question.id}
                          className="p-4 rounded-xl bg-void-900 border border-white/10 space-y-3"
                        >
                          <div className="font-bold text-sm text-slate-100 leading-snug">
                            {qIdx + 1}. {isId ? question.questionId : question.questionEn}
                          </div>

                          <div className="space-y-2">
                            {question.options.map((opt) => {
                              const isPicked = pickedOptionId === opt.id;
                              let style =
                                'bg-void-950 border-white/10 text-slate-300 hover:border-white/25';

                              if (quizSubmitted) {
                                if (opt.isCorrect) {
                                  style =
                                    'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-semibold';
                                } else if (isPicked && !opt.isCorrect) {
                                  style =
                                    'bg-rose-500/20 border-rose-500/60 text-rose-200';
                                }
                              } else if (isPicked) {
                                style =
                                  'bg-electric-500/20 border-electric-500 text-electric-200 font-semibold';
                              }

                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => handleSelectOption(question.id, opt.id)}
                                  className={`w-full min-h-[44px] text-left px-3.5 py-2.5 rounded-xl border text-xs transition-all cursor-pointer active:scale-[0.99] flex items-center justify-between gap-2 ${style}`}
                                >
                                  <span>{isId ? opt.textId : opt.textEn}</span>
                                  {quizSubmitted && opt.isCorrect && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {quizSubmitted && (
                            <div className="p-2.5 rounded-lg bg-void-950 border border-white/10 text-xs text-slate-300 leading-relaxed">
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
                          className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-electric-500 hover:bg-electric-400 disabled:bg-void-850 disabled:text-slate-500 text-void-950 font-bold text-xs sm:text-sm transition-all cursor-pointer disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>
                            {isId
                              ? `Periksa & Klaim +${activeLesson.xpReward} XP`
                              : `Check & Claim +${activeLesson.xpReward} XP`}
                          </span>
                        </button>
                      ) : isQuizPassed ? (
                        <>
                          <div className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 font-bold text-xs flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
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
                              className="min-h-[44px] px-4 py-2 rounded-xl bg-electric-500 hover:bg-electric-400 text-void-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                            >
                              <span>{isId ? 'Modul Berikutnya' : 'Next Lesson'}</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRetryQuiz}
                          className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 font-bold text-xs transition-all active:scale-95 cursor-pointer"
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
          /* BADGES TAB */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-void-950">
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
                    ? 'Belum ada lencana nih. Yuk selesaikan modul pertamamu agar dapat First Spark!'
                    : 'No badges yet. Complete your first lesson to unlock First Spark!'
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
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                        isUnlocked
                          ? 'bg-void-900 border-emerald-500/40'
                          : 'bg-void-900/50 border-white/10 opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                            isUnlocked
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                              : 'bg-void-950 border-white/10 text-slate-500'
                          }`}
                        >
                          <Award className="w-5 h-5" />
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            isUnlocked
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-void-950 text-slate-500'
                          }`}
                        >
                          {isUnlocked
                            ? isId ? 'TERBUKA' : 'UNLOCKED'
                            : isId ? 'TERKUNCI' : 'LOCKED'}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-100">
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
