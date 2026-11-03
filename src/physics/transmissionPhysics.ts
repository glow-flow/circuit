/**
 * Transmission Physics Module
 * 
 * Implements high-voltage electrical transmission physics for the Nature Mode SUTET
 * grid, including tower span distance, Aluminum/Copper line resistance, Joule heat
 * loss (P_loss = I^2 * R), Step-Up/Step-Down transformer turns ratios, and thermal
 * stress analysis.
 * 
 * Standar PUIL / PLN:
 * - Direct Transmission (12V LV): High line current produces substantial I^2 * R Joule
 *   loss, thermal wire heating, and voltage drop across the transmission span.
 * - SUTET Step-Up Transmission (240V HV): Stepping up voltage by 20x reduces line current
 *   by 20x and slashes Joule dissipation by (20^2) = 400x, delivering maximum power to
 *   the consumer with negligible line losses.
 * 
 * Time Complexity: All calculations execute in O(1) time.
 */

/**
 * Standard ACSR / Overhead transmission conductor resistance per meter of loop (Ohms/m).
 * Typical utility span loop resistance (positive + return conductor).
 */
export const DEFAULT_WIRE_RESISTANCE_PER_METER = 0.016;

/**
 * Default span distance between transmission towers in meters.
 * Utility standard for medium-span overhead transmission towers in Indonesia: ~250m.
 */
export const DEFAULT_SPAN_DISTANCE_METERS = 250;

/**
 * Default line resistance in Ohms for standard transmission tower span.
 * 250m * 0.016 Ohms/m = 4.0 Ohms.
 */
export const DEFAULT_LINE_RESISTANCE_OHMS = 4.0;

/**
 * Nominal low-voltage direct transmission level in Volts.
 */
export const LOW_VOLTAGE_NOMINAL = 12.0;

/**
 * Nominal high-voltage SUTET step-up transmission level in Volts.
 */
export const HIGH_VOLTAGE_NOMINAL = 240.0;

/**
 * Intermediate step-up voltage option (120V) for progressive educational experiments.
 */
export const INTERMEDIATE_HIGH_VOLTAGE = 120.0;

/**
 * Thermal stress current threshold in Amperes.
 * When transmission line current exceeds this threshold at 12V, the conductor experiences
 * excessive Joule heating, causing thermal stress (wire expands, sags, and glows warm red).
 */
export const THERMAL_STRESS_CURRENT_THRESHOLD = 0.4;

/**
 * Coordinates representing a 2D position in canvas space.
 */
export interface CanvasPoint {
  x: number;
  y: number;
}

/**
 * Transmission telemetry result containing real-time physical metrics.
 */
export interface TransmissionTelemetry {
  /** Distance between transmission towers in meters */
  spanDistanceMeters: number;
  /** Actual electrical resistance of the transmission line in Ohms */
  lineResistanceOhms: number;
  /** Equivalent resistance referred to the secondary load side in Ohms */
  effectiveReferredResistance: number;
  /** Effective transmission line voltage in Volts */
  transmissionVoltage: number;
  /** Transformer step-up turns ratio (N_secondary / N_primary) */
  turnsRatio: number;
  /** Load current demanded by consumers in Amperes */
  loadCurrentAmperes: number;
  /** Current flowing across the transmission line in Amperes */
  lineCurrentAmperes: number;
  /** Joule heat dissipation power (P = I^2 * R) in Watts */
  jouleLossWatts: number;
  /** Useful electrical power delivered to consumer in Watts */
  powerDeliveredWatts: number;
  /** Transmission line efficiency percentage (0% to 100%) */
  efficiencyPercent: number;
  /** Whether the line current exceeds the safe thermal limit at low voltage */
  isOverheated: boolean;
  /** Power loss reduction factor compared to direct 12V transmission */
  lossReductionFactor: number;
}

/**
 * Calculates physical span distance between two transmission towers in meters.
 * Uses Euclidean distance in canvas coordinates converted via a scale factor.
 * 
 * @param sourcePosition - Position of source tower or component
 * @param targetPosition - Position of target tower or component
 * @param metersPerPixel - Scale conversion factor (default 1.5 meters per pixel)
 * @returns Span distance in meters (defaults to DEFAULT_SPAN_DISTANCE_METERS if positions are missing)
 * 
 * Time Complexity: O(1)
 */
export function calculateTowerSpanDistance(
  sourcePosition?: CanvasPoint,
  targetPosition?: CanvasPoint,
  metersPerPixel: number = 1.5
): number {
  if (!sourcePosition || !targetPosition) {
    return DEFAULT_SPAN_DISTANCE_METERS;
  }

  const deltaX = targetPosition.x - sourcePosition.x;
  const deltaY = targetPosition.y - sourcePosition.y;
  const pixelDistance = Math.hypot(deltaX, deltaY);

  if (pixelDistance <= 0) {
    return DEFAULT_SPAN_DISTANCE_METERS;
  }

  const calculatedMeters = pixelDistance * Math.max(0.1, metersPerPixel);
  return Math.round(Math.max(20, Math.min(2000, calculatedMeters)));
}

/**
 * Calculates transmission line resistance based on conductor span distance.
 * 
 * @param spanDistanceMeters - Total span distance in meters
 * @param resistancePerMeter - Conductor loop resistance per meter (Ohms/m)
 * @returns Total transmission line resistance in Ohms (clamped to minimum 0.1 Ohm)
 * 
 * Time Complexity: O(1)
 */
export function calculateTransmissionLineResistance(
  spanDistanceMeters: number = DEFAULT_SPAN_DISTANCE_METERS,
  resistancePerMeter: number = DEFAULT_WIRE_RESISTANCE_PER_METER
): number {
  const validDistance = Math.max(0, spanDistanceMeters);
  const validUnitResistance = Math.max(0.001, resistancePerMeter);
  const calculatedResistance = validDistance * validUnitResistance;
  return Math.max(0.1, Math.round(calculatedResistance * 100) / 100);
}

/**
 * Calculates transformer step-up turns ratio (N = V_secondary / V_primary).
 * 
 * @param primaryVoltage - Generator/primary input voltage in Volts (e.g., 12V)
 * @param secondaryVoltage - Transmission line voltage in Volts (e.g., 240V)
 * @returns Turns ratio N (clamped to minimum 1.0 for step-up)
 * 
 * Time Complexity: O(1)
 */
export function calculateTurnsRatio(
  primaryVoltage: number = LOW_VOLTAGE_NOMINAL,
  secondaryVoltage: number = HIGH_VOLTAGE_NOMINAL
): number {
  const safePrimary = Math.max(1.0, primaryVoltage);
  const safeSecondary = Math.max(safePrimary, secondaryVoltage);
  return safeSecondary / safePrimary;
}

/**
 * Resolves the numeric transmission line voltage from mode or custom voltage.
 * 
 * @param voltageSetting - Setting mode ('direct' | 'step_up' | number)
 * @returns Effective transmission voltage in Volts (12V or 240V)
 * 
 * Time Complexity: O(1)
 */
export function resolveTransmissionVoltage(
  voltageSetting?: 'direct' | 'step_up' | '12V' | '240V' | number | null
): number {
  if (typeof voltageSetting === 'number' && voltageSetting > 0) {
    return voltageSetting;
  }
  if (voltageSetting === 'step_up' || voltageSetting === '240V') {
    return HIGH_VOLTAGE_NOMINAL;
  }
  return LOW_VOLTAGE_NOMINAL;
}

/**
 * Calculates the equivalent line resistance referred to the secondary/load side.
 * In a transformer circuit with turns ratio N, line impedance referred to the low-voltage
 * circuit scales inversely with the square of turns ratio: R_referred = R_line / (N^2).
 * 
 * @param actualLineResistance - Physical resistance of the line in Ohms
 * @param primaryVoltage - Low voltage (e.g., 12V)
 * @param transmissionVoltage - Transmission voltage (e.g., 240V)
 * @returns Referred resistance in Ohms
 * 
 * Time Complexity: O(1)
 */
export function calculateReferredLineResistance(
  actualLineResistance: number = DEFAULT_LINE_RESISTANCE_OHMS,
  primaryVoltage: number = LOW_VOLTAGE_NOMINAL,
  transmissionVoltage: number = HIGH_VOLTAGE_NOMINAL
): number {
  const turnsRatio = calculateTurnsRatio(primaryVoltage, transmissionVoltage);
  const ratioSquared = turnsRatio * turnsRatio;
  return Math.max(0.001, actualLineResistance / ratioSquared);
}

/**
 * Calculates Joule thermal heat loss: P_loss = I^2 * R.
 * 
 * @param lineCurrentAmperes - Current flowing through the transmission conductor in Amperes
 * @param lineResistanceOhms - Conductor electrical resistance in Ohms
 * @returns Joule loss in Watts
 * 
 * Time Complexity: O(1)
 */
export function calculateJouleLoss(
  lineCurrentAmperes: number,
  lineResistanceOhms: number = DEFAULT_LINE_RESISTANCE_OHMS
): number {
  const current = Math.abs(lineCurrentAmperes);
  const resistance = Math.max(0, lineResistanceOhms);
  return current * current * resistance;
}

/**
 * Calculates transmission efficiency percentage.
 * Formula: eta = (P_delivered / (P_delivered + P_loss)) * 100%
 * 
 * @param powerDeliveredWatts - Useful power received by load in Watts
 * @param powerLossWatts - Joule heat dissipated across transmission line in Watts
 * @returns Efficiency percentage between 0% and 100%
 * 
 * Time Complexity: O(1)
 */
export function calculateTransmissionEfficiency(
  powerDeliveredWatts: number,
  powerLossWatts: number
): number {
  const delivered = Math.max(0, powerDeliveredWatts);
  const loss = Math.max(0, powerLossWatts);

  if (delivered <= 0 && loss <= 0) {
    return 100.0;
  }

  const totalInputPower = delivered + loss;
  if (totalInputPower <= 0) {
    return 100.0;
  }

  const efficiency = (delivered / totalInputPower) * 100.0;
  return Math.max(0.0, Math.min(100.0, Math.round(efficiency * 10) / 10));
}

/**
 * Checks whether transmission line current exceeds safe thermal limits under low voltage.
 * 
 * @param lineCurrentAmperes - Conductor current in Amperes
 * @param transmissionVoltage - Effective line voltage in Volts
 * @param thresholdAmperes - Maximum safe thermal current limit in Amperes
 * @returns True if line experiences severe thermal stress
 * 
 * Time Complexity: O(1)
 */
export function isTransmissionLineOverheated(
  lineCurrentAmperes: number,
  transmissionVoltage: number = LOW_VOLTAGE_NOMINAL,
  thresholdAmperes: number = THERMAL_STRESS_CURRENT_THRESHOLD
): boolean {
  const current = Math.abs(lineCurrentAmperes);
  const isLowVoltage = transmissionVoltage <= LOW_VOLTAGE_NOMINAL + 0.1;
  return isLowVoltage && current >= thresholdAmperes;
}

/**
 * Parameters for computing comprehensive transmission grid telemetry.
 */
export interface TelemetryComputationParams {
  loadCurrent: number;
  voltageMode?: 'direct' | 'step_up' | '12V' | '240V' | number | null;
  spanMeters?: number;
  lineResistance?: number;
  generatorVoltage?: number;
}

/**
 * Computes end-to-end transmission grid telemetry including line current,
 * Joule heat loss, transmission efficiency, and thermal stress status.
 * 
 * @param params - Telemetry computation parameters
 * @returns Complete TransmissionTelemetry object
 * 
 * Time Complexity: O(1)
 */
export function computeTransmissionTelemetry(
  params: TelemetryComputationParams
): TransmissionTelemetry {
  const {
    loadCurrent,
    voltageMode = 'direct',
    spanMeters = DEFAULT_SPAN_DISTANCE_METERS,
    lineResistance,
    generatorVoltage = LOW_VOLTAGE_NOMINAL,
  } = params;

  const transmissionVoltage = resolveTransmissionVoltage(voltageMode);
  const primaryVoltage = Math.max(1.0, generatorVoltage);
  const turnsRatio = calculateTurnsRatio(primaryVoltage, transmissionVoltage);

  const lineResistanceOhms =
    lineResistance !== undefined && lineResistance > 0
      ? lineResistance
      : calculateTransmissionLineResistance(spanMeters);

  const effectiveReferredResistance = calculateReferredLineResistance(
    lineResistanceOhms,
    primaryVoltage,
    transmissionVoltage
  );

  const absLoadCurrent = Math.abs(loadCurrent);
  // Line current is scaled down by turns ratio N in high-voltage step-up
  const lineCurrentAmperes = turnsRatio > 1.0 ? absLoadCurrent / turnsRatio : absLoadCurrent;

  const jouleLossWatts = calculateJouleLoss(lineCurrentAmperes, lineResistanceOhms);
  const powerDeliveredWatts = primaryVoltage * absLoadCurrent;
  const efficiencyPercent = calculateTransmissionEfficiency(
    powerDeliveredWatts,
    jouleLossWatts
  );

  const isOverheated = isTransmissionLineOverheated(
    lineCurrentAmperes,
    transmissionVoltage,
    THERMAL_STRESS_CURRENT_THRESHOLD
  );

  const lossReductionFactor = Math.round(turnsRatio * turnsRatio);

  return {
    spanDistanceMeters: spanMeters,
    lineResistanceOhms,
    effectiveReferredResistance,
    transmissionVoltage,
    turnsRatio,
    loadCurrentAmperes: absLoadCurrent,
    lineCurrentAmperes,
    jouleLossWatts,
    powerDeliveredWatts,
    efficiencyPercent,
    isOverheated,
    lossReductionFactor,
  };
}
