import React from 'react';
import { formatPhysicsFormulaToReadableText } from '../../../utils/mathFormatter';

interface FormattedMathViewProps {
  formula: string;
  className?: string;
  variant?: 'inline' | 'block';
}

/**
 * High-performance, anti-slop mathematical formula renderer.
 * Formats physics equations deterministically without relying on bloated external libraries.
 *
 * Time Complexity: O(N) where N is formula length.
 */
export const FormattedMathView: React.FC<FormattedMathViewProps> = ({
  formula,
  className = '',
  variant = 'inline',
}) => {
  if (!formula || typeof formula !== 'string') {
    return null;
  }

  const cleanText = formatPhysicsFormulaToReadableText(formula);

  // Split tokens by spaces to apply semantic syntax styling
  const tokens = cleanText.split(/(\s+)/);

  const content = tokens.map((token, index) => {
    const trimmed = token.trim();

    if (!trimmed) {
      return token; // preserve whitespace
    }

    // Number with optional unit (e.g. "4.5V", "1600Ω", "0.003A", "0.011")
    const numUnitMatch = trimmed.match(/^([0-9.]+)([a-zA-ZΩµμ]+)?$/);
    if (numUnitMatch) {
      const [, numPart, unitPart] = numUnitMatch;
      return (
        <span key={index} className="inline-flex items-baseline">
          <span className="text-amber-300 font-bold font-mono">{numPart}</span>
          {unitPart && (
            <span className="text-emerald-400/90 font-semibold font-mono ml-0.5">
              {unitPart}
            </span>
          )}
        </span>
      );
    }

    // Mathematical operators (=, +, -, ×, /, ≈, Σ)
    if (['=', '+', '-', '×', '/', '≈', 'Σ', '(', ')'].includes(trimmed)) {
      return (
        <span key={index} className="text-slate-400 font-bold px-0.5 select-none">
          {trimmed}
        </span>
      );
    }

    // Variable or subscript identifier (e.g. "I_baru", "P_lama", "V_s", "R_eq")
    if (trimmed.includes('_')) {
      const [mainVar, subVar] = trimmed.split('_');
      return (
        <span key={index} className="text-electric-300 font-semibold italic">
          {mainVar}
          <sub className="not-italic text-[10px] text-electric-400/90 font-mono font-medium ml-0.5">
            {subVar}
          </sub>
        </span>
      );
    }

    // Default token
    return (
      <span key={index} className="text-slate-200">
        {trimmed}
      </span>
    );
  });

  if (variant === 'block') {
    return (
      <div
        className={`px-3 py-2 rounded-lg bg-void-950/80 border border-white/10 font-mono text-xs overflow-x-auto no-scrollbar select-text tracking-wide ${className}`}
      >
        {content}
      </div>
    );
  }

  return (
    <span className={`font-mono text-xs select-text tracking-wide ${className}`}>
      {content}
    </span>
  );
};
