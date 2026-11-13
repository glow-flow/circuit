import { describe, it, expect, beforeEach } from 'vitest';
import { useCircuitStore } from '../useCircuitStore';

describe('useCircuitStore - Physics X-Ray Lens & Touch Probe State', () => {
  beforeEach(() => {
    useCircuitStore.setState({
      nodes: [],
      edges: [],
      selectedNodeId: 'bat_1',
      selectedEdgeId: 'edge_1',
      worldMode: 'lab',
      physicsLensMode: 'normal',
      probeTargetA: null,
      probeTargetB: null,
      hoveredProbeTarget: null,
      isPickingProbeB: false,
    });
  });

  it('clears active node/edge popovers when activating Probe lens and resets on return to Normal', () => {
    const store = useCircuitStore.getState();
    store.setPhysicsLensMode('probe');

    expect(useCircuitStore.getState().physicsLensMode).toBe('probe');
    expect(useCircuitStore.getState().selectedNodeId).toBeNull();
    expect(useCircuitStore.getState().selectedEdgeId).toBeNull();

    store.selectProbeTarget({ kind: 'node', id: 'res_1' });
    expect(useCircuitStore.getState().probeTargetA).toEqual({ kind: 'node', id: 'res_1' });

    store.setPhysicsLensMode('normal');
    expect(useCircuitStore.getState().physicsLensMode).toBe('normal');
    expect(useCircuitStore.getState().probeTargetA).toBeNull();
    expect(useCircuitStore.getState().probeTargetB).toBeNull();
  });

  it('handles Dual-Probe A & B pinning without permitting duplicate identical targets', () => {
    const store = useCircuitStore.getState();
    store.setPhysicsLensMode('probe');

    // Cannot enter Probe B picking until Probe A exists
    store.setIsPickingProbeB(true);
    expect(useCircuitStore.getState().isPickingProbeB).toBe(false);

    store.selectProbeTarget({ kind: 'node', id: 'node_a' });
    store.setIsPickingProbeB(true);
    expect(useCircuitStore.getState().isPickingProbeB).toBe(true);

    // Selecting a distinct target sets Probe B and exits picking mode
    store.selectProbeTarget({ kind: 'wire', id: 'edge_b' });
    expect(useCircuitStore.getState().probeTargetB).toEqual({ kind: 'wire', id: 'edge_b' });
    expect(useCircuitStore.getState().isPickingProbeB).toBe(false);

    // Re-selecting edge_b as primary A prevents A === B self-comparison
    store.selectProbeTarget({ kind: 'wire', id: 'edge_b' });
    expect(useCircuitStore.getState().probeTargetA).toEqual({ kind: 'wire', id: 'edge_b' });
    expect(useCircuitStore.getState().probeTargetB).toBeNull();
  });

  it('clears transient probes when switching worlds or clearing canvas', () => {
    const store = useCircuitStore.getState();
    store.setPhysicsLensMode('probe');
    store.selectProbeTarget({ kind: 'node', id: 'bat_1' });
    store.setHoveredProbeTarget({ kind: 'wire', id: 'edge_1' });

    store.setWorldMode('outside');
    expect(useCircuitStore.getState().probeTargetA).toBeNull();
    expect(useCircuitStore.getState().hoveredProbeTarget).toBeNull();

    store.selectProbeTarget({ kind: 'node', id: 'solar_1' });
    store.clearCanvas();
    expect(useCircuitStore.getState().probeTargetA).toBeNull();
  });
});
