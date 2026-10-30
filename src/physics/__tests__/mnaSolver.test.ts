import { describe, it, expect } from 'vitest';
import { solveCircuitMNA, solveLinearSystem } from '../mnaSolver';
import { UnionFind } from '../unionFind';
import { CircuitElementData, WireConnection } from '../../types/circuit';
import {
  BULB_CATALOG,
  computeBulbPhotometrics,
  getBulbSpec,
} from '../../constants/bulbCatalog';

describe('UnionFind Data Structure', () => {
  it('correctly unites elements and performs path compression', () => {
    const uf = new UnionFind();
    uf.makeSet('A');
    uf.makeSet('B');
    uf.makeSet('C');
    uf.makeSet('D');

    uf.union('A', 'B');
    uf.union('C', 'D');

    expect(uf.find('A')).toBe(uf.find('B'));
    expect(uf.find('C')).toBe(uf.find('D'));
    expect(uf.find('A')).not.toBe(uf.find('C'));

    // Merge the two clusters
    uf.union('B', 'C');
    expect(uf.find('A')).toBe(uf.find('D'));
  });
});

describe('Linear System Solver (Gaussian Elimination with Partial Pivoting)', () => {
  it('solves a 2x2 system accurately', () => {
    // 2x + y = 5
    // x + 3y = 5
    // Solution: x = 2, y = 1
    const A = [
      [2, 1],
      [1, 3],
    ];
    const b = [5, 5];
    const x = solveLinearSystem(A, b);

    expect(x[0]).toBeCloseTo(2, 4);
    expect(x[1]).toBeCloseTo(1, 4);
  });
});

describe('Modified Nodal Analysis (MNA) Physics Engine', () => {
  it('correctly solves Ohm Law for 9V Battery and 100 Ohm Resistor', () => {
    const battery: CircuitElementData = {
      id: 'bat_1',
      type: 'battery',
      label: '9V Battery',
      voltage: 9.0,
    };

    const resistor: CircuitElementData = {
      id: 'res_1',
      type: 'resistor',
      label: '100Ω Resistor',
      resistance: 100,
    };

    const wires: WireConnection[] = [
      { id: 'w1', source: 'bat_1', sourceHandle: 'pos', target: 'res_1', targetHandle: 'p1' },
      { id: 'w2', source: 'res_1', sourceHandle: 'p2', target: 'bat_1', targetHandle: 'neg' },
    ];

    const result = solveCircuitMNA({
      components: [battery, resistor],
      wires,
    });

    expect(result.isShortCircuit).toBe(false);
    expect(result.branchCurrents['bat_1']).toBeDefined();
    // I = V / (R + R_int) = 9 / 100.05 ≈ 0.08995 A
    expect(Math.abs(result.branchCurrents['bat_1'])).toBeCloseTo(0.08995, 3);
    expect(Math.abs(result.branchCurrents['res_1'])).toBeCloseTo(0.08995, 3);
  });

  it('correctly detects short circuit condition when current exceeds 10A', () => {
    const battery: CircuitElementData = {
      id: 'bat_1',
      type: 'battery',
      label: '9V Battery',
      voltage: 9.0,
    };

    // Low resistance dead short path (0.2 Ohm -> I ≈ 45A > 10A)
    const shortResistor: CircuitElementData = {
      id: 'short_res',
      type: 'resistor',
      label: 'Shorted Path',
      resistance: 0.1,
    };

    const wires: WireConnection[] = [
      { id: 'w1', source: 'bat_1', sourceHandle: 'pos', target: 'short_res', targetHandle: 'p1' },
      { id: 'w2', source: 'short_res', sourceHandle: 'p2', target: 'bat_1', targetHandle: 'neg' },
    ];

    const result = solveCircuitMNA({
      components: [battery, shortResistor],
      wires,
    });

    expect(result.isShortCircuit).toBe(true);
    expect(result.shortCircuitBranches).toContain('bat_1');
    expect(Math.abs(result.branchCurrents['bat_1'])).toBeGreaterThan(10.0);
  });

  it('handles open switch preventing current flow', () => {
    const battery: CircuitElementData = {
      id: 'bat_1',
      type: 'battery',
      label: '9V Battery',
      voltage: 9.0,
    };

    const lightBulb: CircuitElementData = {
      id: 'bulb_1',
      type: 'socket',
      label: 'Socket + Light Bulb',
      resistance: 15,
      installedBulb: {
        id: 'bulb_unit_sw',
        bulbType: 'incandescent',
        resistance: 15,
      },
    };

    const switchComp: CircuitElementData = {
      id: 'sw_1',
      type: 'switch',
      label: 'SPST Switch',
      isOpen: true, // OPEN SWITCH
    };

    const wires: WireConnection[] = [
      { id: 'w1', source: 'bat_1', sourceHandle: 'pos', target: 'sw_1', targetHandle: 'p1' },
      { id: 'w2', source: 'sw_1', sourceHandle: 'p2', target: 'bulb_1', targetHandle: 'p1' },
      { id: 'w3', source: 'bulb_1', sourceHandle: 'p2', target: 'bat_1', targetHandle: 'neg' },
    ];

    const result = solveCircuitMNA({
      components: [battery, lightBulb, switchComp],
      wires,
    });

    expect(result.isShortCircuit).toBe(false);
    // Current should be negligibly tiny (~ nanoamperes)
    expect(Math.abs(result.branchCurrents['bulb_1'])).toBeLessThan(1e-6);
  });

  it('preserves complete electrical continuity when inserting a Waypoint anchor node', () => {
    const battery: CircuitElementData = {
      id: 'bat_1',
      type: 'battery',
      voltage: 9.0,
      label: '9V Battery',
    };

    const resistor: CircuitElementData = {
      id: 'res_1',
      type: 'resistor',
      resistance: 100,
      label: '100Ω Resistor',
    };

    const waypoint: CircuitElementData = {
      id: 'wp_1',
      type: 'waypoint',
      label: 'Anchor',
    };

    // Wires go: Battery (+) -> Waypoint (p1) -> Waypoint (p2) -> Resistor (p1) -> Battery (-)
    const wires: WireConnection[] = [
      { id: 'w1', source: 'bat_1', sourceHandle: 'pos', target: 'wp_1', targetHandle: 'p1' },
      { id: 'w2', source: 'wp_1', sourceHandle: 'p2', target: 'res_1', targetHandle: 'p1' },
      { id: 'w3', source: 'res_1', sourceHandle: 'p2', target: 'bat_1', targetHandle: 'neg' },
    ];

    const result = solveCircuitMNA({
      components: [battery, resistor, waypoint],
      wires,
    });

    // Current should exactly match the direct circuit without waypoint (0.08995 A)
    expect(result.isShortCircuit).toBe(false);
    expect(Math.abs(result.branchCurrents['bat_1'])).toBeCloseTo(0.08995, 3);
    expect(Math.abs(result.branchCurrents['res_1'])).toBeCloseTo(0.08995, 3);
    // And the waypoint itself must receive the propagated branch current so split wires glow
    expect(Math.abs(result.branchCurrents['wp_1'])).toBeCloseTo(0.08995, 3);
  });

  it('calculates 3.0V output for Dual AA BatteryHolderNode with 2 series cells and 0A when empty', () => {
    const emptyHolder: CircuitElementData = {
      id: 'holder_1',
      type: 'battery-holder',
      hasBattery: false,
      batteryCount: 0,
      label: 'Empty Dual AA Holder',
    };

    const resistor: CircuitElementData = {
      id: 'res_1',
      type: 'resistor',
      resistance: 10,
      label: '10Ω Load',
    };

    const wires: WireConnection[] = [
      { id: 'w1', source: 'holder_1', sourceHandle: 'pos', target: 'res_1', targetHandle: 'p1' },
      { id: 'w2', source: 'res_1', sourceHandle: 'p2', target: 'holder_1', targetHandle: 'neg' },
    ];

    // 1. Empty holder -> 0A
    const emptyResult = solveCircuitMNA({
      components: [emptyHolder, resistor],
      wires,
    });
    expect(Math.abs(emptyResult.branchCurrents['res_1'] ?? 0)).toBe(0);

    // 2. 1 AA cell inserted -> 1.5V across 10.05Ω ≈ 0.14925A
    const singleCellHolder: CircuitElementData = {
      ...emptyHolder,
      hasBattery: true,
      batteryCount: 1,
    };
    const singleCellResult = solveCircuitMNA({
      components: [singleCellHolder, resistor],
      wires,
    });
    expect(Math.abs(singleCellResult.branchCurrents['res_1'])).toBeCloseTo(1.5 / 10.05, 3);

    // 3. 2 AA cells in series -> 3.0V across (10Ω + 2 * 0.05Ω internal resistance = 10.10Ω) ≈ 0.29703A
    const dualCellHolder: CircuitElementData = {
      ...emptyHolder,
      hasBattery: true,
      batteryCount: 2,
    };
    const dualCellResult = solveCircuitMNA({
      components: [dualCellHolder, resistor],
      wires,
    });
    expect(Math.abs(dualCellResult.branchCurrents['res_1'])).toBeCloseTo(3.0 / 10.1, 3);
  });

  it('correctly drops current to 0A when a wire is cut / removed', () => {
    const battery: CircuitElementData = {
      id: 'bat_1',
      type: 'battery',
      voltage: 1.5,
      label: '1.5V Battery',
    };
    const lamp: CircuitElementData = {
      id: 'lamp_1',
      type: 'socket',
      resistance: 10,
      label: 'Socket + Light Bulb',
      installedBulb: {
        id: 'bulb_unit_1',
        bulbType: 'incandescent',
        resistance: 10,
      },
    };
    const completeWires: WireConnection[] = [
      { id: 'w1', source: 'bat_1', sourceHandle: 'pos', target: 'lamp_1', targetHandle: 'p1' },
      { id: 'w2', source: 'lamp_1', sourceHandle: 'p2', target: 'bat_1', targetHandle: 'neg' },
    ];

    // Circuit closed: current flows
    const closedCircuit = solveCircuitMNA({
      components: [battery, lamp],
      wires: completeWires,
    });
    expect(Math.abs(closedCircuit.branchCurrents['lamp_1'])).toBeGreaterThan(0.1);

    // Cut/remove wire w1
    const cutWires = completeWires.filter((w) => w.id !== 'w1');
    const openCircuit = solveCircuitMNA({
      components: [battery, lamp],
      wires: cutWires,
    });
    expect(Math.abs(openCircuit.branchCurrents['lamp_1'] ?? 0)).toBe(0);
  });

  it('strictly prevents standalone bulb nodes (without socket) from conducting electricity', () => {
    const battery: CircuitElementData = {
      id: 'bat_1',
      type: 'battery',
      voltage: 9.0,
      label: '9V Battery',
    };
    const standaloneBulb: CircuitElementData = {
      id: 'bulb_loose',
      type: 'bulb',
      bulbType: 'incandescent',
      resistance: 10,
      label: 'Loose Bulb Without Socket',
    };
    const illegalWires: WireConnection[] = [
      { id: 'w1', source: 'bat_1', sourceHandle: 'pos', target: 'bulb_loose', targetHandle: 'p1' },
      { id: 'w2', source: 'bulb_loose', sourceHandle: 'p2', target: 'bat_1', targetHandle: 'neg' },
    ];

    const res = solveCircuitMNA({
      components: [battery, standaloneBulb],
      wires: illegalWires,
    });
    expect(Math.abs(res.branchCurrents['bulb_loose'] ?? 0)).toBe(0);
  });

  it('verifies Grade 9 IPA 3-branch Parallel ladder law (I_total = I1 + I2 + I3) with Waypoint rails', () => {
    const holder: CircuitElementData = {
      id: 'holder_1',
      type: 'battery-holder',
      hasBattery: true,
      batteryCount: 2,
      voltage: 3.0,
      label: 'Sumber V (3.0V)',
    };
    const r1: CircuitElementData = {
      id: 'bulb_1',
      type: 'socket',
      resistance: 10,
      installedBulb: { id: 'b1', bulbType: 'incandescent', resistance: 10 },
      label: 'R1',
    };
    const r2: CircuitElementData = {
      id: 'bulb_2',
      type: 'socket',
      resistance: 10,
      installedBulb: { id: 'b2', bulbType: 'incandescent', resistance: 10 },
      label: 'R2',
    };
    const r3: CircuitElementData = {
      id: 'bulb_3',
      type: 'socket',
      resistance: 10,
      installedBulb: { id: 'b3', bulbType: 'incandescent', resistance: 10 },
      label: 'R3',
    };
    const wpTop1: CircuitElementData = { id: 'wp_top_1', type: 'waypoint', label: 'Top 1' };
    const wpBot1: CircuitElementData = { id: 'wp_bot_1', type: 'waypoint', label: 'Bot 1' };

    const wires: WireConnection[] = [
      { id: 'w1', source: 'holder_1', sourceHandle: 'pos', target: 'wp_top_1', targetHandle: 'p1' },
      { id: 'w2', source: 'wp_top_1', sourceHandle: 'p2', target: 'bulb_1', targetHandle: 'p1' },
      { id: 'w3', source: 'wp_top_1', sourceHandle: 'p2', target: 'bulb_2', targetHandle: 'p1' },
      { id: 'w4', source: 'wp_top_1', sourceHandle: 'p2', target: 'bulb_3', targetHandle: 'p1' },
      { id: 'w5', source: 'bulb_1', sourceHandle: 'p2', target: 'wp_bot_1', targetHandle: 'p1' },
      { id: 'w6', source: 'bulb_2', sourceHandle: 'p2', target: 'wp_bot_1', targetHandle: 'p1' },
      { id: 'w7', source: 'bulb_3', sourceHandle: 'p2', target: 'wp_bot_1', targetHandle: 'p1' },
      { id: 'w8', source: 'wp_bot_1', sourceHandle: 'p2', target: 'holder_1', targetHandle: 'neg' },
    ];

    const res = solveCircuitMNA({
      components: [holder, r1, r2, r3, wpTop1, wpBot1],
      wires,
    });

    const i1 = Math.abs(res.branchCurrents['bulb_1']);
    const i2 = Math.abs(res.branchCurrents['bulb_2']);
    const i3 = Math.abs(res.branchCurrents['bulb_3']);
    const iTotal = Math.abs(res.branchCurrents['holder_1']);

    // Equal branches have equal currents, and total current is sum of branches
    expect(i1).toBeCloseTo(i2, 4);
    expect(i2).toBeCloseTo(i3, 4);
    expect(iTotal).toBeCloseTo(i1 + i2 + i3, 4);
  });

  it('dynamically updates MNA current, power (P = I^2 * R), and brightness across the 7 bulb types', () => {
    expect(BULB_CATALOG).toHaveLength(7);

    const holder: CircuitElementData = {
      id: 'holder_1',
      type: 'battery-holder',
      hasBattery: true,
      batteryCount: 2,
      voltage: 3.0,
      label: 'Wadah AA 3.0V',
    };

    const wires: WireConnection[] = [
      { id: 'w1', source: 'holder_1', sourceHandle: 'pos', target: 'bulb_1', targetHandle: 'p1' },
      { id: 'w2', source: 'bulb_1', sourceHandle: 'p2', target: 'holder_1', targetHandle: 'neg' },
    ];

    // 1. Incandescent (800Ω) installed in SocketNode
    const incandescentSpec = getBulbSpec('incandescent');
    const bulbIncandescent: CircuitElementData = {
      id: 'bulb_1',
      type: 'socket',
      bulbType: 'incandescent',
      resistance: incandescentSpec.resistance,
      installedBulb: {
        id: 'b_inc',
        bulbType: 'incandescent',
        resistance: incandescentSpec.resistance,
      },
      label: incandescentSpec.label,
    };
    const resInc = solveCircuitMNA({ components: [holder, bulbIncandescent], wires });
    const currentInc = Math.abs(resInc.branchCurrents['bulb_1']);
    const photoInc = computeBulbPhotometrics(currentInc, incandescentSpec.resistance, incandescentSpec);

    // 2. Standard LED (4500Ω) installed in SocketNode
    const ledSpec = getBulbSpec('led_standard');
    const bulbLed: CircuitElementData = {
      id: 'bulb_1',
      type: 'socket',
      bulbType: 'led_standard',
      resistance: ledSpec.resistance,
      installedBulb: {
        id: 'b_led',
        bulbType: 'led_standard',
        resistance: ledSpec.resistance,
      },
      label: ledSpec.label,
    };
    const resLed = solveCircuitMNA({ components: [holder, bulbLed], wires });
    const currentLed = Math.abs(resLed.branchCurrents['bulb_1']);
    const photoLed = computeBulbPhotometrics(currentLed, ledSpec.resistance, ledSpec);

    // Higher resistance on LED means lower current I, lower power P = I^2 * R, and dimmer glow
    expect(currentLed).toBeLessThan(currentInc);
    expect(photoLed.powerWatts).toBeLessThan(photoInc.powerWatts);
    expect(photoLed.brightness).toBeLessThan(photoInc.brightness);

    // 3. Overvoltage test: 9V battery connected directly to Indicator LED (led_green) triggers overheat/overload
    const greenSpec = getBulbSpec('led_green');
    const currentAt9V = 9.0 / greenSpec.resistance;
    const photoOverload = computeBulbPhotometrics(currentAt9V, greenSpec.resistance, greenSpec);
    expect(photoOverload.isOverloaded).toBe(true);
    expect(photoOverload.heatLevel).toBe('overheat');
  });

  it('correctly models 9V Battery internalResistance (2.0Ω) and sums two 9V batteries in series to 18.0V', () => {
    const bat9vA: CircuitElementData = {
      id: 'b9_1',
      type: 'battery9v',
      voltage: 9.0,
      internalResistance: 2.0,
      label: 'Baterai 9V #1',
    };
    const bat9vB: CircuitElementData = {
      id: 'b9_2',
      type: 'battery9v',
      voltage: 9.0,
      internalResistance: 2.0,
      label: 'Baterai 9V #2',
    };
    const bulbHalogen: CircuitElementData = {
      id: 'bulb_h',
      type: 'socket',
      bulbType: 'halogen',
      resistance: 1500,
      installedBulb: {
        id: 'b_hal',
        bulbType: 'halogen',
        resistance: 1500,
      },
      label: 'Socket + Lampu Halogen (1500Ω)',
    };

    // Connect two 9V batteries in series: b9_1(-) -> ground, b9_1(+) -> b9_2(-), b9_2(+) -> bulb(p1) -> bulb(p2) -> b9_1(-)
    const seriesWires: WireConnection[] = [
      { id: 'w1', source: 'b9_1', sourceHandle: 'pos', target: 'b9_2', targetHandle: 'neg' },
      { id: 'w2', source: 'b9_2', sourceHandle: 'pos', target: 'bulb_h', targetHandle: 'p1' },
      { id: 'w3', source: 'bulb_h', sourceHandle: 'p2', target: 'b9_1', targetHandle: 'neg' },
    ];

    const seriesResult = solveCircuitMNA({
      components: [bat9vA, bat9vB, bulbHalogen],
      wires: seriesWires,
    });

    // Total EMF = 18.0V, Total R = 1500Ω + 2.0Ω + 2.0Ω = 1504.0Ω -> I = 18 / 1504 ≈ 0.011968 A
    const expectedSeriesCurrent = 18.0 / 1504.0;
    expect(Math.abs(seriesResult.branchCurrents['bulb_h'])).toBeCloseTo(expectedSeriesCurrent, 5);
    expect(Math.max(...Object.values(seriesResult.nodeVoltages))).toBeCloseTo(
      18.0 - expectedSeriesCurrent * 4.0,
      2
    );

    // Direct short across a single 9V battery with 2.0Ω internal resistance limits current to ~4.5A (< 10A)
    const closedSwitch: CircuitElementData = {
      id: 'sw_short',
      type: 'switch',
      isOpen: false,
      label: 'Closed Switch',
    };
    const shortResult = solveCircuitMNA({
      components: [bat9vA, closedSwitch],
      wires: [
        { id: 's1', source: 'b9_1', sourceHandle: 'pos', target: 'sw_short', targetHandle: 'p1' },
        { id: 's2', source: 'sw_short', sourceHandle: 'p2', target: 'b9_1', targetHandle: 'neg' },
      ],
    });
    expect(Math.abs(shortResult.branchCurrents['b9_1'])).toBeCloseTo(9.0 / 2.001, 2);
    expect(shortResult.isShortCircuit).toBe(false);
  });
});



