/**
 * Browser LocalStorage Persistence Module for User-Created Circuit Presets.
 *
 * Allows students, teachers, and hobbyists to save, load, and delete custom
 * circuit blueprints directly in their browser cache without a backend.
 */

import { Node, Edge } from 'reactflow';
import { canBulbFitSocket } from '../constants/bulbCatalog';
import { CircuitElementData } from '../types/circuit';

export interface CustomCircuitPreset {
  id: string;
  name: string;
  createdAt: number;
  nodes: Node<CircuitElementData>[];
  edges: Edge[];
}

const CUSTOM_PRESETS_STORAGE_KEY = 'circuit_sandbox_custom_presets_v1';
const AUTOSAVE_WORKSPACE_KEY = 'circuit_sandbox_autosave_v2';

/**
 * Automatically upgrades any legacy wired `bulb` nodes into `socket` nodes with `installedBulb`.
 * Detached bulbs (not connected to any wire) remain standalone `bulb` inventory items.
 * This ensures backward compatibility with saved localStorage circuits while strictly enforcing
 * the rule that a bulb can NEVER be wired directly without a socket (fiting).
 * Time Complexity: O(N + E) where N is node count and E is edge count.
 *
 * @param nodes - Array of circuit nodes
 * @param edges - Array of circuit edges
 * @returns Migrated nodes array
 */
export function migrateWiredBulbsToSockets(
  nodes: Node<CircuitElementData>[],
  edges: Edge[]
): Node<CircuitElementData>[] {
  const wiredNodeIds = new Set<string>();
  for (const edge of edges) {
    if (!edge.hidden) {
      wiredNodeIds.add(edge.source);
      wiredNodeIds.add(edge.target);
    }
  }

  return nodes.map((node) => {
    if (node.data?.type === 'bulb' && wiredNodeIds.has(node.id)) {
      const bulbType = node.data.bulbType ?? 'incandescent';
      // Pin-base bulbs (halogen capsule, indicator LED) connect directly via pins and do NOT use sockets!
      if (!canBulbFitSocket(bulbType)) {
        return node;
      }
      return {
        ...node,
        type: 'socket',
        data: {
          ...node.data,
          type: 'socket',
          bulbId: node.id,
          installedBulb: {
            id: node.id,
            bulbType,
            resistance: node.data.resistance,
            powerRating: node.data.powerRating,
            isBlown: node.data.isBlown,
            label: node.data.label,
          },
        },
      };
    }
    return node;
  });
}

/**
 * Loads all user-saved custom presets from browser localStorage.
 * Includes defensive try-catch and schema validation to prevent crashes on corrupted cache.
 * Time Complexity: O(P) where P is the number of saved presets.
 *
 * @returns Array of validated CustomCircuitPreset objects
 */
export function loadCustomPresetsFromStorage(): CustomCircuitPreset[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    const rawJson = window.localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY);
    if (!rawJson) return [];

    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is CustomCircuitPreset =>
          Boolean(
            item &&
              typeof item.id === 'string' &&
              typeof item.name === 'string' &&
              Array.isArray(item.nodes) &&
              Array.isArray(item.edges)
          )
      )
      .map((preset) => ({
        ...preset,
        nodes: migrateWiredBulbsToSockets(preset.nodes, preset.edges),
      }));
  } catch (error) {
    console.warn('Failed to read custom presets from localStorage:', error);
    return [];
  }
}

/**
 * Saves the updated array of custom circuit presets to browser localStorage.
 * Time Complexity: O(P * (N + E)) for JSON serialization.
 *
 * @param presets Array of custom circuit presets to persist
 * @returns true if saved successfully, false if storage quota or access failed
 */
export function saveCustomPresetsToStorage(presets: CustomCircuitPreset[]): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    window.localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(presets));
    return true;
  } catch (error) {
    console.warn('Failed to save custom presets to localStorage:', error);
    return false;
  }
}

/**
 * Saves the current active canvas state as an automatic backup in localStorage.
 * Time Complexity: O(N + E) where N is nodes and E is edges.
 *
 * @param nodes Current React Flow nodes on canvas
 * @param edges Current React Flow edges on canvas
 */
export function saveWorkspaceAutosave(
  nodes: Node<CircuitElementData>[],
  edges: Edge[]
): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(
      AUTOSAVE_WORKSPACE_KEY,
      JSON.stringify({ nodes, edges, updatedAt: Date.now() })
    );
  } catch (error) {
    console.warn('Failed to autosave workspace:', error);
  }
}

/**
 * Loads the last autosaved canvas workspace from localStorage if available.
 * Time Complexity: O(N + E)
 *
 * @returns Object containing nodes and edges, or null if no valid autosave exists
 */
export function loadWorkspaceAutosave(): {
  nodes: Node<CircuitElementData>[];
  edges: Edge[];
} | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const rawJson = window.localStorage.getItem(AUTOSAVE_WORKSPACE_KEY);
    if (!rawJson) return null;

    const parsed = JSON.parse(rawJson);
    if (
      parsed &&
      Array.isArray(parsed.nodes) &&
      parsed.nodes.length > 0 &&
      Array.isArray(parsed.edges)
    ) {
      return {
        nodes: migrateWiredBulbsToSockets(parsed.nodes, parsed.edges),
        edges: parsed.edges,
      };
    }
    return null;
  } catch (error) {
    console.warn('Failed to load autosaved workspace:', error);
    return null;
  }
}

export const TUTORIAL_STORAGE_KEY = 'has_seen_tutorial';

/**
 * Checks whether the user has already completed or dismissed the onboarding tutorial.
 * Includes defensive try-catch for environments where localStorage is blocked.
 * Time Complexity: O(1)
 *
 * @returns true if 'has_seen_tutorial' is set to 'true' in localStorage, false otherwise
 */
export function hasSeenTutorial(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    return window.localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true';
  } catch (error) {
    console.warn('Failed to read tutorial status from localStorage:', error);
    return false;
  }
}

/**
 * Marks the onboarding tutorial as seen in browser localStorage ('has_seen_tutorial' = 'true').
 * Includes defensive try-catch for restricted storage contexts.
 * Time Complexity: O(1)
 */
export function markTutorialAsSeen(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
  } catch (error) {
    console.warn('Failed to save tutorial status to localStorage:', error);
  }
}

export const ULTIMATE_POWER_GRID_PRESET_ID = 'ultimate-power-grid' as const;

export interface BuiltinCircuitPreset {
  id: typeof ULTIMATE_POWER_GRID_PRESET_ID;
  labelId: string;
  labelEn: string;
  nodes: Node<CircuitElementData>[];
  edges: Edge[];
}

/**
 * Generates the "Manajemen Daya 9V (Smart Grid)" (`ultimate-power-grid`) preset
 * containing all 7 bulb types across 3 switched power zones, a 9V main battery,
 * 2 power-management resistors (200Ω & 100Ω), 1 master switch + 3 zone switches
 * (all CLOSED/ON by default), a parallel Voltmeter, and a series Ammeter.
 *
 * Time Complexity: O(1) (constructs fixed 19-node, 20-edge orthogonal graph).
 *
 * @param language Active UI language ('id' | 'en')
 * @returns BuiltinCircuitPreset with orthogonal grid coordinates and `smoothstep` edges
 */
export function createUltimatePowerGridPreset(
  language: 'id' | 'en' = 'id'
): BuiltinCircuitPreset {
  const isId = language === 'id';

  const nodes: Node<CircuitElementData>[] = [
    // ================= SUMBER UTAMA & ALAT UKUR =================
    {
      id: 'bat_9v_main',
      type: 'battery9v',
      position: { x: 50, y: 400 },
      data: {
        id: 'bat_9v_main',
        type: 'battery9v',
        voltage: 9.0,
        internalResistance: 2.0,
        label: isId ? 'Baterai 9V Utama' : 'Main 9V Battery',
      },
    },
    {
      id: 'vm_main',
      type: 'voltmeter',
      position: { x: 50, y: 600 },
      data: {
        id: 'vm_main',
        type: 'voltmeter',
        label: isId ? 'Voltmeter Utama' : 'Main Voltmeter',
      },
    },
    {
      id: 'sw_main',
      type: 'switch',
      position: { x: 300, y: 400 },
      data: {
        id: 'sw_main',
        type: 'switch',
        isOpen: false,
        label: isId ? 'Saklar Utama' : 'Master Switch',
      },
    },
    {
      id: 'am_main',
      type: 'ammeter',
      position: { x: 550, y: 400 },
      data: {
        id: 'am_main',
        type: 'ammeter',
        label: isId ? 'Amperemeter Utama' : 'Main Ammeter',
      },
    },

    // ================= ZONA 1 (High Power - Butuh Perlindungan) =================
    {
      id: 'sw_zone1',
      type: 'switch',
      position: { x: 800, y: 100 },
      data: {
        id: 'sw_zone1',
        type: 'switch',
        isOpen: false,
        label: isId ? 'Saklar Zona 1' : 'Zone 1 Switch',
      },
    },
    {
      id: 'res_zone1',
      type: 'resistor',
      position: { x: 1000, y: 100 },
      data: {
        id: 'res_zone1',
        type: 'resistor',
        resistance: 200,
        label: isId ? 'Power Manager (200Ω)' : 'Power Manager (200Ω)',
      },
    },
    {
      id: 'bulb_incandescent',
      type: 'socket',
      position: { x: 1200, y: 50 },
      data: {
        id: 'bulb_incandescent',
        type: 'socket',
        bulbType: 'incandescent',
        resistance: 800,
        powerRating: 40,
        label: isId ? 'Fiting + Lampu Pijar' : 'Socket + Incandescent Bulb',
        installedBulb: {
          id: 'bulb_incandescent_unit',
          bulbType: 'incandescent',
          resistance: 800,
          powerRating: 40,
          label: isId ? 'Lampu Pijar' : 'Incandescent Bulb',
        },
      },
    },
    {
      id: 'bulb_halogen',
      type: 'bulb',
      position: { x: 1200, y: 200 },
      data: {
        id: 'bulb_halogen',
        type: 'bulb',
        bulbType: 'halogen',
        resistance: 1500,
        powerRating: 50,
        label: isId ? 'Lampu Halogen (Kapsul Pin)' : 'Halogen Capsule Bulb',
      },
    },

    // ================= ZONA 2 (Medium Power - Seri) =================
    {
      id: 'sw_zone2',
      type: 'switch',
      position: { x: 800, y: 400 },
      data: {
        id: 'sw_zone2',
        type: 'switch',
        isOpen: false,
        label: isId ? 'Saklar Zona 2' : 'Zone 2 Switch',
      },
    },
    {
      id: 'bulb_edison',
      type: 'socket',
      position: { x: 1000, y: 400 },
      data: {
        id: 'bulb_edison',
        type: 'socket',
        bulbType: 'edison',
        resistance: 1200,
        powerRating: 30,
        label: isId ? 'Fiting + Lampu Edison' : 'Socket + Edison Bulb',
        installedBulb: {
          id: 'bulb_edison_unit',
          bulbType: 'edison',
          resistance: 1200,
          powerRating: 30,
          label: isId ? 'Lampu Edison' : 'Edison Bulb',
        },
      },
    },
    {
      id: 'bulb_cfl',
      type: 'socket',
      position: { x: 1200, y: 400 },
      data: {
        id: 'bulb_cfl',
        type: 'socket',
        bulbType: 'cfl',
        resistance: 3000,
        powerRating: 15,
        label: isId ? 'Fiting + Lampu Neon (CFL)' : 'Socket + CFL Tube Bulb',
        installedBulb: {
          id: 'bulb_cfl_unit',
          bulbType: 'cfl',
          resistance: 3000,
          powerRating: 15,
          label: isId ? 'Lampu Neon (CFL)' : 'CFL Tube Bulb',
        },
      },
    },

    // ================= ZONA 3 (Low Power / LED Bank) =================
    {
      id: 'sw_zone3',
      type: 'switch',
      position: { x: 800, y: 700 },
      data: {
        id: 'sw_zone3',
        type: 'switch',
        isOpen: false,
        label: isId ? 'Saklar Zona 3' : 'Zone 3 Switch',
      },
    },
    {
      id: 'res_zone3',
      type: 'resistor',
      position: { x: 1000, y: 700 },
      data: {
        id: 'res_zone3',
        type: 'resistor',
        resistance: 100,
        label: isId ? 'LED Limiter (100Ω)' : 'LED Limiter (100Ω)',
      },
    },
    {
      id: 'bulb_led_rgb',
      type: 'socket',
      position: { x: 1200, y: 600 },
      data: {
        id: 'bulb_led_rgb',
        type: 'socket',
        bulbType: 'led_rgb',
        resistance: 6000,
        powerRating: 7,
        label: isId ? 'Fiting + Smart LED' : 'Socket + Smart RGB LED',
        installedBulb: {
          id: 'bulb_led_rgb_unit',
          bulbType: 'led_rgb',
          resistance: 6000,
          powerRating: 7,
          label: isId ? 'Smart LED' : 'Smart RGB LED',
        },
      },
    },
    {
      id: 'bulb_led_standard',
      type: 'socket',
      position: { x: 1400, y: 600 },
      data: {
        id: 'bulb_led_standard',
        type: 'socket',
        bulbType: 'led_standard',
        resistance: 4500,
        powerRating: 9,
        label: isId ? 'Fiting + Lampu LED' : 'Socket + Standard LED Bulb',
        installedBulb: {
          id: 'bulb_led_standard_unit',
          bulbType: 'led_standard',
          resistance: 4500,
          powerRating: 9,
          label: isId ? 'Lampu LED' : 'Standard LED Bulb',
        },
      },
    },
    {
      id: 'bulb_led_green',
      type: 'bulb',
      position: { x: 1200, y: 800 },
      data: {
        id: 'bulb_led_green',
        type: 'bulb',
        bulbType: 'led_green',
        resistance: 2000,
        powerRating: 0.5,
        label: isId ? 'LED Indikator (5mm Kaki)' : '5mm Indicator LED',
      },
    },

    // ================= TITIK PENYATUAN & JALUR BALIK (-) =================
    {
      id: 'wp_return_hub',
      type: 'waypoint',
      position: { x: 1600, y: 400 },
      data: {
        id: 'wp_return_hub',
        type: 'waypoint',
        label: isId ? 'Titik Penyatuan (-)' : 'Return Hub (-)',
      },
    },
    {
      id: 'wp_return_br',
      type: 'waypoint',
      position: { x: 1600, y: 980 },
      data: {
        id: 'wp_return_br',
        type: 'waypoint',
        label: isId ? 'Rel Balik Kanan' : 'Bottom-Right Return Rail',
      },
    },
    {
      id: 'wp_return_bl',
      type: 'waypoint',
      position: { x: 155, y: 980 },
      data: {
        id: 'wp_return_bl',
        type: 'waypoint',
        label: isId ? 'Rel Balik Kiri' : 'Bottom-Left Return Rail',
      },
    },
  ];

  const edges: Edge[] = [
    // 1. Baterai (+) -> Saklar Utama -> Amperemeter Utama
    {
      id: 'ug_bat_sw_main',
      source: 'bat_9v_main',
      sourceHandle: 'pos',
      target: 'sw_main',
      targetHandle: 'p1',
      type: 'smoothstep',
    },
    {
      id: 'ug_sw_am_main',
      source: 'sw_main',
      sourceHandle: 'p2',
      target: 'am_main',
      targetHandle: 'p1',
      type: 'smoothstep',
    },

    // 2. Dari Amperemeter Utama (Out) -> Bercabang ke 3 Saklar Zona (Zona 1, 2, 3)
    {
      id: 'ug_am_sw_z1',
      source: 'am_main',
      sourceHandle: 'p2',
      target: 'sw_zone1',
      targetHandle: 'p1',
      type: 'smoothstep',
    },
    {
      id: 'ug_am_sw_z2',
      source: 'am_main',
      sourceHandle: 'p2',
      target: 'sw_zone2',
      targetHandle: 'p1',
      type: 'smoothstep',
    },
    {
      id: 'ug_am_sw_z3',
      source: 'am_main',
      sourceHandle: 'p2',
      target: 'sw_zone3',
      targetHandle: 'p1',
      type: 'smoothstep',
    },

    // 3. Alur Zona 1 (Seri-Paralel): Saklar 1 -> Resistor (200Ω) -> (Pijar || Halogen) -> Titik Penyatuan
    {
      id: 'ug_z1_sw_res',
      source: 'sw_zone1',
      sourceHandle: 'p2',
      target: 'res_zone1',
      targetHandle: 'p1',
      type: 'smoothstep',
    },
    {
      id: 'ug_z1_res_pijar',
      source: 'res_zone1',
      sourceHandle: 'p2',
      target: 'bulb_incandescent',
      targetHandle: 'p1',
      type: 'smoothstep',
    },
    {
      id: 'ug_z1_res_halogen',
      source: 'res_zone1',
      sourceHandle: 'p2',
      target: 'bulb_halogen',
      targetHandle: 'p1',
      type: 'smoothstep',
    },
    {
      id: 'ug_z1_pijar_hub',
      source: 'bulb_incandescent',
      sourceHandle: 'p2',
      target: 'wp_return_hub',
      targetHandle: 'p1',
      type: 'smoothstep',
    },
    {
      id: 'ug_z1_halogen_hub',
      source: 'bulb_halogen',
      sourceHandle: 'p2',
      target: 'wp_return_hub',
      targetHandle: 'p1',
      type: 'smoothstep',
    },

    // 4. Alur Zona 2 (Seri): Saklar 2 -> Lampu Edison -> Lampu CFL -> Titik Penyatuan
    {
      id: 'ug_z2_sw_edison',
      source: 'sw_zone2',
      sourceHandle: 'p2',
      target: 'bulb_edison',
      targetHandle: 'p1',
      type: 'smoothstep',
    },
    {
      id: 'ug_z2_edison_cfl',
      source: 'bulb_edison',
      sourceHandle: 'p2',
      target: 'bulb_cfl',
      targetHandle: 'p1',
      type: 'smoothstep',
    },
    {
      id: 'ug_z2_cfl_hub',
      source: 'bulb_cfl',
      sourceHandle: 'p2',
      target: 'wp_return_hub',
      targetHandle: 'p1',
      type: 'smoothstep',
    },

    // 5. Alur Zona 3 (Paralel dengan Limiter):
    // Saklar 3 -> Resistor (100Ω) -> ((Smart LED -> Lampu LED Standard) || LED Indikator) -> Titik Penyatuan
    {
      id: 'ug_z3_sw_res',
      source: 'sw_zone3',
      sourceHandle: 'p2',
      target: 'res_zone3',
      targetHandle: 'p1',
      type: 'smoothstep',
    },
    {
      id: 'ug_z3_res_rgb',
      source: 'res_zone3',
      sourceHandle: 'p2',
      target: 'bulb_led_rgb',
      targetHandle: 'p1',
      type: 'smoothstep',
    },
    {
      id: 'ug_z3_rgb_std',
      source: 'bulb_led_rgb',
      sourceHandle: 'p2',
      target: 'bulb_led_standard',
      targetHandle: 'p1',
      type: 'smoothstep',
    },
    {
      id: 'ug_z3_std_hub',
      source: 'bulb_led_standard',
      sourceHandle: 'p2',
      target: 'wp_return_hub',
      targetHandle: 'p1',
      type: 'smoothstep',
    },
    {
      id: 'ug_z3_res_green',
      source: 'res_zone3',
      sourceHandle: 'p2',
      target: 'bulb_led_green',
      targetHandle: 'p1',
      type: 'smoothstep',
    },
    {
      id: 'ug_z3_green_hub',
      source: 'bulb_led_green',
      sourceHandle: 'p2',
      target: 'wp_return_hub',
      targetHandle: 'p1',
      type: 'smoothstep',
    },

    // 6. Dari Titik Penyatuan -> Baterai (-) (via jalur balik bawah agar tidak memotong tengah rangkaian)
    {
      id: 'ug_hub_br',
      source: 'wp_return_hub',
      sourceHandle: 'p2',
      target: 'wp_return_br',
      targetHandle: 'p1',
      type: 'smoothstep',
    },
    {
      id: 'ug_br_bl',
      source: 'wp_return_br',
      sourceHandle: 'p2',
      target: 'wp_return_bl',
      targetHandle: 'p1',
      type: 'smoothstep',
    },
    {
      id: 'ug_bl_bat_neg',
      source: 'wp_return_bl',
      sourceHandle: 'p2',
      target: 'bat_9v_main',
      targetHandle: 'neg',
      type: 'smoothstep',
    },

    // 7. Voltmeter (+) dan (-) ke Baterai 9V (Paralel)
    {
      id: 'ug_vm_pos',
      source: 'bat_9v_main',
      sourceHandle: 'pos',
      target: 'vm_main',
      targetHandle: 'p1',
      type: 'smoothstep',
    },
    {
      id: 'ug_vm_neg',
      source: 'vm_main',
      sourceHandle: 'p2',
      target: 'bat_9v_main',
      targetHandle: 'neg',
      type: 'smoothstep',
    },
  ];

  return {
    id: ULTIMATE_POWER_GRID_PRESET_ID,
    labelId: 'Tantangan Manajemen Daya (9V)',
    labelEn: 'Ultimate Power Grid (9V)',
    nodes,
    edges,
  };
}

export const ULTIMATE_POWER_GRID_PRESET: BuiltinCircuitPreset =
  createUltimatePowerGridPreset('id');

