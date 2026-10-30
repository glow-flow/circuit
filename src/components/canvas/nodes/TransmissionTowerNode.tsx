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
        className={`relative flex flex-col items-center select-none transition-all duration-200 group w-[148px] ${
          selected ? 'filter drop-shadow-[0_0_18px_rgba(34,211,238,0.55)]' : ''
        }`}
      >
        {/* Top Floating Status & Telemetry Pill (Above Pylon so Steel Legs Sit on Grass) */}
        <div
          className={`mb-1 px-2.5 py-1 rounded-2xl text-[10px] font-mono font-bold tracking-tight shadow-[0_8px_20px_rgba(0,0,0,0.45)] backdrop-blur-md border transition-all duration-300 z-30 ${
            isGridConnected
              ? 'bg-emerald-950/85 text-emerald-300 border-emerald-400/45 shadow-[0_0_14px_rgba(16,185,129,0.3)]'
              : 'bg-void-950/85 text-slate-300 border-white/15'
          }`}
        >
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            {isGridConnected ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <Zap className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>
                  {isId
                    ? `Grid (${connectedCount} Menara)`
                    : `Grid (${connectedCount} Towers)`}
                  {currentAmperes > 0.001 ? ` · ${currentDisplay}` : ''}
                </span>
              </>
            ) : (
              <>
                <Radio className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{isId ? 'Standby (1 Menara)' : 'Standby (1 Tower)'}</span>
              </>
            )}
          </div>
        </div>

        {/* High-Resolution Transparent Transmission Tower Pylon Graphic: Legs Anchored at Bottom-0 */}
        <div className="relative w-[136px] h-[204px] flex items-end justify-center">
          <img
            src="/assets/transmission-tower.png"
            alt={isId ? 'Menara Transmisi' : 'Transmission Tower'}
            className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)]"
            draggable={false}
          />

          {/* Electrical Current Flow Glow Indicator (if active current) */}
          {currentAmperes > 0.001 && (
            <div
              className="absolute inset-x-6 top-8 bottom-6 rounded-full pointer-events-none bg-cyan-400/15 blur-xl animate-pulse"
              aria-hidden="true"
            />
          )}

          {/* Grounded Base Terminals (+ and -) Right on the Steel Pylon Feet */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="pos"
            style={{ left: '34.4%', bottom: '2px' }}
            className="!w-4 !h-4 !bg-red-500 !border-2 !border-white !rounded-full shadow-[0_0_10px_rgba(239,68,68,0.9)] hover:!scale-125 transition-transform cursor-crosshair z-30"
            title={isId ? 'Kutub Positif (+)' : 'Positive Terminal (+)'}
          />

          <Handle
            type="source"
            position={Position.Bottom}
            id="neg"
            style={{ left: '65.3%', bottom: '2px' }}
            className="!w-4 !h-4 !bg-sky-400 !border-2 !border-white !rounded-full shadow-[0_0_10px_rgba(56,189,248,0.9)] hover:!scale-125 transition-transform cursor-crosshair z-30"
            title={isId ? 'Kutub Negatif (-)' : 'Negative Terminal (-)'}
          />
        </div>
      </div>
    );
  }
);

TransmissionTowerNode.displayName = 'TransmissionTowerNode';
