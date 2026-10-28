import { describe, it, expect, beforeEach } from 'vitest';
import {
  TOUR_STEPS,
  prepareViewportForTourStep,
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

  it('defines all 9 spotlight steps in the exact sequence with required target IDs and copy', () => {
    expect(TOUR_STEPS).toHaveLength(9);

    const targets = TOUR_STEPS.map((step) => step.element);
    expect(targets).toEqual([
      '#tour-dropdown-contoh',
      '#tour-btn-tambah',
      '#tour-panel-komponen',
      '#tour-panel-inspector',
      '#tour-btn-info',
      '#tour-canvas-area',
      '#tour-btn-save',
      '#tour-btn-reset',
      '#tour-btn-help',
    ]);

    const titles = TOUR_STEPS.map((step) => step.popover?.title);
    expect(titles).toEqual([
      'Template Rangkaian',
      'Tambah Komponen',
      'Pilih Alat',
      'Ubah Properti',
      'Info & Rumus',
      'Hapus Kabel',
      'Simpan Karya',
      'Bersihkan Kanvas',
      'Panduan Ulang',
    ]);
  });

  it('synchronizes mobile drawers and node selection across tour steps', () => {
    let activeSheet: TourMobileSheetState = 'none';
    registerTourMobileSheetController((sheet) => {
      activeSheet = sheet;
    });

    const originalWindow = (globalThis as any).window;
    (globalThis as any).window = { innerWidth: 390 };

    try {
      useCircuitStore.getState().loadPreset('simple-lamp');
      useCircuitStore.getState().selectNode(null);

      // Step 3 (index 2): opens Component Palette on mobile
      prepareViewportForTourStep(2);
      expect(activeSheet).toBe('palette');

      // Step 4 (index 3): opens Inspector on mobile and auto-selects a component node
      prepareViewportForTourStep(3);
      expect(activeSheet).toBe('inspector');
      expect(useCircuitStore.getState().selectedNodeId).toBeTruthy();

      // Step 5 (index 4): closes mobile drawer so bottom button is visible
      prepareViewportForTourStep(4);
      expect(activeSheet).toBe('none');
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
