import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { PlusCircle, Sliders, Activity, Scissors, Pin } from 'lucide-react';
import { Header } from './components/ui/Header';
import { SidebarPalette } from './components/ui/SidebarPalette';
import { CircuitCanvas } from './components/canvas/CircuitCanvas';
import { OutdoorSandbox } from './components/canvas/OutdoorSandbox';
import { CloudOverlay } from './components/ui/CloudOverlay';
import { Inspector } from './components/ui/Inspector';
import { WelcomeModal } from './components/ui/WelcomeModal';
import { Toast } from './components/ui/Toast';
import { useCircuitStore } from './store/useCircuitStore';
import { TRANSLATIONS } from './i18n/translations';
import { hasSeenTutorial } from './utils/presetStorage';
import { registerTourMobileSheetController, TourMobileSheetState } from './utils/tour';

type MobileSheetType = TourMobileSheetState;

export const App: React.FC = () => {
  const loadPreset = useCircuitStore((state) => state.loadPreset);
  const nodes = useCircuitStore((state) => state.nodes);
  const edges = useCircuitStore((state) => state.edges);
  const selectedNodeId = useCircuitStore((state) => state.selectedNodeId);
  const selectedEdgeId = useCircuitStore((state) => state.selectedEdgeId);
  const removeEdge = useCircuitStore((state) => state.removeEdge);
  const disconnectNodeWires = useCircuitStore((state) => state.disconnectNodeWires);
  const disconnectAndResetMcb = useCircuitStore((state) => state.disconnectAndResetMcb);
  const splitEdgeAtMidpoint = useCircuitStore((state) => state.splitEdgeAtMidpoint);
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);
  const worldMode = useCircuitStore((state) => state.worldMode);

  const t = TRANSLATIONS[language].mobileNav;
  const wireT = TRANSLATIONS[language].wire;

  const [activeMobileSheet, setActiveMobileSheet] = useState<MobileSheetType>('none');
  const [isWelcomeOpen, setIsWelcomeOpen] = useState<boolean>(() => !hasSeenTutorial());

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedNodeHasWires = Boolean(
    selectedNode &&
      edges.some(
        (e) =>
          !e.data?.isSnapWire &&
          (e.source === selectedNode.id || e.target === selectedNode.id)
      )
  );

  // Start the global 1-second Battery State of Charge (SoC) simulation timer
  useEffect(() => {
    const cleanup = useCircuitStore.getState().startBatteryInterval();
    return cleanup;
  }, []);

  // Initialize with the Simple Lamp & Switch circuit preset on first mount
  useEffect(() => {
    if (nodes.length === 0) {
      loadPreset('simple-lamp');
    }
  }, [loadPreset, nodes.length]);

  // Register mobile bottom-sheet controller so driver.js can open/close drawers during the tour
  useEffect(() => {
    registerTourMobileSheetController((nextSheet) => {
      flushSync(() => {
        setActiveMobileSheet(nextSheet);
      });
    });
    return () => registerTourMobileSheetController(null);
  }, []);

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

        {/* Central Canvas: Lab Mode (CircuitCanvas) or Outdoor Sandbox (OutdoorSandbox) */}
        <main
          id="tour-canvas-area"
          className="flex-1 relative h-full w-full min-w-0"
        >
          {worldMode === 'outside' ? <OutdoorSandbox /> : <CircuitCanvas />}

          {/* Floating Quick-Edit & Disconnect Wires Bar on Mobile when a component is selected */}
          {selectedNode && activeMobileSheet === 'none' && (
            <div className="md:hidden absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 max-w-[94vw]">
              <button
                onClick={() => setActiveMobileSheet('inspector')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-electric-600/95 text-white text-xs font-semibold shadow-glow border border-electric-400/50 active:scale-95 transition-transform truncate"
              >
                <Sliders className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {language === 'id' ? 'Atur' : 'Edit'} {selectedNode.data.label}
                </span>
              </button>

              {selectedNodeHasWires && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedNode.data.isMcbTripped) {
                      disconnectAndResetMcb(selectedNode.id);
                    } else {
                      disconnectNodeWires(selectedNode.id);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/95 hover:bg-red-500 text-white text-xs font-bold shadow-[0_0_16px_rgba(239,68,68,0.65)] border border-red-300/60 active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {selectedNode.data.isMcbTripped
                      ? language === 'id'
                        ? 'Putus Kabel & Reset'
                        : 'Cut Wires & Reset'
                      : language === 'id'
                      ? 'Putus Kabel'
                      : 'Cut Wires'}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Top Floating Wire Action Bar (Visible on ALL devices when a wire is selected) */}
          {selectedEdgeId && activeMobileSheet === 'none' && (
            <div
              id="tour-wire-actions"
              className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-void-900/95 backdrop-blur-md border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.65)]"
            >
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
      <nav className="tour-mobile-nav md:hidden h-14 bg-void-900 border-t border-white/10 px-3 flex items-center justify-between gap-2 z-30 shrink-0 select-none">
        <button
          id="tour-btn-tambah"
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

        {/* Center Live Power & Quick PLN Bill Calculator Trigger */}
        <button
          type="button"
          onClick={() => {
            useCircuitStore.getState().selectNode(null);
            useCircuitStore.getState().selectEdge(null);
            setActiveMobileSheet('inspector');
          }}
          title={
            language === 'id'
              ? 'Ketuk untuk cek Kalkulator Tagihan Listrik PLN (Rp)'
              : 'Tap to open PLN Electricity Bill Calculator (IDR)'
          }
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-void-950 hover:bg-void-850 border border-white/10 text-[11px] font-mono text-slate-200 transition-all active:scale-95 cursor-pointer"
        >
          <Activity className="w-3.5 h-3.5 text-electric-400 shrink-0" />
          <span>{simulation.totalPowerDrawn.toFixed(2)}W</span>
          <span className="text-[9px] font-sans font-semibold px-1.5 py-0.5 rounded bg-electric-500/15 text-electric-400 border border-electric-500/25">
            {language === 'id' ? 'Cek Rp' : 'Cost'}
          </span>
        </button>

        <button
          id="tour-btn-info"
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

      {/* First-Visit Welcome Modal to Launch or Skip Spotlight Tour */}
      <WelcomeModal
        isOpen={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
      />

      {/* Transient notifications (e.g. wrong bulb base for a socket) */}
      <Toast />

      {/* 2-Second Pure CSS Cloud Transition Overlay */}
      <CloudOverlay />
    </div>
  );
};

export default App;
