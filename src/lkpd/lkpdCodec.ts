import { MISSION_CATALOG } from '../missions/missionCatalog';
import { getLkpdPacketByMissionId, isLkpdMissionId } from './lkpdCatalog';
import { computeGradebookSummary, verifySubmissionIntegrity } from './lkpdGrader';
import {
  LkpdAssignmentPayload,
  LkpdMissionId,
  LkpdPacketDefinition,
  LkpdSubmissionRecord,
} from './lkpdTypes';

export const LKPD_ASSIGNMENT_HASH_PREFIX = '#lkpd=';
export const LKPD_SUBMISSION_HASH_PREFIX = '#lkpd-sub=';
export const SUBMISSION_TOKEN_PREFIX = 'CSLKPD1.';

function toBase64Url(utf8Text: string): string {
  const bytes = new TextEncoder().encode(utf8Text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  const normalized = encoded.trim().replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLength);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function encodeLkpdAssignmentUrl(
  payload: LkpdAssignmentPayload,
  baseUrl?: string
): string {
  const compact = {
    v: 1,
    m: payload.missionId,
    c: payload.className.trim().slice(0, 40),
    t: payload.teacherName.trim().slice(0, 60),
    n: payload.note.trim().slice(0, 160),
    d: payload.createdAtIso,
  };
  const encoded = toBase64Url(JSON.stringify(compact));

  if (baseUrl) {
    return `${baseUrl.replace(/#.*$/, '')}${LKPD_ASSIGNMENT_HASH_PREFIX}${encoded}`;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${window.location.pathname}${LKPD_ASSIGNMENT_HASH_PREFIX}${encoded}`;
  }
  return `${LKPD_ASSIGNMENT_HASH_PREFIX}${encoded}`;
}

export type DecodeAssignmentResult =
  | { isValid: true; payload: LkpdAssignmentPayload }
  | { isValid: false; errorMessage: string };

export function decodeLkpdAssignmentHash(hashOrUrl: string): DecodeAssignmentResult | null {
  if (!hashOrUrl || !hashOrUrl.includes(LKPD_ASSIGNMENT_HASH_PREFIX)) {
    return null;
  }

  try {
    const rawSegment = hashOrUrl.split(LKPD_ASSIGNMENT_HASH_PREFIX)[1]?.split('&')[0]?.trim();
    if (!rawSegment) {
      return { isValid: false, errorMessage: 'Tautan tugas LKPD kosong.' };
    }

    const parsed = JSON.parse(fromBase64Url(rawSegment));
    if (!parsed || typeof parsed !== 'object' || typeof parsed.m !== 'string') {
      return { isValid: false, errorMessage: 'Struktur tautan tugas LKPD tidak dikenali.' };
    }

    if (!isLkpdMissionId(parsed.m)) {
      return { isValid: false, errorMessage: `Kode misi LKPD tidak valid: ${parsed.m}` };
    }

    const packet = getLkpdPacketByMissionId(parsed.m)!;
    return {
      isValid: true,
      payload: {
        version: 1,
        missionId: packet.missionId,
        lkpdCode: packet.lkpdCode,
        className: typeof parsed.c === 'string' ? parsed.c.trim().slice(0, 40) : '',
        teacherName: typeof parsed.t === 'string' ? parsed.t.trim().slice(0, 60) : '',
        note: typeof parsed.n === 'string' ? parsed.n.trim().slice(0, 160) : '',
        createdAtIso: typeof parsed.d === 'string' ? parsed.d : new Date().toISOString(),
      },
    };
  } catch {
    return {
      isValid: false,
      errorMessage: 'Tautan tugas LKPD rusak atau terpotong saat disalin.',
    };
  }
}

export function encodeSubmissionToken(record: LkpdSubmissionRecord): string {
  const compact = {
    v: 1,
    m: record.missionId,
    s: record.studentName.trim().slice(0, 80),
    c: record.className.trim().slice(0, 40),
    a: record.absentNumber.trim().slice(0, 16),
    t: record.teacherName.trim().slice(0, 60),
    sc: Math.round(record.score),
    mx: Math.round(record.maxScore),
    cp: record.criteriaPassedIds,
    tm: [
      record.telemetry.nodeCount,
      record.telemetry.edgeCount,
      Number(record.telemetry.totalPowerWatts.toFixed(2)),
      record.telemetry.isShortCircuit ? 1 : 0,
      record.telemetry.worldMode === 'outside' ? 1 : 0,
    ],
    rf: record.reflections,
    at: record.submittedAtIso,
    vc: record.verificationCode,
  };

  return `${SUBMISSION_TOKEN_PREFIX}${toBase64Url(JSON.stringify(compact))}`;
}

export function encodeSubmissionUrl(
  record: LkpdSubmissionRecord,
  baseUrl?: string
): string {
  const token = encodeSubmissionToken(record);
  if (baseUrl) {
    return `${baseUrl.replace(/#.*$/, '')}${LKPD_SUBMISSION_HASH_PREFIX}${token}`;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${window.location.pathname}${LKPD_SUBMISSION_HASH_PREFIX}${token}`;
  }
  return `${LKPD_SUBMISSION_HASH_PREFIX}${token}`;
}

export function extractSubmissionTokenFromHash(hashOrUrl: string): string | null {
  if (!hashOrUrl || !hashOrUrl.includes(LKPD_SUBMISSION_HASH_PREFIX)) {
    return null;
  }
  const segment = hashOrUrl.split(LKPD_SUBMISSION_HASH_PREFIX)[1]?.split('&')[0]?.trim();
  return segment || null;
}

export type DecodeSubmissionResult =
  | { isValid: true; record: LkpdSubmissionRecord }
  | { isValid: false; errorMessage: string };

function normalizeDecodedSubmission(raw: Record<string, unknown>): DecodeSubmissionResult {
  const missionIdRaw = typeof raw.m === 'string' ? raw.m : typeof raw.missionId === 'string' ? raw.missionId : '';
  if (!isLkpdMissionId(missionIdRaw)) {
    return { isValid: false, errorMessage: 'Kode paket LKPD pada bukti kumpul tidak valid.' };
  }

  const packet = getLkpdPacketByMissionId(missionIdRaw)!;
  const studentName = String(raw.s ?? raw.studentName ?? '').trim().slice(0, 80);
  if (!studentName) {
    return { isValid: false, errorMessage: 'Nama siswa tidak ditemukan pada bukti kumpul.' };
  }

  const className = String(raw.c ?? raw.className ?? '').trim().slice(0, 40);
  const absentNumber = String(raw.a ?? raw.absentNumber ?? '').trim().slice(0, 16);
  const teacherName = String(raw.t ?? raw.teacherName ?? '').trim().slice(0, 60);

  const scoreRaw = Number(raw.sc ?? raw.score);
  const maxScoreRaw = Number(raw.mx ?? raw.maxScore ?? 100);
  if (!Number.isFinite(scoreRaw) || scoreRaw < 0 || scoreRaw > 100) {
    return { isValid: false, errorMessage: 'Skor pada bukti kumpul berada di luar rentang 0-100.' };
  }

  const criteriaPassedRaw = Array.isArray(raw.cp)
    ? raw.cp
    : Array.isArray(raw.criteriaPassedIds)
    ? raw.criteriaPassedIds
    : [];
  const criteriaPassedIds = criteriaPassedRaw.filter((item): item is string => typeof item === 'string');

  let telemetry = {
    nodeCount: 0,
    edgeCount: 0,
    totalPowerWatts: 0,
    isShortCircuit: false,
    worldMode: 'lab' as 'lab' | 'outside',
  };

  if (Array.isArray(raw.tm) && raw.tm.length >= 5) {
    telemetry = {
      nodeCount: Number(raw.tm[0]) || 0,
      edgeCount: Number(raw.tm[1]) || 0,
      totalPowerWatts: Number(raw.tm[2]) || 0,
      isShortCircuit: Boolean(raw.tm[3]),
      worldMode: raw.tm[4] ? 'outside' : 'lab',
    };
  } else if (raw.telemetry && typeof raw.telemetry === 'object') {
    const tObj = raw.telemetry as Record<string, unknown>;
    telemetry = {
      nodeCount: Number(tObj.nodeCount) || 0,
      edgeCount: Number(tObj.edgeCount) || 0,
      totalPowerWatts: Number(tObj.totalPowerWatts) || 0,
      isShortCircuit: Boolean(tObj.isShortCircuit),
      worldMode: tObj.worldMode === 'outside' ? 'outside' : 'lab',
    };
  }

  const rawReflections = (raw.rf ?? raw.reflections) as Record<string, unknown> | undefined;
  const reflections: Record<string, string> = {};
  if (rawReflections && typeof rawReflections === 'object' && !Array.isArray(rawReflections)) {
    for (const [k, v] of Object.entries(rawReflections)) {
      if (typeof v === 'string' && v.trim()) {
        reflections[k] = v.trim().slice(0, 320);
      }
    }
  }

  const submittedAtIso =
    typeof raw.at === 'string'
      ? raw.at
      : typeof raw.submittedAtIso === 'string'
      ? raw.submittedAtIso
      : new Date().toISOString();

  const verificationCode = String(raw.vc ?? raw.verificationCode ?? '').trim();
  const score = Math.round(scoreRaw);
  const maxScore = Number.isFinite(maxScoreRaw) && maxScoreRaw > 0 ? Math.round(maxScoreRaw) : 100;

  const slugName = studentName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20);

  const record: LkpdSubmissionRecord = {
    version: 1,
    id: `${packet.lkpdCode}-${slugName || 'siswa'}-${(verificationCode || '0000').slice(-4)}`,
    lkpdCode: packet.lkpdCode,
    missionId: packet.missionId as LkpdMissionId,
    studentName,
    className,
    absentNumber,
    teacherName,
    score,
    maxScore,
    passedKkm: score >= packet.kkmScore,
    criteriaPassedIds,
    telemetry,
    reflections,
    submittedAtIso,
    verificationCode,
  };

  record.isIntegrityValid = verifySubmissionIntegrity(record);
  return { isValid: true, record };
}

export function decodeSubmissionInput(rawInput: string): DecodeSubmissionResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { isValid: false, errorMessage: 'Masukan kode kumpul kosong.' };
  }

  try {
    if (trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      if (!parsed || typeof parsed !== 'object') {
        return { isValid: false, errorMessage: 'Format JSON bukti kumpul tidak valid.' };
      }
      return normalizeDecodedSubmission(parsed as Record<string, unknown>);
    }

    let token = trimmed;
    if (trimmed.includes(LKPD_SUBMISSION_HASH_PREFIX)) {
      token = trimmed.split(LKPD_SUBMISSION_HASH_PREFIX)[1]?.split(/\s+/)[0] ?? '';
    }

    if (!token.startsWith(SUBMISSION_TOKEN_PREFIX)) {
      return {
        isValid: false,
        errorMessage: `Kode harus diawali ${SUBMISSION_TOKEN_PREFIX} atau tautan #lkpd-sub=.`,
      };
    }

    const base64Body = token.slice(SUBMISSION_TOKEN_PREFIX.length);
    const parsed = JSON.parse(fromBase64Url(base64Body));
    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, errorMessage: 'Isi token bukti kumpul tidak dapat dibaca.' };
    }
    return normalizeDecodedSubmission(parsed as Record<string, unknown>);
  } catch {
    return {
      isValid: false,
      errorMessage: 'Kode bukti kumpul rusak atau terpotong.',
    };
  }
}

export interface BatchParseSubmissionsResult {
  validRecords: LkpdSubmissionRecord[];
  errors: Array<{ line: number; message: string }>;
}

/**
 * Supports pasting multiple WhatsApp/Classroom lines or uploading a JSON array/object of submissions.
 */
export function parseBatchSubmissionInput(rawText: string): BatchParseSubmissionsResult {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      validRecords: [],
      errors: [{ line: 1, message: 'Tempel minimal satu kode bukti kumpul siswa.' }],
    };
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    let parsedJson: unknown = undefined;
    let isValidJson = false;
    try {
      parsedJson = JSON.parse(trimmed);
      isValidJson = true;
    } catch {
      // Brackets can also come from chat timestamps like "[09:14] Student: CSLKPD1...".
      isValidJson = false;
    }

    if (isValidJson) {
      const list = Array.isArray(parsedJson) ? parsedJson : [parsedJson];
      const validRecords: LkpdSubmissionRecord[] = [];
      const errors: Array<{ line: number; message: string }> = [];

      list.forEach((item, index) => {
        if (!item || typeof item !== 'object') {
          errors.push({ line: index + 1, message: 'Item JSON bukan objek bukti kumpul.' });
          return;
        }
        const decoded = normalizeDecodedSubmission(item as Record<string, unknown>);
        if (decoded.isValid) {
          validRecords.push(decoded.record);
        } else {
          errors.push({ line: index + 1, message: decoded.errorMessage });
        }
      });

      return { validRecords, errors };
    }
  }

  const lines = trimmed.split(/\r?\n/);
  const validRecords: LkpdSubmissionRecord[] = [];
  const errors: Array<{ line: number; message: string }> = [];

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) return;

    // Allow lines copied directly from chat that contain surrounding text around the token or URL.
    const urlMatch = line.match(/https?:\/\/\S*#lkpd-sub=CSLKPD1\.[A-Za-z0-9_-]+/);
    const hashMatch = line.match(/#lkpd-sub=CSLKPD1\.[A-Za-z0-9_-]+/);
    const tokenMatch = line.match(/CSLKPD1\.[A-Za-z0-9_-]+/);
    const candidate = urlMatch?.[0] ?? hashMatch?.[0] ?? tokenMatch?.[0] ?? line;

    const decoded = decodeSubmissionInput(candidate);
    if (decoded.isValid) {
      validRecords.push(decoded.record);
    } else {
      errors.push({ line: idx + 1, message: decoded.errorMessage });
    }
  });

  return { validRecords, errors };
}

function escapeCsvCell(rawValue: string | number | boolean): string {
  const str = String(rawValue ?? '');
  // Neutralize spreadsheet formula injection characters (=, +, -, @, tab, CR) on cell start.
  const neutralized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  if (/[",\r\n]/.test(neutralized)) {
    return `"${neutralized.replace(/"/g, '""')}"`;
  }
  return neutralized;
}

export function generateGradebookCsv(
  records: readonly LkpdSubmissionRecord[],
  language: 'id' | 'en' = 'id'
): string {
  const isId = language === 'id';
  const headers = isId
    ? [
        'No',
        'Kode LKPD',
        'Nama Siswa',
        'Kelas',
        'No Absen',
        'Nilai',
        'Status KKM',
        'Kriteria Lulus',
        'Daya Total (W)',
        'Korsleting',
        'Integritas Kode',
        'Kode Verifikasi',
        'Refleksi 1',
        'Refleksi 2',
        'Waktu Kumpul',
      ]
    : [
        'No',
        'LKPD Code',
        'Student Name',
        'Class',
        'Roll No',
        'Score',
        'Pass Status',
        'Criteria Passed',
        'Total Power (W)',
        'Short Circuit',
        'Code Integrity',
        'Verification Code',
        'Reflection 1',
        'Reflection 2',
        'Submitted At',
      ];

  const rows = records.map((record, index) => [
    index + 1,
    record.lkpdCode,
    record.studentName,
    record.className || '-',
    record.absentNumber || '-',
    record.score,
    record.passedKkm ? (isId ? 'TUNTAS' : 'PASS') : isId ? 'REMEDIAL' : 'RETRY',
    record.criteriaPassedIds.length,
    record.telemetry.totalPowerWatts.toFixed(2),
    record.telemetry.isShortCircuit ? (isId ? 'Ya' : 'Yes') : isId ? 'Tidak' : 'No',
    record.isIntegrityValid === false
      ? isId
        ? 'Periksa Manual'
        : 'Needs Review'
      : isId
      ? 'Terverifikasi'
      : 'Verified',
    record.verificationCode,
    record.reflections.ref_1 ?? '',
    record.reflections.ref_2 ?? '',
    record.submittedAtIso,
  ]);

  const csvBody = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\r\n');

  // UTF-8 BOM ensures Excel opens Indonesian text cleanly without mojibake.
  return `\uFEFF${csvBody}`;
}

export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildPrintableLkpdHtml(params: {
  packet: LkpdPacketDefinition;
  className: string;
  teacherName: string;
  note: string;
  qrDataUrl?: string;
  assignmentUrl?: string;
  language: 'id' | 'en';
}): string {
  const { packet, className, teacherName, note, qrDataUrl, assignmentUrl, language } = params;
  const isId = language === 'id';
  const mission = MISSION_CATALOG.find((m) => m.id === packet.missionId);
  const steps = mission ? (isId ? mission.instructionsId : mission.instructionsEn) : [];
  const goals = isId ? packet.tujuanPembelajaranId : packet.tujuanPembelajaranEn;
  const p5 = isId ? packet.p5DimensionsId : packet.p5DimensionsEn;

  const title = isId ? packet.topicId : packet.topicEn;
  const cp = isId ? packet.capaianPembelajaranId : packet.capaianPembelajaranEn;

  const rubricRows = packet.rubric
    .map(
      (item, idx) =>
        `<tr><td>${idx + 1}</td><td>${escapeHtml(isId ? item.labelId : item.labelEn)}</td><td style="text-align:right;font-family:monospace;">${item.weight}</td><td style="text-align:center;">[ &nbsp; ]</td></tr>`
    )
    .join('');

  const reflectionBlocks = packet.reflectionPrompts
    .map(
      (prompt, idx) => `
      <div class="ref-box">
        <p class="ref-q">${idx + 1}. ${escapeHtml(isId ? prompt.questionId : prompt.questionEn)}</p>
        <div class="write-line"></div>
        <div class="write-line"></div>
      </div>`
    )
    .join('');

  const qrSection = qrDataUrl
    ? `<div class="qr-box">
        <img src="${escapeHtml(qrDataUrl)}" width="104" height="104" alt="QR LKPD" />
        <div>
          <strong>${isId ? 'Buka di Circuit Sandbox (Bisa Offline)' : 'Open in Circuit Sandbox (Works Offline)'}</strong>
          <p class="small-note">${isId ? 'Pindai QR ini untuk membuka tugas praktikum langsung pada HP atau Chromebook siswa.' : 'Scan this QR code to open this assignment directly on a student phone or Chromebook.'}</p>
          ${assignmentUrl ? `<p class="url-line">${escapeHtml(assignmentUrl.slice(0, 96))}${assignmentUrl.length > 96 ? '...' : ''}</p>` : ''}
        </div>
      </div>`
    : '';

  return `<!doctype html>
<html lang="${isId ? 'id' : 'en'}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(packet.lkpdCode)} - ${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    body { font-family: "Plus Jakarta Sans", "Segoe UI", Arial, sans-serif; color: #0f172a; font-size: 11pt; line-height: 1.45; margin: 0; }
    header { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
    .code { font-family: monospace; font-size: 10pt; font-weight: 700; letter-spacing: 0.05em; }
    h1 { font-size: 14pt; margin: 2px 0 4px 0; }
    h2 { font-size: 11pt; margin: 12px 0 6px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; border: 1px solid #94a3b8; border-radius: 6px; padding: 8px 10px; font-size: 10pt; margin-bottom: 10px; }
    .formula { font-family: monospace; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 10px; border-radius: 6px; font-size: 10pt; margin: 8px 0; }
    ul, ol { margin: 4px 0 8px 18px; padding: 0; }
    li { margin-bottom: 3px; }
    table { width: 100%; border-collapse: collapse; font-size: 10pt; margin-top: 4px; }
    th, td { border: 1px solid #94a3b8; padding: 5px 8px; text-align: left; }
    th { background: #f1f5f9; }
    .ref-box { margin-bottom: 10px; }
    .ref-q { margin: 0 0 6px 0; font-weight: 600; font-size: 10pt; }
    .write-line { border-bottom: 1px dotted #64748b; height: 22px; }
    .qr-box { display: flex; gap: 12px; align-items: center; border: 1px solid #94a3b8; border-radius: 6px; padding: 8px; margin-top: 12px; page-break-inside: avoid; }
    .small-note { font-size: 9pt; color: #334155; margin: 2px 0; }
    .url-line { font-family: monospace; font-size: 8pt; color: #475569; margin: 2px 0 0 0; word-break: break-all; }
  </style>
</head>
<body>
  <header>
    <div>
      <div class="code">${escapeHtml(packet.lkpdCode)} | ${escapeHtml(packet.fase)} | ${escapeHtml(isId ? packet.gradeLabelId : packet.gradeLabelEn)}</div>
      <h1>${escapeHtml(title)}</h1>
      <div class="small-note">Circuit Sandbox (Glow-Flow Lab) | ${isId ? 'Profil Pelajar Pancasila' : 'Student Profile'}: ${escapeHtml(p5.join(', '))}</div>
    </div>
    <div style="text-align:right;font-size:9.5pt;font-family:monospace;">
      <div>${isId ? 'Waktu' : 'Time'}: ~${packet.estimatedMinutes} ${isId ? 'menit' : 'min'}</div>
      <div>KKM: ${packet.kkmScore} / 100</div>
    </div>
  </header>

  <div class="meta-grid">
    <div><strong>${isId ? 'Nama Siswa' : 'Student Name'}:</strong> ________________________</div>
    <div><strong>${isId ? 'Kelas / Absen' : 'Class / Roll'}:</strong> ${escapeHtml(className || '__________')} / ____</div>
    <div><strong>${isId ? 'Guru Pengampu' : 'Teacher'}:</strong> ${escapeHtml(teacherName || '________________________')}</div>
    <div><strong>${isId ? 'Tanggal' : 'Date'}:</strong> ________________________</div>
  </div>

  ${note ? `<p class="small-note"><strong>${isId ? 'Catatan Guru' : 'Teacher Note'}:</strong> ${escapeHtml(note)}</p>` : ''}

  <h2>${isId ? 'A. Capaian & Tujuan Pembelajaran (Kurikulum Merdeka)' : 'A. Learning Outcomes & Objectives'}</h2>
  <p style="margin:4px 0 6px 0;font-size:10pt;">${escapeHtml(cp)}</p>
  <ul>${goals.map((g) => `<li>${escapeHtml(g)}</li>`).join('')}</ul>
  <div class="formula">${escapeHtml(packet.formulaHighlight)}</div>

  <h2>${isId ? 'B. Langkah Praktikum di Circuit Sandbox' : 'B. Lab Steps in Circuit Sandbox'}</h2>
  <ol>${steps.map((s) => `<li>${escapeHtml(s.replace(/^\d+\.\s*/, ''))}</li>`).join('')}</ol>

  <h2>${isId ? 'C. Rubrik Penilaian Otomatis (Total 100 Poin)' : 'C. Auto-Grading Rubric (Total 100 Points)'}</h2>
  <table>
    <thead>
      <tr>
        <th style="width:32px;">No</th>
        <th>${isId ? 'Kriteria Pengamatan Rangkaian' : 'Circuit Verification Criterion'}</th>
        <th style="width:72px;text-align:right;">${isId ? 'Bobot' : 'Weight'}</th>
        <th style="width:72px;text-align:center;">${isId ? 'Status' : 'Check'}</th>
      </tr>
    </thead>
    <tbody>
      ${rubricRows}
    </tbody>
  </table>

  <h2>${isId ? 'D. Pertanyaan Refleksi Konseptual' : 'D. Conceptual Reflection Questions'}</h2>
  ${reflectionBlocks}

  ${qrSection}
</body>
</html>`;
}

export function buildPrintableGradebookHtml(params: {
  records: readonly LkpdSubmissionRecord[];
  filterLabel: string;
  language: 'id' | 'en';
}): string {
  const { records, filterLabel, language } = params;
  const isId = language === 'id';
  const summary = computeGradebookSummary(records);

  const tableRows = records
    .map(
      (r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td style="font-family:monospace;">${escapeHtml(r.lkpdCode)}</td>
        <td><strong>${escapeHtml(r.studentName)}</strong></td>
        <td>${escapeHtml(r.className || '-')}</td>
        <td style="font-family:monospace;text-align:right;">${r.score}</td>
        <td>${r.passedKkm ? (isId ? 'TUNTAS' : 'PASS') : isId ? 'REMEDIAL' : 'RETRY'}</td>
        <td style="font-family:monospace;font-size:9pt;">${escapeHtml(r.verificationCode)}</td>
      </tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="${isId ? 'id' : 'en'}">
<head>
  <meta charset="utf-8" />
  <title>${isId ? 'Rekap Nilai Praktikum LKPD' : 'LKPD Lab Gradebook Report'}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    body { font-family: "Plus Jakarta Sans", "Segoe UI", Arial, sans-serif; color: #0f172a; font-size: 10.5pt; line-height: 1.4; }
    header { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
    h1 { font-size: 14pt; margin: 0 0 4px 0; }
    .stats { display: flex; gap: 16px; margin-bottom: 12px; font-family: monospace; font-size: 10pt; }
    table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
    th, td { border: 1px solid #94a3b8; padding: 5px 8px; text-align: left; }
    th { background: #f1f5f9; }
  </style>
</head>
<body>
  <header>
    <h1>${isId ? 'Rekap Nilai Praktikum Listrik (Circuit Sandbox)' : 'Circuit Sandbox Lab Gradebook Report'}</h1>
    <div>${isId ? 'Cakupan' : 'Scope'}: ${escapeHtml(filterLabel)} | ${isId ? 'Dicetak' : 'Printed'}: ${escapeHtml(new Date().toLocaleString(isId ? 'id-ID' : 'en-US'))}</div>
  </header>
  <div class="stats">
    <div>${isId ? 'Pengumpul' : 'Submissions'}: ${summary.totalSubmissions}</div>
    <div>${isId ? 'Rata-rata' : 'Average'}: ${summary.averageScore}</div>
    <div>${isId ? 'Ketuntasan' : 'Pass Rate'}: ${summary.passRatePercent}% (${summary.passedCount}/${summary.totalSubmissions})</div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:28px;">No</th>
        <th style="width:72px;">LKPD</th>
        <th>${isId ? 'Nama Siswa' : 'Student Name'}</th>
        <th style="width:72px;">${isId ? 'Kelas' : 'Class'}</th>
        <th style="width:60px;text-align:right;">${isId ? 'Nilai' : 'Score'}</th>
        <th style="width:82px;">Status</th>
        <th style="width:110px;">${isId ? 'Kode Verifikasi' : 'Code'}</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
</body>
</html>`;
}

export function triggerTextFileDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
  }, 100);
}

/**
 * Prints generated HTML via a hidden iframe so popup blockers and the 100dvh overflow-hidden app shell never interfere.
 */
export function printHtmlViaHiddenIframe(htmlDocument: string): boolean {
  if (typeof document === 'undefined') return false;
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        iframe.parentNode?.removeChild(iframe);
      }, 1000);
    }
  };

  iframe.srcdoc = htmlDocument;
  document.body.appendChild(iframe);
  return true;
}
