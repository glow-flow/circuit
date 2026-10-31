import React from 'react';
import {
  Award,
  BookOpen,
  Code2,
  Cpu,
  GraduationCap,
  Lightbulb,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';
import {
  BULB_DATASHEET_CITATIONS,
  COMPONENT_DATASHEET_CITATIONS,
  PLN_TARIFF_CITATION,
} from '../../constants/datasheetCitations';

export interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ContributorMember {
  name: string;
  roleId: string;
  roleEn: string;
  isLead?: boolean;
  nisn?: string;
  email?: string;
  phone?: string;
}

export const TEAM_CONTRIBUTORS: ReadonlyArray<ContributorMember> = [
  {
    name: 'KENZIE RAKA ROMERO',
    roleId: 'Ketua Tim • Brainstormer, Asset Creator, Developer & Bug Finder',
    roleEn: 'Team Lead • Brainstormer, Asset Creator, Developer & Bug Finder',
    isLead: true,
    nisn: '0128794397',
    email: 'rakaengineer@gmail.com',
    phone: '082330395585',
  },
  {
    name: 'ACHMAD SANDY PRATAMA',
    roleId: 'Bug Finder & Tester',
    roleEn: 'Bug Finder & Tester',
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
    roleId: 'Quality Assurance & Scenario Tester',
    roleEn: 'Quality Assurance & Scenario Tester',
  },
];

export const AI_TOOLS_AND_HARNESS: ReadonlyArray<string> = [
  'Google Antigravity (Engineering Harness)',
  'Nano Banana 2.1',
  'Gemini 3.8 Flash High',
  'Gemini 4 Argon High',
  'Claude Sonnet 5.5 High',
  'DeepSeek V4.1 1017',
];

/**
 * Developer & Contributors Modal (`CreditsModal.tsx`).
 *
 * Displays the official SMPN 12 Surabaya innovation team, contributor roles,
 * advisor acknowledgment, and originality / engineering tools statement.
 *
 * Time Complexity: O(1) over static contributor metadata.
 */
export const CreditsModal: React.FC<CreditsModalProps> = ({ isOpen, onClose }) => {
  const language = useCircuitStore((state) => state.language);
  const isId = language === 'id';

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="credits-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[88dvh] flex flex-col rounded-2xl bg-void-900 border border-electric-500/35 shadow-[0_0_50px_rgba(0,0,0,0.85),0_0_24px_rgba(14,165,233,0.15)] text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-white/10 bg-void-950 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-electric-500/15 border border-electric-500/35 flex items-center justify-center text-electric-400 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2
                id="credits-modal-title"
                className="text-sm sm:text-base font-bold text-white tracking-tight truncate"
              >
                {isId
                  ? 'Tim Pengembang & Kontributor'
                  : 'Developers & Contributors'}
              </h2>
              <p className="text-[11px] text-electric-400 font-mono truncate">
                SMPN 12 SURABAYA • CIRCUIT SANDBOX
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isId ? 'Tutup' : 'Close'}
            className="p-1.5 rounded-lg bg-void-850 hover:bg-void-800 border border-white/10 text-slate-400 hover:text-white transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* School & Advisor Banner */}
          <div className="rounded-xl bg-void-950 border border-white/10 p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-100">
                  SMP Negeri 12 Surabaya
                </div>
                <div className="text-[11px] text-slate-400">
                  {isId
                    ? 'Inovasi Laboratorium Fisika Virtual & Energi Terbarukan'
                    : 'Virtual Physics Lab & Renewable Energy Innovation'}
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/30 text-[10px] font-mono font-bold text-amber-300">
              {isId ? 'Pembimbing: Ibu Uki' : 'Advisor: Mrs. Uki'}
            </span>
          </div>

          {/* Contributors List */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-electric-400" />
              <span>
                {isId
                  ? 'Daftar Developer & Kontributor'
                  : 'Developer & Contributor Roster'}
              </span>
            </div>

            <div className="space-y-2">
              {TEAM_CONTRIBUTORS.map((member) => (
                <div
                  key={member.name}
                  className={`rounded-xl p-3 border transition-colors ${
                    member.isLead
                      ? 'bg-electric-500/10 border-electric-400/40 shadow-[0_0_20px_rgba(14,165,233,0.1)]'
                      : 'bg-void-950/90 border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                        <span>{member.name}</span>
                        {member.isLead && (
                          <span className="px-2 py-0.5 rounded-full bg-electric-500/25 border border-electric-400/50 text-[9px] font-mono text-electric-300 uppercase">
                            {isId ? 'Ketua & Kreator Utama' : 'Lead Creator'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5 font-medium">
                        {isId ? member.roleId : member.roleEn}
                      </div>
                    </div>
                  </div>

                  {member.isLead && (
                    <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-slate-300">
                      <span>NISN: {member.nisn}</span>
                      <span className="inline-flex items-center gap-1 text-electric-300">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </span>
                      <span className="inline-flex items-center gap-1 text-emerald-300">
                        <Phone className="w-3 h-3" />
                        {member.phone}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Originality & Zero-Plagiarism Declaration */}
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/30 p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {isId
                  ? 'Pernyataan Orisinalitas & Bebas Plagiarisme'
                  : 'Originality & Zero-Plagiarism Statement'}
              </span>
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed">
              This project was originally conceived, designed, and built by{' '}
              <strong className="text-white">KENZIE RAKA ROMERO</strong> with
              zero plagiarism of any other projects. All creative concepts, dual-world
              physics mechanics, and interactive scenarios originate from the author&apos;s
              own vision.
            </p>
            {isId && (
              <p className="text-[11px] text-emerald-200/90 leading-relaxed pt-1 border-t border-emerald-400/20">
                Proyek ini dirancang dan dibangun secara orisinal oleh{' '}
                <strong>Kenzie Raka Romero</strong> (SMPN 12 Surabaya) tanpa
                plagiarisme terhadap karya pihak mana pun. Kreativitas, ide fitur,
                dan desain sistem berasal murni dari gagasan penulis.
              </p>
            )}
          </div>

          {/* Tools, Technologies & AI Harness Section */}
          <div className="rounded-xl bg-void-950 border border-white/10 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                {isId
                  ? 'Teknologi & Harness Pengembangan'
                  : 'Tools, Technologies & Harness'}
              </span>
              <span className="text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Google Antigravity
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Some tools and technologies were used to assist in realizing this
              project. The development harness used to build this is{' '}
              <strong className="text-slate-200">Google Antigravity</strong>:
            </p>

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {AI_TOOLS_AND_HARNESS.map((tool) => (
                <span
                  key={tool}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-void-900 border border-white/10 text-[10px] font-mono font-semibold text-cyan-300"
                >
                  <Code2 className="w-3 h-3 text-electric-400 shrink-0" />
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {/* Complete Scientific Datasheet & Standard Citations (Each of the 7 Lamps & Each Component) */}
          <div className="rounded-xl bg-void-950 border border-emerald-500/30 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
              <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {isId
                  ? 'Sumber Data Ilmiah & Standar Datasheet (Tiap Lampu & Alat)'
                  : 'Scientific Datasheet & Standard Citations (Each Lamp & Part)'}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/30 text-[9px] font-mono font-bold text-emerald-300">
                SNI • IEC • PUIL
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isId
                ? 'Seluruh parameter tegangan (V), hambatan (Ω), daya maksimum (W), hambatan dalam baterai, serta tarif listrik dihitung menggunakan rumus fisika (R = V²/P, Hukum Ohm & Kirchhoff) berdasarkan standar resmi dan datasheet pabrikan berikut:'
                : 'All voltage (V), resistance (Ω), max power (W), battery internal resistance, and tariff parameters are derived from physics laws (R = V²/P, Ohm’s & Kirchhoff’s Laws) and cited from official standards and manufacturer datasheets:'}
            </p>

            {/* 1. All 7 Lamps */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25">
                <div className="flex items-center gap-2 min-w-0">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-amber-300 tracking-tight leading-snug truncate">
                    {isId
                      ? 'A. Spesifikasi & Rujukan Ilmiah 7 Jenis Lampu'
                      : 'A. Specifications & Citations for 7 Bulb Models'}
                  </span>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-200 shrink-0">
                  7 Bulbs
                </span>
              </div>
              <div className="space-y-2">
                {Object.values(BULB_DATASHEET_CITATIONS).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg bg-void-900/90 border border-white/10 p-2.5 space-y-1 text-[10px]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="font-bold text-white text-[11px]">
                        {isId ? item.titleId : item.titleEn}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-400/30 font-mono text-[9px] text-amber-300">
                        {item.standardBadge}
                      </span>
                    </div>
                    <div className="font-mono text-electric-300">
                      {isId ? item.parameterSummaryId : item.parameterSummaryEn}
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {isId ? item.formulaDerivationId : item.formulaDerivationEn}
                    </p>
                    <div className="text-emerald-300 font-mono pt-0.5">
                      📚 {isId ? item.sourceCitationId : item.sourceCitationEn}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. All Other Components */}
            <div className="space-y-2.5 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25">
                <div className="flex items-center gap-2 min-w-0">
                  <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs font-bold text-cyan-300 tracking-tight leading-snug truncate">
                    {isId
                      ? 'B. Spesifikasi & Rujukan Komponen Rangkaian'
                      : 'B. Specifications & Citations for Circuit Parts'}
                  </span>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-200 shrink-0">
                  Parts
                </span>
              </div>
              <div className="space-y-2">
                {Object.values(COMPONENT_DATASHEET_CITATIONS).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg bg-void-900/90 border border-white/10 p-2.5 space-y-1 text-[10px]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="font-bold text-white text-[11px]">
                        {isId ? item.titleId : item.titleEn}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-400/30 font-mono text-[9px] text-cyan-300">
                        {item.standardBadge}
                      </span>
                    </div>
                    <div className="font-mono text-electric-300">
                      {isId ? item.parameterSummaryId : item.parameterSummaryEn}
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {isId ? item.formulaDerivationId : item.formulaDerivationEn}
                    </p>
                    <div className="text-emerald-300 font-mono pt-0.5">
                      📚 {isId ? item.sourceCitationId : item.sourceCitationEn}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Official PLN Tariff Citation */}
            <div className="rounded-lg bg-electric-500/10 border border-electric-400/25 p-3 text-[10px] space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-electric-300 text-xs">
                <Zap className="w-3.5 h-3.5 text-electric-400 shrink-0" />
                <span>
                  {isId ? PLN_TARIFF_CITATION.titleId : PLN_TARIFF_CITATION.titleEn}
                </span>
              </div>
              <div className="font-mono text-slate-300 leading-relaxed text-[10px]">
                📚{' '}
                {isId
                  ? PLN_TARIFF_CITATION.sourceCitationId
                  : PLN_TARIFF_CITATION.sourceCitationEn}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-white/10 bg-void-950 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[10px] font-mono text-slate-400">
            © 2026 Kenzie Raka Romero • SMPN 12 Surabaya
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-electric-500 hover:bg-electric-400 text-void-950 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            {isId ? 'Tutup' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
