import { describe, it, expect } from 'vitest';
import { createOutdoorPowerStationElements } from '../outdoorSpawnUtils';
import { createDefaultOutdoorTerrain, GRID_COLS, GRID_ROWS } from '../../physics/terrainGrid';

describe('outdoorSpawnUtils — createOutdoorPowerStationElements', () => {
  const terrainGrid = createDefaultOutdoorTerrain(GRID_ROWS, GRID_COLS);

  it('generates 3 outdoor nodes (solar, wind, tower) with correct worldMode and properties', () => {
    const result = createOutdoorPowerStationElements({
      terrainGrid,
      sunlightPercent: 85,
      windSpeedPercent: 65,
      isId: true,
      canvasWidth: 1200,
      canvasHeight: 700,
    });

    expect(result.nodes).toHaveLength(3);
    const solar = result.nodes.find((n) => n.type === 'solar-panel');
    const wind = result.nodes.find((n) => n.type === 'wind-turbine');
    const tower = result.nodes.find((n) => n.type === 'transmission-tower');

    expect(solar).toBeDefined();
    expect(solar?.data.worldMode).toBe('outside');
    expect(solar?.data.sunlight).toBe(85);

    expect(wind).toBeDefined();
    expect(wind?.data.worldMode).toBe('outside');
    expect(wind?.data.speed).toBe(65);

    expect(tower).toBeDefined();
    expect(tower?.data.worldMode).toBe('outside');
  });

  it('generates 4 interconnected grid wires between generators and transmission tower', () => {
    const result = createOutdoorPowerStationElements({
      terrainGrid,
      sunlightPercent: 100,
      windSpeedPercent: 100,
      isId: false,
    });

    expect(result.edges).toHaveLength(4);
    const solarPos = result.edges.find((e) => e.sourceHandle === 'pos' && e.source.startsWith('solar_'));
    const windNeg = result.edges.find((e) => e.targetHandle === 'neg' && e.source.startsWith('wind_'));

    expect(solarPos).toBeDefined();
    expect(windNeg).toBeDefined();
  });

  it('clamps invalid extreme sunlight and wind percentages within 0..100 boundary', () => {
    const result = createOutdoorPowerStationElements({
      terrainGrid,
      sunlightPercent: 250,
      windSpeedPercent: -40,
    });

    const solar = result.nodes.find((n) => n.type === 'solar-panel');
    const wind = result.nodes.find((n) => n.type === 'wind-turbine');

    expect(solar?.data.sunlight).toBe(100);
    expect(wind?.data.speed).toBe(0);
  });
});
