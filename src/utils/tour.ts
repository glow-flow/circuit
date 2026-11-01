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
        'Bingung mulai dari mana? Pilih contoh rangkaian Seri, Paralel, atau buka rangkaian buatanmu sendiri yang sudah disimpan di sini.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#tour-btn-tambah',
    popover: {
      title: 'Tambah Komponen',
      description:
        'Klik di sini untuk membuka kotak komponen Lab (Baterai, 7 jenis Lampu, Saklar, Resistor, dan Alat Ukur).',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '#tour-panel-komponen',
    popover: {
      title: 'Pilih Alat',
      description:
        "Pilih komponen lalu tekan 'Taruh di kanvas' (atau seret langsung). 💡 PENTING: Bola lampu harus dipasang ke dudukan 'Fiting Lampu (Socket)' terlebih dahulu sebelum bisa disambungkan kabel!",
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '#tour-panel-inspector',
    popover: {
      title: 'Ubah Properti Komponen',
      description:
        'Klik komponen di kanvas (di HP, ketuk tombol "Atur" yang muncul di atas), lalu ubah Jenis Lampu (7 tipe), Hambatan (Ω), atau Tegangan Baterai (V). Kamu juga bisa mengecas baterai kosong lewat Panel Distribusi Lab!',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '#tour-btn-info',
    popover: {
      title: 'Info & Rumus',
      description:
        'Klik di sini untuk melihat detail perhitungan (V, I, R, P) sekaligus Kalkulator Tagihan Listrik PLN (Rupiah & kWh) dari rangkaianmu!',
      side: 'top',
      align: 'end',
    },
  },
  {
    element: '#tour-canvas-area',
    popover: {
      title: 'Klik Salah Satu Kabel',
      description:
        'Tarik kabel dari kutub merah (+) baterai/panel ke terminal fiting lampu (p1), lalu dari p2 kembali ke kutub (-). Klik salah satu garis kabel di kanvas untuk memunculkan tombol aksi kabel di atas.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#tour-wire-actions',
    popover: {
      title: 'Pin Kabel & Putus Kabel',
      description:
        "Setelah kabel diklik, tekan 'Tambah Tekukan' (atau ketuk 2x pada kabel) untuk membuat pin belokan rapi, atau 'Potong Kabel' untuk memutus. Jika MCB Panel Trip, tekan tombol merah TRIP untuk me-reset kabel.",
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#tour-btn-save',
    popover: {
      title: 'Simpan Karya',
      description:
        'Sudah diperbarui! Klik tombol Simpan ini (atau pilih "+ Simpan Rangkaian..." di menu Contoh) untuk menyimpan rangkaianmu ke memori browser agar tidak hilang. Kamu juga bisa klik tombol "Keluar ke Alam" di kanan atas untuk membangun Pembangkit Listrik Tenaga Surya & Angin!',
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
        'Kamu bisa memutar ulang tutorial ini kapan saja (baik di mode Lab maupun saat berada di Zona Alam Terbuka) dengan menekan tombol ini.',
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
        'Ubah lanskap alam secara bebas! Gunakan "+ Tanah (Gravity)" untuk menimbun bukit (tanah yang terkena udara otomatis tumbuh rumput dalam 3 detik), "+ Air (Bahaya!)" untuk membuat aliran air, atau "Geser & Kabel" untuk menyambung kabel dan menggeser kamera.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#tour-outdoor-spawn',
    popover: {
      title: 'Pasang Pembangkit Alam (12V)',
      description:
        'Ingin langsung mencoba? Klik tombol ini untuk menerjunkan paket Pembangkit Listrik Alam (Panel Surya 12V, Turbin Angin 12V, dan Menara Transmisi SUTET) lengkap dengan kabelnya di atas bukit rumput!',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '#tour-canvas-area',
    popover: {
      title: 'Gravitasi & Bahaya Air Sungai',
      description:
        'Setiap pembangkit yang ditaruh di alam otomatis turun menapak tanah karena gravitasi. Hati-hati: jangan menjatuhkan komponen dari langit yang terlalu tinggi (> 6 blok) atau di atas air sungai, karena komponen akan meledak korsleting!',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#tour-panel-komponen',
    popover: {
      title: 'Kotak Pembangkit Energi Hijau',
      description:
        'Di Zona Alam Terbuka, kotak komponen khusus menampilkan pembangkit energi bersih: Panel Surya (0–12V), Turbin Angin (0–12V), dan Menara Transmisi (Jaringan Virtual SUTET).',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '#tour-panel-inspector',
    popover: {
      title: 'Cuaca & Penghematan Tagihan PLN',
      description:
        'Klik Panel Surya atau Turbin Angin untuk mengatur terik matahari dan kecepatan angin, atau cek Kalkulator Tagihan Listrik PLN untuk melihat berapa Rupiah biaya listrik yang dihemat hingga Rp 0 (Gratis dari Alam)!',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '#tour-btn-world',
    popover: {
      title: 'Salurkan Listrik ke Laboratorium',
      description:
        'Setelah Panel Surya atau Turbin Angin disambungkan ke isolator atas Menara Transmisi, klik "Masuk ke Lab" dan pasang Panel Distribusi Lab (Box MCB + Step-Down) untuk menyalakan lampu-lampu dengan energi ramah lingkungan!',
      side: 'bottom',
      align: 'end',
    },
  },
];

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
    const activeSteps = isOutdoorMode ? OUTDOOR_TOUR_STEPS : TOUR_STEPS;
    const prepareStepFn = isOutdoorMode
      ? prepareOutdoorViewportForTourStep
      : prepareViewportForTourStep;

    prepareStepFn(0);

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
      steps: activeSteps,
      onHighlightStarted: (_element, _step, opts) => {
        const idx = opts.state.activeIndex ?? 0;
        prepareStepFn(idx);
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
        prepareStepFn(currentIndex + 1);
        driverObj.moveNext();
      },
      onPrevClick: () => {
        const currentIndex = driverObj.getActiveIndex() ?? 0;
        if (currentIndex > 0) {
          prepareStepFn(currentIndex - 1);
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
