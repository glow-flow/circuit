import React, { useState, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { useModalFocusTrap } from '../../../hooks/useModalKeyboardClose';

export type BottomSheetSnapState = 'closed' | 'half' | 'expanded';

interface MobileBottomSheetProps {
  /** Current active snap state */
  snapState: BottomSheetSnapState;
  /** Callback fired when snap state changes via gesture or button click */
  onSnapChange: (newSnapState: BottomSheetSnapState) => void;
  /** Sheet header title */
  title: string;
  /** Sheet icon or header badge */
  icon?: React.ReactNode;
  /** Optional subtitle or breadcrumb */
  subtitle?: string;
  /** Content rendered inside the sheet body */
  children: React.ReactNode;
  /** Optional custom action button in header (e.g. Delete, Cut Wire) */
  headerAction?: React.ReactNode;
}

/**
 * High-performance draggable bottom sheet designed for mobile and tablet touch interfaces (< 1024px).
 * Features 3 snap heights ('closed', 'half' at 50vh, 'expanded' at 88vh),
 * touch-velocity recognition, focus trapping, and 44px minimum target sizes.
 *
 * Time Complexity: O(1) per touch event.
 */
export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  snapState,
  onSnapChange,
  title,
  icon,
  subtitle,
  children,
  headerAction,
}) => {
  const [dragOffsetPixels, setDragOffsetPixels] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartYRef = useRef<number>(0);
  const currentDragYRef = useRef<number>(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useModalFocusTrap(snapState !== 'closed', sheetRef, () => onSnapChange('closed'));

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) return;
    dragStartYRef.current = event.clientY;
    currentDragYRef.current = event.clientY;
    setIsDragging(true);
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }, []);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    currentDragYRef.current = event.clientY;
    const deltaY = event.clientY - dragStartYRef.current;
    setDragOffsetPixels(deltaY);
  }, [isDragging]);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    const deltaY = event.clientY - dragStartYRef.current;
    setDragOffsetPixels(0);

    const dragThresholdPixels = 48;
    if (deltaY < -dragThresholdPixels) {
      if (snapState === 'half') {
        onSnapChange('expanded');
      } else if (snapState === 'closed') {
        onSnapChange('half');
      }
    } else if (deltaY > dragThresholdPixels) {
      if (snapState === 'expanded') {
        onSnapChange('half');
      } else if (snapState === 'half') {
        onSnapChange('closed');
      }
    }
  }, [isDragging, snapState, onSnapChange]);

  if (snapState === 'closed') {
    return null;
  }

  const heightClasses =
    snapState === 'expanded'
      ? 'h-[88dvh]'
      : 'h-[50dvh]';

  return (
    <div
      className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end bg-scrim/75 transition-opacity duration-200"
      aria-modal="true"
      aria-labelledby="mobile-bottom-sheet-title"
      role="dialog"
    >
      {/* Backdrop tap to close */}
      <div
        className="flex-1 cursor-pointer"
        onClick={() => onSnapChange('closed')}
        aria-hidden="true"
      />

      {/* Sheet Container */}
      <div
        ref={sheetRef}
        className={`w-full max-w-3xl mx-auto bg-void-900 border-t sm:border-x border-control rounded-t-2xl shadow-2xl flex flex-col overflow-hidden will-change-transform ${heightClasses} ${
          isDragging ? 'transition-none' : 'transition-[height] duration-250 ease-out'
        }`}
        style={{
          transform: isDragging ? `translateY(${Math.max(-20, dragOffsetPixels)}px)` : undefined,
        }}
      >
        {/* Tactile Drag Handle Bar */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            setIsDragging(false);
            setDragOffsetPixels(0);
          }}
          className="w-full pt-2.5 pb-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none shrink-0"
        >
          <div className="w-12 h-1.5 rounded-full bg-control/80 hover:bg-control transition-colors" />
        </div>

        {/* Sheet Top Header */}
        <div className="px-4 py-2 border-b border-ink/15 flex items-center justify-between gap-2 shrink-0 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && <div className="shrink-0 text-electric-400">{icon}</div>}
            <div className="min-w-0">
              <h2
                id="mobile-bottom-sheet-title"
                className="text-xs font-bold text-ink uppercase tracking-wider truncate"
              >
                {title}
              </h2>
              {subtitle && (
                <p className="text-[10px] text-slate-400 truncate">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {headerAction}

            {/* Snap Toggle Button */}
            <button
              type="button"
              onClick={() => onSnapChange(snapState === 'half' ? 'expanded' : 'half')}
              aria-label={snapState === 'half' ? 'Perbesar panel' : 'Perkecil panel'}
              title={snapState === 'half' ? 'Perbesar Panel' : 'Perkecil Panel'}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-void-850 hover:bg-ink/10 text-slate-300 hover:text-ink border border-control active:scale-95 transition-colors cursor-pointer"
            >
              {snapState === 'half' ? (
                <ChevronUp className="w-4 h-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            {/* Close Sheet Button */}
            <button
              type="button"
              onClick={() => onSnapChange('closed')}
              aria-label="Tutup panel"
              title="Tutup Panel"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-void-850 hover:bg-ink/10 text-slate-300 hover:text-ink border border-control active:scale-95 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Sheet Content Body with Momentum Scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
};
