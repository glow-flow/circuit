import React from 'react';
import { RefreshCw, WifiOff, X } from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { usePwaStatus } from '../../../hooks/usePwaStatus';

/**
 * Slim app-shell banner rendered below the header strictly when offline or a new SW version is waiting.
 */
export const OfflineStatusBanner: React.FC = () => {
  const language = useCircuitStore((state) => state.language);
  const setActiveModal = useCircuitStore((state) => state.setActiveModal);
  const isId = language === 'id';

  const {
    isOnline,
    swStatus,
    isUpdateBannerDismissed,
    applyUpdate,
    dismissUpdateBanner,
  } = usePwaStatus();

  const showUpdateBanner = swStatus === 'update-available' && !isUpdateBannerDismissed;
  const showOfflineBanner = !isOnline;

  if (!showUpdateBanner && !showOfflineBanner) {
    return null;
  }

  if (showUpdateBanner) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="w-full shrink-0 bg-void-850 border-b border-electric-500/50 px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2 text-xs text-ink z-20"
      >
        <div className="flex items-center gap-2 min-w-0">
          <RefreshCw className="w-3.5 h-3.5 text-electric-400 shrink-0" aria-hidden="true" />
          <span className="truncate font-medium">
            {isId
              ? 'Versi baru Circuit Sandbox siap dipasang.'
              : 'A new version of Circuit Sandbox is ready.'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => applyUpdate()}
            className="min-h-[44px] lg:min-h-[36px] px-3 py-1 rounded-lg bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold transition-colors active:scale-95 cursor-pointer whitespace-nowrap"
          >
            {isId ? 'Perbarui' : 'Update'}
          </button>
          <button
            type="button"
            onClick={dismissUpdateBanner}
            aria-label={isId ? 'Tutup pemberitahuan pembaruan' : 'Dismiss update notice'}
            className="min-w-[44px] min-h-[44px] lg:min-w-[36px] lg:min-h-[36px] rounded-lg bg-void-900 hover:bg-void-800 border border-control text-slate-300 hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full shrink-0 bg-void-850 border-b border-amber-500/50 px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2 text-xs text-ink z-20"
    >
      <div className="flex items-center gap-2 min-w-0">
        <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
        <span className="truncate font-medium sm:hidden">
          {isId ? 'Mode Offline aktif' : 'Offline Mode active'}
        </span>
        <span className="hidden sm:inline truncate font-medium">
          {isId
            ? 'Mode Offline aktif. Simulasi dan penyimpanan lokal tetap berjalan.'
            : 'Offline Mode active. Simulation and local saves keep working.'}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setActiveModal('pwa')}
        className="min-h-[44px] lg:min-h-[36px] px-3 py-1 rounded-lg bg-void-900 hover:bg-void-800 border border-control text-ink text-xs font-semibold transition-colors active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
      >
        {isId ? 'Status Offline' : 'Offline Status'}
      </button>
    </div>
  );
};
