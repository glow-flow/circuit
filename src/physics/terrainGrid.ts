/**
 * Outdoor Sandbox Terrain Physics & Spatial Collision Engine.
 *
 * Implements:
 * 1. 2D Grid Terrain Management (40 columns x 20 rows: 'EMPTY' | 'DIRT' | 'WATER' | 'GRASS')
 * 2. Cellular Automata Gravity (O(R * C) bottom-up pass and O(R * C) two-pointer instant settle)
 * 3. 3-Second Air-Exposed Grass Growth (O(R * C) with O(1) hash map timestamp lookups)
 * 4. Free-Position AABB Overlap Detection (O(N) across outdoor power components)
 * 5. O(k) Direct Index Mapping for Water Short-Circuit Explosion Detection
 */

import { Node } from 'reactflow';
import { CircuitElementData, ComponentType, TerrainCellType } from '../types/circuit';

export const GRID_COLS = 40;
export const GRID_ROWS = 20;
export const GRASS_GROWTH_DELAY_MS = 3000;

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Standard visual footprint dimensions (in px) for outdoor power components.
 * Used for AABB overlap rejection and water hazard collision checks.
 */
const COMPONENT_DIMENSIONS: Partial<Record<ComponentType, { width: number; height: number }>> = {
  'solar-panel': { width: 175, height: 215 },
  solar_panel: { width: 175, height: 215 },
  'wind-turbine': { width: 175, height: 295 },
  wind_turbine: { width: 175, height: 295 },
  'transmission-tower': { width: 155, height: 265 },
  transmission_tower: { width: 155, height: 265 },
};

const DEFAULT_COMPONENT_DIMENSION = { width: 150, height: 170 };

/**
 * Creates an empty 2D terrain grid of size `rows x cols` filled with 'EMPTY'.
 * Time Complexity: O(R * C) where R = rows, C = cols.
 *
 * @param rows - Number of grid rows (default 20)
 * @param cols - Number of grid columns (default 40)
 * @returns 2D array of TerrainCellType
 */
export function createEmptyTerrainGrid(
  rows: number = GRID_ROWS,
  cols: number = GRID_COLS
): TerrainCellType[][] {
  const safeRows = Math.max(1, Math.floor(rows));
  const safeCols = Math.max(1, Math.floor(cols));
  return Array.from({ length: safeRows }, () =>
    new Array<TerrainCellType>(safeCols).fill('EMPTY')
  );
}

/**
 * Creates a natural default outdoor landscape (40x20) featuring:
 * - Left & center grassy highland plateau (for Solar Panels, Wind Turbines, Transmission Towers)
 * - Right-side water pond/river basin (for testing Water Short-Circuit Explosions)
 * - Far-right grassy hill bank
 *
 * Time Complexity: O(R * C).
 *
 * @param rows - Number of grid rows (default 20)
 * @param cols - Number of grid columns (default 40)
 * @returns Initialized 2D terrain grid
 */
export function createDefaultOutdoorTerrain(
  rows: number = GRID_ROWS,
  cols: number = GRID_COLS
): TerrainCellType[][] {
  const grid = createEmptyTerrainGrid(rows, cols);

  for (let col = 0; col < cols; col++) {
    // Define surface elevation from bottom
    let surfaceRow = rows - 5; // Default 5 blocks high (row 15..19)

    if (col >= 4 && col <= 11) {
      surfaceRow = rows - 6; // Gently elevated hill on the left (row 14..19)
    } else if (col >= 24 && col <= 32) {
      // Water basin / river valley
      const bedRow = rows - 2; // Solid dirt riverbed at bottom 2 rows (row 18..19)
      const waterSurfaceRow = rows - 5; // Water fills rows 15..17
      for (let r = waterSurfaceRow; r < bedRow; r++) {
        if (r >= 0 && r < rows) {
          grid[r][col] = 'WATER';
        }
      }
      for (let r = bedRow; r < rows; r++) {
        if (r >= 0 && r < rows) {
          grid[r][col] = 'DIRT';
        }
      }
      continue;
    }

    for (let r = Math.max(0, surfaceRow); r < rows; r++) {
      grid[r][col] = r === surfaceRow ? 'GRASS' : 'DIRT';
    }
  }

  return grid;
}

/**
 * Advances gravity by one vertical step across the 2D terrain grid.
 * - Any 'DIRT', 'GRASS', or 'WATER' cell with 'EMPTY' directly below it falls down 1 row.
 * - Any 'GRASS' cell that becomes covered by a non-'EMPTY' cell above it reverts to 'DIRT'.
 *
 * Time Complexity: O(R * C) single bottom-up pass (no nested loop re-scanning).
 *
 * @param currentGrid - Current 2D terrain grid
 * @returns Object containing `nextGrid` and boolean `moved` indicating whether any cell changed
 */
export function stepTerrainGravity(currentGrid: TerrainCellType[][]): {
  nextGrid: TerrainCellType[][];
  moved: boolean;
} {
  if (!currentGrid || currentGrid.length === 0) {
    return { nextGrid: [], moved: false };
  }

  const rows = currentGrid.length;
  const cols = currentGrid[0].length;
  const nextGrid: TerrainCellType[][] = currentGrid.map((row) => [...row]);
  let moved = false;

  // Bottom-up pass from second-to-last row up to row 0
  for (let r = rows - 2; r >= 0; r--) {
    for (let c = 0; c < cols; c++) {
      const cell = nextGrid[r][c];
      if (cell === 'EMPTY') continue;

      if (nextGrid[r + 1][c] === 'EMPTY') {
        // Falling block: if it was GRASS, keep it or revert if covered
        nextGrid[r + 1][c] = cell;
        nextGrid[r][c] = 'EMPTY';
        moved = true;
      }
    }
  }

  // Buried GRASS check: if any GRASS cell has a non-EMPTY block directly above it, it reverts to DIRT
  for (let r = 1; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (nextGrid[r][c] === 'GRASS' && nextGrid[r - 1][c] !== 'EMPTY') {
        nextGrid[r][c] = 'DIRT';
        moved = true;
      }
    }
  }

  return { nextGrid: moved ? nextGrid : currentGrid, moved };
}

/**
 * Instantly settles all airborne 'DIRT', 'GRASS', and 'WATER' blocks to the bottom of their columns
 * using a two-pointer column compaction algorithm.
 *
 * Time Complexity: O(R * C) strictly linear in total grid cells (avoids O(R^2 * C) repeated passes).
 *
 * @param currentGrid - Current 2D terrain grid
 * @returns Fully settled 2D terrain grid
 */
export function settleTerrainGravityImmediate(
  currentGrid: TerrainCellType[][]
): TerrainCellType[][] {
  if (!currentGrid || currentGrid.length === 0) return [];
  const rows = currentGrid.length;
  const cols = currentGrid[0].length;
  const settledGrid = createEmptyTerrainGrid(rows, cols);

  for (let c = 0; c < cols; c++) {
    let writeRow = rows - 1;
    for (let readRow = rows - 1; readRow >= 0; readRow--) {
      const cell = currentGrid[readRow][c];
      if (cell !== 'EMPTY') {
        settledGrid[writeRow][c] = cell;
        writeRow--;
      }
    }
    // Ensure any buried GRASS (not at the top of the settled stack) reverts to DIRT
    const topFilledRow = writeRow + 1;
    for (let r = topFilledRow + 1; r < rows; r++) {
      if (settledGrid[r][c] === 'GRASS') {
        settledGrid[r][c] = 'DIRT';
      }
    }
  }

  return settledGrid;
}

/**
 * Evaluates the 3-second grass growth rule across the terrain grid:
 * - If a settled 'DIRT' cell has 'EMPTY' above it (or is at row 0), its exposure start timestamp
 *   is tracked in `exposureMap` (hash map keyed by `"row,col"` for O(1) lookup).
 * - Once `currentTimeMs - exposedSince >= growthDelayMs` (default 3000ms), the cell transforms into 'GRASS'.
 *
 * Time Complexity: O(R * C) with O(1) hash map lookups per cell.
 *
 * @param currentGrid - Current 2D terrain grid
 * @param exposureMap - Hash map of cell `"row,col"` -> timestamp (ms) when first exposed to air
 * @param currentTimeMs - Current timestamp in milliseconds
 * @param growthDelayMs - Required air exposure duration in ms before DIRT becomes GRASS (default 3000ms)
 * @returns Updated grid, updated exposure map, and `changed` flag
 */
export function evaluateGrassGrowth(
  currentGrid: TerrainCellType[][],
  exposureMap: Record<string, number>,
  currentTimeMs: number,
  growthDelayMs: number = GRASS_GROWTH_DELAY_MS
): {
  nextGrid: TerrainCellType[][];
  nextExposureMap: Record<string, number>;
  changed: boolean;
} {
  if (!currentGrid || currentGrid.length === 0) {
    return { nextGrid: [], nextExposureMap: {}, changed: false };
  }

  const rows = currentGrid.length;
  const cols = currentGrid[0].length;
  let gridCloned = false;
  let nextGrid = currentGrid;
  const nextExposureMap: Record<string, number> = {};
  let mapChanged = false;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = currentGrid[r][c];
      if (cell !== 'DIRT') continue;

      const isAirAbove = r === 0 || currentGrid[r - 1][c] === 'EMPTY';
      const isSupportedBelow = r === rows - 1 || currentGrid[r + 1][c] !== 'EMPTY';

      if (isAirAbove && isSupportedBelow) {
        const cellKey = `${r},${c}`;
        const firstExposedAt = exposureMap[cellKey];

        if (firstExposedAt === undefined) {
          nextExposureMap[cellKey] = currentTimeMs;
          mapChanged = true;
        } else if (currentTimeMs - firstExposedAt >= growthDelayMs) {
          if (!gridCloned) {
            nextGrid = currentGrid.map((row) => [...row]);
            gridCloned = true;
          }
          nextGrid[r][c] = 'GRASS';
          mapChanged = true;
        } else {
          nextExposureMap[cellKey] = firstExposedAt;
        }
      }
    }
  }

  if (!mapChanged && Object.keys(exposureMap).length !== Object.keys(nextExposureMap).length) {
    mapChanged = true;
  }

  return {
    nextGrid,
    nextExposureMap,
    changed: gridCloned || mapChanged,
  };
}

/**
 * Returns the Axis-Aligned Bounding Box (AABB) for a component at the given position.
 * Time Complexity: O(1).
 *
 * @param position - Top-left { x, y } position in canvas/container pixels
 * @param type - ComponentType
 * @returns BoundingBox { x, y, width, height }
 */
export function getComponentBoundingBox(
  position: { x: number; y: number },
  type: ComponentType
): BoundingBox {
  const dimension = COMPONENT_DIMENSIONS[type] ?? DEFAULT_COMPONENT_DIMENSION;
  return {
    x: position.x,
    y: position.y,
    width: dimension.width,
    height: dimension.height,
  };
}

/**
 * Checks whether two Axis-Aligned Bounding Boxes overlap.
 * Applies a small negative inset (`insetPx`) so grazing outer shadows don't falsely reject placement.
 * Time Complexity: O(1).
 *
 * @param boxA - First component bounding box
 * @param boxB - Second component bounding box
 * @param insetPx - Optional tolerance margin in pixels (default 8px)
 * @returns True if the two bounding boxes intersect
 */
export function doBoundingBoxesOverlap(
  boxA: BoundingBox,
  boxB: BoundingBox,
  insetPx: number = 8
): boolean {
  const aLeft = boxA.x + insetPx;
  const aRight = boxA.x + boxA.width - insetPx;
  const aTop = boxA.y + insetPx;
  const aBottom = boxA.y + boxA.height - insetPx;

  const bLeft = boxB.x + insetPx;
  const bRight = boxB.x + boxB.width - insetPx;
  const bTop = boxB.y + insetPx;
  const bBottom = boxB.y + boxB.height - insetPx;

  return aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop;
}

/**
 * Finds the first existing outdoor component whose bounding box overlaps with `targetBox`.
 * Time Complexity: O(N) where N is the number of nodes in the store.
 *
 * @param targetBox - Bounding box of the component being placed or dropped
 * @param excludeNodeId - ID of the node being dragged (so it doesn't collide with itself)
 * @param existingNodes - Array of nodes to test against (filtered to outdoor nodes)
 * @returns The overlapping Node if a collision occurs, or null if clear
 */
export function findOverlappingComponent(
  targetBox: BoundingBox,
  excludeNodeId: string | null,
  existingNodes: Node<CircuitElementData>[]
): Node<CircuitElementData> | null {
  for (const candidate of existingNodes) {
    if (candidate.id === excludeNodeId) continue;
    if (candidate.data.type === 'waypoint') continue;
    // Only check against outdoor nodes
    if ((candidate.data.worldMode ?? 'lab') !== 'outside') continue;

    const candidateBox = getComponentBoundingBox(candidate.position, candidate.data.type);
    if (doBoundingBoxesOverlap(targetBox, candidateBox)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Checks whether a dropped component's footprint overlaps any 'WATER' cell in the 2D terrain grid.
 * Uses direct O(1) coordinate-to-grid index arithmetic and scans only the overlapped sub-grid O(k).
 *
 * @param targetBox - Component bounding box in container pixel coordinates
 * @param terrainGrid - 2D terrain grid (rows x cols)
 * @param containerWidth - Width of the outdoor sandbox container in pixels
 * @param containerHeight - Height of the outdoor sandbox container in pixels
 * @returns True if any terrain cell under the component's body/base is 'WATER'
 */
export function doesComponentTouchWater(
  targetBox: BoundingBox,
  terrainGrid: TerrainCellType[][],
  containerWidth: number,
  containerHeight: number
): boolean {
  if (
    !terrainGrid ||
    terrainGrid.length === 0 ||
    containerWidth <= 0 ||
    containerHeight <= 0
  ) {
    return false;
  }

  const rows = terrainGrid.length;
  const cols = terrainGrid[0].length;
  const cellWidth = containerWidth / cols;
  const cellHeight = containerHeight / rows;

  // Check the horizontal span of the component (with 12px horizontal margin)
  // and the lower 65% of the component body down to its base terminals
  const sampleLeft = targetBox.x + 12;
  const sampleRight = targetBox.x + targetBox.width - 12;
  const sampleTop = targetBox.y + targetBox.height * 0.35;
  const sampleBottom = targetBox.y + targetBox.height - 4;

  const startCol = Math.max(0, Math.min(cols - 1, Math.floor(sampleLeft / cellWidth)));
  const endCol = Math.max(0, Math.min(cols - 1, Math.floor(sampleRight / cellWidth)));
  const startRow = Math.max(0, Math.min(rows - 1, Math.floor(sampleTop / cellHeight)));
  const endRow = Math.max(0, Math.min(rows - 1, Math.floor(sampleBottom / cellHeight)));

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      if (terrainGrid[r]?.[c] === 'WATER') {
        return true;
      }
    }
  }

  return false;
}
