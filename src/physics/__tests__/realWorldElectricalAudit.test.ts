import { describe, it, expect } from 'vitest';
import { solveCircuitMNA } from '../mnaSolver';
import { CircuitElementData, WireConnection } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';

describe('Real-World Electrical Engineering Audit (PUIL, Blocking Diode & LED Polarity)', () => {
  it('activates Schottky Blocking Diode on lower-voltage Wind Turbine when wired in parallel with 12V Solar Panel', () => {
    const solar12v: CircuitElementData = {
      id: 'solar_12v',
      type: 'solar-panel',
      sunlight: 100,
      voltage: 12.0,
      internalResistance: 0.2,
      label: '12V Solar Panel',
    };
    const wind5v: CircuitElementData = {
      id: 'wind_5v',
      type: 'wind-turbine',
      speed: 40,
      voltage: 4.8,
      internalResistance: 0.1,
      label: '4.8V Wind Turbine',
    };
    const loadResistor: CircuitElementData = {
      id: 'load_100',
      type: 'resistor',
      resistance: 100,
      label: '100Ω Load',
    };

    const wires: WireConnection[] = [
      { id: 'w1', source: 'solar_12v', sourceHandle: 'pos', target: 'load_100', targetHandle: 'p1' },
      { id: 'w2', source: 'solar_12v', sourceHandle: 'neg', target: 'load_100', targetHandle: 'p2' },
      { id: 'w3', source: 'wind_5v', sourceHandle: 'pos', target: 'load_100', targetHandle: 'p1' },
      { id: 'w4', source: 'wind_5v', sourceHandle: 'neg', target: 'load_100', targetHandle: 'p2' },
    ];

    const res = solveCircuitMNA({
      components: [solar12v, wind5v, loadResistor],
      wires,
    });

    // Without a blocking diode, 12V solar would force ~24A reverse current into the 4.8V turbine!
    // With the blocking diode, wind_5v is blocked (0A) and solar_12v cleanly powers the 100Ω load (~0.11976A).
    expect(res.blockedGeneratorIds).toContain('wind_5v');
    expect(res.branchCurrents['wind_5v']).toBe(0);
    expect(res.isShortCircuit).toBe(false);
    expect(Math.abs(res.branchCurrents['load_100'])).toBeCloseTo(12.0 / 100.2, 3);
  });

  it('enforces semiconductor diode polarity on LED bulbs (forward bias conducts, reverse bias blocks) while filament bulbs remain bidirectional', () => {
    const battery9v: CircuitElementData = {
      id: 'bat_pol',
      type: 'battery9v',
      voltage: 9.0,
      internalResistance: 2.0,
      label: '9V Battery',
    };

    const ledSocket: CircuitElementData = {
      id: 'sock_led',
      type: 'socket',
      bulbType: 'led_standard',
      resistance: 4500,
      installedBulb: {
        id: 'led_unit',
        bulbType: 'led_standard',
        resistance: 4500,
      },
      label: 'LED Socket',
    };

    const filamentSocket: CircuitElementData = {
      id: 'sock_incandescent',
      type: 'socket',
      bulbType: 'incandescent',
      resistance: 800,
      installedBulb: {
        id: 'inc_unit',
        bulbType: 'incandescent',
        resistance: 800,
      },
      label: 'Incandescent Socket',
    };

    // 1. Forward bias on LED: Battery (+) -> p1 (Anode), p2 (Cathode) -> Battery (-)
    const forwardRes = solveCircuitMNA({
      components: [battery9v, ledSocket],
      wires: [
        { id: 'fw1', source: 'bat_pol', sourceHandle: 'pos', target: 'sock_led', targetHandle: 'p1' },
        { id: 'fw2', source: 'sock_led', sourceHandle: 'p2', target: 'bat_pol', targetHandle: 'neg' },
      ],
    });
    expect(forwardRes.reverseBiasedBranches).not.toContain('sock_led');
    expect(forwardRes.branchCurrents['sock_led']).toBeCloseTo(9.0 / 4502, 5);

    // 2. Reverse bias on LED: Battery (+) -> p2 (Cathode), p1 (Anode) -> Battery (-)
    const reverseRes = solveCircuitMNA({
      components: [battery9v, ledSocket],
      wires: [
        { id: 'rw1', source: 'bat_pol', sourceHandle: 'pos', target: 'sock_led', targetHandle: 'p2' },
        { id: 'rw2', source: 'sock_led', sourceHandle: 'p1', target: 'bat_pol', targetHandle: 'neg' },
      ],
    });
    expect(reverseRes.reverseBiasedBranches).toContain('sock_led');
    expect(reverseRes.branchCurrents['sock_led']).toBe(0);

    // 3. Reverse polarity on Incandescent filament: still conducts because filament is bidirectional!
    const reverseFilamentRes = solveCircuitMNA({
      components: [battery9v, filamentSocket],
      wires: [
        { id: 'ifw1', source: 'bat_pol', sourceHandle: 'pos', target: 'sock_incandescent', targetHandle: 'p2' },
        { id: 'ifw2', source: 'sock_incandescent', sourceHandle: 'p1', target: 'bat_pol', targetHandle: 'neg' },
      ],
    });
    expect(reverseFilamentRes.reverseBiasedBranches).not.toContain('sock_incandescent');
    expect(Math.abs(reverseFilamentRes.branchCurrents['sock_incandescent'])).toBeCloseTo(9.0 / 802, 4);
  });

  it('supports Lab Distribution Panel MCB breaker cutoff, Step-Down DC regulation, and auto-trip on short circuit', () => {
    const solarOutdoor: CircuitElementData = {
      id: 'solar_out',
      type: 'solar-panel',
      worldMode: 'outside',
      sunlight: 100,
      voltage: 12.0,
      internalResistance: 0.2,
      label: 'Outdoor Solar 12V',
    };
    const outdoorTower: CircuitElementData = {
      id: 'tower_out',
      type: 'transmission-tower',
      worldMode: 'outside',
      label: 'Outdoor SUTET Tower',
    };
    const labPanel: CircuitElementData = {
      id: 'panel_lab',
      type: 'transmission-tower',
      worldMode: 'lab',
      isMcbOn: true,
      isMcbTripped: false,
      stepDownVoltage: 6, // Regulate 12V down to 6V DC
      label: 'Panel Distribusi Lab',
    };
    const labResistor: CircuitElementData = {
      id: 'res_lab',
      type: 'resistor',
      worldMode: 'lab',
      resistance: 100,
      label: 'Lab 100Ω Load',
    };

    const wires: WireConnection[] = [
      { id: 'w1', source: 'solar_out', sourceHandle: 'pos', target: 'tower_out', targetHandle: 'pos' },
      { id: 'w2', source: 'solar_out', sourceHandle: 'neg', target: 'tower_out', targetHandle: 'neg' },
      { id: 'w3', source: 'panel_lab', sourceHandle: 'pos', target: 'res_lab', targetHandle: 'p1' },
      { id: 'w4', source: 'res_lab', sourceHandle: 'p2', target: 'panel_lab', targetHandle: 'neg' },
    ];

    // 1. MCB ON + Step-Down 6V: Load receives regulated 6.0V / 100.2Ω ≈ 0.05988 A
    const activeRes = solveCircuitMNA({
      components: [solarOutdoor, outdoorTower, labPanel, labResistor],
      wires,
    });
    expect(Math.abs(activeRes.branchCurrents['res_lab'])).toBeCloseTo(6.0 / 100.2, 4);
    expect(Math.abs(activeRes.branchCurrents['panel_lab'])).toBeCloseTo(6.0 / 100.2, 4);

    // 2. MCB OFF (or Tripped): Virtual grid disconnects, load receives 0 A
    const trippedPanel: CircuitElementData = {
      ...labPanel,
      isMcbOn: false,
      isMcbTripped: true,
    };
    const trippedRes = solveCircuitMNA({
      components: [solarOutdoor, outdoorTower, trippedPanel, labResistor],
      wires,
    });
    expect(Math.abs(trippedRes.branchCurrents['res_lab'] ?? 0)).toBe(0);
    expect(Math.abs(trippedRes.branchCurrents['panel_lab'] ?? 0)).toBe(0);

    // 3. Store auto-trip test when a closed switch causes a short circuit across the Lab Distribution Panel
    const store = useCircuitStore.getState();
    store.clearCanvas();
    useCircuitStore.setState({
      edges: [
        { id: 'e1', source: 'solar_out', sourceHandle: 'pos', target: 'tower_out', targetHandle: 'pos' },
        { id: 'e2', source: 'solar_out', sourceHandle: 'neg', target: 'tower_out', targetHandle: 'neg' },
        { id: 'e3', source: 'panel_lab', sourceHandle: 'pos', target: 'sw_short', targetHandle: 'p1' },
        { id: 'e4', source: 'sw_short', sourceHandle: 'p2', target: 'panel_lab', targetHandle: 'neg' },
      ],
    });
    store.setNodes([
      { id: 'solar_out', type: 'solar-panel', position: { x: 0, y: 0 }, data: solarOutdoor },
      { id: 'tower_out', type: 'transmission-tower', position: { x: 100, y: 0 }, data: outdoorTower },
      {
        id: 'panel_lab',
        type: 'transmission-tower',
        position: { x: 200, y: 0 },
        data: { ...labPanel, stepDownVoltage: null },
      },
      {
        id: 'sw_short',
        type: 'switch',
        position: { x: 300, y: 0 },
        data: { id: 'sw_short', type: 'switch', isOpen: false, label: 'Shorting Switch' },
      },
    ]);

    const updatedPanel = useCircuitStore.getState().nodes.find((n) => n.id === 'panel_lab');
    expect(updatedPanel?.data.isMcbTripped).toBe(true);
    expect(updatedPanel?.data.isMcbOn).toBe(false);
    // After auto-trip, fault current is safely interrupted!
    expect(useCircuitStore.getState().simulation.isShortCircuit).toBe(false);
  });
});
