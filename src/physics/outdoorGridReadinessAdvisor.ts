import { Edge, Node } from 'reactflow';
import {
  CircuitElementData,
  WorldMode,
  isOutdoorOnlyComponent,
} from '../types/circuit';

export interface OutdoorGridReadinessAdvisory {
  /** True when in Outdoor Mode with >=1 active generator wired to a SUTET tower */
  isReadyToSupplyLab: boolean;
  /** Number of active outdoor generators (>= 4V) wired to a SUTET tower */
  wiredGeneratorCount: number;
  /** Distinct human-readable generator labels connected to SUTET */
  generatorLabels: string[];
  /** Highest bus voltage among connected outdoor sources (Volts) */
  busVoltageVolts: number;
  /** Total active Watts reported on the connected outdoor sources */
  totalWatts: number;
  /** True when Lab already contains a distribution-panel connected to grid */
  hasLabDistributionPanel: boolean;
  /** True when at least one Lab battery is already actively charging */
  isLabAlreadyCharging: boolean;
  /** Count of Lab batteries below 95% SoC that can be recharged */
  labDrainedBatteryCount: number;
  /** Concise localized callout copy for bottom-right popup */
  popupBadge: string;
  popupTitle: string;
  popupSubtitle: string;
  ctaLabel: string;
}

const MIN_ACTIVE_OUTDOOR_VOLTAGE = 4.0;

function isOutdoorTransmissionTowerNode(node: Node<CircuitElementData>): boolean {
  const type = node?.data?.type;
  if (type !== 'transmission-tower' && type !== 'transmission_tower') {
    return false;
  }
  return node.data?.worldMode === 'outside';
}

function isLabDistributionPanelNode(node: Node<CircuitElementData>): boolean {
  const type = node?.data?.type;
  if (type === 'distribution-panel' || type === 'distribution_panel') {
    return node.data?.worldMode !== 'outside';
  }
  if (type === 'transmission-tower' || type === 'transmission_tower') {
    return node.data?.worldMode === 'lab';
  }
  return false;
}

function getEffectiveOutdoorSourceVoltage(data: CircuitElementData): number {
  const voltage = data.calculatedVoltage ?? data.voltage ?? 0;
  return Number.isFinite(voltage) ? Math.max(0, voltage) : 0;
}

function getOutdoorSourceShortName(type: CircuitElementData['type'], isId: boolean): string {
  switch (type) {
    case 'solar-panel':
    case 'solar_panel':
      return isId ? 'PLTS Surya' : 'Solar PV';
    case 'wind-turbine':
    case 'wind_turbine':
      return isId ? 'Turbin Angin' : 'Wind Turbine';
    case 'hydro-turbine':
    case 'hydro_turbine':
      return isId ? 'Mikrohidro' : 'Micro-Hydro';
    case 'bess-substation':
    case 'bess_substation':
      return isId ? 'Gardu BESS' : 'BESS Battery';
    default:
      return isId ? 'Pembangkit' : 'Generator';
  }
}

/**
 * Evaluates whether the user has built a valid Outdoor Power Plant -> SUTET circuit
 * that is ready to transmit clean energy into the Indoor Lab to recharge depleted batteries.
 *
 * Algorithm:
 * 1. Linear scan of nodes to classify outdoor SUTET towers, outdoor sources, and lab panels/batteries: O(N).
 * 2. Construct undirected graph adjacency map across all canvas edges: O(E).
 * 3. BFS from active outdoor SUTET towers (MCB ON, not tripped) to confirm physical wiring
 *    between active generators (>= 4V) and SUTET: O(N + E).
 *
 * Time Complexity: O(N + E)
 * Space Complexity: O(N + E)
 *
 * @param nodes - All workspace nodes
 * @param edges - All workspace wire edges
 * @param worldMode - Current active world viewport mode
 * @param language - UI locale ('id' | 'en')
 * @returns Structured readiness summary and mobile-friendly callout text
 */
export function evaluateOutdoorGridReadiness(
  nodes: Node<CircuitElementData>[],
  edges: Edge[],
  worldMode: WorldMode,
  language: 'id' | 'en' = 'id'
): OutdoorGridReadinessAdvisory {
  const isId = language === 'id';
  const emptyResult: OutdoorGridReadinessAdvisory = {
    isReadyToSupplyLab: false,
    wiredGeneratorCount: 0,
    generatorLabels: [],
    busVoltageVolts: 0,
    totalWatts: 0,
    hasLabDistributionPanel: false,
    isLabAlreadyCharging: false,
    labDrainedBatteryCount: 0,
    popupBadge: '',
    popupTitle: '',
    popupSubtitle: '',
    ctaLabel: '',
  };

  if (worldMode !== 'outside' || !Array.isArray(nodes) || !Array.isArray(edges)) {
    return emptyResult;
  }

  const nodeMap = new Map<string, Node<CircuitElementData>>();
  const activeOutdoorTowerIds: string[] = [];
  let hasLabDistributionPanel = false;
  let isLabAlreadyCharging = false;
  let labDrainedBatteryCount = 0;

  for (const node of nodes) {
    if (!node?.id || !node?.data) continue;
    nodeMap.set(node.id, node);

    if (isOutdoorTransmissionTowerNode(node)) {
      const mcbHealthy = node.data.isMcbOn !== false && !node.data.isMcbTripped;
      if (mcbHealthy) {
        activeOutdoorTowerIds.push(node.id);
      }
      continue;
    }

    if (isLabDistributionPanelNode(node)) {
      hasLabDistributionPanel = true;
      continue;
    }

    const type = node.data.type;
    if (
      node.data.worldMode !== 'outside' &&
      (type === 'battery' || type === 'battery9v' || type === 'battery-holder')
    ) {
      if (node.data.chargeState === 'charging') {
        isLabAlreadyCharging = true;
      }
      if ((node.data.currentCharge ?? 100) < 95) {
        labDrainedBatteryCount += 1;
      }
    }
  }

  if (activeOutdoorTowerIds.length === 0) {
    return {
      ...emptyResult,
      hasLabDistributionPanel,
      isLabAlreadyCharging,
      labDrainedBatteryCount,
    };
  }

  // Build undirected adjacency list over wire edges in O(E)
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    if (!edge?.source || !edge?.target) continue;
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, []);
    adjacency.get(edge.source)!.push(edge.target);
    adjacency.get(edge.target)!.push(edge.source);
  }

  // BFS from outdoor SUTET towers to discover wired active outdoor sources in O(N + E)
  const visited = new Set<string>(activeOutdoorTowerIds);
  const queue: string[] = [...activeOutdoorTowerIds];
  let queueIdx = 0;

  const wiredSourceLabels = new Set<string>();
  let wiredGeneratorCount = 0;
  let busVoltageVolts = 0;
  let totalWatts = 0;

  while (queueIdx < queue.length) {
    const currentId = queue[queueIdx++];
    const currentNode = nodeMap.get(currentId);

    if (currentNode?.data) {
      const type = currentNode.data.type;
      if (
        isOutdoorOnlyComponent(type) &&
        type !== 'transmission-tower' &&
        type !== 'transmission_tower'
      ) {
        const effV = getEffectiveOutdoorSourceVoltage(currentNode.data);
        if (effV >= MIN_ACTIVE_OUTDOOR_VOLTAGE) {
          wiredGeneratorCount += 1;
          busVoltageVolts = Math.max(busVoltageVolts, effV);
          const watts = Math.max(0, currentNode.data.calculatedPower ?? currentNode.data.power ?? 0);
          totalWatts += watts;
          wiredSourceLabels.add(getOutdoorSourceShortName(type, isId));
        }
      }
    }

    const neighbors = adjacency.get(currentId);
    if (!neighbors) continue;
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push(neighborId);
      }
    }
  }

  if (wiredGeneratorCount === 0) {
    return {
      ...emptyResult,
      hasLabDistributionPanel,
      isLabAlreadyCharging,
      labDrainedBatteryCount,
    };
  }

  const roundedBusV = Number(busVoltageVolts.toFixed(1));
  const roundedWatts = Number(totalWatts.toFixed(1));

  return {
    isReadyToSupplyLab: true,
    wiredGeneratorCount,
    generatorLabels: Array.from(wiredSourceLabels),
    busVoltageVolts: roundedBusV,
    totalWatts: roundedWatts,
    hasLabDistributionPanel,
    isLabAlreadyCharging,
    labDrainedBatteryCount,
    popupBadge: isId ? `Grid ${roundedBusV}V Aktif` : `${roundedBusV}V Grid Ready`,
    popupTitle: isId
      ? 'Pembangkit + SUTET siap salur ke Lab!'
      : 'Power plant + SUTET ready for Lab!',
    popupSubtitle: isId
      ? 'Listrik ini dipakai untuk mengecas baterai yang dayanya habis di Lab.'
      : 'Channel this free power into Lab to recharge drained batteries.',
    ctaLabel: isLabAlreadyCharging
      ? isId
        ? 'Cek Pengisian Baterai di Lab →'
        : 'View Charging in Lab →'
      : isId
      ? 'Salurkan & Cas Baterai di Lab →'
      : 'Send & Charge Battery in Lab →',
  };
}
