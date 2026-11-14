/**
 * Cross-Viewport Wiring & Panoramic Navigation Helpers
 *
 * Pure utility functions for two-tap pin wiring ("Tap Pin A -> Pan/Jump -> Tap Pin B"),
 * off-screen quick-connect target discovery, edge auto-pan velocity during drag,
 * and mini camera radar markers on panoramic Outdoor Worlds (1360px+ wide on 360px phones).
 */

import { Edge, Node } from 'reactflow';
import { CircuitElementData, WorldMode } from '../types/circuit';
import { COMPONENT_DIMENSIONS, OUTDOOR_WORLD_MIN_WIDTH } from '../physics/terrainGrid';

export interface PendingWireStart {
  nodeId: string;
  handleId: string;
  handleType?: 'source' | 'target' | null;
  worldScope: WorldMode;
}

export interface HandleDescriptor {
  handleId: string;
  label: string;
  isPositive: boolean;
}

export interface QuickWireTarget {
  nodeId: string;
  handleId: string;
  componentLabel: string;
  componentType: string;
  handleLabel: string;
  isPositive: boolean;
  isPriorityTower: boolean;
  isOffscreen: boolean;
  offscreenDirection: 'left' | 'right' | null;
  nodeCenterX: number;
}

export interface OutdoorRadarMarker {
  id: string;
  label: string;
  type: string;
  ratioX: number;
  category: 'tower' | 'hydro' | 'solar' | 'wind' | 'bess' | 'other';
  centerX: number;
}

export interface OffscreenJumpTarget {
  nodeId: string;
  label: string;
  direction: 'left' | 'right';
  targetScrollLeft: number;
  isTower: boolean;
}

const DEFAULT_EDGE_AUTOPAN_MARGIN_PX = 52;
const DEFAULT_EDGE_AUTOPAN_SPEED_PX = 10;

/**
 * Formats a handle identifier into a concise polarity/pin label.
 * Time Complexity: O(1).
 *
 * @param handleId - ReactFlow handle identifier
 * @param isIndonesian - Locale toggle
 * @returns Short human-readable pin label
 */
export function getHandleDisplayName(
  handleId: string | null | undefined,
  isIndonesian: boolean = true
): string {
  const normalized = (handleId ?? 'pos').toLowerCase();
  if (normalized === 'pos' || normalized === 'in' || normalized === 'v+') {
    return '+';
  }
  if (normalized === 'neg' || normalized === 'out' || normalized === 'v-') {
    return '-';
  }
  if (normalized === 'p1') return isIndonesian ? 'Pin 1' : 'Pin 1';
  if (normalized === 'p2') return isIndonesian ? 'Pin 2' : 'Pin 2';
  if (normalized === 'gnd') return 'GND';
  return handleId || '+';
}

/**
 * Lists connectable terminal handles for any circuit component type.
 * Passive unmounted bulbs return `[]` because they must enter a socket first.
 * Time Complexity: O(1).
 *
 * @param type - Component type string
 * @returns Ordered list of handle descriptors
 */
export function getConnectableHandlesForComponent(
  type: string | undefined
): HandleDescriptor[] {
  if (!type || type === 'bulb') {
    return [];
  }

  switch (type) {
    case 'hydro-turbine':
    case 'hydro_turbine':
    case 'solar-panel':
    case 'solar_panel':
    case 'wind-turbine':
    case 'wind_turbine':
    case 'bess-substation':
    case 'bess_substation':
    case 'transmission-tower':
    case 'transmission_tower':
    case 'distribution-panel':
    case 'distribution_panel':
    case 'battery':
    case 'battery9v':
    case 'battery-holder':
      return [
        { handleId: 'pos', label: '+', isPositive: true },
        { handleId: 'neg', label: '-', isPositive: false },
      ];
    case 'switch':
    case 'resistor':
    case 'socket':
    case 'pin-socket':
    case 'socket-pin':
      return [
        { handleId: 'p1', label: 'Pin 1', isPositive: true },
        { handleId: 'p2', label: 'Pin 2', isPositive: false },
      ];
    case 'voltmeter':
    case 'ammeter':
      return [
        { handleId: 'pos', label: '+', isPositive: true },
        { handleId: 'neg', label: '-', isPositive: false },
      ];
    case 'ground':
    case 'waypoint':
      return [{ handleId: 'p1', label: 'Pin', isPositive: true }];
    default:
      return [
        { handleId: 'pos', label: '+', isPositive: true },
        { handleId: 'neg', label: '-', isPositive: false },
      ];
  }
}

/**
 * Checks whether an edge already directly connects the two given terminal pins in either direction.
 * Time Complexity: O(E) where E is edge count.
 *
 * @param edges - Existing circuit wires
 * @param sourceId - First node id
 * @param sourceHandle - First handle id
 * @param targetId - Second node id
 * @param targetHandle - Second handle id
 * @returns True if an equivalent wire already exists
 */
export function isEdgeAlreadyConnectingPins(
  edges: Edge[],
  sourceId: string,
  sourceHandle: string,
  targetId: string,
  targetHandle: string
): boolean {
  return edges.some(
    (edge) =>
      (edge.source === sourceId &&
        (edge.sourceHandle ?? 'pos') === sourceHandle &&
        edge.target === targetId &&
        (edge.targetHandle ?? 'pos') === targetHandle) ||
      (edge.source === targetId &&
        (edge.sourceHandle ?? 'pos') === targetHandle &&
        edge.target === sourceId &&
        (edge.targetHandle ?? 'pos') === sourceHandle)
  );
}

/**
 * Estimates a node's horizontal center pixel coordinate using component footprint dimensions.
 * Time Complexity: O(1).
 *
 * @param node - ReactFlow node
 * @returns Horizontal center in canvas world pixels
 */
export function getNodeHorizontalCenter(node: Node<CircuitElementData>): number {
  const dims = COMPONENT_DIMENSIONS[node.data?.type ?? ''];
  const width = dims?.width ?? (typeof node.width === 'number' ? node.width : 110);
  const baseX = typeof node.position?.x === 'number' && Number.isFinite(node.position.x) ? node.position.x : 0;
  return baseX + width * 0.5;
}

function isTransmissionNodeType(type: string | undefined): boolean {
  return (
    type === 'transmission-tower' ||
    type === 'transmission_tower' ||
    type === 'distribution-panel' ||
    type === 'distribution_panel'
  );
}

/**
 * Discovers ranked quick-connect target pins for an active pending wire origin.
 * Transmission towers (even when outside the mobile camera viewport) are always ranked first
 * so cross-viewport wiring takes one tap instead of impossible cross-screen dragging.
 * Time Complexity: O(N log N + N * E) where N <= 30 nodes and E <= 60 edges.
 *
 * @param nodes - All circuit nodes
 * @param edges - Existing circuit edges
 * @param pendingStart - Currently active wire origin pin
 * @param viewportWindow - Current camera horizontal window `{ left, right }` (optional)
 * @param isIndonesian - Locale toggle
 * @returns Ranked target handle suggestions
 */
export function findQuickWireTargets(
  nodes: Node<CircuitElementData>[],
  edges: Edge[],
  pendingStart: PendingWireStart | null,
  viewportWindow?: { left: number; right: number },
  isIndonesian: boolean = true
): QuickWireTarget[] {
  if (!pendingStart) return [];

  const sourceHandleDesc = getHandleDisplayName(pendingStart.handleId, isIndonesian);
  const startIsPositive =
    pendingStart.handleId === 'pos' ||
    pendingStart.handleId === 'p1' ||
    sourceHandleDesc === '+';

  const scopedNodes = nodes.filter((node) => {
    if (node.id === pendingStart.nodeId) return false;
    const nodeScope: WorldMode = node.data?.worldMode === 'outside' ? 'outside' : 'lab';
    if (nodeScope !== pendingStart.worldScope) return false;
    return getConnectableHandlesForComponent(node.data?.type).length > 0;
  });

  // Sort candidate nodes: Transmission Tower first, then BESS, then other generators/loads, then by distance
  const sourceNode = nodes.find((n) => n.id === pendingStart.nodeId);
  const sourceCenterX = sourceNode ? getNodeHorizontalCenter(sourceNode) : 0;

  const prioritizedNodes = [...scopedNodes].sort((a, b) => {
    const aTower = isTransmissionNodeType(a.data?.type) ? 0 : 1;
    const bTower = isTransmissionNodeType(b.data?.type) ? 0 : 1;
    if (aTower !== bTower) return aTower - bTower;

    const aBess = a.data?.type === 'bess-substation' || a.data?.type === 'bess_substation' ? 0 : 1;
    const bBess = b.data?.type === 'bess-substation' || b.data?.type === 'bess_substation' ? 0 : 1;
    if (aBess !== bBess) return aBess - bBess;

    return (
      Math.abs(getNodeHorizontalCenter(a) - sourceCenterX) -
      Math.abs(getNodeHorizontalCenter(b) - sourceCenterX)
    );
  });

  const targets: QuickWireTarget[] = [];

  for (const node of prioritizedNodes) {
    const handles = getConnectableHandlesForComponent(node.data?.type);
    if (handles.length === 0) continue;

    // Pick best matching polarity handle first (e.g. hydro '+' -> tower '+', hydro '-' -> tower '-')
    const sortedHandles = [...handles].sort((hA, hB) => {
      const matchA = hA.isPositive === startIsPositive ? 0 : 1;
      const matchB = hB.isPositive === startIsPositive ? 0 : 1;
      return matchA - matchB;
    });

    const preferredHandle = sortedHandles.find(
      (handle) =>
        !isEdgeAlreadyConnectingPins(
          edges,
          pendingStart.nodeId,
          pendingStart.handleId,
          node.id,
          handle.handleId
        )
    );
    if (!preferredHandle) continue;

    const centerX = getNodeHorizontalCenter(node);
    const hasWindow =
      viewportWindow !== undefined &&
      viewportWindow.right > viewportWindow.left;
    const isOffscreen = hasWindow
      ? centerX < viewportWindow!.left || centerX > viewportWindow!.right
      : false;
    const offscreenDirection = !isOffscreen
      ? null
      : centerX < viewportWindow!.left
      ? 'left'
      : 'right';

    targets.push({
      nodeId: node.id,
      handleId: preferredHandle.handleId,
      componentLabel: node.data?.label || String(node.data?.type || 'Component'),
      componentType: String(node.data?.type || ''),
      handleLabel: preferredHandle.label,
      isPositive: preferredHandle.isPositive,
      isPriorityTower: isTransmissionNodeType(node.data?.type),
      isOffscreen,
      offscreenDirection,
      nodeCenterX: centerX,
    });
  }

  return targets;
}

/**
 * Maps outdoor components onto normalized [0..1] radar dots along the panoramic world bar.
 * Time Complexity: O(N) where N is outdoor node count.
 *
 * @param outdoorNodes - Nodes inside Outdoor world
 * @param worldWidth - Total panoramic width (px)
 * @returns Array of normalized radar markers
 */
export function buildOutdoorRadarMarkers(
  outdoorNodes: Node<CircuitElementData>[],
  worldWidth: number = OUTDOOR_WORLD_MIN_WIDTH
): OutdoorRadarMarker[] {
  const safeWidth = Math.max(OUTDOOR_WORLD_MIN_WIDTH, worldWidth);
  return outdoorNodes
    .filter((n) => n.data?.type !== 'waypoint')
    .map((node) => {
      const centerX = getNodeHorizontalCenter(node);
      const ratioX = Math.max(0.02, Math.min(0.98, centerX / safeWidth));
      const type = String(node.data?.type ?? '');
      let category: OutdoorRadarMarker['category'] = 'other';
      if (isTransmissionNodeType(type)) category = 'tower';
      else if (type === 'hydro-turbine' || type === 'hydro_turbine') category = 'hydro';
      else if (type === 'solar-panel' || type === 'solar_panel') category = 'solar';
      else if (type === 'wind-turbine' || type === 'wind_turbine') category = 'wind';
      else if (type === 'bess-substation' || type === 'bess_substation') category = 'bess';

      return {
        id: node.id,
        label: node.data?.label || type,
        type,
        ratioX,
        category,
        centerX,
      };
    });
}

/**
 * Finds the best off-screen jump target (prioritizing an off-screen Transmission Tower,
 * otherwise nearest off-screen outdoor component) for the mobile camera quick-jump pill.
 * Time Complexity: O(N).
 *
 * @param outdoorNodes - Outdoor nodes list
 * @param cameraScrollX - Current horizontal scrollLeft (px)
 * @param viewportWidth - Visible viewport width (px)
 * @param worldWidth - Total stage width (px)
 * @param isIndonesian - Locale toggle
 * @returns Jump target or null when all nodes are visible
 */
export function findNearestOffscreenTowerJump(
  outdoorNodes: Node<CircuitElementData>[],
  cameraScrollX: number,
  viewportWidth: number,
  worldWidth: number = OUTDOOR_WORLD_MIN_WIDTH,
  isIndonesian: boolean = true
): OffscreenJumpTarget | null {
  if (viewportWidth <= 0 || outdoorNodes.length === 0) return null;
  const maxScroll = Math.max(0, worldWidth - viewportWidth);
  if (maxScroll <= 10) return null;

  const viewLeft = cameraScrollX + 24;
  const viewRight = cameraScrollX + viewportWidth - 24;

  const offscreen = outdoorNodes
    .filter((n) => n.data?.type !== 'waypoint')
    .map((node) => {
      const centerX = getNodeHorizontalCenter(node);
      const isOffscreen = centerX < viewLeft || centerX > viewRight;
      return {
        node,
        centerX,
        isOffscreen,
        isTower: isTransmissionNodeType(node.data?.type),
      };
    })
    .filter((item) => item.isOffscreen);

  if (offscreen.length === 0) return null;

  offscreen.sort((a, b) => {
    if (a.isTower !== b.isTower) return a.isTower ? -1 : 1;
    const distA = Math.abs(a.centerX - (cameraScrollX + viewportWidth * 0.5));
    const distB = Math.abs(b.centerX - (cameraScrollX + viewportWidth * 0.5));
    return distA - distB;
  });

  const best = offscreen[0];
  const targetScrollLeft = Math.round(
    Math.max(0, Math.min(maxScroll, best.centerX - viewportWidth * 0.5))
  );
  const direction: 'left' | 'right' = best.centerX < viewLeft ? 'left' : 'right';

  let label = isIndonesian ? 'Komponen' : 'Node';
  if (best.isTower) {
    label = isIndonesian ? 'Menara' : 'Tower';
  } else {
    const t = best.node.data?.type;
    if (t === 'hydro-turbine' || t === 'hydro_turbine') {
      label = isIndonesian ? 'Mikrohidro' : 'Hydro';
    } else if (t === 'bess-substation' || t === 'bess_substation') {
      label = 'BESS';
    } else if (t === 'wind-turbine' || t === 'wind_turbine') {
      label = isIndonesian ? 'Angin' : 'Wind';
    } else if (t === 'solar-panel' || t === 'solar_panel') {
      label = isIndonesian ? 'Surya' : 'Solar';
    }
  }

  return {
    nodeId: best.node.id,
    label,
    direction,
    targetScrollLeft,
    isTower: best.isTower,
  };
}

/**
 * Smoothly centers the panoramic outdoor viewport around a world X coordinate.
 * Safe no-op in SSR or when the world fits inside the current viewport.
 * Time Complexity: O(1).
 *
 * @param worldCenterX - Target world horizontal center in pixels
 * @param behavior - Scroll behavior ('smooth' or 'auto')
 */
export function scrollOutdoorViewportToX(
  worldCenterX: number,
  behavior: ScrollBehavior = 'smooth'
): void {
  if (typeof document === 'undefined' || !Number.isFinite(worldCenterX)) return;
  const viewport = document.getElementById('outdoor-scroll-viewport');
  if (!viewport) return;

  const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  if (maxScroll <= 0) return;

  const targetLeft = Math.round(
    Math.max(0, Math.min(maxScroll, worldCenterX - viewport.clientWidth * 0.5))
  );

  if (typeof viewport.scrollTo === 'function') {
    try {
      viewport.scrollTo({ left: targetLeft, behavior });
      return;
    } catch {
      // Fallback to direct property write in virtual DOM environments
    }
  }
  viewport.scrollLeft = targetLeft;
}

/**
 * Extracts clientX / clientY safely from MouseEvent, TouchEvent, or React synthetic events.
 * Time Complexity: O(1).
 */
export function extractPointerClientPoint(
  event:
    | MouseEvent
    | TouchEvent
    | { clientX?: number; clientY?: number; touches?: ArrayLike<{ clientX: number; clientY: number }>; changedTouches?: ArrayLike<{ clientX: number; clientY: number }> }
    | null
    | undefined
): { clientX: number; clientY: number } | null {
  if (!event) return null;

  if (
    'clientX' in event &&
    typeof event.clientX === 'number' &&
    typeof event.clientY === 'number' &&
    Number.isFinite(event.clientX) &&
    Number.isFinite(event.clientY)
  ) {
    return { clientX: event.clientX, clientY: event.clientY };
  }

  const touchList =
    'touches' in event && event.touches && event.touches.length > 0
      ? event.touches
      : 'changedTouches' in event && event.changedTouches && event.changedTouches.length > 0
      ? event.changedTouches
      : null;

  if (touchList && touchList.length > 0) {
    const t = touchList[0];
    if (Number.isFinite(t.clientX) && Number.isFinite(t.clientY)) {
      return { clientX: t.clientX, clientY: t.clientY };
    }
  }

  return null;
}

/**
 * Computes horizontal edge-scroll velocity (px/frame) when a pointer drags near viewport borders.
 * Returns 0 when safely inside the center of the viewport.
 * Time Complexity: O(1).
 */
export function computeEdgeAutoPanVelocity(
  clientX: number,
  viewportRect: { left: number; right: number },
  edgeMarginPx: number = DEFAULT_EDGE_AUTOPAN_MARGIN_PX,
  maxSpeedPxPerFrame: number = DEFAULT_EDGE_AUTOPAN_SPEED_PX
): number {
  if (!Number.isFinite(clientX) || viewportRect.right <= viewportRect.left) return 0;

  const distFromLeft = clientX - viewportRect.left;
  const distFromRight = viewportRect.right - clientX;

  if (distFromLeft < edgeMarginPx) {
    const ratio = Math.min(1, Math.max(0.15, (edgeMarginPx - distFromLeft) / edgeMarginPx));
    return -Math.round(ratio * maxSpeedPxPerFrame);
  }
  if (distFromRight < edgeMarginPx) {
    const ratio = Math.min(1, Math.max(0.15, (edgeMarginPx - distFromRight) / edgeMarginPx));
    return Math.round(ratio * maxSpeedPxPerFrame);
  }
  return 0;
}
