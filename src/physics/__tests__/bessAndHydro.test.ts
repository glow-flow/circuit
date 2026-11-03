/**
 * Comprehensive Unit Test Suite for BESS Substation & Waterfall Micro-Hydro (Nature Mode Phase 3).
 *
 * Verifies:
 * 1. BESS Electrochemical and Energy Storage Simulation (1000 Wh, 12.8V LFP):
 *    - Capacity and Coulomb counting.
 *    - Dynamic charge / discharge state classification.
 *    - Voltage sag curve and zero-crash protection.
 * 2. Waterfall Micro-Hydro Generator Electromechanics:
 *    - Hydraulic potential to mechanical power: P = eta * rho * g * Q * H.
 *    - Open-circuit EMF voltage and Pelton runner RPM calculation.
 *    - Water contact detection and hydraulic head calculation in 2D terrain.
 *    - Water hazard immunity (hydro turbine operates safely in water).
 * 3. Natural Mountain Spring (WATER_SPRING):
 *    - Stationary bedrock physics and cascading water emission.
 * 4. Strict Mode Isolation:
 *    - BESS and Hydro Turbines are strictly prohibited in Lab Mode.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCircuitStore } from '../../store/useCircuitStore';
import {
  calculateHydroOperatingPoint,
  detectTurbineWaterFlow,
  HYDRO_RUNNER_EFFICIENCY,
  WATER_DENSITY_KG_M3,
  GRAVITY_ACCELERATION_M_S2,
} from '../hydroPhysics';
import {
  createEmptyTerrainGrid,
  evaluateComponentDropPhysics,
  stepTerrainGravity,
} from '../terrainGrid';
import { isOutdoorOnlyComponent } from '../../types/circuit';
import { computeEffectiveBatteryVoltage } from '../batterySoC';

describe('BESS Substation & Waterfall Micro-Hydro (Nature Mode Phase 3)', () => {
  beforeEach(() => {
    useCircuitStore.getState().clearCanvas();
    useCircuitStore.getState().setWorldMode('outside');
    useCircuitStore.getState().resetOutdoorTerrain();
  });

  describe('BESS Substation (Battery Energy Storage System)', () => {
    it('initializes with standard 1.0 kWh LFP parameters (12.8V nominal, 80% SoC)', () => {
      useCircuitStore.getState().addComponent('bess-substation', { x: 400, y: 300 });

      const bess = useCircuitStore
        .getState()
        .nodes.find((n) => n.data.type === 'bess-substation');
      expect(bess).toBeDefined();
      expect(bess?.data.voltage).toBe(12.8);
      expect(bess?.data.socPercent).toBe(80);
      expect(bess?.data.nominalCapacityWh).toBe(1000);
      expect(bess?.data.storedEnergyWh).toBe(800);
      expect(bess?.data.worldMode).toBe('outside');
    });

    it('correctly models voltage sag as battery discharges below 20%', () => {
      const nominalVoltage = 12.8;

      // Full charge (100%) -> nominal EMF
      expect(computeEffectiveBatteryVoltage(nominalVoltage, 100)).toBe(12.8);

      // Normal charge (50%) -> nominal EMF
      expect(computeEffectiveBatteryVoltage(nominalVoltage, 50)).toBe(12.8);

      // Threshold (20%) -> nominal EMF
      expect(computeEffectiveBatteryVoltage(nominalVoltage, 20)).toBe(12.8);

      // Low charge (10%) -> 50% sag (12.8 * 10 / 20 = 6.4V)
      expect(computeEffectiveBatteryVoltage(nominalVoltage, 10)).toBe(6.4);

      // Depleted (0%) -> 0.0V (dead cell)
      expect(computeEffectiveBatteryVoltage(nominalVoltage, 0)).toBe(0.0);
    });

    it('participates in MNA linear circuit solution and powers load resistors', () => {
      // Place BESS at x=300
      useCircuitStore.getState().addComponent('bess-substation', { x: 300, y: 350 });
      // Place 100 Ohm resistor
      useCircuitStore.getState().addComponent('resistor', { x: 500, y: 350 });

      const bess = useCircuitStore
        .getState()
        .nodes.find((n) => n.data.type === 'bess-substation')!;
      const resistor = useCircuitStore
        .getState()
        .nodes.find((n) => n.data.type === 'resistor')!;

      // Wire BESS (+) to Resistor (p1) and BESS (-) to Resistor (p2)
      useCircuitStore.getState().onConnect({
        source: bess.id,
        sourceHandle: 'pos',
        target: resistor.id,
        targetHandle: 'p1',
      });
      useCircuitStore.getState().onConnect({
        source: bess.id,
        sourceHandle: 'neg',
        target: resistor.id,
        targetHandle: 'p2',
      });

      const updatedStore = useCircuitStore.getState();
      const sim = updatedStore.simulation;

      // Current I = V / R = 12.8V / 100 Ohm = 0.128 A
      const bessCurrent = Math.abs(sim.branchCurrents[bess.id] ?? 0);
      expect(bessCurrent).toBeCloseTo(0.128, 2);

      // BESS should be classified as discharging
      const updatedBess = updatedStore.nodes.find((n) => n.id === bess.id)!;
      expect(updatedBess.data.chargeState).toBe('discharging');
    });
  });

  describe('Waterfall Micro-Hydro Turbine Electromechanics', () => {
    it('returns zero generation when water flow or hydraulic head is zero', () => {
      const dryResult = calculateHydroOperatingPoint(0, 3.0);
      expect(dryResult.powerWatts).toBe(0);
      expect(dryResult.voltage).toBe(0);
      expect(dryResult.rpm).toBe(0);
      expect(dryResult.rotationDurationSeconds).toBeNull();
      expect(dryResult.isGenerating).toBe(false);

      const zeroHeadResult = calculateHydroOperatingPoint(100, 0);
      expect(zeroHeadResult.powerWatts).toBe(0);
      expect(zeroHeadResult.voltage).toBe(0);
      expect(zeroHeadResult.rpm).toBe(0);
    });

    it('accurately computes power via P = eta * rho * g * Q * H', () => {
      const flowPercent = 100; // Q = 0.004 m^3/s
      const headMeters = 2.0;
      const expectedPower = Number(
        (HYDRO_RUNNER_EFFICIENCY * WATER_DENSITY_KG_M3 * GRAVITY_ACCELERATION_M_S2 * 0.004 * 2.0).toFixed(2)
      );

      const result = calculateHydroOperatingPoint(flowPercent, headMeters);
      expect(result.powerWatts).toBe(expectedPower);
      expect(result.powerWatts).toBeGreaterThan(60);
      expect(result.voltage).toBeGreaterThan(12.0);
      expect(result.rpm).toBeGreaterThan(300);
      expect(result.rotationDurationSeconds).toBeLessThan(0.3);
      expect(result.isGenerating).toBe(true);
    });

    it('is immune to water short-circuit hazards in evaluateComponentDropPhysics', () => {
      const grid = createEmptyTerrainGrid(20, 40);
      // Fill bottom rows with water
      for (let r = 15; r < 20; r++) {
        for (let c = 0; c < 40; c++) {
          grid[r][c] = 'WATER';
        }
      }

      // Solar panel landing on water MUST explode!
      const solarOutcome = evaluateComponentDropPhysics(
        { x: 300, y: 400 },
        'solar-panel',
        null,
        [],
        grid,
        { width: 1360, height: 680 }
      );
      expect(solarOutcome.status).toBe('explode-water');

      // Hydro turbine landing on water MUST NOT explode (immune to water hazards!)
      const hydroOutcome = evaluateComponentDropPhysics(
        { x: 300, y: 400 },
        'hydro-turbine',
        null,
        [],
        grid,
        { width: 1360, height: 680 }
      );
      expect(hydroOutcome.status).not.toBe('explode-water');
    });

    it('detects natural waterfall flow when water cells exist above turbine intake', () => {
      const grid = createEmptyTerrainGrid(20, 40);
      const canvasWidth = 1360;
      const canvasHeight = 680;

      // Turbine placed at col 10 (x = 340), row 12 (y = 408)
      // Runner center is at x = 340 + 72 = 412 (col 12), y = 408 + 36 = 444 (row 13)
      const targetBox = { x: 340, y: 408, width: 144, height: 144 };

      // 1. Dry terrain -> 0 flow
      const dryCheck = detectTurbineWaterFlow(targetBox, grid, canvasWidth, canvasHeight);
      expect(dryCheck.hasWaterContact).toBe(false);
      expect(dryCheck.flowPercentage).toBe(0);

      // 2. Cascade water from row 6 down to row 13 at col 12 (runner center column)
      for (let r = 6; r <= 13; r++) {
        grid[r][12] = 'WATER';
      }

      const wetCheck = detectTurbineWaterFlow(targetBox, grid, canvasWidth, canvasHeight);
      expect(wetCheck.hasWaterContact).toBe(true);
      expect(wetCheck.flowPercentage).toBeGreaterThan(0);
      expect(wetCheck.headMeters).toBeGreaterThan(1.0);
    });
  });

  describe('Natural Mountain Spring (WATER_SPRING)', () => {
    it('remains fixed in place and emits cascading water into adjacent empty cells', () => {
      const grid = createEmptyTerrainGrid(20, 40);
      grid[5][10] = 'WATER_SPRING';

      // Step gravity physics once
      const { nextGrid, moved } = stepTerrainGravity(grid);
      expect(moved).toBe(true);
      // Spring block remains fixed at row 5, col 10
      expect(nextGrid[5][10]).toBe('WATER_SPRING');
      // Fresh water emitted below the spring at row 6, col 10
      expect(nextGrid[6][10]).toBe('WATER');
    });
  });

  describe('Strict Mode Isolation & Quarantine', () => {
    it('strictly classifies Solar, Wind, BESS, and Hydro as outdoor-only components', () => {
      expect(isOutdoorOnlyComponent('solar-panel')).toBe(true);
      expect(isOutdoorOnlyComponent('wind-turbine')).toBe(true);
      expect(isOutdoorOnlyComponent('bess-substation')).toBe(true);
      expect(isOutdoorOnlyComponent('hydro-turbine')).toBe(true);

      // Lab components should not be outdoor-only
      expect(isOutdoorOnlyComponent('battery')).toBe(false);
      expect(isOutdoorOnlyComponent('bulb')).toBe(false);
      expect(isOutdoorOnlyComponent('resistor')).toBe(false);
      expect(isOutdoorOnlyComponent('switch')).toBe(false);
    });

    it('rejects adding BESS or Hydro Turbine when worldMode is lab', () => {
      useCircuitStore.getState().setWorldMode('lab');

      useCircuitStore.getState().addComponent('bess-substation', { x: 200, y: 200 });
      expect(useCircuitStore.getState().nodes.length).toBe(0);

      useCircuitStore.getState().addComponent('hydro-turbine', { x: 200, y: 200 });
      expect(useCircuitStore.getState().nodes.length).toBe(0);
    });
  });
});
