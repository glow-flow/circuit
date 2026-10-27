/**
 * Circuit Sandbox Type Definitions
 * 
 * Strict typing for electrical components, simulation state,
 * MNA equations, and React Flow node extensions.
 */

export type ComponentType = 
  | 'battery'
  | 'resistor'
  | 'bulb'
  | 'switch'
  | 'ground'
  | 'voltmeter'
  | 'ammeter'
  | 'waypoint';

export interface ComponentPin {
  id: string; // e.g., 'pos', 'neg', 'p1', 'p2'
  label: string;
  type: 'source' | 'target' | 'bidirectional';
  nodeId?: string; // Resolved electrical net ID during simulation
}

export interface CircuitElementData {
  id: string;
  type: ComponentType;
  label: string;
  // Electrical properties
  voltage?: number;       // For battery (Volts)
  resistance?: number;    // For resistor, bulb, ammeter (Ohms)
  powerRating?: number;   // For bulb (Watts)
  isOpen?: boolean;       // For switch
  
  // Real-time calculated simulation results
  calculatedVoltage?: number;  // Voltage drop across component (V)
  calculatedCurrent?: number;  // Current flowing through component (A)
  calculatedPower?: number;    // Dissipated power (W)
  isBlown?: boolean;           // Bulb blown due to overcurrent/overpower
  isShortCircuit?: boolean;    // Element in a shorted path
  burnout?: boolean;           // Resistor or battery damaged
}

export interface WireConnection {
  id: string;
  source: string;        // Component ID
  sourceHandle: string;  // Pin ID ('pos', 'neg', etc.)
  target: string;        // Component ID
  targetHandle: string;  // Pin ID
  // Simulation properties
  current?: number;      // Current flowing through the wire (A)
  voltage?: number;      // Potential of this wire net (V)
  isShortCircuit?: boolean;
}

export interface SimulationResult {
  nodeVoltages: Record<string, number>;    // Electrical net ID -> potential in Volts
  branchCurrents: Record<string, number>;  // Component ID -> current in Amperes
  isShortCircuit: boolean;
  shortCircuitBranches: string[];
  totalPowerDrawn: number;                 // Total active power in Watts
  errorMessage?: string;
  timestamp: number;
}

export interface PresetCircuit {
  id: string;
  name: string;
  description: string;
  nodes: any[];
  edges: any[];
}
