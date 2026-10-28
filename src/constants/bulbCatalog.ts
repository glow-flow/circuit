/**
 * Bulb Catalog & Physics Specification Module.
 *
 * Centralizes the 7 light bulb types ('incandescent', 'halogen', 'edison',
 * 'cfl', 'led_standard', 'led_rgb', 'led_green') so BulbNode, Inspector,
 * Palette catalog, Zustand Store, and MNA Solver share a single DRY source of truth.
 *
 * Time Complexity:
 * - Lookup by bulbType (`getBulbSpec`): O(1) via hash map (`BULB_SPEC_MAP`)
 */

export type BulbType =
  | 'incandescent'
  | 'halogen'
  | 'edison'
  | 'cfl'
  | 'led_standard'
  | 'led_rgb'
  | 'led_green';

export interface BulbSpec {
  type: BulbType;
  category: string;
  image: string;
  /** True when the source PNG is a horizontal shape (e.g. CFL tube) that should be shown upright (rotated 90°). */
  imageRotated?: boolean;
  label: string;
  labelEn: string;
  resistance: number; // Ohms (Ω)
  maxPower: number; // Max rated power in Watts (W)
  glowTag: string;
  traits: string;
  traitsEn: string;
  glowColor: string; // CSS color for radial drop-shadow / aura
  safeMaxVoltage: number; // Voltage threshold above which fragile bulbs (like LEDs) overheat/blow
}

export const BULB_CATALOG: readonly BulbSpec[] = [
  {
    type: 'incandescent',
    category: 'Pijar Modern',
    image: '/assets/bulb-incandescent.png',
    label: 'Lampu Pijar',
    labelEn: 'Incandescent Bulb',
    resistance: 800,
    maxPower: 40,
    glowTag: 'Warm Glow',
    traits: 'Menghasilkan panas tinggi, cahaya kuning/oranye.',
    traitsEn: 'High heat output, warm yellow/orange glow.',
    glowColor: 'rgba(251, 191, 36, 0.65)',
    safeMaxVoltage: 24,
  },
  {
    type: 'halogen',
    category: 'Kapsul',
    image: '/assets/bulb-halogen.png',
    label: 'Lampu Halogen',
    labelEn: 'Halogen Bulb',
    resistance: 1500,
    maxPower: 50,
    glowTag: 'Bright Warm',
    traits: 'Sangat terang, panas tinggi, umur pendek.',
    traitsEn: 'Very bright, high heat, shorter lifespan.',
    glowColor: 'rgba(254, 240, 138, 0.7)',
    safeMaxVoltage: 24,
  },
  {
    type: 'edison',
    category: 'Vintage',
    image: '/assets/bulb-edison.png',
    label: 'Lampu Edison',
    labelEn: 'Edison Vintage',
    resistance: 1200,
    maxPower: 30,
    glowTag: 'Amber Glow',
    traits: 'Estetik, hangat, panas sedang.',
    traitsEn: 'Aesthetic spiral filament, warm amber glow, medium heat.',
    glowColor: 'rgba(245, 158, 11, 0.65)',
    safeMaxVoltage: 24,
  },
  {
    type: 'cfl',
    category: 'Neon U-Shape',
    image: '/assets/bulb-cfl.png',
    imageRotated: true,
    label: 'Lampu Neon (CFL)',
    labelEn: 'Neon Tube (CFL)',
    resistance: 3000,
    maxPower: 15,
    glowTag: 'Cool White',
    traits: 'Hemat energi, cahaya putih bersih, panas rendah.',
    traitsEn: 'Energy efficient, crisp cool white light, low heat.',
    glowColor: 'rgba(56, 189, 248, 0.65)',
    safeMaxVoltage: 18,
  },
  {
    type: 'led_standard',
    category: 'LED Putih',
    image: '/assets/bulb-led-standard.png',
    label: 'Lampu LED',
    labelEn: 'Standard LED',
    resistance: 4500,
    maxPower: 9,
    glowTag: 'Cool White',
    traits: 'Sangat hemat energi, dingin, terang.',
    traitsEn: 'Ultra energy-saving, cool operation, clean brightness.',
    glowColor: 'rgba(186, 230, 253, 0.65)',
    safeMaxVoltage: 12,
  },
  {
    type: 'led_rgb',
    category: 'Smart Bulb',
    image: '/assets/bulb-rgb.png',
    label: 'Smart LED',
    labelEn: 'Smart RGB LED',
    resistance: 6000,
    maxPower: 7,
    glowTag: 'RGB Colors',
    traits: 'Paling hemat daya, warna variatif.',
    traitsEn: 'Lowest power consumption, multi-color RGB spectrum.',
    glowColor: 'rgba(192, 132, 252, 0.7)',
    safeMaxVoltage: 9,
  },
  {
    type: 'led_green',
    category: 'LED Indikator',
    image: '/assets/bulb-led.png',
    label: 'LED Indikator',
    labelEn: 'Green Indicator LED',
    resistance: 5000,
    maxPower: 3,
    glowTag: 'Green',
    traits: 'Hanya untuk indikator, arus sangat kecil.',
    traitsEn: 'Indicator diode only, operates at micro/milliampere current.',
    glowColor: 'rgba(74, 222, 128, 0.65)',
    safeMaxVoltage: 6,
  },
] as const;

/**
 * O(1) Hash Map for instant lookup by BulbType.
 */
const BULB_SPEC_MAP: Record<BulbType, BulbSpec> = BULB_CATALOG.reduce(
  (acc, spec) => {
    acc[spec.type] = spec;
    return acc;
  },
  {} as Record<BulbType, BulbSpec>
);

/**
 * Retrieves the specification for a given BulbType in O(1) time.
 * Defaults to 'incandescent' if undefined or invalid.
 *
 * @param bulbType - Optional bulb type identifier
 * @returns Complete BulbSpec object
 */
export function getBulbSpec(bulbType?: BulbType | string): BulbSpec {
  if (bulbType && bulbType in BULB_SPEC_MAP) {
    return BULB_SPEC_MAP[bulbType as BulbType];
  }
  return BULB_SPEC_MAP.incandescent;
}

/**
 * Computes visual brightness (0.0 to 1.0) and thermal status based on real-time
 * dissipated power P = I^2 * R.
 *
 * Physics Calibration:
 * - At a standard 3.0V battery holder source, an 800Ω Incandescent bulb draws
 *   I = 3.0 / 800 = 3.75 mA and dissipates P = I^2 * R = 11.25 mW (0.01125 W).
 * - When the user switches the same 3.0V circuit to an LED (e.g., 4500Ω or 6000Ω),
 *   current I drops (0.67 mA / 0.50 mA), so P = I^2 * R drops proportionally
 *   (2.0 mW / 1.5 mW), making high-resistance bulbs visibly dimmer at the same voltage.
 *
 * Time Complexity: O(1)
 */
export function computeBulbPhotometrics(
  currentAmps: number,
  resistanceOhms: number,
  spec: BulbSpec
): {
  powerWatts: number;
  voltageDrop: number;
  brightness: number;
  heatLevel: 'cold' | 'warm' | 'hot' | 'overheat';
  isOverloaded: boolean;
} {
  const safeResistance = Math.max(0.1, resistanceOhms);
  const absCurrent = Math.abs(currentAmps);
  const powerWatts = absCurrent * absCurrent * safeResistance; // P = I^2 * R
  const voltageDrop = absCurrent * safeResistance; // V = I * R

  // Reference baseline power: 3.0V across 800Ω incandescent = 0.01125 W
  // For legacy low-resistance test circuits (< 100Ω), scale against 1.5W
  const referencePower = safeResistance >= 200 ? 0.01125 : 1.5;
  const brightness =
    absCurrent <= 1e-6 ? 0 : Math.min(1.0, Math.max(0.08, powerWatts / referencePower));

  // Overload check: if P exceeds maxPower OR if fragile LED is subjected to excessive voltage (e.g. >= 9V on indicator/RGB LED)
  const isOverloaded =
    powerWatts > spec.maxPower ||
    (safeResistance >= 200 && voltageDrop >= spec.safeMaxVoltage);

  let heatLevel: 'cold' | 'warm' | 'hot' | 'overheat' = 'cold';
  if (isOverloaded) {
    heatLevel = 'overheat';
  } else if (absCurrent > 1e-5) {
    if (spec.type === 'incandescent' || spec.type === 'halogen') {
      heatLevel = brightness > 0.35 ? 'hot' : 'warm';
    } else if (spec.type === 'edison') {
      heatLevel = 'warm';
    } else {
      heatLevel = 'cold';
    }
  }

  return {
    powerWatts,
    voltageDrop,
    brightness,
    heatLevel,
    isOverloaded,
  };
}
