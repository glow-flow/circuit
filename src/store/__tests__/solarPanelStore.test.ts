import { describe, it, expect, beforeEach } from 'vitest';
import { useCircuitStore } from '../useCircuitStore';

describe('useCircuitStore - Environment & Solar Panel Integration', () => {
  beforeEach(() => {
    useCircuitStore.getState().clearCanvas();
    useCircuitStore.getState().setEnvironment('lab');
  });

  it('initializes default environment as lab (0V for solar panel)', () => {
    expect(useCircuitStore.getState().environment).toBe('lab');

    useCircuitStore.getState().addComponent('solar-panel', { x: 0, y: 0 });
    const solarNode = useCircuitStore.getState().nodes.find((n) => n.data.type === 'solar-panel');

    expect(solarNode).toBeDefined();
    expect(solarNode?.data.voltage).toBe(0.0);
    expect(solarNode?.data.environment).toBe('lab');
  });

  it('cycles environment correctly: lab -> sunny -> cloudy -> lab', () => {
    const store = useCircuitStore.getState();
    expect(store.environment).toBe('lab');

    store.cycleEnvironment();
    expect(useCircuitStore.getState().environment).toBe('sunny');

    store.cycleEnvironment();
    expect(useCircuitStore.getState().environment).toBe('cloudy');

    store.cycleEnvironment();
    expect(useCircuitStore.getState().environment).toBe('lab');
  });

  it('dynamically updates solar panel voltage in MNA solver when environment changes', () => {
    const store = useCircuitStore.getState();
    store.addComponent('solar-panel', { x: 0, y: 0 });
    store.addComponent('resistor', { x: 200, y: 0 });

    const nodes = useCircuitStore.getState().nodes;
    const solar = nodes.find((n) => n.data.type === 'solar-panel')!;
    const res = nodes.find((n) => n.data.type === 'resistor')!;

    store.onConnect({
      source: solar.id,
      sourceHandle: 'pos',
      target: res.id,
      targetHandle: 'p1',
    });
    store.onConnect({
      source: res.id,
      sourceHandle: 'p2',
      target: solar.id,
      targetHandle: 'neg',
    });

    // In lab mode: 0V, 0A
    expect(Math.abs(useCircuitStore.getState().simulation.branchCurrents[solar.id] ?? 0)).toBe(0);

    // Switch to sunny: 12V output -> I ~ 12V / 100.2Ω ~ 0.1198A
    store.setEnvironment('sunny');
    const sunnySolar = useCircuitStore.getState().nodes.find((n) => n.id === solar.id)!;
    expect(sunnySolar.data.voltage).toBe(12.0);
    const sunnyCurrent = Math.abs(useCircuitStore.getState().simulation.branchCurrents[solar.id] ?? 0);
    expect(sunnyCurrent).toBeCloseTo(0.1198, 2);

    // Switch to cloudy: 5V output -> I ~ 5V / 100.2Ω ~ 0.0499A
    store.setEnvironment('cloudy');
    const cloudySolar = useCircuitStore.getState().nodes.find((n) => n.id === solar.id)!;
    expect(cloudySolar.data.voltage).toBe(5.0);
    const cloudyCurrent = Math.abs(useCircuitStore.getState().simulation.branchCurrents[solar.id] ?? 0);
    expect(cloudyCurrent).toBeCloseTo(0.0499, 2);
  });
});
