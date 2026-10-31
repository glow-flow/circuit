/**
 * Type definitions for Mission and Challenge Mode.
 * Defines practical curriculum goals (SMP Kelas 9 IPA / Physics DC Circuits)
 * and criteria for topological and electrical simulation verification.
 */

import { Node, Edge } from 'reactflow';
import { CircuitElementData, SimulationResult } from './circuit';

export type MissionDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type MissionCategory = 'basic' | 'series_parallel' | 'safety' | 'renewable' | 'efficiency';

export interface MissionObjective {
  id: string;
  descriptionId: string;
  descriptionEn: string;
}

export interface MissionContext {
  nodes: Node<CircuitElementData>[];
  edges: Edge[];
  simulation: SimulationResult;
}

export interface MissionValidationResult {
  /** True when all mission pass criteria are strictly satisfied */
  isCompleted: boolean;
  /** Percentage completion (0 - 100) */
  progressPercent: number;
  /** Breakdown of each objective status */
  objectiveResults: {
    objectiveId: string;
    isSatisfied: boolean;
    feedbackText: string;
  }[];
  /** Global congratulatory or guidance feedback */
  feedbackMessage: string;
}

export interface MissionDefinition {
  id: string;
  titleId: string;
  titleEn: string;
  difficulty: MissionDifficulty;
  category: MissionCategory;
  estimatedMinutes: number;
  descriptionId: string;
  descriptionEn: string;
  learningObjectivesId: string[];
  learningObjectivesEn: string[];
  instructionsId: string[];
  instructionsEn: string[];
  hintsId: string[];
  hintsEn: string[];
  objectives: MissionObjective[];
  /** Optional starting starter circuit preset to bootstrap the challenge */
  starterCircuitName?: string;
  /**
   * Evaluates whether the current circuit graph and simulation results
   * fulfill the physics and topological requirements.
   * Time Complexity: O(N + E)
   */
  validate: (context: MissionContext) => MissionValidationResult;
}

export interface MissionRecord {
  missionId: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  bestScoreStars: number; // 0 to 3 stars
  completedAt?: number;
}
