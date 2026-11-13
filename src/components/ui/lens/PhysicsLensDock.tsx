import React, { useCallback, useEffect, useRef } from 'react';
import { Crosshair, Flame, Layers } from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { PhysicsLensMode } from '../../../physics/physicsLensEngine';

interface LensOption {
  id: PhysicsLensMode;
  labelId: string;
  labelEn: string;
  titleId: string;
  titleEn: string;
  Icon: React.FC<{ className?: string }>;
}

const LENS_OPTIONS: ReadonlyArray<LensOption> = [
  {
    id: 'normal',
    labelId: 'Normal',
    labelEn: 'Normal',
    titleId: 'Tampilan kanvas normal (Esc)',
    titleEn: 'Standard circuit view (Esc)',
    Icon: Layers,
  },
  {
    id: 'thermal',
    labelId: 'Termal',
    labelEn: 'Thermal',
    titleId: 'Kamera FLIR panas Joule (P = I^2 * R)',
    titleEn: 'Infrared thermal Joule dissipation camera',
    Icon: Flame,
  },
  {
    id: 'probe',
    labelId: 'Probe',
    labelEn: 'Probe',
    titleId: 'Ukur potensial (V), arus (I), dan beda potensial A-B',
    titleEn: 'Inspect live node potential (V), current (I), and delta V',
    Icon: Crosshair,
  },
];

export interface PhysicsLensDockProps {
  /** Hides dock cleanly when bottom sheets or onboarding tours take focus. */
  isHidden?: boolean;
}

/**
 * Compact 3-mode Physics X-Ray Lens dock (`Normal | Termal | Probe`).
 *
 * Adapts layout anchor per workspace (`lab` vs `outside`) and screen width so it never
 * overlaps ReactFlow zoom controls, outdoor terrain camera slider, or mobile nav chrome.
 *
 * Time Complexity: O(1) render & focus handling.
 */
export const PhysicsLensDock: React.FC<PhysicsLensDockProps> = ({ isHidden = false }) => {
  const physicsLensMode = useCircuitStore((state) => state.physicsLensMode);
  const setPhysicsLensMode = useCircuitStore((state) => state.setPhysicsLensMode);
  const setIsPickingProbeB = useCircuitStore((state) => state.setIsPickingProbeB);
  const isPickingProbeB = useCircuitStore((state) => state.isPickingProbeB);
  const clearProbeTargets = useCircuitStore((state) => state.clearProbeTargets);
  const probeTargetA = useCircuitStore((state) => state.probeTargetA);
  const worldMode = useCircuitStore((state) => state.worldMode);
  const language = useCircuitStore((state) => state.language);
  const theme = useCircuitStore((state) => state.theme);

  const isId = language === 'id';
  const isLight = theme === 'light';

  const handleGlobalEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || physicsLensMode === 'normal') return;
      if (isPickingProbeB) {
        setIsPickingProbeB(false);
        return;
      }
      if (probeTargetA) {
        clearProbeTargets();
        return;
      }
      setPhysicsLensMode('normal');
    },
    [
      clearProbeTargets,
      isPickingProbeB,
      physicsLensMode,
      probeTargetA,
      setIsPickingProbeB,
      setPhysicsLensMode,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalEscape);
    return () => window.removeEventListener('keydown', handleGlobalEscape);
  }, [handleGlobalEscape]);

  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDownGroup = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const currentIndex = LENS_OPTIONS.findIndex((item) => item.id === physicsLensMode);
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (currentIndex + delta + LENS_OPTIONS.length) % LENS_OPTIONS.length;
    setPhysicsLensMode(LENS_OPTIONS[nextIndex].id);
    buttonRefs.current[nextIndex]?.focus();
  };

  if (isHidden) {
    return null;
  }

  const positionClass =
    worldMode === 'outside'
      ? 'bottom-[68px] left-1/2 -translate-x-1/2 md:bottom-3 md:left-4 md:translate-x-0'
      : 'bottom-2.5 left-1/2 -translate-x-1/2';

  const containerSurfaceClass = isLight
    ? 'bg-white/95 border-slate-300 shadow-lg'
    : 'bg-slate-950/95 border-white/15 shadow-lg';

  return (
    <nav
      id="physics-lens-dock"
      aria-label={isId ? 'Lensa Fisika X-Ray' : 'Physics X-Ray Lens'}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={handleKeyDownGroup}
      className={`absolute ${positionClass} z-30 pointer-events-auto`}
    >
      <div
        role="group"
        aria-label={isId ? 'Pilih mode lensa fisika' : 'Choose physics lens mode'}
        className={`flex items-center gap-1 p-1 rounded-2xl border ${containerSurfaceClass}`}
      >
        {LENS_OPTIONS.map((option, idx) => {
          const isActive = physicsLensMode === option.id;
          const IconComponent = option.Icon;

          let buttonClass = isLight
            ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
            : 'text-slate-200 hover:bg-slate-800 hover:text-white';

          if (isActive) {
            if (option.id === 'thermal') {
              buttonClass = 'bg-amber-400 text-slate-950 font-bold shadow-sm';
            } else if (option.id === 'probe') {
              buttonClass = isLight
                ? 'bg-sky-700 text-white font-bold shadow-sm'
                : 'bg-cyan-400 text-slate-950 font-bold shadow-sm';
            } else {
              buttonClass = isLight
                ? 'bg-slate-900 text-white font-bold shadow-sm'
                : 'bg-slate-100 text-slate-950 font-bold shadow-sm';
            }
          }

          return (
            <button
              key={option.id}
              ref={(el) => {
                buttonRefs.current[idx] = el;
              }}
              type="button"
              data-testid={`lens-mode-${option.id}`}
              aria-pressed={isActive}
              title={isId ? option.titleId : option.titleEn}
              onClick={() => setPhysicsLensMode(option.id)}
              className={`min-h-[44px] px-3 sm:px-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${buttonClass}`}
            >
              <IconComponent className="w-4 h-4 shrink-0" />
              <span>{isId ? option.labelId : option.labelEn}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
