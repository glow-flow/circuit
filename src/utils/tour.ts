/**
 * Interactive Product Spotlight Tour Module (`driver.js`).
 *
 * Guides students and teachers step-by-step across the real Circuit Sandbox UI
 * elements using a 9-step spotlight sequence. Automatically synchronizes mobile
 * bottom-sheet drawers (`palette` / `inspector`) so every target element is
 * visible and accurately highlighted on both Mobile and Desktop viewports.
 *
 * Time Complexity:
 * - Tour initialization (`startTour`): O(1) over the fixed 9-step configuration
 * - Step transition preparation (`prepareViewportForTourStep`): O(N) where N is canvas node count
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
 * Exports the 9 spotlight steps in a structured constant so unit tests can
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
      side: 'right',
      align: 'center',
    },
  },
  {
    element: '#tour-panel-inspector',
    popover: {
      title: 'Ubah Properti',
      description:
        'Klik komponen di kanvas, lalu ubah tegangan atau jenis lampunya di panel ini.',
      side: 'left',
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
      title: 'Hapus Kabel',
      description:
        'Untuk memutus kabel, cukup klik kabelnya, lalu tekan tombol Sampah atau Delete di keyboard.',
      side: 'top',
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
 * Prepares the UI viewport (mobile drawers and selected node) before a specific
 * step index is highlighted so `driver.js` always measures a visible DOM element.
 * Time Complexity: O(N) where N is the number of nodes on the canvas.
 *
 * @param stepIndex 0-based index in `TOUR_STEPS`
 */
export function prepareViewportForTourStep(stepIndex: number): void {
  try {
    const storeState = useCircuitStore.getState();

    // On Step 4 (index 3, #tour-panel-inspector), ensure a component is selected
    // so the user sees actual adjustable properties (voltage / bulb type)
    if (stepIndex === 3 && !storeState.selectedNodeId) {
      const preferredNode =
        storeState.nodes.find((n) => n.data.type === 'bulb') ??
        storeState.nodes.find((n) => n.data.type !== 'waypoint');
      if (preferredNode) {
        storeState.selectNode(preferredNode.id);
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
 * Launches the 9-step interactive `driver.js` spotlight product tour.
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
          // Step 9 ("Selesai"): persist 'has_seen_tutorial' = 'true' and close
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
      },
    });

    activeDriverInstance = driverObj;
    driverObj.drive(0);
  } catch (error) {
    console.warn('Failed to start interactive tour:', error);
  }
}
