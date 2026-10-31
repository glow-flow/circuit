import React from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
      role="alertdialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl bg-void-900 border border-white/15 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-void-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-100">
              {isIndonesian ? 'Ganti Rangkaian Kanvas?' : 'Replace Canvas Circuit?'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-void-850 text-slate-400 hover:text-white border border-white/10 active:scale-95"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            {isIndonesian ? (
              <>
                Kanvas saat ini memiliki <strong className="text-electric-400 font-mono">{componentCount} komponen</strong> dan{' '}
                <strong className="text-electric-400 font-mono">{wireCount} kabel</strong>. Memuat{' '}
                <span className="text-amber-400 font-semibold">"{targetPresetTitle}"</span> akan menimpa rangkaian aktif di layar.
              </>
            ) : (
              <>
                Your current canvas contains <strong className="text-electric-400 font-mono">{componentCount} components</strong> and{' '}
                <strong className="text-electric-400 font-mono">{wireCount} wires</strong>. Loading{' '}
                <span className="text-amber-400 font-semibold">"{targetPresetTitle}"</span> will replace active work on canvas.
              </>
            )}
          </p>

          <div className="p-3 rounded-xl bg-void-950 border border-white/10 text-[11px] text-slate-400 flex items-center gap-2">
            <span className="text-amber-400">💡</span>
            <span>
              {isIndonesian
                ? 'Tip: Simpan rangkaian saat ini dengan tombol Simpan Preset jika ingin membukanya kembali nanti.'
                : 'Tip: Save your current circuit using the Save Preset button if you wish to revisit it later.'}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold bg-void-850 hover:bg-white/5 text-slate-300 border border-white/10 active:scale-95 transition-all cursor-pointer"
            >
              {isIndonesian ? 'Batal' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="min-h-[44px] px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg border border-amber-400/50 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isIndonesian ? 'Lanjutkan & Ganti' : 'Proceed & Replace'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
