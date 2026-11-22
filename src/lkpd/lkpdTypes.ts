export type LkpdMissionId =
  | 'parallel-3-bulbs'
  | 'resolve-short-circuit'
  | 'repair-reversed-led'
  | 'solar-grid-connection'
  | 'energy-efficiency-challenge';

export interface LkpdRubricCriterion {
  objectiveId: string;
  weight: number;
  labelId: string;
  labelEn: string;
}

export interface LkpdReflectionPrompt {
  id: string;
  questionId: string;
  questionEn: string;
  placeholderId: string;
  placeholderEn: string;
}

export interface LkpdPacketDefinition {
  lkpdCode: string;
  missionId: LkpdMissionId;
  order: number;
  fase: string;
  gradeLabelId: string;
  gradeLabelEn: string;
  shortLabelId: string;
  shortLabelEn: string;
  topicId: string;
  topicEn: string;
  capaianPembelajaranId: string;
  capaianPembelajaranEn: string;
  tujuanPembelajaranId: string[];
  tujuanPembelajaranEn: string[];
  p5DimensionsId: string[];
  p5DimensionsEn: string[];
  formulaHighlight: string;
  estimatedMinutes: number;
  kkmScore: number;
  rubric: LkpdRubricCriterion[];
  reflectionPrompts: LkpdReflectionPrompt[];
}

export interface LkpdAssignmentPayload {
  version: 1;
  missionId: LkpdMissionId;
  lkpdCode: string;
  className: string;
  teacherName: string;
  note: string;
  createdAtIso: string;
}

export interface LkpdCriterionScore {
  objectiveId: string;
  weight: number;
  earnedPoints: number;
  isSatisfied: boolean;
  feedbackText: string;
}

export interface LkpdTelemetrySnapshot {
  nodeCount: number;
  edgeCount: number;
  totalPowerWatts: number;
  isShortCircuit: boolean;
  worldMode: 'lab' | 'outside';
}

export interface LkpdEvaluationResult {
  missionId: LkpdMissionId;
  lkpdCode: string;
  score: number;
  maxScore: number;
  passedKkm: boolean;
  isMissionCompleted: boolean;
  criteria: LkpdCriterionScore[];
  feedbackMessage: string;
  telemetry: LkpdTelemetrySnapshot;
}

export interface LkpdSubmissionRecord {
  version: 1;
  id: string;
  lkpdCode: string;
  missionId: LkpdMissionId;
  studentName: string;
  className: string;
  absentNumber: string;
  teacherName: string;
  score: number;
  maxScore: number;
  passedKkm: boolean;
  criteriaPassedIds: string[];
  telemetry: LkpdTelemetrySnapshot;
  reflections: Record<string, string>;
  submittedAtIso: string;
  verificationCode: string;
  isIntegrityValid?: boolean;
}

export interface LkpdGradebookSummary {
  totalSubmissions: number;
  averageScore: number;
  passedCount: number;
  passRatePercent: number;
  highestScore: number;
  lowestScore: number;
}
