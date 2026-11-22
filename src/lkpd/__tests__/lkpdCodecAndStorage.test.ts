import { describe, expect, it } from 'vitest';
import { LKPD_CATALOG } from '../lkpdCatalog';
import {
  buildPrintableLkpdHtml,
  decodeLkpdAssignmentHash,
  decodeSubmissionInput,
  encodeLkpdAssignmentUrl,
  encodeSubmissionToken,
  encodeSubmissionUrl,
  escapeHtml,
  extractSubmissionTokenFromHash,
  generateGradebookCsv,
  parseBatchSubmissionInput,
} from '../lkpdCodec';
import { buildStudentSubmissionRecord, evaluateLkpdCircuit } from '../lkpdGrader';
import {
  loadGradebookRecords,
  mergeGradebookRecords,
  saveGradebookRecords,
} from '../lkpdGradebookStorage';
import { LkpdAssignmentPayload } from '../lkpdTypes';

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

describe('LKPD Zero-Backend Codec, Batch Parser, CSV Export & Local Storage', () => {
  it('performs lossless roundtrip for teacher #lkpd= assignment URLs including Unicode text', () => {
    const payload: LkpdAssignmentPayload = {
      version: 1,
      missionId: 'solar-grid-connection',
      lkpdCode: 'LKPD-04',
      className: 'IX-C',
      teacherName: 'Ibu Sari, S.Pd.',
      note: 'Kumpulkan sebelum istirahat kedua',
      createdAtIso: '2026-11-21',
    };

    const url = encodeLkpdAssignmentUrl(payload, 'https://circuit.example.id/');
    expect(url).toContain('https://circuit.example.id/#lkpd=');

    const decoded = decodeLkpdAssignmentHash(url);
    expect(decoded?.isValid).toBe(true);
    if (decoded?.isValid) {
      expect(decoded.payload).toEqual(payload);
    }

    const broken = decodeLkpdAssignmentHash('#lkpd=not-valid-base64!!!');
    expect(broken?.isValid).toBe(false);
  });

  it('encodes and decodes student submission tokens, #lkpd-sub= URLs, and multi-line chat batches', () => {
    const evalRes = evaluateLkpdCircuit({
      missionId: 'resolve-short-circuit',
      nodes: [
        {
          id: 's1',
          type: 'socket',
          position: { x: 0, y: 0 },
          data: { id: 's1', type: 'socket', label: 'Lampu Lab' },
        },
      ],
      edges: [],
      simulation: {
        nodeVoltages: {},
        branchCurrents: { s1: 0.05 },
        isShortCircuit: false,
        shortCircuitBranches: [],
        totalPowerDrawn: 0.45,
        timestamp: 0,
      },
      worldMode: 'lab',
    });

    const record = buildStudentSubmissionRecord({
      evaluation: evalRes,
      studentName: 'Alya Putri',
      className: 'IX-B',
      absentNumber: '03',
      reflections: {
        ref_1: 'Arus memilih jalur pintas nol ohm.',
        ref_2: 'MCB memutus arus agar kabel tidak terbakar.',
      },
      submittedAtIso: '2026-11-21T04:15:00.000Z',
    });

    const token = encodeSubmissionToken(record);
    const url = encodeSubmissionUrl(record, 'https://circuit.example.id/');
    expect(extractSubmissionTokenFromHash(url)).toBe(token);

    const singleDecoded = decodeSubmissionInput(token);
    expect(singleDecoded.isValid).toBe(true);
    if (singleDecoded.isValid) {
      expect(singleDecoded.record.studentName).toBe('Alya Putri');
      expect(singleDecoded.record.score).toBe(100);
      expect(singleDecoded.record.isIntegrityValid).toBe(true);
      expect(singleDecoded.record.reflections.ref_2).toContain('MCB');
    }

    const batchText = [
      `[09:14] Alya IX-B: ${token}`,
      'Baris rusak yang bukan kode valid',
      `Link langsung: ${url}`,
    ].join('\n');

    const batchResult = parseBatchSubmissionInput(batchText);
    expect(batchResult.validRecords).toHaveLength(2);
    expect(batchResult.errors).toHaveLength(1);
    expect(batchResult.errors[0].line).toBe(2);
  });

  it('neutralizes spreadsheet formula injection in CSV export and escapes HTML in print templates', () => {
    const evalRes = evaluateLkpdCircuit({
      missionId: 'repair-reversed-led',
      nodes: [],
      edges: [],
      simulation: {
        nodeVoltages: {},
        branchCurrents: {},
        isShortCircuit: false,
        shortCircuitBranches: [],
        reverseBiasedBranches: ['led1'],
        totalPowerDrawn: 0,
        timestamp: 0,
      },
      worldMode: 'lab',
    });

    const record = buildStudentSubmissionRecord({
      evaluation: evalRes,
      studentName: '=CMD("calc")',
      className: 'IX-A',
      reflections: { ref_1: '+SUM(A1:A2), "kutip"' },
      submittedAtIso: '2026-11-21T04:20:00.000Z',
    });

    const csv = generateGradebookCsv([record], 'id');
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain(`"'=CMD(""calc"")"`);
    expect(csv).toContain(`"'+SUM(A1:A2), ""kutip"""`);

    const safeHtml = buildPrintableLkpdHtml({
      packet: LKPD_CATALOG[0],
      className: '<script>alert(1)</script>',
      teacherName: 'Pak "Budi" & Tim',
      note: 'Uji cetak aman',
      language: 'id',
    });

    expect(safeHtml).not.toContain('<script>alert(1)</script>');
    expect(safeHtml).toContain(escapeHtml('<script>alert(1)</script>'));
    expect(safeHtml).toContain('LKPD-01');
  });

  it('merges duplicate student submissions cleanly and persists gradebook defensively', () => {
    const storage = createMemoryStorage();
    const evalLow = evaluateLkpdCircuit({
      missionId: 'parallel-3-bulbs',
      nodes: [],
      edges: [],
      simulation: {
        nodeVoltages: {},
        branchCurrents: {},
        isShortCircuit: false,
        shortCircuitBranches: [],
        totalPowerDrawn: 0,
        timestamp: 0,
      },
      worldMode: 'lab',
    });

    const attempt1 = buildStudentSubmissionRecord({
      evaluation: evalLow,
      studentName: 'Raka',
      className: 'IX-A',
      submittedAtIso: '2026-11-21T03:00:00.000Z',
    });
    const attempt2 = {
      ...attempt1,
      score: 100,
      passedKkm: true,
      submittedAtIso: '2026-11-21T04:00:00.000Z',
    };

    const firstMerge = mergeGradebookRecords([], [attempt1]);
    expect(firstMerge.addedCount).toBe(1);
    expect(firstMerge.updatedCount).toBe(0);

    const secondMerge = mergeGradebookRecords(firstMerge.merged, [attempt2]);
    expect(secondMerge.merged).toHaveLength(1);
    expect(secondMerge.addedCount).toBe(0);
    expect(secondMerge.updatedCount).toBe(1);
    expect(secondMerge.merged[0].score).toBe(100);

    expect(saveGradebookRecords(secondMerge.merged, storage)).toBe(true);
    const loaded = loadGradebookRecords(storage);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].studentName).toBe('Raka');
  });
});
