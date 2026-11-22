import React, { useEffect, useId, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Circle,
  Copy,
  Download,
  Loader2,
  Play,
  Wrench,
  X,
} from 'lucide-react';
import QRCode from 'qrcode';
import { Edge, Node } from 'reactflow';
import { MISSION_CATALOG } from '../../../missions/missionCatalog';
import { LKPD_CATALOG } from '../../../lkpd/lkpdCatalog';
import {
  encodeSubmissionToken,
  encodeSubmissionUrl,
  triggerTextFileDownload,
} from '../../../lkpd/lkpdCodec';
import { buildStudentSubmissionRecord, evaluateLkpdCircuit } from '../../../lkpd/lkpdGrader';
import { saveStudentSubmissionHistory } from '../../../lkpd/lkpdGradebookStorage';
import {
  LkpdAssignmentPayload,
  LkpdMissionId,
  LkpdSubmissionRecord,
} from '../../../lkpd/lkpdTypes';
import { CircuitElementData, SimulationResult, WorldMode } from '../../../types/circuit';

export interface LkpdStudentSubmitTabProps {
  selectedMissionId: LkpdMissionId;
  onSelectMissionId: (missionId: LkpdMissionId) => void;
  activeAssignment: LkpdAssignmentPayload | null;
  onClearAssignment: () => void;
  nodes: Node<CircuitElementData>[];
  edges: Edge[];
  simulation: SimulationResult;
  worldMode: WorldMode;
  onCloseToCanvas: () => void;
  onLoadStarterToCanvas: (starterPresetName: string) => void;
  onNotify: (message: string) => void;
  isId: boolean;
}

export const LkpdStudentSubmitTab: React.FC<LkpdStudentSubmitTabProps> = ({
  selectedMissionId,
  onSelectMissionId,
  activeAssignment,
  onClearAssignment,
  nodes,
  edges,
  simulation,
  worldMode,
  onCloseToCanvas,
  onLoadStarterToCanvas,
  onNotify,
  isId,
}) => {
  const [studentName, setStudentName] = useState<string>('');
  const [className, setClassName] = useState<string>(activeAssignment?.className ?? '');
  const [absentNumber, setAbsentNumber] = useState<string>('');
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [generatedRecord, setGeneratedRecord] = useState<LkpdSubmissionRecord | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string>('');
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrState, setQrState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [copiedMode, setCopiedMode] = useState<'none' | 'token' | 'url'>('none');

  const fieldId = useId();
  const nameInputId = `${fieldId}-student-name`;
  const classInputId = `${fieldId}-student-class`;
  const absentInputId = `${fieldId}-student-absent`;
  const tokenOutputId = `${fieldId}-submission-token`;

  useEffect(() => {
    if (activeAssignment?.className && !className) {
      setClassName(activeAssignment.className);
    }
  }, [activeAssignment, className]);

  const packet = useMemo(
    () => LKPD_CATALOG.find((item) => item.missionId === selectedMissionId) ?? LKPD_CATALOG[0],
    [selectedMissionId]
  );

  const mission = useMemo(
    () => MISSION_CATALOG.find((item) => item.id === packet.missionId),
    [packet.missionId]
  );

  const evaluation = useMemo(
    () =>
      evaluateLkpdCircuit({
        missionId: packet.missionId,
        nodes,
        edges,
        simulation,
        worldMode,
      }),
    [packet.missionId, nodes, edges, simulation, worldMode]
  );

  // Reset previously generated proof if student switches to a different LKPD packet.
  useEffect(() => {
    setGeneratedRecord(null);
    setGeneratedToken('');
    setGeneratedUrl('');
    setQrDataUrl('');
    setQrState('idle');
    setFormError(null);
  }, [packet.missionId]);

  const handleGenerateSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setFormError(
        isId
          ? 'Isi Nama Lengkap Siswa terlebih dahulu sebelum membuat bukti kumpul.'
          : 'Please enter the student name before generating submission proof.'
      );
      return;
    }
    if (!className.trim()) {
      setFormError(
        isId
          ? 'Isi Nama Kelas (contoh: IX-A) agar guru dapat merekap nilai.'
          : 'Please enter the class name (e.g., IX-A) for the teacher gradebook.'
      );
      return;
    }

    setFormError(null);
    const record = buildStudentSubmissionRecord({
      evaluation,
      studentName,
      className,
      absentNumber,
      teacherName: activeAssignment?.teacherName,
      reflections,
    });

    const token = encodeSubmissionToken(record);
    const url = encodeSubmissionUrl(record);

    saveStudentSubmissionHistory(record);
    setGeneratedRecord(record);
    setGeneratedToken(token);
    setGeneratedUrl(url);
    setQrState('loading');

    QRCode.toDataURL(
      url,
      {
        width: 220,
        margin: 2,
        color: { dark: '#0F172A', light: '#FFFFFF' },
        errorCorrectionLevel: 'L',
      },
      (error, dataUrl) => {
        if (!error && dataUrl) {
          setQrDataUrl(dataUrl);
          setQrState('ready');
        } else {
          setQrDataUrl('');
          setQrState('error');
        }
      }
    );

    onNotify(
      isId
        ? `Bukti kumpul ${packet.lkpdCode} dibuat dengan skor ${record.score}/100.`
        : `${packet.lkpdCode} submission proof generated with score ${record.score}/100.`
    );
  };

  const handleCopy = async (value: string, mode: 'token' | 'url') => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(value);
        setCopiedMode(mode);
        setTimeout(() => setCopiedMode('none'), 2200);
        onNotify(
          mode === 'token'
            ? isId
              ? 'Kode bukti kumpul disalin. Kirimkan ke guru lewat chat atau Classroom.'
              : 'Submission code copied. Send it to your teacher.'
            : isId
            ? 'Tautan hasil praktikum disalin.'
            : 'Submission link copied.'
        );
      }
    } catch {
      onNotify(
        isId
          ? 'Gagal menyalin otomatis. Salin teks dari kotak kode.'
          : 'Automatic copy failed. Copy text manually from the box.'
      );
    }
  };

  const handleDownloadJson = () => {
    if (!generatedRecord) return;
    const safeName = generatedRecord.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    triggerTextFileDownload(
      `${safeName}.lkpd.json`,
      JSON.stringify(generatedRecord, null, 2),
      'application/json'
    );
    onNotify(
      isId
        ? `Berkas ${safeName}.lkpd.json berhasil diunduh.`
        : `File ${safeName}.lkpd.json downloaded.`
    );
  };

  return (
    <div className="space-y-4">
      {/* Active Teacher Assignment Context Strip */}
      {activeAssignment && (
        <div className="rounded-xl bg-void-900 border border-electric-500/50 px-3.5 py-2.5 flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <div className="text-[11px] font-mono font-bold text-electric-400">
              {isId ? 'TUGAS AKTIF DARI GURU' : 'ACTIVE TEACHER ASSIGNMENT'} ·{' '}
              {activeAssignment.lkpdCode}
            </div>
            <div className="text-xs text-ink">
              {activeAssignment.className
                ? `${isId ? 'Kelas' : 'Class'} ${activeAssignment.className}`
                : isId
                ? 'Tugas Kelas Aktif'
                : 'Active Class Task'}
              {activeAssignment.teacherName ? ` · ${activeAssignment.teacherName}` : ''}
            </div>
            {activeAssignment.note && (
              <p className="text-xs text-slate-300 leading-snug">{activeAssignment.note}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClearAssignment}
            aria-label={isId ? 'Lepas tanda tugas aktif' : 'Dismiss active assignment'}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-void-950 hover:bg-void-850 border border-control text-slate-300 hover:text-ink flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Packet Switcher */}
      <div
        role="group"
        aria-label={isId ? 'Pilih paket LKPD yang dikumpulkan' : 'Select LKPD packet to submit'}
        className="flex items-center gap-2 overflow-x-auto pb-1"
      >
        {LKPD_CATALOG.map((item) => {
          const isSelected = item.missionId === packet.missionId;
          return (
            <button
              key={item.lkpdCode}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectMissionId(item.missionId)}
              className={`min-h-[44px] px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-electric-600 text-white border-electric-700 font-bold'
                  : 'bg-void-900 border-control text-ink hover:bg-void-850'
              }`}
            >
              <span className="font-mono tabular-nums">{item.lkpdCode}</span>
            </button>
          );
        })}
      </div>

      {/* Live Auto-Grading Readout Panel */}
      <section className="rounded-xl bg-void-900 border border-control p-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-mono text-slate-400">
              {packet.lkpdCode} · {isId ? 'PENILAIAN KANVAS REAL-TIME' : 'LIVE CANVAS AUTO-GRADING'}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-ink leading-snug mt-0.5">
              {isId ? packet.topicId : packet.topicEn}
            </h3>
          </div>

          <div className="flex items-center gap-3 shrink-0 bg-void-950 border border-control rounded-xl px-3.5 py-2">
            <div>
              <div className="text-[10px] font-mono text-slate-400">
                {isId ? 'SKOR SAAT INI' : 'LIVE SCORE'}
              </div>
              <div
                className={`text-xl font-bold font-mono tabular-nums leading-tight ${
                  evaluation.passedKkm ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {evaluation.score}
                <span className="text-xs text-slate-400 font-normal"> / {evaluation.maxScore}</span>
              </div>
            </div>
            <div className="h-7 w-px bg-ink/15" />
            <div className="text-xs font-mono font-bold">
              {evaluation.passedKkm ? (
                <span className="text-emerald-400">{isId ? 'TUNTAS' : 'PASS'}</span>
              ) : (
                <span className="text-amber-400">
                  {isId ? `KKM ${packet.kkmScore}` : `Pass ${packet.kkmScore}+`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live Telemetry Summary Row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono tabular-nums text-slate-300 bg-void-950 border border-ink/15 rounded-lg px-3 py-2">
          <span>
            {isId ? 'Komponen' : 'Components'}: {evaluation.telemetry.nodeCount}
          </span>
          <span>
            {isId ? 'Kabel' : 'Wires'}: {evaluation.telemetry.edgeCount}
          </span>
          <span>
            {isId ? 'Daya' : 'Power'}: {evaluation.telemetry.totalPowerWatts.toFixed(2)} W
          </span>
          <span
            className={
              evaluation.telemetry.isShortCircuit ? 'text-red-400 font-bold' : 'text-emerald-400'
            }
          >
            {evaluation.telemetry.isShortCircuit
              ? isId
                ? 'Korsleting: YA'
                : 'Short: YES'
              : isId
              ? 'Korsleting: Aman'
              : 'Short: Clear'}
          </span>
        </div>

        {/* Rubric Criteria Breakdown */}
        <div className="space-y-1.5">
          {packet.rubric.map((rubricItem) => {
            const scoreEntry = evaluation.criteria.find(
              (c) => c.objectiveId === rubricItem.objectiveId
            );
            const ok = Boolean(scoreEntry?.isSatisfied);
            return (
              <div
                key={rubricItem.objectiveId}
                className={`px-3 py-2 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                  ok
                    ? 'bg-void-950 border-emerald-500/45 text-ink'
                    : 'bg-void-950 border-ink/15 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-2 min-w-0">
                  {ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  <div className="min-w-0">
                    <div className="font-medium leading-snug">
                      {isId ? rubricItem.labelId : rubricItem.labelEn}
                    </div>
                    {!ok && (
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {isId
                          ? scoreEntry?.feedbackText || 'Belum terpenuhi di kanvas.'
                          : 'Not yet satisfied on canvas.'}
                      </div>
                    )}
                  </div>
                </div>
                <span
                  className={`font-mono font-bold tabular-nums shrink-0 ${
                    ok ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  +{scoreEntry?.earnedPoints ?? 0}/{rubricItem.weight}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={onCloseToCanvas}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-void-850 hover:bg-void-800 border border-control text-ink text-xs font-semibold flex items-center gap-2 transition-colors active:scale-95 cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 text-electric-400 shrink-0" aria-hidden="true" />
            <span>{isId ? 'Perbaiki Rangkaian di Kanvas' : 'Edit Circuit on Canvas'}</span>
          </button>

          {mission?.starterCircuitName && (
            <button
              type="button"
              onClick={() => onLoadStarterToCanvas(mission.starterCircuitName!)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-void-850 hover:bg-void-800 border border-control text-ink text-xs font-semibold flex items-center gap-2 transition-colors active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>{isId ? 'Muat Starter Rangkaian' : 'Load Starter Circuit'}</span>
            </button>
          )}
        </div>
      </section>

      {/* Student Identity & Reflection Form */}
      <form
        onSubmit={handleGenerateSubmission}
        className="rounded-xl bg-void-900 border border-control p-4 space-y-4"
      >
        <div>
          <h3 className="text-sm font-bold text-ink">
            {isId ? 'Identitas & Jawaban Refleksi Siswa' : 'Student Identity & Reflection'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isId
              ? 'Setelah rangkaian siap, buat kode kumpul untuk dikirim ke guru (tanpa login atau kuota).'
              : 'Once your circuit is ready, generate a submission code for your teacher (zero login).'}
          </p>
        </div>

        {formError && (
          <div
            role="alert"
            className="px-3 py-2.5 rounded-xl bg-void-950 border border-red-500/60 text-xs text-red-400 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1 sm:col-span-1">
            <label htmlFor={nameInputId} className="block text-xs font-semibold text-ink">
              {isId ? 'Nama Lengkap Siswa *' : 'Student Full Name *'}
            </label>
            <input
              id={nameInputId}
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              maxLength={80}
              placeholder={isId ? 'Contoh: Raka Pratama' : 'Example: Raka Pratama'}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-void-950 border border-control text-xs text-ink placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor={classInputId} className="block text-xs font-semibold text-ink">
              {isId ? 'Kelas *' : 'Class *'}
            </label>
            <input
              id={classInputId}
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              maxLength={40}
              placeholder="IX-A"
              className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-void-950 border border-control text-xs text-ink placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor={absentInputId} className="block text-xs font-semibold text-ink">
              {isId ? 'No. Absen (Opsional)' : 'Roll No. (Optional)'}
            </label>
            <input
              id={absentInputId}
              type="text"
              value={absentNumber}
              onChange={(e) => setAbsentNumber(e.target.value)}
              maxLength={16}
              placeholder="12"
              className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-void-950 border border-control text-xs text-ink placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {packet.reflectionPrompts.map((prompt, idx) => {
            const inputId = `${fieldId}-ref-${prompt.id}`;
            return (
              <div key={prompt.id} className="space-y-1">
                <label htmlFor={inputId} className="block text-xs font-semibold text-ink leading-snug">
                  {idx + 1}. {isId ? prompt.questionId : prompt.questionEn}
                </label>
                <textarea
                  id={inputId}
                  rows={2}
                  maxLength={320}
                  value={reflections[prompt.id] ?? ''}
                  onChange={(e) =>
                    setReflections((prev) => ({ ...prev, [prompt.id]: e.target.value }))
                  }
                  placeholder={isId ? prompt.placeholderId : prompt.placeholderEn}
                  className="w-full px-3 py-2 rounded-lg bg-void-950 border border-control text-xs text-ink placeholder:text-slate-400 resize-y"
                />
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs sm:text-sm font-bold transition-colors active:scale-95 cursor-pointer"
        >
          {isId ? 'Buat Bukti & Kode Kumpul' : 'Generate Submission Proof & Code'}
        </button>
      </form>

      {/* Generated Proof Output */}
      {generatedRecord && (
        <section
          aria-live="polite"
          className="rounded-xl bg-void-900 border border-emerald-500/50 p-4 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-mono font-bold text-emerald-400">
                {isId ? 'BUKTI KUMPUL SIAP DIKIRIM' : 'SUBMISSION PROOF READY'}
              </div>
              <div className="text-sm font-bold text-ink">
                {generatedRecord.studentName} ({generatedRecord.className}) · {generatedRecord.score}/100
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-void-950 border border-control font-mono text-xs text-slate-300">
              {isId ? 'Kode Verifikasi Lokal: ' : 'Local Checksum: '}
              <span className="font-bold text-ink">{generatedRecord.verificationCode}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="shrink-0">
              {qrState === 'loading' && (
                <div className="w-[152px] h-[152px] rounded-xl bg-void-950 border border-control flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-electric-400 motion-safe:animate-spin" aria-hidden="true" />
                </div>
              )}
              {qrState === 'ready' && qrDataUrl && (
                <div className="p-2 rounded-xl bg-white border border-control">
                  <img
                    src={qrDataUrl}
                    alt={isId ? 'QR Bukti Kumpul Siswa' : 'Student submission QR code'}
                    width={144}
                    height={144}
                    className="w-[144px] h-[144px] block"
                  />
                </div>
              )}
              {qrState === 'error' && (
                <div className="w-[152px] h-[152px] rounded-xl bg-void-950 border border-amber-500/45 p-2.5 flex items-center justify-center text-center text-[11px] text-amber-400">
                  {isId
                    ? 'Jawaban panjang, kirim lewat tombol Salin Kode di samping.'
                    : 'Long reflection text; use Copy Code button.'}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 w-full space-y-2.5">
              <div className="space-y-1">
                <label htmlFor={tokenOutputId} className="block text-[11px] font-mono text-slate-400">
                  {isId ? 'Kode Kumpul Siswa (Tempel ke WA / Classroom Guru)' : 'Student Submission Code'}
                </label>
                <textarea
                  id={tokenOutputId}
                  readOnly
                  rows={3}
                  value={generatedToken}
                  onFocus={(e) => e.currentTarget.select()}
                  className="w-full px-3 py-2 rounded-lg bg-void-950 border border-control font-mono text-[11px] text-slate-300 break-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(generatedToken, 'token')}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
                >
                  {copiedMode === 'token' ? (
                    <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  )}
                  <span>
                    {copiedMode === 'token'
                      ? isId
                        ? 'Kode Tersalin'
                        : 'Code Copied'
                      : isId
                      ? 'Salin Kode Kumpul'
                      : 'Copy Submission Code'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(generatedUrl, 'url')}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-void-850 hover:bg-void-800 border border-control text-ink text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
                >
                  {copiedMode === 'url' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-electric-400 shrink-0" aria-hidden="true" />
                  )}
                  <span>{isId ? 'Salin Tautan Nilai' : 'Copy Result Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-void-850 hover:bg-void-800 border border-control text-ink text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>{isId ? 'Unduh .lkpd.json' : 'Download .lkpd.json'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
