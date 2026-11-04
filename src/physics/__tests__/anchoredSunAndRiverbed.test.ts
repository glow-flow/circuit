import { describe, it, expect } from 'vitest';
import {
  createDefaultOutdoorTerrain,
  evaluateComponentDropPhysics,
  getComponentBoundingBox,
  GRID_COLS,
  GRID_ROWS,
} from '../terrainGrid';
import {
  cast1DTopographicShadowRay,
  computeTerrainShadowPolygons,
  getAnchoredSunPosition,
  SunPosition,
} from '../terrainClimateEngine';
import { measureSubmergedDepthPx } from '../hydroPhysics';

const STAGE_WIDTH = 1360;
const STAGE_HEIGHT = 680;
const CELL = STAGE_WIDTH / GRID_COLS; // 34px

function buildTerrainWithCliffAtColumn(cliffCol: number) {
  const grid = createDefaultOutdoorTerrain(GRID_ROWS, GRID_COLS);
  for (let r = 6; r < GRID_ROWS; r++) {
    grid[r][cliffCol] = 'DIRT';
  }
  return grid;
}

describe('World-anchored sun (shadow follows the visible sun disc)', () => {
  const panelX = 10 * CELL + CELL / 2;
  const panelReceiverY = 14 * CELL - 156 + 6 + 156 * 0.45;

  it('shades a panel when the cliff sits between it and the sun', () => {
    const grid = buildTerrainWithCliffAtColumn(6);
    const ray = cast1DTopographicShadowRay(
      panelX,
      panelReceiverY,
      grid,
      getAnchoredSunPosition('morning'),
      STAGE_WIDTH,
      STAGE_HEIGHT
    );
    expect(ray.isShaded).toBe(true);
    expect(ray.blockingCol).toBe(6);
  });

  it('un-shades the panel once the sun has moved to the far side of it', () => {
    const grid = buildTerrainWithCliffAtColumn(6);
    const sunBehindPanel: SunPosition = {
      elevationDeg: 35,
      azimuthDeg: 90,
      worldXRatio: 0.5,
      worldYPx: 120,
    };
    const ray = cast1DTopographicShadowRay(
      panelX,
      panelReceiverY,
      grid,
      sunBehindPanel,
      STAGE_WIDTH,
      STAGE_HEIGHT
    );
    expect(ray.isShaded).toBe(false);
  });

  it('ignores cliffs located beyond the sun disc itself', () => {
    const grid = buildTerrainWithCliffAtColumn(6);
    const sunBetweenCliffAndPanel: SunPosition = {
      elevationDeg: 35,
      azimuthDeg: 90,
      worldXRatio: 300 / STAGE_WIDTH,
      worldYPx: 120,
    };
    const ray = cast1DTopographicShadowRay(
      panelX,
      panelReceiverY,
      grid,
      sunBetweenCliffAndPanel,
      STAGE_WIDTH,
      STAGE_HEIGHT
    );
    expect(ray.isShaded).toBe(false);
  });

  it('keeps legacy angle-only presets unchanged (no world anchor)', () => {
    const grid = buildTerrainWithCliffAtColumn(6);
    const ray = cast1DTopographicShadowRay(
      panelX,
      panelReceiverY,
      grid,
      'morning',
      STAGE_WIDTH,
      STAGE_HEIGHT
    );
    expect(ray.isShaded).toBe(true);
  });
});

describe('Terrain shadow bands', () => {
  it('hugs the ground surface instead of filling columns down to the world floor', () => {
    const grid = buildTerrainWithCliffAtColumn(6);
    const polygons = computeTerrainShadowPolygons(
      grid,
      STAGE_WIDTH,
      STAGE_HEIGHT,
      getAnchoredSunPosition('morning')
    );
    expect(polygons.length).toBeGreaterThan(0);
    for (const polygon of polygons) {
      const yValues = [...polygon.pathData.matchAll(/(?:M|L) [\d.]+ ([\d.]+)/g)].map((m) =>
        Number(m[1])
      );
      const tallestBand = Math.max(...yValues) - Math.min(...yValues);
      // surface profile range plus band thickness; never the full 680px column
      expect(tallestBand).toBeLessThan(STAGE_HEIGHT * 0.6);
    }
  });
});

describe('Micro-hydro turbine rests on the riverbed', () => {
  it('settles on the riverbed (not on the water surface) and reports its submerged depth', () => {
    const grid = createDefaultOutdoorTerrain(GRID_ROWS, GRID_COLS);
    const outcome = evaluateComponentDropPhysics(
      { x: 900, y: 300 },
      'hydro-turbine',
      null,
      [],
      grid,
      { width: STAGE_WIDTH, height: STAGE_HEIGHT }
    );
    expect(outcome.status).toBe('settled');
    if (outcome.status !== 'settled') return;

    const box = getComponentBoundingBox(outcome.settledPosition, 'hydro-turbine');
    const riverbedY = 18 * CELL; // river bed starts at row 18
    expect(box.y + box.height).toBe(riverbedY);

    const waterSurfaceY = 15 * CELL;
    expect(measureSubmergedDepthPx(box, grid, STAGE_WIDTH, STAGE_HEIGHT)).toBe(
      riverbedY - waterSurfaceY
    );
  });

  it('reports zero submersion on dry land', () => {
    const grid = createDefaultOutdoorTerrain(GRID_ROWS, GRID_COLS);
    const box = getComponentBoundingBox({ x: 200, y: 200 }, 'hydro-turbine');
    expect(measureSubmergedDepthPx(box, grid, STAGE_WIDTH, STAGE_HEIGHT)).toBe(0);
  });

  it('has a footprint large enough to read clearly next to the other generators', () => {
    const hydro = getComponentBoundingBox({ x: 0, y: 0 }, 'hydro-turbine');
    const solar = getComponentBoundingBox({ x: 0, y: 0 }, 'solar-panel');
    expect(hydro.width).toBeGreaterThanOrEqual(200);
    expect(hydro.height).toBeGreaterThanOrEqual(solar.height);
  });
});
