import { describe, it, expect, beforeEach } from 'vitest';
import { useCircuitStore } from '../useCircuitStore';

describe('useCircuitStore.addComponent (variant chosen in palette)', () => {
  beforeEach(() => {
    useCircuitStore.setState({ nodes: [], edges: [], language: 'id' });
  });

  it('places the exact bulb model picked in the palette with its resistance and rating', () => {
    useCircuitStore.getState().addComponent('bulb', { x: 0, y: 0 }, { bulbType: 'halogen' });
    const [placedNode] = useCircuitStore.getState().nodes;

    expect(placedNode.data.bulbType).toBe('halogen');
    expect(placedNode.data.resistance).toBe(1500);
    expect(placedNode.data.powerRating).toBe(50);
    expect(placedNode.data.label).toBe('Lampu Halogen');
  });

  it('falls back to the incandescent bulb when no option is given', () => {
    useCircuitStore.getState().addComponent('bulb', { x: 0, y: 0 });
    const [placedNode] = useCircuitStore.getState().nodes;

    expect(placedNode.data.bulbType).toBe('incandescent');
    expect(placedNode.data.resistance).toBe(800);
  });

  it('keeps non-bulb parts unaffected by placement options', () => {
    useCircuitStore.getState().addComponent('battery9v', { x: 0, y: 0 }, { bulbType: 'led_rgb' });
    const [placedNode] = useCircuitStore.getState().nodes;

    expect(placedNode.data.voltage).toBe(9.0);
    expect(placedNode.data.bulbType).toBeUndefined();
  });
});
