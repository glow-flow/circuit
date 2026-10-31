/**
 * Type definitions for Workspace Management, File Persistence (.circuit),
 * and Classroom Sharing (URL hash + QR Code).
 */

import { Node, Edge } from 'reactflow';
import { CircuitElementData, WorldMode } from './circuit';

export const CURRENT_CIRCUIT_SCHEMA_VERSION = '1.0.0' as const;

export interface CircuitFileMetadata {
  /** Application generator stamp */
  appName: 'Circuit Sandbox';
  /** File schema semver */
  schemaVersion: typeof CURRENT_CIRCUIT_SCHEMA_VERSION;
  /** ISO string of file export timestamp */
  exportedAt: string;
  /** Human-readable circuit title */
  circuitTitle: string;
  /** Circuit description / instructions */
  description?: string;
  /** Author name / school attribution */
  author?: string;
  /** Circuit environment mode */
  worldMode: WorldMode;
}

export interface CircuitExportPayload {
  metadata: CircuitFileMetadata;
  nodes: Node<CircuitElementData>[];
  edges: Edge[];
}

export interface WorkspaceValidationSuccess {
  isValid: true;
  payload: CircuitExportPayload;
}

export interface WorkspaceValidationFailure {
  isValid: false;
  errorMessage: string;
}

export type WorkspaceValidationResult = WorkspaceValidationSuccess | WorkspaceValidationFailure;
