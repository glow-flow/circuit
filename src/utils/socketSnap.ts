/**
 * Socket (fiting) snapping helpers.
 *
 * Pure functions only (no store access) so the geometry and wiring rules are
 * unit-testable and the Zustand store stays small.
 *
 * Time Complexity: `findNearestFreeSocket` O(N) over N nodes; everything else O(1).
 */

import { Edge, Node } from 'reactflow';
import { BulbType } from '../constants/bulbCatalog';
import { CircuitElementData } from '../types/circuit';

/**
 * Rendered size (px) of an image-only BulbNode. Must match BulbNode.tsx & SocketNode.tsx.
 * Calibrated so the glass globe (~68px wide) is naturally wider than the E27 socket (44px wide),
 * while the bulb's E27 metal screw base (~28px-33px wide) fits snugly inside the socket mouth (~34px wide).
 */
export const BULB_NODE_SIZE = { width: 92, height: 112 } as const;
/**
 * Rendered size (px) of a SocketNode (E27 Fiting Lampu). Must match SocketNode.tsx.
 * Preserves exact 546x808 PNG aspect ratio (0.676) at calibrated scale to snugly hug the bulb base.
 */
export const SOCKET_NODE_SIZE = { width: 38, height: 56 } as const;
/**
 * Rendered size (px) of a PinSocketNode (White Ceramic Bi-Pin Socket). Must match PinSocketNode.tsx.
 * Calibrated to the physical ceramic socket body (width ~38px, height ~58px).
 */
export const PIN_SOCKET_NODE_SIZE = { width: 38, height: 58 } as const;
/** How deep (px) the bulb base sits inside the socket mouth when snapped. */
export const BULB_INSERT_DEPTH = 44;
/** How deep (px) the pin bulb sits inside the ceramic bi-pin socket when snapped (112 - 86 = 26px). */
export const PIN_BULB_INSERT_DEPTH = 26;
/** Max distance (px) between a dropped bulb and a socket's snap point to attach. */
export const SNAP_RADIUS = 90;
/** Distance (px) a rejected bulb is pushed away from the socket it cannot fit. */
export const REJECT_PUSH_DISTANCE = 140;

/**
 * Polygon clip-path tracing the exact front elliptical rim of `socket.png`.
 * Used on the foreground socket layer (`z-index: 30`) so the front lip of the socket
 * wraps in front of the bulb's screw thread (`z-index: 20`), while the back rim of the socket
 * (`z-index: 10`) stays behind the bulb neck.
 */
export const SOCKET_FRONT_LIP_CLIP_PATH =
  'polygon(0% 13%, 10% 17.5%, 20% 20.5%, 30% 22.1%, 40% 22.9%, 50% 23.1%, 60% 22.9%, 70% 22.1%, 80% 20.5%, 90% 17.5%, 100% 13%, 100% 100%, 0% 100%)';

/**
 * Polygon clip-path tracing the front ceramic lip of the bi-pin socket (`socket-pin.png`).
 * Used on Layer 3 (`z-index: 30`) so the front ceramic wall wraps in front of the bulb's pins.
 */
export const PIN_SOCKET_FRONT_LIP_CLIP_PATH =
  'polygon(0% 4.8%, 10% 3.6%, 20% 2.8%, 30% 2.6%, 40% 2.9%, 50% 3.2%, 60% 2.9%, 70% 2.6%, 80% 2.8%, 90% 3.6%, 100% 4.8%, 100% 100%, 0% 100%)';

/**
 * Returns the vertical top offset (in px) for an installed bulb inside a SocketNode or PinSocketNode
 * so its glass/ballast shoulder sits flush against the socket's front lip without floating gaps,
 * completely concealing the metal screw threads or pins inside the socket cavity.
 * Time Complexity: O(1).
 *
 * Calibration:
 * - 'incandescent': Glass collar flares at 78.2px -> -66px (sits at +12.2px)
 * - 'edison': Amber glass shoulder ends at 86.9px -> -74px (sits at +12.9px, flush with front lip)
 * - 'cfl': White plastic ballast shoulder ends at 85.4px -> -72px (sits at +13.4px, flush on socket rim, zero drat gap)
 * - 'led_standard': Diffuser collar flares at 87.5px -> -74px (sits at +13.5px)
 * - 'led_rgb': Diffuser collar flares at 87.2px -> -74px (sits at +13.2px)
 * - 'halogen': Dark pinch collar ends at 86.0px -> -86px (pins penetrate 26px into ceramic slots, zero gap)
 * - 'led_green': Green epoxy dome base ends at 48.0px -> -46px (pins penetrate into ceramic slots, zero gap)
 *
 * @param bulbType - Type of bulb installed in the socket
 * @returns Negative top offset in pixels
 */
export function getInstalledBulbTopOffset(bulbType?: BulbType): number {
  switch (bulbType) {
    case 'incandescent':
      return -66;
    case 'edison':
      return -74;
    case 'cfl':
      return -72;
    case 'led_standard':
    case 'led_rgb':
      return -74;
    case 'halogen':
      return -86;
    case 'led_green':
      return -46;
    default:
      return -74;
  }
}

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
 * Supports standard E27 sockets and ceramic pin sockets.
 * Time Complexity: O(N) over N nodes.
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
    const isSocket = candidate.data.type === 'socket' || candidate.data.type === 'pin-socket';
    if (!isSocket || candidate.data.bulbId || candidate.data.installedBulb) continue;
    const distance = candidate.data.type === 'pin-socket'
      ? distanceToPinSocketSnapPoint(bulbNode.position, candidate.position)
      : distanceToSocketSnapPoint(bulbNode.position, candidate.position);
    if (distance <= nearestDistance) {
      nearestDistance = distance;
      nearestSocket = candidate;
    }
  }
  return nearestSocket;
}

/**
 * Computes where a bulb's top-left corner must be so its pins sit inside the ceramic bi-pin socket.
 * Time Complexity: O(1).
 *
 * @param pinSocketPosition - Top-left position of the pin socket node
 * @returns Top-left position for the snapped bulb node
 */
export function getPinBulbSnapPosition(pinSocketPosition: Point): Point {
  return {
    x: pinSocketPosition.x + (PIN_SOCKET_NODE_SIZE.width - BULB_NODE_SIZE.width) / 2,
    y: pinSocketPosition.y - BULB_NODE_SIZE.height + PIN_BULB_INSERT_DEPTH,
  };
}

/**
 * Euclidean distance between a bulb and the snap point of a ceramic bi-pin socket.
 * Time Complexity: O(1).
 *
 * @param bulbPosition - Top-left position of the bulb node
 * @param pinSocketPosition - Top-left position of the pin socket node
 * @returns Distance in pixels
 */
export function distanceToPinSocketSnapPoint(bulbPosition: Point, pinSocketPosition: Point): number {
  const snapPoint = getPinBulbSnapPosition(pinSocketPosition);
  return Math.hypot(bulbPosition.x - snapPoint.x, bulbPosition.y - snapPoint.y);
}

/**
 * Finds the closest ceramic bi-pin socket within `SNAP_RADIUS` that has no bulb in it yet.
 * Time Complexity: O(N) over N nodes.
 *
 * @param bulbNode - The bulb that was just dropped
 * @param allNodes - Every node currently on the canvas
 * @returns The nearest free pin socket node, or undefined when none is in range
 */
export function findNearestFreePinSocket(
  bulbNode: Node<CircuitElementData>,
  allNodes: Node<CircuitElementData>[]
): Node<CircuitElementData> | undefined {
  let nearestSocket: Node<CircuitElementData> | undefined;
  let nearestDistance = SNAP_RADIUS;

  for (const candidate of allNodes) {
    const isPinSocket = candidate.data.type === 'pin-socket' || candidate.data.type === 'socket-pin';
    if (!isPinSocket || candidate.data.bulbId || candidate.data.installedBulb) continue;
    const distance = distanceToPinSocketSnapPoint(bulbNode.position, candidate.position);
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
    id: 'Fiting E27 ini khusus lampu berulir! Lampu tipe pin (Halogen & LED Indikator) tidak muat.',
    en: 'This E27 socket is for screw-base bulbs only! Pin-base bulbs (Halogen & Indicator LED) do not fit.',
  },
  pinOnly: {
    id: 'Fiting pin keramik ini khusus lampu tipe pin (Halogen & LED Indikator)! Lampu tipe ulir (E27) tidak muat.',
    en: 'This ceramic pin socket is for pin-base bulbs (Halogen & Indicator LED) only! Screw-base bulbs do not fit.',
  },
  detachedByType: {
    id: 'Lampu dilepas dari fiting karena menggunakan kaki pin, bukan ulir E27.',
    en: 'Bulb detached because it uses pin terminals, not an E27 screw base.',
  },
} as const;
