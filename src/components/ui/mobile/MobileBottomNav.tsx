import React from 'react';
import {
  BookOpen,
  ClipboardCheck,
  PlusCircle,
  Sliders,
} from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';

export interface MobileBottomNavProps {
  /** Currently open mobile bottom sheet ('none' | 'palette' | 'inspector'). */
  activeMobileSheet: 'none' | 'palette' | 'inspector';
  /** Opens either the Component Palette ('palette') or Inspector ('inspector') drawer. */
  onOpenMobileSheet: (sheet: 'palette' | 'inspector') => void;
}

/**
 * Clean 4-tab mobile bottom navigation (`+ Alat`, `Tugas`, `Contoh`, `Ukur`).
 * Generous tap targets with zero truncated subtitles; secondary tools live in the top-right Menu.
 */
export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeMobileSheet,
  onOpenMobileSheet,
}) => {
  const language = useCircuitStore((state) => state.language);
  const worldMode = useCircuitStore((state) => state.worldMode);
  const selectedNodeId = useCircuitStore((state) => state.selectedNodeId);
  const activeModal = useCircuitStore((state) => state.activeModal);
  const setActiveModal = useCircuitStore((state) => state.setActiveModal);
  const openLkpdModal = useCircuitStore((state) => state.openLkpdModal);

  const isId = language === 'id';
  const isOutdoor = worldMode === 'outside';
  const isTasksOpen = activeModal === 'lkpd' || activeModal === 'missions';

  return (
    <nav
      aria-label={isId ? 'Navigasi Utama Bawah' : 'Primary Bottom Navigation'}
      className="tour-mobile-nav lg:hidden min-h-[60px] bg-void-950 border-t border-ink/15 px-2 sm:px-4 py-1.5 z-30 shrink-0 select-none"
    >
      <div className="max-w-xl mx-auto grid grid-cols-4 gap-1.5 sm:gap-2">
        {/* 1. + Alat / + EBT */}
        <button
          id="tour-btn-tambah"
          type="button"
          onClick={() => onOpenMobileSheet('palette')}
          className={`min-w-0 min-h-[48px] px-2 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors active:scale-95 cursor-pointer border ${
            activeMobileSheet === 'palette'
              ? 'bg-electric-600 text-white border-electric-700 font-bold'
              : 'bg-void-900 text-ink border-control/70 hover:bg-void-850 font-semibold'
          }`}
        >
          <PlusCircle
            className={`w-4 h-4 shrink-0 ${
              activeMobileSheet === 'palette' ? 'text-white' : 'text-electric-400'
            }`}
            aria-hidden="true"
          />
          <span className="text-[11px] leading-none truncate">
            {isOutdoor ? (isId ? '+ EBT' : '+ Gen') : isId ? '+ Alat' : '+ Parts'}
          </span>
        </button>

        {/* 2. Tugas (Unified 5 Lab Tasks + LKPD + Mode Guru) */}
        <button
          type="button"
          onClick={() => openLkpdModal({ tab: 'student' })}
          className={`min-w-0 min-h-[48px] px-2 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors active:scale-95 cursor-pointer border ${
            isTasksOpen
              ? 'bg-electric-600 text-white border-electric-700 font-bold'
              : 'bg-void-900 text-ink border-control/70 hover:bg-void-850 font-semibold'
          }`}
        >
          <ClipboardCheck
            className={`w-4 h-4 shrink-0 ${
              isTasksOpen ? 'text-white' : 'text-amber-400'
            }`}
            aria-hidden="true"
          />
          <span className="text-[11px] leading-none truncate">
            {isId ? 'Tugas' : 'Labs'}
          </span>
        </button>

        {/* 3. Contoh (5 Ready-to-Use Circuits) */}
        <button
          id="tour-btn-galeri"
          type="button"
          onClick={() => setActiveModal('gallery')}
          className={`min-w-0 min-h-[48px] px-2 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors active:scale-95 cursor-pointer border ${
            activeModal === 'gallery'
              ? 'bg-electric-600 text-white border-electric-700 font-bold'
              : 'bg-void-900 text-ink border-control/70 hover:bg-void-850 font-semibold'
          }`}
        >
          <BookOpen
            className={`w-4 h-4 shrink-0 ${
              activeModal === 'gallery' ? 'text-white' : 'text-emerald-400'
            }`}
            aria-hidden="true"
          />
          <span className="text-[11px] leading-none truncate">
            {isId ? 'Contoh' : 'Presets'}
          </span>
        </button>

        {/* 4. Ukur (Inspector, PLN, Tutor Rumus & Oscilloscope) */}
        <button
          id="tour-btn-info"
          type="button"
          onClick={() => onOpenMobileSheet('inspector')}
          className={`min-w-0 min-h-[48px] px-2 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors active:scale-95 cursor-pointer border ${
            activeMobileSheet === 'inspector' || Boolean(selectedNodeId)
              ? 'bg-electric-600 text-white border-electric-700 font-bold'
              : 'bg-void-900 text-ink border-control/70 hover:bg-void-850 font-semibold'
          }`}
        >
          <Sliders
            className={`w-4 h-4 shrink-0 ${
              activeMobileSheet === 'inspector' || Boolean(selectedNodeId)
                ? 'text-white'
                : 'text-electric-400'
            }`}
            aria-hidden="true"
          />
          <span className="text-[11px] leading-none truncate">
            {isId ? 'Ukur' : 'Measure'}
          </span>
        </button>
      </div>
    </nav>
  );
};
