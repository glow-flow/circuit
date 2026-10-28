import { useCallback, useMemo, useState } from 'react';
import {
  PALETTE_CATEGORIES,
  PALETTE_ENTRIES,
  PaletteCategoryId,
  PaletteEntry,
  getEntriesByCategory,
  getPaletteEntry,
} from '../../../constants/componentCatalog';

/** Entry count per category, computed once (catalog is static). O(N). */
const COUNT_BY_CATEGORY: Readonly<Record<string, number>> = PALETTE_ENTRIES.reduce<
  Record<string, number>
>((counts, entry) => {
  counts[entry.category] = (counts[entry.category] ?? 0) + 1;
  return counts;
}, {});

/**
 * UI state for the component box: which category is open and which part is selected.
 * Switching category auto-selects its first part so the "place" button is never dead.
 *
 * Time Complexity: O(1) per interaction (hash-map lookups in the catalog).
 */
export function usePaletteBrowser() {
  const firstCategoryId = PALETTE_CATEGORIES[0].id;
  const [activeCategoryId, setActiveCategoryId] = useState<PaletteCategoryId>(firstCategoryId);
  const [selectedEntryId, setSelectedEntryId] = useState<string>(
    getEntriesByCategory(firstCategoryId)[0]?.id ?? ''
  );

  const visibleEntries = useMemo(
    () => getEntriesByCategory(activeCategoryId),
    [activeCategoryId]
  );

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
    categories: PALETTE_CATEGORIES,
    countByCategory: COUNT_BY_CATEGORY,
    activeCategoryId,
    visibleEntries,
    selectedEntry,
    changeCategory,
    selectEntry,
  };
}
