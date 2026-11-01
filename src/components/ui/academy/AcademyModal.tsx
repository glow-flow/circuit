import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Zap,
  BookOpen,
  Trophy,
  Flame,
  Award,
  CheckCircle2,
  Sparkles,
  FlaskConical,
  Play,
  Lock,
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

interface AcademyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

  // Reload progress when modal opens
  useEffect(() => {
    if (isOpen) {
      setProgress(loadAcademyProgress());
      setIsQuizSubmitted(false);
      setSelectedQuizAnswers({});
    }
  }, [isOpen]);

  const activeLesson: AcademyLesson = useMemo(() => {
    return ACADEMY_LESSONS.find((l) => l.id === activeLessonId) ?? ACADEMY_LESSONS[0];
  }, [activeLessonId]);

  const isCurrentLessonCompleted = progress.completedLessonIds.includes(activeLesson.id);

  // Filter lessons for the selected level
  const levelLessons = useMemo(() => {
    return ACADEMY_LESSONS.filter((l) => l.level === selectedLevel);
  }, [selectedLevel]);

  // Overall completion percentage
  const overallCompletionPercent = Math.round(
    (progress.completedLessonIds.length / ACADEMY_LESSONS.length) * 100
  );

  // Next recommended lesson (first uncompleted lesson)
  const recommendedNextLesson = useMemo(() => {
    return ACADEMY_LESSONS.find((l) => !progress.completedLessonIds.includes(l.id)) ?? ACADEMY_LESSONS[0];
  }, [progress.completedLessonIds]);

  // Handle Quiz Option Selection
  const handleSelectOption = (questionId: string, optionId: string) => {
    if (isQuizSubmitted) return;
    setSelectedQuizAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  // Grade Quiz & Complete Lesson
  const handleGradeQuizAndComplete = () => {
    setIsQuizSubmitted(true);

    const questions = activeLesson.quiz;
    const isAllCorrect = questions.every((q) => {
      const selectedId = selectedQuizAnswers[q.id];
      const correctOption = q.options.find((opt) => opt.isCorrect);
      return selectedId === correctOption?.id;
    });

    if (isAllCorrect) {
      const updated = completeAcademyLesson(activeLesson.id, activeLesson.xpReward);
      setProgress(updated);

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#3b82f6', '#10b981', '#f59e0b'],
      });

      notify(
        isId
          ? `Selamat! Pelajaran selesai, kamu mendapatkan +${activeLesson.xpReward} XP!`
          : `Congratulations! Lesson complete, you earned +${activeLesson.xpReward} XP!`
      );
    }
  };

  // "TRY IN CIRCUIT LAB" Action
  const handleTryInLab = () => {
    if (activeLesson.starterPresetId) {
      loadPreset(activeLesson.starterPresetId as any);
      notify(
        isId
          ? `Rangkaian praktikum "${isId ? activeLesson.titleId : activeLesson.titleEn}" dimuat ke kanvas!`
          : `Lab blueprint for "${isId ? activeLesson.titleId : activeLesson.titleEn}" loaded onto canvas!`
      );
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-void-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-5xl h-[92dvh] max-h-[850px] bg-void-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden font-sans">
        {/* Top Header Dock */}
        <header className="px-4 py-3 sm:px-6 sm:py-4 border-b border-white/10 bg-void-950 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight leading-none">
                  {isId ? 'Akademi Kelistrikan' : 'Circuit Academy'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-electric-500/10 text-electric-400 border border-electric-500/20 text-[10px] font-mono font-semibold">
                  IPA Kelas 9 & SMK
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate hidden sm:block">
                {isId
                  ? 'Kurikulum Terstruktur, Eksperimen Interaktif & Sertifikasi Kompetensi'
                  : 'Structured Curriculum, Interactive Simulations & Engineering Badges'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: Lessons vs Badges */}
            <div className="flex items-center p-0.5 rounded-xl bg-void-900 border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('lessons')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'lessons'
                    ? 'bg-electric-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isId ? 'Materi' : 'Lessons'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('achievements')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'achievements'
                    ? 'bg-electric-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isId ? 'Lencana' : 'Badges'} ({progress.unlockedBadgeIds.length})
              </button>
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

        {/* Dashboard Progress Stats Banner */}
        <section className="px-4 py-3 sm:px-6 bg-void-950/60 border-b border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          {/* Level */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-electric-500/10 border border-electric-500/20 flex items-center justify-center text-electric-400 shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                {isId ? 'Tingkat Siswa' : 'Student Level'}
              </div>
              <div className="text-sm font-bold text-slate-100 font-mono">
                Level {progress.currentLevel}
              </div>
            </div>
          </div>

          {/* Total XP */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                {isId ? 'Total Pengalaman' : 'Experience'}
              </div>
              <div className="text-sm font-bold text-amber-300 font-mono">
                {progress.totalXp} XP
              </div>
            </div>
          </div>

          {/* Lessons Completed */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                {isId ? 'Pelajaran Selesai' : 'Completed'}
              </div>
              <div className="text-sm font-bold text-emerald-300 font-mono">
                {progress.completedLessonIds.length} / {ACADEMY_LESSONS.length} ({overallCompletionPercent}%)
              </div>
            </div>
          </div>

          {/* Daily Streak */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                {isId ? 'Hari Berturut-turut' : 'Streak'}
              </div>
              <div className="text-sm font-bold text-orange-300 font-mono">
                {progress.streakDays} {isId ? 'Hari' : 'Days'} 🔥
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        {activeTab === 'lessons' ? (
          <div className="flex flex-1 min-h-0 divide-x divide-white/10">
            {/* Left Column: Level Navigation & Lesson Index */}
            <aside className="w-72 sm:w-80 flex flex-col bg-void-950/40 shrink-0 min-h-0">
              {/* Level Selector Tabs */}
              <div className="p-3 border-b border-white/10 space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block px-1">
                  {isId ? 'Tingkat Kurikulum' : 'Curriculum Level'}
                </label>
                <div className="grid grid-cols-6 gap-1">
                  {ACADEMY_LEVELS.map((lvl) => {
                    const isUnlocked = progress.totalXp >= lvl.requiredXp;
                    const isCurrent = selectedLevel === lvl.level;

                    return (
                      <button
                        key={lvl.level}
                        type="button"
                        onClick={() => setSelectedLevel(lvl.level)}
                        title={isId ? lvl.titleId : lvl.titleEn}
                        className={`h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer ${
                          isCurrent
                            ? 'bg-electric-500 text-white shadow-md'
                            : isUnlocked
                            ? 'bg-void-900 hover:bg-void-850 text-slate-300'
                            : 'bg-void-900/40 text-slate-600'
                        }`}
                      >
                        {lvl.level}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recommended Next Lesson Card */}
              {recommendedNextLesson && !progress.completedLessonIds.includes(recommendedNextLesson.id) && (
                <div className="p-3 border-b border-white/5 bg-electric-500/5">
                  <div className="text-[10px] font-mono text-electric-400 font-semibold uppercase tracking-wider mb-1">
                    ★ {isId ? 'Rekomendasi Berikutnya' : 'Recommended Next'}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLevel(recommendedNextLesson.level);
                      setActiveLessonId(recommendedNextLesson.id);
                      setIsQuizSubmitted(false);
                      setSelectedQuizAnswers({});
                    }}
                    className="w-full text-left p-2 rounded-lg bg-electric-500/15 border border-electric-500/30 text-xs font-semibold text-slate-100 hover:bg-electric-500/25 transition-all active:scale-95 cursor-pointer line-clamp-1"
                  >
                    {isId ? recommendedNextLesson.titleId : recommendedNextLesson.titleEn}
                  </button>
                </div>
              )}

              {/* Lesson Items List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {levelLessons.map((lesson) => {
                  const isCompleted = progress.completedLessonIds.includes(lesson.id);
                  const isSelected = activeLessonId === lesson.id;

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => {
                        setActiveLessonId(lesson.id);
                        setIsQuizSubmitted(false);
                        setSelectedQuizAnswers({});
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all active:scale-95 cursor-pointer space-y-1.5 ${
                        isSelected
                          ? 'bg-electric-500/15 border-electric-500/40 text-white shadow-sm'
                          : 'bg-void-900/60 border-white/5 hover:bg-void-850 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono text-slate-400">
                          {lesson.estimatedMinutes} {isId ? 'menit' : 'min'} · +{lesson.xpReward} XP
                        </span>
                        {isCompleted && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            {isId ? 'Selesai' : 'Done'}
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-xs leading-snug line-clamp-1">
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
            <main className="flex-1 flex flex-col min-h-0 bg-void-900 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Lesson Title & Header */}
              <div className="space-y-2 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-electric-500/20 text-electric-300 font-mono text-[10px] font-bold uppercase">
                    Level {activeLesson.level}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-void-800 text-slate-400 text-[10px] uppercase font-mono">
                    {activeLesson.difficulty}
                  </span>
                  <span className="text-slate-500 text-xs">·</span>
                  <span className="text-slate-400 text-xs">
                    {activeLesson.estimatedMinutes} {isId ? 'menit belajar' : 'min duration'}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
                  {isId ? activeLesson.titleId : activeLesson.titleEn}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isId ? activeLesson.summaryId : activeLesson.summaryEn}
                </p>
              </div>

              {/* Learning Objectives */}
              <div className="p-4 rounded-xl bg-void-950 border border-white/5 space-y-2">
                <div className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-electric-400" />
                  <span>{isId ? 'Tujuan Pembelajaran' : 'Learning Objectives'}</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-400 list-disc list-inside">
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
                <div className="space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {(isId ? activeLesson.theoryContentId : activeLesson.theoryContentEn).map(
                    (para, idx) => (
                      <p key={idx} className="p-3 rounded-xl bg-void-950/60 border border-white/5">
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
                        className="p-3.5 rounded-xl bg-void-950 border border-electric-500/20 space-y-1.5"
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
                <div className="p-4 rounded-2xl bg-electric-500/10 border border-electric-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-electric-500/20 flex items-center justify-center text-electric-400 shrink-0">
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
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-electric-500 hover:bg-electric-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
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
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-medium flex items-center gap-1">
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
                        className="p-4 rounded-xl bg-void-950 border border-white/5 space-y-3"
                      >
                        <div className="font-semibold text-xs text-slate-200">
                          {qIdx + 1}. {isId ? q.questionId : q.questionEn}
                        </div>

                        <div className="space-y-2">
                          {q.options.map((opt) => {
                            const isSelected = selectedOptId === opt.id;
                            let optionStyle = 'bg-void-900 border-white/10 text-slate-300 hover:bg-void-850';

                            if (isQuizSubmitted) {
                              if (opt.isCorrect) {
                                optionStyle = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold';
                              } else if (isSelected && !opt.isCorrect) {
                                optionStyle = 'bg-red-500/20 border-red-500/40 text-red-300 line-through';
                              }
                            } else if (isSelected) {
                              optionStyle = 'bg-electric-500/20 border-electric-500/50 text-white font-bold';
                            }

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleSelectOption(q.id, opt.id)}
                                className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-between ${optionStyle}`}
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
                          <div className="p-3 rounded-lg bg-void-900 border border-white/5 text-[11px] text-slate-400">
                            <strong>{isId ? 'Penjelasan: ' : 'Explanation: '}</strong>
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
                      disabled={
                        activeLesson.quiz.some((q) => !selectedQuizAnswers[q.id])
                      }
                      className="px-5 py-2.5 rounded-xl bg-electric-500 hover:bg-electric-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
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
              <h3 className="text-lg font-bold text-slate-100 tracking-tight">
                {isId ? 'Lencana Prestasi Kompetensi' : 'Competency Achievement Badges'}
              </h3>
              <p className="text-xs text-slate-400">
                {isId
                  ? 'Dapatkan sertifikasi penguasaan keterampilan kelistrikan melalui penyelesaian modul.'
                  : 'Earn certification badges by mastering practical electrical engineering concepts.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {ACADEMY_BADGES.map((badge) => {
                const isUnlocked = progress.unlockedBadgeIds.includes(badge.id);

                return (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isUnlocked
                        ? 'bg-void-950 border-electric-500/30 shadow-md'
                        : 'bg-void-950/40 border-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                          isUnlocked
                            ? 'bg-electric-500/20 border border-electric-500/40 text-electric-400'
                            : 'bg-void-900 border border-white/10 text-slate-600'
                        }`}
                      >
                        {isUnlocked ? <Trophy className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="font-bold text-xs text-slate-100 truncate">
                          {isId ? badge.titleId : badge.titleEn}
                        </div>
                        <div className="text-[11px] text-slate-400 leading-snug">
                          {isId ? badge.descriptionId : badge.descriptionEn}
                        </div>
                        <div className="text-[10px] font-mono text-electric-400 pt-1">
                          {isUnlocked ? (
                            <span className="text-emerald-400">✓ {isId ? 'Terbuka' : 'Unlocked'}</span>
                          ) : (
                            <span className="text-slate-500">🔒 {isId ? 'Terkunci' : 'Locked'}</span>
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
