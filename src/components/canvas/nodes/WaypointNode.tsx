import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';

/**
 * WaypointNode acts as a physical wire anchor / bend point.
 * Transparently forwards electrical potential without resistance.
 * Allows users to bend, route, or curl cables realistically.
 */
export const WaypointNode: React.FC<NodeProps<CircuitElementData>> = ({ id, selected }) => {
  const removeComponent = useCircuitStore((state) => state.removeComponent);

  return (
    <div
      className={`group relative flex items-center justify-center w-5 h-5 rounded-full cursor-grab active:cursor-grabbing transition-all duration-150 select-none ${
        selected
          ? 'bg-electric-500 ring-4 ring-electric-500/30 scale-125'
          : 'bg-void-900 border-2 border-slate-400 hover:border-electric-400 hover:scale-125 hover:bg-void-800'
      }`}
      title="Wire Waypoint Anchor (Drag to bend wire, Backspace/Del to remove)"
      onDoubleClick={(e) => {
        e.stopPropagation();
        removeComponent(id);
      }}
    >
      {/* Input Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="p1"
        className="!w-2 !h-2 !bg-transparent !border-0 !opacity-0 pointer-events-none"
      />

      {/* Visual anchor center core */}
      <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-electric-300 transition-colors pointer-events-none" />

      {/* Output Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="p2"
        className="!w-2 !h-2 !bg-transparent !border-0 !opacity-0 pointer-events-none"
      />
    </div>
  );
};
