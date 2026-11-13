/**
 * Solar Panel Physics Module.
 *
 * Provides two complementary PV representations:
 * 1. `getSolarPanelVoltage`: Educational MPPT-normalized DC bus potential (0.0V to 12.0V)
 *    matching the interactive weather/shading slider and microgrid bus calibration.
 * 2. `getSolarOpenCircuitVoltageLogarithmic` & `getSolarDynamicInternalResistance`:
 *    Physical silicon single-diode Voc(G) ~ Voc_ref + Vt_eff * ln(G/G_ref) and irradiance-scaled
 *    source impedance where Voc remains ~80%+ under overcast sky while Isc scales linearly with G.
 *
 * Time Complexity: O(1) constant-time arithmetic.
 */

/** Maximum rated open-circuit voltage of the solar panel array (Volts) */
export const SOLAR_PANEL_MAX_VOLTAGE = 12.0;

/** Default sunlight irradiance percentage when placed (100% = 12.0V) */
export const DEFAULT_SOLAR_SUNLIGHT_PERCENT = 100;

/** Internal series source resistance of solar cell matrix (Ohms) */
export const SOLAR_PANEL_INTERNAL_RESISTANCE = 0.2;

/** Effective thermal voltage factor for 36-cell silicon PV string (~1.05V logarithmic slope) */
const PV_LOGARITHMIC_VOC_COEFF = 1.05;

/**
 * Computes the normalized educational DC output potential (0.0V to 12.0V) of a solar panel
 * from sunlight irradiance percentage. Includes input validation and clamping to [0, 100].
 *
 * @param sunlightPercent - Solar irradiance percentage (0 to 100, default 100)
 * @returns Normalized output voltage in Volts (0.0V to 12.0V)
 */
export function getSolarPanelVoltage(sunlightPercent: number = DEFAULT_SOLAR_SUNLIGHT_PERCENT): number {
  if (typeof sunlightPercent !== 'number' || Number.isNaN(sunlightPercent)) {
    return SOLAR_PANEL_MAX_VOLTAGE;
  }
  const clampedSunlight = Math.max(0, Math.min(100, sunlightPercent));
  return Number(((clampedSunlight / 100) * SOLAR_PANEL_MAX_VOLTAGE).toFixed(2));
}

/**
 * Computes physically realistic open-circuit photovoltaic Voc(G) from irradiance percentage
 * using silicon diode logarithmic dependence: Voc(G) = Voc_max + n*Vt * ln(G/G_ref).
 * Under diffuse clouds (e.g., 20% sunlight), Voc stays near ~10.3V while Isc drops linearly.
 *
 * @param sunlightPercent - Solar irradiance percentage (0 to 100)
 * @returns Physical photovoltaic open-circuit voltage in Volts (0.0V to 12.0V)
 */
export function getSolarOpenCircuitVoltageLogarithmic(
  sunlightPercent: number = DEFAULT_SOLAR_SUNLIGHT_PERCENT
): number {
  if (typeof sunlightPercent !== 'number' || !Number.isFinite(sunlightPercent)) {
    return SOLAR_PANEL_MAX_VOLTAGE;
  }
  const clampedSunlight = Math.max(0, Math.min(100, sunlightPercent));
  if (clampedSunlight <= 0.1) {
    return 0;
  }
  const irradianceRatio = clampedSunlight / 100;
  const logarithmicVoc = SOLAR_PANEL_MAX_VOLTAGE + PV_LOGARITHMIC_VOC_COEFF * Math.log(irradianceRatio);
  return Number(Math.max(0, Math.min(SOLAR_PANEL_MAX_VOLTAGE, logarithmicVoc)).toFixed(2));
}

/**
 * Computes irradiance-dependent effective series resistance of a PV array when modeling
 * linear photocurrent limiting under shading/diffuse irradiance.
 *
 * @param sunlightPercent - Solar irradiance percentage (0 to 100)
 * @param baseResistanceOhms - Nominal series resistance at 100% STC irradiance
 * @returns Effective internal source resistance in Ohms
 */
export function getSolarDynamicInternalResistance(
  sunlightPercent: number = DEFAULT_SOLAR_SUNLIGHT_PERCENT,
  baseResistanceOhms: number = SOLAR_PANEL_INTERNAL_RESISTANCE
): number {
  if (typeof sunlightPercent !== 'number' || !Number.isFinite(sunlightPercent)) {
    return baseResistanceOhms;
  }
  const irradianceRatio = Math.max(0.05, Math.min(1.0, sunlightPercent / 100));
  const safeBase = Math.max(0.05, baseResistanceOhms);
  return Number((safeBase / irradianceRatio).toFixed(2));
}
