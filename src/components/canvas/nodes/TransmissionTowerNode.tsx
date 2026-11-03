import React, { memo, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position, NodeProps } from 'reactflow';
import { CircuitElementData } from '../../../types/circuit';
import { Flame, Radio, Sparkles, X, Zap } from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { PanelDistribusiNode } from './PanelDistribusiNode';
import { useModalKeyboardClose } from '../../../hooks/useModalKeyboardClose';

/**
 * TransmissionTowerNode Component.
 *
 * Dual-Environment Real-World Electrical Representation (Standar PUIL / PLN):
 * 1. Outdoor Mode (`data.worldMode === 'outside'`):
 *    Renders an overhead high-voltage transmission pylon (Menara Transmisi SUTET)
 *    equipped with a snap-on pole-mounted transformer substation (Gardu Trafo Cantol).
 *    Includes tap-to-inspect modal to toggle 12V Direct vs 240V Step-Up High Voltage,
 *    live Joule heat loss (P = I^2 * R), and transmission efficiency metrics.
 * 2. Indoor Lab Mode (`data.worldMode !== 'outside'`):
 *    Delegates to `PanelDistribusiNode` (Hybrid UI: realistic hardware panel asset
 *    with interactive digital screen, MCB toggle, stepped DC selector, and banana binding posts).
 *
 * Time Complexity: O(1) render.
 */
export const TransmissionTowerNode: React.FC<NodeProps<CircuitElementData>> = memo((props) => {
  const { data, selected } = props;
  const isOutdoorTower = data.worldMode === 'outside';

  if (!isOutdoorTower) {
    return <PanelDistribusiNode {...props} />;
  }

  return <OutdoorTowerView {...props} selected={selected} />;
});

TransmissionTowerNode.displayName = 'TransmissionTowerNode';

/**
 * Outdoor High-Voltage Transmission Pylon View with Snap-on Gardu Trafo Substation.
 */
const OutdoorTowerView: React.FC<NodeProps<CircuitElementData>> = memo(({ id, data, selected }) => {
  const language = useCircuitStore((state) => state.language);
  const updateComponentData = useCircuitStore((state) => state.updateComponentData);
  const notify = useCircuitStore((state) => state.notify);
  const isId = language === 'id';

  // Tap-to-inspect Gardu Trafo modal state
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  useModalKeyboardClose(isInspectorOpen, () => setIsInspectorOpen(false));

  const isMcbOn = data.isMcbOn !== false && !data.isMcbTripped;
  const connectedCount = data.towerConnectedCount ?? 1;
  const isGridConnected = isMcbOn && connectedCount > 1;

  const currentAmperes = Math.abs(data.calculatedCurrent ?? 0);
  const busVoltage = data.calculatedVoltage ?? 0;
  const currentDisplay =
    currentAmperes >= 1
      ? `${currentAmperes.toFixed(2)} A`
      : `${Math.round(currentAmperes * 1000)} mA`;

  // Transmission line and transformer physics parameters
  const stepUpVoltage = data.stepUpVoltage ?? (data.transmissionVoltageMode === 'step_up' ? 240 : 12);
  const isStepUp = stepUpVoltage === 240;
  const lineResistance = data.lineResistance ?? 4.0;
  const lineCurrent = data.transmissionCurrent ?? (isStepUp ? currentAmperes / 20 : currentAmperes);
  const jouleLoss = data.jouleLoss ?? lineCurrent * lineCurrent * lineResistance;
  const efficiency = data.transmissionEfficiency ?? (isStepUp ? 99.8 : (currentAmperes > 0 ? 75.0 : 100.0));
  const isLineOverheated = data.isLineOverheated ?? (currentAmperes >= 0.4 && !isStepUp);

  const handleToggleVoltageMode = useCallback(
    (targetMode: 'direct' | 'step_up') => {
      const nextVoltage = targetMode === 'step_up' ? 240 : 12;
      updateComponentData(id, {
        stepUpVoltage: nextVoltage,
        transmissionVoltageMode: targetMode,
        hasTransformer: true,
      });

      notify(
        targetMode === 'step_up'
          ? isId
            ? '⚡ Gardu Trafo Cantol SUTET: Step-Up 240V Aktif! Arus kawat turun 20×, rugi panas I²R berkurang 400×, kabel transmisi dingin!'
            : '⚡ SUTET Transformer Substation: Step-Up 240V Active! Line current dropped 20×, I²R heat loss slashed 400×, transmission wire cool!'
          : isId
          ? '⚠️ Transmisi 12V Langsung: Arus kawat tinggi menyebabkan rugi panas I²R dan kabel membara!'
          : '⚠️ Direct 12V Transmission: High line current produces significant I²R Joule heating and wire stress!'
      );
    },
    [id, isId, notify, updateComponentData]
  );

  return (
    <div
      className={`relative flex flex-col items-center select-none transition-all duration-200 group w-[132px] pointer-events-none ${
        selected ? 'filter drop-shadow-[0_0_18px_rgba(34,211,238,0.55)]' : ''
      }`}
    >
      {/* Top Floating Status & Telemetry Pill (Above Pylon) */}
      <div
        className={`mb-1 px-2.5 py-1 rounded-2xl text-[10px] font-mono font-bold tracking-tight shadow-[0_8px_20px_rgba(0,0,0,0.45)] backdrop-blur-md border transition-all duration-300 z-30 pointer-events-auto cursor-grab active:cursor-grabbing ${
          isGridConnected
            ? isLineOverheated
              ? 'bg-red-950/90 text-red-200 border-red-500/80 shadow-[0_0_14px_rgba(239,68,68,0.45)] animate-pulse'
              : isStepUp
              ? 'bg-cyan-950/90 text-cyan-200 border-cyan-400/60 shadow-[0_0_14px_rgba(34,211,238,0.35)]'
              : 'bg-emerald-950/90 text-emerald-300 border-emerald-400/50 shadow-[0_0_14px_rgba(16,185,129,0.35)]'
            : 'bg-void-950/90 text-slate-200 border-white/20'
        }`}
      >
        <div className="flex items-center gap-1 whitespace-nowrap">
          {isGridConnected ? (
            <>
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isLineOverheated ? 'bg-red-400 animate-ping' : isStepUp ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400 animate-pulse'
                }`}
              />
              <Zap className={`w-3 h-3 shrink-0 ${isLineOverheated ? 'text-red-400' : isStepUp ? 'text-cyan-400' : 'text-emerald-400'}`} />
              <span>
                {isStepUp ? `[240V HV ${busVoltage.toFixed(0)}V]` : `[12V Dir ${busVoltage.toFixed(0)}V]`}
                {currentAmperes > 0.001 ? ` · ${currentDisplay}` : ''}
              </span>
            </>
          ) : (
            <>
              <Radio className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>
                {isId ? 'Standby (Pasang Panel di Lab)' : 'Standby (Place Panel in Lab)'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* High-Resolution Transparent Transmission Tower Pylon Graphic (288:510 aspect -> 112x198)
          pointer-events-none on the wide box so wires under the cross-arms are never blocked! */}
      <div className="relative w-[112px] h-[198px] flex items-end justify-center overflow-visible pointer-events-none">
        {/* Narrow Central Steel Spine Drag Hitbox (38px wide) so users can drag the tower while wires on the sides stay clickable */}
        <div
          className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-[38px] pointer-events-auto cursor-grab active:cursor-grabbing z-20"
          title={isId ? 'Geser Menara Transmisi' : 'Drag Transmission Tower'}
        />

        <img
          src="/assets/transmission-tower.png"
          alt={isId ? 'Menara Transmisi' : 'Transmission Tower'}
          className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_6px_10px_rgba(0,0,0,0.55)]"
          draggable={false}
        />

        {/* High-Voltage Corona Glow on Top & Middle Cross-Arm Ceramic Insulators when active */}
        {isGridConnected && (
          <>
            <span
              className="absolute w-2.5 h-2.5 rounded-full bg-cyan-300/80 blur-[2px] animate-ping pointer-events-none"
              style={{ left: '19.1%', top: '22%', transform: 'translate(-50%, -50%)' }}
            />
            <span
              className="absolute w-2.5 h-2.5 rounded-full bg-cyan-300/80 blur-[2px] animate-ping pointer-events-none"
              style={{ left: '80.7%', top: '22%', transform: 'translate(-50%, -50%)' }}
            />
          </>
        )}

        {/* Electrical Current Flow Glow Indicator */}
        {currentAmperes > 0.001 && (
          <div
            className={`absolute inset-x-5 top-6 bottom-6 rounded-full pointer-events-none blur-xl animate-pulse ${
              isLineOverheated ? 'bg-red-500/25' : isStepUp ? 'bg-cyan-400/20' : 'bg-emerald-400/15'
            }`}
            aria-hidden="true"
          />
        )}

        {/* ====================================================================
            GARDU TRAFO CANTOL SUTET (SNAP-ON POLE TRANSFORMER SUBSTATION)
            Mounted on the lower-middle section of the tower (at top = 68%, left = 50%).
            Touch Target Hitbox: 56px x 56px (generous touch target >= 56x56px!).
           ==================================================================== */}
        <div
          role="button"
          tabIndex={0}
          aria-label={isId ? 'Gardu Trafo Cantol SUTET (Klik untuk Menyetel)' : 'Mounted Transformer Substation (Click to Inspect)'}
          title={isId ? 'Gardu Trafo Cantol SUTET (Klik untuk Menyetel)' : 'Mounted Transformer Substation (Click to Inspect)'}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setIsInspectorOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              setIsInspectorOpen(true);
            }
          }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '68%',
            transform: 'translate(-50%, -50%)',
          }}
          className="w-14 h-14 z-30 flex flex-col items-center justify-center pointer-events-auto cursor-pointer group/trafo rounded-2xl transition-all duration-200 hover:scale-110 active:scale-95 hover:ring-2 hover:ring-cyan-400/70 hover:bg-cyan-950/40"
        >
          {/* Snap-on Transformer Graphic */}
          <div className="relative flex items-center justify-center">
            <img
              src="/assets/transformer-pole.png"
              alt={isId ? 'Gardu Trafo Cantol' : 'Mounted Transformer'}
              className="w-9 h-9 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)] pointer-events-none select-none transition-transform group-hover/trafo:scale-105"
              draggable={false}
            />

            {/* Live Transformer Status LED Dot */}
            <span
              className={`w-2 h-2 rounded-full absolute -top-1 -right-1 border border-white/50 shadow-sm transition-colors duration-300 ${
                isGridConnected
                  ? isStepUp
                    ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.95)] animate-pulse'
                    : isLineOverheated
                    ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.95)] animate-ping'
                    : 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.85)]'
                  : 'bg-slate-500'
              }`}
            />
          </div>

          {/* Micro Telemetry Pill under Transformer */}
          <span
            className={`mt-0.5 px-1.5 py-0.2 rounded-full text-[8px] font-mono font-bold tracking-tight border shadow-xs transition-colors whitespace-nowrap pointer-events-none ${
              isStepUp
                ? 'bg-cyan-950/90 text-cyan-200 border-cyan-400/50 shadow-[0_0_6px_rgba(34,211,238,0.3)]'
                : isLineOverheated
                ? 'bg-red-950/90 text-red-200 border-red-500/70 shadow-[0_0_6px_rgba(239,68,68,0.4)]'
                : 'bg-slate-900/90 text-slate-300 border-white/20'
            }`}
          >
            {isStepUp ? '240V' : '12V'}
          </span>
        </div>

        {/* ====================================================================
            OVERHEAD CERAMIC INSULATOR TERMINALS (ACCURATELY AT UPPER CROSS-ARMS!)
            Left Cross-Arm Insulator Tip: x = 12.7%, y = 51.5% -> Positive (+)
            Right Cross-Arm Insulator Tip: x = 87.0%, y = 51.5% -> Negative (-)
           ==================================================================== */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="pos"
          style={{
            left: '12.7%',
            top: '51.5%',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
          }}
          className="!w-5 !h-5 !bg-red-500 !border-2 !border-white !rounded-full shadow-[0_0_14px_rgba(239,68,68,0.95)] hover:!scale-125 transition-transform cursor-crosshair z-40 flex items-center justify-center pointer-events-auto"
          title={isId ? 'Isolator Kutub Positif (+)' : 'Positive Insulator Terminal (+)'}
        >
          <span className="text-[10px] font-mono font-black text-white leading-none pointer-events-none">
            +
          </span>
        </Handle>

        <Handle
          type="source"
          position={Position.Bottom}
          id="neg"
          style={{
            left: '87.0%',
            top: '51.5%',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
          }}
          className="!w-5 !h-5 !bg-sky-500 !border-2 !border-white !rounded-full shadow-[0_0_14px_rgba(56,189,248,0.95)] hover:!scale-125 transition-transform cursor-crosshair z-40 flex items-center justify-center pointer-events-auto"
          title={isId ? 'Isolator Kutub Negatif (-)' : 'Negative Insulator Terminal (-)'}
        >
          <span className="text-[11px] font-mono font-black text-white leading-none pointer-events-none">
            -
          </span>
        </Handle>
      </div>

      {/* ====================================================================
          ZOOM-IN MODAL / POPOVER: GARDU TRAFO CANTOL SUTET
          Rendered via Portal to document.body so it is completely immune to
          ReactFlow canvas zoom, panning, and CSS transforms.
         ==================================================================== */}
      {isInspectorOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto animate-fade-in"
            onClick={() => setIsInspectorOpen(false)}
          >
            <div
              className="max-w-md w-full bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] p-5 text-slate-100 font-sans select-none animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with High-Detail Transformer Icon */}
              <div className="flex items-start justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-slate-800/80 border border-white/15 flex items-center justify-center p-1.5 shadow-inner shrink-0">
                    <img
                      src="/assets/transformer-pole.png"
                      alt="Gardu Trafo Cantol"
                      className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5 leading-tight">
                      <span>{isId ? 'Gardu Trafo Cantol SUTET' : 'Tower Transformer Substation'}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                        PUIL/PLN
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isId
                        ? 'Transformator Step-Up & Transmisi Tegangan Tinggi'
                        : 'Step-Up & High-Voltage Transmission Control'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsInspectorOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                  aria-label={isId ? 'Tutup' : 'Close'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Interactive Voltage Mode Selector (Tactile Buttons) */}
              <div className="my-4">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  {isId ? 'Mode Tegangan Saluran Transmisi:' : 'Transmission Line Voltage Mode:'}
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Button 1: 12V Langsung (Direct LV) */}
                  <button
                    type="button"
                    onClick={() => handleToggleVoltageMode('direct')}
                    className={`p-3 rounded-xl border text-left transition-all active:scale-95 ${
                      !isStepUp
                        ? 'bg-amber-500/20 border-amber-400 text-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/30'
                        : 'bg-slate-800/50 border-slate-700/70 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold font-mono">12V Langsung</span>
                      <Flame className={`w-4 h-4 ${!isStepUp ? 'text-amber-400' : 'text-slate-500'}`} />
                    </div>
                    <span className="text-[10px] block text-slate-400 leading-tight">
                      {isId ? 'Tegangan rendah: Arus tinggi & rugi panas I²R besar' : 'Low voltage: High current & heavy Joule loss'}
                    </span>
                  </button>

                  {/* Button 2: 240V Step-Up (HV SUTET) */}
                  <button
                    type="button"
                    onClick={() => handleToggleVoltageMode('step_up')}
                    className={`p-3 rounded-xl border text-left transition-all active:scale-95 ${
                      isStepUp
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.3)] ring-2 ring-cyan-400/40'
                        : 'bg-slate-800/50 border-slate-700/70 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold font-mono">240V Step-Up</span>
                      <Sparkles className={`w-4 h-4 ${isStepUp ? 'text-cyan-300' : 'text-slate-500'}`} />
                    </div>
                    <span className="text-[10px] block text-slate-400 leading-tight">
                      {isId ? 'Tegangan tinggi: Rugi turun 400×, kabel dingin' : 'High voltage: 400× loss reduction, cool wires'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Real-Time Telemetry Dashboard (2x2 Grid) */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {/* Metric 1: Transmission Voltage */}
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/70">
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {isId ? 'Tegangan Transmisi' : 'Line Voltage'}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-mono font-bold text-white">
                      {stepUpVoltage}
                    </span>
                    <span className="text-xs font-mono text-slate-400">V</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">
                    {isStepUp ? 'Rasio N = 20× (Step-Up)' : 'Rasio N = 1× (Direct)'}
                  </span>
                </div>

                {/* Metric 2: Line Current */}
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/70">
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {isId ? 'Arus Kawat (Line Current)' : 'Line Current'}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className={`text-lg font-mono font-bold ${isLineOverheated ? 'text-red-400' : 'text-white'}`}>
                      {lineCurrent.toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-slate-400">A</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">
                    {isId ? `Beban Lab: ${currentDisplay}` : `Lab Load: ${currentDisplay}`}
                  </span>
                </div>

                {/* Metric 3: Joule Loss P = I^2 * R */}
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/70">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isId ? 'Rugi Panas (I² · R)' : 'Joule Heat Loss'}
                    </span>
                    {isLineOverheated ? (
                      <span className="text-[8px] font-mono px-1 rounded bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
                        Panas!
                      </span>
                    ) : isStepUp ? (
                      <span className="text-[8px] font-mono px-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                        Dingin
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className={`text-lg font-mono font-bold ${isLineOverheated ? 'text-red-400' : 'text-white'}`}>
                      {jouleLoss.toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-slate-400">W</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">
                    R_line = {lineResistance.toFixed(1)} Ω
                  </span>
                </div>

                {/* Metric 4: Transmission Efficiency */}
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/70">
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {isId ? 'Efisiensi Transmisi' : 'Efficiency'}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-lg font-mono font-bold ${
                        efficiency >= 95
                          ? 'text-emerald-400'
                          : efficiency >= 70
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}
                    >
                      {efficiency.toFixed(1)}%
                    </span>
                  </div>
                  {/* Mini Progress Bar */}
                  <div className="w-full bg-slate-700/50 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        efficiency >= 95
                          ? 'bg-emerald-400'
                          : efficiency >= 70
                          ? 'bg-amber-400'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, efficiency))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Educational Insight Card */}
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-100 flex items-start gap-2.5 text-xs">
                <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-cyan-200 block mb-0.5">
                    {isId ? 'Hukum Joule & Prinsip SUTET PLN:' : 'Joule\'s Law & Utility Grid Principle:'}
                  </span>
                  <p className="text-[11px] text-cyan-100/90">
                    {isId
                      ? 'Rugi daya panas pada kabel adalah P_loss = I² · R. Dengan menaikkan tegangan transmisi 20× (12V → 240V), arus kawat berkurang 20× sehingga rugi panas kawat berkurang drastis sebesar 20² = 400 kali lipat!'
                      : 'Conductor thermal loss follows P_loss = I² · R. Stepping up transmission voltage 20× (12V → 240V) drops line current 20×, slashing conductor heat dissipation by 20² = 400 times!'}
                  </p>
                </div>
              </div>

              {/* Footer Close Action */}
              <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsInspectorOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white active:scale-95 transition-all"
                >
                  {isId ? 'Tutup Pengaturan' : 'Close Settings'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
});

OutdoorTowerView.displayName = 'OutdoorTowerView';
