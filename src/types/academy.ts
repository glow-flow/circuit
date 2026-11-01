/**
 * Type definitions for Circuit Academy (Akademi Kelistrikan).
 * Structured 6-Level Curriculum, interactive lessons, progress tracking,
 * XP calculation, and achievement badges.
 */

export type AcademyDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface AcademyEquation {
  formula: string; // e.g. "V = I × R"
  nameId: string;
  nameEn: string;
  explanationId: string;
  explanationEn: string;
}

export interface AcademyQuizOption {
  id: string;
  textId: string;
  textEn: string;
  isCorrect: boolean;
}

export interface AcademyQuizQuestion {
  id: string;
  questionId: string;
  questionEn: string;
  options: AcademyQuizOption[];
  explanationId: string;
  explanationEn: string;
}

export interface AcademyLesson {
  id: string;
  level: number; // 1 to 6
  order: number;
  titleId: string;
  titleEn: string;
  summaryId: string;
  summaryEn: string;
  estimatedMinutes: number;
  difficulty: AcademyDifficulty;
  xpReward: number;
  learningObjectivesId: string[];
  learningObjectivesEn: string[];
  theoryContentId: string[];
  theoryContentEn: string[];
  equations: AcademyEquation[];
  interactiveDemoType?: 'ohms_law' | 'voltage_divider' | 'joule_power' | 'kcl_junction';
  starterPresetId?: string; // Preset to load when user clicks "TRY IN CIRCUIT LAB"
  quiz: AcademyQuizQuestion[];
}

export interface AcademyLevelInfo {
  level: number;
  titleId: string;
  titleEn: string;
  subtitleId: string;
  subtitleEn: string;
  requiredXp: number;
  badgeId: string;
}

export interface AcademyBadge {
  id: string;
  titleId: string;
  titleEn: string;
  descriptionId: string;
  descriptionEn: string;
  iconName: string;
  requiredXp?: number;
  requiredCompletedCount?: number;
  requiredLevel?: number;
}

export interface AcademyExperimentHistory {
  lessonId: string;
  completedAt: number;
  xpEarned: number;
}

export interface AcademyProgress {
  schemaVersion: string;
  totalXp: number;
  currentLevel: number;
  completedLessonIds: string[];
  unlockedBadgeIds: string[];
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  history: AcademyExperimentHistory[];
}
