import React, { useState, useMemo } from 'react';
import {
  X,
  Sun,
  Wind,
  BatteryCharging,
  Zap,
  Activity,
  Sliders,
  Sparkles,
  Trees,
} from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { createOutdoorPowerStationElements } from '../../../utils/outdoorSpawnUtils';
import {
  calculateSolarOperatingPoint,
  generateSolarIVCurve,
  calculateWindOperatingPoint,
  calculateBessDynamicState,
  computeMicrogridPowerBalance,
  DEFAULT_SOLAR_PANEL_PARAMS,
  DEFAULT_WIND_TURBINE_PARAMS,
  DEFAULT_BESS_PARAMS,
  RENEWABLE_SCENARIOS,
} from '../../../physics/renewableTwin';
import {
  SolarEnvironmentalConditions,
  RenewableScenario,
  BatteryChemistry,
  BessParameters,
} from '../../../types/renewable';
import { useModalKeyboardClose } from '../../../hooks/useModalKeyboardClose';

interface RenewableLabModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RenewableLabModal: React.FC<RenewableLabModalProps> = ({ isOpen, onClose }) => {
  useModalKeyboardClose(isOpen, onClose);
  const language = useCircuitStore((state) => state.language);
  const notify = useCircuitStore((state) => state.notify);
  const isId = language === 'id';

  // Environmental Controls State
  const [irradiance, setIrradiance] = useState<number>(850);
  const [sunElevationDeg, setSunElevationDeg] = useState<number>(60);
  const [panelTiltDeg, setPanelTiltDeg] = useState<number>(15);
  const [ambientTempCelsius, setAmbientTempCelsius] = useState<number>(28);
  const [shadingFactor, setShadingFactor] = useState<number>(0.0);
  const [windSpeedMs, setWindSpeedMs] = useState<number>(6.5);
  const [loadDemandWatts, setLoadDemandWatts] = useState<number>(120);

  // BESS Parameters State
  const [batteryChemistry, setBatteryChemistry] = useState<BatteryChemistry>('lfp');
  const [bessSoCPercent, setBessSoCPercent] = useState<number>(75);

  // Active Scenario
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    RENEWABLE_SCENARIOS[0].id
  );

  // Computed BESS configuration based on chosen chemistry
  const bessParams: BessParameters = useMemo(() => {
    switch (batteryChemistry) {
      case 'lead-acid':
        return {
          chemistry: 'lead-acid',
          nominalCapacityWh: 1000,
          nominalVoltage: 12.0,
          coulombicEfficiency: 0.85,
          roundTripEfficiency: 0.80,
          maxChargeCRate: 0.25,
          maxDischargeCRate: 0.5,
          minSafeSoCPercent: 50.0, // Lead acid cannot be deeply discharged
          maxSafeSoCPercent: 100.0,
        };
      case 'lithium-ion':
        return {
          chemistry: 'lithium-ion',
          nominalCapacityWh: 1000,
          nominalVoltage: 14.8,
          coulombicEfficiency: 0.95,
          roundTripEfficiency: 0.90,
          maxChargeCRate: 0.8,
          maxDischargeCRate: 1.5,
          minSafeSoCPercent: 15.0,
          maxSafeSoCPercent: 100.0,
        };
      case 'lfp':
      default:
        return DEFAULT_BESS_PARAMS;
    }
  }, [batteryChemistry]);

  // Solar Physics Evaluation
  const solarEnv: SolarEnvironmentalConditions = useMemo(
    () => ({
      irradiance,
      sunElevationDeg,
      panelTiltDeg,
      ambientTempCelsius,
      shadingFactor,
    }),
    [irradiance, sunElevationDeg, panelTiltDeg, ambientTempCelsius, shadingFactor]
  );

  const solarPoint = useMemo(
    () => calculateSolarOperatingPoint(DEFAULT_SOLAR_PANEL_PARAMS, solarEnv),
    [solarEnv]
  );

  const solarIvCurve = useMemo(
    () => generateSolarIVCurve(solarPoint, 30),
    [solarPoint]
  );

  // Wind Physics Evaluation
  const windPoint = useMemo(
    () => calculateWindOperatingPoint(DEFAULT_WIND_TURBINE_PARAMS, windSpeedMs),
    [windSpeedMs]
  );

  // Microgrid Balance Evaluation
  const microgridBalance = useMemo(
    () =>
      computeMicrogridPowerBalance(
        solarPoint.pmpp,
        windPoint.electricalOutputWatts,
        loadDemandWatts,
        bessParams,
        bessSoCPercent
      ),
    [solarPoint.pmpp, windPoint.electricalOutputWatts, loadDemandWatts, bessParams, bessSoCPercent]
  );

  // BESS Dynamic Simulation
  const bessState = useMemo(
    () =>
      calculateBessDynamicState(
        bessParams,
        bessSoCPercent,
        microgridBalance.netPowerWatts,
        1.0
      ),
    [bessParams, bessSoCPercent, microgridBalance.netPowerWatts]
  );

  const selectedScenario = useMemo(() => {
    return (
      RENEWABLE_SCENARIOS.find((s) => s.id === selectedScenarioId) ??
      RENEWABLE_SCENARIOS[0]
    );
  }, [selectedScenarioId]);

  const handleApplyScenario = (scenario: RenewableScenario) => {
    setSelectedScenarioId(scenario.id);
    setIrradiance(scenario.solarConditions.irradiance);
    setSunElevationDeg(scenario.solarConditions.sunElevationDeg);
    setPanelTiltDeg(scenario.solarConditions.panelTiltDeg);
    setAmbientTempCelsius(scenario.solarConditions.ambientTempCelsius);
    setShadingFactor(scenario.solarConditions.shadingFactor);
    setWindSpeedMs(scenario.windSpeedMs);
    setLoadDemandWatts(scenario.targetLoadWatts);
    setBessSoCPercent(scenario.bessInitialSoCPercent);

    notify(
      isId
        ? `Skenario "${scenario.titleId}" dipilih! Tekan "Pasang di Alam" untuk memuat ke Zona Alam Terbuka.`
        : `Scenario "${scenario.titleEn}" selected! Click "Deploy Outdoor" to load onto Outdoor Sandbox.`
    );
  };





  /**
   * Deploys the renewable power station onto the 2D grassy terrain in Outdoor Sandbox.
   */
  const handleDeployScenarioToOutdoor = (scenario?: RenewableScenario) => {
    const sc = scenario ?? selectedScenario;
    const state = useCircuitStore.getState();
    const nonOutdoorNodes = state.nodes.filter((n) => n.data.worldMode !== 'outside');
    const outdoorNodeIds = new Set(
      state.nodes.filter((n) => n.data.worldMode === 'outside').map((n) => n.id)
    );
    const nonOutdoorEdges = state.edges.filter(
      (e) => !outdoorNodeIds.has(e.source) && !outdoorNodeIds.has(e.target)
    );

    const sunlight = Math.round((sc.solarConditions.irradiance / 1000) * 100);
    const windPercent = Math.round(Math.min(100, (sc.windSpeedMs / 12) * 100));

    const { nodes: newOutdoorNodes, edges: newOutdoorEdges } = createOutdoorPowerStationElements({
      terrainGrid: state.terrainGrid,
      isId,
      sunlightPercent: sunlight,
      windSpeedPercent: windPercent,
    });

    useCircuitStore.setState({
      nodes: [...nonOutdoorNodes, ...newOutdoorNodes],
      edges: [...nonOutdoorEdges, ...newOutdoorEdges],
      worldMode: 'outside',
      selectedNodeId: null,
      selectedEdgeId: null,
      fitViewTrigger: state.fitViewTrigger + 1,
    });
    useCircuitStore.getState().runSimulation();

    notify(
      isId
        ? `Pembangkit "${sc.titleId}" berhasil dipasang di Zona Alam Terbuka!`
        : `Outdoor generator "${sc.titleEn}" spawned in Outdoor Sandbox!`
    );
    onClose();
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto min-h-[100dvh]">
      <div className="w-full max-w-6xl max-h-[92vh] rounded-2xl bg-void-950 border border-white/10 shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-void-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sun className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                  {isId
                    ? 'Digital Twin Energi Terbarukan & Microgrid'
                    : 'Renewable Energy & Microgrid Digital Twin'}
                </h2>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CIRCUIT 4.0
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isId
                  ? 'Simulasi fisik interaktif fotovoltaik, aerodinamika turbin angin, elektrokimia BESS, dan keseimbangan daya microgrid.'
                  : 'Interactive physics twin for solar PV, wind aerodynamics, BESS electrochemistry, and microgrid power flow.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDeployScenarioToOutdoor()}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-void-950 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md shadow-emerald-500/20 shrink-0"
              title={isId ? 'Pasang di Zona Alam Terbuka' : 'Deploy to Outdoor Sandbox'}
            >
              <Trees className="w-4 h-4 text-void-950 shrink-0" />
              <span className="hidden sm:inline">{isId ? 'Pasang di Alam' : 'Deploy Outdoor'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Section 1: Pedagogical Scenarios Selector */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {isId ? 'Pilih Skenario Pembelajaran' : 'Select Educational Scenario'}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {RENEWABLE_SCENARIOS.map((scenario) => {
                const isSelected = scenario.id === selectedScenarioId;
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => handleApplyScenario(scenario)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all active:scale-95 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-sm ring-1 ring-emerald-500/30'
                        : 'bg-void-900 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/15'
                    }`}
                  >
                    <span className="font-semibold line-clamp-2">
                      {isId ? scenario.titleId : scenario.titleEn}
                    </span>
                    <span className="text-[10px] text-emerald-400/80 mt-1.5 font-mono">
                      {scenario.targetLoadWatts}W Load
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Scenario Action Banner */}
            {selectedScenario && (
              <div className="mt-3 p-3.5 rounded-2xl bg-void-900/90 border border-emerald-500/30 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">
                      {isId ? selectedScenario.titleId : selectedScenario.titleEn}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-semibold border border-emerald-500/30">
                      {selectedScenario.targetLoadWatts}W Load
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {isId ? selectedScenario.summaryId : selectedScenario.summaryEn}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDeployScenarioToOutdoor(selectedScenario)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-void-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <Trees className="w-4 h-4 text-void-950" />
                    <span>{isId ? '🌲 Pasang Pembangkit di Alam Terbuka' : '🌲 Deploy to Outdoor Sandbox'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Real-time Animated Microgrid Power Flow Diagram */}
          <div className="rounded-2xl bg-void-900 border border-white/10 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                <h3 className="text-sm font-bold text-white">
                  {isId ? 'Keseimbangan Daya Microgrid (Power Flow Balance)' : 'Microgrid Power Flow Balance'}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span
                  className={`px-2.5 py-1 rounded-full font-semibold border ${
                    microgridBalance.status === 'self_sufficient_surplus'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : microgridBalance.status === 'bess_supporting'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {microgridBalance.status === 'self_sufficient_surplus'
                    ? isId
                      ? '● Mandiri (Surplus)'
                      : '● Self-Sufficient (Surplus)'
                    : microgridBalance.status === 'bess_supporting'
                    ? isId
                      ? '● Didukung BESS'
                      : '● BESS Supporting'
                    : isId
                    ? '● Impor Grid / Defisit'
                    : '● Grid Import / Deficit'}
                </span>
                <span className="text-slate-400">
                  {isId ? 'Otonomi Cadangan:' : 'Backup Autonomy:'}{' '}
                  <strong className="text-white">
                    {microgridBalance.autonomyHours >= 900
                      ? '∞ (Mandiri)'
                      : `${microgridBalance.autonomyHours} Jam`}
                  </strong>
                </span>
              </div>
            </div>

            {/* Visual Power Flow Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Solar PV Generation */}
              <div className="rounded-xl bg-void-950 border border-white/5 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-400" />
                    {isId ? 'Surya (PV)' : 'Solar PV'}
                  </span>
                  <span className="text-[10px] font-mono text-amber-400">Gen</span>
                </div>
                <div className="my-2">
                  <span className="text-2xl font-mono font-bold text-white tracking-tight">
                    {solarPoint.pmpp}
                  </span>
                  <span className="text-xs font-mono text-slate-400 ml-1">W</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex justify-between">
                  <span>Voc: {solarPoint.openCircuitVoltage}V</span>
                  <span>Isc: {solarPoint.shortCircuitCurrent}A</span>
                </div>
              </div>

              {/* Wind Turbine Generation */}
              <div className="rounded-xl bg-void-950 border border-white/5 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-cyan-400" />
                    {isId ? 'Turbin Angin' : 'Wind Turbine'}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">Gen</span>
                </div>
                <div className="my-2">
                  <span className="text-2xl font-mono font-bold text-white tracking-tight">
                    {windPoint.electricalOutputWatts}
                  </span>
                  <span className="text-xs font-mono text-slate-400 ml-1">W</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex justify-between">
                  <span>RPM: {windPoint.estimatedRpm}</span>
                  <span>Cp: {windPoint.effectiveCp}</span>
                </div>
              </div>

              {/* Common DC Bus & Net Balance */}
              <div className="rounded-xl bg-void-950 border border-emerald-500/20 p-3.5 flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    {isId ? 'DC Bus Bersama' : 'Common DC Bus'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">P_net</span>
                </div>
                <div className="my-2">
                  <span
                    className={`text-2xl font-mono font-bold tracking-tight ${
                      microgridBalance.netPowerWatts >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {microgridBalance.netPowerWatts >= 0 ? '+' : ''}
                    {microgridBalance.netPowerWatts}
                  </span>
                  <span className="text-xs font-mono text-slate-400 ml-1">W</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex justify-between">
                  <span>Tot Gen: {microgridBalance.totalGenerationWatts}W</span>
                  <span>Load: {microgridBalance.totalLoadWatts}W</span>
                </div>
              </div>

              {/* BESS Battery Storage */}
              <div className="rounded-xl bg-void-950 border border-white/5 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium flex items-center gap-1.5">
                    <BatteryCharging className="w-4 h-4 text-emerald-400" />
                    {isId ? 'BESS Storage' : 'BESS Storage'}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {bessState.stateOfChargePercent}%
                  </span>
                </div>
                <div className="my-2">
                  <span
                    className={`text-2xl font-mono font-bold tracking-tight ${
                      bessState.activePowerWatts > 0
                        ? 'text-emerald-400'
                        : bessState.activePowerWatts < 0
                        ? 'text-amber-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {bessState.activePowerWatts > 0 ? '+' : ''}
                    {bessState.activePowerWatts}
                  </span>
                  <span className="text-xs font-mono text-slate-400 ml-1">W</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex justify-between">
                  <span>{bessState.mode.toUpperCase()}</span>
                  <span>{bessState.currentEnergyWh} Wh</span>
                </div>
              </div>

              {/* Connected Community Load */}
              <div className="rounded-xl bg-void-950 border border-white/5 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-purple-400" />
                    {isId ? 'Beban Konsumen' : 'Consumer Load'}
                  </span>
                  <span className="text-[10px] font-mono text-purple-400">Demand</span>
                </div>
                <div className="my-2">
                  <span className="text-2xl font-mono font-bold text-white tracking-tight">
                    {loadDemandWatts}
                  </span>
                  <span className="text-xs font-mono text-slate-400 ml-1">W</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex justify-between">
                  <span>{isId ? 'Grid Ekspor' : 'Grid Export'}: {microgridBalance.gridExportWatts}W</span>
                  <span>{isId ? 'Impor' : 'Import'}: {microgridBalance.gridImportWatts}W</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Dual Column - Solar Characteristic Curves + Environmental Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Real-time Solar P-V and I-V Curves */}
            <div className="rounded-2xl bg-void-900 border border-white/10 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    {isId ? 'Kurva Karakteristik I-V & P-V Panel Surya' : 'Solar PV I-V & P-V Curves'}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="text-cyan-400">■ Arus I (A)</span>
                    <span className="text-amber-400">■ Daya P (W)</span>
                  </div>
                </div>

                {/* SVG Graph */}
                <div className="h-56 w-full bg-void-950/80 rounded-xl border border-white/5 p-2 relative flex items-center justify-center">
                  <svg
                    className="w-full h-full overflow-visible"
                    viewBox="0 0 320 180"
                    preserveAspectRatio="none"
                  >
                    {/* Grid lines */}
                    <line x1="30" y1="20" x2="300" y2="20" stroke="#ffffff10" strokeDasharray="3,3" />
                    <line x1="30" y1="80" x2="300" y2="80" stroke="#ffffff10" strokeDasharray="3,3" />
                    <line x1="30" y1="140" x2="300" y2="140" stroke="#ffffff10" strokeDasharray="3,3" />
                    <line x1="120" y1="10" x2="120" y2="150" stroke="#ffffff10" strokeDasharray="3,3" />
                    <line x1="210" y1="10" x2="210" y2="150" stroke="#ffffff10" strokeDasharray="3,3" />

                    {/* Axis lines */}
                    <line x1="30" y1="150" x2="310" y2="150" stroke="#ffffff40" strokeWidth="1.5" />
                    <line x1="30" y1="10" x2="30" y2="150" stroke="#ffffff40" strokeWidth="1.5" />

                    {/* Axis Labels */}
                    <text x="305" y="165" fill="#94a3b8" fontSize="9" textAnchor="end">V (Volt)</text>
                    <text x="25" y="12" fill="#94a3b8" fontSize="9" textAnchor="end">I / P</text>

                    {/* I-V Path */}
                    {solarIvCurve.length > 1 && (
                      <path
                        d={solarIvCurve
                          .map((p, idx) => {
                            const x = 30 + (p.voltage / Math.max(1, solarPoint.openCircuitVoltage)) * 270;
                            const y = 150 - (p.current / Math.max(0.1, solarPoint.shortCircuitCurrent)) * 130;
                            return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                          })
                          .join(' ')}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="2.5"
                      />
                    )}

                    {/* P-V Path */}
                    {solarIvCurve.length > 1 && (
                      <path
                        d={solarIvCurve
                          .map((p, idx) => {
                            const x = 30 + (p.voltage / Math.max(1, solarPoint.openCircuitVoltage)) * 270;
                            const maxP = Math.max(1, solarPoint.pmpp * 1.1);
                            const y = 150 - (p.power / maxP) * 130;
                            return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                          })
                          .join(' ')}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="2.5"
                      />
                    )}

                    {/* MPPT Point Dot */}
                    {solarPoint.openCircuitVoltage > 0 && (
                      <g>
                        <circle
                          cx={30 + (solarPoint.vmpp / solarPoint.openCircuitVoltage) * 270}
                          cy={150 - (solarPoint.pmpp / (solarPoint.pmpp * 1.1 || 1)) * 130}
                          r="5"
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        <text
                          x={30 + (solarPoint.vmpp / solarPoint.openCircuitVoltage) * 270}
                          y={130 - (solarPoint.pmpp / (solarPoint.pmpp * 1.1 || 1)) * 130}
                          fill="#10b981"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          MPP ({solarPoint.pmpp}W)
                        </text>
                      </g>
                    )}
                  </svg>
                </div>
              </div>

              {/* Real-time MPPT Readout */}
              <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                <div className="bg-void-950 p-2 rounded-xl border border-white/5">
                  <div className="text-[10px] text-slate-400 font-medium">Vmpp</div>
                  <div className="text-xs font-mono font-bold text-white mt-0.5">
                    {solarPoint.vmpp} V
                  </div>
                </div>
                <div className="bg-void-950 p-2 rounded-xl border border-white/5">
                  <div className="text-[10px] text-slate-400 font-medium">Impp</div>
                  <div className="text-xs font-mono font-bold text-white mt-0.5">
                    {solarPoint.impp} A
                  </div>
                </div>
                <div className="bg-void-950 p-2 rounded-xl border border-white/5">
                  <div className="text-[10px] text-slate-400 font-medium">Fill Factor</div>
                  <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                    {solarPoint.fillFactor}
                  </div>
                </div>
                <div className="bg-void-950 p-2 rounded-xl border border-white/5">
                  <div className="text-[10px] text-slate-400 font-medium">T_cell</div>
                  <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                    {solarPoint.cellTemperatureCelsius}°C
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Environmental & BESS Interactive Sliders */}
            <div className="rounded-2xl bg-void-900 border border-white/10 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  {isId ? 'Parameter Lingkungan & BESS' : 'Environmental & BESS Sliders'}
                </h4>
                {/* Battery Chemistry Selector */}
                <div className="flex items-center gap-1 bg-void-950 p-1 rounded-lg border border-white/10 text-[10px] font-mono">
                  {(['lfp', 'lithium-ion', 'lead-acid'] as BatteryChemistry[]).map((chem) => (
                    <button
                      key={chem}
                      type="button"
                      onClick={() => setBatteryChemistry(chem)}
                      className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                        batteryChemistry === chem
                          ? 'bg-emerald-500 text-void-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {chem.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider 1: Solar Irradiance */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-300">
                    {isId ? 'Radiasi Matahari (Irradiance)' : 'Solar Irradiance'}
                  </span>
                  <span className="font-mono text-amber-400 font-bold">{irradiance} W/m²</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1200"
                  step="10"
                  value={irradiance}
                  onChange={(e) => setIrradiance(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Slider 2: Sun Altitude & Tilt */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-300">{isId ? 'Elevasi Matahari' : 'Sun Elevation'}</span>
                    <span className="font-mono text-slate-200">{sunElevationDeg}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={sunElevationDeg}
                    onChange={(e) => setSunElevationDeg(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-300">{isId ? 'Kemiringan Panel' : 'Panel Tilt'}</span>
                    <span className="font-mono text-slate-200">{panelTiltDeg}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={panelTiltDeg}
                    onChange={(e) => setPanelTiltDeg(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Slider 3: Wind Speed */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-300">
                    {isId ? 'Kecepatan Angin (Wind Speed)' : 'Wind Speed'}
                  </span>
                  <span className="font-mono text-cyan-400 font-bold">{windSpeedMs} m/s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="0.5"
                  value={windSpeedMs}
                  onChange={(e) => setWindSpeedMs(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>0 m/s</span>
                  <span>Cut-in: 3.0</span>
                  <span>Rated: 12.0</span>
                  <span>Cut-out: 25.0</span>
                  <span>30 m/s</span>
                </div>
              </div>

              {/* Slider 4: Shading Factor & Ambient Temp */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-300">{isId ? 'Efek Shading' : 'Shading Factor'}</span>
                    <span className="font-mono text-slate-200">{Math.round(shadingFactor * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={shadingFactor}
                    onChange={(e) => setShadingFactor(Number(e.target.value))}
                    className="w-full accent-slate-400 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-300">{isId ? 'Suhu Udara' : 'Ambient Temp'}</span>
                    <span className="font-mono text-slate-200">{ambientTempCelsius}°C</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="50"
                    value={ambientTempCelsius}
                    onChange={(e) => setAmbientTempCelsius(Number(e.target.value))}
                    className="w-full accent-rose-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Slider 5: BESS State of Charge & Load Demand */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/5">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-300">BESS SoC</span>
                    <span className="font-mono text-emerald-400 font-bold">{bessSoCPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={bessSoCPercent}
                    onChange={(e) => setBessSoCPercent(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-300">{isId ? 'Beban Konsumen' : 'Load Demand'}</span>
                    <span className="font-mono text-purple-400 font-bold">{loadDemandWatts} W</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="5"
                    value={loadDemandWatts}
                    onChange={(e) => setLoadDemandWatts(Number(e.target.value))}
                    className="w-full accent-purple-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
