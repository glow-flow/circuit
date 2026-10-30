/**
 * Socket (fiting) snapping helpers.
 *
 * Pure functions only (no store access) so the geometry and wiring rules are
 * unit-testable and the Zustand store stays small.
 *
 * Time Complexity: `findNearestFreeSocket` O(N) over N nodes; everything else O(1).
 */

import { Edge, Node } from 'reactflow';
import { CircuitElementData } from '../types/circuit';

/** Rendered size (px) of an image-only BulbNode. Must match BulbNode.tsx. */
export const BULB_NODE_SIZE = { width: 88, height: 104 } as const;
/** Rendered size (px) of an image-only SocketNode. Must match SocketNode.tsx. */
export const SOCKET_NODE_SIZE = { width: 96, height: 112 } as const;
/** How deep (px) the bulb base sits inside the socket mouth when snapped. */
const BULB_INSERT_DEPTH = 34;
/** Max distance (px) between a dropped bulb and a socket's snap point to attach. */
export const SNAP_RADIUS = 80;
/** Distance (px) a rejected bulb is pushed away from the socket it cannot fit. */
export const REJECT_PUSH_DISTANCE = 140;

export interface Point {
  x: number;
  y: number;
}

/**
 * Computes where a bulb's top-left corner must be so its base sits inside the socket.
 *
 * @param socketPosition - Top-left position of the socket node
 * @returns Top-left position for the snapped bulb node
 */
export function getBulbSnapPosition(socketPosition: Point): Point {
  return {
    x: socketPosition.x + (SOCKET_NODE_SIZE.width - BULB_NODE_SIZE.width) / 2,
    y: socketPosition.y - BULB_NODE_SIZE.height + BULB_INSERT_DEPTH,
  };
}

/**
 * Euclidean distance between a bulb and the snap point of a socket.
 *
 * @param bulbPosition - Top-left position of the bulb node
 * @param socketPosition - Top-left position of the socket node
 * @returns Distance in pixels
 */
export function distanceToSocketSnapPoint(bulbPosition: Point, socketPosition: Point): number {
  const snapPoint = getBulbSnapPosition(socketPosition);
  return Math.hypot(bulbPosition.x - snapPoint.x, bulbPosition.y - snapPoint.y);
}

/**
 * Finds the closest socket within `SNAP_RADIUS` that has no bulb in it yet.
 *
 * @param bulbNode - The bulb that was just dropped
 * @param allNodes - Every node currently on the canvas
 * @returns The nearest free socket node, or undefined when none is in range
 */
export function findNearestFreeSocket(
  bulbNode: Node<CircuitElementData>,
  allNodes: Node<CircuitElementData>[]
): Node<CircuitElementData> | undefined {
  let nearestSocket: Node<CircuitElementData> | undefined;
  let nearestDistance = SNAP_RADIUS;

  for (const candidate of allNodes) {
    if (candidate.data.type !== 'socket' || candidate.data.bulbId) continue;
    const distance = distanceToSocketSnapPoint(bulbNode.position, candidate.position);
    if (distance <= nearestDistance) {
      nearestDistance = distance;
      nearestSocket = candidate;
    }
  }
  return nearestSocket;
}

/** Prefix that marks internal (invisible) wires created by snapping. */
export const SNAP_EDGE_PREFIX = 'snap_';

/**
 * Builds the two invisible zero-length wires that electrically join the socket
 * terminals to the bulb terminals (p1↔p1, p2↔p2). The MNA solver then sees the
 * bulb sitting between the socket's two pins.
 *
 * @param bulbId - Id of the bulb node
 * @param socketId - Id of the socket node
 * @returns Two hidden edges
 */
export function createSnapEdges(bulbId: string, socketId: string): Edge[] {
  return (['p1', 'p2'] as const).map((pin) => ({
    id: `${SNAP_EDGE_PREFIX}${bulbId}_${pin}`,
    source: socketId,
    sourceHandle: pin,
    target: bulbId,
    targetHandle: pin,
    type: 'wire',
    hidden: true,
    selectable: false,
    focusable: false,
  }));
}

/**
 * Removes the invisible snap wires that belong to a given bulb.
 *
 * @param edges - Current edge list
 * @param bulbId - Bulb whose snap wires should be dropped
 * @returns New edge list without that bulb's snap wires
 */
export function removeSnapEdges(edges: Edge[], bulbId: string): Edge[] {
  return edges.filter((edge) => !edge.id.startsWith(`${SNAP_EDGE_PREFIX}${bulbId}_`));
}

/**
 * Counts only user-drawn wires (excludes invisible snap wires).
 *
 * @param edges - Current edge list
 * @returns Number of visible wires
 */
export function countVisibleWires(edges: Edge[]): number {
  return edges.reduce((total, edge) => (edge.hidden ? total : total + 1), 0);
}

/** User-facing notices (id/en) for socket interactions. */
export const SOCKET_NOTICES = {
  screwOnly: {
    id: 'Fiting ini hanya untuk lampu ulir (screw)!',
    en: 'This socket only accepts screw-base bulbs!',
  },
  detachedByType: {
    id: 'Lampu dilepas dari fiting karena tipenya bukan ulir.',
    en: 'Bulb removed from the socket because it is not a screw-base type.',
  },
} as const;
