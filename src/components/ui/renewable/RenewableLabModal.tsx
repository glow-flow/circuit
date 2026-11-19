import React, { useState, useMemo, useRef, useId } from 'react';
import {
  Trees,
} from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { createOutdoorPowerStationElements } from '../../../utils/outdoorSpawnUtils';
import { isOutdoorOnlyComponent } from '../../../types/circuit';
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
import { useModalFocusTrap } from '../../../hooks/useModalKeyboardClose';
import { LabModalHeader } from '../common/LabModalHeader';
import { MicrogridBalancePanel } from './MicrogridBalancePanel';

interface RenewableLabModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * RenewableLabModal provides the interactive Digital Twin for Photovoltaic (PV),
 * Wind Aerodynamics, BESS Electrochemistry, and Microgrid Power Balance.
 *
 * Time Complexity: O(K) where K = 30 curve sample points for the I-V/P-V curve.
 */
export const RenewableLabModal: React.FC<RenewableLabModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalFocusTrap(isOpen, dialogRef, onClose);
  const sliderPrefix = useId();

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
          roundTripEfficiency: 0.8,
          maxChargeCRate: 0.25,
          maxDischargeCRate: 0.5,
          minSafeSoCPercent: 50.0,
          maxSafeSoCPercent: 100.0,
        };
      case 'lithium-ion':
        return {
          chemistry: 'lithium-ion',
          nominalCapacityWh: 1000,
          nominalVoltage: 14.8,
          coulombicEfficiency: 0.95,
          roundTripEfficiency: 0.9,
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
      RENEWABLE_SCENARIOS.find((scenarioItem) => scenarioItem.id === selectedScenarioId) ??
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
        ? `Skenario "${scenario.titleId}" diterapkan pada parameter simulasi.`
        : `Scenario "${scenario.titleEn}" applied to simulation parameters.`
    );
  };

  /**
   * Deploys the renewable power station onto the 2D terrain in Outdoor Sandbox.
   * Time Complexity: O(N + E) where N is canvas nodes and E is canvas edges.
   */
  const handleDeployScenarioToOutdoor = (scenario?: RenewableScenario) => {
    const activeScenario = scenario ?? selectedScenario;
    const state = useCircuitStore.getState();
    const nonOutdoorNodes = state.nodes.filter(
      (nodeItem) =>
        nodeItem.data.worldMode !== 'outside' &&
        !isOutdoorOnlyComponent(nodeItem.data.type)
    );
    const outdoorNodeIds = new Set(
      state.nodes
        .filter(
          (nodeItem) =>
            nodeItem.data.worldMode === 'outside' ||
            isOutdoorOnlyComponent(nodeItem.data.type)
        )
        .map((nodeItem) => nodeItem.id)
    );
    const nonOutdoorEdges = state.edges.filter(
      (edgeItem) =>
        !outdoorNodeIds.has(edgeItem.source) && !outdoorNodeIds.has(edgeItem.target)
    );

    const sunlight = Math.round((activeScenario.solarConditions.irradiance / 1000) * 100);
    const windPercent = Math.round(Math.min(100, (activeScenario.windSpeedMs / 12) * 100));

    const { nodes: newOutdoorNodes, edges: newOutdoorEdges } =
      createOutdoorPowerStationElements({
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
        ? `Pembangkit "${activeScenario.titleId}" berhasil dipasang di Zona Alam Terbuka!`
        : `Outdoor generator "${activeScenario.titleEn}" spawned in Outdoor Sandbox!`
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/75 p-0 sm:p-4 overflow-y-auto min-h-[100dvh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="renewable-modal-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl min-h-[100dvh] sm:min-h-0 h-[100dvh] sm:h-[92dvh] rounded-none sm:rounded-2xl bg-void-950 border-0 sm:border sm:border-control shadow-2xl flex flex-col overflow-hidden text-ink font-sans"
      >
        <LabModalHeader
          titleId="renewable-modal-title"
          eyebrow={isId ? 'SIMULATOR EBT · MICROGRID' : 'RENEWABLE · MICROGRID'}
          title={
            isId
              ? 'Digital Twin Energi Terbarukan & Microgrid'
              : 'Renewable Energy & Microgrid Digital Twin'
          }
          subtitle={
            isId
              ? 'Simulasi fisik interaktif fotovoltaik, aerodinamika turbin angin, elektrokimia BESS, dan keseimbangan daya microgrid.'
              : 'Interactive physics twin for solar PV, wind aerodynamics, BESS electrochemistry, and microgrid power flow.'
          }
          onClose={onClose}
          closeLabel={isId ? 'Tutup Simulasi EBT' : 'Close Renewable Lab'}
        />

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 overscroll-contain">
          {/* Scenario selector & deployment dock */}
          <section
            aria-label={isId ? 'Skenario Pembelajaran' : 'Educational Scenarios'}
            className="rounded-2xl bg-void-900 border border-control p-4 sm:p-5 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                {isId ? 'Pilih Skenario Pembelajaran' : 'Select Educational Scenario'}
              </span>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                {RENEWABLE_SCENARIOS.length} {isId ? 'Preset Iklim' : 'Climate Presets'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {RENEWABLE_SCENARIOS.map((scenario) => {
                const isSelected = scenario.id === selectedScenarioId;
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleApplyScenario(scenario)}
                    className={`min-h-[44px] text-left p-3 rounded-xl border transition-colors active:scale-[0.99] cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-electric-500/15 border-electric-500 text-ink'
                        : 'bg-void-950 border-control text-slate-300 hover:text-ink hover:border-electric-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs text-ink leading-snug">
                        {isId ? scenario.titleId : scenario.titleEn}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold shrink-0 border tabular-nums ${
                          isSelected
                            ? 'bg-electric-500/20 text-electric-300 border-electric-500/45'
                            : 'bg-void-900 text-slate-300 border-control'
                        }`}
                      >
                        {scenario.targetLoadWatts}W
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                      {isId ? scenario.summaryId : scenario.summaryEn}
                    </p>
                  </button>
                );
              })}
            </div>

            {selectedScenario && (
              <div className="pt-3 border-t border-ink/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-300 leading-relaxed min-w-0">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-electric-400 font-semibold mr-2">
                    {isId ? 'Fokus Studi:' : 'Study Focus:'}
                  </span>
                  <span>
                    {isId
                      ? selectedScenario.educationalFocusId
                      : selectedScenario.educationalFocusEn}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeployScenarioToOutdoor(selectedScenario)}
                  className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-700 text-white font-bold text-xs transition-colors active:scale-95 cursor-pointer shrink-0"
                >
                  <Trees className="w-4 h-4 text-white shrink-0" aria-hidden="true" />
                  <span>
                    {isId
                      ? 'Pasang Pembangkit di Alam Terbuka'
                      : 'Deploy to Outdoor Sandbox'}
                  </span>
                </button>
              </div>
            )}
          </section>

          {/* Microgrid Power Flow Balance Panel */}
          <MicrogridBalancePanel
            isId={isId}
            solarPoint={solarPoint}
            windPoint={windPoint}
            bessState={bessState}
            microgridBalance={microgridBalance}
            loadDemandWatts={loadDemandWatts}
          />

          {/* Solar Characteristic Curves + Environmental Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Real-time Solar P-V and I-V Curves */}
            <div className="rounded-2xl bg-void-900 border border-control p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink font-mono">
                    {isId
                      ? 'Kurva Karakteristik I-V & P-V Panel Surya'
                      : 'Solar PV I-V & P-V Curves'}
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="text-electric-400">■ {isId ? 'Arus I (A)' : 'Current I (A)'}</span>
                    <span className="text-slate-300">■ {isId ? 'Daya P (W)' : 'Power P (W)'}</span>
                  </div>
                </div>

                {/* Fixed dark SVG plot stage preserves legibility across themes */}
                <div className="h-56 w-full bg-[#0B0F14] rounded-xl border border-control p-2 relative flex items-center justify-center">
                  <svg
                    className="w-full h-full overflow-visible"
                    viewBox="0 0 320 180"
                    preserveAspectRatio="none"
                    aria-label={isId ? 'Grafik kurva I-V dan P-V panel surya' : 'Solar panel I-V and P-V curves chart'}
                  >
                    <line x1="30" y1="20" x2="300" y2="20" stroke="#334155" strokeDasharray="3,3" />
                    <line x1="30" y1="80" x2="300" y2="80" stroke="#334155" strokeDasharray="3,3" />
                    <line x1="30" y1="140" x2="300" y2="140" stroke="#334155" strokeDasharray="3,3" />
                    <line x1="120" y1="10" x2="120" y2="150" stroke="#334155" strokeDasharray="3,3" />
                    <line x1="210" y1="10" x2="210" y2="150" stroke="#334155" strokeDasharray="3,3" />

                    <line x1="30" y1="150" x2="310" y2="150" stroke="#64748B" strokeWidth="1.5" />
                    <line x1="30" y1="10" x2="30" y2="150" stroke="#64748B" strokeWidth="1.5" />

                    <text x="305" y="165" fill="#94a3b8" fontSize="9" textAnchor="end">
                      V (Volt)
                    </text>
                    <text x="25" y="12" fill="#94a3b8" fontSize="9" textAnchor="end">
                      I / P
                    </text>

                    {solarIvCurve.length > 1 && (
                      <path
                        d={solarIvCurve
                          .map((pointItem, idx) => {
                            const x =
                              30 +
                              (pointItem.voltage / Math.max(1, solarPoint.openCircuitVoltage)) *
                                270;
                            const y =
                              150 -
                              (pointItem.current / Math.max(0.1, solarPoint.shortCircuitCurrent)) *
                                130;
                            return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                          })
                          .join(' ')}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                      />
                    )}

                    {solarIvCurve.length > 1 && (
                      <path
                        d={solarIvCurve
                          .map((pointItem, idx) => {
                            const x =
                              30 +
                              (pointItem.voltage / Math.max(1, solarPoint.openCircuitVoltage)) *
                                270;
                            const maxP = Math.max(1, solarPoint.pmpp * 1.1);
                            const y = 150 - (pointItem.power / maxP) * 130;
                            return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                          })
                          .join(' ')}
                        fill="none"
                        stroke="#cbd5e1"
                        strokeWidth="2"
                        strokeDasharray="4,2"
                      />
                    )}

                    {solarPoint.openCircuitVoltage > 0 && (
                      <g>
                        <circle
                          cx={30 + (solarPoint.vmpp / solarPoint.openCircuitVoltage) * 270}
                          cy={150 - (solarPoint.pmpp / (solarPoint.pmpp * 1.1 || 1)) * 130}
                          r="5"
                          fill="#38bdf8"
                          stroke="#0f172a"
                          strokeWidth="2"
                        />
                        <text
                          x={30 + (solarPoint.vmpp / solarPoint.openCircuitVoltage) * 270}
                          y={130 - (solarPoint.pmpp / (solarPoint.pmpp * 1.1 || 1)) * 130}
                          fill="#e2e8f0"
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-center tabular-nums">
                <div className="bg-void-950 p-2.5 rounded-xl border border-control">
                  <div className="text-[10px] text-slate-400 font-mono">Vmpp</div>
                  <div className="text-xs font-mono font-bold text-ink mt-0.5">
                    {solarPoint.vmpp} V
                  </div>
                </div>
                <div className="bg-void-950 p-2.5 rounded-xl border border-control">
                  <div className="text-[10px] text-slate-400 font-mono">Impp</div>
                  <div className="text-xs font-mono font-bold text-ink mt-0.5">
                    {solarPoint.impp} A
                  </div>
                </div>
                <div className="bg-void-950 p-2.5 rounded-xl border border-control">
                  <div className="text-[10px] text-slate-400 font-mono">Fill Factor</div>
                  <div className="text-xs font-mono font-bold text-electric-400 mt-0.5">
                    {solarPoint.fillFactor}
                  </div>
                </div>
                <div className="bg-void-950 p-2.5 rounded-xl border border-control">
                  <div className="text-[10px] text-slate-400 font-mono">T_cell</div>
                  <div className="text-xs font-mono font-bold text-ink mt-0.5">
                    {solarPoint.cellTemperatureCelsius}°C
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Environmental & BESS Interactive Sliders */}
            <div className="rounded-2xl bg-void-900 border border-control p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/15 pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink font-mono">
                  {isId ? 'Parameter Lingkungan & BESS' : 'Environmental & BESS Controls'}
                </h4>
                {/* Battery Chemistry Selector */}
                <div className="flex items-center gap-1 bg-void-950 p-1 rounded-xl border border-control text-[10px] font-mono">
                  {(['lfp', 'lithium-ion', 'lead-acid'] as BatteryChemistry[]).map((chem) => (
                    <button
                      key={chem}
                      type="button"
                      aria-pressed={batteryChemistry === chem}
                      onClick={() => setBatteryChemistry(chem)}
                      className={`min-h-[44px] sm:min-h-[36px] px-2.5 py-1 rounded-lg transition-colors active:scale-95 cursor-pointer ${
                        batteryChemistry === chem
                          ? 'bg-electric-600 text-white font-bold'
                          : 'text-slate-300 hover:text-ink'
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
                  <label htmlFor={`${sliderPrefix}-irradiance`} className="text-slate-200">
                    {isId ? 'Radiasi Matahari (Irradiance)' : 'Solar Irradiance'}
                  </label>
                  <span className="font-mono text-electric-400 font-bold tabular-nums">{irradiance} W/m²</span>
                </div>
                <input
                  id={`${sliderPrefix}-irradiance`}
                  type="range"
                  min="0"
                  max="1200"
                  step="10"
                  value={irradiance}
                  onChange={(e) => setIrradiance(Number(e.target.value))}
                  className="w-full h-7 accent-electric-500 cursor-pointer"
                />
              </div>

              {/* Slider 2: Sun Altitude & Tilt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <label htmlFor={`${sliderPrefix}-elevation`} className="text-slate-200">
                      {isId ? 'Elevasi Matahari' : 'Sun Elevation'}
                    </label>
                    <span className="font-mono text-ink tabular-nums">{sunElevationDeg}°</span>
                  </div>
                  <input
                    id={`${sliderPrefix}-elevation`}
                    type="range"
                    min="0"
                    max="90"
                    value={sunElevationDeg}
                    onChange={(e) => setSunElevationDeg(Number(e.target.value))}
                    className="w-full h-7 accent-electric-500 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <label htmlFor={`${sliderPrefix}-tilt`} className="text-slate-200">
                      {isId ? 'Kemiringan Panel' : 'Panel Tilt'}
                    </label>
                    <span className="font-mono text-ink tabular-nums">{panelTiltDeg}°</span>
                  </div>
                  <input
                    id={`${sliderPrefix}-tilt`}
                    type="range"
                    min="0"
                    max="90"
                    value={panelTiltDeg}
                    onChange={(e) => setPanelTiltDeg(Number(e.target.value))}
                    className="w-full h-7 accent-electric-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Slider 3: Wind Speed */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <label htmlFor={`${sliderPrefix}-wind`} className="text-slate-200">
                    {isId ? 'Kecepatan Angin (Wind Speed)' : 'Wind Speed'}
                  </label>
                  <span className="font-mono text-electric-400 font-bold tabular-nums">{windSpeedMs} m/s</span>
                </div>
                <input
                  id={`${sliderPrefix}-wind`}
                  type="range"
                  min="0"
                  max="30"
                  step="0.5"
                  value={windSpeedMs}
                  onChange={(e) => setWindSpeedMs(Number(e.target.value))}
                  className="w-full h-7 accent-electric-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5 tabular-nums">
                  <span>0 m/s</span>
                  <span>Cut-in: 3.0</span>
                  <span>Rated: 12.0</span>
                  <span>Cut-out: 25.0</span>
                </div>
              </div>

              {/* Slider 4: Shading Factor & Ambient Temp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <label htmlFor={`${sliderPrefix}-shading`} className="text-slate-200">
                      {isId ? 'Efek Bayangan (Shading)' : 'Shading Factor'}
                    </label>
                    <span className="font-mono text-ink tabular-nums">{Math.round(shadingFactor * 100)}%</span>
                  </div>
                  <input
                    id={`${sliderPrefix}-shading`}
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={shadingFactor}
                    onChange={(e) => setShadingFactor(Number(e.target.value))}
                    className="w-full h-7 accent-electric-500 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <label htmlFor={`${sliderPrefix}-temp`} className="text-slate-200">
                      {isId ? 'Suhu Udara' : 'Ambient Temp'}
                    </label>
                    <span className="font-mono text-ink tabular-nums">{ambientTempCelsius}°C</span>
                  </div>
                  <input
                    id={`${sliderPrefix}-temp`}
                    type="range"
                    min="-10"
                    max="50"
                    value={ambientTempCelsius}
                    onChange={(e) => setAmbientTempCelsius(Number(e.target.value))}
                    className="w-full h-7 accent-electric-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Slider 5: BESS State of Charge & Load Demand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-ink/15">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <label htmlFor={`${sliderPrefix}-soc`} className="text-slate-200">BESS SoC</label>
                    <span className="font-mono text-electric-400 font-bold tabular-nums">{bessSoCPercent}%</span>
                  </div>
                  <input
                    id={`${sliderPrefix}-soc`}
                    type="range"
                    min="0"
                    max="100"
                    value={bessSoCPercent}
                    onChange={(e) => setBessSoCPercent(Number(e.target.value))}
                    className="w-full h-7 accent-electric-500 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <label htmlFor={`${sliderPrefix}-load`} className="text-slate-200">
                      {isId ? 'Beban Konsumen' : 'Load Demand'}
                    </label>
                    <span className="font-mono text-electric-400 font-bold tabular-nums">{loadDemandWatts} W</span>
                  </div>
                  <input
                    id={`${sliderPrefix}-load`}
                    type="range"
                    min="0"
                    max="500"
                    step="5"
                    value={loadDemandWatts}
                    onChange={(e) => setLoadDemandWatts(Number(e.target.value))}
                    className="w-full h-7 accent-electric-500 cursor-pointer"
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
