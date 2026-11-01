import { describe, it, expect } from 'vitest';
import {
  normalizeLatexFormula,
  formatFractionText,
  formatSubscriptsAndSuperscripts,
  formatPhysicsFormulaToReadableText,
} from '../mathFormatter';

describe('Physics Math Formatter & Typography Engine', () => {
  it('handles empty and null inputs safely', () => {
    expect(formatPhysicsFormulaToReadableText('')).toBe('');
    // @ts-expect-error test invalid input resilience
    expect(formatPhysicsFormulaToReadableText(null)).toBe('');
    // @ts-expect-error test undefined input resilience
    expect(formatPhysicsFormulaToReadableText(undefined)).toBe('');
  });

  it('normalizes common electrical LaTeX symbols (Omega, times, approx, text)', () => {
    const raw = 'I = \\frac{4.5V}{1600\\Omega} = 0.003\\text{ A}';
    const normalized = normalizeLatexFormula(raw);
    expect(normalized).not.toContain('\\Omega');
    expect(normalized).not.toContain('\\text');
    expect(normalized).toContain('Ω');
    expect(normalized).toContain('A');
  });

  it('converts LaTeX fraction syntax into clean readable fraction text', () => {
    const raw = '\\frac{4.5V}{1600\\Omega}';
    const formatted = formatFractionText(raw);
    expect(formatted).toBe('4.5V / 1600\\Omega');
  });

  it('transforms subscript and superscript exponents cleanly', () => {
    const raw = 'P_{baru} = I^2 \\times R';
    const formatted = formatSubscriptsAndSuperscripts(raw);
    expect(formatted).toBe('P_baru = I² \\times R');
  });

  it('processes full What-If formulas into beautiful human-readable typography', () => {
    const formula1 = 'I_{baru} = \\frac{4.5V}{1600\\Omega} = 0.003\\text{ A}';
    const result1 = formatPhysicsFormulaToReadableText(formula1);
    expect(result1).toBe('I_baru = 4.5V / 1600Ω = 0.003 A');

    const formula2 = 'P_{baru} = (0.011)^2 \\times R = 4 \\times P_{lama}';
    const result2 = formatPhysicsFormulaToReadableText(formula2);
    expect(result2).toBe('P_baru = (0.011)² × R = 4 × P_lama');

    const formula3 = 'I = \\frac{V}{\\infty} = 0\\text{ A}';
    const result3 = formatPhysicsFormulaToReadableText(formula3);
    expect(result3).toBe('I = V / ∞ = 0 A');
  });

  it('processes Kirchhoff Law summation and loop formulas cleanly', () => {
    const kvlFormula = '\\sum V_{loop} = V_{s} - \\sum V_{k} = 0';
    const result = formatPhysicsFormulaToReadableText(kvlFormula);
    expect(result).toBe('Σ V_loop = V_s - Σ V_k = 0');
  });
});
