import { describe, it, expect } from 'vitest';
import {
  resolveWirePolarity,
  resolveEdgeBranchCurrent,
  resolveWireFlowDirection,
} from '../WireEdge';

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

  it('derives true conventional flow direction regardless of canvas wire draw order', () => {
    const branchCurrents = {
      bat_1: -0.5, // Discharging: leaves pos (+), returns into neg (-)
      res_1: 0.5,  // Passive drop: enters p1, exits p2
      bat_chg: 0.8, // Charging: enters pos (+)
      idle_r: 0,
    };

    // Standard order: bat_1(pos) -> res_1(p1) => forward
    expect(resolveWireFlowDirection('bat_1', 'res_1', 'pos', 'p1', branchCurrents)).toBe('forward');
    // Reversed user draw order: res_1(p1) -> bat_1(pos) => reverse so animation points bat_1 -> res_1
    expect(resolveWireFlowDirection('res_1', 'bat_1', 'p1', 'pos', branchCurrents)).toBe('reverse');
    // Charging battery drawn from battery(pos) -> solar(pos): current flows solar -> battery (reverse)
    expect(resolveWireFlowDirection('bat_chg', 'bat_1', 'pos', 'pos', branchCurrents)).toBe('reverse');
    // Return path drawn from bat_1(neg) -> res_1(p2): current leaves res_1(p2) -> bat_1(neg) (reverse)
    expect(resolveWireFlowDirection('bat_1', 'res_1', 'neg', 'p2', branchCurrents)).toBe('reverse');
    // Zero-current branch reports 'none'
    expect(resolveWireFlowDirection('idle_r', 'wp_2', 'p1', 'p2', branchCurrents)).toBe('none');
  });
});
