import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Gauge } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { TRANSLATIONS } from '../../../i18n/translations';
import { NodeInfoPopover } from './NodeInfoPopover';

/**
 * Digital Voltmeter Node (`type: 'voltmeter'`).
 * Clean, direct asset-first presentation (like SocketNode/BulbNode):
 * - Canvas displays a compact digital meter pod with left (+) and right (-) probes.
 * - Measured differential voltage is rendered clearly on the LCD screen.
 * - Detailed telemetry and connection guides appear inside NodeInfoPopover on select.
 *
 * Time Complexity: O(1) render.
 */
export const VoltmeterNode: React.FC<NodeProps<CircuitElementData>> = ({ id, selected }) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const edges = useCircuitStore((state) => state.edges);
  const language = useCircuitStore((state) => state.language);
  const t = TRANSLATIONS[language].nodes.voltmeter;

  // Find wires connected to this voltmeter's p1 and p2 handles
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

  // Calculate voltage difference between the two connected nets (R_internal = 10MΩ)
  let measuredVoltage = 0.0;
  if (wireP1 && wireP2) {
    const current = simulation.branchCurrents[id] ?? 0;
    measuredVoltage = current * 1e7;
  }

  const isIndonesian = language === 'id';
  const displayVoltage =
    Math.abs(measuredVoltage) < 0.001 ? '0.00' : measuredVoltage.toFixed(2);

  return (
    <div
      className="group relative select-none cursor-grab active:cursor-grabbing flex items-center justify-center"
      style={{
        width: 92,
        height: 48,
        overflow: 'visible',
      }}
    >
      {/* Probe 1 (+) Handle (Left) */}
      <Handle
        type="source"
        position={Position.Left}
        id="p1"
        className="!bg-red-500 !border-2 !border-white !w-3.5 !h-3.5 !-left-1.5 z-20 shadow-sm"
      />

      {/* Main Meter Pod Casing */}
      <div
        className={`relative flex flex-col items-center justify-center h-full w-full rounded-xl bg-void-900 border border-white/10 px-2 py-1 shadow-md transition-all duration-150 ${
          selected
            ? 'outline outline-1 outline-offset-2 outline-amber-400 shadow-md'
            : 'group-hover:border-slate-400/50'
        }`}
        style={{ zIndex: 10 }}
      >
        <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">
          VOLT
        </span>
        <div className="text-sm font-mono font-bold text-sky-400 tracking-tight leading-tight">
          {displayVoltage} <span className="text-[10px] text-slate-400">V</span>
        </div>
      </div>

      {/* Probe 2 (-) Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="p2"
        className="!bg-slate-700 !border-2 !border-white !w-3.5 !h-3.5 !-right-1.5 z-20 shadow-sm"
      />

      {/* Detailed Telemetry: ONLY when selected */}
      {selected && (
        <NodeInfoPopover placement="bottom" width={190}>
          <div className="mb-2 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="p-1 rounded-md bg-electric-500/10 text-electric-400 border border-electric-500/20">
                <Gauge className="w-3.5 h-3.5" />
              </div>
              <div className="truncate text-xs font-bold text-slate-100">
                {t.title}
              </div>
            </div>
            <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-white/5 text-slate-300">
              PARALEL
            </span>
          </div>

          <div className="rounded-lg bg-void-950 p-2 border border-white/10 font-mono text-center mb-1.5">
            <div className="text-base font-bold text-sky-400">
              {displayVoltage} V
            </div>
            <div className="text-[9px] text-slate-400 font-sans mt-0.5">
              {t.probeDiff}
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
