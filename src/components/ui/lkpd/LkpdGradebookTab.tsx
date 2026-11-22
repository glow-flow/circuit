import React, { useId, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  Printer,
  Trash2,
  Upload,
} from 'lucide-react';
import { LKPD_CATALOG, getLkpdPacketByMissionId } from '../../../lkpd/lkpdCatalog';
import {
  buildPrintableGradebookHtml,
  generateGradebookCsv,
  parseBatchSubmissionInput,
  printHtmlViaHiddenIframe,
  triggerTextFileDownload,
} from '../../../lkpd/lkpdCodec';
import { computeGradebookSummary } from '../../../lkpd/lkpdGrader';
import { LkpdSubmissionRecord } from '../../../lkpd/lkpdTypes';

export interface LkpdGradebookTabProps {
  records: LkpdSubmissionRecord[];
  onImportRecords: (incoming: LkpdSubmissionRecord[]) => { addedCount: number; updatedCount: number };
  onDeleteRecord: (recordId: string) => void;
  onClearAllRecords: () => void;
  onNotify: (message: string) => void;
  isId: boolean;
}

export const LkpdGradebookTab: React.FC<LkpdGradebookTabProps> = ({
  records,
  onImportRecords,
  onDeleteRecord,
  onClearAllRecords,
  onNotify,
  isId,
}) => {
  const [pasteInput, setPasteInput] = useState<string>('');
  const [importErrors, setImportErrors] = useState<Array<{ line: number; message: string }>>([]);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [filterCode, setFilterCode] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fieldId = useId();
  const pasteAreaId = `${fieldId}-paste`;
  const filterSelectId = `${fieldId}-filter`;

  const filteredRecords = useMemo(() => {
    if (filterCode === 'ALL') return records;
    return records.filter((record) => record.lkpdCode === filterCode);
  }, [records, filterCode]);

  const summary = useMemo(
    () => computeGradebookSummary(filteredRecords),
    [filteredRecords]
  );

  const handleProcessPaste = () => {
    setImportFeedback(null);
    const parsed = parseBatchSubmissionInput(pasteInput);
    setImportErrors(parsed.errors);

    if (parsed.validRecords.length === 0) {
      return;
    }

    const { addedCount, updatedCount } = onImportRecords(parsed.validRecords);
    setPasteInput('');
    const summaryText = isId
      ? `Berhasil memproses ${parsed.validRecords.length} bukti kumpul (${addedCount} baru, ${updatedCount} diperbarui).`
      : `Processed ${parsed.validRecords.length} submissions (${addedCount} added, ${updatedCount} updated).`;
    setImportFeedback(summaryText);
    onNotify(summaryText);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result ?? '');
      const parsed = parseBatchSubmissionInput(text);
      setImportErrors(parsed.errors);
      if (parsed.validRecords.length > 0) {
        const { addedCount, updatedCount } = onImportRecords(parsed.validRecords);
        const msg = isId
          ? `Berkas diimpor: ${addedCount} baru, ${updatedCount} diperbarui.`
          : `File imported: ${addedCount} added, ${updatedCount} updated.`;
        setImportFeedback(msg);
        onNotify(msg);
      }
    };
    reader.onerror = () => {
      setImportErrors([
        {
          line: 1,
          message: isId ? 'Gagal membaca berkas dari perangkat.' : 'Failed to read file from device.',
        },
      ]);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExportCsv = () => {
    if (filteredRecords.length === 0) return;
    const csvContent = generateGradebookCsv(filteredRecords, isId ? 'id' : 'en');
    const suffix = filterCode === 'ALL' ? 'semua_lkpd' : filterCode.toLowerCase();
    triggerTextFileDownload(
      `rekap_nilai_${suffix}_${new Date().toISOString().slice(0, 10)}.csv`,
      csvContent,
      'text/csv;charset=utf-8'
    );
    onNotify(
      isId
        ? `Rekap ${filteredRecords.length} siswa diekspor ke CSV (siap dibuka di Excel/Sheets).`
        : `Exported ${filteredRecords.length} rows to CSV.`
    );
  };

  const handlePrintGradebook = () => {
    if (filteredRecords.length === 0) return;
    const filterLabel =
      filterCode === 'ALL'
        ? isId
          ? 'Semua 5 Paket LKPD'
          : 'All 5 LKPD Packets'
        : filterCode;
    const html = buildPrintableGradebookHtml({
      records: filteredRecords,
      filterLabel,
      language: isId ? 'id' : 'en',
    });
    printHtmlViaHiddenIframe(html);
  };

  return (
    <div className="space-y-4">
      {/* Batch Import Panel */}
      <section className="rounded-xl bg-void-900 border border-control p-4 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-ink">
            {isId ? 'Impor & Nilai Otomatis Bukti Kumpul Siswa' : 'Import & Auto-Grade Student Submissions'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            {isId
              ? 'Tempel satu atau banyak kode CSLKPD1... / tautan #lkpd-sub= dari grup kelas (satu per baris), atau unggah berkas .lkpd.json.'
              : 'Paste one or more CSLKPD1... codes or #lkpd-sub= links (one per line), or import a .lkpd.json file.'}
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor={pasteAreaId} className="block text-xs font-semibold text-ink">
            {isId ? 'Kode / Tautan Bukti Kumpul Siswa' : 'Student Submission Codes or Links'}
          </label>
          <textarea
            id={pasteAreaId}
            rows={3}
            value={pasteInput}
            onChange={(e) => setPasteInput(e.target.value)}
            placeholder={
              isId
                ? 'Tempel kode CSLKPD1... atau pesan chat kelas di sini (boleh beberapa baris sekaligus)...'
                : 'Paste CSLKPD1... codes or classroom chat lines here (multiple lines supported)...'
            }
            className="w-full px-3 py-2 rounded-lg bg-void-950 border border-control font-mono text-xs text-ink placeholder:text-slate-400 resize-y"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleProcessPaste}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold flex items-center gap-2 transition-colors active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{isId ? 'Proses & Rekap Nilai' : 'Parse & Grade'}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-void-850 hover:bg-void-800 border border-control text-ink text-xs font-semibold flex items-center gap-2 transition-colors active:scale-95 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-electric-400 shrink-0" aria-hidden="true" />
            <span>{isId ? 'Impor .lkpd.json' : 'Import .lkpd.json'}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.lkpd.json,application/json"
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>

        {importFeedback && (
          <div
            role="status"
            aria-live="polite"
            className="px-3 py-2 rounded-lg bg-void-950 border border-emerald-500/45 text-xs text-emerald-400"
          >
            {importFeedback}
          </div>
        )}

        {importErrors.length > 0 && (
          <div
            role="alert"
            className="px-3 py-2.5 rounded-lg bg-void-950 border border-red-500/60 text-xs text-red-400 space-y-1"
          >
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {isId
                  ? `${importErrors.length} baris gagal dibaca:`
                  : `${importErrors.length} line(s) failed to parse:`}
              </span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-300">
              {importErrors.slice(0, 5).map((err, idx) => (
                <li key={idx}>
                  {isId ? `Baris ${err.line}` : `Line ${err.line}`}: {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Filter & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1">
          <label htmlFor={filterSelectId} className="block text-[11px] font-mono text-slate-400">
            {isId ? 'FILTER PAKET LKPD' : 'FILTER LKPD PACKET'}
          </label>
          <select
            id={filterSelectId}
            value={filterCode}
            onChange={(e) => setFilterCode(e.target.value)}
            className="w-full sm:max-w-[260px] min-h-[44px] px-3 py-2 rounded-xl bg-void-900 border border-control text-xs font-semibold text-ink cursor-pointer"
          >
            <option value="ALL">
              {isId ? `Semua 5 Paket LKPD (${records.length})` : `All 5 LKPD Packets (${records.length})`}
            </option>
            {LKPD_CATALOG.map((item) => (
              <option key={item.lkpdCode} value={item.lkpdCode}>
                {item.lkpdCode} - {isId ? item.topicId : item.topicEn}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={filteredRecords.length === 0}
            onClick={handleExportCsv}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-45 transition-colors active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{isId ? 'Ekspor CSV (Excel)' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            disabled={filteredRecords.length === 0}
            onClick={handlePrintGradebook}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-void-900 hover:bg-void-850 border border-control text-ink text-xs font-semibold flex items-center gap-1.5 disabled:opacity-45 transition-colors active:scale-95 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-electric-400 shrink-0" aria-hidden="true" />
            <span>{isId ? 'Cetak Rekap' : 'Print Report'}</span>
          </button>

          {records.length > 0 && !confirmClear && (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-void-900 hover:bg-danger-600 hover:text-white border border-danger-500/60 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{isId ? 'Bersihkan' : 'Clear'}</span>
            </button>
          )}

          {confirmClear && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onClearAllRecords();
                  setConfirmClear(false);
                }}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-xs font-bold cursor-pointer"
              >
                {isId ? 'Ya, Hapus Semua' : 'Confirm Clear'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-void-900 border border-control text-ink text-xs font-semibold cursor-pointer"
              >
                {isId ? 'Batal' : 'Cancel'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Real Class Summary Metrics (Strictly rendered when real submissions exist, R-17) */}
      {filteredRecords.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="rounded-xl bg-void-900 border border-control p-3">
            <div className="text-[10px] font-mono text-slate-400">
              {isId ? 'PENGUMPUL' : 'SUBMISSIONS'}
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-ink mt-0.5">
              {summary.totalSubmissions}
            </div>
          </div>
          <div className="rounded-xl bg-void-900 border border-control p-3">
            <div className="text-[10px] font-mono text-slate-400">
              {isId ? 'RATA-RATA' : 'AVERAGE'}
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-electric-400 mt-0.5">
              {summary.averageScore}
            </div>
          </div>
          <div className="rounded-xl bg-void-900 border border-control p-3">
            <div className="text-[10px] font-mono text-slate-400">
              {isId ? 'TUNTAS KKM' : 'PASS RATE'}
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-emerald-400 mt-0.5">
              {summary.passRatePercent}%
              <span className="text-xs font-normal text-slate-400 ml-1">
                ({summary.passedCount}/{summary.totalSubmissions})
              </span>
            </div>
          </div>
          <div className="rounded-xl bg-void-900 border border-control p-3">
            <div className="text-[10px] font-mono text-slate-400">
              {isId ? 'MIN / MAKS' : 'MIN / MAX'}
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-ink mt-0.5">
              {summary.lowestScore} / {summary.highestScore}
            </div>
          </div>
        </div>
      )}

      {/* Empty State or Populated Gradebook List */}
      {records.length === 0 ? (
        <div className="rounded-xl bg-void-900 border border-control p-6 text-center space-y-2">
          <FileSpreadsheet className="w-7 h-7 text-slate-400 mx-auto" aria-hidden="true" />
          <h4 className="text-sm font-bold text-ink">
            {isId ? 'Belum Ada Bukti Kumpul Siswa' : 'No Student Submissions Yet'}
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {isId
              ? 'Bagikan tautan atau QR dari tab 5 Paket LKPD. Setelah siswa mengirim kode CSLKPD1..., tempel di kotak atas untuk menghitung nilai dan mengekspor CSV secara lokal.'
              : 'Share a link or QR from the 5 LKPD Packets tab. Once students send their CSLKPD1... codes, paste them above to grade and export CSV locally.'}
          </p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-xl bg-void-900 border border-control p-5 text-center space-y-2.5">
          <p className="text-xs text-slate-300">
            {isId
              ? `Belum ada siswa yang mengumpulkan ${filterCode}.`
              : `No submissions recorded for ${filterCode} yet.`}
          </p>
          <button
            type="button"
            onClick={() => setFilterCode('ALL')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-void-850 hover:bg-void-800 border border-control text-xs font-semibold text-ink cursor-pointer"
          >
            {isId ? 'Tampilkan Semua Paket' : 'Show All Packets'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRecords.map((record) => {
            const isExpanded = expandedId === record.id;
            const packet = getLkpdPacketByMissionId(record.missionId);

            return (
              <div
                key={record.id}
                className="rounded-xl bg-void-900 border border-control overflow-hidden"
              >
                <div className="p-3 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-void-950 border border-ink/15 font-mono text-[11px] font-bold text-electric-400">
                        {record.lkpdCode}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-ink truncate">
                        {record.studentName}
                      </span>
                      <span className="text-xs text-slate-400">
                        {record.className || '-'}
                        {record.absentNumber ? ` · #${record.absentNumber}` : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-mono tabular-nums text-slate-400">
                      <span>{record.verificationCode}</span>
                      <span>
                        {record.telemetry.totalPowerWatts.toFixed(2)} W ·{' '}
                        {record.telemetry.nodeCount} {isId ? 'komp' : 'parts'}
                      </span>
                      {record.isIntegrityValid === false && (
                        <span className="text-red-400 font-bold">
                          {isId ? 'Periksa Integritas Kode' : 'Check Code Integrity'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-base font-bold font-mono tabular-nums leading-none ${
                          record.passedKkm ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {record.score}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {record.passedKkm
                          ? isId
                            ? 'TUNTAS'
                            : 'PASS'
                          : isId
                          ? 'REMEDIAL'
                          : 'RETRY'}
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-label={`${isId ? 'Rincian rubrik' : 'Rubric details'} ${record.studentName}`}
                      onClick={() => setExpandedId(isExpanded ? null : record.id)}
                      className="min-w-[44px] min-h-[44px] rounded-xl bg-void-950 hover:bg-void-850 border border-control text-slate-300 hover:text-ink flex items-center justify-center cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>

                    <button
                      type="button"
                      aria-label={`${isId ? 'Hapus nilai' : 'Delete grade'} ${record.studentName}`}
                      onClick={() => onDeleteRecord(record.id)}
                      className="min-w-[44px] min-h-[44px] rounded-xl bg-void-950 hover:bg-danger-600 hover:text-white border border-control text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {isExpanded && packet && (
                  <div className="px-3.5 pb-3.5 pt-2.5 border-t border-ink/15 bg-void-950 space-y-3 text-xs">
                    <div className="space-y-1">
                      <div className="text-[11px] font-mono font-semibold text-slate-400">
                        {isId ? 'RINCIAN RUBRIK' : 'RUBRIC BREAKDOWN'}
                      </div>
                      {packet.rubric.map((criterion) => {
                        const passed = record.criteriaPassedIds.includes(criterion.objectiveId);
                        return (
                          <div
                            key={criterion.objectiveId}
                            className="flex items-center justify-between gap-2 py-1"
                          >
                            <span className={passed ? 'text-ink' : 'text-slate-400'}>
                              {isId ? criterion.labelId : criterion.labelEn}
                            </span>
                            <span
                              className={`font-mono font-bold tabular-nums shrink-0 ${
                                passed ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {passed ? `+${criterion.weight}` : '0'} / {criterion.weight}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-1.5 border-t border-ink/10 pt-2">
                      <div className="text-[11px] font-mono font-semibold text-slate-400">
                        {isId ? 'JAWABAN REFLEKSI SISWA' : 'STUDENT REFLECTIONS'}
                      </div>
                      {packet.reflectionPrompts.map((prompt, idx) => (
                        <div key={prompt.id} className="space-y-0.5">
                          <div className="text-slate-400">
                            {idx + 1}. {isId ? prompt.questionId : prompt.questionEn}
                          </div>
                          <div className="text-ink bg-void-900 border border-ink/15 rounded-lg px-2.5 py-1.5">
                            {record.reflections[prompt.id] || (
                              <span className="text-slate-400">
                                {isId ? '(Tidak diisi siswa)' : '(No response provided)'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
