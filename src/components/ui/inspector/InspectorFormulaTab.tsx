import React from 'react';
import { BookOpen, ShieldCheck } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { getComponentCitation } from '../../../constants/datasheetCitations';
import { resolveComponentPhysicsEquationModel } from '../../../physics/physicsEquationHelper';

interface InspectorFormulaTabProps {
  componentData: CircuitElementData;
  nodeId: string;
}

/**
 * Inspector Tab 4: Formula & Sources
 * Educational physics formulas, step-by-step mathematical derivations with live numbers,
 * variable definitions, and Indonesian PUIL 2011 / IEC technical citations.
 *
 * Time Complexity: O(1)
 */
export const InspectorFormulaTab: React.FC<InspectorFormulaTabProps> = ({
  componentData,
  nodeId,
}) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);

  const isId = language === 'id';

  const signedBranchCurrent = simulation.branchCurrents[nodeId] ?? 0;
  const branchCurrent = Math.abs(signedBranchCurrent);
  const voltage = Math.abs(
    componentData.calculatedVoltage ?? (componentData.voltage ?? 0)
  );
  const powerWatts = componentData.calculatedPower ?? voltage * branchCurrent;
  const equationModel = resolveComponentPhysicsEquationModel(
    componentData,
    signedBranchCurrent,
    voltage,
    isId
  );

  const citation = getComponentCitation(componentData.type);

  return (
    <div className="p-4 space-y-4 text-xs font-sans">
      {/* Textbook Equations with Live Number Substitution */}
      <div className="p-3.5 rounded-2xl bg-electric-500/5 border border-electric-500/25 space-y-3">
        <div className="flex items-center gap-1.5 font-bold text-electric-400 text-xs">
          <BookOpen className="w-4 h-4" aria-hidden="true" />
          <span>{isId ? 'Penurunan Rumus & Substitusi Fisika' : 'Physics Derivation & Live Substitution'}</span>
        </div>

        {/* Component-Appropriate Voltage / EMF Equation */}
        <div className="p-2.5 rounded-xl bg-void-950 border border-ink/15 space-y-1">
          <div className="flex justify-between items-center text-[11px] text-slate-300 font-semibold">
            <span>{equationModel.voltageLawLabel}</span>
            <span className="font-mono text-electric-400 font-bold">
              {equationModel.voltageFormulaTitle}
            </span>
          </div>
          <div className="font-mono tabular-nums text-[11px] text-sky-300 bg-void-900 px-2 py-1 rounded border border-ink/15">
            {equationModel.voltageEquationText}
          </div>
        </div>

        {/* Electric Power Law */}
        <div className="p-2.5 rounded-xl bg-void-950 border border-ink/15 space-y-1">
          <div className="flex justify-between items-center text-[11px] text-slate-300 font-semibold">
            <span>{isId ? 'Daya Listrik (Hukum Joule):' : 'Electric Power (Joule\'s Law):'}</span>
            <span className="font-mono text-emerald-400 font-bold">P = V × I</span>
          </div>
          <div className="font-mono tabular-nums text-[11px] text-emerald-300 bg-void-900 px-2 py-1 rounded border border-ink/15">
            P = ({voltage.toFixed(2)} V) × ({branchCurrent.toFixed(3)} A) ={' '}
            <strong className="text-ink">{powerWatts.toFixed(3)} W</strong>
          </div>
        </div>

        {/* Dissipated / Internal Thermal Loss I^2 * R */}
        <div className="p-2.5 rounded-xl bg-void-950 border border-ink/15 space-y-1">
          <div className="flex justify-between items-center text-[11px] text-slate-300 font-semibold">
            <span>{equationModel.thermalLawLabel}</span>
            <span className="font-mono text-amber-400 font-bold">
              {equationModel.thermalFormulaTitle}
            </span>
          </div>
          <div className="font-mono tabular-nums text-[11px] text-amber-300 bg-void-900 px-2 py-1 rounded border border-ink/15">
            {equationModel.thermalEquationText}
          </div>
        </div>
      </div>

      {/* Variable Explanations */}
      <div className="p-3 rounded-xl bg-void-950 border border-ink/15 space-y-1.5 text-[11px]">
        <div className="font-semibold text-slate-300 mb-1">
          {isId ? 'Keterangan Besaran & Satuan SI:' : 'Variable Units & Symbols:'}
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-slate-400 font-mono text-[10px]">
          <div><strong className="text-sky-300">V</strong> = {isId ? 'Tegangan (Volt, V)' : 'Voltage (Volt, V)'}</div>
          <div><strong className="text-amber-300">I</strong> = {isId ? 'Kuat Arus (Ampere, A)' : 'Current (Ampere, A)'}</div>
          <div><strong className="text-copper-text">R</strong> = {isId ? 'Hambatan (Ohm, Ω)' : 'Resistance (Ohm, Ω)'}</div>
          <div><strong className="text-emerald-300">P</strong> = {isId ? 'Daya (Watt, W)' : 'Power (Watt, W)'}</div>
        </div>
      </div>

      {/* Technical & Datasheet Citations */}
      {citation && (
        <div className="p-3.5 rounded-xl bg-void-950 border border-ink/15 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
            <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span>{isId ? 'Rujukan Standar & Datasheet Resmi' : 'Standards & Datasheet References'}</span>
          </div>
          <div className="text-[11px] text-slate-300 font-semibold">
            {citation.standardBadge}
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            {isId ? citation.sourceCitationId : citation.sourceCitationEn}
          </p>
          <div className="pt-1 text-[10px] text-slate-400 font-mono">
            {isId ? citation.formulaDerivationId : citation.formulaDerivationEn}
          </div>
        </div>
      )}
    </div>
  );
};
