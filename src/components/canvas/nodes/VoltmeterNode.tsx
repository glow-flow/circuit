import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Gauge } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { TRANSLATIONS } from '../../../i18n/translations';

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

  // Calculate voltage difference between the two connected nets
  let measuredVoltage = 0.0;
  if (wireP1 && wireP2) {
    const current = simulation.branchCurrents[id] ?? 0;
    // Voltmeter internal resistance is 10MΩ -> V = I * R
    measuredVoltage = current * 1e7;
  }

  return (
    <div
      className={`relative rounded-xl border bg-void-900 px-4 py-3 shadow-2xl transition-all duration-150 min-w-[164px] ${
        selected ? 'border-electric-500 shadow-glow' : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Probe 1 (+) Handle (Left) */}
      <div className="absolute top-1/2 -left-3 -translate-y-1/2 flex items-center">
        <Handle
          type="source"
          position={Position.Left}
          id="p1"
          className="handle-positive !bg-red-500 !border-red-300 !w-3.5 !h-3.5"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded bg-electric-500/10 text-electric-400 border border-electric-500/20">
            <Gauge className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-200 tracking-tight">{t.title}</span>
        </div>
        <span className="text-[9px] font-mono text-slate-400 uppercase">Paralel</span>
      </div>

      {/* Digital LCD Segment Display */}
      <div className="bg-[#050507] rounded-lg p-2.5 border border-white/10 flex flex-col items-center justify-center shadow-inner">
        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider self-start">
          {t.probeDiff}
        </span>
        <div className="text-lg font-mono font-bold text-electric-400 tracking-wider">
          {Math.abs(measuredVoltage) < 0.001 ? '0.00' : measuredVoltage.toFixed(2)}{' '}
          <span className="text-xs text-slate-400">V</span>
        </div>
      </div>

      {/* Probe 2 (-) Handle (Right) */}
      <div className="absolute top-1/2 -right-3 -translate-y-1/2 flex items-center">
        <Handle
          type="source"
          position={Position.Right}
          id="p2"
          className="handle-negative !bg-blue-500 !border-blue-300 !w-3.5 !h-3.5"
        />
      </div>
    </div>
  );
};
