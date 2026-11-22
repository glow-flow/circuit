import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  Sliders,
  Scissors,
  Pin,
  Undo2,
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
import { MobileBottomNav } from './components/ui/mobile/MobileBottomNav';
import { MobileHubModal } from './components/ui/mobile/MobileHubModal';
import { InteractiveTutorialBanner } from './components/ui/tutorial/InteractiveTutorialBanner';
import { ShortCircuitZeroVoltPopup } from './components/ui/diagnostics/ShortCircuitZeroVoltPopup';
import { OutdoorGridReadyPopup } from './components/ui/diagnostics/OutdoorGridReadyPopup';
import { useCircuitStore } from './store/useCircuitStore';
import { TRANSLATIONS } from './i18n/translations';
import { hasSeenTutorial, markTutorialAsSeen } from './utils/presetStorage';
import {
  loadWorkspaceAutosaveWithValidation,
  setupPageExitPersistence,
} from './utils/workspacePersistence';
import { registerTourMobileSheetController, TourMobileSheetState } from './utils/tour';
import { decodeShareableUrlHash } from './utils/workspaceManagement';
import { decodeTerrainGrid } from './utils/terrainCompression';
import { getComponentDisplayName } from './utils/nodeLocalization';
import { OutdoorGenerationMiniHud } from './components/ui/telemetry/OutdoorGenerationMiniHud';
import { PhysicsLensDock } from './components/ui/lens/PhysicsLensDock';
import { ProbeReadoutHud } from './components/ui/lens/ProbeReadoutHud';
import { OfflineStatusBanner } from './components/ui/pwa/OfflineStatusBanner';
import {
  decodeLkpdAssignmentHash,
  extractSubmissionTokenFromHash,
} from './lkpd/lkpdCodec';
import { MISSION_CATALOG } from './missions/missionCatalog';

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
  const canUndo = useCircuitStore((state) => state.canUndo);
  const undo = useCircuitStore((state) => state.undo);
  const language = useCircuitStore((state) => state.language);
  const worldMode = useCircuitStore((state) => state.worldMode);
  const theme = useCircuitStore((state) => state.theme);
  const physicsLensMode = useCircuitStore((state) => state.physicsLensMode);

  // Synchronize document theme class, PWA status bar theme-color & active UI language
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.lang = language;
    const themeColorMeta = document.getElementById('app-theme-color');
    if (theme === 'light') {
      root.classList.add('theme-light');
      root.classList.remove('dark');
      themeColorMeta?.setAttribute('content', '#F5F7FA');
    } else {
      root.classList.remove('theme-light');
      root.classList.add('dark');
      themeColorMeta?.setAttribute('content', '#0B0F14');
    }
  }, [theme, language]);

  const wireT = TRANSLATIONS[language].wire;
  const isId = language === 'id';

  const [activeMobileSheet, setActiveMobileSheet] = useState<MobileSheetType>('none');
  const [bottomSheetSnap, setBottomSheetSnap] = useState<BottomSheetSnapState>('closed');
  const [isWelcomeOpen, setIsWelcomeOpen] = useState<boolean>(false);
  const [showStarterHint, setShowStarterHint] = useState<boolean>(() => !hasSeenTutorial());
  const [isMobileHubOpen, setIsMobileHubOpen] = useState<boolean>(false);
  const [isInteractiveCoachOpen, setIsInteractiveCoachOpen] = useState<boolean>(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);

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

    // Guard against unintended horizontal layout shifts on the root document / body / window only.
    // Child scroll containers (such as the Outdoor Sandbox panoramic viewport) MUST NOT be blocked.
    const handleScroll = (e: Event) => {
      const target = e.target;
      const isRootElement =
        !target ||
        (typeof document !== 'undefined' && target === document) ||
        (typeof window !== 'undefined' && target === window) ||
        (typeof document !== 'undefined' &&
          (target === document.documentElement || target === document.body));

      if (isRootElement) {
        if (typeof window !== 'undefined' && window.scrollX !== 0) {
          window.scrollTo(0, window.scrollY);
        }
        if (typeof document !== 'undefined') {
          if (document.documentElement.scrollLeft !== 0) document.documentElement.scrollLeft = 0;
          if (document.body.scrollLeft !== 0) document.body.scrollLeft = 0;
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    }

    return () => {
      cleanupBattery();
      cleanupPageExit();
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Workspace initialization: runs strictly ONCE on initial application mount
  const isWorkspaceInitializedRef = useRef(false);

  const applyHashDeepLink = React.useCallback(
    (rawHash: string): boolean => {
      if (!rawHash || typeof window === 'undefined') return false;

      const lkpdSubmissionToken = extractSubmissionTokenFromHash(rawHash);
      if (lkpdSubmissionToken) {
        setIsWelcomeOpen(false);
        useCircuitStore.getState().openLkpdModal({
          tab: 'gradebook',
          submissionToken: lkpdSubmissionToken,
        });
        window.history.replaceState(null, '', window.location.pathname);
        return false;
      }

      const lkpdAssignment = decodeLkpdAssignmentHash(rawHash);
      if (lkpdAssignment) {
        setIsWelcomeOpen(false);
        if (lkpdAssignment.isValid) {
          const { payload } = lkpdAssignment;
          const mission = MISSION_CATALOG.find((m) => m.id === payload.missionId);
          if (mission?.starterCircuitName) {
            loadPreset(mission.starterCircuitName as Parameters<typeof loadPreset>[0]);
          } else if (useCircuitStore.getState().nodes.length === 0) {
            loadPreset('simple-lamp');
          }
          useCircuitStore.getState().setActiveLkpdAssignment(payload);
          useCircuitStore.getState().openLkpdModal({
            tab: 'student',
            missionId: payload.missionId,
          });
          useCircuitStore.getState().notify(
            isId
              ? `Tugas ${payload.lkpdCode}${payload.className ? ` (${payload.className})` : ''} berhasil dibuka.`
              : `Assignment ${payload.lkpdCode}${payload.className ? ` (${payload.className})` : ''} opened.`
          );
        } else {
          useCircuitStore.getState().notify(lkpdAssignment.errorMessage);
        }
        window.history.replaceState(null, '', window.location.pathname);
        return true;
      }

      const decodedResult = decodeShareableUrlHash(rawHash);
      if (decodedResult && decodedResult.isValid) {
        const { payload } = decodedResult;
        useCircuitStore.getState().loadCustomCircuit(
          payload.nodes,
          payload.edges,
          payload.metadata.worldMode,
          payload.terrainRle ? decodeTerrainGrid(payload.terrainRle) : undefined
        );
        useCircuitStore.getState().notify(
          isId
            ? `Rangkaian "${payload.metadata.circuitTitle}" berhasil dimuat dari tautan!`
            : `Circuit "${payload.metadata.circuitTitle}" loaded from shared link!`
        );
        window.history.replaceState(null, '', window.location.pathname);
        return true;
      }

      return false;
    },
    [loadPreset, isId]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleHashChange = () => {
      if (window.location.hash) {
        applyHashDeepLink(window.location.hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [applyHashDeepLink]);

  useEffect(() => {
    if (isWorkspaceInitializedRef.current) return;
    isWorkspaceInitializedRef.current = true;

    // 1. Check for URL hash deep links (#lkpd=..., #lkpd-sub=..., #circuit=...)
    if (typeof window !== 'undefined' && window.location.hash) {
      const handledWorkspaceLoad = applyHashDeepLink(window.location.hash);
      if (handledWorkspaceLoad) {
        return;
      }
    }

    // 2. Load verified autosaved workspace from localStorage
    const autosaveResult = loadWorkspaceAutosaveWithValidation();
    if (autosaveResult.status === 'restored') {
      const targetMode = autosaveResult.worldMode ?? useCircuitStore.getState().worldMode ?? 'lab';
      useCircuitStore.getState().loadCustomCircuit(
        autosaveResult.nodes,
        autosaveResult.edges,
        targetMode
      );
      useCircuitStore.setState({ worldMode: targetMode });
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
  }, [applyHashDeepLink, loadPreset, isId]);

  // Global Ctrl+Z / Cmd+Z keyboard shortcut for instant workspace undo
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleUndoKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
      if (e.key.toLowerCase() !== 'z') return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const storeState = useCircuitStore.getState();
      if (storeState.activeModal !== null || !storeState.canUndo) return;

      e.preventDefault();
      storeState.undo();
    };

    window.addEventListener('keydown', handleUndoKeyDown);
    return () => window.removeEventListener('keydown', handleUndoKeyDown);
  }, []);

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
    <div className="flex flex-col h-[100dvh] min-h-[100dvh] w-full max-w-full bg-void-950 text-ink overflow-hidden font-sans">
      <a href="#tour-canvas-area" className="skip-link">
        {isId ? 'Lompat ke kanvas' : 'Skip to canvas'}
      </a>

      {/* Top Utility Header */}
      <Header
        onOpenWelcomeGuide={() => setIsWelcomeOpen(true)}
        onOpenMobileHub={() => setIsMobileHubOpen(true)}
        isMobileHubOpen={isMobileHubOpen}
        isSaveModalOpen={isSaveModalOpen}
        onSaveModalOpenChange={setIsSaveModalOpen}
      />

      {/* Live Offline / Service Worker Update Banner */}
      <OfflineStatusBanner />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 min-h-0 relative w-full overflow-hidden">
        {/* Desktop Left Component Palette */}
        <SidebarPalette />

        {/* Central Canvas: Lab Mode (CircuitCanvas) or Outdoor Sandbox (OutdoorSandbox) */}
        <main
          id="tour-canvas-area"
          tabIndex={-1}
          className="flex-1 relative h-full w-full min-w-0 min-h-0"
        >
          {worldMode === 'outside' ? (
            <OutdoorSandbox isTutorialActive={isInteractiveCoachOpen} />
          ) : (
            <CircuitCanvas />
          )}
          <OutdoorGenerationMiniHud />

          {/* Non-blocking 1-line starter hint for first-time visitors */}
          {showStarterHint &&
            !selectedNode &&
            !selectedEdgeId &&
            activeMobileSheet === 'none' &&
            !isInteractiveCoachOpen &&
            worldMode === 'lab' && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 max-w-[94vw] flex items-center gap-2 px-3 py-1.5 rounded-xl bg-void-900 border border-control shadow-lg text-xs text-ink">
                <span className=" whitespace-nowrap">
                  {isId
                    ? 'Ketuk saklar atau + Alat untuk merangkai.'
                    : 'Tap the switch or + Parts to build.'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    markTutorialAsSeen();
                    setShowStarterHint(false);
                  }}
                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-electric-600 hover:bg-electric-500 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                >
                  {isId ? 'Oke' : 'Got it'}
                </button>
              </div>
            )}

          {/* Interactive Hands-On Practice Coach Banner */}
          <InteractiveTutorialBanner
            isOpen={isInteractiveCoachOpen}
            onClose={() => setIsInteractiveCoachOpen(false)}
            onOpenFullGuide={() => setIsWelcomeOpen(true)}
          />

          {/* Interactive Physics X-Ray Lens & Finger Probe HUD */}
          <ProbeReadoutHud
            isHidden={activeMobileSheet !== 'none' || isInteractiveCoachOpen}
          />
          <PhysicsLensDock
            isHidden={activeMobileSheet !== 'none' || isInteractiveCoachOpen}
          />

          {/* Mobile (< 640px) Thumb-Reachable 1-Tap Undo Pill, clear of zoom Controls & Lensa chip */}
          {canUndo && activeMobileSheet === 'none' && !isInteractiveCoachOpen && (
            <button
              type="button"
              onClick={undo}
              aria-label={isId ? 'Batalkan langkah terakhir' : 'Undo last action'}
              className={`sm:hidden absolute ${
                worldMode === 'outside' ? 'bottom-[64px] left-3' : 'bottom-3 left-14'
              } z-30 flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl bg-void-900 hover:bg-void-850 border border-control text-ink text-xs font-bold shadow-lg active:scale-95 transition-colors cursor-pointer`}
            >
              <Undo2 className="w-4 h-4 text-electric-400 shrink-0" aria-hidden="true" />
              <span>{isId ? 'Urungkan' : 'Undo'}</span>
            </button>
          )}

          {/* Floating Bottom-Right Short-Circuit 0V Battery Pop-Up & Visual Explainer */}
          <ShortCircuitZeroVoltPopup />

          {/* Floating Bottom-Right Outdoor Power Plant -> Lab Battery Charging Pop-Up */}
          <OutdoorGridReadyPopup />

          {/* Floating Quick-Edit & Disconnect Wires Bar on Mobile & Tablet (< 1024px) */}
          {selectedNode && activeMobileSheet === 'none' && !isInteractiveCoachOpen && physicsLensMode !== 'probe' && (
            <div className="lg:hidden absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 max-w-[94vw]">
              <button
                type="button"
                onClick={() => openMobileSheet('inspector')}
                className="flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-full bg-void-900 border border-control hover:bg-void-850 text-ink text-xs font-medium shadow-md active:scale-95 transition-colors truncate cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
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
                  className="flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-full bg-void-900 border border-danger-500/60 hover:bg-danger-600 hover:text-white text-danger-400 text-xs font-semibold shadow-md active:scale-95 transition-colors shrink-0 cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
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
          {selectedEdgeId && activeMobileSheet === 'none' && physicsLensMode !== 'probe' && (
            <div
              id="tour-wire-actions"
              className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-void-900 border border-control shadow-xl"
            >
              <button
                type="button"
                onClick={() => splitEdgeAtMidpoint(selectedEdgeId)}
                className="flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-full bg-electric-500/15 hover:bg-electric-500/25 text-electric-400 text-xs font-bold border border-electric-500/40 active:scale-95 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Pin className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{wireT.addBend}</span>
              </button>
              <button
                type="button"
                onClick={() => removeEdge(selectedEdgeId)}
                className="flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 rounded-full bg-danger-600 hover:bg-danger-700 text-white text-xs font-bold border border-danger-500 active:scale-95 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Scissors className="w-3.5 h-3.5" aria-hidden="true" />
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

      {/* Clean 4-Tab Mobile Bottom Navigation */}
      <MobileBottomNav
        activeMobileSheet={activeMobileSheet}
        onOpenMobileSheet={openMobileSheet}
      />

      {/* Mobile Hub Navigation Drawer ("Menu Lab & Alat Praktikum") */}
      <MobileHubModal
        isOpen={isMobileHubOpen}
        onClose={() => setIsMobileHubOpen(false)}
        onOpenSavePresetModal={() => setIsSaveModalOpen(true)}
        onOpenWelcomeGuide={() => setIsWelcomeOpen(true)}
      />

      {/* Teacher & Student Quick-Start Guide + Interactive Practice Launcher */}
      <WelcomeModal
        isOpen={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
        onStartInteractivePractice={() => setIsInteractiveCoachOpen(true)}
      />

      {/* Transient notifications */}
      <Toast />

      {/* Pure CSS Cloud Transition Overlay */}
      <CloudOverlay />
    </div>
  );
};

export default App;
