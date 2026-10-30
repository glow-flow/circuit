/**
 * Circuit Sandbox Type Definitions
 * 
 * Strict typing for electrical components, simulation state,
 * MNA equations, and React Flow node extensions.
 */

import { BulbType } from '../constants/bulbCatalog';

export type ComponentType = 
  | 'battery'
  | 'battery9v'
  | 'battery-holder'
  | 'resistor'
  | 'bulb'
  | 'switch'
  | 'ground'
  | 'voltmeter'
  | 'ammeter'
  | 'socket'
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
  bulbType?: BulbType;         // For bulb carousel ('incandescent' | 'halogen' | 'edison' | 'cfl' | 'led_standard' | 'led_rgb' | 'led_green')
  voltage?: number;            // For battery / battery9v / battery-holder (Volts)
  internalResistance?: number; // Internal series resistance in Ohms (e.g., 2.0Ω for 9V battery)
  resistance?: number;         // For resistor, bulb, ammeter (Ohms)
  power?: number;              // Real-time or rated power for bulb (Watts)
  powerRating?: number;        // Max rated power for bulb (Watts)
  isOpen?: boolean;            // For switch
  hasBattery?: boolean;        // For battery-holder: whether AA battery is inserted
  batteryCount?: number;       // For battery-holder: number of 1.5V AA cells inserted (0, 1, or 2)
  bulbId?: string;             // For socket: id of the bulb currently screwed in
  socketId?: string;           // For bulb: id of the socket it is snapped into
  
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

/**
 * Optional variant choices made in the component palette at placement time
 * (e.g. which bulb model to place). Consumed by useCircuitStore.addComponent.
 */
export interface PlacementOptions {
  bulbType?: BulbType;
}
