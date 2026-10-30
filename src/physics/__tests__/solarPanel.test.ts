import { describe, it, expect } from 'vitest';
import {
  getSolarPanelVoltage,
  getNextEnvironment,
  SOLAR_PANEL_VOLTAGES,
  SOLAR_PANEL_INTERNAL_RESISTANCE,
} from '../solarPanel';
import { solveCircuitMNA } from '../mnaSolver';
import { CircuitElementData, WireConnection } from '../../types/circuit';

describe('Solar Panel Physics & Environment Equations', () => {
  it('correctly maps environmental conditions to nominal voltages', () => {
    expect(SOLAR_PANEL_VOLTAGES.sunny).toBe(12.0);
    expect(SOLAR_PANEL_VOLTAGES.cloudy).toBe(5.0);
    expect(SOLAR_PANEL_VOLTAGES.lab).toBe(0.0);
    expect(getSolarPanelVoltage('sunny')).toBe(12.0);
    expect(getSolarPanelVoltage('cloudy')).toBe(5.0);
    expect(getSolarPanelVoltage('lab')).toBe(0.0);
    expect(getSolarPanelVoltage(undefined)).toBe(0.0);
  });

  it('correctly cycles through environments: lab -> sunny -> cloudy -> lab', () => {
    expect(getNextEnvironment('lab')).toBe('sunny');
    expect(getNextEnvironment('sunny')).toBe('cloudy');
    expect(getNextEnvironment('cloudy')).toBe('lab');
  });

  it('solves linear equations for solar panel powering a 100 Ohm resistor in sunny weather (12V)', () => {
    const solarPanel: CircuitElementData = {
      id: 'solar_1',
      type: 'solar-panel',
      label: 'Panel Surya',
      environment: 'sunny',
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

  it('generates 0V and 0A in indoor lab mode', () => {
    const solarPanel: CircuitElementData = {
      id: 'solar_1',
      type: 'solar-panel',
      label: 'Panel Surya',
      environment: 'lab',
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

  it('charges a 9V battery when connected in parallel under sunny weather (12V > 9V)', () => {
    // Solar Panel (12V, R_int=0.2Ω) connected in parallel to 9V Battery (9V, R_int=2.0Ω)
    const solarPanel: CircuitElementData = {
      id: 'solar_1',
      type: 'solar-panel',
      label: 'Panel Surya 12V',
      environment: 'sunny',
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

    // Connect (+) to (+) and (-) to (-)
    const wires: WireConnection[] = [
      { id: 'w_pos', source: 'solar_1', sourceHandle: 'pos', target: 'bat_9v', targetHandle: 'pos' },
      { id: 'w_neg', source: 'solar_1', sourceHandle: 'neg', target: 'bat_9v', targetHandle: 'neg' },
    ];

    const result = solveCircuitMNA({
      components: [solarPanel, battery9v],
      wires,
    });

    // Total series loop resistance = 0.2 + 2.0 = 2.2Ω
    // Voltage difference = 12V - 9V = 3V
    // Charging current I = 3V / 2.2Ω ≈ 1.364 A
    const solarCurrent = result.branchCurrents['solar_1'];
    const batteryCurrent = result.branchCurrents['bat_9v'];

    // Solar panel discharges (supplying current) -> negative in MNA
    expect(solarCurrent).toBeCloseTo(-1.364, 2);
    // Battery receives charging current -> positive in MNA
    expect(batteryCurrent).toBeCloseTo(1.364, 2);
    expect(batteryCurrent).toBeGreaterThan(0);
  });
});
