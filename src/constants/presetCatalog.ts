/**
 * Visual Preset Gallery Metadata Catalog.
 * Enriches built-in and user-created presets with pedagogical metadata:
 * difficulty rating, estimated experiment duration, component summary chips, and category tags.
 */

export type PresetDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type PresetCategory = 'all' | 'basic' | 'series_parallel' | 'safety' | 'power_grid' | 'custom';

export interface PresetCatalogItem {
  id: string;
  isBuiltin: boolean;
  titleId: string;
  titleEn: string;
  descriptionId: string;
  descriptionEn: string;
  difficulty: PresetDifficulty;
  durationMinutes: number;
  category: PresetCategory;
  componentSummary: {
    labelId: string;
    labelEn: string;
    count: number;
  }[];
}

export const BUILTIN_PRESET_CATALOG: PresetCatalogItem[] = [
  {
    id: 'simple-lamp',
    isBuiltin: true,
    titleId: 'Lampu Pijar Sederhana & Saklar',
    titleEn: 'Simple Incandescent Lamp & Switch',
    descriptionId:
      'Rangkaian tertutup paling mendasar (IPA Kelas 9) menggunakan wadah baterai 2x AA (3.0V), saklar pisau, fiting E27, dan lampu pijar 40W.',
    descriptionEn:
      'The foundational closed DC circuit (Grade 9 Science) featuring a 2x AA battery pack (3.0V), knife switch, E27 socket, and 40W incandescent bulb.',
    difficulty: 'beginner',
    durationMinutes: 3,
    category: 'basic',
    componentSummary: [
      { labelId: 'Wadah Baterai 2x AA (3V)', labelEn: '2x AA Battery Holder (3V)', count: 1 },
      { labelId: 'Saklar Pisau', labelEn: 'Knife Switch', count: 1 },
      { labelId: 'Fiting + Lampu Pijar', labelEn: 'Socket + Incandescent Bulb', count: 1 },
      { labelId: 'Baterai Cadangan 1.5V', labelEn: 'Extra 1.5V AA Battery', count: 1 },
    ],
  },
  {
    id: 'voltage-divider',
    isBuiltin: true,
    titleId: 'Rangkaian Seri 3 Lampu (Pembagi Tegangan)',
    titleEn: 'Series 3-Bulb Circuit (Voltage Divider)',
    descriptionId:
      'Tiga fiting lampu pijar dihubungkan secara seri. Arus listrik sama di semua titik (I = I₁ = I₂ = I₃), sedangkan tegangan 3.0V terbagi rata (1.0V tiap lampu).',
    descriptionEn:
      'Three incandescent lamp sockets connected in series. Electric current remains identical throughout (I = I₁ = I₂ = I₃), dividing 3.0V equally into 1.0V per bulb.',
    difficulty: 'beginner',
    durationMinutes: 5,
    category: 'series_parallel',
    componentSummary: [
      { labelId: 'Sumber Baterai 3.0V', labelEn: '3.0V Battery Source', count: 1 },
      { labelId: 'Fiting + Lampu Pijar', labelEn: 'Socket + Incandescent Bulb', count: 3 },
      { labelId: 'Kabel Penghubung', labelEn: 'Connecting Wires', count: 4 },
    ],
  },
  {
    id: 'parallel-bulbs',
    isBuiltin: true,
    titleId: 'Rangkaian Paralel 3 Lampu (Arus Terbagi)',
    titleEn: 'Parallel 3-Bulb Circuit (Current Divider)',
    descriptionId:
      'Tiga lampu pijar terhubung paralel. Setiap lampu menerima tegangan penuh 3.0V sehingga menyala terang maksimal, dan arus baterai terbagi tiga cabang.',
    descriptionEn:
      'Three bulbs wired in parallel. Each branch experiences full 3.0V potential, radiating full brightness with total current divided across branches.',
    difficulty: 'intermediate',
    durationMinutes: 5,
    category: 'series_parallel',
    componentSummary: [
      { labelId: 'Sumber Baterai 3.0V', labelEn: '3.0V Battery Source', count: 1 },
      { labelId: 'Fiting + Lampu Pijar', labelEn: 'Socket + Incandescent Bulb', count: 3 },
      { labelId: 'Junction / Waypoint Wires', labelEn: 'Junction / Waypoint Wires', count: 8 },
    ],
  },
  {
    id: 'short-circuit-demo',
    isBuiltin: true,
    titleId: 'Investigasi Bahaya Korsleting Listrik',
    titleEn: 'Short-Circuit Hazard & Protection Investigation',
    descriptionId:
      'Eksperimen keselamatan PUIL: saklar bypass korsleting menghubungkan kutub baterai tanpa beban. Amati lonjakan arus ekstrim dan simulasi bahaya termal.',
    descriptionEn:
      'PUIL electrical safety experiment: a bypass switch creates zero-resistance connection across terminals. Observe rapid current spike and thermal hazard warning.',
    difficulty: 'intermediate',
    durationMinutes: 7,
    category: 'safety',
    componentSummary: [
      { labelId: 'Baterai Transistor 9V', labelEn: '9V Transistor Battery', count: 1 },
      { labelId: 'Saklar Bypass Korslet', labelEn: 'Short-Circuit Bypass Switch', count: 1 },
      { labelId: 'Fiting + Lampu Beban', labelEn: 'Socket + Load Bulb', count: 1 },
    ],
  },
  {
    id: 'ultimate-power-grid',
    isBuiltin: true,
    titleId: 'Manajemen Daya 9V (Smart Grid Multi-Zona)',
    titleEn: '9V Power Management (Multi-Zone Smart Grid)',
    descriptionId:
      'Studi kasus komprehensif: 7 jenis lampu (Pijar, Halogen, Edison, CFL, LED Putih, LED RGB, LED Hijau) dibagi dalam 3 zona daya dengan saklar independen, resistor pengaman, Voltmeter, dan Amperemeter.',
    descriptionEn:
      'Comprehensive smart-grid engineering: 7 bulb types across 3 switched zones with protection resistors, master knife switch, parallel Voltmeter, and series Ammeter.',
    difficulty: 'advanced',
    durationMinutes: 10,
    category: 'power_grid',
    componentSummary: [
      { labelId: 'Baterai 9V Utama', labelEn: '9V Main Battery', count: 1 },
      { labelId: 'Lampu Pijar, Halogen, Edison, CFL, LED', labelEn: 'Incandescent, Halogen, Edison, CFL, LEDs', count: 7 },
      { labelId: 'Saklar Multi-Zona', labelEn: 'Multi-Zone Switches', count: 4 },
      { labelId: 'Resistor Pengaman (100Ω & 200Ω)', labelEn: 'Protection Resistors (100Ω & 200Ω)', count: 2 },
      { labelId: 'Voltmeter & Amperemeter Digital', labelEn: 'Digital Voltmeter & Ammeter', count: 2 },
    ],
  },
];
