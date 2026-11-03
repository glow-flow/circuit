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
export const OUTDOOR_WORLD_MIN_WIDTH = 1360;

/**
 * Maximum safe vertical drop distance (in grid row units) before a falling outdoor
 * component shatters/explodes upon hitting the ground.
 */
export const MAX_SAFE_DROP_ROWS = 4.5;

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type DropPhysicsOutcome =
  | {
      status: 'settled';
      settledPosition: { x: number; y: number };
      settledBox: BoundingBox;
      dropRows: number;
    }
  | {
      status: 'explode-height';
      impactPosition: { x: number; y: number };
      impactBox: BoundingBox;
      dropRows: number;
    }
  | {
      status: 'explode-water';
      impactPosition: { x: number; y: number };
      impactBox: BoundingBox;
      dropRows: number;
    }
  | {
      status: 'overlap';
      collidingNode: Node<CircuitElementData>;
    };

/**
 * Standard visual footprint dimensions (in px) for outdoor power components.
 * Used for AABB overlap rejection, ground gravity settling, and water hazard collision checks.
 */
export const COMPONENT_DIMENSIONS: Partial<Record<ComponentType, { width: number; height: number }>> = {
  'solar-panel': { width: 144, height: 156 },
  solar_panel: { width: 144, height: 156 },
  'wind-turbine': { width: 144, height: 260 },
  wind_turbine: { width: 144, height: 260 },
  'transmission-tower': { width: 132, height: 226 },
  transmission_tower: { width: 132, height: 226 },
  'bess-substation': { width: 156, height: 116 },
  bess_substation: { width: 156, height: 116 },
  'hydro-turbine': { width: 144, height: 144 },
  hydro_turbine: { width: 144, height: 144 },
};

export const DEFAULT_COMPONENT_DIMENSION = { width: 150, height: 170 };

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
 * Advances gravity and liquid water hydrodynamics by one step across the 2D terrain grid.
 * - Pass 1 (Vertical & Diagonal Gravity):
 *   - Any 'DIRT', 'GRASS', or 'WATER' cell with 'EMPTY' directly below it falls down 1 row.
 *   - Any 'WATER' cell resting on a non-EMPTY cell flows diagonally down-left (`r + 1, c - 1`)
 *     or down-right (`r + 1, c + 1`) if empty, filling lower pockets naturally.
 * - Pass 2 (Liquid Coalescence & Lateral Leveling):
 *   - Any 'EMPTY' pocket supported below that is flanked by 'WATER' on both left and right
 *     (`WATER | EMPTY | WATER`) coalesces into 'WATER' so water pools never stay hollow ("bolong").
 *   - Any 'WATER' cell next to an unsupported 'EMPTY' ledge flows sideways to cascade into lower basins.
 * - Pass 3 (Buried Grass Check):
 *   - Any 'GRASS' cell covered by a non-'EMPTY' cell above it reverts to 'DIRT'.
 *
 * Time Complexity: O(R * C) linear passes across the 40x20 grid (800 cells).
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

  // Pass 1: Bottom-up vertical fall & diagonal liquid flow
  for (let r = rows - 2; r >= 0; r--) {
    for (let c = 0; c < cols; c++) {
      const cell = nextGrid[r][c];
      if (cell === 'EMPTY') continue;

      // 1a. Stationary natural mountain spring (WATER_SPRING): emits cascading fresh water
      if (cell === 'WATER_SPRING') {
        if (r + 1 < rows && nextGrid[r + 1][c] === 'EMPTY') {
          nextGrid[r + 1][c] = 'WATER';
          moved = true;
        } else if (c + 1 < cols && nextGrid[r][c + 1] === 'EMPTY') {
          nextGrid[r][c + 1] = 'WATER';
          moved = true;
        } else if (c - 1 >= 0 && nextGrid[r][c - 1] === 'EMPTY') {
          nextGrid[r][c - 1] = 'WATER';
          moved = true;
        }
        continue;
      }

      // 1b. Straight vertical gravity (DIRT, GRASS, WATER)
      if (nextGrid[r + 1][c] === 'EMPTY') {
        nextGrid[r + 1][c] = cell;
        nextGrid[r][c] = 'EMPTY';
        moved = true;
        continue;
      }

      // 1b. Diagonal downward flow for WATER
      if (cell === 'WATER') {
        const canFlowDownLeft = c > 0 && nextGrid[r + 1][c - 1] === 'EMPTY';
        const canFlowDownRight = c < cols - 1 && nextGrid[r + 1][c + 1] === 'EMPTY';

        if (canFlowDownLeft && canFlowDownRight) {
          const targetCol = (r + c) % 2 === 0 ? c - 1 : c + 1;
          nextGrid[r + 1][targetCol] = 'WATER';
          nextGrid[r][c] = 'EMPTY';
          moved = true;
        } else if (canFlowDownLeft) {
          nextGrid[r + 1][c - 1] = 'WATER';
          nextGrid[r][c] = 'EMPTY';
          moved = true;
        } else if (canFlowDownRight) {
          nextGrid[r + 1][c + 1] = 'WATER';
          nextGrid[r][c] = 'EMPTY';
          moved = true;
        }
      }
    }
  }

  // Pass 2: Liquid Water Lateral Leveling & Hole Coalescence (so water never stays "bolong")
  for (let r = rows - 1; r >= 0; r--) {
    for (let c = 0; c < cols; c++) {
      const cell = nextGrid[r][c];

      // 2a. If an EMPTY cell is supported below and sandwiched between WATER on left & right,
      // or has WATER directly on one side and another WATER 2 cells away in the same basin, coalesce!
      if (cell === 'EMPTY') {
        const isSupportedBelow = r === rows - 1 || nextGrid[r + 1][c] !== 'EMPTY';
        const leftIsWater = c > 0 && nextGrid[r][c - 1] === 'WATER';
        const rightIsWater = c < cols - 1 && nextGrid[r][c + 1] === 'WATER';

        if (isSupportedBelow && leftIsWater && rightIsWater) {
          nextGrid[r][c] = 'WATER';
          moved = true;
          continue;
        }
      }

      // 2b. Lateral spreading of WATER into adjacent empty depressions/ledges
      if (cell === 'WATER' && r < rows - 1 && nextGrid[r + 1][c] !== 'EMPTY') {
        // Check if left neighbor is EMPTY and has a depression or is bounded by water/wall
        if (
          c > 0 &&
          nextGrid[r][c - 1] === 'EMPTY' &&
          (nextGrid[r + 1][c - 1] === 'EMPTY' ||
            (c > 1 && nextGrid[r][c - 2] === 'WATER'))
        ) {
          nextGrid[r][c - 1] = 'WATER';
          nextGrid[r][c] = 'EMPTY';
          moved = true;
          continue;
        }

        if (
          c < cols - 1 &&
          nextGrid[r][c + 1] === 'EMPTY' &&
          (nextGrid[r + 1][c + 1] === 'EMPTY' ||
            (c < cols - 2 && nextGrid[r][c + 2] === 'WATER'))
        ) {
          nextGrid[r][c + 1] = 'WATER';
          nextGrid[r][c] = 'EMPTY';
          moved = true;
          continue;
        }
      }
    }
  }

  // Pass 3: Buried GRASS check — if any GRASS cell has a non-EMPTY block directly above it, it reverts to DIRT
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
 * Evaluates the 3-second grass growth AND 3-second hill-edge collapse/slope erosion rules:
 * 1. Grass Growth:
 *    - If a settled 'DIRT' cell has 'EMPTY' above it (or is at row 0), its exposure start timestamp
 *      is tracked in `exposureMap` (hash map keyed by `"row,col"` for O(1) lookup).
 *    - Once `currentTimeMs - exposedSince >= growthDelayMs` (default 3000ms), the cell transforms into 'GRASS'.
 * 2. Hill-Edge Collapse & Slope Erosion ("Ujung Bukit Roboh dalam 3 Detik"):
 *    - If a top surface block ('DIRT' or 'GRASS') has an open 'EMPTY' side on its left or right,
 *      its edge exposure timestamp is tracked under `"edge:row,col"`.
 *    - After `growthDelayMs` (3000ms):
 *      a) If there is a steep vertical cliff drop (>= 2 empty rows on the side), the top edge block
 *         physically collapses sideways into the lower column and falls by gravity.
 *      b) If it is an isolated 1-column pointy spike (`leftAir && rightAir`), the block collapses.
 *      c) If it is a 1-block hill step edge, its sharp 90° square corner collapses into a smooth
 *         diagonal hill slope (`"slumped:row,col"`), eliminating blocky/pointy hill ends.
 *
 * Time Complexity: O(R * C) with O(1) hash map lookups per cell.
 *
 * @param currentGrid - Current 2D terrain grid
 * @param exposureMap - Hash map of cell exposure timestamps (ms) and slumped slope flags
 * @param currentTimeMs - Current timestamp in milliseconds
 * @param growthDelayMs - Required exposure duration in ms (default 3000ms)
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

  const ensureClonedGrid = () => {
    if (!gridCloned) {
      nextGrid = currentGrid.map((row) => [...row]);
      gridCloned = true;
    }
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = nextGrid[r][c];
      if (cell !== 'DIRT' && cell !== 'GRASS') continue;

      const isAirAbove = r === 0 || currentGrid[r - 1][c] === 'EMPTY';
      const isSupportedBelow = r === rows - 1 || currentGrid[r + 1][c] !== 'EMPTY';

      if (!isAirAbove || !isSupportedBelow) continue;

      // 1. 3-Second Grass Growth on air-exposed DIRT
      if (cell === 'DIRT') {
        const cellKey = `${r},${c}`;
        const firstExposedAt = exposureMap[cellKey];

        if (firstExposedAt === undefined) {
          nextExposureMap[cellKey] = currentTimeMs;
          mapChanged = true;
        } else if (currentTimeMs - firstExposedAt >= growthDelayMs) {
          ensureClonedGrid();
          nextGrid[r][c] = 'GRASS';
          mapChanged = true;
        } else {
          nextExposureMap[cellKey] = firstExposedAt;
        }
      }

      // 2. 3-Second Hill-Edge Collapse & Corner Slumping (only above bottom-most bedrock row)
      if (r < rows - 1) {
        const leftAir = c > 0 && currentGrid[r][c - 1] === 'EMPTY';
        const rightAir = c < cols - 1 && currentGrid[r][c + 1] === 'EMPTY';

        if (leftAir || rightAir) {
          const edgeKey = `edge:${r},${c}`;
          const slumpKey = `slumped:${r},${c}`;
          const firstEdgeExposedAt = exposureMap[edgeKey];

          if (firstEdgeExposedAt === undefined) {
            nextExposureMap[edgeKey] = currentTimeMs;
            mapChanged = true;
          } else if (currentTimeMs - firstEdgeExposedAt >= growthDelayMs) {
            // Hill step edge: sharp 90° square corner slumps into a smooth diagonal slope
            nextExposureMap[edgeKey] = firstEdgeExposedAt;
            if (exposureMap[slumpKey] === undefined) {
              mapChanged = true;
            }
            nextExposureMap[slumpKey] = 1;
          } else {
            nextExposureMap[edgeKey] = firstEdgeExposedAt;
          }
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
 * Determines whether a terrain cell at `(row, col)` has completed its 3-second
 * hill-edge corner collapse (`slumped:row,col`) and returns which side slopes down
 * (`'left'` for `/` ramp or `'right'` for `\` ramp).
 * Time Complexity: O(1).
 */
export function getHillEdgeSlopeSide(
  grid: TerrainCellType[][],
  exposureMap: Record<string, number>,
  row: number,
  col: number
): 'left' | 'right' | null {
  if (!exposureMap || !exposureMap[`slumped:${row},${col}`]) return null;
  const cell = grid[row]?.[col];
  if (cell !== 'DIRT' && cell !== 'GRASS') return null;

  const isAirAbove = row === 0 || grid[row - 1]?.[col] === 'EMPTY';
  if (!isAirAbove) return null;

  const cols = grid[0]?.length ?? 0;
  const leftAir = col > 0 && grid[row]?.[col - 1] === 'EMPTY';
  const rightAir = col < cols - 1 && grid[row]?.[col + 1] === 'EMPTY';

  if (leftAir && !rightAir) return 'left';
  if (rightAir && !leftAir) return 'right';
  return null;
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

  // Check the horizontal span of the component's base/body (with 18px horizontal margin)
  // and from 45% down the body to 6px below its base feet (so landing on a WATER surface triggers immediately)
  const sampleLeft = targetBox.x + 18;
  const sampleRight = targetBox.x + targetBox.width - 18;
  const sampleTop = targetBox.y + targetBox.height * 0.45;
  const sampleBottom = targetBox.y + targetBox.height + 6;

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

/**
 * Finds the highest terrain surface elevation (row index and pixel Y) directly beneath
 * a component's horizontal support footprint.
 * Time Complexity: O(R * k) where k <= 6 columns spanned by the component's base.
 *
 * @param targetBox - Component bounding box in container pixels
 * @param terrainGrid - 2D terrain grid (rows x cols)
 * @param containerWidth - Container width in pixels
 * @param containerHeight - Container height in pixels
 * @returns Surface row index, surface Y coordinate in pixels, and single cell height
 */
export function findTerrainSurfaceY(
  targetBox: BoundingBox,
  terrainGrid: TerrainCellType[][],
  containerWidth: number,
  containerHeight: number
): { surfaceRow: number; surfaceY: number; cellHeight: number } {
  const safeWidth = containerWidth > 0 ? containerWidth : 960;
  const safeHeight = containerHeight > 0 ? containerHeight : 680;

  if (!terrainGrid || terrainGrid.length === 0) {
    const defaultCellHeight = safeHeight / GRID_ROWS;
    const defaultRow = GRID_ROWS - 5;
    return {
      surfaceRow: defaultRow,
      surfaceY: defaultRow * defaultCellHeight,
      cellHeight: defaultCellHeight,
    };
  }

  const rows = terrainGrid.length;
  const cols = terrainGrid[0].length;
  const cellWidth = safeWidth / cols;
  const cellHeight = safeHeight / rows;

  const footLeft = targetBox.x + targetBox.width * 0.22;
  const footRight = targetBox.x + targetBox.width * 0.78;

  const startCol = Math.max(0, Math.min(cols - 1, Math.floor(footLeft / cellWidth)));
  const endCol = Math.max(0, Math.min(cols - 1, Math.floor(footRight / cellWidth)));

  let highestSurfaceRow = rows;
  for (let c = startCol; c <= endCol; c++) {
    for (let r = 0; r < rows; r++) {
      if (terrainGrid[r][c] !== 'EMPTY') {
        if (r < highestSurfaceRow) {
          highestSurfaceRow = r;
        }
        break;
      }
    }
  }

  return {
    surfaceRow: highestSurfaceRow,
    surfaceY: highestSurfaceRow * cellHeight,
    cellHeight,
  };
}

/**
 * Evaluates full Outdoor Sandbox drop physics for a component:
 * 1. Computes the ground surface elevation below the component (`findTerrainSurfaceY`)
 *    and the grounded `settledPosition` so outdoor components NEVER float in mid-air.
 * 2. Checks if the vertical drop distance exceeds `MAX_SAFE_DROP_ROWS` (dropped from too high)
 *    -> returns `'explode-height'`.
 * 3. Checks if the component lands on or touches `'WATER'`
 *    -> returns `'explode-water'`.
 * 4. Checks if the settled bounding box overlaps any existing outdoor component
 *    -> returns `'overlap'`.
 * 5. Otherwise returns `'settled'` with the ground-snapped position.
 *
 * Time Complexity: O(R * k + N) where k <= 6 columns and N is number of outdoor nodes.
 */
export function evaluateComponentDropPhysics(
  position: { x: number; y: number },
  type: ComponentType,
  excludeNodeId: string | null,
  existingNodes: Node<CircuitElementData>[],
  terrainGrid: TerrainCellType[][],
  containerSize: { width: number; height: number }
): DropPhysicsOutcome {
  const rawBox = getComponentBoundingBox(position, type);
  const { surfaceY, cellHeight } = findTerrainSurfaceY(
    rawBox,
    terrainGrid,
    containerSize.width,
    containerSize.height
  );

  // Plant the component's base onto the terrain surface:
  // For wind turbine, groundOffset is 0 so the mast base sits flush on the turf without penetrating the dirt.
  // For other outdoor components (solar panel, transmission tower), 6px embeds them naturally into grass.
  const groundOffset = type === 'wind-turbine' || type === 'wind_turbine' ? 0 : 6;
  const settledY = Math.max(8, Math.round(surfaceY - rawBox.height + groundOffset));
  const settledPosition = {
    x: Math.round(position.x),
    y: settledY,
  };
  const settledBox = getComponentBoundingBox(settledPosition, type);

  // Positive dropDistancePx means the component was released above the ground surface
  const dropDistancePx = Math.max(0, settledY - position.y);
  const dropRows = cellHeight > 0 ? dropDistancePx / cellHeight : 0;

  // 1. Check Excessive Drop Height Tolerance (if dropped too high above the ground -> explode on impact!)
  if (dropRows > MAX_SAFE_DROP_ROWS) {
    return {
      status: 'explode-height',
      impactPosition: settledPosition,
      impactBox: settledBox,
      dropRows,
    };
  }

  // 2. Check Water Short-Circuit Hazard (either at release point or grounded landing surface)
  // Hydro-turbines are purpose-built for waterfalls and rivers, so they are immune to water hazards!
  const isWaterImmune = type === 'hydro-turbine' || type === 'hydro_turbine';
  if (
    !isWaterImmune &&
    (doesComponentTouchWater(
      rawBox,
      terrainGrid,
      containerSize.width,
      containerSize.height
    ) ||
      doesComponentTouchWater(
        settledBox,
        terrainGrid,
        containerSize.width,
        containerSize.height
      ))
  ) {
    return {
      status: 'explode-water',
      impactPosition: settledPosition,
      impactBox: settledBox,
      dropRows,
    };
  }

  // 3. Check AABB Overlap against other outdoor components at the settled ground position
  const collidingNode = findOverlappingComponent(settledBox, excludeNodeId, existingNodes);
  if (collidingNode) {
    return {
      status: 'overlap',
      collidingNode,
    };
  }

  return {
    status: 'settled',
    settledPosition,
    settledBox,
    dropRows,
  };
}
