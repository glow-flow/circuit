import React, { useId } from 'react';
import { CheckCircle2, Target } from 'lucide-react';

export interface MiniLabFrameProps {
  title: string;
  formula?: string;
  challengeText?: string;
  isChallengeMet?: boolean;
  children: React.ReactNode;
}

/**
 * Shared frame for all interactive Academy SVG micro-labs (DRY wrapper).
 * Provides clean flat industrial styling, optional mini-challenge badge, and SVG stage container.
 *
 * Time Complexity: O(1).
 */
export const MiniLabFrame: React.FC<MiniLabFrameProps> = ({
  title,
  formula,
  challengeText,
  isChallengeMet = false,
  children,
}) => {
  return (
    <div className="rounded-2xl bg-void-950 border border-control p-3.5 sm:p-4 space-y-3 text-xs font-sans">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-ink/15">
        <div className="font-bold text-ink text-xs sm:text-sm tracking-tight truncate">
          {title}
        </div>
        {formula && (
          <span className="px-2 py-0.5 rounded-md bg-electric-500/15 border border-electric-500/40 text-electric-300 font-mono text-[11px] font-bold tabular-nums shrink-0">
            {formula}
          </span>
        )}
      </div>

      {challengeText && (
        <div
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-colors ${
            isChallengeMet
              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
              : 'bg-void-900 border-control text-slate-300'
          }`}
        >
          {isChallengeMet ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
          ) : (
            <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
          )}
          <span className="leading-snug">{challengeText}</span>
        </div>
      )}

      {children}
    </div>
  );
};

export interface MiniSliderControlProps {
  label: string;
  valueDisplay: string;
  value: number;
  min: number;
  max: number;
  step: number;
  accentClass?: 'sky' | 'amber' | 'emerald' | 'rose';
  onChange: (nextVal: number) => void;
}

const SLIDER_STYLE_MAP: Readonly<
  Record<NonNullable<MiniSliderControlProps['accentClass']>, { value: string; accent: string }>
> = {
  sky: { value: 'text-sky-400', accent: 'accent-sky-500' },
  amber: { value: 'text-amber-400', accent: 'accent-amber-500' },
  emerald: { value: 'text-emerald-400', accent: 'accent-emerald-500' },
  rose: { value: 'text-rose-400', accent: 'accent-rose-500' },
};

/**
 * Reusable compact range slider with monospace readout for Academy micro-labs.
 * Time Complexity: O(1).
 */
export const MiniSliderControl: React.FC<MiniSliderControlProps> = ({
  label,
  valueDisplay,
  value,
  min,
  max,
  step,
  accentClass = 'sky',
  onChange,
}) => {
  const sliderId = useId();
  const colors = SLIDER_STYLE_MAP[accentClass];

  return (
    <div className="p-2.5 rounded-xl bg-void-900 border border-control space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={sliderId} className="text-[11px] font-medium text-slate-300">
          {label}
        </label>
        <span className={`font-mono text-xs font-bold tabular-nums ${colors.value}`}>
          {valueDisplay}
        </span>
      </div>
      <input
        id={sliderId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const parsed = Number.parseFloat(e.target.value);
          if (Number.isFinite(parsed)) onChange(parsed);
        }}
        className={`w-full min-h-[28px] cursor-pointer ${colors.accent}`}
      />
    </div>
  );
};
