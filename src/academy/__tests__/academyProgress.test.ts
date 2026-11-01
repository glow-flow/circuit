/**
 * Unit Test Suite for Circuit Academy Progress, XP & Badge Engine.
 * 
 * Verifies:
 * 1. XP to Level calculation across all 6 levels.
 * 2. Idempotent lesson completion and XP accrual.
 * 3. Achievement badge unlocking rules (completed count, XP, level).
 * 4. Daily streak computation (same day, consecutive day, broken streak).
 * 5. Isolated storage persistence without collision.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateLevelFromXp,
  evaluateUnlockedBadges,
  updateStreak,
  completeAcademyLesson,
  loadAcademyProgress,
  ACADEMY_STORAGE_KEY,
  ACADEMY_BADGES,
} from '../academyPersistence';
import { AcademyProgress } from '../../types/academy';

class MockStorage implements Storage {
  private store = new Map<string, string>();
  get length() { return this.store.size; }
  clear() { this.store.clear(); }
  getItem(key: string) { return this.store.get(key) ?? null; }
  key(index: number) { return Array.from(this.store.keys())[index] ?? null; }
  removeItem(key: string) { this.store.delete(key); }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
}

describe('Circuit Academy Progress & Gamification Engine', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  it('calculates correct student levels across all XP thresholds', () => {
    expect(calculateLevelFromXp(0)).toBe(1);
    expect(calculateLevelFromXp(199)).toBe(1);
    expect(calculateLevelFromXp(200)).toBe(2);
    expect(calculateLevelFromXp(499)).toBe(2);
    expect(calculateLevelFromXp(500)).toBe(3);
    expect(calculateLevelFromXp(900)).toBe(4);
    expect(calculateLevelFromXp(1400)).toBe(5);
    expect(calculateLevelFromXp(2000)).toBe(6);
    expect(calculateLevelFromXp(5000)).toBe(6);
  });

  it('completes lessons, accrues XP, and triggers level progression', () => {
    // Complete lesson 1 (+50 XP)
    const p1 = completeAcademyLesson('l1_ohms_law', 50, mockStorage);
    expect(p1.totalXp).toBe(50);
    expect(p1.currentLevel).toBe(1);
    expect(p1.completedLessonIds).toContain('l1_ohms_law');
    expect(p1.unlockedBadgeIds).toContain('first_spark'); // 1 lesson badge

    // Complete lesson 2 (+160 XP -> total 210 XP -> Level 2!)
    const p2 = completeAcademyLesson('l1_power_joule', 160, mockStorage);
    expect(p2.totalXp).toBe(210);
    expect(p2.currentLevel).toBe(2);
    expect(p2.completedLessonIds).toHaveLength(2);
  });

  it('is strictly idempotent: repeated completions do not duplicate XP', () => {
    const p1 = completeAcademyLesson('l1_ohms_law', 50, mockStorage);
    expect(p1.totalXp).toBe(50);

    // Complete the exact same lesson again
    const p2 = completeAcademyLesson('l1_ohms_law', 50, mockStorage);
    expect(p2.totalXp).toBe(50); // XP must NOT increase
    expect(p2.completedLessonIds).toHaveLength(1);
  });

  it('accurately updates learning streak across calendar days', () => {
    // Same day -> streak unchanged
    const sameDay = updateStreak(3, '2026-11-01', '2026-11-01');
    expect(sameDay.streakDays).toBe(3);

    // Consecutive day -> streak increments
    const nextDay = updateStreak(3, '2026-11-01', '2026-11-02');
    expect(nextDay.streakDays).toBe(4);

    // Broken streak (missed day) -> resets to 1
    const missedDay = updateStreak(5, '2026-11-01', '2026-11-05');
    expect(missedDay.streakDays).toBe(1);
  });

  it('evaluates unlocked badges based on lesson count and level milestones', () => {
    const baseProgress: AcademyProgress = {
      schemaVersion: '1.0.0',
      totalXp: 2100,
      currentLevel: 6,
      completedLessonIds: ['l1', 'l2', 'l3', 'l4', 'l5', 'l6'],
      unlockedBadgeIds: [],
      streakDays: 5,
      lastActiveDate: '2026-11-01',
      history: [],
    };

    const unlocked = evaluateUnlockedBadges(baseProgress, ACADEMY_BADGES);
    expect(unlocked).toContain('first_spark'); // >= 1 completed
    expect(unlocked).toContain('ohm_master'); // >= 3 completed
    expect(unlocked).toContain('circuit_architect'); // >= 6 completed
    expect(unlocked).toContain('senior_engineer'); // Level 6 reached
  });

  it('persists progress strictly in ACADEMY_STORAGE_KEY without workspace collision', () => {
    const initial = loadAcademyProgress(mockStorage);
    expect(initial.totalXp).toBe(0);

    completeAcademyLesson('l1_test', 100, mockStorage);

    // Verify key in mock storage
    const rawSaved = mockStorage.getItem(ACADEMY_STORAGE_KEY);
    expect(rawSaved).not.toBeNull();
    const parsed = JSON.parse(rawSaved!);
    expect(parsed.totalXp).toBe(100);

    // Verify workspace keys are untouched
    expect(mockStorage.getItem('circuit_sandbox_autosave_v2')).toBeNull();
  });
});
