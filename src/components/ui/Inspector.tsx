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
    : 'hidden md:flex w-80 lg:w-96 bg-void-900 border-l border-white/10 flex-col h-full shrink-0 select-none';

  const panelId =
    isMobileDrawer || typeof window === 'undefined' || window.innerWidth >= 768
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
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-void-850">
          <div className="flex items-center gap-2 min-w-0">
            <Scissors className="w-4 h-4 text-red-400 shrink-0" />
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider truncate">
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
              className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-500/30 transition-colors active:scale-95 cursor-pointer"
              title={wireT.cutWire}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            {isMobileDrawer && onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg bg-void-900 text-slate-400 hover:text-white border border-white/10 active:scale-95 cursor-pointer"
                aria-label="Close inspector"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div className="bg-void-950 rounded-xl p-3.5 border border-white/5 space-y-2.5 font-mono text-xs">
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
              <span className="text-emerald-400">{wireT.idealWire}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/5 text-[11px] font-sans">
              <span className="text-slate-400">{wireT.fromTo}</span>
              <span className="text-slate-200 truncate max-w-[170px]">
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
            className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-500 text-white shadow-lg border border-red-400/50 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Scissors className="w-4 h-4" />
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
