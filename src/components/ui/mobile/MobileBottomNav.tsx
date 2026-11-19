import React from 'react';
import {
  BookOpen,
  GraduationCap,
  Menu,
  PlusCircle,
  Sliders,
} from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';

export interface MobileBottomNavProps {
  /** Currently open mobile bottom sheet ('none' | 'palette' | 'inspector'). */
  activeMobileSheet: 'none' | 'palette' | 'inspector';
  /** Whether the 'Menu Lab' hub drawer is currently open. */
  isMobileHubOpen: boolean;
  /** Opens either the Component Palette ('palette') or Inspector ('inspector') drawer. */
  onOpenMobileSheet: (sheet: 'palette' | 'inspector') => void;
  /** Opens the 'Menu Lab' feature and settings drawer. */
  onOpenMobileHub: () => void;
}

/**
 * Option A Mobile Bottom Navigation Dock (`MobileBottomNav.tsx`).
 *
 * Replaces the crowded 6-tab icon bar and eliminates duplicate Gallery buttons
 * and the confusing "Menu 4.0" label. Provides 5 clearly labeled, high-contrast
 * classroom tabs with descriptive subtitles for non-digital teachers and students:
 * 1. `+ Alat` (Component Palette / Outdoor Generators)
 * 2. `Akademi` (Promoted to a first-class primary bottom tab)
 * 3. `Contoh` (Single canonical entry point for the 5 ready-to-teach circuits)
 * 4. `Rumus` (Live V/I/R Telemetry, Formulas & PLN Bill Calculator)
 * 5. `Menu Lab` (Organizes Missions, Oscilloscope, Tutor, Troubleshoot, Save, Share, Theme & Language)
 *
 * Time Complexity: O(1) render.
 */
export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeMobileSheet,
  isMobileHubOpen,
  onOpenMobileSheet,
  onOpenMobileHub,
}) => {
  const language = useCircuitStore((state) => state.language);
  const worldMode = useCircuitStore((state) => state.worldMode);
  const selectedNodeId = useCircuitStore((state) => state.selectedNodeId);
  const activeModal = useCircuitStore((state) => state.activeModal);
  const setActiveModal = useCircuitStore((state) => state.setActiveModal);

  const isId = language === 'id';
  const isOutdoor = worldMode === 'outside';

  return (
    <nav
      aria-label={isId ? 'Navigasi Utama Bawah' : 'Primary Bottom Navigation'}
      className="tour-mobile-nav lg:hidden min-h-[62px] bg-void-950 border-t border-ink/15 px-1.5 sm:px-4 py-1.5 z-30 shrink-0 select-none"
    >
      <div className="max-w-3xl mx-auto flex items-stretch justify-between gap-1 sm:gap-2">
        {/* 1. + Alat / + Pembangkit (Component Palette) */}
        <button
          id="tour-btn-tambah"
          type="button"
          onClick={() => onOpenMobileSheet('palette')}
          className={`flex-1 min-w-0 min-h-[48px] px-1 sm:px-2 py-1 flex flex-col items-center justify-center rounded-xl transition-colors active:scale-95 cursor-pointer border ${
            activeMobileSheet === 'palette'
              ? 'bg-electric-500/15 text-ink border-electric-500 shadow-sm'
              : 'bg-void-900 text-slate-200 border-control/60 hover:border-control hover:bg-void-850'
          }`}
        >
          <div className="flex items-center gap-1">
            <PlusCircle className="w-3.5 h-3.5 text-electric-400 shrink-0" aria-hidden="true" />
            <span className="text-[11px] font-bold tracking-tight truncate">
              {isOutdoor
                ? isId
                  ? '+ EBT'
                  : '+ Gen'
                : isId
                ? '+ Alat'
                : '+ Parts'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 truncate max-w-full leading-tight mt-0.5">
            {isOutdoor
              ? isId
                ? 'Pembangkit'
                : 'Generators'
              : isId
              ? 'Komponen'
              : 'Components'}
          </span>
        </button>

        {/* 2. Akademi (Promoted Primary Learning Tab) */}
        <button
          id="tour-btn-akademi"
          type="button"
          onClick={() => setActiveModal('academy')}
          className={`flex-1 min-w-0 min-h-[48px] px-1 sm:px-2 py-1 flex flex-col items-center justify-center rounded-xl transition-colors active:scale-95 cursor-pointer border ${
            activeModal === 'academy'
              ? 'bg-emerald-500/20 text-ink border-emerald-500 shadow-sm'
              : 'bg-emerald-950/35 text-emerald-200 border-emerald-500/50 hover:bg-emerald-950/55'
          }`}
        >
          <div className="flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
            <span className="text-[11px] font-bold tracking-tight truncate text-emerald-300">
              {isId ? 'Akademi' : 'Academy'}
            </span>
          </div>
          <span className="text-[10px] text-emerald-200 truncate max-w-full leading-tight mt-0.5">
            {isId ? 'Materi & Kuis' : 'Lessons & Quiz'}
          </span>
        </button>

        {/* 3. Contoh (Single Canonical Circuit Preset Gallery Button) */}
        <button
          id="tour-btn-galeri"
          type="button"
          onClick={() => setActiveModal('gallery')}
          className={`flex-1 min-w-0 min-h-[48px] px-1 sm:px-2 py-1 flex flex-col items-center justify-center rounded-xl transition-colors active:scale-95 cursor-pointer border ${
            activeModal === 'gallery'
              ? 'bg-amber-500/20 text-ink border-amber-500 shadow-sm'
              : 'bg-void-900 text-slate-200 border-control/60 hover:border-control hover:bg-void-850'
          }`}
        >
          <div className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
            <span className="text-[11px] font-bold tracking-tight truncate text-amber-300">
              {isId ? 'Contoh' : 'Presets'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 truncate max-w-full leading-tight mt-0.5">
            {isId ? '5 Rangkaian' : '5 Circuits'}
          </span>
        </button>

        {/* 4. Rumus & PLN (Inspector & Telemetry) */}
        <button
          id="tour-btn-info"
          type="button"
          onClick={() => onOpenMobileSheet('inspector')}
          className={`flex-1 min-w-0 min-h-[48px] px-1 sm:px-2 py-1 flex flex-col items-center justify-center rounded-xl transition-colors active:scale-95 cursor-pointer border ${
            activeMobileSheet === 'inspector' || Boolean(selectedNodeId)
              ? 'bg-electric-500/15 text-ink border-electric-500 shadow-sm'
              : 'bg-void-900 text-slate-200 border-control/60 hover:border-control hover:bg-void-850'
          }`}
        >
          <div className="flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-electric-400 shrink-0" aria-hidden="true" />
            <span className="text-[11px] font-bold tracking-tight truncate text-electric-300">
              {isId ? 'Rumus' : 'Formulas'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 truncate max-w-full leading-tight mt-0.5">
            {isOutdoor
              ? isId
                ? 'Cuaca & PLN'
                : 'Weather & Cost'
              : isId
              ? 'Nilai & PLN'
              : 'Values & Cost'}
          </span>
        </button>

        {/* 5. Menu Lab */}
        <button
          id="tour-btn-menu"
          type="button"
          onClick={onOpenMobileHub}
          className={`flex-1 min-w-0 min-h-[48px] px-1 sm:px-2 py-1 flex flex-col items-center justify-center rounded-xl transition-colors active:scale-95 cursor-pointer border ${
            isMobileHubOpen
              ? 'bg-electric-500/15 text-ink border-electric-500 shadow-sm'
              : 'bg-void-900 text-slate-200 border-control/60 hover:border-control hover:bg-void-850'
          }`}
        >
          <div className="flex items-center gap-1">
            <Menu className="w-3.5 h-3.5 text-slate-200 shrink-0" aria-hidden="true" />
            <span className="text-[11px] font-bold tracking-tight truncate">
              {isId ? 'Menu Lab' : 'Lab Menu'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 truncate max-w-full leading-tight mt-0.5">
            {isId ? 'Misi & Alat' : 'Missions & Tools'}
          </span>
        </button>
      </div>
    </nav>
  );
};
