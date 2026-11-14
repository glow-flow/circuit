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
    // MNA sign convention: discharging short current is negative (< 0) with magnitude 9V / 2Ω = 4.5A
    expect(result.branchCurrents['bat_9v']).toBeCloseTo(-4.5, 1);
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

  it('detects dead short on an independent island even while another island charges a battery', () => {
    // Island A: 12V solar charging 0V AA battery (legitimate charging)
    const solarA: CircuitElementData = { id: 'sol_a', type: 'solar-panel', voltage: 12.0, label: 'Solar A' };
    const batDeadA: CircuitElementData = { id: 'bat_a', type: 'battery', voltage: 1.5, currentCharge: 0, label: 'Bat A' };
    // Island B: 1.5V AA battery shorted across closed switch (~29A)
    const batB: CircuitElementData = { id: 'bat_b', type: 'battery', voltage: 1.5, currentCharge: 100, label: 'Bat B' };
    const swB: CircuitElementData = { id: 'sw_b', type: 'switch', isOpen: false, label: 'Switch B' };

    const res = solveCircuitMNA({
      components: [solarA, batDeadA, batB, swB],
      wires: [
        { id: 'wa1', source: 'sol_a', sourceHandle: 'pos', target: 'bat_a', targetHandle: 'pos' },
        { id: 'wa2', source: 'sol_a', sourceHandle: 'neg', target: 'bat_a', targetHandle: 'neg' },
        { id: 'wb1', source: 'bat_b', sourceHandle: 'pos', target: 'sw_b', targetHandle: 'p1' },
        { id: 'wb2', source: 'sw_b', sourceHandle: 'p2', target: 'bat_b', targetHandle: 'neg' },
      ],
    });

    expect(res.isShortCircuit).toBe(true);
    expect(res.shortCircuitBranches).toContain('bat_b');
    expect(res.shortCircuitBranches).not.toContain('bat_a');
    expect(res.shortCircuitBranches).not.toContain('sol_a');
  });

  it('does NOT let Lab Panel stepDownVoltage crush outdoor generator or BESS EMFs', () => {
    const solarOut: CircuitElementData = {
      id: 'sol_out',
      type: 'solar-panel',
      worldMode: 'outside',
      voltage: 12.0,
      internalResistance: 0.2,
      label: 'Solar 12V',
    };
    const outLoad: CircuitElementData = {
      id: 'r_out',
      type: 'resistor',
      worldMode: 'outside',
      resistance: 100,
      label: 'Outdoor Load',
    };
    const towerOut: CircuitElementData = {
      id: 'tow_out',
      type: 'transmission-tower',
      worldMode: 'outside',
      label: 'Outdoor Tower',
    };
    const panelLab: CircuitElementData = {
      id: 'pnl_lab',
      type: 'transmission-tower',
      worldMode: 'lab',
      isMcbOn: true,
      isMcbTripped: false,
      stepDownVoltage: 3, // Lab steps down to 3V
      label: 'Lab Panel 3V',
    };
    const labLoad: CircuitElementData = {
      id: 'r_lab',
      type: 'resistor',
      worldMode: 'lab',
      resistance: 100,
      label: 'Lab Load',
    };

    const res = solveCircuitMNA({
      components: [solarOut, outLoad, towerOut, panelLab, labLoad],
      wires: [
        { id: 'wo1', source: 'sol_out', sourceHandle: 'pos', target: 'tow_out', targetHandle: 'pos' },
        { id: 'wo2', source: 'sol_out', sourceHandle: 'neg', target: 'tow_out', targetHandle: 'neg' },
        { id: 'wo3', source: 'sol_out', sourceHandle: 'pos', target: 'r_out', targetHandle: 'p1' },
        { id: 'wo4', source: 'r_out', sourceHandle: 'p2', target: 'sol_out', targetHandle: 'neg' },
        { id: 'wl1', source: 'pnl_lab', sourceHandle: 'pos', target: 'r_lab', targetHandle: 'p1' },
        { id: 'wl2', source: 'r_lab', sourceHandle: 'p2', target: 'pnl_lab', targetHandle: 'neg' },
      ],
    });

    // Outdoor resistor stays on true 12V bus (~12 / 100.2 = 0.11976 A)
    expect(Math.abs(res.branchCurrents['r_out'])).toBeCloseTo(12.0 / 100.2, 3);
    // Lab resistor receives regulated 3V (~3 / 100.2 = 0.02994 A)
    expect(Math.abs(res.branchCurrents['r_lab'])).toBeCloseTo(3.0 / 100.2, 4);
  });

  it('isolates voltmeter across disjoint floating circuit islands without phantom leakage', () => {
    const bat1: CircuitElementData = { id: 'b1', type: 'battery9v', voltage: 9.0, label: 'Bat 1' };
    const r1: CircuitElementData = { id: 'r1', type: 'resistor', resistance: 100, label: 'R1' };
    const bat2: CircuitElementData = { id: 'b2', type: 'battery', voltage: 1.5, label: 'Bat 2' };
    const r2: CircuitElementData = { id: 'r2', type: 'resistor', resistance: 100, label: 'R2' };
    const volt: CircuitElementData = { id: 'vm1', type: 'voltmeter', label: 'Voltmeter' };

    const res = solveCircuitMNA({
      components: [bat1, r1, bat2, r2, volt],
      wires: [
        { id: 'w1', source: 'b1', sourceHandle: 'pos', target: 'r1', targetHandle: 'p1' },
        { id: 'w2', source: 'r1', sourceHandle: 'p2', target: 'b1', targetHandle: 'neg' },
        { id: 'w3', source: 'b2', sourceHandle: 'pos', target: 'r2', targetHandle: 'p1' },
        { id: 'w4', source: 'r2', sourceHandle: 'p2', target: 'b2', targetHandle: 'neg' },
        // Voltmeter bridges disconnected Island 1 (+9V) and Island 2 (+1.5V) with no common return
        { id: 'wv1', source: 'b1', sourceHandle: 'pos', target: 'vm1', targetHandle: 'p1' },
        { id: 'wv2', source: 'b2', sourceHandle: 'pos', target: 'vm1', targetHandle: 'p2' },
      ],
    });

    expect(res.floatingVoltmeterIds).toContain('vm1');
    expect(res.branchCurrents['vm1']).toBe(0);
  });
});
