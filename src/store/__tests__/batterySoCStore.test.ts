import { describe, it, expect, beforeEach } from 'vitest';
import { useCircuitStore } from '../useCircuitStore';

describe('useCircuitStore - Battery State of Charge (SoC)', () => {
  beforeEach(() => {
    useCircuitStore.getState().clearCanvas();
  });

  it('initializes 1.5V AA Battery with full 100% charge and 1000 mAh capacity', () => {
    useCircuitStore.getState().addComponent('battery', { x: 0, y: 0 });
    const nodes = useCircuitStore.getState().nodes;
    const batteryNode = nodes.find((n) => n.data.type === 'battery');

    expect(batteryNode).toBeDefined();
    expect(batteryNode?.data.currentCharge).toBe(100);
    expect(batteryNode?.data.capacity).toBe(1000);
    expect(batteryNode?.data.chargeState).toBe('idle');
  });

  it('initializes 9V Alkaline Battery with full 100% charge and 500 mAh capacity', () => {
    useCircuitStore.getState().addComponent('battery9v', { x: 100, y: 0 });
    const nodes = useCircuitStore.getState().nodes;
    const battery9vNode = nodes.find((n) => n.data.type === 'battery9v');

    expect(battery9vNode).toBeDefined();
    expect(battery9vNode?.data.currentCharge).toBe(100);
    expect(battery9vNode?.data.capacity).toBe(500);
    expect(battery9vNode?.data.chargeState).toBe('idle');
  });

  it('discharges battery when powering a resistor load and updates SoC via tickBatteryCharge', () => {
    const store = useCircuitStore.getState();
    store.addComponent('battery9v', { x: 0, y: 0 });
    store.addComponent('resistor', { x: 200, y: 0 });

    const currentNodes = useCircuitStore.getState().nodes;
    const bat = currentNodes.find((n) => n.data.type === 'battery9v')!;
    const res = currentNodes.find((n) => n.data.type === 'resistor')!;

    // Wire battery9v to resistor
    useCircuitStore.getState().onConnect({
      source: bat.id,
      sourceHandle: 'pos',
      target: res.id,
      targetHandle: 'p1',
    });
    useCircuitStore.getState().onConnect({
      source: res.id,
      sourceHandle: 'p2',
      target: bat.id,
      targetHandle: 'neg',
    });

    const activeNodes = useCircuitStore.getState().nodes;
    const activeBat = activeNodes.find((n) => n.id === bat.id)!;

    // Battery should be actively discharging into the resistor
    expect(activeBat.data.chargeState).toBe('discharging');
    expect(activeBat.data.calculatedCurrent).toBeLessThan(0); // MNA negative sign = delivering current

    // Advance battery simulation by 10 ticks
    useCircuitStore.getState().tickBatteryCharge(10);

    const postTickNodes = useCircuitStore.getState().nodes;
    const postTickBat = postTickNodes.find((n) => n.id === bat.id)!;
    expect(postTickBat.data.currentCharge).toBeLessThan(100);
  });

  it('restores charge to 100% when rechargeBattery is triggered', () => {
    const store = useCircuitStore.getState();
    store.addComponent('battery', { x: 0, y: 0 });

    const bat = useCircuitStore.getState().nodes.find((n) => n.data.type === 'battery')!;
    // Set low charge manually
    store.updateComponentData(bat.id, { currentCharge: 15 });

    expect(useCircuitStore.getState().nodes.find((n) => n.id === bat.id)?.data.currentCharge).toBe(15);

    // Recharge battery
    store.rechargeBattery(bat.id);

    const rechargedBat = useCircuitStore.getState().nodes.find((n) => n.id === bat.id)!;
    expect(rechargedBat.data.currentCharge).toBe(100);
  });

  it('applies voltage sag when battery charge drops below 20% and outputs 0V when dead (0%) without crashing solver', () => {
    const store = useCircuitStore.getState();
    store.addComponent('battery9v', { x: 0, y: 0 });
    store.addComponent('resistor', { x: 200, y: 0 });

    const nodes = useCircuitStore.getState().nodes;
    const bat = nodes.find((n) => n.data.type === 'battery9v')!;
    const res = nodes.find((n) => n.data.type === 'resistor')!;

    store.onConnect({
      source: bat.id,
      sourceHandle: 'pos',
      target: res.id,
      targetHandle: 'p1',
    });
    store.onConnect({
      source: res.id,
      sourceHandle: 'p2',
      target: bat.id,
      targetHandle: 'neg',
    });

    // 100% charge current: I ~ 9V / 102Ω ~ 0.088A
    const currentAtFull = Math.abs(useCircuitStore.getState().simulation.branchCurrents[bat.id] ?? 0);
    expect(currentAtFull).toBeCloseTo(0.088, 2);

    // Drop charge to 10% (half of 20% threshold): voltage sags to 4.5V, current should halve
    store.updateComponentData(bat.id, { currentCharge: 10 });
    const currentAtSag = Math.abs(useCircuitStore.getState().simulation.branchCurrents[bat.id] ?? 0);
    expect(currentAtSag).toBeCloseTo(currentAtFull / 2, 2);

    // Drop charge to 0% (dead): voltage drops to 0V, current drops to 0A, solver remains stable
    store.updateComponentData(bat.id, { currentCharge: 0 });
    const simulationResult = useCircuitStore.getState().simulation;
    const currentAtDead = Math.abs(simulationResult.branchCurrents[bat.id] ?? 0);
    expect(currentAtDead).toBe(0);
    expect(simulationResult.errorMessage).toBeUndefined();
  });

  it('preserves series capacity invariance (1000 mAh) and individual cell SoC on holder insert/eject', () => {
    const store = useCircuitStore.getState();
    store.addComponent('battery-holder', { x: 0, y: 0 });
    store.addComponent('battery', { x: 180, y: 0 });
    store.addComponent('battery', { x: 320, y: 0 });

    const initialNodes = useCircuitStore.getState().nodes;
    const holder = initialNodes.find((n) => n.data.type === 'battery-holder')!;
    const batteries = initialNodes.filter((n) => n.data.type === 'battery');
    expect(holder.data.capacity).toBe(0);

    // Discharge Cell A to 45% and leave Cell B at 90%
    store.updateComponentData(batteries[0].id, { currentCharge: 45 });
    store.updateComponentData(batteries[1].id, { currentCharge: 90 });

    // Insert Cell A (45%) and Cell B (90%) in series
    store.insertBatteryIntoHolder(batteries[0].id, holder.id);
    store.insertBatteryIntoHolder(batteries[1].id, holder.id);

    const loadedHolder = useCircuitStore
      .getState()
      .nodes.find((n) => n.id === holder.id)!;
    expect(loadedHolder.data.batteryCount).toBe(2);
    expect(loadedHolder.data.voltage).toBeCloseTo(3.0, 2);
    expect(loadedHolder.data.capacity).toBe(1000);
    expect(loadedHolder.data.cellCharges).toEqual([45, 90]);
    expect(loadedHolder.data.currentCharge).toBe(45);

    // Eject Slot 2: must restore Cell B's exact 90% SoC, leaving Cell A at 45%
    store.ejectBatteryFromHolder(holder.id);
    const afterFirstEject = useCircuitStore.getState().nodes;
    const ejectedB = afterFirstEject.find((n) => n.data.type === 'battery')!;
    const halfHolder = afterFirstEject.find((n) => n.id === holder.id)!;
    expect(ejectedB.data.currentCharge).toBe(90);
    expect(halfHolder.data.batteryCount).toBe(1);
    expect(halfHolder.data.cellCharges).toEqual([45]);
    expect(halfHolder.data.currentCharge).toBe(45);
    expect(halfHolder.data.capacity).toBe(1000);
  });
});
