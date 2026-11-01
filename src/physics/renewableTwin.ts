/**
 * CIRCUIT 4.0 - Renewable Energy Digital Twin Physics Engine
 *
 * Implements high-fidelity physical equations for:
 * 1. Solar Photovoltaic (PV) arrays with angle of incidence, cell temperature, and MPPT.
 * 2. Wind Turbines with Betz limit, cubic power ramp, rated speed governing, and high-wind storm furling.
 * 3. Battery Energy Storage Systems (BESS) with chemistry-dependent C-rate limits and Coulombic losses.
 * 4. Microgrid power balance and backup autonomy calculations.
 *
 * Algorithmic Complexity:
 * All individual evaluations are O(1) constant time arithmetic operations.
 * I-V curve generation is O(K) where K is the number of discrete display points.
 */

import {
  SolarPanelParameters,
  SolarEnvironmentalConditions,
  SolarOperatingPoint,
  WindTurbineParameters,
  WindOperatingPoint,
  BessParameters,
  BessState,
  MicrogridPowerBalance,
  RenewableScenario,
} from '../types/renewable';

/** Default baseline parameters for educational 100W Solar PV Module */
export const DEFAULT_SOLAR_PANEL_PARAMS: SolarPanelParameters = {
  ratedVoc: 21.6, // Volts
  ratedIsc: 6.1, // Amperes
  ratedVmpp: 18.0, // Volts
  ratedImpp: 5.56, // Amperes
  tempCoeffVoc: -0.34, // % / °C
  tempCoeffIsc: 0.05, // % / °C
  arrayAreaM2: 0.65, // m²
  nominalEfficiency: 0.18, // 18%
};

/** Default baseline parameters for 500W Small Wind Turbine */
export const DEFAULT_WIND_TURBINE_PARAMS: WindTurbineParameters = {
  cutInSpeedMs: 3.0, // m/s
  ratedSpeedMs: 12.0, // m/s
  cutOutSpeedMs: 25.0, // m/s
  ratedPowerWatts: 500.0, // Watts
  rotorDiameterMeters: 1.5, // meters
  maxPowerCoefficientCp: 0.42, // Betz limit theoretical ceiling is 0.593
  airDensityKgM3: 1.225, // kg/m³ at sea level 15°C
};

/** Default baseline parameters for 1 kWh Lithium Iron Phosphate (LFP) BESS */
export const DEFAULT_BESS_PARAMS: BessParameters = {
  chemistry: 'lfp',
  nominalCapacityWh: 1000.0, // 1000 Wh (approx 12V 83Ah)
  nominalVoltage: 12.8, // Volts
  coulombicEfficiency: 0.98, // 98%
  roundTripEfficiency: 0.92, // 92%
  maxChargeCRate: 0.5, // 0.5C = 500W
  maxDischargeCRate: 1.0, // 1.0C = 1000W
  minSafeSoCPercent: 10.0, // 10% reserve cutoff
  maxSafeSoCPercent: 100.0, // 100% full
};

/**
 * Calculates real-time electrical operating point for a solar PV module under
 * specific environmental irradiance, sun angle, ambient temperature, and shading.
 *
 * Physics Model:
 * 1. Geometric Angle of Incidence: theta_i = |90° - sunElevation - panelTilt|
 * 2. Effective Irradiance: G_eff = G_h * cos(theta_i) * (1 - shading)
 * 3. NOCT Cell Temperature: T_cell = T_amb + G_eff * (NOCT - 20) / 800
 * 4. Temperature Adjustments:
 *    Voc(T) = Voc_rated * (1 + beta_V * (T_cell - 25))
 *    Isc(G, T) = Isc_rated * (G_eff / 1000) * (1 + alpha_I * (T_cell - 25))
 *
 * @param panel - Technical specifications of the solar module
 * @param env - Ambient environmental conditions
 * @returns Comprehensive operating point including Voc, Isc, Vmpp, Impp, and Pmpp
 *
 * Time Complexity: O(1)
 */
export function calculateSolarOperatingPoint(
  panel: SolarPanelParameters = DEFAULT_SOLAR_PANEL_PARAMS,
  env: SolarEnvironmentalConditions
): SolarOperatingPoint {
  // Validate and clamp inputs
  const rawIrradiance = Math.max(0, Number.isFinite(env.irradiance) ? env.irradiance : 0);
  const sunElevation = Math.max(0, Math.min(90, Number.isFinite(env.sunElevationDeg) ? env.sunElevationDeg : 45));
  const panelTilt = Math.max(0, Math.min(90, Number.isFinite(env.panelTiltDeg) ? env.panelTiltDeg : 15));
  const shading = Math.max(0, Math.min(1, Number.isFinite(env.shadingFactor) ? env.shadingFactor : 0));
  const ambientTemp = Number.isFinite(env.ambientTempCelsius) ? env.ambientTempCelsius : 25;

  // Calculate angle of incidence (difference between sun ray and panel normal)
  const angleOfIncidenceDeg = Math.abs(90 - sunElevation - panelTilt);
  const cosineFactor = Math.max(0, Math.cos((angleOfIncidenceDeg * Math.PI) / 180));

  // Compute effective incident solar irradiance
  const effectiveIrradiance = Number((rawIrradiance * cosineFactor * (1 - shading)).toFixed(2));

  // Nominal Operating Cell Temperature (NOCT typically ~45°C)
  const noctCelsius = 45;
  const cellTemperatureCelsius = Number(
    (ambientTemp + (effectiveIrradiance * (noctCelsius - 20)) / 800).toFixed(1)
  );

  const deltaTemp = cellTemperatureCelsius - 25; // Delta from Standard Test Conditions (25°C)

  // Open-circuit voltage drops as cell temperature rises (negative temperature coefficient)
  const tempVocMultiplier = 1 + (panel.tempCoeffVoc / 100) * deltaTemp;
  const irradianceVocLogShift = effectiveIrradiance > 1
    ? 0.05 * Math.log(effectiveIrradiance / 1000)
    : -1.0;

  const rawVoc = panel.ratedVoc * tempVocMultiplier * (1 + irradianceVocLogShift);
  const openCircuitVoltage = Number(Math.max(0, rawVoc).toFixed(2));

  // Short-circuit current is directly proportional to irradiance with slight positive temp coefficient
  const tempIscMultiplier = 1 + (panel.tempCoeffIsc / 100) * deltaTemp;
  const rawIsc = panel.ratedIsc * (effectiveIrradiance / 1000) * Math.max(0.1, tempIscMultiplier);
  const shortCircuitCurrent = Number(Math.max(0, rawIsc).toFixed(2));

  // MPPT voltage and current
  const rawVmpp = panel.ratedVmpp * tempVocMultiplier * (effectiveIrradiance > 50 ? 1 : effectiveIrradiance / 50);
  const vmpp = Number(Math.max(0, Math.min(openCircuitVoltage * 0.85, rawVmpp)).toFixed(2));

  const rawImpp = panel.ratedImpp * (effectiveIrradiance / 1000) * tempIscMultiplier;
  const impp = Number(Math.max(0, Math.min(shortCircuitCurrent, rawImpp)).toFixed(2));

  const pmpp = Number((vmpp * impp).toFixed(2));

  // Fill factor: FF = Pmpp / (Voc * Isc)
  const theoreticalMaxVI = openCircuitVoltage * shortCircuitCurrent;
  const fillFactor = theoreticalMaxVI > 0.01
    ? Number(Math.min(0.85, Math.max(0.4, pmpp / theoreticalMaxVI)).toFixed(3))
    : 0;

  return {
    effectiveIrradiance,
    cellTemperatureCelsius,
    openCircuitVoltage,
    shortCircuitCurrent,
    vmpp,
    impp,
    pmpp,
    fillFactor,
  };
}

/**
 * Generates discrete points for plotting continuous I-V and P-V solar characteristic curves.
 * Uses an educational empirical exponential diode approximation.
 *
 * @param operatingPoint - Computed solar operating point
 * @param pointsCount - Number of sample points across voltage axis (default 25)
 * @returns Array of { voltage, current, power } tuples
 *
 * Time Complexity: O(K) where K = pointsCount
 */
export function generateSolarIVCurve(
  operatingPoint: SolarOperatingPoint,
  pointsCount: number = 25
): Array<{ voltage: number; current: number; power: number }> {
  const curvePoints: Array<{ voltage: number; current: number; power: number }> = [];
  const voc = operatingPoint.openCircuitVoltage;
  const isc = operatingPoint.shortCircuitCurrent;

  if (voc <= 0 || isc <= 0) {
    return [{ voltage: 0, current: 0, power: 0 }];
  }

  const vStep = voc / Math.max(1, pointsCount - 1);

  for (let index = 0; index < pointsCount; index++) {
    const voltage = Number((index * vStep).toFixed(2));
    // Single diode normalized equation: I(V) = Isc * (1 - (V/Voc)^k)
    // Fit exponent k around 4.5 - 6.0 to match typical crystalline silicon fill factors
    const normalizedV = Math.min(1.0, voltage / voc);
    const exponent = 5.2;
    const current = Number(Math.max(0, isc * (1 - Math.pow(normalizedV, exponent))).toFixed(2));
    const power = Number((voltage * current).toFixed(2));

    curvePoints.push({ voltage, current, power });
  }

  return curvePoints;
}

/**
 * Calculates electrical and aerodynamic output of a wind turbine based on ambient wind speed.
 *
 * Operational Regimes:
 * 1. Calm / Below cut-in: v < cutInSpeed -> idle rotor, 0W
 * 2. Generating ramp: cutInSpeed <= v < ratedSpeed -> cubic aerodynamic power curve
 * 3. Rated governing: ratedSpeed <= v <= cutOutSpeed -> pitch/furling governor clamps to rated output
 * 4. Storm shutdown: v > cutOutSpeed -> aerodynamic braking / furling for mechanical preservation
 *
 * @param turbine - Turbine structural and aerodynamic ratings
 * @param windSpeedMs - Current ambient wind speed in meters per second
 * @returns Real-time operating state and electrical power generated
 *
 * Time Complexity: O(1)
 */
export function calculateWindOperatingPoint(
  turbine: WindTurbineParameters = DEFAULT_WIND_TURBINE_PARAMS,
  windSpeedMs: number
): WindOperatingPoint {
  const speed = Math.max(0, Number.isFinite(windSpeedMs) ? windSpeedMs : 0);

  // Swept rotor area: A = pi * (D/2)^2
  const rotorRadius = turbine.rotorDiameterMeters / 2;
  const sweptAreaM2 = Math.PI * rotorRadius * rotorRadius;

  // Kinetic energy flux in the free wind stream: P_wind = 0.5 * rho * A * v^3
  const availableAeroPowerWatts = Number(
    (0.5 * turbine.airDensityKgM3 * sweptAreaM2 * Math.pow(speed, 3)).toFixed(1)
  );

  // State determination
  if (speed < turbine.cutInSpeedMs) {
    return {
      windSpeedMs: speed,
      state: 'idle_calm',
      availableAeroPowerWatts,
      electricalOutputWatts: 0,
      effectiveCp: 0,
      estimatedRpm: Number((speed * 5).toFixed(0)),
    };
  }

  if (speed > turbine.cutOutSpeedMs) {
    return {
      windSpeedMs: speed,
      state: 'cutout_storm_shutdown',
      availableAeroPowerWatts,
      electricalOutputWatts: 0,
      effectiveCp: 0,
      estimatedRpm: 0, // Safely locked by brake
    };
  }

  if (speed >= turbine.ratedSpeedMs) {
    // Pitch/governor control maintains constant rated electrical output
    return {
      windSpeedMs: speed,
      state: 'rated_governed',
      availableAeroPowerWatts,
      electricalOutputWatts: turbine.ratedPowerWatts,
      effectiveCp: Number(
        Math.min(turbine.maxPowerCoefficientCp, turbine.ratedPowerWatts / Math.max(1, availableAeroPowerWatts)).toFixed(3)
      ),
      estimatedRpm: 350, // Governor maintains maximum nominal generator RPM
    };
  }

  // Intermediate generating regime between cut-in and rated speed: cubic power curve
  const normalizedSpeed =
    (speed - turbine.cutInSpeedMs) / (turbine.ratedSpeedMs - turbine.cutInSpeedMs);
  const electricalOutputWatts = Number(
    (turbine.ratedPowerWatts * Math.pow(normalizedSpeed, 3)).toFixed(1)
  );

  const effectiveCp = availableAeroPowerWatts > 0
    ? Number(Math.min(turbine.maxPowerCoefficientCp, electricalOutputWatts / availableAeroPowerWatts).toFixed(3))
    : 0;

  const estimatedRpm = Number(
    (80 + normalizedSpeed * (350 - 80)).toFixed(0)
  );

  return {
    windSpeedMs: speed,
    state: 'generating',
    availableAeroPowerWatts,
    electricalOutputWatts,
    effectiveCp,
    estimatedRpm,
  };
}

/**
 * Simulates Battery Energy Storage System (BESS) dynamic charge/discharge response.
 *
 * @param bess - Battery technical parameters
 * @param currentSoCPercent - Current State of Charge (0 - 100%)
 * @param netPowerWatts - Net power offered (+ = surplus to charge, - = deficit to supply)
 * @param durationHours - Simulation time step duration in hours (e.g. 1.0 or 0.1)
 * @returns Updated BESS state including SoC%, remaining Wh, resistance, and mode
 *
 * Time Complexity: O(1)
 */
export function calculateBessDynamicState(
  bess: BessParameters = DEFAULT_BESS_PARAMS,
  currentSoCPercent: number,
  netPowerWatts: number,
  durationHours: number = 1.0
): BessState {
  const initialSoC = Math.max(0, Math.min(100, Number.isFinite(currentSoCPercent) ? currentSoCPercent : 50));
  const initialEnergyWh = (initialSoC / 100) * bess.nominalCapacityWh;

  // Maximum charge and discharge electrical limits based on C-rate
  const maxChargeWatts = bess.nominalCapacityWh * bess.maxChargeCRate;
  const maxDischargeWatts = bess.nominalCapacityWh * bess.maxDischargeCRate;

  // Dynamic internal resistance: baseline 0.04 Ohm, escalates non-linearly at extreme SoC
  let internalResistanceOhms = 0.04;
  if (initialSoC < 15) {
    internalResistanceOhms += 0.08 * ((15 - initialSoC) / 15);
  } else if (initialSoC > 90) {
    internalResistanceOhms += 0.04 * ((initialSoC - 90) / 10);
  }

  let finalSoC = initialSoC;
  let finalEnergyWh = initialEnergyWh;
  let activePowerWatts = 0;
  let mode: BessState['mode'] = 'idle';

  if (netPowerWatts > 0) {
    // Charging from renewable surplus
    if (initialSoC >= bess.maxSafeSoCPercent) {
      mode = 'fully_charged';
      activePowerWatts = 0;
    } else {
      mode = 'charging';
      // Clamp charge rate by maximum permissible C-rate
      const targetChargePower = Math.min(netPowerWatts, maxChargeWatts);
      // Available energy capacity headroom
      const capacityHeadroomWh = bess.nominalCapacityWh - initialEnergyWh;
      // Energy added accounting for Coulombic and DC-DC conversion efficiency
      const potentialEnergyAddedWh =
        targetChargePower * durationHours * bess.coulombicEfficiency * bess.roundTripEfficiency;

      const actualEnergyAddedWh = Math.min(capacityHeadroomWh, potentialEnergyAddedWh);
      activePowerWatts = Number((actualEnergyAddedWh / (durationHours * bess.coulombicEfficiency * bess.roundTripEfficiency)).toFixed(1));

      finalEnergyWh = initialEnergyWh + actualEnergyAddedWh;
      finalSoC = Number(((finalEnergyWh / bess.nominalCapacityWh) * 100).toFixed(1));
    }
  } else if (netPowerWatts < 0) {
    // Discharging to cover load deficit
    if (initialSoC <= bess.minSafeSoCPercent) {
      mode = 'depleted';
      activePowerWatts = 0;
    } else {
      mode = 'discharging';
      const demandWatts = Math.abs(netPowerWatts);
      // Clamp discharge rate by maximum permissible C-rate
      const targetDischargePower = Math.min(demandWatts, maxDischargeWatts);
      // Usable energy remaining above safe minimum cutoff reserve
      const usableReserveWh = Math.max(0, initialEnergyWh - (bess.minSafeSoCPercent / 100) * bess.nominalCapacityWh);
      // Energy drained from electrochemical cells accounting for conversion losses
      const energyDrainedWh = (targetDischargePower * durationHours) / bess.roundTripEfficiency;

      const actualEnergyDrainedWh = Math.min(usableReserveWh, energyDrainedWh);
      activePowerWatts = -Number((actualEnergyDrainedWh * bess.roundTripEfficiency / durationHours).toFixed(1));

      finalEnergyWh = Math.max(0, initialEnergyWh - actualEnergyDrainedWh);
      finalSoC = Number(((finalEnergyWh / bess.nominalCapacityWh) * 100).toFixed(1));
    }
  }

  // Estimated degradation / cycle counter
  const deltaSoC = Math.abs(finalSoC - initialSoC);
  const cycleCount = Number((deltaSoC / 200).toFixed(4));
  const stateOfHealthPercent = Number(Math.max(70, 100 - cycleCount * 0.05).toFixed(1));

  return {
    stateOfChargePercent: finalSoC,
    currentEnergyWh: Number(finalEnergyWh.toFixed(1)),
    internalResistanceOhms: Number(internalResistanceOhms.toFixed(3)),
    mode,
    activePowerWatts,
    cycleCount,
    stateOfHealthPercent,
  };
}

/**
 * Calculates complete coupled microgrid power balance across solar, wind, load, battery, and grid.
 *
 * Energy Conservation Law:
 * P_gen = P_solar + P_wind
 * P_net = P_gen - P_load
 *
 * If P_net > 0:
 *   Charges BESS up to max charging rate; excess exports to virtual grid.
 * If P_net < 0:
 *   Discharges BESS up to max discharge rate; remaining deficit imports from virtual grid.
 *   If storage depleted and grid absent, initiates blackout status.
 *
 * @param solarGenWatts - Instantaneous solar PV power output (W)
 * @param windGenWatts - Instantaneous wind turbine power output (W)
 * @param loadDemandWatts - Total active electrical load demand (W)
 * @param bess - Battery storage technical parameters
 * @param bessSoCPercent - Current battery State of Charge (0 - 100%)
 * @returns Detailed microgrid power flow balance and autonomy metrics
 *
 * Time Complexity: O(1)
 */
export function computeMicrogridPowerBalance(
  solarGenWatts: number,
  windGenWatts: number,
  loadDemandWatts: number,
  bess: BessParameters = DEFAULT_BESS_PARAMS,
  bessSoCPercent: number = 75
): MicrogridPowerBalance {
  const solarGen = Math.max(0, Number.isFinite(solarGenWatts) ? solarGenWatts : 0);
  const windGen = Math.max(0, Number.isFinite(windGenWatts) ? windGenWatts : 0);
  const loadDemand = Math.max(0, Number.isFinite(loadDemandWatts) ? loadDemandWatts : 0);

  const totalGenerationWatts = Number((solarGen + windGen).toFixed(1));
  const netPowerWatts = Number((totalGenerationWatts - loadDemand).toFixed(1));

  const maxBessChargePower = bess.nominalCapacityWh * bess.maxChargeCRate;
  const maxBessDischargePower = bess.nominalCapacityWh * bess.maxDischargeCRate;

  // Usable battery energy above minimum safe cutoff
  const usableEnergyWh = Math.max(
    0,
    ((Math.max(bess.minSafeSoCPercent, bessSoCPercent) - bess.minSafeSoCPercent) / 100) * bess.nominalCapacityWh
  );

  let bessDispatchWatts = 0;
  let gridExportWatts = 0;
  let gridImportWatts = 0;
  let status: MicrogridPowerBalance['status'] = 'self_sufficient_surplus';

  if (netPowerWatts >= 0) {
    // Generation surplus: prioritize BESS charging, then export
    if (bessSoCPercent < bess.maxSafeSoCPercent) {
      const chargeAbsorptionCapacity = (1 - bessSoCPercent / 100) * bess.nominalCapacityWh;
      bessDispatchWatts = Number(
        Math.min(netPowerWatts, maxBessChargePower, chargeAbsorptionCapacity).toFixed(1)
      );
    }
    gridExportWatts = Number(Math.max(0, netPowerWatts - bessDispatchWatts).toFixed(1));
    status = 'self_sufficient_surplus';
  } else {
    // Generation deficit: prioritize BESS discharging, then grid import
    const deficitWatts = Math.abs(netPowerWatts);
    if (bessSoCPercent > bess.minSafeSoCPercent && usableEnergyWh > 0) {
      bessDispatchWatts = -Number(
        Math.min(deficitWatts, maxBessDischargePower, usableEnergyWh).toFixed(1)
      );
    }

    const remainingDeficit = deficitWatts - Math.abs(bessDispatchWatts);
    if (remainingDeficit > 0.1) {
      gridImportWatts = Number(remainingDeficit.toFixed(1));
      status = 'grid_importing';
    } else {
      status = 'bess_supporting';
    }
  }

  // Backup autonomy hours calculation
  let autonomyHours = 0;
  if (loadDemand > 0) {
    if (netPowerWatts >= 0) {
      autonomyHours = 999.0; // Infinite/fully self-sustaining under continuous surplus
    } else {
      const netDeficit = Math.abs(netPowerWatts);
      autonomyHours = Number((usableEnergyWh / netDeficit).toFixed(1));
    }
  }

  return {
    totalGenerationWatts,
    solarGenerationWatts: solarGen,
    windGenerationWatts: windGen,
    totalLoadWatts: loadDemand,
    netPowerWatts,
    bessDispatchWatts,
    gridExportWatts,
    gridImportWatts,
    status,
    autonomyHours,
  };
}

/**
 * 6 Pre-configured pedagogical renewable scenarios for interactive exploration.
 */
export const RENEWABLE_SCENARIOS: RenewableScenario[] = [
  {
    id: 'scenario_offgrid_home',
    titleId: 'Sistem Rumah Surya Mandiri (Off-Grid Solar Home)',
    titleEn: 'Off-Grid Solar Home System',
    summaryId: 'Pembangkit surya siang hari menyuplai beban lampu & kipas sekaligus mengisi baterai penyimpanan.',
    summaryEn: 'Daytime solar PV powers household lighting and fan loads while recharging the battery bank.',
    solarConditions: {
      irradiance: 850,
      sunElevationDeg: 60,
      panelTiltDeg: 15,
      ambientTempCelsius: 30,
      shadingFactor: 0.0,
    },
    windSpeedMs: 1.5,
    targetLoadWatts: 60,
    bessInitialSoCPercent: 45,
    educationalFocusId: 'Memahami kurva P-V dan pengisian baterai mandiri.',
    educationalFocusEn: 'Understand P-V curves and self-sufficient battery charging.',
  },
  {
    id: 'scenario_hybrid_microgrid',
    titleId: 'Microgrid Hibrida Surya & Angin',
    titleEn: 'Solar & Wind Hybrid Microgrid',
    summaryId: 'Kombinasi energi surya di siang hari dan hembusan angin pesisir untuk kestabilan pasokan 24 jam.',
    summaryEn: 'Combined diurnal solar and coastal wind turbine ensuring resilient 24-hour power supply.',
    solarConditions: {
      irradiance: 700,
      sunElevationDeg: 45,
      panelTiltDeg: 20,
      ambientTempCelsius: 28,
      shadingFactor: 0.05,
    },
    windSpeedMs: 8.5,
    targetLoadWatts: 180,
    bessInitialSoCPercent: 70,
    educationalFocusId: 'Sinergi komplementer pembangkit surya dan turbin angin.',
    educationalFocusEn: 'Complementary synergy of solar PV and wind turbine generation.',
  },
  {
    id: 'scenario_cloud_drop',
    titleId: 'Penurunan Radiasi Akibat Awan Mendung',
    titleEn: 'Cloud Cover & Irradiance Transient Drop',
    summaryId: 'Awan tebal mendadak menutupi matahari; amati bagaimana baterai BESS merespons seketika mencegah pemadaman.',
    summaryEn: 'Sudden thick cloud cover causes irradiance drop; observe instantaneous BESS discharge preventing blackout.',
    solarConditions: {
      irradiance: 180,
      sunElevationDeg: 55,
      panelTiltDeg: 15,
      ambientTempCelsius: 24,
      shadingFactor: 0.65,
    },
    windSpeedMs: 2.0,
    targetLoadWatts: 85,
    bessInitialSoCPercent: 85,
    educationalFocusId: 'Dinamika pelepasan daya BESS saat terjadi transient penurunan surya.',
    educationalFocusEn: 'BESS rapid dispatch dynamics during sudden solar transient drops.',
  },
  {
    id: 'scenario_high_wind_storm',
    titleId: 'Badai Angin Kencang & Proteksi Furling Turbin',
    titleEn: 'High Wind Gale & Furling Storm Shutdown',
    summaryId: 'Kecepatan angin melebihi 25 m/s memicu sistem pengereman mekanis otomatis turbin demi keselamatan.',
    summaryEn: 'Wind speed exceeds 25 m/s triggering automated aerodynamic braking and furling for mechanical safety.',
    solarConditions: {
      irradiance: 300,
      sunElevationDeg: 30,
      panelTiltDeg: 15,
      ambientTempCelsius: 22,
      shadingFactor: 0.2,
    },
    windSpeedMs: 27.5,
    targetLoadWatts: 120,
    bessInitialSoCPercent: 60,
    educationalFocusId: 'Prinsip batas Betz dan batas kecepatan potong (cut-out) turbin angin.',
    educationalFocusEn: 'Betz limit principles and wind turbine cut-out safety shutdown.',
  },
  {
    id: 'scenario_peak_shaving',
    titleId: 'Peak Shaving Baterai saat Beban Puncak',
    titleEn: 'BESS Commercial Peak Shaving',
    summaryId: 'Beban listrik melonjak tinggi; baterai memotong puncak beban agar tidak melebihi daya kontrak jaringan.',
    summaryEn: 'Load spikes during peak hours; BESS discharges to shave peak demand below grid capacity limit.',
    solarConditions: {
      irradiance: 950,
      sunElevationDeg: 75,
      panelTiltDeg: 10,
      ambientTempCelsius: 32,
      shadingFactor: 0.0,
    },
    windSpeedMs: 5.0,
    targetLoadWatts: 350,
    bessInitialSoCPercent: 90,
    educationalFocusId: 'Strategi efisiensi energi komersial menggunakan battery peak shaving.',
    educationalFocusEn: 'Commercial energy efficiency strategy using battery peak shaving.',
  },
  {
    id: 'scenario_zero_emission_school',
    titleId: 'Microgrid Sekolah Mandiri Nol Emisi',
    titleEn: 'Zero-Emission Self-Sustaining School Microgrid',
    summaryId: 'Desain microgrid lengkap untuk menyuplai ruang kelas, laboratorium komputer, dan penerangan sekolah.',
    summaryEn: 'Complete microgrid design powering school classrooms, computer labs, and campus lighting.',
    solarConditions: {
      irradiance: 1000,
      sunElevationDeg: 80,
      panelTiltDeg: 15,
      ambientTempCelsius: 29,
      shadingFactor: 0.0,
    },
    windSpeedMs: 6.0,
    targetLoadWatts: 200,
    bessInitialSoCPercent: 80,
    educationalFocusId: 'Perhitungan otonomi energi dan keandalan sistem tenaga terbarukan.',
    educationalFocusEn: 'Energy autonomy calculation and renewable power system reliability.',
  },
];
