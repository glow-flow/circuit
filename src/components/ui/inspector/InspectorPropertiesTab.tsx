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
      <div className="rounded-xl bg-void-950/90 border border-electric-500/30 p-3.5 space-y-3.5 shadow-[0_0_20px_rgba(14,165,233,0.08)]">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-electric-400 flex items-center gap-1.5">
            <Sliders className="w-3 h-3" />
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
              <label className="text-xs font-semibold text-slate-200">
                {t.batteryVoltageLabel}
              </label>
              <span className="text-xs font-mono font-bold text-electric-400">
                {(
                  componentData.voltage ?? (componentData.type === 'battery9v' ? 9.0 : 1.5)
                ).toFixed(1)}{' '}
                V
              </span>
            </div>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-6 cursor-pointer"
              value={[
                componentData.voltage ?? (componentData.type === 'battery9v' ? 9.0 : 1.5),
              ]}
              min={1.5}
              max={24}
              step={0.5}
              onValueChange={([val]) => updateComponentData(nodeId, { voltage: val })}
            >
              <Slider.Track className="bg-void-900 relative grow rounded-full h-2 border border-white/10">
                <Slider.Range className="absolute bg-electric-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-5 h-5 bg-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-electric-500 transition-transform active:scale-125" />
            </Slider.Root>

            {componentData.type === 'battery9v' && (
              <div className="p-2.5 rounded-xl bg-void-900/80 border border-white/5 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between font-mono text-xs">
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
            <div className="p-3 rounded-xl bg-void-950/70 border border-white/5 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                  {t.batteryChargeLabel}
                </span>
                <span
                  className={`text-xs font-mono font-bold ${
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
              <div className="w-full h-2 rounded-full bg-void-900 border border-white/10 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    (componentData.currentCharge ?? 100) < 20
                      ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]'
                      : (componentData.currentCharge ?? 100) < 50
                      ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                      : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, componentData.currentCharge ?? 100))}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                <span>{t.batteryCapacityLabel}</span>
                <span className="text-slate-200">
                  {Math.round(((componentData.currentCharge ?? 100) * (componentData.capacity ?? 1000)) / 100)} / {componentData.capacity ?? 1000} mAh
                </span>
              </div>

              {/* Dynamic Charge Status Badge */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-sans">
                  {isId ? 'Status Aliran:' : 'Flow State:'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${
                    componentData.chargeState === 'charging'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse'
                      : componentData.chargeState === 'discharging'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-white/5 text-slate-400 border-white/10'
                  }`}
                >
                  {componentData.chargeState === 'charging'
                    ? '⚡ CHARGING'
                    : componentData.chargeState === 'discharging'
                    ? '🔋 DISCHARGING'
                    : 'IDLE (STANDBY)'}
                </span>
              </div>

              {/* Voltage Sag Warning */}
              {(componentData.currentCharge ?? 100) < 20 && (
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-[10px] text-red-300 leading-relaxed flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <span>{t.batterySagNotice}</span>
                </div>
              )}

              {/* Recharge Button */}
              <button
                type="button"
                onClick={() => rechargeBattery(nodeId)}
                className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{t.batteryRechargeBtn}</span>
              </button>
            </div>
          </div>
        )}

        {/* Battery Holder Controls */}
        {componentData.type === 'battery-holder' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-200">{t.holderCellsLabel}</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {componentData.batteryCount ?? (componentData.hasBattery ? 2 : 0)} / 2 AA
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
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
                  const nextCount = Math.min(2, (componentData.batteryCount ?? 0) + 1);
                  updateComponentData(nodeId, {
                    hasBattery: true,
                    batteryCount: nextCount,
                    voltage: nextCount * 1.5,
                  });
                }}
                className="py-2 px-2.5 rounded-lg text-xs font-semibold bg-electric-500/15 text-electric-400 border border-electric-500/30 hover:bg-electric-500/25 disabled:opacity-40 active:scale-95 transition-all cursor-pointer"
              >
                {t.holderInsertBtn}
              </button>
              <button
                type="button"
                disabled={(componentData.batteryCount ?? 0) <= 0}
                onClick={() => ejectBatteryFromHolder(nodeId)}
                className="py-2 px-2.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 disabled:opacity-40 active:scale-95 transition-all cursor-pointer"
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
              <label className="text-xs font-semibold text-slate-200">{t.resistorLabel}</label>
              <span className="text-xs font-mono font-bold text-amber-400">
                {componentData.resistance ?? 100} Ω
              </span>
            </div>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-6 cursor-pointer"
              value={[componentData.resistance ?? 100]}
              min={1}
              max={1000}
              step={1}
              onValueChange={([val]) => updateComponentData(nodeId, { resistance: val })}
            >
              <Slider.Track className="bg-void-900 relative grow rounded-full h-2 border border-white/10">
                <Slider.Range className="absolute bg-amber-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-5 h-5 bg-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 transition-transform active:scale-125" />
            </Slider.Root>

            {/* Quick Resistance Presets */}
            <div className="flex items-center gap-1.5 pt-1">
              {[10, 100, 220, 470, 1000].map((res) => (
                <button
                  key={res}
                  type="button"
                  onClick={() => updateComponentData(nodeId, { resistance: res })}
                  className={`flex-1 py-1 rounded-md text-[10px] font-mono border transition-all active:scale-95 ${
                    (componentData.resistance ?? 100) === res
                      ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 font-bold'
                      : 'bg-void-900 text-slate-400 border-white/10 hover:text-white'
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
                    <label className="text-xs font-semibold text-slate-200 block">
                      {componentData.type === 'socket'
                        ? isId
                          ? 'Pilih Lampu Ulir (5 Tipe E27)'
                          : 'Select Screw Bulb (5 E27 Types)'
                        : isId
                        ? 'Pilih Jenis Lampu (7 Tipe)'
                        : 'Select Bulb Type (7 Types)'}
                    </label>
                    <select
                      value={activeBulbType}
                      onChange={(e) => setBulbType(nodeId, e.target.value as BulbType)}
                      className="w-full px-3 py-2 rounded-xl bg-void-900 border border-electric-500/40 text-xs font-medium text-slate-100 focus:outline-none focus:border-electric-400 cursor-pointer"
                    >
                      {BULB_CATALOG.filter(
                        (spec) =>
                          componentData.type !== 'socket' || spec.baseType === 'screw'
                      ).map((spec) => (
                        <option key={spec.type} value={spec.type}>
                          {isId ? spec.label : spec.labelEn} — {spec.resistance}Ω (Maks {spec.maxPower}W)
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 leading-relaxed pt-0.5">
                      {isId ? activeSpec.traits : activeSpec.traitsEn}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-200">
                        {t.bulbResistanceLabel}
                      </label>
                      <span className="text-xs font-mono font-bold text-yellow-300">
                        {activeResistance} Ω
                      </span>
                    </div>
                    <Slider.Root
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
                      <Slider.Track className="bg-void-900 relative grow rounded-full h-2 border border-white/10">
                        <Slider.Range className="absolute bg-yellow-400 rounded-full h-full" />
                      </Slider.Track>
                      <Slider.Thumb className="block w-5 h-5 bg-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-transform active:scale-125" />
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
            <label className="text-xs font-semibold text-slate-200">{t.switchStateLabel}</label>
            <button
              type="button"
              onClick={() => toggleSwitch(nodeId)}
              className={`w-full py-2.5 rounded-xl font-medium text-xs transition-all active:scale-95 border cursor-pointer ${
                componentData.isOpen
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
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
              <span className="text-xs font-semibold text-slate-200">
                {isId ? 'Intensitas Cahaya Surya' : 'Solar Irradiance'}
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {componentData.sunlight ?? 100}% ({(componentData.voltage ?? 12.0).toFixed(1)} V)
              </span>
            </div>

            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-6 cursor-pointer"
              value={[componentData.sunlight ?? 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={([val]) =>
                updateComponentData(nodeId, {
                  sunlight: val,
                  voltage: Number(((val / 100) * 12.0).toFixed(2)),
                })
              }
            >
              <Slider.Track className="bg-void-900 relative grow rounded-full h-2 border border-white/10">
                <Slider.Range className="absolute bg-amber-400 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-5 h-5 bg-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400 transition-transform active:scale-125" />
            </Slider.Root>
          </div>
        )}

        {/* Wind Turbine Controls */}
        {(componentData.type === 'wind-turbine' || componentData.type === 'wind_turbine') && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-200">
                {isId ? 'Kecepatan Baling-Baling' : 'Rotor Speed'}
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {componentData.speed ?? 50}% ({(((componentData.speed ?? 50) / 100) * 12.0).toFixed(1)} V)
              </span>
            </div>

            <Slider.Root
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
              <Slider.Track className="bg-void-900 relative grow rounded-full h-2 border border-white/10">
                <Slider.Range className="absolute bg-cyan-400 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-5 h-5 bg-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-transform active:scale-125" />
            </Slider.Root>
          </div>
        )}

        {/* Transmission Tower & MCB Panel Controls */}
        {(componentData.type === 'transmission-tower' || componentData.type === 'transmission_tower') && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-200">
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
                className={`px-3 py-1 rounded-lg font-mono text-[10px] font-bold border transition-all active:scale-95 cursor-pointer ${
                  componentData.isMcbTripped
                    ? 'bg-red-600 hover:bg-red-500 text-white border-red-400'
                    : componentData.isMcbOn !== false
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                    : 'bg-slate-800 text-slate-300 border-white/15'
                }`}
              >
                {componentData.isMcbTripped
                  ? isId
                    ? 'Reset MCB (Trip)'
                    : 'Reset MCB (Trip)'
                  : componentData.isMcbOn !== false
                  ? 'MCB: ON (Aktif)'
                  : 'MCB: OFF (Putus)'}
              </button>
            </div>

            {/* Step-Down DC Voltage Regulation */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-sans">
                  {isId ? 'Regulator Step-Down DC:' : 'DC Step-Down Regulator:'}
                </span>
                <span className="font-mono font-bold text-cyan-300">
                  {componentData.stepDownVoltage == null
                    ? isId
                      ? 'Otomatis (Langsung)'
                      : 'Auto (Direct)'
                    : `Maks ${componentData.stepDownVoltage} V`}
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
                    className={`py-1 rounded-lg font-mono text-[10px] font-bold border transition-all active:scale-95 cursor-pointer ${
                      (componentData.stepDownVoltage ?? null) === opt.val
                        ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60'
                        : 'bg-void-900 text-slate-400 border-white/10 hover:text-white'
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
