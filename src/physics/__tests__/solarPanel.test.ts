import { describe, it, expect } from 'vitest';
import {
  getSolarPanelVoltage,
  SOLAR_PANEL_MAX_VOLTAGE,
  SOLAR_PANEL_INTERNAL_RESISTANCE,
} from '../solarPanel';
import { solveCircuitMNA } from '../mnaSolver';
import { CircuitElementData, WireConnection } from '../../types/circuit';

describe('Solar Panel Physics & Irradiance Equations', () => {
  it('correctly maps solar irradiance percentage to nominal voltages', () => {
    expect(SOLAR_PANEL_MAX_VOLTAGE).toBe(12.0);
    expect(getSolarPanelVoltage(100)).toBe(12.0);
    expect(getSolarPanelVoltage(50)).toBe(6.0);
    expect(getSolarPanelVoltage(0)).toBe(0.0);
    expect(getSolarPanelVoltage(undefined)).toBe(12.0);
  });

  it('clamps out-of-range irradiance values safely', () => {
    expect(getSolarPanelVoltage(150)).toBe(12.0);
    expect(getSolarPanelVoltage(-25)).toBe(0.0);
    expect(getSolarPanelVoltage(Number.NaN)).toBe(12.0);
  });

  it('solves linear equations for solar panel powering a 100 Ohm resistor at full sunlight (12V)', () => {
    const solarPanel: CircuitElementData = {
      id: 'solar_1',
      type: 'solar-panel',
      label: 'Panel Surya',
      sunlight: 100,
      voltage: 12.0,
      internalResistance: SOLAR_PANEL_INTERNAL_RESISTANCE,
    };

    const resistor: CircuitElementData = {
      id: 'res_1',
      type: 'resistor',
      label: 'Beban Resistor 100Ω',
      resistance: 100,
    };

    const wires: WireConnection[] = [
      { id: 'w1', source: 'solar_1', sourceHandle: 'pos', target: 'res_1', targetHandle: 'p1' },
      { id: 'w2', source: 'res_1', sourceHandle: 'p2', target: 'solar_1', targetHandle: 'neg' },
    ];

    const result = solveCircuitMNA({
      components: [solarPanel, resistor],
      wires,
    });

    expect(result.isShortCircuit).toBe(false);
    expect(result.branchCurrents['solar_1']).toBeDefined();
    // I = 12 / (100 + 0.2) = 12 / 100.2 ≈ 0.11976 A
    expect(Math.abs(result.branchCurrents['solar_1'])).toBeCloseTo(0.1198, 3);
    expect(Math.abs(result.branchCurrents['res_1'])).toBeCloseTo(0.1198, 3);
  });

  it('generates 0V and 0A when sunlight is set to 0%', () => {
    const solarPanel: CircuitElementData = {
      id: 'solar_1',
      type: 'solar-panel',
      label: 'Panel Surya',
      sunlight: 0,
      voltage: 0.0,
      internalResistance: SOLAR_PANEL_INTERNAL_RESISTANCE,
    };

    const resistor: CircuitElementData = {
      id: 'res_1',
      type: 'resistor',
      label: 'Resistor 100Ω',
      resistance: 100,
    };

    const wires: WireConnection[] = [
      { id: 'w1', source: 'solar_1', sourceHandle: 'pos', target: 'res_1', targetHandle: 'p1' },
      { id: 'w2', source: 'res_1', sourceHandle: 'p2', target: 'solar_1', targetHandle: 'neg' },
    ];

    const result = solveCircuitMNA({
      components: [solarPanel, resistor],
      wires,
    });

    expect(result.isShortCircuit).toBe(false);
    expect(result.branchCurrents['solar_1']).toBe(0);
    expect(result.branchCurrents['res_1']).toBe(0);
  });

  it('charges a 9V battery when connected in parallel at 12V sunlight (12V > 9V)', () => {
    const solarPanel: CircuitElementData = {
      id: 'solar_1',
      type: 'solar-panel',
      label: 'Panel Surya 12V',
      sunlight: 100,
      voltage: 12.0,
      internalResistance: 0.2,
    };

    const battery9v: CircuitElementData = {
      id: 'bat_9v',
      type: 'battery9v',
      label: 'Baterai 9V',
      voltage: 9.0,
      internalResistance: 2.0,
      currentCharge: 50,
      capacity: 500,
    };

    const wires: WireConnection[] = [
      { id: 'w_pos', source: 'solar_1', sourceHandle: 'pos', target: 'bat_9v', targetHandle: 'pos' },
      { id: 'w_neg', source: 'solar_1', sourceHandle: 'neg', target: 'bat_9v', targetHandle: 'neg' },
    ];

    const result = solveCircuitMNA({
      components: [solarPanel, battery9v],
      wires,
    });

    const solarCurrent = result.branchCurrents['solar_1'];
    const batteryCurrent = result.branchCurrents['bat_9v'];

    expect(solarCurrent).toBeCloseTo(-1.364, 2);
    expect(batteryCurrent).toBeCloseTo(1.364, 2);
    expect(batteryCurrent).toBeGreaterThan(0);
  });
});
