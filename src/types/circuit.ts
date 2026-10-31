/**
 * Circuit Sandbox Type Definitions
 * 
 * Strict typing for electrical components, simulation state,
 * MNA equations, environmental modes, virtual transmission grid,
 * and React Flow node extensions.
 */

import { BulbType } from '../constants/bulbCatalog';

export type ComponentType = 
  | 'battery'
  | 'battery9v'
  | 'battery-holder'
  | 'solar-panel'
  | 'solar_panel'
  | 'transmission-tower'
  | 'transmission_tower'
  | 'wind-turbine'
  | 'wind_turbine'
  | 'resistor'
  | 'bulb'
  | 'switch'
  | 'ground'
  | 'voltmeter'
  | 'ammeter'
  | 'socket'
  | 'pin-socket'
  | 'socket-pin'
  | 'waypoint';

export type BatteryChargeState = 'idle' | 'charging' | 'discharging';

export type WorldMode = 'lab' | 'outside';

export type TerrainCellType = 'EMPTY' | 'DIRT' | 'WATER' | 'GRASS';

export type TerrainBrushTool = 'cursor' | 'DIRT' | 'WATER' | 'EMPTY';

export interface ExplosionEvent {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  reason?: 'water' | 'height';
  createdAt: number;
}

export interface ComponentPin {
  id: string; // e.g., 'pos', 'neg', 'p1', 'p2'
  label: string;
  type: 'source' | 'target' | 'bidirectional';
  nodeId?: string; // Resolved electrical net ID during simulation
}

export interface InstalledBulbData {
  id: string;
  bulbType: BulbType;
  resistance?: number;
  powerRating?: number;
  power?: number;
  isBlown?: boolean;
  label?: string;
}

export interface CircuitElementData {
  id: string;
  type: ComponentType;
  label: string;
  // Electrical properties
  bulbType?: BulbType;         // For bulb carousel ('incandescent' | 'halogen' | 'edison' | 'cfl' | 'led_standard' | 'led_rgb' | 'led_green')
  voltage?: number;            // For battery / battery9v / battery-holder / solar-panel / wind-turbine (Volts)
  internalResistance?: number; // Internal series resistance in Ohms (e.g., 2.0Ω for 9V battery, 0.2Ω for solar/wind)
  resistance?: number;         // For resistor, bulb, ammeter (Ohms)
  power?: number;              // Real-time or rated power for bulb (Watts)
  powerRating?: number;        // Max rated power for bulb (Watts)
  isOpen?: boolean;            // For switch
  hasBattery?: boolean;        // For battery-holder: whether AA battery is inserted
  batteryCount?: number;       // For battery-holder: number of 1.5V AA cells inserted (0, 1, or 2)
  bulbId?: string;             // For socket: id of the bulb currently screwed in
  socketId?: string;           // For bulb: id of the socket it is snapped into
  installedBulb?: InstalledBulbData | BulbType | null; // For socket: bulb installed in this socket

  // Battery State of Charge (SoC) properties
  currentCharge?: number;      // State of Charge in percentage (0 - 100, default 100)
  capacity?: number;           // Battery capacity in milliampere-hours (mAh, e.g. 1000 for AA, 500 for 9V)
  chargeState?: BatteryChargeState; // Current dynamic charge state ('idle' | 'charging' | 'discharging')

  // World & sunlight state for outdoor/lab components
  worldMode?: WorldMode;
  sunlight?: number;           // Solar irradiance percentage (0 - 100, default 100 -> 12V)

  // Wind Turbine properties
  speed?: number;              // Wind turbine rotational speed (0 - 100, default 50)

  // Transmission Tower & Lab Distribution Panel (MCB + Step-Down) properties
  towerConnectedCount?: number; // Total number of active transmission nodes sharing this virtual grid bus
  isMcbOn?: boolean;            // For Lab Distribution Panel: whether the MCB breaker switch is ON (default true)
  isMcbTripped?: boolean;       // For Lab Distribution Panel: whether the MCB tripped automatically due to short circuit
  stepDownVoltage?: number | null; // Regulated DC output ceiling in Volts (null = Auto/Direct, or 3, 6, 9, 12 V)

  // Real-world semiconductor protection & polarity states
  isBlockingDiodeActive?: boolean; // True when a Solar Panel or Wind Turbine's internal Schottky diode blocks reverse current
  isReverseBiased?: boolean;       // True when an LED bulb in a socket is wired with reversed polarity (V_p1 < V_p2)
  
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
  blockedGeneratorIds?: string[];          // Renewable generators whose blocking diode prevented reverse current
  reverseBiasedBranches?: string[];        // LED socket IDs wired with reversed polarity (Anode < Cathode)
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
