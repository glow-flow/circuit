import { beforeEach, describe, expect, it } from 'vitest';
import {
  detectShortCircuitZeroVoltState,
  getBatteryInternalPhysicsParams,
} from '../shortCircuitZeroVoltAdvisor';
import { useCircuitStore } from '../../store/useCircuitStore';

describe('Short-Circuit 0V Battery Diagnostic Advisor (shortCircuitZeroVoltAdvisor)', () => {
  beforeEach(() => {
    useCircuitStore.getState().loadPreset('short-circuit-demo');
    useCircuitStore.getState().setWorldMode('lab');
  });

  it('does not trigger when the short-circuit switch is still OPEN (OFF)', () => {
    const state = useCircuitStore.getState();
    const advisory = detectShortCircuitZeroVoltState(
      state.nodes,
      state.edges,
      state.simulation,
      state.worldMode,
      'id'
    );

    expect(advisory.isTriggered).toBe(false);
    const batteryNode = state.nodes.find((n) => n.data.type === 'battery-holder');
    expect(batteryNode?.data.calculatedVoltage).toBeCloseTo(3.0, 2);
  });

  it('immediately drops battery calculatedVoltage to 0V and triggers the bottom-right popup when the short-circuit switch is turned ON', () => {
    const initialState = useCircuitStore.getState();
    const switchNode = initialState.nodes.find((n) => n.data.type === 'switch');
    expect(switchNode).toBeDefined();

    // Close the switch to trigger the short circuit
    useCircuitStore.getState().toggleSwitch(switchNode!.id);

    const activeState = useCircuitStore.getState();
    const shortedBattery = activeState.nodes.find(
      (n) => n.data.type === 'battery-holder'
    );
    expect(shortedBattery?.data.isShortCircuit).toBe(true);
    expect(shortedBattery?.data.calculatedVoltage).toBe(0);

    const advisoryId = detectShortCircuitZeroVoltState(
      activeState.nodes,
      activeState.edges,
      activeState.simulation,
      activeState.worldMode,
      'id'
    );

    expect(advisoryId.isTriggered).toBe(true);
    expect(advisoryId.reason).toBe('active-short-circuit');
    expect(advisoryId.nominalEmfVolts).toBeCloseTo(3.0, 2);
    expect(advisoryId.terminalVoltageVolts).toBe(0);
    expect(advisoryId.internalResistanceOhms).toBeCloseTo(0.3, 2);
    expect(advisoryId.peakShortCurrentAmps).toBeCloseTo(10.0, 1);
    expect(advisoryId.internalHeatWatts).toBeCloseTo(30.0, 1);
    expect(advisoryId.teaserPrompt).toBe(
      'Baterai mu jadi 0V tuh, pengen tahu? Klik aku!'
    );

    const advisoryEn = detectShortCircuitZeroVoltState(
      activeState.nodes,
      activeState.edges,
      activeState.simulation,
      activeState.worldMode,
      'en'
    );
    expect(advisoryEn.teaserPrompt).toContain('0V');
  });

  it('keeps the 0V advisory active when the battery chemical charge depletes to 0% in a closed circuit', () => {
    const state = useCircuitStore.getState();
    const switchNode = state.nodes.find((n) => n.data.type === 'switch');
    useCircuitStore.getState().toggleSwitch(switchNode!.id);

    // Advance battery physics so the battery drains to 0%
    useCircuitStore.getState().tickBatteryCharge(10);

    const drainedState = useCircuitStore.getState();
    const drainedBattery = drainedState.nodes.find(
      (n) => n.data.type === 'battery-holder'
    );
    expect(drainedBattery?.data.currentCharge).toBe(0);
    expect(drainedBattery?.data.calculatedVoltage).toBe(0);

    const advisory = detectShortCircuitZeroVoltState(
      drainedState.nodes,
      drainedState.edges,
      drainedState.simulation,
      drainedState.worldMode,
      'id'
    );
    expect(advisory.isTriggered).toBe(true);
    expect(advisory.batteryChargePercent).toBe(0);
  });

  it('computes accurate internal resistance parameters for 9V and single-cell AA batteries', () => {
    const params9V = getBatteryInternalPhysicsParams({
      id: 'bat9v_1',
      type: 'battery9v',
      label: '9V',
      voltage: 9,
    });
    expect(params9V.nominalEmfVolts).toBe(9);
    expect(params9V.internalResistanceOhms).toBe(1.5);

    const paramsSingleAA = getBatteryInternalPhysicsParams({
      id: 'bat_aa_1',
      type: 'battery',
      label: 'AA',
      voltage: 1.5,
    });
    expect(paramsSingleAA.nominalEmfVolts).toBe(1.5);
    expect(paramsSingleAA.internalResistanceOhms).toBe(0.15);
  });

  it('handles edge cases safely (Outdoor mode, empty arrays, normal loaded circuits)', () => {
    useCircuitStore.getState().loadPreset('simple-lamp');
    const safeState = useCircuitStore.getState();

    // Normal lamp circuit should NOT trigger the 0V short-circuit advisor
    expect(
      detectShortCircuitZeroVoltState(
        safeState.nodes,
        safeState.edges,
        safeState.simulation,
        'lab',
        'id'
      ).isTriggered
    ).toBe(false);

    // Outdoor mode should never trigger the Lab battery 0V advisor
    expect(
      detectShortCircuitZeroVoltState(
        safeState.nodes,
        safeState.edges,
        safeState.simulation,
        'outside',
        'id'
      ).isTriggered
    ).toBe(false);

    // Empty arrays should return false without throwing
    expect(
      detectShortCircuitZeroVoltState([], [], null, 'lab', 'id').isTriggered
    ).toBe(false);
  });
});
