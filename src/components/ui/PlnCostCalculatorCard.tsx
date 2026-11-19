import React, { useMemo, useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Banknote, Clock, Leaf, Zap } from 'lucide-react';
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
  const edges = useCircuitStore((state) => state.edges);
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
        scaleMultiplier,
        edges
      ),
    [nodes, edges, simulation, selectedTariffId, dailyHours, scaleMultiplier]
  );

  const activeScaleMeta =
    SCALE_OPTIONS.find((opt) => opt.value === scaleMultiplier) ??
    SCALE_OPTIONS[1];

  return (
    <div
      id="tour-pln-calculator"
      className="rounded-xl bg-void-950 border border-control p-3.5 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-ink/15 pb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-electric-500/15 border border-electric-500/35 flex items-center justify-center text-electric-400 shrink-0">
            <Banknote className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-ink truncate">
              {isId ? 'Kalkulator Tagihan Listrik PLN' : 'PLN Electricity Bill Calculator'}
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              {isId
                ? 'Hitung energi (kWh) & biaya Rupiah rangkaianmu'
                : 'Estimate energy (kWh) & IDR cost of your circuit'}
            </p>
          </div>
        </div>
        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-electric-500/15 text-electric-400 border border-electric-500/35 shrink-0">
          W = P × t
        </span>
      </div>

      {/* Simulation Scale Selector (1x Lab vs 100x Room vs 1000x Home) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-slate-400 gap-2">
          <span className="shrink-0">{isId ? 'Skala Simulasi Beban:' : 'Load Simulation Scale:'}</span>
          <span className="font-mono text-electric-400 font-semibold truncate">
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
                aria-pressed={isSelected}
                onClick={() => setScaleMultiplier(option.value)}
                className={`min-h-[38px] py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold border transition-colors active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-electric-600 border-electric-500 text-white'
                    : 'bg-void-900 hover:bg-void-850 border-control text-slate-400 hover:text-ink'
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
          className="w-full min-h-[38px] px-2.5 py-1.5 rounded-lg bg-void-900 border border-control text-[11px] text-ink cursor-pointer"
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
            <Clock className="w-3 h-3 text-electric-400" aria-hidden="true" />
            {isId ? 'Lama Menyala per Hari:' : 'Daily Usage Duration:'}
          </span>
          <span className="text-xs font-mono tabular-nums font-bold text-electric-400">
            {dailyHours} {isId ? 'Jam / Hari' : 'Hours / Day'}
          </span>
        </div>
        <Slider.Root
          aria-label={isId ? 'Lama Menyala per Hari' : 'Daily Usage Duration'}
          className="relative flex items-center select-none touch-none w-full h-5 cursor-pointer"
          value={[dailyHours]}
          min={1}
          max={24}
          step={1}
          onValueChange={([val]) => setDailyHours(val)}
        >
          <Slider.Track className="bg-void-900 relative grow rounded-full h-1.5 border border-control">
            <Slider.Range className="absolute bg-electric-600 rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb className="block w-4 h-4 bg-pure-white rounded-full border-2 border-electric-600 shadow-sm transition-transform active:scale-110" />
        </Slider.Root>
      </div>

      {/* Power & kWh Readout */}
      <div className="rounded-xl bg-void-900 border border-ink/15 p-2.5 space-y-1.5 font-mono tabular-nums text-[11px]">
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
          <span className="text-ink font-semibold">
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
        <div className="rounded-lg bg-void-900 border border-ink/15 p-2 text-center">
          <div className="text-[9px] text-slate-400 uppercase tracking-wider">
            {isId ? 'Per Hari' : 'Per Day'}
          </div>
          <div className="text-[11px] font-mono tabular-nums font-bold text-ink mt-0.5 truncate">
            {formatRupiah(estimate.dailyCostIdr)}
          </div>
        </div>
        <div className="rounded-lg bg-electric-500/15 border border-electric-500/45 p-2 text-center">
          <div className="text-[9px] text-electric-400 font-semibold uppercase tracking-wider">
            {isId ? 'Per Bulan' : 'Per Month'}
          </div>
          <div className="text-xs font-mono tabular-nums font-bold text-ink mt-0.5 truncate">
            {formatRupiah(estimate.monthlyCostIdr)}
          </div>
        </div>
        <div className="rounded-lg bg-void-900 border border-ink/15 p-2 text-center">
          <div className="text-[9px] text-slate-400 uppercase tracking-wider">
            {isId ? 'Per Tahun' : 'Per Year'}
          </div>
          <div className="text-[11px] font-mono tabular-nums font-bold text-amber-300 mt-0.5 truncate">
            {formatRupiah(estimate.yearlyCostIdr)}
          </div>
        </div>
      </div>

      {/* Green Energy Savings Banner (When Solar Panel / Wind Turbine supplies power) */}
      {estimate.greenEnergySharePercent > 0 ? (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/40 p-2.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
            <span className="flex items-center gap-1">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              {isId
                ? `Energi Alam Aktif (${estimate.greenEnergySharePercent}%)`
                : `Green Energy Active (${estimate.greenEnergySharePercent}%)`}
            </span>
            <span className="font-mono tabular-nums text-emerald-300">
              {isId ? 'Hemat' : 'Save'} {formatRupiah(estimate.monthlyPlnSavingsIdr)}/{isId ? 'bln' : 'mo'}
            </span>
          </div>
          <p className="text-[10px] text-ink leading-relaxed">
            {isId
              ? `Karena disuplai Panel Surya / Turbin Angin, tagihan PLN bersihmu menjadi ${formatRupiah(
                  estimate.netMonthlyPlnBillIdr
                )}/bulan dan mengurangi emisi ${estimate.monthlyCo2SavedKg.toFixed(
                  2
                )} kg CO2.`
              : `Powered by Solar/Wind energy, your net PLN bill drops to ${formatRupiah(
                  estimate.netMonthlyPlnBillIdr
                )}/month and prevents ${estimate.monthlyCo2SavedKg.toFixed(
                  2
                )} kg CO2.`}
          </p>
        </div>
      ) : (
        estimate.rawTotalPowerWatts > 0 && (
          <div className="rounded-lg bg-void-900 border border-ink/15 px-2.5 py-2 flex items-center gap-2 text-[10px] text-slate-400">
            <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
            <span>
              {isId
                ? 'Tips Hemat: Keluar ke Alam dan sambungkan Panel Surya/Turbin Angin ke Menara Transmisi agar biaya PLN menjadi Rp 0.'
                : 'Eco Tip: Switch to Outdoor Mode and wire a Solar Panel or Wind Turbine to a Transmission Tower for Rp 0 clean energy.'}
            </span>
          </div>
        )
      )}

      {/* Per-Component Power & Cost Breakdown */}
      {estimate.componentBreakdown.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-ink/15">
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
                className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-void-900 border border-ink/15 text-[10px]"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Zap className="w-3 h-3 text-amber-400 shrink-0" aria-hidden="true" />
                  <span className="text-ink truncate">{item.label}</span>
                  <span className="font-mono tabular-nums text-slate-400 shrink-0">
                    ({item.scaledPowerWatts.toFixed(1)}W)
                  </span>
                </div>
                <span className="font-mono tabular-nums font-semibold text-electric-400 shrink-0">
                  {formatRupiah(item.monthlyCostIdr)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Official PLN Tariff & CO2 Emission Factor Citation */}
      <div className="pt-2 border-t border-ink/15 text-[9px] text-slate-400 leading-relaxed font-mono">
        <strong className="text-slate-300">
          {isId ? 'Sumber Tarif Resmi: ' : 'Official Tariff Citation: '}
        </strong>
        {isId ? PLN_TARIFF_CITATION.sourceCitationId : PLN_TARIFF_CITATION.sourceCitationEn}
      </div>
    </div>
  );
};
