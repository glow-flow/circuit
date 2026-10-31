import React from 'react';
import { PaletteGlyphId } from '../../../constants/componentCatalog';

interface ComponentGlyphProps {
  glyph: PaletteGlyphId;
  className?: string;
}

/**
 * Schematic (textbook-style) symbol for parts without a photo asset.
 * Drawn with `currentColor` strokes so the parent controls color; 64×64 viewBox.
 * Doubles as a teaching aid: students see the same symbol used in their science book.
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
      return (
        <svg {...sharedProps}>
          <line x1="4" y1="44" x2="14" y2="44" />
          <circle cx="16" cy="44" r="2.5" />
          <line x1="16" y1="44" x2="46" y2="22" />
          <circle cx="50" cy="44" r="2.5" />
          <line x1="52.5" y1="44" x2="60" y2="44" />
        </svg>
      );
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
          {/* Wall Enclosure Box */}
          <rect x="10" y="8" width="44" height="44" rx="5" stroke="#38bdf8" strokeWidth="2.5" />
          {/* Digital kWh Display Screen */}
          <rect x="16" y="14" width="32" height="12" rx="2" fill="rgba(16,185,129,0.18)" stroke="#34d399" strokeWidth="1.8" />
          <path d="M22 20 L27 20 L29 17 L32 23 L34 20 L42 20" stroke="#34d399" strokeWidth="1.8" />
          {/* MCB Breaker Toggle & Step-Down Module */}
          <rect x="16" y="31" width="14" height="14" rx="2" stroke="#f59e0b" strokeWidth="2" />
          <line x1="23" y1="34" x2="23" y2="41" stroke="#f59e0b" strokeWidth="2.5" />
          <rect x="34" y="31" width="14" height="14" rx="2" stroke="#94a3b8" strokeWidth="1.8" />
          <path d="M38 38 L44 38 M41 35 L41 41" stroke="#38bdf8" strokeWidth="1.8" />
          {/* Bottom Positive (+) & Negative (-) Terminal Leads */}
          <line x1="22" y1="52" x2="22" y2="60" stroke="#ef4444" strokeWidth="3" />
          <line x1="42" y1="52" x2="42" y2="60" stroke="#38bdf8" strokeWidth="3" />
        </svg>
      );
    default:
      return null;
  }
};
