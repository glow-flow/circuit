/**
 * Scoring & Persistence Engine for Troubleshooting Lab.
 * 
 * Computes deterministic scores based on:
 * - Successful physical repair verification
 * - Progressive hint penalties (-100, -200, -300 pts)
 * - Diagnostic time efficiency (1 pt per 2s, capped at -200 pts)
 * 
 * Time Complexity: O(1) score calculation.
 */

import {
  TroubleshootingScoreResult,
  TroubleshootingProgress,
  TroubleshootingRunRecord,
} from '../types/troubleshooting';

export const TROUBLESHOOTING_STORAGE_KEY = 'circuit_sandbox_troubleshooting_v1';

export const DEFAULT_TROUBLESHOOTING_PROGRESS: TroubleshootingProgress = {
  schemaVersion: '1.0.0',
  totalRepairsCompleted: 0,
  bestScores: {},
};

/**
 * Calculates student troubleshooting performance score.
 * Time Complexity: O(1).
 * 
 * @param hintsUsedCount - Number of hints revealed (0 to 3)
 * @param durationSeconds - Time taken to diagnose and repair
 * @returns TroubleshootingScoreResult
 */
export function calculateTroubleshootingScore(
  hintsUsedCount: number,
  durationSeconds: number
): TroubleshootingScoreResult {
  const baseScore = 1000;

  // Progressive hint penalties:
  // Hint 1: -100, Hint 2: -200, Hint 3: -300
  let hintPenalty = 0;
  if (hintsUsedCount >= 1) hintPenalty += 100;
  if (hintsUsedCount >= 2) hintPenalty += 200;
  if (hintsUsedCount >= 3) hintPenalty += 300;

  // Time penalty: 1 point per 2 seconds, capped at 200 points
  const timePenalty = Math.min(200, Math.floor(Math.max(0, durationSeconds) / 2));

  const rawScore = baseScore - hintPenalty - timePenalty;
  const finalScore = Math.max(200, rawScore);

  let stars: 1 | 2 | 3 = 1;
  if (finalScore >= 800) {
    stars = 3;
  } else if (finalScore >= 600) {
    stars = 2;
  }

  return {
    baseScore,
    hintPenalty,
    timePenalty,
    finalScore,
    stars,
    durationSeconds,
  };
}

/**
 * Loads student troubleshooting records from localStorage.
 */
export function loadTroubleshootingProgress(
  storageOverride?: Storage
): TroubleshootingProgress {
  try {
    const storage = storageOverride ?? (typeof window !== 'undefined' ? window.localStorage : null);
    if (!storage) return { ...DEFAULT_TROUBLESHOOTING_PROGRESS };

    const raw = storage.getItem(TROUBLESHOOTING_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_TROUBLESHOOTING_PROGRESS };

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { ...DEFAULT_TROUBLESHOOTING_PROGRESS };
    }

    return {
      schemaVersion: '1.0.0',
      totalRepairsCompleted: typeof parsed.totalRepairsCompleted === 'number' ? parsed.totalRepairsCompleted : 0,
      bestScores: parsed.bestScores && typeof parsed.bestScores === 'object' ? parsed.bestScores : {},
    };
  } catch (error) {
    console.warn('Failed to load troubleshooting progress from storage:', error);
    return { ...DEFAULT_TROUBLESHOOTING_PROGRESS };
  }
}

/**
 * Saves updated troubleshooting progress to localStorage.
 */
export function saveTroubleshootingProgress(
  progress: TroubleshootingProgress,
  storageOverride?: Storage
): boolean {
  try {
    const storage = storageOverride ?? (typeof window !== 'undefined' ? window.localStorage : null);
    if (!storage) return false;

    storage.setItem(TROUBLESHOOTING_STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch (error) {
    console.warn('Failed to save troubleshooting progress to storage:', error);
    return false;
  }
}

/**
 * Records a successful repair run, preserving the highest score achieved.
 */
export function recordTroubleshootingRun(
  scenarioId: string,
  scoreResult: TroubleshootingScoreResult,
  hintsUsedCount: number,
  storageOverride?: Storage
): TroubleshootingProgress {
  const current = loadTroubleshootingProgress(storageOverride);

  const existingBest = current.bestScores[scenarioId];
  const isBetterScore = !existingBest || scoreResult.finalScore > existingBest.score;

  const newRecord: TroubleshootingRunRecord = {
    scenarioId,
    completedAt: Date.now(),
    score: isBetterScore ? scoreResult.finalScore : existingBest.score,
    stars: isBetterScore ? scoreResult.stars : existingBest.stars,
    hintsUsedCount,
    durationSeconds: scoreResult.durationSeconds,
  };

  const nextBestScores = {
    ...current.bestScores,
    [scenarioId]: newRecord,
  };

  const isFirstTimeCompletion = !existingBest;
  const nextTotalRepairs = current.totalRepairsCompleted + (isFirstTimeCompletion ? 1 : 0);

  const nextProgress: TroubleshootingProgress = {
    schemaVersion: '1.0.0',
    totalRepairsCompleted: nextTotalRepairs,
    bestScores: nextBestScores,
  };

  saveTroubleshootingProgress(nextProgress, storageOverride);
  return nextProgress;
}
