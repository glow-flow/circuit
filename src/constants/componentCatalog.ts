/**
 * Component Palette Catalog.
 *
 * Single source of truth for the "Kotak Komponen" (component box). The palette UI
 * renders purely from this data, so adding a new part (e.g. a C / D size battery,
 * a new bulb) means adding one entry here and nothing else in the UI.
 *
 * Bulb entries are derived from `BULB_CATALOG` (DRY) so specs are never duplicated.
 *
 * Time Complexity:
 * - Build (module load): O(N) over N entries
 * - `getPaletteEntry` / `getEntriesByCategory`: O(1) via hash maps
 */

import { ComponentType, PlacementOptions } from '../types/circuit';
import { BULB_CATALOG } from './bulbCatalog';
import { COMPONENT_DATASHEET_CITATIONS } from './datasheetCitations';

export type PaletteCategoryId = 'battery' | 'light' | 'control' | 'measure';

/** MIME type used for palette → canvas drag-and-drop (payload = `PaletteEntry.id`). */
export const PALETTE_DRAG_MIME = 'application/reactflow';

/** Schematic symbol drawn in SVG for parts that have no photo asset. */
export type PaletteGlyphId = 'switch' | 'ground' | 'voltmeter' | 'ammeter' | 'distribution-panel';

export interface PaletteCategory {
  id: PaletteCategoryId;
  label: string;
  labelEn: string;
}

export interface PaletteEntry {
  /** Unique id; also the drag-and-drop payload (`application/reactflow`). */
  id: string;
  /** React Flow node type that gets created. */
  type: ComponentType;
  category: PaletteCategoryId;
  label: string;
  labelEn: string;
  /** One-sentence explanation (grade-9 level). */
  hint: string;
  hintEn: string;
  /** Short key spec shown on the tile, e.g. "1.5 V" or "800 Ω · 40 W". */
  spec: string;
  image?: string;
  imageRotated?: boolean;
  glyph?: PaletteGlyphId;
  /** Variant picked at placement time (e.g. which bulb model). */
  placement?: PlacementOptions;
  /** Short scientific standard / datasheet badge (e.g. "IEC 60086-2 (LR6)"). */
  standardBadge: string;
  /** Verifiable scientific / datasheet citation in Indonesian. */
  datasheetSource: string;
  /** Verifiable scientific / datasheet citation in English. */
  datasheetSourceEn: string;
}

export const PALETTE_CATEGORIES: readonly PaletteCategory[] = [
  { id: 'battery', label: 'Sumber Energi', labelEn: 'Power Sources' },
  { id: 'light', label: 'Lampu', labelEn: 'Lights' },
  { id: 'control', label: 'Pengatur', labelEn: 'Control' },
  { id: 'measure', label: 'Ukur', labelEn: 'Measure' },
];

const BATTERY_ENTRIES: PaletteEntry[] = [
  {
    id: 'battery',
    type: 'battery',
    category: 'battery',
    label: 'Baterai AA',
    labelEn: 'AA Battery',
    hint: 'Satu sel 1,5 V. Masukkan ke wadah atau sambung langsung ke kabel.',
    hintEn: 'One 1.5 V cell. Put it in a holder or wire it directly.',
    spec: '1.5 V',
    image: '/assets/processed/battery-aa.png',
    standardBadge: COMPONENT_DATASHEET_CITATIONS.battery.standardBadge,
    datasheetSource: COMPONENT_DATASHEET_CITATIONS.battery.sourceCitationId,
    datasheetSourceEn: COMPONENT_DATASHEET_CITATIONS.battery.sourceCitationEn,
  },
  {
    id: 'battery9v',
    type: 'battery9v',
    category: 'battery',
    label: 'Baterai 9V',
    labelEn: '9V Battery',
    hint: 'Tegangan tinggi. Cocok untuk lampu berdaya besar.',
    hintEn: 'High voltage. Good for high-power lamps.',
    spec: '9 V',
    image: '/assets/battery-9v.png',
    standardBadge: COMPONENT_DATASHEET_CITATIONS.battery9v.standardBadge,
    datasheetSource: COMPONENT_DATASHEET_CITATIONS.battery9v.sourceCitationId,
    datasheetSourceEn: COMPONENT_DATASHEET_CITATIONS.battery9v.sourceCitationEn,
  },
  {
    id: 'battery-holder',
    type: 'battery-holder',
    category: 'battery',
    label: 'Wadah 2× AA',
    labelEn: '2× AA Holder',
    hint: 'Muat 2 baterai AA tersusun seri: 1,5 + 1,5 = 3 V. Seret baterai ke atasnya.',
    hintEn: 'Holds 2 AA cells in series: 1.5 + 1.5 = 3 V. Drag a cell onto it.',
    spec: '3 V',
    image: '/assets/processed/battery-holder.png',
    standardBadge: COMPONENT_DATASHEET_CITATIONS['battery-holder'].standardBadge,
    datasheetSource: COMPONENT_DATASHEET_CITATIONS['battery-holder'].sourceCitationId,
    datasheetSourceEn: COMPONENT_DATASHEET_CITATIONS['battery-holder'].sourceCitationEn,
  },
  {
    id: 'solar-panel',
    type: 'solar-panel',
    category: 'battery',
    label: 'Panel Surya',
    labelEn: 'Solar Panel',
    hint: 'Mengubah cahaya matahari jadi listrik: 12V saat terik, 5V saat mendung, 0V di lab.',
    hintEn: 'Converts sunlight into electricity: 12V sunny, 5V cloudy, 0V lab.',
    spec: '0 - 12 V',
    image: '/assets/solar-panel.png',
    standardBadge: COMPONENT_DATASHEET_CITATIONS['solar-panel'].standardBadge,
    datasheetSource: COMPONENT_DATASHEET_CITATIONS['solar-panel'].sourceCitationId,
    datasheetSourceEn: COMPONENT_DATASHEET_CITATIONS['solar-panel'].sourceCitationEn,
  },
  {
    id: 'transmission-tower',
    type: 'transmission-tower',
    category: 'battery',
    label: 'Menara Transmisi',
    labelEn: 'Transmission Tower',
    hint: 'Kabel virtual antar-ruang: menyalurkan listrik tanpa batas dari alam luar ke laboratorium.',
    hintEn: 'Virtual grid power link: delivers lossless electricity across environments between outdoor and lab.',
    spec: 'Virtual Grid',
    image: '/assets/transmission-tower.png',
    standardBadge: COMPONENT_DATASHEET_CITATIONS['transmission-tower'].standardBadge,
    datasheetSource: COMPONENT_DATASHEET_CITATIONS['transmission-tower'].sourceCitationId,
    datasheetSourceEn: COMPONENT_DATASHEET_CITATIONS['transmission-tower'].sourceCitationEn,
  },
  {
    id: 'wind-turbine',
    type: 'wind-turbine',
    category: 'battery',
    label: 'Turbin Angin',
    labelEn: 'Wind Turbine',
    hint: 'Pembangkit listrik tenaga bayu. Atur kecepatan putaran 0-100% untuk menghasilkan 0 - 12 V.',
    hintEn: 'Wind power generator. Adjust rotor speed from 0-100% to generate 0 - 12 V DC.',
    spec: '0 - 12 V',
    image: '/assets/wind-turbine.png',
    standardBadge: COMPONENT_DATASHEET_CITATIONS['wind-turbine'].standardBadge,
    datasheetSource: COMPONENT_DATASHEET_CITATIONS['wind-turbine'].sourceCitationId,
    datasheetSourceEn: COMPONENT_DATASHEET_CITATIONS['wind-turbine'].sourceCitationEn,
  },
  {
    id: 'bess-substation',
    type: 'bess-substation',
    category: 'battery',
    label: 'Gardu Baterai BESS',
    labelEn: 'BESS Battery Substation',
    hint: 'Penyimpan energi skala besar (1 kWh, 12,8V). Menstabilkan listrik alam 24 jam siang & malam.',
    hintEn: 'Utility-scale energy storage (1 kWh, 12.8V). Stabilizes renewable microgrids 24/7 day & night.',
    spec: '12.8 V · 1 kWh',
    image: '/assets/bess-substation.png',
    standardBadge: 'IEC 62619 (LiFePO4)',
    datasheetSource: 'Standar Industri BESS IEC 62619 untuk Keamanan Sel Litium Industri',
    datasheetSourceEn: 'IEC 62619 Industrial Secondary Lithium Cells and Batteries Safety Standard',
  },
  {
    id: 'hydro-turbine',
    type: 'hydro-turbine',
    category: 'battery',
    label: 'Turbin Mikrohidro',
    labelEn: 'Micro-Hydro Turbine',
    hint: 'Pembangkit listrik tenaga air terjun/sungai dengan sudu Pelton: P = η · ρ · g · Q · H.',
    hintEn: 'Waterfall and river micro-hydro generator with Pelton runner: P = η · ρ · g · Q · H.',
    spec: '0 - 12 V · Pelton',
    image: '/assets/hydro-frame.png',
    standardBadge: 'IEC 61116 (Micro-Hydro)',
    datasheetSource: 'Panduan Elektromekanik Turbin Air Skala Kecil IEC 61116',
    datasheetSourceEn: 'IEC 61116 Electromechanical Equipment Guide for Small Hydroelectric Installations',
  },
];

const LIGHT_ENTRIES: PaletteEntry[] = [
  {
    id: 'socket',
    type: 'socket',
    category: 'light',
    label: 'Fiting Lampu E27',
    labelEn: 'E27 Bulb Socket',
    hint: 'Dudukan lampu ulir E27. Seret lampu ulir ke atasnya agar terpasang. Lampu pin (Halogen) tidak muat.',
    hintEn: 'Holder for E27 screw-base bulbs. Drag a screw bulb onto it to snap in. Pin bulbs (Halogen) do not fit.',
    spec: 'Ulir E27',
    image: '/assets/socket.png',
    standardBadge: COMPONENT_DATASHEET_CITATIONS.socket.standardBadge,
    datasheetSource: COMPONENT_DATASHEET_CITATIONS.socket.sourceCitationId,
    datasheetSourceEn: COMPONENT_DATASHEET_CITATIONS.socket.sourceCitationEn,
  },
  {
    id: 'pin-socket',
    type: 'pin-socket',
    category: 'light',
    label: 'Fiting Keramik Putih',
    labelEn: 'Pin Socket',
    hint: 'Dudukan keramik khusus lampu pin (Halogen). Seret lampu Halogen ke atasnya agar terpasang. Lampu ulir tidak muat.',
    hintEn: 'Ceramic holder for pin-base bulbs (Halogen). Drag a Halogen bulb onto it to snap in. Screw bulbs do not fit.',
    spec: 'Pin G4/G9',
    image: '/assets/socket-pin.png',
    standardBadge: COMPONENT_DATASHEET_CITATIONS['pin-socket'].standardBadge,
    datasheetSource: COMPONENT_DATASHEET_CITATIONS['pin-socket'].sourceCitationId,
    datasheetSourceEn: COMPONENT_DATASHEET_CITATIONS['pin-socket'].sourceCitationEn,
  },
  ...BULB_CATALOG.map(
    (bulbSpec): PaletteEntry => ({
      id: `bulb:${bulbSpec.type}`,
      type: 'bulb',
      category: 'light',
      label: bulbSpec.label,
      labelEn: bulbSpec.labelEn,
      hint: bulbSpec.traits,
      hintEn: bulbSpec.traitsEn,
      spec: `${bulbSpec.resistance} Ω · ${bulbSpec.maxPower} W`,
      image: bulbSpec.image,
      imageRotated: bulbSpec.imageRotated,
      placement: { bulbType: bulbSpec.type },
      standardBadge: bulbSpec.standardBadge,
      datasheetSource: bulbSpec.datasheetSource,
      datasheetSourceEn: bulbSpec.datasheetSourceEn,
    })
  ),
];

const CONTROL_ENTRIES: PaletteEntry[] = [
  {
    id: 'resistor',
    type: 'resistor',
    category: 'control',
    label: 'Resistor',
    labelEn: 'Resistor',
    hint: 'Penghambat arus. Makin besar hambatannya, makin kecil arusnya (V = I × R).',
    hintEn: 'Limits current. Bigger resistance, smaller current (V = I × R).',
    spec: '100 Ω',
    image: '/assets/processed/resistor.png',
    standardBadge: COMPONENT_DATASHEET_CITATIONS.resistor.standardBadge,
    datasheetSource: COMPONENT_DATASHEET_CITATIONS.resistor.sourceCitationId,
    datasheetSourceEn: COMPONENT_DATASHEET_CITATIONS.resistor.sourceCitationEn,
  },
  {
    id: 'switch',
    type: 'switch',
    category: 'control',
    label: 'Saklar',
    labelEn: 'Switch',
    hint: 'ON menyambung arus, OFF memutusnya.',
    hintEn: 'ON lets current flow, OFF stops it.',
    spec: 'ON / OFF',
    image: '/assets/switch-knife.png',
    glyph: 'switch',
    standardBadge: COMPONENT_DATASHEET_CITATIONS.switch.standardBadge,
    datasheetSource: COMPONENT_DATASHEET_CITATIONS.switch.sourceCitationId,
    datasheetSourceEn: COMPONENT_DATASHEET_CITATIONS.switch.sourceCitationEn,
  },
];

const MEASURE_ENTRIES: PaletteEntry[] = [
  {
    id: 'voltmeter',
    type: 'voltmeter',
    category: 'measure',
    label: 'Voltmeter',
    labelEn: 'Voltmeter',
    hint: 'Mengukur tegangan. Pasang paralel dengan komponen yang diukur.',
    hintEn: 'Measures voltage. Connect in parallel with the part you measure.',
    spec: 'Volt',
    image: '/assets/voltmeter.png',
    glyph: 'voltmeter',
    standardBadge: COMPONENT_DATASHEET_CITATIONS.voltmeter.standardBadge,
    datasheetSource: COMPONENT_DATASHEET_CITATIONS.voltmeter.sourceCitationId,
    datasheetSourceEn: COMPONENT_DATASHEET_CITATIONS.voltmeter.sourceCitationEn,
  },
  {
    id: 'ammeter',
    type: 'ammeter',
    category: 'measure',
    label: 'Amperemeter',
    labelEn: 'Ammeter',
    hint: 'Mengukur kuat arus. Pasang seri, di tengah jalur kabel.',
    hintEn: 'Measures current. Connect in series, inside the wire path.',
    spec: 'Ampere',
    image: '/assets/ammeter.png',
    glyph: 'ammeter',
    standardBadge: COMPONENT_DATASHEET_CITATIONS.ammeter.standardBadge,
    datasheetSource: COMPONENT_DATASHEET_CITATIONS.ammeter.sourceCitationId,
    datasheetSourceEn: COMPONENT_DATASHEET_CITATIONS.ammeter.sourceCitationEn,
  },
  {
    id: 'ground',
    type: 'ground',
    category: 'measure',
    label: 'Titik Nol',
    labelEn: 'Ground',
    hint: 'Titik acuan 0 volt untuk seluruh rangkaian.',
    hintEn: 'The 0 volt reference point for the whole circuit.',
    spec: '0 V',
    image: '/assets/ground-terminal.png',
    glyph: 'ground',
    standardBadge: COMPONENT_DATASHEET_CITATIONS.ground.standardBadge,
    datasheetSource: COMPONENT_DATASHEET_CITATIONS.ground.sourceCitationId,
    datasheetSourceEn: COMPONENT_DATASHEET_CITATIONS.ground.sourceCitationEn,
  },
];

export const PALETTE_ENTRIES: readonly PaletteEntry[] = [
  ...BATTERY_ENTRIES,
  ...LIGHT_ENTRIES,
  ...CONTROL_ENTRIES,
  ...MEASURE_ENTRIES,
];

const ENTRY_BY_ID: ReadonlyMap<string, PaletteEntry> = new Map(
  PALETTE_ENTRIES.map((entry) => [entry.id, entry])
);

const ENTRIES_BY_CATEGORY: ReadonlyMap<PaletteCategoryId, PaletteEntry[]> =
  PALETTE_ENTRIES.reduce((grouped, entry) => {
    const bucket = grouped.get(entry.category) ?? [];
    bucket.push(entry);
    grouped.set(entry.category, bucket);
    return grouped;
  }, new Map<PaletteCategoryId, PaletteEntry[]>());

/**
 * Looks up a palette entry by id (e.g. from a drag-and-drop payload).
 *
 * @param entryId - Entry id string; may be empty or unknown (returns undefined)
 * @returns The matching entry, or undefined when the id is not in the catalog
 */
export function getPaletteEntry(entryId: string | undefined | null): PaletteEntry | undefined {
  return entryId ? ENTRY_BY_ID.get(entryId) : undefined;
}

/**
 * Returns all entries of a category in catalog order.
 *
 * @param categoryId - Category to list
 * @returns Entries array (empty when the category has none)
 */
export function getEntriesByCategory(categoryId: PaletteCategoryId): readonly PaletteEntry[] {
  return ENTRIES_BY_CATEGORY.get(categoryId) ?? [];
}
