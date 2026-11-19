import React from 'react';
import * as Slider from '@radix-ui/react-slider';
import {
  Sliders,
  Zap,
  BatteryCharging,
  AlertTriangle,
} from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { BULB_CATALOG, BulbType, getBulbSpec } from '../../../constants/bulbCatalog';
import { insertCellIntoHolderState } from '../../../physics/batterySoC';
import { TRANSLATIONS } from '../../../i18n/translations';

interface InspectorPropertiesTabProps {
  componentData: CircuitElementData;
  nodeId: string;
}

/**
 * Inspector Tab 2: Properties
 * Provides editable component parameters with live sliders, options, and input validation.
 *
 * Time Complexity: O(1)
 */
export const InspectorPropertiesTab: React.FC<InspectorPropertiesTabProps> = ({
  componentData,
  nodeId,
}) => {
  const updateComponentData = useCircuitStore((state) => state.updateComponentData);
  const toggleSwitch = useCircuitStore((state) => state.toggleSwitch);
  const rechargeBattery = useCircuitStore((state) => state.rechargeBattery);
  const ejectBatteryFromHolder = useCircuitStore((state) => state.ejectBatteryFromHolder);
  const setBulbType = useCircuitStore((state) => state.setBulbType);
  const language = useCircuitStore((state) => state.language);

  const t = TRANSLATIONS[language].inspector;
  const isId = language === 'id';

  return (
    <div className="p-4 space-y-4 text-xs font-sans">
      <div className="rounded-xl bg-void-950 border border-control p-3.5 space-y-3.5">
        <div className="flex items-center justify-between border-b border-ink/15 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-electric-400 flex items-center gap-1.5">
            <Sliders className="w-3 h-3" aria-hidden="true" />
            {isId ? 'Ubah Properti & Pengaturan' : 'Adjust Component Properties'}
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {componentData.type.toUpperCase()}
          </span>
        </div>

        {/* Battery (1.5V AA & 9V Alkaline) Controls */}
        {(componentData.type === 'battery' || componentData.type === 'battery9v') && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-ink">
                {t.batteryVoltageLabel}
              </span>
              <span className="text-xs font-mono tabular-nums font-bold text-electric-400">
                {(
                  componentData.voltage ?? (componentData.type === 'battery9v' ? 9.0 : 1.5)
                ).toFixed(1)}{' '}
                V
              </span>
            </div>
            <Slider.Root
              aria-label={t.batteryVoltageLabel}
              className="relative flex items-center select-none touch-none w-full h-6 cursor-pointer"
              value={[
                componentData.voltage ?? (componentData.type === 'battery9v' ? 9.0 : 1.5),
              ]}
              min={1.5}
              max={24}
              step={0.5}
              onValueChange={([val]) => updateComponentData(nodeId, { voltage: val })}
            >
              <Slider.Track className="bg-void-900 relative grow rounded-full h-2 border border-control">
                <Slider.Range className="absolute bg-electric-600 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-5 h-5 bg-pure-white rounded-full border-2 border-electric-600 shadow-sm transition-transform active:scale-110" />
            </Slider.Root>

            {componentData.type === 'battery9v' && (
              <div className="p-2.5 rounded-xl bg-void-900 border border-ink/15 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between font-mono tabular-nums text-xs">
                  <span>{isId ? 'Hambatan Dalam (R_in):' : 'Internal Resistance:'}</span>
                  <span className="text-amber-400 font-bold">
                    {(componentData.internalResistance ?? 2.0).toFixed(1)} Ω
                  </span>
                </div>
                <p className="leading-relaxed text-[10px]">
                  {isId
                    ? 'Baterai 9V memiliki hambatan dalam ~2.0Ω sehingga arus hubung singkat terbatas (~4.5A).'
                    : '9V battery has ~2.0Ω internal resistance, limiting short-circuit current to ~4.5A.'}
                </p>
              </div>
            )}

            {/* State of Charge (SoC) Controls & Recharge Action */}
            <div className="p-3 rounded-xl bg-void-900 border border-ink/15 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  {t.batteryChargeLabel}
                </span>
                <span
                  className={`text-xs font-mono tabular-nums font-bold ${
                    (componentData.currentCharge ?? 100) < 20
                      ? 'text-red-400'
                      : (componentData.currentCharge ?? 100) < 50
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {(componentData.currentCharge ?? 100).toFixed(0)}%
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full h-2 rounded-full bg-void-950 border border-ink/15 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    (componentData.currentCharge ?? 100) < 20
                      ? 'bg-red-500'
                      : (componentData.currentCharge ?? 100) < 50
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, componentData.currentCharge ?? 100))}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] font-mono tabular-nums text-slate-400">
                <span>{t.batteryCapacityLabel}</span>
                <span className="text-ink font-semibold">
                  {Math.round(((componentData.currentCharge ?? 100) * (componentData.capacity ?? 1000)) / 100)} / {componentData.capacity ?? 1000} mAh
                </span>
              </div>

              {/* Dynamic Charge Status Badge */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-sans">
                  {isId ? 'Status Aliran:' : 'Flow State:'}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${
                    componentData.chargeState === 'charging'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                      : componentData.chargeState === 'discharging'
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                      : 'bg-ink/5 text-slate-400 border-ink/15'
                  }`}
                >
                  {componentData.chargeState === 'charging' ? (
                    <>
                      <Zap className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span>CHARGING</span>
                    </>
                  ) : componentData.chargeState === 'discharging' ? (
                    <>
                      <BatteryCharging className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span>DISCHARGING</span>
                    </>
                  ) : (
                    <span>IDLE (STANDBY)</span>
                  )}
                </span>
              </div>

              {/* Voltage Sag Warning */}
              {(componentData.currentCharge ?? 100) < 20 && (
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/35 text-[10px] text-red-400 leading-relaxed flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{t.batterySagNotice}</span>
                </div>
              )}

              {/* Recharge Button */}
              <button
                type="button"
                onClick={() => rechargeBattery(nodeId)}
                className="w-full min-h-[42px] py-2 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.batteryRechargeBtn}</span>
              </button>
            </div>
          </div>
        )}

        {/* Battery Holder Controls */}
        {componentData.type === 'battery-holder' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-ink">{t.holderCellsLabel}</span>
              <span className="text-xs font-mono tabular-nums font-bold text-emerald-400">
                {componentData.batteryCount ?? (componentData.hasBattery ? 2 : 0)} / 2 AA
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono tabular-nums">
              <span className="text-slate-400 font-sans text-[11px]">{t.holderOutputLabel}</span>
              <span className="text-electric-400 font-bold">
                {(
                  (componentData.batteryCount ?? (componentData.hasBattery ? 2 : 0)) * 1.5
                ).toFixed(1)}{' '}
                V
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">{t.holderGuide}</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={(componentData.batteryCount ?? 0) >= 2}
                onClick={() => {
                  const inserted = insertCellIntoHolderState(componentData, 100);
                  if (!inserted) return;
                  updateComponentData(nodeId, {
                    hasBattery: inserted.hasBattery,
                    batteryCount: inserted.batteryCount,
                    voltage: inserted.voltage,
                    capacity: inserted.capacity,
                    currentCharge: inserted.currentCharge,
                    cellCharges: inserted.cellCharges,
                  });
                }}
                className="min-h-[40px] py-2 px-2.5 rounded-lg text-xs font-semibold bg-electric-500/15 text-electric-400 border border-electric-500/35 hover:bg-electric-500/25 disabled:opacity-40 active:scale-95 transition-colors cursor-pointer"
              >
                {t.holderInsertBtn}
              </button>
              <button
                type="button"
                disabled={(componentData.batteryCount ?? 0) <= 0}
                onClick={() => ejectBatteryFromHolder(nodeId)}
                className="min-h-[40px] py-2 px-2.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/35 hover:bg-amber-500/25 disabled:opacity-40 active:scale-95 transition-colors cursor-pointer"
              >
                {t.holderEjectBtn}
              </button>
            </div>
          </div>
        )}

        {/* Resistor Controls */}
        {componentData.type === 'resistor' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-ink">{t.resistorLabel}</span>
              <span className="text-xs font-mono tabular-nums font-bold text-copper-text">
                {componentData.resistance ?? 100} Ω
              </span>
            </div>
            <Slider.Root
              aria-label={t.resistorLabel}
              className="relative flex items-center select-none touch-none w-full h-6 cursor-pointer"
              value={[componentData.resistance ?? 100]}
              min={1}
              max={1000}
              step={1}
              onValueChange={([val]) => updateComponentData(nodeId, { resistance: val })}
            >
              <Slider.Track className="bg-void-900 relative grow rounded-full h-2 border border-control">
                <Slider.Range className="absolute bg-copper rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-5 h-5 bg-pure-white rounded-full border-2 border-copper shadow-sm transition-transform active:scale-110" />
            </Slider.Root>

            {/* Quick Resistance Presets */}
            <div className="flex items-center gap-1.5 pt-1">
              {[10, 100, 220, 470, 1000].map((res) => (
                <button
                  key={res}
                  type="button"
                  onClick={() => updateComponentData(nodeId, { resistance: res })}
                  className={`flex-1 min-h-[36px] py-1 rounded-md text-[10px] font-mono tabular-nums border transition-colors active:scale-95 ${
                    (componentData.resistance ?? 100) === res
                      ? 'bg-amber-500/20 text-copper-text border-copper font-bold'
                      : 'bg-void-900 text-slate-400 border-control hover:text-ink hover:bg-void-850'
                  }`}
                >
                  {res}Ω
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Socket / Bulb Controls */}
        {(componentData.type === 'bulb' ||
          (componentData.type === 'socket' && Boolean(componentData.installedBulb)) ||
          (componentData.type === 'pin-socket' && Boolean(componentData.installedBulb))) && (
          <div className="space-y-3.5">
            {(() => {
              const activeBulbType: BulbType =
                (componentData.type === 'socket' || componentData.type === 'pin-socket') &&
                componentData.installedBulb &&
                typeof componentData.installedBulb === 'object'
                  ? componentData.installedBulb.bulbType
                  : (typeof componentData.installedBulb === 'string'
                      ? componentData.installedBulb
                      : componentData.bulbType) ?? 'incandescent';
              const activeSpec = getBulbSpec(activeBulbType);
              const activeResistance =
                (componentData.type === 'socket' || componentData.type === 'pin-socket') &&
                componentData.installedBulb &&
                typeof componentData.installedBulb === 'object' &&
                componentData.installedBulb.resistance !== undefined
                  ? componentData.installedBulb.resistance
                  : componentData.resistance ?? activeSpec.resistance;

              return (
                <>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="inspector-bulb-type-select"
                      className="text-xs font-semibold text-ink block"
                    >
                      {componentData.type === 'socket'
                        ? isId
                          ? 'Pilih Lampu Ulir (5 Tipe E27)'
                          : 'Select Screw Bulb (5 E27 Types)'
                        : isId
                        ? 'Pilih Jenis Lampu (7 Tipe)'
                        : 'Select Bulb Type (7 Types)'}
                    </label>
                    <select
                      id="inspector-bulb-type-select"
                      value={activeBulbType}
                      onChange={(e) => setBulbType(nodeId, e.target.value as BulbType)}
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-void-900 border border-control text-xs font-medium text-ink cursor-pointer"
                    >
                      {BULB_CATALOG.filter(
                        (spec) =>
                          componentData.type !== 'socket' || spec.baseType === 'screw'
                      ).map((spec) => (
                        <option key={spec.type} value={spec.type}>
                          {isId ? spec.label : spec.labelEn} · {spec.resistance}Ω ({isId ? 'Maks' : 'Max'} {spec.maxPower}W)
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 leading-relaxed pt-0.5">
                      {isId ? activeSpec.traits : activeSpec.traitsEn}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-ink/15">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-ink">
                        {t.bulbResistanceLabel}
                      </span>
                      <span className="text-xs font-mono tabular-nums font-bold text-copper-text">
                        {activeResistance} Ω
                      </span>
                    </div>
                    <Slider.Root
                      aria-label={t.bulbResistanceLabel}
                      className="relative flex items-center select-none touch-none w-full h-6 cursor-pointer"
                      value={[activeResistance]}
                      min={50}
                      max={6500}
                      step={50}
                      onValueChange={([val]) => {
                        if (
                          (componentData.type === 'socket' || componentData.type === 'pin-socket') &&
                          componentData.installedBulb &&
                          typeof componentData.installedBulb === 'object'
                        ) {
                          updateComponentData(nodeId, {
                            resistance: val,
                            installedBulb: {
                              ...componentData.installedBulb,
                              resistance: val,
                            },
                          });
                        } else {
                          updateComponentData(nodeId, { resistance: val });
                        }
                      }}
                    >
                      <Slider.Track className="bg-void-900 relative grow rounded-full h-2 border border-control">
                        <Slider.Range className="absolute bg-copper rounded-full h-full" />
                      </Slider.Track>
                      <Slider.Thumb className="block w-5 h-5 bg-pure-white rounded-full border-2 border-copper shadow-sm transition-transform active:scale-110" />
                    </Slider.Root>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Switch Controls */}
        {componentData.type === 'switch' && (
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-ink">{t.switchStateLabel}</span>
            <button
              type="button"
              onClick={() => toggleSwitch(nodeId)}
              className={`w-full min-h-[42px] py-2.5 rounded-xl font-medium text-xs transition-colors active:scale-95 border cursor-pointer ${
                componentData.isOpen
                  ? 'bg-amber-500/15 text-copper-text border-copper hover:bg-amber-500/25'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/45 hover:bg-emerald-500/25'
              }`}
            >
              {componentData.isOpen ? t.switchOpenBtn : t.switchClosedBtn}
            </button>
          </div>
        )}

        {/* Solar Panel Controls */}
        {(componentData.type === 'solar-panel' || componentData.type === 'solar_panel') && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-ink">
                {isId ? 'Intensitas Cahaya Surya' : 'Solar Irradiance'}
              </span>
              <span className="text-xs font-mono tabular-nums font-bold text-copper-text">
                {componentData.baseSunlight ?? componentData.sunlight ?? 100}% (
                {(componentData.voltage ?? 12.0).toFixed(1)} V)
              </span>
            </div>

            <Slider.Root
              aria-label={isId ? 'Intensitas Cahaya Surya' : 'Solar Irradiance'}
              className="relative flex items-center select-none touch-none w-full h-6 cursor-pointer"
              value={[componentData.baseSunlight ?? componentData.sunlight ?? 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={([val]) =>
                updateComponentData(nodeId, {
                  baseSunlight: val,
                  sunlight: val,
                  effectiveSunlight: val,
                  voltage: Number(((val / 100) * 12.0).toFixed(2)),
                })
              }
            >
              <Slider.Track className="bg-void-900 relative grow rounded-full h-2 border border-control">
                <Slider.Range className="absolute bg-copper rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-5 h-5 bg-pure-white rounded-full border-2 border-copper shadow-sm transition-transform active:scale-110" />
            </Slider.Root>
          </div>
        )}

        {/* Wind Turbine Controls */}
        {(componentData.type === 'wind-turbine' || componentData.type === 'wind_turbine') && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-ink">
                {isId ? 'Kecepatan Baling-Baling' : 'Rotor Speed'}
              </span>
              <span className="text-xs font-mono tabular-nums font-bold text-cyan-400">
                {componentData.speed ?? 50}% ({(((componentData.speed ?? 50) / 100) * 12.0).toFixed(1)} V)
              </span>
            </div>

            <Slider.Root
              aria-label={isId ? 'Kecepatan Baling-Baling' : 'Rotor Speed'}
              className="relative flex items-center select-none touch-none w-full h-6 cursor-pointer"
              value={[componentData.speed ?? 50]}
              min={0}
              max={100}
              step={1}
              onValueChange={([val]) =>
                updateComponentData(nodeId, {
                  speed: val,
                  voltage: (val / 100) * 12.0,
                })
              }
            >
              <Slider.Track className="bg-void-900 relative grow rounded-full h-2 border border-control">
                <Slider.Range className="absolute bg-cyan-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-5 h-5 bg-pure-white rounded-full border-2 border-cyan-600 shadow-sm transition-transform active:scale-110" />
            </Slider.Root>
          </div>
        )}

        {/* BESS Substation Controls */}
        {(componentData.type === 'bess-substation' || componentData.type === 'bess_substation') && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-ink">
                {isId ? 'Status Muatan Baterai (SoC)' : 'State of Charge (SoC)'}
              </span>
              <span className="text-xs font-mono tabular-nums font-bold text-emerald-400">
                {Math.round(componentData.socPercent ?? componentData.currentCharge ?? 80)}% (
                {Math.round(componentData.storedEnergyWh ?? 800)} Wh)
              </span>
            </div>

            <Slider.Root
              aria-label={isId ? 'Status Muatan Baterai (SoC)' : 'State of Charge (SoC)'}
              className="relative flex items-center select-none touch-none w-full h-6 cursor-pointer"
              value={[Math.round(componentData.socPercent ?? componentData.currentCharge ?? 80)]}
              min={0}
              max={100}
              step={1}
              onValueChange={([val]) => {
                const nominalCap = componentData.nominalCapacityWh ?? 1000;
                updateComponentData(nodeId, {
                  socPercent: val,
                  currentCharge: val,
                  storedEnergyWh: Number(((val / 100) * nominalCap).toFixed(1)),
                });
              }}
            >
              <Slider.Track className="bg-void-900 relative grow rounded-full h-2 border border-control">
                <Slider.Range className="absolute bg-emerald-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-5 h-5 bg-pure-white rounded-full border-2 border-emerald-600 shadow-sm transition-transform active:scale-110" />
            </Slider.Root>

            <button
              type="button"
              onClick={() => rechargeBattery(nodeId)}
              className="w-full min-h-[42px] py-2 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
            >
              <BatteryCharging className="w-3.5 h-3.5" aria-hidden="true" />
              {isId ? 'Isi Penuh BESS (100% / 1000 Wh)' : 'Recharge BESS Full (100% / 1000 Wh)'}
            </button>
          </div>
        )}

        {/* Waterfall Micro-Hydro Turbine Controls */}
        {(componentData.type === 'hydro-turbine' || componentData.type === 'hydro_turbine') && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-ink">
                {isId ? 'Debit Aliran Air (Katup Q)' : 'Water Flow Rate (Valve Q)'}
              </span>
              <span className="text-xs font-mono tabular-nums font-bold text-cyan-400">
                {componentData.waterFlowRate ?? 0}% ({(componentData.voltage ?? 0).toFixed(1)} V)
              </span>
            </div>

            <Slider.Root
              aria-label={isId ? 'Debit Aliran Air (Katup Q)' : 'Water Flow Rate (Valve Q)'}
              className="relative flex items-center select-none touch-none w-full h-6 cursor-pointer"
              value={[componentData.waterFlowRate ?? 0]}
              min={0}
              max={100}
              step={5}
              onValueChange={([val]) =>
                updateComponentData(nodeId, {
                  manualWaterFlowRate: val,
                  waterFlowRate: val,
                  hasWaterContact: val > 0,
                })
              }
            >
              <Slider.Track className="bg-void-900 relative grow rounded-full h-2 border border-control">
                <Slider.Range className="absolute bg-cyan-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-5 h-5 bg-pure-white rounded-full border-2 border-cyan-600 shadow-sm transition-transform active:scale-110" />
            </Slider.Root>

            <div className="flex justify-between items-center pt-1">
              <span className="text-xs font-semibold text-ink">
                {isId ? 'Tinggi Jatuh Air (Head H)' : 'Hydraulic Head (H)'}
              </span>
              <span className="text-xs font-mono tabular-nums font-bold text-sky-400">
                {(componentData.hydraulicHeadMeters ?? 2.0).toFixed(1)} m
              </span>
            </div>

            <Slider.Root
              aria-label={isId ? 'Tinggi Jatuh Air (Head H)' : 'Hydraulic Head (H)'}
              className="relative flex items-center select-none touch-none w-full h-6 cursor-pointer"
              value={[componentData.hydraulicHeadMeters ?? 2.0]}
              min={0.5}
              max={5.0}
              step={0.1}
              onValueChange={([val]) =>
                updateComponentData(nodeId, {
                  manualHydraulicHeadMeters: val,
                  hydraulicHeadMeters: val,
                })
              }
            >
              <Slider.Track className="bg-void-900 relative grow rounded-full h-2 border border-control">
                <Slider.Range className="absolute bg-sky-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-5 h-5 bg-pure-white rounded-full border-2 border-sky-600 shadow-sm transition-transform active:scale-110" />
            </Slider.Root>
          </div>
        )}

        {/* Transmission Tower & Lab Distribution Panel MCB Controls */}
        {(componentData.type === 'transmission-tower' ||
          componentData.type === 'transmission_tower' ||
          componentData.type === 'distribution-panel' ||
          componentData.type === 'distribution_panel') && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-ink">
                {isId ? 'Proteksi Saklar MCB:' : 'MCB Breaker Switch:'}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateComponentData(nodeId, {
                    isMcbOn: !(componentData.isMcbOn !== false && !componentData.isMcbTripped),
                    isMcbTripped: false,
                  })
                }
                className={`min-h-[38px] px-3 py-1 rounded-lg font-mono text-[10px] font-bold border transition-colors active:scale-95 cursor-pointer ${
                  componentData.isMcbTripped
                    ? 'bg-danger-600 hover:bg-danger-700 text-white border-danger-500'
                    : componentData.isMcbOn !== false
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/45'
                    : 'bg-void-850 text-slate-300 border-control hover:text-ink'
                }`}
              >
                {componentData.isMcbTripped
                  ? 'Reset MCB (Trip)'
                  : componentData.isMcbOn !== false
                  ? 'MCB: ON (Aktif)'
                  : 'MCB: OFF (Putus)'}
              </button>
            </div>

            {/* Step-Down DC Voltage Regulation */}
            <div className="space-y-1.5 pt-2 border-t border-ink/15">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-sans">
                  {isId ? 'Regulator Step-Down DC:' : 'DC Step-Down Regulator:'}
                </span>
                <span className="font-mono tabular-nums font-bold text-cyan-400">
                  {componentData.stepDownVoltage == null
                    ? isId
                      ? 'Otomatis (Langsung)'
                      : 'Auto (Direct)'
                    : `${isId ? 'Maks' : 'Max'} ${componentData.stepDownVoltage} V`}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[
                  { label: 'Auto', val: null },
                  { label: '3V', val: 3 },
                  { label: '6V', val: 6 },
                  { label: '9V', val: 9 },
                  { label: '12V', val: 12 },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => updateComponentData(nodeId, { stepDownVoltage: opt.val })}
                    className={`min-h-[36px] py-1 rounded-lg font-mono text-[10px] font-bold border transition-colors active:scale-95 cursor-pointer ${
                      (componentData.stepDownVoltage ?? null) === opt.val
                        ? 'bg-electric-600 text-white border-electric-500'
                        : 'bg-void-900 text-slate-400 border-control hover:text-ink hover:bg-void-850'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
