import React, { useEffect, useRef, useState } from 'react';
import { BookOpenCheck, ClipboardCheck, FileSpreadsheet } from 'lucide-react';
import { LkpdModalTab, useCircuitStore } from '../../../store/useCircuitStore';
import { useModalFocusTrap } from '../../../hooks/useModalKeyboardClose';
import { decodeSubmissionInput } from '../../../lkpd/lkpdCodec';
import {
  loadGradebookRecords,
  mergeGradebookRecords,
  saveGradebookRecords,
} from '../../../lkpd/lkpdGradebookStorage';
import {
  LkpdAssignmentPayload,
  LkpdMissionId,
  LkpdSubmissionRecord,
} from '../../../lkpd/lkpdTypes';
import { LabModalHeader } from '../common/LabModalHeader';
import { LkpdGradebookTab } from './LkpdGradebookTab';
import { LkpdPacketsTab } from './LkpdPacketsTab';
import { LkpdStudentSubmitTab } from './LkpdStudentSubmitTab';

export interface LkpdTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LkpdTeacherModal: React.FC<LkpdTeacherModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalFocusTrap(isOpen, dialogRef, onClose);

  const nodes = useCircuitStore((state) => state.nodes);
  const edges = useCircuitStore((state) => state.edges);
  const simulation = useCircuitStore((state) => state.simulation);
  const worldMode = useCircuitStore((state) => state.worldMode);
  const language = useCircuitStore((state) => state.language);
  const loadPreset = useCircuitStore((state) => state.loadPreset);
  const notify = useCircuitStore((state) => state.notify);

  const activeLkpdAssignment = useCircuitStore((state) => state.activeLkpdAssignment);
  const setActiveLkpdAssignment = useCircuitStore((state) => state.setActiveLkpdAssignment);
  const lkpdPreferredTab = useCircuitStore((state) => state.lkpdPreferredTab);
  const lkpdPreferredMissionId = useCircuitStore((state) => state.lkpdPreferredMissionId);
  const pendingLkpdSubmissionToken = useCircuitStore((state) => state.pendingLkpdSubmissionToken);
  const consumePendingLkpdSubmissionToken = useCircuitStore(
    (state) => state.consumePendingLkpdSubmissionToken
  );

  const isId = language === 'id';

  const [activeTab, setActiveTab] = useState<LkpdModalTab>(lkpdPreferredTab);
  const [selectedMissionId, setSelectedMissionId] = useState<LkpdMissionId>(lkpdPreferredMissionId);
  const [gradebookRecords, setGradebookRecords] = useState<LkpdSubmissionRecord[]>(() =>
    loadGradebookRecords()
  );

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(lkpdPreferredTab);
    setSelectedMissionId(lkpdPreferredMissionId);
  }, [isOpen, lkpdPreferredTab, lkpdPreferredMissionId]);

  // Auto-import student submission when teacher opens a #lkpd-sub= link directly.
  useEffect(() => {
    if (!isOpen || !pendingLkpdSubmissionToken) return;
    const decoded = decodeSubmissionInput(pendingLkpdSubmissionToken);
    consumePendingLkpdSubmissionToken();

    if (decoded.isValid) {
      setGradebookRecords((prev) => {
        const { merged } = mergeGradebookRecords(prev, [decoded.record]);
        saveGradebookRecords(merged);
        return merged;
      });
      setActiveTab('gradebook');
      notify(
        isId
          ? `Bukti kumpul ${decoded.record.studentName} (${decoded.record.lkpdCode}: ${decoded.record.score}/100) ditambahkan ke rekap.`
          : `Imported ${decoded.record.studentName} (${decoded.record.lkpdCode}: ${decoded.record.score}/100) into gradebook.`
      );
    } else {
      setActiveTab('gradebook');
      notify(decoded.errorMessage);
    }
  }, [isOpen, pendingLkpdSubmissionToken, consumePendingLkpdSubmissionToken, notify, isId]);

  if (!isOpen) return null;

  const handleImportRecords = (incoming: LkpdSubmissionRecord[]) => {
    let resultCounts = { addedCount: 0, updatedCount: 0 };
    setGradebookRecords((prev) => {
      const { merged, addedCount, updatedCount } = mergeGradebookRecords(prev, incoming);
      resultCounts = { addedCount, updatedCount };
      saveGradebookRecords(merged);
      return merged;
    });
    return resultCounts;
  };

  const handleDeleteRecord = (recordId: string) => {
    setGradebookRecords((prev) => {
      const next = prev.filter((item) => item.id !== recordId);
      saveGradebookRecords(next);
      return next;
    });
  };

  const handleClearAllRecords = () => {
    setGradebookRecords([]);
    saveGradebookRecords([]);
    notify(isId ? 'Rekap nilai lokal dibersihkan.' : 'Local gradebook cleared.');
  };

  const handleStartStudentWorkflow = (assignment: LkpdAssignmentPayload) => {
    setActiveLkpdAssignment(assignment);
    setSelectedMissionId(assignment.missionId);
    setActiveTab('student');
  };

  const handleLoadStarterWithAssignment = (
    starterPresetName: string,
    assignment?: LkpdAssignmentPayload
  ) => {
    if (assignment) {
      setActiveLkpdAssignment(assignment);
    }
    loadPreset(starterPresetName as Parameters<typeof loadPreset>[0]);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-scrim/75 p-0 sm:p-4 font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lkpd-teacher-modal-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-5xl max-h-[92dvh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-void-900 border border-control shadow-2xl overflow-hidden text-ink"
        onClick={(e) => e.stopPropagation()}
      >
        <LabModalHeader
          titleId="lkpd-teacher-modal-title"
          eyebrow={isId ? 'KURIKULUM MERDEKA · FASE D' : 'KURIKULUM MERDEKA · GRADE 9'}
          title={isId ? 'LKPD & Mode Guru' : 'LKPD & Teacher Mode'}
          subtitle={
            isId
              ? '5 paket lembar kerja praktikum, nilai otomatis MNA, dan rekap kelas tanpa server'
              : '5 lab worksheets, live MNA auto-grading, and zero-backend class gradebook'
          }
          onClose={onClose}
          closeLabel={isId ? 'Tutup dialog LKPD dan Mode Guru' : 'Close LKPD and Teacher Mode'}
        />

        {/* 3-Tab Navigation Bar */}
        <div
          role="tablist"
          aria-label={isId ? 'Bagian LKPD dan Mode Guru' : 'LKPD and Teacher Mode sections'}
          className="px-3 sm:px-5 py-2 bg-void-950 border-b border-ink/15 flex items-center gap-2 overflow-x-auto shrink-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'packets'}
            onClick={() => setActiveTab('packets')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
              activeTab === 'packets'
                ? 'bg-electric-600 text-white border-electric-700 font-bold'
                : 'bg-void-900 border-control text-ink hover:bg-void-850'
            }`}
          >
            <BookOpenCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{isId ? '5 Paket LKPD' : '5 LKPD Packets'}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'student'}
            onClick={() => setActiveTab('student')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
              activeTab === 'student'
                ? 'bg-electric-600 text-white border-electric-700 font-bold'
                : 'bg-void-900 border-control text-ink hover:bg-void-850'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{isId ? 'Kumpul Siswa' : 'Student Submit'}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'gradebook'}
            onClick={() => setActiveTab('gradebook')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
              activeTab === 'gradebook'
                ? 'bg-electric-600 text-white border-electric-700 font-bold'
                : 'bg-void-900 border-control text-ink hover:bg-void-850'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              {isId ? 'Rekap Guru' : 'Gradebook'}
              {gradebookRecords.length > 0 && (
                <span className="ml-1.5 font-mono tabular-nums">({gradebookRecords.length})</span>
              )}
            </span>
          </button>
        </div>

        {/* Scrollable Active Tab Content */}
        <div role="tabpanel" className="flex-1 overflow-y-auto p-4 sm:p-5 bg-void-950">
          {activeTab === 'packets' && (
            <LkpdPacketsTab
              selectedMissionId={selectedMissionId}
              onSelectMissionId={setSelectedMissionId}
              onStartStudentWorkflow={handleStartStudentWorkflow}
              onLoadStarterToCanvas={handleLoadStarterWithAssignment}
              onNotify={notify}
              isId={isId}
            />
          )}

          {activeTab === 'student' && (
            <LkpdStudentSubmitTab
              selectedMissionId={selectedMissionId}
              onSelectMissionId={setSelectedMissionId}
              activeAssignment={activeLkpdAssignment}
              onClearAssignment={() => setActiveLkpdAssignment(null)}
              nodes={nodes}
              edges={edges}
              simulation={simulation}
              worldMode={worldMode}
              onCloseToCanvas={onClose}
              onLoadStarterToCanvas={(starter) => handleLoadStarterWithAssignment(starter)}
              onNotify={notify}
              isId={isId}
            />
          )}

          {activeTab === 'gradebook' && (
            <LkpdGradebookTab
              records={gradebookRecords}
              onImportRecords={handleImportRecords}
              onDeleteRecord={handleDeleteRecord}
              onClearAllRecords={handleClearAllRecords}
              onNotify={notify}
              isId={isId}
            />
          )}
        </div>
      </div>
    </div>
  );
};
