import { verifySubmissionIntegrity } from './lkpdGrader';
import { LkpdSubmissionRecord } from './lkpdTypes';

export const TEACHER_GRADEBOOK_STORAGE_KEY = 'circuit_sandbox_teacher_gradebook_v1';
export const STUDENT_SUBMISSIONS_STORAGE_KEY = 'circuit_sandbox_student_lkpd_submissions_v1';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function resolveStorage(override?: StorageLike): StorageLike | null {
  if (override) return override;
  if (typeof localStorage !== 'undefined') return localStorage;
  return null;
}

function isValidStoredRecord(item: unknown): item is LkpdSubmissionRecord {
  if (!item || typeof item !== 'object') return false;
  const rec = item as Record<string, unknown>;
  return (
    typeof rec.id === 'string' &&
    typeof rec.lkpdCode === 'string' &&
    typeof rec.missionId === 'string' &&
    typeof rec.studentName === 'string' &&
    typeof rec.score === 'number' &&
    Number.isFinite(rec.score)
  );
}

export function loadGradebookRecords(storageOverride?: StorageLike): LkpdSubmissionRecord[] {
  const storage = resolveStorage(storageOverride);
  if (!storage) return [];

  try {
    const raw = storage.getItem(TEACHER_GRADEBOOK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidStoredRecord).map((rec) => ({
      ...rec,
      isIntegrityValid: verifySubmissionIntegrity(rec),
    }));
  } catch {
    return [];
  }
}

export function saveGradebookRecords(
  records: readonly LkpdSubmissionRecord[],
  storageOverride?: StorageLike
): boolean {
  const storage = resolveStorage(storageOverride);
  if (!storage) return false;

  try {
    storage.setItem(TEACHER_GRADEBOOK_STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}

/**
 * Merges incoming submissions into the gradebook, replacing older attempts by the same student + class + LKPD.
 */
export function mergeGradebookRecords(
  existing: readonly LkpdSubmissionRecord[],
  incoming: readonly LkpdSubmissionRecord[]
): { merged: LkpdSubmissionRecord[]; addedCount: number; updatedCount: number } {
  const map = new Map<string, LkpdSubmissionRecord>();
  const makeKey = (r: LkpdSubmissionRecord) =>
    `${r.lkpdCode}::${r.studentName.trim().toLowerCase()}::${r.className.trim().toLowerCase()}`;

  for (const record of existing) {
    map.set(makeKey(record), record);
  }

  let addedCount = 0;
  let updatedCount = 0;

  for (const record of incoming) {
    const key = makeKey(record);
    if (map.has(key)) {
      updatedCount += 1;
    } else {
      addedCount += 1;
    }
    map.set(key, record);
  }

  const merged = Array.from(map.values()).sort((a, b) =>
    b.submittedAtIso.localeCompare(a.submittedAtIso)
  );

  return { merged, addedCount, updatedCount };
}

export function loadStudentSavedSubmissions(
  storageOverride?: StorageLike
): LkpdSubmissionRecord[] {
  const storage = resolveStorage(storageOverride);
  if (!storage) return [];

  try {
    const raw = storage.getItem(STUDENT_SUBMISSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidStoredRecord) : [];
  } catch {
    return [];
  }
}

export function saveStudentSubmissionHistory(
  record: LkpdSubmissionRecord,
  storageOverride?: StorageLike
): LkpdSubmissionRecord[] {
  const existing = loadStudentSavedSubmissions(storageOverride);
  const { merged } = mergeGradebookRecords(existing, [record]);
  const storage = resolveStorage(storageOverride);
  if (storage) {
    try {
      storage.setItem(STUDENT_SUBMISSIONS_STORAGE_KEY, JSON.stringify(merged.slice(0, 20)));
    } catch {
      // Ignore storage quota errors in restricted browser modes.
    }
  }
  return merged;
}
