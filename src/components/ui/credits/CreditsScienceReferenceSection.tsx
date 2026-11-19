import React, { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  BULB_DATASHEET_CITATIONS,
  COMPONENT_DATASHEET_CITATIONS,
  PLN_TARIFF_CITATION,
} from '../../../constants/datasheetCitations';

interface CreditsScienceReferenceSectionProps {
  isId: boolean;
}

interface BulbSummaryRow {
  id: string;
  nameId: string;
  nameEn: string;
  noteId: string;
  noteEn: string;
  specs: string;
  standard: string;
}

const BULB_SUMMARY_ROWS: ReadonlyArray<BulbSummaryRow> = [
  {
    id: 'incandescent',
    nameId: 'Lampu Pijar',
    nameEn: 'Incandescent',
    noteId: 'Filamen Panas',
    noteEn: 'Hot Filament',
    specs: '40W · 800Ω',
    standard: 'SNI IEC 60064',
  },
  {
    id: 'halogen',
    nameId: 'Lampu Halogen',
    nameEn: 'Halogen',
    noteId: 'Sangat Terang & Panas',
    noteEn: 'Very Bright & Hot',
    specs: '50W · 640Ω',
    standard: 'IEC 60357',
  },
  {
    id: 'edison',
    nameId: 'Lampu Edison Vintage',
    nameEn: 'Edison Vintage',
    noteId: 'Filamen Spiral ST64',
    noteEn: 'Spiral Filament ST64',
    specs: '30W · 1200Ω',
    standard: 'SNI 04-3560',
  },
  {
    id: 'cfl',
    nameId: 'Lampu CFL Fluoresen',
    nameEn: 'CFL Fluorescent',
    noteId: 'Gas Tabung, Hemat 75%',
    noteEn: 'Gas Tube, 75% Saving',
    specs: '14W · 2285Ω',
    standard: 'SNI IEC 60969',
  },
  {
    id: 'led-standard',
    nameId: 'Lampu LED Standar',
    nameEn: 'Standard LED',
    noteId: 'Dioda Dingin, Efisiensi Tinggi',
    noteEn: 'Cool Diode, High Efficiency',
    specs: '9W · 3555Ω',
    standard: 'SNI IEC 62560',
  },
  {
    id: 'led-rgb',
    nameId: 'Smart LED RGB',
    nameEn: 'Smart RGB LED',
    noteId: 'Chip Multi-Warna',
    noteEn: 'Multi-Color Chip',
    specs: '7W · 6000Ω',
    standard: 'IEC 62612',
  },
  {
    id: 'led-mini',
    nameId: 'LED Hijau Mini (G4)',
    nameEn: 'Mini Green LED (G4)',
    noteId: 'Indikator SELV 2,2V',
    noteEn: 'SELV Indicator 2.2V',
    specs: '0.04W · 110Ω',
    standard: 'SELV 2.2V',
  },
];

/**
 * CreditsScienceReferenceSection renders the scientific validation summary
 * and expandable SNI / IEC / PUIL datasheet citations inside CreditsModal.
 *
 * Time Complexity: O(N) over static datasheet records (19 citations).
 */
export const CreditsScienceReferenceSection: React.FC<CreditsScienceReferenceSectionProps> = ({
  isId,
}) => {
  const [showDetailedCitations, setShowDetailedCitations] = useState(false);

  return (
    <div className="rounded-xl bg-void-950 border border-control p-4 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-ink/15 pb-2.5">
        <div>
          <h3 className="text-xs font-bold text-ink tracking-tight">
            {isId
              ? 'Dasar Sains & Validasi Standar Ilmiah'
              : 'Scientific Principles & Lab Validation'}
          </h3>
          <p className="text-[11px] text-slate-400">
            {isId
              ? 'Fisika Listrik IPA SMP & Standar Keteknikan Resmi'
              : 'Junior High Physics & Verified Engineering Standards'}
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-void-900 border border-control text-[10px] font-mono font-semibold text-slate-300 shrink-0">
          SNI · IEC · PUIL
        </span>
      </div>

      {/* 1. Three Core Junior High Science Principles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="rounded-lg bg-void-900 border border-ink/15 p-3 space-y-1">
          <div className="text-ink font-bold text-xs">
            {isId ? '1. Hukum Ohm' : '1. Ohm’s Law'}
          </div>
          <div className="font-mono text-[11px] text-electric-400 font-bold">
            I = V / R
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isId
              ? 'Arus listrik sebanding dengan tegangan baterai dan berbanding terbalik dengan hambatan beban.'
              : 'Current is directly proportional to battery voltage and inversely to load resistance.'}
          </p>
        </div>

        <div className="rounded-lg bg-void-900 border border-ink/15 p-3 space-y-1">
          <div className="text-ink font-bold text-xs">
            {isId ? '2. Efisiensi Daya' : '2. Power & Efficiency'}
          </div>
          <div className="font-mono text-[11px] text-electric-400 font-bold">
            P = V × I = V² / R
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isId
              ? 'Bohlam pijar (40W) membuang 90% energi jadi panas, sedangkan LED (9W) dingin dan hemat energi.'
              : 'Incandescent (40W) wastes 90% as heat, whereas LED (9W) is cool and energy-efficient.'}
          </p>
        </div>

        <div className="rounded-lg bg-void-900 border border-ink/15 p-3 space-y-1">
          <div className="text-ink font-bold text-xs">
            {isId ? '3. Proteksi Korslet' : '3. Safety & MCB'}
          </div>
          <div className="font-mono text-[11px] text-electric-400 font-bold">
            PUIL 2011 · I &gt; 10A
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isId
              ? 'Bila kabel bersentuhan tanpa beban (R ≈ 0), arus melonjak tinggi dan MCB otomatis memutus sirkuit.'
              : 'If leads touch with zero load (R ≈ 0), current surges and MCB automatically trips.'}
          </p>
        </div>
      </div>

      {/* 2. Compact 7 Bulb Models Summary Table */}
      <div className="space-y-1.5 pt-2 border-t border-ink/15">
        <div className="flex items-center justify-between text-[11px] font-bold text-ink">
          <span>
            {isId ? 'Spesifikasi 7 Karakter Lampu' : 'Specifications of 7 Bulb Models'}
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {isId ? 'Daya · Hambatan · Standar' : 'Power · Resistance · Standard'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-1.5 text-[11px]">
          {BULB_SUMMARY_ROWS.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-void-900 border border-ink/15"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-semibold text-ink">
                  {isId ? row.nameId : row.nameEn}
                </span>
                <span className="text-slate-400">
                  ({isId ? row.noteId : row.noteEn})
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono tabular-nums shrink-0">
                <span className="text-slate-300">{row.specs}</span>
                <span className="px-1.5 py-0.5 rounded bg-void-950 border border-control text-slate-300 text-[10px]">
                  {row.standard}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Official Regulatory Citations */}
      <div className="rounded-lg bg-void-900 border border-ink/15 p-3 text-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-bold text-ink">
            {isId ? 'Regulasi & Standar Resmi' : 'Official Standards & Regulations'}
          </span>
          <span className="font-mono text-[10px] text-electric-400">SNI · PUIL · ESDM</span>
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          {isId
            ? 'Baterai AA 1.5V (SNI IEC 60086-2) & Kotak 9V 6F22 · Proteksi Korslet PUIL 2011 · Tarif Listrik Permen ESDM No. 28/2016 (Rp 1.444,70 / kWh).'
            : 'AA Battery 1.5V (SNI IEC 60086-2) & 9V 6F22 · Short-Circuit Protection PUIL 2011 · PLN Tariff Permen ESDM No. 28/2016 ($0.09 / kWh).'}
        </p>
      </div>

      {/* 4. Expandable Accordion for Complete Technical Formulas & 19 Datasheets */}
      <div className="pt-2 border-t border-ink/15">
        <button
          type="button"
          onClick={() => setShowDetailedCitations((prev) => !prev)}
          aria-expanded={showDetailedCitations}
          className="w-full min-h-[44px] py-2 px-3 rounded-xl bg-void-900 hover:bg-void-850 border border-control text-ink text-xs font-semibold flex items-center justify-between transition-colors active:scale-[0.99] cursor-pointer"
        >
          <span className="flex items-center gap-2 text-xs">
            <BookOpen className="w-3.5 h-3.5 text-electric-400 shrink-0" aria-hidden="true" />
            {showDetailedCitations
              ? isId
                ? 'Tutup Rujukan Lengkap'
                : 'Hide Complete Engineering References'
              : isId
              ? 'Buka Rujukan Lengkap 19 Standar SNI / IEC / Datasheet'
              : 'View Complete 19 SNI / IEC & Datasheet Citations'}
          </span>
          {showDetailedCitations ? (
            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          )}
        </button>

        {showDetailedCitations && (
          <div className="mt-3 space-y-3 pt-2">
            {/* Detailed Bulbs */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono font-bold text-slate-300">
                {isId ? 'Rujukan 7 Lampu' : 'Bulb Datasheets'}
              </div>
              {Object.values(BULB_DATASHEET_CITATIONS).map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg bg-void-900 border border-ink/15 p-2.5 space-y-1 text-[11px]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-bold text-ink text-xs">
                      {isId ? item.titleId : item.titleEn}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-void-950 border border-control font-mono text-[10px] text-slate-300">
                      {item.standardBadge}
                    </span>
                  </div>
                  <div className="font-mono text-electric-400">
                    {isId ? item.parameterSummaryId : item.parameterSummaryEn}
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {isId ? item.formulaDerivationId : item.formulaDerivationEn}
                  </p>
                  <div className="text-slate-400 font-mono text-[10px]">
                    {isId ? item.sourceCitationId : item.sourceCitationEn}
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Components */}
            <div className="space-y-2 pt-2 border-t border-ink/15">
              <div className="text-[11px] font-mono font-bold text-slate-300">
                {isId ? 'Rujukan Komponen' : 'Component Datasheets'}
              </div>
              {Object.values(COMPONENT_DATASHEET_CITATIONS).map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg bg-void-900 border border-ink/15 p-2.5 space-y-1 text-[11px]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-bold text-ink text-xs">
                      {isId ? item.titleId : item.titleEn}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-void-950 border border-control font-mono text-[10px] text-slate-300">
                      {item.standardBadge}
                    </span>
                  </div>
                  <div className="font-mono text-electric-400">
                    {isId ? item.parameterSummaryId : item.parameterSummaryEn}
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {isId ? item.formulaDerivationId : item.formulaDerivationEn}
                  </p>
                  <div className="text-slate-400 font-mono text-[10px]">
                    {isId ? item.sourceCitationId : item.sourceCitationEn}
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed PLN Tariff */}
            <div className="rounded-lg bg-void-900 border border-ink/15 p-2.5 space-y-1 text-[11px]">
              <div className="font-bold text-ink">
                {isId ? PLN_TARIFF_CITATION.titleId : PLN_TARIFF_CITATION.titleEn}
              </div>
              <div className="font-mono text-slate-400 text-[10px]">
                {isId ? PLN_TARIFF_CITATION.sourceCitationId : PLN_TARIFF_CITATION.sourceCitationEn}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
