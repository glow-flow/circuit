import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position, NodeProps } from 'reactflow';
import { BatteryCharging, Zap, Shield, RotateCcw, X, Info } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { computeEffectiveBatteryVoltage } from '../../../physics/batterySoC';
import { useModalKeyboardClose } from '../../../hooks/useModalKeyboardClose';

/**
 * Outdoor BESS (Battery Energy Storage System) Substation Node.
 *
 * Implements high-voltage/capacity industrial energy storage:
 * - Visual: Rugged metallic industrial substation enclosure with dark glass telemetry display.
 * - Chemistry: Lithium Iron Phosphate (LiFePO4 / LFP) 1000 Wh (1.0 kWh), 12.8V nominal.
 * - Integrated Telemetry HUD: Real-time SoC%, Charge/Discharge dynamic status, power flow, and voltage sag.
 * - Interactive Inspector Modal: Detailed Coulomb counting, capacity monitor, and instant charge slider.
 *
 * Time Complexity: O(1) render.
 */
export const BessSubstationNode: React.FC<NodeProps<CircuitElementData>> = ({
  id,
  data,
  selected,
}) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);
  const updateComponentData = useCircuitStore((state) => state.updateComponentData);

  const [isInspectOpen, setIsInspectOpen] = useState(false);
  useModalKeyboardClose(isInspectOpen, () => setIsInspectOpen(false));
  const isId = language === 'id';

  const soc = Math.max(0, Math.min(100, data.socPercent ?? data.currentCharge ?? 80));
  const nominalVoltage = data.voltage ?? 12.8;
  const effectiveVoltage = computeEffectiveBatteryVoltage(nominalVoltage, soc);
  const current = simulation.branchCurrents[id] ?? 0;
  const absCurrent = Math.abs(current);
  // Determine dynamic charge state: current flowing into positive terminal is charging (> 0.05A)
  const isCharging = current > 0.05;
  const isDischarging = current < -0.05;

  const activePowerWatts = Math.round(effectiveVoltage * absCurrent * 10) / 10;
  const storedEnergyWh = Math.round((soc / 100) * (data.nominalCapacityWh ?? 1000));

  const handleSocSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextSoc = parseInt(e.target.value, 10);
      const nominalCapacityWh = data.nominalCapacityWh ?? 1000;
      updateComponentData(id, {
        socPercent: nextSoc,
        currentCharge: nextSoc,
        storedEnergyWh: Number(((nextSoc / 100) * nominalCapacityWh).toFixed(1)),
      });
    },
    [id, data.nominalCapacityWh, updateComponentData]
  );

  const handleRechargeFull = useCallback(() => {
    const nominalCapacityWh = data.nominalCapacityWh ?? 1000;
    updateComponentData(id, {
      socPercent: 100,
      currentCharge: 100,
      storedEnergyWh: nominalCapacityWh,
      voltage: 12.8,
    });
  }, [id, data.nominalCapacityWh, updateComponentData]);

  // Telemetry gauge colors
  const gaugeColor =
    soc > 40
      ? 'from-emerald-500 to-green-400'
      : soc > 15
      ? 'from-amber-500 to-yellow-400'
      : 'from-rose-600 to-red-500';

  const textColor =
    soc > 40 ? 'text-emerald-400' : soc > 15 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div
      className={`relative select-none transition-transform duration-150 ${
        selected ? 'ring-2 ring-emerald-400/90 rounded-xl' : ''
      }`}
      style={{ width: '156px', height: '116px' }}
    >
      {/* Background Substation Image */}
      <img
        src="/assets/bess-substation.png"
        alt="BESS Substation"
        draggable={false}
        className="w-full h-full object-contain pointer-events-none select-none z-10 relative drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
      />

      {/* Dark Glass Telemetry Screen Overlay (Upper Center Screen) */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setIsInspectOpen(true);
        }}
        title={isId ? 'Klik untuk telemetri BESS' : 'Click for BESS telemetry'}
        className="nodrag absolute top-[18px] left-[32px] w-[92px] h-[52px] z-20 cursor-pointer rounded bg-slate-950/90 border border-emerald-500/35 p-1 flex flex-col justify-between overflow-hidden shadow-inner group hover:border-emerald-400 transition-colors"
      >
        {/* Top Header: BESS Capacity & Mode Badge */}
        <div className="flex items-center justify-between">
          <span className="text-[7.5px] font-mono font-bold tracking-tight text-slate-300">
            BESS 1kWh
          </span>
          <span
            className={`text-[7px] font-mono font-black px-1 rounded-sm leading-tight flex items-center gap-0.5 ${
              isCharging
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                : isDischarging
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isCharging && <Zap className="w-2 h-2 text-emerald-400" />}
            {isDischarging && <BatteryCharging className="w-2 h-2 text-amber-400" />}
            {isCharging ? 'CHG' : isDischarging ? 'DIS' : 'IDLE'}
          </span>
        </div>

        {/* Center: Live SoC % and Power */}
        <div className="flex items-baseline justify-between tabular-nums">
          <div className="flex items-baseline gap-0.5">
            <span className={`text-[13px] font-mono font-black leading-none ${textColor}`}>
              {Math.round(soc)}
            </span>
            <span className="text-[8px] font-mono text-slate-400 leading-none">%</span>
          </div>
          <span className="text-[8px] font-mono font-medium text-slate-300">
            {activePowerWatts > 0 ? `${activePowerWatts}W` : `${effectiveVoltage.toFixed(1)}V`}
          </span>
        </div>

        {/* Bottom: Progress Bar */}
        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/10">
          <div
            className={`h-full bg-gradient-to-r ${gaugeColor} transition-all duration-300`}
            style={{ width: `${soc}%` }}
          />
        </div>
      </div>

      {/* Info Icon Pill for Touch Discovery */}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setIsInspectOpen(true);
        }}
        className="nodrag absolute top-1 right-1 z-30 w-6 h-6 rounded-full bg-slate-900/90 border border-white/20 text-slate-300 hover:text-white flex items-center justify-center shadow hover:scale-110 active:scale-95 transition-transform cursor-pointer"
        title={isId ? 'Detail BESS' : 'BESS Details'}
      >
        <Info className="w-3.5 h-3.5 text-emerald-400" />
      </button>

      {/* Elevated High-Visibility Binding Post Terminals */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="pos"
        style={{ left: '42%', bottom: '10px', transform: 'translateX(-50%)' }}
        className="!w-5 !h-5 !bg-red-500 !border-2 !border-white !rounded-full shadow-[0_0_10px_rgba(239,68,68,0.85)] hover:!scale-125 transition-transform cursor-crosshair z-40 flex items-center justify-center"
        title={isId ? 'Kutub Positif BESS (+)' : 'BESS Positive (+)'}
      >
        <span className="text-[9px] font-mono font-black text-white leading-none pointer-events-none">
          +
        </span>
      </Handle>

      <Handle
        type="source"
        position={Position.Bottom}
        id="neg"
        style={{ left: '58%', bottom: '10px', transform: 'translateX(-50%)' }}
        className="!w-5 !h-5 !bg-sky-500 !border-2 !border-white !rounded-full shadow-[0_0_10px_rgba(56,189,248,0.85)] hover:!scale-125 transition-transform cursor-crosshair z-40 flex items-center justify-center"
        title={isId ? 'Kutub Negatif BESS (-)' : 'BESS Negative (-)'}
      >
        <span className="text-[10px] font-mono font-black text-white leading-none pointer-events-none">
          -
        </span>
      </Handle>

      {/* Interactive Modal Telemetry Inspector via Portal */}
      {isInspectOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={() => setIsInspectOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 pointer-events-auto"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-slate-900 border border-white/15 p-5 shadow-2xl text-white font-sans select-none"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">
                      {isId ? 'Gardu Baterai BESS' : 'BESS Battery Substation'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      LiFePO4 · 12.8V 83Ah (1000 Wh)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInspectOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5 my-4">
                <div className="p-3 rounded-xl bg-slate-800/70 border border-white/5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    {isId ? 'Status Daya' : 'Power Mode'}
                  </span>
                  <p className="text-sm font-bold mt-0.5 flex items-center gap-1.5">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        isCharging
                          ? 'bg-emerald-400'
                          : isDischarging
                          ? 'bg-amber-400'
                          : 'bg-slate-400'
                      }`}
                    />
                    {isCharging
                      ? isId
                        ? 'Mengisi Daya (+)'
                        : 'Charging (+)'
                      : isDischarging
                      ? isId
                        ? 'Menyalurkan (-)'
                        : 'Discharging (-)'
                      : isId
                      ? 'Siaga (Idle)'
                      : 'Standby (Idle)'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/70 border border-white/5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    {isId ? 'Tegangan Efektif' : 'Effective Voltage'}
                  </span>
                  <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5 tabular-nums">
                    {effectiveVoltage.toFixed(2)} V
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/70 border border-white/5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    {isId ? 'Energi Tersimpan' : 'Stored Energy'}
                  </span>
                  <p className="text-sm font-bold font-mono text-cyan-300 mt-0.5 tabular-nums">
                    {storedEnergyWh} Wh / 1000 Wh
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/70 border border-white/5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    {isId ? 'Daya Aktif' : 'Active Power'}
                  </span>
                  <p className="text-sm font-bold font-mono text-amber-300 mt-0.5 tabular-nums">
                    {activePowerWatts} W ({absCurrent.toFixed(2)} A)
                  </p>
                </div>
              </div>

              {/* Interactive SoC Slider for Classroom Experimentation */}
              <div className="space-y-2 mb-4 bg-slate-800/50 p-3 rounded-xl border border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">
                    {isId ? 'Kapasitas Baterai (SoC):' : 'State of Charge (SoC):'}
                  </span>
                  <span className={`font-mono font-bold text-sm tabular-nums ${textColor}`}>
                    {Math.round(soc)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(soc)}
                  onChange={handleSocSliderChange}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>0% ({isId ? 'Habis' : 'Empty'})</span>
                  <span>50%</span>
                  <span>100% ({isId ? 'Penuh' : 'Full'})</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRechargeFull}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-transform cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {isId ? 'Isi Ulang 100%' : 'Recharge to 100%'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsInspectOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-semibold transition-transform cursor-pointer"
                >
                  {isId ? 'Tutup' : 'Close'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
