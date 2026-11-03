import React from 'react';
import { Sun, Wind, Waves, BatteryCharging, ExternalLink, Zap } from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';

/**
 * Mini Floating Telemetry HUD for Lab Mode (Nature Mode Phase 4).
 *
 * Informs learners inside the indoor laboratory of live power generation
 * occurring outside in Nature Mode:
 * - Real-time breakdown of Solar (PV), Wind, Hydro, and BESS storage.
 * - One-click jump to Nature Mode ("Ke Alam Terbuka 🌲").
 *
 * Time Complexity: O(N) linear pass over circuit nodes (N <= 50).
 */
export const OutdoorGenerationMiniHud: React.FC = () => {
  const nodes = useCircuitStore((state) => state.nodes);
  const worldMode = useCircuitStore((state) => state.worldMode);
  const setWorldMode = useCircuitStore((state) => state.setWorldMode);
  const language = useCircuitStore((state) => state.language);

  if (worldMode !== 'lab') return null;

  const outdoorNodes = nodes.filter((n) => n.data?.worldMode === 'outside');
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
      hydroWatts += power;
    } else if (type === 'bess-substation' || type === 'bess_substation') {
      bessSoc = node.data?.socPercent ?? node.data?.currentCharge ?? 80;
    }
  }

  const totalOutdoorWatts = Math.round((solarWatts + windWatts + hydroWatts) * 10) / 10;

  return (
    <div
      onClick={() => setWorldMode('outside')}
      title={isId ? 'Klik untuk melihat Alam Terbuka' : 'Click to view Outdoor Sandbox'}
      className="absolute bottom-14 left-4 z-30 flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-void-950/90 backdrop-blur-md border border-emerald-500/40 text-white shadow-[0_8px_24px_rgba(0,0,0,0.65)] hover:border-emerald-400 active:scale-95 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] font-bold text-emerald-300 font-mono flex items-center gap-1">
          <Zap className="w-3 h-3 text-emerald-400" />
          {totalOutdoorWatts}W
        </span>
      </div>

      <div className="h-3 w-px bg-white/15" />

      {/* Mini Metric Icons */}
      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
        <span className="flex items-center gap-0.5" title="Solar PV">
          <Sun className="w-3 h-3 text-amber-400" />
          {Math.round(solarWatts)}W
        </span>
        <span className="flex items-center gap-0.5" title="Wind Turbine">
          <Wind className="w-3 h-3 text-sky-400" />
          {Math.round(windWatts)}W
        </span>
        <span className="flex items-center gap-0.5" title="Micro-Hydro">
          <Waves className="w-3 h-3 text-cyan-400" />
          {Math.round(hydroWatts)}W
        </span>
        {bessSoc !== null && (
          <span className="flex items-center gap-0.5" title="BESS Storage">
            <BatteryCharging className="w-3 h-3 text-emerald-400" />
            {bessSoc}%
          </span>
        )}
      </div>

      <div className="h-3 w-px bg-white/15" />

      <span className="text-[10px] font-semibold text-slate-300 group-hover:text-emerald-300 flex items-center gap-1">
        {isId ? 'Ke Alam' : 'To Outdoor'}
        <ExternalLink className="w-2.5 h-2.5" />
      </span>
    </div>
  );
};
