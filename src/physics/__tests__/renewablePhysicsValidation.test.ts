import { describe, it, expect } from 'vitest';
import {
  calculateSolarOperatingPoint,
  calculateWindOperatingPoint,
  calculateBessDynamicState,
  computeMicrogridPowerBalance,
  DEFAULT_SOLAR_PANEL_PARAMS,
  DEFAULT_WIND_TURBINE_PARAMS,
  DEFAULT_BESS_PARAMS,
  BESS_CHEMISTRY_DEFAULTS,
} from '../renewableTwin';

describe('Renewable Energy Digital Twin - Comprehensive Physics Validation', () => {
  describe('Solar Photovoltaic Plane-of-Array (POA) & Electrical Model', () => {
    it('produces exactly 0W at night or under zero irradiance', () => {
      const nightResult = calculateSolarOperatingPoint(DEFAULT_SOLAR_PANEL_PARAMS, {
        irradiance: 0,
        sunElevationDeg: 0,
        panelTiltDeg: 25,
        ambientTempCelsius: 20,
        shadingFactor: 0,
      });

      expect(nightResult.effectiveIrradiance).toBe(0);
      expect(nightResult.openCircuitVoltage).toBe(0);
      expect(nightResult.shortCircuitCurrent).toBe(0);
      expect(nightResult.pmpp).toBe(0);
    });

    it('produces exactly 0W when panel is oriented facing completely away from the sun', () => {
      // Sun in South (180°), Panel facing North (0°), tilt 45°, sun elevation 30°
      const facingAwayResult = calculateSolarOperatingPoint(DEFAULT_SOLAR_PANEL_PARAMS, {
        irradiance: 1000,
        sunElevationDeg: 30,
        panelTiltDeg: 45,
        sunAzimuthDeg: 180,
        panelAzimuthDeg: 0, // Facing North away from South sun
        ambientTempCelsius: 25,
        shadingFactor: 0,
      });

      expect(facingAwayResult.effectiveIrradiance).toBe(0);
      expect(facingAwayResult.pmpp).toBe(0);
      expect(facingAwayResult.openCircuitVoltage).toBe(0);
    });

    it('models negative temperature coefficient on Voc and slight positive on Isc', () => {
      const normalSTC = calculateSolarOperatingPoint(DEFAULT_SOLAR_PANEL_PARAMS, {
        irradiance: 1000,
        sunElevationDeg: 90,
        panelTiltDeg: 0,
        ambientTempCelsius: 25,
        shadingFactor: 0,
      });

      const hotDesert = calculateSolarOperatingPoint(DEFAULT_SOLAR_PANEL_PARAMS, {
        irradiance: 1000,
        sunElevationDeg: 90,
        panelTiltDeg: 0,
        ambientTempCelsius: 50, // High temperature
        shadingFactor: 0,
      });

      // Cell temperature must be higher
      expect(hotDesert.cellTemperatureCelsius).toBeGreaterThan(normalSTC.cellTemperatureCelsius);
      // Voc must drop when hot (negative temp coefficient)
      expect(hotDesert.openCircuitVoltage).toBeLessThan(normalSTC.openCircuitVoltage);
      // Isc increases slightly or remains stable
      expect(hotDesert.shortCircuitCurrent).toBeGreaterThanOrEqual(normalSTC.shortCircuitCurrent);
      // Total power decreases due to voltage drop
      expect(hotDesert.pmpp).toBeLessThan(normalSTC.pmpp);
    });

    it('reduces short circuit current proportionally under partial shading', () => {
      const unshaded = calculateSolarOperatingPoint(DEFAULT_SOLAR_PANEL_PARAMS, {
        irradiance: 1000,
        sunElevationDeg: 90,
        panelTiltDeg: 0,
        ambientTempCelsius: 25,
        shadingFactor: 0,
      });

      const halfShaded = calculateSolarOperatingPoint(DEFAULT_SOLAR_PANEL_PARAMS, {
        irradiance: 1000,
        sunElevationDeg: 90,
        panelTiltDeg: 0,
        ambientTempCelsius: 25,
        shadingFactor: 0.5, // 50% shaded
      });

      expect(halfShaded.effectiveIrradiance).toBeCloseTo(unshaded.effectiveIrradiance * 0.5, 0);
      expect(halfShaded.shortCircuitCurrent).toBeCloseTo(unshaded.shortCircuitCurrent * 0.5, 1);
      expect(halfShaded.pmpp).toBeLessThan(unshaded.pmpp * 0.6);
    });
  });

  describe('Wind Turbine Aerodynamics & Betz Limit Ceiling', () => {
    it('produces 0W below cut-in speed', () => {
      const calm = calculateWindOperatingPoint(DEFAULT_WIND_TURBINE_PARAMS, 2.0); // Below 3.0 m/s
      expect(calm.state).toBe('idle_calm');
      expect(calm.electricalOutputWatts).toBe(0);
      expect(calm.effectiveCp).toBe(0);
    });

    it('shuts down safely and locks rotor (0W) in storm winds above cut-out speed', () => {
      const storm = calculateWindOperatingPoint(DEFAULT_WIND_TURBINE_PARAMS, 28.0); // Above 25.0 m/s
      expect(storm.state).toBe('cutout_storm_shutdown');
      expect(storm.electricalOutputWatts).toBe(0);
      expect(storm.estimatedRpm).toBe(0);
    });

    it('never exceeds Betz limit (Cp <= 16/27) or rated electrical capacity', () => {
      for (let speed = 3.5; speed <= 24.5; speed += 1.5) {
        const operatingPoint = calculateWindOperatingPoint(DEFAULT_WIND_TURBINE_PARAMS, speed);
        // Electrical output cannot exceed rated power
        expect(operatingPoint.electricalOutputWatts).toBeLessThanOrEqual(DEFAULT_WIND_TURBINE_PARAMS.ratedPowerWatts);
        // Effective Cp cannot exceed Betz limit 16/27 (~0.5926)
        expect(operatingPoint.effectiveCp).toBeLessThanOrEqual(16 / 27 + 0.001);
      }
    });

    it('governs output at rated capacity between rated speed and cut-out speed', () => {
      const ratedPoint = calculateWindOperatingPoint(DEFAULT_WIND_TURBINE_PARAMS, 15.0); // Between 12 and 25 m/s
      expect(ratedPoint.state).toBe('rated_governed');
      expect(ratedPoint.electricalOutputWatts).toBe(DEFAULT_WIND_TURBINE_PARAMS.ratedPowerWatts);
    });
  });

  describe('BESS Electrochemistry, C-Rate & Efficiency Constraints', () => {
    it('supports LFP, Lithium-Ion, and Lead-Acid baseline parameters', () => {
      expect(BESS_CHEMISTRY_DEFAULTS.lfp.coulombicEfficiency).toBe(0.98);
      expect(BESS_CHEMISTRY_DEFAULTS['lithium-ion'].coulombicEfficiency).toBe(0.96);
      expect(BESS_CHEMISTRY_DEFAULTS['lead-acid'].minSafeSoCPercent).toBe(40.0);
    });

    it('strictly clamps charging rate by maximum permissible C-rate', () => {
      const bess = DEFAULT_BESS_PARAMS; // 1000 Wh, maxChargeCRate 0.5C = 500W
      const state = calculateBessDynamicState(bess, 50, 1500, 1.0); // Offering 1500W surplus
      // Must clamp active charge power to max 500W
      expect(state.activePowerWatts).toBeLessThanOrEqual(500.1);
      expect(state.mode).toBe('charging');
      expect(state.stateOfChargePercent).toBeGreaterThan(50);
      expect(state.stateOfChargePercent).toBeLessThanOrEqual(100);
    });

    it('stops charging when battery reaches maximum safe SoC (100%)', () => {
      const state = calculateBessDynamicState(DEFAULT_BESS_PARAMS, 100, 500, 1.0);
      expect(state.mode).toBe('fully_charged');
      expect(state.activePowerWatts).toBe(0);
      expect(state.stateOfChargePercent).toBe(100);
    });

    it('stops discharging when battery reaches safe minimum cutoff reserve (10%)', () => {
      const state = calculateBessDynamicState(DEFAULT_BESS_PARAMS, 10, -500, 1.0);
      expect(state.mode).toBe('depleted');
      expect(state.activePowerWatts).toBe(0);
      expect(state.stateOfChargePercent).toBe(10);
    });
  });

  describe('Coupled Microgrid Power Conservation Law', () => {
    it('strictly conserves power in generation surplus regime (P_gen >= P_load)', () => {
      // 300W solar + 200W wind = 500W gen, 150W load
      const balance = computeMicrogridPowerBalance(300, 200, 150, DEFAULT_BESS_PARAMS, 50);

      expect(balance.status).toBe('self_sufficient_surplus');
      expect(balance.gridImportWatts).toBe(0);

      // Power balance equation: P_gen = P_load + P_bess_charge + P_grid_export
      const lhs = balance.totalGenerationWatts; // 500
      const rhs = balance.totalLoadWatts + balance.bessDispatchWatts + balance.gridExportWatts; // 150 + 350 + 0 = 500
      expect(Math.abs(lhs - rhs)).toBeLessThan(0.1);
    });

    it('strictly conserves power in generation deficit regime with BESS discharge and grid import', () => {
      // 50W solar + 0W wind = 50W gen, 800W load. Battery at 50% SoC can discharge max 1000W.
      const balance = computeMicrogridPowerBalance(50, 0, 800, DEFAULT_BESS_PARAMS, 50);

      expect(balance.status).toBe('bess_supporting');
      expect(balance.bessDispatchWatts).toBeLessThan(0); // Discharging

      // Power balance equation: P_gen + |P_bess_dis| + P_grid_import = P_load + P_grid_export
      const lhs = balance.totalGenerationWatts + Math.abs(balance.bessDispatchWatts) + balance.gridImportWatts;
      const rhs = balance.totalLoadWatts + balance.gridExportWatts;
      expect(Math.abs(lhs - rhs)).toBeLessThan(0.1);
    });

    it('imports from grid when BESS is depleted under heavy deficit', () => {
      // 0W gen, 400W load, BESS at min safe SoC 10%
      const balance = computeMicrogridPowerBalance(0, 0, 400, DEFAULT_BESS_PARAMS, 10);

      expect(balance.status).toBe('grid_importing');
      expect(balance.bessDispatchWatts).toBe(0);
      expect(balance.gridImportWatts).toBe(400);

      // Conservation: 0 + 0 + 400 = 400 + 0
      const lhs = balance.totalGenerationWatts + Math.abs(balance.bessDispatchWatts) + balance.gridImportWatts;
      const rhs = balance.totalLoadWatts + balance.gridExportWatts;
      expect(Math.abs(lhs - rhs)).toBeLessThan(0.1);
    });

    it('handles zero load without dividing by zero or throwing NaN', () => {
      const balance = computeMicrogridPowerBalance(200, 100, 0, DEFAULT_BESS_PARAMS, 90);
      expect(Number.isFinite(balance.netPowerWatts)).toBe(true);
      expect(balance.autonomyHours).toBeGreaterThan(0);
    });
  });
});
