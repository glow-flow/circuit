import { describe, expect, it } from 'vitest';
import { computeResistorColorBands } from '../resistorColorCode';

describe('computeResistorColorBands (IEC 60062 4-band)', () => {
  const bandIds = (ohms: number) => computeResistorColorBands(ohms).map((b) => b.colorId);

  it('computes accurate 4-band color codes for common lab resistor values', () => {
    expect(bandIds(10)).toEqual(['brown', 'black', 'black', 'gold']);
    expect(bandIds(100)).toEqual(['brown', 'black', 'brown', 'gold']);
    expect(bandIds(220)).toEqual(['red', 'red', 'brown', 'gold']);
    expect(bandIds(470)).toEqual(['yellow', 'violet', 'brown', 'gold']);
    expect(bandIds(1000)).toEqual(['brown', 'black', 'red', 'gold']);
    expect(bandIds(4700)).toEqual(['yellow', 'violet', 'red', 'gold']);
    expect(bandIds(10_000)).toEqual(['brown', 'black', 'orange', 'gold']);
    expect(bandIds(1_000_000)).toEqual(['brown', 'black', 'green', 'gold']);
  });

  it('handles sub-10 ohm resistors with gold and silver multipliers', () => {
    expect(bandIds(4.7)).toEqual(['yellow', 'violet', 'gold', 'gold']);
    expect(bandIds(0.47)).toEqual(['yellow', 'violet', 'silver', 'gold']);
  });

  it('falls back safely on zero, negative, or non-finite values', () => {
    expect(bandIds(0)).toEqual(['black', 'black', 'black', 'gold']);
    expect(bandIds(-50)).toEqual(['black', 'black', 'black', 'gold']);
    expect(bandIds(Number.NaN)).toEqual(['black', 'black', 'black', 'gold']);
  });
});
