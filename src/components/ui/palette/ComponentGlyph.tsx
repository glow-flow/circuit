import React from 'react';
import { PaletteGlyphId } from '../../../constants/componentCatalog';
import { KnifeSwitchGraphic } from '../common/KnifeSwitchGraphic';

interface ComponentGlyphProps {
  glyph: PaletteGlyphId;
  className?: string;
}

/**
 * Monochrome IEC schematic symbol fallback for parts when an image asset fails to load,
 * plus the pure-code SPST Knife Switch vector graphic for `glyph === 'switch'`.
 *
 * Time Complexity: O(1) render.
 */
export const ComponentGlyph: React.FC<ComponentGlyphProps> = ({ glyph, className }) => {
  const sharedProps = {
    viewBox: '0 0 64 64',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  };

  switch (glyph) {
    case 'switch':
      return <KnifeSwitchGraphic isOpen={true} className="w-[88%] h-[88%]" />;
    case 'ground':
      return (
        <svg {...sharedProps}>
          <line x1="32" y1="6" x2="32" y2="30" />
          <line x1="12" y1="30" x2="52" y2="30" />
          <line x1="20" y1="40" x2="44" y2="40" />
          <line x1="28" y1="50" x2="36" y2="50" />
        </svg>
      );
    case 'voltmeter':
    case 'ammeter':
      return (
        <svg {...sharedProps}>
          <line x1="2" y1="32" x2="12" y2="32" />
          <circle cx="32" cy="32" r="20" />
          <line x1="52" y1="32" x2="62" y2="32" />
          <text
            x="32"
            y="40"
            textAnchor="middle"
            fontSize="22"
            fontWeight="700"
            fontFamily="'JetBrains Mono', monospace"
            fill="currentColor"
            stroke="none"
          >
            {glyph === 'voltmeter' ? 'V' : 'A'}
          </text>
        </svg>
      );
    case 'distribution-panel':
      return (
        <svg {...sharedProps}>
          <rect x="12" y="8" width="40" height="44" rx="4" />
          <rect x="18" y="14" width="28" height="12" rx="2" />
          <line x1="24" y1="52" x2="24" y2="60" />
          <line x1="40" y1="52" x2="40" y2="60" />
        </svg>
      );
    default:
      return null;
  }
};
