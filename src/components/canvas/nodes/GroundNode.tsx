import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CircuitElementData } from '../../../types/circuit';

/**
 * Laboratory Ground Earthing Terminal Node (`type: 'ground'`).
 * Renders the physical `/assets/ground-terminal.png` module with its top brass binding post.
 *
 * Time Complexity: O(1) render.
 */
export const GroundNode: React.FC<NodeProps<CircuitElementData>> = ({ selected }) => {
  const [hasImageError, setHasImageError] = useState(false);

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

      {!hasImageError ? (
        <img
          src="/assets/ground-terminal.png"
          alt="Ground (0V)"
          width={68}
          height={88}
          draggable={false}
          onError={() => setHasImageError(true)}
          className="w-full h-full object-contain pointer-events-none select-none drop-shadow-md"
        />
      ) : (
        <div className="w-full h-full rounded-xl bg-void-900 border border-white/15 flex items-center justify-center text-[10px] font-mono text-slate-300">
          0V GND
        </div>
      )}
    </div>
  );
};
