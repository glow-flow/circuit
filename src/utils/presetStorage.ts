/**
 * Browser LocalStorage Persistence Module for User-Created Circuit Presets.
 *
 * Allows students, teachers, and hobbyists to save, load, and delete custom
 * circuit blueprints directly in their browser cache without a backend.
 */

import { Node, Edge } from 'reactflow';
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

    return parsed.filter(
      (item): item is CustomCircuitPreset =>
        Boolean(
          item &&
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            Array.isArray(item.nodes) &&
            Array.isArray(item.edges)
        )
    );
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
      return { nodes: parsed.nodes, edges: parsed.edges };
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

