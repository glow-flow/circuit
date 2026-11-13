import { Edge, Node } from 'reactflow';
import { CircuitElementData, isOutdoorOnlyComponent } from '../types/circuit';

export interface LabChargingStationMergeResult {
  nodes: Node<CircuitElementData>[];
  edges: Edge[];
  spawnedNewStation: boolean;
  panelId: string | null;
  batteryId: string | null;
}

function isLabNode(node: Node<CircuitElementData>): boolean {
  const type = node?.data?.type;
  if (!type) return false;
  return node.data.worldMode !== 'outside' && !isOutdoorOnlyComponent(type);
}

function findExistingLabPanel(nodes: Node<CircuitElementData>[]): Node<CircuitElementData> | undefined {
  return nodes.find((n) => {
    const type = n.data?.type;
    if (type === 'distribution-panel' || type === 'distribution_panel') {
      return n.data.worldMode !== 'outside';
    }
    return (type === 'transmission-tower' || type === 'transmission_tower') && n.data.worldMode === 'lab';
  });
}

function hasActiveChargingBatteryInLab(nodes: Node<CircuitElementData>[]): boolean {
  return nodes.some((n) => {
    if (!isLabNode(n)) return false;
    const type = n.data?.type;
    const isBatteryType =
      type === 'battery' || type === 'battery9v' || type === 'battery-holder';
    return isBatteryType && n.data.chargeState === 'charging';
  });
}

/**
 * Computes non-overlapping Lab canvas origin beside existing Lab components.
 * Time Complexity: O(N) over existing workspace nodes.
 *
 * @param existingNodes - Current workspace node list
 * @returns Clean `{ x, y }` origin in Lab canvas space
 */
export function computeSafeLabChargerOrigin(
  existingNodes: Node<CircuitElementData>[]
): { x: number; y: number } {
  let maxLabX = -Infinity;
  let anchorY = 120;
  let labCount = 0;

  for (const node of existingNodes) {
    if (!isLabNode(node)) continue;
    labCount += 1;
    const x = node.position?.x ?? 0;
    const y = node.position?.y ?? 0;
    if (x > maxLabX) {
      maxLabX = x;
      anchorY = Math.max(40, Math.min(340, Math.round(y)));
    }
  }

  if (labCount === 0 || !Number.isFinite(maxLabX)) {
    return { x: 100, y: 120 };
  }

  return { x: Math.round(maxLabX + 260), y: anchorY };
}

/**
 * Non-destructively merges a ready-to-charge Green Grid station
 * (`Panel Distribusi Lab` 12V + drained `Baterai 9V` at 15% SoC) into the indoor Lab
 * without erasing any existing student circuits or outdoor components.
 *
 * Time Complexity: O(N + E) for linear node scanning and safe shallow copy.
 * Space Complexity: O(N + E).
 *
 * @param existingNodes - All workspace nodes
 * @param existingEdges - All workspace edges
 * @param language - Locale code ('id' | 'en')
 * @returns Updated nodes, edges, and spawned station references
 */
export function buildLabChargingStationMerge(
  existingNodes: Node<CircuitElementData>[],
  existingEdges: Edge[],
  language: 'id' | 'en' = 'id'
): LabChargingStationMergeResult {
  const isId = language === 'id';
  const existingPanel = findExistingLabPanel(existingNodes);
  const alreadyCharging = hasActiveChargingBatteryInLab(existingNodes);

  if (existingPanel && alreadyCharging) {
    return {
      nodes: existingNodes,
      edges: existingEdges,
      spawnedNewStation: false,
      panelId: existingPanel.id,
      batteryId: null,
    };
  }

  const timestamp = Date.now();
  const origin = computeSafeLabChargerOrigin(existingNodes);
  const addedNodes: Node<CircuitElementData>[] = [];
  const addedEdges: Edge[] = [];

  let targetPanelId: string;
  let batteryPositionX: number;
  let batteryPositionY: number;

  if (existingPanel) {
    // Turn MCB ON and ensure safe 12V step-down on existing Lab Distribution Panel
    targetPanelId = existingPanel.id;
    batteryPositionX = Math.round((existingPanel.position?.x ?? origin.x) + 270);
    batteryPositionY = Math.round((existingPanel.position?.y ?? origin.y) + 55);
  } else {
    targetPanelId = `dist_panel_lab_${timestamp}`;
    addedNodes.push({
      id: targetPanelId,
      type: 'distribution-panel',
      position: { x: origin.x, y: origin.y },
      data: {
        id: targetPanelId,
        type: 'distribution-panel',
        worldMode: 'lab',
        isMcbOn: true,
        isMcbTripped: false,
        stepDownVoltage: 12.0,
        label: isId ? 'Panel Distribusi Lab (Dari Alam)' : 'Lab Distribution Panel (Grid)',
      },
    });
    batteryPositionX = origin.x + 280;
    batteryPositionY = origin.y + 60;
  }

  const batteryId = `bat9v_charger_${timestamp + 1}`;
  addedNodes.push({
    id: batteryId,
    type: 'battery9v',
    position: { x: batteryPositionX, y: batteryPositionY },
    data: {
      id: batteryId,
      type: 'battery9v',
      worldMode: 'lab',
      voltage: 9.0,
      capacity: 500,
      currentCharge: 15, // Starts depleted at 15% so live grid recharge is immediately visible
      chargeState: 'charging',
      label: isId ? 'Baterai 9V (Diisi dari Alam)' : '9V Battery (Grid Charging)',
    },
  });

  addedEdges.push(
    {
      id: `wire_grid_charge_pos_${timestamp}`,
      type: 'wire',
      source: targetPanelId,
      sourceHandle: 'pos',
      target: batteryId,
      targetHandle: 'pos',
    },
    {
      id: `wire_grid_charge_neg_${timestamp + 1}`,
      type: 'wire',
      source: targetPanelId,
      sourceHandle: 'neg',
      target: batteryId,
      targetHandle: 'neg',
    }
  );

  const normalizedExistingNodes = existingPanel
    ? existingNodes.map((n) =>
        n.id === existingPanel.id
          ? {
              ...n,
              data: {
                ...n.data,
                isMcbOn: true,
                isMcbTripped: false,
                stepDownVoltage: n.data.stepDownVoltage ?? 12.0,
              },
            }
          : n
      )
    : existingNodes;

  return {
    nodes: [...normalizedExistingNodes, ...addedNodes],
    edges: [...existingEdges, ...addedEdges],
    spawnedNewStation: true,
    panelId: targetPanelId,
    batteryId,
  };
}
