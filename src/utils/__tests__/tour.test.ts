import { describe, it, expect, beforeEach } from 'vitest';
import {
  TOUR_STEPS,
  OUTDOOR_TOUR_STEPS,
  prepareViewportForTourStep,
  prepareOutdoorViewportForTourStep,
  registerTourMobileSheetController,
  TourMobileSheetState,
} from '../tour';
import {
  TUTORIAL_STORAGE_KEY,
  hasSeenTutorial,
  markTutorialAsSeen,
} from '../presetStorage';
import { useCircuitStore } from '../../store/useCircuitStore';

describe('Interactive Spotlight Tour (driver.js) & Welcome Persistence', () => {
  beforeEach(() => {
    registerTourMobileSheetController(null);
  });

  it('defines all 10 spotlight steps in sequence with required target IDs including #tour-wire-actions', () => {
    expect(TOUR_STEPS).toHaveLength(10);

    const targets = TOUR_STEPS.map((step) => step.element);
    expect(targets).toEqual([
      '#tour-dropdown-contoh',
      '#tour-btn-tambah',
      '#tour-panel-komponen',
      '#tour-panel-inspector',
      '#tour-btn-info',
      '#tour-canvas-area',
      '#tour-wire-actions',
      '#tour-btn-save',
      '#tour-btn-reset',
      '#tour-btn-help',
    ]);

    const titles = TOUR_STEPS.map((step) => step.popover?.title);
    expect(titles).toEqual([
      'Template Rangkaian',
      'Tambah Komponen',
      'Pilih Alat',
      'Ubah Properti Komponen',
      'Info & Rumus',
      'Klik Salah Satu Kabel',
      'Pin Kabel & Putus Kabel',
      'Simpan Karya',
      'Bersihkan Kanvas',
      'Panduan Ulang',
    ]);
  });

  it('defines dedicated Outdoor Nature Sandbox tour steps (OUTDOOR_TOUR_STEPS) and synchronizes outdoor mobile drawers', () => {
    expect(OUTDOOR_TOUR_STEPS).toHaveLength(6);
    expect(OUTDOOR_TOUR_STEPS.map((s) => s.element)).toEqual([
      '#tour-outdoor-brushes',
      '#tour-outdoor-spawn',
      '#tour-canvas-area',
      '#tour-panel-komponen',
      '#tour-panel-inspector',
      '#tour-btn-world',
    ]);

    let activeSheet: TourMobileSheetState = 'none';
    registerTourMobileSheetController((sheet) => {
      activeSheet = sheet;
    });

    const originalWindow = (globalThis as any).window;
    (globalThis as any).window = { innerWidth: 390 };

    try {
      prepareOutdoorViewportForTourStep(3);
      expect(activeSheet).toBe('palette');

      prepareOutdoorViewportForTourStep(4);
      expect(activeSheet).toBe('inspector');

      prepareOutdoorViewportForTourStep(5);
      expect(activeSheet).toBe('none');
    } finally {
      (globalThis as any).window = originalWindow;
    }
  });

  it('synchronizes mobile drawers, component selection, and wire selection across tour steps', () => {
    let activeSheet: TourMobileSheetState = 'none';
    registerTourMobileSheetController((sheet) => {
      activeSheet = sheet;
    });

    const originalWindow = (globalThis as any).window;
    (globalThis as any).window = { innerWidth: 390 };

    try {
      useCircuitStore.getState().loadPreset('simple-lamp');
      useCircuitStore.getState().selectNode(null);
      useCircuitStore.getState().selectEdge(null);

      // Step 3 (index 2): opens Component Palette on mobile
      prepareViewportForTourStep(2);
      expect(activeSheet).toBe('palette');

      // Step 4 (index 3): opens Inspector on mobile and auto-selects a component node
      prepareViewportForTourStep(3);
      expect(activeSheet).toBe('inspector');
      expect(useCircuitStore.getState().selectedNodeId).toBeTruthy();
      expect(useCircuitStore.getState().selectedEdgeId).toBeNull();

      // Step 5 (index 4): closes mobile drawer and clears selection so bottom button is visible
      prepareViewportForTourStep(4);
      expect(activeSheet).toBe('none');
      expect(useCircuitStore.getState().selectedNodeId).toBeNull();

      // Step 6 (index 5) & Step 7 (index 6): auto-selects a wire edge so #tour-wire-actions is mounted
      prepareViewportForTourStep(5);
      expect(activeSheet).toBe('none');
      expect(useCircuitStore.getState().selectedNodeId).toBeNull();
      expect(useCircuitStore.getState().selectedEdgeId).toBeTruthy();

      prepareViewportForTourStep(6);
      expect(useCircuitStore.getState().selectedEdgeId).toBeTruthy();

      // Step 8 (index 7): clears wire selection when moving to header buttons
      prepareViewportForTourStep(7);
      expect(useCircuitStore.getState().selectedEdgeId).toBeNull();
    } finally {
      (globalThis as any).window = originalWindow;
    }
  });

  it('persists has_seen_tutorial in localStorage safely', () => {
    const store: Record<string, string> = {};
    const originalWindow = (globalThis as any).window;
    (globalThis as any).window = {
      localStorage: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, val: string) => {
          store[key] = val;
        },
      },
    };

    try {
      expect(TUTORIAL_STORAGE_KEY).toBe('has_seen_tutorial');
      expect(hasSeenTutorial()).toBe(false);

      markTutorialAsSeen();
      expect(store['has_seen_tutorial']).toBe('true');
      expect(hasSeenTutorial()).toBe(true);
    } finally {
      (globalThis as any).window = originalWindow;
    }
  });
});
