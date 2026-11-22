import React, { useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Check,
  Download,
  HardDrive,
  Loader2,
  PlusSquare,
  RefreshCw,
  Share,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { useModalFocusTrap } from '../../../hooks/useModalKeyboardClose';
import { usePwaStatus } from '../../../hooks/usePwaStatus';
import { extractCacheVersionLabel } from '../../../utils/pwaManager';
import { LabModalHeader } from '../common/LabModalHeader';

export interface PwaOfflineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface OfflineCapabilityItem {
  id: string;
  labelId: string;
  labelEn: string;
}

export const OFFLINE_CAPABILITIES: ReadonlyArray<OfflineCapabilityItem> = [
  {
    id: 'mna-engine',
    labelId: 'Simulator rangkaian DC dan Alam EBT berjalan lokal di perangkat',
    labelEn: 'DC circuit solver and Outdoor EBT sandbox run locally on device',
  },
  {
    id: 'curriculum-tools',
    labelId: '5 Misi Praktikum, Akademi, Tutor Rumus, dan Oskiloskop tetap aktif',
    labelEn: '5 Lab Missions, Academy, Formula Tutor, and Oscilloscope stay active',
  },
  {
    id: 'local-storage',
    labelId: 'Simpan preset lokal serta ekspor/impor berkas .circuit tanpa kuota',
    labelEn: 'Local preset storage and .circuit file export/import work offline',
  },
  {
    id: 'qr-offline',
    labelId: 'Tautan bagikan dan kode QR tetap terbaca setelah aplikasi terpasang',
    labelEn: 'Share links and QR codes remain readable once the app is cached',
  },
];

function formatCheckedTime(isoString: string | null, isId: boolean): string {
  if (!isoString) return isId ? 'Belum diperiksa' : 'Not checked yet';
  try {
    return new Date(isoString).toLocaleTimeString(isId ? 'id-ID' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export const PwaOfflineModal: React.FC<PwaOfflineModalProps> = ({ isOpen, onClose }) => {
  const language = useCircuitStore((state) => state.language);
  const notify = useCircuitStore((state) => state.notify);
  const isId = language === 'id';

  const dialogRef = useRef<HTMLDivElement>(null);
  useModalFocusTrap(isOpen, dialogRef, onClose);

  const {
    isOnline,
    isStandalone,
    isIosSafari,
    canPromptInstall,
    installOutcome,
    swStatus,
    swErrorMessage,
    cacheStatus,
    cachedAssetCount,
    fontAssetCount,
    activeCacheName,
    lastCheckedAtIso,
    cacheErrorMessage,
    promptInstall,
    checkForUpdate,
    applyUpdate,
    retryRegistration,
  } = usePwaStatus();

  useEffect(() => {
    if (!isOpen) return;
    void checkForUpdate();
  }, [isOpen, checkForUpdate]);

  if (!isOpen) return null;

  const cacheVersion = extractCacheVersionLabel(activeCacheName);
  const isChecking = cacheStatus === 'checking' || swStatus === 'registering';
  const hasError = swStatus === 'error' || cacheStatus === 'error';

  const handleInstallClick = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      notify(
        isId
          ? 'Pemasangan aplikasi dimulai. Ikon akan muncul di layar utama perangkat.'
          : 'App installation started. The icon will appear on your home screen.'
      );
    } else if (outcome === 'dismissed') {
      notify(
        isId
          ? 'Pemasangan dibatalkan. Kamu bisa memasang lagi kapan saja dari menu ini.'
          : 'Installation dismissed. You can install anytime from this panel.'
      );
    }
  };

  const handleVerifyOfflineClick = async () => {
    await checkForUpdate();
  };

  const handleRetryRegistrationClick = async () => {
    await retryRegistration();
  };

  const handleApplyUpdateClick = () => {
    const triggered = applyUpdate();
    if (triggered) {
      notify(
        isId
          ? 'Menerapkan versi terbaru Circuit Sandbox...'
          : 'Applying the latest version of Circuit Sandbox...'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-scrim/75 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-offline-modal-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-2xl rounded-t-2xl sm:rounded-2xl bg-void-900 border border-control shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden text-ink font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <LabModalHeader
          titleId="pwa-offline-modal-title"
          title={isId ? 'Pasang & Mode Offline' : 'Install & Offline Mode'}
          subtitle={
            isId
              ? 'Gunakan Circuit Sandbox di kelas tanpa kuota internet'
              : 'Use Circuit Sandbox in class without an internet connection'
          }
          onClose={onClose}
          closeLabel={isId ? 'Tutup dialog mode offline' : 'Close offline mode dialog'}
        />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Plain-Language Connection & Offline Readiness Strip */}
          <section
            aria-label={isId ? 'Status koneksi dan kesiapan tanpa internet' : 'Connection and offline readiness'}
            className="rounded-xl bg-void-950 border border-control p-4 space-y-3.5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Network Status */}
              <div className="rounded-xl bg-void-900 border border-ink/15 p-3.5 space-y-1.5 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-400">
                    {isId ? 'Koneksi Internet' : 'Internet Connection'}
                  </span>
                  {isOnline ? (
                    <Wifi className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                  )}
                </div>

                <div
                  className={`text-sm font-bold ${
                    isOnline ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {isOnline
                    ? isId
                      ? 'Terhubung (Online)'
                      : 'Connected (Online)'
                    : isId
                    ? 'Sedang Tanpa Internet'
                    : 'Currently Offline'}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {isOnline
                    ? isId
                      ? 'Aplikasi otomatis menyimpan berkas agar nanti tetap bisa dibuka tanpa sinyal.'
                      : 'The app saves files automatically so you can open it later without signal.'
                    : isId
                    ? 'Kamu tetap bisa merangkai dan menyimpan praktikum seperti biasa.'
                    : 'You can keep building and saving circuits normally.'}
                </p>
              </div>

              {/* Offline Readiness (Loading / Ready / Empty / Error) */}
              <div
                className="rounded-xl bg-void-900 border border-ink/15 p-3.5 space-y-1.5 min-w-0"
                aria-live="polite"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-400">
                    {isId ? 'Kesiapan Tanpa Internet' : 'Offline Readiness'}
                  </span>
                  {isChecking ? (
                    <Loader2
                      className="w-4 h-4 text-electric-400 motion-safe:animate-spin shrink-0"
                      aria-hidden="true"
                    />
                  ) : hasError || swStatus === 'unsupported' || cacheStatus === 'unsupported' ? (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />
                  ) : cacheStatus === 'ready' ? (
                    <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                  ) : (
                    <HardDrive className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                  )}
                </div>

                {isChecking ? (
                  <>
                    <div className="text-sm font-bold text-electric-400">
                      {isId ? 'Memeriksa kesiapan...' : 'Checking readiness...'}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {isId
                        ? 'Mengecek apakah berkas aplikasi sudah tersimpan di perangkat ini.'
                        : 'Checking whether app files are saved on this device.'}
                    </p>
                  </>
                ) : hasError ? (
                  <>
                    <div className="text-sm font-bold text-red-400">
                      {isId ? 'Gagal Memeriksa' : 'Check Failed'}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed break-words">
                      {swErrorMessage ||
                        cacheErrorMessage ||
                        (isId
                          ? 'Penyimpanan offline mengalami kendala pada browser ini.'
                          : 'Offline storage encountered an error in this browser.')}
                    </p>
                  </>
                ) : swStatus === 'unsupported' || cacheStatus === 'unsupported' ? (
                  <>
                    <div className="text-sm font-bold text-amber-400">
                      {isId ? 'Browser Belum Mendukung' : 'Not Supported'}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {isId
                        ? 'Buka di Chrome, Edge, atau Safari versi terbaru untuk mode offline.'
                        : 'Open in modern Chrome, Edge, or Safari for offline support.'}
                    </p>
                  </>
                ) : cacheStatus === 'ready' ? (
                  <>
                    <div className="text-sm font-bold text-emerald-400">
                      {isId ? 'Siap Dipakai Tanpa Internet' : 'Ready for Offline Use'}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {isId
                        ? 'Semua simulasi, contoh, dan tugas praktikum sudah tersimpan di perangkat.'
                        : 'All simulations, presets, and lab tasks are saved on this device.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-mono tabular-nums text-slate-400">
                      <span>
                        {cachedAssetCount} {isId ? 'berkas tersimpan' : 'files saved'}
                        {fontAssetCount > 0 ? ` (+${fontAssetCount} font)` : ''}
                      </span>
                      {cacheVersion && <span>· {cacheVersion}</span>}
                      <span>
                        · {formatCheckedTime(lastCheckedAtIso, isId)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-bold text-amber-400">
                      {swStatus === 'dev-disabled'
                        ? isId
                          ? 'Mode Uji Lokal'
                          : 'Local Dev Mode'
                        : isId
                        ? 'Belum Tersimpan'
                        : 'Not Saved Yet'}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {swStatus === 'dev-disabled'
                        ? isId
                          ? 'Penyimpanan offline aktif otomatis pada versi publikasi web.'
                          : 'Offline caching activates automatically on production builds.'
                        : isId
                        ? 'Muat ulang halaman sekali saat ada internet agar siap dipakai offline.'
                        : 'Reload once while online so files are saved for offline use.'}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Real Action Controls */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isChecking}
                onClick={handleVerifyOfflineClick}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-void-850 hover:bg-void-800 border border-control text-ink text-xs font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors active:scale-95 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-electric-400 shrink-0 ${
                    isChecking ? 'motion-safe:animate-spin' : ''
                  }`}
                  aria-hidden="true"
                />
                <span>
                  {isChecking
                    ? isId
                      ? 'Memeriksa...'
                      : 'Checking...'
                    : isId
                    ? 'Periksa Cache Offline'
                    : 'Verify Offline Cache'}
                </span>
              </button>

              {swStatus === 'error' && (
                <button
                  type="button"
                  onClick={handleRetryRegistrationClick}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold flex items-center gap-2 transition-colors active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{isId ? 'Coba Daftar Ulang' : 'Retry Registration'}</span>
                </button>
              )}

              {swStatus === 'update-available' && (
                <button
                  type="button"
                  onClick={handleApplyUpdateClick}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold flex items-center gap-2 transition-colors active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{isId ? 'Terapkan Versi Baru' : 'Apply New Version'}</span>
                </button>
              )}
            </div>
          </section>

          {/* Install to Home Screen / Desktop Section */}
          <section
            aria-label={isId ? 'Pemasangan aplikasi di perangkat' : 'Device app installation'}
            className="rounded-xl bg-void-950 border border-control p-4 flex flex-col sm:flex-row items-start gap-4"
          >
            <div className="w-14 h-14 rounded-xl bg-void-900 border border-control flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src="/assets/logo-circuit-sandbox.png"
                alt="Circuit Sandbox"
                width={48}
                height={48}
                className="w-12 h-12 object-contain"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-2.5">
              <div>
                <h3 className="text-sm font-bold text-ink">
                  {isStandalone
                    ? isId
                      ? 'Aplikasi Sudah Terpasang di Perangkat'
                      : 'App Installed on This Device'
                    : isId
                    ? 'Pasang Circuit Sandbox ke Layar Utama'
                    : 'Install Circuit Sandbox to Home Screen'}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  {isStandalone
                    ? isId
                      ? 'Kamu sedang membuka Circuit Sandbox dalam mode aplikasi mandiri tanpa bilah alamat browser.'
                      : 'You are running Circuit Sandbox in standalone app mode without browser chrome.'
                    : isId
                    ? 'Buka simulator langsung dari layar utama HP, Chromebook, atau laptop sekolah seperti aplikasi lokal.'
                    : 'Launch the simulator directly from your phone, Chromebook, or classroom laptop home screen.'}
                </p>
              </div>

              {isStandalone ? (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-500/45 text-xs font-semibold text-emerald-400">
                  <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>
                    {isId ? 'Mode Aplikasi Mandiri Aktif' : 'Standalone App Mode Active'}
                  </span>
                </div>
              ) : canPromptInstall ? (
                <button
                  type="button"
                  disabled={installOutcome === 'prompting'}
                  onClick={handleInstallClick}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold inline-flex items-center gap-2 disabled:opacity-50 transition-colors active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>
                    {installOutcome === 'prompting'
                      ? isId
                        ? 'Menunggu Konfirmasi...'
                        : 'Waiting for Confirmation...'
                      : isId
                      ? 'Pasang ke Layar Utama'
                      : 'Install to Home Screen'}
                  </span>
                </button>
              ) : isIosSafari ? (
                <ol className="space-y-2 text-xs text-slate-300 bg-void-900 border border-ink/15 rounded-xl p-3">
                  <li className="flex items-start gap-2">
                    <Share className="w-4 h-4 text-electric-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      {isId
                        ? '1. Ketuk tombol Bagikan (Share) di bilah bawah Safari.'
                        : '1. Tap the Share button in the Safari bottom bar.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <PlusSquare className="w-4 h-4 text-electric-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      {isId
                        ? '2. Pilih Tambah ke Layar Utama (Add to Home Screen), lalu ketuk Tambah.'
                        : '2. Select Add to Home Screen, then tap Add.'}
                    </span>
                  </li>
                </ol>
              ) : (
                <p className="text-xs text-slate-400 bg-void-900 border border-ink/15 rounded-xl p-3 leading-relaxed">
                  {installOutcome === 'dismissed'
                    ? isId
                      ? 'Dialog pemasangan sebelumnya ditutup. Kamu tetap bisa memasang dari menu browser (ikon pasang di bilah alamat atau menu titik tiga > Pasang aplikasi).'
                      : 'The install prompt was previously dismissed. You can still install via the browser address bar icon or browser menu > Install app.'
                    : isId
                    ? 'Jika tombol pasang otomatis belum muncul, buka menu browser (Chrome/Edge) lalu pilih Pasang Aplikasi atau Tambah ke Layar Utama.'
                    : 'If the automatic install button is not shown yet, open your browser menu (Chrome/Edge) and select Install App or Add to Home Screen.'}
                </p>
              )}
            </div>
          </section>

          {/* Compact Offline Capability Checklist */}
          <section aria-label={isId ? 'Fitur yang bekerja tanpa internet' : 'Features available offline'}>
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              {isId ? 'SIAP DIPAKAI TANPA KUOTA' : 'AVAILABLE WITHOUT INTERNET'}
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {OFFLINE_CAPABILITIES.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-void-950 border border-ink/15 text-xs text-slate-300 leading-snug"
                >
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{isId ? item.labelId : item.labelEn}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
