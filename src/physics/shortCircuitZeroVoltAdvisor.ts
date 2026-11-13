/**
 * Short-Circuit & Zero-Volt Battery Diagnostic Advisor (`shortCircuitZeroVoltAdvisor.ts`).
 *
 * Pure diagnostic module that detects when a Lab battery (`battery`, `battery9v`, or
 * `battery-holder`) drops to `0.0V` due to an active short-circuit (`isShortCircuit`)
 * or rapid chemical depletion (`currentCharge <= 0`) when the user closes a switch
 * on a zero-load loop.
 *
 * Strictly separated from UI rendering in accordance with DRY and modular architecture rules.
 *
 * Time Complexity:
 * - `detectShortCircuitZeroVoltState`: O(N + E) single-pass traversal over nodes (N)
 *   and edges (E) using a hash Set for O(1) wired-node membership checks. Zero nested loops.
 * - `recoverShortedBatteriesAndOpenSwitches`: O(N) single pass over store nodes.
 */

import { Edge, Node } from 'reactflow';
import { CircuitElementData, SimulationResult, WorldMode } from '../types/circuit';

export type ZeroVoltTriggerReason = 'active-short-circuit' | 'depleted-zero-volt';

export interface ShortCircuitZeroVoltAdvisory {
  /** Whether a battery on the active Lab canvas has dropped to 0V from a short circuit or depletion. */
  isTriggered: boolean;
  /** ID of the affected battery node on the canvas. */
  batteryNodeId: string;
  /** Cause of the 0V terminal state (`'active-short-circuit'` | `'depleted-zero-volt'`). */
  reason: ZeroVoltTriggerReason;
  /** Nominal chemical EMF (E) of the battery before internal voltage drop, in Volts (e.g. 3.0V or 9.0V). */
  nominalEmfVolts: number;
  /** Measured external terminal voltage (V_kutub) during the event, in Volts (0.0V). */
  terminalVoltageVolts: number;
  /** Realistic internal resistance (r_dalam) of the battery pack, in Ohms. */
  internalResistanceOhms: number;
  /** Theoretical short-circuit surge current (I_korslet = E / r_dalam), in Amperes. */
  peakShortCurrentAmps: number;
  /** Internal heat dissipation power inside the battery (P_panas = E^2 / r_dalam), in Watts. */
  internalHeatWatts: number;
  /** Remaining State of Charge percentage (0..100). */
  batteryChargePercent: number;
  /** Friendly bottom-right pop-up prompt text. */
  teaserPrompt: string;
}

const INACTIVE_ADVISORY: ShortCircuitZeroVoltAdvisory = {
  isTriggered: false,
  batteryNodeId: '',
  reason: 'active-short-circuit',
  nominalEmfVolts: 0,
  terminalVoltageVolts: 0,
  internalResistanceOhms: 0.3,
  peakShortCurrentAmps: 0,
  internalHeatWatts: 0,
  batteryChargePercent: 100,
  teaserPrompt: '',
};

/**
 * Computes the nominal chemical EMF (E) and realistic internal resistance (r_dalam)
 * for a given battery node configuration.
 *
 * Time Complexity: O(1)
 *
 * @param nodeData Circuit element data of the battery node
 * @returns Object containing `nominalEmfVolts` and `internalResistanceOhms`
 */
export function getBatteryInternalPhysicsParams(nodeData: CircuitElementData): {
  nominalEmfVolts: number;
  internalResistanceOhms: number;
} {
  if (nodeData.type === 'battery9v') {
    const nominalEmfVolts =
      typeof nodeData.voltage === 'number' && nodeData.voltage > 0
        ? nodeData.voltage
        : 9.0;
    return {
      nominalEmfVolts,
      internalResistanceOhms: 1.5,
    };
  }

  if (nodeData.type === 'battery-holder') {
    const cellCount =
      typeof nodeData.batteryCount === 'number'
        ? nodeData.batteryCount
        : nodeData.hasBattery === false
        ? 0
        : 2;
    const nominalEmfVolts = Math.max(1.5, cellCount * 1.5);
    return {
      nominalEmfVolts,
      internalResistanceOhms: Number((Math.max(1, cellCount) * 0.15).toFixed(2)),
    };
  }

  const singleCellEmf =
    typeof nodeData.voltage === 'number' && nodeData.voltage > 0
      ? nodeData.voltage
      : 1.5;
  return {
    nominalEmfVolts: singleCellEmf,
    internalResistanceOhms: 0.15,
  };
}

/**
 * Evaluates whether any wired Lab battery has dropped to `0.0V` due to closing a switch
 * on a short-circuit path (`isShortCircuit`) or depleting its chemical charge (`currentCharge <= 0`)
 * during a closed-circuit overload.
 *
 * Time Complexity: O(N + E) where N is node count and E is edge count.
 * Uses a `Set<string>` for O(1) edge endpoint lookups without nested loops.
 *
 * @param nodes Active ReactFlow nodes on the canvas
 * @param edges Active ReactFlow wire edges on the canvas
 * @param simulation Latest MNA simulation result
 * @param worldMode Active world mode (`'lab'` | `'outside'`)
 * @param language Active UI language (`'id'` | `'en'`)
 * @returns Structured `ShortCircuitZeroVoltAdvisory` for the floating bottom-right pop-up
 */
export function detectShortCircuitZeroVoltState(
  nodes: readonly Node<CircuitElementData>[],
  edges: readonly Edge[],
  simulation: SimulationResult | null | undefined,
  worldMode: WorldMode,
  language: 'id' | 'en' = 'id'
): ShortCircuitZeroVoltAdvisory {
  try {
    if (worldMode !== 'lab') {
      return INACTIVE_ADVISORY;
    }

    if (!Array.isArray(nodes) || !Array.isArray(edges) || nodes.length === 0 || edges.length === 0) {
      return INACTIVE_ADVISORY;
    }

    // Step 1: Collect all node IDs that have at least one wire attached in O(E) time
    const wiredNodeIds = new Set<string>();
    for (let edgeIdx = 0; edgeIdx < edges.length; edgeIdx++) {
      const edge = edges[edgeIdx];
      if (!edge) continue;
      if (edge.source) wiredNodeIds.add(edge.source);
      if (edge.target) wiredNodeIds.add(edge.target);
    }

    // Step 2: Single O(N) pass to inspect switches and find any 0V / shorted Lab battery
    let hasOpenSwitch = false;
    let hasClosedSwitch = false;
    let candidateBatteryNode: Node<CircuitElementData> | null = null;
    let candidateReason: ZeroVoltTriggerReason = 'active-short-circuit';

    for (let nodeIdx = 0; nodeIdx < nodes.length; nodeIdx++) {
      const currentNode = nodes[nodeIdx];
      const nodeData = currentNode?.data;
      if (!currentNode || !nodeData || nodeData.worldMode === 'outside') {
        continue;
      }

      if (nodeData.type === 'switch' && wiredNodeIds.has(currentNode.id)) {
        if (nodeData.isOpen) {
          hasOpenSwitch = true;
        } else {
          hasClosedSwitch = true;
        }
      }

      const isBatteryComponent =
        nodeData.type === 'battery' ||
        nodeData.type === 'battery9v' ||
        nodeData.type === 'battery-holder';

      if (!isBatteryComponent || !wiredNodeIds.has(currentNode.id)) {
        continue;
      }

      // Ignore empty battery holders that have no cells inserted
      if (
        nodeData.type === 'battery-holder' &&
        (nodeData.hasBattery === false || nodeData.batteryCount === 0)
      ) {
        continue;
      }

      const currentCharge =
        typeof nodeData.currentCharge === 'number' ? nodeData.currentCharge : 100;
      const isNodeShorted =
        Boolean(nodeData.isShortCircuit) || Boolean(simulation?.isShortCircuit);
      const isBatteryDepletedZeroVolt =
        currentCharge <= 0.5 ||
        (typeof nodeData.calculatedVoltage === 'number' &&
          nodeData.calculatedVoltage <= 0.01 &&
          currentCharge < 99);

      if (isNodeShorted) {
        candidateBatteryNode = currentNode;
        candidateReason = 'active-short-circuit';
        break;
      }

      if (isBatteryDepletedZeroVolt && !candidateBatteryNode) {
        candidateBatteryNode = currentNode;
        candidateReason = 'depleted-zero-volt';
      }
    }

    if (!candidateBatteryNode) {
      return INACTIVE_ADVISORY;
    }

    // If the battery is only depleted (not actively shorted right now) and the user
    // already opened all switches without any closed switch, only show if a switch is closed
    // or if there are no switches blocking the loop
    if (
      candidateReason === 'depleted-zero-volt' &&
      hasOpenSwitch &&
      !hasClosedSwitch
    ) {
      return INACTIVE_ADVISORY;
    }

    const { nominalEmfVolts, internalResistanceOhms } =
      getBatteryInternalPhysicsParams(candidateBatteryNode.data);

    const safeInternalResistance = Math.max(0.05, internalResistanceOhms);
    const peakShortCurrentAmps = Number(
      (nominalEmfVolts / safeInternalResistance).toFixed(1)
    );
    const internalHeatWatts = Number(
      ((nominalEmfVolts * nominalEmfVolts) / safeInternalResistance).toFixed(1)
    );
    const batteryChargePercent = Math.max(
      0,
      Math.min(100, Math.round(candidateBatteryNode.data.currentCharge ?? 0))
    );

    const teaserPrompt =
      language === 'id'
        ? 'Baterai mu jadi 0V tuh, pengen tahu? Klik aku!'
        : 'Your battery dropped to 0V! Curious why? Click me!';

    return {
      isTriggered: true,
      batteryNodeId: candidateBatteryNode.id,
      reason: candidateReason,
      nominalEmfVolts,
      terminalVoltageVolts: 0,
      internalResistanceOhms: safeInternalResistance,
      peakShortCurrentAmps,
      internalHeatWatts,
      batteryChargePercent,
      teaserPrompt,
    };
  } catch (error) {
    console.warn('Failed to evaluate short-circuit 0V battery state:', error);
    return INACTIVE_ADVISORY;
  }
}
