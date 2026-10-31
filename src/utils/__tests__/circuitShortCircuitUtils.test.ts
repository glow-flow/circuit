import { describe, it, expect } from 'vitest';
import { Edge } from 'reactflow';
import {
  checkPanelDirectShort,
  getShortCircuitGuidance,
} from '../circuitShortCircuitUtils';

describe('circuitShortCircuitUtils', () => {
  it('returns not shorted when edges array is empty', () => {
    const result = checkPanelDirectShort('panel_1', []);
    expect(result.isShorted).toBe(false);
    expect(result.shortType).toBe('none');
  });

  it('detects dead short when (+) and (-) wires are connected to the SAME pin on another node (user screenshot scenario)', () => {
    const mockEdges: Edge[] = [
      {
        id: 'wire_pos',
        source: 'panel_dist',
        sourceHandle: 'pos',
        target: 'bat_aa_1',
        targetHandle: 'pos',
      },
      {
        id: 'wire_neg',
        source: 'panel_dist',
        sourceHandle: 'neg',
        target: 'bat_aa_1',
        targetHandle: 'pos', // Same target and handle!
      },
    ];

    const result = checkPanelDirectShort('panel_dist', mockEdges);
    expect(result.isShorted).toBe(true);
    expect(result.shortType).toBe('same-pin');
    expect(result.commonPinId).toBe('bat_aa_1:pos');

    const messageId = getShortCircuitGuidance(result, true);
    expect(messageId).toContain('titik yang sama');

    const messageEn = getShortCircuitGuidance(result, false);
    expect(messageEn).toContain('same pin');
  });

  it('detects loopback short circuit where pos is wired directly to neg on the same panel', () => {
    const mockEdges: Edge[] = [
      {
        id: 'wire_self_loop',
        source: 'panel_dist',
        sourceHandle: 'pos',
        target: 'panel_dist',
        targetHandle: 'neg',
      },
    ];

    const result = checkPanelDirectShort('panel_dist', mockEdges);
    expect(result.isShorted).toBe(true);
    expect(result.shortType).toBe('loopback');

    const messageId = getShortCircuitGuidance(result, true);
    expect(messageId).toContain('saling terhubung langsung');
  });

  it('correctly reports no direct short when pos and neg connect to different pins across a load', () => {
    const mockEdges: Edge[] = [
      {
        id: 'wire_pos',
        source: 'panel_dist',
        sourceHandle: 'pos',
        target: 'resistor_1',
        targetHandle: 'p1',
      },
      {
        id: 'wire_neg',
        source: 'panel_dist',
        sourceHandle: 'neg',
        target: 'bulb_socket_1',
        targetHandle: 'neg',
      },
    ];

    const result = checkPanelDirectShort('panel_dist', mockEdges);
    expect(result.isShorted).toBe(false);
    expect(result.shortType).toBe('none');
  });

  it('handles reverse edge orientation (target is panel, source is component)', () => {
    const mockEdges: Edge[] = [
      {
        id: 'wire_pos',
        source: 'bat_aa_1',
        sourceHandle: 'pos',
        target: 'panel_dist',
        targetHandle: 'pos',
      },
      {
        id: 'wire_neg',
        source: 'bat_aa_1',
        sourceHandle: 'pos',
        target: 'panel_dist',
        targetHandle: 'neg',
      },
    ];

    const result = checkPanelDirectShort('panel_dist', mockEdges);
    expect(result.isShorted).toBe(true);
    expect(result.shortType).toBe('same-pin');
  });
});
