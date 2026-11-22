import React, { useId } from 'react';
import { BulbType } from '../../../constants/bulbCatalog';
import { ComponentType } from '../../../types/circuit';
import { computeResistorColorBands } from '../../../utils/resistorColorCode';
import { KnifeSwitchGraphic } from './KnifeSwitchGraphic';

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * 1.5V AA Laboratory Cell (`viewBox="0 0 48 136"`).
 * Matches Hardware-Instrument palette: matte slate graphite casing, warm copper-amber top jacket,
 * brushed brass positive button terminal, and crisp technical markings readable on Dark & Light canvases.
 */
export const BatteryAAGraphic: React.FC<{
  isDead?: boolean;
  className?: string;
}> = ({ isDead = false, className = 'w-full h-full' }) => {
  const uid = sanitizeId(useId());

  return (
    <svg
      viewBox="0 0 48 136"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none pointer-events-none ${className}`}
      style={{
        filter: isDead ? 'grayscale(100%) brightness(0.65)' : undefined,
        opacity: isDead ? 0.65 : 1,
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`aa-body-${uid}`} x1="6" y1="0" x2="42" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="28%" stopColor="#334155" />
          <stop offset="52%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#090D16" />
        </linearGradient>
        <linearGradient id={`aa-copper-${uid}`} x1="6" y1="0" x2="42" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#92400E" />
          <stop offset="30%" stopColor="#F59E0B" />
          <stop offset="55%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient id={`aa-metal-${uid}`} x1="12" y1="0" x2="36" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="40%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
      </defs>

      {/* Positive Brass Button Cap */}
      <rect x="17" y="2" width="14" height="7" rx="2.5" fill={`url(#aa-metal-${uid})`} stroke="#475569" strokeWidth="1.2" />

      {/* Upper Bevel Rim */}
      <rect x="7" y="8" width="34" height="6" rx="3" fill="#CBD5E1" stroke="#475569" strokeWidth="1.2" />

      {/* Main Cylinder Casing */}
      <rect x="6" y="12" width="36" height="114" rx="5" fill={`url(#aa-body-${uid})`} stroke="#475569" strokeWidth="1.5" />

      {/* Copper-Amber Positive Top Jacket */}
      <path
        d="M6.75 17C6.75 14.65 8.65 12.75 11 12.75H37C39.35 12.75 41.25 14.65 41.25 17V47H6.75V17Z"
        fill={`url(#aa-copper-${uid})`}
      />
      {/* Crisp Metallic Separator Band */}
      <rect x="6.75" y="47" width="34.5" height="3" fill="#FDE68A" fillOpacity="0.85" />

      {/* Polarity Mark (+) inside Copper Band */}
      <path d="M24 22V32M19 27H29" stroke="#FEF3C7" strokeWidth="2.4" strokeLinecap="round" />

      {/* Technical Rating Typography */}
      <text
        x="24"
        y="74"
        textAnchor="middle"
        fill="#F8FAFC"
        fontSize="11.5"
        fontWeight="800"
        fontFamily="'IBM Plex Mono', monospace"
        letterSpacing="-0.4"
      >
        1.5V
      </text>
      <rect x="13" y="81" width="22" height="12" rx="3" fill="#0F172A" stroke="#64748B" strokeWidth="1" />
      <text
        x="24"
        y="90"
        textAnchor="middle"
        fill="#FBBF24"
        fontSize="8.5"
        fontWeight="700"
        fontFamily="'IBM Plex Mono', monospace"
      >
        AA
      </text>

      {/* Subtle Specular Vertical Highlight */}
      <rect x="11.5" y="16" width="3" height="104" rx="1.5" fill="#FFFFFF" fillOpacity="0.16" />

      {/* Polarity Mark (-) near Bottom */}
      <path d="M19.5 111H28.5" stroke="#CBD5E1" strokeWidth="2.2" strokeLinecap="round" />

      {/* Negative Brushed Steel Base Cap */}
      <rect x="8" y="124" width="32" height="9" rx="3" fill={`url(#aa-metal-${uid})`} stroke="#475569" strokeWidth="1.2" />
    </svg>
  );
};

/**
 * 9V Rectangular Alkaline Laboratory Battery (`viewBox="0 0 88 124"`).
 * Left round (+) snap stud at x=34% (30px), right hexagonal (-) snap stud at x=66% (58px).
 */
export const Battery9VGraphic: React.FC<{
  isDead?: boolean;
  className?: string;
}> = ({ isDead = false, className = 'w-full h-full' }) => {
  const uid = sanitizeId(useId());

  return (
    <svg
      viewBox="0 0 88 124"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none pointer-events-none ${className}`}
      style={{
        filter: isDead ? 'grayscale(100%) brightness(0.65)' : undefined,
        opacity: isDead ? 0.65 : 1,
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`b9v-body-${uid}`} x1="10" y1="0" x2="78" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="22%" stopColor="#263348" />
          <stop offset="65%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0B1120" />
        </linearGradient>
        <linearGradient id={`b9v-copper-${uid}`} x1="10" y1="0" x2="78" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#92400E" />
          <stop offset="28%" stopColor="#F59E0B" />
          <stop offset="60%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>

      {/* Top Insulator Deck */}
      <rect x="14" y="14" width="60" height="8" rx="3" fill="#334155" stroke="#64748B" strokeWidth="1.2" />

      {/* Left Positive (+) Round Brass Snap Stud at x=30 (34%) */}
      <rect x="24" y="4" width="12" height="11" rx="2.5" fill="#F59E0B" stroke="#FEF3C7" strokeWidth="1.1" />
      <rect x="26.5" y="2" width="7" height="3.5" rx="1.2" fill="#FDE68A" stroke="#92400E" strokeWidth="0.9" />

      {/* Right Negative (-) Hexagonal Steel Snap Stud at x=58 (66%) */}
      <polygon
        points="51,6 54,4 62,4 65,6 65,15 51,15"
        fill="#CBD5E1"
        stroke="#475569"
        strokeWidth="1.2"
      />
      <rect x="55" y="7" width="6" height="5" rx="1" fill="#334155" />

      {/* Main Rectangular Chassis */}
      <rect
        x="10"
        y="19"
        width="68"
        height="100"
        rx="8"
        fill={`url(#b9v-body-${uid})`}
        stroke="#475569"
        strokeWidth="1.6"
      />

      {/* Copper-Amber Top Jacket Band */}
      <path
        d="M10.8 27C10.8 22.9 14.1 19.8 18 19.8H70C73.9 19.8 77.2 22.9 77.2 27V52H10.8V27Z"
        fill={`url(#b9v-copper-${uid})`}
      />
      <rect x="10.8" y="51" width="66.4" height="3" fill="#FDE68A" fillOpacity="0.85" />

      {/* Polarity Symbols Engraved on Top Band */}
      <circle cx="30" cy="36" r="7" fill="#78350F" fillOpacity="0.55" stroke="#FEF3C7" strokeWidth="1" />
      <path d="M30 32.5V39.5M26.5 36H33.5" stroke="#FEF3C7" strokeWidth="1.8" strokeLinecap="round" />

      <circle cx="58" cy="36" r="7" fill="#0F172A" fillOpacity="0.55" stroke="#E2E8F0" strokeWidth="1" />
      <path d="M54.5 36H61.5" stroke="#E2E8F0" strokeWidth="1.8" strokeLinecap="round" />

      {/* Crisp Technical Faceplate */}
      <text
        x="44"
        y="82"
        textAnchor="middle"
        fill="#F8FAFC"
        fontSize="24"
        fontWeight="800"
        fontFamily="'IBM Plex Mono', monospace"
      >
        9V
      </text>
      <rect x="20" y="90" width="48" height="15" rx="4" fill="#0F172A" stroke="#64748B" strokeWidth="1" />
      <text
        x="44"
        y="100.5"
        textAnchor="middle"
        fill="#FBBF24"
        fontSize="7.5"
        fontWeight="700"
        fontFamily="'IBM Plex Mono', monospace"
        letterSpacing="0.8"
      >
        ALKALINE
      </text>

      {/* Subtle Specular Edge Highlight */}
      <rect x="15" y="24" width="3.5" height="88" rx="1.75" fill="#FFFFFF" fillOpacity="0.14" />
    </svg>
  );
};

/**
 * Dual AA Series Battery Holder (`viewBox="0 0 140 206"`).
 * Clean matte bakelite laboratory instrument chassis (replaces sci-fi neon PNG)
 * with brass top/bottom series busbars, animated spring contacts, and integrated AA vector cells.
 */
export const BatteryHolderGraphic: React.FC<{
  batteryCount: number;
  isDead?: boolean;
  className?: string;
}> = ({ batteryCount, isDead = false, className = 'w-full h-full' }) => {
  const hasSlot1 = batteryCount >= 1;
  const hasSlot2 = batteryCount >= 2;

  return (
    <svg
      viewBox="0 0 140 206"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Top Positive Red Insulated Terminal Lug */}
      <rect x="61" y="1" width="18" height="10" rx="3" fill="#DC2626" stroke="#FCA5A5" strokeWidth="1.2" />
      {/* Bottom Negative Slate Terminal Lug */}
      <rect x="61" y="195" width="18" height="10" rx="3" fill="#334155" stroke="#94A3B8" strokeWidth="1.2" />

      {/* Bakelite / Matte Industrial Slate Tray Body */}
      <rect
        x="8"
        y="10"
        width="124"
        height="186"
        rx="12"
        fill="#0F172A"
        stroke="#475569"
        strokeWidth="1.8"
      />
      {/* Inner Bevel Rim */}
      <rect
        x="12"
        y="14"
        width="116"
        height="178"
        rx="9"
        fill="#1E293B"
        stroke="#334155"
        strokeWidth="1"
      />

      {/* Corner Brass Mounting Rivets */}
      <circle cx="17" cy="19" r="2.2" fill="#64748B" />
      <circle cx="123" cy="19" r="2.2" fill="#64748B" />
      <circle cx="17" cy="187" r="2.2" fill="#64748B" />
      <circle cx="123" cy="187" r="2.2" fill="#64748B" />

      {/* Top Positive Brass Busbar connecting to Slot 1 (+) */}
      <path d="M40 22 V16 H70 V11" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      {/* Bottom Series Bridge Brass Busbar connecting Slot 1 (-) to Slot 2 (+) */}
      <path d="M40 183 V189 H100 V183" stroke="#D97706" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      {/* Top-Right Negative Return Busbar from Slot 2 (-) to Bottom Lead */}
      <path d="M100 22 V17 H121 V189 H70 V195" stroke="#94A3B8" strokeWidth="2" strokeDasharray="3 2" strokeLinecap="round" strokeLinejoin="round" />

      {/* LEFT CHAMBER (SLOT 1) RECESS */}
      <rect x="18" y="24" width="46" height="158" rx="6" fill="#090D16" stroke="#334155" strokeWidth="1.2" />
      {/* Slot 1 Top Brass Positive Plate */}
      <rect x="27" y="25" width="28" height="5" rx="1.5" fill="#F59E0B" stroke="#FEF3C7" strokeWidth="0.8" />
      {/* Slot 1 Polarity Emboss (visible when empty) */}
      {!hasSlot1 && (
        <g opacity="0.6">
          <text x="41" y="54" textAnchor="middle" fill="#EF4444" fontSize="13" fontWeight="800" fontFamily="'IBM Plex Mono', monospace">
            +
          </text>
          <text x="41" y="106" textAnchor="middle" fill="#64748B" fontSize="9.5" fontWeight="700" fontFamily="'IBM Plex Mono', monospace">
            SLOT 1
          </text>
          <text x="41" y="120" textAnchor="middle" fill="#64748B" fontSize="8.5" fontWeight="600" fontFamily="'IBM Plex Mono', monospace">
            1.5V AA
          </text>
          <text x="41" y="150" textAnchor="middle" fill="#94A3B8" fontSize="13" fontWeight="800" fontFamily="'IBM Plex Mono', monospace">
            -
          </text>
        </g>
      )}
      {/* Slot 1 Bottom Metallic Coil Spring */}
      <g
        style={{
          transformOrigin: '41px 180px',
          transform: hasSlot1 ? 'scaleY(0.55)' : 'scaleY(1)',
          transition: 'transform 260ms ease-out',
        }}
      >
        <path
          d="M27 180 H55 L29 174 L53 168 L31 162 L51 156 H33"
          stroke="#CBD5E1"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Center Partition Divider */}
      <rect x="67" y="26" width="6" height="154" rx="3" fill="#334155" stroke="#475569" strokeWidth="1" />

      {/* RIGHT CHAMBER (SLOT 2) RECESS */}
      <rect x="76" y="24" width="46" height="158" rx="6" fill="#090D16" stroke="#334155" strokeWidth="1.2" />
      {/* Slot 2 Bottom Brass Positive Plate */}
      <rect x="85" y="176" width="28" height="5" rx="1.5" fill="#F59E0B" stroke="#FEF3C7" strokeWidth="0.8" />
      {/* Slot 2 Polarity Emboss (visible when empty) */}
      {!hasSlot2 && (
        <g opacity="0.6">
          <text x="99" y="64" textAnchor="middle" fill="#94A3B8" fontSize="13" fontWeight="800" fontFamily="'IBM Plex Mono', monospace">
            -
          </text>
          <text x="99" y="106" textAnchor="middle" fill="#64748B" fontSize="9.5" fontWeight="700" fontFamily="'IBM Plex Mono', monospace">
            SLOT 2
          </text>
          <text x="99" y="120" textAnchor="middle" fill="#64748B" fontSize="8.5" fontWeight="600" fontFamily="'IBM Plex Mono', monospace">
            1.5V AA
          </text>
          <text x="99" y="162" textAnchor="middle" fill="#EF4444" fontSize="13" fontWeight="800" fontFamily="'IBM Plex Mono', monospace">
            +
          </text>
        </g>
      )}
      {/* Slot 2 Top Metallic Coil Spring */}
      <g
        style={{
          transformOrigin: '99px 26px',
          transform: hasSlot2 ? 'scaleY(0.55)' : 'scaleY(1)',
          transition: 'transform 260ms ease-out',
        }}
      >
        <path
          d="M85 26 H113 L87 32 L111 38 L89 44 L109 50 H91"
          stroke="#CBD5E1"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* INSTALLED CELL 1 (Upright, + at top) */}
      {hasSlot1 && (
        <g transform="translate(19, 30)">
          <svg width="44" height="134" viewBox="0 0 48 136">
            <BatteryAAGraphic isDead={isDead} />
          </svg>
        </g>
      )}

      {/* INSTALLED CELL 2 (Inverted 180deg for real series wiring, + at bottom) */}
      {hasSlot2 && (
        <g transform="translate(121, 176) rotate(180)">
          <svg width="44" height="134" viewBox="0 0 48 136">
            <BatteryAAGraphic isDead={isDead} />
          </svg>
        </g>
      )}
    </svg>
  );
};

/**
 * Through-hole Ceramic Axial Resistor (`viewBox="0 0 136 44"`).
 * Warm ivory-tan ceramic body with high-contrast contour and real live IEC 60062
 * 4-band color rings dynamically computed from `resistance`.
 */
export const ResistorGraphic: React.FC<{
  resistance?: number;
  className?: string;
}> = ({ resistance = 100, className = 'w-full h-full' }) => {
  const uid = sanitizeId(useId());
  const [b1, b2, b3, b4] = computeResistorColorBands(resistance);

  return (
    <svg
      viewBox="0 0 136 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`res-lead-${uid}`} x1="0" y1="18" x2="0" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={`res-body-${uid}`} x1="0" y1="8" x2="0" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F5EAD6" />
          <stop offset="32%" stopColor="#E7D3B0" />
          <stop offset="78%" stopColor="#C9AE82" />
          <stop offset="100%" stopColor="#9C7F54" />
        </linearGradient>
      </defs>

      {/* Left & Right Tinned Copper Axial Leads */}
      <rect x="2" y="19.5" width="28" height="5" rx="2.5" fill={`url(#res-lead-${uid})`} stroke="#475569" strokeWidth="1" />
      <rect x="106" y="19.5" width="28" height="5" rx="2.5" fill={`url(#res-lead-${uid})`} stroke="#475569" strokeWidth="1" />

      {/* Ceramic Dumbbell Body */}
      <path
        d="M27 14 C27 9.5 31 8 36 8 H43 C47 8 49 10.5 53 10.5 H83 C87 10.5 89 8 93 8 H100 C105 8 109 9.5 109 14 V30 C109 34.5 105 36 100 36 H93 C89 36 87 33.5 83 33.5 H53 C49 33.5 47 36 43 36 H36 C31 36 27 34.5 27 30 V14 Z"
        fill={`url(#res-body-${uid})`}
        stroke="#785A34"
        strokeWidth="1.5"
      />

      {/* IEC 60062 Color Bands (Digit 1, Digit 2, Multiplier, Tolerance) */}
      <rect x="37" y="9" width="7.5" height="26" rx="1" fill={b1.hex} stroke={b1.strokeHex} strokeWidth="0.6" />
      <rect x="52" y="11" width="7.5" height="22" rx="1" fill={b2.hex} stroke={b2.strokeHex} strokeWidth="0.6" />
      <rect x="67" y="11" width="7.5" height="22" rx="1" fill={b3.hex} stroke={b3.strokeHex} strokeWidth="0.6" />
      <rect x="91" y="9" width="6.5" height="26" rx="1" fill={b4.hex} stroke={b4.strokeHex} strokeWidth="0.6" />

      {/* Ceramic Gloss Highlight Across Body & Bands */}
      <rect x="32" y="12" width="72" height="4" rx="2" fill="#FFFFFF" fillOpacity="0.28" />
    </svg>
  );
};

/**
 * E27 Laboratory Screw Socket (`viewBox="0 0 38 56"`).
 * Supports `layer="back"` and `layer="front-lip"` for the 3-layer depth sandwich in SocketNode,
 * plus `layer="full"` for empty state and PaletteTile preview.
 * Bottom brass screw terminals sit cleanly at 29% (x=11) and 71% (x=27).
 */
export const E27SocketGraphic: React.FC<{
  layer?: 'full' | 'back' | 'front-lip';
  hasBulb?: boolean;
  className?: string;
}> = ({ layer = 'full', hasBulb = false, className = 'w-full h-full' }) => {
  const showBack = layer === 'full' || layer === 'back';
  const showFront = layer === 'full' || layer === 'front-lip';

  return (
    <svg
      viewBox="0 0 38 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {showBack && (
        <g>
          {/* Back Rim Ellipse of Socket Mouth */}
          <ellipse cx="19" cy="10" rx="15" ry="6.5" fill="#1E293B" stroke="#64748B" strokeWidth="1.4" />
          {/* Dark Recessed Socket Cavity & Brass Threads */}
          <ellipse cx="19" cy="10.5" rx="12" ry="4.8" fill="#090D16" />
          {!hasBulb && (
            <g opacity="0.85">
              <path d="M9 11.5 Q19 15 29 11.5" stroke="#D97706" strokeWidth="1.4" fill="none" />
              <path d="M10.5 14 Q19 17 27.5 14" stroke="#B45309" strokeWidth="1.2" fill="none" />
              <circle cx="19" cy="12" r="2.2" fill="#F59E0B" />
            </g>
          )}
        </g>
      )}

      {showFront && (
        <g>
          {/* Front Cylindrical Bakelite Collar Wrapping Around Bulb Threads */}
          <path
            d="M4 10 C4 14 10.7 16.5 19 16.5 C27.3 16.5 34 14 34 10 V36 C34 39.5 27.3 42 19 42 C10.7 42 4 39.5 4 36 V10 Z"
            fill="#1E293B"
            stroke="#64748B"
            strokeWidth="1.4"
          />
          {/* Subtle Cylindrical Shading & Grip Ribs */}
          <path d="M8 15 V37" stroke="#FFFFFF" strokeOpacity="0.14" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M5 24 Q19 28.5 33 24" stroke="#475569" strokeWidth="1" fill="none" />
          <path d="M5 31 Q19 35.5 33 31" stroke="#475569" strokeWidth="1" fill="none" />

          {/* Flared Laboratory Base Plinth */}
          <rect x="2" y="37" width="34" height="10" rx="3.5" fill="#0F172A" stroke="#64748B" strokeWidth="1.4" />

          {/* Bottom Brass Screw Terminals aligned with p1 (29% -> x=11) & p2 (71% -> x=27) */}
          <rect x="7" y="46" width="8" height="8" rx="2" fill="#D97706" stroke="#FEF3C7" strokeWidth="1" />
          <circle cx="11" cy="50" r="1.8" fill="#78350F" />

          <rect x="23" y="46" width="8" height="8" rx="2" fill="#D97706" stroke="#FEF3C7" strokeWidth="1" />
          <circle cx="27" cy="50" r="1.8" fill="#78350F" />
        </g>
      )}
    </svg>
  );
};

/**
 * White Ceramic Bi-Pin Socket (`viewBox="0 0 38 58"`).
 * Crisp porcelain-ivory ceramic block with clear slate outline so it stays distinct on both
 * Light and Dark canvases, plus bottom copper tabs aligned at p1 (28% -> x=10.6) & p2 (72% -> x=27.4).
 */
export const PinSocketGraphic: React.FC<{
  layer?: 'full' | 'back' | 'front-lip';
  className?: string;
}> = ({ layer = 'full', className = 'w-full h-full' }) => {
  const showBack = layer === 'full' || layer === 'back';
  const showFront = layer === 'full' || layer === 'front-lip';

  return (
    <svg
      viewBox="0 0 38 58"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {showBack && (
        <g>
          {/* Top Porcelain Rim & Dual Pin Insertion Holes */}
          <rect x="5" y="2" width="28" height="9" rx="3" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.3" />
          <rect x="10" y="4.2" width="5.5" height="3.2" rx="1" fill="#0F172A" />
          <rect x="22.5" y="4.2" width="5.5" height="3.2" rx="1" fill="#0F172A" />
        </g>
      )}

      {showFront && (
        <g>
          {/* Front Porcelain Ceramic Body */}
          <rect x="5" y="7" width="28" height="36" rx="4" fill="#F1F5F9" stroke="#64748B" strokeWidth="1.4" />
          {/* Molded Ceramic Ridge & Specular Band */}
          <rect x="8.5" y="10" width="4" height="29" rx="2" fill="#FFFFFF" fillOpacity="0.85" />
          <line x1="6" y1="22" x2="32" y2="22" stroke="#CBD5E1" strokeWidth="1.2" />
          {/* Mounting Bracket Collar */}
          <rect x="3" y="38" width="32" height="9" rx="2.5" fill="#1E293B" stroke="#64748B" strokeWidth="1.3" />
          <circle cx="19" cy="42.5" r="1.8" fill="#94A3B8" />

          {/* Bottom Copper Terminal Tabs aligned with p1 (28% -> x=10.6) & p2 (72% -> x=27.4) */}
          <rect x="7" y="47" width="7.2" height="9" rx="1.8" fill="#D97706" stroke="#FEF3C7" strokeWidth="1" />
          <rect x="23.8" y="47" width="7.2" height="9" rx="1.8" fill="#D97706" stroke="#FEF3C7" strokeWidth="1" />
        </g>
      )}
    </svg>
  );
};

/**
 * Shared E27 Brass Threaded Screw Base helper for the 5 screw-base bulbs (`viewBox="0 0 92 112"`).
 */
const E27ScrewBase: React.FC<{ topY: number; bottomY?: number }> = ({ topY, bottomY = 108 }) => {
  const height = Math.max(16, bottomY - topY);
  const t1 = topY + height * 0.28;
  const t2 = topY + height * 0.56;
  const t3 = topY + height * 0.82;
  return (
    <g>
      {/* Brass Threaded Cylinder */}
      <rect x="33" y={topY} width="26" height={height - 4} rx="3.5" fill="#B45309" stroke="#78350F" strokeWidth="1.2" />
      {/* Thread Ridges */}
      <line x1="33" y1={t1} x2="59" y2={t1 - 1.5} stroke="#FDE68A" strokeWidth="2.1" strokeLinecap="round" />
      <line x1="33" y1={t2} x2="59" y2={t2 - 1.5} stroke="#FBBF24" strokeWidth="2.1" strokeLinecap="round" />
      <line x1="33" y1={t3} x2="59" y2={t3 - 1.5} stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
      {/* Bottom Black Ceramic Insulator Tip + Solder Contact */}
      <path d={`M37 ${bottomY - 4} H55 L51 ${bottomY} H41 Z`} fill="#0F172A" />
      <ellipse cx="46" cy={bottomY} rx="4.5" ry="2" fill="#CBD5E1" />
    </g>
  );
};

/**
 * Unified Pure-SVG Laboratory Bulb Renderer for all 7 catalog bulb models (`viewBox="0 0 92 112"`).
 * Geometry is calibrated to match `getInstalledBulbTopOffset(bulbType)` so every bulb seats flush
 * inside `E27SocketGraphic` or `PinSocketGraphic` with zero gap.
 */
export const BulbGraphic: React.FC<{
  bulbType: BulbType;
  brightness?: number;
  isBlown?: boolean;
  className?: string;
}> = ({ bulbType, brightness = 0, isBlown = false, className = 'w-full h-full' }) => {
  const uid = sanitizeId(useId());
  const lit = !isBlown && brightness > 0.01 ? Math.min(1, brightness) : 0;

  // 1. Incandescent Bulb (glass collar ends at y=78 to match offset -66)
  if (bulbType === 'incandescent') {
    const glassFill = isBlown
      ? '#334155'
      : lit > 0
      ? `rgba(254, 243, 199, ${0.42 + lit * 0.52})`
      : 'rgba(226, 232, 240, 0.22)';
    const filamentColor = isBlown ? '#475569' : lit > 0 ? '#FEF08A' : '#94A3B8';

    return (
      <svg viewBox="0 0 92 112" fill="none" xmlns="http://www.w3.org/2000/svg" className={`select-none pointer-events-none ${className}`} aria-hidden="true">
        <E27ScrewBase topY={78} bottomY={104} />
        {/* Pear Glass Globe */}
        <path
          d="M46 10 C27 10 17 24 17 40 C17 53 26 61 31 69 C32.5 72 33 75 33 78 H59 C59 75 59.5 72 61 69 C66 61 75 53 75 40 C75 24 65 10 46 10 Z"
          fill={glassFill}
          stroke={lit > 0 ? '#FBBF24' : '#94A3B8'}
          strokeWidth="1.6"
        />
        {/* Inner Glass Stem */}
        <path d="M40 78 L42 54 H50 L52 78" stroke="#94A3B8" strokeWidth="1.4" fill="rgba(148,163,184,0.2)" />
        {/* Tungsten Filament Support & Coil */}
        <path d="M42 54 L36 38 M50 54 L56 38" stroke="#CBD5E1" strokeWidth="1.3" strokeLinecap="round" />
        {isBlown ? (
          <path d="M36 38 L41 34 M51 34 L56 38" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" />
        ) : (
          <path
            d="M36 38 Q38.5 31 41 38 Q43.5 31 46 38 Q48.5 31 51 38 Q53.5 31 56 38"
            stroke={filamentColor}
            strokeWidth={lit > 0 ? 2.6 : 1.7}
            strokeLinecap="round"
            fill="none"
          />
        )}
        {/* Specular Glass Arc */}
        <path d="M25 36 C25 25 32 18 40 16" stroke="#FFFFFF" strokeOpacity={lit > 0 ? 0.85 : 0.45} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  // 2. Edison Vintage ST64 Bulb (glass collar ends at y=87 to match offset -74)
  if (bulbType === 'edison') {
    const glassFill = isBlown
      ? '#334155'
      : lit > 0
      ? `rgba(245, 158, 11, ${0.42 + lit * 0.48})`
      : 'rgba(217, 119, 6, 0.24)';

    return (
      <svg viewBox="0 0 92 112" fill="none" xmlns="http://www.w3.org/2000/svg" className={`select-none pointer-events-none ${className}`} aria-hidden="true">
        <E27ScrewBase topY={87} bottomY={109} />
        {/* Teardrop ST64 Amber Glass */}
        <path
          d="M46 6 C44 6 43 9 41 11 C27 16 19 30 19 46 C19 60 27 68 32 77 C33 80 33 83 33 87 H59 C59 83 59 80 60 77 C65 68 73 60 73 46 C73 30 65 16 51 11 C49 9 48 6 46 6 Z"
          fill={glassFill}
          stroke={lit > 0 ? '#F59E0B' : '#B45309'}
          strokeWidth="1.6"
        />
        {/* Tall Vintage Pillar & Squirrel-Cage Filaments */}
        <line x1="46" y1="86" x2="46" y2="28" stroke="#92400E" strokeWidth="2" />
        {!isBlown ? (
          <g stroke={lit > 0 ? '#FEF08A' : '#D97706'} strokeWidth={lit > 0 ? 2 : 1.3} strokeLinecap="round">
            <path d="M35 34 L38 68 M42 30 L42 68 M50 30 L50 68 M57 34 L54 68" />
            <path d="M35 34 Q46 25 57 34" fill="none" />
          </g>
        ) : (
          <path d="M36 42 L43 52 M56 44 L49 56" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" />
        )}
        <path d="M26 42 C26 30 32 21 39 17" stroke="#FEF3C7" strokeOpacity="0.5" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }

  // 3. CFL Neon U-Tube Bulb (ballast shoulder ends at y=85 to match offset -72)
  if (bulbType === 'cfl') {
    const tubeFill = isBlown
      ? '#475569'
      : lit > 0
      ? `rgba(224, 242, 254, ${0.75 + lit * 0.25})`
      : '#CBD5E1';

    return (
      <svg viewBox="0 0 92 112" fill="none" xmlns="http://www.w3.org/2000/svg" className={`select-none pointer-events-none ${className}`} aria-hidden="true">
        <E27ScrewBase topY={85} bottomY={108} />
        {/* Twin Phosphor Glass U-Tubes */}
        <path
          d="M27 64 V24 C27 14 43 14 43 24 V64"
          stroke={tubeFill}
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M27 64 V24 C27 14 43 14 43 24 V64"
          stroke={lit > 0 ? '#FFFFFF' : '#94A3B8'}
          strokeWidth="1.6"
          fill="none"
        />
        <path
          d="M49 64 V24 C49 14 65 14 65 24 V64"
          stroke={tubeFill}
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M49 64 V24 C49 14 65 14 65 24 V64"
          stroke={lit > 0 ? '#FFFFFF' : '#94A3B8'}
          strokeWidth="1.6"
          fill="none"
        />
        {/* Matte Electronic Ballast Collar */}
        <path
          d="M22 62 H70 V73 C70 80 64 85 58 85 H34 C28 85 22 80 22 73 V62 Z"
          fill="#E2E8F0"
          stroke="#64748B"
          strokeWidth="1.5"
        />
        <line x1="25" y1="71" x2="67" y2="71" stroke="#94A3B8" strokeWidth="1.2" />
      </svg>
    );
  }

  // 4. Standard Cool-White LED Bulb (heatsink collar ends at y=87 to match offset -74)
  if (bulbType === 'led_standard') {
    const domeFill = isBlown
      ? '#475569'
      : lit > 0
      ? '#F0F9FF'
      : '#E2E8F0';

    return (
      <svg viewBox="0 0 92 112" fill="none" xmlns="http://www.w3.org/2000/svg" className={`select-none pointer-events-none ${className}`} aria-hidden="true">
        <E27ScrewBase topY={87} bottomY={109} />
        {/* Frosted Polycarbonate Diffuser Dome */}
        <path
          d="M20 52 C20 26 31 12 46 12 C61 12 72 26 72 52 Z"
          fill={domeFill}
          stroke={lit > 0 ? '#38BDF8' : '#64748B'}
          strokeWidth="1.5"
        />
        {lit > 0 && (
          <ellipse cx="46" cy="36" rx="16" ry="13" fill="#FFFFFF" fillOpacity={0.55 + lit * 0.45} />
        )}
        {/* White/Silver Thermal Heatsink Body */}
        <path
          d="M20 52 H72 L63 82 C61.5 85.5 59.5 87 56 87 H36 C32.5 87 30.5 85.5 29 82 L20 52 Z"
          fill="#CBD5E1"
          stroke="#64748B"
          strokeWidth="1.5"
        />
        {/* Heatsink Cooling Collar Accent */}
        <rect x="21" y="52" width="50" height="5" rx="1.5" fill="#94A3B8" />
        <text x="46" y="74" textAnchor="middle" fill="#334155" fontSize="8.5" fontWeight="800" fontFamily="'IBM Plex Mono', monospace">
          LED
        </text>
      </svg>
    );
  }

  // 5. Smart RGB LED Bulb (heatsink collar ends at y=87 to match offset -74)
  if (bulbType === 'led_rgb') {
    return (
      <svg viewBox="0 0 92 112" fill="none" xmlns="http://www.w3.org/2000/svg" className={`select-none pointer-events-none ${className}`} aria-hidden="true">
        <defs>
          <linearGradient id={`rgb-dome-${uid}`} x1="20" y1="16" x2="72" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={isBlown ? '#475569' : lit > 0 ? '#F472B6' : '#C084FC'} />
            <stop offset="50%" stopColor={isBlown ? '#334155' : lit > 0 ? '#A855F7' : '#818CF8'} />
            <stop offset="100%" stopColor={isBlown ? '#1E293B' : lit > 0 ? '#38BDF8' : '#38BDF8'} />
          </linearGradient>
        </defs>
        <E27ScrewBase topY={87} bottomY={109} />
        {/* Smart RGB Prismatic Diffuser Dome */}
        <path
          d="M20 52 C20 26 31 12 46 12 C61 12 72 26 72 52 Z"
          fill={`url(#rgb-dome-${uid})`}
          fillOpacity={isBlown ? 0.55 : lit > 0 ? 0.95 : 0.62}
          stroke={lit > 0 ? '#E879F9' : '#64748B'}
          strokeWidth="1.5"
        />
        {lit > 0 && (
          <ellipse cx="46" cy="34" rx="14" ry="10" fill="#FFFFFF" fillOpacity={0.35 + lit * 0.45} />
        )}
        {/* Slate-Anodized Smart Heatsink Housing */}
        <path
          d="M20 52 H72 L63 82 C61.5 85.5 59.5 87 56 87 H36 C32.5 87 30.5 85.5 29 82 L20 52 Z"
          fill="#1E293B"
          stroke="#64748B"
          strokeWidth="1.5"
        />
        <rect x="21" y="52" width="50" height="4.5" rx="1.5" fill="#475569" />
        <text x="46" y="74" textAnchor="middle" fill="#E2E8F0" fontSize="8" fontWeight="800" fontFamily="'IBM Plex Mono', monospace">
          RGB
        </text>
      </svg>
    );
  }

  // 6. G4 Quartz Halogen Capsule (pinch collar ends at y=91 to match offset -86 on PinSocket)
  if (bulbType === 'halogen') {
    const capsuleFill = isBlown
      ? '#334155'
      : lit > 0
      ? `rgba(254, 249, 195, ${0.5 + lit * 0.48})`
      : 'rgba(226, 232, 240, 0.28)';

    return (
      <svg viewBox="0 0 92 112" fill="none" xmlns="http://www.w3.org/2000/svg" className={`select-none pointer-events-none ${className}`} aria-hidden="true">
        {/* Dual Metallic Contact Pins (42.3% -> x=39, 57.6% -> x=53) */}
        <rect x="37.5" y="90" width="3" height="20" rx="1.2" fill="#CBD5E1" stroke="#475569" strokeWidth="0.9" />
        <rect x="51.5" y="90" width="3" height="20" rx="1.2" fill="#CBD5E1" stroke="#475569" strokeWidth="0.9" />

        {/* Quartz Glass Capsule */}
        <path
          d="M32 32 C32 23 38 18 46 18 C54 18 60 23 60 32 V83 H32 V32 Z"
          fill={capsuleFill}
          stroke={lit > 0 ? '#FDE047' : '#94A3B8'}
          strokeWidth="1.6"
        />
        {/* Sealed Pinch Collar */}
        <rect x="31" y="81" width="30" height="10" rx="2" fill="#334155" stroke="#64748B" strokeWidth="1.3" />
        {/* Compact High-Intensity Halogen Filament */}
        <path d="M39 81 V48 M53 81 V48" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
        {!isBlown ? (
          <path
            d="M39 48 H53 M41 44 H51 M41 52 H51"
            stroke={lit > 0 ? '#FEF08A' : '#94A3B8'}
            strokeWidth={lit > 0 ? 2.4 : 1.5}
            strokeLinecap="round"
          />
        ) : (
          <path d="M39 48 L44 43 M53 48 L48 53" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" />
        )}
        <line x1="37" y1="28" x2="37" y2="74" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  // 7. 5mm Green Indicator LED Diode (flange ends at y=51 to match offset -46 on PinSocket)
  const epoxyFill = isBlown
    ? '#334155'
    : lit > 0
    ? '#34D399'
    : '#15803D';

  return (
    <svg viewBox="0 0 92 112" fill="none" xmlns="http://www.w3.org/2000/svg" className={`select-none pointer-events-none ${className}`} aria-hidden="true">
      {/* Anode (+) Left Leg (x=35, slightly longer) & Cathode (-) Right Leg (x=57) */}
      <rect x="33.5" y="51" width="3.2" height="56" rx="1.2" fill="#CBD5E1" stroke="#475569" strokeWidth="0.9" />
      <rect x="55.3" y="51" width="3.2" height="50" rx="1.2" fill="#94A3B8" stroke="#475569" strokeWidth="0.9" />
      {/* Tiny Polarity Hint on Legs */}
      <text x="27" y="68" textAnchor="middle" fill="#EF4444" fontSize="9" fontWeight="800" fontFamily="'IBM Plex Mono', monospace">
        +
      </text>
      <text x="65" y="68" textAnchor="middle" fill="#94A3B8" fontSize="9" fontWeight="800" fontFamily="'IBM Plex Mono', monospace">
        -
      </text>

      {/* 5mm Emerald Epoxy Dome */}
      <path
        d="M30 46 V30 C30 19 37 13 46 13 C55 13 62 19 62 30 V46 Z"
        fill={epoxyFill}
        fillOpacity={isBlown ? 0.65 : lit > 0 ? 0.96 : 0.78}
        stroke={lit > 0 ? '#A7F3D0' : '#475569'}
        strokeWidth="1.5"
      />
      {/* Internal Anode/Cathode Lead Frame Cup */}
      <path d="M40 46 V32 H44 M52 46 V30 L47 34" stroke={lit > 0 ? '#ECFDF5' : '#064E3B'} strokeWidth="1.5" strokeLinecap="round" />
      {lit > 0 && <circle cx="46" cy="29" r="7" fill="#ECFDF5" fillOpacity={0.35 + lit * 0.55} />}
      {/* Epoxy Base Flange Rim */}
      <rect x="27" y="45" width="38" height="6" rx="2" fill={epoxyFill} stroke="#475569" strokeWidth="1.3" />
      {/* Specular Dome Highlight */}
      <path d="M36 28 C36 22 39 18 44 17" stroke="#FFFFFF" strokeOpacity="0.65" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
};

/**
 * Benchtop Digital Voltmeter Instrument Chassis (`viewBox="0 0 96 112"`).
 * Matches `KnifeSwitchGraphic` bakelite/slate enclosure + crimson (+) & slate (-) binding posts.
 */
export const VoltmeterGraphic: React.FC<{
  displayValue?: string;
  className?: string;
}> = ({ displayValue, className = 'w-full h-full' }) => (
  <svg viewBox="0 0 96 112" fill="none" xmlns="http://www.w3.org/2000/svg" className={`select-none pointer-events-none ${className}`} aria-hidden="true">
    {/* Outer Protective Instrument Case */}
    <rect x="6" y="4" width="84" height="96" rx="12" fill="#0F172A" stroke="#475569" strokeWidth="1.8" />
    <rect x="10" y="8" width="76" height="88" rx="9" fill="#1E293B" stroke="#334155" strokeWidth="1" />

    {/* Recessed Dark LCD Readout Bezel */}
    <rect x="14" y="14" width="68" height="42" rx="6" fill="#060B13" stroke="#38BDF8" strokeOpacity="0.45" strokeWidth="1.4" />
    {displayValue !== undefined && (
      <>
        <text x="48" y="25" textAnchor="middle" fill="#94A3B8" fontSize="6.5" fontWeight="700" fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.8">
          DC VOLT
        </text>
        <text x="48" y="44" textAnchor="middle" fill="#7DD3FC" fontSize="13.5" fontWeight="800" fontFamily="'IBM Plex Mono', monospace">
          {displayValue}V
        </text>
      </>
    )}

    {/* Instrument Mode Pill & V Symbol */}
    <circle cx="48" cy="72" r="10.5" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.4" />
    <text x="48" y="76.5" textAnchor="middle" fill="#38BDF8" fontSize="13" fontWeight="800" fontFamily="'IBM Plex Mono', monospace">
      V
    </text>
    <text x="24" y="86" textAnchor="middle" fill="#F87171" fontSize="9" fontWeight="800" fontFamily="'IBM Plex Mono', monospace">
      +
    </text>
    <text x="72" y="86" textAnchor="middle" fill="#94A3B8" fontSize="9" fontWeight="800" fontFamily="'IBM Plex Mono', monospace">
      -
    </text>

    {/* Bottom Binding Post Collars aligned with p1 (28% -> x=27) & p2 (72% -> x=69) */}
    <rect x="20" y="96" width="14" height="10" rx="3" fill="#DC2626" stroke="#FCA5A5" strokeWidth="1.2" />
    <rect x="62" y="96" width="14" height="10" rx="3" fill="#334155" stroke="#94A3B8" strokeWidth="1.2" />
  </svg>
);

/**
 * Benchtop Digital Ammeter Instrument Chassis (`viewBox="0 0 96 106"`).
 * Matches `KnifeSwitchGraphic` bakelite/slate enclosure + emerald (+) & slate (-) binding posts.
 */
export const AmmeterGraphic: React.FC<{
  displayValue?: string;
  isShortCircuit?: boolean;
  className?: string;
}> = ({ displayValue, isShortCircuit = false, className = 'w-full h-full' }) => (
  <svg viewBox="0 0 96 106" fill="none" xmlns="http://www.w3.org/2000/svg" className={`select-none pointer-events-none ${className}`} aria-hidden="true">
    <rect
      x="6"
      y="4"
      width="84"
      height="90"
      rx="12"
      fill="#0F172A"
      stroke={isShortCircuit ? '#EF4444' : '#475569'}
      strokeWidth="1.8"
    />
    <rect x="10" y="8" width="76" height="82" rx="9" fill="#1E293B" stroke="#334155" strokeWidth="1" />

    {/* Recessed Dark LCD Readout Bezel */}
    <rect
      x="14"
      y="14"
      width="68"
      height="38"
      rx="6"
      fill="#060B13"
      stroke={isShortCircuit ? '#EF4444' : '#34D399'}
      strokeOpacity="0.5"
      strokeWidth="1.4"
    />
    {displayValue !== undefined && (
      <>
        <text x="48" y="24" textAnchor="middle" fill="#94A3B8" fontSize="6.5" fontWeight="700" fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.8">
          DC AMPERE
        </text>
        <text
          x="48"
          y="42"
          textAnchor="middle"
          fill={isShortCircuit ? '#FCA5A5' : '#6EE7B7'}
          fontSize="12"
          fontWeight="800"
          fontFamily="'IBM Plex Mono', monospace"
        >
          {displayValue}
        </text>
      </>
    )}

    {/* Instrument Center Dial Badge */}
    <circle cx="48" cy="68" r="10.5" fill="#0F172A" stroke="#34D399" strokeWidth="1.4" />
    <text x="48" y="72.5" textAnchor="middle" fill="#34D399" fontSize="13" fontWeight="800" fontFamily="'IBM Plex Mono', monospace">
      A
    </text>
    <text x="24" y="81" textAnchor="middle" fill="#34D399" fontSize="8" fontWeight="800" fontFamily="'IBM Plex Mono', monospace">
      IN
    </text>
    <text x="72" y="81" textAnchor="middle" fill="#94A3B8" fontSize="8" fontWeight="800" fontFamily="'IBM Plex Mono', monospace">
      OUT
    </text>

    {/* Bottom Binding Post Collars aligned with p1 (28% -> x=27) & p2 (72% -> x=69) */}
    <rect x="20" y="90" width="14" height="10" rx="3" fill="#059669" stroke="#A7F3D0" strokeWidth="1.2" />
    <rect x="62" y="90" width="14" height="10" rx="3" fill="#334155" stroke="#94A3B8" strokeWidth="1.2" />
  </svg>
);

/**
 * Laboratory Earthing / Ground 0V Reference Terminal (`viewBox="0 0 68 88"`).
 */
export const GroundGraphic: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 68 88" fill="none" xmlns="http://www.w3.org/2000/svg" className={`select-none pointer-events-none ${className}`} aria-hidden="true">
    {/* Top Knurled Brass Binding Post */}
    <rect x="26" y="4" width="16" height="12" rx="3" fill="#D97706" stroke="#FEF3C7" strokeWidth="1.2" />
    <line x1="30" y1="6" x2="30" y2="14" stroke="#78350F" strokeWidth="1.2" />
    <line x1="34" y1="6" x2="34" y2="14" stroke="#78350F" strokeWidth="1.2" />
    <line x1="38" y1="6" x2="38" y2="14" stroke="#78350F" strokeWidth="1.2" />

    {/* Slate Instrument Housing */}
    <rect x="10" y="15" width="48" height="66" rx="10" fill="#0F172A" stroke="#475569" strokeWidth="1.6" />
    <rect x="14" y="19" width="40" height="58" rx="7" fill="#1E293B" stroke="#334155" strokeWidth="1" />

    {/* IEC Earth Ground Symbol */}
    <line x1="34" y1="26" x2="34" y2="41" stroke="#34D399" strokeWidth="2.8" strokeLinecap="round" />
    <line x1="20" y1="41" x2="48" y2="41" stroke="#34D399" strokeWidth="2.8" strokeLinecap="round" />
    <line x1="24.5" y1="48" x2="43.5" y2="48" stroke="#34D399" strokeWidth="2.6" strokeLinecap="round" />
    <line x1="29.5" y1="55" x2="38.5" y2="55" stroke="#34D399" strokeWidth="2.4" strokeLinecap="round" />

    {/* 0V GND Readout Pill */}
    <rect x="17" y="61" width="34" height="12" rx="3" fill="#0F172A" stroke="#34D399" strokeOpacity="0.45" strokeWidth="1" />
    <text x="34" y="70" textAnchor="middle" fill="#A7F3D0" fontSize="7.5" fontWeight="800" fontFamily="'IBM Plex Mono', monospace">
      0V GND
    </text>
  </svg>
);

/**
 * Shared Palette Preview Renderer for indoor lab components.
 * Guarantees 1-to-1 visual fidelity between `PaletteTile` and live Canvas Nodes.
 * Returns `null` for outdoor generator entries so `PaletteTile` falls back to their sprite artwork.
 */
export function renderLabPalettePreview(
  type: ComponentType,
  bulbType?: BulbType
): React.ReactNode | null {
  switch (type) {
    case 'battery':
      return <BatteryAAGraphic className="w-[74%] h-[86%]" />;
    case 'battery9v':
      return <Battery9VGraphic className="w-[78%] h-[86%]" />;
    case 'battery-holder':
      return <BatteryHolderGraphic batteryCount={2} className="w-[82%] h-[86%]" />;
    case 'resistor':
      return <ResistorGraphic resistance={100} className="w-[88%] h-[58%]" />;
    case 'switch':
      return <KnifeSwitchGraphic isOpen={true} className="w-[88%] h-[84%]" />;
    case 'socket':
      return <E27SocketGraphic layer="full" hasBulb={false} className="w-[62%] h-[78%]" />;
    case 'pin-socket':
      return <PinSocketGraphic layer="full" className="w-[62%] h-[78%]" />;
    case 'bulb':
      return <BulbGraphic bulbType={bulbType ?? 'incandescent'} brightness={0.45} className="w-[82%] h-[86%]" />;
    case 'voltmeter':
      return <VoltmeterGraphic displayValue="0.00" className="w-[80%] h-[86%]" />;
    case 'ammeter':
      return <AmmeterGraphic displayValue="0.0 mA" className="w-[80%] h-[86%]" />;
    case 'ground':
      return <GroundGraphic className="w-[76%] h-[84%]" />;
    default:
      return null;
  }
}
