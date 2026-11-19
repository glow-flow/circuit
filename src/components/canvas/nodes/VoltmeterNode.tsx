import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Gauge } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { TRANSLATIONS } from '../../../i18n/translations';
import { NodeInfoPopover } from './NodeInfoPopover';

/**
 * Digital Voltmeter Node (`type: 'voltmeter'`).
 * Renders the physical `/assets/voltmeter.png` benchtop instrument with live digital
 * LCD readout overlaid on the recessed glass screen and bottom binding post terminals.
 *
 * Time Complexity: O(1) render.
 */
export const VoltmeterNode: React.FC<NodeProps<CircuitElementData>> = ({ id, selected }) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const edges = useCircuitStore((state) => state.edges);
  const language = useCircuitStore((state) => state.language);
  const t = TRANSLATIONS[language].nodes.voltmeter;
  const [hasImageError, setHasImageError] = useState(false);

  const wireP1 = edges.find(
    (e) =>
      (e.source === id && e.sourceHandle === 'p1') ||
      (e.target === id && e.targetHandle === 'p1')
  );
  const wireP2 = edges.find(
    (e) =>
      (e.source === id && e.sourceHandle === 'p2') ||
      (e.target === id && e.targetHandle === 'p2')
  );

  const isFloatingIsland =
    Boolean(wireP1 && wireP2) && (simulation.floatingVoltmeterIds?.includes(id) ?? false);

  // Calculate voltage difference between the two connected nets (R_internal = 10MΩ),
  // suppressing phantom readings when probes span galvanically isolated floating islands.
  let measuredVoltage = 0.0;
  if (wireP1 && wireP2 && !isFloatingIsland) {
    const current = simulation.branchCurrents[id] ?? 0;
    measuredVoltage = current * 1e7;
  }

  const isIndonesian = language === 'id';
  const displayVoltage =
    Math.abs(measuredVoltage) < 0.001 ? '0.00' : measuredVoltage.toFixed(2);

  return (
    <div
      className="group relative select-none cursor-grab active:cursor-grabbing flex flex-col items-center justify-center"
      style={{
        width: 96,
        height: 112,
        overflow: 'visible',
      }}
    >
      {/* Hardware Instrument Casing */}
      <div
        className={`relative w-full h-full flex items-center justify-center rounded-2xl transition-transform duration-150 ${
          selected
            ? 'ring-2 ring-electric-400 ring-offset-2 ring-offset-void-950'
            : ''
        }`}
      >
        {!hasImageError ? (
          <img
            src="/assets/voltmeter.png"
            alt={t.title}
            width={96}
            height={112}
            draggable={false}
            onError={() => setHasImageError(true)}
            className="w-full h-full object-contain pointer-events-none select-none drop-shadow-md"
          />
        ) : (
          <div className="w-full h-full rounded-xl bg-void-900 border border-control" />
        )}

        {/* Fixed bright inks over dark photorealistic PNG LCD window (never invert in Light Mode) */}
        <div className="absolute top-[13%] left-[13%] right-[13%] h-[40%] flex flex-col items-center justify-center pointer-events-none px-1 tabular-nums">
          <span className="text-[7px] font-mono font-semibold text-[#94A3B8] uppercase tracking-widest leading-none mb-0.5">
            DC VOLT
          </span>
          <div className="text-[13px] font-mono font-bold text-[#7DD3FC] tracking-tight leading-none">
            {displayVoltage}
            <span className="text-[9px] text-[#38BDF8] ml-0.5">V</span>
          </div>
        </div>
      </div>

      {/* Probe 1 (+) Handle aligned over Left Red Binding Post */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="p1"
        style={{ left: '28%', bottom: 2 }}
        className="!bg-red-500 !border-2 !border-white !w-3.5 !h-3.5 z-20 shadow-sm"
      />

      {/* Probe 2 (-) Handle aligned over Right Black Binding Post */}
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
              <div className="p-1 rounded-md bg-void-950 text-electric-400 border border-control">
                <Gauge className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
              <div className="truncate text-xs font-bold text-ink">
                {t.title}
              </div>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-void-950 border border-control text-slate-300">
              PARALEL
            </span>
          </div>

          <div className="rounded-lg bg-void-950 p-2 border border-control font-mono text-center mb-1.5 tabular-nums">
            <div className="text-base font-bold text-electric-400">
              {displayVoltage} V
            </div>
            <div className="text-[9px] text-slate-400 font-sans mt-0.5">
              {isFloatingIsland
                ? isIndonesian
                  ? 'Rangkaian terpisah (mengambang / tanpa jalur balik)'
                  : 'Floating / isolated loops (no closed return reference)'
                : t.probeDiff}
            </div>
          </div>

          <div className="text-[9px] text-center text-slate-400 leading-tight">
            {isIndonesian
              ? 'Pasang secara paralel di antara dua titik yang ingin diukur tegangannya.'
              : 'Connect in parallel across the two points to measure voltage.'}
          </div>
        </NodeInfoPopover>
      )}
    </div>
  );
};
