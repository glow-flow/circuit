import React from 'react';
import { X } from 'lucide-react';

export interface LabModalHeaderProps {
  /** Primary modal title */
  title: string;
  /** Optional concise subtitle or description */
  subtitle?: string;
  /** Optional monochrome technical eyebrow label (e.g. "SMPN 12 SURABAYA") */
  eyebrow?: string;
  /** Optional HTML id for aria-labelledby binding */
  titleId?: string;
  /** Optional right-side control slot (e.g. tab switcher) rendered before Close button */
  rightSlot?: React.ReactNode;
  /** Close callback */
  onClose: () => void;
  /** Accessible label for the close button */
  closeLabel?: string;
}

/**
 * Shared industrial header for laboratory modals (`LabModalHeader`).
 *
 * Eliminates duplicated modal header markup (DRY) and replaces AI-slop glowing icon boxes
 * and redundant capsule badges with clean typographic hierarchy and a 44x44px WCAG AA close button.
 *
 * @param props - Header title, optional subtitle/eyebrow, right-side slot, and close handler
 * @returns Header element with O(1) render complexity
 */
export const LabModalHeader: React.FC<LabModalHeaderProps> = ({
  title,
  subtitle,
  eyebrow,
  titleId,
  rightSlot,
  onClose,
  closeLabel = 'Tutup',
}) => {
  return (
    <header className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/10 bg-void-950 flex items-center justify-between gap-3 shrink-0">
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-0.5 truncate">
            {eyebrow}
          </div>
        )}
        <h2
          id={titleId}
          className="text-base sm:text-lg font-bold tracking-tight text-white leading-[1.15] pb-0.5 truncate"
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 sm:line-clamp-1 leading-snug">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {rightSlot}
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-400 cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};
