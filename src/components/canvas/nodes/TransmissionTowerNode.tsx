import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CircuitElementData } from '../../../types/circuit';
import { Radio, Zap } from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';

/**
 * TransmissionTowerNode Component.
 *
 * Represents an overhead high-voltage transmission pylon serving as a lossless
 * "virtual grid" power bridge. When 2 or more towers are placed anywhere in the
 * circuit (e.g. one in outdoor Nature sunny mode and one in indoor Lab mode),
 * their positive and negative terminals are unified into common electrical nets
 * via MNA Union-Find.
 *
 * Time Complexity: O(1) render.
 */
export const TransmissionTowerNode: React.FC<NodeProps<CircuitElementData>> = memo(
  ({ data, selected }) => {
    const language = useCircuitStore((state) => state.language);
    const isId = language === 'id';

    const connectedCount = data.towerConnectedCount ?? 1;
    const isGridConnected = connectedCount > 1;

    const currentAmperes = Math.abs(data.calculatedCurrent ?? 0);
    const currentDisplay =
      currentAmperes >= 1
        ? `${currentAmperes.toFixed(2)} A`
        : `${Math.round(currentAmperes * 1000)} mA`;

    return (
      <div
        className={`relative flex flex-col items-center select-none transition-all duration-200 group ${
          selected ? 'filter drop-shadow-[0_0_16px_rgba(34,211,238,0.5)]' : ''
        }`}
      >
        {/* Main Pylon Graphic Container */}
        <div className="relative w-44 flex flex-col items-center">
          {/* Top Status Badge */}
          <div className="mb-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-tight shadow-lg backdrop-blur-md border transition-all duration-300">
            {isGridConnected ? (
              <span className="flex items-center gap-1.5 bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <Zap className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>
                  {isId
                    ? `Grid Terhubung (${connectedCount} Menara)`
                    : `Grid Active (${connectedCount} Towers)`}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-void-900/80 text-slate-400 border-white/10">
                <Radio className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{isId ? 'Standby (1 Menara)' : 'Standby (1 Tower)'}</span>
              </span>
            )}
          </div>

          {/* High-Resolution Transparent Transmission Tower Pylon Graphic */}
          <div className="relative w-36 h-64 flex items-center justify-center">
            <img
              src="/assets/transmission-tower.png"
              alt={isId ? 'Menara Transmisi' : 'Transmission Tower'}
              className="w-full h-full object-contain pointer-events-none drop-shadow-md"
              draggable={false}
            />

            {/* Electrical Current Flow Glow Indicator (if active current) */}
            {currentAmperes > 0.001 && (
              <div
                className="absolute inset-x-8 top-12 bottom-8 rounded-full pointer-events-none bg-cyan-400/10 blur-xl animate-pulse"
                aria-hidden="true"
              />
            )}
          </div>

          {/* Bottom Terminal Footing & Floating Handles */}
          <div className="relative w-36 h-2 -mt-1">
            {/* Positive (+) Terminal Handle (Left Foot at ~34.4%) */}
            <Handle
              type="source"
              position={Position.Bottom}
              id="pos"
              style={{ left: '34.4%', bottom: '-4px' }}
              className="!w-3.5 !h-3.5 !bg-red-500 !border-2 !border-white !rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] hover:!scale-125 transition-transform cursor-crosshair z-30"
              title={isId ? 'Kutub Positif (+)' : 'Positive Terminal (+)'}
            />

            {/* Negative (-) Terminal Handle (Right Foot at ~65.3%) */}
            <Handle
              type="source"
              position={Position.Bottom}
              id="neg"
              style={{ left: '65.3%', bottom: '-4px' }}
              className="!w-3.5 !h-3.5 !bg-blue-500 !border-2 !border-white !rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] hover:!scale-125 transition-transform cursor-crosshair z-30"
              title={isId ? 'Kutub Negatif (-)' : 'Negative Terminal (-)'}
            />
          </div>

          {/* Measurement Pill (Shown on Selection or Hover) */}
          <div
            className={`mt-3.5 px-3 py-1.5 rounded-xl bg-void-900/90 border border-white/10 text-slate-200 text-xs backdrop-blur-md shadow-xl flex items-center justify-between gap-3 min-w-[130px] transition-all duration-200 ${
              selected ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
            }`}
          >
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium">
                {isId ? 'Arus Grid' : 'Grid Current'}
              </span>
              <span className="font-mono font-bold text-cyan-400 text-xs">
                {currentDisplay}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-medium">
                {isId ? 'Impedansi' : 'Impedance'}
              </span>
              <span className="font-mono text-emerald-400 text-xs font-bold">
                0.00 Ω
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

TransmissionTowerNode.displayName = 'TransmissionTowerNode';
