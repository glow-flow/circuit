/**
 * Persistence & Progress Engine for Circuit Academy.
 * 
 * Manages XP accrual, level calculation, streak updates, badge unlocking,
 * and localStorage persistence in an isolated namespace.
 * 
 * Time Complexity:
 * - Load/Save: O(L + B) where L is completed lessons and B is unlocked badges.
 * - Level Calculation: O(1) via continuous threshold function.
 */

import { AcademyProgress, AcademyBadge } from '../types/academy';

export const ACADEMY_STORAGE_KEY = 'circuit_sandbox_academy_progress_v1';

export const ACADEMY_BADGES: AcademyBadge[] = [
  {
    id: 'first_spark',
    titleId: 'Pijar Pertama',
    titleEn: 'First Spark',
    descriptionId: 'Selesaikan pelajaran pertamamu di Akademi Kelistrikan.',
    descriptionEn: 'Complete your first lesson in Circuit Academy.',
    iconName: 'Zap',
    requiredCompletedCount: 1,
  },
  {
    id: 'ohm_master',
    titleId: 'Master Hukum Ohm',
    titleEn: 'Ohm\'s Law Master',
    descriptionId: 'Kuasai konsep tegangan, kuat arus, dan hambatan listrik.',
    descriptionEn: 'Master voltage, current, and electrical resistance relationships.',
    iconName: 'BookOpen',
    requiredCompletedCount: 3,
  },
  {
    id: 'circuit_architect',
    titleId: 'Arsitek Rangkaian',
    titleEn: 'Circuit Architect',
    descriptionId: 'Selesaikan seluruh topik analisis rangkaian seri dan paralel.',
    descriptionEn: 'Complete all topics on series and parallel circuit analysis.',
    iconName: 'Layers',
    requiredCompletedCount: 6,
  },
  {
    id: 'safety_officer',
    titleId: 'Teknisi Keselamatan PUIL',
    titleEn: 'PUIL Safety Officer',
    descriptionId: 'Pahami proteksi sekering, MCB, dan pencegahan bahaya korsleting.',
    descriptionEn: 'Master fuse protection, MCBs, and short-circuit hazard prevention.',
    iconName: 'ShieldCheck',
    requiredCompletedCount: 10,
  },
  {
    id: 'renewable_pioneer',
    titleId: 'Pelopor Energi Terbarukan',
    titleEn: 'Renewable Pioneer',
    descriptionId: 'Selesaikan simulasi pembangkit surya, angin, dan penyimpanan baterai.',
    descriptionEn: 'Complete solar PV, wind turbine, and battery storage simulations.',
    iconName: 'Sun',
    requiredCompletedCount: 14,
  },
  {
    id: 'senior_engineer',
    titleId: 'Insinyur Kelistrikan Utama',
    titleEn: 'Principal Electrical Engineer',
    descriptionId: 'Capai Level 6 dan selesaikan seluruh kurikulum teknik lanjutan.',
    descriptionEn: 'Reach Level 6 and complete the advanced engineering curriculum.',
    iconName: 'Award',
    requiredLevel: 6,
  },
];

export const LEVEL_XP_THRESHOLDS: number[] = [
  0,     // Level 1: Fundamentals (0 XP)
  200,   // Level 2: Analysis (200 XP)
  500,   // Level 3: Components (500 XP)
  900,   // Level 4: Protection & Safety (900 XP)
  1400,  // Level 5: Renewable Energy (1400 XP)
  2000,  // Level 6: Advanced Engineering (2000 XP)
];

export const DEFAULT_ACADEMY_PROGRESS: AcademyProgress = {
  schemaVersion: '1.0.0',
  totalXp: 0,
  currentLevel: 1,
  completedLessonIds: [],
  unlockedBadgeIds: [],
  streakDays: 1,
  lastActiveDate: new Date().toISOString().slice(0, 10),
  history: [],
};

/**
 * Calculates current student engineering level from accumulated XP.
 * Time Complexity: O(1) over bounded thresholds.
 */
export function calculateLevelFromXp(xp: number): number {
  if (xp <= 0) return 1;
  for (let levelIndex = LEVEL_XP_THRESHOLDS.length - 1; levelIndex >= 0; levelIndex--) {
    if (xp >= LEVEL_XP_THRESHOLDS[levelIndex]) {
      return levelIndex + 1;
    }
  }
  return 1;
}

/**
 * Evaluates which achievement badges are unlocked based on current progress metrics.
 * Time Complexity: O(B) where B is badge count.
 */
export function evaluateUnlockedBadges(
  progress: AcademyProgress,
  allBadges: AcademyBadge[] = ACADEMY_BADGES
): string[] {
  const unlockedSet = new Set<string>(progress.unlockedBadgeIds);

  for (const badge of allBadges) {
    if (unlockedSet.has(badge.id)) continue;

    let isEligible = true;

    if (badge.requiredCompletedCount !== undefined) {
      if (progress.completedLessonIds.length < badge.requiredCompletedCount) {
        isEligible = false;
      }
    }

    if (badge.requiredXp !== undefined) {
      if (progress.totalXp < badge.requiredXp) {
        isEligible = false;
      }
    }

    if (badge.requiredLevel !== undefined) {
      if (progress.currentLevel < badge.requiredLevel) {
        isEligible = false;
      }
    }

    if (isEligible) {
      unlockedSet.add(badge.id);
    }
  }

  return Array.from(unlockedSet);
}

/**
 * Updates daily streak counter based on calendar dates (YYYY-MM-DD).
 * Time Complexity: O(1).
 */
export function updateStreak(
  currentStreak: number,
  lastDateStr: string,
  todayStr: string = new Date().toISOString().slice(0, 10)
): { streakDays: number; lastActiveDate: string } {
  if (lastDateStr === todayStr) {
    return { streakDays: Math.max(1, currentStreak), lastActiveDate: todayStr };
  }

  const lastDate = new Date(lastDateStr);
  const today = new Date(todayStr);
  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  if (diffDays === 1) {
    return { streakDays: currentStreak + 1, lastActiveDate: todayStr };
  } else if (diffDays > 1) {
    return { streakDays: 1, lastActiveDate: todayStr };
  }

  return { streakDays: currentStreak, lastActiveDate: todayStr };
}

/**
 * Deserializes Academy progress from browser localStorage with defensive fallback.
 * Time Complexity: O(L) where L is completed lessons.
 */
export function loadAcademyProgress(storageOverride?: Storage): AcademyProgress {
  try {
    const storage = storageOverride ?? (typeof window !== 'undefined' ? window.localStorage : null);
    if (!storage) return { ...DEFAULT_ACADEMY_PROGRESS };

    const raw = storage.getItem(ACADEMY_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ACADEMY_PROGRESS };

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { ...DEFAULT_ACADEMY_PROGRESS };
    }

    const totalXp = typeof parsed.totalXp === 'number' && Number.isFinite(parsed.totalXp) ? parsed.totalXp : 0;
    const completedLessonIds = Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds : [];
    const unlockedBadgeIds = Array.isArray(parsed.unlockedBadgeIds) ? parsed.unlockedBadgeIds : [];
    const history = Array.isArray(parsed.history) ? parsed.history : [];
    const streakDays = typeof parsed.streakDays === 'number' && parsed.streakDays >= 1 ? parsed.streakDays : 1;
    const lastActiveDate = typeof parsed.lastActiveDate === 'string' ? parsed.lastActiveDate : new Date().toISOString().slice(0, 10);

    const calculatedLevel = calculateLevelFromXp(totalXp);

    const progress: AcademyProgress = {
      schemaVersion: '1.0.0',
      totalXp,
      currentLevel: calculatedLevel,
      completedLessonIds,
      unlockedBadgeIds,
      streakDays,
      lastActiveDate,
      history,
    };

    // Re-evaluate badges in case new badges were added to catalog
    progress.unlockedBadgeIds = evaluateUnlockedBadges(progress);

    return progress;
  } catch (error) {
    console.warn('Failed to load Academy progress from storage:', error);
    return { ...DEFAULT_ACADEMY_PROGRESS };
  }
}

/**
 * Saves Academy progress to browser localStorage.
 * Time Complexity: O(L) where L is history length.
 */
export function saveAcademyProgress(
  progress: AcademyProgress,
  storageOverride?: Storage
): boolean {
  try {
    const storage = storageOverride ?? (typeof window !== 'undefined' ? window.localStorage : null);
    if (!storage) return false;

    storage.setItem(ACADEMY_STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch (error) {
    console.warn('Failed to save Academy progress to storage:', error);
    return false;
  }
}

/**
 * Records lesson completion, calculates XP reward, updates level, and unlocks badges.
 * Idempotent: Completing an already completed lesson does not duplicate XP.
 * 
 * @param lessonId - Unique ID of completed lesson
 * @param xpReward - XP points earned
 * @param storageOverride - Optional storage for tests
 * @returns Updated AcademyProgress
 */
export function completeAcademyLesson(
  lessonId: string,
  xpReward: number,
  storageOverride?: Storage
): AcademyProgress {
  const current = loadAcademyProgress(storageOverride);
  const todayStr = new Date().toISOString().slice(0, 10);
  const streakUpdate = updateStreak(current.streakDays, current.lastActiveDate, todayStr);

  const isAlreadyCompleted = current.completedLessonIds.includes(lessonId);

  const nextCompletedLessonIds = isAlreadyCompleted
    ? current.completedLessonIds
    : [...current.completedLessonIds, lessonId];

  const earnedXp = isAlreadyCompleted ? 0 : xpReward;
  const nextTotalXp = current.totalXp + earnedXp;
  const nextLevel = calculateLevelFromXp(nextTotalXp);

  const nextHistory = [
    {
      lessonId,
      completedAt: Date.now(),
      xpEarned: earnedXp,
    },
    ...current.history.slice(0, 19), // Keep 20 recent items
  ];

  let nextProgress: AcademyProgress = {
    schemaVersion: '1.0.0',
    totalXp: nextTotalXp,
    currentLevel: nextLevel,
    completedLessonIds: nextCompletedLessonIds,
    unlockedBadgeIds: current.unlockedBadgeIds,
    streakDays: streakUpdate.streakDays,
    lastActiveDate: streakUpdate.lastActiveDate,
    history: nextHistory,
  };

  nextProgress.unlockedBadgeIds = evaluateUnlockedBadges(nextProgress);
  saveAcademyProgress(nextProgress, storageOverride);

  return nextProgress;
}
