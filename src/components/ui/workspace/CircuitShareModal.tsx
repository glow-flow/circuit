import React, { useState, useEffect, useRef } from 'react';
import {
  Share2,
  QrCode,
  Download,
  Upload,
  Copy,
  Check,
  X,
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

  const fileInputRef = useRef<HTMLInputElement>(null);

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
          dark: '#030712', // void-950 dark modules
          light: '#F8FAFC', // clean white quiet zone
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

      // Validated payload ready
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
      setImportErrorMessage('Gagal membaca file dari penyimpanan lokal.');
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
    // Replace nodes and edges in Zustand store
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5"
        role="dialog"
        aria-modal="true"
        aria-label="Bagikan & Kelola Workspace"
      >
        <div className="w-full max-w-2xl max-h-[92dvh] rounded-2xl bg-void-900 border border-white/15 shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-150">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-void-850 shrink-0 select-none">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-100">
                  {isId ? 'Kelola & Bagikan Rangkaian' : 'Manage & Share Circuit'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isId
                    ? 'Ekspor file .circuit, buat kode QR kelas, atau simpan tautan shareable'
                    : 'Export .circuit files, generate classroom QR codes, or copy shareable links'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-void-900 text-slate-400 hover:text-white border border-white/10 active:scale-95 transition-all cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-5 overscroll-contain">
            {/* Circuit Title & Author inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  {isId ? 'Nama / Judul Rangkaian' : 'Circuit Blueprint Title'}
                </label>
                <input
                  type="text"
                  value={circuitTitle}
                  onChange={(e) => setCircuitTitle(e.target.value)}
                  placeholder="Contoh: Praktikum Hukum Ohm 9A"
                  className="w-full px-3 py-2 rounded-xl bg-void-950 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-electric-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  {isId ? 'Nama Siswa / Guru (Opsional)' : 'Author / Class (Optional)'}
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Contoh: Tim Siswa SMPN 12"
                  className="w-full px-3 py-2 rounded-xl bg-void-950 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-electric-500"
                />
              </div>
            </div>

            {/* QR Code & Share Link Section */}
            <div className="p-4 rounded-2xl bg-void-950/70 border border-white/10 flex flex-col sm:flex-row items-center gap-5">
              {/* QR Code Container */}
              <div className="shrink-0 p-2.5 rounded-2xl bg-white shadow-xl flex flex-col items-center justify-center">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Circuit QR Code"
                    className="w-36 h-36 rounded-lg object-contain"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-slate-400">
                    <QrCode className="w-12 h-12" />
                  </div>
                )}
                <span className="text-[10px] text-slate-700 font-mono font-bold mt-1 text-center">
                  {isId ? 'Pindai dengan Kamera HP' : 'Scan with Smartphone'}
                </span>
              </div>

              {/* URL & Quick Copy */}
              <div className="flex-1 min-w-0 space-y-2.5 w-full">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-electric-400 shrink-0" />
                  <h3 className="text-xs font-bold text-slate-200">
                    {isId ? 'Tautan Langsung Rangkaian' : 'Direct Shareable Link'}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {isId
                    ? 'Tautan ini memuat seluruh posisi komponen, nilai tegangan, dan kabel tanpa perlu koneksi database backend.'
                    : 'This URL encapsulates the entire circuit topology, wire connections, and component parameters without a backend server.'}
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-void-900 border border-white/10 text-[11px] font-mono text-slate-300 truncate focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 ${
                      hasCopiedUrl
                        ? 'bg-emerald-500 text-void-950 shadow-glow'
                        : 'bg-electric-500 hover:bg-electric-400 text-void-950 shadow-glow'
                    }`}
                  >
                    {hasCopiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{hasCopiedUrl ? (isId ? 'Tersalin!' : 'Copied!') : isId ? 'Salin' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* File Operations (Export / Import / Duplicate) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Export to .circuit File */}
              <button
                type="button"
                onClick={handleExportFile}
                className="min-h-[44px] p-3.5 rounded-xl bg-void-850 hover:bg-void-800 border border-white/10 hover:border-electric-500/40 text-left transition-all active:scale-95 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-electric-500/15 text-electric-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Download className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">
                  {isId ? 'Unduh File .circuit' : 'Download .circuit'}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isId ? 'Simpan file offline ke laptop' : 'Save offline file to disk'}
                </p>
              </button>

              {/* Import .circuit File */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[44px] p-3.5 rounded-xl bg-void-850 hover:bg-void-800 border border-white/10 hover:border-electric-500/40 text-left transition-all active:scale-95 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Upload className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">
                  {isId ? 'Buka File .circuit' : 'Import .circuit'}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isId ? 'Buka file praktikum teman' : 'Load from saved file'}
                </p>
              </button>

              {/* Duplicate Workspace */}
              <button
                type="button"
                onClick={handleDuplicateWorkspace}
                className="min-h-[44px] p-3.5 rounded-xl bg-void-850 hover:bg-void-800 border border-white/10 hover:border-amber-500/40 text-left transition-all active:scale-95 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <CopyPlus className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">
                  {isId ? 'Duplikat Workspace' : 'Clone Workspace'}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isId ? 'Salin ke Preset Kustom' : 'Save copy to Presets'}
                </p>
              </button>
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".circuit,application/json,.json"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Import Error Message Display */}
            {importErrorMessage && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importErrorMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog before overwriting active work with imported file */}
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
