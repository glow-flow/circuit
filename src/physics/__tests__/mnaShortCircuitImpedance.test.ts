import { describe, it, expect } from 'vitest';
import { solveCircuitMNA } from '../mnaSolver';
import { CircuitElementData, WireConnection } from '../../types/circuit';

describe('MNA Source Impedance and Short-Circuit Detection Validation', () => {
  it('correctly flags direct dead short on a 9V battery with 2.0 Ohm internal resistance', () => {
    // 9V battery has R_int = 2.0 Ohm, giving I_sc = 9.0V / 2.0Ω = 4.5A.
    // Even though 4.5A is below the generic 10.0A threshold, topological terminal bridging
    // (positiveNet === negativeNet) must identify this as an authentic short circuit.
    const battery9v: CircuitElementData = {
      id: 'bat_9v',
      type: 'battery9v',
      label: 'Baterai 9V',
      voltage: 9.0,
      currentCharge: 100,
    };

    const shortWire: WireConnection = {
      id: 'wire_short',
      source: 'bat_9v',
      sourceHandle: 'pos',
      target: 'bat_9v',
      targetHandle: 'neg',
    };

    const result = solveCircuitMNA({
      components: [battery9v],
      wires: [shortWire],
    });

    expect(result.isShortCircuit).toBe(true);
    expect(result.shortCircuitBranches).toContain('bat_9v');
    // Solved current through the 2.0 Ohm internal resistance: 9 / 2 = 4.5 A
    expect(Math.abs(result.branchCurrents['bat_9v'])).toBeCloseTo(4.5, 1);
  });

  it('correctly flags direct dead short on a 1.5V AA battery with 0.05 Ohm internal resistance', () => {
    // AA battery has R_int = 0.05 Ohm, giving I_sc = 1.5V / 0.05Ω = 30A.
    const batteryAA: CircuitElementData = {
      id: 'bat_aa',
      type: 'battery',
      label: 'Baterai AA',
      voltage: 1.5,
      currentCharge: 100,
    };

    const shortWire: WireConnection = {
      id: 'wire_short',
      source: 'bat_aa',
      sourceHandle: 'pos',
      target: 'bat_aa',
      targetHandle: 'neg',
    };

    const result = solveCircuitMNA({
      components: [batteryAA],
      wires: [shortWire],
    });

    expect(result.isShortCircuit).toBe(true);
    expect(result.shortCircuitBranches).toContain('bat_aa');
    expect(Math.abs(result.branchCurrents['bat_aa'])).toBeCloseTo(30.0, 1);
  });

  it('does NOT flag short circuit when a 9V battery powers a normal 100 Ohm load', () => {
    const battery9v: CircuitElementData = {
      id: 'bat_9v',
      type: 'battery9v',
      label: 'Baterai 9V',
      voltage: 9.0,
      currentCharge: 100,
    };

    const resistor: CircuitElementData = {
      id: 'r_load',
      type: 'resistor',
      label: 'Resistor 100Ω',
      resistance: 100.0,
    };

    const wires: WireConnection[] = [
      {
        id: 'w1',
        source: 'bat_9v',
        sourceHandle: 'pos',
        target: 'r_load',
        targetHandle: 'p1',
      },
      {
        id: 'w2',
        source: 'r_load',
        sourceHandle: 'p2',
        target: 'bat_9v',
        targetHandle: 'neg',
      },
    ];

    const result = solveCircuitMNA({
      components: [battery9v, resistor],
      wires,
    });

    expect(result.isShortCircuit).toBe(false);
    expect(result.shortCircuitBranches.length).toBe(0);
    // Expected current: 9V / (100 + 2.0)Ω = 0.0882 A
    expect(Math.abs(result.branchCurrents['bat_9v'])).toBeCloseTo(0.088, 2);
    expect(Math.abs(result.branchCurrents['r_load'])).toBeCloseTo(0.088, 2);
  });
});
