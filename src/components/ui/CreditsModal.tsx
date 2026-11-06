import React from 'react';
import {
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { useModalKeyboardClose } from '../../hooks/useModalKeyboardClose';
import { LabModalHeader } from './common/LabModalHeader';
import { CreditsScienceReferenceSection } from './credits/CreditsScienceReferenceSection';

export interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ContributorMember {
  name: string;
  roleId: string;
  roleEn: string;
  isLead?: boolean;
  isMassiveContributor?: boolean;
  nisn?: string;
  email?: string;
  phone?: string;
  noteId?: string;
  noteEn?: string;
}

export const TEAM_CONTRIBUTORS: ReadonlyArray<ContributorMember> = [
  {
    name: 'KENZIE RAKA ROMERO',
    roleId: 'Ketua Tim • Brainstormer, Asset Creator, Developer & Lead Architect',
    roleEn: 'Team Lead • Brainstormer, Asset Creator, Developer & Lead Architect',
    isLead: true,
    nisn: '0128794397',
    email: 'rakaengineer@gmail.com',
    phone: '082330395585',
  },
  {
    name: 'ACHMAD SANDY PRATAMA',
    roleId: 'Kontributor Utama • Lead Mobile Tester & Real-World Bug Hunter',
    roleEn: 'Massive Contributor • Lead Mobile Tester & Real-World Bug Hunter',
    isMassiveContributor: true,
    noteId:
      'Kontributor terbesar: Pengujian intensif di perangkat mobile nyata, verifikasi responsivitas antarmuka, dan penemu bug kritis proyek.',
    noteEn:
      'Massive contributor: Intensive real-world mobile device testing, interface verification, and critical bug hunting.',
  },
  {
    name: 'KHAIZURAN HAMIZAN SETYAWAN',
    roleId: 'Co-Designer & Kontributor Riset Dokumentasi',
    roleEn: 'Co-Designer & Documentation Research Contributor',
  },
  {
    name: 'MUHAMMAD ANDHIKA PARAHITA',
    roleId: 'Tester Rangkaian & Simulasi',
    roleEn: 'Circuit & Simulation Tester',
  },
  {
    name: 'MUHAMMAD SYAFIK AL ROSYID',
    roleId: 'Penguji Penjaminan Mutu (QA) & Skenario',
    roleEn: 'Quality Assurance & Scenario Tester',
  },
];

export interface AiToolHarnessBadge {
  labelId: string;
  labelEn: string;
}

export const AI_TOOLS_AND_HARNESS_BADGES: ReadonlyArray<AiToolHarnessBadge> = [
  {
    labelId: 'Google Antigravity (Harness Rekayasa)',
    labelEn: 'Google Antigravity (Engineering Harness)',
  },
  {
    labelId: 'Nano Banana 2.1',
    labelEn: 'Nano Banana 2.1',
  },
  {
    labelId: 'Gemini 3.8 Flash High',
    labelEn: 'Gemini 3.8 Flash High',
  },
  {
    labelId: 'Gemini 4 Argon High',
    labelEn: 'Gemini 4 Argon High',
  },
  {
    labelId: 'Claude Sonnet 5.5 High',
    labelEn: 'Claude Sonnet 5.5 High',
  },
  {
    labelId: 'DeepSeek V4.1 1017',
    labelEn: 'DeepSeek V4.1 1017',
  },
];

export const AI_TOOLS_AND_HARNESS: ReadonlyArray<string> = AI_TOOLS_AND_HARNESS_BADGES.map(
  (badge) => badge.labelEn
);

/**
 * Developer & Contributors Modal (`CreditsModal.tsx`).
 *
 * Displays the official SMPN 12 Surabaya innovation team, contributor roles,
 * advisor acknowledgment, and originality / engineering tools statement.
 *
 * Time Complexity: O(N) over static contributor and citation lists.
 */
export const CreditsModal: React.FC<CreditsModalProps> = ({ isOpen, onClose }) => {
  useModalKeyboardClose(isOpen, onClose);
  const language = useCircuitStore((state) => state.language);
  const isId = language === 'id';

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="credits-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-void-950/80 backdrop-blur-md p-3 sm:p-4 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90dvh] flex flex-col rounded-2xl bg-void-900 border border-white/10 shadow-2xl text-slate-100 overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <LabModalHeader
          titleId="credits-modal-title"
          eyebrow="SMPN 12 SURABAYA · CIRCUIT SANDBOX"
          title={isId ? 'Tim Pengembang & Kontributor' : 'Developers & Contributors'}
          onClose={onClose}
          closeLabel={isId ? 'Tutup' : 'Close'}
        />

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* School & Advisor Banner */}
          <div className="rounded-xl bg-void-950 border border-white/10 p-3.5 flex flex-wrap items-center justify-between gap-2.5">
            <div>
              <div className="text-xs font-bold text-slate-100">
                SMP Negeri 12 Surabaya
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {isId
                  ? 'Inovasi Laboratorium Fisika Virtual & Energi Terbarukan'
                  : 'Virtual Physics Lab & Renewable Energy Innovation'}
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-void-900 border border-white/10 text-[10px] font-mono font-semibold text-slate-300">
              {isId ? 'Pembimbing: Ibu Uki' : 'Advisor: Mrs. Uki'}
            </span>
          </div>

          {/* Contributors Editorial Roster */}
          <div className="space-y-2.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-0.5">
              {isId
                ? 'Daftar Developer & Kontributor'
                : 'Developer & Contributor Roster'}
            </div>

            <div className="space-y-2.5">
              {TEAM_CONTRIBUTORS.map((member) => (
                <div
                  key={member.name}
                  className={`rounded-xl p-3.5 border transition-colors ${
                    member.isLead
                      ? 'bg-void-950 border-electric-500/35'
                      : 'bg-void-950/80 border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2 flex-wrap">
                        <span>{member.name}</span>
                        {member.isLead && (
                          <span className="px-2 py-0.5 rounded-md bg-electric-500/15 border border-electric-500/30 text-[9px] font-mono font-semibold text-electric-300 uppercase">
                            {isId ? 'Ketua & Kreator Utama' : 'Lead Creator'}
                          </span>
                        )}
                        {member.isMassiveContributor && (
                          <span className="px-2 py-0.5 rounded-md bg-void-900 border border-white/15 text-[9px] font-mono font-semibold text-slate-300 uppercase">
                            {isId ? 'Kontributor Utama' : 'Massive Contributor'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-300 mt-1 font-medium">
                        {isId ? member.roleId : member.roleEn}
                      </div>
                      {member.noteId && (
                        <div className="text-[11px] text-slate-400 mt-2 leading-relaxed border-l-2 border-electric-500/40 pl-2.5">
                          {isId ? member.noteId : member.noteEn}
                        </div>
                      )}
                    </div>
                  </div>

                  {member.isLead && (
                    <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-slate-300">
                      <span>NISN: {member.nisn}</span>
                      <span className="inline-flex items-center gap-1 text-slate-300">
                        <Mail className="w-3 h-3 text-electric-400" />
                        {member.email}
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-300">
                        <Phone className="w-3 h-3 text-electric-400" />
                        {member.phone}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Originality & Zero-Plagiarism Declaration */}
          <div className="rounded-xl bg-void-950 border border-white/10 p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
              <ShieldCheck className="w-4 h-4 text-electric-400 shrink-0" />
              <span>
                {isId
                  ? 'Pernyataan Orisinalitas & Bebas Plagiarisme'
                  : 'Originality & Zero-Plagiarism Statement'}
              </span>
            </div>
            {isId ? (
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Proyek ini dirancang dan dibangun secara orisinal oleh{' '}
                <strong className="text-slate-100">KENZIE RAKA ROMERO</strong> (SMPN 12
                Surabaya) tanpa plagiarisme terhadap karya pihak mana pun. Seluruh
                konsep kreatif, mekanika fisika dua dunia, dan skenario interaktif
                berasal murni dari gagasan penulis.
              </p>
            ) : (
              <p className="text-[11px] text-slate-300 leading-relaxed">
                This project was originally conceived, designed, and built by{' '}
                <strong className="text-slate-100">KENZIE RAKA ROMERO</strong> with
                zero plagiarism of any other projects. All creative concepts, dual-world
                physics mechanics, and interactive scenarios originate from the author&apos;s
                own vision.
              </p>
            )}
          </div>

          {/* Tools, Technologies & AI Harness Section */}
          <div className="rounded-xl bg-void-950 border border-white/10 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-100">
                {isId
                  ? 'Teknologi & Harness Pengembangan'
                  : 'Tools, Technologies & Harness'}
              </span>
              <span className="text-[10px] font-mono text-electric-400">
                Google Antigravity
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {isId ? (
                <>
                  Beberapa perangkat dan teknologi digunakan untuk membantu
                  mewujudkan proyek ini. Harness pengembangan yang digunakan
                  untuk membangun aplikasi ini adalah{' '}
                  <strong className="text-slate-200">Google Antigravity</strong>:
                </>
              ) : (
                <>
                  Some tools and technologies were used to assist in realizing this
                  project. The development harness used to build this is{' '}
                  <strong className="text-slate-200">Google Antigravity</strong>:
                </>
              )}
            </p>

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {AI_TOOLS_AND_HARNESS_BADGES.map((badge) => (
                <span
                  key={badge.labelEn}
                  className="inline-flex items-center px-2.5 py-1 rounded-md bg-void-900 border border-white/10 text-[10px] font-mono text-slate-300"
                >
                  {isId ? badge.labelId : badge.labelEn}
                </span>
              ))}
            </div>
          </div>

          {/* Extracted Science Reference & 19 Datasheet Citations Section */}
          <CreditsScienceReferenceSection isId={isId} />
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-white/10 bg-void-950 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[10px] font-mono text-slate-400">
            © 2026 Kenzie Raka Romero · SMPN 12 Surabaya
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-4 py-1.5 rounded-xl bg-electric-500 hover:bg-electric-400 text-void-950 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            {isId ? 'Tutup' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
