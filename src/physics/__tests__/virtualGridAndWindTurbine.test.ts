import { describe, it, expect } from 'vitest';
import { solveCircuitMNA, isActiveVoltageSource, getVoltageSourceNominalVoltage } from '../mnaSolver';
import { CircuitElementData, WireConnection } from '../../types/circuit';

describe('Virtual Transmission Grid and Wind Turbine Physics Solver', () => {
  it('correctly identifies Wind Turbine as an active voltage source with nominal EMF', () => {
    const turbine50: CircuitElementData = {
      id: 'turbine1',
      type: 'wind-turbine',
      label: 'Turbin Angin',
      speed: 50,
    };
    expect(isActiveVoltageSource(turbine50)).toBe(true);
    expect(getVoltageSourceNominalVoltage(turbine50)).toBe(6.0);

    const turbine100: CircuitElementData = {
      id: 'turbine2',
      type: 'wind-turbine',
      label: 'Turbin Angin',
      speed: 100,
    };
    expect(getVoltageSourceNominalVoltage(turbine100)).toBe(12.0);

    const turbine0: CircuitElementData = {
      id: 'turbine3',
      type: 'wind-turbine',
      label: 'Turbin Angin',
      speed: 0,
    };
    expect(getVoltageSourceNominalVoltage(turbine0)).toBe(0.0);
  });

  it('unifies multiple Transmission Towers into a lossless common bus (Virtual Grid)', () => {
    // Scenario:
    // Tower 1 (Outdoor) is connected to a 12V Solar Panel:
    // - solar:pos -> tower1:pos
    // - solar:neg -> tower1:neg
    // Tower 2 (Indoor Lab) is connected to a 100 Ohm Resistor:
    // - tower2:pos -> resistor:p1
    // - tower2:neg -> resistor:p2
    // There are NO physical wires between Tower 1 and Tower 2!
    // The Virtual Grid must unite tower1 and tower2 terminals in UnionFind.

    const solarPanel: CircuitElementData = {
      id: 'solar1',
      type: 'solar-panel',
      label: 'Panel Surya',
      voltage: 12.0,
      environment: 'sunny',
    };

    const towerOutdoor: CircuitElementData = {
      id: 'tower_out',
      type: 'transmission-tower',
      label: 'Menara Luar',
    };

    const towerIndoor: CircuitElementData = {
      id: 'tower_in',
      type: 'transmission-tower',
      label: 'Menara Lab',
    };

    const loadResistor: CircuitElementData = {
      id: 'load_r',
      type: 'resistor',
      label: 'Beban Resistor 100Ω',
      resistance: 100,
    };

    const wires: WireConnection[] = [
      { id: 'w1', source: 'solar1', sourceHandle: 'pos', target: 'tower_out', targetHandle: 'pos' },
      { id: 'w2', source: 'solar1', sourceHandle: 'neg', target: 'tower_out', targetHandle: 'neg' },
      { id: 'w3', source: 'tower_in', sourceHandle: 'pos', target: 'load_r', targetHandle: 'p1' },
      { id: 'w4', source: 'tower_in', sourceHandle: 'neg', target: 'load_r', targetHandle: 'p2' },
    ];

    const result = solveCircuitMNA({
      components: [solarPanel, towerOutdoor, towerIndoor, loadResistor],
      wires,
    });

    // Resistor should receive power from Solar Panel across the two towers!
    // I = V / (R_load + R_internal) = 12 / (100 + 0.2) ≈ 0.11976 A
    const resistorCurrent = Math.abs(result.branchCurrents['load_r'] ?? 0);
    expect(resistorCurrent).toBeGreaterThan(0.115);
    expect(resistorCurrent).toBeLessThan(0.121);
    expect(result.isShortCircuit).toBe(false);
  });

  it('runs Wind Turbine powering a resistor directly', () => {
    const windTurbine: CircuitElementData = {
      id: 'wt1',
      type: 'wind-turbine',
      label: 'Turbin Angin',
      speed: 75, // 75% speed -> 9.0V
      internalResistance: 0.1,
    };

    const resistor: CircuitElementData = {
      id: 'res1',
      type: 'resistor',
      label: 'Resistor 90Ω',
      resistance: 90,
    };

    const wires: WireConnection[] = [
      { id: 'w1', source: 'wt1', sourceHandle: 'pos', target: 'res1', targetHandle: 'p1' },
      { id: 'w2', source: 'wt1', sourceHandle: 'neg', target: 'res1', targetHandle: 'p2' },
    ];

    const result = solveCircuitMNA({
      components: [windTurbine, resistor],
      wires,
    });

    // I = 9.0V / (90 + 0.1) ≈ 0.09988 A ≈ 100 mA
    const current = Math.abs(result.branchCurrents['res1'] ?? 0);
    expect(current).toBeCloseTo(0.09988, 3);
  });
});
