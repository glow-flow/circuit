import { describe, it, expect } from 'vitest';
import {
  PinSocketNode,
  PIN_SOCKET_NODE_SIZE,
  PIN_SOCKET_TERMINALS,
  HALOGEN_BULB_TOP_OFFSET,
  PIN_SOCKET_FRONT_LIP_CLIP_PATH,
} from '../PinSocketNode';

describe('PinSocketNode Architecture & Geometry', () => {
  it('exports PinSocketNode React component', () => {
    expect(PinSocketNode).toBeDefined();
    expect(typeof PinSocketNode).toBe('function');
  });

  it('defines calibrated dimensions matching ceramic bi-pin socket asset', () => {
    expect(PIN_SOCKET_NODE_SIZE.width).toBe(38);
    expect(PIN_SOCKET_NODE_SIZE.height).toBe(58);
  });

  it('positions bottom terminal handles p1 and p2 directly on copper contact tabs', () => {
    expect(PIN_SOCKET_TERMINALS.p1).toBe('28%');
    expect(PIN_SOCKET_TERMINALS.p2).toBe('72%');
  });

  it('calibrates halogen bulb vertical top offset so contact pins penetrate down into ceramic slots', () => {
    // Halogen bulb height is 112px; at -98px top offset, the bottom 14px metal pins penetrate into socket mouth
    expect(HALOGEN_BULB_TOP_OFFSET).toBe(-98);
  });

  it('defines polygon clip-path for front ceramic socket lip overlay (Layer 3)', () => {
    expect(PIN_SOCKET_FRONT_LIP_CLIP_PATH).toContain('polygon');
    expect(PIN_SOCKET_FRONT_LIP_CLIP_PATH).toContain('100% 100%');
    expect(PIN_SOCKET_FRONT_LIP_CLIP_PATH).toContain('0% 100%');
  });
});
