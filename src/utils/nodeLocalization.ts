/**
 * Component Display Name & Label Localization Utility (`nodeLocalization.ts`).
 *
 * Single source of truth for localizing circuit component labels between Indonesian ('id')
 * and English ('en') across canvas badges, mobile floating toolbars, inspector headers,
 * and wire telemetry overlays.
 *
 * Design Principles:
 * - DRY: Centralizes all default component translations so no UI view hardcodes them.
 * - Non-destructive: If the user provided a custom name (e.g., "Lampu Kamar Tidur"),
 *   that user-defined name is preserved verbatim.
 * - Big-O Complexity: O(1) dictionary lookups and pattern matching.
 */

import { CircuitElementData, ComponentType } from '../types/circuit';
import { AppLanguage } from '../i18n/translations';
import { getPaletteEntry } from '../constants/componentCatalog';

/**
 * Standard system label translation dictionary.
 * Maps known Indonesian/English default label strings to their localized equivalents.
 */
interface LocalizedNamePair {
  id: string;
  en: string;
}

const DEFAULT_LABEL_PAIRS: readonly LocalizedNamePair[] = [
  // Battery Holders
  { id: 'Wadah AA (3.0V)', en: '2× AA Holder (3.0V)' },
  { id: 'Wadah AA', en: '2× AA Holder' },
  { id: 'Wadah Baterai AA', en: 'Dual AA Holder' },
  { id: 'Dual AA Holder', en: 'Dual AA Holder' },
  { id: '2× AA Holder', en: '2× AA Holder' },
  { id: 'AA Holder (2x)', en: 'AA Holder (2x)' },
  { id: 'Wadah AA (2x)', en: 'AA Holder (2x)' },

  // Batteries
  { id: 'Baterai AA 1.5V', en: '1.5V AA Battery' },
  { id: 'Baterai AA', en: 'AA Battery' },
  { id: '1.5V AA Battery', en: '1.5V AA Battery' },
  { id: 'Baterai Cadangan 1.5V', en: 'Extra 1.5V Battery' },
  { id: 'Baterai 9V', en: '9V Battery' },
  { id: 'Baterai 9V Utama', en: 'Main 9V Battery' },
  { id: '9V Battery', en: '9V Battery' },
  { id: 'Baterai Transistor 9V', en: '9V Transistor Battery' },

  // Switches
  { id: 'Saklar Utama', en: 'Main Switch' },
  { id: 'Saklar Pisau', en: 'Knife Switch' },
  { id: 'Main Switch', en: 'Main Switch' },
  { id: 'Knife Switch', en: 'Knife Switch' },
  { id: 'Saklar Korsleting', en: 'Short-Circuit Switch' },
  { id: 'Saklar Bypass Korslet', en: 'Short-Circuit Switch' },
  { id: 'Saklar SPST', en: 'SPST Switch' },

  // Lamps & Sockets
  { id: 'Fiting + Lampu Pijar', en: 'Socket + Incandescent Bulb' },
  { id: 'Lampu Pijar', en: 'Incandescent Bulb' },
  { id: 'Fiting + Lampu Pijar 1', en: 'Socket + Incandescent Bulb 1' },
  { id: 'Fiting + Lampu Pijar 2', en: 'Socket + Incandescent Bulb 2' },
  { id: 'Fiting + Lampu Pijar 3', en: 'Socket + Incandescent Bulb 3' },
  { id: 'Fiting + Lampu Edison', en: 'Socket + Edison Bulb' },
  { id: 'Lampu Edison', en: 'Edison Bulb' },
  { id: 'Fiting + Smart LED', en: 'Socket + Smart LED' },
  { id: 'Smart LED', en: 'Smart LED' },
  { id: 'Fiting Lampu E27', en: 'E27 Lamp Socket' },
  { id: 'Fiting Lampu Pin (G4)', en: 'G4 Pin-Base Socket' },

  // Sources & Meters
  { id: 'Sumber V (3.0V)', en: '3.0V Voltage Source' },
  { id: 'Sumber Baterai 3.0V', en: '3.0V Battery Source' },
  { id: 'Voltmeter Utama', en: 'Main Voltmeter' },
  { id: 'Voltmeter Digital', en: 'Digital Voltmeter' },
  { id: 'Amperemeter Utama', en: 'Main Ammeter' },
  { id: 'Amperemeter Digital', en: 'Digital Ammeter' },
  { id: 'Ground / Arde', en: 'Ground / Earth' },

  // Waypoints & Corner Junctions
  { id: 'Sudut Kanan Bawah', en: 'Bottom Right Corner' },
  { id: 'Sudut Kiri Bawah', en: 'Bottom Left Corner' },
  { id: 'Sudut Atas Kiri', en: 'Top Left Corner' },
  { id: 'Sudut Atas Kanan', en: 'Top Right Corner' },
  { id: 'Sudut Bawah Kanan', en: 'Bottom Right Corner' },
  { id: 'Sudut Bawah Kiri', en: 'Bottom Left Corner' },
  { id: 'Simpul Atas 1', en: 'Top Rail Node 1' },
  { id: 'Simpul Atas 2', en: 'Top Rail Node 2' },
  { id: 'Simpul Atas 3', en: 'Top Rail Node 3' },
  { id: 'Simpul Bawah 1', en: 'Bottom Rail Node 1' },
  { id: 'Simpul Bawah 2', en: 'Bottom Rail Node 2' },
  { id: 'Simpul Bawah 3', en: 'Bottom Rail Node 3' },

  // Outdoor Components
  { id: 'Panel Surya Alam', en: 'Outdoor Solar Panel' },
  { id: 'Turbin Angin Alam', en: 'Outdoor Wind Turbine' },
  { id: 'Menara Transmisi Luar', en: 'Outdoor Transmission Tower' },
  { id: 'Panel Distribusi Lab', en: 'Lab Distribution Panel' },
];

/** Fast bidirectional lookup maps: normalized raw string -> LocalizedNamePair */
const LABEL_LOOKUP_MAP: ReadonlyMap<string, LocalizedNamePair> = (() => {
  const map = new Map<string, LocalizedNamePair>();
  for (const pair of DEFAULT_LABEL_PAIRS) {
    map.set(pair.id.trim().toLowerCase(), pair);
    map.set(pair.en.trim().toLowerCase(), pair);
  }
  return map;
})();

/**
 * Resolves a component's localized display label for user interfaces.
 *
 * Algorithm:
 * 1. Checks if the current label matches a known system default label via O(1) hash map.
 *    If matched, returns the language-specific counterpart.
 * 2. Checks dynamic patterns (e.g., "Wadah AA (X.XV)", "Fiting + Lampu Pijar N").
 * 3. If label is absent or matches generic component type ("battery", "switch"),
 *    falls back to the localized catalog label from `componentCatalog`.
 * 4. If the label is a unique custom string set by the user, returns it untouched.
 *
 * Time Complexity: O(1)
 *
 * @param nodeData - Element data payload from React Flow node
 * @param language - Target UI language ('id' | 'en')
 * @returns Localized, user-facing component display label
 */
export function getComponentDisplayName(
  nodeData: Partial<CircuitElementData> | undefined | null,
  language: AppLanguage
): string {
  if (!nodeData) {
    return language === 'id' ? 'Komponen' : 'Component';
  }

  const isId = language === 'id';
  const rawLabel = (nodeData.label ?? '').trim();
  const compType = (nodeData.type ?? '') as ComponentType;

  // 1. Direct O(1) Hash Map match against known default translations
  if (rawLabel) {
    const matchedPair = LABEL_LOOKUP_MAP.get(rawLabel.toLowerCase());
    if (matchedPair) {
      return isId ? matchedPair.id : matchedPair.en;
    }
  }

  // 2. Battery Holder dynamic voltage pattern: "Wadah AA (X.XV)" / "2× AA Holder (X.XV)"
  if (compType === 'battery-holder' || rawLabel.toLowerCase().includes('wadah aa') || rawLabel.toLowerCase().includes('aa holder')) {
    const voltage = typeof nodeData.voltage === 'number' && !Number.isNaN(nodeData.voltage)
      ? nodeData.voltage
      : (nodeData.batteryCount ?? 2) * 1.5;
    return isId ? `Wadah AA (${voltage.toFixed(1)}V)` : `2× AA Holder (${voltage.toFixed(1)}V)`;
  }

  // 3. Numbered Lamp/Socket pattern: "Fiting + Lampu Pijar [0-9]"
  const numberedSocketMatch = rawLabel.match(/^(?:Fiting \+ Lampu Pijar|Socket \+ Incandescent Bulb)\s*(\d+)$/i);
  if (numberedSocketMatch) {
    const index = numberedSocketMatch[1];
    return isId ? `Fiting + Lampu Pijar ${index}` : `Socket + Incandescent Bulb ${index}`;
  }

  // 4. Numbered Rail Junction pattern: "Simpul (Atas|Bawah) [0-9]"
  const railTopMatch = rawLabel.match(/^(?:Simpul Atas|Top Rail Node)\s*(\d+)$/i);
  if (railTopMatch) {
    const index = railTopMatch[1];
    return isId ? `Simpul Atas ${index}` : `Top Rail Node ${index}`;
  }
  const railBotMatch = rawLabel.match(/^(?:Simpul Bawah|Bottom Rail Node)\s*(\d+)$/i);
  if (railBotMatch) {
    const index = railBotMatch[1];
    return isId ? `Simpul Bawah ${index}` : `Bottom Rail Node ${index}`;
  }

  // 5. If rawLabel is empty or matches component type name verbatim, query catalog
  if (!rawLabel || rawLabel.toLowerCase() === compType.toLowerCase()) {
    const entry = getPaletteEntry(compType);
    if (entry) {
      return isId ? entry.label : entry.labelEn;
    }
    // Generic fallback
    return compType.charAt(0).toUpperCase() + compType.slice(1);
  }

  // 6. User-defined custom label (e.g. "Lampu Teras Depan"): preserve user's custom text
  return rawLabel;
}
