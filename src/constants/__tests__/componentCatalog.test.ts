import { describe, it, expect } from 'vitest';
import {
  PALETTE_CATEGORIES,
  PALETTE_ENTRIES,
  getEntriesByCategory,
  getPaletteEntry,
} from '../componentCatalog';
import {
  BULB_CATALOG,
  getBulbSpec,
  canBulbFitSocket,
  canBulbFitPinSocket,
} from '../bulbCatalog';
import {
  BULB_DATASHEET_CITATIONS,
  COMPONENT_DATASHEET_CITATIONS,
  getBulbCitation,
  getComponentCitation,
} from '../datasheetCitations';

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

  it('groups power sources (AA, 9V, holder, solar-panel, transmission-tower, wind-turbine) under energy category', () => {
    const batteryTypes = getEntriesByCategory('battery').map((entry) => entry.type);
    expect(batteryTypes).toEqual([
      'battery',
      'battery9v',
      'battery-holder',
      'solar-panel',
      'transmission-tower',
      'wind-turbine',
      'bess-substation',
      'hydro-turbine',
    ]);
  });

  it('includes both E27 screw socket and ceramic pin-socket in the light category', () => {
    const lightEntries = getEntriesByCategory('light');
    const screwSocketEntry = lightEntries.find((entry) => entry.id === 'socket');
    const pinSocketEntry = lightEntries.find((entry) => entry.id === 'pin-socket');

    expect(screwSocketEntry).toBeDefined();
    expect(screwSocketEntry?.type).toBe('socket');
    expect(screwSocketEntry?.image).toBe('/assets/socket.png');

    expect(pinSocketEntry).toBeDefined();
    expect(pinSocketEntry?.type).toBe('pin-socket');
    expect(pinSocketEntry?.image).toBe('/assets/socket-pin.png');
  });

  it('derives one light entry per bulb model (plus the 2 sockets), carrying the model as placement option', () => {
    const lightEntries = getEntriesByCategory('light');
    const bulbEntries = lightEntries.filter((entry) => entry.type === 'bulb');
    const socketEntries = lightEntries.filter((entry) => entry.type === 'socket');
    const pinSocketEntries = lightEntries.filter((entry) => entry.type === 'pin-socket');

    expect(socketEntries).toHaveLength(1);
    expect(pinSocketEntries).toHaveLength(1);
    expect(bulbEntries).toHaveLength(BULB_CATALOG.length);
    bulbEntries.forEach((entry, index) => {
      expect(entry.placement?.bulbType).toBe(BULB_CATALOG[index].type);
    });
  });

  it('correctly configures CFL as screw base and Halogen as pin base', () => {
    const cflSpecification = getBulbSpec('cfl');
    const halogenSpecification = getBulbSpec('halogen');

    expect(cflSpecification.baseType).toBe('screw');
    expect(halogenSpecification.baseType).toBe('pin');
  });

  it('canBulbFitSocket accepts screw-base bulbs (CFL, Incandescent, Edison, LED) and rejects Halogen', () => {
    expect(canBulbFitSocket('cfl')).toBe(true);
    expect(canBulbFitSocket('incandescent')).toBe(true);
    expect(canBulbFitSocket('edison')).toBe(true);
    expect(canBulbFitSocket('led_standard')).toBe(true);
    expect(canBulbFitSocket('led_rgb')).toBe(true);

    // Rejects pin-base bulbs
    expect(canBulbFitSocket('halogen')).toBe(false);
    expect(canBulbFitSocket('led_green')).toBe(false);
  });

  it('canBulbFitPinSocket accepts Halogen and rejects screw-base bulbs (CFL, Incandescent, Edison)', () => {
    expect(canBulbFitPinSocket('halogen')).toBe(true);

    // Rejects screw-base bulbs
    expect(canBulbFitPinSocket('cfl')).toBe(false);
    expect(canBulbFitPinSocket('incandescent')).toBe(false);
    expect(canBulbFitPinSocket('edison')).toBe(false);
    expect(canBulbFitPinSocket('led_standard')).toBe(false);
    expect(canBulbFitPinSocket('led_rgb')).toBe(false);
  });

  it('resolves ids safely: unknown, empty, null and undefined return undefined', () => {
    expect(getPaletteEntry('bulb:halogen')?.placement?.bulbType).toBe('halogen');
    expect(getPaletteEntry('pin-socket')?.type).toBe('pin-socket');
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

  it('provides verifiable scientific datasheet and standard citations for EACH of the 7 lamps', () => {
    expect(BULB_CATALOG).toHaveLength(7);
    BULB_CATALOG.forEach((bulb) => {
      expect(bulb.standardBadge.trim().length).toBeGreaterThan(5);
      expect(bulb.datasheetSource.trim().length).toBeGreaterThan(15);
      expect(bulb.datasheetSourceEn.trim().length).toBeGreaterThan(15);

      const citation = getBulbCitation(bulb.type);
      expect(citation.id).toBe(bulb.type);
      expect(citation.formulaDerivationId).toContain(String(bulb.resistance));
      expect(citation.sourceCitationId.length).toBeGreaterThan(15);
    });

    // Specifically verify Edison lamp citation covers 1200Ω, 5V/220V derivation, and SNI IEC 60064 / ST64 datasheet
    const edisonCitation = BULB_DATASHEET_CITATIONS.edison;
    expect(edisonCitation.parameterSummaryId).toContain('1200 Ω');
    expect(edisonCitation.formulaDerivationId).toContain('5V');
    expect(edisonCitation.sourceCitationId).toContain('SNI IEC 60064');
    expect(edisonCitation.sourceCitationId).toContain('ST64');
  });

  it('provides verifiable scientific datasheet citations for EACH component in PALETTE_ENTRIES', () => {
    PALETTE_ENTRIES.forEach((entry) => {
      expect(entry.standardBadge.trim().length).toBeGreaterThan(5);
      expect(entry.datasheetSource.trim().length).toBeGreaterThan(15);
      expect(entry.datasheetSourceEn.trim().length).toBeGreaterThan(15);

      const citation = getComponentCitation(entry.type, entry.placement?.bulbType);
      expect(citation).not.toBeNull();
      expect(citation?.sourceCitationId.length).toBeGreaterThan(15);
    });

    expect(Object.keys(COMPONENT_DATASHEET_CITATIONS)).toEqual([
      'battery',
      'battery9v',
      'battery-holder',
      'solar-panel',
      'wind-turbine',
      'transmission-tower',
      'bess-substation',
      'hydro-turbine',
      'socket',
      'pin-socket',
      'resistor',
      'switch',
      'voltmeter',
      'ammeter',
      'ground',
    ]);
  });
});
