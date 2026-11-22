import React, { useEffect, useId, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Copy,
  Download,
  HelpCircle,
  Loader2,
  Play,
  Send,
  Share2,
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
import { MissionTopologyPreview } from '../missions/MissionTopologyPreview';

const MISSIONS_STORAGE_KEY = 'circuit_sandbox_missions_progress_v1';

function loadCompletedIds(): string[] {
  try {
    const raw = localStorage.getItem(MISSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

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
  onOpenTroubleshooting: () => void;
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
  onOpenTroubleshooting,
  onNotify,
  isId,
}) => {
  const [completedIds, setCompletedIds] = useState<string[]>(loadCompletedIds);
  const [showSteps, setShowSteps] = useState<boolean>(false);
  const [showSubmitForm, setShowSubmitForm] = useState<boolean>(Boolean(activeAssignment));
  const [showAdvancedCode, setShowAdvancedCode] = useState<boolean>(false);

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
    if (activeAssignment) {
      setShowSubmitForm(true);
      if (activeAssignment.className && !className) {
        setClassName(activeAssignment.className);
      }
    }
  }, [activeAssignment, className]);

  const packet = useMemo(
    () => LKPD_CATALOG.find((item) => item.missionId === selectedMissionId) ?? LKPD_CATALOG[0],
    [selectedMissionId]
  );

  const mission = useMemo(
    () => MISSION_CATALOG.find((item) => item.id === packet.missionId) ?? MISSION_CATALOG[0],
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

  useEffect(() => {
    if (evaluation.isMissionCompleted && !completedIds.includes(packet.missionId)) {
      const updated = [...completedIds, packet.missionId];
      setCompletedIds(updated);
      try {
        localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors in restricted environments.
      }
    }
  }, [evaluation.isMissionCompleted, packet.missionId, completedIds]);

  useEffect(() => {
    setGeneratedRecord(null);
    setGeneratedToken('');
    setGeneratedUrl('');
    setQrDataUrl('');
    setQrState('idle');
    setFormError(null);
    setShowSteps(false);
    setShowAdvancedCode(false);
  }, [packet.missionId]);

  const handleGenerateSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setFormError(
        isId
          ? 'Isi Nama Lengkap terlebih dahulu.'
          : 'Please enter your full name first.'
      );
      return;
    }
    if (!className.trim()) {
      setFormError(
        isId
          ? 'Isi Kelas (contoh: IX-A) agar guru dapat merekap nilai.'
          : 'Please enter your class (e.g. IX-A) for grading.'
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
        ? `Bukti nilai ${packet.lkpdCode} siap dikirim (skor ${record.score}/100).`
        : `${packet.lkpdCode} score proof ready (${record.score}/100).`
    );
  };

  const handlePrimaryShare = async () => {
    if (!generatedRecord || !generatedUrl) return;
    const shareText = isId
      ? `Hasil Praktikum ${generatedRecord.lkpdCode} - ${generatedRecord.studentName} (${generatedRecord.className}) | Skor: ${generatedRecord.score}/100`
      : `Lab Result ${generatedRecord.lkpdCode} - ${generatedRecord.studentName} (${generatedRecord.className}) | Score: ${generatedRecord.score}/100`;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareText,
          text: shareText,
          url: generatedUrl,
        });
        return;
      } catch {
        // User canceled native share or browser blocked it; fall back to copy.
      }
    }

    await handleCopy(generatedUrl, 'url');
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
              ? 'Kode teks disalin. Tempel di grup kelas guru.'
              : 'Text code copied. Paste into teacher chat.'
            : isId
            ? 'Tautan hasil disalin. Kirim ke guru lewat WhatsApp atau Classroom.'
            : 'Result link copied. Send to your teacher.'
        );
      }
    } catch {
      onNotify(
        isId
          ? 'Gagal menyalin otomatis. Buka Opsi Lain untuk menyalin manual.'
          : 'Auto-copy unavailable. Open More Options to copy manually.'
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
        ? `Berkas ${safeName}.lkpd.json diunduh.`
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
              {isId ? 'TUGAS DARI GURU' : 'TEACHER ASSIGNMENT'} · {activeAssignment.lkpdCode}
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
            aria-label={isId ? 'Tutup info tugas aktif' : 'Dismiss active assignment'}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-void-950 hover:bg-void-850 border border-control text-slate-300 hover:text-ink flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Unified 5-Task Selector Strip */}
      <div
        role="group"
        aria-label={isId ? 'Pilih salah satu dari 5 praktikum' : 'Choose one of 5 lab tasks'}
        className="flex items-center gap-2 overflow-x-auto pb-1"
      >
        {LKPD_CATALOG.map((item) => {
          const isSelected = item.missionId === packet.missionId;
          const isDone = completedIds.includes(item.missionId);
          return (
            <button
              key={item.lkpdCode}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectMissionId(item.missionId)}
              className={`min-h-[44px] px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-electric-600 text-white border-electric-700 font-bold'
                  : isDone
                  ? 'bg-void-900 border-emerald-500/50 text-emerald-400'
                  : 'bg-void-900 border-control text-ink hover:bg-void-850'
              }`}
            >
              <span className="font-mono tabular-nums text-[11px]">#{item.order}</span>
              <span>{isId ? item.shortLabelId : item.shortLabelEn}</span>
              {isDone && (
                <CheckCircle2
                  className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-400'}`}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Task Stage: Schematic Target + Live Auto-Grading Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
        <MissionTopologyPreview missionId={packet.missionId} isId={isId} />

        <section className="rounded-xl bg-void-900 border border-control p-3.5 flex flex-col justify-between gap-3">
          <div className="space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] font-mono text-slate-400">
                  {packet.lkpdCode} · ~{packet.estimatedMinutes} {isId ? 'menit' : 'min'}
                </div>
                <h3 className="text-sm font-bold text-ink leading-snug mt-0.5">
                  {isId ? packet.topicId : packet.topicEn}
                </h3>
              </div>

              <div className="px-2.5 py-1.5 rounded-xl bg-void-950 border border-control text-right shrink-0">
                <div
                  className={`text-base font-bold font-mono tabular-nums leading-none ${
                    evaluation.passedKkm ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {evaluation.score}
                  <span className="text-[11px] font-normal text-slate-400">/100</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  {evaluation.passedKkm
                    ? isId
                      ? 'Tuntas'
                      : 'Pass'
                    : isId
                    ? `Target ${packet.kkmScore}`
                    : `Goal ${packet.kkmScore}+`}
                </div>
              </div>
            </div>

            <div className="w-full h-1.5 rounded-full bg-void-950 overflow-hidden border border-ink/10">
              <div
                className={`h-full transition-all duration-300 ${
                  evaluation.passedKkm ? 'bg-emerald-600' : 'bg-electric-600'
                }`}
                style={{ width: `${evaluation.score}%` }}
              />
            </div>

            <div className="space-y-1.5">
              {packet.rubric.map((rubricItem) => {
                const scoreEntry = evaluation.criteria.find(
                  (c) => c.objectiveId === rubricItem.objectiveId
                );
                const ok = Boolean(scoreEntry?.isSatisfied);
                return (
                  <div
                    key={rubricItem.objectiveId}
                    className={`px-2.5 py-2 rounded-lg border text-xs flex items-start justify-between gap-2 ${
                      ok
                        ? 'bg-void-950 border-emerald-500/45 text-ink'
                        : 'bg-void-950 border-ink/15 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      {ok ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                      )}
                      <span className="leading-snug">
                        {isId ? rubricItem.labelId : rubricItem.labelEn}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-[11px] font-bold tabular-nums shrink-0 ${
                        ok ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      +{scoreEntry?.earnedPoints ?? 0}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] font-mono tabular-nums text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5 pt-2 border-t border-ink/10">
            <span>
              {isId ? 'Daya' : 'Power'}: {evaluation.telemetry.totalPowerWatts.toFixed(2)} W
            </span>
            <span>
              {evaluation.telemetry.isShortCircuit
                ? isId
                  ? 'Ada korsleting'
                  : 'Short circuit active'
                : isId
                ? 'Rangkaian aman'
                : 'No short circuit'}
            </span>
          </div>
        </section>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        {mission.starterCircuitName && (
          <button
            type="button"
            onClick={() => onLoadStarterToCanvas(mission.starterCircuitName!)}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white shrink-0" aria-hidden="true" />
            <span>{isId ? 'Muat Starter ke Kanvas' : 'Load Starter Circuit'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onCloseToCanvas}
          className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-void-900 hover:bg-void-850 border border-control text-ink font-semibold text-xs flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer"
        >
          <Wrench className="w-3.5 h-3.5 text-electric-400 shrink-0" aria-hidden="true" />
          <span>{isId ? 'Rangkai di Kanvas' : 'Build on Canvas'}</span>
        </button>

        <button
          type="button"
          aria-expanded={showSubmitForm}
          onClick={() => setShowSubmitForm((prev) => !prev)}
          className={`flex-1 min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer ${
            showSubmitForm
              ? 'bg-void-850 border border-emerald-500/50 text-emerald-400'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          <Send className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>
            {showSubmitForm
              ? isId
                ? 'Tutup Form Kumpul'
                : 'Hide Submit Form'
              : isId
              ? 'Kumpulkan ke Guru'
              : 'Submit to Teacher'}
          </span>
        </button>
      </div>

      {/* Collapsible Student Submission Drawer (Shown only when student taps Submit or opened #lkpd= link) */}
      {showSubmitForm && (
        <form
          onSubmit={handleGenerateSubmission}
          className="rounded-xl bg-void-900 border border-control p-4 space-y-3.5"
        >
          <div>
            <h4 className="text-sm font-bold text-ink">
              {isId ? 'Kirim Hasil Praktikum ke Guru' : 'Submit Lab Result to Teacher'}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {isId
                ? 'Isi nama dan kelas untuk membuat kartu nilai yang bisa dikirim lewat WhatsApp atau dipindai guru.'
                : 'Enter your name and class to create a verified score card to share with your teacher.'}
            </p>
          </div>

          {formError && (
            <div
              role="alert"
              className="px-3 py-2 rounded-xl bg-void-950 border border-red-500/60 text-xs text-red-400 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label htmlFor={nameInputId} className="block text-xs font-semibold text-ink">
                {isId ? 'Nama Lengkap *' : 'Full Name *'}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold transition-colors active:scale-95 cursor-pointer"
          >
            {isId ? 'Buat Bukti Nilai' : 'Create Score Proof'}
          </button>

          {/* Clean Student Result Card (No scary raw base64 unless expanded) */}
          {generatedRecord && (
            <div
              aria-live="polite"
              className="rounded-xl bg-void-950 border border-emerald-500/50 p-3.5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                <div className="shrink-0">
                  {qrState === 'loading' && (
                    <div className="w-[132px] h-[132px] rounded-xl bg-void-900 border border-control flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-electric-400 motion-safe:animate-spin" aria-hidden="true" />
                    </div>
                  )}
                  {qrState === 'ready' && qrDataUrl && (
                    <div className="p-2 rounded-xl bg-white border border-control">
                      <img
                        src={qrDataUrl}
                        alt={isId ? 'QR Bukti Nilai Siswa' : 'Student score QR code'}
                        width={124}
                        height={124}
                        className="w-[124px] h-[124px] block"
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <div className="text-[11px] font-mono font-bold text-emerald-400">
                      {isId ? 'BUKTI NILAI SIAP' : 'SCORE PROOF READY'} · {generatedRecord.verificationCode}
                    </div>
                    <div className="text-sm font-bold text-ink">
                      {generatedRecord.studentName} ({generatedRecord.className}) ·{' '}
                      <span className="font-mono tabular-nums">{generatedRecord.score}/100</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isId
                        ? 'Tunjukkan QR ke guru atau kirim tautan langsung lewat tombol di bawah.'
                        : 'Show this QR to your teacher or send the link using the button below.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrimaryShare}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
                    >
                      {copiedMode === 'url' ? (
                        <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      )}
                      <span>
                        {copiedMode === 'url'
                          ? isId
                            ? 'Tautan Tersalin'
                            : 'Link Copied'
                          : isId
                          ? 'Kirim ke Guru'
                          : 'Share with Teacher'}
                      </span>
                    </button>

                    <button
                      type="button"
                      aria-expanded={showAdvancedCode}
                      onClick={() => setShowAdvancedCode((prev) => !prev)}
                      className="min-h-[44px] px-3 py-2 rounded-xl bg-void-900 hover:bg-void-850 border border-control text-slate-300 hover:text-ink text-xs font-semibold cursor-pointer"
                    >
                      {isId ? 'Opsi Lain (Kode / File)' : 'More (Code / File)'}
                    </button>
                  </div>
                </div>
              </div>

              {showAdvancedCode && (
                <div className="pt-2.5 border-t border-ink/15 space-y-2">
                  <label htmlFor={tokenOutputId} className="block text-[11px] font-mono text-slate-400">
                    {isId ? 'Kode Teks Manual (untuk Rekap Guru)' : 'Manual Text Code'}
                  </label>
                  <textarea
                    id={tokenOutputId}
                    readOnly
                    rows={2}
                    value={generatedToken}
                    onFocus={(e) => e.currentTarget.select()}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-void-900 border border-control font-mono text-[11px] text-slate-300 break-all"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(generatedToken, 'token')}
                      className="min-h-[44px] px-3 py-2 rounded-xl bg-void-900 hover:bg-void-850 border border-control text-ink text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedMode === 'token' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-electric-400" aria-hidden="true" />
                      )}
                      <span>{isId ? 'Salin Kode Teks' : 'Copy Text Code'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadJson}
                      className="min-h-[44px] px-3 py-2 rounded-xl bg-void-900 hover:bg-void-850 border border-control text-ink text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                      <span>{isId ? 'Unduh .lkpd.json' : 'Download .lkpd.json'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      )}

      {/* Collapsible Step Guide & Troubleshooting Link */}
      <div className="rounded-xl bg-void-900 border border-control overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSteps((v) => !v)}
          aria-expanded={showSteps}
          className="w-full min-h-[44px] px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-ink hover:bg-void-850 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-electric-400 shrink-0" aria-hidden="true" />
            <span>{isId ? 'Lihat Langkah & Petunjuk' : 'View Step-by-Step Guide'}</span>
          </span>
          {showSteps ? (
            <ChevronUp className="w-4 h-4 text-slate-400" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" aria-hidden="true" />
          )}
        </button>

        {showSteps && (
          <div className="px-3.5 pb-3.5 pt-2.5 border-t border-ink/15 space-y-2.5 text-xs">
            <div className="space-y-1 text-slate-300">
              {(isId ? mission.instructionsId : mission.instructionsEn).map((step, idx) => (
                <div key={idx} className="leading-relaxed">
                  {step}
                </div>
              ))}
            </div>
            {(isId ? mission.hintsId : mission.hintsEn).length > 0 && (
              <div className="p-2.5 rounded-lg bg-void-950 border border-amber-500/45 text-amber-400 leading-relaxed">
                <span className="font-bold">{isId ? 'Tips: ' : 'Hint: '}</span>
                {(isId ? mission.hintsId : mission.hintsEn)[0]}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Consolidated Troubleshooting Entry (All Lab Challenges Under One Roof) */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-void-900 border border-ink/15 text-xs">
        <span className="text-slate-300">
          {isId ? 'Ingin latihan cari kerusakan rangkaian?' : 'Want extra fault-repair practice?'}
        </span>
        <button
          type="button"
          onClick={onOpenTroubleshooting}
          className="min-h-[40px] px-3 py-1.5 rounded-lg bg-void-950 hover:bg-void-850 border border-control text-ink font-semibold whitespace-nowrap cursor-pointer shrink-0"
        >
          {isId ? 'Latihan Perbaikan (6)' : 'Fault Lab (6)'}
        </button>
      </div>
    </div>
  );
};
