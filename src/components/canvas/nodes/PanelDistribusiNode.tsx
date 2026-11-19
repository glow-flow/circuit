import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Handle, Position, NodeProps, useUpdateNodeInternals } from 'reactflow';
import { CircuitElementData } from '../../../types/circuit';
import { AlertTriangle, Scissors } from 'lucide-react';
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
 * PanelDistribusiNode Component (Hybrid UI).
 *
 * Combines high-resolution photorealistic hardware asset (`/assets/distribution-panel.png`)
 * with interactive HTML/CSS overlays for:
 * 1. Title text above the panel
 * 2. High-contrast neon LCD screen displaying Voltage (V) & Current (mA)
 * 3. Physical tactile MCB toggle switch (ON/OFF/TRIP)
 * 4. 5 stepped DC voltage push-buttons (Auto, 3V, 6V, 9V, 12V) that trigger MNA Solver
 * 5. High-precision positive (+) and negative (-) output handles centered over the terminal posts.
 *
 * Time Complexity: O(1) render.
 */
export const PanelDistribusiNode: React.FC<NodeProps<CircuitElementData>> = memo(
  ({ id, data, selected }) => {
    const language = useCircuitStore((state) => state.language);
    const edges = useCircuitStore((state) => state.edges);
    const updateComponentData = useCircuitStore((state) => state.updateComponentData);
    const resetLabPanelMcb = useCircuitStore((state) => state.resetLabPanelMcb);
    const disconnectAndResetMcb = useCircuitStore((state) => state.disconnectAndResetMcb);
    const notify = useCircuitStore((state) => state.notify);
    const isId = language === 'id';

    const updateNodeInternals = useUpdateNodeInternals();
    useEffect(() => {
      updateNodeInternals(id);
    }, [id, updateNodeInternals]);

    const [isShaking, setIsShaking] = useState(false);

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
        notify(
          targetVoltage === null
            ? isId
              ? 'Tegangan Output: Auto (Langsung dari Generator/Pembangkit)'
              : 'Output Voltage: Auto (Direct from Generator)'
            : isId
            ? `Tegangan Output diatur ke ${targetVoltage}V DC (Step-Down Regulator)`
            : `Output Voltage set to ${targetVoltage}V DC (Step-Down Regulator)`
        );
      },
      [id, isId, notify, updateComponentData]
    );

    return (
      <div
        className={`relative flex flex-col items-center select-none transition-all duration-200 w-[230px] group ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        <div className="text-center font-bold text-ink text-[10px] tracking-wide mb-1 uppercase select-none pointer-events-none flex items-center justify-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isMcbTripped
                ? 'bg-danger-500'
                : isGridConnected
                ? 'bg-emerald-500'
                : 'bg-slate-400'
            }`}
          />
          <span>{isId ? 'Panel Distribusi' : 'Distribution Panel'}</span>
          <span className="text-[9px] font-mono text-electric-400 font-normal">
            ({stepDownVoltage ? `${stepDownVoltage}V` : 'Auto'})
          </span>
        </div>

        {/* Photorealistic Panel Image Container */}
        <div
          className={`relative w-[230px] h-[309px] overflow-visible rounded-xl transition-all duration-200 ${
            selected
              ? 'ring-2 ring-electric-400'
              : isMcbTripped
              ? 'ring-2 ring-danger-500'
              : ''
          }`}
          style={{ width: 230, height: 309 }}
        >
          <img
            src="/assets/distribution-panel.png"
            alt={isId ? 'Panel Distribusi Lab' : 'Lab Distribution Panel'}
            width={230}
            height={309}
            className="w-full h-full object-contain pointer-events-none select-none block drop-shadow-md"
            draggable={false}
            onLoad={() => updateNodeInternals(id)}
          />

          {/* Fixed bright inks over dark PNG LCD window (never invert in Light Mode) */}
          <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-[80%] h-[21%] px-3 py-1 flex flex-col justify-between font-mono select-none pointer-events-none tabular-nums">
            <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-wider">
              <span
                className={`truncate ${
                  isMcbTripped
                    ? 'text-[#FCA5A5] font-black'
                    : !isMcbOn
                    ? 'text-[#94A3B8]'
                    : isGridConnected
                    ? 'text-[#6EE7B7]'
                    : 'text-[#7DD3FC]'
                }`}
              >
                {isMcbTripped
                  ? isId
                    ? 'TRIP KORSLET'
                    : 'SHORT TRIP'
                  : !isMcbOn
                  ? isId
                    ? 'MCB MATI (OFF)'
                    : 'MCB OFF'
                  : isGridConnected
                  ? isId
                    ? `GRID AKTIF (${connectedCount})`
                    : `GRID LINK (${connectedCount})`
                  : isId
                  ? 'CATU DAYA LAB'
                  : 'LAB DC SUPPLY'}
              </span>
              <span className="text-[#38BDF8] text-[8px] font-black">DC</span>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-0.5">
                <span
                  className={`text-sm font-black tracking-tight ${
                    isMcbTripped
                      ? 'text-[#FCA5A5]'
                      : isMcbOn
                      ? 'text-[#7DD3FC]'
                      : 'text-[#94A3B8]'
                  }`}
                >
                  {busVoltage.toFixed(1)}
                </span>
                <span className="text-[9px] text-[#38BDF8] font-bold">V</span>
              </div>

              <div className="flex items-baseline gap-0.5">
                <span
                  className={`text-xs font-black tracking-tight ${
                    currentAmperes > 0.001
                      ? 'text-[#FCD34D]'
                      : 'text-[#94A3B8]'
                  }`}
                >
                  {currentDisplay}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive MCB toggle button on PNG panel bezel */}
          <button
            type="button"
            aria-pressed={isMcbOn}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleToggleMcb}
            title={
              isMcbTripped
                ? isId
                  ? 'MCB Trip akibat korsleting! Klik untuk me-reset'
                  : 'MCB Tripped! Click to reset'
                : isId
                ? `Klik untuk mengubah MCB ke ${isMcbOn ? 'OFF' : 'ON'}`
                : `Click to toggle MCB ${isMcbOn ? 'OFF' : 'ON'}`
            }
            className={`nodrag absolute top-[50.5%] right-[9%] w-[25%] h-[9%] rounded-md font-mono text-[10px] font-black flex items-center justify-center transition-colors active:scale-95 cursor-pointer shadow-sm select-none ${
              isMcbTripped
                ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white border border-[#FCA5A5]'
                : isMcbOn
                ? 'bg-[#047857] hover:bg-[#065F46] text-white border border-[#6EE7B7]'
                : 'bg-[#0F172A] hover:bg-[#1E293B] text-[#E2E8F0] border border-[#64748B]'
            }`}
          >
            {isMcbTripped ? 'TRIP' : isMcbOn ? 'ON' : 'OFF'}
          </button>

          {/* 5 Step-Down voltage buttons on dark panel bezel */}
          <div
            className="absolute top-[65.8%] left-[8%] w-[84%] h-[9.4%] flex items-center justify-between"
            role="group"
            aria-label={isId ? 'Pemilih Tegangan Step-Down' : 'Step-Down Voltage Selector'}
          >
            {STEP_DOWN_OPTIONS.map((opt) => {
              const isSelected = stepDownVoltage === opt.value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  aria-pressed={isSelected}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => handleSelectStepDown(e, opt.value)}
                  title={
                    opt.value === null
                      ? isId
                        ? 'Tegangan Auto: disesuaikan dengan sumber daya dari alam'
                        : 'Auto: matched with renewable power source'
                      : isId
                      ? `Atur batas tegangan output ke ${opt.value}V DC`
                      : `Set output voltage ceiling to ${opt.value}V DC`
                  }
                  className={`nodrag w-[17.5%] h-full rounded-md font-mono text-[9px] font-black flex items-center justify-center transition-colors active:scale-95 cursor-pointer select-none tabular-nums ${
                    isSelected
                      ? 'bg-[#1D4ED8] text-white border border-[#7DD3FC]'
                      : 'bg-[#0F172A] hover:bg-[#1E293B] text-[#CBD5E1] hover:text-white border border-[#334155]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Handle (+) Red Banana Binding Post */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="pos"
            style={{ left: '32.5%', top: '90.7%', bottom: 'auto', transform: 'translate(-50%, -50%)' }}
            className="!w-5 !h-5 !bg-red-600 !border-2 !border-white !rounded-full shadow-sm hover:!scale-125 transition-transform cursor-crosshair z-50 flex items-center justify-center pointer-events-auto before:absolute before:-inset-3.5 before:content-[''] before:rounded-full before:z-50"
            title={isId ? 'Terminal Output Positif (+) DC Lab' : 'Positive (+) Lab DC Output'}
          >
            <span className="text-[10px] font-mono font-black text-white leading-none pointer-events-none">
              +
            </span>
          </Handle>

          {/* Handle (-) Negative Binding Post */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="neg"
            style={{ left: '67.2%', top: '89.1%', bottom: 'auto', transform: 'translate(-50%, -50%)' }}
            className="!w-5 !h-5 !bg-sky-600 !border-2 !border-white !rounded-full shadow-sm hover:!scale-125 transition-transform cursor-crosshair z-50 flex items-center justify-center pointer-events-auto before:absolute before:-inset-3.5 before:content-[''] before:rounded-full before:z-50"
            title={isId ? 'Terminal Output Negatif (-) DC Lab' : 'Negative (-) Lab DC Output'}
          >
            <span className="text-[11px] font-mono font-black text-white leading-none pointer-events-none">
              -
            </span>
          </Handle>
        </div>

        {/* Short-circuit guidance & quick reset */}
        {isMcbTripped && (
          <div className="nodrag mt-2 w-full flex flex-col gap-1 z-30">
            <div className="text-[9px] font-mono font-semibold text-danger-200 bg-danger-950 border border-danger-500 rounded-lg p-1.5 leading-tight flex items-start gap-1 shadow-md">
              <AlertTriangle className="w-3 h-3 text-danger-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                {shortCircuitGuidance ||
                  (isId
                    ? 'Korsleting terdeteksi! Putuskan kabel yang bersentuhan lalu klik tombol TRIP untuk me-reset.'
                    : 'Short circuit detected! Disconnect conflicting wires then tap TRIP to reset.')}
              </span>
            </div>

            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleDisconnectAndReset}
              className="w-full min-h-[36px] py-1.5 px-2 rounded-lg bg-danger-600 hover:bg-danger-700 text-white font-mono text-[9px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-colors shadow-md cursor-pointer"
            >
              <Scissors className="w-3 h-3" aria-hidden="true" />
              <span>{isId ? 'Putus Kabel Korslet & Reset MCB' : 'Cut Shorting Wire & Reset MCB'}</span>
            </button>
          </div>
        )}
      </div>
    );
  }
);

PanelDistribusiNode.displayName = 'PanelDistribusiNode';
