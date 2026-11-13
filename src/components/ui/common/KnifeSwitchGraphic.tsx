import React from 'react';

export interface KnifeSwitchGraphicProps {
  /** Whether the SPST knife blade is open (disconnected) or closed (conducting). */
  isOpen: boolean;
  /** Whether active electric current is currently flowing through the closed switch. */
  isCurrentFlowing?: boolean;
  /** Whether the switch is experiencing a short-circuit overcurrent fault. */
  isShorted?: boolean;
  /** Optional CSS class name for sizing the outer SVG container. */
  className?: string;
}

/**
 * Pure-code SVG SPST Knife Switch Graphic (`KnifeSwitchGraphic.tsx`).
 *
 * Replaces external PNG assets (`/assets/switch-knife.png`) with a deterministic,
 * vector-engineered laboratory knife switch (Saklar Pisau).
 * - Uses hardware-accelerated CSS rotation around the left brass pivot (`(24, 44)`)
 *   so toggling between OPEN (`-32deg`) and CLOSED (`0deg`) animates a physical
 *   copper blade seating into the right brass contact jaw.
 * - Shared across `SwitchNode.tsx` (canvas node) and `ComponentGlyph.tsx` (palette tile)
 *   to strictly uphold the DRY principle.
 *
 * Time Complexity: O(1) deterministic SVG render.
 * Space Complexity: O(1) static DOM nodes.
 *
 * @param props Switch state and styling properties
 * @returns React SVG element representing the physical SPST knife switch
 */
export const KnifeSwitchGraphic: React.FC<KnifeSwitchGraphicProps> = ({
  isOpen,
  isCurrentFlowing = false,
  isShorted = false,
  className = 'w-full h-full',
}) => {
  const bladeRotationDeg = isOpen ? -32 : 0;
  const activeGlowColor = isShorted
    ? '#f87171'
    : isCurrentFlowing
    ? '#34d399'
    : '#f59e0b';

  return (
    <svg
      viewBox="0 0 108 82"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Bakelite / Industrial Slate Base Plinth */}
      <rect
        x="10"
        y="48"
        width="88"
        height="16"
        rx="4"
        fill="#0f172a"
        stroke="#475569"
        strokeWidth="1.5"
      />
      <rect
        x="14"
        y="50"
        width="80"
        height="5"
        rx="2"
        fill="#1e293b"
      />

      {/* Base Mounting Screws */}
      <circle cx="17" cy="56" r="2" fill="#64748b" />
      <circle cx="91" cy="56" r="2" fill="#64748b" />

      {/* Internal Conduction Trace on Base (lights up when closed & conducting) */}
      <line
        x1="12"
        y1="51"
        x2="26"
        y2="51"
        stroke={!isOpen && isCurrentFlowing ? activeGlowColor : '#b45309'}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="82"
        y1="51"
        x2="96"
        y2="51"
        stroke={!isOpen && isCurrentFlowing ? activeGlowColor : '#b45309'}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Left Brass Hinge Post (p1 Pivot Pedestal) */}
      <rect
        x="20"
        y="34"
        width="10"
        height="15"
        rx="2"
        fill="#d97706"
        stroke="#fbbf24"
        strokeWidth="1.2"
      />

      {/* Right Brass Contact Jaw (p2 Receiver Fork) */}
      <path
        d="M78 33 H88 V49 H78 V33 Z"
        fill="#d97706"
        stroke="#fbbf24"
        strokeWidth="1.2"
      />
      {/* Contact Slot Indentation */}
      <rect x="81" y="34" width="4" height="9" rx="1" fill="#78350f" />

      {/* Closed Contact Spark / Current Indicator Ring */}
      {!isOpen && (
        <circle
          cx="83"
          cy="39"
          r="6"
          fill={isShorted ? 'rgba(239,68,68,0.28)' : 'rgba(52,211,153,0.25)'}
          stroke={activeGlowColor}
          strokeWidth="1.2"
        />
      )}

      {/* Pivoting Copper Knife Blade + Insulated Red Handle */}
      <g
        style={{
          transformOrigin: '25px 40px',
          transform: `rotate(${bladeRotationDeg}deg)`,
          transition: 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Copper Knife Arm */}
        <rect
          x="23"
          y="37"
          width="58"
          height="5.5"
          rx="2"
          fill={!isOpen && isCurrentFlowing ? '#34d399' : '#f59e0b'}
          stroke={!isOpen && isCurrentFlowing ? '#a7f3d0' : '#fef3c7'}
          strokeWidth="1"
        />

        {/* Metallic Hinge Pin */}
        <circle
          cx="25"
          cy="39.75"
          r="2.8"
          fill="#fef3c7"
          stroke="#78350f"
          strokeWidth="1"
        />

        {/* Insulated Tactile Red Grip Handle */}
        <rect
          x="64"
          y="34.5"
          width="24"
          height="10.5"
          rx="3.5"
          fill="#dc2626"
          stroke="#fca5a5"
          strokeWidth="1.2"
        />
        {/* Grip Ridges */}
        <line x1="71" y1="36.5" x2="71" y2="43" stroke="#991b1b" strokeWidth="1.2" />
        <line x1="76" y1="36.5" x2="76" y2="43" stroke="#991b1b" strokeWidth="1.2" />
        <line x1="81" y1="36.5" x2="81" y2="43" stroke="#991b1b" strokeWidth="1.2" />
      </g>
    </svg>
  );
};
