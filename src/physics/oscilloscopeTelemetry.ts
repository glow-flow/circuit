import { Node } from 'reactflow';
import { CircuitElementData, SimulationResult } from '../types/circuit';
import { computeEffectiveBatteryVoltage } from './batterySoC';
import { getSolarPanelVoltage } from './solarPanel';

export type SignalPolarityState = 'idle' | 'supplying' | 'charging' | 'forward' | 'reverse';

export interface OscilloscopeSampleSnapshot {
  voltage: number;
  current: number;
  signedCurrent: number;
  power: number;
  polarity: SignalPolarityState;
}

const SOURCE_COMPONENT_TYPES = new Set([
  'battery',
  'battery9v',
  'battery-holder',
  'solar-panel',
  'solar_panel',
  'wind-turbine',
  'wind_turbine',
  'hydro-turbine',
  'hydro_turbine',
  'bess-substation',
  'bess_substation',
]);

function resolveSourceFallbackVoltage(data: CircuitElementData): number {
  switch (data.type) {
    case 'battery9v':
      return computeEffectiveBatteryVoltage(data.voltage ?? 9.0, data.currentCharge);
    case 'battery-holder': {
      const count = Math.max(1, data.batteryCount ?? 2);
      return computeEffectiveBatteryVoltage(data.voltage ?? count * 1.5, data.currentCharge);
    }
    case 'battery':
      return computeEffectiveBatteryVoltage(data.voltage ?? 1.5, data.currentCharge);
    case 'bess-substation':
    case 'bess_substation':
      return computeEffectiveBatteryVoltage(
        data.voltage ?? 12.8,
        data.socPercent ?? data.currentCharge
      );
    case 'solar-panel':
    case 'solar_panel':
      return data.voltage ?? getSolarPanelVoltage(data.sunlight ?? 100);
    case 'wind-turbine':
    case 'wind_turbine':
      return data.voltage ?? ((data.speed ?? 50) / 100) * 12.0;
    case 'hydro-turbine':
    case 'hydro_turbine':
      return data.voltage ?? 12.0;
    default:
      return data.voltage ?? 0;
  }
}

/**
 * Extracts physically consistent instantaneous oscilloscope telemetry for either
 * a single probed node or the entire active circuit (Global Total mode).
 *
 * In Global mode, sums supplying source currents instead of dividing total power
 * by max node voltage — preventing 240V SUTET transmission potentials from artificially
 * collapsing the computed lab circuit current.
 *
 * Time Complexity: O(N) where N is the number of canvas nodes.
 */
export function computeOscilloscopeSample(
  probedNodeId: string | null,
  nodes: ReadonlyArray<Node<CircuitElementData>>,
  simulation: Pick<
    SimulationResult,
    'nodeVoltages' | 'branchCurrents' | 'totalPowerDrawn' | 'reverseBiasedBranches'
  >
): OscilloscopeSampleSnapshot {
  try {
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const branchCurrents = simulation?.branchCurrents ?? {};
    const reverseBiasedSet = new Set(simulation?.reverseBiasedBranches ?? []);

    const probedNode = probedNodeId
      ? safeNodes.find((node) => node.id === probedNodeId)
      : undefined;

    if (probedNode) {
      const signedCurrent = Number.isFinite(branchCurrents[probedNode.id])
        ? branchCurrents[probedNode.id]
        : 0;
      const current = Math.abs(signedCurrent);
      const voltage = Math.abs(
        probedNode.data.calculatedVoltage ?? resolveSourceFallbackVoltage(probedNode.data)
      );
      const power = Math.max(
        0,
        Number.isFinite(probedNode.data.calculatedPower)
          ? (probedNode.data.calculatedPower as number)
          : voltage * current
      );

      let polarity: SignalPolarityState = 'idle';
      if (reverseBiasedSet.has(probedNode.id) || probedNode.data.isReverseBiased) {
        polarity = 'reverse';
      } else if (current > 1e-6) {
        if (SOURCE_COMPONENT_TYPES.has(probedNode.data.type)) {
          polarity = signedCurrent < 0 ? 'supplying' : 'charging';
        } else {
          polarity = signedCurrent >= 0 ? 'forward' : 'reverse';
        }
      }

      return {
        voltage,
        current,
        signedCurrent,
        power,
        polarity,
      };
    }

    // Global Circuit Total mode: compute active supply current & power-weighted bus voltage
    const power = Number.isFinite(simulation?.totalPowerDrawn)
      ? Math.max(0, simulation.totalPowerDrawn)
      : 0;

    let hasNegativeSupplier = false;
    for (let i = 0; i < safeNodes.length; i++) {
      const node = safeNodes[i];
      if (!node?.data || !SOURCE_COMPONENT_TYPES.has(node.data.type)) continue;
      if ((branchCurrents[node.id] ?? 0) < -1e-6) {
        hasNegativeSupplier = true;
        break;
      }
    }

    let totalSupplyCurrent = 0;
    let peakSupplySourceVoltage = 0;

    for (let i = 0; i < safeNodes.length; i++) {
      const node = safeNodes[i];
      if (!node?.data || !SOURCE_COMPONENT_TYPES.has(node.data.type)) continue;

      const rawCurrent = branchCurrents[node.id] ?? 0;
      const isActiveSupplier = hasNegativeSupplier
        ? rawCurrent < -1e-6
        : Math.abs(rawCurrent) > 1e-6;

      if (isActiveSupplier) {
        totalSupplyCurrent += Math.abs(rawCurrent);
        const srcVoltage = Math.abs(
          node.data.calculatedVoltage ?? resolveSourceFallbackVoltage(node.data)
        );
        if (srcVoltage > peakSupplySourceVoltage) {
          peakSupplySourceVoltage = srcVoltage;
        }
      }
    }

    let effectiveVoltage = peakSupplySourceVoltage;
    if (totalSupplyCurrent > 1e-6 && power > 0) {
      effectiveVoltage = power / totalSupplyCurrent;
    } else if (effectiveVoltage <= 0 && simulation?.nodeVoltages) {
      const finiteVoltages = Object.values(simulation.nodeVoltages).filter((v) =>
        Number.isFinite(v)
      );
      effectiveVoltage = finiteVoltages.length > 0 ? Math.max(0, ...finiteVoltages) : 0;
    }

    const current =
      totalSupplyCurrent > 1e-6
        ? totalSupplyCurrent
        : effectiveVoltage > 0
        ? power / effectiveVoltage
        : 0;

    return {
      voltage: effectiveVoltage,
      current,
      signedCurrent: current > 1e-6 ? -current : 0,
      power,
      polarity: current > 1e-6 ? 'supplying' : 'idle',
    };
  } catch {
    return {
      voltage: 0,
      current: 0,
      signedCurrent: 0,
      power: 0,
      polarity: 'idle',
    };
  }
}
