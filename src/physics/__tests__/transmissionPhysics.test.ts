import { describe, it, expect } from 'vitest';
import {
  calculateTowerSpanDistance,
  calculateTransmissionLineResistance,
  calculateTurnsRatio,
  resolveTransmissionVoltage,
  calculateReferredLineResistance,
  calculateJouleLoss,
  calculateTransmissionEfficiency,
  isTransmissionLineOverheated,
  computeTransmissionTelemetry,
  DEFAULT_SPAN_DISTANCE_METERS,
  DEFAULT_LINE_RESISTANCE_OHMS,
  LOW_VOLTAGE_NOMINAL,
  HIGH_VOLTAGE_NOMINAL,
  THERMAL_STRESS_CURRENT_THRESHOLD,
} from '../transmissionPhysics';
import { solveCircuitMNA } from '../mnaSolver';
import { CircuitElementData, WireConnection } from '../../types/circuit';

describe('Nature Mode Transmission Physics & Gardu Trafo Substation', () => {
  describe('Span Distance and Line Resistance Calculations', () => {
    it('calculates Euclidean distance between tower coordinates scaled to meters', () => {
      const tower1 = { x: 100, y: 200 };
      const tower2 = { x: 400, y: 200 }; // 300px horizontal span

      // 300px * 1.5m/px = 450 meters
      const spanMeters = calculateTowerSpanDistance(tower1, tower2, 1.5);
      expect(spanMeters).toBe(450);
    });

    it('falls back safely to default span distance when positions are missing or identical', () => {
      expect(calculateTowerSpanDistance(undefined, undefined)).toBe(DEFAULT_SPAN_DISTANCE_METERS);
      expect(calculateTowerSpanDistance({ x: 50, y: 50 }, { x: 50, y: 50 })).toBe(DEFAULT_SPAN_DISTANCE_METERS);
    });

    it('calculates transmission line loop resistance from distance (Ohms = meters * R_per_meter)', () => {
      // 250m * 0.016 Ohms/m = 4.0 Ohms
      const resistance = calculateTransmissionLineResistance(250, 0.016);
      expect(resistance).toBe(4.0);

      // Default span distance gives DEFAULT_LINE_RESISTANCE_OHMS (4.0 Ohms)
      expect(calculateTransmissionLineResistance()).toBe(DEFAULT_LINE_RESISTANCE_OHMS);
    });

    it('enforces a minimum resistance clamp of 0.1 Ohm for zero or tiny spans', () => {
      expect(calculateTransmissionLineResistance(0)).toBe(0.1);
      expect(calculateTransmissionLineResistance(-50)).toBe(0.1);
    });
  });

  describe('Transformer Step-Up Turns Ratio & Voltage Resolution', () => {
    it('calculates step-up turns ratio N = V_secondary / V_primary correctly', () => {
      // 12V -> 240V gives N = 20
      expect(calculateTurnsRatio(12, 240)).toBe(20);

      // 12V -> 120V gives N = 10
      expect(calculateTurnsRatio(12, 120)).toBe(10);

      // 12V -> 12V (direct) gives N = 1
      expect(calculateTurnsRatio(12, 12)).toBe(1);
    });

    it('resolves transmission voltages from modes and custom values', () => {
      expect(resolveTransmissionVoltage('step_up')).toBe(HIGH_VOLTAGE_NOMINAL);
      expect(resolveTransmissionVoltage('240V')).toBe(HIGH_VOLTAGE_NOMINAL);
      expect(resolveTransmissionVoltage('direct')).toBe(LOW_VOLTAGE_NOMINAL);
      expect(resolveTransmissionVoltage('12V')).toBe(LOW_VOLTAGE_NOMINAL);
      expect(resolveTransmissionVoltage(120)).toBe(120);
      expect(resolveTransmissionVoltage(null)).toBe(LOW_VOLTAGE_NOMINAL);
    });

    it('calculates referred line resistance scaling with 1 / (N^2)', () => {
      const lineResistance = 4.0;

      // Direct (N=1): R_referred = 4.0 / (1^2) = 4.0 Ohms
      expect(calculateReferredLineResistance(lineResistance, 12, 12)).toBe(4.0);

      // Step-Up 240V (N=20): R_referred = 4.0 / (20^2) = 4.0 / 400 = 0.01 Ohms
      expect(calculateReferredLineResistance(lineResistance, 12, 240)).toBeCloseTo(0.01, 4);

      // Step-Up 120V (N=10): R_referred = 4.0 / (10^2) = 4.0 / 100 = 0.04 Ohms
      expect(calculateReferredLineResistance(lineResistance, 12, 120)).toBeCloseTo(0.04, 4);
    });
  });

  describe('Joule Loss (P = I^2 * R) & Transmission Efficiency', () => {
    it('computes Joule loss P = I^2 * R accurately', () => {
      // 1.0 A through 4.0 Ohms = 4.0 W
      expect(calculateJouleLoss(1.0, 4.0)).toBe(4.0);

      // 0.05 A through 4.0 Ohms = 0.01 W
      expect(calculateJouleLoss(0.05, 4.0)).toBeCloseTo(0.01, 4);

      // Negative currents produce positive heat dissipation
      expect(calculateJouleLoss(-1.5, 4.0)).toBe(9.0);

      // 0 A produces 0 W
      expect(calculateJouleLoss(0, 4.0)).toBe(0);
    });

    it('calculates transmission efficiency percentage eta = (P_delivered / (P_delivered + P_loss)) * 100', () => {
      // 96W delivered, 4W loss -> 96%
      expect(calculateTransmissionEfficiency(96, 4)).toBe(96.0);

      // 12W delivered, 0.014W loss -> 99.9%
      expect(calculateTransmissionEfficiency(12, 0.014)).toBe(99.9);

      // Idle circuit (0W delivered, 0W loss) returns 100%
      expect(calculateTransmissionEfficiency(0, 0)).toBe(100.0);
    });

    it('flags line thermal stress when current exceeds threshold under low voltage (12V)', () => {
      // Overheated: I >= 0.4A and V <= 12V
      expect(isTransmissionLineOverheated(0.8, 12)).toBe(true);
      expect(isTransmissionLineOverheated(THERMAL_STRESS_CURRENT_THRESHOLD, 12)).toBe(true);

      // Cool: I < 0.4A at 12V
      expect(isTransmissionLineOverheated(0.2, 12)).toBe(false);

      // Cool: High Voltage 240V is active (even if numeric value equals threshold)
      expect(isTransmissionLineOverheated(0.8, 240)).toBe(false);
    });
  });

  describe('End-to-End Transmission Telemetry Analysis', () => {
    it('demonstrates the 400x Joule loss reduction when switching from 12V Direct to 240V Step-Up', () => {
      const loadCurrent = 1.0; // 1.0 A load demand (e.g., 12W bulb in Lab)

      // 1. Direct 12V Transmission
      const directTelemetry = computeTransmissionTelemetry({
        loadCurrent,
        voltageMode: 'direct',
        lineResistance: 4.0,
      });

      expect(directTelemetry.transmissionVoltage).toBe(12);
      expect(directTelemetry.lineCurrentAmperes).toBe(1.0);
      expect(directTelemetry.jouleLossWatts).toBe(4.0); // 1^2 * 4 = 4W
      expect(directTelemetry.isOverheated).toBe(true); // Thermal stress active
      expect(directTelemetry.efficiencyPercent).toBe(75.0); // 12W / (12W + 4W) = 75%

      // 2. High-Voltage 240V Step-Up Transmission
      const stepUpTelemetry = computeTransmissionTelemetry({
        loadCurrent,
        voltageMode: 'step_up',
        lineResistance: 4.0,
      });

      expect(stepUpTelemetry.transmissionVoltage).toBe(240);
      expect(stepUpTelemetry.turnsRatio).toBe(20);
      expect(stepUpTelemetry.lineCurrentAmperes).toBe(0.05); // 1.0A / 20 = 0.05A
      expect(stepUpTelemetry.jouleLossWatts).toBeCloseTo(0.01, 3); // 0.05^2 * 4 = 0.01W
      expect(stepUpTelemetry.isOverheated).toBe(false); // Conductor cool
      expect(stepUpTelemetry.efficiencyPercent).toBeGreaterThanOrEqual(99.8);
      expect(stepUpTelemetry.lossReductionFactor).toBe(400); // (20^2) = 400x reduction
    });
  });

  describe('MNA Solver Integration with Gardu Trafo SUTET', () => {
    it('reflects line resistance and step-up benefits across the virtual transmission grid', () => {
      // Setup: 12V Solar Panel outdoors connected to SUTET Tower
      // SUTET Tower transmits power to Lab Panel connected to a 10 Ohm load resistor
      const solarOutdoor: CircuitElementData = {
        id: 'solar_1',
        type: 'solar-panel',
        worldMode: 'outside',
        voltage: 12.0,
        sunlight: 100,
        internalResistance: 0.2,
        label: 'Solar 12V',
      };

      const towerOutdoor12V: CircuitElementData = {
        id: 'tower_out',
        type: 'transmission-tower',
        worldMode: 'outside',
        hasTransformer: true,
        stepUpVoltage: 12, // 12V Direct transmission
        lineResistance: 4.0,
        label: 'Outdoor Tower 12V Direct',
      };

      const labPanel: CircuitElementData = {
        id: 'panel_lab',
        type: 'transmission-tower',
        worldMode: 'lab',
        isMcbOn: true,
        isMcbTripped: false,
        label: 'Lab Panel',
      };

      const loadResistor: CircuitElementData = {
        id: 'load_10',
        type: 'resistor',
        worldMode: 'lab',
        resistance: 10.0, // 10 Ohm load
        label: '10Ω Load',
      };

      const wires: WireConnection[] = [
        { id: 'w1', source: 'solar_1', sourceHandle: 'pos', target: 'tower_out', targetHandle: 'pos' },
        { id: 'w2', source: 'solar_1', sourceHandle: 'neg', target: 'tower_out', targetHandle: 'neg' },
        { id: 'w3', source: 'panel_lab', sourceHandle: 'pos', target: 'load_10', targetHandle: 'p1' },
        { id: 'w4', source: 'panel_lab', sourceHandle: 'neg', target: 'load_10', targetHandle: 'p2' },
      ];

      // 1. Solve circuit at 12V Direct:
      // Total source resistance = R_solar (0.2) + R_line (4.0) = 4.2 Ohms.
      // Expected load current = 12V / (10 + 4.2) ≈ 0.845 A
      // Voltage across load = 0.845 * 10 ≈ 8.45 V (substantial voltage sag!)
      const result12V = solveCircuitMNA({
        components: [solarOutdoor, towerOutdoor12V, labPanel, loadResistor],
        wires,
      });

      const current12V = Math.abs(result12V.branchCurrents['load_10'] ?? 0);
      expect(current12V).toBeGreaterThan(0.83);
      expect(current12V).toBeLessThan(0.86);

      // 2. Switch Gardu Trafo to 240V Step-Up:
      // Referred line resistance = 4.0 / 400 = 0.01 Ohms.
      // Total source resistance = 0.2 + 0.01 = 0.21 Ohms.
      // Expected load current = 12V / (10 + 0.21) ≈ 1.175 A
      // Voltage across load = 1.175 * 10 ≈ 11.75 V (full power delivered!)
      const towerOutdoor240V: CircuitElementData = {
        ...towerOutdoor12V,
        stepUpVoltage: 240, // 240V Step-Up High Voltage
      };

      const result240V = solveCircuitMNA({
        components: [solarOutdoor, towerOutdoor240V, labPanel, loadResistor],
        wires,
      });

      const current240V = Math.abs(result240V.branchCurrents['load_10'] ?? 0);
      expect(current240V).toBeGreaterThan(1.16);
      expect(current240V).toBeLessThan(1.19);
      expect(current240V).toBeGreaterThan(current12V); // High-voltage delivers significantly more power!
    });

    it('preserves exact backward compatibility for circuits without transformers (lossless virtual bus)', () => {
      // Legacy towers without transformer properties should retain 0 line resistance
      const solarOutdoor: CircuitElementData = {
        id: 'solar_1',
        type: 'solar-panel',
        worldMode: 'outside',
        voltage: 12.0,
        sunlight: 100,
        internalResistance: 0.2,
        label: 'Solar 12V',
      };

      const legacyTowerOut: CircuitElementData = {
        id: 'tower_out',
        type: 'transmission-tower',
        label: 'Legacy Tower',
      };

      const legacyTowerIn: CircuitElementData = {
        id: 'tower_in',
        type: 'transmission-tower',
        label: 'Legacy Panel',
      };

      const loadResistor: CircuitElementData = {
        id: 'load_100',
        type: 'resistor',
        resistance: 100.0,
        label: '100Ω Load',
      };

      const wires: WireConnection[] = [
        { id: 'w1', source: 'solar_1', sourceHandle: 'pos', target: 'tower_out', targetHandle: 'pos' },
        { id: 'w2', source: 'solar_1', sourceHandle: 'neg', target: 'tower_out', targetHandle: 'neg' },
        { id: 'w3', source: 'tower_in', sourceHandle: 'pos', target: 'load_100', targetHandle: 'p1' },
        { id: 'w4', source: 'tower_in', sourceHandle: 'neg', target: 'load_100', targetHandle: 'p2' },
      ];

      const result = solveCircuitMNA({
        components: [solarOutdoor, legacyTowerOut, legacyTowerIn, loadResistor],
        wires,
      });

      // Expected: I = 12 / (100 + 0.2) ≈ 0.11976 A
      const loadCurrent = Math.abs(result.branchCurrents['load_100'] ?? 0);
      expect(loadCurrent).toBeCloseTo(12.0 / 100.2, 4);
    });
  });
});
