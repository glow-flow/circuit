import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';

interface InspectorOverviewTabProps {
  componentData: CircuitElementData;
  nodeId: string;
}

/**
 * Inspector Tab 1: Overview
 * Displays component identity, physical operating status, fault diagnosis, and pin connections.
 *
 * Time Complexity: O(E) where E is edge count to inspect pin connections.
 */
export const InspectorOverviewTab: React.FC<InspectorOverviewTabProps> = ({
  componentData,
  nodeId,
}) => {
  const edges = useCircuitStore((state) => state.edges);
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);

  const isId = language === 'id';

  const isShort =
    componentData.isShortCircuit || simulation.shortCircuitBranches.includes(nodeId);
  const isBlown = Boolean(componentData.isBlown);
  const isReverseBiased = Boolean(
    componentData.isReverseBiased ||
      (simulation.reverseBiasedBranches ?? []).includes(nodeId)
  );
  const isMcbTripped = Boolean(componentData.isMcbTripped);

  // Derive pin connection status
  const connectedEdges = edges.filter(
    (e) => !e.data?.isSnapWire && (e.source === nodeId || e.target === nodeId)
  );

  return (
    <div className="p-4 space-y-4 text-xs font-sans">
      {/* Operating Status Card */}
      <div
        className={`p-3.5 rounded-2xl border ${
          isShort
            ? 'bg-red-500/10 border-red-500/30'
            : isBlown
            ? 'bg-amber-500/10 border-amber-500/30'
            : isReverseBiased
            ? 'bg-sky-500/10 border-sky-500/30'
            : isMcbTripped
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-void-950 border-white/5'
        }`}
      >
        <div className="flex items-center gap-2 mb-1.5">
          {isShort || isBlown || isReverseBiased || isMcbTripped ? (
            <AlertTriangle
              className={`w-4 h-4 ${
                isShort || isMcbTripped
                  ? 'text-red-400'
                  : isBlown
                  ? 'text-amber-400'
                  : 'text-sky-400'
              }`}
            />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          )}
          <span className="font-bold text-slate-100 text-xs sm:text-sm">
            {isShort
              ? isId
                ? 'Peringatan Bahaya Korsleting'
                : 'Short-Circuit Hazard Warning'
              : isBlown
              ? isId
                ? 'Filamen Bohlam Putus (Burnout)'
                : 'Bulb Filament Blown (Burnout)'
              : isReverseBiased
              ? isId
                ? 'Dioda LED Terbalik (Reverse Biased)'
                : 'Reverse-Biased LED Polarity'
              : isMcbTripped
              ? isId
                ? 'Saklar MCB Trip Otomatis'
                : 'Automatic MCB Breaker Tripped'
              : isId
              ? 'Status Operasional Normal'
              : 'Normal Operating Condition'}
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          {isShort
            ? isId
              ? 'Komponen ini berada pada jalur hubung singkat tanpa hambatan. Arus melonjak drastis melebihi ambang batas toleransi.'
              : 'This component is in a zero-resistance short-circuit path. Fault current dramatically exceeds safety thresholds.'
            : isBlown
            ? isId
              ? 'Daya listrik yang diserap melebihi batas kapasitas maksimal bohlam. Filamen putus dan sirkuit menjadi terbuka.'
              : 'Absorbed electrical power exceeded the maximum rated wattage. The filament has melted open.'
            : isReverseBiased
            ? isId
              ? 'Dioda semikonduktor LED hanya menghantarkan arus satu arah. Kutub Anoda terhubung ke tegangan lebih rendah sehingga memblokir arus.'
              : 'Semiconductor diode only conducts forward. Anode is wired to a lower potential than Cathode, blocking current.'
            : isMcbTripped
            ? isId
              ? 'Pengaman MCB mendeteksi lonjakan arus berbahaya dan memutus aliran secara otomatis sesuai standar PUIL 2011.'
              : 'MCB detected an overcurrent fault and safely tripped to protect laboratory equipment according to PUIL 2011.'
            : isId
            ? 'Komponen terhubung baik dan beroperasi dalam batas tegangan, arus, dan daya nominal yang aman.'
            : 'Component is safely operating within normal voltage, current, and rated power boundaries.'}
        </p>
      </div>

      {/* Component Identity Details */}
      <div className="p-3 rounded-xl bg-void-950 border border-white/5 space-y-2 font-mono text-xs">
        <div className="text-[10px] text-slate-400 font-sans uppercase tracking-wider font-semibold">
          {isId ? 'Identitas Komponen' : 'Component Identity'}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-sans text-[11px]">{isId ? 'Nama Label' : 'Label'}</span>
          <span className="text-slate-200 font-bold">{componentData.label}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-sans text-[11px]">{isId ? 'Tipe Model' : 'Type'}</span>
          <span className="text-electric-400 uppercase">{componentData.type}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-sans text-[11px]">ID Node</span>
          <span className="text-slate-400 text-[10px]">{nodeId}</span>
        </div>
      </div>

      {/* Pin Connection Status */}
      <div className="p-3 rounded-xl bg-void-950 border border-white/5 space-y-2">
        <div className="text-[10px] text-slate-400 font-sans uppercase tracking-wider font-semibold">
          {isId ? 'Koneksi Terminal Kawat Kabel' : 'Terminal Connections'}
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">{isId ? 'Jumlah Kabel Terhubung:' : 'Connected Wires:'}</span>
          <span className="font-mono text-slate-200 font-bold">{connectedEdges.length}</span>
        </div>
        <div className="pt-1 space-y-1">
          {connectedEdges.length === 0 ? (
            <p className="text-[11px] text-slate-500 italic">
              {isId ? 'Belum ada kabel yang terhubung.' : 'No wires currently attached.'}
            </p>
          ) : (
            connectedEdges.map((edge) => (
              <div
                key={edge.id}
                className="flex items-center gap-2 p-1.5 rounded-lg bg-void-900 border border-white/5 font-mono text-[10px] text-slate-300"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">
                  {edge.source === nodeId
                    ? `Pin ${edge.sourceHandle ?? 'p1'} → Node ${edge.target}`
                    : `Node ${edge.source} → Pin ${edge.targetHandle ?? 'p2'}`}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
