import { describe, it, expect } from 'vitest';
import { Node } from 'reactflow';
import { CircuitElementData } from '../../types/circuit';
import {
  calculatePlnCostEstimate,
  formatRupiah,
  getPlnTariffTier,
  PLN_TARIFF_TIERS,
} from '../plnCostCalculator';

describe('PLN Electricity Consumption & Rupiah Cost Calculator', () => {
  const baseSimulation = {
    branchCurrents: {
      batt_1: 0.05,
      bulb_1: 0.05,
    },
    totalPowerDrawn: 0.5, // 0.5 W raw power
  };

  const sampleNodes: Node<CircuitElementData>[] = [
    {
      id: 'batt_1',
      type: 'battery9v',
      position: { x: 0, y: 0 },
      data: {
        id: 'batt_1',
        type: 'battery9v',
        voltage: 10,
        label: 'Baterai 9V',
      },
    },
    {
      id: 'bulb_1',
      type: 'bulb',
      position: { x: 100, y: 0 },
      data: {
        id: 'bulb_1',
        type: 'bulb',
        resistance: 200,
        label: 'Lampu Pijar',
      },
    },
  ];

  it('provides all 4 official PT PLN (Persero) residential tariff tiers', () => {
    expect(PLN_TARIFF_TIERS).toHaveLength(4);
    expect(getPlnTariffTier('R1_900_SUBSIDI').ratePerKwhIdr).toBe(605);
    expect(getPlnTariffTier('R1_900_RTM').ratePerKwhIdr).toBe(1352);
    expect(getPlnTariffTier('R1_1300_2200').ratePerKwhIdr).toBe(1444.7);
    expect(getPlnTariffTier('R2_3500_5500').ratePerKwhIdr).toBe(1699.53);
  });

  it('accurately computes daily, monthly, and yearly kWh and Rupiah bill for R1 1.300 VA at 1000x household scale', () => {
    // 0.5W * 1000 = 500W (0.5 kW). Used 10 hours/day = 5 kWh/day, 150 kWh/month
    const result = calculatePlnCostEstimate(
      sampleNodes,
      baseSimulation,
      'R1_1300_2200',
      10,
      1000
    );

    expect(result.effectivePowerWatts).toBeCloseTo(500, 4);
    expect(result.dailyEnergyKwh).toBeCloseTo(5.0, 4);
    expect(result.monthlyEnergyKwh).toBeCloseTo(150.0, 4);
    expect(result.dailyCostIdr).toBeCloseTo(5 * 1444.7, 2);
    expect(result.monthlyCostIdr).toBeCloseTo(150 * 1444.7, 1);
    expect(result.componentBreakdown).toHaveLength(1);
    expect(result.componentBreakdown[0].sharePercentage).toBe(100);
  });

  it('computes 100% green energy PLN bill savings when powered by Solar Panel & Wind Turbine', () => {
    const greenNodes: Node<CircuitElementData>[] = [
      {
        id: 'solar_1',
        type: 'solar-panel',
        position: { x: 0, y: 0 },
        data: {
          id: 'solar_1',
          type: 'solar-panel',
          voltage: 12,
          sunlight: 100,
          label: 'Panel Surya',
        },
      },
      {
        id: 'bulb_1',
        type: 'bulb',
        position: { x: 100, y: 0 },
        data: {
          id: 'bulb_1',
          type: 'bulb',
          resistance: 144,
          label: 'Lampu LED',
        },
      },
    ];

    const greenSim = {
      branchCurrents: {
        solar_1: 0.083333,
        bulb_1: 0.083333,
      },
      totalPowerDrawn: 1.0,
    };

    const result = calculatePlnCostEstimate(
      greenNodes,
      greenSim,
      'R1_1300_2200',
      8,
      100
    );

    expect(result.greenEnergySharePercent).toBe(100);
    expect(result.monthlyPlnSavingsIdr).toBeCloseTo(result.monthlyCostIdr, 2);
    expect(result.netMonthlyPlnBillIdr).toBeCloseTo(0, 4);
    expect(result.monthlyCo2SavedKg).toBeGreaterThan(0);
  });

  it('handles empty circuits and invalid numeric edge cases safely without crashing', () => {
    const emptySim = {
      branchCurrents: {},
      totalPowerDrawn: NaN,
    };

    const result = calculatePlnCostEstimate(
      [],
      emptySim,
      'R1_900_SUBSIDI',
      -5,
      1
    );

    expect(result.dailyHours).toBe(0);
    expect(result.monthlyCostIdr).toBe(0);
    expect(formatRupiah(0)).toBe('Rp 0');
    expect(formatRupiah(0.45)).toBe('Rp 0,45');
    expect(formatRupiah(216705)).toBe('Rp 216.705');
  });
});
