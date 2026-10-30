import { describe, it, expect } from 'vitest';
import {
  computeEffectiveBatteryVoltage,
  determineBatteryChargeState,
  calculateChargeDelta,
  stepBatteryCharge,
  getDefaultBatteryCapacity,
} from '../batterySoC';

describe('Battery State of Charge (SoC) & Voltage Sag Physics', () => {
  describe('computeEffectiveBatteryVoltage', () => {
    it('returns full nominal voltage when charge is 100%', () => {
      expect(computeEffectiveBatteryVoltage(9.0, 100)).toBeCloseTo(9.0, 4);
      expect(computeEffectiveBatteryVoltage(1.5, 100)).toBeCloseTo(1.5, 4);
    });

    it('returns full nominal voltage when charge is between 20% and 100%', () => {
      expect(computeEffectiveBatteryVoltage(9.0, 50)).toBeCloseTo(9.0, 4);
      expect(computeEffectiveBatteryVoltage(9.0, 20)).toBeCloseTo(9.0, 4);
      expect(computeEffectiveBatteryVoltage(1.5, 25)).toBeCloseTo(1.5, 4);
    });

    it('applies linear voltage sag when charge is below 20%', () => {
      // At 10% charge (half of 20%), 9V battery sags to 4.5V
      expect(computeEffectiveBatteryVoltage(9.0, 10)).toBeCloseTo(4.5, 4);
      // At 5% charge (quarter of 20%), 9V battery sags to 2.25V
      expect(computeEffectiveBatteryVoltage(9.0, 5)).toBeCloseTo(2.25, 4);
      // For 1.5V battery at 10% charge, sags to 0.75V
      expect(computeEffectiveBatteryVoltage(1.5, 10)).toBeCloseTo(0.75, 4);
    });

    it('returns 0.0V when charge reaches 0% (dead battery)', () => {
      expect(computeEffectiveBatteryVoltage(9.0, 0)).toBe(0.0);
      expect(computeEffectiveBatteryVoltage(1.5, 0)).toBe(0.0);
    });

    it('clamps negative or out-of-range charge values safely', () => {
      expect(computeEffectiveBatteryVoltage(9.0, -15)).toBe(0.0);
      expect(computeEffectiveBatteryVoltage(9.0, 150)).toBeCloseTo(9.0, 4);
      expect(computeEffectiveBatteryVoltage(9.0, undefined)).toBeCloseTo(9.0, 4);
    });
  });

  describe('determineBatteryChargeState', () => {
    it('detects discharging when branch current is negative (powering a load)', () => {
      expect(determineBatteryChargeState(-0.089)).toBe('discharging');
      expect(determineBatteryChargeState(-1e-4)).toBe('discharging');
    });

    it('detects charging when branch current is positive (current forced into battery)', () => {
      expect(determineBatteryChargeState(0.5)).toBe('charging');
      expect(determineBatteryChargeState(1e-4)).toBe('charging');
    });

    it('detects idle when current is practically zero (open circuit)', () => {
      expect(determineBatteryChargeState(0)).toBe('idle');
      expect(determineBatteryChargeState(1e-7)).toBe('idle');
      expect(determineBatteryChargeState(-1e-7)).toBe('idle');
      expect(determineBatteryChargeState(NaN)).toBe('idle');
    });
  });

  describe('calculateChargeDelta & stepBatteryCharge', () => {
    it('calculates correct coulombic charge integration delta', () => {
      // 0.1A = 100mA for 1 sec with timeScale = 60
      // delta mAh = (0.1 * 1 * 60) / 3.6 = 1.6667 mAh
      // For 1000 mAh capacity: delta% = 1.6667 / 1000 * 100 = 0.1667%
      const delta = calculateChargeDelta(-0.1, 1000, 1, 60);
      expect(delta).toBeCloseTo(0.16667, 4);
    });

    it('decreases charge during discharge and clamps at 0%', () => {
      const step1 = stepBatteryCharge(100, 1000, -0.1, 1, 60);
      expect(step1.chargeState).toBe('discharging');
      expect(step1.newCharge).toBeCloseTo(99.8333, 3);

      // Depleting battery below zero clamps to 0
      const stepDead = stepBatteryCharge(0.05, 1000, -5.0, 10, 60);
      expect(stepDead.newCharge).toBe(0);
      expect(stepDead.chargeState).toBe('discharging');
    });

    it('increases charge during charging and clamps at 100%', () => {
      const stepCharge = stepBatteryCharge(50, 1000, 0.2, 1, 60);
      expect(stepCharge.chargeState).toBe('charging');
      expect(stepCharge.newCharge).toBeGreaterThan(50);

      // Topping off past 100% clamps to 100
      const stepFull = stepBatteryCharge(99.9, 1000, 2.0, 10, 60);
      expect(stepFull.newCharge).toBe(100);
    });

    it('maintains charge unchanged when idle', () => {
      const stepIdle = stepBatteryCharge(85, 1000, 0, 1, 60);
      expect(stepIdle.chargeState).toBe('idle');
      expect(stepIdle.newCharge).toBe(85);
    });
  });

  describe('getDefaultBatteryCapacity', () => {
    it('provides standard rated capacities for components', () => {
      expect(getDefaultBatteryCapacity('battery')).toBe(1000);
      expect(getDefaultBatteryCapacity('battery9v')).toBe(500);
      expect(getDefaultBatteryCapacity('battery-holder', 2)).toBe(2000);
      expect(getDefaultBatteryCapacity('battery-holder', 1)).toBe(1000);
    });
  });
});
