/**
 * CIRCUIT 4.0 - Explainable Circuit Tutor Type Definitions
 *
 * Provides type contracts for:
 * - Deterministic topological classification
 * - Diagnosed electrical phenomena
 * - Step-by-step mathematical derivations with real circuit telemetry
 * - Interactive What-If hypothetical exploration
 */

export type CircuitTopologyType =
  | 'empty'
  | 'open_circuit'
  | 'dead_short'
  | 'series_loop'
  | 'parallel_branches'
  | 'series_parallel_hybrid'
  | 'complex_multisource';

export type ElectricalPhenomenonCategory =
  | 'short_circuit'
  | 'mcb_tripped'
  | 'bulb_unlit'
  | 'bulb_dim'
  | 'bulb_blown'
  | 'reverse_biased_led'
  | 'rapid_battery_drain'
  | 'low_solar_yield'
  | 'normal_operation';

export interface DiagnosedPhenomenon {
  readonly id: string;
  readonly category: ElectricalPhenomenonCategory;
  readonly titleId: string;
  readonly titleEn: string;
  readonly explanationId: string;
  readonly explanationEn: string;
  readonly severity: 'critical' | 'warning' | 'info' | 'success';
  readonly affectedComponentIds: string[];
}

export interface MathematicalDerivationStep {
  readonly stepNumber: number;
  readonly titleId: string;
  readonly titleEn: string;
  readonly lawOrTheorem: string; // e.g. "Hukum Ohm (V = I * R)", "Hukum Kirchhoff Tegangan (KVL)"
  readonly formulaLatex: string;
  readonly calculationDescriptionId: string;
  readonly calculationDescriptionEn: string;
  readonly substitutedFormula: string; // Real numbers substituted, e.g. "I = 9.0V / 300.0Ω = 0.030 A (30.0 mA)"
  readonly verifiedResult: string;
  readonly relevantComponentIds: string[];
}

export interface WhatIfPrediction {
  readonly id: string;
  readonly titleId: string;
  readonly titleEn: string;
  readonly hypothesisId: string;
  readonly hypothesisEn: string;
  readonly predictedOutcomeId: string;
  readonly predictedOutcomeEn: string;
  readonly mathematicalProof: string;
}

export interface ExplainableCircuitAnalysis {
  readonly topologyType: CircuitTopologyType;
  readonly summaryId: string;
  readonly summaryEn: string;
  readonly totalSourcesVoltage: number;
  readonly equivalentResistanceOhms: number;
  readonly totalLoopCurrentAmps: number;
  readonly totalPowerWatts: number;
  readonly isConverged: boolean;
  readonly phenomena: DiagnosedPhenomenon[];
  readonly derivationSteps: MathematicalDerivationStep[];
  readonly whatIfPredictions: WhatIfPrediction[];
}
