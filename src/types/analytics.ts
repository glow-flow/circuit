/**
 * Type definitions for the Live Oscilloscope and Electrical Analytics engine.
 * Supports multi-channel real-time waveform tracking, interval tuning, and CSV telemetry export.
 */

export interface OscilloscopeDataPoint {
  /** Milliseconds epoch timestamp of the measurement */
  timestamp: number;
  /** Relative seconds offset from recording start (for clean X-axis display) */
  timeSeconds: number;
  /** Terminal voltage in Volts (V) */
  voltage: number;
  /** Branch current in Amperes (A) */
  current: number;
  /** Dissipated or generated power in Watts (W) */
  power: number;
  /** Cumulative energy consumption in Watt-hours (Wh) */
  energyWattHours: number;
}

export type MeasurementChannelType = 'component' | 'global_power' | 'max_voltage';

export interface OscilloscopeChannel {
  /** Unique channel identifier, e.g. 'ch_1', 'ch_global' */
  id: string;
  /** Channel display name */
  name: string;
  /** Target component ID to observe, or null for circuit-wide telemetry */
  componentId: string | null;
  /** Visual waveform stroke color (CSS hex or RGB) */
  colorHex: string;
  /** Whether this channel is currently plotted on the oscilloscope */
  isEnabled: boolean;
  /** Ring buffer of captured data points (capped to MAX_BUFFER_SIZE) */
  history: OscilloscopeDataPoint[];
}

export interface OscilloscopeState {
  /** Whether real-time waveform capture is actively polling */
  isPaused: boolean;
  /** Sampling interval in milliseconds (e.g., 200ms, 500ms, 1000ms) */
  sampleIntervalMs: number;
  /** Time window in seconds shown horizontally across the scope screen */
  timeWindowSeconds: number;
  /** Selected component ID under active probe inspection */
  probedComponentId: string | null;
  /** Cumulative energy measured across the session in Watt-hours */
  cumulativeEnergyWh: number;
}
