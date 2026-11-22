import React, { useEffect, useId, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Loader2,
  Play,
  Printer,
  Send,
} from 'lucide-react';
import QRCode from 'qrcode';
import { MISSION_CATALOG } from '../../../missions/missionCatalog';
import { LKPD_CATALOG } from '../../../lkpd/lkpdCatalog';
import {
  buildPrintableLkpdHtml,
  encodeLkpdAssignmentUrl,
  printHtmlViaHiddenIframe,
} from '../../../lkpd/lkpdCodec';
import { LkpdAssignmentPayload, LkpdMissionId } from '../../../lkpd/lkpdTypes';

export interface LkpdPacketsTabProps {
  selectedMissionId: LkpdMissionId;
  onSelectMissionId: (missionId: LkpdMissionId) => void;
  onStartStudentWorkflow: (assignment: LkpdAssignmentPayload) => void;
  onLoadStarterToCanvas: (starterPresetName: string, assignment: LkpdAssignmentPayload) => void;
  onNotify: (message: string) => void;
  isId: boolean;
}

export const LkpdPacketsTab: React.FC<LkpdPacketsTabProps> = ({
  selectedMissionId,
  onSelectMissionId,
  onStartStudentWorkflow,
  onLoadStarterToCanvas,
  onNotify,
  isId,
}) => {
  const [className, setClassName] = useState<string>('IX-A');
  const [teacherName, setTeacherName] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrState, setQrState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const fieldId = useId();
  const classInputId = `${fieldId}-class`;
  const teacherInputId = `${fieldId}-teacher`;
  const noteInputId = `${fieldId}-note`;
  const linkOutputId = `${fieldId}-link`;

  const packet = useMemo(
    () => LKPD_CATALOG.find((item) => item.missionId === selectedMissionId) ?? LKPD_CATALOG[0],
    [selectedMissionId]
  );

  const mission = useMemo(
    () => MISSION_CATALOG.find((item) => item.id === packet.missionId),
    [packet.missionId]
  );

  const assignmentPayload: LkpdAssignmentPayload = useMemo(
    () => ({
      version: 1,
      missionId: packet.missionId,
      lkpdCode: packet.lkpdCode,
      className: className.trim(),
      teacherName: teacherName.trim(),
      note: note.trim(),
      createdAtIso: new Date().toISOString().slice(0, 10),
    }),
    [packet.missionId, packet.lkpdCode, className, teacherName, note]
  );

  const assignmentUrl = useMemo(
    () => encodeLkpdAssignmentUrl(assignmentPayload),
    [assignmentPayload]
  );

  useEffect(() => {
    let cancelled = false;
    setQrState('loading');

    QRCode.toDataURL(
      assignmentUrl,
      {
        width: 220,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      },
      (error, dataUrl) => {
        if (cancelled) return;
        if (!error && dataUrl) {
          setQrDataUrl(dataUrl);
          setQrState('ready');
        } else {
          setQrDataUrl('');
          setQrState('error');
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [assignmentUrl]);

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(assignmentUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2200);
        onNotify(
          isId
            ? `Tautan ${packet.lkpdCode} berhasil disalin untuk dibagikan ke kelas.`
            : `${packet.lkpdCode} assignment link copied to clipboard.`
        );
      }
    } catch {
      onNotify(
        isId
          ? 'Gagal menyalin otomatis. Salin tautan langsung dari kotak teks.'
          : 'Automatic copy failed. Copy the URL directly from the text box.'
      );
    }
  };

  const handlePrintWorksheet = () => {
    const html = buildPrintableLkpdHtml({
      packet,
      className: className.trim(),
      teacherName: teacherName.trim(),
      note: note.trim(),
      qrDataUrl: qrState === 'ready' ? qrDataUrl : undefined,
      assignmentUrl,
      language: isId ? 'id' : 'en',
    });

    const printed = printHtmlViaHiddenIframe(html);
    if (!printed) {
      onNotify(
        isId
          ? 'Fitur cetak tidak tersedia di browser ini.'
          : 'Printing is unavailable in this browser environment.'
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* 5-Packet Kurikulum Merdeka Selector Strip */}
      <div
        role="group"
        aria-label={isId ? 'Pilih salah satu dari 5 paket LKPD' : 'Select one of 5 LKPD packets'}
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
              className={`min-h-[44px] px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-colors active:scale-95 cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-electric-600 text-white border-electric-700 font-bold'
                  : 'bg-void-900 border-control text-ink hover:bg-void-850'
              }`}
            >
              <span className="font-mono tabular-nums text-[11px]">{item.lkpdCode}</span>
              <span>{isId ? item.shortLabelId : item.shortLabelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Asymmetric Two-Column Classroom Content: Curriculum Spec (7 cols) + Share Panel (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Kurikulum Merdeka Specification & 100-Point Rubric */}
        <section className="lg:col-span-7 rounded-xl bg-void-900 border border-control p-4 space-y-4 min-w-0">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono tabular-nums text-slate-400">
              <span className="px-2 py-0.5 rounded-md bg-void-950 border border-control text-electric-400 font-bold">
                {packet.lkpdCode}
              </span>
              <span>{packet.fase}</span>
              <span>·</span>
              <span>{isId ? packet.gradeLabelId : packet.gradeLabelEn}</span>
              <span>·</span>
              <span>
                ~{packet.estimatedMinutes} {isId ? 'menit' : 'min'}
              </span>
              <span>·</span>
              <span className="text-emerald-400 font-semibold">KKM {packet.kkmScore}</span>
            </div>

            <h3 className="text-base font-bold text-ink leading-snug">
              {isId ? packet.topicId : packet.topicEn}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              {isId ? packet.capaianPembelajaranId : packet.capaianPembelajaranEn}
            </p>
          </div>

          {/* Key Formula Strip */}
          <div className="px-3 py-2 rounded-lg bg-void-950 border border-ink/15 font-mono text-xs text-amber-400 overflow-x-auto">
            {packet.formulaHighlight}
          </div>

          {/* Tujuan Pembelajaran & P5 */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              {isId ? 'Tujuan Pembelajaran & Profil Pelajar Pancasila' : 'Learning Objectives & Profile'}
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {(isId ? packet.tujuanPembelajaranId : packet.tujuanPembelajaranEn).map((goal, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="font-mono text-electric-400 font-bold shrink-0">{idx + 1}.</span>
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {(isId ? packet.p5DimensionsId : packet.p5DimensionsEn).map((dim) => (
                <span
                  key={dim}
                  className="px-2 py-0.5 rounded-md bg-void-950 border border-ink/15 text-[11px] text-slate-300"
                >
                  {dim}
                </span>
              ))}
            </div>
          </div>

          {/* 100-Point Auto-Grading Rubric Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                {isId ? 'Rubrik Penilaian Otomatis MNA' : 'MNA Auto-Grading Rubric'}
              </h4>
              <span className="text-[11px] font-mono font-bold tabular-nums text-emerald-400">
                {isId ? 'Total 100 Poin' : 'Total 100 Pts'}
              </span>
            </div>

            <div className="rounded-xl bg-void-950 border border-ink/15 divide-y divide-ink/10">
              {packet.rubric.map((criterion) => (
                <div
                  key={criterion.objectiveId}
                  className="px-3 py-2 flex items-center justify-between gap-3 text-xs"
                >
                  <span className="text-ink leading-snug">
                    {isId ? criterion.labelId : criterion.labelEn}
                  </span>
                  <span className="font-mono font-bold tabular-nums text-electric-400 shrink-0">
                    {criterion.weight} {isId ? 'poin' : 'pts'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Reflection Preview */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              {isId ? '2 Pertanyaan Refleksi Siswa' : '2 Student Reflection Questions'}
            </h4>
            <ol className="space-y-1 text-xs text-slate-300 list-decimal list-inside">
              {packet.reflectionPrompts.map((prompt) => (
                <li key={prompt.id} className="leading-relaxed">
                  {isId ? prompt.questionId : prompt.questionEn}
                </li>
              ))}
            </ol>
          </div>

          {/* Classroom Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handlePrintWorksheet}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-void-850 hover:bg-void-800 border border-control text-ink text-xs font-semibold flex items-center gap-2 transition-colors active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-electric-400 shrink-0" aria-hidden="true" />
              <span>{isId ? 'Cetak Lembar LKPD (A4)' : 'Print LKPD Sheet (A4)'}</span>
            </button>

            {mission?.starterCircuitName && (
              <button
                type="button"
                onClick={() =>
                  onLoadStarterToCanvas(mission.starterCircuitName!, assignmentPayload)
                }
                className="min-h-[44px] px-4 py-2 rounded-xl bg-void-850 hover:bg-void-800 border border-control text-ink text-xs font-semibold flex items-center gap-2 transition-colors active:scale-95 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                <span>{isId ? 'Muat Starter ke Kanvas' : 'Load Starter to Canvas'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onStartStudentWorkflow(assignmentPayload)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold flex items-center gap-2 transition-colors active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{isId ? 'Kerjakan sebagai Siswa' : 'Open Student Form'}</span>
            </button>
          </div>
        </section>

        {/* Right: Zero-Backend Teacher Assignment Generator (Link + QR) */}
        <section className="lg:col-span-5 rounded-xl bg-void-900 border border-control p-4 space-y-4 min-w-0">
          <div>
            <h3 className="text-sm font-bold text-ink">
              {isId ? 'Bagikan Tugas ke Kelas (Tanpa Server)' : 'Distribute Assignment (Zero-Backend)'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {isId
                ? 'Isi identitas kelas opsional, lalu tampilkan QR di proyektor atau salin tautan ke grup kelas.'
                : 'Fill optional class metadata, then project the QR code or share the link with your class.'}
            </p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label htmlFor={classInputId} className="block text-xs font-semibold text-ink">
                  {isId ? 'Nama Kelas' : 'Class Name'}
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
                <label htmlFor={teacherInputId} className="block text-xs font-semibold text-ink">
                  {isId ? 'Nama Guru' : 'Teacher Name'}
                </label>
                <input
                  id={teacherInputId}
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  maxLength={60}
                  placeholder={isId ? 'Ibu / Bapak Guru' : 'Teacher name'}
                  className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-void-950 border border-control text-xs text-ink placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor={noteInputId} className="block text-xs font-semibold text-ink">
                {isId ? 'Catatan Tugas (Opsional)' : 'Assignment Note (Optional)'}
              </label>
              <input
                id={noteInputId}
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={160}
                placeholder={
                  isId
                    ? 'Contoh: Kumpulkan kode sebelum jam IPA selesai'
                    : 'Example: Submit your code before class ends'
                }
                className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-void-950 border border-control text-xs text-ink placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* QR Code Output with Loading & Error states (R-27) */}
          <div className="rounded-xl bg-void-950 border border-ink/15 p-3.5 flex flex-col items-center gap-3">
            {qrState === 'loading' && (
              <div className="w-[176px] h-[176px] rounded-xl bg-void-900 border border-control flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-5 h-5 text-electric-400 motion-safe:animate-spin" aria-hidden="true" />
                <span>{isId ? 'Membuat QR...' : 'Generating QR...'}</span>
              </div>
            )}

            {qrState === 'error' && (
              <div className="w-[176px] h-[176px] rounded-xl bg-void-900 border border-red-500/45 p-3 flex flex-col items-center justify-center text-center gap-2 text-xs text-red-400">
                <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>{isId ? 'Gagal membuat QR. Gunakan tautan teks di bawah.' : 'QR failed. Use text link below.'}</span>
              </div>
            )}

            {qrState === 'ready' && qrDataUrl && (
              <div className="p-2.5 rounded-xl bg-white border border-control">
                <img
                  src={qrDataUrl}
                  alt={isId ? `Kode QR tugas ${packet.lkpdCode}` : `${packet.lkpdCode} assignment QR code`}
                  width={168}
                  height={168}
                  className="w-[168px] h-[168px] block"
                />
              </div>
            )}

            <div className="w-full space-y-1.5">
              <label htmlFor={linkOutputId} className="block text-[11px] font-mono text-slate-400">
                {isId ? 'Tautan Tugas Langsung (#lkpd=...)' : 'Direct Assignment Link (#lkpd=...)'}
              </label>
              <input
                id={linkOutputId}
                type="text"
                readOnly
                value={assignmentUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full min-h-[40px] px-2.5 py-1.5 rounded-lg bg-void-900 border border-control font-mono text-[11px] text-slate-300"
              />
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-electric-600 hover:bg-electric-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{isId ? 'Tautan Tugas Tersalin' : 'Assignment Link Copied'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{isId ? 'Salin Tautan Tugas Kelas' : 'Copy Class Assignment Link'}</span>
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
