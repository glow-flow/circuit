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
import { UnionFind } from './unionFind';

export const SHORT_CIRCUIT_CURRENT_THRESHOLD = 10.0; // Amperes threshold for short-circuit trip
const BATTERY_INTERNAL_RESISTANCE = 0.05; // 50mΩ internal resistance to prevent infinite current singularity
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
    // Locate the row with the largest pivot in the current column
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

    // Collect all unique electrical net identifiers
    const uniqueNetSet = new Set<string>(pinToNetMap.values());
    const uniqueNets = Array.from(uniqueNetSet);

    if (uniqueNets.length <= 1) {
      // No complete circuit or only one net
      return {
        nodeVoltages: {},
        branchCurrents: {},
        isShortCircuit: false,
        shortCircuitBranches: [],
        totalPowerDrawn: 0,
        timestamp: Date.now(),
      };
    }

    // 2. Identify the Reference (Ground) Net (0 Volts)
    let selectedGroundNet = explicitGroundNetId;

    if (!selectedGroundNet) {
      // Check if a dedicated GroundNode exists
      const groundComponent = components.find((c) => c.type === 'ground');
      if (groundComponent) {
        selectedGroundNet = pinToNetMap.get(`${groundComponent.id}:gnd`);
      }
    }

    if (!selectedGroundNet) {
      // Fallback: pick the negative terminal of the first active battery
      const firstBattery = components.find((c) => c.type === 'battery');
      if (firstBattery) {
        selectedGroundNet = pinToNetMap.get(`${firstBattery.id}:neg`);
      }
    }

    if (!selectedGroundNet) {
      // Ultimate fallback: pick the first available net
      selectedGroundNet = uniqueNets[0];
    }

    // Non-ground nets get mapped to matrix column indices
    const nonGroundNets = uniqueNets.filter((net) => net !== selectedGroundNet);
    const netToIndexMap = new Map<string, number>();
    nonGroundNets.forEach((net, index) => {
      netToIndexMap.set(net, index);
    });

    const nonGroundNetCount = nonGroundNets.length;

    // 3. Identify Independent Voltage Sources (Batteries)
    const voltageSourceComponents = components.filter((c) => c.type === 'battery');
    const voltageSourceCount = voltageSourceComponents.length;

    // Total MNA matrix size = (Non-ground nets) + (Voltage sources)
    const matrixDimension = nonGroundNetCount + voltageSourceCount;

    if (matrixDimension === 0) {
      return {
        nodeVoltages: {},
        branchCurrents: {},
        isShortCircuit: false,
        shortCircuitBranches: [],
        totalPowerDrawn: 0,
        timestamp: Date.now(),
      };
    }

    // Initialize Coefficient Matrix and RHS Vector
    const coefficientMatrix: number[][] = Array.from({ length: matrixDimension }, () =>
      new Array(matrixDimension).fill(0)
    );
    const constantVector: number[] = new Array(matrixDimension).fill(0);

    // 4. Populate Conductance Submatrix G (Passive Components)
    for (const component of components) {
      const pinKeys = getComponentPinIdentifiers(component);
      if (pinKeys.length < 2) continue;

      const netPositive = pinToNetMap.get(pinKeys[0])!;
      const netNegative = pinToNetMap.get(pinKeys[1])!;

      // Skip internal stamping if both terminals are already on the same net (shorted terminal)
      if (netPositive === netNegative) continue;

      const conductanceValue = calculateComponentConductance(component);
      if (conductanceValue <= 0) continue;

      const positiveIndex = netToIndexMap.get(netPositive);
      const negativeIndex = netToIndexMap.get(netNegative);

      // Stamp G matrix
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

    // 5. Populate B, C, D Matrices and Vector e (Voltage Sources)
    voltageSourceComponents.forEach((battery, batteryIndex) => {
      const voltageSourceRowIndex = nonGroundNetCount + batteryIndex;
      const positiveNet = pinToNetMap.get(`${battery.id}:pos`)!;
      const negativeNet = pinToNetMap.get(`${battery.id}:neg`)!;

      const positiveNetIndex = netToIndexMap.get(positiveNet);
      const negativeNetIndex = netToIndexMap.get(negativeNet);

      // B matrix: KCL contribution of battery current
      // C matrix: KVL relationship V_pos - V_neg = V_src
      if (positiveNetIndex !== undefined) {
        coefficientMatrix[positiveNetIndex][voltageSourceRowIndex] += 1;
        coefficientMatrix[voltageSourceRowIndex][positiveNetIndex] += 1;
      }
      if (negativeNetIndex !== undefined) {
        coefficientMatrix[negativeNetIndex][voltageSourceRowIndex] -= 1;
        coefficientMatrix[voltageSourceRowIndex][negativeNetIndex] -= 1;
      }

      // D matrix: Series internal resistance of battery to guarantee well-conditioned matrix
      // V_pos - V_neg - R_internal * I = V_battery
      coefficientMatrix[voltageSourceRowIndex][voltageSourceRowIndex] = -BATTERY_INTERNAL_RESISTANCE;

      // Vector e: Nominal DC battery voltage
      constantVector[voltageSourceRowIndex] = battery.voltage ?? 9.0;
    });

    // 6. Solve the Linear System
    const solution = solveLinearSystem(coefficientMatrix, constantVector);

    // 7. Map solution to electrical net voltages and branch currents
    const nodeVoltageMap: Record<string, number> = {};
    nodeVoltageMap[selectedGroundNet] = 0.0;

    nonGroundNets.forEach((net, index) => {
      nodeVoltageMap[net] = solution[index] ?? 0;
    });

    // 8. Compute individual branch currents and powers
    const branchCurrentMap: Record<string, number> = {};
    const shortCircuitBranches: string[] = [];
    let isOverallShortCircuit = false;
    let totalPowerDrawn = 0;

    // Voltage source currents directly from solution vector
    voltageSourceComponents.forEach((battery, batteryIndex) => {
      const sourceCurrentIndex = nonGroundNetCount + batteryIndex;
      const batteryCurrent = solution[sourceCurrentIndex] ?? 0;
      const absoluteCurrent = Math.abs(batteryCurrent);

      branchCurrentMap[battery.id] = batteryCurrent;

      if (absoluteCurrent > SHORT_CIRCUIT_CURRENT_THRESHOLD) {
        isOverallShortCircuit = true;
        shortCircuitBranches.push(battery.id);
      }

      totalPowerDrawn += (battery.voltage ?? 9.0) * absoluteCurrent;
    });

    // Passive component currents and voltages
    for (const component of components) {
      if (component.type === 'battery' || component.type === 'ground' || component.type === 'waypoint') continue;

      const pinKeys = getComponentPinIdentifiers(component);
      if (pinKeys.length < 2) continue;

      const netPositive = pinToNetMap.get(pinKeys[0])!;
      const netNegative = pinToNetMap.get(pinKeys[1])!;

      const voltageA = nodeVoltageMap[netPositive] ?? 0;
      const voltageB = nodeVoltageMap[netNegative] ?? 0;
      const voltageDrop = voltageA - voltageB;

      const resistance = getComponentEffectiveResistance(component);
      const branchCurrent = resistance > 0 ? voltageDrop / resistance : 0;
      branchCurrentMap[component.id] = branchCurrent;

      if (Math.abs(branchCurrent) > SHORT_CIRCUIT_CURRENT_THRESHOLD) {
        isOverallShortCircuit = true;
        shortCircuitBranches.push(component.id);
      }
    }

    return {
      nodeVoltages: nodeVoltageMap,
      branchCurrents: branchCurrentMap,
      isShortCircuit: isOverallShortCircuit,
      shortCircuitBranches,
      totalPowerDrawn,
      timestamp: Date.now(),
    };
  } catch (error) {
    // Robust error recovery: Return safe fallback state instead of crashing
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
      return [`${component.id}:pos`, `${component.id}:neg`];
    case 'resistor':
    case 'bulb':
    case 'switch':
    case 'voltmeter':
    case 'ammeter':
    case 'waypoint':
      return [`${component.id}:p1`, `${component.id}:p2`];
    case 'ground':
      return [`${component.id}:gnd`];
    default:
      return [];
  }
}

/**
 * Calculates effective conductance (g = 1/R) for passive elements.
 * @param component - Electrical component
 * @returns Conductance in Siemens (Mho)
 */
function calculateComponentConductance(component: CircuitElementData): number {
  const resistance = getComponentEffectiveResistance(component);
  if (resistance <= 0 || !Number.isFinite(resistance)) {
    return 0;
  }
  return 1 / resistance;
}

/**
 * Retrieves the effective resistance of a component in Ohms.
 * @param component - Electrical component
 * @returns Resistance in Ohms
 */
export function getComponentEffectiveResistance(component: CircuitElementData): number {
  switch (component.type) {
    case 'resistor':
      return Math.max(0.1, component.resistance ?? 100);
    case 'bulb':
      // Typical educational incandescent bulb resistance ~ 10-25 Ohms
      return Math.max(0.1, component.resistance ?? 15);
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
