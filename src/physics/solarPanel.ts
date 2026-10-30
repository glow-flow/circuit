/**
 * Solar Panel Physics & Environmental Simulation Module.
 *
 * Models photovoltaic behavior under dynamic atmospheric conditions:
 * - 'sunny': Full solar irradiance -> 12.0V open-circuit EMF
 * - 'cloudy': Diffuse solar irradiance -> 5.0V open-circuit EMF
 * - 'lab': Indoor dark environment -> 0.0V (no photovoltage generated)
 *
 * Time Complexity: O(1) constant time lookups.
 */

import { CircuitEnvironment } from '../types/circuit';

/** Rated output voltages for solar panels per environmental state */
export const SOLAR_PANEL_VOLTAGES: Record<CircuitEnvironment, number> = {
  sunny: 12.0,
  cloudy: 5.0,
  lab: 0.0,
};

/** Internal series source resistance of solar cell matrix (Ohms) */
export const SOLAR_PANEL_INTERNAL_RESISTANCE = 0.2;

/**
 * Returns nominal output voltage for a solar panel in the given environment.
 *
 * @param environment - Current ambient environment ('lab' | 'sunny' | 'cloudy')
 * @returns Nominal voltage in Volts (12.0V, 5.0V, or 0.0V)
 */
export function getSolarPanelVoltage(environment?: CircuitEnvironment): number {
  if (!environment) return SOLAR_PANEL_VOLTAGES.lab;
  return SOLAR_PANEL_VOLTAGES[environment] ?? SOLAR_PANEL_VOLTAGES.lab;
}

/**
 * Cycles to the next environment state: 'lab' -> 'sunny' -> 'cloudy' -> 'lab'.
 *
 * @param current - Current environment
 * @returns Next environment in cycle
 */
export function getNextEnvironment(current: CircuitEnvironment): CircuitEnvironment {
  switch (current) {
    case 'lab':
      return 'sunny';
    case 'sunny':
      return 'cloudy';
    case 'cloudy':
      return 'lab';
    default:
      return 'lab';
  }
}
