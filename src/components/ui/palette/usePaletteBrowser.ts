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

/** Entry count per category in Lab mode, computed once (catalog is static). O(N). */
const LAB_COUNT_BY_CATEGORY: Readonly<Record<string, number>> = PALETTE_ENTRIES.reduce<
  Record<string, number>
>((counts, entry) => {
  counts[entry.category] = (counts[entry.category] ?? 0) + 1;
  return counts;
}, {});

/**
 * UI state for the component box: which category is open and which part is selected.
 * In `worldMode === 'outside'`, filters strictly to Outdoor Power & Grid items
 * (`solar-panel`, `wind-turbine`, `transmission-tower`) so indoor lab items are hidden.
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

  // When switching to 'outside', force category to 'battery' (Sumber Energi Alam)
  useEffect(() => {
    if (worldMode === 'outside') {
      setActiveCategoryId('battery');
      setSelectedEntryId('solar-panel');
    }
  }, [worldMode]);

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
    return rawEntries;
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
