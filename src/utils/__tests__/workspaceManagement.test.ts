import { describe, it, expect } from 'vitest';
import { Node, Edge } from 'reactflow';
import {
  sanitizeFilename,
  validateAndParseCircuitPayload,
  generateShareableUrl,
  decodeShareableUrlHash,
} from '../workspaceManagement';
import { CircuitElementData } from '../../types/circuit';
import { CURRENT_CIRCUIT_SCHEMA_VERSION } from '../../types/workspace';

describe('Workspace Management: File & URL Persistence', () => {
  it('sanitizes circuit titles into safe ASCII filenames', () => {
    expect(sanitizeFilename('Praktikum Hukum Ohm & Kirchoff #1!')).toBe(
      'praktikum_hukum_ohm_kirchoff_1'
    );
    expect(sanitizeFilename('   ')).toBe('circuit_blueprint');
  });

  it('successfully validates and migrates valid circuit JSON payload', () => {
    const rawPayload = JSON.stringify({
      metadata: {
        appName: 'Circuit Sandbox',
        schemaVersion: CURRENT_CIRCUIT_SCHEMA_VERSION,
        exportedAt: '2026-10-31T00:00:00.000Z',
        circuitTitle: 'Test Lab Circuit',
        worldMode: 'lab',
      },
      nodes: [
        {
          id: 'bat_1',
          type: 'battery9v',
          position: { x: 100, y: 100 },
          data: { id: 'bat_1', type: 'battery9v', voltage: 9.0, label: '9V Battery' },
        },
        {
          id: 'socket_1',
          type: 'socket',
          position: { x: 300, y: 100 },
          data: { id: 'socket_1', type: 'socket', label: 'E27 Socket', bulbType: 'incandescent' },
        },
      ],
      edges: [
        { id: 'e1', source: 'bat_1', sourceHandle: 'pos', target: 'socket_1', targetHandle: 'p1' },
      ],
    });

    const result = validateAndParseCircuitPayload(rawPayload);
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.payload.metadata.circuitTitle).toBe('Test Lab Circuit');
      expect(result.payload.nodes).toHaveLength(2);
      expect(result.payload.edges).toHaveLength(1);
    }
  });

  it('rejects malformed or empty payloads with clear error messages', () => {
    const emptyResult = validateAndParseCircuitPayload('');
    expect(emptyResult.isValid).toBe(false);

    const corruptJsonResult = validateAndParseCircuitPayload('{ corrupted json');
    expect(corruptJsonResult.isValid).toBe(false);

    const missingNodesResult = validateAndParseCircuitPayload(JSON.stringify({ edges: [] }));
    expect(missingNodesResult.isValid).toBe(false);
  });

  it('automatically migrates legacy directly wired bulbs into socket nodes', () => {
    const legacyPayload = JSON.stringify({
      nodes: [
        {
          id: 'legacy_bulb_1',
          type: 'bulb',
          position: { x: 200, y: 200 },
          data: { id: 'legacy_bulb_1', type: 'bulb', label: 'Bohlam Pijar', bulbType: 'incandescent', resistance: 800 },
        },
      ],
      edges: [
        { id: 'e_legacy', source: 'bat_1', target: 'legacy_bulb_1' },
      ],
    });

    const result = validateAndParseCircuitPayload(legacyPayload);
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      const migratedNode = result.payload.nodes.find((n) => n.id === 'legacy_bulb_1');
      expect(migratedNode?.type).toBe('socket');
      expect(migratedNode?.data.type).toBe('socket');
      expect(migratedNode?.data.installedBulb).toBeDefined();
    }
  });

  it('performs lossless URL hash encoding and decoding roundtrip', () => {
    const testNodes: Node<CircuitElementData>[] = [
      {
        id: 'bat_test',
        type: 'battery',
        position: { x: 50, y: 50 },
        data: { id: 'bat_test', type: 'battery', voltage: 1.5, label: 'AA Cell' },
      },
    ];
    const testEdges: Edge[] = [
      { id: 'edge_test', source: 'bat_test', target: 'target_test', sourceHandle: 'pos', targetHandle: 'p1' },
    ];

    const shareUrl = generateShareableUrl('My URL Circuit', testNodes, testEdges, 'lab');
    expect(shareUrl).toContain('#circuit=');

    const decoded = decodeShareableUrlHash(shareUrl);
    expect(decoded).not.toBeNull();
    expect(decoded?.isValid).toBe(true);
    if (decoded?.isValid) {
      expect(decoded.payload.metadata.circuitTitle).toBe('My URL Circuit');
      expect(decoded.payload.nodes[0].id).toBe('bat_test');
    }
  });
});
