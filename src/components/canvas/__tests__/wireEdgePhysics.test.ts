import { describe, it, expect } from 'vitest';
import { resolveWirePolarity, resolveEdgeBranchCurrent } from '../WireEdge';

describe('Advanced Wire Edge Physics & Polarity Analysis', () => {
  it('correctly classifies wire polarity based on pin terminals', () => {
    // Positive supply terminals
    expect(resolveWirePolarity('pos', 'p1')).toBe('positive');
    expect(resolveWirePolarity('p2', 'pos')).toBe('positive');

    // Negative/ground return terminals
    expect(resolveWirePolarity('neg', 'p1')).toBe('negative');
    expect(resolveWirePolarity('p1', 'gnd')).toBe('negative');

    // Neutral / internal series bridge
    expect(resolveWirePolarity('p1', 'p2')).toBe('neutral');
    expect(resolveWirePolarity(null, undefined)).toBe('neutral');
  });

  it('correctly resolves branch currents through direct components and waypoints', () => {
    const branchCurrents = {
      bat_1: 0.25,
      sw_1: 0.25,
      bulb_zone1: 0.15,
      bulb_zone2: 0.10,
      wp_1: 0,
    };

    // Series connection between two non-waypoint components
    expect(resolveEdgeBranchCurrent('bat_1', 'sw_1', branchCurrents)).toBe(0.25);

    // Multi-zone split (Resistor to Bulb)
    expect(resolveEdgeBranchCurrent('bat_1', 'bulb_zone1', branchCurrents)).toBe(0.15);

    // Waypoint bridge carrying through current
    expect(resolveEdgeBranchCurrent('wp_1', 'bulb_zone1', branchCurrents)).toBe(0.15);
    expect(resolveEdgeBranchCurrent('bulb_zone2', 'wp_1', branchCurrents)).toBe(0.10);
  });
});
