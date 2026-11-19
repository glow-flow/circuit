import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BatteryCharging,
  Radio,
  Sun,
  X,
  Zap,
} from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { evaluateOutdoorGridReadiness } from '../../../physics/outdoorGridReadinessAdvisor';
import { MascotAvatar } from '../common/MascotAvatar';
import { useModalFocusTrap } from '../../../hooks/useModalKeyboardClose';
import { LabModalHeader } from '../common/LabModalHeader';

/**
 * Floating Bottom-Right Outdoor Grid Readiness Popup (`OutdoorGridReadyPopup.tsx`).
 *
 * Automatically appears inside `Alam EBT` (`worldMode === 'outside'`) whenever the student
 * has built a valid electrical circuit from active outdoor generator(s) to a SUTET tower.
 * Answers the two most common beginner questions up front:
 *   1. "Sudah pasang pembangkit & SUTET, gunanya apa?" -> Menyalurkan listrik gratis ke Lab.
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

  const flowModalRef = useRef<HTMLDivElement | null>(null);
  useModalFocusTrap(isFlowModalOpen, flowModalRef, () => setIsFlowModalOpen(false));

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
          className="absolute bottom-[128px] right-3 lg:bottom-5 lg:right-5 z-30 w-[min(90vw,312px)] pointer-events-auto"
        >
          <div className="relative rounded-2xl bg-void-900 border-2 border-emerald-500 shadow-2xl p-3 text-ink">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              aria-label={isId ? 'Tutup notifikasi pembangkit siap' : 'Dismiss power ready popup'}
              className="absolute top-2 right-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-void-950 hover:bg-void-850 text-slate-300 hover:text-ink border border-control active:scale-95 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            <div className="flex items-start gap-2.5 pr-8">
              <div className="shrink-0 -mt-1">
                <MascotAvatar mood="celebrate" size="sm" alt="Watt Celebrates" />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600 text-[9px] font-mono font-bold text-white uppercase tracking-wider">
                  <Zap className="w-2.5 h-2.5" aria-hidden="true" />
                  {advisory.popupBadge}
                </span>

                <p className="text-xs font-bold text-ink leading-snug">
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
                className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition-colors cursor-pointer shadow-sm"
              >
                <BatteryCharging className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{advisory.ctaLabel}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFlowModalOpen(true)}
                className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-void-950 hover:bg-void-850 border border-control text-ink font-semibold text-[11px] active:scale-95 transition-colors cursor-pointer shrink-0"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/75 p-3 sm:p-4 select-none"
        >
          <div
            ref={flowModalRef}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-void-900 border border-control shadow-2xl text-ink overflow-hidden"
          >
            <LabModalHeader
              titleId="outdoor-flow-modal-title"
              eyebrow={isId ? 'ALUR ENERGI ALAM KE LAB' : 'OUTDOOR TO LAB POWER FLOW'}
              title={isId ? 'Untuk Apa SUTET & Lab Terhubung?' : 'Why Connect SUTET to the Lab?'}
              onClose={() => setIsFlowModalOpen(false)}
              closeLabel={isId ? 'Tutup' : 'Close'}
            />

            <div className="p-4 space-y-3">
              {/* Visual 3-Step Chain */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-void-950 border border-amber-500/40 space-y-1">
                  <Sun className="w-5 h-5 text-amber-400 mx-auto" aria-hidden="true" />
                  <div className="text-[11px] font-bold text-ink">
                    {isId ? '1. Pembangkit' : '1. Generate'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                    {advisory.generatorLabels.join(', ') || 'PLTS'} ({advisory.busVoltageVolts}V)
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-void-950 border border-electric-500/40 space-y-1">
                  <Radio className="w-5 h-5 text-electric-400 mx-auto" aria-hidden="true" />
                  <div className="text-[11px] font-bold text-ink">
                    {isId ? '2. SUTET' : '2. SUTET Grid'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isId ? 'Kirim energi antar dunia' : 'Beams power to Lab'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-void-950 border border-emerald-500/40 space-y-1">
                  <BatteryCharging className="w-5 h-5 text-emerald-400 mx-auto" aria-hidden="true" />
                  <div className="text-[11px] font-bold text-ink">
                    {isId ? '3. Cas Lab' : '3. Charge Lab'}
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    {isId ? 'Isi ulang baterai 0%!' : 'Recharge empty cells!'}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-void-950 border border-ink/15 rounded-xl p-3">
                {isId
                  ? 'Baterai praktikum di Lab lama-lama bisa melemah hingga 0V kalau dipakai terus atau korsleting. Dengan menekan tombol di bawah, Panel Distribusi Lab otomatis menerima listrik dari alam untuk mengecas baterai tersebut!'
                  : 'Lab batteries drain over time or drop to 0V during shorts. Clicking below places a Lab Distribution Panel connected to your outdoor plant to recharge drained batteries immediately.'}
              </p>

              <button
                type="button"
                onClick={handleChannelToLab}
                className="w-full min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-colors cursor-pointer"
              >
                <BatteryCharging className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isId ? 'Pasang Stasiun Cas Baterai di Lab Sekarang' : 'Open & Charge Battery in Lab Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
