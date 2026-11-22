import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CircuitElementData } from '../../../types/circuit';
import { GroundGraphic } from '../../ui/common/LabComponentArt';

/**
 * Laboratory Ground Earthing Terminal Node (`type: 'ground'`).
 * Renders the unified pure-SVG ground reference module with its top brass binding post.
 *
 * Time Complexity: O(1) render.
 */
export const GroundNode: React.FC<NodeProps<CircuitElementData>> = ({ selected }) => {
  return (
    <div
      className={`relative select-none cursor-grab active:cursor-grabbing flex flex-col items-center justify-center transition-transform duration-150 ${
        selected ? 'ring-2 ring-electric-400 ring-offset-2 ring-offset-void-950 rounded-xl' : ''
      }`}
      style={{
        width: 68,
        height: 88,
        overflow: 'visible',
      }}
    >
      {/* Ground Terminal Handle aligned over top knurled brass binding post */}
      <Handle
        type="source"
        position={Position.Top}
        id="gnd"
        style={{ top: 2 }}
        className="!bg-emerald-500 !border-2 !border-white !w-3.5 !h-3.5 z-20 shadow-sm"
      />

      <GroundGraphic className="w-full h-full drop-shadow-md" />
    </div>
  );
};
