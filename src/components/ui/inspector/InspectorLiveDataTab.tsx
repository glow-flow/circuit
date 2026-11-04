import React from 'react';
import {
  Zap,
  Gauge,
  Flame,
  Activity,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { formatRupiah } from '../../../physics/plnCostCalculator';

interface InspectorLiveDataTabProps {
  componentData: CircuitElementData;
  nodeId: string;
}

/**
 * Inspector Tab 3: Live Data
 * Shows real-time voltage drop, branch current, dissipated power, Joule heating rate,
 * and PLN hourly operational cost simulation for the inspected component.
 *
 * Time Complexity: O(1)
 */
export const InspectorLiveDataTab: React.FC<InspectorLiveDataTabProps> = ({
  componentData,
  nodeId,
}) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);

  const isId = language === 'id';

  const branchCurrent = Math.abs(simulation.branchCurrents[nodeId] ?? 0);
  const voltage = Math.abs(
    componentData.calculatedVoltage ?? (componentData.voltage ?? 0)
  );
  const powerWatts = componentData.calculatedPower ?? voltage * branchCurrent;
  const resistance = componentData.resistance ?? 100;

  // Calculate PLN cost rate in IDR per hour using R-1/TR 1300VA tariff (Rp 1.444,70 / kWh)
  const hourlyCostIdr = (powerWatts / 1000) * 1444.70;
  const dailyCostIdr = hourlyCostIdr * 8;
  const formattedHourlyCost = formatRupiah(hourlyCostIdr);
  const formattedDailyCost = formatRupiah(dailyCostIdr);

  // Relative percentage of power compared to a 40W standard incandescent bulb
  const powerPercent = Math.min(100, (powerWatts / 40) * 100);

  return (
    <div className="p-4 space-y-4 text-xs font-sans">
      {/* Real-time Telemetry Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Voltage Drop */}
        <div className="p-3 rounded-xl bg-void-950 border border-sky-500/20 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>{isId ? 'Beda Potensial (V)' : 'Voltage Drop'}</span>
            <Zap className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-base font-mono font-bold text-sky-300">
            {voltage.toFixed(3)} <span className="text-xs text-sky-400 font-sans">Volt</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            V = I × R = {(branchCurrent * resistance).toFixed(2)}V
          </div>
        </div>

        {/* Branch Current */}
        <div className="p-3 rounded-xl bg-void-950 border border-amber-500/20 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>{isId ? 'Kuat Arus (I)' : 'Branch Current'}</span>
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-base font-mono font-bold text-amber-300">
            {branchCurrent < 1
              ? `${(branchCurrent * 1000).toFixed(1)} mA`
              : `${branchCurrent.toFixed(3)} A`}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {(branchCurrent * 1000).toFixed(2)} miliampere
          </div>
        </div>

        {/* Dissipated Power */}
        <div className="p-3 rounded-xl bg-void-950 border border-emerald-500/20 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>{isId ? 'Daya Disipasi (P)' : 'Dissipated Power'}</span>
            <Flame className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base font-mono font-bold text-emerald-300">
            {powerWatts.toFixed(3)} <span className="text-xs text-emerald-400 font-sans">Watt</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            P = I² × R = {(branchCurrent * branchCurrent * resistance).toFixed(3)}W
          </div>
        </div>

        {/* Heat dissipation rate */}
        <div className="p-3 rounded-xl bg-void-950 border border-sky-500/20 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>{isId ? 'Laju Kalor Joule' : 'Joule Heat Rate'}</span>
            <Activity className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-base font-mono font-bold text-sky-300">
            {powerWatts.toFixed(2)} <span className="text-xs text-sky-400 font-sans">J/s</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {(powerWatts * 0.239).toFixed(2)} kalori/detik
          </div>
        </div>
      </div>

      {/* Power Load Bar */}
      <div className="p-3 rounded-xl bg-void-950 border border-white/5 space-y-2">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-300 font-semibold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-electric-400" />
            {isId ? 'Beban Daya Relatif (vs Lampu 40W)' : 'Relative Power Load (vs 40W Bulb)'}
          </span>
          <span className="font-mono text-electric-300 font-bold">{powerPercent.toFixed(1)}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-void-900 border border-white/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              powerPercent > 80
                ? 'bg-red-500 shadow-glow'
                : powerPercent > 40
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
            style={{ width: `${Math.max(1, powerPercent)}%` }}
          />
        </div>
      </div>

      {/* Operational Electricity Cost Simulation */}
      <div className="p-3 rounded-xl bg-void-950 border border-white/5 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-300 font-semibold flex items-center gap-1.5 text-[11px]">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            {isId ? 'Estimasi Biaya Operasional (Tarif PLN R-1)' : 'PLN Operational Cost Rate'}
          </span>
          <span className="font-mono font-bold text-emerald-400 text-xs">
            {formattedHourlyCost} / jam
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          {isId
            ? `Berdasarkan tarif golongan R-1/TR 1.300 VA (Rp 1.444,70/kWh). Jika menyala 8 jam/hari: ${formattedDailyCost}/hari.`
            : `Based on PLN R-1/TR 1300VA tariff. At 8 hours/day: ${formattedDailyCost}/day.`}
        </p>
      </div>
    </div>
  );
};
