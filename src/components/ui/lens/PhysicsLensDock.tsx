import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Crosshair, Flame, Layers, X } from 'lucide-react';
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
 * Collapses to a single unobtrusive `Lensa` chip on mobile phones so the canvas stays uncluttered.
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

  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const isId = language === 'id';

  const handleGlobalEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (isMobileExpanded) {
        setIsMobileExpanded(false);
      }
      if (physicsLensMode === 'normal') return;
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
      isMobileExpanded,
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

  const desktopPositionClass =
    worldMode === 'outside'
      ? 'bottom-[64px] left-1/2 -translate-x-1/2'
      : 'bottom-2.5 left-1/2 -translate-x-1/2';

  const mobilePositionClass =
    worldMode === 'outside' ? 'bottom-[64px] right-3' : 'bottom-2.5 right-3';

  const activeOption = LENS_OPTIONS.find((item) => item.id === physicsLensMode) ?? LENS_OPTIONS[0];
  const ActiveIcon = activeOption.Icon;

  return (
    <>
      {/* Mobile (< 768px): Single unobtrusive Lensa chip that expands only when needed */}
      <nav
        aria-label={isId ? 'Lensa Fisika' : 'Physics Lens'}
        onPointerDown={(event) => event.stopPropagation()}
        className={`md:hidden absolute ${mobilePositionClass} z-30 pointer-events-auto touch-none`}
      >
        {isMobileExpanded ? (
          <div
            role="group"
            aria-label={isId ? 'Pilih mode lensa fisika' : 'Choose physics lens mode'}
            className="flex items-center gap-1 p-1 rounded-2xl border bg-void-900 border-control shadow-xl"
          >
            {LENS_OPTIONS.map((option) => {
              const isActive = physicsLensMode === option.id;
              const IconComponent = option.Icon;
              let buttonClass = 'text-slate-300 hover:bg-void-850 hover:text-ink';
              if (isActive) {
                if (option.id === 'thermal') {
                  buttonClass = 'bg-pure-amber text-pure-slate font-bold';
                } else if (option.id === 'probe') {
                  buttonClass = 'bg-electric-600 text-white font-bold';
                } else {
                  buttonClass = 'bg-ink text-void-950 font-bold';
                }
              }

              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => {
                    setPhysicsLensMode(option.id);
                    setIsMobileExpanded(false);
                  }}
                  className={`min-h-[44px] px-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-colors whitespace-nowrap ${buttonClass}`}
                >
                  <IconComponent className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{isId ? option.labelId : option.labelEn}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setIsMobileExpanded(false)}
              aria-label={isId ? 'Tutup pemilih lensa' : 'Close lens picker'}
              className="min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-ink hover:bg-void-850 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ) : physicsLensMode === 'normal' ? (
          <button
            type="button"
            aria-expanded={false}
            onClick={() => setIsMobileExpanded(true)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-void-900 hover:bg-void-850 border border-control text-ink text-xs font-semibold shadow-lg flex items-center gap-1.5 active:scale-95 transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-electric-400 shrink-0" aria-hidden="true" />
            <span>{isId ? 'Lensa' : 'Lens'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-void-900 border border-control shadow-lg">
            <button
              type="button"
              onClick={() => setIsMobileExpanded(true)}
              className={`min-h-[40px] px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                physicsLensMode === 'thermal'
                  ? 'bg-pure-amber text-pure-slate'
                  : 'bg-electric-600 text-white'
              }`}
            >
              <ActiveIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{isId ? activeOption.labelId : activeOption.labelEn}</span>
            </button>
            <button
              type="button"
              onClick={() => setPhysicsLensMode('normal')}
              aria-label={isId ? 'Matikan lensa' : 'Exit lens mode'}
              className="min-w-[40px] min-h-[40px] rounded-lg text-slate-300 hover:text-ink hover:bg-void-850 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </nav>

      {/* Tablet & Desktop (>= 768px): Compact 3-mode lens bar */}
      <nav
        id="physics-lens-dock"
        aria-label={isId ? 'Lensa Fisika X-Ray' : 'Physics X-Ray Lens'}
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDownGroup}
        className={`hidden md:block absolute ${desktopPositionClass} z-30 pointer-events-auto touch-none`}
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
                className={`min-h-[44px] px-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-colors whitespace-nowrap ${buttonClass}`}
              >
                <IconComponent className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isId ? option.labelId : option.labelEn}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
