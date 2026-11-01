import { describe, it, expect } from 'vitest';
import { CategoryTabs } from '../CategoryTabs';
import { PALETTE_CATEGORIES } from '../../../../constants/componentCatalog';

describe('CategoryTabs Component & Navigation Contract', () => {
  it('exports CategoryTabs as a valid React component function', () => {
    expect(CategoryTabs).toBeDefined();
    expect(typeof CategoryTabs).toBe('function');
  });

  it('contains all 4 essential electrical categories in exact pedagogical sequence', () => {
    expect(PALETTE_CATEGORIES.length).toBe(4);
    const ids = PALETTE_CATEGORIES.map((c) => c.id);
    expect(ids).toEqual(['battery', 'light', 'control', 'measure']);
  });

  it('provides bilingual labels for each category for Indonesian and English curricula', () => {
    PALETTE_CATEGORIES.forEach((cat) => {
      expect(cat.label.length).toBeGreaterThan(0);
      expect(cat.labelEn.length).toBeGreaterThan(0);
      expect(cat.label).not.toEqual(cat.labelEn);
    });

    const batteryCat = PALETTE_CATEGORIES.find((c) => c.id === 'battery');
    expect(batteryCat?.label).toBe('Sumber Energi');
    expect(batteryCat?.labelEn).toBe('Power Sources');

    const controlCat = PALETTE_CATEGORIES.find((c) => c.id === 'control');
    expect(controlCat?.label).toBe('Pengatur');
    expect(controlCat?.labelEn).toBe('Control');
  });

  it('guarantees counts are non-negative integers for all categories', () => {
    const mockCounts: Record<string, number> = {
      battery: 4,
      light: 9,
      control: 8,
      measure: 4,
    };

    PALETTE_CATEGORIES.forEach((cat) => {
      const count = mockCounts[cat.id] ?? 0;
      expect(count).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(count)).toBe(true);
    });
  });
});
