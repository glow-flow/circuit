import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Trophy,
  CheckCircle2,
  FlaskConical,
  Play,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCircuitStore } from '../../../store/useCircuitStore';
import {
  ACADEMY_LEVELS,
  ACADEMY_LESSONS,
} from '../../../academy/academyCatalog';
import {
  loadAcademyProgress,
  completeAcademyLesson,
  ACADEMY_BADGES,
} from '../../../academy/academyPersistence';
import {
  AcademyLesson,
  AcademyProgress,
} from '../../../types/academy';
import { OhmsLawInteractiveDemo } from './demos/OhmsLawInteractiveDemo';
import { VoltageDividerInteractiveDemo } from './demos/VoltageDividerInteractiveDemo';
import { JoulePowerInteractiveDemo } from './demos/JoulePowerInteractiveDemo';
import { useModalKeyboardClose } from '../../../hooks/useModalKeyboardClose';
import { LabModalHeader } from '../common/LabModalHeader';

interface AcademyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * AcademyModal renders the structured curriculum, interactive lab demos,
 * and competency verification quizzes.
 *
 * Time Complexity: O(L) where L is the number of lessons in ACADEMY_LESSONS (constant, 7 lessons).
 * Using a Set for completedLessonIds lookup ensures O(1) per-lesson completion checks.
 */
export const AcademyModal: React.FC<AcademyModalProps> = ({ isOpen, onClose }) => {
  useModalKeyboardClose(isOpen, onClose);
  const language = useCircuitStore((state) => state.language);
  const loadPreset = useCircuitStore((state) => state.loadPreset);
  const notify = useCircuitStore((state) => state.notify);
  const isId = language === 'id';

  const [progress, setProgress] = useState<AcademyProgress>(() => loadAcademyProgress());
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [activeLessonId, setActiveLessonId] = useState<string>(ACADEMY_LESSONS[0].id);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<string, string>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'lessons' | 'achievements'>('lessons');
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  useEffect(() => {
    if (isOpen) {
      setProgress(loadAcademyProgress());
      setIsQuizSubmitted(false);
      setSelectedQuizAnswers({});
      setMobileView('list');
    }
  }, [isOpen]);

  // O(1) lookup set for completed lessons and unlocked badges
  const completedLessonSet = useMemo(
    () => new Set(progress.completedLessonIds),
    [progress.completedLessonIds]
  );

  const unlockedBadgeSet = useMemo(
    () => new Set(progress.unlockedBadgeIds),
    [progress.unlockedBadgeIds]
  );

  const activeLesson: AcademyLesson = useMemo(() => {
    return ACADEMY_LESSONS.find((lessonItem) => lessonItem.id === activeLessonId) ?? ACADEMY_LESSONS[0];
  }, [activeLessonId]);

  const isCurrentLessonCompleted = completedLessonSet.has(activeLesson.id);

  const levelLessons = useMemo(() => {
    return ACADEMY_LESSONS.filter((lessonItem) => lessonItem.level === selectedLevel);
  }, [selectedLevel]);

  const overallCompletionPercent = Math.round(
    (progress.completedLessonIds.length / Math.max(1, ACADEMY_LESSONS.length)) * 100
  );

  const recommendedNextLesson = useMemo(() => {
    return ACADEMY_LESSONS.find((lessonItem) => !completedLessonSet.has(lessonItem.id)) ?? null;
  }, [completedLessonSet]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (isQuizSubmitted) return;
    setSelectedQuizAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleGradeQuizAndComplete = () => {
    setIsQuizSubmitted(true);

    const questions = activeLesson.quiz;
    const isAllCorrect = questions.every((questionItem) => {
      const selectedId = selectedQuizAnswers[questionItem.id];
      const correctOption = questionItem.options.find((opt) => opt.isCorrect);
      return selectedId === correctOption?.id;
    });

    if (isAllCorrect) {
      const updated = completeAcademyLesson(activeLesson.id, activeLesson.xpReward);
      setProgress(updated);

      try {
        confetti({
          particleCount: 60,
          spread: 55,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#0284c7', '#e2e8f0'],
        });
      } catch {
        // Ignore confetti errors in headless/test environments
      }

      notify(
        isId
          ? `Selamat! Pelajaran selesai, kamu mendapatkan +${activeLesson.xpReward} XP!`
          : `Congratulations! Lesson complete, you earned +${activeLesson.xpReward} XP!`
      );
    }
  };

  const handleTryInLab = () => {
    if (activeLesson.starterPresetId) {
      loadPreset(activeLesson.starterPresetId as Parameters<typeof loadPreset>[0]);
      notify(
        isId
          ? `Rangkaian praktikum "${activeLesson.titleId}" dimuat ke kanvas!`
          : `Lab blueprint for "${activeLesson.titleEn}" loaded onto canvas!`
      );
      onClose();
    }
  };

  if (!isOpen) return null;

  const switcherSlot = (
    <div className="flex items-center p-0.5 rounded-xl bg-void-900 border border-white/10">
      <button
        type="button"
        onClick={() => setActiveTab('lessons')}
        className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
          activeTab === 'lessons'
            ? 'bg-electric-500 text-void-950 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        {isId ? 'Materi' : 'Lessons'}
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('achievements')}
        className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
          activeTab === 'achievements'
            ? 'bg-electric-500 text-void-950 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        {isId ? 'Lencana' : 'Badges'} ({progress.unlockedBadgeIds.length})
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-void-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-5xl min-h-[100dvh] sm:min-h-0 h-[100dvh] sm:h-[92dvh] sm:max-h-[850px] bg-void-900 border-0 sm:border sm:border-white/10 rounded-none sm:rounded-2xl shadow-2xl overflow-hidden font-sans">
        <LabModalHeader
          eyebrow={isId ? 'KURIKULUM KELISTRIKAN · SMP & SMK' : 'ELECTRICAL CURRICULUM · HIGH SCHOOL'}
          title={isId ? 'Akademi Kelistrikan' : 'Circuit Academy'}
          subtitle={
            isId
              ? 'Modul teori terstruktur, simulasi rumus interaktif, dan uji pemahaman rangkaian.'
              : 'Structured theory modules, interactive formula simulations, and circuit mastery checks.'
          }
          onClose={onClose}
          closeLabel={isId ? 'Tutup Akademi' : 'Close Academy'}
          rightSlot={switcherSlot}
        />

        {/* Unified Monospace Telemetry Strip (No rainbow icon boxes or emojis) */}
        <section
          aria-label={isId ? 'Ringkasan Progres Belajar' : 'Learning Progress Summary'}
          className="px-4 py-2.5 sm:px-6 bg-void-950/90 border-b border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 shrink-0"
        >
          <div className="px-3 py-2 rounded-xl bg-void-900/70 border border-white/5 flex items-baseline justify-between gap-2">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              {isId ? 'Tingkat' : 'Level'}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-100 font-mono">
              Lv. {progress.currentLevel}
            </span>
          </div>

          <div className="px-3 py-2 rounded-xl bg-void-900/70 border border-white/5 flex items-baseline justify-between gap-2">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              {isId ? 'Pengalaman' : 'Total XP'}
            </span>
            <span className="text-xs sm:text-sm font-bold text-electric-400 font-mono">
              {progress.totalXp} XP
            </span>
          </div>

          <div className="px-3 py-2 rounded-xl bg-void-900/70 border border-white/5 flex items-baseline justify-between gap-2">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              {isId ? 'Selesai' : 'Completed'}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-100 font-mono">
              {progress.completedLessonIds.length}/{ACADEMY_LESSONS.length} ({overallCompletionPercent}%)
            </span>
          </div>

          <div className="px-3 py-2 rounded-xl bg-void-900/70 border border-white/5 flex items-baseline justify-between gap-2">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              {isId ? 'Konsistensi' : 'Streak'}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-200 font-mono">
              {progress.streakDays} {isId ? 'Hari' : 'Days'}
            </span>
          </div>
        </section>

        {/* Main Content Area */}
        {activeTab === 'lessons' ? (
          <div className="flex flex-1 min-h-0 divide-x-0 md:divide-x divide-white/10">
            {/* Left Column: Level Navigation & Lesson Index */}
            <aside
              className={`w-full md:w-72 lg:w-80 flex-col bg-void-950/40 shrink-0 min-h-0 ${
                mobileView === 'detail' ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Level Selector Tabs */}
              <div className="p-3 border-b border-white/10 space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    {isId ? 'Tingkat Kurikulum' : 'Curriculum Level'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {ACADEMY_LEVELS.find((lvl) => lvl.level === selectedLevel)?.[isId ? 'titleId' : 'titleEn']}
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {ACADEMY_LEVELS.map((lvl) => {
                    const isUnlocked = progress.totalXp >= lvl.requiredXp;
                    const isCurrent = selectedLevel === lvl.level;

                    return (
                      <button
                        key={lvl.level}
                        type="button"
                        onClick={() => setSelectedLevel(lvl.level)}
                        title={isId ? lvl.titleId : lvl.titleEn}
                        className={`min-h-[38px] rounded-lg flex items-center justify-center text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer border ${
                          isCurrent
                            ? 'bg-electric-500 text-void-950 border-electric-400'
                            : isUnlocked
                            ? 'bg-void-900 hover:bg-void-850 text-slate-200 border-white/10'
                            : 'bg-void-950 text-slate-500 border-white/5'
                        }`}
                      >
                        {lvl.level}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lesson Items List (Single source of truth, no duplicated recommendation banner above) */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {levelLessons.map((lesson) => {
                  const isCompleted = completedLessonSet.has(lesson.id);
                  const isSelected = activeLessonId === lesson.id;
                  const isRecommendedNext = recommendedNextLesson?.id === lesson.id;

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => {
                        setActiveLessonId(lesson.id);
                        setIsQuizSubmitted(false);
                        setSelectedQuizAnswers({});
                        setMobileView('detail');
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all active:scale-[0.99] cursor-pointer space-y-1.5 ${
                        isSelected
                          ? 'bg-electric-500/12 border-electric-500/45 text-white'
                          : 'bg-void-900/70 border-white/10 hover:border-white/20 hover:bg-void-850 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-slate-400">
                          {lesson.estimatedMinutes} {isId ? 'menit' : 'min'} · +{lesson.xpReward} XP
                        </span>
                        {isCompleted ? (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-electric-400 font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            {isId ? 'Selesai' : 'Done'}
                          </span>
                        ) : isRecommendedNext ? (
                          <span className="px-1.5 py-0.5 rounded bg-electric-500/15 border border-electric-500/30 text-[9px] font-mono font-semibold uppercase tracking-wider text-electric-300">
                            {isId ? 'Selanjutnya' : 'Up Next'}
                          </span>
                        ) : null}
                      </div>
                      <div className="font-bold text-xs sm:text-sm text-slate-100 leading-snug">
                        {isId ? lesson.titleId : lesson.titleEn}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {isId ? lesson.summaryId : lesson.summaryEn}
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Right Column: Detailed Lesson Viewer */}
            <main
              className={`flex-1 flex-col min-h-0 bg-void-900 overflow-y-auto p-4 sm:p-6 space-y-6 ${
                mobileView === 'list' ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Mobile Back Button */}
              <div className="md:hidden flex items-center justify-between pb-3 border-b border-white/10">
                <button
                  type="button"
                  onClick={() => setMobileView('list')}
                  className="min-h-[40px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-void-950 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all active:scale-95 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-electric-400" />
                  <span>{isId ? 'Daftar Materi' : 'All Lessons'}</span>
                </button>
                <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-md bg-void-950 text-slate-300 border border-white/10">
                  Level {activeLesson.level}
                </span>
              </div>

              {/* Lesson Title & Header */}
              <div className="space-y-2 border-b border-white/10 pb-4">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
                  <span className="text-electric-400 font-semibold uppercase">
                    Level {activeLesson.level}
                  </span>
                  <span>·</span>
                  <span className="uppercase">{activeLesson.difficulty}</span>
                  <span>·</span>
                  <span>
                    {activeLesson.estimatedMinutes} {isId ? 'menit belajar' : 'min duration'}
                  </span>
                  <span>·</span>
                  <span className="text-slate-300">+{activeLesson.xpReward} XP</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight leading-[1.15] pb-0.5">
                  {isId ? activeLesson.titleId : activeLesson.titleEn}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-[68ch]">
                  {isId ? activeLesson.summaryId : activeLesson.summaryEn}
                </p>
              </div>

              {/* Learning Objectives */}
              <div className="p-4 rounded-xl bg-void-950 border border-white/10 space-y-2">
                <div className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-electric-400" />
                  <span>{isId ? 'Tujuan Pembelajaran' : 'Learning Objectives'}</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                  {(isId ? activeLesson.learningObjectivesId : activeLesson.learningObjectivesEn).map(
                    (obj, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {obj}
                      </li>
                    )
                  )}
                </ul>
              </div>

              {/* Theory Content */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">
                  {isId ? 'Konsep Teori & Prinsip Fisika' : 'Physics Theory & Principles'}
                </h4>
                <div className="space-y-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-[68ch]">
                  {(isId ? activeLesson.theoryContentId : activeLesson.theoryContentEn).map(
                    (para, idx) => (
                      <p key={idx} className="p-3.5 rounded-xl bg-void-950/70 border border-white/5">
                        {para}
                      </p>
                    )
                  )}
                </div>
              </div>

              {/* Equations Cards */}
              {activeLesson.equations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">
                    {isId ? 'Rumus Matematis' : 'Mathematical Equations'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeLesson.equations.map((eq, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-void-950 border border-white/10 space-y-1.5"
                      >
                        <div className="font-mono text-base font-bold text-electric-400">
                          {eq.formula}
                        </div>
                        <div className="font-semibold text-xs text-slate-200">
                          {isId ? eq.nameId : eq.nameEn}
                        </div>
                        <div className="text-[11px] text-slate-400 leading-snug">
                          {isId ? eq.explanationId : eq.explanationEn}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Theory Demonstration */}
              {activeLesson.interactiveDemoType === 'ohms_law' && (
                <OhmsLawInteractiveDemo />
              )}
              {activeLesson.interactiveDemoType === 'voltage_divider' && (
                <VoltageDividerInteractiveDemo />
              )}
              {activeLesson.interactiveDemoType === 'joule_power' && (
                <JoulePowerInteractiveDemo />
              )}

              {/* "TRY IN CIRCUIT LAB" CTA Banner */}
              {activeLesson.starterPresetId && (
                <div className="p-4 rounded-xl bg-void-950 border border-electric-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400 shrink-0">
                      <FlaskConical className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-100">
                        {isId ? 'Praktikum di Kanvas Laboratorium' : 'Practice in Circuit Lab'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {isId
                          ? 'Muat rangkaian percobaan siap pakai untuk menguji teori secara langsung.'
                          : 'Load the ready-to-test circuit blueprint into the simulator.'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTryInLab}
                    className="w-full sm:w-auto min-h-[42px] px-4 py-2 rounded-xl bg-electric-500 hover:bg-electric-400 text-void-950 font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isId ? 'Buka di Lab' : 'Try in Lab'}</span>
                  </button>
                </div>
              )}

              {/* Knowledge Check Quiz */}
              {activeLesson.quiz.length > 0 && (
                <div className="space-y-4 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">
                      {isId ? 'Uji Pemahaman Konsep' : 'Knowledge Check'}
                    </h4>
                    {isCurrentLessonCompleted && (
                      <span className="px-2.5 py-0.5 rounded-md bg-electric-500/15 border border-electric-500/30 text-electric-300 text-[10px] font-mono font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {isId ? 'Pelajaran Selesai' : 'Completed'}
                      </span>
                    )}
                  </div>

                  {activeLesson.quiz.map((q, qIdx) => {
                    const selectedOptId = selectedQuizAnswers[q.id];

                    return (
                      <div
                        key={q.id}
                        className="p-4 rounded-xl bg-void-950 border border-white/10 space-y-3"
                      >
                        <div className="font-semibold text-xs text-slate-200 leading-relaxed">
                          {qIdx + 1}. {isId ? q.questionId : q.questionEn}
                        </div>

                        <div className="space-y-2">
                          {q.options.map((opt) => {
                            const isSelected = selectedOptId === opt.id;
                            let optionStyle =
                              'bg-void-900 border-white/10 text-slate-300 hover:bg-void-850';

                            if (isQuizSubmitted) {
                              if (opt.isCorrect) {
                                optionStyle =
                                  'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold';
                              } else if (isSelected && !opt.isCorrect) {
                                optionStyle =
                                  'bg-red-500/15 border-red-500/40 text-red-300 line-through';
                              }
                            } else if (isSelected) {
                              optionStyle =
                                'bg-electric-500/15 border-electric-500/50 text-white font-bold';
                            }

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleSelectOption(q.id, opt.id)}
                                className={`w-full text-left min-h-[42px] px-3.5 py-2.5 rounded-xl border text-xs transition-all active:scale-[0.99] cursor-pointer flex items-center justify-between gap-2 ${optionStyle}`}
                              >
                                <span>{isId ? opt.textId : opt.textEn}</span>
                                {isQuizSubmitted && opt.isCorrect && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {isQuizSubmitted && (
                          <div className="p-3 rounded-lg bg-void-900 border border-white/10 text-[11px] text-slate-300 leading-relaxed">
                            <strong className="text-slate-100">
                              {isId ? 'Penjelasan: ' : 'Explanation: '}
                            </strong>
                            {isId ? q.explanationId : q.explanationEn}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleGradeQuizAndComplete}
                      disabled={activeLesson.quiz.some((q) => !selectedQuizAnswers[q.id])}
                      className="min-h-[42px] px-5 py-2.5 rounded-xl bg-electric-500 hover:bg-electric-400 disabled:opacity-40 disabled:cursor-not-allowed text-void-950 font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isId ? 'Periksa Jawaban & Klaim XP' : 'Submit & Claim XP'}</span>
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        ) : (
          /* Achievements Tab */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100 tracking-tight leading-[1.15]">
                {isId ? 'Lencana Prestasi Kompetensi' : 'Competency Achievement Badges'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isId
                  ? 'Sertifikasi penguasaan keterampilan kelistrikan melalui penyelesaian modul kurikulum.'
                  : 'Certification badges earned by mastering practical electrical engineering modules.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {ACADEMY_BADGES.map((badge) => {
                const isUnlocked = unlockedBadgeSet.has(badge.id);

                return (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isUnlocked
                        ? 'bg-void-950 border-electric-500/35'
                        : 'bg-void-950/50 border-white/10 opacity-70'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          isUnlocked
                            ? 'bg-electric-500/15 border-electric-500/35 text-electric-400'
                            : 'bg-void-900 border-white/10 text-slate-500'
                        }`}
                      >
                        {isUnlocked ? <Trophy className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="font-bold text-xs text-slate-100">
                          {isId ? badge.titleId : badge.titleEn}
                        </div>
                        <div className="text-[11px] text-slate-400 leading-snug">
                          {isId ? badge.descriptionId : badge.descriptionEn}
                        </div>
                        <div className="text-[10px] font-mono pt-1">
                          {isUnlocked ? (
                            <span className="text-electric-400 font-semibold">
                              {isId ? 'TERBUKA' : 'UNLOCKED'}
                            </span>
                          ) : (
                            <span className="text-slate-500">
                              {isId ? 'TERKUNCI' : 'LOCKED'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
