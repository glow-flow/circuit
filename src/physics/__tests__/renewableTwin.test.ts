import { describe, it, expect } from 'vitest';
import {
  calculateSolarOperatingPoint,
  generateSolarIVCurve,
  calculateWindOperatingPoint,
  calculateBessDynamicState,
  computeMicrogridPowerBalance,
  DEFAULT_SOLAR_PANEL_PARAMS,
  DEFAULT_WIND_TURBINE_PARAMS,
  DEFAULT_BESS_PARAMS,
  RENEWABLE_SCENARIOS,
} from '../renewableTwin';

describe('Renewable Energy Digital Twin Physics Suite', () => {
  describe('Solar Photovoltaic (PV) Module Model', () => {
    it('calculates expected electrical output at Standard Test Conditions (STC: 1000 W/m², 25°C)', () => {
      const point = calculateSolarOperatingPoint(DEFAULT_SOLAR_PANEL_PARAMS, {
        irradiance: 1000,
        sunElevationDeg: 75,
        panelTiltDeg: 15, // 90 - 75 - 15 = 0° angle of incidence (cos(0) = 1.0)
        ambientTempCelsius: 25,
        shadingFactor: 0.0,
      });

      expect(point.effectiveIrradiance).toBe(1000);
      expect(point.cellTemperatureCelsius).toBeGreaterThan(50.0); // Real-world NOCT cell heating
      expect(point.openCircuitVoltage).toBeGreaterThan(18.5); // Adjusted for thermal heating
      expect(point.shortCircuitCurrent).toBeGreaterThan(5.8);
      expect(point.pmpp).toBeGreaterThan(80.0); // 100W class module under operating thermal equilibrium
      expect(point.fillFactor).toBeGreaterThan(0.65);
    });

    it('scales short-circuit current linearly with irradiance reduction', () => {
      const fullSun = calculateSolarOperatingPoint(DEFAULT_SOLAR_PANEL_PARAMS, {
        irradiance: 1000,
        sunElevationDeg: 75,
        panelTiltDeg: 15,
        ambientTempCelsius: 25,
        shadingFactor: 0.0,
      });

      const halfSun = calculateSolarOperatingPoint(DEFAULT_SOLAR_PANEL_PARAMS, {
        irradiance: 500,
        sunElevationDeg: 75,
        panelTiltDeg: 15,
        ambientTempCelsius: 25,
        shadingFactor: 0.0,
      });

      expect(halfSun.effectiveIrradiance).toBe(500);
      expect(halfSun.shortCircuitCurrent).toBeCloseTo(fullSun.shortCircuitCurrent / 2, 1);
      expect(halfSun.pmpp).toBeLessThan(fullSun.pmpp * 0.6);
    });

    it('demonstrates negative temperature coefficient on open-circuit voltage', () => {
      const coolModule = calculateSolarOperatingPoint(DEFAULT_SOLAR_PANEL_PARAMS, {
        irradiance: 1000,
        sunElevationDeg: 75,
        panelTiltDeg: 15,
        ambientTempCelsius: 15,
        shadingFactor: 0.0,
      });

      const hotModule = calculateSolarOperatingPoint(DEFAULT_SOLAR_PANEL_PARAMS, {
        irradiance: 1000,
        sunElevationDeg: 75,
        panelTiltDeg: 15,
        ambientTempCelsius: 45,
        shadingFactor: 0.0,
      });

      // As temperature increases, bandgap shrinks causing Voc to decline
      expect(hotModule.openCircuitVoltage).toBeLessThan(coolModule.openCircuitVoltage);
    });

    it('generates a discrete I-V curve matching boundary conditions', () => {
      const point = calculateSolarOperatingPoint(DEFAULT_SOLAR_PANEL_PARAMS, {
        irradiance: 800,
        sunElevationDeg: 60,
        panelTiltDeg: 30,
        ambientTempCelsius: 25,
        shadingFactor: 0.0,
      });

      const ivCurve = generateSolarIVCurve(point, 21);
      expect(ivCurve.length).toBe(21);

      // At V=0, current is approximately Isc and power is 0
      expect(ivCurve[0].voltage).toBe(0);
      expect(ivCurve[0].current).toBeCloseTo(point.shortCircuitCurrent, 1);
      expect(ivCurve[0].power).toBe(0);

      // At V=Voc, current is approximately 0 and power is 0
      const lastPoint = ivCurve[ivCurve.length - 1];
      expect(lastPoint.voltage).toBeCloseTo(point.openCircuitVoltage, 1);
      expect(lastPoint.current).toBe(0);

      // Intermediate point has peak power
      const maxPowerInCurve = Math.max(...ivCurve.map((p) => p.power));
      expect(maxPowerInCurve).toBeGreaterThan(0);
    });
  });

  describe('Wind Turbine Model', () => {
    it('produces 0W below cut-in wind speed (< 3.0 m/s)', () => {
      const calm = calculateWindOperatingPoint(DEFAULT_WIND_TURBINE_PARAMS, 2.0);
      expect(calm.state).toBe('idle_calm');
      expect(calm.electricalOutputWatts).toBe(0);
    });

    it('exhibits cubic generation between cut-in and rated speed', () => {
      const lowWind = calculateWindOperatingPoint(DEFAULT_WIND_TURBINE_PARAMS, 6.0);
      const medWind = calculateWindOperatingPoint(DEFAULT_WIND_TURBINE_PARAMS, 9.0);

      expect(lowWind.state).toBe('generating');
      expect(medWind.state).toBe('generating');
      expect(medWind.electricalOutputWatts).toBeGreaterThan(lowWind.electricalOutputWatts);
      expect(lowWind.effectiveCp).toBeLessThanOrEqual(DEFAULT_WIND_TURBINE_PARAMS.maxPowerCoefficientCp);
    });

    it('governs output at rated capacity between rated and cut-out speeds', () => {
      const ratedWind = calculateWindOperatingPoint(DEFAULT_WIND_TURBINE_PARAMS, 14.0);
      const highWind = calculateWindOperatingPoint(DEFAULT_WIND_TURBINE_PARAMS, 22.0);

      expect(ratedWind.state).toBe('rated_governed');
      expect(highWind.state).toBe('rated_governed');
      expect(ratedWind.electricalOutputWatts).toBe(DEFAULT_WIND_TURBINE_PARAMS.ratedPowerWatts);
      expect(highWind.electricalOutputWatts).toBe(DEFAULT_WIND_TURBINE_PARAMS.ratedPowerWatts);
    });

    it('triggers automated cut-out storm shutdown above 25 m/s for survival safety', () => {
      const stormWind = calculateWindOperatingPoint(DEFAULT_WIND_TURBINE_PARAMS, 28.0);
      expect(stormWind.state).toBe('cutout_storm_shutdown');
      expect(stormWind.electricalOutputWatts).toBe(0);
      expect(stormWind.estimatedRpm).toBe(0);
    });
  });

  describe('Battery Energy Storage System (BESS) Dynamics', () => {
    it('safely charges BESS from surplus renewable power within C-rate limits', () => {
      const initialSoC = 50.0;
      const surplusPower = 300.0; // Watts
      const nextState = calculateBessDynamicState(DEFAULT_BESS_PARAMS, initialSoC, surplusPower, 1.0);

      expect(nextState.mode).toBe('charging');
      expect(nextState.stateOfChargePercent).toBeGreaterThan(initialSoC);
      expect(nextState.activePowerWatts).toBeGreaterThan(0);
      expect(nextState.currentEnergyWh).toBeGreaterThan(500);
    });

    it('discharges BESS to cover load deficits down to safe cutoff reserve', () => {
      const initialSoC = 30.0;
      const deficitPower = -200.0; // Watts
      const nextState = calculateBessDynamicState(DEFAULT_BESS_PARAMS, initialSoC, deficitPower, 1.0);

      expect(nextState.mode).toBe('discharging');
      expect(nextState.stateOfChargePercent).toBeLessThan(initialSoC);
      expect(nextState.activePowerWatts).toBeLessThan(0);
    });

    it('prevents deep discharge below minimum safe SoC cutoff (10%)', () => {
      const nearEmptySoC = 10.0;
      const deficitPower = -500.0;
      const nextState = calculateBessDynamicState(DEFAULT_BESS_PARAMS, nearEmptySoC, deficitPower, 1.0);

      expect(nextState.mode).toBe('depleted');
      expect(nextState.activePowerWatts).toBe(0);
      expect(nextState.stateOfChargePercent).toBe(10.0);
    });
  });

  describe('Microgrid Power Balance & Autonomy', () => {
    it('satisfies total energy conservation law: P_gen = P_solar + P_wind', () => {
      const balance = computeMicrogridPowerBalance(150, 250, 100, DEFAULT_BESS_PARAMS, 60);

      expect(balance.totalGenerationWatts).toBe(400);
      expect(balance.netPowerWatts).toBe(300); // 400 - 100
      expect(balance.status).toBe('self_sufficient_surplus');
      expect(balance.bessDispatchWatts).toBeGreaterThan(0); // charging
      expect(balance.autonomyHours).toBe(999.0); // self-sustaining
    });

    it('dispatches BESS and imports from virtual grid during generation deficit', () => {
      // 50W solar + 0W wind = 50W gen, vs 200W load -> 150W deficit
      const balance = computeMicrogridPowerBalance(50, 0, 200, DEFAULT_BESS_PARAMS, 50);

      expect(balance.totalGenerationWatts).toBe(50);
      expect(balance.netPowerWatts).toBe(-150);
      expect(balance.bessDispatchWatts).toBeLessThan(0); // discharging
      expect(balance.autonomyHours).toBeGreaterThan(0);
      expect(balance.autonomyHours).toBeLessThan(100);
    });
  });

  describe('Pedagogical Renewable Scenarios', () => {
    it('contains 6 fully configured scenarios with valid environmental metrics', () => {
      expect(RENEWABLE_SCENARIOS.length).toBe(6);

      for (const scenario of RENEWABLE_SCENARIOS) {
        expect(scenario.id).toBeTruthy();
        expect(scenario.titleId).toBeTruthy();
        expect(scenario.titleEn).toBeTruthy();
        expect(scenario.solarConditions.irradiance).toBeGreaterThanOrEqual(0);
        expect(scenario.windSpeedMs).toBeGreaterThanOrEqual(0);
        expect(scenario.targetLoadWatts).toBeGreaterThan(0);
        expect(scenario.bessInitialSoCPercent).toBeGreaterThanOrEqual(0);
        expect(scenario.bessInitialSoCPercent).toBeLessThanOrEqual(100);
      }
    });
  });
});
