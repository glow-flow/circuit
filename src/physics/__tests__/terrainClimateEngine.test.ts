import { describe, it, expect } from 'vitest';
import { Node } from 'reactflow';
import { CircuitElementData } from '../../types/circuit';
import {
  createDefaultOutdoorTerrain,
  createEmptyTerrainGrid,
  GRID_COLS,
  GRID_ROWS,
} from '../terrainGrid';
import {
  applyTerrainMicroclimateToNodes,
  calculateAerodynamicWindPower,
  calculateOrographicWindShear,
  cast1DTopographicShadowRay,
  computeTerrainShadowPolygons,
  DIFFUSE_SHADING_RATIO,
  getTerrainHeightmap,
  resolveSunPosition,
  SUN_PRESETS,
  TERRAIN_BASELINE_ROW,
} from '../terrainClimateEngine';
import { useCircuitStore } from '../../store/useCircuitStore';

describe('Terrain-Coupled Microclimate Engine (Nature Mode Phase 2)', () => {
  describe('SunPosition & Time of Day Presets', () => {
    it('resolves preset time-of-day modes correctly', () => {
      expect(resolveSunPosition('morning')).toEqual(SUN_PRESETS.morning);
      expect(resolveSunPosition('noon')).toEqual(SUN_PRESETS.noon);
      expect(resolveSunPosition('afternoon')).toEqual(SUN_PRESETS.afternoon);
      expect(resolveSunPosition(null)).toEqual(SUN_PRESETS.morning);
    });

    it('validates and clamps custom sun positions safely', () => {
      const custom = resolveSunPosition({ elevationDeg: 120, azimuthDeg: 450 });
      expect(custom.elevationDeg).toBe(90); // clamped to 90
      expect(custom.azimuthDeg).toBe(90); // 450 % 360 = 90
    });
  });

  describe('Terrain Heightmap Extraction', () => {
    it('accurately extracts top solid ground row per column', () => {
      const grid = createEmptyTerrainGrid(GRID_ROWS, GRID_COLS);
      // Build a hill at column 5 rising to row 8
      for (let r = 8; r < GRID_ROWS; r++) {
        grid[r][5] = r === 8 ? 'GRASS' : 'DIRT';
      }
      // Leave column 10 empty
      const heightmap = getTerrainHeightmap(grid);
      expect(heightmap[5]).toBe(8);
      expect(heightmap[10]).toBe(GRID_ROWS); // Empty column
    });

    it('handles empty or malformed grids safely', () => {
      const heightmap = getTerrainHeightmap([]);
      expect(heightmap).toHaveLength(GRID_COLS);
      expect(heightmap[0]).toBe(TERRAIN_BASELINE_ROW);
    });
  });

  describe('Orographic Wind Shear (Hellmann Power Law)', () => {
    const baselineY = 510; // row 15 * 34px

    it('calculates 1.0x nominal speed (0% bonus) on flatland baseline', () => {
      const result = calculateOrographicWindShear(50, baselineY, baselineY);
      expect(result.shearFactor).toBeCloseTo(1.0, 3);
      expect(result.effectiveSpeed).toBe(50);
      expect(result.elevationBonusPercent).toBe(0);
      expect(result.isHilltop).toBe(false);
      expect(result.isValley).toBe(false);
      expect(result.effectiveVoltage).toBe(6.0); // (50 / 100) * 12.0
    });

    it('applies Hellmann wind shear elevation bonus on a hilltop (+45% RPM & Power)', () => {
      // 8 blocks higher: deltaY = 272px -> (1 + 272 / 180)^0.4 ≈ 1.446 (~ +45%)
      const hilltopSurfaceY = baselineY - 272;
      const result = calculateOrographicWindShear(50, hilltopSurfaceY, baselineY);

      expect(result.shearFactor).toBeGreaterThan(1.4);
      expect(result.elevationBonusPercent).toBeGreaterThanOrEqual(44);
      expect(result.elevationBonusPercent).toBeLessThanOrEqual(46);
      expect(result.effectiveSpeed).toBeGreaterThan(70);
      expect(result.isHilltop).toBe(true);
      expect(result.isValley).toBe(false);
      expect(result.effectiveVoltage).toBeGreaterThan(8.5);
    });

    it('applies wind reduction penalty in low valleys / basins', () => {
      // 3 blocks below baseline: deltaY = -102px -> (1 - 102 / 180)^0.4 ≈ 0.716 (-28%)
      const valleySurfaceY = baselineY + 102;
      const result = calculateOrographicWindShear(50, valleySurfaceY, baselineY);

      expect(result.shearFactor).toBeLessThan(0.75);
      expect(result.elevationBonusPercent).toBeLessThanOrEqual(-27);
      expect(result.effectiveSpeed).toBeLessThan(40);
      expect(result.isHilltop).toBe(false);
      expect(result.isValley).toBe(true);
      expect(result.effectiveVoltage).toBeLessThan(4.5);
    });

    it('robustly handles extreme dug pits without NaN or imaginary numbers', () => {
      // Extreme pit deltaY = -500px -> 1 + (-500)/180 < 0
      const extremePitY = baselineY + 500;
      const result = calculateOrographicWindShear(100, extremePitY, baselineY);

      expect(Number.isFinite(result.effectiveSpeed)).toBe(true);
      expect(result.effectiveSpeed).toBeGreaterThan(0);
      expect(Number.isFinite(result.effectiveVoltage)).toBe(true);
    });

    it('scales aerodynamic power with the cube of effective wind speed (P ~ v_eff^3)', () => {
      const power50 = calculateAerodynamicWindPower(50, 24); // (0.5)^3 * 24 = 0.125 * 24 = 3W
      const power100 = calculateAerodynamicWindPower(100, 24); // (1.0)^3 * 24 = 24W

      expect(power50).toBeCloseTo(3.0, 1);
      expect(power100).toBeCloseTo(24.0, 1);
      // Doubling wind speed increases aerodynamic power by 8x (2^3)
      expect(power100 / power50).toBeCloseTo(8.0, 1);
    });
  });

  describe('1D Topographic Ray-Casting Shadowing', () => {
    const containerWidth = 1360;
    const containerHeight = 680;
    const cellWidth = containerWidth / GRID_COLS; // 34px
    const cellHeight = containerHeight / GRID_ROWS; // 34px

    it('detects unobstructed sunlight when there are no hills', () => {
      const grid = createDefaultOutdoorTerrain(GRID_ROWS, GRID_COLS);
      // Position solar panel on flat terrain at column 1 (x = 34, y = 510)
      const ray = cast1DTopographicShadowRay(
        34,
        510,
        grid,
        'morning',
        containerWidth,
        containerHeight
      );

      expect(ray.isShaded).toBe(false);
      expect(ray.effectiveSunlightRatio).toBe(1.0);
    });

    it('detects when an elevated dirt hill obstructs morning sunlight and drops irradiance to 15%', () => {
      const grid = createDefaultOutdoorTerrain(GRID_ROWS, GRID_COLS);
      // Build a tall dirt cliff at column 6 (rows 6..19, peak at row 6)
      for (let r = 6; r < GRID_ROWS; r++) {
        grid[r][6] = 'DIRT';
      }

      // Grounded solar panel at column 10 (ground surface row 14 = 476px, settledY = 326px, receiverY = 396px)
      const targetX = 10 * cellWidth + cellWidth / 2; // 357px
      const receiverY = (14 * cellHeight - 156 + 6) + 156 * 0.45; // 396.2px

      const ray = cast1DTopographicShadowRay(
        targetX,
        receiverY,
        grid,
        'morning', // morning sun from East/Left at 35°
        containerWidth,
        containerHeight
      );

      expect(ray.isShaded).toBe(true);
      expect(ray.blockingCol).toBe(6);
      expect(ray.effectiveSunlightRatio).toBe(DIFFUSE_SHADING_RATIO); // 0.15
    });

    it('allows solar panels on top of the hill to remain completely unshaded', () => {
      const grid = createDefaultOutdoorTerrain(GRID_ROWS, GRID_COLS);
      // Build a tall dirt cliff at column 6 (rows 6..19)
      for (let r = 6; r < GRID_ROWS; r++) {
        grid[r][6] = 'DIRT';
      }

      // Place solar panel ON TOP of the cliff at column 6 (ground surface row 6 = 204px)
      const targetX = 6 * cellWidth + cellWidth / 2;
      const receiverY = (6 * cellHeight - 156 + 6) + 156 * 0.45;

      const ray = cast1DTopographicShadowRay(
        targetX,
        receiverY,
        grid,
        'morning',
        containerWidth,
        containerHeight
      );

      expect(ray.isShaded).toBe(false);
      expect(ray.effectiveSunlightRatio).toBe(1.0);
    });

    it('un-shades the solar panel when sun reaches noon high overhead (75°)', () => {
      const grid = createDefaultOutdoorTerrain(GRID_ROWS, GRID_COLS);
      // Hill at column 6
      for (let r = 6; r < GRID_ROWS; r++) {
        grid[r][6] = 'DIRT';
      }

      const targetX = 10 * cellWidth + cellWidth / 2;
      const receiverY = (14 * cellHeight - 156 + 6) + 156 * 0.45;

      // In the morning, panel at column 10 was shaded
      const morningRay = cast1DTopographicShadowRay(
        targetX,
        receiverY,
        grid,
        'morning',
        containerWidth,
        containerHeight
      );
      expect(morningRay.isShaded).toBe(true);

      // At noon (75°), the sun ray is steep enough to clear the hill!
      const noonRay = cast1DTopographicShadowRay(
        targetX,
        receiverY,
        grid,
        'noon',
        containerWidth,
        containerHeight
      );
      expect(noonRay.isShaded).toBe(false);
      expect(noonRay.effectiveSunlightRatio).toBe(1.0);
    });

    it('reverses shadow obstruction direction during afternoon sun (270°)', () => {
      const grid = createDefaultOutdoorTerrain(GRID_ROWS, GRID_COLS);
      // Build tall cliff at column 15 (to the right of panel at column 10)
      for (let r = 6; r < GRID_ROWS; r++) {
        grid[r][15] = 'DIRT';
      }

      const targetX = 10 * cellWidth + cellWidth / 2;
      const receiverY = (14 * cellHeight - 156 + 6) + 156 * 0.45;

      // Morning sun comes from left (col 0): hill at col 15 does NOT block morning sun!
      const morningRay = cast1DTopographicShadowRay(
        targetX,
        receiverY,
        grid,
        'morning',
        containerWidth,
        containerHeight
      );
      expect(morningRay.isShaded).toBe(false);

      // Afternoon sun comes from right (col 39): hill at col 15 BLOCKS afternoon sun!
      const afternoonRay = cast1DTopographicShadowRay(
        targetX,
        receiverY,
        grid,
        'afternoon',
        containerWidth,
        containerHeight
      );
      expect(afternoonRay.isShaded).toBe(true);
      expect(afternoonRay.blockingCol).toBe(15);
    });

    it('returns isShaded: true when sun is at or below the horizon (night)', () => {
      const grid = createDefaultOutdoorTerrain(GRID_ROWS, GRID_COLS);
      const nightRay = cast1DTopographicShadowRay(
        340,
        490,
        grid,
        { elevationDeg: 0, azimuthDeg: 90 },
        containerWidth,
        containerHeight
      );
      expect(nightRay.isShaded).toBe(true);
      expect(nightRay.effectiveSunlightRatio).toBe(0);
    });

    it('detects that a solar panel buried underground in its own column is shaded', () => {
      const grid = createDefaultOutdoorTerrain(GRID_ROWS, GRID_COLS);
      // Bury column 10 under ground up to row 5 (170px)
      for (let r = 5; r < GRID_ROWS; r++) {
        grid[r][10] = 'DIRT';
      }

      // Receiver at Y = 400px is buried 230px under the dirt surface at row 5 (170px)
      const buriedRay = cast1DTopographicShadowRay(
        10 * cellWidth + cellWidth / 2,
        400,
        grid,
        'noon',
        containerWidth,
        containerHeight
      );
      expect(buriedRay.isShaded).toBe(true);
      expect(buriedRay.blockingCol).toBe(10);
      expect(buriedRay.effectiveSunlightRatio).toBe(DIFFUSE_SHADING_RATIO);
    });

    it('safely handles empty or malformed terrain grid without division by zero', () => {
      const emptyRay = cast1DTopographicShadowRay(
        300,
        300,
        [],
        'morning',
        containerWidth,
        containerHeight
      );
      expect(emptyRay.isShaded).toBe(false);
      expect(emptyRay.effectiveSunlightRatio).toBe(1.0);
    });

    it('detects that a steep slot canyon / deep trench blocks noon sun (75°)', () => {
      const grid = createDefaultOutdoorTerrain(GRID_ROWS, GRID_COLS);
      // Canyon floor at column 10 (row 15 = 510px, receiver at 490px)
      // Tall canyon walls at column 9 and 11 up to row 3 (102px)
      for (let r = 3; r < GRID_ROWS; r++) {
        grid[r][9] = 'DIRT';
        grid[r][11] = 'DIRT';
      }

      // 1 block away (34px) with wall 388px high gives wall angle ~85° which blocks 75° noon ray
      const canyonRay = cast1DTopographicShadowRay(
        10 * cellWidth + cellWidth / 2,
        490,
        grid,
        'noon',
        containerWidth,
        containerHeight
      );
      expect(canyonRay.isShaded).toBe(true);
      expect(canyonRay.effectiveSunlightRatio).toBe(DIFFUSE_SHADING_RATIO);
    });
  });

  describe('Terrain Shadow Polygons', () => {
    it('generates valid SVG shadow polygon paths when hills exist', () => {
      const grid = createDefaultOutdoorTerrain(GRID_ROWS, GRID_COLS);
      // Tall hill at column 10
      for (let r = 5; r < GRID_ROWS; r++) {
        grid[r][10] = 'DIRT';
      }

      const polygons = computeTerrainShadowPolygons(grid, 1360, 680, 'morning');
      expect(polygons.length).toBeGreaterThan(0);
      expect(polygons[0].pathData).toContain('M ');
      expect(polygons[0].pathData).toContain(' Z');
    });

    it('returns empty array when sun is at vertical noon zenith (90°)', () => {
      const grid = createDefaultOutdoorTerrain(GRID_ROWS, GRID_COLS);
      const polygons = computeTerrainShadowPolygons(
        grid,
        1360,
        680,
        { elevationDeg: 90, azimuthDeg: 180 }
      );
      expect(polygons).toHaveLength(0);
    });

    it('generates realistic noon terrain shadow polygons under hills at 75° elevation', () => {
      const grid = createDefaultOutdoorTerrain(GRID_ROWS, GRID_COLS);
      // Tall hill at column 10 (rows 5..19)
      for (let r = 5; r < GRID_ROWS; r++) {
        grid[r][10] = 'DIRT';
      }

      // At noon (75°), shadows should be short but present under steep slopes
      const noonPolygons = computeTerrainShadowPolygons(grid, 1360, 680, 'noon');
      expect(noonPolygons.length).toBeGreaterThan(0);
      expect(noonPolygons[0].pathData).toContain('M ');
      expect(noonPolygons[0].pathData).toContain(' Z');
    });
  });

  describe('Integrated Microclimate Node Updater', () => {
    it('adjusts solar panel voltage and wind turbine speed/bonus in batch', () => {
      const grid = createDefaultOutdoorTerrain(GRID_ROWS, GRID_COLS);
      // Build a hill at column 5 (r=8)
      for (let r = 8; r < GRID_ROWS; r++) {
        grid[r][5] = 'DIRT';
      }

      const nodes: Node<CircuitElementData>[] = [
        {
          id: 'sp_shaded',
          type: 'solar-panel',
          position: { x: 300, y: 350 }, // Behind the hill at column 5
          data: {
            id: 'sp_shaded',
            type: 'solar-panel',
            worldMode: 'outside',
            sunlight: 100,
            voltage: 12.0,
            label: 'Shaded Solar',
          },
        },
        {
          id: 'wt_hill',
          type: 'wind-turbine',
          position: { x: 5 * 34, y: 8 * 34 - 184 }, // On top of the hill
          data: {
            id: 'wt_hill',
            type: 'wind-turbine',
            worldMode: 'outside',
            speed: 50,
            voltage: 6.0,
            label: 'Hilltop Turbine',
          },
        },
        {
          id: 'lab_bulb',
          type: 'bulb',
          position: { x: 100, y: 100 },
          data: {
            id: 'lab_bulb',
            type: 'bulb',
            worldMode: 'lab',
            label: 'Lab Bulb',
          },
        },
      ];

      const updated = applyTerrainMicroclimateToNodes(nodes, grid, {
        sunPosition: 'morning',
      });

      const updatedSolar = updated.find((n) => n.id === 'sp_shaded')!;
      const updatedTurbine = updated.find((n) => n.id === 'wt_hill')!;
      const updatedBulb = updated.find((n) => n.id === 'lab_bulb')!;

      // Solar panel should be marked as shaded with diffuse voltage (1.8V)
      expect(updatedSolar.data.isShaded).toBe(true);
      expect(updatedSolar.data.effectiveSunlight).toBe(15);
      expect(updatedSolar.data.voltage).toBe(1.8);

      // Wind turbine on hill should have elevation bonus and higher RPM
      expect(updatedTurbine.data.elevationBonusPercent).toBeGreaterThan(0);
      expect(updatedTurbine.data.effectiveSpeed).toBeGreaterThan(50);
      expect(updatedTurbine.data.voltage).toBeGreaterThan(6.0);

      // Lab bulb remains untouched
      expect(updatedBulb.data.worldMode).toBe('lab');
      expect(updatedBulb.data.isShaded).toBeUndefined();
    });
  });

  describe('Full Circuit Recalculation Coupling', () => {
    it('dynamically responds when terrain is sculpted via store', () => {
      const store = useCircuitStore.getState();
      store.clearCanvas();
      store.setWorldMode('outside');
      store.resetOutdoorTerrain();

      // Add Solar Panel at x=280
      store.addComponent('solar-panel', { x: 280, y: 350 });
      let currentSolar = useCircuitStore
        .getState()
        .nodes.find((n) => n.data.type === 'solar-panel')!;
      expect(currentSolar.data.isShaded).toBe(false);
      expect(currentSolar.data.voltage).toBe(12.0);

      // Build a tall hill to the left of the solar panel (at columns 4..6, rows 6..19)
      for (let r = 6; r < 20; r++) {
        store.paintTerrainCell(r, 4, 'DIRT');
        store.paintTerrainCell(r, 5, 'DIRT');
      }

      currentSolar = useCircuitStore
        .getState()
        .nodes.find((n) => n.data.type === 'solar-panel')!;

      // Solar panel must now be shaded and output voltage drops to diffuse level (1.8V)!
      expect(currentSolar.data.isShaded).toBe(true);
      expect(currentSolar.data.effectiveSunlight).toBe(15);
      expect(currentSolar.data.voltage).toBe(1.8);

      // Switch sun to noon (75°): sun clears the hill and restores full 12.0V!
      store.setSunTimeOfDay('noon');
      currentSolar = useCircuitStore
        .getState()
        .nodes.find((n) => n.data.type === 'solar-panel')!;
      expect(currentSolar.data.isShaded).toBe(false);
      expect(currentSolar.data.voltage).toBe(12.0);
    });

    it('dynamically recalculates wind turbine elevation bonus when dragged onto a hill via settleOutdoorNodeAfterDrag', () => {
      const store = useCircuitStore.getState();
      store.clearCanvas();
      store.setWorldMode('outside');
      store.resetOutdoorTerrain();

      // Build hill at columns 20..25 rising to row 8
      for (let r = 8; r < 20; r++) {
        for (let c = 20; c <= 25; c++) {
          store.paintTerrainCell(r, c, 'DIRT');
        }
      }

      // Place wind turbine on flatland at x=500 (col 15..18, row 15 flatland)
      store.addComponent('wind-turbine', { x: 500, y: 350 });
      let turbine = useCircuitStore
        .getState()
        .nodes.find((n) => n.data.type === 'wind-turbine')!;
      expect(turbine.data.elevationBonusPercent ?? 0).toBe(0);
      expect(turbine.data.voltage).toBe(6.0);

      // Drag turbine to the hilltop at x=22*34=748, y=8*34-184=88 (ReactFlow moves position during drag)
      store.onNodesChange([
        {
          type: 'position',
          id: turbine.id,
          position: { x: 748, y: 88 },
        },
      ]);

      store.settleOutdoorNodeAfterDrag(
        turbine.id,
        { x: 500, y: 350 },
        { width: 1360, height: 680 }
      );

      // Settle must immediately invoke recalculateCircuit, setting hilltop bonus!
      turbine = useCircuitStore
        .getState()
        .nodes.find((n) => n.data.type === 'wind-turbine')!;
      expect(turbine.data.elevationBonusPercent).toBeGreaterThan(0);
      expect(turbine.data.effectiveSpeed).toBeGreaterThan(50);
      expect(turbine.data.voltage).toBeGreaterThan(6.0);
    });

    it('updates sunTimeOfDay and emits localized microclimate notifications on Pagi, Siang, and Sore', () => {
      const store = useCircuitStore.getState();
      store.setLanguage('id');

      store.setSunTimeOfDay('morning');
      expect(useCircuitStore.getState().sunTimeOfDay).toBe('morning');
      expect(useCircuitStore.getState().notification?.message).toContain('Matahari Pagi (35° Timur)');

      store.setSunTimeOfDay('noon');
      expect(useCircuitStore.getState().sunTimeOfDay).toBe('noon');
      expect(useCircuitStore.getState().notification?.message).toContain('Matahari Siang (75° Zenith)');

      store.setSunTimeOfDay('afternoon');
      expect(useCircuitStore.getState().sunTimeOfDay).toBe('afternoon');
      expect(useCircuitStore.getState().notification?.message).toContain('Matahari Sore (35° Barat)');

      // English localization check
      store.setLanguage('en');
      store.setSunTimeOfDay('noon');
      expect(useCircuitStore.getState().notification?.message).toContain('Noon Sun (75° Zenith)');
    });

    it('generates valid terrain shadow polygons and clears at high noon', () => {
      const grid = createDefaultOutdoorTerrain(GRID_ROWS, GRID_COLS);
      // Tall hill at columns 4..8
      for (let r = 8; r < GRID_ROWS; r++) {
        for (let c = 4; c <= 8; c++) {
          grid[r][c] = 'DIRT';
        }
      }

      // Morning shadow should project to the right
      const morningPolygons = computeTerrainShadowPolygons(grid, 1360, 680, 'morning');
      expect(morningPolygons.length).toBeGreaterThan(0);
      expect(morningPolygons[0].pathData).toContain('M ');
      expect(morningPolygons[0].pathData).toContain(' Z');

      // Noon overhead (75° or 90°) has no long hill shadows
      const noonPolygons = computeTerrainShadowPolygons(grid, 1360, 680, { elevationDeg: 86, azimuthDeg: 180 });
      expect(noonPolygons.length).toBe(0);

      // Afternoon shadow should project
      const afternoonPolygons = computeTerrainShadowPolygons(grid, 1360, 680, 'afternoon');
      expect(afternoonPolygons.length).toBeGreaterThan(0);
    });

    it('prevents exponential irradiance decay and reliably restores 12V across repeated Pagi/Siang/Sore cycles', () => {
      const store = useCircuitStore.getState();
      store.clearCanvas();
      store.setWorldMode('outside');
      store.resetOutdoorTerrain();

      // Place solar panel at column 12 (x=408)
      store.addComponent('solar-panel', { x: 408, y: 350 });

      // Place tall hill to the left at column 8 (shaded in morning)
      for (let r = 6; r < GRID_ROWS; r++) {
        store.paintTerrainCell(r, 8, 'DIRT');
      }

      // 1. Morning: Panel is shaded by hill at column 8
      store.setSunTimeOfDay('morning');
      let panel = useCircuitStore.getState().nodes.find((n) => n.data.type === 'solar-panel')!;
      expect(panel.data.isShaded).toBe(true);
      expect(panel.data.effectiveSunlight).toBe(15);
      expect(panel.data.voltage).toBe(1.8);
      expect(panel.data.baseSunlight).toBe(100);

      // 2. Noon: Overhead sun clears hill, restoring full 12.0V
      store.setSunTimeOfDay('noon');
      panel = useCircuitStore.getState().nodes.find((n) => n.data.type === 'solar-panel')!;
      expect(panel.data.isShaded).toBe(false);
      expect(panel.data.effectiveSunlight).toBe(100);
      expect(panel.data.voltage).toBe(12.0);
      expect(panel.data.baseSunlight).toBe(100);

      // 3. Cycle 5 times to stress-test against exponential decay
      for (let i = 0; i < 5; i++) {
        store.setSunTimeOfDay('morning');
        store.setSunTimeOfDay('noon');
      }

      panel = useCircuitStore.getState().nodes.find((n) => n.data.type === 'solar-panel')!;
      expect(panel.data.isShaded).toBe(false);
      expect(panel.data.effectiveSunlight).toBe(100);
      expect(panel.data.voltage).toBe(12.0);
      expect(panel.data.baseSunlight).toBe(100);
    });
  });
});
