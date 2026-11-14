/**
 * Battery State of Charge (SoC) & Electro-Chemical Simulation Module.
 *
 * Implements realistic battery dynamics:
 * 1. Peukert / Coulombic charge integration: dQ = I * dt
 * 2. Realistic Voltage Sag curve:
 *    - charge >= 20%: 100% nominal EMF
 *    - 0% < charge < 20%: linear sag V_effective = V_nominal * (charge / 20)
 *    - charge <= 0%: 0.0V (depleted cell)
 * 3. Charge State classification: 'charging' (I > 0) vs 'discharging' (I < 0) vs 'idle'
 * 4. Zero-Crash Protection: 0V discharged batteries preserve internal series resistance
 *    so MNA linear solver matrices remain strictly non-singular.
 *
 * Time Complexity Analysis:
 * - computeEffectiveBatteryVoltage: O(1) constant time arithmetic.
 * - determineBatteryChargeState: O(1) constant time threshold comparison.
 * - calculateChargeDelta: O(1) constant time integration.
 * - stepBatteryCharge: O(1) constant time update.
 */

import { ComponentType, BatteryChargeState } from '../types/circuit';

/** Default rated capacity for single 1.5V AA alkaline cell (milliampere-hours) */
export const DEFAULT_AA_CAPACITY_MAH = 1000;

/** Default rated capacity for 9V alkaline battery (milliampere-hours) */
export const DEFAULT_9V_CAPACITY_MAH = 500;

/**
 * Default rated capacity for series AA battery holder (milliampere-hours).
 * In a series string (2 × 1.5V = 3.0V), voltages add while ampere-hour capacity
 * remains equal to one individual cell (1000 mAh), preserving energy E = V × Q = 3.0 Wh.
 */
export const DEFAULT_HOLDER_CAPACITY_MAH = DEFAULT_AA_CAPACITY_MAH;

/** Current flow threshold to differentiate active flow from numerical noise (Amperes) */
export const CURRENT_FLOW_EPSILON = 1e-5; // 0.01 mA

/**
 * Educational Simulation Time Scale Multiplier.
 * In sandbox exploration, 1 real second simulates 60 seconds (1 minute) of chemical drain,
 * allowing learners to observe battery drain within a comfortable session timeframe.
 */
export const BATTERY_SIMULATION_TIME_SCALE = 60;

/**
 * Resolves the default capacity in milliampere-hours (mAh) for a given component type.
 *
 * @param componentType - Component identifier ('battery', 'battery9v', or 'battery-holder')
 * @param cellCount - For battery-holder: number of installed cells
 * @returns Capacity in mAh
 */
/**
 * Resolves the default mAh battery capacity based on component type and cell count.
 * For series-connected holders ('battery-holder'), ampere-hour capacity does NOT
 * scale with series cell count: 1 or 2 cells in series share the 1000 mAh rating,
 * while 0 installed cells yields 0 mAh.
 *
 * Time Complexity: O(1).
 *
 * @param componentType - Component identifier ('battery', 'battery9v', or 'battery-holder')
 * @param cellCount - For battery-holder: number of installed cells
 * @returns Rated capacity in mAh
 */
export function getDefaultBatteryCapacity(
  componentType: ComponentType,
  cellCount?: number
): number {
  switch (componentType) {
    case 'battery':
      return DEFAULT_AA_CAPACITY_MAH;
    case 'battery9v':
      return DEFAULT_9V_CAPACITY_MAH;
    case 'battery-holder':
      return cellCount === 0 ? 0 : DEFAULT_HOLDER_CAPACITY_MAH;
    case 'bess-substation':
    case 'bess_substation':
      return 10000;
    default:
      return DEFAULT_AA_CAPACITY_MAH;
  }
}

/**
 * Calculates effective battery electromotive force (EMF) voltage taking into account
 * State of Charge (SoC) and realistic voltage sag.
 *
 * Voltage Sag Curve:
 * - currentCharge >= 20%: Full rated open-circuit voltage
 * - 0% < currentCharge < 20%: Linear degradation down to 0V: V_nominal * (charge / 20)
 * - currentCharge <= 0%: 0.0V (dead / completely discharged)
 *
 * @param nominalVoltage - Open-circuit nominal voltage (e.g. 1.5V or 9.0V)
 * @param currentCharge - Percentage State of Charge (0 - 100)
 * @returns Effective EMF in Volts
 */
export function computeEffectiveBatteryVoltage(
  nominalVoltage: number,
  currentCharge: number | undefined
): number {
  if (nominalVoltage <= 0) {
    return 0;
  }

  const normalizedCharge =
    typeof currentCharge === 'number' && !Number.isNaN(currentCharge)
      ? Math.max(0, Math.min(100, currentCharge))
      : 100;

  if (normalizedCharge <= 0) {
    return 0;
  }

  if (normalizedCharge < 20) {
    return nominalVoltage * (normalizedCharge / 20);
  }

  return nominalVoltage;
}

/**
 * Determines whether a battery is currently charging, discharging, or idle based on MNA branch current.
 *
 * Sign Convention in MNA Formulation:
 * - branchCurrent < -CURRENT_FLOW_EPSILON: Current leaving positive pin into load -> 'discharging'
 * - branchCurrent > CURRENT_FLOW_EPSILON: Current forced into positive pin from external supply -> 'charging'
 * - Otherwise: 'idle'
 *
 * @param branchCurrentAmperes - Signed current through the battery branch in Amperes
 * @returns Charge state enum: 'idle' | 'charging' | 'discharging'
 */
export function determineBatteryChargeState(
  branchCurrentAmperes: number
): BatteryChargeState {
  if (Number.isNaN(branchCurrentAmperes)) {
    return 'idle';
  }

  if (branchCurrentAmperes < -CURRENT_FLOW_EPSILON) {
    return 'discharging';
  }

  if (branchCurrentAmperes > CURRENT_FLOW_EPSILON) {
    return 'charging';
  }

  return 'idle';
}

/**
 * Computes percentage State of Charge delta for a discrete time step.
 *
 * Formula:
 * Delta Q (mAh) = ( |Current (A)| * 1000 mA/A ) * ( (deltaSeconds * timeScale) / 3600 s/h )
 * Delta Charge (%) = ( Delta Q / Capacity (mAh) ) * 100%
 *
 * @param branchCurrentAmperes - Signed current flowing through component in Amperes
 * @param capacityMilliampHours - Total battery capacity in mAh
 * @param deltaSeconds - Elapsed simulation step in seconds
 * @param timeScale - Time scaling factor (defaults to BATTERY_SIMULATION_TIME_SCALE)
 * @returns Absolute charge percentage delta (>= 0)
 */
export function calculateChargeDelta(
  branchCurrentAmperes: number,
  capacityMilliampHours: number,
  deltaSeconds: number,
  timeScale: number = BATTERY_SIMULATION_TIME_SCALE
): number {
  if (
    Number.isNaN(branchCurrentAmperes) ||
    capacityMilliampHours <= 0 ||
    deltaSeconds <= 0 ||
    timeScale <= 0
  ) {
    return 0;
  }

  const absoluteCurrentAmperes = Math.abs(branchCurrentAmperes);
  if (absoluteCurrentAmperes < CURRENT_FLOW_EPSILON) {
    return 0;
  }

  // Delta mAh = (I_amperes * 1000) * ( (deltaSeconds * timeScale) / 3600 )
  //           = (I_amperes * deltaSeconds * timeScale) / 3.6
  const deltaMilliampHours =
    (absoluteCurrentAmperes * deltaSeconds * timeScale) / 3.6;

  // Percentage = (deltaMilliampHours / capacityMilliampHours) * 100
  const percentageDelta = (deltaMilliampHours / capacityMilliampHours) * 100;

  return percentageDelta;
}

/**
 * Advances the State of Charge (SoC) for a battery by one simulation step.
 *
 * @param currentCharge - Previous charge percentage (0 - 100)
 * @param capacityMilliampHours - Capacity in mAh
 * @param branchCurrentAmperes - Current in Amperes
 * @param deltaSeconds - Elapsed seconds in this tick
 * @param timeScale - Simulation time multiplier
 * @returns Next charge percentage (clamped to [0, 100]) and active charge state
 */
export function stepBatteryCharge(
  currentCharge: number | undefined,
  capacityMilliampHours: number,
  branchCurrentAmperes: number,
  deltaSeconds: number,
  timeScale: number = BATTERY_SIMULATION_TIME_SCALE
): { newCharge: number; chargeState: BatteryChargeState } {
  const safeCurrentCharge =
    typeof currentCharge === 'number' && !Number.isNaN(currentCharge)
      ? Math.max(0, Math.min(100, currentCharge))
      : 100;

  const chargeState = determineBatteryChargeState(branchCurrentAmperes);

  if (chargeState === 'idle') {
    return { newCharge: safeCurrentCharge, chargeState: 'idle' };
  }

  const deltaPercentage = calculateChargeDelta(
    branchCurrentAmperes,
    capacityMilliampHours,
    deltaSeconds,
    timeScale
  );

  let updatedCharge = safeCurrentCharge;
  if (chargeState === 'discharging') {
    updatedCharge = Math.max(0, safeCurrentCharge - deltaPercentage);
  } else if (chargeState === 'charging') {
    updatedCharge = Math.min(100, safeCurrentCharge + deltaPercentage);
  }

  return {
    newCharge: updatedCharge,
    chargeState,
  };
}

/** Nominal EMF of a single standard AA alkaline cell in Volts */
export const NOMINAL_AA_CELL_VOLTAGE = 1.5;

/** Maximum AA cells supported in the dual-AA series holder */
export const MAX_HOLDER_CELLS = 2;

export interface SeriesHolderStateInput {
  hasBattery?: boolean;
  batteryCount?: number;
  currentCharge?: number;
  cellCharges?: number[];
}

export interface SeriesHolderTelemetry {
  hasBattery: boolean;
  batteryCount: number;
  cellCharges: number[];
  /** Limiting cell SoC (weakest cell determines remaining series mAh delivery) */
  currentCharge: number;
  /** Series string capacity equals single-cell mAh when loaded, 0 when empty */
  capacity: number;
  /** Nominal open-circuit series EMF sum (e.g. 1.5V or 3.0V) */
  voltage: number;
  /** Sag-adjusted series EMF sum */
  effectiveVoltage: number;
}

function clampChargePercentage(value: number | undefined, fallback = 100): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(100, value));
}

/**
 * Normalizes per-cell SoC tracking for a series `battery-holder`.
 * Time Complexity: O(N) with N <= 2 (O(1) bounded).
 *
 * @param cellCharges - Existing per-cell SoC array if recorded
 * @param cellCount - Number of currently installed AA cells (0..2)
 * @param fallbackCharge - Fallback pack SoC when individual cell charges were not tracked
 * @returns Clamped array of length `cellCount`
 */
export function normalizeHolderCellCharges(
  cellCharges: number[] | undefined,
  cellCount: number,
  fallbackCharge = 100
): number[] {
  const safeCount = Math.max(0, Math.min(MAX_HOLDER_CELLS, Math.floor(cellCount)));
  if (safeCount === 0) {
    return [];
  }

  const safeFallback = clampChargePercentage(fallbackCharge, 100);
  const result: number[] = [];
  for (let i = 0; i < safeCount; i++) {
    result.push(clampChargePercentage(cellCharges?.[i], safeFallback));
  }
  return result;
}

/**
 * Resolves the active cell count from holder node fields safely.
 * Time Complexity: O(1).
 */
export function resolveHolderCellCount(holder: SeriesHolderStateInput): number {
  const rawCount = holder.batteryCount ?? (holder.hasBattery ? MAX_HOLDER_CELLS : 0);
  return Math.max(0, Math.min(MAX_HOLDER_CELLS, Math.floor(rawCount)));
}

/**
 * Computes consistent physical telemetry for a series AA battery holder.
 * Voltages sum in series, while ampere-hour capacity stays invariant at 1000 mAh
 * and usable pack charge is governed by the lowest-SoC cell in series.
 *
 * Time Complexity: O(N) where N <= 2 (O(1) bounded).
 */
export function computeSeriesHolderTelemetry(
  cellCharges: number[],
  nominalCellVoltage: number = NOMINAL_AA_CELL_VOLTAGE
): SeriesHolderTelemetry {
  const safeCells = cellCharges
    .slice(0, MAX_HOLDER_CELLS)
    .map((soc) => clampChargePercentage(soc, 100));
  const batteryCount = safeCells.length;
  const hasBattery = batteryCount > 0;

  let effectiveVoltage = 0;
  let limitingCharge = hasBattery ? 100 : 100;
  if (hasBattery) {
    limitingCharge = safeCells[0];
    for (let i = 0; i < batteryCount; i++) {
      const soc = safeCells[i];
      if (soc < limitingCharge) {
        limitingCharge = soc;
      }
      effectiveVoltage += computeEffectiveBatteryVoltage(nominalCellVoltage, soc);
    }
  }

  return {
    hasBattery,
    batteryCount,
    cellCharges: safeCells,
    currentCharge: limitingCharge,
    capacity: hasBattery ? DEFAULT_HOLDER_CAPACITY_MAH : 0,
    voltage: batteryCount * nominalCellVoltage,
    effectiveVoltage,
  };
}

/**
 * Computes updated holder fields when inserting an AA cell (default or dragged) into a holder,
 * preserving existing cells' SoC and storing the newly inserted cell's individual SoC.
 * Returns null if the holder already holds 2 cells.
 *
 * Time Complexity: O(1).
 */
export function insertCellIntoHolderState(
  holder: SeriesHolderStateInput,
  insertedCellCharge = 100
): SeriesHolderTelemetry | null {
  const currentCount = resolveHolderCellCount(holder);
  if (currentCount >= MAX_HOLDER_CELLS) {
    return null;
  }

  const existingCells = normalizeHolderCellCharges(
    holder.cellCharges,
    currentCount,
    holder.currentCharge ?? 100
  );
  const nextCells = [...existingCells, clampChargePercentage(insertedCellCharge, 100)];
  return computeSeriesHolderTelemetry(nextCells);
}

/**
 * Computes updated holder fields and the ejected AA cell's preserved SoC when removing one cell.
 * Pops the last inserted cell (LIFO slot 2 -> slot 1). Returns null if holder is empty.
 *
 * Time Complexity: O(1).
 */
export function ejectCellFromHolderState(
  holder: SeriesHolderStateInput
): { updatedHolder: SeriesHolderTelemetry; ejectedCellCharge: number } | null {
  const currentCount = resolveHolderCellCount(holder);
  if (currentCount <= 0) {
    return null;
  }

  const existingCells = normalizeHolderCellCharges(
    holder.cellCharges,
    currentCount,
    holder.currentCharge ?? 100
  );
  const ejectedCellCharge = existingCells[existingCells.length - 1] ?? clampChargePercentage(holder.currentCharge, 100);
  const remainingCells = existingCells.slice(0, existingCells.length - 1);

  return {
    updatedHolder: computeSeriesHolderTelemetry(remainingCells),
    ejectedCellCharge,
  };
}
