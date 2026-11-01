/**
 * CIRCUIT 4.0 - Renewable Energy Digital Twin Type Definitions
 *
 * Provides type contracts for:
 * - Solar Photovoltaic (PV) environmental conditions and electrical characteristics
 * - Wind Turbine aerodynamic parameters and generation profiles
 * - Battery Energy Storage System (BESS) electrochemistry and degradation
 * - Coupled Microgrid power balance and autonomy metrics
 * - Educational renewable microgrid scenarios
 */

export type BatteryChemistry = 'lithium-ion' | 'lead-acid' | 'lfp';

export interface SolarPanelParameters {
  /** Rated open circuit voltage at STC (Volts) */
  readonly ratedVoc: number;
  /** Rated short circuit current at STC (Amperes) */
  readonly ratedIsc: number;
  /** Rated maximum power voltage at STC (Volts) */
  readonly ratedVmpp: number;
  /** Rated maximum power current at STC (Amperes) */
  readonly ratedImpp: number;
  /** Temperature coefficient of open-circuit voltage (%/°C, typically -0.3% to -0.4%) */
  readonly tempCoeffVoc: number;
  /** Temperature coefficient of short-circuit current (%/°C, typically +0.05%) */
  readonly tempCoeffIsc: number;
  /** Surface area of panel array in square meters */
  readonly arrayAreaM2: number;
  /** Nominal cell efficiency (0.0 - 1.0, e.g. 0.20 for 20%) */
  readonly nominalEfficiency: number;
}

export interface SolarEnvironmentalConditions {
  /** Global horizontal irradiance (W/m², typically 0 to 1200) */
  readonly irradiance: number;
  /** Solar altitude / sun elevation angle above horizon (0° to 90°) */
  readonly sunElevationDeg: number;
  /** Panel tilt angle from horizontal (0° to 90°) */
  readonly panelTiltDeg: number;
  /** Ambient air temperature (°C, typically -10 to 50) */
  readonly ambientTempCelsius: number;
  /** Shading factor (0.0 = completely unshaded, 1.0 = completely blocked) */
  readonly shadingFactor: number;
}

export interface SolarOperatingPoint {
  /** Effective irradiance reaching panel after tilt and shading (W/m²) */
  readonly effectiveIrradiance: number;
  /** Estimated photovoltaic cell temperature (°C) */
  readonly cellTemperatureCelsius: number;
  /** Adjusted open-circuit voltage (V) */
  readonly openCircuitVoltage: number;
  /** Adjusted short-circuit current (A) */
  readonly shortCircuitCurrent: number;
  /** Maximum power point voltage (V) */
  readonly vmpp: number;
  /** Maximum power point current (A) */
  readonly impp: number;
  /** Maximum power point wattage (W) */
  readonly pmpp: number;
  /** Fill factor (P_mpp / (Voc * Isc)) */
  readonly fillFactor: number;
}

export interface WindTurbineParameters {
  /** Cut-in wind speed where turbine starts producing power (m/s, typically 2.5 - 3.5) */
  readonly cutInSpeedMs: number;
  /** Rated wind speed where turbine reaches full rated electrical output (m/s, typically 11 - 13) */
  readonly ratedSpeedMs: number;
  /** Cut-out wind speed where turbine shuts down / furls for storm survival (m/s, typically 25) */
  readonly cutOutSpeedMs: number;
  /** Rated electrical output capacity (Watts) */
  readonly ratedPowerWatts: number;
  /** Rotor swept diameter in meters */
  readonly rotorDiameterMeters: number;
  /** Aerodynamic power coefficient Cp (max Betz limit is 0.593, typically 0.35 - 0.45) */
  readonly maxPowerCoefficientCp: number;
  /** Air density (kg/m³, standard sea level is ~1.225) */
  readonly airDensityKgM3: number;
}

export interface WindOperatingPoint {
  /** Current ambient wind velocity (m/s) */
  readonly windSpeedMs: number;
  /** Operating state of the turbine */
  readonly state: 'idle_calm' | 'generating' | 'rated_governed' | 'cutout_storm_shutdown';
  /** Mechanical power available in the wind stream across rotor area (Watts) */
  readonly availableAeroPowerWatts: number;
  /** Electrical output power produced (Watts) */
  readonly electricalOutputWatts: number;
  /** Effective power coefficient at this speed */
  readonly effectiveCp: number;
  /** Angular rotor speed (RPM estimated) */
  readonly estimatedRpm: number;
}

export interface BessParameters {
  /** Battery chemistry classification */
  readonly chemistry: BatteryChemistry;
  /** Total nominal energy storage capacity (Watt-hours) */
  readonly nominalCapacityWh: number;
  /** Nominal DC bus voltage (Volts, e.g. 12V, 24V, 48V) */
  readonly nominalVoltage: number;
  /** Coulombic charge efficiency (0.0 - 1.0, e.g. 0.96 for Li-ion, 0.85 for Lead-acid) */
  readonly coulombicEfficiency: number;
  /** Inverter / bidirectional DC-DC conversion efficiency (0.0 - 1.0, e.g. 0.94) */
  readonly roundTripEfficiency: number;
  /** Maximum safe charging C-rate (e.g. 0.5C or 1.0C) */
  readonly maxChargeCRate: number;
  /** Maximum safe discharging C-rate (e.g. 1.0C or 2.0C) */
  readonly maxDischargeCRate: number;
  /** Minimum safe SoC below which deep discharge cuts off (0% to 100%, e.g. 10% Li-ion, 50% Lead-acid) */
  readonly minSafeSoCPercent: number;
  /** Maximum safe SoC above which charging cuts off (0% to 100%, e.g. 100%) */
  readonly maxSafeSoCPercent: number;
}

export interface BessState {
  /** Current State of Charge (0% to 100%) */
  readonly stateOfChargePercent: number;
  /** Usable stored energy remaining (Watt-hours) */
  readonly currentEnergyWh: number;
  /** Current internal battery resistance (Ohms) */
  readonly internalResistanceOhms: number;
  /** Operational mode */
  readonly mode: 'charging' | 'discharging' | 'idle' | 'depleted' | 'fully_charged';
  /** Rate of power flow into (+charging) or out of (-discharging) the BESS (Watts) */
  readonly activePowerWatts: number;
  /** Cumulative equivalent full charge cycles experienced */
  readonly cycleCount: number;
  /** Estimated health / capacity retention percentage (100% = fresh) */
  readonly stateOfHealthPercent: number;
}

export interface MicrogridPowerBalance {
  /** Total instantaneous renewable generation: P_solar + P_wind (Watts) */
  readonly totalGenerationWatts: number;
  /** Solar power contribution (Watts) */
  readonly solarGenerationWatts: number;
  /** Wind turbine power contribution (Watts) */
  readonly windGenerationWatts: number;
  /** Total connected load demand (Watts) */
  readonly totalLoadWatts: number;
  /** Net balance: generation - load (Watts). Positive = surplus; Negative = deficit */
  readonly netPowerWatts: number;
  /** Power directed to (+) or supplied from (-) the battery storage system (Watts) */
  readonly bessDispatchWatts: number;
  /** Surplus power curtailed or exported to virtual grid (Watts) */
  readonly gridExportWatts: number;
  /** Deficit power imported from virtual grid (Watts) */
  readonly gridImportWatts: number;
  /** System operating status */
  readonly status: 'self_sufficient_surplus' | 'bess_supporting' | 'grid_importing' | 'blackout';
  /** Estimated hours of battery backup autonomy at current load */
  readonly autonomyHours: number;
}

export interface RenewableScenario {
  readonly id: string;
  readonly titleId: string;
  readonly titleEn: string;
  readonly summaryId: string;
  readonly summaryEn: string;
  readonly solarConditions: SolarEnvironmentalConditions;
  readonly windSpeedMs: number;
  readonly targetLoadWatts: number;
  readonly bessInitialSoCPercent: number;
  readonly educationalFocusId: string;
  readonly educationalFocusEn: string;
}
