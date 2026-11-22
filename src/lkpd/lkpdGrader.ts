import { Edge, Node } from 'reactflow';
import { MISSION_CATALOG } from '../missions/missionCatalog';
import { CircuitElementData, SimulationResult, WorldMode } from '../types/circuit';
import { getLkpdPacketByMissionId } from './lkpdCatalog';
import {
  LkpdCriterionScore,
  LkpdEvaluationResult,
  LkpdGradebookSummary,
  LkpdMissionId,
  LkpdSubmissionRecord,
} from './lkpdTypes';

/**
 * Computes a deterministic 8-hex local checksum (FNV-1a 32-bit) for student submission integrity checks.
 * This detects accidental typos or manual score edits in pasted tokens without claiming cryptographic signing.
 */
export function computeLocalVerificationCode(input: {
  lkpdCode: string;
  missionId: string;
  studentName: string;
  className: string;
  score: number;
  criteriaPassedIds: readonly string[];
  submittedAtIso: string;
}): string {
  const canonical = [
    input.lkpdCode.trim().toUpperCase(),
    input.missionId.trim(),
    input.studentName.trim().toLowerCase(),
    input.className.trim().toLowerCase(),
    String(Math.round(input.score)),
    [...input.criteriaPassedIds].sort().join(','),
    input.submittedAtIso.trim(),
  ].join('|');

  let hash = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i++) {
    hash ^= canonical.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `CS-${(hash >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
}

export function verifySubmissionIntegrity(record: LkpdSubmissionRecord): boolean {
  const expected = computeLocalVerificationCode({
    lkpdCode: record.lkpdCode,
    missionId: record.missionId,
    studentName: record.studentName,
    className: record.className,
    score: record.score,
    criteriaPassedIds: record.criteriaPassedIds,
    submittedAtIso: record.submittedAtIso,
  });
  return record.verificationCode === expected;
}

/**
 * Evaluates the live canvas circuit against an LKPD packet's 100-point rubric using the MNA mission validator.
 */
export function evaluateLkpdCircuit(params: {
  missionId: LkpdMissionId;
  nodes: Node<CircuitElementData>[];
  edges: Edge[];
  simulation: SimulationResult;
  worldMode: WorldMode;
}): LkpdEvaluationResult {
  const packet = getLkpdPacketByMissionId(params.missionId);
  const mission = MISSION_CATALOG.find((m) => m.id === params.missionId);

  if (!packet || !mission) {
    throw new Error(`Unknown LKPD mission id: ${params.missionId}`);
  }

  const validation = mission.validate({
    nodes: params.nodes,
    edges: params.edges,
    simulation: params.simulation,
  });

  const criteria: LkpdCriterionScore[] = packet.rubric.map((item) => {
    const result = validation.objectiveResults.find((r) => r.objectiveId === item.objectiveId);
    const isSatisfied = Boolean(result?.isSatisfied);
    return {
      objectiveId: item.objectiveId,
      weight: item.weight,
      earnedPoints: isSatisfied ? item.weight : 0,
      isSatisfied,
      feedbackText: result?.feedbackText ?? '',
    };
  });

  const maxScore = packet.rubric.reduce((sum, item) => sum + item.weight, 0);
  const rawScore = criteria.reduce((sum, item) => sum + item.earnedPoints, 0);
  const score = Math.min(maxScore, Math.max(0, Math.round(rawScore)));

  const visibleEdges = params.edges.filter((edge) => !edge.data?.isSnapWire);

  return {
    missionId: packet.missionId,
    lkpdCode: packet.lkpdCode,
    score,
    maxScore,
    passedKkm: score >= packet.kkmScore,
    isMissionCompleted: validation.isCompleted,
    criteria,
    feedbackMessage: validation.feedbackMessage,
    telemetry: {
      nodeCount: params.nodes.length,
      edgeCount: visibleEdges.length,
      totalPowerWatts: Number((params.simulation.totalPowerDrawn || 0).toFixed(2)),
      isShortCircuit: Boolean(params.simulation.isShortCircuit),
      worldMode: params.worldMode,
    },
  };
}

export function buildStudentSubmissionRecord(params: {
  evaluation: LkpdEvaluationResult;
  studentName: string;
  className: string;
  absentNumber?: string;
  teacherName?: string;
  reflections?: Record<string, string>;
  submittedAtIso?: string;
}): LkpdSubmissionRecord {
  const submittedAtIso = params.submittedAtIso ?? new Date().toISOString();
  const studentName = params.studentName.trim();
  const className = params.className.trim();
  const absentNumber = (params.absentNumber ?? '').trim();
  const teacherName = (params.teacherName ?? '').trim();

  const criteriaPassedIds = params.evaluation.criteria
    .filter((c) => c.isSatisfied)
    .map((c) => c.objectiveId);

  const sanitizedReflections: Record<string, string> = {};
  if (params.reflections) {
    for (const [key, value] of Object.entries(params.reflections)) {
      const trimmed = value.trim().slice(0, 320);
      if (trimmed) {
        sanitizedReflections[key] = trimmed;
      }
    }
  }

  const verificationCode = computeLocalVerificationCode({
    lkpdCode: params.evaluation.lkpdCode,
    missionId: params.evaluation.missionId,
    studentName,
    className,
    score: params.evaluation.score,
    criteriaPassedIds,
    submittedAtIso,
  });

  const slugName = studentName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20);

  return {
    version: 1,
    id: `${params.evaluation.lkpdCode}-${slugName || 'siswa'}-${verificationCode.slice(-4)}`,
    lkpdCode: params.evaluation.lkpdCode,
    missionId: params.evaluation.missionId,
    studentName,
    className,
    absentNumber,
    teacherName,
    score: params.evaluation.score,
    maxScore: params.evaluation.maxScore,
    passedKkm: params.evaluation.passedKkm,
    criteriaPassedIds,
    telemetry: params.evaluation.telemetry,
    reflections: sanitizedReflections,
    submittedAtIso,
    verificationCode,
    isIntegrityValid: true,
  };
}

export function computeGradebookSummary(
  records: readonly LkpdSubmissionRecord[]
): LkpdGradebookSummary {
  if (records.length === 0) {
    return {
      totalSubmissions: 0,
      averageScore: 0,
      passedCount: 0,
      passRatePercent: 0,
      highestScore: 0,
      lowestScore: 0,
    };
  }

  let total = 0;
  let passedCount = 0;
  let highestScore = -Infinity;
  let lowestScore = Infinity;

  for (const record of records) {
    total += record.score;
    if (record.passedKkm) passedCount += 1;
    if (record.score > highestScore) highestScore = record.score;
    if (record.score < lowestScore) lowestScore = record.score;
  }

  return {
    totalSubmissions: records.length,
    averageScore: Math.round((total / records.length) * 10) / 10,
    passedCount,
    passRatePercent: Math.round((passedCount / records.length) * 100),
    highestScore,
    lowestScore,
  };
}
