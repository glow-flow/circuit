import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  PlusCircle,
  Sliders,
  Activity,
  Scissors,
  Pin,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { Header } from './components/ui/Header';
import { SidebarPalette } from './components/ui/SidebarPalette';
import { CircuitCanvas } from './components/canvas/CircuitCanvas';
import { OutdoorSandbox } from './components/canvas/OutdoorSandbox';
import { CloudOverlay } from './components/ui/CloudOverlay';
import { Inspector } from './components/ui/Inspector';
import { WelcomeModal } from './components/ui/WelcomeModal';
import { Toast } from './components/ui/Toast';
import { MobileBottomSheet, BottomSheetSnapState } from './components/ui/mobile/MobileBottomSheet';
import { MobileHubModal } from './components/ui/mobile/MobileHubModal';
import { useCircuitStore } from './store/useCircuitStore';
import { TRANSLATIONS } from './i18n/translations';
import { hasSeenTutorial } from './utils/presetStorage';
import {
  loadWorkspaceAutosaveWithValidation,
  setupPageExitPersistence,
} from './utils/workspacePersistence';
import { registerTourMobileSheetController, TourMobileSheetState } from './utils/tour';
import { decodeShareableUrlHash } from './utils/workspaceManagement';
import { getComponentDisplayName } from './utils/nodeLocalization';

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
  const language = useCircuitStore((state) => state.language);
  const worldMode = useCircuitStore((state) => state.worldMode);
  const setActiveModal = useCircuitStore((state) => state.setActiveModal);
  const theme = useCircuitStore((state) => state.theme);

  // Synchronize document theme class for clean light mode / dark mode
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('theme-light');
      root.classList.remove('dark');
    } else {
      root.classList.remove('theme-light');
      root.classList.add('dark');
    }
  }, [theme]);

  const t = TRANSLATIONS[language].mobileNav;
  const wireT = TRANSLATIONS[language].wire;
  const isId = language === 'id';

  const [activeMobileSheet, setActiveMobileSheet] = useState<MobileSheetType>('none');
  const [bottomSheetSnap, setBottomSheetSnap] = useState<BottomSheetSnapState>('closed');
  const [isWelcomeOpen, setIsWelcomeOpen] = useState<boolean>(() => !hasSeenTutorial());
  const [isMobileHubOpen, setIsMobileHubOpen] = useState<boolean>(false);

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
  // and register page exit persistence listener to flush pending saves.
  useEffect(() => {
    const cleanupBattery = useCircuitStore.getState().startBatteryInterval();
    const cleanupPageExit = setupPageExitPersistence();
    return () => {
      cleanupBattery();
      cleanupPageExit();
    };
  }, []);

  // Workspace initialization: runs strictly ONCE on initial application mount
  const isWorkspaceInitializedRef = useRef(false);

  useEffect(() => {
    if (isWorkspaceInitializedRef.current) return;
    isWorkspaceInitializedRef.current = true;

    // 1. Check for shared circuit URL hash (#circuit=...)
    if (typeof window !== 'undefined' && window.location.hash) {
      const decodedResult = decodeShareableUrlHash(window.location.hash);
      if (decodedResult && decodedResult.isValid) {
        const { payload } = decodedResult;
        useCircuitStore.getState().loadCustomCircuit(
          payload.nodes,
          payload.edges,
          payload.metadata.worldMode
        );
        useCircuitStore.getState().notify(
          isId
            ? `Rangkaian "${payload.metadata.circuitTitle}" berhasil dimuat dari tautan!`
            : `Circuit "${payload.metadata.circuitTitle}" loaded from shared link!`
        );
        window.history.replaceState(null, '', window.location.pathname);
        return;
      }
    }

    // 2. Load verified autosaved workspace from localStorage
    const autosaveResult = loadWorkspaceAutosaveWithValidation();
    if (autosaveResult.status === 'restored') {
      useCircuitStore.getState().loadCustomCircuit(
        autosaveResult.nodes,
        autosaveResult.edges,
        useCircuitStore.getState().worldMode
      );
      return;
    }

    // 3. User intentionally cleared the workspace; keep it empty
    if (autosaveResult.status === 'empty_workspace') {
      return;
    }

    // 4. Corrupted cache notification before fallback
    if (autosaveResult.status === 'corrupted') {
      useCircuitStore.getState().notify(
        isId
          ? 'Data rangkaian sebelumnya rusak dan dipulihkan ke pengaturan awal.'
          : 'Previous circuit cache was corrupted and reset to default.'
      );
    }

    // 5. First-time visitor or corrupted fallback: load Simple Lamp default
    if (useCircuitStore.getState().nodes.length === 0) {
      loadPreset('simple-lamp');
    }
  }, [loadPreset, isId]);

  // Register mobile bottom-sheet controller so driver.js can open/close drawers during the tour
  useEffect(() => {
    registerTourMobileSheetController((nextSheet) => {
      flushSync(() => {
        setActiveMobileSheet(nextSheet);
        setBottomSheetSnap(nextSheet === 'none' ? 'closed' : 'half');
      });
    });
    return () => registerTourMobileSheetController(null);
  }, []);

  const openMobileSheet = (sheet: 'palette' | 'inspector') => {
    setActiveMobileSheet(sheet);
    setBottomSheetSnap('half');
  };

  const handleSnapChange = (nextSnap: BottomSheetSnapState) => {
    setBottomSheetSnap(nextSnap);
    if (nextSnap === 'closed') {
      setActiveMobileSheet('none');
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] min-h-[100dvh] w-screen bg-void-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Utility Header */}
      <Header />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 min-h-0 relative w-full overflow-hidden">
        {/* Desktop Left Component Palette */}
        <SidebarPalette />

        {/* Central Canvas: Lab Mode (CircuitCanvas) or Outdoor Sandbox (OutdoorSandbox) */}
        <main
          id="tour-canvas-area"
          className="flex-1 relative h-full w-full min-w-0 min-h-0"
        >
          {worldMode === 'outside' ? <OutdoorSandbox /> : <CircuitCanvas />}

          {/* Floating Quick-Edit & Disconnect Wires Bar on Mobile when a component is selected */}
          {selectedNode && activeMobileSheet === 'none' && (
            <div className="md:hidden absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 max-w-[94vw]">
              <button
                type="button"
                onClick={() => openMobileSheet('inspector')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-void-900 border border-white/20 hover:bg-void-800 text-slate-100 text-xs font-medium shadow-md active:scale-95 transition-transform truncate cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <span className="truncate">
                  {isId ? 'Atur' : 'Edit'} {getComponentDisplayName(selectedNode.data, language)}
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-void-900 border border-red-500/40 hover:bg-red-950/40 text-red-300 text-xs font-medium shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>
                    {selectedNode.data.isMcbTripped
                      ? isId
                        ? 'Putus Kabel & Reset'
                        : 'Cut Wires & Reset'
                      : isId
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

        {/* High-Performance Mobile Draggable Bottom Sheet */}
        {activeMobileSheet !== 'none' && (
          <MobileBottomSheet
            snapState={bottomSheetSnap}
            onSnapChange={handleSnapChange}
            title={
              activeMobileSheet === 'palette'
                ? isId
                  ? 'Palet Komponen Listrik'
                  : 'Component Palette'
                : selectedNode
                ? getComponentDisplayName(selectedNode.data, language)
                : isId
                ? 'Inspektor Rangkaian'
                : 'Circuit Inspector'
            }
            subtitle={
              activeMobileSheet === 'palette'
                ? isId
                  ? 'Sentuh & geser untuk menambahkan komponen'
                  : 'Drag or tap to place components'
                : selectedNode
                ? selectedNode.data.type.toUpperCase()
                : isId
                ? 'Telemetri Global & Rumus'
                : 'Global Telemetry & Formulas'
            }
          >
            {activeMobileSheet === 'palette' ? (
              <SidebarPalette
                isMobileDrawer
                onCloseMobile={() => handleSnapChange('closed')}
              />
            ) : (
              <Inspector
                isMobileDrawer
                onCloseMobile={() => handleSnapChange('closed')}
              />
            )}
          </MobileBottomSheet>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar (WCAG AA compliant with 44px minimum tap targets) */}
      <nav className="tour-mobile-nav md:hidden min-h-[52px] bg-void-900 border-t border-white/10 px-2 py-1 flex items-center justify-between gap-1 z-30 shrink-0 select-none">
        {/* 1. Add Part Button */}
        <button
          id="tour-btn-tambah"
          type="button"
          onClick={() => openMobileSheet('palette')}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center rounded-xl text-[10px] font-semibold transition-all active:scale-95 cursor-pointer ${
            activeMobileSheet === 'palette'
              ? 'bg-electric-500/20 text-electric-300 font-bold border border-electric-500/40'
              : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-electric-400" />
          <span className="truncate">{t.addPart}</span>
        </button>

        {/* 2. Challenge Missions Button */}
        <button
          type="button"
          onClick={() => setActiveModal('missions')}
          className="flex-1 min-h-[44px] flex flex-col items-center justify-center rounded-xl text-[10px] font-semibold text-amber-300 hover:bg-amber-500/10 transition-all active:scale-95 cursor-pointer"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="truncate">{isId ? 'Misi' : 'Missions'}</span>
        </button>

        {/* 3. Live Oscilloscope Button */}
        <button
          type="button"
          onClick={() => setActiveModal('oscilloscope')}
          className="flex-1 min-h-[44px] flex flex-col items-center justify-center rounded-xl text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/10 transition-all active:scale-95 cursor-pointer"
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="truncate">Scope</span>
        </button>

        {/* 4. Inspector & Formulas Button */}
        <button
          id="tour-btn-info"
          type="button"
          onClick={() => openMobileSheet('inspector')}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center rounded-xl text-[10px] font-semibold transition-all active:scale-95 cursor-pointer ${
            activeMobileSheet === 'inspector' || selectedNode
              ? 'bg-electric-500/20 text-electric-300 font-bold border border-electric-500/40'
              : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          <Sliders className="w-4 h-4 text-electric-400" />
          <span className="truncate">{t.inspector}</span>
        </button>

        {/* 5. Circuit 4.0 Hub Menu Button */}
        <button
          type="button"
          onClick={() => setIsMobileHubOpen(true)}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center rounded-xl text-[10px] font-semibold transition-all active:scale-95 cursor-pointer ${
            isMobileHubOpen
              ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
              : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="truncate">{isId ? 'Menu 4.0' : 'Menu 4.0'}</span>
        </button>
      </nav>

      {/* Mobile Hub Navigation Drawer */}
      <MobileHubModal
        isOpen={isMobileHubOpen}
        onClose={() => setIsMobileHubOpen(false)}
      />

      {/* First-Visit Welcome Modal to Launch or Skip Spotlight Tour */}
      <WelcomeModal
        isOpen={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
      />

      {/* Transient notifications */}
      <Toast />

      {/* Pure CSS Cloud Transition Overlay */}
      <CloudOverlay />
    </div>
  );
};

export default App;
