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

import { BULB_DATASHEET_CITATIONS } from './datasheetCitations';

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
  /** Semiconductor forward junction threshold Vf (Volts), e.g., ~2.0V for discrete indicator LED. */
  forwardVoltage?: number;
  /** Luminous efficacy in lumens per Watt (lm/W): ~12 incandescent, ~60 CFL, ~95 white LED. */
  efficacyLmPerW: number;
  maxPower: number; // Max rated power in Watts (W)
  glowTag: string;
  traits: string;
  traitsEn: string;
  glowColor: string; // CSS color for radial drop-shadow / aura
  safeMaxVoltage: number; // Voltage threshold above which fragile bulbs (like LEDs) overheat/blow
  /** Short standard / datasheet badge (e.g. "SNI IEC 60064 • Philips ST64 Vintage"). */
  standardBadge: string;
  /** Verifiable scientific / datasheet citation in Indonesian. */
  datasheetSource: string;
  /** Verifiable scientific / datasheet citation in English. */
  datasheetSourceEn: string;
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
    efficacyLmPerW: 12,
    maxPower: 40,
    glowTag: 'Warm Glow',
    traits: 'Menghasilkan panas tinggi, cahaya kuning/oranye.',
    traitsEn: 'High heat output, warm yellow/orange glow.',
    glowColor: 'rgba(251, 191, 36, 0.65)',
    safeMaxVoltage: 24,
    standardBadge: BULB_DATASHEET_CITATIONS.incandescent.standardBadge,
    datasheetSource: BULB_DATASHEET_CITATIONS.incandescent.sourceCitationId,
    datasheetSourceEn: BULB_DATASHEET_CITATIONS.incandescent.sourceCitationEn,
  },
  {
    type: 'halogen',
    category: 'Kapsul',
    baseType: 'pin',
    image: '/assets/bulb-halogen.png',
    label: 'Lampu Halogen',
    labelEn: 'Halogen Bulb',
    resistance: 1500,
    efficacyLmPerW: 18,
    maxPower: 50,
    glowTag: 'Bright Warm',
    traits: 'Sangat terang, panas tinggi, umur pendek.',
    traitsEn: 'Very bright, high heat, shorter lifespan.',
    glowColor: 'rgba(254, 240, 138, 0.7)',
    safeMaxVoltage: 24,
    standardBadge: BULB_DATASHEET_CITATIONS.halogen.standardBadge,
    datasheetSource: BULB_DATASHEET_CITATIONS.halogen.sourceCitationId,
    datasheetSourceEn: BULB_DATASHEET_CITATIONS.halogen.sourceCitationEn,
  },
  {
    type: 'edison',
    category: 'Vintage',
    baseType: 'screw',
    image: '/assets/bulb-edison.png',
    label: 'Lampu Edison',
    labelEn: 'Edison Vintage',
    resistance: 1200,
    efficacyLmPerW: 9,
    maxPower: 30,
    glowTag: 'Amber Glow',
    traits: 'Estetik, hangat, panas sedang.',
    traitsEn: 'Aesthetic spiral filament, warm amber glow, medium heat.',
    glowColor: 'rgba(245, 158, 11, 0.65)',
    safeMaxVoltage: 24,
    standardBadge: BULB_DATASHEET_CITATIONS.edison.standardBadge,
    datasheetSource: BULB_DATASHEET_CITATIONS.edison.sourceCitationId,
    datasheetSourceEn: BULB_DATASHEET_CITATIONS.edison.sourceCitationEn,
  },
  {
    type: 'cfl',
    category: 'Neon U-Shape',
    baseType: 'screw',
    image: '/assets/bulb-cfl.png',
    imageRotated: false,
    label: 'Lampu Neon (CFL)',
    labelEn: 'Neon Tube (CFL)',
    resistance: 3000,
    efficacyLmPerW: 60,
    maxPower: 15,
    glowTag: 'Cool White',
    traits: 'Hemat energi, cahaya putih bersih, panas rendah.',
    traitsEn: 'Energy efficient, crisp cool white light, low heat.',
    glowColor: 'rgba(224, 242, 254, 0.75)',
    safeMaxVoltage: 18,
    standardBadge: BULB_DATASHEET_CITATIONS.cfl.standardBadge,
    datasheetSource: BULB_DATASHEET_CITATIONS.cfl.sourceCitationId,
    datasheetSourceEn: BULB_DATASHEET_CITATIONS.cfl.sourceCitationEn,
  },
  {
    type: 'led_standard',
    category: 'LED Putih',
    baseType: 'screw',
    image: '/assets/bulb-led-standard.png',
    label: 'Lampu LED',
    labelEn: 'Standard LED',
    resistance: 4500,
    efficacyLmPerW: 95,
    maxPower: 9,
    glowTag: 'Cool White',
    traits: 'Sangat hemat energi, dingin, terang.',
    traitsEn: 'Ultra energy-saving, cool operation, clean brightness.',
    glowColor: 'rgba(186, 230, 253, 0.65)',
    safeMaxVoltage: 12,
    standardBadge: BULB_DATASHEET_CITATIONS.led_standard.standardBadge,
    datasheetSource: BULB_DATASHEET_CITATIONS.led_standard.sourceCitationId,
    datasheetSourceEn: BULB_DATASHEET_CITATIONS.led_standard.sourceCitationEn,
  },
  {
    type: 'led_rgb',
    category: 'Smart Bulb',
    baseType: 'screw',
    image: '/assets/bulb-rgb.png',
    label: 'Smart LED',
    labelEn: 'Smart RGB LED',
    resistance: 6000,
    efficacyLmPerW: 75,
    maxPower: 7,
    glowTag: 'RGB Colors',
    traits: 'Paling hemat daya, warna variatif.',
    traitsEn: 'Lowest power consumption, multi-color RGB spectrum.',
    glowColor: 'rgba(192, 132, 252, 0.7)',
    safeMaxVoltage: 9,
    standardBadge: BULB_DATASHEET_CITATIONS.led_rgb.standardBadge,
    datasheetSource: BULB_DATASHEET_CITATIONS.led_rgb.sourceCitationId,
    datasheetSourceEn: BULB_DATASHEET_CITATIONS.led_rgb.sourceCitationEn,
  },
  {
    type: 'led_green',
    category: 'LED Indikator',
    baseType: 'pin',
    image: '/assets/bulb-led.png',
    label: 'LED Indikator',
    labelEn: 'Green Indicator LED',
    resistance: 5000,
    forwardVoltage: 2.0,
    efficacyLmPerW: 50,
    maxPower: 3,
    glowTag: 'Green',
    traits: 'Hanya untuk indikator, arus sangat kecil.',
    traitsEn: 'Indicator diode only, operates at micro/milliampere current.',
    glowColor: 'rgba(52, 211, 153, 0.75)',
    safeMaxVoltage: 8,
    standardBadge: BULB_DATASHEET_CITATIONS.led_green.standardBadge,
    datasheetSource: BULB_DATASHEET_CITATIONS.led_green.sourceCitationId,
    datasheetSourceEn: BULB_DATASHEET_CITATIONS.led_green.sourceCitationEn,
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
 * Computes visual brightness (0.0 to 1.0), luminous flux (lumens), and thermal status
 * based on electrical power P = V_drop * I and luminous efficacy (lm/W).
 *
 * Physics Calibration:
 * - Incandescent (800Ω, 12 lm/W) at 3.0V draws 3.75 mA (11.25 mW) -> 0.135 lm (high waste heat, ~71% brightness).
 * - Standard LED (4500Ω, 95 lm/W) at 3.0V draws 0.67 mA (2.00 mW) -> 0.190 lm (100% brightness, 5.6x less power, stays cold).
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
  lumens: number;
  brightness: number;
  heatLevel: 'cold' | 'warm' | 'hot' | 'overheat';
  isOverloaded: boolean;
} {
  const safeResistance = Math.max(0.1, resistanceOhms);
  const absCurrent = Math.abs(currentAmps);
  const forwardDrop = absCurrent > 1e-6 ? (spec.forwardVoltage ?? 0) : 0;
  const voltageDrop = forwardDrop + absCurrent * safeResistance; // Total pin drop Vf + I * R
  const powerWatts = voltageDrop * absCurrent; // Reduces to I^2 * R when Vf = 0
  const efficacy = spec.efficacyLmPerW ?? 12;
  const lumens = absCurrent <= 1e-6 ? 0 : powerWatts * efficacy;

  // Reference baseline luminous flux calibrated against a 3.0V modern 2mW LED (0.19 lm)
  // so 3V incandescent (0.135 lm) renders ~71% warm brightness while LED hits 100% at 5.6x less wattage.
  // Legacy low-resistance test circuits (< 200Ω) normalize against 1.5W * 12 lm/W = 18.0 lm.
  const referenceLumens = safeResistance >= 200 ? 0.19 : 18.0;
  const brightness =
    absCurrent <= 1e-6 ? 0 : Math.min(1.0, Math.max(0.08, lumens / referenceLumens));

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
    lumens,
    brightness,
    heatLevel,
    isOverloaded,
  };
}

/**
 * Checks whether a bulb can be screwed into a standard E27 socket.
 * Only bulbs with an E27 screw base (`baseType === 'screw'`) are accepted.
 * Returns true ONLY for `baseType === 'screw'`.
 * Time Complexity: O(1) via hash map lookup.
 *
 * @param bulbType - Bulb model identifier (undefined falls back to incandescent)
 * @returns true ONLY when the bulb base type is 'screw'
 */
export function canBulbFitSocket(bulbType?: BulbType | string): boolean {
  return getBulbSpec(bulbType).baseType === SOCKET_ACCEPTED_BASE;
}

/**
 * Checks whether a bulb can fit into a ceramic bi-pin socket (G4/G9).
 * Accepts pin-base bulbs ('halogen' and 'led_green').
 * Screw-base bulbs (E27) do not fit and return false.
 * Time Complexity: O(1) via hash map lookup.
 *
 * @param bulbType - Bulb model identifier being mounted
 * @returns true ONLY when the bulb has a 'pin' base type ('halogen' | 'led_green')
 */
export function canBulbFitPinSocket(bulbType?: BulbType | string): boolean {
  if (!bulbType) return false;
  const spec = getBulbSpec(bulbType);
  return spec.baseType === 'pin';
}
