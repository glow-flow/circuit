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
      <div className="shrink-0 border-t border-white/10 bg-void-950/98 p-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-md z-30">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-white tracking-tight truncate flex items-center gap-1.5">
              <span>{displayLabel}</span>
              <span className="font-mono text-[10px] text-electric-400 font-semibold">{entry.spec}</span>
            </h3>
            <p className="text-[11px] leading-tight text-slate-300 truncate">{displayHint}</p>
          </div>
          {entry.standardBadge && (
            <span className="shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-400/25 text-emerald-300">
              {entry.standardBadge}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onPlace(entry)}
          className="w-full h-11 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all duration-150 active:scale-95 shadow-md cursor-pointer"
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
          className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-400/25 text-[10px] font-mono text-emerald-300 truncate max-w-full"
          title={entry.datasheetSource}
        >
          <span className="shrink-0">📚</span>
          <span className="truncate">{entry.standardBadge}</span>
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
