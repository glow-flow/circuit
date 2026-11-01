import { describe, it, expect } from 'vitest';
import { MISSION_CATALOG } from '../missionCatalog';
import { MissionContext } from '../../types/missions';

describe('Mission & Challenge Mode Validation Engine', () => {
  it('contains all 5 mandatory curriculum challenges', () => {
    expect(MISSION_CATALOG).toHaveLength(5);
    const ids = MISSION_CATALOG.map((m) => m.id);
    expect(ids).toContain('parallel-3-bulbs');
    expect(ids).toContain('resolve-short-circuit');
    expect(ids).toContain('repair-reversed-led');
    expect(ids).toContain('solar-grid-connection');
    expect(ids).toContain('energy-efficiency-challenge');
  });

  it('validates Mission 1 (3 Parallel Bulbs) based on topological voltages and currents', () => {
    const mission = MISSION_CATALOG.find((m) => m.id === 'parallel-3-bulbs')!;

    // Scenario A: Incomplete circuit (only 1 bulb)
    const incompleteContext: MissionContext = {
      nodes: [
        { id: 'b1', type: 'battery', position: { x: 0, y: 0 }, data: { id: 'b1', type: 'battery', voltage: 3.0, label: 'Baterai' } },
        { id: 's1', type: 'socket', position: { x: 100, y: 0 }, data: { id: 's1', type: 'socket', label: 'Lampu 1', installedBulb: 'incandescent', calculatedVoltage: 3.0 } },
      ],
      edges: [],
      simulation: {
        nodeVoltages: {},
        branchCurrents: { s1: 0.05 },
        isShortCircuit: false,
        shortCircuitBranches: [],
        totalPowerDrawn: 0.15,
        timestamp: Date.now(),
      },
    };
    const incompleteRes = mission.validate(incompleteContext);
    expect(incompleteRes.isCompleted).toBe(false);

    // Scenario B: Valid 3 Parallel Bulbs circuit
    const validContext: MissionContext = {
      nodes: [
        { id: 'b1', type: 'battery', position: { x: 0, y: 0 }, data: { id: 'b1', type: 'battery', voltage: 3.0, label: 'Baterai' } },
        { id: 's1', type: 'socket', position: { x: 100, y: 0 }, data: { id: 's1', type: 'socket', label: 'Lampu 1', installedBulb: 'incandescent', calculatedVoltage: 3.0 } },
        { id: 's2', type: 'socket', position: { x: 100, y: 50 }, data: { id: 's2', type: 'socket', label: 'Lampu 2', installedBulb: 'incandescent', calculatedVoltage: 3.0 } },
        { id: 's3', type: 'socket', position: { x: 100, y: 100 }, data: { id: 's3', type: 'socket', label: 'Lampu 3', installedBulb: 'incandescent', calculatedVoltage: 3.0 } },
      ],
      edges: [],
      simulation: {
        nodeVoltages: {},
        branchCurrents: { s1: 0.05, s2: 0.05, s3: 0.05 },
        isShortCircuit: false,
        shortCircuitBranches: [],
        totalPowerDrawn: 0.45,
        timestamp: Date.now(),
      },
    };
    const validRes = mission.validate(validContext);
    expect(validRes.isCompleted).toBe(true);
    expect(validRes.progressPercent).toBe(100);
  });

  it('validates Mission 2 (Short Circuit Detective) fails when shorted and passes when resolved', () => {
    const mission = MISSION_CATALOG.find((m) => m.id === 'resolve-short-circuit')!;

    // Shorted state
    const shortedContext: MissionContext = {
      nodes: [
        { id: 's1', type: 'socket', position: { x: 100, y: 0 }, data: { id: 's1', type: 'socket', label: 'Lampu 1' } },
      ],
      edges: [],
      simulation: {
        nodeVoltages: {},
        branchCurrents: {},
        isShortCircuit: true,
        shortCircuitBranches: ['sw_short'],
        totalPowerDrawn: 50,
        timestamp: Date.now(),
      },
    };
    expect(mission.validate(shortedContext).isCompleted).toBe(false);

    // Resolved state
    const resolvedContext: MissionContext = {
      nodes: [
        { id: 's1', type: 'socket', position: { x: 100, y: 0 }, data: { id: 's1', type: 'socket', label: 'Lampu 1' } },
      ],
      edges: [],
      simulation: {
        nodeVoltages: {},
        branchCurrents: { s1: 0.04 },
        isShortCircuit: false,
        shortCircuitBranches: [],
        totalPowerDrawn: 0.36,
        timestamp: Date.now(),
      },
    };
    expect(mission.validate(resolvedContext).isCompleted).toBe(true);
  });

  it('validates Mission 5 (Energy Efficiency) rejects power > 5W and accepts efficient LEDs', () => {
    const mission = MISSION_CATALOG.find((m) => m.id === 'energy-efficiency-challenge')!;

    // Scenario A: Over 5W power limit (using incandescent)
    const overPowerContext: MissionContext = {
      nodes: [
        { id: 's1', type: 'socket', position: { x: 0, y: 0 }, data: { id: 's1', type: 'socket', label: 'L1', installedBulb: 'incandescent' } },
        { id: 's2', type: 'socket', position: { x: 0, y: 50 }, data: { id: 's2', type: 'socket', label: 'L2', installedBulb: 'incandescent' } },
      ],
      edges: [],
      simulation: {
        nodeVoltages: {},
        branchCurrents: { s1: 0.1, s2: 0.1 },
        isShortCircuit: false,
        shortCircuitBranches: [],
        totalPowerDrawn: 40.0, // > 5W
        timestamp: Date.now(),
      },
    };
    expect(mission.validate(overPowerContext).isCompleted).toBe(false);

    // Scenario B: High-efficiency LED under 5W
    const efficientContext: MissionContext = {
      nodes: [
        { id: 's1', type: 'socket', position: { x: 0, y: 0 }, data: { id: 's1', type: 'socket', label: 'L1', installedBulb: 'led_standard' } },
        { id: 's2', type: 'socket', position: { x: 0, y: 50 }, data: { id: 's2', type: 'socket', label: 'L2', installedBulb: 'led_rgb' } },
      ],
      edges: [],
      simulation: {
        nodeVoltages: {},
        branchCurrents: { s1: 0.02, s2: 0.02 },
        isShortCircuit: false,
        shortCircuitBranches: [],
        totalPowerDrawn: 0.6, // < 5W
        timestamp: Date.now(),
      },
    };
    const result = mission.validate(efficientContext);
    expect(result.isCompleted).toBe(true);
    expect(result.progressPercent).toBe(100);
  });

  it('validates Mission 3 (LED Reverse Polarity) detects reverse bias and accepts forward bias', () => {
    const mission = MISSION_CATALOG.find((m) => m.id === 'repair-reversed-led')!;

    // Scenario A: Reverse biased LED
    const reversedContext: MissionContext = {
      nodes: [
        {
          id: 'led_1',
          type: 'pin-socket',
          position: { x: 0, y: 0 },
          data: { id: 'led_1', type: 'pin-socket', label: 'LED S', installedBulb: 'led_standard' },
        },
      ],
      edges: [],
      simulation: {
        nodeVoltages: {},
        branchCurrents: { led_1: 0 },
        isShortCircuit: false,
        shortCircuitBranches: [],
        reverseBiasedBranches: ['led_1'],
        totalPowerDrawn: 0,
        timestamp: Date.now(),
      },
    };
    expect(mission.validate(reversedContext).isCompleted).toBe(false);

    // Scenario B: Forward biased lit LED
    const forwardContext: MissionContext = {
      nodes: [
        {
          id: 'led_1',
          type: 'pin-socket',
          position: { x: 0, y: 0 },
          data: { id: 'led_1', type: 'pin-socket', label: 'LED S', installedBulb: 'led_standard' },
        },
      ],
      edges: [],
      simulation: {
        nodeVoltages: {},
        branchCurrents: { led_1: 0.02 },
        isShortCircuit: false,
        shortCircuitBranches: [],
        reverseBiasedBranches: [],
        totalPowerDrawn: 0.06,
        timestamp: Date.now(),
      },
    };
    const forwardRes = mission.validate(forwardContext);
    expect(forwardRes.isCompleted).toBe(true);
    expect(forwardRes.progressPercent).toBe(100);
  });

  it('validates Mission 4 (Solar PV Grid) requires solar generator, active MCB, and flowing current', () => {
    const mission = MISSION_CATALOG.find((m) => m.id === 'solar-grid-connection')!;

    // Scenario A: MCB tripped
    const trippedContext: MissionContext = {
      nodes: [
        {
          id: 'solar_1',
          type: 'solar-panel',
          position: { x: 0, y: 0 },
          data: { id: 'solar_1', type: 'solar-panel', label: 'Solar' },
        },
        {
          id: 'mcb_1',
          type: 'transmission-tower',
          position: { x: 100, y: 0 },
          data: { id: 'mcb_1', type: 'transmission-tower', label: 'Tower', isMcbTripped: true },
        },
      ],
      edges: [],
      simulation: {
        nodeVoltages: {},
        branchCurrents: {},
        isShortCircuit: false,
        shortCircuitBranches: [],
        totalPowerDrawn: 0,
        timestamp: Date.now(),
      },
    };
    expect(mission.validate(trippedContext).isCompleted).toBe(false);

    // Scenario B: Active solar microgrid
    const activeContext: MissionContext = {
      nodes: [
        {
          id: 'solar_1',
          type: 'solar-panel',
          position: { x: 0, y: 0 },
          data: { id: 'solar_1', type: 'solar-panel', label: 'Solar' },
        },
        {
          id: 'mcb_1',
          type: 'transmission-tower',
          position: { x: 100, y: 0 },
          data: { id: 'mcb_1', type: 'transmission-tower', label: 'Tower', isMcbOn: true, isMcbTripped: false },
        },
      ],
      edges: [],
      simulation: {
        nodeVoltages: {},
        branchCurrents: { solar_1: 0.05 },
        isShortCircuit: false,
        shortCircuitBranches: [],
        totalPowerDrawn: 0.6,
        timestamp: Date.now(),
      },
    };
    const activeRes = mission.validate(activeContext);
    expect(activeRes.isCompleted).toBe(true);
    expect(activeRes.progressPercent).toBe(100);
  });
});
