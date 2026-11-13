import React, { useState } from 'react';
import { Lightbulb } from 'lucide-react';

export type MascotMood =
  | 'celebrate'
  | 'proud'
  | 'bored'
  | 'confused'
  | 'love'
  | 'dance'
  | 'angry'
  | 'sad';

export const MASCOT_ASSET_PATHS: Readonly<Record<MascotMood, string>> = {
  celebrate: '/assets/mascot/watt-celebrate.png',
  proud: '/assets/mascot/watt-proud.png',
  bored: '/assets/mascot/watt-bored.png',
  confused: '/assets/mascot/watt-confused.png',
  love: '/assets/mascot/watt-love.png',
  dance: '/assets/mascot/watt-dance.png',
  angry: '/assets/mascot/watt-angry.png',
  sad: '/assets/mascot/watt-sad.png',
};

export interface MascotAvatarProps {
  /** Emotional expression matching the current learning or circuit state */
  mood: MascotMood;
  /** Preset pixel bounding size */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Accessible alt label */
  alt?: string;
  /** Additional tailwind styling classes */
  className?: string;
}

const SIZE_DIMENSION_MAP: Readonly<Record<NonNullable<MascotAvatarProps['size']>, number>> = {
  xs: 36,
  sm: 48,
  md: 64,
  lg: 88,
};

const SIZE_CLASS_MAP: Readonly<Record<NonNullable<MascotAvatarProps['size']>, string>> = {
  xs: 'w-9 h-9',
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-[88px] h-[88px]',
};

/**
 * Resolves the asset path safely for a requested MascotMood.
 * Time Complexity: O(1) dictionary lookup with fallback.
 *
 * @param mood - Desired expression mood key
 * @returns Public asset URL for the PNG cutout
 */
export function resolveMascotAssetSrc(mood: MascotMood): string {
  return MASCOT_ASSET_PATHS[mood] ?? MASCOT_ASSET_PATHS.proud;
}

/**
 * Reusable Duolingo-style mascot avatar ("Watt" the CFL Tube Bulb Engineer).
 * Displays a crisp alpha-matted PNG cutout matching emotional feedback states
 * with explicit intrinsic dimensions and graceful offline fallback.
 *
 * Time Complexity: O(1) stateless render.
 */
export const MascotAvatar: React.FC<MascotAvatarProps> = ({
  mood,
  size = 'md',
  alt = 'Watt Mascot',
  className = '',
}) => {
  const [hasImageError, setHasImageError] = useState(false);
  const pixelSize = SIZE_DIMENSION_MAP[size];
  const sizeClass = SIZE_CLASS_MAP[size];
  const src = resolveMascotAssetSrc(mood);

  if (hasImageError) {
    return (
      <div
        className={`${sizeClass} rounded-2xl bg-void-850 border border-electric-500/35 flex items-center justify-center text-electric-400 shrink-0 ${className}`}
        aria-label={alt}
      >
        <Lightbulb className="w-1/2 h-1/2" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={pixelSize}
      height={pixelSize}
      draggable={false}
      onError={() => setHasImageError(true)}
      className={`${sizeClass} object-contain select-none shrink-0 drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)] ${className}`}
    />
  );
};

export interface MascotCoachBubbleProps {
  mood: MascotMood;
  eyebrow?: string;
  message: string;
  accent?: 'electric' | 'emerald' | 'amber' | 'rose';
  rightAction?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const ACCENT_SURFACE_MAP: Readonly<
  Record<NonNullable<MascotCoachBubbleProps['accent']>, { wrap: string; eyebrow: string }>
> = {
  electric: {
    wrap: 'bg-void-950/95 border-electric-500/30',
    eyebrow: 'text-electric-400',
  },
  emerald: {
    wrap: 'bg-emerald-950/35 border-emerald-500/35',
    eyebrow: 'text-emerald-400',
  },
  amber: {
    wrap: 'bg-amber-950/35 border-amber-500/35',
    eyebrow: 'text-amber-300',
  },
  rose: {
    wrap: 'bg-rose-950/35 border-rose-500/40',
    eyebrow: 'text-rose-300',
  },
};

/**
 * Shared Duolingo-style mascot speech-bubble coach strip (DRY helper across
 * Academy, Missions, Outdoor Grid popup, and 0V Short-Circuit explainer).
 *
 * Time Complexity: O(1).
 */
export const MascotCoachBubble: React.FC<MascotCoachBubbleProps> = ({
  mood,
  eyebrow,
  message,
  accent = 'electric',
  rightAction,
  size = 'sm',
  className = '',
}) => {
  const palette = ACCENT_SURFACE_MAP[accent];

  return (
    <div
      className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl border ${palette.wrap} ${className}`}
    >
      <MascotAvatar mood={mood} size={size} alt="Watt Coach" />
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <div
            className={`text-[10px] font-mono font-bold uppercase tracking-wider leading-tight mb-0.5 ${palette.eyebrow}`}
          >
            {eyebrow}
          </div>
        )}
        <p className="text-xs sm:text-[13px] font-medium text-slate-100 leading-snug">
          {message}
        </p>
      </div>
      {rightAction && <div className="shrink-0">{rightAction}</div>}
    </div>
  );
};
