import { describe, expect, it } from 'vitest';
import { MISSION_CATALOG } from '../../missions/missionCatalog';
import { LKPD_CATALOG, getLkpdPacketByMissionId } from '../lkpdCatalog';
import {
  buildStudentSubmissionRecord,
  computeGradebookSummary,
  evaluateLkpdCircuit,
  verifySubmissionIntegrity,
} from '../lkpdGrader';
import { CircuitElementData, SimulationResult } from '../../types/circuit';
import { Node } from 'reactflow';

const EMPTY_SIM: SimulationResult = {
  nodeVoltages: {},
  branchCurrents: {},
  isShortCircuit: false,
  shortCircuitBranches: [],
  totalPowerDrawn: 0,
  timestamp: 0,
};

describe('LKPD 5-Packet Kurikulum Merdeka Catalog & Auto-Grader', () => {
  it('contains strictly 5 LKPD packets mapped 1-to-1 to the 5 existing missions', () => {
    expect(LKPD_CATALOG).toHaveLength(5);
    expect(MISSION_CATALOG).toHaveLength(5);

    const missionIds = MISSION_CATALOG.map((m) => m.id);
    const lkpdMissionIds = LKPD_CATALOG.map((p) => p.missionId);
    expect(lkpdMissionIds).toEqual(missionIds);

    expect(LKPD_CATALOG.map((p) => p.lkpdCode)).toEqual([
      'LKPD-01',
      'LKPD-02',
      'LKPD-03',
      'LKPD-04',
      'LKPD-05',
    ]);
  });

  it('guarantees every LKPD rubric sums strictly to 100 and matches exact mission objective IDs', () => {
    for (const packet of LKPD_CATALOG) {
      const mission = MISSION_CATALOG.find((m) => m.id === packet.missionId)!;
      const totalWeight = packet.rubric.reduce((sum, item) => sum + item.weight, 0);
      expect(totalWeight).toBe(100);

      const rubricObjectiveIds = packet.rubric.map((r) => r.objectiveId);
      const missionObjectiveIds = mission.objectives.map((o) => o.id);
      expect(rubricObjectiveIds).toEqual(missionObjectiveIds);

      expect(packet.reflectionPrompts).toHaveLength(2);
      expect(packet.topicId).not.toContain('—');
      expect(packet.topicEn).not.toContain('—');
      expect(packet.capaianPembelajaranId).not.toContain('—');
      expect(packet.capaianPembelajaranEn).not.toContain('—');
    }
  });

  it('auto-grades LKPD-01 (3 Parallel Bulbs) accurately for partial and complete circuits', () => {
    const partialNodes: Node<CircuitElementData>[] = [
      {
        id: 'b1',
        type: 'battery',
        position: { x: 0, y: 0 },
        data: { id: 'b1', type: 'battery', voltage: 3.0, label: 'Baterai' },
      },
      {
        id: 's1',
        type: 'socket',
        position: { x: 100, y: 0 },
        data: {
          id: 's1',
          type: 'socket',
          label: 'L1',
          installedBulb: 'incandescent',
          calculatedVoltage: 3.0,
        },
      },
    ];

    const partialEval = evaluateLkpdCircuit({
      missionId: 'parallel-3-bulbs',
      nodes: partialNodes,
      edges: [],
      simulation: { ...EMPTY_SIM, branchCurrents: { s1: 0.04 }, totalPowerDrawn: 0.12 },
      worldMode: 'lab',
    });

    expect(partialEval.score).toBe(25);
    expect(partialEval.passedKkm).toBe(false);
    expect(partialEval.isMissionCompleted).toBe(false);

    const completeNodes: Node<CircuitElementData>[] = [
      ...partialNodes,
      {
        id: 's2',
        type: 'socket',
        position: { x: 100, y: 80 },
        data: {
          id: 's2',
          type: 'socket',
          label: 'L2',
          installedBulb: 'incandescent',
          calculatedVoltage: 3.0,
        },
      },
      {
        id: 's3',
        type: 'socket',
        position: { x: 100, y: 160 },
        data: {
          id: 's3',
          type: 'socket',
          label: 'L3',
          installedBulb: 'incandescent',
          calculatedVoltage: 3.0,
        },
      },
    ];

    const fullEval = evaluateLkpdCircuit({
      missionId: 'parallel-3-bulbs',
      nodes: completeNodes,
      edges: [],
      simulation: {
        ...EMPTY_SIM,
        branchCurrents: { s1: 0.05, s2: 0.05, s3: 0.05 },
        totalPowerDrawn: 0.45,
      },
      worldMode: 'lab',
    });

    expect(fullEval.score).toBe(100);
    expect(fullEval.passedKkm).toBe(true);
    expect(fullEval.isMissionCompleted).toBe(true);
  });

  it('auto-grades LKPD-05 (Energy Efficiency) and verifies local submission integrity checksum', () => {
    const packet = getLkpdPacketByMissionId('energy-efficiency-challenge');
    expect(packet?.lkpdCode).toBe('LKPD-05');

    const ledNodes: Node<CircuitElementData>[] = [
      {
        id: 's1',
        type: 'socket',
        position: { x: 0, y: 0 },
        data: { id: 's1', type: 'socket', label: 'LED 1', installedBulb: 'led_standard' },
      },
      {
        id: 's2',
        type: 'socket',
        position: { x: 0, y: 60 },
        data: { id: 's2', type: 'socket', label: 'LED 2', installedBulb: 'led_rgb' },
      },
    ];

    const evaluation = evaluateLkpdCircuit({
      missionId: 'energy-efficiency-challenge',
      nodes: ledNodes,
      edges: [],
      simulation: {
        ...EMPTY_SIM,
        branchCurrents: { s1: 0.02, s2: 0.02 },
        totalPowerDrawn: 0.6,
      },
      worldMode: 'lab',
    });

    expect(evaluation.score).toBe(100);

    const record = buildStudentSubmissionRecord({
      evaluation,
      studentName: 'Kenzie Raka',
      className: 'IX-A',
      absentNumber: '14',
      reflections: { ref_1: 'LED hanya 0.6 W, jauh lebih hemat dari pijar.' },
      submittedAtIso: '2026-11-21T04:00:00.000Z',
    });

    expect(record.verificationCode).toMatch(/^CS-[0-9A-F]{8}$/);
    expect(verifySubmissionIntegrity(record)).toBe(true);

    const tampered = { ...record, score: 100, studentName: 'Nama Diubah' };
    expect(verifySubmissionIntegrity(tampered)).toBe(false);
  });

  it('computes honest zeroed gradebook summary when empty and accurate metrics when populated', () => {
    expect(computeGradebookSummary([])).toEqual({
      totalSubmissions: 0,
      averageScore: 0,
      passedCount: 0,
      passRatePercent: 0,
      highestScore: 0,
      lowestScore: 0,
    });

    const evalPass = evaluateLkpdCircuit({
      missionId: 'resolve-short-circuit',
      nodes: [
        {
          id: 's1',
          type: 'socket',
          position: { x: 0, y: 0 },
          data: { id: 's1', type: 'socket', label: 'L1' },
        },
      ],
      edges: [],
      simulation: { ...EMPTY_SIM, branchCurrents: { s1: 0.04 }, totalPowerDrawn: 0.36 },
      worldMode: 'lab',
    });
    const evalFail = evaluateLkpdCircuit({
      missionId: 'resolve-short-circuit',
      nodes: [],
      edges: [],
      simulation: { ...EMPTY_SIM, isShortCircuit: true },
      worldMode: 'lab',
    });

    const r1 = buildStudentSubmissionRecord({
      evaluation: evalPass,
      studentName: 'Siti',
      className: 'IX-A',
    });
    const r2 = buildStudentSubmissionRecord({
      evaluation: evalFail,
      studentName: 'Budi',
      className: 'IX-A',
    });

    const summary = computeGradebookSummary([r1, r2]);
    expect(summary).toEqual({
      totalSubmissions: 2,
      averageScore: 50,
      passedCount: 1,
      passRatePercent: 50,
      highestScore: 100,
      lowestScore: 0,
    });
  });
});
