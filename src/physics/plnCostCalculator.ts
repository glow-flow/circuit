import { Node } from 'reactflow';
import { CircuitElementData, SimulationResult } from '../types/circuit';

/**
 * Official PT PLN (Persero) / Kementerian ESDM household tariff categories (Golongan Tarif Rumah Tangga).
 */
export type PlnTariffTierId =
  | 'R1_900_SUBSIDI'
  | 'R1_900_RTM'
  | 'R1_1300_2200'
  | 'R2_3500_5500';

export interface PlnTariffTier {
  id: PlnTariffTierId;
  code: string;
  labelId: string;
  labelEn: string;
  vaRating: string;
  ratePerKwhIdr: number;
  isSubsidized: boolean;
}

/**
 * Scale factor to help students compare raw miniature lab circuits (mW/W)
 * against real room/household installations.
 */
export type PlnScaleMultiplier = 1 | 100 | 1000;

export interface ComponentPowerBreakdownItem {
  nodeId: string;
  label: string;
  componentType: string;
  rawPowerWatts: number;
  scaledPowerWatts: number;
  sharePercentage: number;
  monthlyCostIdr: number;
}

export interface PlnCostEstimateResult {
  tariffTier: PlnTariffTier;
  dailyHours: number;
  scaleMultiplier: PlnScaleMultiplier;
  rawTotalPowerWatts: number;
  effectivePowerWatts: number;
  effectivePowerKilowatts: number;
  dailyEnergyWh: number;
  dailyEnergyKwh: number;
  monthlyEnergyKwh: number;
  yearlyEnergyKwh: number;
  dailyCostIdr: number;
  monthlyCostIdr: number;
  yearlyCostIdr: number;
  renewablePowerWatts: number;
  nonRenewablePowerWatts: number;
  greenEnergySharePercent: number;
  monthlyPlnSavingsIdr: number;
  netMonthlyPlnBillIdr: number;
  monthlyCo2SavedKg: number;
  componentBreakdown: ComponentPowerBreakdownItem[];
}

/**
 * Official PT PLN (Persero) residential electricity rates in Rupiah per kWh.
 */
export const PLN_TARIFF_TIERS: ReadonlyArray<PlnTariffTier> = [
  {
    id: 'R1_900_SUBSIDI',
    code: 'R-1/TR 900 VA (Subsidi)',
    labelId: '900 VA Subsidi (Rp 605/kWh)',
    labelEn: '900 VA Subsidized (Rp 605/kWh)',
    vaRating: '900 VA',
    ratePerKwhIdr: 605,
    isSubsidized: true,
  },
  {
    id: 'R1_900_RTM',
    code: 'R-1/TR 900 VA RTM',
    labelId: '900 VA Rumah Tangga Mampu (Rp 1.352/kWh)',
    labelEn: '900 VA Non-Subsidized (Rp 1,352/kWh)',
    vaRating: '900 VA RTM',
    ratePerKwhIdr: 1352,
    isSubsidized: false,
  },
  {
    id: 'R1_1300_2200',
    code: 'R-1/TR 1.300 - 2.200 VA',
    labelId: '1.300 / 2.200 VA Nonsubsidi (Rp 1.444,70/kWh)',
    labelEn: '1,300 / 2,200 VA Household (Rp 1,444.70/kWh)',
    vaRating: '1.300 - 2.200 VA',
    ratePerKwhIdr: 1444.7,
    isSubsidized: false,
  },
  {
    id: 'R2_3500_5500',
    code: 'R-2/TR 3.500 - 5.500 VA',
    labelId: '3.500 - 5.500 VA Rumah Besar (Rp 1.699,53/kWh)',
    labelEn: '3,500 - 5,500 VA Large Home (Rp 1,699.53/kWh)',
    vaRating: '3.500+ VA',
    ratePerKwhIdr: 1699.53,
    isSubsidized: false,
  },
];

/** Average grid emission factor (kg CO2 per kWh) for Java-Madura-Bali power grid. */
const GRID_CO2_KG_PER_KWH = 0.85;

/**
 * Looks up a PLN tariff tier by ID with safe fallback to `R1_1300_2200`.
 *
 * @param tierId Identifier of the desired PLN tariff tier
 * @returns Matching `PlnTariffTier` object
 * Time Complexity: O(1) over the fixed 4-tier catalog.
 */
export function getPlnTariffTier(tierId: PlnTariffTierId): PlnTariffTier {
  return (
    PLN_TARIFF_TIERS.find((tier) => tier.id === tierId) ?? PLN_TARIFF_TIERS[2]
  );
}

/**
 * Formats a numeric Rupiah value into a human-friendly Indonesian currency string (`Rp ...`).
 * Handles sub-rupiah precision for miniature lab circuits as well as standard integer formatting.
 *
 * @param amountIdr Amount in Indonesian Rupiah
 * @returns Formatted currency string (e.g. `"Rp 14.447"` or `"Rp 2,50"`)
 * Time Complexity: O(1)
 */
export function formatRupiah(amountIdr: number): string {
  try {
    if (!Number.isFinite(amountIdr) || amountIdr <= 0) {
      return 'Rp 0';
    }
    if (amountIdr < 1) {
      return `Rp ${amountIdr.toFixed(2).replace('.', ',')}`;
    }
    if (amountIdr < 100) {
      return `Rp ${amountIdr.toFixed(1).replace('.', ',')}`;
    }
    const rounded = Math.round(amountIdr);
    return `Rp ${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  } catch {
    return 'Rp 0';
  }
}

/**
 * Calculates the electrical energy consumption ($W = P \times t$) in Wh/kWh,
 * estimated PT PLN (Persero) electricity bill in Rupiah (daily, monthly, yearly),
 * per-component power breakdown, and green energy savings from Solar Panels & Wind Turbines.
 *
 * @param nodes Circuit canvas nodes (both Lab and Outdoor)
 * @param simulation Live MNA simulation state containing branch currents and total power
 * @param tariffTierId Selected PLN household tariff tier ID
 * @param dailyUsageHours Hours of active usage per day (clamped to 0..24)
 * @param scaleMultiplier Optional scale multiplier (`1` = Lab scale, `100` = Room scale, `1000` = House scale)
 * @returns Structured `PlnCostEstimateResult`
 * Time Complexity: O(N) where N is the number of nodes in the circuit.
 */
export function calculatePlnCostEstimate(
  nodes: ReadonlyArray<Node<CircuitElementData>>,
  simulation: Pick<SimulationResult, 'branchCurrents' | 'totalPowerDrawn'>,
  tariffTierId: PlnTariffTierId = 'R1_1300_2200',
  dailyUsageHours: number = 8,
  scaleMultiplier: PlnScaleMultiplier = 1
): PlnCostEstimateResult {
  const tariffTier = getPlnTariffTier(tariffTierId);

  try {
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const branchCurrents = simulation?.branchCurrents ?? {};

    const clampedHours = Number.isFinite(dailyUsageHours)
      ? Math.max(0, Math.min(24, dailyUsageHours))
      : 8;
    const safeMultiplier: PlnScaleMultiplier =
      scaleMultiplier === 100 || scaleMultiplier === 1000 ? scaleMultiplier : 1;

    const rawPowerFromSim = Number.isFinite(simulation?.totalPowerDrawn)
      ? Math.max(0, simulation.totalPowerDrawn)
      : 0;

    // Single pass O(N) over nodes to compute per-load consumption and renewable generation
    let renewablePowerWatts = 0;
    let nonRenewablePowerWatts = 0;
    let summedLoadPowerWatts = 0;

    const rawLoadItems: Array<{
      nodeId: string;
      label: string;
      componentType: string;
      rawPowerWatts: number;
    }> = [];

    for (let i = 0; i < safeNodes.length; i++) {
      const node = safeNodes[i];
      if (!node || !node.data) continue;

      const compType = node.data.type;
      const currentAmps = Math.abs(branchCurrents[node.id] ?? 0);
      if (!Number.isFinite(currentAmps) || currentAmps <= 1e-6) {
        continue;
      }

      // Check if this node is a power source supplying energy
      if (compType === 'solar-panel' || compType === 'solar_panel') {
        const sourceVoltage = Math.max(
          0,
          node.data.voltage ?? ((node.data.sunlight ?? 100) / 100) * 12.0
        );
        renewablePowerWatts += sourceVoltage * currentAmps;
        continue;
      }

      if (compType === 'wind-turbine' || compType === 'wind_turbine') {
        const sourceVoltage = Math.max(
          0,
          node.data.voltage ?? ((node.data.speed ?? 50) / 100) * 12.0
        );
        renewablePowerWatts += sourceVoltage * currentAmps;
        continue;
      }

      if (
        compType === 'battery' ||
        compType === 'battery9v' ||
        compType === 'battery-holder'
      ) {
        const sourceVoltage = Math.max(0, node.data.voltage ?? 1.5);
        nonRenewablePowerWatts += sourceVoltage * currentAmps;
        continue;
      }

      // Check if this node is a resistive/lamp load dissipating power P = I^2 * R
      const isBulbOrSocketLoad =
        compType === 'bulb' ||
        compType === 'resistor' ||
        (compType === 'socket' && Boolean(node.data.installedBulb)) ||
        (compType === 'pin-socket' && Boolean(node.data.installedBulb));

      if (isBulbOrSocketLoad) {
        const loadResistance = Math.max(0.1, node.data.resistance ?? 100);
        const dissipatedWatts = currentAmps * currentAmps * loadResistance;
        if (dissipatedWatts > 1e-5) {
          summedLoadPowerWatts += dissipatedWatts;
          rawLoadItems.push({
            nodeId: node.id,
            label: node.data.label || compType,
            componentType: compType,
            rawPowerWatts: dissipatedWatts,
          });
        }
      }
    }

    const rawTotalPowerWatts = Math.max(rawPowerFromSim, summedLoadPowerWatts);
    const effectivePowerWatts = rawTotalPowerWatts * safeMultiplier;
    const effectivePowerKilowatts = effectivePowerWatts / 1000;

    // Energy W = P * t
    const dailyEnergyWh = effectivePowerWatts * clampedHours;
    const dailyEnergyKwh = dailyEnergyWh / 1000;
    const monthlyEnergyKwh = dailyEnergyKwh * 30;
    const yearlyEnergyKwh = dailyEnergyKwh * 365;

    // Cost in IDR (if 100% supplied by PLN tariff)
    const dailyCostIdr = dailyEnergyKwh * tariffTier.ratePerKwhIdr;
    const monthlyCostIdr = monthlyEnergyKwh * tariffTier.ratePerKwhIdr;
    const yearlyCostIdr = yearlyEnergyKwh * tariffTier.ratePerKwhIdr;

    // Green Energy (Solar + Wind) Share & Savings
    const totalSourcePowerWatts = renewablePowerWatts + nonRenewablePowerWatts;
    const greenEnergyShareRatio =
      totalSourcePowerWatts > 1e-5
        ? Math.min(1, renewablePowerWatts / totalSourcePowerWatts)
        : 0;
    const greenEnergySharePercent = Math.round(greenEnergyShareRatio * 100);

    const monthlyPlnSavingsIdr = monthlyCostIdr * greenEnergyShareRatio;
    const netMonthlyPlnBillIdr = Math.max(0, monthlyCostIdr - monthlyPlnSavingsIdr);
    const monthlyCo2SavedKg =
      monthlyEnergyKwh * greenEnergyShareRatio * GRID_CO2_KG_PER_KWH;

    // Sort breakdown items from highest power consumer to lowest
    const componentBreakdown: ComponentPowerBreakdownItem[] = rawLoadItems
      .sort((a, b) => b.rawPowerWatts - a.rawPowerWatts)
      .map((item) => {
        const shareRatio =
          rawTotalPowerWatts > 1e-6
            ? Math.min(1, item.rawPowerWatts / rawTotalPowerWatts)
            : 0;
        return {
          nodeId: item.nodeId,
          label: item.label,
          componentType: item.componentType,
          rawPowerWatts: item.rawPowerWatts,
          scaledPowerWatts: item.rawPowerWatts * safeMultiplier,
          sharePercentage: Math.round(shareRatio * 100),
          monthlyCostIdr: monthlyCostIdr * shareRatio,
        };
      });

    return {
      tariffTier,
      dailyHours: clampedHours,
      scaleMultiplier: safeMultiplier,
      rawTotalPowerWatts,
      effectivePowerWatts,
      effectivePowerKilowatts,
      dailyEnergyWh,
      dailyEnergyKwh,
      monthlyEnergyKwh,
      yearlyEnergyKwh,
      dailyCostIdr,
      monthlyCostIdr,
      yearlyCostIdr,
      renewablePowerWatts: renewablePowerWatts * safeMultiplier,
      nonRenewablePowerWatts: nonRenewablePowerWatts * safeMultiplier,
      greenEnergySharePercent,
      monthlyPlnSavingsIdr,
      netMonthlyPlnBillIdr,
      monthlyCo2SavedKg,
      componentBreakdown,
    };
  } catch (error) {
    console.warn('Failed to calculate PLN cost estimate:', error);
    return {
      tariffTier,
      dailyHours: 8,
      scaleMultiplier: 1,
      rawTotalPowerWatts: 0,
      effectivePowerWatts: 0,
      effectivePowerKilowatts: 0,
      dailyEnergyWh: 0,
      dailyEnergyKwh: 0,
      monthlyEnergyKwh: 0,
      yearlyEnergyKwh: 0,
      dailyCostIdr: 0,
      monthlyCostIdr: 0,
      yearlyCostIdr: 0,
      renewablePowerWatts: 0,
      nonRenewablePowerWatts: 0,
      greenEnergySharePercent: 0,
      monthlyPlnSavingsIdr: 0,
      netMonthlyPlnBillIdr: 0,
      monthlyCo2SavedKg: 0,
      componentBreakdown: [],
    };
  }
}
