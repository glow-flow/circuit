import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Download,
  X,
  Sliders,
  Zap,
  Gauge,
  Flame,
} from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { OscilloscopeDataPoint } from '../../../types/analytics';

interface OscilloscopeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_HISTORY_POINTS = 60;

/**
 * Live Oscilloscope and Multi-Channel Electrical Analytics Modal.
 * Provides real-time vector waveform strip charts, interval adjustments,
 * energy accumulation (Wh/kWh), and CSV telemetry export.
 *
 * Integrated 100% with the existing MNA simulation engine.
 * Time Complexity: O(H) where H is the fixed history buffer size (<= 60 points).
 */
export const OscilloscopeModal: React.FC<OscilloscopeModalProps> = ({ isOpen, onClose }) => {
  const nodes = useCircuitStore((state) => state.nodes);
  const simulation = useCircuitStore((state) => state.simulation);
  const selectedNodeId = useCircuitStore((state) => state.selectedNodeId);
  const language = useCircuitStore((state) => state.language);

  const isId = language === 'id';

  // Target component under active probe inspection
  const [probedNodeId, setProbedNodeId] = useState<string | null>(selectedNodeId);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [sampleIntervalMs, setSampleIntervalMs] = useState<number>(500);
  const [history, setHistory] = useState<OscilloscopeDataPoint[]>([]);
  const [activeSignal, setActiveSignal] = useState<'all' | 'voltage' | 'current' | 'power'>('all');

  const cumulativeEnergyWhRef = useRef<number>(0);
  const sessionStartEpochRef = useRef<number>(Date.now());
  const lastSampleEpochRef = useRef<number>(Date.now());

  // Automatically sync with selected node on open
  useEffect(() => {
    if (selectedNodeId && nodes.some((n) => n.id === selectedNodeId)) {
      setProbedNodeId(selectedNodeId);
    } else if (!probedNodeId && nodes.length > 0) {
      setProbedNodeId(nodes[0].id);
    }
  }, [selectedNodeId, nodes, probedNodeId]);

  // Periodic sampling interval loop
  useEffect(() => {
    if (!isOpen || isPaused) return;

    const intervalTimer = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = Math.max(0.05, (now - lastSampleEpochRef.current) / 1000);
      lastSampleEpochRef.current = now;

      const probedNode = nodes.find((n) => n.id === probedNodeId);

      let voltage = 0;
      let current = 0;
      let power = 0;

      if (probedNode) {
        // Derive strictly from MNA solver results and node telemetry
        current = Math.abs(simulation.branchCurrents[probedNode.id] ?? 0);
        voltage = Math.abs(probedNode.data.calculatedVoltage ?? (probedNode.data.voltage ?? 0));
        power = probedNode.data.calculatedPower ?? voltage * current;
      } else {
        // Circuit-wide global telemetry fallback
        power = simulation.totalPowerDrawn;
        voltage = Math.max(0, ...Object.values(simulation.nodeVoltages));
        current = voltage > 0 ? power / voltage : 0;
      }

      // Energy accumulation in Watt-hours: E = P * (t / 3600)
      const energyIncrementWh = (power * deltaSeconds) / 3600;
      cumulativeEnergyWhRef.current += energyIncrementWh;

      const relativeSeconds = (now - sessionStartEpochRef.current) / 1000;

      const newPoint: OscilloscopeDataPoint = {
        timestamp: now,
        timeSeconds: relativeSeconds,
        voltage,
        current,
        power,
        energyWattHours: cumulativeEnergyWhRef.current,
      };

      setHistory((prevHistory) => {
        const next = [...prevHistory, newPoint];
        if (next.length > MAX_HISTORY_POINTS) {
          return next.slice(next.length - MAX_HISTORY_POINTS);
        }
        return next;
      });
    }, sampleIntervalMs);

    return () => clearInterval(intervalTimer);
  }, [isOpen, isPaused, sampleIntervalMs, probedNodeId, nodes, simulation]);

  // Derive latest readings
  const latestPoint = history[history.length - 1] ?? {
    voltage: 0,
    current: 0,
    power: 0,
    energyWattHours: 0,
  };

  const probedNode = nodes.find((n) => n.id === probedNodeId);

  // SVG Waveform Plotting Path generation
  const chartDimensions = { width: 600, height: 200, padding: 30 };
  const plotWidth = chartDimensions.width - chartDimensions.padding * 2;
  const plotHeight = chartDimensions.height - chartDimensions.padding * 2;

  const { voltagePath, currentPath, powerPath, maxV, maxI, maxP } = useMemo(() => {
    if (history.length < 2) {
      return {
        voltagePath: '',
        currentPath: '',
        powerPath: '',
        maxV: 10,
        maxI: 2,
        maxP: 20,
      };
    }

    const maxObservedV = Math.max(1, ...history.map((p) => p.voltage));
    const maxObservedI = Math.max(0.1, ...history.map((p) => p.current));
    const maxObservedP = Math.max(1, ...history.map((p) => p.power));

    // Pad scales by 15% for visual headroom
    const peakV = maxObservedV * 1.15;
    const peakI = maxObservedI * 1.15;
    const peakP = maxObservedP * 1.15;

    const count = history.length;
    const stepX = plotWidth / (MAX_HISTORY_POINTS - 1);

    const vPoints = history.map((pt, idx) => {
      const x = chartDimensions.padding + (MAX_HISTORY_POINTS - count + idx) * stepX;
      const y = chartDimensions.padding + plotHeight - (pt.voltage / peakV) * plotHeight;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    });

    const iPoints = history.map((pt, idx) => {
      const x = chartDimensions.padding + (MAX_HISTORY_POINTS - count + idx) * stepX;
      const y = chartDimensions.padding + plotHeight - (pt.current / peakI) * plotHeight;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    });

    const pPoints = history.map((pt, idx) => {
      const x = chartDimensions.padding + (MAX_HISTORY_POINTS - count + idx) * stepX;
      const y = chartDimensions.padding + plotHeight - (pt.power / peakP) * plotHeight;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    });

    return {
      voltagePath: vPoints.join(' '),
      currentPath: iPoints.join(' '),
      powerPath: pPoints.join(' '),
      maxV: peakV,
      maxI: peakI,
      maxP: peakP,
    };
  }, [history, plotWidth, plotHeight, chartDimensions.padding]);

  if (!isOpen) return null;

  const handleClearHistory = () => {
    setHistory([]);
    cumulativeEnergyWhRef.current = 0;
    sessionStartEpochRef.current = Date.now();
    lastSampleEpochRef.current = Date.now();
  };

  const handleExportCsv = () => {
    if (history.length === 0) return;

    const headers = 'Timestamp,RelativeSeconds,Voltage_V,Current_A,Power_W,Energy_Wh\n';
    const rows = history
      .map(
        (p) =>
          `${new Date(p.timestamp).toISOString()},${p.timeSeconds.toFixed(2)},${p.voltage.toFixed(4)},${p.current.toFixed(4)},${p.power.toFixed(4)},${p.energyWattHours.toFixed(6)}`
      )
      .join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute(
      'download',
      `circuit_oscilloscope_${probedNode?.data.label || 'global'}_${Date.now()}.csv`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Oskiloskop & Analitik Listrik"
    >
      <div className="w-full max-w-3xl max-h-[92dvh] rounded-2xl bg-void-900 border border-white/15 shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-void-850 shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                <span>{isId ? 'Oskiloskop & Analitik Listrik Real-Time' : 'Live Oscilloscope & Analytics'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-electric-500/10 text-electric-400 border border-electric-500/20">
                  {sampleIntervalMs}ms
                </span>
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">
                {isId
                  ? 'Pantau dinamika gelombang tegangan, arus, dan disipasi daya terintegrasi MNA'
                  : 'Monitor real-time voltage, current, and dissipated power waveforms'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={history.length === 0}
              className="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold bg-void-900 hover:bg-white/5 disabled:opacity-40 text-slate-300 border border-white/10 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="Ekspor data CSV"
            >
              <Download className="w-4 h-4 text-electric-400" />
              <span className="hidden sm:inline">{isId ? 'Ekspor CSV' : 'Export CSV'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-void-900 text-slate-400 hover:text-white border border-white/10 active:scale-95 transition-all cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Oscilloscope Control & Target Bar */}
        <div className="p-4 border-b border-white/10 bg-void-950/60 flex flex-wrap items-center justify-between gap-3 shrink-0 select-none">
          {/* Target Component Selector */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Sliders className="w-4 h-4 text-electric-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-300 shrink-0">
              {isId ? 'Target Probe:' : 'Probe Channel:'}
            </span>
            <select
              value={probedNodeId ?? ''}
              onChange={(e) => setProbedNodeId(e.target.value || null)}
              className="flex-1 min-w-[160px] max-w-xs px-3 py-1.5 rounded-xl bg-void-900 border border-white/10 text-xs text-slate-200 focus:outline-none cursor-pointer truncate"
            >
              <option value="">{isId ? 'Total Rangkaian (Global)' : 'Global Circuit Total'}</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.data.label} ({node.data.type})
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons (Play/Pause, Interval, Clear) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Interval selector */}
            <select
              value={sampleIntervalMs}
              onChange={(e) => setSampleIntervalMs(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-xl bg-void-900 border border-white/10 text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value={100}>100 ms (Fast)</option>
              <option value={250}>250 ms</option>
              <option value={500}>500 ms (Normal)</option>
              <option value={1000}>1000 ms (1s)</option>
            </select>

            {/* Play / Pause Toggle */}
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                isPaused
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-void-950 shadow-glow'
                  : 'bg-amber-500 hover:bg-amber-400 text-void-950 shadow-glow'
              }`}
            >
              {isPaused ? <Play className="w-4 h-4 fill-void-950" /> : <Pause className="w-4 h-4 fill-void-950" />}
              <span>{isPaused ? (isId ? 'Lanjutkan' : 'Resume') : isId ? 'Jeda' : 'Pause'}</span>
            </button>

            {/* Clear History */}
            <button
              type="button"
              onClick={handleClearHistory}
              title={isId ? 'Bersihkan riwayat data' : 'Clear data buffer'}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-void-900 hover:bg-white/5 text-slate-400 hover:text-white border border-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Telemetry Gauges Ribbon */}
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-void-950/40 border-b border-white/5 shrink-0 select-none">
          {/* Voltage */}
          <div className="p-3 rounded-xl bg-void-900/80 border border-sky-500/20">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-sans">
              <span>{isId ? 'Tegangan (V)' : 'Voltage (V)'}</span>
              <Zap className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-sky-300 mt-1">
              {latestPoint.voltage.toFixed(2)} <span className="text-xs text-sky-400 font-sans">V</span>
            </div>
          </div>

          {/* Current */}
          <div className="p-3 rounded-xl bg-void-900/80 border border-amber-500/20">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-sans">
              <span>{isId ? 'Kuat Arus (I)' : 'Current (I)'}</span>
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-amber-300 mt-1">
              {latestPoint.current < 1
                ? `${(latestPoint.current * 1000).toFixed(1)} mA`
                : `${latestPoint.current.toFixed(3)} A`}
            </div>
          </div>

          {/* Power */}
          <div className="p-3 rounded-xl bg-void-900/80 border border-emerald-500/20">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-sans">
              <span>{isId ? 'Daya Aktif (P)' : 'Active Power'}</span>
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-emerald-300 mt-1">
              {latestPoint.power.toFixed(2)} <span className="text-xs text-emerald-400 font-sans">W</span>
            </div>
          </div>

          {/* Energy */}
          <div className="p-3 rounded-xl bg-void-900/80 border border-purple-500/20">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-sans">
              <span>{isId ? 'Energi Kumulatif' : 'Energy (Wh)'}</span>
              <Activity className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-purple-300 mt-1">
              {latestPoint.energyWattHours < 1
                ? `${(latestPoint.energyWattHours * 1000).toFixed(1)} mWh`
                : `${latestPoint.energyWattHours.toFixed(4)} Wh`}
            </div>
          </div>
        </div>

        {/* Vector SVG Oscilloscope Waveform Display */}
        <div className="p-4 flex-1 flex flex-col justify-center bg-void-950 overflow-hidden relative">
          {/* Signal Channel Filter Chips */}
          <div className="absolute top-3 left-4 z-10 flex items-center gap-1.5 text-[10px] font-mono select-none">
            <button
              type="button"
              onClick={() => setActiveSignal('all')}
              className={`px-2 py-0.5 rounded-full border transition-all ${
                activeSignal === 'all'
                  ? 'bg-white/10 border-white text-white font-bold'
                  : 'bg-void-900 border-white/10 text-slate-400'
              }`}
            >
              ALL
            </button>
            <button
              type="button"
              onClick={() => setActiveSignal('voltage')}
              className={`px-2 py-0.5 rounded-full border transition-all ${
                activeSignal === 'voltage'
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
                  : 'bg-void-900 border-white/10 text-sky-400'
              }`}
            >
              V (Peak {maxV.toFixed(1)}V)
            </button>
            <button
              type="button"
              onClick={() => setActiveSignal('current')}
              className={`px-2 py-0.5 rounded-full border transition-all ${
                activeSignal === 'current'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                  : 'bg-void-900 border-white/10 text-amber-400'
              }`}
            >
              I (Peak {maxI.toFixed(2)}A)
            </button>
            <button
              type="button"
              onClick={() => setActiveSignal('power')}
              className={`px-2 py-0.5 rounded-full border transition-all ${
                activeSignal === 'power'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                  : 'bg-void-900 border-white/10 text-emerald-400'
              }`}
            >
              P (Peak {maxP.toFixed(1)}W)
            </button>
          </div>

          {/* SVG Waveform Screen */}
          <div className="w-full h-56 sm:h-64 rounded-xl bg-void-950 border border-white/10 shadow-inner relative overflow-hidden flex items-center justify-center">
            {history.length < 2 ? (
              <div className="text-center text-xs text-slate-500 font-mono">
                {isId ? 'Menunggu sampel data berikutnya...' : 'Waiting for telemetry samples...'}
              </div>
            ) : (
              <svg viewBox={`0 0 ${chartDimensions.width} ${chartDimensions.height}`} className="w-full h-full">
                {/* Horizontal & Vertical Oscilloscope Grids */}
                {[0.25, 0.5, 0.75].map((fraction) => {
                  const y = chartDimensions.padding + plotHeight * fraction;
                  return (
                    <line
                      key={fraction}
                      x1={chartDimensions.padding}
                      y1={y}
                      x2={chartDimensions.width - chartDimensions.padding}
                      y2={y}
                      stroke="#334155"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* Base reference line (0) */}
                <line
                  x1={chartDimensions.padding}
                  y1={chartDimensions.padding + plotHeight}
                  x2={chartDimensions.width - chartDimensions.padding}
                  y2={chartDimensions.padding + plotHeight}
                  stroke="#475569"
                  strokeWidth={1.5}
                />

                {/* Voltage Path (Cyan) */}
                {(activeSignal === 'all' || activeSignal === 'voltage') && (
                  <path
                    d={voltagePath}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.7))' }}
                  />
                )}

                {/* Current Path (Amber) */}
                {(activeSignal === 'all' || activeSignal === 'current') && (
                  <path
                    d={currentPath}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.7))' }}
                  />
                )}

                {/* Power Path (Emerald) */}
                {(activeSignal === 'all' || activeSignal === 'power') && (
                  <path
                    d={powerPath}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.7))' }}
                  />
                )}
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
