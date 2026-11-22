import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ShieldAlert, Zap } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { TRANSLATIONS } from '../../../i18n/translations';
import { NodeInfoPopover } from './NodeInfoPopover';
import { AmmeterGraphic } from '../../ui/common/LabComponentArt';

/**
 * Digital Ammeter Node (`type: 'ammeter'`).
 * Renders the unified pure-SVG benchtop instrument with live series current LCD readout
 * and emerald (IN) / slate (OUT) binding posts.
 *
 * Time Complexity: O(1) render.
 */
export const AmmeterNode: React.FC<NodeProps<CircuitElementData>> = ({ id, selected }) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);
  const t = TRANSLATIONS[language].nodes.ammeter;

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
            ? 'ring-2 ring-danger-500'
            : selected
            ? 'ring-2 ring-electric-400 ring-offset-2 ring-offset-void-950'
            : ''
        }`}
      >
        <AmmeterGraphic
          displayValue={formattedCurrent}
          isShortCircuit={isShortCircuit}
          className="w-full h-full drop-shadow-md"
        />
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
              <div className="p-1 rounded-md bg-void-950 text-emerald-400 border border-control">
                <Zap className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
              <div className="truncate text-xs font-bold text-ink">
                {t.title}
              </div>
            </div>
            {isShortCircuit ? (
              <span className="flex items-center gap-1 text-[9px] font-bold text-danger-400 uppercase">
                <ShieldAlert className="w-3 h-3" aria-hidden="true" /> OVERLOAD
              </span>
            ) : (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-void-950 border border-control text-slate-300">
                SERI
              </span>
            )}
          </div>

          <div className="rounded-lg bg-void-950 p-2 border border-control font-mono text-center mb-1.5 tabular-nums">
            <div
              className={`text-base font-bold ${
                isShortCircuit ? 'text-danger-400' : 'text-emerald-400'
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
