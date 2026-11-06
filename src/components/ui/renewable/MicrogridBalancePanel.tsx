import React from 'react';
import {
  SolarOperatingPoint,
  WindOperatingPoint,
  BessState,
  MicrogridPowerBalance,
} from '../../../types/renewable';

export interface MicrogridBalancePanelProps {
  isId: boolean;
  solarPoint: SolarOperatingPoint;
  windPoint: WindOperatingPoint;
  bessState: BessState;
  microgridBalance: MicrogridPowerBalance;
  loadDemandWatts: number;
}

/**
 * MicrogridBalancePanel renders the real-time power balance across
 * Solar PV, Wind Turbine, Common DC Bus, BESS Storage, and Consumer Load.
 *
 * Time Complexity: O(1) pure telemetry presentation.
 */
export const MicrogridBalancePanel: React.FC<MicrogridBalancePanelProps> = ({
  isId,
  solarPoint,
  windPoint,
  bessState,
  microgridBalance,
  loadDemandWatts,
}) => {
  const statusLabel =
    microgridBalance.status === 'self_sufficient_surplus'
      ? isId
        ? 'Mandiri (Surplus Daya)'
        : 'Self-Sufficient (Surplus)'
      : microgridBalance.status === 'bess_supporting'
      ? isId
        ? 'Didukung Cadangan BESS'
        : 'BESS Supporting'
      : isId
      ? 'Impor Grid / Defisit'
      : 'Grid Import / Deficit';

  const statusBadgeClass =
    microgridBalance.status === 'self_sufficient_surplus'
      ? 'bg-electric-500/15 text-electric-300 border-electric-500/35'
      : microgridBalance.status === 'bess_supporting'
      ? 'bg-void-950 text-slate-200 border-white/20'
      : 'bg-red-500/15 text-red-300 border-red-500/35';

  return (
    <section
      aria-label={isId ? 'Keseimbangan Daya Microgrid' : 'Microgrid Power Flow Balance'}
      className="rounded-2xl bg-void-900 border border-white/10 p-4 sm:p-5 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/10 pb-3">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
            {isId
              ? 'Keseimbangan Daya Microgrid (Power Flow Balance)'
              : 'Microgrid Power Flow Balance'}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
          <span className={`px-2.5 py-1 rounded-md font-semibold border ${statusBadgeClass}`}>
            {statusLabel}
          </span>
          <span className="text-slate-400">
            {isId ? 'Otonomi Cadangan:' : 'Backup Autonomy:'}{' '}
            <strong className="text-slate-100">
              {microgridBalance.autonomyHours >= 900
                ? isId
                  ? 'Mandiri Penuh'
                  : 'Full Autonomy'
                : `${microgridBalance.autonomyHours} ${isId ? 'Jam' : 'Hrs'}`}
            </strong>
          </span>
        </div>
      </div>

      {/* 5-Column Hardware Instrument Readout Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Solar PV Generation */}
        <div className="rounded-xl bg-void-950 border border-white/10 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              {isId ? 'Surya (PV)' : 'Solar PV'}
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase">GEN</span>
          </div>
          <div className="my-2">
            <span className="text-2xl font-mono font-bold text-slate-100 tracking-tight">
              {solarPoint.pmpp}
            </span>
            <span className="text-xs font-mono text-slate-400 ml-1">W</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex justify-between border-t border-white/5 pt-1.5">
            <span>Voc: {solarPoint.openCircuitVoltage}V</span>
            <span>Isc: {solarPoint.shortCircuitCurrent}A</span>
          </div>
        </div>

        {/* 2. Wind Turbine Generation */}
        <div className="rounded-xl bg-void-950 border border-white/10 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              {isId ? 'Turbin Angin' : 'Wind Turbine'}
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase">GEN</span>
          </div>
          <div className="my-2">
            <span className="text-2xl font-mono font-bold text-slate-100 tracking-tight">
              {windPoint.electricalOutputWatts}
            </span>
            <span className="text-xs font-mono text-slate-400 ml-1">W</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex justify-between border-t border-white/5 pt-1.5">
            <span>RPM: {windPoint.estimatedRpm}</span>
            <span>Cp: {windPoint.effectiveCp}</span>
          </div>
        </div>

        {/* 3. Common DC Bus & Net Balance */}
        <div className="rounded-xl bg-void-950 border border-electric-500/35 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-electric-400">
              {isId ? 'DC Bus Bersama' : 'Common DC Bus'}
            </span>
            <span className="text-[10px] font-mono text-slate-400">P_NET</span>
          </div>
          <div className="my-2">
            <span
              className={`text-2xl font-mono font-bold tracking-tight ${
                microgridBalance.netPowerWatts >= 0
                  ? 'text-electric-400'
                  : 'text-red-400'
              }`}
            >
              {microgridBalance.netPowerWatts >= 0 ? '+' : ''}
              {microgridBalance.netPowerWatts}
            </span>
            <span className="text-xs font-mono text-slate-400 ml-1">W</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex justify-between border-t border-white/5 pt-1.5">
            <span>Gen: {microgridBalance.totalGenerationWatts}W</span>
            <span>Load: {microgridBalance.totalLoadWatts}W</span>
          </div>
        </div>

        {/* 4. BESS Battery Storage */}
        <div className="rounded-xl bg-void-950 border border-white/10 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              {isId ? 'Penyimpanan BESS' : 'BESS Storage'}
            </span>
            <span className="text-[10px] font-mono text-electric-400 font-bold">
              SoC {bessState.stateOfChargePercent}%
            </span>
          </div>
          <div className="my-2">
            <span className="text-2xl font-mono font-bold text-slate-100 tracking-tight">
              {bessState.activePowerWatts > 0 ? '+' : ''}
              {bessState.activePowerWatts}
            </span>
            <span className="text-xs font-mono text-slate-400 ml-1">W</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex justify-between border-t border-white/5 pt-1.5">
            <span>{bessState.mode.toUpperCase()}</span>
            <span>{bessState.currentEnergyWh} Wh</span>
          </div>
        </div>

        {/* 5. Connected Community Load */}
        <div className="rounded-xl bg-void-950 border border-white/10 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              {isId ? 'Beban Konsumen' : 'Consumer Load'}
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase">DEMAND</span>
          </div>
          <div className="my-2">
            <span className="text-2xl font-mono font-bold text-slate-100 tracking-tight">
              {loadDemandWatts}
            </span>
            <span className="text-xs font-mono text-slate-400 ml-1">W</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex justify-between border-t border-white/5 pt-1.5">
            <span>
              {isId ? 'Ekspor' : 'Export'}: {microgridBalance.gridExportWatts}W
            </span>
            <span>
              {isId ? 'Impor' : 'Import'}: {microgridBalance.gridImportWatts}W
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
