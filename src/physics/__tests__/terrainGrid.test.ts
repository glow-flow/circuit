import { describe, it, expect } from 'vitest';
import {
  createEmptyTerrainGrid,
  createDefaultOutdoorTerrain,
  stepTerrainGravity,
  settleTerrainGravityImmediate,
  evaluateGrassGrowth,
  getComponentBoundingBox,
  findOverlappingComponent,
  doesComponentTouchWater,
  GRID_COLS,
  GRID_ROWS,
  GRASS_GROWTH_DELAY_MS,
} from '../terrainGrid';
import { Node } from 'reactflow';
import { CircuitElementData } from '../../types/circuit';

describe('Outdoor Sandbox Terrain Physics & Spatial Collision Engine', () => {
  it('initializes a 40x20 default outdoor terrain with GRASS, DIRT, and WATER', () => {
    const grid = createDefaultOutdoorTerrain();
    expect(grid.length).toBe(GRID_ROWS);
    expect(grid[0].length).toBe(GRID_COLS);

    const flatCells = grid.flat();
    expect(flatCells.includes('DIRT')).toBe(true);
    expect(flatCells.includes('GRASS')).toBe(true);
    expect(flatCells.includes('WATER')).toBe(true);
  });

  it('applies gravity so airborne DIRT and WATER fall to the bottom', () => {
    const grid = createEmptyTerrainGrid(6, 6);
    grid[1][2] = 'DIRT';
    grid[0][4] = 'WATER';

    // Step-by-step gravity
    const step1 = stepTerrainGravity(grid);
    expect(step1.moved).toBe(true);
    expect(step1.nextGrid[2][2]).toBe('DIRT');
    expect(step1.nextGrid[1][4]).toBe('WATER');

    // Immediate full gravity settle
    const settled = settleTerrainGravityImmediate(grid);
    expect(settled[5][2]).toBe('DIRT');
    expect(settled[5][4]).toBe('WATER');
    expect(settled[1][2]).toBe('EMPTY');
  });

  it('grows GRASS on air-exposed settled DIRT after 3 seconds (3000ms)', () => {
    const grid = createEmptyTerrainGrid(5, 5);
    grid[4][2] = 'DIRT'; // Settled on bottom row, exposed to EMPTY at row 3

    const t0 = 1000;
    const firstEval = evaluateGrassGrowth(grid, {}, t0, GRASS_GROWTH_DELAY_MS);
    expect(firstEval.nextGrid[4][2]).toBe('DIRT');
    expect(firstEval.nextExposureMap['4,2']).toBe(t0);

    // At 2.5 seconds -> still DIRT
    const midEval = evaluateGrassGrowth(
      firstEval.nextGrid,
      firstEval.nextExposureMap,
      t0 + 2500,
      GRASS_GROWTH_DELAY_MS
    );
    expect(midEval.nextGrid[4][2]).toBe('DIRT');

    // At 3.0 seconds -> transforms into GRASS!
    const finalEval = evaluateGrassGrowth(
      midEval.nextGrid,
      midEval.nextExposureMap,
      t0 + 3000,
      GRASS_GROWTH_DELAY_MS
    );
    expect(finalEval.nextGrid[4][2]).toBe('GRASS');
  });

  it('detects bounding box overlap between outdoor power components', () => {
    const existingNodes: Node<CircuitElementData>[] = [
      {
        id: 'solar_1',
        type: 'solar-panel',
        position: { x: 100, y: 150 },
        data: {
          id: 'solar_1',
          type: 'solar-panel',
          worldMode: 'outside',
          label: 'Panel Surya',
        },
      },
    ];

    const overlappingBox = getComponentBoundingBox({ x: 130, y: 170 }, 'wind-turbine');
    const clearBox = getComponentBoundingBox({ x: 400, y: 150 }, 'wind-turbine');

    expect(findOverlappingComponent(overlappingBox, null, existingNodes)?.id).toBe('solar_1');
    expect(findOverlappingComponent(clearBox, null, existingNodes)).toBeNull();
  });

  it('detects when a dropped component touches a WATER cell in the terrain grid', () => {
    const grid = createEmptyTerrainGrid(20, 40);
    // Place WATER at row 16..18, col 20..25
    for (let r = 16; r <= 18; r++) {
      for (let c = 20; c <= 25; c++) {
        grid[r][c] = 'WATER';
      }
    }

    const containerWidth = 800; // 20px per col
    const containerHeight = 400; // 20px per row

    // Drop solar panel over cols 20..25 (x = 410, y = 180 -> bottom ~ 395 -> rows 9..19)
    const waterDropBox = getComponentBoundingBox({ x: 410, y: 180 }, 'solar-panel');
    expect(doesComponentTouchWater(waterDropBox, grid, containerWidth, containerHeight)).toBe(true);

    // Drop solar panel on dry land (x = 40, y = 100)
    const dryDropBox = getComponentBoundingBox({ x: 40, y: 100 }, 'solar-panel');
    expect(doesComponentTouchWater(dryDropBox, grid, containerWidth, containerHeight)).toBe(false);
  });
});
