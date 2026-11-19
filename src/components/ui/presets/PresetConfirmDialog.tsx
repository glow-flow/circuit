import React, { useRef } from 'react';
import { AlertTriangle, Check, Lightbulb, X } from 'lucide-react';
import { useModalFocusTrap } from '../../../hooks/useModalKeyboardClose';

interface PresetConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetPresetTitle: string;
  componentCount: number;
  wireCount: number;
  isIndonesian: boolean;
}

/**
 * Defensive confirmation modal preventing accidental data loss when loading presets.
 * Time Complexity: O(1)
 */
export const PresetConfirmDialog: React.FC<PresetConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  targetPresetTitle,
  componentCount,
  wireCount,
  isIndonesian,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalFocusTrap(isOpen, dialogRef, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/75 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="preset-confirm-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl bg-void-900 border border-control shadow-2xl overflow-hidden text-ink"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 border-b border-ink/15 flex items-center justify-between bg-void-950">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-void-900 border border-amber-500/45 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 id="preset-confirm-title" className="text-sm font-bold text-ink truncate">
              {isIndonesian ? 'Ganti Rangkaian Kanvas?' : 'Replace Canvas Circuit?'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-void-900 hover:bg-void-850 text-slate-300 hover:text-ink border border-control flex items-center justify-center active:scale-95 transition-colors cursor-pointer shrink-0"
            aria-label={isIndonesian ? 'Tutup dialog konfirmasi' : 'Close confirmation'}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            {isIndonesian ? (
              <>
                Kanvas saat ini memiliki <strong className="text-electric-400 font-mono tabular-nums">{componentCount} komponen</strong> dan{' '}
                <strong className="text-electric-400 font-mono tabular-nums">{wireCount} kabel</strong>. Memuat{' '}
                <span className="text-amber-400 font-semibold">"{targetPresetTitle}"</span> akan menimpa rangkaian aktif di layar.
              </>
            ) : (
              <>
                Your current canvas contains <strong className="text-electric-400 font-mono tabular-nums">{componentCount} components</strong> and{' '}
                <strong className="text-electric-400 font-mono tabular-nums">{wireCount} wires</strong>. Loading{' '}
                <span className="text-amber-400 font-semibold">"{targetPresetTitle}"</span> will replace active work on canvas.
              </>
            )}
          </p>

          <div className="p-3 rounded-xl bg-void-950 border border-ink/15 text-xs text-slate-400 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              {isIndonesian
                ? 'Tip: Simpan rangkaian saat ini dengan tombol Simpan jika ingin membukanya kembali nanti.'
                : 'Tip: Save your current circuit using the Save button if you wish to revisit it later.'}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold bg-void-950 hover:bg-void-850 text-ink border border-control active:scale-95 transition-colors cursor-pointer"
            >
              {isIndonesian ? 'Batal' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="min-h-[44px] px-5 py-2 rounded-xl text-xs font-bold bg-[#B45309] hover:bg-[#92400E] text-white shadow-sm border border-[#92400E] flex items-center gap-2 active:scale-95 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              <span>{isIndonesian ? 'Lanjutkan & Ganti' : 'Proceed & Replace'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
