/**
 * Type definitions for Fault Injection & Electrical Troubleshooting Lab.
 * Defines realistic fault scenarios, symptoms, 3-stage progressive hints,
 * scoring algorithms, and topological/MNA physical validation criteria.
 */

import { Node, Edge } from 'reactflow';
import { CircuitElementData, SimulationResult } from './circuit';

export type FaultDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type FaultCategory =
  | 'open_circuit'
  | 'short_circuit'
  | 'polarity'
  | 'component_value'
  | 'protection_trip'
  | 'renewable_failure';

export interface ProgressiveHint {
  stage: 1 | 2 | 3;
  textId: string;
  textEn: string;
  scorePenalty: number;
}

export interface FaultValidationContext {
  nodes: Node<CircuitElementData>[];
  edges: Edge[];
  simulation: SimulationResult;
}

export interface FaultValidationResult {
  isRepaired: boolean;
  topologyCorrect: boolean;
  simulationConverged: boolean;
  measurementsSatisfied: boolean;
  feedbackMessageId: string;
  feedbackMessageEn: string;
}

export interface TroubleshootingScenario {
  id: string;
  titleId: string;
  titleEn: string;
  difficulty: FaultDifficulty;
  category: FaultCategory;
  estimatedMinutes: number;
  symptomsId: string[];
  symptomsEn: string[];
  expectedBehaviorId: string;
  expectedBehaviorEn: string;
  hints: [ProgressiveHint, ProgressiveHint, ProgressiveHint];
  starterCircuit: {
    nodes: Node<CircuitElementData>[];
    edges: Edge[];
  };
  targetWorldMode?: 'lab' | 'outside';
  validateRepair: (context: FaultValidationContext) => FaultValidationResult;
}

export interface TroubleshootingScoreResult {
  baseScore: number;
  hintPenalty: number;
  timePenalty: number;
  finalScore: number;
  stars: 1 | 2 | 3;
  durationSeconds: number;
}

export interface TroubleshootingRunRecord {
  scenarioId: string;
  completedAt: number;
  score: number;
  stars: number;
  hintsUsedCount: number;
  durationSeconds: number;
}

export interface TroubleshootingProgress {
  schemaVersion: string;
  totalRepairsCompleted: number;
  bestScores: Record<string, TroubleshootingRunRecord>;
}
