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
  onSelect: (entry: PaletteEntry) => void;
  onPlace: (entry: PaletteEntry) => void;
  onDragStart: (event: React.DragEvent, entry: PaletteEntry) => void;
}

const BLUEPRINT_DOT_GRID: React.CSSProperties = {
  backgroundImage: 'radial-gradient(rgba(148,163,184,0.16) 1px, transparent 1px)',
  backgroundSize: '9px 9px',
};

/**
 * One "specimen plate" in the component box: the real part image (or textbook symbol)
 * on a blueprint-dot stage, a mono spec tag, and the part name.
 * On mobile: tap selects, tap again or tap '+' button places directly on canvas.
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
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      draggable={isDraggable}
      onDragStart={(event) => onDragStart(event, entry)}
      onClick={handleClick}
      onDoubleClick={() => onPlace(entry)}
      className={`group relative text-left rounded-xl border p-1.5 transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-400 ${
        isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${
        isSelected
          ? 'border-electric-500 bg-electric-500/10 shadow-md ring-1 ring-electric-500/30'
          : 'border-white/10 bg-void-950/60 hover:border-white/25'
      }`}
    >
      {/* Quick Add '+' Button for Mobile Touchscreen */}
      {isMobileDrawer && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onPlace(entry);
          }}
          title="Pasang ke Kanvas"
          className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-electric-600 hover:bg-electric-500 text-white flex items-center justify-center text-xs font-bold shadow-md active:scale-90 transition-transform cursor-pointer"
        >
          +
        </span>
      )}

      <div
        className="relative aspect-square rounded-lg bg-void-950 overflow-hidden flex items-center justify-center"
        style={BLUEPRINT_DOT_GRID}
      >
        {entry.image && !hasImageFailed ? (
          <img
            src={entry.image}
            alt=""
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
          <ComponentGlyph glyph={entry.glyph} className="w-[62%] h-[62%] text-slate-200" />
        ) : (
          <span className="text-xl font-mono text-slate-500" aria-hidden="true">
            ?
          </span>
        )}

        <span className="absolute left-1 bottom-1 max-w-[calc(100%-8px)] truncate px-1.5 py-0.5 rounded bg-void-900/90 border border-white/10 text-[10px] leading-none font-mono text-slate-200">
          {entry.spec}
        </span>
      </div>

      <div
        className={`mt-1.5 px-0.5 text-[12px] leading-tight font-semibold truncate ${
          isSelected ? 'text-white' : 'text-slate-200'
        }`}
      >
        {displayLabel}
      </div>
    </button>
  );
};
