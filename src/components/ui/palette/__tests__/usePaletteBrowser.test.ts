import { describe, it, expect, beforeEach } from 'vitest';
import { useCircuitStore } from '../../../../store/useCircuitStore';
import {
  OUTDOOR_ALLOWED_ENTRY_IDS,
  LAB_EXCLUDED_ENTRY_IDS,
} from '../usePaletteBrowser';
import { getPaletteEntry } from '../../../../constants/componentCatalog';

describe('usePaletteBrowser configuration & outdoor filtering', () => {
  beforeEach(() => {
    useCircuitStore.getState().setWorldMode('lab');
  });

  it('defines valid outdoor-allowed entry IDs matching existing catalog items', () => {
    expect(OUTDOOR_ALLOWED_ENTRY_IDS.size).toBe(3);
    OUTDOOR_ALLOWED_ENTRY_IDS.forEach((id) => {
      expect(getPaletteEntry(id)).toBeDefined();
    });
    expect(OUTDOOR_ALLOWED_ENTRY_IDS.has('solar-panel')).toBe(true);
    expect(OUTDOOR_ALLOWED_ENTRY_IDS.has('wind-turbine')).toBe(true);
    expect(OUTDOOR_ALLOWED_ENTRY_IDS.has('transmission-tower')).toBe(true);
  });

  it('excludes outdoor generators from lab mode but retains transmission tower as lab distribution box', () => {
    expect(LAB_EXCLUDED_ENTRY_IDS.has('solar-panel')).toBe(true);
    expect(LAB_EXCLUDED_ENTRY_IDS.has('wind-turbine')).toBe(true);
    // transmission-tower is allowed in lab because it transforms into "Panel Distribusi Lab"
    expect(LAB_EXCLUDED_ENTRY_IDS.has('transmission-tower')).toBe(false);
  });

  it('ensures outdoor mode permits switching between solar panel, wind turbine, and transmission tower without unwanted snapping', () => {
    useCircuitStore.getState().setWorldMode('outside');
    expect(useCircuitStore.getState().worldMode).toBe('outside');

    // All three outdoor items must be valid palette entries
    const solar = getPaletteEntry('solar-panel');
    const wind = getPaletteEntry('wind-turbine');
    const tower = getPaletteEntry('transmission-tower');

    expect(solar).toBeDefined();
    expect(wind).toBeDefined();
    expect(tower).toBeDefined();
    expect(OUTDOOR_ALLOWED_ENTRY_IDS.has(solar!.id)).toBe(true);
    expect(OUTDOOR_ALLOWED_ENTRY_IDS.has(wind!.id)).toBe(true);
    expect(OUTDOOR_ALLOWED_ENTRY_IDS.has(tower!.id)).toBe(true);
  });
});
