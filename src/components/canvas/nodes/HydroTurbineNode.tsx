import React, { useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Waves, Info, X, Droplets } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { calculateHydroOperatingPoint } from '../../../physics/hydroPhysics';

/**
 * Waterfall Micro-Hydro Generator Node (`type: 'hydro-turbine'`).
 *
 * Implements fluid electromechanics:
 * - Visual: Stator A-Frame structure with Pelton runner rotor wheel mounted in the top bearing hub.
 * - Dynamic Rotation: Rotor wheel rotates smoothly via CSS keyframe animation with speed proportional to water flow (Q) and head (H).
 * - Physics: P_hydro = eta * rho * g * Q * H, generating up to 12.0V - 24.0V DC.
 * - Responsive Feedback: Floating status badge shows live water flow and electrical power generated.
 * - Interactive Inspector Modal: Formula breakdown, head elevation metrics, and test water valve slider.
 *
 * Time Complexity: O(1) render.
 */
export const HydroTurbineNode: React.FC<NodeProps<CircuitElementData>> = ({
  id,
  data,
  selected,
}) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);
  const updateComponentData = useCircuitStore((state) => state.updateComponentData);

  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const isId = language === 'id';

  // Effective flow and head
  const flowPercentage = data.waterFlowRate ?? 0;
  const headMeters = data.hydraulicHeadMeters ?? 2.0;

  // Operating point from hydro physics engine (DRY)
  const hydroPoint = calculateHydroOperatingPoint(flowPercentage, headMeters);
  const nominalVoltage = data.voltage ?? hydroPoint.voltage;

  const current = Math.abs(simulation.branchCurrents[id] ?? 0);
  const isGenerating = hydroPoint.isGenerating && nominalVoltage > 0;
  const formattedCurrent =
    current === 0
      ? '0 mA'
      : current < 1
      ? `${(current * 1000).toFixed(1)} mA`
      : `${current.toFixed(2)} A`;

  const handleFlowSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextFlow = parseInt(e.target.value, 10);
      const nextPoint = calculateHydroOperatingPoint(nextFlow, headMeters);
      updateComponentData(id, {
        waterFlowRate: nextFlow,
        voltage: nextPoint.voltage,
        hasWaterContact: nextFlow > 0,
      });
    },
    [id, headMeters, updateComponentData]
  );

  return (
    <div
      className={`relative select-none transition-transform duration-150 ${
        selected ? 'ring-2 ring-cyan-400/90 rounded-2xl' : ''
      }`}
      style={{ width: '144px', height: '144px' }}
    >
      {/* Floating Water Flow & Power Telemetry Badge */}
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap z-30">
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsInspectOpen(true);
          }}
          className={`px-2 py-0.5 rounded-full border text-[9px] font-mono font-bold flex items-center gap-1 shadow-md cursor-pointer transition-colors active:scale-95 ${
            isGenerating
              ? 'bg-cyan-950/90 border-cyan-400/70 text-cyan-300 shadow-cyan-500/20'
              : 'bg-slate-900/90 border-slate-700 text-slate-400'
          }`}
        >
          {isGenerating ? (
            <>
              <Waves className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
              <span>
                {flowPercentage}% • {hydroPoint.powerWatts}W
              </span>
            </>
          ) : (
            <>
              <Droplets className="w-2.5 h-2.5 text-slate-400" />
              <span>{isId ? 'Butuh Air' : 'Needs Water'}</span>
            </>
          )}
        </div>
      </div>

      {/* Runner Rotor Wheel (Asset 4: Pelton Wheel mounted at top bearing hub) */}
      <div
        className="absolute z-10 pointer-events-none select-none transition-transform"
        style={{
          left: '50%',
          top: '16.5%',
          width: '68px',
          height: '68px',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <img
          src="/assets/hydro-runner.png"
          alt="Hydro Runner Rotor"
          draggable={false}
          className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
          style={{
            animation: hydroPoint.rotationDurationSeconds
              ? `spin ${hydroPoint.rotationDurationSeconds}s linear infinite`
              : 'none',
          }}
        />
      </div>

      {/* Frame Stator Structure (Asset 3: A-Frame Base with Terminals) */}
      <img
        src="/assets/hydro-frame.png"
        alt="Micro-Hydro A-Frame Stator"
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-20 drop-shadow-[0_6px_14px_rgba(0,0,0,0.5)]"
      />

      {/* Info Icon Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsInspectOpen(true);
        }}
        className="absolute top-1 right-1 z-30 w-5 h-5 rounded-full bg-slate-900/90 border border-white/20 text-slate-300 hover:text-white flex items-center justify-center shadow hover:scale-110 active:scale-95 transition-transform"
        title={isId ? 'Detail Mikrohidro' : 'Micro-Hydro Details'}
      >
        <Info className="w-3 h-3 text-cyan-400" />
      </button>

      {/* Elevated High-Visibility Binding Post Terminals */}
      {/* Positive Terminal (+ Red Binding Post) at left 46%, bottom 4px */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="pos"
        style={{ left: '46%', bottom: '4px', transform: 'translateX(-50%)' }}
        className="!w-4 !h-4 !bg-red-500 !border-2 !border-white !rounded-full shadow-[0_0_10px_rgba(239,68,68,0.9)] hover:!scale-125 transition-transform cursor-crosshair z-40 flex items-center justify-center"
        title={isId ? 'Kutub Positif Generator (+)' : 'Hydro Positive (+)'}
      >
        <span className="text-[8px] font-mono font-black text-white leading-none pointer-events-none">
          +
        </span>
      </Handle>

      {/* Negative Terminal (- Black Binding Post) at right 54%, bottom 4px */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="neg"
        style={{ left: '54%', bottom: '4px', transform: 'translateX(-50%)' }}
        className="!w-4 !h-4 !bg-sky-500 !border-2 !border-white !rounded-full shadow-[0_0_10px_rgba(56,189,248,0.9)] hover:!scale-125 transition-transform cursor-crosshair z-40 flex items-center justify-center"
        title={isId ? 'Kutub Negatif Generator (-)' : 'Hydro Negative (-)'}
      >
        <span className="text-[9px] font-mono font-black text-white leading-none pointer-events-none">
          -
        </span>
      </Handle>

      {/* Interactive Telemetry & Flow Adjustment Modal */}
      {isInspectOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-cyan-500/40 p-5 shadow-2xl text-white font-sans animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                  <Waves className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {isId ? 'Pembangkit Mikrohidro' : 'Micro-Hydro Turbine'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Pelton Runner • P = η · ρ · g · Q · H
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInspectOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center active:scale-95 transition-transform"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5 my-4">
              <div className="p-3 rounded-xl bg-slate-800/70 border border-white/5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  {isId ? 'Tinggi Jatuh (Head H)' : 'Hydraulic Head (H)'}
                </span>
                <p className="text-sm font-bold font-mono text-cyan-400 mt-0.5">
                  {headMeters.toFixed(1)} meter
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/70 border border-white/5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  {isId ? 'Kecepatan Kincir (RPM)' : 'Rotor Speed (RPM)'}
                </span>
                <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                  {hydroPoint.rpm} RPM
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/70 border border-white/5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  {isId ? 'Tegangan GGL (V)' : 'Generated EMF (V)'}
                </span>
                <p className="text-sm font-bold font-mono text-amber-300 mt-0.5">
                  {nominalVoltage.toFixed(1)} V
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/70 border border-white/5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  {isId ? 'Daya Listrik (W)' : 'Output Power (W)'}
                </span>
                <p className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
                  {hydroPoint.powerWatts} W ({formattedCurrent})
                </p>
              </div>
            </div>

            {/* Interactive Flow Rate Slider */}
            <div className="space-y-2 mb-4 bg-slate-800/50 p-3 rounded-xl border border-white/5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">
                  {isId ? 'Debit Aliran Air (Q):' : 'Water Flow Rate (Q):'}
                </span>
                <span className="font-mono font-bold text-sm text-cyan-400">
                  {flowPercentage}% ({hydroPoint.flowRateM3S * 1000} L/detik)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={flowPercentage}
                onChange={handleFlowSliderChange}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>0% ({isId ? 'Kering' : 'Dry'})</span>
                <span>50%</span>
                <span>100% ({isId ? 'Maksimal' : 'Max'})</span>
              </div>
            </div>

            {/* Educational Insight for SMP Students */}
            <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-[11px] text-cyan-200/90 leading-relaxed mb-4">
              💡 {isId
                ? 'Semakin tinggi tebing air terjun (Head H) dan semakin deras debit air (Q), semakin besar energi potensial gravitasi yang diubah menjadi listrik oleh sudu Pelton.'
                : 'Higher waterfall drop (Head H) and larger flow volume (Q) produce greater gravitational potential energy converted into electricity by the Pelton runner.'}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsInspectOpen(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-semibold transition-transform"
            >
              {isId ? 'Tutup' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
