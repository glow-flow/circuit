import React from 'react';
import { PaletteEntry } from '../../../constants/componentCatalog';

interface PaletteDetailBarProps {
  entry: PaletteEntry | undefined;
  displayLabel: string;
  displayHint: string;
  placeLabel: string;
  dragHint?: string;
  onPlace: (entry: PaletteEntry) => void;
}

/**
 * Bottom strip that explains the selected part in one plain sentence and holds the
 * single primary action ("Taruh di kanvas"). 44px+ touch target for phones.
 *
 * Time Complexity: O(1) render.
 */
export const PaletteDetailBar: React.FC<PaletteDetailBarProps> = ({
  entry,
  displayLabel,
  displayHint,
  placeLabel,
  dragHint,
  onPlace,
}) => {
  if (!entry) return null;

  return (
    <div className="border-t border-white/10 bg-void-950/70 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-white tracking-tight truncate">{displayLabel}</h3>
        <span className="shrink-0 font-mono text-[11px] text-electric-400">{entry.spec}</span>
      </div>
      <p className="mt-1 text-xs leading-snug text-slate-300 min-h-[2.25rem]">{displayHint}</p>
      <button
        type="button"
        onClick={() => onPlace(entry)}
        className="mt-2.5 w-full h-11 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-sm font-bold transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-400 focus-visible:ring-offset-2 focus-visible:ring-offset-void-900"
      >
        {placeLabel}
      </button>
      {dragHint && <p className="mt-1.5 text-center text-[11px] text-slate-400">{dragHint}</p>}
    </div>
  );
};
