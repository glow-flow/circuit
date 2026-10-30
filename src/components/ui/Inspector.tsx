import React from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Sliders, Trash2, Cpu, ShieldCheck, AlertTriangle, X, BookOpen, Scissors, Zap, BatteryCharging } from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { countVisibleWires } from '../../utils/socketSnap';
import { BULB_CATALOG, BulbType, getBulbSpec } from '../../constants/bulbCatalog';
import { TRANSLATIONS } from '../../i18n/translations';

interface InspectorProps {
  isMobileDrawer?: boolean;
  onCloseMobile?: () => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  isMobileDrawer = false,
  onCloseMobile,
}) => {
  const nodes = useCircuitStore((state) => state.nodes);
  const edges = useCircuitStore((state) => state.edges);
  const selectedNodeId = useCircuitStore((state) => state.selectedNodeId);
  const selectedEdgeId = useCircuitStore((state) => state.selectedEdgeId);
  const updateComponentData = useCircuitStore((state) => state.updateComponentData);
  const removeComponent = useCircuitStore((state) => state.removeComponent);
  const removeEdge = useCircuitStore((state) => state.removeEdge);
  const toggleSwitch = useCircuitStore((state) => state.toggleSwitch);
  const rechargeBattery = useCircuitStore((state) => state.rechargeBattery);
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);

  const t = TRANSLATIONS[language].inspector;
  const wireT = TRANSLATIONS[language].wire;

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  const containerClasses = isMobileDrawer
    ? 'flex flex-col max-h-[75dvh] w-full bg-void-900 border-t border-white/15 rounded-t-2xl shadow-2xl select-none overflow-hidden'
    : 'hidden md:flex w-80 bg-void-900 border-l border-white/10 flex-col h-full shrink-0 select-none';

  const panelId =
    isMobileDrawer || typeof window === 'undefined' || window.innerWidth >= 768
      ? 'tour-panel-inspector'
      : undefined;

  // Wire Selected View
  if (!selectedNode && selectedEdge) {
    const sourceNode = nodes.find((n) => n.id === selectedEdge.source);
    const targetNode = nodes.find((n) => n.id === selectedEdge.target);
    const wireCurrent = Math.max(
      Math.abs(simulation.branchCurrents[selectedEdge.source] ?? 0),
      Math.abs(simulation.branchCurrents[selectedEdge.target] ?? 0)
    );

    return (
      <aside id={panelId} className={containerClasses}>
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Scissors className="w-4 h-4 text-red-400 shrink-0" />
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider truncate">
              {wireT.wireSelected}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                removeEdge(selectedEdge.id);
                if (isMobileDrawer && onCloseMobile) onCloseMobile();
              }}
              className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-500/30 transition-colors active:scale-95"
              title={wireT.cutWire}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            {isMobileDrawer && onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg bg-void-850 text-slate-400 hover:text-white border border-white/10 active:scale-95"
                aria-label="Close inspector"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div className="bg-void-950 rounded-xl p-3 border border-white/5 space-y-2.5 font-mono text-xs">
            <div className="text-[10px] text-slate-400 font-sans uppercase tracking-wider font-semibold">
              {t.liveTelemetry}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans text-[11px]">{t.branchCurrent}</span>
              <span className="text-electric-400 font-bold">
                {wireCurrent < 1
                  ? `${(wireCurrent * 1000).toFixed(1)} mA`
                  : `${wireCurrent.toFixed(3)} A`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans text-[11px]">{wireT.wireResistance}</span>
              <span className="text-emerald-400">{wireT.idealWire}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/5 text-[11px] font-sans">
              <span className="text-slate-400">{wireT.fromTo}</span>
              <span className="text-slate-200 truncate max-w-[150px]">
                {sourceNode?.data.label ?? 'Pin'} → {targetNode?.data.label ?? 'Pin'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              removeEdge(selectedEdge.id);
              if (isMobileDrawer && onCloseMobile) onCloseMobile();
            }}
            className="w-full py-2.5 px-3 rounded-xl font-semibold text-xs bg-red-600 hover:bg-red-500 text-white shadow-lg border border-red-400/50 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Scissors className="w-4 h-4" />
            <span>{wireT.cutWire}</span>
          </button>
        </div>
      </aside>
    );
  }

  if (!selectedNode) {
    // Global Circuit Telemetry & Grade 9 IPA Formula View
    return (
      <aside id={panelId} className={containerClasses}>
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-electric-400" />
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              {t.title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-void-850 text-slate-400 border border-white/5">
              {t.globalBadge}
            </span>
            {isMobileDrawer && onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg bg-void-850 text-slate-400 hover:text-white border border-white/10 active:scale-95"
                aria-label="Close inspector"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-3.5 flex-1 overflow-y-auto">
          {/* Status Box */}
          <div
            className={`rounded-xl p-3 border ${
              simulation.isShortCircuit
                ? 'bg-danger-500/10 border-danger-500/30'
                : 'bg-void-950 border-white/5'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              {simulation.isShortCircuit ? (
                <AlertTriangle className="w-4 h-4 text-danger-500" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              )}
              <span className="text-xs font-semibold text-slate-200">
                {simulation.isShortCircuit ? t.hazardTitle : t.normalTitle}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {simulation.isShortCircuit ? t.hazardDesc : t.normalDesc}
            </p>
          </div>

          {/* Telemetry Metrics */}
          <div className="bg-void-950 rounded-xl p-3 border border-white/5 space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans text-[11px]">{t.totalComponents}</span>
              <span className="text-slate-200">{nodes.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans text-[11px]">{t.totalWires}</span>
              <span className="text-slate-200">{countVisibleWires(edges)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans text-[11px]">{t.totalPower}</span>
              <span className="text-electric-400 font-bold">
                {simulation.totalPowerDrawn.toFixed(2)} W
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans text-[11px]">{t.maxVoltage}</span>
              <span className="text-amber-400 font-bold">
                {Math.max(0, ...Object.values(simulation.nodeVoltages)).toFixed(2)} V
              </span>
            </div>
          </div>

          {/* Grade 9 Physics Quick Cheat-Sheet Box */}
          <div className="p-3 rounded-xl bg-electric-500/5 border border-electric-500/20 text-[11px] space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-electric-400">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t.formulaTitle}</span>
            </div>
            <div className="font-mono text-[10px] text-slate-200 bg-void-950/80 px-2 py-1 rounded border border-white/5">
              {t.formulaOhm}
            </div>
            <div className="font-mono text-[10px] text-slate-200 bg-void-950/80 px-2 py-1 rounded border border-white/5">
              {t.formulaPower}
            </div>
            <div className="font-mono text-[10px] text-emerald-300 bg-void-950/80 px-2 py-1 rounded border border-white/5">
              {t.formulaSeries}
            </div>
          </div>

          {/* Educational Note */}
          <div className="p-3 rounded-xl bg-void-950/50 border border-white/5 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">{t.quickTipTitle}</div>
            <p className="leading-relaxed">{t.quickTipDesc}</p>
          </div>
        </div>
      </aside>
    );
  }

  // Component Selected View
  const componentData = selectedNode.data;
  const branchCurrent = Math.abs(simulation.branchCurrents[selectedNode.id] ?? 0);

  return (
    <aside id={panelId} className={containerClasses}>
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Sliders className="w-4 h-4 text-electric-400 shrink-0" />
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider truncate">
              {componentData.label}
            </h2>
            <p className="text-[10px] text-electric-400 font-medium truncate">
              {language === 'id' ? 'Panel Ubah Properti Komponen' : 'Component Properties Panel'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              removeComponent(selectedNode.id);
              if (isMobileDrawer && onCloseMobile) onCloseMobile();
            }}
            className="p-1.5 rounded-lg bg-void-850 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-white/5 transition-colors active:scale-95"
            title={t.deleteTitle}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {isMobileDrawer && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg bg-void-850 text-slate-400 hover:text-white border border-white/10 active:scale-95"
              aria-label="Close inspector"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* Interactive Component Property Controls (Placed FIRST so controls are immediately clear on Mobile & Desktop) */}
        {componentData.type !== 'waypoint' && (
          <div className="rounded-xl bg-void-950/90 border border-electric-500/30 p-3.5 space-y-3.5 shadow-[0_0_20px_rgba(14,165,233,0.08)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-electric-400 flex items-center gap-1.5">
                <Sliders className="w-3 h-3" />
                {language === 'id' ? 'Ubah Properti & Pengaturan' : 'Adjust Component Properties'}
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
                  onValueChange={([val]) => updateComponentData(selectedNode.id, { voltage: val })}
                >
                  <Slider.Track className="bg-void-900 relative grow rounded-full h-2 border border-white/10">
                    <Slider.Range className="absolute bg-electric-500 rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb className="block w-5 h-5 bg-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-electric-500 transition-transform active:scale-125" />
                </Slider.Root>

                {componentData.type === 'battery9v' && (
                  <div className="p-2.5 rounded-xl bg-void-900/80 border border-white/5 text-[11px] text-slate-400 space-y-1">
                    <div className="flex justify-between font-mono text-xs">
                      <span>
                        {language === 'id' ? 'Hambatan Dalam (R_in):' : 'Internal Resistance:'}
                      </span>
                      <span className="text-amber-400 font-bold">
                        {(componentData.internalResistance ?? 2.0).toFixed(1)} Ω
                      </span>
                    </div>
                    <p className="leading-relaxed text-[10px]">
                      {language === 'id'
                        ? 'Baterai 9V memiliki hambatan dalam ~2.0Ω sehingga arus hubung singkat terbatas (~4.5A). Jika 2 baterai 9V dipasang seri, tegangan menjadi 18.0V.'
                        : '9V battery has ~2.0Ω internal resistance, limiting short-circuit current to ~4.5A. Wiring two 9V batteries in series yields 18.0V.'}
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
                      {language === 'id' ? 'Status Aliran:' : 'Flow State:'}
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

                  {/* Voltage Sag Alert Warning */}
                  {(componentData.currentCharge ?? 100) < 20 && (
                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-[10px] text-red-300 leading-relaxed flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span>{t.batterySagNotice}</span>
                    </div>
                  )}

                  {/* Recharge Button */}
                  <button
                    type="button"
                    onClick={() => rechargeBattery(selectedNode.id)}
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
                      updateComponentData(selectedNode.id, {
                        hasBattery: true,
                        batteryCount: nextCount,
                        voltage: nextCount * 1.5,
                      });
                    }}
                    className="py-2 px-2.5 rounded-lg text-xs font-semibold bg-electric-500/15 text-electric-400 border border-electric-500/30 hover:bg-electric-500/25 disabled:opacity-40 active:scale-95 transition-all"
                  >
                    {t.holderInsertBtn}
                  </button>
                  <button
                    type="button"
                    disabled={(componentData.batteryCount ?? 0) <= 0}
                    onClick={() =>
                      useCircuitStore.getState().ejectBatteryFromHolder(selectedNode.id)
                    }
                    className="py-2 px-2.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 disabled:opacity-40 active:scale-95 transition-all"
                  >
                    {t.holderEjectBtn}
                  </button>
                </div>

                {/* State of Charge (SoC) Controls for Holder */}
                {Boolean(componentData.hasBattery && (componentData.batteryCount ?? 0) > 0) && (
                  <div className="p-3 rounded-xl bg-void-950/70 border border-white/5 space-y-2.5 mt-2">
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
                        {Math.round(((componentData.currentCharge ?? 100) * (componentData.capacity ?? 2000)) / 100)} / {componentData.capacity ?? 2000} mAh
                      </span>
                    </div>

                    {(componentData.currentCharge ?? 100) < 20 && (
                      <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-[10px] text-red-300 leading-relaxed flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <span>{t.batterySagNotice}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => rechargeBattery(selectedNode.id)}
                      className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{t.batteryRechargeBtn}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Solar Panel Controls */}
            {(componentData.type === 'solar-panel' || componentData.type === 'solar_panel') && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-200">
                    {language === 'id' ? 'Tegangan Fotovoltaik' : 'Photovoltaic Output'}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {(componentData.voltage ?? 0).toFixed(1)} V
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-void-950/70 border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-sans text-[11px]">
                      {language === 'id' ? 'Kondisi Cuaca:' : 'Environment:'}
                    </span>
                    <span className="font-mono font-bold text-slate-200">
                      {useCircuitStore.getState().environment === 'sunny'
                        ? '☀️ Terik (12V)'
                        : useCircuitStore.getState().environment === 'cloudy'
                        ? '⛅ Mendung (5V)'
                        : '🔬 Lab / Gelap (0V)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {language === 'id'
                      ? 'Tegangan panel surya ditentukan oleh lingkungan luar ruangan. Gunakan tombol cuaca di bilah atas untuk beralih antara Terik (12V), Mendung (5V), atau Lab (0V).'
                      : 'Solar panel voltage is determined by outdoor weather. Use the environment switcher button in the top bar to toggle between Sunny (12V), Cloudy (5V), or Lab (0V).'}
                  </p>
                </div>
              </div>
            )}

            {/* Wind Turbine Controls */}
            {(componentData.type === 'wind-turbine' || componentData.type === 'wind_turbine') && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-200">
                    {language === 'id' ? 'Kecepatan Baling-Baling' : 'Rotor Speed'}
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
                    updateComponentData(selectedNode.id, {
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

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {language === 'id'
                    ? 'Turbin angin menghasilkan tegangan DC 0 - 12 V proporsional dengan kecepatan angin/putaran baling-baling.'
                    : 'Wind turbine generates 0 - 12 V DC proportional to rotor rotational speed.'}
                </p>
              </div>
            )}

            {/* Transmission Tower Virtual Grid Controls */}
            {(componentData.type === 'transmission-tower' || componentData.type === 'transmission_tower') && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-200">
                    {language === 'id' ? 'Status Jaringan Virtual' : 'Virtual Grid Bus'}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                      (componentData.towerConnectedCount ?? 1) > 1
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-void-950 text-slate-400 border-white/10'
                    }`}
                  >
                    {(componentData.towerConnectedCount ?? 1) > 1
                      ? language === 'id'
                        ? 'Grid Terhubung'
                        : 'Grid Linked'
                      : language === 'id'
                      ? 'Standby'
                      : 'Standby'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-void-950/70 border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-sans">
                      {language === 'id' ? 'Total Menara di Kanvas:' : 'Total Towers on Canvas:'}
                    </span>
                    <span className="font-mono font-bold text-slate-200">
                      {componentData.towerConnectedCount ?? 1}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {language === 'id'
                      ? 'Dua atau lebih Menara Transmisi secara otomatis menyatukan kutub positif dan negatifnya menjadi jaringan transmisi virtual tanpa hambatan (R = 0Ω).'
                      : 'Two or more Transmission Towers automatically unite positive and negative terminals into a lossless virtual transmission bus (R = 0Ω).'}
                  </p>
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
                  onValueChange={([val]) =>
                    updateComponentData(selectedNode.id, { resistance: val })
                  }
                >
                  <Slider.Track className="bg-void-900 relative grow rounded-full h-2 border border-white/10">
                    <Slider.Range className="absolute bg-amber-500 rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb className="block w-5 h-5 bg-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 transition-transform active:scale-125" />
                </Slider.Root>
              </div>
            )}

            {/* Light Bulb Controls (7-Bulb Selector + Fine Resistance Slider for Bulb or Loaded Socket) */}
            {(componentData.type === 'bulb' ||
              (componentData.type === 'socket' && Boolean(componentData.installedBulb))) && (
              <div className="space-y-3.5">
                {(() => {
                  const activeBulbType: BulbType =
                    componentData.type === 'socket' &&
                    componentData.installedBulb &&
                    typeof componentData.installedBulb === 'object'
                      ? componentData.installedBulb.bulbType
                      : (typeof componentData.installedBulb === 'string'
                          ? componentData.installedBulb
                          : componentData.bulbType) ?? 'incandescent';
                  const activeSpec = getBulbSpec(activeBulbType);
                  const activeResistance =
                    componentData.type === 'socket' &&
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
                            ? language === 'id'
                              ? 'Pilih Lampu Ulir (5 Tipe E27)'
                              : 'Select Screw Bulb (5 E27 Types)'
                            : language === 'id'
                            ? 'Pilih Jenis Lampu (7 Tipe)'
                            : 'Select Bulb Type (7 Types)'}
                        </label>
                        <select
                          value={activeBulbType}
                          onChange={(e) =>
                            useCircuitStore
                              .getState()
                              .setBulbType(selectedNode.id, e.target.value as BulbType)
                          }
                          className="w-full px-3 py-2 rounded-xl bg-void-900 border border-electric-500/40 text-xs font-medium text-slate-100 focus:outline-none focus:border-electric-400 cursor-pointer"
                        >
                          {BULB_CATALOG.filter(
                            (spec) =>
                              componentData.type !== 'socket' || spec.baseType === 'screw'
                          ).map((spec) => (
                            <option key={spec.type} value={spec.type}>
                              {language === 'id' ? spec.label : spec.labelEn} — {spec.resistance}Ω
                              (Maks {spec.maxPower}W)
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-slate-400 leading-relaxed pt-0.5">
                          {language === 'id' ? activeSpec.traits : activeSpec.traitsEn}
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
                              componentData.type === 'socket' &&
                              componentData.installedBulb &&
                              typeof componentData.installedBulb === 'object'
                            ) {
                              updateComponentData(selectedNode.id, {
                                resistance: val,
                                installedBulb: {
                                  ...componentData.installedBulb,
                                  resistance: val,
                                },
                              });
                            } else {
                              updateComponentData(selectedNode.id, { resistance: val });
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
                  onClick={() => toggleSwitch(selectedNode.id)}
                  className={`w-full py-2.5 rounded-xl font-medium text-xs transition-all active:scale-95 border ${
                    componentData.isOpen
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  }`}
                >
                  {componentData.isOpen ? t.switchOpenBtn : t.switchClosedBtn}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Real-time Branch Telemetry */}
        {componentData.type === 'waypoint' ? (
          <div className="bg-void-950 rounded-xl p-3 border border-white/5 space-y-2 text-xs">
            <div className="text-[10px] text-sky-400 font-sans uppercase tracking-wider font-semibold">
              {t.waypointTitle}
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">{t.waypointDesc}</p>
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-t border-white/5 pt-2">
              <span>{t.waypointImpedance}</span>
              <span className="text-emerald-400">{t.waypointLossless}</span>
            </div>
          </div>
        ) : (
          <div className="bg-void-950 rounded-xl p-3 border border-white/5 space-y-2 font-mono text-xs">
            <div className="text-[10px] text-slate-400 font-sans uppercase tracking-wider font-semibold">
              {t.liveTelemetry}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans text-[11px]">{t.branchCurrent}</span>
              <span className="text-electric-400 font-bold">
                {branchCurrent < 1
                  ? `${(branchCurrent * 1000).toFixed(1)} mA`
                  : `${branchCurrent.toFixed(3)} A`}
              </span>
            </div>

            {componentData.type === 'resistor' && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-sans text-[11px]">{t.voltageDrop}</span>
                <span className="text-slate-200">
                  {(branchCurrent * (componentData.resistance ?? 100)).toFixed(2)} V
                </span>
              </div>
            )}

            {(componentData.type === 'bulb' ||
              (componentData.type === 'socket' && Boolean(componentData.installedBulb))) && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-sans text-[11px]">{t.powerDissipated}</span>
                <span className="text-amber-400 font-bold">
                  {(() => {
                    const p =
                      branchCurrent *
                      branchCurrent *
                      (componentData.resistance ?? getBulbSpec(componentData.bulbType).resistance);
                    return p > 0 && p < 0.1
                      ? `${(p * 1000).toFixed(2)} mW`
                      : `${p.toFixed(2)} W`;
                  })()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
