/**
 * Solar Panel Physics Module.
 *
 * Models photovoltaic EMF output under adjustable solar irradiance (0% to 100%):
 * - 100% Sunlight (Full Irradiance): 12.0V open-circuit EMF
 * - 42% Sunlight (Diffuse / Overcast): ~5.0V open-circuit EMF
 * - 0% Sunlight (Dark / Night): 0.0V open-circuit EMF
 *
 * Time Complexity: O(1) constant-time arithmetic.
 */

/** Maximum rated open-circuit voltage of the solar panel array (Volts) */
export const SOLAR_PANEL_MAX_VOLTAGE = 12.0;

/** Default sunlight irradiance percentage when placed (100% = 12.0V) */
export const DEFAULT_SOLAR_SUNLIGHT_PERCENT = 100;

/** Internal series source resistance of solar cell matrix (Ohms) */
export const SOLAR_PANEL_INTERNAL_RESISTANCE = 0.2;

/**
 * Computes the nominal open-circuit EMF voltage of a solar panel from sunlight irradiance percentage.
 * Includes input validation and clamping to [0, 100].
 *
 * @param sunlightPercent - Solar irradiance percentage (0 to 100, default 100)
 * @returns Nominal output voltage in Volts (0.0V to 12.0V)
 */
export function getSolarPanelVoltage(sunlightPercent: number = DEFAULT_SOLAR_SUNLIGHT_PERCENT): number {
  if (typeof sunlightPercent !== 'number' || Number.isNaN(sunlightPercent)) {
    return SOLAR_PANEL_MAX_VOLTAGE;
  }
  const clampedSunlight = Math.max(0, Math.min(100, sunlightPercent));
  return Number(((clampedSunlight / 100) * SOLAR_PANEL_MAX_VOLTAGE).toFixed(2));
}
