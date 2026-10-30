import { describe, it, expect, beforeEach } from 'vitest';
import { useCircuitStore } from '../useCircuitStore';
import { createEmptyTerrainGrid } from '../../physics/terrainGrid';

describe('useCircuitStore - World Mode, Outdoor Sandbox & MNA Integration', () => {
  beforeEach(() => {
    useCircuitStore.getState().clearCanvas();
    useCircuitStore.getState().setWorldMode('lab');
    useCircuitStore.getState().resetOutdoorTerrain();
  });

  it('initializes default worldMode as lab and switches to outside', () => {
    expect(useCircuitStore.getState().worldMode).toBe('lab');

    useCircuitStore.getState().setWorldMode('outside');
    expect(useCircuitStore.getState().worldMode).toBe('outside');
  });

  it('rejects overlapping outdoor components and explodes components dropped on WATER', () => {
    const store = useCircuitStore.getState();
    store.setWorldMode('outside');

    // Set up custom terrain with solid GRASS/DIRT on the left half (cols 0..24) and WATER on the right half (cols 25..38)
    const customGrid = createEmptyTerrainGrid(20, 40);
    for (let r = 14; r < 20; r++) {
      for (let c = 0; c < 25; c++) {
        customGrid[r][c] = r === 14 ? 'GRASS' : 'DIRT';
      }
      for (let c = 25; c < 38; c++) {
        customGrid[r][c] = 'WATER';
      }
    }
    useCircuitStore.setState({ terrainGrid: customGrid, explosions: [] });

    const containerSize = { width: 800, height: 400 };

    // 1. Place Solar Panel at a safe height above dry ground (x=40, y=110) -> succeeds & settles on ground
    const placed1 = store.placeOutdoorComponent('solar-panel', { x: 40, y: 110 }, containerSize);
    expect(placed1).toBe(true);
    expect(useCircuitStore.getState().nodes).toHaveLength(1);

    // 2. Attempt to place Wind Turbine overlapping the Solar Panel (x=55, y=70) -> rejected!
    const placedOverlap = store.placeOutdoorComponent(
      'wind-turbine',
      { x: 55, y: 70 },
      containerSize
    );
    expect(placedOverlap).toBe(false);
    expect(useCircuitStore.getState().nodes).toHaveLength(1);

    // 3. Drop component into WATER region (x=540, y=120) -> Explodes & notifies!
    const placedWater = store.placeOutdoorComponent(
      'solar-panel',
      { x: 540, y: 120 },
      containerSize
    );
    expect(placedWater).toBe(false);
    expect(useCircuitStore.getState().nodes).toHaveLength(1);
    expect(useCircuitStore.getState().explosions.length).toBeGreaterThan(0);
    expect(useCircuitStore.getState().notification?.message).toBe(
      'Komponen Korsleting/Hancur karena Air!'
    );

    // 4. Drop component from excessive height in the sky (x=260, y=5) -> Explodes on ground impact!
    const placedTooHigh = store.placeOutdoorComponent(
      'solar-panel',
      { x: 260, y: 5 },
      containerSize
    );
    expect(placedTooHigh).toBe(false);
    expect(useCircuitStore.getState().notification?.message).toBe(
      'Komponen Hancur karena Jatuh dari Ketinggian!'
    );
  });

  it('transmits electricity from Outdoor Solar Panel to Lab Resistor via Union-Find Transmission Towers', () => {
    const store = useCircuitStore.getState();

    // Place Solar Panel + Transmission Tower 1 in 'outside' mode
    store.setWorldMode('outside');
    store.addComponent('solar-panel', { x: 50, y: 100 });
    store.addComponent('transmission-tower', { x: 300, y: 100 });

    // Place Transmission Tower 2 + 100Ω Resistor in 'lab' mode
    store.setWorldMode('lab');
    store.addComponent('transmission-tower', { x: 100, y: 100 });
    store.addComponent('resistor', { x: 350, y: 100 });

    const allNodes = useCircuitStore.getState().nodes;
    const solarOut = allNodes.find((n) => n.data.type === 'solar-panel')!;
    const towers = allNodes.filter((n) => n.data.type === 'transmission-tower');
    const towerOut = towers[0];
    const towerLab = towers[1];
    const labResistor = allNodes.find((n) => n.data.type === 'resistor')!;

    // Connect Outdoor Solar Panel to Outdoor Tower
    store.onConnect({
      source: solarOut.id,
      sourceHandle: 'pos',
      target: towerOut.id,
      targetHandle: 'pos',
    });
    store.onConnect({
      source: solarOut.id,
      sourceHandle: 'neg',
      target: towerOut.id,
      targetHandle: 'neg',
    });

    // Connect Lab Tower to Lab Resistor
    store.onConnect({
      source: towerLab.id,
      sourceHandle: 'pos',
      target: labResistor.id,
      targetHandle: 'p1',
    });
    store.onConnect({
      source: labResistor.id,
      sourceHandle: 'p2',
      target: towerLab.id,
      targetHandle: 'neg',
    });

    // 12V across 100Ω + 0.2Ω internal resistance -> ~0.1198A in Lab resistor!
    const labCurrent = Math.abs(
      useCircuitStore.getState().simulation.branchCurrents[labResistor.id] ?? 0
    );
    expect(labCurrent).toBeCloseTo(0.1198, 2);
  });
});
