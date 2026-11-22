import React, { useRef } from 'react';
import {
  BookmarkPlus,
  Check,
  Download,
  Globe,
  GraduationCap,
  Moon,
  Share2,
  Sun,
  UserCheck,
} from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { useModalFocusTrap } from '../../../hooks/useModalKeyboardClose';
import { usePwaStatus } from '../../../hooks/usePwaStatus';
import { LabModalHeader } from '../common/LabModalHeader';

export interface MobileHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Callback to open the Save Custom Circuit modal. */
  onOpenSavePresetModal?: () => void;
  /** Callback to open the Interactive Teacher & Student Guide modal. */
  onOpenWelcomeGuide?: () => void;
}

/**
 * Compact 1-screen Menu & Settings sheet (< 1024px).
 * Eliminates duplicate shortcuts and keeps only tools not already on the main canvas bar.
 */
export const MobileHubModal: React.FC<MobileHubModalProps> = ({
  isOpen,
  onClose,
  onOpenSavePresetModal,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useModalFocusTrap(isOpen, modalRef, onClose);

  const language = useCircuitStore((state) => state.language);
  const setLanguage = useCircuitStore((state) => state.setLanguage);
  const theme = useCircuitStore((state) => state.theme);
  const toggleTheme = useCircuitStore((state) => state.toggleTheme);
  const worldMode = useCircuitStore((state) => state.worldMode);
  const setActiveModal = useCircuitStore((state) => state.setActiveModal);
  const openLkpdModal = useCircuitStore((state) => state.openLkpdModal);
  const notify = useCircuitStore((state) => state.notify);

  const { isStandalone, canPromptInstall, promptInstall } = usePwaStatus();
  const isId = language === 'id';

  if (!isOpen) return null;

  const handleOpenModal = (modalType: 'academy' | 'renewable' | 'share' | 'pwa') => {
    onClose();
    setActiveModal(modalType);
  };

  const handleOpenTeacherMode = () => {
    onClose();
    openLkpdModal({ tab: 'packets' });
  };

  const handleOpenSaveModal = () => {
    onClose();
    onOpenSavePresetModal?.();
  };

  const handleInstallAction = async () => {
    if (canPromptInstall) {
      const outcome = await promptInstall();
      if (outcome === 'accepted') {
        onClose();
        notify(
          isId
            ? 'Pemasangan aplikasi dimulai di layar utama HP.'
            : 'App installation started.'
        );
      }
      return;
    }
    handleOpenModal('pwa');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-scrim/75 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-hub-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-void-950 border border-control shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden text-ink font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <LabModalHeader
          titleId="mobile-hub-title"
          title={isId ? 'Menu & Pengaturan' : 'Menu & Settings'}
          onClose={onClose}
          closeLabel={isId ? 'Tutup menu' : 'Close menu'}
        />

        <div className="p-4 space-y-3 overflow-y-auto">
          {/* Primary Classroom & Learning Shortcuts */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleOpenModal('academy')}
              className="flex items-center gap-2.5 p-3 min-h-[56px] rounded-xl bg-void-900 hover:bg-void-850 border border-emerald-500/45 text-left transition-colors active:scale-95 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-ink truncate">
                  {isId ? 'Akademi' : 'Academy'}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {isId ? 'Materi & Kuis' : 'Lessons & Quiz'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleOpenTeacherMode}
              className="flex items-center gap-2.5 p-3 min-h-[56px] rounded-xl bg-void-900 hover:bg-void-850 border border-amber-500/45 text-left transition-colors active:scale-95 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-ink truncate">
                  {isId ? 'Mode Guru' : 'Teacher Mode'}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {isId ? 'LKPD & Rekap CSV' : 'LKPD & CSV Grades'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleOpenSaveModal}
              className="flex items-center gap-2.5 p-3 min-h-[56px] rounded-xl bg-void-900 hover:bg-void-850 border border-control text-left transition-colors active:scale-95 cursor-pointer"
            >
              <BookmarkPlus className="w-4 h-4 text-electric-400 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-ink truncate">
                  {isId ? 'Simpan' : 'Save'}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {isId ? 'Simpan rangkaian' : 'Save circuit'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleOpenModal('share')}
              className="flex items-center gap-2.5 p-3 min-h-[56px] rounded-xl bg-void-900 hover:bg-void-850 border border-control text-left transition-colors active:scale-95 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-electric-400 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-ink truncate">
                  {isId ? 'Bagikan' : 'Share'}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {isId ? 'Link, QR & file' : 'Link, QR & file'}
                </div>
              </div>
            </button>
          </div>

          {/* Contextual Outdoor Microgrid Panel (Only visible in Outdoor EBT mode) */}
          {worldMode === 'outside' && (
            <button
              type="button"
              onClick={() => handleOpenModal('renewable')}
              className="w-full flex items-center justify-between gap-3 p-3 min-h-[52px] rounded-xl bg-void-900 hover:bg-void-850 border border-emerald-500/45 text-left transition-colors active:scale-95 cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Sun className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-ink truncate">
                    {isId ? 'Panel Microgrid Alam EBT' : 'Renewable Microgrid Panel'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {isId ? 'Keseimbangan PLTS, angin & baterai' : 'Solar, wind & BESS balance'}
                  </div>
                </div>
              </div>
            </button>
          )}

          {/* Compact Display Settings Row */}
          <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-ink/10">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 rounded-xl bg-void-900 hover:bg-void-850 border border-control text-xs font-semibold text-ink transition-colors active:scale-95 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-electric-400 shrink-0" aria-hidden="true" />
              )}
              <span>
                {theme === 'dark'
                  ? isId
                    ? 'Mode Terang'
                    : 'Light Mode'
                  : isId
                  ? 'Mode Gelap'
                  : 'Dark Mode'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
              className="flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 rounded-xl bg-void-900 hover:bg-void-850 border border-control text-xs font-semibold text-ink transition-colors active:scale-95 cursor-pointer"
            >
              <Globe className="w-4 h-4 text-electric-400 shrink-0" aria-hidden="true" />
              <span>{isId ? 'Bahasa: ID' : 'Language: EN'}</span>
            </button>
          </div>

          {/* Simple Install / Offline Row (Plain Human Language) */}
          {isStandalone ? (
            <div className="flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 rounded-xl bg-void-900 border border-emerald-500/40 text-xs font-semibold text-emerald-400">
              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {isId ? 'Aplikasi Terpasang (Bisa Tanpa Internet)' : 'App Installed (Works Offline)'}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleInstallAction}
              className={`w-full flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-colors active:scale-95 cursor-pointer ${
                canPromptInstall
                  ? 'bg-electric-600 hover:bg-electric-500 text-white'
                  : 'bg-void-900 hover:bg-void-850 border border-control text-ink'
              }`}
            >
              <Download
                className={`w-4 h-4 shrink-0 ${canPromptInstall ? 'text-white' : 'text-electric-400'}`}
                aria-hidden="true"
              />
              <span>
                {canPromptInstall
                  ? isId
                    ? 'Pasang Aplikasi ke Layar Utama'
                    : 'Install App to Home Screen'
                  : isId
                  ? 'Pasang & Mode Offline'
                  : 'Install & Offline Mode'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
