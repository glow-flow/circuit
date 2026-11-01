/**
 * CIRCUIT 4.0 - Mathematical Typography & Formula Parser Utility
 *
 * Converts raw LaTeX formula strings and physics notation into clean,
 * human-readable, beautifully styled typography for electrical engineering education.
 *
 * Performance / Big-O Analysis:
 * - Time Complexity: O(N) where N is formula string length.
 *   Uses a single-pass regex tokenizer with O(1) dictionary lookups.
 * - Memory Complexity: O(N) token stream, zero runtime library dependencies.
 */

export interface MathToken {
  type: 'variable' | 'number' | 'operator' | 'unit' | 'subscript' | 'superscript' | 'fraction' | 'text';
  value: string;
  subTokens?: MathToken[];
  numeratorTokens?: MathToken[];
  denominatorTokens?: MathToken[];
}

/**
 * Common LaTeX replacements dictionary for electrical physics symbols.
 * Lookups operate in O(1) constant time.
 */
const SYMBOL_MAP: Record<string, string> = {
  '\\Omega': 'Ω',
  '\\times': '×',
  '\\approx': '≈',
  '\\sum': 'Σ',
  '\\infty': '∞',
  '\\dots': '...',
  '\\quad': '  ',
  '\\leq': '≤',
  '\\geq': '≥',
  '\\neq': '≠',
};

/**
 * Known electrical and physical units for semantic highlighting.
 */
const ELECTRICAL_UNITS = new Set<string>([
  'V',
  'A',
  'mA',
  'uA',
  'µA',
  'W',
  'kW',
  'mW',
  'Ω',
  'kΩ',
  'MΩ',
  'Ohm',
  'Ohms',
  'J',
  'kJ',
  'Wh',
  'kWh',
  'Hz',
  's',
  'ms',
  'min',
  'h',
]);

/**
 * Normalizes a raw LaTeX formula string by substituting LaTeX escape codes,
 * extracting \text{} blocks, and trimming whitespace.
 *
 * @param rawLatex - The raw formula string (e.g., "I_{baru} = \\frac{4.5V}{1600\\Omega} = 0.003\\text{ A}")
 * @returns Clean normalized string with standard Unicode math symbols
 */
export function normalizeLatexFormula(rawLatex: string): string {
  if (!rawLatex || typeof rawLatex !== 'string') return '';

  let normalized = rawLatex;

  // Replace \text{...} wrappers with plain content: \text{ A} -> A
  normalized = normalized.replace(/\\text\{([^}]+)\}/g, '$1');

  // Replace known symbols from SYMBOL_MAP in O(K) where K is symbol dictionary length
  for (const [latexCode, unicodeChar] of Object.entries(SYMBOL_MAP)) {
    normalized = normalized.split(latexCode).join(unicodeChar);
  }

  return normalized.trim();
}

/**
 * Parses a simple LaTeX \frac{A}{B} into clean readable fractions.
 *
 * @param formulaText - LaTeX string potentially containing \frac{...}{...}
 * @returns Text with formatted fractions such as "A / B"
 */
export function formatFractionText(formulaText: string): string {
  if (!formulaText) return '';

  // Regex to match \frac{numerator}{denominator}
  const fractionRegex = /\\frac\{([^{}]+)\}\{([^{}]+)\}/g;
  return formulaText.replace(fractionRegex, (_match, num, den) => {
    return `${num.trim()} / ${den.trim()}`;
  });
}

/**
 * Converts subscript and superscript notation into clean Unicode or readable text:
 * - X_{baru} -> X_baru
 * - I^2 -> I²
 *
 * @param input - The formula text to transform
 * @returns Transformed human-friendly string
 */
export function formatSubscriptsAndSuperscripts(input: string): string {
  if (!input) return '';

  let output = input;

  // Common superscripts to Unicode exponents
  output = output.replace(/\^2\b|\^{2}/g, '²');
  output = output.replace(/\^3\b|\^{3}/g, '³');
  output = output.replace(/\^([0-9])/g, '<sup>$1</sup>');

  // Clean subscript braces: I_{baru} -> I[baru] or I_baru
  output = output.replace(/_\{([^}]+)\}/g, '_$1');

  return output;
}

/**
 * Complete, single-pass pipeline for transforming physics formulas into clean readable text.
 *
 * @param rawLatex - Input formula from MNA solver or Explainable Tutor
 * @returns Human-friendly, beautifully formatted formula string
 */
export function formatPhysicsFormulaToReadableText(rawLatex: string): string {
  if (!rawLatex) return '';
  const step1 = normalizeLatexFormula(rawLatex);
  const step2 = formatFractionText(step1);
  const step3 = formatSubscriptsAndSuperscripts(step2);

  // Normalize spacing around equals and operators
  return step3
    .replace(/\s*=\s*/g, ' = ')
    .replace(/\s*\+\s*/g, ' + ')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\s*×\s*/g, ' × ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Helper to check whether a string token represents an electrical unit.
 *
 * @param token - Token candidate string
 * @returns boolean
 */
export function isElectricalUnit(token: string): boolean {
  return ELECTRICAL_UNITS.has(token);
}
