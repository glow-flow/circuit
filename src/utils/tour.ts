/**
 * Interactive Product Spotlight Tour Module (`driver.js`).
 *
 * Guides students and teachers step-by-step across the real Circuit Sandbox UI
 * elements using a 10-step spotlight sequence. Automatically synchronizes mobile
 * bottom-sheet drawers (`palette` / `inspector`), component selection, and wire
 * selection so every target element (`#tour-panel-inspector`, `#tour-wire-actions`, etc.)
 * is visible and accurately highlighted on both Mobile and Desktop viewports.
 *
 * Time Complexity:
 * - Tour initialization (`startTour`): O(1) over the fixed 10-step configuration
 * - Step transition preparation (`prepareViewportForTourStep`): O(N + E) where N is node count and E is edge count
 */

import { driver, DriveStep, Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { markTutorialAsSeen, TUTORIAL_STORAGE_KEY } from './presetStorage';
import { useCircuitStore } from '../store/useCircuitStore';

export type TourMobileSheetState = 'none' | 'palette' | 'inspector';

type MobileSheetController = (sheet: TourMobileSheetState) => void;

let registeredMobileSheetController: MobileSheetController | null = null;
let activeDriverInstance: Driver | null = null;

/**
 * Registers a synchronous controller from `App.tsx` so the spotlight tour can
 * automatically open/close the mobile Component Box (`#tour-panel-komponen`)
 * and Inspector (`#tour-panel-inspector`) drawers during Step 3 and Step 4.
 *
 * @param controller Callback that updates `activeMobileSheet` in `App.tsx`
 */
export function registerTourMobileSheetController(
  controller: MobileSheetController | null
): void {
  registeredMobileSheetController = controller;
}

/**
 * Exports the 10 spotlight steps in a structured constant so unit tests can
 * verify target selectors, titles, and descriptions without requiring a full browser.
 */
export const TOUR_STEPS: DriveStep[] = [
  {
    element: '#tour-dropdown-contoh',
    popover: {
      title: 'Template Rangkaian',
      description:
        'Bingung mulai dari mana? Pilih contoh rangkaian Seri atau Paralel di sini.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#tour-btn-tambah',
    popover: {
      title: 'Tambah Komponen',
      description:
        'Klik di sini untuk membuka kotak komponen (Baterai, Lampu, dll).',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '#tour-panel-komponen',
    popover: {
      title: 'Pilih Alat',
      description:
        "Pilih komponen, lalu tekan 'Taruh di kanvas'. Di desktop, kamu bisa drag langsung ke kanvas.",
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '#tour-panel-inspector',
    popover: {
      title: 'Ubah Properti Komponen',
      description:
        'Klik komponen di kanvas (di HP, ketuk tombol "Atur" yang muncul di atas), lalu ubah Jenis Lampu (7 tipe), Hambatan (Ω), atau Tegangan Baterai (V) di panel ini.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '#tour-btn-info',
    popover: {
      title: 'Info & Rumus',
      description:
        'Klik di sini untuk melihat detail perhitungan (V, I, R, P) dari rangkaianmu.',
      side: 'top',
      align: 'end',
    },
  },
  {
    element: '#tour-canvas-area',
    popover: {
      title: 'Klik Salah Satu Kabel',
      description:
        'Coba klik/ketuk salah satu garis kabel di kanvas (kabel yang dipilih akan menyala kuning-oranye). Saat kabel diklik, tombol aksi kabel akan muncul di bagian atas kanvas.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#tour-wire-actions',
    popover: {
      title: 'Pin Kabel & Putus Kabel',
      description:
        "Setelah kabel diklik, tekan 'Tambah Tekukan' (atau ketuk 2x pada kabel) untuk membuat pin titik belokan (Anchor Point) agar jalur kabel rapi, atau tekan 'Potong Kabel' untuk memutus sambungan.",
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#tour-btn-save',
    popover: {
      title: 'Simpan Karya',
      description: 'Jangan lupa simpan rangkaianmu agar tidak hilang.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#tour-btn-reset',
    popover: {
      title: 'Bersihkan Kanvas',
      description:
        'Gunakan tombol sampah di atas untuk menghapus semua dan mulai dari awal.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '#tour-btn-help',
    popover: {
      title: 'Panduan Ulang',
      description:
        'Kamu bisa memutar ulang tutorial ini kapan saja dengan menekan tombol ini.',
      side: 'bottom',
      align: 'end',
    },
  },
];

/**
 * Prepares the UI viewport (mobile drawers, selected component node, and selected
 * wire edge) before a specific step index is highlighted so `driver.js` always
 * measures a visible DOM element.
 * Time Complexity: O(N + E) where N is node count and E is edge count on the canvas.
 *
 * @param stepIndex 0-based index in `TOUR_STEPS`
 */
export function prepareViewportForTourStep(stepIndex: number): void {
  try {
    let storeState = useCircuitStore.getState();

    // Ensure there is a sample circuit on the canvas if the user cleared everything
    // before launching the tour so component & wire steps always have real targets
    if (storeState.nodes.length === 0 || storeState.edges.length === 0) {
      storeState.loadPreset('simple-lamp');
      storeState = useCircuitStore.getState();
    }

    if (stepIndex === 3) {
      // Step 4 (#tour-panel-inspector): Select a Bulb (or non-waypoint) component
      // so the Component Properties view is rendered inside Inspector
      const preferredNode =
        storeState.nodes.find((n) => n.data.type === 'bulb') ??
        storeState.nodes.find((n) => n.data.type !== 'waypoint');
      if (preferredNode) {
        storeState.selectNode(preferredNode.id);
      }
    } else if (stepIndex === 5 || stepIndex === 6) {
      // Step 6 (#tour-canvas-area "Klik Salah Satu Kabel") &
      // Step 7 (#tour-wire-actions "Pin Kabel & Putus Kabel"):
      // Ensure a wire edge is selected so the wire glows amber AND the top floating
      // wire action bar ([Tambah Tekukan] & [Potong Kabel]) is mounted in the DOM
      if (!storeState.selectedEdgeId && storeState.edges.length > 0) {
        storeState.selectEdge(storeState.edges[0].id);
      }
    } else {
      // Clear node/edge selection on other steps so floating pills don't clutter the canvas
      if (storeState.selectedNodeId) {
        storeState.selectNode(null);
      }
      if (storeState.selectedEdgeId) {
        storeState.selectEdge(null);
      }
    }

    if (!registeredMobileSheetController) return;

    const isMobileViewport =
      typeof window !== 'undefined' && window.innerWidth < 768;

    if (!isMobileViewport) {
      registeredMobileSheetController('none');
      return;
    }

    if (stepIndex === 2) {
      // Step 3: #tour-panel-komponen
      registeredMobileSheetController('palette');
    } else if (stepIndex === 3) {
      // Step 4: #tour-panel-inspector
      registeredMobileSheetController('inspector');
    } else {
      registeredMobileSheetController('none');
    }
  } catch (error) {
    console.warn('Failed to prepare viewport for tour step:', error);
  }
}

/**
 * Launches the 10-step interactive `driver.js` spotlight product tour.
 * Defensive against SSR/missing DOM and persists `has_seen_tutorial = 'true'`
 * upon completion.
 * Time Complexity: O(1)
 */
export function startTour(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  try {
    if (activeDriverInstance?.isActive()) {
      activeDriverInstance.destroy();
    }

    prepareViewportForTourStep(0);

    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      smoothScroll: true,
      stagePadding: 6,
      stageRadius: 12,
      waitForElement: 350,
      popoverClass: 'circuit-tour-popover',
      progressText: '{{current}} / {{total}}',
      nextBtnText: 'Lanjut',
      prevBtnText: 'Kembali',
      doneBtnText: 'Selesai',
      steps: TOUR_STEPS,
      onHighlightStarted: (_element, _step, opts) => {
        const idx = opts.state.activeIndex ?? 0;
        prepareViewportForTourStep(idx);
        window.requestAnimationFrame(() => {
          if (driverObj.isActive()) {
            driverObj.refresh();
          }
        });
      },
      onNextClick: () => {
        const currentIndex = driverObj.getActiveIndex() ?? 0;
        if (driverObj.isLastStep()) {
          // Final Step ("Selesai"): persist 'has_seen_tutorial' = 'true' and close
          try {
            window.localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
          } catch {
            markTutorialAsSeen();
          }
          registeredMobileSheetController?.('none');
          driverObj.destroy();
          return;
        }
        prepareViewportForTourStep(currentIndex + 1);
        driverObj.moveNext();
      },
      onPrevClick: () => {
        const currentIndex = driverObj.getActiveIndex() ?? 0;
        if (currentIndex > 0) {
          prepareViewportForTourStep(currentIndex - 1);
        }
        driverObj.movePrevious();
      },
      onDestroyed: () => {
        markTutorialAsSeen();
        registeredMobileSheetController?.('none');
        const st = useCircuitStore.getState();
        if (st.selectedEdgeId) st.selectEdge(null);
      },
    });

    activeDriverInstance = driverObj;
    driverObj.drive(0);
  } catch (error) {
    console.warn('Failed to start interactive tour:', error);
  }
}
