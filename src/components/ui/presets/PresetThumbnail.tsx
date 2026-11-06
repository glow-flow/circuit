import React from 'react';

interface PresetThumbnailProps {
  presetId: string;
  category?: string;
}

interface ThumbnailPart {
  src: string;
  alt: string;
}

const PRESET_PARTS_BY_ID: Readonly<Record<string, readonly ThumbnailPart[]>> = {
  'simple-lamp': [
    { src: '/assets/processed/battery-holder.png', alt: '3V Holder' },
    { src: '/assets/switch-knife.png', alt: 'Switch' },
    { src: '/assets/bulb-incandescent.png', alt: 'Bulb' },
  ],
  'voltage-divider': [
    { src: '/assets/battery-9v.png', alt: '9V Battery' },
    { src: '/assets/bulb-incandescent.png', alt: 'Bulb 1' },
    { src: '/assets/bulb-led-standard.png', alt: 'Bulb 2' },
    { src: '/assets/voltmeter.png', alt: 'Voltmeter' },
  ],
  'parallel-bulbs': [
    { src: '/assets/battery-9v.png', alt: '9V Battery' },
    { src: '/assets/bulb-led-standard.png', alt: 'Branch 1' },
    { src: '/assets/bulb-cfl.png', alt: 'Branch 2' },
    { src: '/assets/bulb-edison.png', alt: 'Branch 3' },
  ],
  'short-circuit-demo': [
    { src: '/assets/distribution-panel.png', alt: 'MCB Panel' },
    { src: '/assets/switch-knife.png', alt: 'Bypass Switch' },
    { src: '/assets/ammeter.png', alt: 'Ammeter' },
  ],
  'ultimate-power-grid': [
    { src: '/assets/solar-panel.png', alt: 'Solar Panel' },
    { src: '/assets/bess-substation.png', alt: 'BESS' },
    { src: '/assets/distribution-panel.png', alt: 'Distribution Panel' },
    { src: '/assets/bulb-led.png', alt: 'Load' },
  ],
};

const DEFAULT_PARTS: readonly ThumbnailPart[] = [
  { src: '/assets/battery-9v.png', alt: 'Source' },
  { src: '/assets/switch-knife.png', alt: 'Switch' },
  { src: '/assets/bulb-incandescent.png', alt: 'Load' },
];

/**
 * Renders a hardware specimen strip for circuit presets using real component PNG assets
 * connected along a clean copper bus line instead of synthetic vector cartoons.
 *
 * Time Complexity: O(1) render.
 */
export const PresetThumbnail: React.FC<PresetThumbnailProps> = ({ presetId }) => {
  const parts = PRESET_PARTS_BY_ID[presetId] ?? DEFAULT_PARTS;

  return (
    <div className="relative w-full h-full bg-void-950 rounded-xl px-3 py-2 flex items-center justify-around overflow-hidden border border-white/5">
      {/* Subtle horizontal copper bus trace behind hardware icons */}
      <div
        className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-slate-700/70 pointer-events-none"
        aria-hidden="true"
      />
      {parts.map((part, index) => (
        <div
          key={`${part.src}-${index}`}
          className="relative z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-void-900/95 border border-white/10 p-1.5 flex items-center justify-center shadow-sm"
        >
          <img
            src={part.src}
            alt={part.alt}
            width={36}
            height={36}
            loading="lazy"
            draggable={false}
            className="w-full h-full object-contain pointer-events-none select-none"
          />
        </div>
      ))}
    </div>
  );
};
