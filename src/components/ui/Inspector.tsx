import React, { useState } from 'react';
import {
  Trash2,
  X,
  Scissors,
} from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { TRANSLATIONS } from '../../i18n/translations';
import {
  InspectorStickyHeader,
  InspectorTabType,
} from './inspector/InspectorStickyHeader';
import { InspectorOverviewTab } from './inspector/InspectorOverviewTab';
import { InspectorPropertiesTab } from './inspector/InspectorPropertiesTab';
import { InspectorLiveDataTab } from './inspector/InspectorLiveDataTab';
import { InspectorFormulaTab } from './inspector/InspectorFormulaTab';
import { InspectorGlobalView } from './inspector/InspectorGlobalView';
import { getComponentDisplayName } from '../../utils/nodeLocalization';

interface InspectorProps {
  isMobileDrawer?: boolean;
  onCloseMobile?: () => void;
}

/**
 * Redesigned 4-Tab Component Properties & Telemetry Inspector.
 * Coordinates sticky electrical measurements, Overview, Properties, Live Data,
 * Formula & Sources tabs, Wire Inspector, and Global Circuit Telemetry.
 *
 * Time Complexity: O(1)
 */
export const Inspector: React.FC<InspectorProps> = ({
  isMobileDrawer = false,
  onCloseMobile,
}) => {
  const nodes = useCircuitStore((state) => state.nodes);
  const edges = useCircuitStore((state) => state.edges);
  const selectedNodeId = useCircuitStore((state) => state.selectedNodeId);
  const selectedEdgeId = useCircuitStore((state) => state.selectedEdgeId);
  const removeEdge = useCircuitStore((state) => state.removeEdge);
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);

  const [activeTab, setActiveTab] = useState<InspectorTabType>('overview');

  const t = TRANSLATIONS[language].inspector;
  const wireT = TRANSLATIONS[language].wire;

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  const containerClasses = isMobileDrawer
    ? 'flex flex-col h-full w-full bg-void-900 select-none overflow-hidden'
    : 'hidden lg:flex lg:w-72 xl:w-80 bg-void-900 border-l border-ink/15 flex-col h-full shrink-0 select-none';

  const panelId =
    isMobileDrawer || typeof window === 'undefined' || window.innerWidth >= 1024
      ? 'tour-panel-inspector'
      : undefined;

  // View 1: Wire Selected View
  if (!selectedNode && selectedEdge) {
    const sourceNode = nodes.find((n) => n.id === selectedEdge.source);
    const targetNode = nodes.find((n) => n.id === selectedEdge.target);
    const wireCurrent = Math.max(
      Math.abs(simulation.branchCurrents[selectedEdge.source] ?? 0),
      Math.abs(simulation.branchCurrents[selectedEdge.target] ?? 0)
    );

    return (
      <aside id={panelId} className={containerClasses}>
        <div className="p-3.5 border-b border-ink/15 flex items-center justify-between bg-void-850">
          <div className="flex items-center gap-2 min-w-0">
            <Scissors className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider truncate">
              {wireT.wireSelected}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                removeEdge(selectedEdge.id);
                if (isMobileDrawer && onCloseMobile) onCloseMobile();
              }}
              className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg bg-danger-950/60 hover:bg-danger-600 text-danger-300 hover:text-white border border-danger-500/50 transition-colors active:scale-95 cursor-pointer"
              aria-label={wireT.cutWire}
              title={wireT.cutWire}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
            {isMobileDrawer && onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-void-900 text-slate-300 hover:text-ink border border-control active:scale-95 cursor-pointer"
                aria-label="Tutup inspektor"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div className="bg-void-950 rounded-xl p-3.5 border border-ink/15 space-y-2.5 font-mono text-xs tabular-nums">
            <div className="text-[10px] text-slate-400 font-sans uppercase tracking-wider font-semibold">
              {t.liveTelemetry}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans text-[11px]">{t.branchCurrent}</span>
              <span className="text-electric-400 font-bold">
                {wireCurrent < 1
                  ? `${(wireCurrent * 1000).toFixed(1)} mA`
                  : `${wireCurrent.toFixed(3)} A`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans text-[11px]">{wireT.wireResistance}</span>
              <span className="text-emerald-400 font-semibold">{wireT.idealWire}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-ink/15 text-[11px] font-sans">
              <span className="text-slate-400">{wireT.fromTo}</span>
              <span className="text-ink font-medium truncate max-w-[170px]">
                {sourceNode ? getComponentDisplayName(sourceNode.data, language) : 'Pin'} →{' '}
                {targetNode ? getComponentDisplayName(targetNode.data, language) : 'Pin'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              removeEdge(selectedEdge.id);
              if (isMobileDrawer && onCloseMobile) onCloseMobile();
            }}
            className="w-full min-h-[44px] py-2.5 px-3 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-500 text-white shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-colors cursor-pointer"
          >
            <Scissors className="w-4 h-4" aria-hidden="true" />
            <span>{wireT.cutWire}</span>
          </button>
        </div>
      </aside>
    );
  }

  // View 2: Global Circuit Telemetry & Grade 9 IPA Formula View
  if (!selectedNode) {
    return (
      <aside id={panelId} className={containerClasses}>
        <InspectorGlobalView
          isMobileDrawer={isMobileDrawer}
          onCloseMobile={onCloseMobile}
        />
      </aside>
    );
  }

  // View 3: Component Selected 4-Tab View
  const componentData = selectedNode.data;
  const hasWires = edges.some(
    (e) =>
      !e.data?.isSnapWire &&
      (e.source === selectedNode.id || e.target === selectedNode.id)
  );

  return (
    <aside id={panelId} className={containerClasses}>
      {/* Sticky Header with Pinned Gauges & Tab Switcher */}
      <InspectorStickyHeader
        componentData={componentData}
        nodeId={selectedNode.id}
        hasWires={hasWires}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMobileDrawer={isMobileDrawer}
        onCloseMobile={onCloseMobile}
      />

      {/* Tab Panels */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {activeTab === 'overview' && (
          <InspectorOverviewTab
            componentData={componentData}
            nodeId={selectedNode.id}
          />
        )}
        {activeTab === 'properties' && (
          <InspectorPropertiesTab
            componentData={componentData}
            nodeId={selectedNode.id}
          />
        )}
        {activeTab === 'live' && (
          <InspectorLiveDataTab
            componentData={componentData}
            nodeId={selectedNode.id}
          />
        )}
        {activeTab === 'formula' && (
          <InspectorFormulaTab
            componentData={componentData}
            nodeId={selectedNode.id}
          />
        )}
      </div>
    </aside>
  );
};
