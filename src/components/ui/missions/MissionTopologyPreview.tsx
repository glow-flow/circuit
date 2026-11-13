import React from 'react';

export interface MissionVisualMeta {
  shortTabId: string;
  shortTabEn: string;
  summaryId: string;
  summaryEn: string;
  targetBadgeId: string;
  targetBadgeEn: string;
}

const MISSION_META_MAP: Readonly<Record<string, MissionVisualMeta>> = {
  'parallel-3-bulbs': {
    shortTabId: 'Paralel 3 Lampu',
    shortTabEn: '3-Bulb Parallel',
    summaryId: 'Rangkai 3 fiting lampu secara paralel murni dari 1 baterai agar menyala sama terang.',
    summaryEn: 'Wire 3 bulbs in pure parallel from a battery so all shine with identical voltage.',
    targetBadgeId: 'Target: 3 Cabang Sejajar',
    targetBadgeEn: 'Target: 3 Equal Branches',
  },
  'resolve-short-circuit': {
    shortTabId: 'Selamatkan Korslet',
    shortTabEn: 'Fix Short Circuit',
    summaryId: 'Temukan kabel bypass tanpa beban yang bikin korslet, potong jalurnya, lalu nyalakan lampu aman.',
    summaryEn: 'Find the zero-load shorting wire, cut it, and restore safe illumination.',
    targetBadgeId: 'Target: 0 Korslet · Lampu ON',
    targetBadgeEn: 'Target: 0 Shorts · Bulb ON',
  },
  'repair-reversed-led': {
    shortTabId: 'Polaritas LED',
    shortTabEn: 'LED Polarity',
    summaryId: 'Balik sambungan fiting LED supaya Pin 1 Anoda (+) mendapat potensial positif (Forward Bias).',
    summaryEn: 'Flip the LED wiring so Pin 1 Anode (+) receives positive voltage (Forward Bias).',
    targetBadgeId: 'Target: Anoda(+) -> Katoda(-)',
    targetBadgeEn: 'Target: Anode(+) -> Cathode(-)',
  },
  'solar-grid-connection': {
    shortTabId: 'PLTS ke Lab',
    shortTabEn: 'Solar to Lab',
    summaryId: 'Hubungkan Panel Surya 12V ke Panel MCB (ON) lalu salurkan arus ke lampu beban (>10 mA).',
    summaryEn: 'Wire a 12V Solar Panel through an active MCB panel into a load lamp (>10 mA).',
    targetBadgeId: 'Target: PLTS -> MCB ON -> Beban',
    targetBadgeEn: 'Target: Solar -> MCB ON -> Load',
  },
  'energy-efficiency-challenge': {
    shortTabId: 'Audit Hemat <=5W',
    shortTabEn: 'Under 5W Audit',
    summaryId: 'Nyalakan minimal 2 titik lampu pakai bohlam LED/CFL agar total daya tetap <= 5.0 Watt.',
    summaryEn: 'Light 2+ room sockets using high-efficiency LED/CFL bulbs under 5.0 Watts total.',
    targetBadgeId: 'Target: 2+ LED · P <= 5.0 W',
    targetBadgeEn: 'Target: 2+ LEDs · P <= 5.0 W',
  },
};

const FALLBACK_MISSION_META: MissionVisualMeta = {
  shortTabId: 'Misi Lab',
  shortTabEn: 'Lab Mission',
  summaryId: 'Susun rangkaian di kanvas hingga semua target validasi menyala hijau.',
  summaryEn: 'Build the circuit on canvas until every validation objective turns green.',
  targetBadgeId: 'Target Praktikum',
  targetBadgeEn: 'Lab Objective',
};

/**
 * Retrieves concise anti-slop mission summary & tab label metadata in O(1).
 * Safely falls back for future/unknown mission identifiers.
 *
 * Time Complexity: O(1).
 */
export function getMissionVisualMeta(missionId: string): MissionVisualMeta {
  return MISSION_META_MAP[missionId] ?? FALLBACK_MISSION_META;
}

interface MissionTopologyPreviewProps {
  missionId: string;
  isId: boolean;
}

/**
 * Renders a compact crisp vector diagram illustrating each mission's electrical target topology.
 * Keeps screen density light on mobile devices without walls of prose.
 *
 * Time Complexity: O(1).
 */
export const MissionTopologyPreview: React.FC<MissionTopologyPreviewProps> = ({
  missionId,
  isId,
}) => {
  const meta = getMissionVisualMeta(missionId);

  const renderSvgDiagram = () => {
    switch (missionId) {
      case 'parallel-3-bulbs':
        return (
          <svg viewBox="0 0 320 82" className="w-full h-auto max-h-24 select-none">
            <path d="M 52 22 L 268 22" fill="none" stroke="#38bdf8" strokeWidth="2" />
            <path d="M 52 62 L 268 62" fill="none" stroke="#64748b" strokeWidth="2" />
            <rect x="20" y="20" width="42" height="44" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="41" y="46" textAnchor="middle" fill="#7dd3fc" fontSize="10" fontWeight="700" fontFamily="JetBrains Mono, monospace">
              9V
            </text>
            {[115, 190, 265].map((x, idx) => (
              <g key={x}>
                <line x1={x} y1="22" x2={x} y2="62" stroke="#38bdf8" strokeWidth="1.8" />
                <circle cx={x} cy="42" r="13" fill="#090d16" stroke="#facc15" strokeWidth="1.6" />
                <text x={x} y="45" textAnchor="middle" fill="#fde047" fontSize="9" fontWeight="700">
                  L{idx + 1}
                </text>
              </g>
            ))}
          </svg>
        );

      case 'resolve-short-circuit':
        return (
          <svg viewBox="0 0 320 82" className="w-full h-auto max-h-24 select-none">
            <path d="M 58 22 L 260 22 L 260 62 L 58 62 Z" fill="none" stroke="#38bdf8" strokeWidth="2" />
            <rect x="22" y="20" width="44" height="44" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="44" y="46" textAnchor="middle" fill="#7dd3fc" fontSize="10" fontWeight="700" fontFamily="JetBrains Mono, monospace">
              BAT
            </text>
            {/* Dashed fault wire to cut */}
            <line x1="152" y1="22" x2="152" y2="62" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="4 3" />
            <circle cx="152" cy="42" r="12" fill="#4c0519" stroke="#f43f5e" strokeWidth="1.5" />
            <text x="152" y="45" textAnchor="middle" fill="#fda4af" fontSize="8.5" fontWeight="700">
              {isId ? 'POTONG' : 'CUT'}
            </text>
            <circle cx="260" cy="42" r="14" fill="#090d16" stroke="#facc15" strokeWidth="1.8" />
            <text x="260" y="45" textAnchor="middle" fill="#fde047" fontSize="9" fontWeight="700">
              ON
            </text>
          </svg>
        );

      case 'repair-reversed-led':
        return (
          <svg viewBox="0 0 320 82" className="w-full h-auto max-h-24 select-none">
            <path d="M 58 24 L 260 24 L 260 60 L 58 60 Z" fill="none" stroke="#10b981" strokeWidth="2" />
            <rect x="22" y="20" width="44" height="44" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="44" y="38" textAnchor="middle" fill="#7dd3fc" fontSize="9" fontWeight="700">+5V</text>
            <text x="44" y="54" textAnchor="middle" fill="#94a3b8" fontSize="8">GND</text>
            <rect x="115" y="10" width="94" height="28" rx="7" fill="#090d16" stroke="#10b981" strokeWidth="1.6" />
            <polygon points="145,17 145,31 163,24" fill="#34d399" />
            <line x1="164" y1="16" x2="164" y2="32" stroke="#e2e8f0" strokeWidth="2" />
            <text x="190" y="27" textAnchor="middle" fill="#6ee7b7" fontSize="8.5" fontWeight="700">
              + Anoda
            </text>
          </svg>
        );

      case 'solar-grid-connection':
        return (
          <svg viewBox="0 0 320 82" className="w-full h-auto max-h-24 select-none">
            <line x1="76" y1="41" x2="255" y2="41" stroke="#10b981" strokeWidth="2.5" />
            <rect x="16" y="18" width="66" height="46" rx="8" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="49" y="45" textAnchor="middle" fill="#fde68a" fontSize="9.5" fontWeight="700">
              PLTS 12V
            </text>
            <rect x="122" y="21" width="76" height="40" rx="8" fill="#090d16" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="160" y="44" textAnchor="middle" fill="#7dd3fc" fontSize="9.5" fontWeight="700">
              MCB ON
            </text>
            <circle cx="268" cy="41" r="16" fill="#090d16" stroke="#10b981" strokeWidth="1.8" />
            <text x="268" y="44" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="700">
              LAB
            </text>
          </svg>
        );

      case 'energy-efficiency-challenge':
      default:
        return (
          <svg viewBox="0 0 320 82" className="w-full h-auto max-h-24 select-none">
            <path d="M 58 22 L 262 22" fill="none" stroke="#10b981" strokeWidth="2" />
            <path d="M 58 62 L 262 62" fill="none" stroke="#64748b" strokeWidth="2" />
            <rect x="20" y="20" width="44" height="44" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="42" y="46" textAnchor="middle" fill="#7dd3fc" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">
              9V
            </text>
            {[135, 225].map((x, idx) => (
              <g key={x}>
                <line x1={x} y1="22" x2={x} y2="62" stroke="#10b981" strokeWidth="1.8" />
                <circle cx={x} cy="42" r="14" fill="#090d16" stroke="#34d399" strokeWidth="1.8" />
                <text x={x} y="45" textAnchor="middle" fill="#6ee7b7" fontSize="8.5" fontWeight="700">
                  LED{idx + 1}
                </text>
              </g>
            ))}
            <text x="278" y="45" fill="#34d399" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">
              &lt;=5W
            </text>
          </svg>
        );
    }
  };

  return (
    <div className="rounded-xl bg-void-950 border border-white/10 p-2.5 space-y-1.5">
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
          {isId ? 'Skema Target Misi' : 'Target Blueprint'}
        </span>
        <span className="text-[10px] font-mono font-semibold text-electric-300">
          {isId ? meta.targetBadgeId : meta.targetBadgeEn}
        </span>
      </div>
      {renderSvgDiagram()}
    </div>
  );
};
