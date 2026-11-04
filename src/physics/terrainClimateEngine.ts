/**
 * Outdoor Sandbox Terrain-Coupled Microclimate Engine (Nature Mode Phase 2).
 *
 * Implements:
 * 1. Orographic Wind Shear:
 *    Calculates effective wind turbine speed based on terrain elevation under wind turbines
 *    using the Hellmann power law:
 *      v_eff = v_base * (1 + (Y_baseline - Y_surface) / 180)^0.4
 *    Placing turbines on hilltops boosts wind speed and power (P_wind ~ v_eff^3),
 *    while valleys produce lower wind speeds.
 *
 * 2. 1D Topographic Ray-Casting Shadowing:
 *    Ray-casts across the 40-column terrain heightmap using sun elevation and azimuth.
 *    If an elevated dirt/grass hill obstructs the direct sun ray to a solar panel,
 *    marks `isShaded = true` and drops effective irradiance to diffuse level (15% of nominal).
 *
 * 3. Volumetric Terrain Shadow Projection:
 *    Generates smooth shadow polygon geometries for SVG terrain rendering in OutdoorSandbox.
 *
 * Big-O Complexity:
 * - Wind Shear calculation: O(1) constant-time arithmetic.
 * - 1D Ray-Casting: O(GRID_COLS) = O(40) = O(1) constant-time per panel.
 * - Microclimate update over N nodes: O(N * GRID_COLS) = O(N) linear time.
 */

import { Node } from 'reactflow';
import { CircuitElementData, TerrainCellType } from '../types/circuit';
import {
  findTerrainSurfaceY,
  getComponentBoundingBox,
  GRID_COLS,
  GRID_ROWS,
} from './terrainGrid';
import { getSolarPanelVoltage } from './solarPanel';
import {
  detectTurbineWaterFlow,
  calculateHydroOperatingPoint,
  measureSubmergedDepthPx,
} from './hydroPhysics';

/** Baseline terrain surface row (row 15 out of 20 = rows - 5 in default landscape) */
export const TERRAIN_BASELINE_ROW = 15;

/** Height scaling constant in pixels for Hellmann power law */
export const HELLMANN_SCALE_PX = 180;

/** Hellmann wind shear power law exponent (alpha = 0.4 for complex orographic terrain) */
export const HELLMANN_WIND_EXPONENT = 0.4;

/** Diffuse solar irradiance multiplier when direct sunlight is blocked by terrain shadow (15%) */
export const DIFFUSE_SHADING_RATIO = 0.15;

/** How far a ground shadow band rises above the grass line (px). */
export const SHADOW_BAND_LIFT_PX = 8;

/** How deep a ground shadow band reaches into the soil (px). */
export const SHADOW_BAND_DEPTH_PX = 30;

/** Standard default outdoor sandbox canvas dimensions */
export const DEFAULT_OUTDOOR_WIDTH = 1360;
export const DEFAULT_OUTDOOR_HEIGHT = 680;

export interface SunPosition {
  /** Sun elevation angle above the horizon (0° = horizon, 90° = directly overhead) */
  elevationDeg: number;
  /** Sun azimuth compass angle (90° = East/Morning, 180° = South/Noon, 270° = West/Afternoon) */
  azimuthDeg: number;
  /**
   * Optional world-anchored sun disc position as a fraction (0..1) of the stage width.
   * When both `worldXRatio` and `worldYPx` are set, the sun is a point light living in
   * world space: each receiver derives its own ray angle toward the disc, and terrain
   * lying beyond the disc itself (the sun is behind the receiver's far side) can never
   * cast a shadow on it.
   */
  worldXRatio?: number;
  /** World-space Y of the sun disc center in px, measured on the 680px reference stage. */
  worldYPx?: number;
}

export type SunTimeOfDay = 'morning' | 'noon' | 'afternoon';

/** Standard sun position presets */
export const SUN_PRESETS: Record<SunTimeOfDay, SunPosition> = {
  morning: { elevationDeg: 35, azimuthDeg: 90 },
  noon: { elevationDeg: 75, azimuthDeg: 180 },
  afternoon: { elevationDeg: 35, azimuthDeg: 270 },
};

/** World-space anchors of the visible sun disc for each time-of-day preset. */
export const SUN_WORLD_ANCHORS: Record<SunTimeOfDay, { xRatio: number; yPx: number }> = {
  morning: { xRatio: 0.07, yPx: 120 },
  noon: { xRatio: 0.5, yPx: 64 },
  afternoon: { xRatio: 0.93, yPx: 120 },
};

/**
 * Returns a preset sun position extended with its world-space disc anchor, so the
 * rendered sun orb and the shadow math always agree on where the sun is.
 * Time Complexity: O(1).
 *
 * @param timeOfDay - Time-of-day preset name
 * @returns SunPosition carrying `worldXRatio` / `worldYPx`
 */
export function getAnchoredSunPosition(timeOfDay: SunTimeOfDay): SunPosition {
  const anchor = SUN_WORLD_ANCHORS[timeOfDay] ?? SUN_WORLD_ANCHORS.morning;
  return {
    ...(SUN_PRESETS[timeOfDay] ?? SUN_PRESETS.morning),
    worldXRatio: anchor.xRatio,
    worldYPx: anchor.yPx,
  };
}

export interface WindShearResult {
  /** Original user slider base speed (0 - 100%) */
  baseSpeed: number;
  /** Effective wind speed accounting for elevation bonus/reduction (0 - 150%) */
  effectiveSpeed: number;
  /** Multiplier factor (v_eff / v_base) */
  shearFactor: number;
  /** Percentage bonus or penalty relative to baseline (e.g. +45% on hilltops, -28% in valleys) */
  elevationBonusPercent: number;
  /** Ground surface elevation Y in canvas pixels */
  surfaceY: number;
  /** Baseline flatland surface elevation Y in canvas pixels */
  baselineY: number;
  /** True if turbine is situated on an elevated hill (>= 25px above baseline) */
  isHilltop: boolean;
  /** True if turbine is situated in a depression or valley (>= 25px below baseline) */
  isValley: boolean;
  /** Adjusted open-circuit output voltage in Volts */
  effectiveVoltage: number;
}

export interface ShadowRayResult {
  /** True if direct sun ray is obstructed by higher terrain */
  isShaded: boolean;
  /** Column index of the obstructing hill (or null if unshaded) */
  blockingCol: number | null;
  /** Surface row index of the obstructing hill (or null if unshaded) */
  blockingRow: number | null;
  /** Irradiance multiplier (1.0 if unshaded, 0.15 if shaded, 0.0 if night) */
  effectiveSunlightRatio: number;
}

export interface TerrainShadowPolygon {
  /** SVG path 'd' attribute string */
  pathData: string;
  /** Starting column index */
  startCol: number;
  /** Ending column index */
  endCol: number;
}

/**
 * Resolves a SunPosition from either a time-of-day preset name or an explicit position object.
 *
 * @param sunSetting - Time of day string or SunPosition object
 * @returns Validated SunPosition
 */
export function resolveSunPosition(
  sunSetting?: SunTimeOfDay | SunPosition | null
): SunPosition {
  if (!sunSetting) {
    return SUN_PRESETS.morning;
  }
  if (typeof sunSetting === 'string') {
    return SUN_PRESETS[sunSetting] ?? SUN_PRESETS.morning;
  }
  const elevationDeg = Math.max(0, Math.min(90, Number.isFinite(sunSetting.elevationDeg) ? sunSetting.elevationDeg : 35));
  const azimuthDeg = Number.isFinite(sunSetting.azimuthDeg) ? (sunSetting.azimuthDeg % 360 + 360) % 360 : 90;
  return {
    elevationDeg,
    azimuthDeg,
    ...(typeof sunSetting.worldXRatio === 'number' && Number.isFinite(sunSetting.worldXRatio)
      ? { worldXRatio: Math.max(0, Math.min(1, sunSetting.worldXRatio)) }
      : {}),
    ...(typeof sunSetting.worldYPx === 'number' && Number.isFinite(sunSetting.worldYPx)
      ? { worldYPx: sunSetting.worldYPx }
      : {}),
  };
}

/**
 * Extracts a 1D column heightmap from the 40x20 2D terrain grid.
 * Returns an array of length `GRID_COLS` where each entry is the topmost solid row index
 * (`DIRT` or `GRASS`), or `GRID_ROWS` if the column contains no solid ground.
 *
 * Time Complexity: O(R * C) = O(20 * 40) = O(800) operations.
 *
 * @param terrainGrid - 2D terrain grid
 * @returns Array of surface row indices per column (0 to GRID_ROWS)
 */
export function getTerrainHeightmap(terrainGrid: TerrainCellType[][]): number[] {
  if (!terrainGrid || terrainGrid.length === 0) {
    return new Array<number>(GRID_COLS).fill(TERRAIN_BASELINE_ROW);
  }
  const rows = terrainGrid.length;
  const cols = terrainGrid[0]?.length ?? GRID_COLS;
  const heightmap = new Array<number>(cols);

  for (let c = 0; c < cols; c++) {
    let topRow = rows;
    for (let r = 0; r < rows; r++) {
      const cell = terrainGrid[r]?.[c];
      if (cell === 'DIRT' || cell === 'GRASS') {
        topRow = r;
        break;
      }
    }
    heightmap[c] = topRow;
  }

  return heightmap;
}

/**
 * Calculates effective wind speed based on terrain elevation under wind turbines
 * using the Hellmann power law:
 *   v_eff = v_base * (1 + (Y_baseline - Y_surface) / 180)^0.4
 *
 * Notes on coordinate system:
 * In screen pixel coordinates, Y=0 is the sky ceiling and Y increases downwards.
 * A hilltop has a SMALLER Y_surface than the baseline, so `(Y_baseline - Y_surface) > 0`!
 * A valley has a LARGER Y_surface than the baseline, so `(Y_baseline - Y_surface) < 0`!
 *
 * Time Complexity: O(1) constant-time arithmetic.
 *
 * @param baseSpeed - User slider setting for wind turbine (0 - 100%)
 * @param surfaceY - Terrain surface Y coordinate in pixels directly beneath the turbine
 * @param baselineY - Baseline ground level Y coordinate in pixels (defaults to row 15 * cellHeight)
 * @returns WindShearResult with effective speed, multiplier, bonus percentage, and voltage
 */
export function calculateOrographicWindShear(
  baseSpeed: number,
  surfaceY: number,
  baselineY: number = 510
): WindShearResult {
  const safeBaseSpeed = Math.max(0, Math.min(100, Number.isFinite(baseSpeed) ? baseSpeed : 50));
  const safeSurfaceY = Number.isFinite(surfaceY) ? surfaceY : baselineY;
  const safeBaselineY = Number.isFinite(baselineY) ? baselineY : 510;

  // Positive deltaY means the surface is elevated above the baseline (hilltop)
  const deltaY = safeBaselineY - safeSurfaceY;

  // Normalize base for power law: (1 + deltaY / 180) clamped to >= 0.05 to avoid NaN or imaginary roots
  const normalizedBase = Math.max(0.05, 1 + deltaY / HELLMANN_SCALE_PX);
  const shearFactor = Math.pow(normalizedBase, HELLMANN_WIND_EXPONENT);

  const rawEffectiveSpeed = safeBaseSpeed * shearFactor;
  // Clamp effective speed to [0, 150]%
  const effectiveSpeed = Math.max(0, Math.min(150, Math.round(rawEffectiveSpeed * 10) / 10));
  const elevationBonusPercent = Math.round((shearFactor - 1) * 100);

  // Effective output EMF voltage: (effectiveSpeed / 100) * 12.0V
  const effectiveVoltage = Number(((effectiveSpeed / 100) * 12.0).toFixed(2));

  return {
    baseSpeed: safeBaseSpeed,
    effectiveSpeed,
    shearFactor,
    elevationBonusPercent,
    surfaceY: safeSurfaceY,
    baselineY: safeBaselineY,
    isHilltop: deltaY >= 25,
    isValley: deltaY <= -25,
    effectiveVoltage,
  };
}

/**
 * Calculates aerodynamic wind power based on the cubic relation P_wind ~ v_eff^3.
 *
 * P_wind = 0.5 * rho * Area * Cp * v_eff^3
 *
 * @param effectiveSpeed - Effective wind speed percentage (0 - 150)
 * @param basePowerWatts - Rated electrical power at 100% nominal speed (default 24W)
 * @returns Estimated aerodynamic power in Watts
 */
export function calculateAerodynamicWindPower(
  effectiveSpeed: number,
  basePowerWatts: number = 24.0
): number {
  const normalizedSpeed = Math.max(0, effectiveSpeed) / 100.0;
  return Number((basePowerWatts * Math.pow(normalizedSpeed, 3)).toFixed(2));
}

/**
 * Performs 1D Topographic Ray-Casting across the 40-column terrain grid to test
 * if a dirt/grass hill obstructs the direct sun ray to a given target position.
 *
 * Algorithm:
 * 1. Convert sun elevation and azimuth into 2D ray trajectory.
 * 2. If sun elevation <= 0°, it is night (shaded).
 * 3. If sun elevation >= 90°, ray is straight down from zenith (unshaded by sideways hills).
 * 4. For morning sun (azimuth < 180°), sunlight comes from the left (East).
 *    Ray-cast backwards from the target column to the left (col - 1 down to 0).
 * 5. For afternoon sun (azimuth > 180°), sunlight comes from the right (West).
 *    Ray-cast backwards from the target column to the right (col + 1 up to 39).
 * 6. At each column c, calculate the ray height `rayY = targetY - distX * tan(elevation)`.
 *    If any solid ground column reaches above this ray (`terrainSurfaceY < rayY`),
 *    the hill obstructs the direct sun ray.
 * 7. If ray clears the sky ceiling (`rayY < 0`), break early.
 *
 * Time Complexity: O(GRID_COLS) <= 40 iterations = O(1) constant time.
 *
 * @param targetX - Target X coordinate in container pixels
 * @param targetY - Target Y coordinate (e.g. photovoltaic panel face) in container pixels
 * @param terrainGrid - 2D terrain grid
 * @param sunSetting - Sun position or time-of-day preset (default: morning)
 * @param containerWidth - Sandbox width in pixels (default 1360)
 * @param containerHeight - Sandbox height in pixels (default 680)
 * @returns ShadowRayResult
 */
export function cast1DTopographicShadowRay(
  targetX: number,
  targetY: number,
  terrainGrid: TerrainCellType[][],
  sunSetting: SunTimeOfDay | SunPosition = 'morning',
  containerWidth: number = DEFAULT_OUTDOOR_WIDTH,
  containerHeight: number = DEFAULT_OUTDOOR_HEIGHT
): ShadowRayResult {
  const sunPosition = resolveSunPosition(sunSetting);
  const { elevationDeg, azimuthDeg } = sunPosition;

  // Edge Case 1: Night / Sun below horizon
  if (elevationDeg <= 0) {
    return {
      isShaded: true,
      blockingCol: null,
      blockingRow: null,
      effectiveSunlightRatio: 0,
    };
  }

  // Edge Case 2: Empty or malformed terrain grid
  if (
    !terrainGrid ||
    terrainGrid.length === 0 ||
    !terrainGrid[0] ||
    terrainGrid[0].length === 0
  ) {
    return {
      isShaded: false,
      blockingCol: null,
      blockingRow: null,
      effectiveSunlightRatio: 1.0,
    };
  }

  const safeWidth = containerWidth > 0 ? containerWidth : DEFAULT_OUTDOOR_WIDTH;
  const safeHeight = containerHeight > 0 ? containerHeight : DEFAULT_OUTDOOR_HEIGHT;
  const cols = terrainGrid[0].length;
  const rows = terrainGrid.length;
  const cellWidth = safeWidth / cols;
  const cellHeight = safeHeight / rows;

  const targetCol = Math.max(0, Math.min(cols - 1, Math.floor(targetX / cellWidth)));
  const elevationRad = (elevationDeg * Math.PI) / 180;
  let tanElevation = Math.tan(elevationRad);

  const heightmap = getTerrainHeightmap(terrainGrid);

  // Edge Case 3: Target is buried underground in its own column
  // In screen coordinates, Y increases downwards, so targetY > terrainSurfaceY means inside ground
  const targetColSurfaceRow = heightmap[targetCol];
  const targetColSurfaceY = targetColSurfaceRow * cellHeight;
  if (targetColSurfaceRow < rows && targetY > targetColSurfaceY + 2) {
    return {
      isShaded: true,
      blockingCol: targetCol,
      blockingRow: targetColSurfaceRow,
      effectiveSunlightRatio: DIFFUSE_SHADING_RATIO,
    };
  }

  // Edge Case 4: Directly overhead at zenith
  if (elevationDeg >= 90) {
    return {
      isShaded: false,
      blockingCol: null,
      blockingRow: null,
      effectiveSunlightRatio: 1.0,
    };
  }

  // Directional Ray Tracing:
  // - Morning (azimuthDeg < 180°): East sun, rays travel from left to right -> check hills on the left (col < targetCol)
  // - Afternoon (azimuthDeg > 180°): West sun, rays travel from right to left -> check hills on the right (col > targetCol)
  // - Noon (azimuthDeg === 180°): High midday sun in southern sky -> in an East-West canyon/trench,
  //   walls on either side steeper than elevationDeg block the direct sun ray.
  let checkLeft = azimuthDeg <= 180;
  let checkRight = azimuthDeg >= 180;
  // Farthest horizontal distance a blocker may sit from the receiver (px).
  let maxReachPx = Infinity;

  // World-anchored sun: the ray angle is derived from the receiver toward the visible disc.
  // A receiver the sun has moved "behind" sees the old blocker on its lit side, so it is unshaded.
  if (sunPosition.worldXRatio !== undefined && sunPosition.worldYPx !== undefined) {
    const sunX = sunPosition.worldXRatio * safeWidth;
    const sunY = sunPosition.worldYPx * (safeHeight / DEFAULT_OUTDOOR_HEIGHT);
    const sunOffsetX = sunX - targetX;
    const sunDropY = targetY - sunY;
    if (sunDropY <= 0 || Math.abs(sunOffsetX) < cellWidth * 0.5) {
      return {
        isShaded: false,
        blockingCol: null,
        blockingRow: null,
        effectiveSunlightRatio: 1.0,
      };
    }
    tanElevation = sunDropY / Math.abs(sunOffsetX);
    checkLeft = sunOffsetX < 0;
    checkRight = sunOffsetX > 0;
    maxReachPx = Math.abs(sunOffsetX);
  }

  if (checkLeft) {
    for (let c = targetCol - 1; c >= 0; c--) {
      const colCenterX = (c + 0.5) * cellWidth;
      const distX = targetX - colCenterX;
      if (distX <= 0) continue;
      if (distX >= maxReachPx) break;

      const rayY = targetY - distX * tanElevation;
      // If ray is already above the ceiling of the world, no terrain can obstruct it
      if (rayY < 0) break;

      const surfaceRow = heightmap[c];
      if (surfaceRow >= rows) continue; // No solid ground in this column

      const terrainSurfaceY = surfaceRow * cellHeight;
      // In screen coords, smaller Y is higher up in the sky.
      // If terrainSurfaceY < rayY, terrain is higher than the sun ray!
      if (terrainSurfaceY < rayY) {
        return {
          isShaded: true,
          blockingCol: c,
          blockingRow: surfaceRow,
          effectiveSunlightRatio: DIFFUSE_SHADING_RATIO,
        };
      }
    }
  }

  if (checkRight) {
    for (let c = targetCol + 1; c < cols; c++) {
      const colCenterX = (c + 0.5) * cellWidth;
      const distX = colCenterX - targetX;
      if (distX <= 0) continue;
      if (distX >= maxReachPx) break;

      const rayY = targetY - distX * tanElevation;
      if (rayY < 0) break;

      const surfaceRow = heightmap[c];
      if (surfaceRow >= rows) continue;

      const terrainSurfaceY = surfaceRow * cellHeight;
      if (terrainSurfaceY < rayY) {
        return {
          isShaded: true,
          blockingCol: c,
          blockingRow: surfaceRow,
          effectiveSunlightRatio: DIFFUSE_SHADING_RATIO,
        };
      }
    }
  }

  return {
    isShaded: false,
    blockingCol: null,
    blockingRow: null,
    effectiveSunlightRatio: 1.0,
  };
}

/**
 * Computes shadow polygon geometries across the terrain grid for SVG rendering.
 *
 * For each elevated hill ridge, projects a shadow ray along the sun angle down to
 * the ground surface, producing an atmospheric shadow volume.
 *
 * Time Complexity: O(GRID_COLS) <= 40 steps.
 *
 * @param terrainGrid - 2D terrain grid
 * @param containerWidth - Canvas width in pixels
 * @param containerHeight - Canvas height in pixels
 * @param sunSetting - Sun position or time-of-day preset
 * @returns Array of SVG polygon path definitions
 */
export function computeTerrainShadowPolygons(
  terrainGrid: TerrainCellType[][],
  containerWidth: number = DEFAULT_OUTDOOR_WIDTH,
  containerHeight: number = DEFAULT_OUTDOOR_HEIGHT,
  sunSetting: SunTimeOfDay | SunPosition = 'morning'
): TerrainShadowPolygon[] {
  if (!terrainGrid || terrainGrid.length === 0) return [];

  const sunPosition = resolveSunPosition(sunSetting);
  const { elevationDeg } = sunPosition;

  const isWorldAnchored =
    sunPosition.worldXRatio !== undefined && sunPosition.worldYPx !== undefined;
  if (elevationDeg <= 0 || (!isWorldAnchored && elevationDeg >= 85)) {
    return [];
  }

  const safeWidth = containerWidth > 0 ? containerWidth : DEFAULT_OUTDOOR_WIDTH;
  const safeHeight = containerHeight > 0 ? containerHeight : DEFAULT_OUTDOOR_HEIGHT;
  const cols = terrainGrid[0]?.length ?? GRID_COLS;
  const rows = terrainGrid.length ?? GRID_ROWS;
  const cellWidth = safeWidth / cols;
  const cellHeight = safeHeight / rows;
  const heightmap = getTerrainHeightmap(terrainGrid);

  const polygons: TerrainShadowPolygon[] = [];

  // Pixel surface height per column (null where a column holds no solid ground).
  const surfaceYByCol: Array<number | null> = heightmap.map((surfaceRow) =>
    surfaceRow >= rows ? null : surfaceRow * cellHeight
  );

  // 1. Classify every column: is its ground surface hidden from the sun?
  const isColumnShaded: boolean[] = surfaceYByCol.map((surfaceY, c) => {
    if (surfaceY === null) return false;
    return cast1DTopographicShadowRay(
      (c + 0.5) * cellWidth,
      surfaceY - 2,
      terrainGrid,
      sunPosition,
      safeWidth,
      safeHeight
    ).isShaded;
  });

  // 2. Emit one soft ground band per contiguous shaded run. The band hugs the surface
  //    profile (diagonal across one-row steps, vertical across cliffs) instead of
  //    filling whole columns down to the bottom of the world.
  let runStart = -1;
  const flushRun = (runEnd: number) => {
    if (runStart < 0) return;
    const topEdge: Array<{ x: number; y: number }> = [];
    for (let boundary = runStart; boundary <= runEnd + 1; boundary++) {
      const x = boundary * cellWidth;
      const leftY = surfaceYByCol[Math.max(runStart, boundary - 1)] ?? 0;
      const rightY = surfaceYByCol[Math.min(runEnd, boundary)] ?? 0;
      if (boundary === runStart) {
        topEdge.push({ x, y: rightY });
      } else if (boundary === runEnd + 1) {
        topEdge.push({ x, y: leftY });
      } else if (Math.abs(leftY - rightY) <= cellHeight * 1.01) {
        topEdge.push({ x, y: (leftY + rightY) / 2 });
      } else {
        topEdge.push({ x, y: leftY }, { x, y: rightY });
      }
    }
    const lit = (pt: { x: number; y: number }, drop: number) =>
      `${pt.x.toFixed(1)} ${Math.min(safeHeight, pt.y + drop).toFixed(1)}`;
    let pathData = `M ${lit(topEdge[0], -SHADOW_BAND_LIFT_PX)}`;
    for (let i = 1; i < topEdge.length; i++) {
      pathData += ` L ${lit(topEdge[i], -SHADOW_BAND_LIFT_PX)}`;
    }
    for (let i = topEdge.length - 1; i >= 0; i--) {
      pathData += ` L ${lit(topEdge[i], SHADOW_BAND_DEPTH_PX)}`;
    }
    pathData += ' Z';
    polygons.push({ pathData, startCol: runStart, endCol: runEnd });
    runStart = -1;
  };

  for (let c = 0; c < cols; c++) {
    if (isColumnShaded[c]) {
      if (runStart < 0) runStart = c;
    } else {
      flushRun(c - 1);
    }
  }
  flushRun(cols - 1);

  return polygons;
}

/**
 * Applies terrain-coupled microclimate effects to all outdoor power generation nodes:
 * 1. Solar Panels:
 *    - Casts 1D topographic shadow ray from the photovoltaic receiver surface.
 *    - If shaded by an elevated hill, sets `isShaded = true`, reduces irradiance to 15% diffuse,
 *      and sets `voltage = getSolarPanelVoltage(effectiveSunlight)`.
 *    - If unshaded, sets `isShaded = false`, nominal irradiance, and nominal voltage.
 * 2. Wind Turbines:
 *    - Evaluates ground surface Y under the mast base via `findTerrainSurfaceY`.
 *    - Computes orographic wind shear via Hellmann power law:
 *      v_eff = v_base * (1 + (Y_baseline - Y_surface) / 180)^0.4
 *    - Updates `effectiveSpeed`, `windShearMultiplier`, `elevationBonusPercent`, and `voltage`.
 *
 * Time Complexity: O(N * GRID_COLS) = O(N) linear time across outdoor nodes.
 *
 * @param nodes - Current circuit nodes array
 * @param terrainGrid - 2D terrain grid
 * @param options - Optional container dimensions and sun position
 * @returns Updated array of nodes with microclimate parameters synchronized
 */
export function applyTerrainMicroclimateToNodes(
  nodes: Node<CircuitElementData>[],
  terrainGrid: TerrainCellType[][],
  options: {
    containerWidth?: number;
    containerHeight?: number;
    sunPosition?: SunPosition | SunTimeOfDay;
  } = {}
): Node<CircuitElementData>[] {
  if (!nodes || nodes.length === 0) return [];
  if (!terrainGrid || terrainGrid.length === 0) return nodes;

  let liveStageWidth: number | undefined;
  let liveStageHeight: number | undefined;
  if (
    options.containerWidth === undefined &&
    options.containerHeight === undefined &&
    typeof document !== 'undefined' &&
    typeof document.getElementById === 'function'
  ) {
    const stageEl = document.getElementById('outdoor-world-stage');
    const rect = stageEl?.getBoundingClientRect ? stageEl.getBoundingClientRect() : null;
    if (rect && rect.width >= 400 && rect.height >= 250) {
      liveStageWidth = rect.width;
      liveStageHeight = rect.height;
    }
  }

  const width = options.containerWidth ?? liveStageWidth ?? DEFAULT_OUTDOOR_WIDTH;
  const height = options.containerHeight ?? liveStageHeight ?? DEFAULT_OUTDOOR_HEIGHT;
  const sunPosition = resolveSunPosition(options.sunPosition);

  const rows = terrainGrid.length;
  const cellHeight = height / rows;
  const baselineY = TERRAIN_BASELINE_ROW * cellHeight;

  return nodes.map((node) => {
    // Only apply to outdoor generators
    if (node.data.worldMode !== 'outside') {
      return node;
    }

    // --- 1. Photovoltaic Solar Panel ---
    if (node.data.type === 'solar-panel' || node.data.type === 'solar_panel') {
      const box = getComponentBoundingBox(node.position, node.data.type);
      const { surfaceY } = findTerrainSurfaceY(
        box,
        terrainGrid,
        width,
        height,
        node.data.type
      );
      const receiverX = box.x + box.width * 0.5;
      // Photovoltaic cell receiver surface is around 45% down the node body,
      // clamped above the supporting terrain surface so un-settled preset coordinates never self-shade.
      const receiverY = Math.min(box.y + box.height * 0.45, surfaceY - cellHeight * 0.55);

      const shadowResult = cast1DTopographicShadowRay(
        receiverX,
        receiverY,
        terrainGrid,
        sunPosition,
        width,
        height
      );

      // Preserve user slider setting (base sunlight) so shading never permanently degrades it
      const baseSunlight = Math.max(
        0,
        Math.min(100, node.data.baseSunlight ?? node.data.sunlight ?? 100)
      );
      const effectiveSunlight = shadowResult.isShaded
        ? Math.round(baseSunlight * DIFFUSE_SHADING_RATIO * 10) / 10
        : baseSunlight;

      const effectiveVoltage = getSolarPanelVoltage(effectiveSunlight);

      return {
        ...node,
        data: {
          ...node.data,
          baseSunlight,
          sunlight: baseSunlight,
          isShaded: shadowResult.isShaded,
          effectiveSunlight,
          voltage: effectiveVoltage,
        },
      };
    }

    // --- 2. Renewable Wind Turbine ---
    if (node.data.type === 'wind-turbine' || node.data.type === 'wind_turbine') {
      const box = getComponentBoundingBox(node.position, node.data.type);
      const { surfaceY } = findTerrainSurfaceY(
        box,
        terrainGrid,
        width,
        height,
        node.data.type
      );

      const baseSpeed = Math.max(0, Math.min(100, node.data.speed ?? 50));
      const windShear = calculateOrographicWindShear(baseSpeed, surfaceY, baselineY);

      return {
        ...node,
        data: {
          ...node.data,
          effectiveSpeed: windShear.effectiveSpeed,
          windShearMultiplier: Number(windShear.shearFactor.toFixed(3)),
          elevationBonusPercent: windShear.elevationBonusPercent,
          voltage: windShear.effectiveVoltage,
        },
      };
    }


    // --- 3. Waterfall Micro-Hydro Turbine ---
    if (node.data.type === 'hydro-turbine' || node.data.type === 'hydro_turbine') {
      const box = getComponentBoundingBox(node.position, node.data.type);
      const waterFlow = detectTurbineWaterFlow(box, terrainGrid, width, height);

      const hasManualOverride = typeof node.data.manualWaterFlowRate === 'number';
      const effectiveFlow = hasManualOverride
        ? Math.max(0, Math.min(100, node.data.manualWaterFlowRate!))
        : waterFlow.hasWaterContact
        ? waterFlow.flowPercentage
        : 0;
      const effectiveHead = waterFlow.hasWaterContact
        ? waterFlow.headMeters
        : (node.data.hydraulicHeadMeters ?? 2.0);

      const hydroPoint = calculateHydroOperatingPoint(effectiveFlow, effectiveHead);

      return {
        ...node,
        data: {
          ...node.data,
          waterFlowRate: effectiveFlow,
          hydraulicHeadMeters: effectiveHead,
          voltage: hydroPoint.voltage,
          rpm: hydroPoint.rpm,
          submergedDepthPx: measureSubmergedDepthPx(box, terrainGrid, width, height),
          hasWaterContact: waterFlow.hasWaterContact || (hasManualOverride && effectiveFlow > 0),
        },
      };
    }

    return node;
  });
}
