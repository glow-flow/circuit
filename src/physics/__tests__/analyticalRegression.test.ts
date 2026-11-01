/**
 * Analytical Reference Regression Test Suite for MNA Physics Engine.
 * 
 * Verifies that the numerical solver strictly satisfies analytical electrical laws:
 * 1. Ohm's Law (V = I * R)
 * 2. Series Resistance & KVL (R_total = R1 + R2, Sum(Delta_V) = 0)
 * 3. Parallel Resistance & Current Divider (1/R_eq = 1/R1 + 1/R2, I_branch = I_total * (R_other / R_sum))
 * 4. Kirchhoff's Current Law (Sum(I_in) = Sum(I_out) at every node)
 * 5. Conservation of Energy & Power Balance (P_source = Sum(P_dissipated))
 * 6. Open Circuit Condition (Zero current)
 * 7. Short Circuit Detection (Threshold trip at |I| > 10.0A)
 * 8. LED Polarity (Forward bias conducts; Reverse bias cuts current and flags branch)
 * 
 * Conventions:
 * - Voltage source current j is signed: j < 0 indicates power delivery (discharging),
 *   j > 0 indicates power absorption (charging). Magnitude |j| is branch current.
 */

import { describe, it, expect } from 'vitest';
import { solveCircuitMNA, BATTERY_INTERNAL_RESISTANCE, BATTERY_9V_INTERNAL_RESISTANCE } from '../mnaSolver';
import { CircuitElementData, WireConnection } from '../../types/circuit';

describe('MNA Solver — Analytical Reference Tests', () => {
  it('strictly validates Ohm\'s Law on a single resistive loop', () => {
    // 1.5V AA Battery (R_int = 0.05 Ohm) + 100 Ohm Resistor
    const rVal = 100;
    const rInt = BATTERY_INTERNAL_RESISTANCE; // 0.05
    const emf = 1.5;

    // Analytical expectations:
    const expectedCurrent = emf / (rVal + rInt); // 1.5 / 100.05 = 0.0149925037 A
    const expectedResistorVoltage = expectedCurrent * rVal; // 1.49925037 V
    const expectedTerminalVoltage = emf - (expectedCurrent * rInt); // 1.49925037 V

    const components: CircuitElementData[] = [
      { id: 'b1', type: 'battery', label: 'Baterai AA', voltage: 1.5, currentCharge: 100 },
      { id: 'r1', type: 'resistor', label: 'Resistor 100Ω', resistance: rVal },
    ];

    const wires: WireConnection[] = [
      { id: 'w1', source: 'b1', sourceHandle: 'pos', target: 'r1', targetHandle: 'p1' },
      { id: 'w2', source: 'r1', sourceHandle: 'p2', target: 'b1', targetHandle: 'neg' },
    ];

    const result = solveCircuitMNA({ components, wires });

    expect(result.isShortCircuit).toBe(false);
    // Source current in MNA is negative for discharging
    expect(result.branchCurrents['b1']).toBeCloseTo(-expectedCurrent, 5);
    expect(Math.abs(result.branchCurrents['b1'])).toBeCloseTo(expectedCurrent, 5);
    expect(result.branchCurrents['r1']).toBeCloseTo(expectedCurrent, 5);

    // Resistor voltage drop
    const vPos = result.nodeVoltages['b1:pos'] ?? 0;
    const vNeg = result.nodeVoltages['b1:neg'] ?? 0;
    const vDrop = Math.abs(vPos - vNeg);
    expect(vDrop).toBeCloseTo(expectedResistorVoltage, 4);
    expect(vDrop).toBeCloseTo(expectedTerminalVoltage, 4);
  });

  it('strictly validates Series Resistance and Kirchhoff\'s Voltage Law (KVL)', () => {
    // 9V Battery (R_int = 2.0 Ohm) + R1 (100 Ohm) + R2 (200 Ohm)
    const r1 = 100;
    const r2 = 200;
    const rInt = BATTERY_9V_INTERNAL_RESISTANCE; // 2.0
    const emf = 9.0;

    const totalResistance = r1 + r2 + rInt; // 302 Ohm
    const expectedCurrent = emf / totalResistance; // 9 / 302 = 0.02980132 A
    const expectedV1 = expectedCurrent * r1; // 2.980132 V
    const expectedV2 = expectedCurrent * r2; // 5.960265 V
    const expectedVint = expectedCurrent * rInt; // 0.059603 V

    const components: CircuitElementData[] = [
      { id: 'b1', type: 'battery9v', label: 'Baterai 9V', voltage: 9.0, currentCharge: 100 },
      { id: 'r1', type: 'resistor', label: 'R1', resistance: r1 },
      { id: 'r2', type: 'resistor', label: 'R2', resistance: r2 },
    ];

    const wires: WireConnection[] = [
      { id: 'w1', source: 'b1', sourceHandle: 'pos', target: 'r1', targetHandle: 'p1' },
      { id: 'w2', source: 'r1', sourceHandle: 'p2', target: 'r2', targetHandle: 'p1' },
      { id: 'w3', source: 'r2', sourceHandle: 'p2', target: 'b1', targetHandle: 'neg' },
    ];

    const result = solveCircuitMNA({ components, wires });

    expect(Math.abs(result.branchCurrents['b1'])).toBeCloseTo(expectedCurrent, 5);
    expect(result.branchCurrents['r1']).toBeCloseTo(expectedCurrent, 5);
    expect(result.branchCurrents['r2']).toBeCloseTo(expectedCurrent, 5);

    // KVL Check: V_battery_terminal = V1 + V2
    const vPos = result.nodeVoltages['b1:pos'] ?? 0;
    const vMid = result.nodeVoltages['r1:p2'] ?? 0;
    const vNeg = result.nodeVoltages['b1:neg'] ?? 0;

    const measuredV1 = Math.abs(vPos - vMid);
    const measuredV2 = Math.abs(vMid - vNeg);
    const terminalVoltage = Math.abs(vPos - vNeg);

    expect(measuredV1).toBeCloseTo(expectedV1, 4);
    expect(measuredV2).toBeCloseTo(expectedV2, 4);
    expect(measuredV1 + measuredV2).toBeCloseTo(terminalVoltage, 5);
    expect(terminalVoltage + expectedVint).toBeCloseTo(emf, 5);
  });

  it('strictly validates Parallel Resistance and Kirchhoff\'s Current Law (KCL)', () => {
    // 1.5V AA Battery (R_int = 0.05 Ohm) + R1 (100 Ohm) || R2 (100 Ohm)
    const r1 = 100;
    const r2 = 100;
    const rParallel = (r1 * r2) / (r1 + r2); // 50 Ohm
    const rInt = BATTERY_INTERNAL_RESISTANCE; // 0.05
    const emf = 1.5;

    const totalResistance = rParallel + rInt; // 50.05 Ohm
    const expectedTotalCurrent = emf / totalResistance; // 1.5 / 50.05 = 0.02997003 A
    const expectedI1 = expectedTotalCurrent * (r2 / (r1 + r2)); // 0.014985015 A
    const expectedI2 = expectedTotalCurrent * (r1 / (r1 + r2)); // 0.014985015 A

    const components: CircuitElementData[] = [
      { id: 'b1', type: 'battery', label: 'Baterai AA', voltage: 1.5, currentCharge: 100 },
      { id: 'r1', type: 'resistor', label: 'R1', resistance: r1 },
      { id: 'r2', type: 'resistor', label: 'R2', resistance: r2 },
    ];

    const wires: WireConnection[] = [
      // Parallel rail to R1
      { id: 'w1', source: 'b1', sourceHandle: 'pos', target: 'r1', targetHandle: 'p1' },
      { id: 'w2', source: 'r1', sourceHandle: 'p2', target: 'b1', targetHandle: 'neg' },
      // Parallel rail to R2
      { id: 'w3', source: 'b1', sourceHandle: 'pos', target: 'r2', targetHandle: 'p1' },
      { id: 'w4', source: 'r2', sourceHandle: 'p2', target: 'b1', targetHandle: 'neg' },
    ];

    const result = solveCircuitMNA({ components, wires });

    const iTotal = Math.abs(result.branchCurrents['b1']);
    const i1 = result.branchCurrents['r1'];
    const i2 = result.branchCurrents['r2'];

    expect(iTotal).toBeCloseTo(expectedTotalCurrent, 5);
    expect(i1).toBeCloseTo(expectedI1, 5);
    expect(i2).toBeCloseTo(expectedI2, 5);

    // KCL Check: Total current equals sum of branch currents
    expect(i1 + i2).toBeCloseTo(iTotal, 6);
  });

  it('strictly validates Conservation of Energy (Power Balance)', () => {
    // 1.5V AA Battery + R1 (50 Ohm) + R2 (150 Ohm) in series
    const r1 = 50;
    const r2 = 150;
    const rInt = BATTERY_INTERNAL_RESISTANCE; // 0.05
    const emf = 1.5;

    const rTotal = r1 + r2 + rInt; // 200.05
    const iTotal = emf / rTotal;

    const pEmfGenerated = emf * iTotal;
    const pIntDissipated = iTotal * iTotal * rInt;
    const pR1Dissipated = iTotal * iTotal * r1;
    const pR2Dissipated = iTotal * iTotal * r2;

    const components: CircuitElementData[] = [
      { id: 'b1', type: 'battery', label: 'Baterai AA', voltage: 1.5, currentCharge: 100 },
      { id: 'r1', type: 'resistor', label: 'R1', resistance: r1 },
      { id: 'r2', type: 'resistor', label: 'R2', resistance: r2 },
    ];

    const wires: WireConnection[] = [
      { id: 'w1', source: 'b1', sourceHandle: 'pos', target: 'r1', targetHandle: 'p1' },
      { id: 'w2', source: 'r1', sourceHandle: 'p2', target: 'r2', targetHandle: 'p1' },
      { id: 'w3', source: 'r2', sourceHandle: 'p2', target: 'b1', targetHandle: 'neg' },
    ];

    const result = solveCircuitMNA({ components, wires });

    const measuredCurrent = Math.abs(result.branchCurrents['b1']);
    expect(measuredCurrent).toBeCloseTo(iTotal, 5);

    // Total power drawn reported by solver
    expect(result.totalPowerDrawn).toBeCloseTo(pEmfGenerated, 4);

    // Power sum conservation: P_EMF = P_int + P_R1 + P_R2
    const totalDissipated = pIntDissipated + pR1Dissipated + pR2Dissipated;
    expect(pEmfGenerated).toBeCloseTo(totalDissipated, 6);
  });

  it('strictly validates Open Circuit (infinite impedance / zero current)', () => {
    const components: CircuitElementData[] = [
      { id: 'b1', type: 'battery', label: 'Baterai AA', voltage: 1.5, currentCharge: 100 },
      { id: 'sw1', type: 'switch', label: 'Saklar', isOpen: true }, // OPEN SWITCH
      { id: 'r1', type: 'resistor', label: 'Resistor', resistance: 100 },
    ];

    const wires: WireConnection[] = [
      { id: 'w1', source: 'b1', sourceHandle: 'pos', target: 'sw1', targetHandle: 'p1' },
      { id: 'w2', source: 'sw1', sourceHandle: 'p2', target: 'r1', targetHandle: 'p1' },
      { id: 'w3', source: 'r1', sourceHandle: 'p2', target: 'b1', targetHandle: 'neg' },
    ];

    const result = solveCircuitMNA({ components, wires });

    expect(result.branchCurrents['b1']).toBeCloseTo(0, 7);
    expect(result.branchCurrents['r1']).toBeCloseTo(0, 7);
    expect(result.isShortCircuit).toBe(false);
  });

  it('strictly validates Short Circuit overcurrent detection (|I| > 10.0A)', () => {
    // 9V Battery (type: 'battery', voltage: 9.0V, R_int = 0.05 Ohm) with a 0.1 Ohm shorting path:
    // I = 9.0 / (0.1 + 0.05) = 60.0 A > 10.0 A threshold!
    const components: CircuitElementData[] = [
      { id: 'b1', type: 'battery', label: '9V Battery', voltage: 9.0, currentCharge: 100 },
      { id: 'short_res', type: 'resistor', label: 'Low R', resistance: 0.1 },
    ];

    const wires: WireConnection[] = [
      { id: 'w1', source: 'b1', sourceHandle: 'pos', target: 'short_res', targetHandle: 'p1' },
      { id: 'w2', source: 'short_res', sourceHandle: 'p2', target: 'b1', targetHandle: 'neg' },
    ];

    const result = solveCircuitMNA({ components, wires });

    expect(result.isShortCircuit).toBe(true);
    expect(result.shortCircuitBranches).toContain('b1');
    expect(Math.abs(result.branchCurrents['b1'])).toBeGreaterThanOrEqual(10.0);
    expect(Math.abs(result.branchCurrents['b1'])).toBeCloseTo(60.0, 1);
  });

  it('strictly validates Unidirectional LED Diode behavior (forward vs reverse bias)', () => {
    // 1. Forward Biased: Anode (p1) to (+) and Cathode (p2) to (-)
    const forwardComponents: CircuitElementData[] = [
      { id: 'b1', type: 'battery9v', label: 'Baterai 9V', voltage: 9.0, currentCharge: 100 },
      {
        id: 's1',
        type: 'socket',
        label: 'Fiting LED',
        installedBulb: {
          id: 'bulb-led',
          bulbType: 'led_standard',
          resistance: 4500, // 4.5 kOhm
        },
      },
    ];

    const forwardWires: WireConnection[] = [
      { id: 'w1', source: 'b1', sourceHandle: 'pos', target: 's1', targetHandle: 'p1' },
      { id: 'w2', source: 's1', sourceHandle: 'p2', target: 'b1', targetHandle: 'neg' },
    ];

    const forwardResult = solveCircuitMNA({ components: forwardComponents, wires: forwardWires });
    expect(forwardResult.branchCurrents['s1']).toBeGreaterThan(0.001); // conducts
    expect(forwardResult.reverseBiasedBranches ?? []).not.toContain('s1');

    // 2. Reverse Biased: Anode (p1) to (-) and Cathode (p2) to (+)
    const reverseWires: WireConnection[] = [
      { id: 'w1', source: 'b1', sourceHandle: 'neg', target: 's1', targetHandle: 'p1' },
      { id: 'w2', source: 's1', sourceHandle: 'p2', target: 'b1', targetHandle: 'pos' },
    ];

    const reverseResult = solveCircuitMNA({ components: forwardComponents, wires: reverseWires });
    expect(reverseResult.branchCurrents['s1']).toBe(0); // blocks current
    expect(reverseResult.reverseBiasedBranches).toContain('s1');
  });

  it('strictly validates two completely disconnected subcircuits on the same canvas', () => {
    // Circuit 1: 1.5V AA Battery (R_int = 0.05) + 100 Ohm Resistor -> I = 1.5 / 100.05 = 0.01499 A
    // Circuit 2: 9V Battery (R_int = 2.0) + 200 Ohm Resistor -> I = 9 / 202 = 0.044554 A
    const components: CircuitElementData[] = [
      // Circuit 1
      { id: 'b1', type: 'battery', label: 'Baterai 1', voltage: 1.5, currentCharge: 100 },
      { id: 'r1', type: 'resistor', label: 'R1', resistance: 100 },
      // Circuit 2 (Floating)
      { id: 'b2', type: 'battery9v', label: 'Baterai 2', voltage: 9.0, currentCharge: 100 },
      { id: 'r2', type: 'resistor', label: 'R2', resistance: 200 },
    ];

    const wires: WireConnection[] = [
      // Circuit 1 loop
      { id: 'w1', source: 'b1', sourceHandle: 'pos', target: 'r1', targetHandle: 'p1' },
      { id: 'w2', source: 'r1', sourceHandle: 'p2', target: 'b1', targetHandle: 'neg' },
      // Circuit 2 loop
      { id: 'w3', source: 'b2', sourceHandle: 'pos', target: 'r2', targetHandle: 'p1' },
      { id: 'w4', source: 'r2', sourceHandle: 'p2', target: 'b2', targetHandle: 'neg' },
    ];

    const result = solveCircuitMNA({ components, wires });

    expect(result.isShortCircuit).toBe(false);

    // Circuit 1 branch current
    const expectedI1 = 1.5 / (100 + BATTERY_INTERNAL_RESISTANCE);
    expect(Math.abs(result.branchCurrents['b1'])).toBeCloseTo(expectedI1, 4);
    expect(result.branchCurrents['r1']).toBeCloseTo(expectedI1, 4);

    // Circuit 2 branch current
    const expectedI2 = 9.0 / (200 + BATTERY_9V_INTERNAL_RESISTANCE);
    expect(Math.abs(result.branchCurrents['b2'])).toBeCloseTo(expectedI2, 4);
    expect(result.branchCurrents['r2']).toBeCloseTo(expectedI2, 4);
  });
});
