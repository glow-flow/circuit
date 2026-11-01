/**
 * Circuit Academy 6-Level Curriculum Catalog.
 * 
 * Aligned with SMP Kelas 9 IPA, Vocational Electrical Engineering (SMK Titl),
 * and University introductory electrical engineering.
 * 
 * Levels:
 * 1. Electrical Fundamentals
 * 2. Circuit Analysis
 * 3. Components & Instruments
 * 4. Protection & Safety
 * 5. Renewable Energy
 * 6. Advanced Engineering & MNA
 */

import { AcademyLesson, AcademyLevelInfo } from '../types/academy';

export const ACADEMY_LEVELS: AcademyLevelInfo[] = [
  {
    level: 1,
    titleId: 'Tingkat 1: Fondasi Kelistrikan',
    titleEn: 'Level 1: Electrical Fundamentals',
    subtitleId: 'Muatan, Beda Potensial, Kuat Arus, Hambatan, dan Hukum Ohm',
    subtitleEn: 'Charge, Voltage, Current, Resistance, and Ohm\'s Law',
    requiredXp: 0,
    badgeId: 'first_spark',
  },
  {
    level: 2,
    titleId: 'Tingkat 2: Analisis Rangkaian',
    titleEn: 'Level 2: Circuit Analysis',
    subtitleId: 'Rangkaian Seri, Paralel, Hukum Kirchhoff, dan Pembagi Tegangan',
    subtitleEn: 'Series, Parallel, Kirchhoff\'s Laws, and Voltage Dividers',
    requiredXp: 200,
    badgeId: 'circuit_architect',
  },
  {
    level: 3,
    titleId: 'Tingkat 3: Komponen & Alat Ukur',
    titleEn: 'Level 3: Components & Instruments',
    subtitleId: 'Resistor, Saklar, Dioda LED, Voltmeter, dan Ammeter',
    subtitleEn: 'Resistors, Switches, LEDs, Diodes, Voltmeters, and Ammeters',
    requiredXp: 500,
    badgeId: 'ohm_master',
  },
  {
    level: 4,
    titleId: 'Tingkat 4: Proteksi & Keselamatan Listrik',
    titleEn: 'Level 4: Protection & Safety',
    subtitleId: 'Hubungan Singkat, Sekering, MCB PUIL 2011, dan Grounding',
    subtitleEn: 'Short Circuits, Fuses, MCB Tripping, and Grounding Protection',
    requiredXp: 900,
    badgeId: 'safety_officer',
  },
  {
    level: 5,
    titleId: 'Tingkat 5: Energi Terbarukan & Microgrid',
    titleEn: 'Level 5: Renewable Energy & Microgrids',
    subtitleId: 'Panel Surya Fotovoltaik, Turbin Angin, BESS, dan Keseimbangan Daya',
    subtitleEn: 'Solar PV, Wind Turbines, Battery Storage, and Power Balancing',
    requiredXp: 1400,
    badgeId: 'renewable_pioneer',
  },
  {
    level: 6,
    titleId: 'Tingkat 6: Rekayasa Lanjutan & Matriks MNA',
    titleEn: 'Level 6: Advanced Engineering & MNA',
    subtitleId: 'Modified Nodal Analysis, Formulasi Matriks G-B-C-D, dan Dioda Non-Linear',
    subtitleEn: 'Modified Nodal Analysis, Matrix Stamping, and Non-Linear Diodes',
    requiredXp: 2000,
    badgeId: 'senior_engineer',
  },
];

export const ACADEMY_LESSONS: AcademyLesson[] = [
  // ================= LEVEL 1: FUNDAMENTALS =================
  {
    id: 'l1_ohms_law',
    level: 1,
    order: 1,
    titleId: 'Hukum Ohm & Aliran Arus Listrik',
    titleEn: 'Ohm\'s Law & Electric Current Flow',
    summaryId: 'Memahami hubungan matematis antara beda potensial (V), kuat arus (I), dan hambatan (R).',
    summaryEn: 'Understand the fundamental mathematical relation between voltage (V), current (I), and resistance (R).',
    estimatedMinutes: 8,
    difficulty: 'beginner',
    xpReward: 50,
    learningObjectivesId: [
      'Menyatakan hubungan matematis Hukum Ohm V = I × R.',
      'Memprediksi perubahan kuat arus listrik ketika hambatan diperbesar pada tegangan tetap.',
      'Menghitung tegangan jepit dan drop tegangan pada beban resistif.',
    ],
    learningObjectivesEn: [
      'State Ohm\'s Law formula V = I × R.',
      'Predict current changes when resistance varies under constant voltage.',
      'Calculate terminal voltage and voltage drop across a resistive load.',
    ],
    theoryContentId: [
      'Arus listrik (I) didefinisikan sebagai laju aliran muatan listrik per satuan waktu melalui suatu penampang konduktor (1 Ampere = 1 Coulomb per detik).',
      'Beda potensial atau tegangan (V) adalah energi yang diperlukan untuk memindahkan satu satuan muatan antar dua titik (1 Volt = 1 Joule per Coulomb).',
      'Georg Simon Ohm membuktikan secara eksperimental bahwa kuat arus listrik yang mengalir sebanding dengan beda potensial dan berbanding terbalik dengan hambatan listrik konduktor.',
    ],
    theoryContentEn: [
      'Electric current (I) is the rate of electric charge flow through a conductor cross-section (1 Ampere = 1 Coulomb per second).',
      'Voltage or potential difference (V) is the work needed to move a unit charge between two points (1 Volt = 1 Joule per Coulomb).',
      'Georg Simon Ohm proved that current is directly proportional to voltage and inversely proportional to resistance.',
    ],
    equations: [
      {
        formula: 'V = I × R',
        nameId: 'Hukum Ohm (Beda Potensial)',
        nameEn: 'Ohm\'s Law (Voltage Drop)',
        explanationId: 'Beda potensial (V, Volt) sama dengan kuat arus (I, Ampere) dikalikan hambatan (R, Ohm).',
        explanationEn: 'Voltage (V, Volts) equals current (I, Amperes) multiplied by resistance (R, Ohms).',
      },
      {
        formula: 'I = V / R',
        nameId: 'Kuat Arus Listrik',
        nameEn: 'Current Equation',
        explanationId: 'Kuat arus berbanding lurus dengan tegangan dan berbanding terbalik dengan hambatan.',
        explanationEn: 'Current is directly proportional to voltage and inversely proportional to resistance.',
      },
    ],
    interactiveDemoType: 'ohms_law',
    starterPresetId: 'simple-lamp',
    quiz: [
      {
        id: 'q1',
        questionId: 'Jika sebuah baterai 9V dihubungkan ke resistor 300 Ω, berapa besar arus yang mengalir?',
        questionEn: 'If a 9V battery is connected to a 300 Ω resistor, what current flows?',
        options: [
          { id: 'opt1', textId: '0,03 A (30 mA)', textEn: '0.03 A (30 mA)', isCorrect: true },
          { id: 'opt2', textId: '0,3 A (300 mA)', textEn: '0.3 A (300 mA)', isCorrect: false },
          { id: 'opt3', textId: '27 A', textEn: '27 A', isCorrect: false },
          { id: 'opt4', textId: '33,3 mA', textEn: '33.3 mA', isCorrect: false },
        ],
        explanationId: 'I = V / R = 9 V / 300 Ω = 0,03 A = 30 mA.',
        explanationEn: 'I = V / R = 9 V / 300 Ω = 0.03 A = 30 mA.',
      },
      {
        id: 'q2',
        questionId: 'Apa yang terjadi pada kuat arus jika nilai hambatan dilipatgandakan sedangkan tegangan konstan?',
        questionEn: 'What happens to the current if resistance is doubled while voltage remains constant?',
        options: [
          { id: 'opt1', textId: 'Arus berkurang menjadi setengahnya', textEn: 'Current is halved', isCorrect: true },
          { id: 'opt2', textId: 'Arus bertambah dua kali lipat', textEn: 'Current is doubled', isCorrect: false },
          { id: 'opt3', textId: 'Arus tetap konstan', textEn: 'Current stays constant', isCorrect: false },
          { id: 'opt4', textId: 'Arus menjadi nol', textEn: 'Current drops to zero', isCorrect: false },
        ],
        explanationId: 'Karena I = V / R, jika R menjadi 2R, maka I_baru = V / (2R) = 0,5 × I.',
        explanationEn: 'Since I = V / R, doubling R yields I_new = V / (2R) = 0.5 × I.',
      },
    ],
  },
  {
    id: 'l1_power_joule',
    level: 1,
    order: 2,
    titleId: 'Daya & Energi Listrik (Hukum Joule)',
    titleEn: 'Electric Power & Joule Heating',
    summaryId: 'Mengamati konversi energi listrik menjadi energi kalor dan cahaya serta menghitung rekening listrik kWh.',
    summaryEn: 'Observe conversion of electrical energy into heat and light, and compute kWh consumption.',
    estimatedMinutes: 10,
    difficulty: 'beginner',
    xpReward: 50,
    learningObjectivesId: [
      'Menghitung daya listrik menggunakan rumus P = V × I dan P = I² × R.',
      'Membedakan laju daya (Watt) dengan total konsumsi energi (Watt-hour / kWh).',
      'Menghitung estimasi biaya rekening listrik berdasarkan tarif PLN.',
    ],
    learningObjectivesEn: [
      'Calculate power using P = V × I and P = I² × R.',
      'Differentiate instantaneous power (Watts) from energy consumption (kWh).',
      'Estimate utility electricity bills using standard electricity tariffs.',
    ],
    theoryContentId: [
      'Daya listrik (P) adalah laju energi listrik yang diserap atau dihasilkan per satuan waktu, diukur dalam satuan Watt (1 Watt = 1 Joule per detik).',
      'Hukum Joule menyatakan bahwa disipasi energi kalor yang dihasilkan oleh konduktor berhambatan sebanding dengan kuadrat kuat arus yang melewatinya (P = I² × R).',
      'Konsumsi energi listrik rumah tangga dihitung dengan mengalikan daya dengan durasi pemakaian (W = P × t), di mana 1 kWh = 1000 Watt × 1 jam = 3.600.000 Joule.',
    ],
    theoryContentEn: [
      'Electrical power (P) is the rate of energy dissipation or generation per unit time, measured in Watts (1 W = 1 J/s).',
      'Joule\'s first law states that heat dissipation in a resistive conductor is proportional to the square of current (P = I² × R).',
      'Energy consumption equals power multiplied by time (W = P × t), where 1 kWh = 1000 W × 1 hr = 3.6 MJ.',
    ],
    equations: [
      {
        formula: 'P = V × I',
        nameId: 'Daya Listrik Sesaat',
        nameEn: 'Electric Power',
        explanationId: 'Daya (Watt) sama dengan beda potensial (Volt) dikali arus (Ampere).',
        explanationEn: 'Power (Watts) equals voltage (Volts) multiplied by current (Amperes).',
      },
      {
        formula: 'P = I² × R',
        nameId: 'Disipasi Kalor Resistif (Joule)',
        nameEn: 'Resistive Thermal Dissipation',
        explanationId: 'Menunjukkan bahwa peningkatan arus berdampak kuadratis terhadap kenaikan panas kawat.',
        explanationEn: 'Shows that increasing current has a quadratic impact on conductor heat dissipation.',
      },
    ],
    interactiveDemoType: 'joule_power',
    starterPresetId: 'simple-lamp',
    quiz: [
      {
        id: 'q1',
        questionId: 'Sebuah lampu dialiri arus 0,5 A pada tegangan 12 V. Berapa daya yang diserap lampu tersebut?',
        questionEn: 'A lamp draws 0.5 A at 12 V. What power is consumed?',
        options: [
          { id: 'opt1', textId: '6 Watt', textEn: '6 Watts', isCorrect: true },
          { id: 'opt2', textId: '24 Watt', textEn: '24 Watts', isCorrect: false },
          { id: 'opt3', textId: '60 Watt', textEn: '60 Watts', isCorrect: false },
          { id: 'opt4', textId: '12 Watt', textEn: '12 Watts', isCorrect: false },
        ],
        explanationId: 'P = V × I = 12 V × 0,5 A = 6 W.',
        explanationEn: 'P = V × I = 12 V × 0.5 A = 6 W.',
      },
    ],
  },

  // ================= LEVEL 2: CIRCUIT ANALYSIS =================
  {
    id: 'l2_series_parallel',
    level: 2,
    order: 1,
    titleId: 'Analisis Rangkaian Seri vs Paralel',
    titleEn: 'Series vs Parallel Circuit Analysis',
    summaryId: 'Membedakan pembagian tegangan pada rangkaian seri dengan pembagian arus pada rangkaian paralel.',
    summaryEn: 'Analyze voltage division in series circuits vs current division in parallel branches.',
    estimatedMinutes: 12,
    difficulty: 'intermediate',
    xpReward: 70,
    learningObjectivesId: [
      'Menghitung hambatan pengganti seri (R_s = R1 + R2) dan paralel (1/R_p = 1/R1 + 1/R2).',
      'Menerapkan Hukum I Kirchhoff (ΣI_masuk = ΣI_keluar) pada simpul percabangan.',
      'Menerapkan Hukum II Kirchhoff (ΣV = 0) pada loop tertutup.',
    ],
    learningObjectivesEn: [
      'Compute equivalent resistance in series and parallel topologies.',
      'Apply Kirchhoff\'s Current Law (KCL) at junctions.',
      'Apply Kirchhoff\'s Voltage Law (KVL) around closed loops.',
    ],
    theoryContentId: [
      'Rangkaian Seri: Seluruh komponen tersusun dalam satu jalur konduksi tunggal tanpa cabang. Kuat arus yang melewati setiap komponen bernilai identik (I_total = I1 = I2), sedangkan tegangan sumber terbagi rata atau proporsional (V_total = V1 + V2).',
      'Rangkaian Paralel: Komponen dihubungkan ke sepasang titik simpul yang sama. Beda potensial pada setiap cabang bernilai identik (V_total = V1 = V2), sedangkan arus listrik terbagi sesuai resistansi masing-masing cabang.',
      'Hukum I Kirchhoff (KCL): Muatan bersifat kekal, sehingga jumlah kuat arus yang masuk ke suatu titik percabangan sama dengan jumlah kuat arus yang keluar.',
    ],
    theoryContentEn: [
      'Series Circuit: Components share a single continuous conductive path. Current is uniform throughout (I_total = I1 = I2), while total voltage divides across elements (V = V1 + V2).',
      'Parallel Circuit: Components connect across common nodes. Voltage across all branches is identical (V = V1 = V2), while current divides among branches inversely with resistance.',
      'Kirchhoff\'s Current Law (KCL): Conservation of charge dictates that sum of currents entering any node equals sum leaving that node.',
    ],
    equations: [
      {
        formula: 'R_seri = R₁ + R₂ + ... + Rₙ',
        nameId: 'Hambatan Pengganti Seri',
        nameEn: 'Equivalent Series Resistance',
        explanationId: 'Hambatan total seri selalu lebih besar daripada hambatan terbesar penyusunnya.',
        explanationEn: 'Total series resistance is always larger than any individual component resistor.',
      },
      {
        formula: '1 / R_paralel = 1/R₁ + 1/R₂',
        nameId: 'Hambatan Pengganti Paralel',
        nameEn: 'Equivalent Parallel Resistance',
        explanationId: 'Hambatan total paralel selalu lebih kecil daripada hambatan terkecil penyusunnya.',
        explanationEn: 'Total parallel resistance is always smaller than the smallest branch resistance.',
      },
    ],
    interactiveDemoType: 'voltage_divider',
    starterPresetId: 'ultimate-power-grid',
    quiz: [
      {
        id: 'q1',
        questionId: 'Dua buah resistor 100 Ω dihubungkan secara paralel. Berapakah hambatan penggantinya?',
        questionEn: 'Two 100 Ω resistors are connected in parallel. What is the equivalent resistance?',
        options: [
          { id: 'opt1', textId: '50 Ω', textEn: '50 Ω', isCorrect: true },
          { id: 'opt2', textId: '200 Ω', textEn: '200 Ω', isCorrect: false },
          { id: 'opt3', textId: '100 Ω', textEn: '100 Ω', isCorrect: false },
          { id: 'opt4', textId: '25 Ω', textEn: '25 Ω', isCorrect: false },
        ],
        explanationId: 'R_p = (100 × 100) / (100 + 100) = 10000 / 200 = 50 Ω.',
        explanationEn: 'R_p = (100 × 100) / (100 + 100) = 50 Ω.',
      },
    ],
  },

  // ================= LEVEL 3: COMPONENTS & INSTRUMENTS =================
  {
    id: 'l3_semiconductor_led',
    level: 3,
    order: 1,
    titleId: 'Dioda Semikonduktor & Polaritas LED',
    titleEn: 'Semiconductor Diodes & LED Polarity',
    summaryId: 'Memahami sifat hantar satu arah (forward bias vs reverse bias) pada lampu LED dan instrumen ukur.',
    summaryEn: 'Understand unidirectional conduction (forward vs reverse bias) in LEDs and measuring meters.',
    estimatedMinutes: 10,
    difficulty: 'intermediate',
    xpReward: 80,
    learningObjectivesId: [
      'Mengidentifikasi kutub anoda (+) dan katoda (-) pada LED.',
      'Menjelaskan mengapa LED tidak mengalirkan arus saat dipasang terbalik (bias mundur).',
      'Menggunakan Voltmeter (paralel) dan Ammeter (seri) secara tepat tanpa merusak instrumen.',
    ],
    learningObjectivesEn: [
      'Identify anode (+) and cathode (-) terminals on LEDs.',
      'Explain why reverse-biased LEDs block electrical current.',
      'Correctly connect Voltmeters in parallel and Ammeters in series.',
    ],
    theoryContentId: [
      'Light Emitting Diode (LED) adalah komponen semikonduktor dengan sambungan p-n yang memancarkan foton cahaya ketika terjadi rekombinasi elektron dan lubang (hole).',
      'Bias Maju (Forward Bias): Anoda dihubungkan ke kutub positif sumber dan Katoda ke negatif. Hambatan internal dioda menurun drastis sehingga arus mengalir.',
      'Bias Mundur (Reverse Bias): Medan listrik internal memperlebar daerah deplesi, sehingga hambatan dioda mendekati tak hingga (~1 GigaOhm) dan menghentikan aliran arus.',
    ],
    theoryContentEn: [
      'LEDs are p-n junction semiconductor devices that emit photons when electron-hole pairs recombine.',
      'Forward Bias occurs when anode is at a higher potential than cathode, collapsing the depletion barrier.',
      'Reverse Bias widens the barrier, presenting high impedance (~1 GΩ) and blocking conduction.',
    ],
    equations: [
      {
        formula: 'V_anoda - V_katoda ≥ V_threshold',
        nameId: 'Kondisi Konduksi Dioda Maju',
        nameEn: 'Forward Conduction Threshold',
        explanationId: 'Dioda hanya menghantarkan jika potensial anoda lebih tinggi dari katoda.',
        explanationEn: 'Diode conducts only when anode potential exceeds cathode by threshold voltage.',
      },
    ],
    starterPresetId: 'simple-lamp',
    quiz: [
      {
        id: 'q1',
        questionId: 'Bagaimana cara yang benar untuk mengukur arus yang melewati sebuah resistor?',
        questionEn: 'What is the correct way to measure current passing through a resistor?',
        options: [
          { id: 'opt1', textId: 'Memasang Ammeter secara seri di jalur konduksi', textEn: 'Connect Ammeter in series in the conduction path', isCorrect: true },
          { id: 'opt2', textId: 'Memasang Ammeter secara paralel di kedua ujung resistor', textEn: 'Connect Ammeter in parallel across resistor terminals', isCorrect: false },
          { id: 'opt3', textId: 'Menghubungkan Voltmeter secara seri', textEn: 'Connect Voltmeter in series', isCorrect: false },
          { id: 'opt4', textId: 'Mencabut baterai sebelum mengukur', textEn: 'Disconnect the battery before measuring', isCorrect: false },
        ],
        explanationId: 'Ammeter memiliki hambatan sangat kecil (1 mΩ), wajib dipasang SERI agar seluruh arus mengalir melaluinya.',
        explanationEn: 'Ammeters have very low internal resistance (1 mΩ) and must be placed in SERIES to capture branch current.',
      },
    ],
  },

  // ================= LEVEL 4: PROTECTION & SAFETY =================
  {
    id: 'l4_short_circuit_mcb',
    level: 4,
    order: 1,
    titleId: 'Bahaya Hubungan Singkat & Operasi MCB',
    titleEn: 'Short Circuit Hazards & MCB Operation',
    summaryId: 'Menganalisis lonjakan arus korsleting dan mekanisme pemutusan otomatis MCB sesuai PUIL 2011.',
    summaryEn: 'Analyze short-circuit overcurrent spikes and automatic MCB tripping compliance under PUIL 2011.',
    estimatedMinutes: 12,
    difficulty: 'intermediate',
    xpReward: 90,
    learningObjectivesId: [
      'Mendefinisikan hubungan singkat (short circuit) dan bahaya kebakaran kawat akibat panas Joule.',
      'Menjelaskan cara kerja Mini Circuit Breaker (MCB) dalam memutus arus lebih (> 10 A).',
      'Menerapkan langkah keselamatan pemulihan (cut wires & reset breaker).',
    ],
    learningObjectivesEn: [
      'Define short circuits and resistive fire hazards caused by Joule heating.',
      'Explain how Mini Circuit Breakers (MCB) automatically interrupt fault currents (> 10 A).',
      'Execute safe troubleshooting protocols: isolate fault, disconnect bridges, and reset breakers.',
    ],
    theoryContentId: [
      'Hubungan Singkat (Korsleting) terjadi ketika dua titik konduktor berpotensial berbeda tersambung langsung dengan hambatan mendekati nol (R ≈ 0 Ω).',
      'Menurut Hukum Ohm, I = V / R_int. Jika R_int hanya 0,05 Ω, maka arus dapat melonjak hingga puluhan atau ratusan Ampere, menghasilkan panas ekstrim (P = I² × R) yang dapat melelehkan insulasi kabel.',
      'Standar PUIL 2011 mewajibkan pemasangan gawai proteksi arus lebih (MCB / Sekering) untuk memutus sirkit secara otomatis sebelum kabel mencapai suhu bahaya.',
    ],
    theoryContentEn: [
      'A short circuit occurs when terminals of differing potentials bridge via near-zero impedance path (R ≈ 0 Ω).',
      'By Ohm\'s Law I = V / R_int, current surges to massive levels, generating catastrophic thermal power (P = I²R).',
      'Electrical installation standards (PUIL 2011 / IEC) mandate automatic disconnection via MCBs or fuses.',
    ],
    equations: [
      {
        formula: 'I_korslet = V_sumber / R_internal',
        nameId: 'Arus Hubung Singkat Maksimum',
        nameEn: 'Maximum Short-Circuit Current',
        explanationId: 'Arus dibatasi hanya oleh resistansi internal sumber dan resistansi kabel.',
        explanationEn: 'Current is restricted solely by source internal resistance and wiring impedance.',
      },
    ],
    starterPresetId: 'simple-lamp',
    quiz: [
      {
        id: 'q1',
        questionId: 'Mengapa MCB pada panel distribusi trip ketika terjadi korsleting?',
        questionEn: 'Why does the MCB trip when a short circuit occurs?',
        options: [
          { id: 'opt1', textId: 'Karena kuat arus melonjak melebihi ambang batas proteksi (10 A)', textEn: 'Because current surges beyond the safety threshold (10 A)', isCorrect: true },
          { id: 'opt2', textId: 'Karena tegangan baterai menjadi negatif', textEn: 'Because battery voltage inverts', isCorrect: false },
          { id: 'opt3', textId: 'Karena saklar manual dimatikan oleh siswa', textEn: 'Because the switch was manually opened', isCorrect: false },
          { id: 'opt4', textId: 'Karena hambatan kabel membesar', textEn: 'Because wire resistance increases', isCorrect: false },
        ],
        explanationId: 'MCB mendeteksi arus lebih (> 10 A) dan secara otomatis memutus kontak kontak mekanik untuk mencegah kebakaran.',
        explanationEn: 'The MCB senses overcurrent (> 10 A) and opens its contacts to prevent fire.',
      },
    ],
  },

  // ================= LEVEL 5: RENEWABLE ENERGY =================
  {
    id: 'l5_solar_microgrid',
    level: 5,
    order: 1,
    titleId: 'Pembangkit PLTS Surya & BESS Microgrid',
    titleEn: 'Solar PV & BESS Microgrid Systems',
    summaryId: 'Memodelkan konversi fotovoltaik, proteksi dioda blocking Schottky, dan keseimbangan daya microgrid.',
    summaryEn: 'Model photovoltaic conversion, Schottky blocking diodes, and microgrid power balance.',
    estimatedMinutes: 15,
    difficulty: 'advanced',
    xpReward: 100,
    learningObjectivesId: [
      'Menjelaskan konversi radiasi matahari (irradiance) menjadi gaya gerak listrik (GGL) DC.',
      'Memahami fungsi dioda blocking Schottky dalam mencegah baterai mengalirkan arus balik ke panel di malam hari.',
      'Menganalisis keseimbangan daya microgrid: P_pembangkit = P_beban + P_baterai + P_rugi.',
    ],
    learningObjectivesEn: [
      'Explain solar irradiance conversion into DC open-circuit electromotive force.',
      'Understand Schottky blocking diodes preventing battery back-feeding during low irradiance.',
      'Analyze microgrid power balance: P_generated = P_load + P_battery + P_losses.',
    ],
    theoryContentId: [
      'Efek Fotovoltaik: Foton cahaya matahari diserap oleh sel silikon semikonduktor, melepaskan pasangan elektron-hole dan menciptakan beda potensial.',
      'Tegangan keluaran panel berbanding lurus dengan intensitas radiasi matahari (irradiance W/m²). Di malam hari (irradiance = 0), panel tidak menghasilkan tegangan.',
      'Dioda Penyearah / Blocking Schottky: Mencegah baterai bertegangan tinggi (misal 12V) melepaskan muatan (discharge) kembali ke sel panel surya saat cuaca mendung atau malam hari.',
    ],
    theoryContentEn: [
      'Photovoltaic Effect: Solar photons excite valence electrons into conduction bands, producing DC EMF.',
      'Solar output scales with solar irradiance. At night (irradiance = 0), open-circuit voltage collapses.',
      'Schottky Blocking Diodes prevent higher-voltage batteries from discharging back into the solar panel array.',
    ],
    equations: [
      {
        formula: 'P_surya + P_angin = P_beban + P_isi_baterai',
        nameId: 'Keseimbangan Daya Microgrid',
        nameEn: 'Microgrid Power Balance',
        explanationId: 'Hukum kekekalan energi mengharuskan total pembangkitan sama dengan konsumsi dan penyimpanan.',
        explanationEn: 'Conservation of energy dictates generated power equals demand plus storage.',
      },
    ],
    starterPresetId: 'ultimate-power-grid',
    quiz: [
      {
        id: 'q1',
        questionId: 'Apa fungsi utama dioda blocking Schottky pada panel surya PLTS?',
        questionEn: 'What is the primary function of a Schottky blocking diode in a solar PV array?',
        options: [
          { id: 'opt1', textId: 'Mencegah arus balik dari baterai mengalir ke panel surya saat malam', textEn: 'Prevent reverse current flow from batteries into solar panels at night', isCorrect: true },
          { id: 'opt2', textId: 'Meningkatkan tegangan panel menjadi dua kali lipat', textEn: 'Double the panel output voltage', isCorrect: false },
          { id: 'opt3', textId: 'Mengubah arus searah DC menjadi bolak-balik AC', textEn: 'Invert DC current to AC', isCorrect: false },
          { id: 'opt4', textId: 'Mendinginkan panel surya', textEn: 'Cool down solar panel temperature', isCorrect: false },
        ],
        explanationId: 'Dioda blocking memastikan arus hanya mengalir satu arah: dari panel ke baterai/beban.',
        explanationEn: 'The blocking diode ensures unidirectional flow: from solar panels toward the battery/load.',
      },
    ],
  },

  // ================= LEVEL 6: ADVANCED ENGINEERING & MNA =================
  {
    id: 'l6_modified_nodal_analysis',
    level: 6,
    order: 1,
    titleId: 'Modified Nodal Analysis & Solusi Matriks',
    titleEn: 'Modified Nodal Analysis & Matrix Solvers',
    summaryId: 'Memahami bagaimana komputer merumuskan dan menyelesaikan persamaan sirkuit menggunakan formulasi MNA.',
    summaryEn: 'Understand how computers formulate and solve linear circuit equations using MNA matrices.',
    estimatedMinutes: 18,
    difficulty: 'advanced',
    xpReward: 120,
    learningObjectivesId: [
      'Memahami struktur matriks blok MNA: [G B; C D] × [v; j] = [i; e].',
      'Menjelaskan peran resistansi internal series (-R_int) di submatriks D dalam menstabilkan matriks saat korsleting.',
      'Memahami metode relaksasi iteratif untuk menyelesaikan komponen non-linear seperti dioda dan pengisian baterai.',
    ],
    learningObjectivesEn: [
      'Understand MNA block matrix formulation: [G B; C D] × [v; j] = [i; e].',
      'Explain the role of internal source resistance (-R_int) in matrix D preventing dead-short singularities.',
      'Understand iterative relaxation techniques for non-linear diodes and battery charging constraints.',
    ],
    theoryContentId: [
      'Modified Nodal Analysis (MNA) adalah algoritma standar industri (digunakan di SPICE) untuk menyelesaikan persamaan tegangan simpul dan arus cabang sumber tegangan secara simultan.',
      'Submatriks G berisi nilai konduktansi elemen pasif (resistor, bohlam, ammeter). Submatriks B dan C menggambarkan koneksi terminal sumber tegangan.',
      'Submatriks D distempel dengan nilai -R_internal dari sumber tegangan. Hal ini mencegah determinan bernilai nol ketika dua kutub baterai terhubung singkat (dead short).',
      'Eliminasi Gauss dengan Partial Pivoting digunakan untuk memecahkan sistem linier Ax = b dengan kompleksitas O(M³) dalam waktu kurang dari 0,2 milidetik.',
    ],
    theoryContentEn: [
      'Modified Nodal Analysis (MNA) is the industry standard (SPICE) for formulating nodal potentials and source branch currents simultaneously.',
      'Matrix G contains passive element conductances. B and C specify terminal incidence of independent voltage sources.',
      'Submatrix D is stamped with -R_int, preventing zero-determinant singularities during zero-ohm dead shorts.',
      'Gaussian Elimination with Partial Pivoting solves Ax = b in O(M³) in < 0.2 ms for real-time 60 FPS simulation.',
    ],
    equations: [
      {
        formula: '[G  B] [v]   [i]\n[C  D] [j] = [e]',
        nameId: 'Sistem Matriks Blok MNA',
        nameEn: 'MNA Block Matrix Equation',
        explanationId: 'v adalah vektor tegangan simpul, j adalah vektor kuat arus sumber tegangan.',
        explanationEn: 'v is the node potential vector, j is the voltage source branch current vector.',
      },
    ],
    starterPresetId: 'ultimate-power-grid',
    quiz: [
      {
        id: 'q1',
        questionId: 'Mengapa matriks D dalam formulasi MNA distempel dengan nilai -R_internal dari sumber tegangan?',
        questionEn: 'Why is submatrix D in MNA stamped with -R_int of voltage sources?',
        options: [
          { id: 'opt1', textId: 'Mencegah singularitas matematis (pembagian dengan nol) saat terjadi korsleting', textEn: 'Prevent mathematical singularity (division by zero) during short circuits', isCorrect: true },
          { id: 'opt2', textId: 'Menambah tegangan baterai agar lebih stabil', textEn: 'Increase battery voltage stability', isCorrect: false },
          { id: 'opt3', textId: 'Mengubah rangkaian menjadi rangkaian AC', textEn: 'Transform the network into an AC circuit', isCorrect: false },
          { id: 'opt4', textId: 'Menghitung tarif listrik PLN', textEn: 'Calculate utility tariffs', isCorrect: false },
        ],
        explanationId: 'Series resistance R_int memastikan diagonal matriks tidak pernah bernilai nol saat terjadi loop korslet ideal.',
        explanationEn: 'Series resistance R_int guarantees non-zero matrix diagonals during ideal short-circuit loops.',
      },
    ],
  },
];
