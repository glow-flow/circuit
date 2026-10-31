/**
 * Modified Nodal Analysis (MNA) Physics Solver.
 * 
 * Formulates and solves linear circuit equations using Kirchhoff's Current Law (KCL),
 * Kirchhoff's Voltage Law (KVL), and Ohm's Law.
 * 
 * Matrix formulation:
 * [ G   B ] [ v ]   [ i ]
 * [ C   D ] [ j ] = [ e ]
 * 
 * Where:
 * - G is the conductance matrix (passive elements: resistors, bulbs, switches)
 * - B and C describe voltage source terminal connections
 * - D contains voltage source series internal resistance (stabilizes short circuits)
 * - v is the node potential vector (relative to ground)
 * - j is the current through voltage sources
 * - i is the independent current source vector
 * - e is the independent voltage source vector
 * 
 * Time Complexity Analysis:
 * - Graph Net Clustering (Union-Find): O(P * α(P)) where P is terminal pin count.
 * - Matrix Assembly: O(C) where C is component count.
 * - Linear Solve (Gaussian Elimination with Partial Pivoting): O(M^3) where M = (Nets - 1) + VoltageSources.
 *   For educational circuits (M <= 30), solve time is < 0.2ms, well within 60 FPS animation budget.
 */

import { CircuitElementData, WireConnection, SimulationResult } from '../types/circuit';
import { canBulbFitSocket, canBulbFitPinSocket, getBulbSpec } from '../constants/bulbCatalog';
import { UnionFind } from './unionFind';
import { computeEffectiveBatteryVoltage } from './batterySoC';
import { getSolarPanelVoltage, SOLAR_PANEL_INTERNAL_RESISTANCE } from './solarPanel';

export const SHORT_CIRCUIT_CURRENT_THRESHOLD = 10.0; // Amperes threshold for short-circuit trip
const BATTERY_INTERNAL_RESISTANCE = 0.05; // 50mΩ internal resistance per cell to prevent singularity
const SWITCH_CLOSED_RESISTANCE = 0.001; // 1mΩ closed switch resistance
const SWITCH_OPEN_RESISTANCE = 1e9; // 1GΩ open switch resistance
const AMMETER_INTERNAL_RESISTANCE = 0.001; // 1mΩ ammeter resistance
const VOLTMETER_INTERNAL_RESISTANCE = 1e7; // 10MΩ voltmeter impedance

export interface CircuitGraphInput {
  components: CircuitElementData[];
  wires: WireConnection[];
  explicitGroundNetId?: string;
}

/**
 * Checks whether a component is a renewable generator equipped with an internal
 * Schottky blocking diode (prevents reverse current from flowing into the generator).
 * Time Complexity: O(1).
 */
export function isRenewableWithBlockingDiode(component: CircuitElementData): boolean {
  return (
    component.type === 'solar-panel' ||
    component.type === 'solar_panel' ||
    component.type === 'wind-turbine' ||
    component.type === 'wind_turbine'
  );
}

/**
 * Checks whether a transmission tower or Lab Distribution Panel has its MCB breaker ON
 * and is not tripped, allowing it to participate in the virtual transmission grid bus.
 * Time Complexity: O(1).
 */
export function isTransmissionNodeActive(component: CircuitElementData): boolean {
  return (
    (component.type === 'transmission-tower' || component.type === 'transmission_tower') &&
    component.isMcbOn !== false &&
    !component.isMcbTripped
  );
}

/**
 * Checks whether a bulb type is a unidirectional semiconductor LED diode
 * (conducts only in forward bias: Anode p1 potential > Cathode p2 potential).
 * Incandescent, Halogen, Edison filaments and CFL bridge ballasts are bidirectional.
 * Time Complexity: O(1).
 */
export function isUnidirectionalLedBulbType(bulbType: string | undefined): boolean {
  return bulbType === 'led_standard' || bulbType === 'led_rgb' || bulbType === 'led_green';
}

/**
 * Checks whether a socket component currently holds a unidirectional LED bulb.
 * Time Complexity: O(1).
 */
export function isSocketWithUnidirectionalLed(component: CircuitElementData): boolean {
  if (
    component.type !== 'socket' &&
    component.type !== 'pin-socket' &&
    component.type !== 'socket-pin'
  ) {
    return false;
  }
  if (!component.installedBulb) return false;
  const bulbType =
    typeof component.installedBulb === 'object'
      ? component.installedBulb.bulbType
      : component.installedBulb;
  return isUnidirectionalLedBulbType(bulbType);
}

/**
 * Determines whether a component currently acts as an active independent DC voltage source.
 * Supports both individual AA batteries (1.5V) and loaded Battery Holders (1.5V / 3.0V).
 * 
 * @param component - Circuit component data
 * @returns True if component supplies active EMF voltage
 */
export function isActiveVoltageSource(component: CircuitElementData): boolean {
  if (component.type === 'battery') {
    return (component.voltage ?? 1.5) >= 0;
  }
  if (component.type === 'battery9v') {
    return (component.voltage ?? 9.0) >= 0;
  }
  if (component.type === 'battery-holder') {
    const cellCount = component.batteryCount ?? (component.hasBattery ? 2 : 0);
    return Boolean(component.hasBattery && cellCount > 0);
  }
  if (component.type === 'solar-panel' || component.type === 'solar_panel') {
    return true;
  }
  if (component.type === 'wind-turbine' || component.type === 'wind_turbine') {
    return true;
  }
  return false;
}

/**
 * Computes the nominal open-circuit EMF voltage of a voltage source component,
 * taking into account State of Charge (SoC) and realistic voltage sag.
 * - Single AA Battery ('battery'): defaults to 1.5V nominal
 * - 9V Alkaline Battery ('battery9v'): defaults to 9.0V nominal
 * - Dual AA Battery Holder ('battery-holder'): 1.5V per series cell (2 cells = 3.0V nominal)
 * 
 * Voltage Sag Curve:
 * - currentCharge >= 20%: 100% nominal EMF
 * - 0% < currentCharge < 20%: Linear sag V_nominal * (charge / 20)
 * - currentCharge <= 0%: 0.0V (dead / discharged cell)
 * 
 * @param component - Circuit component data
 * @returns Effective EMF voltage in Volts
 */
export function getVoltageSourceNominalVoltage(component: CircuitElementData): number {
  let baseVoltage = 0;
  if (component.type === 'battery') {
    baseVoltage = component.voltage ?? 1.5;
  } else if (component.type === 'battery9v') {
    baseVoltage = component.voltage ?? 9.0;
  } else if (component.type === 'battery-holder') {
    if (!component.hasBattery) return 0;
    const cellCount = component.batteryCount ?? 2;
    baseVoltage = component.voltage ?? cellCount * 1.5;
  } else if (component.type === 'solar-panel' || component.type === 'solar_panel') {
    return component.voltage ?? getSolarPanelVoltage(component.sunlight ?? 100);
  } else if (component.type === 'wind-turbine' || component.type === 'wind_turbine') {
    const turbineSpeed = component.speed ?? 50;
    return component.voltage ?? (turbineSpeed / 100) * 12.0;
  } else {
    return 0;
  }

  return computeEffectiveBatteryVoltage(baseVoltage, component.currentCharge);
}

/**
 * Solves a system of linear equations A * x = b using Gaussian elimination with partial pivoting.
 * 
 * @param coefficientMatrix - Square matrix of size N x N
 * @param constantVector - Right-hand side vector of size N
 * @returns Solution vector of size N, or zeros for singular/unconstrained dimensions
 */
export function solveLinearSystem(
  coefficientMatrix: number[][],
  constantVector: number[]
): number[] {
  const dimensionSize = coefficientMatrix.length;
  if (dimensionSize === 0) {
    return [];
  }

  // Deep clone matrix and vector to ensure purity and avoid side-effects
  const augmentedMatrix: number[][] = coefficientMatrix.map((row) => [...row]);
  const rightHandSide: number[] = [...constantVector];

  // Forward elimination with partial pivoting
  for (let pivotIndex = 0; pivotIndex < dimensionSize; pivotIndex++) {
    let maximumRowIndex = pivotIndex;
    let maximumPivotValue = Math.abs(augmentedMatrix[pivotIndex][pivotIndex]);

    for (let candidateRow = pivotIndex + 1; candidateRow < dimensionSize; candidateRow++) {
      const candidateValue = Math.abs(augmentedMatrix[candidateRow][pivotIndex]);
      if (candidateValue > maximumPivotValue) {
        maximumPivotValue = candidateValue;
        maximumRowIndex = candidateRow;
      }
    }

    // If the pivot is practically zero, this node is floating or unconstrained
    if (maximumPivotValue < 1e-12) {
      continue;
    }

    // Swap current row with maximum pivot row
    if (maximumRowIndex !== pivotIndex) {
      const temporaryRow = augmentedMatrix[pivotIndex];
      augmentedMatrix[pivotIndex] = augmentedMatrix[maximumRowIndex];
      augmentedMatrix[maximumRowIndex] = temporaryRow;

      const temporaryRhs = rightHandSide[pivotIndex];
      rightHandSide[pivotIndex] = rightHandSide[maximumRowIndex];
      rightHandSide[maximumRowIndex] = temporaryRhs;
    }

    // Eliminate below pivot
    for (let targetRow = pivotIndex + 1; targetRow < dimensionSize; targetRow++) {
      const eliminationFactor =
        augmentedMatrix[targetRow][pivotIndex] / augmentedMatrix[pivotIndex][pivotIndex];

      for (let targetColumn = pivotIndex; targetColumn < dimensionSize; targetColumn++) {
        augmentedMatrix[targetRow][targetColumn] -=
          eliminationFactor * augmentedMatrix[pivotIndex][targetColumn];
      }
      rightHandSide[targetRow] -= eliminationFactor * rightHandSide[pivotIndex];
    }
  }

  // Back substitution
  const solutionVector: number[] = new Array(dimensionSize).fill(0);
  for (let rowIndex = dimensionSize - 1; rowIndex >= 0; rowIndex--) {
    const pivotElement = augmentedMatrix[rowIndex][rowIndex];
    if (Math.abs(pivotElement) < 1e-12) {
      solutionVector[rowIndex] = 0; // Floating node assumption
      continue;
    }

    let runningSum = rightHandSide[rowIndex];
    for (let columnIndex = rowIndex + 1; columnIndex < dimensionSize; columnIndex++) {
      runningSum -= augmentedMatrix[rowIndex][columnIndex] * solutionVector[columnIndex];
    }
    solutionVector[rowIndex] = runningSum / pivotElement;
  }

  return solutionVector;
}

/**
 * Executes Modified Nodal Analysis on the provided electrical components and wire connections.
 * 
 * @param circuitInput - The components and wire connections currently placed in the circuit.
 * @returns SimulationResult containing node voltages, branch currents, power, and short circuit flags.
 */
export function solveCircuitMNA(circuitInput: CircuitGraphInput): SimulationResult {
  const { components, wires, explicitGroundNetId } = circuitInput;

  // Validation: Check for empty input
  if (!components || components.length === 0) {
    return {
      nodeVoltages: {},
      branchCurrents: {},
      isShortCircuit: false,
      shortCircuitBranches: [],
      totalPowerDrawn: 0,
      timestamp: Date.now(),
    };
  }

  try {
    // 1. Build Disjoint Set (Union-Find) of connected pins to find electrical nets
    const netUnionFind = new UnionFind();

    // Register all component pins
    for (const component of components) {
      const pinIdentifiers = getComponentPinIdentifiers(component);
      for (const pinId of pinIdentifiers) {
        netUnionFind.makeSet(pinId);
      }
      // Waypoint: transparent zero-impedance bridge uniting p1 and p2 into the exact same electrical net
      if (component.type === 'waypoint') {
        netUnionFind.union(`${component.id}:p1`, `${component.id}:p2`);
      }
    }

    // Virtual Transmission Grid: Unify all ACTIVE Transmission Towers / Lab Distribution Panels
    // (where MCB breaker is ON and not tripped) across the canvas into a lossless common bus.
    const activeTransmissionTowers = components.filter((c) => isTransmissionNodeActive(c));
    if (activeTransmissionTowers.length > 1) {
      const primaryTower = activeTransmissionTowers[0];
      for (let i = 1; i < activeTransmissionTowers.length; i++) {
        const peerTower = activeTransmissionTowers[i];
        netUnionFind.union(`${primaryTower.id}:pos`, `${peerTower.id}:pos`);
        netUnionFind.union(`${primaryTower.id}:neg`, `${peerTower.id}:neg`);
      }
    }

    // Merge pins connected by wires
    for (const wire of wires) {
      const sourcePinKey = `${wire.source}:${wire.sourceHandle}`;
      const targetPinKey = `${wire.target}:${wire.targetHandle}`;
      netUnionFind.union(sourcePinKey, targetPinKey);
    }

    // Map each pin to its root representative net
    const pinToNetMap = new Map<string, string>();
    for (const component of components) {
      const pinIdentifiers = getComponentPinIdentifiers(component);
      for (const pinId of pinIdentifiers) {
        pinToNetMap.set(pinId, netUnionFind.find(pinId));
      }
    }

    // Determine optional Step-Down DC voltage ceiling from any active Lab Distribution Panel on the grid
    const gridPositiveNet =
      activeTransmissionTowers.length > 0
        ? pinToNetMap.get(`${activeTransmissionTowers[0].id}:pos`)
        : undefined;
    const gridNegativeNet =
      activeTransmissionTowers.length > 0
        ? pinToNetMap.get(`${activeTransmissionTowers[0].id}:neg`)
        : undefined;

    const configuredStepDownVoltages = activeTransmissionTowers
      .map((t) => t.stepDownVoltage)
      .filter((v): v is number => typeof v === 'number' && v > 0);
    const gridStepDownCeiling =
      configuredStepDownVoltages.length > 0
        ? Math.min(...configuredStepDownVoltages)
        : null;

    const getRegulatedSourceVoltage = (sourceComp: CircuitElementData): number => {
      const rawVoltage = getVoltageSourceNominalVoltage(sourceComp);
      if (
        gridStepDownCeiling !== null &&
        isRenewableWithBlockingDiode(sourceComp) &&
        gridPositiveNet !== undefined &&
        gridNegativeNet !== undefined
      ) {
        const srcPosNet = pinToNetMap.get(`${sourceComp.id}:pos`);
        const srcNegNet = pinToNetMap.get(`${sourceComp.id}:neg`);
        if (srcPosNet === gridPositiveNet || srcNegNet === gridNegativeNet) {
          return Math.min(rawVoltage, gridStepDownCeiling);
        }
      }
      return rawVoltage;
    };

    // Collect all unique electrical net identifiers
    const uniqueNetSet = new Set<string>(pinToNetMap.values());
    const uniqueNets = Array.from(uniqueNetSet);

    if (uniqueNets.length <= 1) {
      return {
        nodeVoltages: {},
        branchCurrents: {},
        isShortCircuit: false,
        shortCircuitBranches: [],
        blockedGeneratorIds: [],
        reverseBiasedBranches: [],
        totalPowerDrawn: 0,
        timestamp: Date.now(),
      };
    }

    // 2. Identify the Reference (Ground) Net (0 Volts)
    let selectedGroundNet = explicitGroundNetId;

    if (!selectedGroundNet) {
      const groundComponent = components.find((c) => c.type === 'ground');
      if (groundComponent) {
        selectedGroundNet = pinToNetMap.get(`${groundComponent.id}:gnd`);
      }
    }

    if (!selectedGroundNet) {
      // Fallback: pick the negative terminal of the first active voltage source
      const firstActiveSource = components.find((c) => isActiveVoltageSource(c));
      if (firstActiveSource) {
        selectedGroundNet = pinToNetMap.get(`${firstActiveSource.id}:neg`);
      }
    }

    if (!selectedGroundNet) {
      selectedGroundNet = uniqueNets[0];
    }

    // Non-ground nets get mapped to matrix column indices
    const nonGroundNets = uniqueNets.filter((net) => net !== selectedGroundNet);
    const netToIndexMap = new Map<string, number>();
    nonGroundNets.forEach((net, index) => {
      netToIndexMap.set(net, index);
    });

    const nonGroundNetCount = nonGroundNets.length;

    // 3. Identify Independent Voltage Sources & Iteratively Enforce Semiconductor Diode Constraints:
    //    - Blocking Diode (Schottky) on Solar Panels & Wind Turbines (prevents reverse current I > 0)
    //    - Unidirectional LED Polarity on sockets holding LED bulbs (conducts only when V_p1 >= V_p2)
    const allVoltageSourceComponents = components.filter((c) => isActiveVoltageSource(c));
    const blockedGeneratorSet = new Set<string>();
    const reverseBiasedSocketSet = new Set<string>();

    let activeVoltageSources = allVoltageSourceComponents;
    let solution: number[] = [];
    const nodeVoltageMap: Record<string, number> = {};

    for (let pass = 0; pass < 3; pass++) {
      activeVoltageSources = allVoltageSourceComponents.filter(
        (c) => !blockedGeneratorSet.has(c.id)
      );
      const voltageSourceCount = activeVoltageSources.length;
      const matrixDimension = nonGroundNetCount + voltageSourceCount;

      if (matrixDimension === 0) {
        return {
          nodeVoltages: {},
          branchCurrents: {},
          isShortCircuit: false,
          shortCircuitBranches: [],
          blockedGeneratorIds: Array.from(blockedGeneratorSet),
          reverseBiasedBranches: Array.from(reverseBiasedSocketSet),
          totalPowerDrawn: 0,
          timestamp: Date.now(),
        };
      }

      const coefficientMatrix: number[][] = Array.from({ length: matrixDimension }, () =>
        new Array(matrixDimension).fill(0)
      );
      const constantVector: number[] = new Array(matrixDimension).fill(0);

      // 4. Populate Conductance Submatrix G (Passive Components Only)
      for (const component of components) {
        if (
          component.type === 'battery' ||
          component.type === 'battery9v' ||
          component.type === 'battery-holder' ||
          component.type === 'solar-panel' ||
          component.type === 'solar_panel' ||
          component.type === 'wind-turbine' ||
          component.type === 'wind_turbine' ||
          component.type === 'transmission-tower' ||
          component.type === 'transmission_tower' ||
          component.type === 'ground' ||
          component.type === 'waypoint'
        ) {
          continue;
        }

        // Reverse-biased LED sockets act as open-circuit diodes (0 conductance)
        if (reverseBiasedSocketSet.has(component.id)) {
          continue;
        }

        const pinKeys = getComponentPinIdentifiers(component);
        if (pinKeys.length < 2) continue;

        const netPositive = pinToNetMap.get(pinKeys[0])!;
        const netNegative = pinToNetMap.get(pinKeys[1])!;

        if (netPositive === netNegative) continue;

        const conductanceValue = calculateComponentConductance(component);
        if (conductanceValue <= 0) continue;

        const positiveIndex = netToIndexMap.get(netPositive);
        const negativeIndex = netToIndexMap.get(netNegative);

        if (positiveIndex !== undefined) {
          coefficientMatrix[positiveIndex][positiveIndex] += conductanceValue;
        }
        if (negativeIndex !== undefined) {
          coefficientMatrix[negativeIndex][negativeIndex] += conductanceValue;
        }
        if (positiveIndex !== undefined && negativeIndex !== undefined) {
          coefficientMatrix[positiveIndex][negativeIndex] -= conductanceValue;
          coefficientMatrix[negativeIndex][positiveIndex] -= conductanceValue;
        }
      }

      // 5. Populate B, C, D Matrices and Vector e (Active Voltage Sources)
      activeVoltageSources.forEach((sourceComp, sourceIndex) => {
        const voltageSourceRowIndex = nonGroundNetCount + sourceIndex;
        const positiveNet = pinToNetMap.get(`${sourceComp.id}:pos`)!;
        const negativeNet = pinToNetMap.get(`${sourceComp.id}:neg`)!;

        const positiveNetIndex = netToIndexMap.get(positiveNet);
        const negativeNetIndex = netToIndexMap.get(negativeNet);

        if (positiveNetIndex !== undefined) {
          coefficientMatrix[positiveNetIndex][voltageSourceRowIndex] += 1;
          coefficientMatrix[voltageSourceRowIndex][positiveNetIndex] += 1;
        }
        if (negativeNetIndex !== undefined) {
          coefficientMatrix[negativeNetIndex][voltageSourceRowIndex] -= 1;
          coefficientMatrix[voltageSourceRowIndex][negativeNetIndex] -= 1;
        }

        let seriesInternalResistance = BATTERY_INTERNAL_RESISTANCE;
        if (sourceComp.type === 'battery9v') {
          seriesInternalResistance = Math.max(0.01, sourceComp.internalResistance ?? 2.0);
        } else if (sourceComp.type === 'battery-holder') {
          const cellCount = sourceComp.batteryCount ?? 2;
          seriesInternalResistance =
            sourceComp.internalResistance ?? BATTERY_INTERNAL_RESISTANCE * Math.max(1, cellCount);
        } else if (sourceComp.type === 'solar-panel' || sourceComp.type === 'solar_panel') {
          seriesInternalResistance = Math.max(
            0.01,
            sourceComp.internalResistance ?? SOLAR_PANEL_INTERNAL_RESISTANCE
          );
        } else if (sourceComp.type === 'wind-turbine' || sourceComp.type === 'wind_turbine') {
          seriesInternalResistance = Math.max(0.01, sourceComp.internalResistance ?? 0.1);
        } else if (sourceComp.internalResistance !== undefined) {
          seriesInternalResistance = Math.max(0.01, sourceComp.internalResistance);
        }

        coefficientMatrix[voltageSourceRowIndex][voltageSourceRowIndex] =
          -seriesInternalResistance;
        constantVector[voltageSourceRowIndex] = getRegulatedSourceVoltage(sourceComp);
      });

      // 6. Solve the Linear System
      solution = solveLinearSystem(coefficientMatrix, constantVector);

      // 7. Map solution to electrical net voltages
      nodeVoltageMap[selectedGroundNet] = 0.0;
      nonGroundNets.forEach((net, index) => {
        nodeVoltageMap[net] = solution[index] ?? 0;
      });

      // Check semiconductor diode states (Blocking Diodes on Solar/Wind & LED Polarity)
      let stateChanged = false;

      activeVoltageSources.forEach((sourceComp, sourceIndex) => {
        if (!isRenewableWithBlockingDiode(sourceComp)) return;
        const sourceCurrentIndex = nonGroundNetCount + sourceIndex;
        const solvedCurrent = solution[sourceCurrentIndex] ?? 0;
        // In MNA convention, solvedCurrent > 1e-5 means external voltage is forcing reverse current into (+)
        if (solvedCurrent > 1e-5) {
          blockedGeneratorSet.add(sourceComp.id);
          stateChanged = true;
        }
      });

      for (const component of components) {
        if (!isSocketWithUnidirectionalLed(component)) continue;
        if (reverseBiasedSocketSet.has(component.id)) continue;

        const pinKeys = getComponentPinIdentifiers(component);
        if (pinKeys.length < 2) continue;

        const netAnode = pinToNetMap.get(pinKeys[0])!;
        const netCathode = pinToNetMap.get(pinKeys[1])!;
        const vAnode = nodeVoltageMap[netAnode] ?? 0;
        const vCathode = nodeVoltageMap[netCathode] ?? 0;

        // If Anode (p1) is at a lower potential than Cathode (p2), the LED diode is reverse-biased
        if (vAnode - vCathode < -1e-4) {
          reverseBiasedSocketSet.add(component.id);
          stateChanged = true;
        }
      }

      if (!stateChanged) {
        break;
      }
    }

    // 8. Compute individual branch currents and powers
    const branchCurrentMap: Record<string, number> = {};
    const shortCircuitBranches: string[] = [];
    let isOverallShortCircuit = false;
    let totalPowerDrawn = 0;

    // Default 0 current for unloaded battery holders, detached bulbs, and diode-blocked generators
    for (const component of components) {
      if (
        (component.type === 'battery-holder' && !isActiveVoltageSource(component)) ||
        component.type === 'bulb' ||
        blockedGeneratorSet.has(component.id)
      ) {
        branchCurrentMap[component.id] = 0;
      }
    }

    // Active voltage source currents directly from solution vector
    activeVoltageSources.forEach((sourceComp, sourceIndex) => {
      const sourceCurrentIndex = nonGroundNetCount + sourceIndex;
      const sourceCurrent = solution[sourceCurrentIndex] ?? 0;
      const absoluteCurrent = Math.abs(sourceCurrent);

      branchCurrentMap[sourceComp.id] = sourceCurrent;

      if (absoluteCurrent > SHORT_CIRCUIT_CURRENT_THRESHOLD) {
        isOverallShortCircuit = true;
        shortCircuitBranches.push(sourceComp.id);
      }

      const nominalVoltage = getRegulatedSourceVoltage(sourceComp);
      totalPowerDrawn += nominalVoltage * absoluteCurrent;
    });

    // Passive component currents and voltages
    for (const component of components) {
      if (
        component.type === 'battery' ||
        component.type === 'battery9v' ||
        component.type === 'battery-holder' ||
        component.type === 'solar-panel' ||
        component.type === 'solar_panel' ||
        component.type === 'wind-turbine' ||
        component.type === 'wind_turbine' ||
        component.type === 'transmission-tower' ||
        component.type === 'transmission_tower' ||
        component.type === 'ground' ||
        component.type === 'waypoint'
      ) {
        continue;
      }

      const pinKeys = getComponentPinIdentifiers(component);
      if (pinKeys.length < 2) continue;

      const netPositive = pinToNetMap.get(pinKeys[0])!;
      const netNegative = pinToNetMap.get(pinKeys[1])!;

      const voltageA = nodeVoltageMap[netPositive] ?? 0;
      const voltageB = nodeVoltageMap[netNegative] ?? 0;
      const voltageDrop = voltageA - voltageB;

      const resistance = reverseBiasedSocketSet.has(component.id)
        ? 1e9
        : getComponentEffectiveResistance(component);
      const branchCurrent = resistance > 0 && resistance < 1e8 ? voltageDrop / resistance : 0;
      branchCurrentMap[component.id] = branchCurrent;

      // If socket has installed bulb, propagate current to the bulb's id as well
      if (
        (component.type === 'socket' ||
          component.type === 'pin-socket' ||
          component.type === 'socket-pin') &&
        component.installedBulb
      ) {
        const installedBulbId =
          typeof component.installedBulb === 'object'
            ? component.installedBulb.id
            : component.bulbId;
        if (installedBulbId) {
          branchCurrentMap[installedBulbId] = branchCurrent;
        }
      }

      if (Math.abs(branchCurrent) > SHORT_CIRCUIT_CURRENT_THRESHOLD) {
        isOverallShortCircuit = true;
        shortCircuitBranches.push(component.id);
      }
    }

    // 9. Propagate branch currents through Waypoint and active Transmission Tower nodes
    //    so wires connected to waypoints and transmission towers/panels glow and report live current.
    const componentTypeMap = new Map<string, string>();
    for (const component of components) {
      componentTypeMap.set(component.id, component.type);
    }

    for (const component of components) {
      const isWaypoint = component.type === 'waypoint';
      const isTower =
        component.type === 'transmission-tower' || component.type === 'transmission_tower';
      if (!isWaypoint && !isTower) continue;

      if (isTower && (!isTransmissionNodeActive(component) || activeTransmissionTowers.length < 2)) {
        branchCurrentMap[component.id] = 0;
        continue;
      }

      // BFS along connected wires to find the local non-waypoint endpoint's current
      const visitedIds = new Set<string>([component.id]);
      const queue: string[] = [component.id];
      let resolvedCurrent = 0;

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        for (const wire of wires) {
          const neighborId =
            wire.source === currentId
              ? wire.target
              : wire.target === currentId
              ? wire.source
              : null;

          if (!neighborId || visitedIds.has(neighborId)) continue;
          visitedIds.add(neighborId);

          const neighborType = componentTypeMap.get(neighborId);
          if (
            neighborType &&
            neighborType !== 'waypoint' &&
            neighborType !== 'ground' &&
            neighborType !== 'transmission-tower' &&
            neighborType !== 'transmission_tower'
          ) {
            const candidateCurrent = branchCurrentMap[neighborId] ?? 0;
            if (Math.abs(candidateCurrent) > Math.abs(resolvedCurrent)) {
              resolvedCurrent = candidateCurrent;
            }
          } else if (neighborType === 'waypoint') {
            queue.push(neighborId);
          }
        }
      }

      branchCurrentMap[component.id] = resolvedCurrent;
    }

    return {
      nodeVoltages: nodeVoltageMap,
      branchCurrents: branchCurrentMap,
      isShortCircuit: isOverallShortCircuit,
      shortCircuitBranches,
      blockedGeneratorIds: Array.from(blockedGeneratorSet),
      reverseBiasedBranches: Array.from(reverseBiasedSocketSet),
      totalPowerDrawn,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      nodeVoltages: {},
      branchCurrents: {},
      isShortCircuit: false,
      shortCircuitBranches: [],
      totalPowerDrawn: 0,
      errorMessage: error instanceof Error ? error.message : 'Unknown circuit analysis error',
      timestamp: Date.now(),
    };
  }
}

/**
 * Returns the standardized pin keys for a given component type.
 * @param component - Electrical component instance
 * @returns Array of pin keys e.g. ["cmp1:pos", "cmp1:neg"]
 */
export function getComponentPinIdentifiers(component: CircuitElementData): string[] {
  switch (component.type) {
    case 'battery':
    case 'battery9v':
    case 'battery-holder':
    case 'solar-panel':
    case 'solar_panel':
    case 'transmission-tower':
    case 'transmission_tower':
    case 'wind-turbine':
    case 'wind_turbine':
      return [`${component.id}:pos`, `${component.id}:neg`];
    case 'resistor':
    case 'switch':
    case 'voltmeter':
    case 'ammeter':
    case 'waypoint':
    case 'socket':
    case 'pin-socket':
    case 'socket-pin':
      return [`${component.id}:p1`, `${component.id}:p2`];
    case 'bulb': {
      // Standalone bulbs (screw-base, halogen, led_green) have no direct wire handles (pure inventory items)
      return [];
    }
    case 'ground':
      return [`${component.id}:gnd`];
    default:
      return [];
  }
}

/**
 * Calculates effective conductance (g = 1/R) for passive elements.
 * Returns 0 for infinite resistance / open circuit.
 * @param component - Electrical component
 * @returns Conductance in Siemens (Mho)
 */
function calculateComponentConductance(component: CircuitElementData): number {
  const resistance = getComponentEffectiveResistance(component);
  if (resistance <= 0 || !Number.isFinite(resistance) || resistance >= 1e8) {
    return 0;
  }
  return 1 / resistance;
}

/**
 * Calculates effective resistance for bulb sockets (E27 screw socket or ceramic pin socket).
 * Follows DRY principles and O(1) specification lookups.
 *
 * @param component - Electrical component (socket or pin-socket)
 * @param isPinSocket - Whether the component is a ceramic pin socket
 * @returns Effective resistance in Ohms (or 1e9 for open circuit)
 */
function calculateSocketEffectiveResistance(
  component: CircuitElementData,
  isPinSocket: boolean
): number {
  if (!component.installedBulb) {
    return 1e9; // Open circuit: empty socket does not conduct
  }
  const bulbData = component.installedBulb;
  const bulbType = typeof bulbData === 'object' ? bulbData.bulbType : bulbData;

  const isCompatible = isPinSocket
    ? canBulbFitPinSocket(bulbType) || bulbType === 'halogen'
    : canBulbFitSocket(bulbType);

  if (!isCompatible) {
    return 1e9; // Incompatible bulb base = open circuit
  }

  const isBlown =
    typeof bulbData === 'object'
      ? Boolean(bulbData.isBlown)
      : Boolean(component.isBlown);
  if (isBlown) {
    return 1e9; // Blown filament = open circuit
  }

  const fallbackResistance = getBulbSpec(bulbType).resistance;
  const customResistance =
    typeof bulbData === 'object' ? bulbData.resistance : component.resistance;
  return Math.max(0.1, customResistance ?? fallbackResistance);
}

/**
 * Retrieves the effective resistance of a component in Ohms.
 * - Sockets without installed bulb act as Open Circuit (Infinity / 1GΩ).
 * - Sockets with installed bulb take the resistance of that bulb.
 * - Standalone screw bulbs and standalone halogen have infinite resistance (1e9).
 * - Standalone indicator LED (led_green) conducts directly.
 * 
 * @param component - Electrical component
 * @returns Resistance in Ohms
 */
export function getComponentEffectiveResistance(component: CircuitElementData): number {
  switch (component.type) {
    case 'resistor':
      return Math.max(0.1, component.resistance ?? 100);
    case 'bulb': {
      // Standalone bulbs (screw-base, halogen, led_green) cannot conduct current without a socket (1e9)
      return 1e9;
    }
    case 'socket':
      return calculateSocketEffectiveResistance(component, false);
    case 'pin-socket':
    case 'socket-pin':
      return calculateSocketEffectiveResistance(component, true);
    case 'switch':
      return component.isOpen ? SWITCH_OPEN_RESISTANCE : SWITCH_CLOSED_RESISTANCE;
    case 'ammeter':
      return AMMETER_INTERNAL_RESISTANCE;
    case 'voltmeter':
      return VOLTMETER_INTERNAL_RESISTANCE;
    default:
      return 1e6;
  }
}
