import { describe, it, expect } from 'vitest';
import {
  PALETTE_CATEGORIES,
  PALETTE_ENTRIES,
  getEntriesByCategory,
  getPaletteEntry,
} from '../componentCatalog';
import { BULB_CATALOG } from '../bulbCatalog';

describe('Component palette catalog', () => {
  it('has globally unique entry ids (they double as drag payloads)', () => {
    const ids = PALETTE_ENTRIES.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('assigns every entry to a declared category and never leaves a category empty', () => {
    const declaredCategoryIds = new Set(PALETTE_CATEGORIES.map((category) => category.id));
    PALETTE_ENTRIES.forEach((entry) => {
      expect(declaredCategoryIds.has(entry.category)).toBe(true);
    });
    PALETTE_CATEGORIES.forEach((category) => {
      expect(getEntriesByCategory(category.id).length).toBeGreaterThan(0);
    });
  });

  it('groups batteries (AA, 9V, holder) under one category', () => {
    const batteryTypes = getEntriesByCategory('battery').map((entry) => entry.type);
    expect(batteryTypes).toEqual(['battery', 'battery9v', 'battery-holder']);
  });

  it('derives one light entry per bulb model (plus the socket), carrying the model as placement option', () => {
    const lightEntries = getEntriesByCategory('light');
    const bulbEntries = lightEntries.filter((entry) => entry.type === 'bulb');
    const socketEntries = lightEntries.filter((entry) => entry.type === 'socket');

    expect(socketEntries).toHaveLength(1);
    expect(bulbEntries).toHaveLength(BULB_CATALOG.length);
    bulbEntries.forEach((entry, index) => {
      expect(entry.placement?.bulbType).toBe(BULB_CATALOG[index].type);
    });
  });

  it('resolves ids safely: unknown, empty, null and undefined return undefined', () => {
    expect(getPaletteEntry('bulb:halogen')?.placement?.bulbType).toBe('halogen');
    expect(getPaletteEntry('does-not-exist')).toBeUndefined();
    expect(getPaletteEntry('')).toBeUndefined();
    expect(getPaletteEntry(null)).toBeUndefined();
    expect(getPaletteEntry(undefined)).toBeUndefined();
  });

  it('gives every entry either a photo or a schematic glyph, and no "Bohlam" wording', () => {
    PALETTE_ENTRIES.forEach((entry) => {
      expect(Boolean(entry.image || entry.glyph)).toBe(true);
      expect(`${entry.label} ${entry.hint}`.toLowerCase()).not.toContain('bohlam');
    });
  });
});
