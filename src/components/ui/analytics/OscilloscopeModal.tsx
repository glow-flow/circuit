import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Download,
  Sliders,
  Zap,
  Gauge,
  Flame,
} from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { OscilloscopeDataPoint } from '../../../types/analytics';
import { getComponentDisplayName } from '../../../utils/nodeLocalization';
import {
  computeOscilloscopeSample,
  SignalPolarityState,
} from '../../../physics/oscilloscopeTelemetry';
import { useModalFocusTrap } from '../../../hooks/useModalKeyboardClose';
import { LabModalHeader } from '../common/LabModalHeader';

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
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalFocusTrap(isOpen, dialogRef, onClose);

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
  const [latestPolarity, setLatestPolarity] = useState<SignalPolarityState>('idle');
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

      const sample = computeOscilloscopeSample(probedNodeId, nodes, simulation);
      const { voltage, current, power, polarity } = sample;
      setLatestPolarity(polarity);

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

  const headerRightSlot = (
    <div className="flex items-center gap-2 shrink-0">
      <span className="hidden xs:inline-flex items-center px-2 py-1 rounded-md text-[10px] font-mono font-semibold bg-void-900 border border-control text-electric-400 tabular-nums">
        {sampleIntervalMs}ms
      </span>
      <button
        type="button"
        onClick={handleExportCsv}
        disabled={history.length === 0}
        className="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold bg-void-900 hover:bg-void-850 disabled:bg-void-950 disabled:text-slate-400 text-ink border border-control flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer disabled:cursor-not-allowed"
        title={isId ? 'Ekspor data CSV' : 'Export CSV data'}
        aria-label={isId ? 'Ekspor data CSV' : 'Export CSV data'}
      >
        <Download className="w-4 h-4 text-electric-400" aria-hidden="true" />
        <span className="hidden sm:inline">{isId ? 'Ekspor CSV' : 'Export CSV'}</span>
      </button>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/75 p-0 sm:p-5 overflow-y-auto min-h-[100dvh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="oscilloscope-modal-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl min-h-[100dvh] sm:min-h-0 sm:max-h-[92dvh] rounded-none sm:rounded-2xl bg-void-900 border-0 sm:border sm:border-control shadow-2xl flex flex-col overflow-hidden text-ink font-sans"
      >
        <LabModalHeader
          titleId="oscilloscope-modal-title"
          eyebrow={isId ? 'ANALITIK MNA · MULTI-KANAL' : 'MNA ANALYTICS · MULTI-CHANNEL'}
          title={isId ? 'Oskiloskop & Analitik Listrik' : 'Live Oscilloscope & Analytics'}
          subtitle={
            isId
              ? 'Pantau gelombang tegangan, arus, dan disipasi daya terintegrasi MNA.'
              : 'Monitor live voltage, current, and dissipated power waveforms.'
          }
          rightSlot={headerRightSlot}
          onClose={onClose}
          closeLabel={isId ? 'Tutup Oskiloskop' : 'Close Oscilloscope'}
        />

        {/* Control & Target Bar */}
        <div className="p-3.5 sm:p-4 border-b border-ink/15 bg-void-950 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0 select-none">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Sliders className="w-4 h-4 text-electric-400 shrink-0" aria-hidden="true" />
            <label
              htmlFor="oscilloscope-probe-select"
              className="text-xs font-semibold text-slate-300 shrink-0 whitespace-nowrap"
            >
              {isId ? 'Target Probe:' : 'Probe Channel:'}
            </label>
            <select
              id="oscilloscope-probe-select"
              value={probedNodeId ?? ''}
              onChange={(e) => setProbedNodeId(e.target.value || null)}
              className="flex-1 min-w-0 w-full sm:max-w-xs min-h-[44px] px-3 py-1.5 rounded-xl bg-void-900 border border-control text-xs text-ink cursor-pointer truncate"
            >
              <option value="">{isId ? 'Total Rangkaian (Global)' : 'Global Circuit Total'}</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {getComponentDisplayName(node.data, language)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <label htmlFor="oscilloscope-interval-select" className="sr-only">
              {isId ? 'Interval Sampel' : 'Sample Interval'}
            </label>
            <select
              id="oscilloscope-interval-select"
              value={sampleIntervalMs}
              onChange={(e) => setSampleIntervalMs(Number(e.target.value))}
              className="flex-1 sm:flex-initial min-w-0 min-h-[44px] px-2.5 py-1.5 rounded-xl bg-void-900 border border-control text-xs text-ink cursor-pointer truncate tabular-nums"
            >
              <option value={100}>{isId ? '100 ms (Cepat)' : '100 ms (Fast)'}</option>
              <option value={250}>250 ms</option>
              <option value={500}>500 ms (Normal)</option>
              <option value={1000}>{isId ? '1000 ms (1 dtk)' : '1000 ms (1s)'}</option>
            </select>

            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95 cursor-pointer shrink-0 ${
                isPaused
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-[#B45309] hover:bg-[#92400E] text-white'
              }`}
            >
              {isPaused ? (
                <Play className="w-4 h-4 fill-white" aria-hidden="true" />
              ) : (
                <Pause className="w-4 h-4 fill-white" aria-hidden="true" />
              )}
              <span>{isPaused ? (isId ? 'Lanjutkan' : 'Resume') : isId ? 'Jeda' : 'Pause'}</span>
            </button>

            <button
              type="button"
              onClick={handleClearHistory}
              title={isId ? 'Bersihkan riwayat data' : 'Clear data buffer'}
              aria-label={isId ? 'Bersihkan riwayat data' : 'Clear data buffer'}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-void-900 hover:bg-void-850 text-slate-300 hover:text-ink border border-control active:scale-95 transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Main Telemetry Gauges Ribbon */}
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-void-950 border-b border-ink/15 shrink-0 select-none tabular-nums">
          <div className="p-3 rounded-xl bg-void-900 border border-sky-500/35">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-sans">
              <span>{isId ? 'Tegangan (V)' : 'Voltage (V)'}</span>
              <Zap className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-sky-300 mt-1">
              {latestPoint.voltage.toFixed(2)} <span className="text-xs text-sky-400 font-sans">V</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-void-900 border border-amber-500/35">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-sans gap-1">
              <span>{isId ? 'Kuat Arus (I)' : 'Current (I)'}</span>
              {latestPolarity !== 'idle' && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    latestPolarity === 'charging'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : latestPolarity === 'reverse'
                      ? 'bg-danger-500/15 text-danger-300 border-danger-500/40'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {latestPolarity === 'charging'
                    ? 'Charging'
                    : latestPolarity === 'supplying'
                    ? isId
                      ? 'Suplai'
                      : 'Supply'
                    : latestPolarity === 'reverse'
                    ? isId
                      ? 'Terbalik'
                      : 'Reverse'
                    : isId
                    ? 'Maju'
                    : 'Forward'}
                </span>
              )}
              <Gauge className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-amber-300 mt-1">
              {latestPoint.current < 1
                ? `${(latestPoint.current * 1000).toFixed(1)} mA`
                : `${latestPoint.current.toFixed(3)} A`}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-void-900 border border-emerald-500/35">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-sans">
              <span>{isId ? 'Daya Aktif (P)' : 'Active Power'}</span>
              <Flame className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-emerald-300 mt-1">
              {latestPoint.power.toFixed(2)} <span className="text-xs text-emerald-400 font-sans">W</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-void-900 border border-sky-500/35">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-sans">
              <span>{isId ? 'Energi Kumulatif' : 'Energy (Wh)'}</span>
              <Activity className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-sky-300 mt-1">
              {latestPoint.energyWattHours < 1
                ? `${(latestPoint.energyWattHours * 1000).toFixed(1)} mWh`
                : `${latestPoint.energyWattHours.toFixed(4)} Wh`}
            </div>
          </div>
        </div>

        {/* Waveform Filter Controls & Oscilloscope Viewport */}
        <div className="p-4 flex-1 flex flex-col gap-3 bg-void-950 overflow-y-auto overscroll-contain">
          {/* Channel Filter Chips */}
          <div
            role="group"
            aria-label={isId ? 'Filter kanal sinyal' : 'Signal channel filter'}
            className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono select-none tabular-nums"
          >
            <button
              type="button"
              aria-pressed={activeSignal === 'all'}
              onClick={() => setActiveSignal('all')}
              className={`min-h-[36px] px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                activeSignal === 'all'
                  ? 'bg-electric-600 border-electric-500 text-white font-bold'
                  : 'bg-void-900 border-control text-slate-300 hover:text-ink'
              }`}
            >
              {isId ? 'SEMUA' : 'ALL'}
            </button>
            <button
              type="button"
              aria-pressed={activeSignal === 'voltage'}
              onClick={() => setActiveSignal('voltage')}
              className={`min-h-[36px] px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                activeSignal === 'voltage'
                  ? 'bg-sky-600 border-sky-500 text-white font-bold'
                  : 'bg-void-900 border-control text-sky-400 hover:border-sky-500/60'
              }`}
            >
              V ({isId ? 'Puncak' : 'Peak'} {maxV.toFixed(1)}V)
            </button>
            <button
              type="button"
              aria-pressed={activeSignal === 'current'}
              onClick={() => setActiveSignal('current')}
              className={`min-h-[36px] px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                activeSignal === 'current'
                  ? 'bg-[#B45309] border-amber-500 text-white font-bold'
                  : 'bg-void-900 border-control text-amber-400 hover:border-amber-500/60'
              }`}
            >
              I ({isId ? 'Puncak' : 'Peak'} {maxI.toFixed(2)}A)
            </button>
            <button
              type="button"
              aria-pressed={activeSignal === 'power'}
              onClick={() => setActiveSignal('power')}
              className={`min-h-[36px] px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                activeSignal === 'power'
                  ? 'bg-emerald-600 border-emerald-500 text-white font-bold'
                  : 'bg-void-900 border-control text-emerald-400 hover:border-emerald-500/60'
              }`}
            >
              P ({isId ? 'Puncak' : 'Peak'} {maxP.toFixed(1)}W)
            </button>
          </div>

          {/* Fixed dark oscilloscope screen ensures bright signal strokes stay legible in Light Mode */}
          <div className="w-full h-56 sm:h-64 rounded-xl bg-[#0B0F14] border border-control relative overflow-hidden flex items-center justify-center shrink-0">
            {history.length < 2 ? (
              <div className="text-center text-xs text-slate-400 font-mono">
                {isId ? 'Menunggu sampel data berikutnya...' : 'Waiting for telemetry samples...'}
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${chartDimensions.width} ${chartDimensions.height}`}
                className="w-full h-full"
                aria-label={isId ? 'Grafik gelombang tegangan, arus, dan daya' : 'Voltage, current, and power waveforms'}
              >
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

                <line
                  x1={chartDimensions.padding}
                  y1={chartDimensions.padding + plotHeight}
                  x2={chartDimensions.width - chartDimensions.padding}
                  y2={chartDimensions.padding + plotHeight}
                  stroke="#475569"
                  strokeWidth={1.5}
                />

                {(activeSignal === 'all' || activeSignal === 'voltage') && (
                  <path
                    d={voltagePath}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                )}

                {(activeSignal === 'all' || activeSignal === 'current') && (
                  <path
                    d={currentPath}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                )}

                {(activeSignal === 'all' || activeSignal === 'power') && (
                  <path
                    d={powerPath}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    strokeLinecap="round"
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
