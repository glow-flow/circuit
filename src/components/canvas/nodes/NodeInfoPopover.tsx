import React from 'react';

interface NodeInfoPopoverProps {
  children: React.ReactNode;
  /** Optional min width in px (default 190). */
  width?: number;
  /** Popover side relative to the node artwork ('top' when bulb is snapped into a socket below it). */
  placement?: 'top' | 'bottom';
}

/**
 * Floating info panel shown next to a minimal (image-only) canvas node, only while
 * that node is selected. Absolutely positioned so it never changes the node's
 * measured size (wire handles stay glued to the artwork). Fades/scales in via the
 * `.node-info-pop` keyframes in index.css.
 *
 * Time Complexity: O(1) render.
 */
export const NodeInfoPopover: React.FC<NodeInfoPopoverProps> = ({
  children,
  width = 190,
  placement = 'bottom',
}) => (
  <div
    className={`nodrag absolute left-1/2 z-40 -translate-x-1/2 ${
      placement === 'top' ? 'bottom-full mb-3' : 'top-full mt-3'
    }`}
    style={{ width }}
    onPointerDown={(event) => event.stopPropagation()}
  >
    <div className="node-info-pop rounded-xl border border-electric-500/60 bg-void-900/95 p-2.5 shadow-glow backdrop-blur-md">
      {children}
    </div>
  </div>
);
