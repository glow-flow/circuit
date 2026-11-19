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

  const isId = language === 'id';

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
      ? 'bottom-[64px] left-1/2 -translate-x-1/2'
      : 'bottom-2.5 left-1/2 -translate-x-1/2';

  return (
    <nav
      id="physics-lens-dock"
      aria-label={isId ? 'Lensa Fisika X-Ray' : 'Physics X-Ray Lens'}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={handleKeyDownGroup}
      className={`absolute ${positionClass} z-30 pointer-events-auto touch-none`}
    >
      <div
        role="group"
        aria-label={isId ? 'Pilih mode lensa fisika' : 'Choose physics lens mode'}
        className="flex items-center gap-1 p-1 rounded-2xl border bg-void-900 border-control shadow-xl"
      >
        {LENS_OPTIONS.map((option, idx) => {
          const isActive = physicsLensMode === option.id;
          const IconComponent = option.Icon;

          let buttonClass = 'text-slate-300 hover:bg-void-850 hover:text-ink';

          if (isActive) {
            if (option.id === 'thermal') {
              buttonClass = 'bg-pure-amber text-pure-slate font-bold shadow-sm';
            } else if (option.id === 'probe') {
              buttonClass = 'bg-electric-600 text-white font-bold shadow-sm';
            } else {
              buttonClass = 'bg-ink text-void-950 font-bold shadow-sm';
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
              className={`min-h-[38px] md:min-h-[44px] px-2.5 sm:px-3.5 rounded-xl text-[11px] sm:text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-colors whitespace-nowrap ${buttonClass}`}
            >
              <IconComponent className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{isId ? option.labelId : option.labelEn}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
