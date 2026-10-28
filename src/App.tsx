import React, { useEffect, useState } from 'react';
import { PlusCircle, Sliders, Activity, Scissors, Pin } from 'lucide-react';
import { Header } from './components/ui/Header';
import { SidebarPalette } from './components/ui/SidebarPalette';
import { CircuitCanvas } from './components/canvas/CircuitCanvas';
import { Inspector } from './components/ui/Inspector';
import { useCircuitStore } from './store/useCircuitStore';
import { TRANSLATIONS } from './i18n/translations';

type MobileSheetType = 'none' | 'palette' | 'inspector';

export const App: React.FC = () => {
  const loadPreset = useCircuitStore((state) => state.loadPreset);
  const nodes = useCircuitStore((state) => state.nodes);
  const selectedNodeId = useCircuitStore((state) => state.selectedNodeId);
  const selectedEdgeId = useCircuitStore((state) => state.selectedEdgeId);
  const removeEdge = useCircuitStore((state) => state.removeEdge);
  const splitEdgeAtMidpoint = useCircuitStore((state) => state.splitEdgeAtMidpoint);
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);

  const t = TRANSLATIONS[language].mobileNav;
  const wireT = TRANSLATIONS[language].wire;

  const [activeMobileSheet, setActiveMobileSheet] = useState<MobileSheetType>('none');

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Initialize with the Simple Lamp & Switch circuit preset on first mount
  useEffect(() => {
    if (nodes.length === 0) {
      loadPreset('simple-lamp');
    }
  }, [loadPreset, nodes.length]);

  const toggleMobileSheet = (sheet: MobileSheetType) => {
    setActiveMobileSheet((prev) => (prev === sheet ? 'none' : sheet));
  };

  return (
    <div className="flex flex-col h-[100dvh] w-screen bg-void-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Utility Header */}
      <Header />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 min-h-0 relative w-full overflow-hidden">
        {/* Desktop Left Component Palette */}
        <SidebarPalette />

        {/* Central React Flow Canvas (Full width on mobile, center column on desktop) */}
        <main className="flex-1 relative h-full w-full min-w-0">
          <CircuitCanvas />

          {/* Floating Quick-Edit Pill on Mobile when a component is selected */}
          {selectedNode && activeMobileSheet === 'none' && (
            <div className="md:hidden absolute top-3 left-1/2 -translate-x-1/2 z-20">
              <button
                onClick={() => setActiveMobileSheet('inspector')}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-electric-600/95 text-white text-xs font-semibold shadow-glow border border-electric-400/50 active:scale-95 transition-transform"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>
                  {language === 'id' ? 'Atur' : 'Edit'} {selectedNode.data.label}
                </span>
              </button>
            </div>
          )}

          {/* Top Floating Wire Action Bar (Visible on ALL devices when a wire is selected) */}
          {selectedEdgeId && activeMobileSheet === 'none' && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-void-900/95 backdrop-blur-md border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.65)]">
              <button
                type="button"
                onClick={() => splitEdgeAtMidpoint(selectedEdgeId)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-electric-500/20 hover:bg-electric-500/30 text-electric-400 text-xs font-bold border border-electric-500/40 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <Pin className="w-3.5 h-3.5" />
                <span>{wireT.addBend}</span>
              </button>
              <button
                type="button"
                onClick={() => removeEdge(selectedEdgeId)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-[0_0_16px_rgba(239,68,68,0.6)] border border-red-300/60 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>{wireT.cutWire}</span>
              </button>
            </div>
          )}
        </main>

        {/* Desktop Right Inspector & Telemetry */}
        <Inspector />

        {/* Mobile Slide-Up Bottom Sheet Overlay */}
        {activeMobileSheet !== 'none' && (
          <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end bg-black/60 backdrop-blur-xs">
            <div
              className="flex-1"
              onClick={() => setActiveMobileSheet('none')}
              aria-hidden="true"
            />
            {activeMobileSheet === 'palette' && (
              <SidebarPalette
                isMobileDrawer
                onCloseMobile={() => setActiveMobileSheet('none')}
              />
            )}
            {activeMobileSheet === 'inspector' && (
              <Inspector
                isMobileDrawer
                onCloseMobile={() => setActiveMobileSheet('none')}
              />
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden h-14 bg-void-900 border-t border-white/10 px-3 flex items-center justify-between gap-2 z-30 shrink-0 select-none">
        <button
          type="button"
          onClick={() => toggleMobileSheet('palette')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
            activeMobileSheet === 'palette'
              ? 'bg-electric-500/20 border-electric-500 text-electric-400'
              : 'bg-void-850 border-white/10 text-slate-200'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-electric-400" />
          <span>{t.addPart}</span>
        </button>

        {/* Center Live Power Readout */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-void-950 border border-white/5 text-[11px] font-mono text-slate-300">
          <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{simulation.totalPowerDrawn.toFixed(2)}W</span>
        </div>

        <button
          type="button"
          onClick={() => toggleMobileSheet('inspector')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
            activeMobileSheet === 'inspector' || selectedNode
              ? 'bg-electric-500/20 border-electric-500/50 text-electric-400'
              : 'bg-void-850 border-white/10 text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4 text-electric-400" />
          <span>{t.inspector}</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
