import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ShieldAlert, Zap } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { TRANSLATIONS } from '../../../i18n/translations';
import { NodeInfoPopover } from './NodeInfoPopover';

/**
 * Digital Ammeter Node (`type: 'ammeter'`).
 * Renders the physical `/assets/ammeter.png` benchtop instrument with live digital
 * series current readout overlaid on the recessed glass LCD screen and bottom binding posts.
 *
 * Time Complexity: O(1) render.
 */
export const AmmeterNode: React.FC<NodeProps<CircuitElementData>> = ({ id, selected }) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);
  const t = TRANSLATIONS[language].nodes.ammeter;
  const [hasImageError, setHasImageError] = useState(false);

  const current = simulation.branchCurrents[id] ?? 0;
  const isShortCircuit = simulation.shortCircuitBranches.includes(id);

  const formattedCurrent =
    Math.abs(current) < 1
      ? `${(Math.abs(current) * 1000).toFixed(1)} mA`
      : `${Math.abs(current).toFixed(3)} A`;

  const isIndonesian = language === 'id';

  return (
    <div
      className="group relative select-none cursor-grab active:cursor-grabbing flex flex-col items-center justify-center"
      style={{
        width: 96,
        height: 106,
        overflow: 'visible',
      }}
    >
      {/* Hardware Instrument Casing */}
      <div
        className={`relative w-full h-full flex items-center justify-center rounded-2xl transition-transform duration-150 ${
          isShortCircuit
            ? 'ring-2 ring-red-500 animate-pulse'
            : selected
            ? 'ring-2 ring-electric-400 ring-offset-2 ring-offset-void-950'
            : ''
        }`}
      >
        {!hasImageError ? (
          <img
            src="/assets/ammeter.png"
            alt={t.title}
            width={96}
            height={106}
            draggable={false}
            onError={() => setHasImageError(true)}
            className="w-full h-full object-contain pointer-events-none select-none drop-shadow-md"
          />
        ) : (
          <div className="w-full h-full rounded-xl bg-void-900 border border-white/15" />
        )}

        {/* Recessed LCD Screen Digital Overlay */}
        <div className="absolute top-[14%] left-[15%] right-[15%] h-[36%] flex flex-col items-center justify-center pointer-events-none px-1">
          <span className="text-[7px] font-mono font-semibold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
            DC AMPERE
          </span>
          <div
            className={`text-[12px] font-mono font-bold tracking-tight leading-none ${
              isShortCircuit ? 'text-red-400' : 'text-emerald-300'
            }`}
          >
            {formattedCurrent}
          </div>
        </div>
      </div>

      {/* Input Handle (Left Emerald Binding Post) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="p1"
        style={{ left: '28%', bottom: 2 }}
        className="!bg-emerald-600 !border-2 !border-white !w-3.5 !h-3.5 z-20 shadow-sm"
      />

      {/* Output Handle (Right Black Binding Post) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="p2"
        style={{ left: '72%', bottom: 2 }}
        className="!bg-slate-700 !border-2 !border-white !w-3.5 !h-3.5 z-20 shadow-sm"
      />

      {/* Detailed Telemetry: ONLY when selected */}
      {selected && (
        <NodeInfoPopover placement="top" width={190}>
          <div className="mb-2 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="p-1 rounded-md bg-void-950 text-emerald-400 border border-white/10">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div className="truncate text-xs font-bold text-slate-100">
                {t.title}
              </div>
            </div>
            {isShortCircuit ? (
              <span className="flex items-center gap-1 text-[9px] font-bold text-red-400 uppercase">
                <ShieldAlert className="w-3 h-3" /> OVERLOAD
              </span>
            ) : (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-void-950 border border-white/10 text-slate-300">
                SERI
              </span>
            )}
          </div>

          <div className="rounded-lg bg-void-950 p-2 border border-white/10 font-mono text-center mb-1.5">
            <div
              className={`text-base font-bold ${
                isShortCircuit ? 'text-red-400' : 'text-emerald-300'
              }`}
            >
              {formattedCurrent}
            </div>
            <div className="text-[9px] text-slate-400 font-sans mt-0.5">
              {t.seriesCurrent}
            </div>
          </div>

          <div className="text-[9px] text-center text-slate-400 leading-tight">
            {isIndonesian
              ? 'Pasang secara seri dalam satu jalur kabel untuk mengukur arus listrik.'
              : 'Connect in series along a wire branch to measure electrical current.'}
          </div>
        </NodeInfoPopover>
      )}
    </div>
  );
};
