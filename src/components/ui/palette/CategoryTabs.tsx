import React from 'react';
import { PaletteCategory, PaletteCategoryId } from '../../../constants/componentCatalog';

interface CategoryTabsProps {
  categories: readonly PaletteCategory[];
  activeCategoryId: PaletteCategoryId;
  countByCategory: Readonly<Record<string, number>>;
  language: 'id' | 'en';
  ariaLabel: string;
  onChange: (categoryId: PaletteCategoryId) => void;
}

/**
 * Horizontally scrollable category tabs (Baterai, Lampu, ...). Scrolls instead of wrapping,
 * so it stays one compact row on phones no matter how many categories are added later.
 *
 * Time Complexity: O(C) render for C categories.
 */
export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategoryId,
  countByCategory,
  language,
  ariaLabel,
  onChange,
}) => (
  <div
    role="tablist"
    aria-label={ariaLabel}
    className="flex gap-1.5 overflow-x-auto px-3 py-2 border-b border-white/10 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
  >
    {categories.map((category) => {
      const isActive = category.id === activeCategoryId;
      return (
        <button
          key={category.id}
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => onChange(category.id)}
          className={`shrink-0 flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-semibold transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-400 ${
            isActive
              ? 'bg-electric-500/15 border-electric-500/60 text-electric-400'
              : 'bg-void-950/60 border-white/10 text-slate-300 hover:border-white/25'
          }`}
        >
          <span>{language === 'id' ? category.label : category.labelEn}</span>
          <span
            className={`font-mono text-[10px] ${isActive ? 'text-electric-400' : 'text-slate-400'}`}
          >
            {countByCategory[category.id] ?? 0}
          </span>
        </button>
      );
    })}
  </div>
);
