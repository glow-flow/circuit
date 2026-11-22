/**
 * IEC 60062 4-Band Axial Resistor Color Code Calculator.
 *
 * Pure deterministic helper used by `ResistorGraphic` so every resistor on the
 * canvas and palette reflects its real electrical resistance in Ohms with
 * authentic laboratory color bands.
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */

export interface ResistorColorBand {
  colorId: string;
  hex: string;
  strokeHex: string;
  labelId: string;
  labelEn: string;
}

const DIGIT_BANDS: readonly ResistorColorBand[] = [
  { colorId: 'black', hex: '#1E293B', strokeHex: '#475569', labelId: 'Hitam', labelEn: 'Black' },
  { colorId: 'brown', hex: '#92400E', strokeHex: '#78350F', labelId: 'Cokelat', labelEn: 'Brown' },
  { colorId: 'red', hex: '#DC2626', strokeHex: '#991B1B', labelId: 'Merah', labelEn: 'Red' },
  { colorId: 'orange', hex: '#EA580C', strokeHex: '#9A3412', labelId: 'Oranye', labelEn: 'Orange' },
  { colorId: 'yellow', hex: '#EAB308', strokeHex: '#A16207', labelId: 'Kuning', labelEn: 'Yellow' },
  { colorId: 'green', hex: '#16A34A', strokeHex: '#166534', labelId: 'Hijau', labelEn: 'Green' },
  { colorId: 'blue', hex: '#2563EB', strokeHex: '#1E40AF', labelId: 'Biru', labelEn: 'Blue' },
  { colorId: 'violet', hex: '#7C3AED', strokeHex: '#5B21B6', labelId: 'Ungu', labelEn: 'Violet' },
  { colorId: 'grey', hex: '#64748B', strokeHex: '#475569', labelId: 'Abu-abu', labelEn: 'Grey' },
  { colorId: 'white', hex: '#F8FAFC', strokeHex: '#CBD5E1', labelId: 'Putih', labelEn: 'White' },
] as const;

const GOLD_BAND: ResistorColorBand = {
  colorId: 'gold',
  hex: '#D97706',
  strokeHex: '#92400E',
  labelId: 'Emas',
  labelEn: 'Gold',
};

const SILVER_BAND: ResistorColorBand = {
  colorId: 'silver',
  hex: '#CBD5E1',
  strokeHex: '#94A3B8',
  labelId: 'Perak',
  labelEn: 'Silver',
};

/**
 * Computes the 4 IEC 60062 color bands `[digit1, digit2, multiplier, tolerance]`
 * for a given resistance value in Ohms.
 *
 * Examples:
 * - 10 Ω   -> Brown, Black, Black, Gold
 * - 100 Ω  -> Brown, Black, Brown, Gold
 * - 220 Ω  -> Red, Red, Brown, Gold
 * - 470 Ω  -> Yellow, Violet, Brown, Gold
 * - 1000 Ω -> Brown, Black, Red, Gold
 * - 4700 Ω -> Yellow, Violet, Red, Gold
 * - 10 kΩ  -> Brown, Black, Orange, Gold
 */
export function computeResistorColorBands(
  resistanceOhms: number
): readonly [ResistorColorBand, ResistorColorBand, ResistorColorBand, ResistorColorBand] {
  if (!Number.isFinite(resistanceOhms) || resistanceOhms <= 0) {
    return [DIGIT_BANDS[0], DIGIT_BANDS[0], DIGIT_BANDS[0], GOLD_BAND];
  }

  // Clamp to practical axial resistor range [0.1 Ω .. 99 MΩ]
  const clamped = Math.min(99_000_000, Math.max(0.1, resistanceOhms));

  let exponent = Math.floor(Math.log10(clamped)) - 1;
  let twoDigit = Math.round(clamped / Math.pow(10, exponent));

  // Normalize rounding boundary (e.g., 99.6 -> 100 becomes 10 * 10^(exp+1))
  if (twoDigit >= 100) {
    twoDigit = Math.round(twoDigit / 10);
    exponent += 1;
  } else if (twoDigit < 10) {
    twoDigit *= 10;
    exponent -= 1;
  }

  const d1 = Math.min(9, Math.max(0, Math.floor(twoDigit / 10)));
  const d2 = Math.min(9, Math.max(0, twoDigit % 10));

  let multiplierBand: ResistorColorBand;
  if (exponent === -2) {
    multiplierBand = SILVER_BAND;
  } else if (exponent === -1) {
    multiplierBand = GOLD_BAND;
  } else {
    const safeExp = Math.min(9, Math.max(0, exponent));
    multiplierBand = DIGIT_BANDS[safeExp];
  }

  return [DIGIT_BANDS[d1], DIGIT_BANDS[d2], multiplierBand, GOLD_BAND];
}
