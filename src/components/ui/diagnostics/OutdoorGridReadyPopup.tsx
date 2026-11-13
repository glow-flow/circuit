import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BatteryCharging,
  Radio,
  Sun,
  X,
  Zap,
} from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { evaluateOutdoorGridReadiness } from '../../../physics/outdoorGridReadinessAdvisor';
import { MascotAvatar } from '../common/MascotAvatar';
import { useModalKeyboardClose } from '../../../hooks/useModalKeyboardClose';

/**
 * Floating Bottom-Right Outdoor Grid Readiness Popup (`OutdoorGridReadyPopup.tsx`).
 *
 * Automatically appears inside `Alam EBT` (`worldMode === 'outside'`) whenever the student
 * has built a valid electrical circuit from active outdoor generator(s) to a SUTET tower.
 * Answers the two most common beginner questions up front:
 *   1. "Sudah pasang pembangkit & SUTET — gunanya apa?" -> Menyalurkan listrik gratis ke Lab.
 *   2. "Disalurkan ke Lab buat apa?" -> Untuk mengecas baterai Lab yang dayanya habis / berkurang!
 *
 * Includes a 1-click CTA (`deployOutdoorChargingStationInLab`) that moves to Lab Mode
 * and spawns a ready `Panel Distribusi + Baterai 9V 15%` charging station safely alongside
 * any existing student circuit.
 *
 * Time Complexity: O(N + E) evaluation via `evaluateOutdoorGridReadiness`.
 */
export const OutdoorGridReadyPopup: React.FC = () => {
  const nodes = useCircuitStore((state) => state.nodes);
  const edges = useCircuitStore((state) => state.edges);
  const worldMode = useCircuitStore((state) => state.worldMode);
  const language = useCircuitStore((state) => state.language);
  const deployOutdoorChargingStationInLab = useCircuitStore(
    (state) => state.deployOutdoorChargingStationInLab
  );

  const isId = language === 'id';

  const advisory = useMemo(
    () => evaluateOutdoorGridReadiness(nodes, edges, worldMode, language),
    [nodes, edges, worldMode, language]
  );

  const [isDismissed, setIsDismissed] = useState(false);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);

  useModalKeyboardClose(isFlowModalOpen, () => setIsFlowModalOpen(false));

  // Re-arm popup cleanly if the outdoor circuit breaks and becomes valid again
  useEffect(() => {
    if (!advisory.isReadyToSupplyLab) {
      setIsDismissed(false);
    }
  }, [advisory.isReadyToSupplyLab]);

  if (!advisory.isReadyToSupplyLab) {
    return null;
  }

  const handleChannelToLab = () => {
    setIsFlowModalOpen(false);
    deployOutdoorChargingStationInLab();
  };

  return (
    <>
      {!isDismissed && (
        <div
          id="outdoor-grid-ready-popup"
          role="status"
          aria-live="polite"
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-[128px] right-3 lg:bottom-5 lg:right-5 z-30 w-[min(90vw,312px)] pointer-events-auto animate-fade-in"
        >
          <div className="relative rounded-2xl bg-void-950/95 backdrop-blur-xl border border-emerald-500/55 shadow-[0_14px_34px_rgba(16,185,129,0.28)] p-3 text-slate-100">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              aria-label={isId ? 'Tutup notifikasi pembangkit siap' : 'Dismiss power ready popup'}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-void-900 hover:bg-void-800 text-slate-400 hover:text-white border border-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-start gap-2.5 pr-6">
              <div className="shrink-0 -mt-1">
                <MascotAvatar mood="celebrate" size="sm" alt="Watt Celebrates" />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-[9px] font-mono font-bold text-emerald-300 uppercase tracking-wider">
                  <Zap className="w-2.5 h-2.5" />
                  {advisory.popupBadge}
                </span>

                <p className="text-xs font-bold text-white leading-snug">
                  {advisory.popupTitle}
                </p>

                <p className="text-[11px] text-slate-300 leading-snug">
                  {advisory.popupSubtitle}
                </p>
              </div>
            </div>

            {/* Action Row */}
            <div className="mt-2.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleChannelToLab}
                className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-void-950 font-bold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <BatteryCharging className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{advisory.ctaLabel}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFlowModalOpen(true)}
                className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 text-slate-300 hover:text-white font-semibold text-[11px] active:scale-95 transition-all cursor-pointer shrink-0"
              >
                {isId ? 'Alur?' : 'How?'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visual 3-Step Flow Explainer Modal */}
      {isFlowModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="outdoor-flow-modal-title"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setIsFlowModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-void-900 border border-emerald-500/40 shadow-2xl text-slate-100 overflow-hidden"
          >
            <div className="px-4 py-3.5 bg-void-950 border-b border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <MascotAvatar mood="proud" size="xs" alt="Watt Guide" />
                <div className="min-w-0">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                    {isId ? 'ALUR ENERGI ALAM → LAB' : 'OUTDOOR → LAB POWER FLOW'}
                  </div>
                  <h3 id="outdoor-flow-modal-title" className="text-sm font-bold text-white truncate">
                    {isId ? 'Untuk Apa SUTET & Lab Terhubung?' : 'Why Connect SUTET to the Lab?'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFlowModalOpen(false)}
                aria-label={isId ? 'Tutup' : 'Close'}
                className="min-w-[38px] min-h-[38px] rounded-xl bg-void-900 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center active:scale-95 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Visual 3-Step Chain */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-void-950 border border-amber-500/25 space-y-1">
                  <Sun className="w-5 h-5 text-amber-400 mx-auto" />
                  <div className="text-[11px] font-bold text-white">
                    {isId ? '1. Pembangkit' : '1. Generate'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {advisory.generatorLabels.join(', ') || 'PLTS'} ({advisory.busVoltageVolts}V)
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-void-950 border border-electric-500/25 space-y-1">
                  <Radio className="w-5 h-5 text-electric-400 mx-auto" />
                  <div className="text-[11px] font-bold text-white">
                    {isId ? '2. SUTET' : '2. SUTET Grid'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isId ? 'Kirim energi antar dunia' : 'Beams power to Lab'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-void-950 border border-emerald-500/35 space-y-1">
                  <BatteryCharging className="w-5 h-5 text-emerald-400 mx-auto" />
                  <div className="text-[11px] font-bold text-white">
                    {isId ? '3. Cas Lab' : '3. Charge Lab'}
                  </div>
                  <div className="text-[10px] text-emerald-300">
                    {isId ? 'Isi ulang baterai 0%!' : 'Recharge empty cells!'}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-void-950/75 border border-white/10 rounded-xl p-3">
                {isId
                  ? 'Baterai praktikum di Lab lama-lama bisa melemah hingga 0V kalau dipakai terus atau korsleting. Dengan menekan tombol di bawah, Panel Distribusi Lab otomatis menerima listrik dari alam untuk mengecas baterai tersebut!'
                  : 'Lab batteries drain over time or drop to 0V during shorts. Clicking below places a Lab Distribution Panel connected to your outdoor plant to recharge drained batteries immediately.'}
              </p>

              <button
                type="button"
                onClick={handleChannelToLab}
                className="w-full min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-void-950 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <BatteryCharging className="w-4 h-4" />
                <span>{isId ? 'Pasang Stasiun Cas Baterai di Lab Sekarang' : 'Open & Charge Battery in Lab Now'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
