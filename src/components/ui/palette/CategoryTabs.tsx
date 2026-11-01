import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
 * Horizontally scrollable category tabs with full desktop mouse-wheel conversion,
 * tactile left/right navigation chevrons, and drag-to-scroll support.
 *
 * Solves the desktop "stuck scroll" issue where standard vertical mouse wheels
 * cannot scroll native horizontal overflow containers without Shift.
 *
 * Time Complexity:
 * - Render: O(C) for C categories
 * - Wheel / Scroll calculation: O(1) constant time
 */
export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategoryId,
  countByCategory,
  language,
  ariaLabel,
  onChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Mouse drag-to-scroll state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  /**
   * Updates indicator flags for left/right scroll affordance.
   * Time Complexity: O(1).
   */
  const updateScrollIndicators = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < maxScroll - 4);
  }, []);

  // Check scroll bounds on mount, category changes, and window resize
  useEffect(() => {
    updateScrollIndicators();
    const handleResize = () => updateScrollIndicators();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateScrollIndicators, categories]);

  // Keep the active tab scrolled into view smoothly
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeCategoryId]);

  // Translate vertical mouse-wheel events to horizontal scrolling on desktop
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // If there is horizontal overflow, convert vertical wheel (deltaY) into horizontal scrolling
      if (el.scrollWidth > el.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
        updateScrollIndicators();
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [updateScrollIndicators]);

  /**
   * Smoothly scrolls the tab strip horizontally by a specific delta in pixels.
   * Time Complexity: O(1).
   */
  const scrollByDelta = (delta: number) => {
    const el = containerRef.current;
    if (el) {
      el.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  /**
   * Handles mouse-drag to scroll on desktop devices.
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.4;
    el.scrollLeft = scrollLeftRef.current - walk;
    updateScrollIndicators();
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="relative group border-b border-white/10 bg-void-950/40 select-none">
      {/* Left Scroll Chevron (Desktop & Tablet) */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByDelta(-140)}
          aria-label={language === 'id' ? 'Gulir kategori ke kiri' : 'Scroll categories left'}
          className="absolute left-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-r from-void-950 via-void-950/90 to-transparent text-slate-300 hover:text-white transition-all active:scale-90 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 drop-shadow" />
        </button>
      )}

      {/* Main Tab Strip */}
      <div
        ref={containerRef}
        role="tablist"
        aria-label={ariaLabel}
        onScroll={updateScrollIndicators}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className="flex gap-1.5 overflow-x-auto px-3 py-2 scroll-smooth cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
      >
        {categories.map((category) => {
          const isActive = category.id === activeCategoryId;
          return (
            <button
              key={category.id}
              ref={isActive ? activeTabRef : null}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(category.id)}
              className={`shrink-0 flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-semibold transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-400 cursor-pointer ${
                isActive
                  ? 'bg-electric-500/15 border-electric-500/60 text-electric-400 shadow-sm'
                  : 'bg-void-950/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-slate-100'
              }`}
            >
              <span>{language === 'id' ? category.label : category.labelEn}</span>
              <span
                className={`font-mono text-[10px] px-1 py-0.2 rounded ${
                  isActive
                    ? 'text-electric-300 bg-electric-500/20 font-bold'
                    : 'text-slate-400 bg-white/5'
                }`}
              >
                {countByCategory[category.id] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right Scroll Chevron (Desktop & Tablet) */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByDelta(140)}
          aria-label={language === 'id' ? 'Gulir kategori ke kanan' : 'Scroll categories right'}
          className="absolute right-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-l from-void-950 via-void-950/90 to-transparent text-slate-300 hover:text-white transition-all active:scale-90 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 drop-shadow" />
        </button>
      )}
    </div>
  );
};
