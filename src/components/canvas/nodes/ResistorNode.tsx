import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Activity } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { TRANSLATIONS } from '../../../i18n/translations';
import { NodeInfoPopover } from './NodeInfoPopover';

/**
 * Through-hole Axial Resistor Node (`type: 'resistor'`).
 * Clean, direct asset-first presentation (like SocketNode/BulbNode):
 * - Canvas shows the physical axial resistor and color bands directly.
 * - Left and right wire leads host electrical handles p1 and p2.
 * - Detailed telemetry (Ohm's Law, power dissipation) appears in NodeInfoPopover on select.
 *
 * Time Complexity: O(1) render.
 */
export const ResistorNode: React.FC<NodeProps<CircuitElementData>> = ({ id, data, selected }) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);
  const t = TRANSLATIONS[language].nodes.resistor;

  const current = Math.abs(simulation.branchCurrents[id] ?? 0);
  const resistance = data.resistance ?? 100;
  const voltageDrop = current * resistance;
  const powerWatts = current * voltageDrop;

  const isIndonesian = language === 'id';
  const formattedResistance =
    resistance >= 1000 ? `${(resistance / 1000).toFixed(1)} kΩ` : `${resistance} Ω`;

  return (
    <div
      className="group relative select-none cursor-grab active:cursor-grabbing flex items-center justify-center"
      style={{
        width: 136,
        height: 44,
        overflow: 'visible',
      }}
    >
      {/* Terminal 1 Handle (Left Lead) */}
      <Handle
        type="source"
        position={Position.Left}
        id="p1"
        className="!bg-amber-600 !border-2 !border-white !w-3.5 !h-3.5 !-left-1.5 z-20 shadow-sm"
      />

      {/* Main Artwork: Axial Resistor Graphic */}
      <div
        className={`relative flex h-full w-full items-center justify-center rounded-lg outline outline-1 outline-offset-2 transition-all duration-150 ${
          selected
            ? 'outline-amber-400 shadow-md'
            : 'outline-transparent group-hover:outline-slate-400/50'
        }`}
        style={{ zIndex: 10 }}
      >
        <img
          src="/assets/processed/resistor.png"
          alt="Axial Resistor"
          width={136}
          height={44}
          draggable={false}
          className="w-full h-full object-contain pointer-events-none select-none drop-shadow-sm"
        />

        {/* Value Label Pill */}
        <span className="absolute -bottom-2.5 px-1.5 py-0.2 rounded bg-void-950 border border-control text-[9px] font-mono font-bold text-amber-300 pointer-events-none select-none tabular-nums">
          {formattedResistance}
        </span>
      </div>

      {/* Terminal 2 Handle (Right Lead) */}
      <Handle
        type="source"
        position={Position.Right}
        id="p2"
        className="!bg-amber-600 !border-2 !border-white !w-3.5 !h-3.5 !-right-1.5 z-20 shadow-sm"
      />

      {/* Detailed Telemetry: ONLY when selected */}
      {selected && (
        <NodeInfoPopover placement="bottom" width={200}>
          <div className="mb-2 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="p-1 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/35">
                <Activity className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
              <div className="truncate text-xs font-bold text-ink">
                {t.title}
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-300 tabular-nums">
              {formattedResistance}
            </span>
          </div>

          <div className="rounded-lg bg-void-950 p-1.5 border border-control font-mono text-xs space-y-1 tabular-nums">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px]">{t.resistance}</span>
              <span className="text-amber-300 font-semibold">{resistance} Ω</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px]">{t.voltageDrop}</span>
              <span className="text-ink">{voltageDrop.toFixed(2)} V</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px]">{t.current}</span>
              <span className="text-emerald-400 font-semibold">
                {current < 1 ? `${(current * 1000).toFixed(1)} mA` : `${current.toFixed(3)} A`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px]">
                {isIndonesian ? 'Daya Terbuang' : 'Dissipation'}
              </span>
              <span className="text-slate-300">
                {powerWatts < 0.1 ? `${(powerWatts * 1000).toFixed(1)} mW` : `${powerWatts.toFixed(2)} W`}
              </span>
            </div>
          </div>
        </NodeInfoPopover>
      )}
    </div>
  );
};
