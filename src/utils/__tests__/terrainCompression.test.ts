/**
 * Unit Test Suite for RLE Terrain Compression (Nature Mode Phase 4).
 *
 * Verifies:
 * 1. Lossless roundtrip encoding and decoding across all terrain cell types.
 * 2. High compression ratio (>95% smaller than raw JSON).
 * 3. Defensive handling of malformed, truncated, or invalid strings.
 */

import { describe, it, expect } from 'vitest';
import { encodeTerrainGrid, decodeTerrainGrid } from '../terrainCompression';
import {
  createDefaultOutdoorTerrain,
  createEmptyTerrainGrid,
  GRID_COLS,
  GRID_ROWS,
} from '../../physics/terrainGrid';

describe('RLE Terrain Compression Engine (Nature Mode Phase 4)', () => {
  it('losslessly encodes and decodes default outdoor landscape (800 cells)', () => {
    const defaultGrid = createDefaultOutdoorTerrain(GRID_ROWS, GRID_COLS);
    const rle = encodeTerrainGrid(defaultGrid);

    expect(rle.length).toBeGreaterThan(0);
    // Compression check: raw JSON of 800 strings is ~5000 characters; RLE should be under 200 characters!
    expect(rle.length).toBeLessThan(200);

    const decoded = decodeTerrainGrid(rle, GRID_ROWS, GRID_COLS);
    expect(decoded).toHaveLength(GRID_ROWS);
    expect(decoded[0]).toHaveLength(GRID_COLS);

    // Verify cell-by-cell equality
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        expect(decoded[r][c]).toBe(defaultGrid[r][c]);
      }
    }
  });

  it('correctly handles all 5 terrain cell types including WATER_SPRING', () => {
    const customGrid = createEmptyTerrainGrid(20, 40);
    customGrid[0][0] = 'EMPTY';
    customGrid[5][10] = 'WATER_SPRING';
    customGrid[10][20] = 'WATER';
    customGrid[15][30] = 'GRASS';
    customGrid[19][39] = 'DIRT';

    const rle = encodeTerrainGrid(customGrid);
    expect(rle).toContain('S'); // Spring
    expect(rle).toContain('W'); // Water
    expect(rle).toContain('G'); // Grass
    expect(rle).toContain('D'); // Dirt
    expect(rle).toContain('E'); // Empty

    const decoded = decodeTerrainGrid(rle, 20, 40);
    expect(decoded[5][10]).toBe('WATER_SPRING');
    expect(decoded[10][20]).toBe('WATER');
    expect(decoded[15][30]).toBe('GRASS');
    expect(decoded[19][39]).toBe('DIRT');
  });

  it('safely handles empty, null, or corrupt RLE strings without throwing', () => {
    const emptyDecoded = decodeTerrainGrid('');
    expect(emptyDecoded).toHaveLength(GRID_ROWS);
    expect(emptyDecoded[0][0]).toBe('EMPTY');

    const nullDecoded = decodeTerrainGrid(null);
    expect(nullDecoded).toHaveLength(GRID_ROWS);

    const corruptDecoded = decodeTerrainGrid('XYZ999@@@');
    expect(corruptDecoded).toHaveLength(GRID_ROWS);
  });
});
