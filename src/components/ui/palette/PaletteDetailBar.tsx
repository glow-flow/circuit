import React from 'react';
import { PlusCircle } from 'lucide-react';
import { PaletteEntry } from '../../../constants/componentCatalog';

interface PaletteDetailBarProps {
  entry: PaletteEntry | undefined;
  displayLabel: string;
  displayHint: string;
  placeLabel: string;
  dragHint?: string;
  onPlace: (entry: PaletteEntry) => void;
  isMobileDrawer?: boolean;
}

/**
 * Bottom strip that explains the selected part in one plain sentence and holds the
 * primary action ("Taruh di Kanvas").
 * Always visible at the bottom of the drawer on mobile with 44px+ touch target.
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
  isMobileDrawer = false,
}) => {
  if (!entry) return null;

  if (isMobileDrawer) {
    return (
      <div className="shrink-0 border-t border-white/10 bg-void-950/98 px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl z-30">
        <div className="mb-2 space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-xs font-bold text-white tracking-tight truncate flex items-center gap-1.5">
              <span>{displayLabel}</span>
              <span className="font-mono text-[10px] text-electric-400 font-semibold">{entry.spec}</span>
            </h3>
            {entry.standardBadge && (
              <span className="shrink-0 text-[10px] font-mono text-slate-400 truncate max-w-[48%]">
                {entry.standardBadge}
              </span>
            )}
          </div>
          <p className="text-[11px] leading-snug text-slate-300 line-clamp-2">{displayHint}</p>
        </div>
        <button
          type="button"
          onClick={() => onPlace(entry)}
          className="w-full h-11 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-white shrink-0" />
          <span className="truncate">Taruh {displayLabel} ke Kanvas</span>
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-white/10 bg-void-950/70 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-white tracking-tight truncate">{displayLabel}</h3>
        <span className="shrink-0 font-mono text-[11px] text-electric-400">{entry.spec}</span>
      </div>
      <p className="mt-1 text-xs leading-snug text-slate-300 min-h-[2.25rem]">{displayHint}</p>
      {entry.standardBadge && (
        <div
          className="mt-1.5 text-[10px] font-mono text-slate-400 truncate max-w-full"
          title={entry.datasheetSource}
        >
          {entry.standardBadge}
        </div>
      )}
      <button
        type="button"
        onClick={() => onPlace(entry)}
        className="mt-2.5 w-full h-11 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-sm font-bold transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-400 focus-visible:ring-offset-2 focus-visible:ring-offset-void-900 cursor-pointer"
      >
        {placeLabel}
      </button>
      {dragHint && <p className="mt-1.5 text-center text-[11px] text-slate-400">{dragHint}</p>}
    </div>
  );
};
