import React, { useState, useEffect, useRef, useId } from 'react';
import {
  Share2,
  QrCode,
  Download,
  Upload,
  Copy,
  Check,
  CopyPlus,
  AlertCircle,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useCircuitStore } from '../../../store/useCircuitStore';
import {
  exportCircuitToFile,
  generateShareableUrl,
  validateAndParseCircuitPayload,
} from '../../../utils/workspaceManagement';
import { PresetConfirmDialog } from '../presets/PresetConfirmDialog';
import { useModalFocusTrap } from '../../../hooks/useModalKeyboardClose';
import { LabModalHeader } from '../common/LabModalHeader';

interface CircuitShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Workspace Persistence, Import/Export, and Sharing Modal.
 * Offers .circuit file export/import, URL hash encoding, QR code generation,
 * and workspace duplication with defensive overwrite guards.
 *
 * Time Complexity: O(N + E) for circuit graph serialization.
 */
export const CircuitShareModal: React.FC<CircuitShareModalProps> = ({ isOpen, onClose }) => {
  const nodes = useCircuitStore((state) => state.nodes);
  const edges = useCircuitStore((state) => state.edges);
  const worldMode = useCircuitStore((state) => state.worldMode);
  const terrainGrid = useCircuitStore((state) => state.terrainGrid);
  const language = useCircuitStore((state) => state.language);
  const saveCustomPreset = useCircuitStore((state) => state.saveCustomPreset);
  const setNodes = useCircuitStore((state) => state.setNodes);
  const notify = useCircuitStore((state) => state.notify);

  const isId = language === 'id';

  const [circuitTitle, setCircuitTitle] = useState<string>('Rangkaian Saya');
  const [authorName, setAuthorName] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [hasCopiedUrl, setHasCopiedUrl] = useState<boolean>(false);
  const [importErrorMessage, setImportErrorMessage] = useState<string | null>(null);

  // Staged payload for confirmation before replacing active workspace
  const [pendingImportPayload, setPendingImportPayload] = useState<{
    nodes: any[];
    edges: any[];
    title: string;
  } | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fieldPrefix = useId();
  const titleInputId = `${fieldPrefix}-title`;
  const authorInputId = `${fieldPrefix}-author`;
  const shareUrlInputId = `${fieldPrefix}-share-url`;

  useModalFocusTrap(isOpen && !pendingImportPayload, dialogRef, onClose);

  // Generate shareable URL and QR code whenever the modal opens or title changes
  useEffect(() => {
    if (!isOpen) return;

    const url = generateShareableUrl(circuitTitle, nodes, edges, worldMode, terrainGrid);
    setShareUrl(url);

    // Generate crisp QR code SVG/PNG Data URL with dark styling
    QRCode.toDataURL(
      url,
      {
        width: 256,
        margin: 2,
        color: {
          dark: '#030712',
          light: '#F8FAFC',
        },
        errorCorrectionLevel: 'M',
      },
      (error, dataUrl) => {
        if (!error && dataUrl) {
          setQrCodeDataUrl(dataUrl);
        } else {
          console.warn('Failed to generate QR code data URL:', error);
        }
      }
    );
  }, [isOpen, circuitTitle, nodes, edges, worldMode, terrainGrid]);

  if (!isOpen) return null;

  const handleCopyUrl = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setHasCopiedUrl(true);
        setTimeout(() => setHasCopiedUrl(false), 2500);
      }
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const handleExportFile = () => {
    exportCircuitToFile(circuitTitle, nodes, edges, worldMode, authorName);
    notify(
      isId
        ? `File .circuit "${circuitTitle}" berhasil diunduh.`
        : `Circuit file "${circuitTitle}" exported successfully.`
    );
  };

  const handleDuplicateWorkspace = () => {
    const duplicateName = `${circuitTitle} (Duplikat ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    saveCustomPreset(duplicateName);
    notify(
      isId
        ? `Workspace diduplikat ke Preset Kustom: "${duplicateName}"`
        : `Workspace cloned into Custom Preset: "${duplicateName}"`
    );
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportErrorMessage(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      const validationResult = validateAndParseCircuitPayload(content);

      if (!validationResult.isValid) {
        setImportErrorMessage(validationResult.errorMessage);
        return;
      }

      const { payload } = validationResult;
      if (nodes.length > 0) {
        setPendingImportPayload({
          nodes: payload.nodes,
          edges: payload.edges,
          title: payload.metadata.circuitTitle,
        });
      } else {
        applyImportedCircuit(payload.nodes, payload.edges, payload.metadata.circuitTitle);
      }
    };

    reader.onerror = () => {
      setImportErrorMessage(
        isId
          ? 'Gagal membaca file dari penyimpanan lokal.'
          : 'Failed to read file from local storage.'
      );
    };

    reader.readAsText(file);
    // Reset file input value so re-importing the same file triggers onChange
    event.target.value = '';
  };

  const applyImportedCircuit = (
    newNodes: any[],
    newEdges: any[],
    importedTitle: string
  ) => {
    setNodes(newNodes);
    useCircuitStore.setState({ edges: newEdges, selectedNodeId: null, selectedEdgeId: null });
    useCircuitStore.getState().runSimulation();
    notify(
      isId
        ? `Rangkaian "${importedTitle}" berhasil dimuat ke kanvas.`
        : `Circuit "${importedTitle}" loaded onto canvas successfully.`
    );
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/75 p-0 sm:p-5 overflow-y-auto min-h-[100dvh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        onClick={onClose}
      >
        <div
          ref={dialogRef}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl min-h-[100dvh] sm:min-h-0 sm:max-h-[92dvh] rounded-none sm:rounded-2xl bg-void-900 border-0 sm:border sm:border-control shadow-2xl flex flex-col overflow-hidden text-ink font-sans"
        >
          <LabModalHeader
            titleId="share-modal-title"
            eyebrow={isId ? 'BERKAS & KOLABORASI' : 'FILES & SHARING'}
            title={isId ? 'Kelola & Bagikan Rangkaian' : 'Manage & Share Circuit'}
            subtitle={
              isId
                ? 'Ekspor file .circuit, buat kode QR kelas, atau salin tautan rangkaian.'
                : 'Export .circuit files, generate classroom QR codes, or copy shareable links.'
            }
            onClose={onClose}
            closeLabel={isId ? 'Tutup Jendela Berbagi' : 'Close Share Dialog'}
          />

          {/* Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-5 overscroll-contain">
            {/* Circuit Title & Author inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor={titleInputId}
                  className="block text-[11px] font-semibold text-slate-300 mb-1"
                >
                  {isId ? 'Nama / Judul Rangkaian' : 'Circuit Blueprint Title'}
                </label>
                <input
                  id={titleInputId}
                  type="text"
                  value={circuitTitle}
                  onChange={(e) => setCircuitTitle(e.target.value)}
                  placeholder={isId ? 'Contoh: Praktikum Hukum Ohm 9A' : 'Example: Ohm Law Lab 9A'}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-void-950 border border-control text-xs text-ink placeholder-slate-400 focus:border-electric-500"
                />
              </div>

              <div>
                <label
                  htmlFor={authorInputId}
                  className="block text-[11px] font-semibold text-slate-300 mb-1"
                >
                  {isId ? 'Nama Siswa / Guru (Opsional)' : 'Author / Class (Optional)'}
                </label>
                <input
                  id={authorInputId}
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder={isId ? 'Contoh: Tim Siswa SMPN 12' : 'Example: Grade 9 Team'}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-void-950 border border-control text-xs text-ink placeholder-slate-400 focus:border-electric-500"
                />
              </div>
            </div>

            {/* QR Code & Share Link Section */}
            <div className="p-4 rounded-2xl bg-void-950 border border-control flex flex-col sm:flex-row items-center gap-5">
              {/* Fixed white quiet-zone plate ensures scannable QR contrast across dark/light themes */}
              <div className="shrink-0 p-2.5 rounded-2xl bg-pure-white border border-control shadow-md flex flex-col items-center justify-center">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    width={144}
                    height={144}
                    alt={isId ? 'Kode QR Rangkaian' : 'Circuit QR Code'}
                    className="w-36 h-36 rounded-lg object-contain"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-pure-slate">
                    <QrCode className="w-12 h-12" aria-hidden="true" />
                  </div>
                )}
                <span className="text-[10px] text-pure-slate font-mono font-bold mt-1 text-center">
                  {isId ? 'Pindai dengan Kamera HP' : 'Scan with Smartphone'}
                </span>
              </div>

              {/* URL & Quick Copy */}
              <div className="flex-1 min-w-0 space-y-2.5 w-full">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-electric-400 shrink-0" aria-hidden="true" />
                  <h3 className="text-xs font-bold text-ink">
                    {isId ? 'Tautan Langsung Rangkaian' : 'Direct Shareable Link'}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {isId
                    ? 'Tautan ini memuat posisi komponen, nilai tegangan, dan kabel secara utuh tanpa server backend.'
                    : 'This URL stores your circuit topology, wire connections, and component values offline without a backend server.'}
                </p>

                <div className="flex items-center gap-2">
                  <label htmlFor={shareUrlInputId} className="sr-only">
                    {isId ? 'Tautan Langsung Rangkaian' : 'Direct Shareable Link'}
                  </label>
                  <input
                    id={shareUrlInputId}
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 min-w-0 min-h-[44px] px-3 py-2 rounded-xl bg-void-900 border border-control text-[11px] font-mono text-ink truncate select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer shrink-0 ${
                      hasCopiedUrl
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-electric-600 hover:bg-electric-700'
                    }`}
                  >
                    {hasCopiedUrl ? (
                      <Check className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Copy className="w-4 h-4" aria-hidden="true" />
                    )}
                    <span>{hasCopiedUrl ? (isId ? 'Tersalin!' : 'Copied!') : isId ? 'Salin' : 'Copy'}</span>
                  </button>
                </div>
                <span role="status" aria-live="polite" className="sr-only">
                  {hasCopiedUrl ? (isId ? 'Tautan rangkaian tersalin.' : 'Circuit link copied.') : ''}
                </span>
              </div>
            </div>

            {/* File Operations (Export / Import / Duplicate) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={handleExportFile}
                className="min-h-[44px] p-3.5 rounded-xl bg-void-950 hover:bg-void-850 border border-control hover:border-electric-500/60 text-left transition-colors active:scale-95 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-electric-500/15 border border-electric-500/35 text-electric-400 flex items-center justify-center mb-2">
                  <Download className="w-4 h-4" aria-hidden="true" />
                </div>
                <h4 className="text-xs font-bold text-ink">
                  {isId ? 'Unduh File .circuit' : 'Download .circuit'}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isId ? 'Simpan file offline ke laptop' : 'Save offline file to disk'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[44px] p-3.5 rounded-xl bg-void-950 hover:bg-void-850 border border-control hover:border-emerald-500/60 text-left transition-colors active:scale-95 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 flex items-center justify-center mb-2">
                  <Upload className="w-4 h-4" aria-hidden="true" />
                </div>
                <h4 className="text-xs font-bold text-ink">
                  {isId ? 'Buka File .circuit' : 'Import .circuit'}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isId ? 'Buka file praktikum teman' : 'Load from saved file'}
                </p>
              </button>

              <button
                type="button"
                onClick={handleDuplicateWorkspace}
                className="min-h-[44px] p-3.5 rounded-xl bg-void-950 hover:bg-void-850 border border-control hover:border-amber-500/60 text-left transition-colors active:scale-95 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/35 text-amber-400 flex items-center justify-center mb-2">
                  <CopyPlus className="w-4 h-4" aria-hidden="true" />
                </div>
                <h4 className="text-xs font-bold text-ink">
                  {isId ? 'Duplikat Workspace' : 'Clone Workspace'}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isId ? 'Salin ke Preset Kustom' : 'Save copy to Presets'}
                </p>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".circuit,application/json,.json"
              onChange={handleFileInputChange}
              aria-label={isId ? 'Pilih file .circuit' : 'Choose .circuit file'}
              className="hidden"
            />

            {importErrorMessage && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-danger-500/15 border border-danger-500/45 text-danger-300 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{importErrorMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation dialog before overwriting active work with imported file */}
      <PresetConfirmDialog
        isOpen={Boolean(pendingImportPayload)}
        onClose={() => setPendingImportPayload(null)}
        onConfirm={() => {
          if (pendingImportPayload) {
            applyImportedCircuit(
              pendingImportPayload.nodes,
              pendingImportPayload.edges,
              pendingImportPayload.title
            );
            setPendingImportPayload(null);
          }
        }}
        targetPresetTitle={pendingImportPayload?.title ?? 'File Diimpor'}
        componentCount={nodes.length}
        wireCount={edges.length}
        isIndonesian={isId}
      />
    </>
  );
};
