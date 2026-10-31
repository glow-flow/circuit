import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PALETTE_CATEGORIES,
  PALETTE_ENTRIES,
  PaletteCategoryId,
  PaletteEntry,
  getEntriesByCategory,
  getPaletteEntry,
} from '../../../constants/componentCatalog';
import { useCircuitStore } from '../../../store/useCircuitStore';

/** Outdoor-only component IDs allowed when `worldMode === 'outside'`. */
const OUTDOOR_ALLOWED_ENTRY_IDS = new Set<string>([
  'solar-panel',
  'wind-turbine',
  'transmission-tower',
]);

/** Outdoor-exclusive generators excluded from the Indoor Lab palette (`worldMode === 'lab'`). */
const LAB_EXCLUDED_ENTRY_IDS = new Set<string>([
  'solar-panel',
  'wind-turbine',
]);

/** Entry count per category in Lab mode, computed once (catalog is static). O(N). */
const LAB_COUNT_BY_CATEGORY: Readonly<Record<string, number>> = PALETTE_ENTRIES.reduce<
  Record<string, number>
>((counts, entry) => {
  if (!LAB_EXCLUDED_ENTRY_IDS.has(entry.id)) {
    counts[entry.category] = (counts[entry.category] ?? 0) + 1;
  }
  return counts;
}, {});

/**
 * UI state for the component box: which category is open and which part is selected.
 * - In `worldMode === 'outside'`, filters strictly to Outdoor Power & Grid items
 *   (`solar-panel`, `wind-turbine`, `transmission-tower`) so indoor lab items are hidden.
 * - In `worldMode === 'lab'`, excludes `solar-panel` and `wind-turbine` (which belong
 *   exclusively to the Outdoor Sandbox) while keeping `transmission-tower` so users can
 *   receive transmitted outdoor power inside the Lab.
 *
 * Time Complexity: O(1) per interaction.
 */
export function usePaletteBrowser() {
  const worldMode = useCircuitStore((state) => state.worldMode);
  const firstCategoryId = PALETTE_CATEGORIES[0].id;
  const [activeCategoryId, setActiveCategoryId] = useState<PaletteCategoryId>(firstCategoryId);
  const [selectedEntryId, setSelectedEntryId] = useState<string>(
    getEntriesByCategory(firstCategoryId)[0]?.id ?? ''
  );

  // Synchronize default selection when switching between 'outside' and 'lab'
  useEffect(() => {
    if (worldMode === 'outside') {
      setActiveCategoryId('battery');
      setSelectedEntryId('solar-panel');
    } else if (LAB_EXCLUDED_ENTRY_IDS.has(selectedEntryId)) {
      setSelectedEntryId('battery-aa');
    }
  }, [worldMode, selectedEntryId]);

  const categories = useMemo(() => {
    if (worldMode === 'outside') {
      return PALETTE_CATEGORIES.filter((cat) => cat.id === 'battery');
    }
    return PALETTE_CATEGORIES;
  }, [worldMode]);

  const visibleEntries = useMemo(() => {
    const rawEntries = getEntriesByCategory(
      worldMode === 'outside' ? 'battery' : activeCategoryId
    );
    if (worldMode === 'outside') {
      return rawEntries.filter((entry) => OUTDOOR_ALLOWED_ENTRY_IDS.has(entry.id));
    }
    return rawEntries
      .filter((entry) => !LAB_EXCLUDED_ENTRY_IDS.has(entry.id))
      .map((entry): PaletteEntry => {
        if (entry.id === 'transmission-tower') {
          return {
            ...entry,
            label: 'Panel Distribusi Lab',
            labelEn: 'Lab Distribution Panel',
            hint: 'Box penerima listrik dari Menara Transmisi luar ke meja Lab lengkap dengan kWh Meter, proteksi MCB anti-korsleting, dan penurun tegangan (Step-Down DC).',
            hintEn:
              'Wall distribution box receiving outdoor Transmission Tower power into the Lab with a digital meter, short-circuit MCB breaker, and DC Step-Down regulator.',
            spec: 'MCB · Step-Down',
            image: undefined,
            glyph: 'distribution-panel',
          };
        }
        return entry;
      });
  }, [activeCategoryId, worldMode]);

  const countByCategory = useMemo(() => {
    if (worldMode === 'outside') {
      return { battery: visibleEntries.length };
    }
    return LAB_COUNT_BY_CATEGORY;
  }, [worldMode, visibleEntries.length]);

  const selectedEntry: PaletteEntry | undefined =
    visibleEntries.find((entry) => entry.id === selectedEntryId) ?? visibleEntries[0];

  const changeCategory = useCallback((nextCategoryId: PaletteCategoryId) => {
    setActiveCategoryId(nextCategoryId);
    setSelectedEntryId(getEntriesByCategory(nextCategoryId)[0]?.id ?? '');
  }, []);

  const selectEntry = useCallback((entry: PaletteEntry) => {
    if (getPaletteEntry(entry.id)) setSelectedEntryId(entry.id);
  }, []);

  return {
    categories,
    countByCategory,
    activeCategoryId: worldMode === 'outside' ? 'battery' : activeCategoryId,
    visibleEntries,
    selectedEntry,
    changeCategory,
    selectEntry,
  };
}
