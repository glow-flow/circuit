import React from 'react';
import { Info, X } from 'lucide-react';
import { PALETTE_DRAG_MIME, PaletteEntry } from '../../constants/componentCatalog';
import { useCircuitStore } from '../../store/useCircuitStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { CategoryTabs } from './palette/CategoryTabs';
import { PaletteDetailBar } from './palette/PaletteDetailBar';
import { PaletteTile } from './palette/PaletteTile';
import { usePaletteBrowser } from './palette/usePaletteBrowser';

interface SidebarPaletteProps {
  isMobileDrawer?: boolean;
  onCloseMobile?: () => void;
}

/**
 * "Kotak Komponen": category tabs → image tiles → detail strip with the place action.
 * One shared body renders both the desktop sidebar and the mobile bottom sheet (DRY);
 * only the shell (width, columns, close button) differs.
 *
 * Time Complexity: O(E) render for E entries in the open category.
 */
export const SidebarPalette: React.FC<SidebarPaletteProps> = ({
  isMobileDrawer = false,
  onCloseMobile,
}) => {
  const addComponent = useCircuitStore((state) => state.addComponent);
  const language = useCircuitStore((state) => state.language);
  const t = TRANSLATIONS[language].palette;
  const isIndonesian = language === 'id';

  const {
    categories,
    countByCategory,
    activeCategoryId,
    visibleEntries,
    selectedEntry,
    changeCategory,
    selectEntry,
  } = usePaletteBrowser();

  const pickLabel = (entry: PaletteEntry) => (isIndonesian ? entry.label : entry.labelEn);
  const pickHint = (entry: PaletteEntry) => (isIndonesian ? entry.hint : entry.hintEn);

  const handleDragStart = (event: React.DragEvent, entry: PaletteEntry) => {
    event.dataTransfer.setData(PALETTE_DRAG_MIME, entry.id);
    event.dataTransfer.effectAllowed = 'move';
    selectEntry(entry);
  };

  const handlePlace = (entry: PaletteEntry) => {
    const offsetX = 200 + Math.floor(Math.random() * 120);
    const offsetY = 120 + Math.floor(Math.random() * 120);
    addComponent(entry.type, { x: offsetX, y: offsetY }, entry.placement);
    if (isMobileDrawer && onCloseMobile) {
      onCloseMobile();
    }
  };

  const body = (
    <>
      <CategoryTabs
        categories={categories}
        activeCategoryId={activeCategoryId}
        countByCategory={countByCategory}
        language={language}
        ariaLabel={t.categoriesLabel}
        onChange={changeCategory}
      />

      <div
        role="listbox"
        className={`flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 grid gap-2 content-start ${
          isMobileDrawer ? 'grid-cols-3' : 'grid-cols-2'
        }`}
      >
        {visibleEntries.length === 0 ? (
          <p className="col-span-full py-8 text-center text-xs text-slate-400">
            {t.emptyCategory}
          </p>
        ) : (
          visibleEntries.map((entry) => (
            <PaletteTile
              key={entry.id}
              entry={entry}
              displayLabel={pickLabel(entry)}
              isSelected={entry.id === selectedEntry?.id}
              isDraggable={!isMobileDrawer}
              onSelect={selectEntry}
              onPlace={handlePlace}
              onDragStart={handleDragStart}
            />
          ))
        )}
      </div>

      <PaletteDetailBar
        entry={selectedEntry}
        displayLabel={selectedEntry ? pickLabel(selectedEntry) : ''}
        displayHint={selectedEntry ? pickHint(selectedEntry) : ''}
        placeLabel={t.placeBtn}
        dragHint={isMobileDrawer ? undefined : t.dragHint}
        onPlace={handlePlace}
      />
    </>
  );

  if (isMobileDrawer) {
    return (
      <div
        id="tour-panel-komponen"
        className="flex flex-col h-[min(78dvh,620px)] bg-void-900 border-t border-white/15 rounded-t-2xl shadow-2xl select-none overflow-hidden"
      >
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-100 tracking-tight">{t.title}</h2>
            <p className="text-[11px] text-slate-400">{t.subtitleMobile}</p>
          </div>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-void-850 text-slate-400 hover:text-white border border-white/10 active:scale-95"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {body}
      </div>
    );
  }

  const desktopPanelId =
    typeof window !== 'undefined' && window.innerWidth < 768
      ? undefined
      : 'tour-panel-komponen';

  return (
    <aside
      id={desktopPanelId}
      className="hidden md:flex w-72 bg-void-900 border-r border-white/10 flex-col h-full shrink-0 select-none"
    >
      <div className="px-3.5 pt-3.5 pb-2">
        <h2 className="text-sm font-bold text-slate-100 tracking-tight">{t.title}</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">{t.subtitleDesktop}</p>
      </div>

      {body}

      {/* Quick tips: hidden on short laptop screens so the tiles keep the space */}
      <div className="hidden [@media(min-height:780px)]:block p-3 border-t border-white/10 bg-void-950/50 space-y-1.5">
        <div className="flex items-start gap-2 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-electric-400 shrink-0 mt-0.5" />
          <span>{t.tipConnect}</span>
        </div>
        <div className="text-[11px] text-sky-300/90 pl-5 leading-tight">{t.tipWaypoint}</div>
      </div>
    </aside>
  );
};
