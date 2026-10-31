import React from 'react';

interface PresetThumbnailProps {
  presetId: string;
  category?: string;
}

/**
 * Renders an optimized vector thumbnail for circuit presets.
 * Displays accurate schematic silhouettes (power source, switches, lamps, meter nodes)
 * with dark-glass industrial styling.
 *
 * Time Complexity: O(1)
 */
export const PresetThumbnail: React.FC<PresetThumbnailProps> = ({ presetId }) => {
  switch (presetId) {
    case 'simple-lamp':
      return (
        <svg viewBox="0 0 200 120" className="w-full h-full bg-void-950/80 rounded-xl p-2" fill="none">
          {/* Wire loop */}
          <rect x="30" y="25" width="140" height="70" rx="8" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 3" />
          {/* Battery */}
          <rect x="22" y="45" width="16" height="30" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <line x1="30" y1="40" x2="30" y2="45" stroke="#ef4444" strokeWidth="3" />
          <text x="30" y="64" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">3V</text>
          {/* Switch */}
          <circle cx="100" cy="25" r="4" fill="#38bdf8" />
          <circle cx="125" cy="25" r="4" fill="#38bdf8" />
          <line x1="100" y1="25" x2="122" y2="15" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          {/* Bulb */}
          <circle cx="170" cy="60" r="14" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="2" />
          <path d="M 163 67 L 177 53 M 163 53 L 177 67" stroke="#f59e0b" strokeWidth="2" />
        </svg>
      );

    case 'voltage-divider':
      return (
        <svg viewBox="0 0 200 120" className="w-full h-full bg-void-950/80 rounded-xl p-2" fill="none">
          {/* Series loop with 3 bulbs */}
          <rect x="25" y="25" width="150" height="70" rx="8" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 3" />
          {/* Battery */}
          <rect x="17" y="45" width="16" height="30" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          {/* Bulb 1 */}
          <circle cx="75" cy="25" r="11" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="2" />
          <path d="M 70 30 L 80 20 M 70 20 L 80 30" stroke="#f59e0b" strokeWidth="1.5" />
          {/* Bulb 2 */}
          <circle cx="175" cy="60" r="11" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="2" />
          <path d="M 170 65 L 180 55 M 170 55 L 180 65" stroke="#f59e0b" strokeWidth="1.5" />
          {/* Bulb 3 */}
          <circle cx="100" cy="95" r="11" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="2" />
          <path d="M 95 100 L 105 90 M 95 90 L 105 100" stroke="#f59e0b" strokeWidth="1.5" />
        </svg>
      );

    case 'parallel-bulbs':
      return (
        <svg viewBox="0 0 200 120" className="w-full h-full bg-void-950/80 rounded-xl p-2" fill="none">
          {/* Battery on left */}
          <rect x="20" y="45" width="16" height="30" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          {/* Bus rails */}
          <line x1="28" y1="25" x2="175" y2="25" stroke="#38bdf8" strokeWidth="2.5" />
          <line x1="28" y1="95" x2="175" y2="95" stroke="#64748b" strokeWidth="2.5" />
          <line x1="28" y1="45" x2="28" y2="25" stroke="#38bdf8" strokeWidth="2.5" />
          <line x1="28" y1="75" x2="28" y2="95" stroke="#64748b" strokeWidth="2.5" />
          {/* 3 Parallel branches */}
          {[75, 120, 165].map((branchX, idx) => (
            <g key={idx}>
              <line x1={branchX} y1="25" x2={branchX} y2="48" stroke="#38bdf8" strokeWidth="1.8" />
              <circle cx={branchX} cy="60" r="11" fill="#f59e0b" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="2" />
              <path d={`M ${branchX - 5} 65 L ${branchX + 5} 55 M ${branchX - 5} 55 L ${branchX + 5} 65`} stroke="#f59e0b" strokeWidth="1.5" />
              <line x1={branchX} y1="72" x2={branchX} y2="95" stroke="#64748b" strokeWidth="1.8" />
            </g>
          ))}
        </svg>
      );

    case 'short-circuit-demo':
      return (
        <svg viewBox="0 0 200 120" className="w-full h-full bg-void-950/80 rounded-xl p-2" fill="none">
          <rect x="30" y="25" width="140" height="70" rx="8" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="3 3" />
          {/* 9V Battery */}
          <rect x="22" y="45" width="16" height="30" rx="3" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="2" />
          <text x="30" y="64" fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="middle">9V</text>
          {/* Short bypass switch */}
          <line x1="100" y1="25" x2="100" y2="95" stroke="#ef4444" strokeWidth="3" />
          <circle cx="100" cy="60" r="9" fill="#ef4444" fillOpacity="0.8" />
          <path d="M 97 55 L 103 65 M 103 55 L 97 65" stroke="#ffffff" strokeWidth="2" />
          {/* Bulb (bypassed) */}
          <circle cx="170" cy="60" r="12" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
        </svg>
      );

    case 'ultimate-power-grid':
      return (
        <svg viewBox="0 0 200 120" className="w-full h-full bg-void-950/80 rounded-xl p-2" fill="none">
          {/* Smart Grid Multi-bus network */}
          <line x1="20" y1="30" x2="180" y2="30" stroke="#38bdf8" strokeWidth="2" />
          <line x1="20" y1="90" x2="180" y2="90" stroke="#64748b" strokeWidth="2" />
          {/* Battery & meter */}
          <rect x="15" y="45" width="14" height="28" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx="48" cy="60" r="9" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="48" y="63" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="middle">V</text>
          <circle cx="75" cy="60" r="9" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="75" y="63" fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle">A</text>
          {/* Load zones */}
          <circle cx="115" cy="60" r="10" fill="#f59e0b" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="1.5" />
          <circle cx="145" cy="60" r="10" fill="#10b981" fillOpacity="0.3" stroke="#10b981" strokeWidth="1.5" />
          <circle cx="175" cy="60" r="10" fill="#a855f7" fillOpacity="0.3" stroke="#a855f7" strokeWidth="1.5" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 200 120" className="w-full h-full bg-void-950/80 rounded-xl p-2" fill="none">
          <rect x="30" y="25" width="140" height="70" rx="8" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
          <circle cx="100" cy="60" r="14" fill="#38bdf8" fillOpacity="0.15" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="100" y="64" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">★</text>
        </svg>
      );
  }
};
