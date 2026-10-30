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

/** Default rated capacity for dual AA battery holder (milliampere-hours) */
export const DEFAULT_HOLDER_CAPACITY_MAH = 2000;

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
      return (cellCount ?? 2) * DEFAULT_AA_CAPACITY_MAH;
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
