import React, { memo, useCallback, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position, NodeProps } from 'reactflow';
import { CircuitElementData } from '../../../types/circuit';
import { Flame, Radio, X, Zap } from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { PanelDistribusiNode } from './PanelDistribusiNode';
import { useModalFocusTrap } from '../../../hooks/useModalKeyboardClose';
import { computeTransmissionTelemetry } from '../../../physics/transmissionPhysics';
import { usePendingPinHandleForNode } from '../../../hooks/useTapToConnectHandlers';

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
  const pendingPinHandle = usePendingPinHandleForNode(id);
  const isId = language === 'id';

  // Tap-to-inspect Gardu Trafo modal state
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const modeGroupId = useId();
  useModalFocusTrap(isInspectorOpen, modalRef, () => setIsInspectorOpen(false));

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
  const fallbackTelemetry = computeTransmissionTelemetry({
    loadCurrent: currentAmperes,
    voltageMode: stepUpVoltage,
    lineResistance,
    generatorVoltage: busVoltage > 0 ? busVoltage : 12.0,
  });
  const lineCurrent = data.transmissionCurrent ?? fallbackTelemetry.lineCurrentAmperes;
  const jouleLoss = data.jouleLoss ?? fallbackTelemetry.jouleLossWatts;
  const efficiency = data.transmissionEfficiency ?? fallbackTelemetry.efficiencyPercent;
  const isLineOverheated = data.isLineOverheated ?? fallbackTelemetry.isOverheated;

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
            ? 'Gardu Trafo Cantol SUTET: Step-Up 240V Aktif! Arus kawat turun 20×, rugi panas I²R berkurang 400×, kabel transmisi dingin!'
            : 'SUTET Transformer Substation: Step-Up 240V Active! Line current dropped 20×, I²R heat loss slashed 400×, transmission wire cool!'
          : isId
          ? 'Transmisi 12V Langsung: Arus kawat tinggi menyebabkan rugi panas I²R dan kabel membara!'
          : 'Direct 12V Transmission: High line current produces significant I²R Joule heating and wire stress!'
      );
    },
    [id, isId, notify, updateComponentData]
  );

  return (
    <div
      className={`relative flex flex-col items-center justify-end select-none transition-transform duration-200 group w-[132px] overflow-visible pointer-events-none ${
        selected ? 'ring-2 ring-cyan-400/90 rounded-2xl' : ''
      }`}
      style={{ height: '226px' }}
    >
      {/* Top Floating Status & Telemetry Pill (Above Pylon) */}
      <div
        className={`mb-1 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold tracking-tight shadow-md border transition-colors duration-200 z-30 pointer-events-auto cursor-grab active:cursor-grabbing ${
          isGridConnected
            ? isLineOverheated
              ? 'bg-red-950 text-red-200 border-red-500/80'
              : isStepUp
              ? 'bg-cyan-950 text-cyan-200 border-cyan-500/70'
              : 'bg-emerald-950 text-emerald-200 border-emerald-500/60'
            : 'bg-void-950 text-ink border-control'
        }`}
      >
        <div className="flex items-center gap-1 whitespace-nowrap">
          {isGridConnected ? (
            <>
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isLineOverheated ? 'bg-red-400' : isStepUp ? 'bg-cyan-400' : 'bg-emerald-400'
                }`}
              />
              <Zap className={`w-3 h-3 shrink-0 ${isLineOverheated ? 'text-red-400' : isStepUp ? 'text-cyan-400' : 'text-emerald-400'}`} />
              <span className="tabular-nums">
                {isStepUp
                  ? `240V Step-Up (Bus ${busVoltage.toFixed(1)}V)`
                  : isId
                  ? `12V Langsung (Bus ${busVoltage.toFixed(1)}V)`
                  : `12V Direct (Bus ${busVoltage.toFixed(1)}V)`}
                {currentAmperes > 0.001 ? ` · ${currentDisplay}` : ''}
              </span>
            </>
          ) : (
            <>
              <Radio className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>
                {isId ? 'Siap Salur ke Lab (Cas Baterai)' : 'Ready for Lab (Battery Charge)'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* High-Resolution Transparent Transmission Tower Pylon Graphic (288:510 aspect -> 112x198)
          pointer-events-none on the wide box so wires under the cross-arms are never blocked! */}
      <div className="relative w-[112px] h-[198px] flex items-end justify-center overflow-visible pointer-events-none shrink-0">
        {/* Narrow Central Steel Spine Drag Hitbox (38px wide) so users can drag the tower while wires on the sides stay clickable */}
        <div
          className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-[38px] pointer-events-auto cursor-grab active:cursor-grabbing z-20"
          title={isId ? 'Geser Menara Transmisi' : 'Drag Transmission Tower'}
        />

        <img
          src="/assets/transmission-tower.png"
          alt={isId ? 'Menara Transmisi' : 'Transmission Tower'}
          width={112}
          height={198}
          className="w-full h-full object-contain pointer-events-none select-none"
          draggable={false}
        />

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
              width={36}
              height={36}
              className="w-9 h-9 object-contain pointer-events-none select-none transition-transform group-hover/trafo:scale-105"
              draggable={false}
            />

            {/* Live Transformer Status LED Dot */}
            <span
              className={`w-2 h-2 rounded-full absolute -top-1 -right-1 border border-white/60 shadow-sm transition-colors duration-300 ${
                isGridConnected
                  ? isStepUp
                    ? 'bg-cyan-400'
                    : isLineOverheated
                    ? 'bg-red-500'
                    : 'bg-amber-400'
                  : 'bg-slate-500'
              }`}
            />
          </div>

          {/* Micro Telemetry Pill under Transformer */}
          <span
            className={`mt-0.5 px-1.5 py-0.2 rounded-full text-[8px] font-mono font-bold tracking-tight border shadow-xs transition-colors whitespace-nowrap pointer-events-none tabular-nums ${
              isStepUp
                ? 'bg-cyan-950 text-cyan-200 border-cyan-500/60'
                : isLineOverheated
                ? 'bg-red-950 text-red-200 border-red-500/70'
                : 'bg-void-950 text-ink border-control'
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
          className={`!w-6 !h-6 md:!w-5 md:!h-5 !bg-red-500 !border-2 !border-white !rounded-full shadow-md hover:!scale-125 transition-transform cursor-crosshair z-40 flex items-center justify-center pointer-events-auto ${
            pendingPinHandle === 'pos' ? '!ring-4 !ring-emerald-400 !scale-125' : ''
          }`}
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
          className={`!w-6 !h-6 md:!w-5 md:!h-5 !bg-sky-500 !border-2 !border-white !rounded-full shadow-md hover:!scale-125 transition-transform cursor-crosshair z-40 flex items-center justify-center pointer-events-auto ${
            pendingPinHandle === 'neg' ? '!ring-4 !ring-emerald-400 !scale-125' : ''
          }`}
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
            className="fixed inset-0 z-50 bg-scrim/75 flex items-center justify-center p-4 pointer-events-auto"
            onClick={() => setIsInspectorOpen(false)}
          >
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="max-w-md w-full bg-void-900 border border-control rounded-2xl shadow-2xl p-5 text-ink font-sans select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with High-Detail Transformer Icon */}
              <div className="flex items-start justify-between pb-4 border-b border-control">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-void-950 border border-control flex items-center justify-center p-1.5 shrink-0">
                    <img
                      src="/assets/transformer-pole.png"
                      alt="Gardu Trafo Cantol"
                      width={44}
                      height={44}
                      className="w-11 h-11 object-contain"
                      draggable={false}
                    />
                  </div>
                  <div>
                    <h3 id={titleId} className="text-base font-bold text-ink flex items-center gap-1.5 leading-tight">
                      <span>{isId ? 'Gardu Trafo Cantol SUTET' : 'Tower Transformer Substation'}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
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
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-void-950 border border-control text-slate-300 hover:text-ink active:scale-95 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                  aria-label={isId ? 'Tutup' : 'Close'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Interactive Voltage Mode Selector (Tactile Buttons) */}
              <div className="my-4" role="group" aria-labelledby={modeGroupId}>
                <p id={modeGroupId} className="block text-xs font-semibold text-slate-200 mb-2">
                  {isId ? 'Mode Tegangan Saluran Transmisi:' : 'Transmission Line Voltage Mode:'}
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Button 1: 12V Langsung (Direct LV) */}
                  <button
                    type="button"
                    aria-pressed={!isStepUp}
                    onClick={() => handleToggleVoltageMode('direct')}
                    className={`min-h-[44px] p-3 rounded-xl border text-left transition-colors active:scale-95 cursor-pointer ${
                      !isStepUp
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-2 ring-amber-400/40'
                        : 'bg-void-950 border-control text-slate-300 hover:bg-void-850 hover:text-ink'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold font-mono tabular-nums">12V Langsung</span>
                      <Flame className={`w-4 h-4 ${!isStepUp ? 'text-amber-400' : 'text-slate-400'}`} />
                    </div>
                    <span className="text-[10px] block text-slate-400 leading-tight">
                      {isId ? 'Tegangan rendah: Arus tinggi & rugi panas I²R besar' : 'Low voltage: High current & heavy Joule loss'}
                    </span>
                  </button>

                  {/* Button 2: 240V Step-Up (HV SUTET) */}
                  <button
                    type="button"
                    aria-pressed={isStepUp}
                    onClick={() => handleToggleVoltageMode('step_up')}
                    className={`min-h-[44px] p-3 rounded-xl border text-left transition-colors active:scale-95 cursor-pointer ${
                      isStepUp
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 ring-2 ring-cyan-400/40'
                        : 'bg-void-950 border-control text-slate-300 hover:bg-void-850 hover:text-ink'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold font-mono tabular-nums">240V Step-Up</span>
                      <Zap className={`w-4 h-4 ${isStepUp ? 'text-cyan-400' : 'text-slate-400'}`} />
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
                <div className="p-2.5 rounded-xl bg-void-950 border border-control">
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {isId ? 'Tegangan Transmisi' : 'Line Voltage'}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5 tabular-nums">
                    <span className="text-lg font-mono font-bold text-ink">
                      {stepUpVoltage}
                    </span>
                    <span className="text-xs font-mono text-slate-400">V</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">
                    {isStepUp ? 'Rasio N = 20× (Step-Up)' : 'Rasio N = 1× (Direct)'}
                  </span>
                </div>

                {/* Metric 2: Line Current */}
                <div className="p-2.5 rounded-xl bg-void-950 border border-control">
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {isId ? 'Arus Kawat (Line Current)' : 'Line Current'}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5 tabular-nums">
                    <span className={`text-lg font-mono font-bold ${isLineOverheated ? 'text-red-400' : 'text-ink'}`}>
                      {lineCurrent.toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-slate-400">A</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 tabular-nums">
                    {isId ? `Beban Lab: ${currentDisplay}` : `Lab Load: ${currentDisplay}`}
                  </span>
                </div>

                {/* Metric 3: Joule Loss P = I^2 * R */}
                <div className="p-2.5 rounded-xl bg-void-950 border border-control">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isId ? 'Rugi Panas (I² · R)' : 'Joule Heat Loss'}
                    </span>
                    {isLineOverheated ? (
                      <span className="text-[8px] font-mono px-1 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                        Panas!
                      </span>
                    ) : isStepUp ? (
                      <span className="text-[8px] font-mono px-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                        Dingin
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5 tabular-nums">
                    <span className={`text-lg font-mono font-bold ${isLineOverheated ? 'text-red-400' : 'text-ink'}`}>
                      {jouleLoss.toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-slate-400">W</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 tabular-nums">
                    R_line = {lineResistance.toFixed(1)} Ω
                  </span>
                </div>

                {/* Metric 4: Transmission Efficiency */}
                <div className="p-2.5 rounded-xl bg-void-950 border border-control">
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {isId ? 'Efisiensi Transmisi' : 'Efficiency'}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5 tabular-nums">
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
                  <div className="w-full bg-void-800 h-1.5 rounded-full mt-1 overflow-hidden">
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
              <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/35 text-cyan-100 flex items-start gap-2.5 text-xs">
                <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-cyan-200 block mb-0.5">
                    {isId ? 'Hukum Joule & Prinsip SUTET PLN:' : 'Joule\'s Law & Utility Grid Principle:'}
                  </span>
                  <p className="text-[11px] text-cyan-100">
                    {isId
                      ? 'Rugi daya panas pada kabel adalah P_loss = I² · R. Dengan menaikkan tegangan transmisi 20× (12V -> 240V), arus kawat berkurang 20× sehingga rugi panas kawat berkurang drastis sebesar 20² = 400 kali lipat!'
                      : 'Conductor thermal loss follows P_loss = I² · R. Stepping up transmission voltage 20× (12V -> 240V) drops line current 20×, slashing conductor heat dissipation by 20² = 400 times!'}
                  </p>
                </div>
              </div>

              {/* Footer Close Action */}
              <div className="mt-4 pt-3 border-t border-control flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsInspectorOpen(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold bg-void-850 border border-control text-ink hover:bg-void-800 active:scale-95 transition-colors cursor-pointer"
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
