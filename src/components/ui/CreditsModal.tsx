import React from 'react';
import {
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Code2,
  Cpu,
  GraduationCap,
  Lightbulb,
  Mail,
  Phone,
  ShieldCheck,
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
    noteId: '★ Kontributor terbesar: Pengujian intensif di perangkat mobile nyata, verifikasi responsivitas antarmuka, dan penemu bug kritis proyek.',
    noteEn: '★ Massive contributor: Intensive real-world mobile device testing, interface verification, and critical bug hunting.',
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
 * Time Complexity: O(1) over static contributor metadata.
 */
export const CreditsModal: React.FC<CreditsModalProps> = ({ isOpen, onClose }) => {
  const language = useCircuitStore((state) => state.language);
  const isId = language === 'id';
  const [showDetailedCitations, setShowDetailedCitations] = React.useState(false);

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
                      ? 'bg-electric-500/10 border-electric-400/40 shadow-[0_0_20px_rgba(14,165,233,0.15)]'
                      : member.isMassiveContributor
                      ? 'bg-emerald-500/10 border-emerald-400/45 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                      : 'bg-void-950/90 border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                        <span>{member.name}</span>
                        {member.isLead && (
                          <span className="px-2 py-0.5 rounded-full bg-electric-500/25 border border-electric-400/50 text-[9px] font-mono font-bold text-electric-300 uppercase">
                            {isId ? 'Ketua & Kreator Utama' : 'Lead Creator'}
                          </span>
                        )}
                        {member.isMassiveContributor && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-[9px] font-mono font-bold text-emerald-300 uppercase flex items-center gap-1">
                            <Award className="w-3 h-3 text-emerald-400" />
                            {isId ? 'Kontributor Utama' : 'Massive Contributor'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5 font-medium">
                        {isId ? member.roleId : member.roleEn}
                      </div>
                      {member.noteId && (
                        <div className="text-[10px] text-emerald-300/95 mt-1.5 font-sans font-medium leading-relaxed bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-2.5 py-1">
                          {isId ? member.noteId : member.noteEn}
                        </div>
                      )}
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
            {isId ? (
              <p className="text-[11px] text-emerald-200/95 leading-relaxed">
                Proyek ini dirancang dan dibangun secara orisinal oleh{' '}
                <strong className="text-white">KENZIE RAKA ROMERO</strong> (SMPN 12
                Surabaya) tanpa plagiarisme terhadap karya pihak mana pun. Seluruh
                konsep kreatif, mekanika fisika dua dunia, dan skenario interaktif
                berasal murni dari gagasan penulis.
              </p>
            ) : (
              <p className="text-[11px] text-slate-200 leading-relaxed">
                This project was originally conceived, designed, and built by{' '}
                <strong className="text-white">KENZIE RAKA ROMERO</strong> with
                zero plagiarism of any other projects. All creative concepts, dual-world
                physics mechanics, and interactive scenarios originate from the author&apos;s
                own vision.
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
                <Code2 className="w-3 h-3" />
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
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-void-900 border border-white/10 text-[10px] font-mono font-semibold text-cyan-300"
                >
                  <Code2 className="w-3 h-3 text-electric-400 shrink-0" />
                  {isId ? badge.labelId : badge.labelEn}
                </span>
              ))}
            </div>
          </div>

          {/* Condensed & Judge-Friendly Science Validation Section */}
          <div className="rounded-xl bg-void-950 border border-emerald-500/35 p-3.5 space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-emerald-300 tracking-tight">
                    {isId
                      ? 'Dasar Sains & Validasi Ilmiah (Panduan Juri)'
                      : 'Scientific Principles & Lab Validation (Judge Guide)'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {isId
                      ? 'Fisika Listrik IPA SMP & Standar Resmi'
                      : 'Junior High Physics & Verified Standards'}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[9px] font-mono font-bold text-emerald-300 shrink-0">
                IPA SMP • SNI
              </span>
            </div>

            {/* 1. Three Core Junior High Science Principles (Easy for Judges to Assess) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="rounded-lg bg-void-900/90 border border-white/10 p-2.5 space-y-1">
                <div className="flex items-center gap-1.5 text-electric-300 font-bold text-[11px]">
                  <Zap className="w-3.5 h-3.5 text-electric-400 shrink-0" />
                  <span>{isId ? '1. Hukum Ohm' : '1. Ohm’s Law'}</span>
                </div>
                <div className="font-mono text-[10px] text-electric-400 font-bold">
                  I = V / R
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  {isId
                    ? 'Arus listrik sebanding dengan tegangan baterai dan berbanding terbalik dengan hambatan beban.'
                    : 'Current is directly proportional to battery voltage and inversely to load resistance.'}
                </p>
              </div>

              <div className="rounded-lg bg-void-900/90 border border-white/10 p-2.5 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{isId ? '2. Efisiensi Daya' : '2. Power & Efficiency'}</span>
                </div>
                <div className="font-mono text-[10px] text-amber-400 font-bold">
                  P = V × I = V² / R
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  {isId
                    ? 'Bohlam pijar (40W) membuang 90% energi jadi panas, sedangkan LED (9W) dingin dan hemat energi.'
                    : 'Incandescent (40W) wastes 90% as heat, whereas LED (9W) is cool and energy-efficient.'}
                </p>
              </div>

              <div className="rounded-lg bg-void-900/90 border border-white/10 p-2.5 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{isId ? '3. Proteksi Korslet' : '3. Safety & MCB'}</span>
                </div>
                <div className="font-mono text-[10px] text-emerald-400 font-bold">
                  PUIL 2011 • I &gt; 10A
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  {isId
                    ? 'Bila kabel bersentuhan tanpa beban (R ≈ 0), arus melonjak tinggi dan MCB otomatis memutus sirkuit.'
                    : 'If leads touch with zero load (R ≈ 0), current surges and MCB automatically trips.'}
                </p>
              </div>
            </div>

            {/* 2. Compact 7 Bulb Models Summary (Table/Grid) */}
            <div className="space-y-1.5 pt-1 border-t border-white/10">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  {isId ? 'Ringkasan 7 Karakter Lampu' : 'Quick Summary of 7 Bulb Models'}
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  {isId ? 'Urutan Hambatan & Efisiensi' : 'Resistance & Efficiency'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1 text-[10px]">
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-void-900/80 border border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-bold text-white">
                      {isId ? 'Lampu Pijar' : 'Incandescent'}
                    </span>
                    <span className="text-slate-400">
                      {isId ? '(Filamen Panas)' : '(Hot Filament)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-300">40W · 800Ω</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[9px]">
                      SNI IEC 60064
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded-lg bg-void-900/80 border border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="font-bold text-white">
                      {isId ? 'Lampu Halogen' : 'Halogen'}
                    </span>
                    <span className="text-slate-400">
                      {isId ? '(Sangat Terang & Panas)' : '(Very Bright & Hot)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-300">50W · 640Ω</span>
                    <span className="px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-300 text-[9px]">
                      IEC 60357
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded-lg bg-void-900/80 border border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="font-bold text-white">
                      {isId ? 'Lampu Edison Vintage' : 'Edison Vintage'}
                    </span>
                    <span className="text-slate-400">
                      {isId ? '(Filamen Spiral ST64)' : '(Spiral Filament ST64)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-300">30W · 1200Ω</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[9px]">
                      SNI 04-3560
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded-lg bg-void-900/80 border border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <span className="font-bold text-white">
                      {isId ? 'Lampu CFL Fluoresen' : 'CFL Fluorescent'}
                    </span>
                    <span className="text-slate-400">
                      {isId ? '(Gas Tabung, Hemat 75%)' : '(Gas Tube, 75% Saving)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-300">14W · 2285Ω</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-500/15 text-slate-300 text-[9px]">
                      SNI IEC 60969
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded-lg bg-void-900/80 border border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-bold text-white">
                      {isId ? 'Lampu LED Standar' : 'Standard LED'}
                    </span>
                    <span className="text-slate-400">
                      {isId ? '(Dioda Dingin, Efisiensi Tinggi)' : '(Cool Diode, High Efficiency)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-300">9W · 3555Ω</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[9px]">
                      SNI IEC 62560
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded-lg bg-void-900/80 border border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span className="font-bold text-white">
                      {isId ? 'Smart LED RGB' : 'Smart RGB LED'}
                    </span>
                    <span className="text-slate-400">
                      {isId ? '(Chip Multi-Warna)' : '(Multi-Color Chip)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-300">7W · 6000Ω</span>
                    <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 text-[9px]">
                      IEC 62612
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded-lg bg-void-900/80 border border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="font-bold text-white">
                      {isId ? 'LED Hijau Mini (G4)' : 'Mini Green LED (G4)'}
                    </span>
                    <span className="text-slate-400">
                      {isId ? '(Indikator SELV 2,2V)' : '(SELV Indicator 2.2V)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-300">0.04W · 110Ω</span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 text-[9px]">
                      SELV 2.2V
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Official Regulatory Citations (Battery, MCB, PLN) */}
            <div className="rounded-lg bg-electric-500/10 border border-electric-400/20 p-2.5 text-[10px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-electric-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-electric-400" />
                  {isId ? 'Regulasi & Standar Resmi' : 'Official Standards & Regulations'}
                </span>
                <span className="font-mono text-[9px] text-electric-400">SNI • PUIL • ESDM</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[10px]">
                {isId
                  ? '• Baterai AA 1.5V (SNI IEC 60086-2) & Kotak 9V 6F22.\n• Proteksi Korslet: PUIL 2011.\n• Tarif Listrik: Permen ESDM No. 28/2016 (Rp 1.444,70 / kWh).'
                  : '• AA Battery 1.5V (SNI IEC 60086-2) & 9V Transistor 6F22.\n• Safety: PUIL 2011.\n• PLN Electricity Tariff: Permen ESDM No. 28/2016 ($0.09 / kWh).'}
              </p>
            </div>

            {/* 4. Expandable Accordion for Complete Technical Formulas & 19 Datasheets */}
            <div className="pt-1 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowDetailedCitations((prev) => !prev)}
                className="w-full py-2 px-3 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-between transition-all active:scale-95 cursor-pointer"
              >
                <span className="flex items-center gap-1.5 text-[11px]">
                  <BookOpen className="w-3.5 h-3.5 text-electric-400 shrink-0" />
                  {showDetailedCitations
                    ? isId
                      ? 'Tutup Rujukan Lengkap'
                      : 'Hide Complete Engineering References'
                    : isId
                    ? 'Buka Rujukan Lengkap 19 Standar SNI / IEC / Datasheet...'
                    : 'View Complete 19 SNI / IEC & Datasheet Citations...'}
                </span>
                {showDetailedCitations ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {showDetailedCitations && (
                <div className="mt-3 space-y-3 pt-2">
                  {/* Detailed Bulbs */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-amber-400" />
                      <span>{isId ? 'Rujukan 7 Lampu' : 'Bulb Datasheets'}</span>
                    </div>
                    {Object.values(BULB_DATASHEET_CITATIONS).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg bg-void-900 border border-white/10 p-2 space-y-1 text-[10px]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="font-bold text-white text-[11px]">
                            {isId ? item.titleId : item.titleEn}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-400/30 font-mono text-[9px] text-amber-300">
                            {item.standardBadge}
                          </span>
                        </div>
                        <div className="font-mono text-electric-300">{isId ? item.parameterSummaryId : item.parameterSummaryEn}</div>
                        <p className="text-slate-300 leading-relaxed">{isId ? item.formulaDerivationId : item.formulaDerivationEn}</p>
                        <div className="text-emerald-300 font-mono text-[9px]">📚 {isId ? item.sourceCitationId : item.sourceCitationEn}</div>
                      </div>
                    ))}
                  </div>

                  {/* Detailed Components */}
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-cyan-400" />
                      <span>{isId ? 'Rujukan Komponen' : 'Component Datasheets'}</span>
                    </div>
                    {Object.values(COMPONENT_DATASHEET_CITATIONS).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg bg-void-900 border border-white/10 p-2 space-y-1 text-[10px]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="font-bold text-white text-[11px]">
                            {isId ? item.titleId : item.titleEn}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-400/30 font-mono text-[9px] text-cyan-300">
                            {item.standardBadge}
                          </span>
                        </div>
                        <div className="font-mono text-electric-300">{isId ? item.parameterSummaryId : item.parameterSummaryEn}</div>
                        <p className="text-slate-300 leading-relaxed">{isId ? item.formulaDerivationId : item.formulaDerivationEn}</p>
                        <div className="text-emerald-300 font-mono text-[9px]">📚 {isId ? item.sourceCitationId : item.sourceCitationEn}</div>
                      </div>
                    ))}
                  </div>

                  {/* Detailed PLN Tariff */}
                  <div className="rounded-lg bg-electric-500/10 border border-electric-400/25 p-2 space-y-1 text-[10px]">
                    <div className="font-bold text-electric-300">
                      {isId ? PLN_TARIFF_CITATION.titleId : PLN_TARIFF_CITATION.titleEn}
                    </div>
                    <div className="font-mono text-slate-300 text-[9px]">
                      📚 {isId ? PLN_TARIFF_CITATION.sourceCitationId : PLN_TARIFF_CITATION.sourceCitationEn}
                    </div>
                  </div>
                </div>
              )}
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
