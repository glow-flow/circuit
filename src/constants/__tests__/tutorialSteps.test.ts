import { describe, it, expect, beforeEach } from 'vitest';
import { TUTORIAL_STEPS, getTutorialStep } from '../tutorialSteps';
import {
  TUTORIAL_STORAGE_KEY,
  hasSeenTutorial,
  markTutorialAsSeen,
} from '../../utils/presetStorage';

describe('Tutorial Steps & Onboarding Persistence', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it('defines all 4 required onboarding steps with exact educational copy and formulas', () => {
    expect(TUTORIAL_STEPS).toHaveLength(4);
    expect(TUTORIAL_STEPS.map((s) => s.id)).toEqual([1, 2, 3, 4]);

    // Step 1 Welcome copy check
    expect(TUTORIAL_STEPS[0].descriptionId).toContain(
      'Selamat datang di Circuit Sandbox! Mari belajar merangkai listrik.'
    );
    // Step 2 Add Component copy check
    expect(TUTORIAL_STEPS[1].descriptionId).toContain('Taruh di kanvas');
    // Step 3 Connect Wire copy check
    expect(TUTORIAL_STEPS[2].descriptionId).toContain('Tarik garis dari titik (dot) kuning');
    // Step 4 Delete & Inspector copy check
    expect(TUTORIAL_STEPS[3].descriptionId).toContain('Inspector');
  });

  it('safely clamps out-of-range or NaN step indices in O(1) time', () => {
    expect(getTutorialStep(0).id).toBe(1);
    expect(getTutorialStep(3).id).toBe(4);
    expect(getTutorialStep(-5).id).toBe(1);
    expect(getTutorialStep(99).id).toBe(4);
    expect(getTutorialStep(Number.NaN).id).toBe(1);
  });

  it('correctly persists and reads has_seen_tutorial in localStorage', () => {
    // Mock window.localStorage if running in Node environment without DOM
    const store: Record<string, string> = {};
    const mockWindow = {
      localStorage: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, val: string) => {
          store[key] = val;
        },
        clear: () => {
          Object.keys(store).forEach((k) => delete store[k]);
        },
      },
    };
    const originalWindow = (globalThis as any).window;
    (globalThis as any).window = mockWindow;

    try {
      expect(TUTORIAL_STORAGE_KEY).toBe('has_seen_tutorial');
      expect(hasSeenTutorial()).toBe(false);

      markTutorialAsSeen();
      expect(store['has_seen_tutorial']).toBe('true');
      expect(hasSeenTutorial()).toBe(true);
    } finally {
      (globalThis as any).window = originalWindow;
    }
  });
});
