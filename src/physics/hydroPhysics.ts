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
 *    - Open-circuit output EMF voltage: V_oc = min(24.0, 12.0 * sqrt(P_hydro / 30.0))
 *    - Rotor rotational speed: RPM = min(600, round(Q_ratio * sqrt(H) * 200))
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

  // Open-circuit EMF voltage: calibrated so 30W yields 12.0V nominal DC
  const rawVoltage = 12.0 * Math.sqrt(powerWatts / 30.0);
  const voltage = Number(Math.min(24.0, Math.max(0, rawVoltage)).toFixed(2));

  // Pelton runner RPM is proportional to jet velocity v = sqrt(2 * g * H) and flow
  const rawRpm = flowRatio * Math.sqrt(2 * GRAVITY_ACCELERATION_M_S2 * safeHead) * 60;
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
): { flowPercentage: number; headMeters: number; hasWaterContact: boolean } {
  if (!terrainGrid || terrainGrid.length === 0 || !box) {
    return { flowPercentage: 0, headMeters: 0, hasWaterContact: false };
  }

  const rows = terrainGrid.length;
  const cols = terrainGrid[0].length;
  const cellWidth = canvasWidth / cols;
  const cellHeight = canvasHeight / rows;

  // The runner rotor sits at the top center of the A-frame (approx top 40% height)
  const runnerCenterX = box.x + box.width * 0.5;
  const runnerCenterY = box.y + box.height * 0.25;

  const runnerCol = Math.max(0, Math.min(cols - 1, Math.floor(runnerCenterX / cellWidth)));
  const runnerRow = Math.max(0, Math.min(rows - 1, Math.floor(runnerCenterY / cellHeight)));

  // Check columns spanned by the turbine rotor: [runnerCol - 1, runnerCol, runnerCol + 1]
  const minCol = Math.max(0, runnerCol - 1);
  const maxCol = Math.min(cols - 1, runnerCol + 1);

  let highestWaterRow: number | null = null;
  let waterCellCount = 0;
  let directContact = false;

  for (let c = minCol; c <= maxCol; c++) {
    for (let r = 0; r <= runnerRow + 1 && r < rows; r++) {
      const cell = terrainGrid[r][c];
      if (cell === 'WATER' || cell === 'WATER_SPRING') {
        waterCellCount++;
        if (highestWaterRow === null || r < highestWaterRow) {
          highestWaterRow = r;
        }
        // Direct contact if water cell is adjacent to or inside the runner intake
        if (Math.abs(r - runnerRow) <= 1 && Math.abs(c - runnerCol) <= 1) {
          directContact = true;
        }
      }
    }
  }

  if (highestWaterRow === null || (!directContact && waterCellCount < 2)) {
    return { flowPercentage: 0, headMeters: 0, hasWaterContact: false };
  }

  // Calculate hydraulic head in rows dropped from highest water source to runner
  const rowDrop = Math.max(1, runnerRow - highestWaterRow);
  const headMeters = Number((rowDrop * METERS_PER_TERRAIN_ROW).toFixed(2));

  // Flow percentage scales with number of active water cells feeding the turbine
  const flowPercentage = Math.min(100, Math.max(25, waterCellCount * 25));

  return {
    flowPercentage,
    headMeters,
    hasWaterContact: directContact,
  };
}
