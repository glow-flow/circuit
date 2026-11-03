/**
 * Circuit Sandbox - Run-Length Encoded (RLE) Terrain Grid Compression (Nature Mode Phase 4).
 *
 * Implements lossless, ultra-compact terrain serialization for share URLs (`#circuit=...`)
 * and local storage backups:
 *
 * Cell Type Mapping:
 * - 'EMPTY'        -> 'E'
 * - 'DIRT'         -> 'D'
 * - 'GRASS'        -> 'G'
 * - 'WATER'        -> 'W'
 * - 'WATER_SPRING' -> 'S'
 *
 * Format:
 * Consecutive identical cells are compressed into `<count><char>` tokens.
 * Example: `400E40G120D10W230D` (~25-50 chars vs ~5000 chars for raw JSON array).
 * Yields >99% compression ratio, fitting comfortably into URL hash limits.
 *
 * Time & Space Complexity Analysis:
 * - encodeTerrainGrid: O(R * C) strictly linear time (800 iterations for 40x20 grid).
 * - decodeTerrainGrid: O(R * C) strictly linear time.
 * - Memory allocation: O(R * C) for the reconstructed 2D array.
 */

import { TerrainCellType } from '../types/circuit';
import { GRID_COLS, GRID_ROWS, createEmptyTerrainGrid } from '../physics/terrainGrid';

const CELL_TO_CHAR: Record<TerrainCellType, string> = {
  EMPTY: 'E',
  DIRT: 'D',
  GRASS: 'G',
  WATER: 'W',
  WATER_SPRING: 'S',
};

const CHAR_TO_CELL: Record<string, TerrainCellType> = {
  E: 'EMPTY',
  D: 'DIRT',
  G: 'GRASS',
  W: 'WATER',
  S: 'WATER_SPRING',
};

/**
 * Encodes a 2D terrain grid into an ultra-compact Run-Length Encoded (RLE) string.
 *
 * Time Complexity: O(R * C) linear time (800 iterations for 40x20 grid).
 *
 * @param grid - 2D terrain grid (array of rows)
 * @returns RLE encoded string (e.g. `360E40G240D160W`)
 */
export function encodeTerrainGrid(grid: TerrainCellType[][]): string {
  if (!grid || grid.length === 0 || !grid[0] || grid[0].length === 0) {
    return '';
  }

  const rows = grid.length;
  const cols = grid[0].length;

  let rle = '';
  let currentChar: string | null = null;
  let currentRunLength = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      const char = CELL_TO_CHAR[cell] ?? 'E';

      if (char === currentChar) {
        currentRunLength++;
      } else {
        if (currentChar !== null && currentRunLength > 0) {
          rle += `${currentRunLength}${currentChar}`;
        }
        currentChar = char;
        currentRunLength = 1;
      }
    }
  }

  if (currentChar !== null && currentRunLength > 0) {
    rle += `${currentRunLength}${currentChar}`;
  }

  return rle;
}

/**
 * Decodes an RLE string back into a 2D terrain grid of dimensions `rows x cols`.
 * Defensively handles malformed strings, corrupt lengths, or empty inputs.
 *
 * Time Complexity: O(R * C) linear time.
 *
 * @param rleString - RLE encoded string
 * @param rows - Target row count (default GRID_ROWS = 20)
 * @param cols - Target column count (default GRID_COLS = 40)
 * @returns Reconstructed 2D terrain grid
 */
export function decodeTerrainGrid(
  rleString: string | undefined | null,
  rows: number = GRID_ROWS,
  cols: number = GRID_COLS
): TerrainCellType[][] {
  const targetCells = rows * cols;
  const flatCells: TerrainCellType[] = [];

  if (!rleString || typeof rleString !== 'string') {
    return createEmptyTerrainGrid(rows, cols);
  }

  // Regex matches pairs of <number><letter> e.g. "400E", "20D"
  const tokenRegex = /(\d+)([EDGWS])/g;
  let match: RegExpExecArray | null;

  try {
    while ((match = tokenRegex.exec(rleString)) !== null) {
      const count = parseInt(match[1], 10);
      const char = match[2];
      const cellType = CHAR_TO_CELL[char] ?? 'EMPTY';

      const safeCount = Math.max(0, Math.min(targetCells - flatCells.length, count));
      for (let i = 0; i < safeCount; i++) {
        flatCells.push(cellType);
      }

      if (flatCells.length >= targetCells) break;
    }
  } catch {
    // If parsing fails, fall back gracefully
    return createEmptyTerrainGrid(rows, cols);
  }

  // Pad remaining cells with 'EMPTY' if RLE was truncated
  while (flatCells.length < targetCells) {
    flatCells.push('EMPTY');
  }

  // Reshape 1D array into 2D grid
  const grid: TerrainCellType[][] = [];
  for (let r = 0; r < rows; r++) {
    const rowCells = flatCells.slice(r * cols, (r + 1) * cols);
    grid.push(rowCells);
  }

  return grid;
}
