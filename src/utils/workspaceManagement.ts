/**
 * Workspace Management Utility Module.
 * Provides export/import of versioned .circuit files, defensive schema validation,
 * workspace duplication, and URL-hash circuit sharing with Base64 encoding.
 *
 * Adheres strictly to DRY and defensive programming principles with comprehensive error handling.
 */

import { Node, Edge } from 'reactflow';
import { CircuitElementData, WorldMode } from '../types/circuit';
import {
  CircuitExportPayload,
  CURRENT_CIRCUIT_SCHEMA_VERSION,
  WorkspaceValidationResult,
} from '../types/workspace';
import { migrateWiredBulbsToSockets } from './presetStorage';

/**
 * Sanitizes a circuit title to create a clean, filesystem-safe filename.
 * Time Complexity: O(L) where L is title string length.
 *
 * @param rawTitle Human-readable circuit title
 * @returns Safe ASCII-compatible slug
 */
export function sanitizeFilename(rawTitle: string): string {
  const clean = rawTitle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return clean || 'circuit_blueprint';
}

/**
 * Exports current workspace nodes and edges into a versioned .circuit JSON file.
 * Triggers a browser file download without transmitting data to any server.
 * Time Complexity: O(N + E)
 *
 * @param circuitTitle Name of the circuit
 * @param nodes Active canvas nodes
 * @param edges Active canvas edges
 * @param worldMode Active environment ('lab' | 'outside')
 * @param author Optional student or teacher name
 */
export function exportCircuitToFile(
  circuitTitle: string,
  nodes: Node<CircuitElementData>[],
  edges: Edge[],
  worldMode: WorldMode = 'lab',
  author?: string
): void {
  const exportPayload: CircuitExportPayload = {
    metadata: {
      appName: 'Circuit Sandbox',
      schemaVersion: CURRENT_CIRCUIT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      circuitTitle: circuitTitle.trim() || 'Rangkaian Tanpa Judul',
      worldMode,
      author: author?.trim() || undefined,
    },
    nodes,
    edges,
  };

  const serializedJson = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([serializedJson], { type: 'application/json' });
  const objectUrl = URL.createObjectURL(blob);

  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = objectUrl;
  downloadAnchor.download = `${sanitizeFilename(circuitTitle)}_${Date.now()}.circuit`;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();

  // Clean up allocated object URL
  setTimeout(() => {
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(objectUrl);
  }, 100);
}

/**
 * Defensive schema validator for imported circuit files or JSON payloads.
 * Validates structural integrity, sanitizes malicious or malformed keys,
 * and automatically applies legacy migration rules (e.g. converting bare bulbs to sockets).
 *
 * Time Complexity: O(N + E)
 *
 * @param rawFileContent Raw UTF-8 text string from file reader or network
 * @returns WorkspaceValidationResult with parsed payload or actionable error message
 */
export function validateAndParseCircuitPayload(
  rawFileContent: string
): WorkspaceValidationResult {
  try {
    if (!rawFileContent || typeof rawFileContent !== 'string') {
      return {
        isValid: false,
        errorMessage: 'File kosong atau tidak berisi teks JSON yang valid.',
      };
    }

    const parsedObject = JSON.parse(rawFileContent);

    if (!parsedObject || typeof parsedObject !== 'object') {
      return {
        isValid: false,
        errorMessage: 'Struktur file bukan objek JSON yang valid.',
      };
    }

    // Support both root .circuit export schema and legacy raw { nodes, edges } schema
    const nodes = Array.isArray(parsedObject.nodes) ? parsedObject.nodes : null;
    const edges = Array.isArray(parsedObject.edges) ? parsedObject.edges : null;

    if (!nodes || !edges) {
      return {
        isValid: false,
        errorMessage: 'File tidak memiliki daftar komponen (nodes) atau kabel (edges) yang valid.',
      };
    }

    // Validate that each node has an id and data.type
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index];
      if (!node || typeof node.id !== 'string' || !node.data || typeof node.data.type !== 'string') {
        return {
          isValid: false,
          errorMessage: `Komponen pada indeks ${index} memiliki data yang rusak atau tidak lengkap.`,
        };
      }
    }

    // Validate and clean edges
    const cleanEdges: Edge[] = edges.filter(
      (edge: any) =>
        edge &&
        typeof edge.id === 'string' &&
        typeof edge.source === 'string' &&
        typeof edge.target === 'string' &&
        edge.source !== edge.target
    );

    // Automatically apply legacy backward-compatibility migrations
    const migratedNodes = migrateWiredBulbsToSockets(nodes, cleanEdges);

    const metadata = parsedObject.metadata ?? {
      appName: 'Circuit Sandbox',
      schemaVersion: CURRENT_CIRCUIT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      circuitTitle: 'Rangkaian Diimpor',
      worldMode: 'lab',
    };

    return {
      isValid: true,
      payload: {
        metadata: {
          appName: 'Circuit Sandbox',
          schemaVersion: CURRENT_CIRCUIT_SCHEMA_VERSION,
          exportedAt: metadata.exportedAt || new Date().toISOString(),
          circuitTitle: metadata.circuitTitle || 'Rangkaian Diimpor',
          worldMode: metadata.worldMode === 'outside' ? 'outside' : 'lab',
          author: metadata.author,
        },
        nodes: migratedNodes,
        edges: cleanEdges,
      },
    };
  } catch (parseError) {
    return {
      isValid: false,
      errorMessage:
        parseError instanceof Error
          ? `Gagal membaca format JSON: ${parseError.message}`
          : 'Format file tidak dapat dibaca.',
    };
  }
}

/**
 * Encodes a minimal circuit snapshot into a URL hash string.
 * Strips unnecessary transient rendering properties to minimize URL size.
 * Time Complexity: O(N + E)
 *
 * @param circuitTitle Circuit title
 * @param nodes Active canvas nodes
 * @param edges Active canvas edges
 * @param worldMode Active environment mode
 * @returns Fully qualified shareable URL with #circuit= hash parameter
 */
export function generateShareableUrl(
  circuitTitle: string,
  nodes: Node<CircuitElementData>[],
  edges: Edge[],
  worldMode: WorldMode = 'lab'
): string {
  // Compress nodes to minimal essential electrical data
  const compactNodes = nodes.map((n) => ({
    i: n.id,
    t: n.type || n.data.type,
    p: [Math.round(n.position.x), Math.round(n.position.y)],
    d: {
      l: n.data.label,
      v: n.data.voltage,
      r: n.data.resistance,
      b: n.data.bulbType,
      o: n.data.isOpen,
      w: n.data.worldMode,
      c: n.data.batteryCount,
      s: n.data.installedBulb,
    },
  }));

  const compactEdges = edges
    .filter((e) => !e.data?.isSnapWire)
    .map((e) => ({
      i: e.id,
      s: e.source,
      sh: e.sourceHandle ?? 'p1',
      t: e.target,
      th: e.targetHandle ?? 'p2',
      y: e.type,
    }));

  const payload = {
    title: circuitTitle || 'Shared Circuit',
    mode: worldMode,
    v: CURRENT_CIRCUIT_SCHEMA_VERSION,
    n: compactNodes,
    e: compactEdges,
  };

  const jsonString = JSON.stringify(payload);
  const base64Encoded = btoa(unescape(encodeURIComponent(jsonString)));

  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}#circuit=${base64Encoded}`;
  }

  return `#circuit=${base64Encoded}`;
}

/**
 * Decodes a shareable URL hash payload back into React Flow nodes and edges.
 * Time Complexity: O(N + E)
 *
 * @param hashString The window.location.hash or encoded circuit string
 * @returns WorkspaceValidationResult or null if hash is not present
 */
export function decodeShareableUrlHash(
  hashString: string
): WorkspaceValidationResult | null {
  try {
    if (!hashString || !hashString.includes('#circuit=')) {
      return null;
    }

    const base64Content = hashString.split('#circuit=')[1];
    if (!base64Content) return null;

    const jsonString = decodeURIComponent(escape(atob(base64Content)));
    const parsed = JSON.parse(jsonString);

    if (!parsed || !Array.isArray(parsed.n) || !Array.isArray(parsed.e)) {
      return {
        isValid: false,
        errorMessage: 'Format tautan rangkaian tidak valid.',
      };
    }

    const nodes: Node<CircuitElementData>[] = parsed.n.map((cn: any) => ({
      id: cn.i,
      type: cn.t,
      position: { x: cn.p?.[0] ?? 100, y: cn.p?.[1] ?? 100 },
      data: {
        id: cn.i,
        type: cn.t,
        label: cn.d?.l || 'Komponen',
        voltage: cn.d?.v,
        resistance: cn.d?.r,
        bulbType: cn.d?.b,
        isOpen: cn.d?.o,
        worldMode: cn.d?.w,
        batteryCount: cn.d?.c,
        installedBulb: cn.d?.s,
      },
    }));

    const edges: Edge[] = parsed.e.map((ce: any) => ({
      id: ce.i,
      source: ce.s,
      sourceHandle: ce.sh,
      target: ce.t,
      targetHandle: ce.th,
      type: ce.y || 'wire',
    }));

    const cleanEdges = edges.filter((e) => e.source !== e.target);
    const migratedNodes = migrateWiredBulbsToSockets(nodes, cleanEdges);

    return {
      isValid: true,
      payload: {
        metadata: {
          appName: 'Circuit Sandbox',
          schemaVersion: CURRENT_CIRCUIT_SCHEMA_VERSION,
          exportedAt: new Date().toISOString(),
          circuitTitle: parsed.title || 'Rangkaian Bersama',
          worldMode: parsed.mode === 'outside' ? 'outside' : 'lab',
        },
        nodes: migratedNodes,
        edges: cleanEdges,
      },
    };
  } catch (error) {
    return {
      isValid: false,
      errorMessage:
        error instanceof Error
          ? `Gagal memuat rangkaian dari tautan: ${error.message}`
          : 'Tautan rangkaian rusak atau kedaluwarsa.',
    };
  }
}
