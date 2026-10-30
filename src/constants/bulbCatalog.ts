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

/** Physical lamp base: 'screw' = threaded (E27-style) cap, 'pin' = two-pin capsule cap. */
export type BulbBaseType = 'screw' | 'pin';

/** The only base a standard `SocketNode` (fiting) accepts. */
export const SOCKET_ACCEPTED_BASE: BulbBaseType = 'screw';

/**
 * Horizontal position (percent of node width) of the two bottom terminals per base type,
 * so wire handles sit exactly on the metal contact / pins of the artwork.
 */
export const BASE_TERMINAL_LAYOUT: Record<BulbBaseType, { p1: string; p2: string }> = {
  screw: { p1: '40%', p2: '60%' },
  pin: { p1: '42%', p2: '58%' },
};

/**
 * Returns exact terminal handle positions calibrated to the individual artwork pins/legs.
 * Time Complexity: O(1)
 */
export function getBulbTerminalLayout(bulbType?: BulbType | string): { p1: string; p2: string } {
  if (bulbType === 'halogen') {
    return { p1: '42.3%', p2: '57.6%' };
  }
  if (bulbType === 'led_green') {
    return { p1: '38%', p2: '62%' };
  }
  const spec = getBulbSpec(bulbType);
  return BASE_TERMINAL_LAYOUT[spec.baseType];
}

export interface BulbSpec {
  type: BulbType;
  category: string;
  baseType: BulbBaseType;
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
    baseType: 'screw',
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
    baseType: 'pin',
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
    baseType: 'screw',
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
    baseType: 'screw',
    image: '/assets/bulb-cfl.png',
    imageRotated: true,
    label: 'Lampu Neon (CFL)',
    labelEn: 'Neon Tube (CFL)',
    resistance: 3000,
    maxPower: 15,
    glowTag: 'Cool White',
    traits: 'Hemat energi, cahaya putih bersih, panas rendah.',
    traitsEn: 'Energy efficient, crisp cool white light, low heat.',
    glowColor: 'rgba(224, 242, 254, 0.75)',
    safeMaxVoltage: 18,
  },
  {
    type: 'led_standard',
    category: 'LED Putih',
    baseType: 'screw',
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
    baseType: 'screw',
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
    baseType: 'pin',
    image: '/assets/bulb-led.png',
    label: 'LED Indikator',
    labelEn: 'Green Indicator LED',
    resistance: 5000,
    maxPower: 3,
    glowTag: 'Green',
    traits: 'Hanya untuk indikator, arus sangat kecil.',
    traitsEn: 'Indicator diode only, operates at micro/milliampere current.',
    glowColor: 'rgba(52, 211, 153, 0.75)',
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

/**
 * Checks whether a bulb can be screwed into a standard socket.
 * Time Complexity: O(1)
 *
 * @param bulbType - Bulb model being mounted (undefined falls back to incandescent)
 * @returns true when the bulb base matches the socket's accepted base
 */
export function canBulbFitSocket(bulbType?: BulbType | string): boolean {
  return getBulbSpec(bulbType).baseType === SOCKET_ACCEPTED_BASE;
}
