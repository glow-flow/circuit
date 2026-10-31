import { describe, it, expect } from 'vitest';
import { BUILTIN_PRESET_CATALOG } from '../presetCatalog';

describe('Preset Gallery Catalog Metadata', () => {
  it('contains all 5 built-in presets with complete pedagogical metadata', () => {
    expect(BUILTIN_PRESET_CATALOG).toHaveLength(5);

    const ids = BUILTIN_PRESET_CATALOG.map((p) => p.id);
    expect(ids).toEqual([
      'simple-lamp',
      'voltage-divider',
      'parallel-bulbs',
      'short-circuit-demo',
      'ultimate-power-grid',
    ]);
  });

  it('ensures each preset has valid difficulty, duration, and component summary', () => {
    for (const preset of BUILTIN_PRESET_CATALOG) {
      expect(['beginner', 'intermediate', 'advanced']).toContain(preset.difficulty);
      expect(preset.durationMinutes).toBeGreaterThan(0);
      expect(preset.componentSummary.length).toBeGreaterThan(0);
      expect(preset.titleId).toBeTruthy();
      expect(preset.titleEn).toBeTruthy();
      expect(preset.descriptionId).toBeTruthy();
      expect(preset.descriptionEn).toBeTruthy();
    }
  });
});
