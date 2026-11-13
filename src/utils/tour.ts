/**
 * Interactive Product Spotlight Tour Module (`driver.js`).
 *
 * Guides students and teachers step-by-step across the real Circuit Sandbox UI
 * elements in both:
 * 1. **Indoor Lab Mode (`TOUR_STEPS`, 10 steps)** — Covers presets, component box,
 *    inspector, PLN electricity bill calculator, wire anchor bends, saving custom
 *    presets to browser cache, and going outside to nature.
 * 2. **Outdoor Nature Mode (`OUTDOOR_TOUR_STEPS`, 6 steps)** — Covers the 40x20
 *    gravity terrain brushes (Dirt, Water, Dig), 1-click 12V Power Station spawn,
 *    component gravity & water short-circuit explosions, outdoor generator palette,
 *    weather/PLN savings inspector, and transmitting clean energy back to the Lab.
 *
 * Time Complexity:
 * - Tour initialization (`startTour`): O(1) over the fixed step configurations
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
 * and Inspector (`#tour-panel-inspector`) drawers during the tour.
 *
 * @param controller Callback that updates `activeMobileSheet` in `App.tsx`
 */
export function registerTourMobileSheetController(
  controller: MobileSheetController | null
): void {
  registeredMobileSheetController = controller;
}

/**
 * Exports the 10 Lab Mode spotlight steps in a structured constant so unit tests can
 * verify target selectors, titles, and descriptions without requiring a full browser.
 */
export const TOUR_STEPS: DriveStep[] = [
  {
    element: '#tour-dropdown-contoh',
    popover: {
      title: 'Template Rangkaian',
      description:
        'Pilih contoh rangkaian siap pakai (Seri, Paralel, Korsleting) atau buka karya yang sudah disimpan.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#tour-btn-tambah',
    popover: {
      title: 'Tambah Komponen',
      description:
        'Ketuk tombol ini untuk membuka kotak komponen Lab (Baterai, Saklar Pisau, Lampu, Resistor, Alat Ukur).',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '#tour-panel-komponen',
    popover: {
      title: 'Pilih Alat',
      description:
        'Ketuk komponen lalu tekan "Taruh di Kanvas". Tips: Bola lampu dipasang ke Fiting Lampu (Socket) terlebih dulu.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '#tour-panel-inspector',
    popover: {
      title: 'Ubah Properti Komponen',
      description:
        'Ubah tegangan baterai (V), hambatan resistor (Ω), tipe lampu, atau isi ulang baterai yang habis di panel ini.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '#tour-btn-info',
    popover: {
      title: 'Info & Rumus',
      description:
        'Buka panel Rumus (V, I, R, P), langkah penyelesaian Hukum Ohm, dan Kalkulator Tagihan Listrik PLN.',
      side: 'top',
      align: 'end',
    },
  },
  {
    element: '#tour-canvas-area',
    popover: {
      title: 'Klik Salah Satu Kabel',
      description:
        'Hubungkan kutub (+) ke komponen lalu kembali ke (-). Ketuk garis kabel di kanvas untuk memunculkan menu kabel.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#tour-wire-actions',
    popover: {
      title: 'Pin Kabel & Putus Kabel',
      description:
        'Gunakan "Tambah Tekukan" untuk merapikan jalur kabel, atau "Potong Kabel" untuk memutus sambungan.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#tour-btn-save',
    popover: {
      title: 'Simpan Karya',
      description:
        'Simpan rangkaianmu ke memori browser atau bagikan lewat tautan URL dan kode QR ke siswa/guru.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#tour-btn-reset',
    popover: {
      title: 'Bersihkan Kanvas',
      description:
        'Hapus seluruh komponen di kanvas untuk merakit rangkaian baru dari nol.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '#tour-btn-help',
    popover: {
      title: 'Panduan Ulang',
      description:
        'Buka kembali panduan praktikum atau contekan cepat guru kapan saja dari tombol ini.',
      side: 'bottom',
      align: 'end',
    },
  },
];

/**
 * Dedicated 6-step spotlight tour for the Outdoor Nature Sandbox (`worldMode === 'outside'`).
 */
export const OUTDOOR_TOUR_STEPS: DriveStep[] = [
  {
    element: '#tour-outdoor-brushes',
    popover: {
      title: 'Kuas Medan Alam 40×20',
      description:
        'Gunakan mode "Rangkai" untuk menyambung kabel, ubah waktu matahari (Pagi/Siang/Sore), atau klik "Tanah/Air" untuk membentuk bukit dan sungai.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#tour-outdoor-spawn',
    popover: {
      title: 'Pasang Pembangkit Alam (12V)',
      description:
        'Ketuk tombol ini untuk menerjunkan paket Panel Surya 12V, Turbin Angin 12V, dan Menara Transmisi SUTET siap pakai!',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '#tour-canvas-area',
    popover: {
      title: 'Gravitasi & Bahaya Air Sungai',
      description:
        'Komponen otomatis menapak tanah karena gravitasi. Jangan menjatuhkan alat ke sungai karena akan meledak korsleting!',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#tour-panel-komponen',
    popover: {
      title: 'Kotak Pembangkit Energi Hijau',
      description:
        'Pilih pembangkit energi bersih: Panel Surya, Turbin Angin, Turbin Air (PLTA), Penyimpan BESS, dan Menara SUTET.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '#tour-panel-inspector',
    popover: {
      title: 'Cuaca & Penghematan Tagihan PLN',
      description:
        'Atur cuaca (matahari & angin) serta pantau penghematan biaya listrik PLN hingga Rp 0 (Gratis dari Alam).',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '#tour-btn-world',
    popover: {
      title: 'Salurkan Listrik ke Laboratorium',
      description:
        'Setelah pembangkit tersambung ke Menara SUTET, ketuk "Lab Rangkaian" untuk menyalakan lampu Lab dengan listrik hijau!',
      side: 'bottom',
      align: 'end',
    },
  },
];

interface ResponsiveSelectorFallback {
  readonly mobileSelector: string;
  readonly mobileSide: 'top' | 'bottom' | 'left' | 'right';
  readonly mobileAlign: 'start' | 'center' | 'end';
  readonly mobileDescription: string;
  readonly desktopSelector: string;
  readonly desktopSide: 'top' | 'bottom' | 'left' | 'right';
  readonly desktopAlign: 'start' | 'center' | 'end';
  readonly desktopDescription: string;
}

const RESPONSIVE_STEP_FALLBACKS: Readonly<Record<string, ResponsiveSelectorFallback>> = {
  '#tour-dropdown-contoh': {
    mobileSelector: '#tour-btn-galeri',
    mobileSide: 'top',
    mobileAlign: 'center',
    mobileDescription:
      'Ketuk tombol "Contoh" yang disorot di bawah untuk memuat rangkaian Seri, Paralel, atau Korsleting.',
    desktopSelector: '#tour-dropdown-contoh',
    desktopSide: 'bottom',
    desktopAlign: 'start',
    desktopDescription:
      'Pilih contoh rangkaian siap pakai (Seri, Paralel, Korsleting) atau buka karya yang sudah disimpan.',
  },
  '#tour-btn-tambah': {
    mobileSelector: '#tour-btn-tambah',
    mobileSide: 'top',
    mobileAlign: 'start',
    mobileDescription:
      'Ketuk "+ Alat" di kiri bawah untuk membuka kotak komponen Lab (Baterai, Saklar Pisau, Lampu, Resistor).',
    desktopSelector: '#tour-panel-komponen',
    desktopSide: 'right',
    desktopAlign: 'start',
    desktopDescription:
      'Gunakan kotak komponen di sisi kiri untuk memilih Baterai, Saklar Pisau, Lampu, Resistor, dan Alat Ukur.',
  },
  '#tour-btn-info': {
    mobileSelector: '#tour-btn-info',
    mobileSide: 'top',
    mobileAlign: 'center',
    mobileDescription:
      'Ketuk "Rumus" di bawah untuk melihat perhitungan (V, I, R, P) dan Kalkulator Tagihan Listrik PLN.',
    desktopSelector: '#tour-panel-inspector',
    desktopSide: 'left',
    desktopAlign: 'start',
    desktopDescription:
      'Panel kanan menampilkan perhitungan (V, I, R, P), Hukum Ohm, dan Kalkulator Tagihan Listrik PLN.',
  },
  '#tour-btn-save': {
    mobileSelector: '#tour-btn-menu',
    mobileSide: 'top',
    mobileAlign: 'end',
    mobileDescription:
      'Ketuk "Menu Lab" yang disorot di kanan bawah untuk Simpan Rangkaian, Bagikan Link/QR, atau buka Kuis.',
    desktopSelector: '#tour-btn-save',
    desktopSide: 'bottom',
    desktopAlign: 'center',
    desktopDescription:
      'Simpan rangkaianmu ke memori browser atau bagikan lewat tautan URL dan kode QR ke siswa/guru.',
  },
};

/**
 * Checks whether a CSS selector matches an element that is currently visible
 * (non-zero bounding box and not `display: none`) in the active browser viewport.
 *
 * Time Complexity: O(1) DOM lookup and bounding-rect check.
 *
 * @param selector CSS selector string (e.g. `'#tour-dropdown-contoh'`)
 * @returns True if the element exists in the document and has visible dimensions
 */
export function isElementVisibleInViewport(selector: string): boolean {
  try {
    if (typeof document === 'undefined' || !selector) return false;
    const targetElement = document.querySelector(selector) as HTMLElement | null;
    if (!targetElement) return false;

    if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
      const style = window.getComputedStyle(targetElement);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return false;
      }
    }

    if (typeof targetElement.getBoundingClientRect === 'function') {
      const rect = targetElement.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Resolves tour steps against the active viewport width and live DOM visibility
 * so `driver.js` never highlights a `display: none` element (such as `#tour-dropdown-contoh`
 * or `#tour-btn-save` on mobile `< 1024px`, or `#tour-btn-tambah` on desktop `>= 768px`).
 *
 * Time Complexity: O(S) where S is the number of tour steps (S <= 10), zero nested loops.
 *
 * @param steps Base tour step definitions (`TOUR_STEPS` or `OUTDOOR_TOUR_STEPS`)
 * @param explicitViewportWidth Optional viewport width override for deterministic unit testing
 * @returns New array of resolved `DriveStep` objects with visible target selectors
 */
export function resolveTourStepsForViewport(
  steps: readonly DriveStep[],
  explicitViewportWidth?: number
): DriveStep[] {
  try {
    if (!Array.isArray(steps) || steps.length === 0) return [];

    const currentWidth =
      typeof explicitViewportWidth === 'number' && Number.isFinite(explicitViewportWidth)
        ? explicitViewportWidth
        : typeof window !== 'undefined'
        ? window.innerWidth
        : 1280;

    const isMobileOrTabletHeaderCompact = currentWidth < 1024;
    const isMobileBottomNavVisible = currentWidth < 768;

    return steps.map((step) => {
      const selectorKey = typeof step.element === 'string' ? step.element : '';
      const fallbackRule = RESPONSIVE_STEP_FALLBACKS[selectorKey];
      if (!fallbackRule || !step.popover) {
        return {
          ...step,
          popover: step.popover ? { ...step.popover } : undefined,
        };
      }

      // First check real DOM visibility if rendered in browser
      const isPrimaryVisible = isElementVisibleInViewport(selectorKey);
      if (isPrimaryVisible) {
        return {
          ...step,
          popover: { ...step.popover },
        };
      }

      // Determine whether this step should use the mobile bottom-nav selector or desktop selector
      const shouldUseMobileTarget =
        selectorKey === '#tour-dropdown-contoh' || selectorKey === '#tour-btn-save'
          ? isMobileBottomNavVisible ||
            isElementVisibleInViewport(fallbackRule.mobileSelector) ||
            isMobileOrTabletHeaderCompact
          : isMobileBottomNavVisible;

      const resolvedSelector = shouldUseMobileTarget
        ? fallbackRule.mobileSelector
        : fallbackRule.desktopSelector;

      return {
        ...step,
        element: resolvedSelector,
        popover: {
          ...step.popover,
          side: shouldUseMobileTarget ? fallbackRule.mobileSide : fallbackRule.desktopSide,
          align: shouldUseMobileTarget ? fallbackRule.mobileAlign : fallbackRule.desktopAlign,
          description: shouldUseMobileTarget
            ? fallbackRule.mobileDescription
            : fallbackRule.desktopDescription,
        },
      };
    });
  } catch (error) {
    console.warn('Failed to resolve responsive tour steps:', error);
    return [...steps];
  }
}

/**
 * Prepares the UI viewport (mobile drawers, selected component node, and selected
 * wire edge) before a specific Lab tour step index is highlighted so `driver.js`
 * always measures a visible DOM element.
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
 * Prepares the UI viewport for a specific step in the Outdoor Nature Sandbox tour
 * (`OUTDOOR_TOUR_STEPS`). Synchronizes mobile drawers (`palette` on index 3,
 * `inspector` on index 4) so mobile users can seamlessly view every outdoor feature.
 * Time Complexity: O(N) where N is node count.
 *
 * @param stepIndex 0-based index in `OUTDOOR_TOUR_STEPS`
 */
export function prepareOutdoorViewportForTourStep(stepIndex: number): void {
  try {
    const storeState = useCircuitStore.getState();

    if (stepIndex === 4) {
      // Step 5 (#tour-panel-inspector): Select an outdoor generator if one exists, or null for PLN overview
      const outdoorGen = storeState.nodes.find(
        (n) =>
          n.data.worldMode === 'outside' &&
          (n.data.type === 'solar-panel' || n.data.type === 'wind-turbine')
      );
      storeState.selectNode(outdoorGen ? outdoorGen.id : null);
    } else {
      if (storeState.selectedNodeId) storeState.selectNode(null);
      if (storeState.selectedEdgeId) storeState.selectEdge(null);
    }

    if (!registeredMobileSheetController) return;

    const isMobileViewport =
      typeof window !== 'undefined' && window.innerWidth < 768;

    if (!isMobileViewport) {
      registeredMobileSheetController('none');
      return;
    }

    if (stepIndex === 3) {
      // Step 4: #tour-panel-komponen
      registeredMobileSheetController('palette');
    } else if (stepIndex === 4) {
      // Step 5: #tour-panel-inspector
      registeredMobileSheetController('inspector');
    } else {
      registeredMobileSheetController('none');
    }
  } catch (error) {
    console.warn('Failed to prepare outdoor viewport for tour step:', error);
  }
}

/**
 * Launches the interactive `driver.js` spotlight product tour.
 * Automatically selects `OUTDOOR_TOUR_STEPS` when `worldMode === 'outside'`,
 * or `TOUR_STEPS` when `worldMode === 'lab'`.
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

    const isOutdoorMode = useCircuitStore.getState().worldMode === 'outside';
    const baseSteps = isOutdoorMode ? OUTDOOR_TOUR_STEPS : TOUR_STEPS;
    const prepareStepFn = isOutdoorMode
      ? prepareOutdoorViewportForTourStep
      : prepareViewportForTourStep;

    prepareStepFn(0);
    const activeSteps = resolveTourStepsForViewport(baseSteps);

    const resetWindowScroll = () => {
      try {
        if (typeof window !== 'undefined') {
          window.scrollTo({ left: 0, top: 0, behavior: 'instant' });
          if (document.documentElement) document.documentElement.scrollLeft = 0;
          if (document.body) document.body.scrollLeft = 0;
          const rootEl = document.getElementById('root');
          if (rootEl) rootEl.scrollLeft = 0;
          const headerEl = document.querySelector('header');
          if (headerEl) headerEl.scrollLeft = 0;
          const appDiv = document.querySelector('.flex.flex-col');
          if (appDiv) (appDiv as HTMLElement).scrollLeft = 0;
        }
      } catch {
        // Safe fallback in non-browser testing
      }
    };

    resetWindowScroll();

    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      smoothScroll: false,
      stagePadding: 6,
      stageRadius: 12,
      waitForElement: 350,
      popoverClass: 'circuit-tour-popover',
      progressText: '{{current}} / {{total}}',
      nextBtnText: 'Lanjut',
      prevBtnText: 'Kembali',
      doneBtnText: 'Selesai',
      steps: activeSteps,
      onHighlightStarted: (_element, _step, opts) => {
        resetWindowScroll();
        const idx = opts.state.activeIndex ?? 0;
        prepareStepFn(idx);
        window.requestAnimationFrame(() => {
          resetWindowScroll();
          if (driverObj.isActive()) {
            driverObj.refresh();
          }
        });
      },
      onNextClick: () => {
        resetWindowScroll();
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
          resetWindowScroll();
          return;
        }
        prepareStepFn(currentIndex + 1);
        driverObj.moveNext();
      },
      onPrevClick: () => {
        resetWindowScroll();
        const currentIndex = driverObj.getActiveIndex() ?? 0;
        if (currentIndex > 0) {
          prepareStepFn(currentIndex - 1);
        }
        driverObj.movePrevious();
      },
      onDestroyed: () => {
        resetWindowScroll();
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
