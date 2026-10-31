import React, { memo, useCallback, useMemo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CircuitElementData } from '../../../types/circuit';
import { AlertTriangle, Power, Radio, Scissors, ShieldCheck, Zap } from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import {
  checkPanelDirectShort,
  getShortCircuitGuidance,
} from '../../../utils/circuitShortCircuitUtils';

const STEP_DOWN_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: 'Auto', value: null },
  { label: '3V', value: 3 },
  { label: '6V', value: 6 },
  { label: '9V', value: 9 },
  { label: '12V', value: 12 },
];

/**
 * TransmissionTowerNode Component.
 *
 * Dual-Environment Real-World Electrical Representation (Standar PUIL / PLN):
 * 1. Outdoor Mode (`data.worldMode === 'outside'`):
 *    Renders an overhead high-voltage transmission pylon (Menara Transmisi SUTET)
 *    with upper ceramic insulator terminals.
 * 2. Indoor Lab Mode (`data.worldMode !== 'outside'`):
 *    Renders a wall-mounted "Panel Distribusi & MCB Lab" (Box kWh Meter + MCB
 *    Short-Circuit Breaker + Trafo Step-Down & Penyearah DC) so indoor laboratory
 *    circuits receive stepped-down, MCB-protected DC power from outdoor generators
 *    instead of placing a 30-meter steel tower inside a classroom!
 *
 * Time Complexity: O(1) render.
 */
export const TransmissionTowerNode: React.FC<NodeProps<CircuitElementData>> = memo(
  ({ id, data, selected }) => {
    const language = useCircuitStore((state) => state.language);
    const edges = useCircuitStore((state) => state.edges);
    const updateComponentData = useCircuitStore((state) => state.updateComponentData);
    const resetLabPanelMcb = useCircuitStore((state) => state.resetLabPanelMcb);
    const disconnectAndResetMcb = useCircuitStore((state) => state.disconnectAndResetMcb);
    const notify = useCircuitStore((state) => state.notify);
    const isId = language === 'id';

    const [isShaking, setIsShaking] = useState(false);

    const isOutdoorTower = data.worldMode === 'outside';
    const isMcbOn = data.isMcbOn !== false && !data.isMcbTripped;
    const isMcbTripped = Boolean(data.isMcbTripped);
    const stepDownVoltage = data.stepDownVoltage ?? null;

    const directShortResult = useMemo(() => {
      if (!isMcbTripped) return { isShorted: false, shortType: 'none' as const };
      return checkPanelDirectShort(id, edges);
    }, [edges, id, isMcbTripped]);

    const shortCircuitGuidance = useMemo(() => {
      if (!isMcbTripped) return '';
      return getShortCircuitGuidance(directShortResult, isId);
    }, [directShortResult, isId, isMcbTripped]);

    const connectedCount = data.towerConnectedCount ?? 1;
    const isGridConnected = isMcbOn && connectedCount > 1;

    const currentAmperes = Math.abs(data.calculatedCurrent ?? 0);
    const busVoltage = data.calculatedVoltage ?? 0;
    const currentDisplay =
      currentAmperes >= 1
        ? `${currentAmperes.toFixed(2)} A`
        : `${Math.round(currentAmperes * 1000)} mA`;

    const handleToggleMcb = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();

        if (isMcbTripped) {
          const success = resetLabPanelMcb(id);
          if (!success) {
            setIsShaking(true);
            window.setTimeout(() => setIsShaking(false), 450);
          }
          return;
        }

        const nextMcbState = !isMcbOn;
        updateComponentData(id, {
          isMcbOn: nextMcbState,
          isMcbTripped: false,
        });
        notify(
          nextMcbState
            ? isId
              ? 'Tuas MCB Panel Distribusi Lab: ON (Aliran Listrik Terhubung)'
              : 'Lab Distribution Panel MCB: ON (Grid Connected)'
            : isId
            ? 'Tuas MCB Panel Distribusi Lab: OFF (Aliran Listrik Diputus)'
            : 'Lab Distribution Panel MCB: OFF (Grid Disconnected)'
        );
      },
      [id, isId, isMcbOn, isMcbTripped, notify, resetLabPanelMcb, updateComponentData]
    );

    const handleDisconnectAndReset = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        disconnectAndResetMcb(id);
      },
      [disconnectAndResetMcb, id]
    );

    const handleSelectStepDown = useCallback(
      (e: React.MouseEvent, targetVoltage: number | null) => {
        e.stopPropagation();
        updateComponentData(id, { stepDownVoltage: targetVoltage });
      },
      [id, updateComponentData]
    );

    // =========================================================================
    // MODE A: INDOOR LAB DISTRIBUTION PANEL (Box kWh + MCB + Step-Down DC)
    // =========================================================================
    if (!isOutdoorTower) {
      return (
        <div
          className={`relative flex flex-col select-none transition-all duration-200 w-[176px] rounded-2xl bg-void-900/95 backdrop-blur-md border p-2.5 pb-4 shadow-[0_12px_28px_rgba(0,0,0,0.65)] ${
            isMcbTripped
              ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.45)]'
              : selected
              ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.35)]'
              : isGridConnected
              ? 'border-emerald-400/50 shadow-[0_0_16px_rgba(16,185,129,0.2)]'
              : 'border-white/15'
          }`}
        >
          {/* Top Header: Panel Title & PUIL Badge */}
          <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-white/10">
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className={`w-5 h-5 rounded-lg flex items-center justify-center border shrink-0 ${
                  isMcbTripped
                    ? 'bg-red-500/20 border-red-400/50 text-red-300'
                    : isGridConnected
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                    : 'bg-sky-500/15 border-sky-400/30 text-sky-300'
                }`}
              >
                {isMcbTripped ? (
                  <AlertTriangle className="w-3 h-3 animate-bounce" />
                ) : isGridConnected ? (
                  <ShieldCheck className="w-3 h-3" />
                ) : (
                  <Radio className="w-3 h-3" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-100 leading-tight truncate">
                  {isId ? 'Panel Distribusi Lab' : 'Lab Distribution Box'}
                </div>
                <div className="text-[8px] font-mono text-slate-400 leading-tight truncate">
                  {isId ? 'Trafo Step-Down · MCB' : 'Step-Down · MCB'}
                </div>
              </div>
            </div>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isMcbTripped
                  ? 'bg-red-500 animate-ping'
                  : isGridConnected
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-slate-600'
              }`}
            />
          </div>

          {/* Digital kWh & Telemetry LCD Screen */}
          <div className="mt-2 rounded-xl bg-void-950 border border-white/10 px-2.5 py-1.5 font-mono">
            <div className="flex items-center justify-between text-[8px] uppercase tracking-wider text-slate-400 mb-0.5">
              <span>
                {isMcbTripped
                  ? isId
                    ? '⚠️ TRIP KORSLETING'
                    : '⚠️ SHORT TRIP'
                  : !isMcbOn
                  ? isId
                    ? 'MCB DIPUTUS (OFF)'
                    : 'MCB OPEN (OFF)'
                  : isGridConnected
                  ? isId
                    ? `TERHUBUNG (${connectedCount} UNIT)`
                    : `GRID LINKED (${connectedCount})`
                  : isId
                  ? 'STANDBY (PASANG DI ALAM)'
                  : 'STANDBY (NO OUTDOOR LINK)'}
              </span>
              <span className="text-cyan-400 font-bold">DC</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span
                className={`text-xs font-black ${
                  isMcbTripped
                    ? 'text-red-400'
                    : isGridConnected
                    ? 'text-emerald-300'
                    : 'text-slate-400'
                }`}
              >
                {busVoltage.toFixed(1)} V
              </span>
              <span className="text-[10px] font-bold text-amber-300">{currentDisplay}</span>
            </div>
          </div>

          {/* Interactive MCB Breaker Switch */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleToggleMcb}
            className={`nodrag mt-2 w-full py-1 px-2 rounded-lg font-mono text-[9px] font-bold border flex items-center justify-between transition-all active:scale-95 cursor-pointer ${
              isShaking ? 'animate-shake' : ''
            } ${
              isMcbTripped
                ? 'bg-red-950/90 hover:bg-red-900 text-red-200 border-red-400 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                : isMcbOn
                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-400/40'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-white/15'
            }`}
            title={
              isId
                ? 'Klik untuk menyalakan/mematikan atau me-reset pengaman MCB'
                : 'Click to toggle or reset the MCB circuit breaker'
            }
          >
            <span className="flex items-center gap-1">
              <Power className="w-2.5 h-2.5" />
              <span>
                {isMcbTripped
                  ? isId
                    ? 'MCB TRIP! Klik Reset'
                    : 'MCB TRIP! Reset'
                  : isMcbOn
                  ? isId
                    ? 'Pengaman MCB: ON'
                    : 'MCB Breaker: ON'
                  : isId
                  ? 'Pengaman MCB: OFF'
                  : 'MCB Breaker: OFF'}
              </span>
            </span>
            <span
              className={`px-1 py-0.2 rounded text-[8px] ${
                isMcbOn ? 'bg-emerald-400/20 text-emerald-200' : 'bg-black/40 text-slate-400'
              }`}
            >
              {isMcbOn ? 'I' : 'O'}
            </span>
          </button>

          {/* Quick Helper for Active Short Circuit Recovery */}
          {isMcbTripped && (
            <div className="nodrag mt-1.5 flex flex-col gap-1">
              <div className="text-[7.5px] font-mono font-medium text-red-300 bg-red-950/80 border border-red-500/40 rounded px-1.5 py-1 leading-tight flex items-start gap-1 shadow-[0_0_8px_rgba(239,68,68,0.25)]">
                <AlertTriangle className="w-2.5 h-2.5 text-red-400 shrink-0 mt-0.5" />
                <span>{shortCircuitGuidance}</span>
              </div>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleDisconnectAndReset}
                className="w-full py-1 px-1.5 rounded-lg font-mono text-[8.5px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/50 flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.25)]"
                title={
                  isId
                    ? 'Cabut semua kabel yang korslet dan nyalakan kembali MCB'
                    : 'Disconnect shorted wires and reset MCB'
                }
              >
                <Scissors className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                <span>{isId ? '✂️ Putus Kabel & Reset' : '✂️ Cut Wires & Reset'}</span>
              </button>
            </div>
          )}

          {/* Step-Down DC Voltage Regulator Selector */}
          <div className="nodrag mt-1.5">
            <div className="text-[8px] font-mono text-slate-400 mb-1 flex items-center justify-between">
              <span>{isId ? 'Batas Step-Down DC:' : 'Step-Down Ceiling:'}</span>
              <span className="text-cyan-300 font-bold">
                {stepDownVoltage === null ? (isId ? 'Langsung' : 'Direct') : `Maks ${stepDownVoltage}V`}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-0.5">
              {STEP_DOWN_OPTIONS.map((opt) => {
                const isActiveOpt = stepDownVoltage === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => handleSelectStepDown(e, opt.value)}
                    className={`py-0.5 rounded text-[8px] font-mono font-bold border transition-all active:scale-95 cursor-pointer ${
                      isActiveOpt
                        ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60'
                        : 'bg-void-950/90 text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Output Busbar Terminals (+ and -) */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="pos"
            style={{ left: '34%', bottom: '-9px', transform: 'translateX(-50%)' }}
            className="!w-5 !h-5 !bg-red-500 !border-2 !border-white !rounded-full shadow-[0_0_12px_rgba(239,68,68,0.95)] hover:!scale-125 transition-transform cursor-crosshair z-40 flex items-center justify-center"
            title={isId ? 'Terminal Output Positif (+) DC Lab' : 'Positive (+) Lab DC Output'}
          >
            <span className="text-[10px] font-mono font-black text-white leading-none pointer-events-none">
              +
            </span>
          </Handle>

          <Handle
            type="source"
            position={Position.Bottom}
            id="neg"
            style={{ left: '66%', bottom: '-9px', transform: 'translateX(-50%)' }}
            className="!w-5 !h-5 !bg-sky-500 !border-2 !border-white !rounded-full shadow-[0_0_12px_rgba(56,189,248,0.95)] hover:!scale-125 transition-transform cursor-crosshair z-40 flex items-center justify-center"
            title={isId ? 'Terminal Output Negatif (-) DC Lab' : 'Negative (-) Lab DC Output'}
          >
            <span className="text-[11px] font-mono font-black text-white leading-none pointer-events-none">
              -
            </span>
          </Handle>
        </div>
      );
    }

    // =========================================================================
    // MODE B: OUTDOOR HIGH-VOLTAGE TRANSMISSION PYLON (Menara SUTET Alam)
    // =========================================================================
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
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-400/50 shadow-[0_0_14px_rgba(16,185,129,0.35)]'
              : 'bg-void-950/90 text-slate-200 border-white/20'
          }`}
        >
          <div className="flex items-center gap-1 whitespace-nowrap">
            {isGridConnected ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <Zap className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>
                  {isId
                    ? `Grid → Lab (${busVoltage.toFixed(1)}V)`
                    : `Grid → Lab (${busVoltage.toFixed(1)}V)`}
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
              className="absolute inset-x-5 top-6 bottom-6 rounded-full pointer-events-none bg-cyan-400/15 blur-xl animate-pulse"
              aria-hidden="true"
            />
          )}

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
      </div>
    );
  }
);

TransmissionTowerNode.displayName = 'TransmissionTowerNode';
