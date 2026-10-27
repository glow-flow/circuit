import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Paperclip } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';

/**
 * WaypointNode acts as a physical wire anchor / bend point.
 * Transparently forwards electrical potential without resistance.
 * Allows users to bend, route, or curl cables realistically.
 */
export const WaypointNode: React.FC<NodeProps<CircuitElementData>> = ({ id, selected }) => {
  const removeComponent = useCircuitStore((state) => state.removeComponent);
  const simulation = useCircuitStore((state) => state.simulation);

  const current = Math.abs(simulation.branchCurrents[id] ?? 0);
  const hasCurrent = current > 0.0001;

  return (
    <div
      className={`group relative flex items-center justify-center w-6 h-6 rounded-full cursor-grab active:cursor-grabbing transition-all duration-150 select-none shadow-md ${
        selected
          ? 'bg-electric-500 ring-4 ring-electric-500/30 scale-125 border-2 border-white'
          : hasCurrent
          ? 'bg-void-900 border-2 border-sky-400 shadow-glow hover:scale-125'
          : 'bg-void-900 border-2 border-slate-400 hover:border-electric-400 hover:scale-125 hover:bg-void-800'
      }`}
      title="Wire Anchor Pin (Drag to bend wire, Double-click or Del to remove)"
      onDoubleClick={(e) => {
        e.stopPropagation();
        removeComponent(id);
      }}
    >
      {/* Centered Input Handle */}
      <Handle
        type="source"
        position={Position.Left}
        id="p1"
        className="!w-2 !h-2 !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !bg-transparent !border-0 !opacity-0 pointer-events-none"
      />

      {/* Visual paperclip / pin center icon */}
      <Paperclip
        className={`w-3 h-3 pointer-events-none transition-colors ${
          selected
            ? 'text-white'
            : hasCurrent
            ? 'text-sky-300'
            : 'text-slate-300 group-hover:text-electric-300'
        }`}
      />

      {/* Centered Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="p2"
        className="!w-2 !h-2 !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !bg-transparent !border-0 !opacity-0 pointer-events-none"
      />
    </div>
  );
};
