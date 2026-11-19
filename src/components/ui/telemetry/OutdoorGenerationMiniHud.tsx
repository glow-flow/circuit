import React from 'react';
import { Sun, Wind, Waves, BatteryCharging, ExternalLink, Zap } from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { isOutdoorOnlyComponent } from '../../../types/circuit';

/**
 * Mini Floating Telemetry HUD for Lab Mode (Nature Mode Phase 4).
 *
 * Informs learners inside the indoor laboratory of live power generation
 * occurring outside in Nature Mode:
 * - Real-time breakdown of Solar (PV), Wind, Hydro, and BESS storage.
 * - One-click jump to Nature Mode.
 *
 * Time Complexity: O(N) linear pass over circuit nodes (N <= 50).
 */
export const OutdoorGenerationMiniHud: React.FC = () => {
  const nodes = useCircuitStore((state) => state.nodes);
  const worldMode = useCircuitStore((state) => state.worldMode);
  const setWorldMode = useCircuitStore((state) => state.setWorldMode);
  const language = useCircuitStore((state) => state.language);

  if (worldMode !== 'lab') return null;

  const outdoorNodes = nodes.filter(
    (n) => n.data?.worldMode === 'outside' || isOutdoorOnlyComponent(n.data?.type)
  );
  if (outdoorNodes.length === 0) return null;

  const isId = language === 'id';

  // Compute live generation values
  let solarWatts = 0;
  let windWatts = 0;
  let hydroWatts = 0;
  let bessSoc: number | null = null;

  for (const node of outdoorNodes) {
    const type = node.data?.type;
    const power = node.data?.calculatedPower ?? 0;

    if (type === 'solar-panel' || type === 'solar_panel') {
      solarWatts += power;
    } else if (type === 'wind-turbine' || type === 'wind_turbine') {
      windWatts += power;
    } else if (type === 'hydro-turbine' || type === 'hydro_turbine') {
      hydroWatts += Math.max(power, node.data?.power ?? 0);
    } else if (type === 'bess-substation' || type === 'bess_substation') {
      bessSoc = Math.round((node.data?.socPercent ?? node.data?.currentCharge ?? 80) * 10) / 10;
    }
  }

  const totalOutdoorWatts = Math.round((solarWatts + windWatts + hydroWatts) * 10) / 10;

  return (
    <button
      type="button"
      onClick={() => setWorldMode('outside')}
      title={isId ? 'Klik untuk melihat Alam Terbuka' : 'Click to view Outdoor Sandbox'}
      className="absolute bottom-[58px] left-14 sm:bottom-3 sm:left-16 z-30 min-h-[38px] flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 rounded-full bg-void-900 border border-emerald-500/60 text-ink shadow-lg hover:bg-void-850 hover:border-emerald-500 active:scale-95 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
        <span className="text-[11px] font-bold text-emerald-400 font-mono tabular-nums flex items-center gap-1">
          <Zap className="w-3 h-3 text-emerald-400" aria-hidden="true" />
          {totalOutdoorWatts}W
        </span>
      </div>

      <div className="hidden sm:block h-3 w-px bg-ink/15" />

      {/* Mini Metric Icons */}
      <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono tabular-nums text-slate-300">
        <span className="flex items-center gap-0.5" title="Solar PV">
          <Sun className="w-3 h-3 text-amber-400" aria-hidden="true" />
          {Math.round(solarWatts)}W
        </span>
        <span className="flex items-center gap-0.5" title="Wind Turbine">
          <Wind className="w-3 h-3 text-sky-400" aria-hidden="true" />
          {Math.round(windWatts)}W
        </span>
        <span className="flex items-center gap-0.5" title="Micro-Hydro">
          <Waves className="w-3 h-3 text-cyan-400" aria-hidden="true" />
          {Math.round(hydroWatts)}W
        </span>
        {bessSoc !== null && (
          <span className="flex items-center gap-0.5" title="BESS Storage">
            <BatteryCharging className="w-3 h-3 text-emerald-400" aria-hidden="true" />
            {bessSoc}%
          </span>
        )}
      </div>

      <div className="h-3 w-px bg-ink/15" />

      <span className="text-[10px] font-semibold text-slate-300 group-hover:text-emerald-400 flex items-center gap-1">
        {isId ? 'Ke Alam' : 'To Outdoor'}
        <ExternalLink className="w-2.5 h-2.5" aria-hidden="true" />
      </span>
    </button>
  );
};
