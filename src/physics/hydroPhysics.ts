/**
 * Circuit Sandbox - Waterfall Micro-Hydro Generator Physics Engine (Nature Mode Phase 3).
 *
 * Implements fluid dynamic & electromechanical generation equations:
 * 1. Hydraulic Potential to Mechanical Power:
 *    P_hydro = eta * rho * g * Q * H
 *    where:
 *      - eta: Hydro runner hydraulic efficiency (eta ~ 0.82 for Pelton/crossflow runner)
 *      - rho: Water density (1000 kg/m^3)
 *      - g: Gravitational acceleration (9.81 m/s^2)
 *      - Q: Volumetric water flow rate (m^3/s)
 *      - H: Effective hydraulic head drop (meters)
 *
 * 2. Generator Electromotive Force (EMF) & Rotor Speed:
 *    - Open-circuit output EMF voltage: calibrated so 30W yields 12.0V nominal DC,
 *      with an integrated DC AVR (Automatic Voltage Regulator) smoothly governing
 *      high-flow / high-head output between 12.0V and 13.8V (standard 12V microgrid bus).
 *    - Rotor rotational speed: RPM = min(600, round(Q_ratio * sqrt(2*g*H) * 60))
 *    - CSS rotation duration: t_rot = 60 / RPM seconds (paused if RPM == 0)
 *
 * 3. 2D Terrain Grid Water Flow Detection:
 *    - Detects whether 'WATER' cells are cascading or resting over the turbine's intake runner.
 *    - Computes effective head H from the highest water source in the catchment column.
 *
 * Time Complexity Analysis:
 * - calculateHydroOperatingPoint: O(1) constant-time arithmetic.
 * - detectTurbineWaterFlow: O(GRID_ROWS) = O(20) = O(1) constant-time column scan.
 */

import { TerrainCellType } from '../types/circuit';
import { BoundingBox } from './terrainGrid';

/** Water density in kilograms per cubic meter (kg/m^3) */
export const WATER_DENSITY_KG_M3 = 1000;

/** Gravitational acceleration in meters per second squared (m/s^2) */
export const GRAVITY_ACCELERATION_M_S2 = 9.81;

/** Pelton / crossflow micro-runner hydraulic efficiency (82%) */
export const HYDRO_RUNNER_EFFICIENCY = 0.82;

/** Nominal full-scale volumetric flow rate (0.004 m^3/s = 4.0 Liters/second) */
export const NOMINAL_MAX_FLOW_RATE_M3_S = 0.004;

/** Height conversion factor: meters of hydraulic head per terrain grid row */
export const METERS_PER_TERRAIN_ROW = 0.45;

/** Vertical position of the Pelton runner hub as a fraction of the turbine node height. */
export const HYDRO_RUNNER_CENTER_RATIO = 0.165;

/** Horizontal Pelton wheel diameter as a fraction of the turbine node width (shared with UI). */
export const HYDRO_RUNNER_WIDTH_RATIO = 0.47;

/** Classified terrain hydrology regime driving a micro-hydro turbine. */
export type HydroFlowRegime = 'none' | 'puddle' | 'river' | 'waterfall';

/** Default internal generator coil resistance in Ohms */
export const HYDRO_GENERATOR_INTERNAL_RESISTANCE = 0.15;

export interface HydroOperatingPoint {
  /** Effective hydraulic power in Watts */
  powerWatts: number;
  /** Effective open-circuit electromotive force in Volts */
  voltage: number;
  /** Volumetric flow rate in m^3/s */
  flowRateM3S: number;
  /** Normalized flow percentage (0 - 100%) */
  flowPercentage: number;
  /** Effective hydraulic head drop in meters */
  headMeters: number;
  /** Runner rotational speed in Revolutions Per Minute (RPM) */
  rpm: number;
  /** CSS animation rotation period in seconds (null when stationary) */
  rotationDurationSeconds: number | null;
  /** Whether active water flux is currently driving the runner */
  isGenerating: boolean;
}

/**
 * Calculates real-time electrical and rotational operating point of a micro-hydro turbine.
 *
 * Time Complexity: O(1) constant-time arithmetic.
 *
 * @param flowPercentage - Water flow rate percentage (0 - 100%)
 * @param headMeters - Hydraulic head elevation drop in meters (>= 0)
 * @param efficiency - Mechanical-to-electrical generator efficiency (default 0.82)
 * @returns HydroOperatingPoint with power, EMF voltage, RPM, and rotation period
 */
export function calculateHydroOperatingPoint(
  flowPercentage: number,
  headMeters: number,
  efficiency: number = HYDRO_RUNNER_EFFICIENCY
): HydroOperatingPoint {
  const safeFlow = Math.max(0, Math.min(100, Number.isFinite(flowPercentage) ? flowPercentage : 0));
  const safeHead = Math.max(0, Math.min(15, Number.isFinite(headMeters) ? headMeters : 0));
  const safeEfficiency = Math.max(0.1, Math.min(1.0, Number.isFinite(efficiency) ? efficiency : HYDRO_RUNNER_EFFICIENCY));

  // If no water flow or zero head, generator is stationary
  if (safeFlow <= 0 || safeHead <= 0) {
    return {
      powerWatts: 0,
      voltage: 0,
      flowRateM3S: 0,
      flowPercentage: 0,
      headMeters: safeHead,
      rpm: 0,
      rotationDurationSeconds: null,
      isGenerating: false,
    };
  }

  // Convert flow percentage to m^3/s
  const flowRatio = safeFlow / 100;
  const flowRateM3S = Number((flowRatio * NOMINAL_MAX_FLOW_RATE_M3_S).toFixed(5));

  // Hydraulic power: P = eta * rho * g * Q * H
  const rawPower = safeEfficiency * WATER_DENSITY_KG_M3 * GRAVITY_ACCELERATION_M_S2 * flowRateM3S * safeHead;
  const powerWatts = Number(rawPower.toFixed(2));

  // Open-circuit EMF voltage: calibrated so 30W yields 12.0V nominal DC,
  // with an integrated DC AVR (Automatic Voltage Regulator) smoothly governing
  // high-flow / high-head output between 12.0V and 13.8V (standard 12V microgrid bus).
  const rawVoltage =
    powerWatts <= 30.0
      ? 12.0 * Math.sqrt(powerWatts / 30.0)
      : 12.0 + 1.8 * Math.min(1.0, (powerWatts - 30.0) / 50.0);
  const voltage = Number(Math.min(13.8, Math.max(0, rawVoltage)).toFixed(2));

  // True dimensional Pelton runner kinematics:
  // jet velocity v_j = sqrt(2*g*H), optimal blade speed ratio phi ~ 0.46, pitch diameter D = 0.16 m
  // N_rpm = flowRatio * (60 * u_runner) / (pi * D)
  const PELTON_RUNNER_DIAMETER_METERS = 0.16;
  const PELTON_OPTIMAL_SPEED_RATIO = 0.46;
  const jetVelocityMPerSec = Math.sqrt(2 * GRAVITY_ACCELERATION_M_S2 * safeHead);
  const tangentialVelocityMPerSec = PELTON_OPTIMAL_SPEED_RATIO * jetVelocityMPerSec;
  const rawRpm =
    flowRatio *
    ((60 * tangentialVelocityMPerSec) / (Math.PI * PELTON_RUNNER_DIAMETER_METERS));
  const rpm = Math.max(0, Math.min(600, Math.round(rawRpm)));

  // CSS animation rotation period (seconds per full 360-degree rotation)
  const rotationDurationSeconds = rpm > 0 ? Number((60 / rpm).toFixed(2)) : null;

  return {
    powerWatts,
    voltage,
    flowRateM3S,
    flowPercentage: safeFlow,
    headMeters: Number(safeHead.toFixed(2)),
    rpm,
    rotationDurationSeconds,
    isGenerating: powerWatts > 0.1,
  };
}

/**
 * Measures how far the turbine's base is submerged in a river, so the node can render the
 * waterline across its frame. Only water that is contiguous from the base upward counts,
 * so a falling waterfall column above the turbine is never mistaken for submersion.
 *
 * Time Complexity: O(GRID_ROWS) = O(1).
 *
 * @param box - Turbine bounding box in canvas pixels
 * @param terrainGrid - 2D terrain grid
 * @param canvasWidth - Outdoor canvas width in pixels
 * @param canvasHeight - Outdoor canvas height in pixels
 * @returns Submerged depth in px, clamped to [0, box.height]
 */
export function measureSubmergedDepthPx(
  box: BoundingBox,
  terrainGrid: TerrainCellType[][],
  canvasWidth: number = 1360,
  canvasHeight: number = 680
): number {
  if (!terrainGrid || terrainGrid.length === 0 || !box || canvasWidth <= 0 || canvasHeight <= 0) {
    return 0;
  }
  const rows = terrainGrid.length;
  const cols = terrainGrid[0].length;
  const cellWidth = canvasWidth / cols;
  const cellHeight = canvasHeight / rows;

  const centerCol = Math.max(0, Math.min(cols - 1, Math.floor((box.x + box.width / 2) / cellWidth)));
  const baseY = box.y + box.height;
  let row = Math.max(0, Math.min(rows - 1, Math.floor((baseY - 1) / cellHeight)));

  if (terrainGrid[row]?.[centerCol] !== 'WATER') return 0;
  while (row > 0 && terrainGrid[row - 1]?.[centerCol] === 'WATER') {
    row--;
  }
  const waterTopY = row * cellHeight;
  return Math.max(0, Math.min(box.height, Math.round(baseY - waterTopY)));
}

/**
 * Scans the 2D terrain grid to detect falling or resting water around a micro-hydro turbine.
 *
 * Algorithm:
 * 1. Find columns overlapping the turbine's runner intake (center 60% of bounding box).
 * 2. Scan vertically from row 0 down to the turbine runner row:
 *    - Detect if 'WATER' or 'WATER_SPRING' cells are present above or intersecting the turbine.
 *    - Calculate hydraulic head H as the distance from the highest water cell to the turbine runner.
 * 3. Returns the detected flow percentage and hydraulic head in meters.
 *
 * Time Complexity: O(GRID_ROWS * cols_covered) <= 20 * 4 = 80 iterations = O(1).
 *
 * @param box - Component bounding box in canvas pixels
 * @param terrainGrid - 2D terrain grid
 * @param canvasWidth - Total outdoor canvas width in pixels
 * @param canvasHeight - Total outdoor canvas height in pixels
 * @returns Object with detected flowPercentage and headMeters
 */
export function detectTurbineWaterFlow(
  box: BoundingBox,
  terrainGrid: TerrainCellType[][],
  canvasWidth: number = 1360,
  canvasHeight: number = 680
): {
  flowPercentage: number;
  headMeters: number;
  hasWaterContact: boolean;
  flowRegime: HydroFlowRegime;
} {
  if (
    !terrainGrid ||
    terrainGrid.length === 0 ||
    terrainGrid[0].length === 0 ||
    !box ||
    canvasWidth <= 0 ||
    canvasHeight <= 0
  ) {
    return { flowPercentage: 0, headMeters: 0, hasWaterContact: false, flowRegime: 'none' };
  }

  const rows = terrainGrid.length;
  const cols = terrainGrid[0].length;
  const cellWidth = canvasWidth / cols;
  const cellHeight = canvasHeight / rows;

  // The runner rotor sits at the top center of the A-frame (approx top 25% height),
  // while the turbine base/tailrace rests at box.y + box.height.
  const runnerCenterX = box.x + box.width * 0.5;
  const runnerCenterY = box.y + box.height * HYDRO_RUNNER_CENTER_RATIO;
  const turbineBottomY = box.y + box.height;

  const runnerRow = Math.max(0, Math.min(rows - 1, Math.floor(runnerCenterY / cellHeight)));
  // Include up to 2 rows below the turbine base so a turbine settled onto a river surface
  // detects the flowing river water channel directly underneath its tailrace/wheel.
  const maxScanRow = Math.max(
    runnerRow + 1,
    Math.min(rows - 1, Math.floor(turbineBottomY / cellHeight) + 2)
  );

  // Align horizontal column scan strictly with the rendered Pelton wheel diameter (47% of box width)
  const wheelHalfWidthPx = box.width * HYDRO_RUNNER_WIDTH_RATIO * 0.5;
  const minCol = Math.max(0, Math.floor((runnerCenterX - wheelHalfWidthPx) / cellWidth));
  const maxCol = Math.min(cols - 1, Math.floor((runnerCenterX + wheelHalfWidthPx) / cellWidth));

  let highestWaterRow: number | null = null;
  let lowestWaterRow: number | null = null;
  let waterCellCount = 0;
  let colsWithWaterCount = 0;
  let directContact = false;

  for (let c = minCol; c <= maxCol; c++) {
    let colHasWater = false;
    for (let r = 0; r <= maxScanRow && r < rows; r++) {
      const cell = terrainGrid[r][c];
      if (cell === 'WATER' || cell === 'WATER_SPRING') {
        waterCellCount++;
        colHasWater = true;
        if (highestWaterRow === null || r < highestWaterRow) {
          highestWaterRow = r;
        }
        if (lowestWaterRow === null || r > lowestWaterRow) {
          lowestWaterRow = r;
        }
        // Direct contact if water hits inside/above the runner OR across the tailrace channel
        if (r >= runnerRow - 1 && r <= maxScanRow && c >= minCol && c <= maxCol) {
          directContact = true;
        }
      }
    }
    if (colHasWater) {
      colsWithWaterCount++;
    }
  }

  if (highestWaterRow === null || (!directContact && waterCellCount < 2)) {
    return { flowPercentage: 0, headMeters: 0, hasWaterContact: false, flowRegime: 'none' };
  }

  // Strictly monotonic hydraulic head & flow regimes:
  // None (0V) < Puddle (<1.5V) < Flat River (<12.0V rated) < Waterfall + Channel (12.1V..13.8V AVR).
  const waterfallDropRows = runnerRow - highestWaterRow;
  const riverDepthRows = lowestWaterRow !== null ? lowestWaterRow - highestWaterRow + 1 : 1;
  const isContinuousRiverChannel =
    riverDepthRows >= 2 && colsWithWaterCount >= 3 && waterCellCount >= 6;
  const riverChannelHeadRows = Math.min(1.95, riverDepthRows * 0.65);

  let effectiveRowDrop: number;
  let flowPercentage: number;
  let flowRegime: HydroFlowRegime;

  if (waterfallDropRows >= 1) {
    flowRegime = 'waterfall';
    const channelSupportRows = isContinuousRiverChannel
      ? riverChannelHeadRows
      : riverDepthRows >= 2
      ? 0.85
      : 0.4;
    effectiveRowDrop = waterfallDropRows + channelSupportRows;
    flowPercentage = Math.min(100, Math.max(25, Math.round(waterCellCount * 15)));
  } else if (isContinuousRiverChannel) {
    flowRegime = 'river';
    effectiveRowDrop = riverChannelHeadRows;
    flowPercentage = Math.min(100, Math.max(30, Math.round((waterCellCount / 9) * 100)));
  } else {
    flowRegime = 'puddle';
    effectiveRowDrop = Math.min(0.6, Math.max(0.25, riverDepthRows * 0.25));
    flowPercentage = Math.min(35, Math.max(12, waterCellCount * 9));
  }

  const headMeters = Number((effectiveRowDrop * METERS_PER_TERRAIN_ROW).toFixed(2));

  return {
    flowPercentage,
    headMeters,
    hasWaterContact: directContact || waterCellCount >= 2,
    flowRegime,
  };
}
