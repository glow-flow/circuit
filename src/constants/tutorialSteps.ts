/**
 * Onboarding & Interactive Lab Manual Step Specifications.
 *
 * Centralizes the 4-step guided onboarding data (bilingual ID/EN copy,
 * blueprint module codes, and Grade-9 Physics concepts) so TutorialModal
 * and unit tests share a single DRY source of truth.
 *
 * Time Complexity:
 * - Step lookup by index (`getTutorialStep`): O(1) array indexing with bounds clamping.
 */

export type TutorialStepId = 1 | 2 | 3 | 4;

export interface TutorialStepSpec {
  id: TutorialStepId;
  moduleCodeId: string;
  moduleCodeEn: string;
  titleId: string;
  titleEn: string;
  descriptionId: string;
  descriptionEn: string;
  formulaBadge: string;
  labNoteTitleId: string;
  labNoteTitleEn: string;
  labNoteBodyId: string;
  labNoteBodyEn: string;
}

export const TUTORIAL_STEPS: readonly TutorialStepSpec[] = [
  {
    id: 1,
    moduleCodeId: 'MODUL 01 // LABORATORIUM VIRTUAL',
    moduleCodeEn: 'MODULE 01 // VIRTUAL LAB',
    titleId: 'Selamat Datang di Circuit Sandbox!',
    titleEn: 'Welcome to Circuit Sandbox!',
    descriptionId:
      'Selamat datang di Circuit Sandbox! Mari belajar merangkai listrik. Coba ketuk saklar mini di atas untuk melihat bagaimana arus mengalir dan menyalakan lampu secara langsung.',
    descriptionEn:
      'Welcome to Circuit Sandbox! Let’s learn how to build electrical circuits. Tap the mini switch above to see how current flows and lights up the lamp in real time.',
    formulaBadge: 'V = I × R   •   P = I² × R',
    labNoteTitleId: 'Konsep IPA Kelas 9: Rangkaian Tertutup',
    labNoteTitleEn: 'Grade 9 Physics: Closed Loop Circuit',
    labNoteBodyId:
      'Arus listrik (I) hanya dapat mengalir jika ada sumber tegangan (Baterai) dan jalur kabel yang tertutup penuh tanpa putus dari kutub (+) kembali ke kutub (-).',
    labNoteBodyEn:
      'Electric current (I) only flows when there is a voltage source and a complete, unbroken closed loop from the (+) terminal back to the (-) terminal.',
  },
  {
    id: 2,
    moduleCodeId: 'MODUL 02 // KOTAK KOMPONEN',
    moduleCodeEn: 'MODULE 02 // COMPONENT BOX',
    titleId: 'Pilih & Taruh Alat ke Kanvas',
    titleEn: 'Pick & Place Parts onto the Canvas',
    descriptionId:
      "Buka panel komponen (Tambah Alat). Pilih tab (Baterai/Lampu/dll), lalu ketuk komponen dan tekan 'Taruh di kanvas'. (Di Desktop, kamu juga bisa menarik/mendrag gambarnya ke kanvas).",
    descriptionEn:
      "Open the Component Box (Add Part). Pick a category tab (Batteries/Lights/etc.), tap a component tile, and press 'Place on canvas'. (On Desktop, you can also drag the tile directly onto the canvas).",
    formulaBadge: 'Baterai 1.5V / 9V   •   7 Jenis Lampu',
    labNoteTitleId: 'Kenapa Ada Banyak Jenis Lampu & Baterai?',
    labNoteTitleEn: 'Why Multiple Batteries & Lamp Types?',
    labNoteBodyId:
      'Setiap lampu punya hambatan (R) berbeda. Lampu Halogen 50W butuh Baterai 9V agar terang maksimal, sedangkan LED Indikator hemat daya cukup dengan baterai kecil.',
    labNoteBodyEn:
      'Each lamp has a distinct resistance (R). High-wattage Halogen bulbs work best with a 9V Battery, while low-power LEDs need much less voltage.',
  },
  {
    id: 3,
    moduleCodeId: 'MODUL 03 // JALUR KABEL & KUTUB',
    moduleCodeEn: 'MODULE 03 // WIRING & TERMINALS',
    titleId: 'Menyambung Kabel & Merapikan Jalur',
    titleEn: 'Connecting Wires & Routing Blueprints',
    descriptionId:
      'Tarik garis dari titik (dot) kuning di satu komponen ke titik kuning di komponen lain. Kabel akan otomatis menyala jika rangkaian tertutup dan dialiri listrik.',
    descriptionEn:
      'Drag a line from a terminal dot on one component to a terminal dot on another. The wire automatically glows with flowing current as soon as the circuit loop is closed.',
    formulaBadge: 'Seri (1 Jalur)   •   Paralel (Bercabang)',
    labNoteTitleId: 'Tips Blueprint: Paku Penjepit (Anchor)',
    labNoteTitleEn: 'Blueprint Tip: Wire Bend Anchors',
    labNoteBodyId:
      'Ketuk 2x (double-click) pada kabel atau tekan tombol "Tambah Tekukan" untuk memasang titik siku agar rangkaian Seri & Paralel buatanmu rapi seperti buku cetak!',
    labNoteBodyEn:
      'Double-click any wire or use "Add Bend" to insert an anchor pin so your Series & Parallel layouts look like clean textbook schematics.',
  },
  {
    id: 4,
    moduleCodeId: 'MODUL 04 // INSPECTOR & EKSPERIMEN',
    moduleCodeEn: 'MODULE 04 // INSPECTOR & EXPERIMENTS',
    titleId: 'Hapus Kabel & Ubah Nilai Komponen',
    titleEn: 'Cut Wires & Tune Component Values',
    descriptionId:
      'Klik kabel lalu tekan tombol Sampah/Delete untuk memutus kabel. Klik komponen untuk mengubah propertinya (seperti mengganti tipe lampu atau menambah tegangan) di panel Inspector.',
    descriptionEn:
      'Click any wire and press the Cut/Delete button to remove it. Click any component to inspect its live formulas and adjust its properties (like lamp type, voltage, or resistance) in the Inspector.',
    formulaBadge: 'I = V / R   •   Proteksi Korsleting',
    labNoteTitleId: 'Eksperimen Bebas Tanpa Takut Rusak',
    labNoteTitleEn: 'Safe Experimentation',
    labNoteBodyId:
      'Uji apa yang terjadi jika LED diberi tegangan 18V atau baterai dihubungkan singkat! Jika lampu putus (Overload), cukup tekan tombol Reset pada lampu.',
    labNoteBodyEn:
      'Test what happens when an LED gets 18V or a battery is short-circuited! If a bulb blows from overload, simply press Reset on the node.',
  },
] as const;

/**
 * Safely retrieves a tutorial step by 0-based index with defensive bounds clamping.
 * Time Complexity: O(1)
 *
 * @param stepIndex - 0-based step index (0 to 3)
 * @returns The clamped TutorialStepSpec object
 */
export function getTutorialStep(stepIndex: number): TutorialStepSpec {
  if (!Number.isFinite(stepIndex)) {
    return TUTORIAL_STEPS[0];
  }
  const clampedIndex = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, Math.floor(stepIndex)));
  return TUTORIAL_STEPS[clampedIndex];
}
