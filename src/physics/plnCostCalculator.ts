import { Edge, Node } from 'reactflow';
import { CircuitElementData, SimulationResult } from '../types/circuit';
import {
  computeEffectiveBatteryVoltage,
  computeSeriesHolderTelemetry,
  normalizeHolderCellCharges,
  resolveHolderCellCount,
} from './batterySoC';
import {
  getComponentEffectiveResistance,
  getSocketForwardThreshold,
  isTransmissionNodeActive,
} from './mnaSolver';
import { getSolarPanelVoltage } from './solarPanel';
import { UnionFind } from './unionFind';

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
  /** Power from galvanically isolated off-grid pocket battery islands excluded from the metered PLN grid bill. */
  excludedOffGridWatts?: number;
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
 * Resolves the nominal operating EMF voltage of an electrochemical or renewable source node.
 * Applies SoC sag curve for batteries/BESS and accurate defaults (e.g., 9.0V for 9V battery).
 * Time Complexity: O(1).
 */
function resolvePlnSourceNominalVoltage(node: Node<CircuitElementData>): number {
  const compType = node.data.type;
  if (compType === 'solar-panel' || compType === 'solar_panel') {
    return Math.max(0, node.data.voltage ?? getSolarPanelVoltage(node.data.sunlight ?? 100));
  }
  if (compType === 'wind-turbine' || compType === 'wind_turbine') {
    const rawWindV = node.data.voltage ?? ((node.data.speed ?? 50) / 100) * 12.0;
    return Math.min(12.0, Math.max(0, rawWindV));
  }
  if (compType === 'hydro-turbine' || compType === 'hydro_turbine') {
    return Math.max(0, node.data.voltage ?? 12.0);
  }
  if (compType === 'bess-substation' || compType === 'bess_substation') {
    const nominal = Math.max(0, node.data.voltage ?? 12.8);
    return computeEffectiveBatteryVoltage(nominal, node.data.socPercent ?? node.data.currentCharge);
  }
  if (compType === 'battery9v') {
    const nominal = Math.max(0, node.data.voltage ?? 9.0);
    return computeEffectiveBatteryVoltage(nominal, node.data.currentCharge);
  }
  if (compType === 'battery-holder') {
    const count = resolveHolderCellCount(node.data);
    if (count === 0) return 0;
    const normalizedCells = normalizeHolderCellCharges(
      node.data.cellCharges,
      count,
      node.data.currentCharge
    );
    const telemetry = computeSeriesHolderTelemetry(normalizedCells);
    return telemetry.effectiveVoltage;
  }
  const nominal = Math.max(0, node.data.voltage ?? 1.5);
  return computeEffectiveBatteryVoltage(nominal, node.data.currentCharge);
}

/**
 * Identifies galvanically isolated non-renewable off-grid DC battery islands when a grid
 * `distribution-panel` or renewable microgrid bus exists alongside them, preventing pocket
 * off-grid batteries from diluting grid renewable share or inflating metered household kWh.
 *
 * Time Complexity: O(V + E) via Union-Find.
 */
function buildExcludedOffGridNodeSet(
  nodes: ReadonlyArray<Node<CircuitElementData>>,
  edges?: ReadonlyArray<Edge>
): Set<string> {
  const excluded = new Set<string>();
  if (!edges || edges.length === 0 || nodes.length === 0) {
    return excluded;
  }

  const uf = new UnionFind();
  let gridAnchorId: string | null = null;
  let hasGridOrRenewableIsland = false;

  for (const node of nodes) {
    if (!node || !node.data) continue;
    uf.makeSet(node.id);
    const t = node.data.type;
    if (
      t === 'distribution-panel' ||
      t === 'distribution_panel' ||
      t === 'solar-panel' ||
      t === 'solar_panel' ||
      t === 'wind-turbine' ||
      t === 'wind_turbine' ||
      t === 'hydro-turbine' ||
      t === 'hydro_turbine' ||
      t === 'bess-substation' ||
      t === 'bess_substation'
    ) {
      hasGridOrRenewableIsland = true;
    }
    if (
      isTransmissionNodeActive(node.data) ||
      t === 'solar-panel' ||
      t === 'solar_panel' ||
      t === 'wind-turbine' ||
      t === 'wind_turbine' ||
      t === 'hydro-turbine' ||
      t === 'hydro_turbine' ||
      t === 'bess-substation' ||
      t === 'bess_substation' ||
      t === 'distribution-panel' ||
      t === 'distribution_panel'
    ) {
      // Group outdoor SUTET/grid/generation nodes when wirelessly bridged via SUTET grid
      if (isTransmissionNodeActive(node.data) || t === 'distribution-panel' || t === 'distribution_panel') {
        if (gridAnchorId === null) {
          gridAnchorId = node.id;
        } else {
          uf.union(gridAnchorId, node.id);
        }
      }
    }
  }

  if (!hasGridOrRenewableIsland) {
    // Pure standalone Lab DC battery circuit: keep billing comparison intact for pedagogy
    return excluded;
  }

  for (const edge of edges) {
    uf.union(edge.source, edge.target);
  }

  const gridBackedRoots = new Set<string>();
  for (const node of nodes) {
    if (!node || !node.data) continue;
    const t = node.data.type;
    if (
      t === 'distribution-panel' ||
      t === 'distribution_panel' ||
      t === 'solar-panel' ||
      t === 'solar_panel' ||
      t === 'wind-turbine' ||
      t === 'wind_turbine' ||
      t === 'hydro-turbine' ||
      t === 'hydro_turbine' ||
      t === 'bess-substation' ||
      t === 'bess_substation'
    ) {
      gridBackedRoots.add(uf.find(node.id));
    }
  }

  for (const node of nodes) {
    if (!node || !node.data) continue;
    if (!gridBackedRoots.has(uf.find(node.id))) {
      excluded.add(node.id);
    }
  }

  return excluded;
}

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
  scaleMultiplier: PlnScaleMultiplier = 1,
  edges?: ReadonlyArray<Edge>
): PlnCostEstimateResult {
  const tariffTier = getPlnTariffTier(tariffTierId);

  try {
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const branchCurrents = simulation?.branchCurrents ?? {};
    const excludedOffGridIds = buildExcludedOffGridNodeSet(safeNodes, edges);

    const clampedHours = Number.isFinite(dailyUsageHours)
      ? Math.max(0, Math.min(24, dailyUsageHours))
      : 8;
    const safeMultiplier: PlnScaleMultiplier =
      scaleMultiplier === 100 || scaleMultiplier === 1000 ? scaleMultiplier : 1;

    const rawPowerFromSim = Number.isFinite(simulation?.totalPowerDrawn)
      ? Math.max(0, simulation.totalPowerDrawn)
      : 0;

    // Pre-check O(N) whether any active power source on metered grid islands has signed negative MNA current (supplying/discharging).
    // Allows distinguishing batteries actively charging (j > 0) from legacy positive-signed synthetic unit mocks.
    const hasSignedSupplyingSource = safeNodes.some((node) => {
      if (!node || !node.data || excludedOffGridIds.has(node.id)) return false;
      const t = node.data.type;
      const isSourceNode =
        t === 'solar-panel' ||
        t === 'solar_panel' ||
        t === 'wind-turbine' ||
        t === 'wind_turbine' ||
        t === 'hydro-turbine' ||
        t === 'hydro_turbine' ||
        t === 'bess-substation' ||
        t === 'bess_substation' ||
        t === 'battery' ||
        t === 'battery9v' ||
        t === 'battery-holder';
      return isSourceNode && (branchCurrents[node.id] ?? 0) < -1e-6;
    });

    // Single pass O(N) over nodes to compute per-load consumption and renewable generation
    let renewablePowerWatts = 0;
    let nonRenewablePowerWatts = 0;
    let summedLoadPowerWatts = 0;
    let excludedOffGridWatts = 0;

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
      const signedCurrentAmps = branchCurrents[node.id] ?? 0;
      const currentAmps = Math.abs(signedCurrentAmps);
      if (!Number.isFinite(currentAmps) || currentAmps <= 1e-6) {
        continue;
      }

      if (excludedOffGridIds.has(node.id)) {
        // Accumulate excluded off-grid battery island load power separately instead of charging PLN meter
        const isIsolatedLoad =
          compType === 'bulb' ||
          compType === 'resistor' ||
          (compType === 'socket' && Boolean(node.data.installedBulb)) ||
          ((compType === 'pin-socket' || compType === 'socket-pin') && Boolean(node.data.installedBulb));
        if (isIsolatedLoad) {
          const isSock =
            compType === 'socket' || compType === 'pin-socket' || compType === 'socket-pin';
          const loadR = isSock
            ? getComponentEffectiveResistance(node.data)
            : Math.max(0.1, node.data.resistance ?? 100);
          if (loadR < 1e8) {
            const vf = isSock ? getSocketForwardThreshold(node.data) : 0;
            excludedOffGridWatts += currentAmps * currentAmps * loadR + vf * currentAmps;
          }
        }
        continue;
      }

      // Check if this node is a renewable generator supplying clean energy
      if (
        compType === 'solar-panel' ||
        compType === 'solar_panel' ||
        compType === 'wind-turbine' ||
        compType === 'wind_turbine' ||
        compType === 'hydro-turbine' ||
        compType === 'hydro_turbine'
      ) {
        // Skip blocking-diode reverse bias if somehow non-zero
        if (hasSignedSupplyingSource && signedCurrentAmps > 1e-6) {
          continue;
        }
        const sourceVoltage = resolvePlnSourceNominalVoltage(node);
        renewablePowerWatts += sourceVoltage * currentAmps;
        continue;
      }

      // Electrochemical batteries / BESS:
      // Only discharge (signedCurrent < 0, or synthetic positive mock when no negative source exists)
      // counts as discharging source power; charging current (signedCurrent > 0 with supplying source) is energy storage!
      if (
        compType === 'battery' ||
        compType === 'battery9v' ||
        compType === 'battery-holder' ||
        compType === 'bess-substation' ||
        compType === 'bess_substation'
      ) {
        const isChargingSink = hasSignedSupplyingSource && signedCurrentAmps > 1e-6;
        if (isChargingSink) {
          continue;
        }
        const sourceVoltage = resolvePlnSourceNominalVoltage(node);
        if (compType === 'bess-substation' || compType === 'bess_substation') {
          // BESS substation stores grid/renewable microgrid buffer; only treat primary batteries as fossil baseline
          renewablePowerWatts += sourceVoltage * currentAmps;
        } else {
          nonRenewablePowerWatts += sourceVoltage * currentAmps;
        }
        continue;
      }

      // Check if this node is a resistive/lamp load dissipating power (I^2 * R + Vf * I)
      const isBulbOrSocketLoad =
        compType === 'bulb' ||
        compType === 'resistor' ||
        (compType === 'socket' && Boolean(node.data.installedBulb)) ||
        ((compType === 'pin-socket' || compType === 'socket-pin') &&
          Boolean(node.data.installedBulb));

      if (isBulbOrSocketLoad) {
        const isSocket =
          compType === 'socket' || compType === 'pin-socket' || compType === 'socket-pin';
        const loadResistance = isSocket
          ? getComponentEffectiveResistance(node.data)
          : Math.max(0.1, node.data.resistance ?? 100);
        if (loadResistance >= 1e8) continue;

        const forwardThresholdV = isSocket ? getSocketForwardThreshold(node.data) : 0;
        const dissipatedWatts =
          currentAmps * currentAmps * loadResistance + forwardThresholdV * currentAmps;
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

    // Prefer exact measured useful load dissipation when resistive/lamp loads are present
    // so charging batteries and internal source R_int heat do not inflate household load kWh.
    // When excluded off-grid battery islands were filtered out, do not fall back to global rawPowerFromSim.
    const rawTotalPowerWatts =
      summedLoadPowerWatts > 1e-5
        ? summedLoadPowerWatts
        : excludedOffGridIds.size > 0
        ? 0
        : rawPowerFromSim;
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
      excludedOffGridWatts: Number((excludedOffGridWatts * safeMultiplier).toFixed(4)),
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
      excludedOffGridWatts: 0,
    };
  }
}
