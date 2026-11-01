import React from 'react';

interface NodeInfoPopoverProps {
  children: React.ReactNode;
  /** Optional min width in px (default 190). */
  width?: number;
  /** Popover side relative to the node artwork ('top', 'bottom', 'left', or 'right'). */
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Floating info panel shown next to a minimal (image-only) canvas node, only while
 * that node is selected. Absolutely positioned so it never changes the node's
 * measured size (wire handles stay glued to the artwork).
 *
 * Time Complexity: O(1) render.
 */
export const NodeInfoPopover: React.FC<NodeInfoPopoverProps> = ({
  children,
  width = 190,
  placement = 'bottom',
}) => {
  let placementClass = 'left-1/2 top-full mt-3 -translate-x-1/2';
  if (placement === 'top') {
    placementClass = 'left-1/2 bottom-full mb-3 -translate-x-1/2';
  } else if (placement === 'right') {
    placementClass = 'left-full top-1/2 ml-3 -translate-y-1/2';
  } else if (placement === 'left') {
    placementClass = 'right-full top-1/2 mr-3 -translate-y-1/2';
  }

  return (
    <div
      className={`nodrag absolute z-40 ${placementClass}`}
      style={{ width }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="node-info-pop rounded-xl border border-white/20 bg-void-900/98 p-2.5 shadow-xl backdrop-blur-md text-slate-100">
        {children}
      </div>
    </div>
  );
};
