import React, { useMemo, useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Banknote, Clock, Leaf, Sparkles, Zap } from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';
import {
  calculatePlnCostEstimate,
  formatRupiah,
  PLN_TARIFF_TIERS,
  PlnScaleMultiplier,
  PlnTariffTierId,
} from '../../physics/plnCostCalculator';
import { PLN_TARIFF_CITATION } from '../../constants/datasheetCitations';

const SCALE_OPTIONS: ReadonlyArray<{
  value: PlnScaleMultiplier;
  labelId: string;
  labelEn: string;
  descId: string;
  descEn: string;
}> = [
  {
    value: 1,
    labelId: '1× Lab',
    labelEn: '1× Lab',
    descId: 'Daya murni rangkaian di kanvas',
    descEn: 'Raw miniature circuit power on canvas',
  },
  {
    value: 100,
    labelId: '100× Kamar',
    labelEn: '100× Room',
    descId: 'Simulasi setara lampu kamar rumah (100×)',
    descEn: 'Simulated bedroom installation scale (100×)',
  },
  {
    value: 1000,
    labelId: '1.000× Rumah',
    labelEn: '1,000× Home',
    descId: 'Simulasi setara beban rumah tangga (1.000×)',
    descEn: 'Simulated full household load scale (1,000×)',
  },
];

/**
 * Interactive PT PLN (Persero) Electricity Consumption & Rupiah Cost Simulator Card.
 *
 * Separates tariff & energy calculation rendering from `Inspector.tsx` to keep
 * modules small, focused, and easy to debug (DRY principle).
 *
 * Time Complexity: O(N) per simulation update where N is the number of circuit nodes.
 */
export const PlnCostCalculatorCard: React.FC = () => {
  const nodes = useCircuitStore((state) => state.nodes);
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);
  const isId = language === 'id';

  const [selectedTariffId, setSelectedTariffId] =
    useState<PlnTariffTierId>('R1_1300_2200');
  const [dailyHours, setDailyHours] = useState<number>(8);
  const [scaleMultiplier, setScaleMultiplier] =
    useState<PlnScaleMultiplier>(100);

  const estimate = useMemo(
    () =>
      calculatePlnCostEstimate(
        nodes,
        simulation,
        selectedTariffId,
        dailyHours,
        scaleMultiplier
      ),
    [nodes, simulation, selectedTariffId, dailyHours, scaleMultiplier]
  );

  const activeScaleMeta =
    SCALE_OPTIONS.find((opt) => opt.value === scaleMultiplier) ??
    SCALE_OPTIONS[1];

  return (
    <div
      id="tour-pln-calculator"
      className="rounded-xl bg-void-950 border border-electric-500/30 p-3.5 space-y-3 shadow-[0_0_24px_rgba(14,165,233,0.08)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400 shrink-0">
            <Banknote className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-100 truncate">
              {isId ? 'Kalkulator Tagihan Listrik PLN' : 'PLN Electricity Bill Calculator'}
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              {isId
                ? 'Hitung energi (kWh) & biaya Rupiah rangkaianmu'
                : 'Estimate energy (kWh) & IDR cost of your circuit'}
            </p>
          </div>
        </div>
        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-electric-500/15 text-electric-400 border border-electric-500/30 shrink-0">
          W = P × t
        </span>
      </div>

      {/* Simulation Scale Selector (1x Lab vs 100x Room vs 1000x Home) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{isId ? 'Skala Simulasi Beban:' : 'Load Simulation Scale:'}</span>
          <span className="font-mono text-electric-400 font-semibold">
            {isId ? activeScaleMeta.descId : activeScaleMeta.descEn}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {SCALE_OPTIONS.map((option) => {
            const isSelected = scaleMultiplier === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setScaleMultiplier(option.value)}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold border transition-all active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-electric-500/20 border-electric-400 text-electric-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                    : 'bg-void-900 hover:bg-void-850 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isId ? option.labelId : option.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Official PLN Tariff Dropdown */}
      <div className="space-y-1">
        <label
          htmlFor="pln-tariff-select"
          className="text-[11px] font-semibold text-slate-300 block"
        >
          {isId ? 'Golongan Tarif Listrik PLN:' : 'PLN Household Tariff Tier:'}
        </label>
        <select
          id="pln-tariff-select"
          value={selectedTariffId}
          onChange={(e) =>
            setSelectedTariffId(e.target.value as PlnTariffTierId)
          }
          className="w-full px-2.5 py-1.5 rounded-lg bg-void-900 border border-white/15 text-[11px] text-slate-100 focus:outline-none focus:border-electric-400 cursor-pointer"
        >
          {PLN_TARIFF_TIERS.map((tier) => (
            <option key={tier.id} value={tier.id}>
              {isId ? tier.labelId : tier.labelEn}
            </option>
          ))}
        </select>
      </div>

      {/* Daily Usage Hours Slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-electric-400" />
            {isId ? 'Lama Menyala per Hari:' : 'Daily Usage Duration:'}
          </span>
          <span className="text-xs font-mono font-bold text-electric-400">
            {dailyHours} {isId ? 'Jam / Hari' : 'Hours / Day'}
          </span>
        </div>
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5 cursor-pointer"
          value={[dailyHours]}
          min={1}
          max={24}
          step={1}
          onValueChange={([val]) => setDailyHours(val)}
        >
          <Slider.Track className="bg-void-900 relative grow rounded-full h-1.5 border border-white/10">
            <Slider.Range className="absolute bg-electric-500 rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb className="block w-4 h-4 bg-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-electric-500 transition-transform active:scale-125" />
        </Slider.Root>
      </div>

      {/* Power & kWh Readout */}
      <div className="rounded-xl bg-void-900/90 border border-white/10 p-2.5 space-y-1.5 font-mono text-[11px]">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-sans">
            {isId ? 'Daya Rangkaian (P):' : 'Circuit Power (P):'}
          </span>
          <span className="text-electric-400 font-bold">
            {estimate.effectivePowerWatts < 10
              ? `${estimate.effectivePowerWatts.toFixed(2)} W`
              : `${estimate.effectivePowerWatts.toFixed(1)} W`}{' '}
            <span className="text-[10px] text-slate-400">
              ({estimate.effectivePowerKilowatts.toFixed(3)} kW)
            </span>
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-sans">
            {isId ? 'Energi per Hari (W):' : 'Daily Energy (W):'}
          </span>
          <span className="text-slate-200 font-semibold">
            {estimate.dailyEnergyWh < 1000
              ? `${estimate.dailyEnergyWh.toFixed(1)} Wh`
              : `${estimate.dailyEnergyKwh.toFixed(2)} kWh`}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-sans">
            {isId ? 'Energi per Bulan (30 hr):' : 'Monthly Energy (30d):'}
          </span>
          <span className="text-amber-300 font-bold">
            {estimate.monthlyEnergyKwh.toFixed(2)} kWh
          </span>
        </div>
      </div>

      {/* Rupiah Cost Breakdown Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-lg bg-void-900 border border-white/10 p-2 text-center">
          <div className="text-[9px] text-slate-400 uppercase tracking-wider">
            {isId ? 'Per Hari' : 'Per Day'}
          </div>
          <div className="text-[11px] font-mono font-bold text-slate-100 mt-0.5 truncate">
            {formatRupiah(estimate.dailyCostIdr)}
          </div>
        </div>
        <div className="rounded-lg bg-electric-500/15 border border-electric-400/40 p-2 text-center shadow-[0_0_14px_rgba(34,211,238,0.12)]">
          <div className="text-[9px] text-electric-300 font-semibold uppercase tracking-wider">
            {isId ? 'Per Bulan' : 'Per Month'}
          </div>
          <div className="text-xs font-mono font-bold text-white mt-0.5 truncate">
            {formatRupiah(estimate.monthlyCostIdr)}
          </div>
        </div>
        <div className="rounded-lg bg-void-900 border border-white/10 p-2 text-center">
          <div className="text-[9px] text-slate-400 uppercase tracking-wider">
            {isId ? 'Per Tahun' : 'Per Year'}
          </div>
          <div className="text-[11px] font-mono font-bold text-amber-300 mt-0.5 truncate">
            {formatRupiah(estimate.yearlyCostIdr)}
          </div>
        </div>
      </div>

      {/* Green Energy Savings Banner (When Solar Panel / Wind Turbine supplies power) */}
      {estimate.greenEnergySharePercent > 0 ? (
        <div className="rounded-xl bg-emerald-500/15 border border-emerald-400/40 p-2.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
            <span className="flex items-center gap-1">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              {isId
                ? `Energi Alam Aktif (${estimate.greenEnergySharePercent}%)`
                : `Green Energy Active (${estimate.greenEnergySharePercent}%)`}
            </span>
            <span className="font-mono text-emerald-200">
              {isId ? 'Hemat' : 'Save'} {formatRupiah(estimate.monthlyPlnSavingsIdr)}/bln
            </span>
          </div>
          <p className="text-[10px] text-emerald-100/90 leading-relaxed">
            {isId
              ? `Karena disuplai Panel Surya / Turbin Angin, tagihan PLN bersihmu menjadi ${formatRupiah(
                  estimate.netMonthlyPlnBillIdr
                )}/bulan dan mengurangi emisi ${estimate.monthlyCo2SavedKg.toFixed(
                  2
                )} kg CO₂!`
              : `Powered by Solar/Wind energy, your net PLN bill drops to ${formatRupiah(
                  estimate.netMonthlyPlnBillIdr
                )}/month and prevents ${estimate.monthlyCo2SavedKg.toFixed(
                  2
                )} kg CO₂!`}
          </p>
        </div>
      ) : (
        estimate.rawTotalPowerWatts > 0 && (
          <div className="rounded-lg bg-void-900/70 border border-white/5 px-2.5 py-2 flex items-center gap-2 text-[10px] text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {isId
                ? 'Tips Hemat: Keluar ke Alam & sambungkan Panel Surya/Turbin Angin ke Menara Transmisi agar biaya PLN menjadi Rp 0 (Gratis)!'
                : 'Eco Tip: Go Outside & wire a Solar Panel or Wind Turbine to a Transmission Tower for Rp 0 free clean energy!'}
            </span>
          </div>
        )
      )}

      {/* Per-Component Power & Cost Breakdown */}
      {estimate.componentBreakdown.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-white/10">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>
              {isId ? 'Rincian Beban Komponen Aktif' : 'Active Load Breakdown'}
            </span>
            <span>{isId ? 'Biaya / Bln' : 'Cost / Mo'}</span>
          </div>
          <div className="space-y-1 max-h-28 overflow-y-auto pr-0.5">
            {estimate.componentBreakdown.map((item) => (
              <div
                key={item.nodeId}
                className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-void-900/80 border border-white/5 text-[10px]"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="text-slate-200 truncate">{item.label}</span>
                  <span className="font-mono text-slate-400 shrink-0">
                    ({item.scaledPowerWatts.toFixed(1)}W)
                  </span>
                </div>
                <span className="font-mono font-semibold text-electric-300 shrink-0">
                  {formatRupiah(item.monthlyCostIdr)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Official PLN Tariff & CO2 Emission Factor Citation */}
      <div className="pt-2 border-t border-white/10 text-[9px] text-slate-400 leading-relaxed font-mono">
        <strong className="text-slate-300">
          {isId ? '📚 Sumber Tarif Resmi: ' : '📚 Official Tariff Citation: '}
        </strong>
        {isId ? PLN_TARIFF_CITATION.sourceCitationId : PLN_TARIFF_CITATION.sourceCitationEn}
      </div>
    </div>
  );
};
