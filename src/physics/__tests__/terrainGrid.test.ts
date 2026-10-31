import { describe, it, expect } from 'vitest';
import {
  createEmptyTerrainGrid,
  createDefaultOutdoorTerrain,
  stepTerrainGravity,
  settleTerrainGravityImmediate,
  evaluateGrassGrowth,
  getComponentBoundingBox,
  getHillEdgeSlopeSide,
  findOverlappingComponent,
  doesComponentTouchWater,
  evaluateComponentDropPhysics,
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

  it('coalesces hollow gaps ("bolong") inside a water pool via liquid cellular automata', () => {
    const grid = createEmptyTerrainGrid(6, 6);
    // Solid dirt floor at row 5
    for (let c = 0; c < 6; c++) grid[5][c] = 'DIRT';
    // Water pool at row 4 with a hole at col 2: WATER | WATER | EMPTY | WATER
    grid[4][1] = 'WATER';
    grid[4][2] = 'EMPTY';
    grid[4][3] = 'WATER';

    const { nextGrid, moved } = stepTerrainGravity(grid);
    expect(moved).toBe(true);
    expect(nextGrid[4][2]).toBe('WATER');
  });

  it('settles safe drops onto the ground surface and explodes drops from excessive height', () => {
    const grid = createDefaultOutdoorTerrain(20, 40);
    const containerSize = { width: 800, height: 400 }; // 20px per row

    // Safe drop just above ground (y = 110) -> settles onto ground surface
    const safeOutcome = evaluateComponentDropPhysics(
      { x: 60, y: 110 },
      'solar-panel',
      null,
      [],
      grid,
      containerSize
    );
    expect(safeOutcome.status).toBe('settled');
    if (safeOutcome.status === 'settled') {
      expect(safeOutcome.settledPosition.y).toBeGreaterThan(110);
    }

    // Excessive height drop near top of sky (y = 5) -> explodes on impact!
    const highDropOutcome = evaluateComponentDropPhysics(
      { x: 60, y: 5 },
      'solar-panel',
      null,
      [],
      grid,
      containerSize
    );
    expect(highDropOutcome.status).toBe('explode-height');
  });

  it('collapses sharp square hill edges into smooth diagonal slopes after 3 seconds and crumbles steep cliffs', () => {
    const grid = createDefaultOutdoorTerrain(20, 40);
    const t0 = 5000;

    // 1. At t0 (0s): hill left edge (14, 4) and right edge (14, 11) are still square blocks
    const firstPass = evaluateGrassGrowth(grid, {}, t0, GRASS_GROWTH_DELAY_MS);
    expect(getHillEdgeSlopeSide(firstPass.nextGrid, firstPass.nextExposureMap, 14, 4)).toBeNull();
    expect(getHillEdgeSlopeSide(firstPass.nextGrid, firstPass.nextExposureMap, 14, 11)).toBeNull();

    // 2. At t0 + 3000ms (3s): hill left edge (14, 4) slumps to 'left' slope (/) and right edge (14, 11) slumps to 'right' slope (\)
    const after3s = evaluateGrassGrowth(
      firstPass.nextGrid,
      firstPass.nextExposureMap,
      t0 + 3000,
      GRASS_GROWTH_DELAY_MS
    );
    expect(getHillEdgeSlopeSide(after3s.nextGrid, after3s.nextExposureMap, 14, 4)).toBe('left');
    expect(getHillEdgeSlopeSide(after3s.nextGrid, after3s.nextExposureMap, 14, 11)).toBe('right');
    // Interior hill cell (14, 7) remains flat (null)
    expect(getHillEdgeSlopeSide(after3s.nextGrid, after3s.nextExposureMap, 14, 7)).toBeNull();
  });

  it('settles wind turbine flush with the ground surface without penetrating into the dirt layer', () => {
    const grid = createDefaultOutdoorTerrain(20, 40);
    const containerSize = { width: 1360, height: 680 }; // 34px per row
    const cellHeight = 680 / 20; // 34px

    // Verify calibrated bounding box matches DOM rendered height (260px)
    const turbineBox = getComponentBoundingBox({ x: 290, y: 100 }, 'wind-turbine');
    expect(turbineBox.height).toBe(260);

    const outcome = evaluateComponentDropPhysics(
      { x: 290, y: 150 },
      'wind-turbine',
      null,
      [],
      grid,
      containerSize
    );

    expect(outcome.status).toBe('settled');
    if (outcome.status === 'settled') {
      const settledBottom = outcome.settledPosition.y + turbineBox.height;
      // In default terrain at col ~8..11 (x=290), surface elevation is row 14 (hill) or row 15 (flat)
      // Surface elevation Y in pixels = surfaceRow * cellHeight
      const expectedSurfaceY = Math.round(14 * cellHeight); // ~476px

      // The base of the turbine mast must rest exactly on surfaceY without sinking into the dirt row below
      expect(Math.abs(settledBottom - expectedSurfaceY)).toBeLessThanOrEqual(2);
      expect(settledBottom).toBeLessThan(expectedSurfaceY + 10);
    }
  });
});
