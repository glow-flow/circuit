import React, { useState } from 'react';
import { PaletteEntry } from '../../../constants/componentCatalog';
import { ComponentGlyph } from './ComponentGlyph';

interface PaletteTileProps {
  entry: PaletteEntry;
  displayLabel: string;
  isSelected: boolean;
  /** Desktop only: HTML5 drag-and-drop does not work reliably with touch. */
  isDraggable: boolean;
  isMobileDrawer?: boolean;
  quickPlaceLabel?: string;
  onSelect: (entry: PaletteEntry) => void;
  onPlace: (entry: PaletteEntry) => void;
  onDragStart: (event: React.DragEvent, entry: PaletteEntry) => void;
}

/**
 * One hardware specimen plate in the component box: renders the physical hardware asset
 * (with textbook schematic symbol as resilient fallback), spec tag, and part name.
 * On mobile/tablet drawer: tap selects, tap again or tap sibling '+' button places on canvas.
 * On desktop: click selects; double-click or drag places.
 *
 * Time Complexity: O(1) render.
 */
export const PaletteTile: React.FC<PaletteTileProps> = ({
  entry,
  displayLabel,
  isSelected,
  isDraggable,
  isMobileDrawer = false,
  quickPlaceLabel,
  onSelect,
  onPlace,
  onDragStart,
}) => {
  const [hasImageFailed, setHasImageFailed] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobileDrawer && isSelected) {
      onPlace(entry);
    } else {
      onSelect(entry);
    }
  };

  return (
    <div className="relative group">
      <button
        type="button"
        role="option"
        aria-selected={isSelected}
        draggable={isDraggable}
        onDragStart={(event) => onDragStart(event, entry)}
        onClick={handleClick}
        onDoubleClick={() => onPlace(entry)}
        className={`w-full text-left rounded-xl border p-1.5 transition-colors duration-150 active:scale-95 ${
          isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
        } ${
          isSelected
            ? 'border-electric-500 bg-electric-500/15 ring-1 ring-electric-500/40'
            : 'border-control/55 bg-void-950 hover:border-control'
        }`}
      >
        <div className="relative aspect-square rounded-lg bg-void-900 border border-ink/10 overflow-hidden flex items-center justify-center">
          {entry.image && !hasImageFailed ? (
            <img
              src={entry.image}
              alt=""
              width={96}
              height={96}
              loading="lazy"
              draggable={false}
              onError={() => setHasImageFailed(true)}
              className={`pointer-events-none select-none object-contain transition-transform duration-200 group-hover:scale-105 ${
                entry.imageRotated
                  ? 'absolute left-1/2 top-1/2 w-[78%] h-[36%] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90'
                  : 'w-[82%] h-[82%]'
              }`}
            />
          ) : entry.glyph ? (
            <ComponentGlyph glyph={entry.glyph} className="w-[62%] h-[62%] text-ink" />
          ) : (
            <span className="text-xl font-mono text-slate-400" aria-hidden="true">
              ?
            </span>
          )}

          <span className="absolute left-1 bottom-1 max-w-[calc(100%-8px)] truncate px-1.5 py-0.5 rounded bg-void-950 border border-ink/15 text-[10px] leading-none font-mono font-semibold text-ink tabular-nums">
            {entry.spec}
          </span>
        </div>

        <div
          className={`mt-1.5 px-0.5 text-[12px] leading-tight font-semibold truncate ${
            isSelected ? 'text-ink font-bold' : 'text-slate-200'
          }`}
        >
          {displayLabel}
        </div>
      </button>

      {/* Independent Sibling Quick-Add '+' Button for Touchscreens (>= 44px target, zero nested buttons) */}
      {isMobileDrawer && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPlace(entry);
          }}
          aria-label={quickPlaceLabel || `Pasang ${displayLabel} ke kanvas`}
          title={quickPlaceLabel || 'Pasang ke Kanvas'}
          className="absolute top-0 right-0 z-20 min-w-[44px] min-h-[44px] flex items-start justify-end p-2 cursor-pointer"
        >
          <span className="w-7 h-7 rounded-lg bg-electric-600 hover:bg-electric-500 text-white flex items-center justify-center text-sm font-bold shadow-sm transition-colors">
            +
          </span>
        </button>
      )}
    </div>
  );
};
