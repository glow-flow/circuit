import { AcademyLesson, AcademyLevelInfo } from '../types/academy';

/**
 * 6-Level Engineering Curriculum progression hierarchy.
 * Aligned strictly with LEVEL_XP_THRESHOLDS and ACADEMY_BADGES in academyPersistence.ts.
 */
export const ACADEMY_LEVELS: AcademyLevelInfo[] = [
  {
    level: 1,
    titleId: 'Fondasi Listrik',
    titleEn: 'Electrical Foundations',
    subtitleId: 'Tegangan, arus & panas Joule',
    subtitleEn: 'Voltage, current & Joule heat',
    requiredXp: 0,
    badgeId: 'first_spark',
  },
  {
    level: 2,
    titleId: 'Seri, Paralel & Pembagi',
    titleEn: 'Series, Parallel & Dividers',
    subtitleId: 'Simpul KCL & bagi tegangan KVL',
    subtitleEn: 'KCL junctions & KVL voltage split',
    requiredXp: 200,
    badgeId: 'ohm_master',
  },
  {
    level: 3,
    titleId: 'LED & Alat Ukur',
    titleEn: 'LEDs & Measuring Tools',
    subtitleId: 'Polaritas dioda & probe multimeter',
    subtitleEn: 'Diode polarity & meter safety',
    requiredXp: 500,
    badgeId: 'circuit_architect',
  },
  {
    level: 4,
    titleId: 'Proteksi & Korsleting',
    titleEn: 'Short Circuits & MCB',
    subtitleId: 'Diagnosa 0V, MCB & standar PUIL',
    subtitleEn: '0V faults, MCB trip & wire rating',
    requiredXp: 900,
    badgeId: 'safety_officer',
  },
  {
    level: 5,
    titleId: 'Energi Alam & SUTET',
    titleEn: 'Renewables & SUTET Grid',
    subtitleId: 'PLTS, bayu, SUTET & cas baterai Lab',
    subtitleEn: 'Solar, wind, SUTET & Lab charging',
    requiredXp: 1400,
    badgeId: 'renewable_pioneer',
  },
  {
    level: 6,
    titleId: 'Arsitek Solver MNA',
    titleEn: 'MNA Solver Engineering',
    subtitleId: 'Matriks MNA, R_int & Smart Grid',
    subtitleEn: 'MNA matrices, R_int & Smart Grids',
    requiredXp: 2000,
    badgeId: 'senior_engineer',
  },
];

/**
 * 14 bite-sized interactive micro-lessons (total = 2,500 XP).
 * Preserves all 7 foundational lesson IDs while making Level 6 (2,000 XP) and all 6 badges achievable.
 */
export const ACADEMY_LESSONS: AcademyLesson[] = [
  // ================= LEVEL 1: FONDASI LISTRIK (220 XP) =================
  {
    id: 'l1_ohms_law',
    level: 1,
    order: 1,
    titleId: 'Hukum Ohm: Tekanan Pipa Arus',
    titleEn: 'Ohm\'s Law: Pressure, Flow & Brake',
    summaryId: 'Pahami kenapa menaikkan voltase atau memperkecil hambatan bikin arus melesat.',
    summaryEn: 'See why raising voltage or lowering resistance accelerates electric current.',
    analogyId: 'Bayangkan listrik seperti selang air: Volt = pompa pendorong, Ohm = jepitan selang, Ampere = derasnya air!',
    analogyEn: 'Think of electricity like a garden hose: Volts push, Ohms pinch the hose, and Amps measure flow!',
    estimatedMinutes: 3,
    difficulty: 'beginner',
    xpReward: 110,
    learningObjectivesId: [
      'Menghitung arus I = V / R dalam hitungan detik',
      'Menjaga arus LED tetap aman di rentang 40 - 60 mA',
    ],
    learningObjectivesEn: [
      'Compute current I = V / R effortlessly',
      'Keep LED current inside the safe 40 - 60 mA window',
    ],
    theoryContentId: [
      'Tegangan (Volt) adalah tenaga pendorong elektron dari kutub negatif menuju positif.',
      'Resistor bekerja seperti rem: makin besar Ohm (Ω), makin kecil arus (Ampere) yang lolos.',
    ],
    theoryContentEn: [
      'Voltage (V) acts as electrical pressure pushing electrons around the loop.',
      'Resistance (Ω) opposes motion: higher resistance throttles current (A) down.',
    ],
    equations: [
      {
        formula: 'I = V / R',
        nameId: 'Hukum Ohm',
        nameEn: 'Ohm\'s Law',
        explanationId: 'Baterai 9V dengan beban 150Ω mengalirkan arus 0.06A (60 mA).',
        explanationEn: 'A 9V battery across 150Ω drives 0.06A (60 mA).',
      },
    ],
    interactiveDemoType: 'ohms_law',
    starterPresetId: 'simple-lamp',
    quiz: [
      {
        id: 'q1_ohm',
        questionId: 'Baterai 12V dihubungkan ke resistor 4Ω. Berapa arus yang mengalir?',
        questionEn: 'A 12V battery feeds a 4Ω resistor. How much current flows?',
        options: [
          { id: 'a', textId: '3 Ampere', textEn: '3 Amperes', isCorrect: true },
          { id: 'b', textId: '48 Ampere', textEn: '48 Amperes', isCorrect: false },
          { id: 'c', textId: '0.3 Ampere', textEn: '0.3 Amperes', isCorrect: false },
        ],
        explanationId: 'Gunakan I = V / R = 12V / 4Ω = 3 Ampere.',
        explanationEn: 'Apply I = V / R = 12V / 4Ω = 3 Amperes.',
      },
      {
        id: 'q2_ohm',
        questionId: 'Jika resistor diperbesar 2x lipat pada baterai yang sama, arus akan...',
        questionEn: 'If resistance doubles while battery voltage stays constant, current will...',
        options: [
          { id: 'a', textId: 'Turun menjadi setengahnya', textEn: 'Drop by half', isCorrect: true },
          { id: 'b', textId: 'Naik 2x lebih besar', textEn: 'Double in strength', isCorrect: false },
          { id: 'c', textId: 'Tetap sama persis', textEn: 'Stay identical', isCorrect: false },
        ],
        explanationId: 'Arus berbanding terbalik dengan hambatan (rem makin kuat -> aliran melemah).',
        explanationEn: 'Current is inversely proportional to resistance.',
      },
    ],
  },
  {
    id: 'l1_power_joule',
    level: 1,
    order: 2,
    titleId: 'Daya & Efek Panas Joule',
    titleEn: 'Electrical Power & Joule Heat',
    summaryId: 'Kenali mengapa kabel tipis memanas drastis saat arusnya berlipat ganda.',
    summaryEn: 'Discover why thin wires overheat dramatically when current doubles.',
    analogyId: 'Kenaikan arus 2x lipat bukan bikin panas 2x, tapi 4x lipat karena kuadrat (I²)!',
    analogyEn: 'Doubling current does not double wire heat—it quadruples heat because of I squared (I²)!',
    estimatedMinutes: 3,
    difficulty: 'beginner',
    xpReward: 110,
    learningObjectivesId: [
      'Menghitung daya beban dengan rumus P = V × I',
      'Menghindari putus filamen dengan membatasi panas I²R',
    ],
    learningObjectivesEn: [
      'Calculate electrical power via P = V × I',
      'Prevent filament burnout by limiting I²R heating',
    ],
    theoryContentId: [
      'Daya listrik (Watt) mengukur seberapa cepat energi diubah menjadi cahaya atau panas tiap detik.',
      'Di kawat berhambatan R, panas muncul sebesar I² × R — musuh utama instalasi kelebihan beban!',
    ],
    theoryContentEn: [
      'Power (Watts) measures how fast electrical energy converts to light or heat.',
      'Along a wire of resistance R, heat jumps with I² × R—the main culprit behind overloads!',
    ],
    equations: [
      {
        formula: 'P = I² × R',
        nameId: 'Kalor Joule',
        nameEn: 'Joule Dissipation',
        explanationId: 'Arus 2A di kabel 10Ω melepaskan panas 40 Watt!',
        explanationEn: 'A 2A flow in a 10Ω wire releases 40 Watts of heat!',
      },
    ],
    interactiveDemoType: 'joule_power',
    starterPresetId: 'simple-lamp',
    quiz: [
      {
        id: 'q1_joule',
        questionId: 'Arus naik dari 1A menjadi 3A lewat kabel 2Ω. Panas kabel naik berapa kali?',
        questionEn: 'Current rises from 1A to 3A through a 2Ω wire. Heat increases by what factor?',
        options: [
          { id: 'a', textId: '9 kali lebih panas (3²)', textEn: '9 times hotter (3²)', isCorrect: true },
          { id: 'b', textId: '3 kali lebih panas', textEn: '3 times hotter', isCorrect: false },
          { id: 'c', textId: '6 kali lebih panas', textEn: '6 times hotter', isCorrect: false },
        ],
        explanationId: 'Karena P = I² × R, arus 3x lipat menghasilkan panas 3² = 9x lipat.',
        explanationEn: 'Because P = I² × R, tripling current yields 3² = 9x thermal power.',
      },
      {
        id: 'q2_joule',
        questionId: 'Lampu 9V menyerap arus 0.5A. Berapa daya listrik lampu tersebut?',
        questionEn: 'A 9V bulb draws 0.5A. What power does it consume?',
        options: [
          { id: 'a', textId: '4.5 Watt', textEn: '4.5 Watts', isCorrect: true },
          { id: 'b', textId: '18 Watt', textEn: '18 Watts', isCorrect: false },
          { id: 'c', textId: '9.5 Watt', textEn: '9.5 Watts', isCorrect: false },
        ],
        explanationId: 'P = V × I = 9V × 0.5A = 4.5 Watt.',
        explanationEn: 'P = V × I = 9V × 0.5A = 4.5 Watts.',
      },
    ],
  },

  // ================= LEVEL 2: SERI, PARALEL & PEMBAGI (320 XP) =================
  {
    id: 'l2_series_parallel',
    level: 2,
    order: 1,
    titleId: 'Seri vs Paralel & Simpul KCL',
    titleEn: 'Series vs Parallel & KCL Nodes',
    summaryId: 'Lihat langsung kenapa lampu rumah tetap menyala saat 1 bohlam ruang lain dicopot.',
    summaryEn: 'See why house lights stay lit even when you unscrew one bulb in another room.',
    analogyId: 'Seri itu 1 jalur tol: 1 lubang putus, semua macet! Paralel punya jalur cabang mandiri seperti kamar rumah.',
    analogyEn: 'Series is a single-lane bridge: one break stops everyone! Parallel gives each bulb its own lane.',
    estimatedMinutes: 4,
    difficulty: 'beginner',
    xpReward: 160,
    learningObjectivesId: [
      'Membedakan aliran arus tunggal (Seri) dan terbagi (Paralel)',
      'Menerapkan Hukum KCL: arus masuk simpul = jumlah arus keluar',
    ],
    learningObjectivesEn: [
      'Contrast single-loop (Series) vs multi-branch (Parallel) behavior',
      'Apply KCL: current entering a junction equals total branch outflow',
    ],
    theoryContentId: [
      'Di rangkaian Paralel, setiap cabang menerima tegangan sumber penuh secara mandiri tanpa melemahkan cabang lain.',
      'Pada titik percabangan (Simpul KCL), total arus yang keluar dari baterai selalu sama dengan I₁ + I₂.',
    ],
    theoryContentEn: [
      'In a Parallel layout, every branch sees full source voltage independently.',
      'At any wire junction (KCL), total battery current splits neatly as I_total = I₁ + I₂.',
    ],
    equations: [
      {
        formula: 'I_total = I₁ + I₂',
        nameId: 'Hukum Arus Kirchhoff (KCL)',
        nameEn: 'Kirchhoff Current Law',
        explanationId: 'Cabang berhambatan kecil menyedot arus lebih besar, tapi jumlahnya tetap I_total.',
        explanationEn: 'Lower-resistance branches draw more current, summing to I_total.',
      },
    ],
    interactiveDemoType: 'kcl_junction',
    starterPresetId: 'parallel-bulbs',
    quiz: [
      {
        id: 'q1_par',
        questionId: 'Mengapa lampu rumah selalu dirangkai Paralel, bukan Seri?',
        questionEn: 'Why are house lights wired in Parallel instead of Series?',
        options: [
          {
            id: 'a',
            textId: 'Agar tiap lampu dapat voltase penuh & independen jika 1 mati',
            textEn: 'Each bulb gets full voltage & stays lit if another burns out',
            isCorrect: true,
          },
          {
            id: 'b',
            textId: 'Supaya semua ruangan ikut padam bila 1 saklar dimatikan',
            textEn: 'So all rooms turn off when one switch opens',
            isCorrect: false,
          },
          {
            id: 'c',
            textId: 'Karena kabel paralel tidak butuh sumber tegangan',
            textEn: 'Because parallel wires need no power supply',
            isCorrect: false,
          },
        ],
        explanationId: 'Instalasi paralel menjaga setiap lampu mendapat tegangan penuh & terpisah jalurnya.',
        explanationEn: 'Parallel wiring ensures full voltage per room and independent switches.',
      },
      {
        id: 'q2_par',
        questionId: 'Arus cabang 1 = 2A dan cabang 2 = 3A bertemu di simpul KCL. Arus total baterai adalah...',
        questionEn: 'Branch 1 draws 2A and branch 2 draws 3A from the battery junction. Total current is...',
        options: [
          { id: 'a', textId: '5 Ampere', textEn: '5 Amperes', isCorrect: true },
          { id: 'b', textId: '1 Ampere', textEn: '1 Ampere', isCorrect: false },
          { id: 'c', textId: '6 Ampere', textEn: '6 Amperes', isCorrect: false },
        ],
        explanationId: 'Berdasarkan KCL: I_total = 2A + 3A = 5A.',
        explanationEn: 'By KCL, I_total = 2A + 3A = 5A.',
      },
    ],
  },
  {
    id: 'l2_voltage_divider',
    level: 2,
    order: 2,
    titleId: 'Pembagi Tegangan & Hukum KVL',
    titleEn: 'Voltage Divider & KVL Loop',
    summaryId: 'Turunkan 12V menjadi 5V atau 6V dengan presisi memakai dua resistor seri.',
    summaryEn: 'Step down 12V into 5V or 6V cleanly using two series resistors.',
    analogyId: 'KVL itu seperti naik lift 12 meter lalu turun dua anak tangga (R₁ & R₂) sampai tepat di lantai nol (0V)!',
    analogyEn: 'KVL is like taking an elevator up 12 floors, then stepping down R₁ and R₂ back to ground zero!',
    estimatedMinutes: 4,
    difficulty: 'intermediate',
    xpReward: 160,
    learningObjectivesId: [
      'Menghitung tegangan keluar V_out dari rasio R₂ / (R₁ + R₂)',
      'Membuktikan KVL: jumlah jatuh tegangan loop = tegangan sumber',
    ],
    learningObjectivesEn: [
      'Compute tapped output V_out via ratio R₂ / (R₁ + R₂)',
      'Verify KVL: sum of voltage drops equals source voltage',
    ],
    theoryContentId: [
      'Saat dua resistor disusun seri, total tegangan baterai terbagi sebanding dengan porsi Ohm masing-masing.',
      'Jika R₁ dan R₂ bernilai sama persis, maka node tengah pasti menerima setengah tegangan sumber (V_in / 2).',
    ],
    theoryContentEn: [
      'Two resistors in series split battery voltage proportionally to their resistance share.',
      'When R₁ equals R₂, the middle tap delivers exactly half of V_in.',
    ],
    equations: [
      {
        formula: 'V_out = V_in × R₂ / (R₁ + R₂)',
        nameId: 'Rasio Pembagi Tegangan',
        nameEn: 'Voltage Divider Rule',
        explanationId: 'Semakin besar R₂ dibanding R₁, semakin besar porsi V_out.',
        explanationEn: 'Larger R₂ yields a larger share of V_out.',
      },
    ],
    interactiveDemoType: 'voltage_divider',
    starterPresetId: 'voltage-divider',
    quiz: [
      {
        id: 'q1_vd',
        questionId: 'Dengan V_in = 10V, R₁ = 100Ω dan R₂ = 100Ω, berapa V_out?',
        questionEn: 'Given V_in = 10V, R₁ = 100Ω, and R₂ = 100Ω, what is V_out?',
        options: [
          { id: 'a', textId: '5.0 Volt', textEn: '5.0 Volts', isCorrect: true },
          { id: 'b', textId: '10.0 Volt', textEn: '10.0 Volts', isCorrect: false },
          { id: 'c', textId: '2.5 Volt', textEn: '2.5 Volts', isCorrect: false },
        ],
        explanationId: 'R₁ = R₂ membagi rata tegangan 10V tepat menjadi 5.0V.',
        explanationEn: 'Equal resistors split 10V cleanly in half to 5.0V.',
      },
      {
        id: 'q2_vd',
        questionId: 'Dalam satu loop tertutup baterai 9V dengan dua lampu seri, bila Lampu A turun 3V, maka Lampu B...',
        questionEn: 'In a 9V series loop with two bulbs, if Bulb A drops 3V, Bulb B must drop...',
        options: [
          { id: 'a', textId: '6.0 Volt (hukum KVL)', textEn: '6.0 Volts (KVL)', isCorrect: true },
          { id: 'b', textId: '9.0 Volt', textEn: '9.0 Volts', isCorrect: false },
          { id: 'c', textId: '3.0 Volt', textEn: '3.0 Volts', isCorrect: false },
        ],
        explanationId: 'Hukum KVL mewajibkan 3V + 6V = 9V sumber baterai.',
        explanationEn: 'Kirchhoff Voltage Law enforces 3V + 6V = 9V.',
      },
    ],
  },

  // ================= LEVEL 3: LED & ALAT UKUR (400 XP) =================
  {
    id: 'l3_semiconductor_led',
    level: 3,
    order: 1,
    titleId: 'Katup Satu Arah: LED & Resistor',
    titleEn: 'One-Way Valve: LEDs & Polarity',
    summaryId: 'Pahami kenapa LED padam jika kakinya terbalik dan wajib ditemani resistor.',
    summaryEn: 'Learn why reversed LEDs block flow and why bare LEDs need a limiter resistor.',
    analogyId: 'LED itu seperti pintu putar 1 arah: arus maju (Anoda -> Katoda) tembus bersinar, arus balik langsung diblokir!',
    analogyEn: 'An LED acts like a one-way turnstile: forward polarity glows, reverse polarity locks tight!',
    estimatedMinutes: 4,
    difficulty: 'intermediate',
    xpReward: 200,
    learningObjectivesId: [
      'Menghubungkan Anoda (+) ke kutub positif & Katoda (-) ke ground',
      'Memasang resistor pembatas agar LED tidak over-current',
    ],
    learningObjectivesEn: [
      'Wire Anode (+) to positive supply and Cathode (-) to ground',
      'Protect LEDs from burning out using a series limiter resistor',
    ],
    theoryContentId: [
      'Berbeda dari bohlam biasa, LED hanya menyala saat Forward Bias (Anoda + mendapat tegangan lebih tinggi daripada Katoda -).',
      'Karena LED memiliki hambatan sangat kecil setelah melewati ~2V, selalu pasang resistor seri ~220Ω.',
    ],
    theoryContentEn: [
      'Unlike incandescent bulbs, LEDs only conduct in Forward Bias (Anode + higher than Cathode -).',
      'Once an LED opens around ~2V, its internal resistance drops tiny, so add a ~220Ω series resistor.',
    ],
    equations: [
      {
        formula: 'R_limit = (V_sumber - V_led) / I_aman',
        nameId: 'Resistor Pembatas LED',
        nameEn: 'LED Limiter Sizing',
        explanationId: 'Dari sumber 5V ke LED 2V agar 15mA: R = (5 - 2) / 0.015 = 200Ω.',
        explanationEn: 'From 5V to a 2V LED at 15mA: R = (5 - 2) / 0.015 = 200Ω.',
      },
    ],
    interactiveDemoType: 'led_polarity',
    starterPresetId: 'simple-lamp',
    quiz: [
      {
        id: 'q1_led',
        questionId: 'Mengapa LED tidak menyala meski baterai terhubung, jika Anoda (+) dipasang ke negatif baterai?',
        questionEn: 'Why does an LED stay dark when its Anode (+) connects to battery negative?',
        options: [
          { id: 'a', textId: 'Terjadi Reverse Bias (arus diblokir 1 arah)', textEn: 'It is Reverse Biased (blocked)', isCorrect: true },
          { id: 'b', textId: 'Baterai perlu dibolak-balik AC dulu', textEn: 'Battery needs AC reversal', isCorrect: false },
          { id: 'c', textId: 'Karena hambatan LED berubah jadi 0Ω', textEn: 'LED resistance dropped to 0Ω', isCorrect: false },
        ],
        explanationId: 'Dioda/LED bersifat searah: kondisi terbalik memblokir arus listrik (0 mA).',
        explanationEn: 'A diode blocks reverse current completely.',
      },
      {
        id: 'q2_led',
        questionId: 'Apa fungsi resistor 220Ω yang dipasang seri dengan LED 5V?',
        questionEn: 'What does a 220Ω series resistor do alongside a 5V LED?',
        options: [
          { id: 'a', textId: 'Membatasi arus agar LED tidak terbakar', textEn: 'Limits current so the LED will not burn out', isCorrect: true },
          { id: 'b', textId: 'Menaikkan tegangan baterai jadi 12V', textEn: 'Boosts battery to 12V', isCorrect: false },
          { id: 'c', textId: 'Mengubah arus DC jadi AC', textEn: 'Converts DC into AC', isCorrect: false },
        ],
        explanationId: 'Resistor membatasi lonjakan arus sesudah LED aktif melewati tegangan maju ~2V.',
        explanationEn: 'The resistor caps safe mA flow once the LED conducts.',
      },
    ],
  },
  {
    id: 'l3_meters_volt_amp',
    level: 3,
    order: 2,
    titleId: 'Multimeter: Voltmeter vs Ammeter',
    titleEn: 'Multimeters: Voltmeter vs Ammeter',
    summaryId: 'Hindari kesalahan klasik laboratorium: mem-paralelkan Ammeter yang bikin korslet!',
    summaryEn: 'Avoid the classic lab mistake: wiring an Ammeter in parallel and causing a short!',
    analogyId: 'Voltmeter itu mengintip dari samping (Paralel, R=∞); Ammeter ikut berbaris di jalur aliran (Seri, R≈0)!',
    analogyEn: 'A Voltmeter peeks beside the road (Parallel); an Ammeter stands right in traffic to count electrons (Series)!',
    estimatedMinutes: 4,
    difficulty: 'intermediate',
    xpReward: 200,
    learningObjectivesId: [
      'Memasang Voltmeter secara Paralel di dua ujung beban',
      'Memasang Ammeter secara Seri memotong jalur kabel',
    ],
    learningObjectivesEn: [
      'Probe Voltage strictly in Parallel across a load',
      'Wire Ammeters strictly in Series inline with current',
    ],
    theoryContentId: [
      'Voltmeter ideal punya hambatan raksasa (≈ ∞) supaya tidak mencuri arus saat ditempel paralel.',
      'Ammeter punya hambatan nyaris nol (≈ 0Ω): jika dipasang paralel langsung ke baterai, baterai otomatis KORSLET!',
    ],
    theoryContentEn: [
      'Voltmeters carry mega-ohm resistance so parallel probing steals negligible current.',
      'Ammeters have near-zero internal resistance: connecting one parallel across a battery creates an instant short circuit!',
    ],
    equations: [
      {
        formula: 'Volt = Paralel | Ampere = Seri',
        nameId: 'Aturan Emas Probe Lab',
        nameEn: 'Golden Probe Rule',
        explanationId: 'Selalu cek posisi port sebelum menyalakan saklar daya.',
        explanationEn: 'Verify probe configuration before flipping the power switch.',
      },
    ],
    interactiveDemoType: 'led_polarity',
    starterPresetId: 'parallel-bulbs',
    quiz: [
      {
        id: 'q1_meter',
        questionId: 'Apa akibatnya bila Ammeter (hambatan ~0Ω) dipasang paralel langsung ke kutub + dan - baterai?',
        questionEn: 'What happens if an Ammeter (~0Ω) is wired in parallel directly across battery terminals?',
        options: [
          { id: 'a', textId: 'Korsleting seketika & sekring meter putus!', textEn: 'Instant short circuit & blown fuse!', isCorrect: true },
          { id: 'b', textId: 'Baterai bertambah tegangannya 2x', textEn: 'Battery voltage doubles', isCorrect: false },
          { id: 'c', textId: 'Tidak ada yang terjadi karena R=0', textEn: 'Nothing happens since R=0', isCorrect: false },
        ],
        explanationId: 'Hambatan nyaris 0Ω menjadi jalur pintas tanpa beban yang memicu arus kejut ekstrem.',
        explanationEn: 'A ~0Ω bypass dumps maximum surge current straight through the meter.',
      },
      {
        id: 'q2_meter',
        questionId: 'Cara yang aman untuk mengukur beda potensial sebuah lampu adalah...',
        questionEn: 'The safe way to measure voltage drop across a bulb is...',
        options: [
          { id: 'a', textId: 'Tempel Voltmeter paralel di kedua kaki lampu', textEn: 'Probe Voltmeter in parallel across the bulb', isCorrect: true },
          { id: 'b', textId: 'Ganti lampu dengan kabel tembaga polos', textEn: 'Replace the bulb with bare wire', isCorrect: false },
          { id: 'c', textId: 'Lepas baterai terlebih dahulu baru diukur', textEn: 'Remove the battery before probing', isCorrect: false },
        ],
        explanationId: 'Voltmeter mengukur selisih tekanan antar 2 titik sehingga dipasang paralel.',
        explanationEn: 'Voltmeters compare potential difference across two terminals in parallel.',
      },
    ],
  },

  // ================= LEVEL 4: PROTEKSI & KORSLETING (500 XP) =================
  {
    id: 'l4_short_circuit_mcb',
    level: 4,
    order: 1,
    titleId: 'Korsleting 0V & Reaksi Cepat MCB',
    titleEn: '0V Short Circuits & MCB Tripping',
    summaryId: 'Pahami kenapa tegangan baterai langsung anjlok ke 0V saat ada kabel bypass polos.',
    summaryEn: 'Understand why battery voltage drops to 0V when a bare bypass wire shorts the rails.',
    analogyId: 'Korslet itu bendungan jebol tanpa turbin: semua energi habis memanaskan kawat bypass dan MCB segera memutus aliran!',
    analogyEn: 'A short circuit is a burst dam bypassing every turbine: energy dumps straight into wire heat until MCB trips!',
    estimatedMinutes: 4,
    difficulty: 'intermediate',
    xpReward: 250,
    learningObjectivesId: [
      'Mendeteksi penyebab baterai tiba-tiba terukur ~0.0V',
      'Mengisolasi kawat hubung singkat lalu me-reset MCB',
    ],
    learningObjectivesEn: [
      'Diagnose why a shorted battery suddenly reads ~0.0V',
      'Cut the faulty bypass conductor and reset the MCB breaker',
    ],
    theoryContentId: [
      'Saat kabel telanjang menghubungkan kutub (+) ke (-), seluruh tegangan jatuh habis di hambatan dalam baterai, sehingga terminal terbaca nyaris 0.0V!',
      'MCB (Mini Circuit Breaker) mendeteksi lonjakan arus di atas batas aman lalu anjlok (TRIP) memutus api kebakaran.',
    ],
    theoryContentEn: [
      'A direct zero-load wire collapses external terminal voltage near 0.0V across internal battery resistance.',
      'An MCB detects the extreme current spike and trips offline before cables catch fire.',
    ],
    equations: [
      {
        formula: 'V_terminal = E₀ - (I_short × R_int) ≈ 0 V',
        nameId: 'Runtuhnya Tegangan Terminal',
        nameEn: 'Terminal Voltage Collapse',
        explanationId: 'Seluruh 9V habis terbuang di dalam baterai saat korsleting.',
        explanationEn: 'All 9V is burned internally during a direct short.',
      },
    ],
    interactiveDemoType: 'short_circuit_mcb',
    starterPresetId: 'short-circuit-demo',
    quiz: [
      {
        id: 'q1_mcb',
        questionId: 'Mengapa voltmeter terbaca ~0.0V di terminal baterai padahal baterainya masih penuh saat korslet?',
        questionEn: 'Why does a shorted full battery measure ~0.0V across its terminals?',
        options: [
          {
            id: 'a',
            textId: 'Arus kejut besar menghabiskan seluruh voltase di hambatan internal baterai',
            textEn: 'Surge current drops all voltage internally across R_int',
            isCorrect: true,
          },
          {
            id: 'b',
            textId: 'Elektron langsung menghilang keluar angkasa',
            textEn: 'Electrons vanish immediately',
            isCorrect: false,
          },
          {
            id: 'c',
            textId: 'Karena lampu di samping baterai terlalu terang',
            textEn: 'Adjacent bulbs glow too brightly',
            isCorrect: false,
          },
        ],
        explanationId: 'Hukum KVL membuktikan V_out = V_sumber - I × R_int anjlok mendekati 0V saat I ekstrem.',
        explanationEn: 'By V_term = E₀ - I·R_int, massive current pulls terminal voltage to 0V.',
      },
      {
        id: 'q2_mcb',
        questionId: 'Urutan aman memperbaiki instalasi yang MCB-nya selalu anjlok saat dinaikkan adalah...',
        questionEn: 'What is the safe order when an MCB keeps tripping immediately?',
        options: [
          {
            id: 'a',
            textId: 'Cari & putus kawat hubung singkat dulu, baru nyalakan MCB',
            textEn: 'Isolate & remove the shorting wire first, then reset MCB',
            isCorrect: true,
          },
          {
            id: 'b',
            textId: 'Ganjal tuas MCB pakai kayu agar tidak bisa turun',
            textEn: 'Tape the breaker lever open',
            isCorrect: false,
          },
          {
            id: 'c',
            textId: 'Tambah 2 baterai lagi secara seri',
            textEn: 'Add two more batteries in series',
            isCorrect: false,
          },
        ],
        explanationId: 'Memaksa MCB tetap ON saat kawat masih korslet berisiko membakar isolasi kabel.',
        explanationEn: 'Forcing a tripped breaker without removing the fault risks cable fire.',
      },
    ],
  },
  {
    id: 'l4_puil_cable_safety',
    level: 4,
    order: 2,
    titleId: 'Ukuran Kabel PUIL & Batas Ampacity',
    titleEn: 'Cable Sizing (PUIL) & Ampacity',
    summaryId: 'Kenapa kabel kecil tidak boleh menanggung beban pompa atau pemanas berdaya besar.',
    summaryEn: 'Discover why thin wires melt under heavy appliances and why copper gauge matters.',
    analogyId: 'Kabel tipis 0.5mm² yang dialiri 15A ibarat ratusan orang berdesakan di pintu sempit — panas dan macet!',
    analogyEn: 'Pushing 15A through thin 0.5mm² copper is like cramming a stadium crowd through one narrow door!',
    estimatedMinutes: 4,
    difficulty: 'intermediate',
    xpReward: 250,
    learningObjectivesId: [
      'Membandingkan hambatan kabel tipis 0.5mm² vs standar PUIL 2.5mm²',
      'Memilih penampang konduktor sesuai Kemampuan Hantar Arus (KHA)',
    ],
    learningObjectivesEn: [
      'Compare thin 0.5mm² wire resistance against PUIL 2.5mm² standard',
      'Select wire gauge matching safe continuous ampacity',
    ],
    theoryContentId: [
      'Konduktor lebih tebal (2.5 mm²) punya hambatan listrik lebih kecil sehingga kerugian panas I²R turun drastis.',
      'Standar PUIL mewajibkan kabel stopkontak rumah minimal tembaga 2.5 mm² dengan pengaman MCB yang lebih kecil dari KHA kabel.',
    ],
    theoryContentEn: [
      'Thicker copper (2.5 mm²) offers much lower resistance, slashing I²R heat along long runs.',
      'Electrical codes require breaker amp ratings strictly below wire ampacity limits.',
    ],
    equations: [
      {
        formula: 'I_MCB ≤ KHA_kabel',
        nameId: 'Koordinasi Proteksi PUIL',
        nameEn: 'Breaker-Cable Coordination',
        explanationId: 'MCB wajib trip lebih dulu sebelum isolasi plastik kabel sempat meleleh.',
        explanationEn: 'The breaker must trip well before wire insulation softens.',
      },
    ],
    interactiveDemoType: 'short_circuit_mcb',
    starterPresetId: 'short-circuit-demo',
    quiz: [
      {
        id: 'q1_puil',
        questionId: 'Kabel berpenampang kecil (0.5mm²) cepat panas saat arus besar karena...',
        questionEn: 'Thin wire (0.5mm²) heats faster under high current because...',
        options: [
          {
            id: 'a',
            textId: 'Hambatan kawatnya lebih besar sehingga rugi kalor I²R tinggi',
            textEn: 'Higher wire resistance causes high I²R heating',
            isCorrect: true,
          },
          {
            id: 'b',
            textId: 'Plastik isolasinya menghasilkan tegangan listrik sendiri',
            textEn: 'Insulation generates extra battery volts',
            isCorrect: false,
          },
          {
            id: 'c',
            textId: 'Kabel tipis memantulkan cahaya matahari',
            textEn: 'Thin wires reflect sunlight',
            isCorrect: false,
          },
        ],
        explanationId: 'Luas penampang kecil meningkatkan resistansi kawat dan pelepasan panas I²R.',
        explanationEn: 'Smaller cross-section increases wire R and thermal losses.',
      },
      {
        id: 'q2_puil',
        questionId: 'Berapa koordinasi yang benar antara MCB dan batas aman kabel (KHA)?',
        questionEn: 'What is the proper coordination between MCB rating and cable ampacity?',
        options: [
          { id: 'a', textId: 'Rating MCB lebih kecil dari KHA kabel', textEn: 'MCB rating <= cable ampacity', isCorrect: true },
          { id: 'b', textId: 'Rating MCB 3x lebih besar dari kabel', textEn: 'MCB 3x higher than cable', isCorrect: false },
          { id: 'c', textId: 'Tidak perlu MCB jika kabel pendek', textEn: 'Skip MCB for short wires', isCorrect: false },
        ],
        explanationId: 'MCB harus memutus arus sebelum batas maksimal kabel terlampaui.',
        explanationEn: 'The breaker protects the cable by tripping under wire limits.',
      },
    ],
  },

  // ================= LEVEL 5: ENERGI ALAM & SUTET (560 XP) =================
  {
    id: 'l5_solar_microgrid',
    level: 5,
    order: 1,
    titleId: 'PLTS Alam: Sudut Surya & MPPT',
    titleEn: 'Solar Power: Sun Angle & MPPT',
    summaryId: 'Atur orientasi matahari di Alam EBT dan pahami kenapa daya surya naik turun sepanjang hari.',
    summaryEn: 'Explore why solar output curves with sun angle and how batteries buffer clouds.',
    analogyId: 'Panel surya ibarat penadah air hujan: makin tegak lurus menghadap cahaya siang, makin deras panen energinya!',
    analogyEn: 'A solar array acts like a rain bucket: tilting directly toward midday sun catches peak energy!',
    estimatedMinutes: 4,
    difficulty: 'intermediate',
    xpReward: 180,
    learningObjectivesId: [
      'Menghubungkan sudut penyinaran matahari dengan produksi Watt PLTS',
      'Mengerti alasan Panel Surya dipadukan baterai di siang hari',
    ],
    learningObjectivesEn: [
      'Relate sunlight incidence angle to PV Watt generation',
      'Understand why daytime solar buffers into rechargeable storage',
    ],
    theoryContentId: [
      'Di Alam EBT, mode Pagi (35°), Siang (90°), dan Sore mengubah fluks foton ke sel surya secara langsung.',
      'Agar peralatan lab tetap hidup saat awan lewat, kelebihan daya PLTS disalurkan ke Panel Lab atau Gardu BESS.',
    ],
    theoryContentEn: [
      'Sun elevation angles (Morning, Noon, Evening) directly vary solar irradiance hitting PV cells.',
      'Pairing PV arrays with energy storage keeps voltage steady whenever clouds pass overhead.',
    ],
    equations: [
      {
        formula: 'P_pv ∝ Irradiance × cos(θ)',
        nameId: 'Daya Panel Surya',
        nameEn: 'PV Output Scaling',
        explanationId: 'Puncak produksi terjadi saat sudut matahari dekat tegak lurus (Siang).',
        explanationEn: 'Peak generation occurs near overhead noon illumination.',
      },
    ],
    interactiveDemoType: 'sutet_loss',
    starterPresetId: 'ultimate-power-grid',
    quiz: [
      {
        id: 'q1_solar',
        questionId: 'Kapan panel surya datar di halaman terbuka menghasilkan daya paling besar?',
        questionEn: 'When does a flat outdoor solar panel deliver highest peak output?',
        options: [
          { id: 'a', textId: 'Siang hari saat matahari tepat di puncak (90°)', textEn: 'Midday when sun angle nears 90°', isCorrect: true },
          { id: 'b', textId: 'Tengah malam saat suhu udara dingin', textEn: 'Midnight when air is cool', isCorrect: false },
          { id: 'c', textId: 'Saat tertutup awan tebal mendung', textEn: 'Under thick storm clouds', isCorrect: false },
        ],
        explanationId: 'Intensitas cahaya tegak lurus di siang hari memaksimalkan arus fotolistrik.',
        explanationEn: 'Perpendicular midday irradiance yields peak solar current.',
      },
      {
        id: 'q2_solar',
        questionId: 'Mengapa pembangkit surya butuh baterai atau sambungan grid di lab?',
        questionEn: 'Why pair outdoor solar panels with batteries or a Lab charger?',
        options: [
          {
            id: 'a',
            textId: 'Menyimpan energi siang untuk dipakai saat gelap/beban puncak',
            textEn: 'Store daytime energy for nighttime or heavy Lab loads',
            isCorrect: true,
          },
          {
            id: 'b',
            textId: 'Agar panel surya berhenti memproduksi tegangan',
            textEn: 'To stop solar panels from making voltage',
            isCorrect: false,
          },
          {
            id: 'c',
            textId: 'Untuk mendinginkan matahari',
            textEn: 'To cool down sunlight',
            isCorrect: false,
          },
        ],
        explanationId: 'Baterai meratakan pasokan energi surya yang fluktuatif.',
        explanationEn: 'Batteries smooth fluctuating renewable generation.',
      },
    ],
  },
  {
    id: 'l5_sutet_transformer',
    level: 5,
    order: 2,
    titleId: 'Rahasia SUTET → Cas Baterai Lab',
    titleEn: 'Why Boost to SUTET for Lab Charging',
    summaryId: 'Jawaban tuntas: kenapa pembangkit alam masuk menara SUTET sebelum mengecas baterai Lab.',
    summaryEn: 'Why outdoor power boosts through SUTET towers before safely recharging Lab batteries.',
    analogyId: 'Kirim 240W lewat kabel jarak 400m di 12V bikin kabel meleleh (20A!), tapi lewat SUTET 240V arusnya tinggal 1A dan nyaris nol panas!',
    analogyEn: 'Sending 240W over 400m at 12V melts wires (20A!), yet stepping up to 240V SUTET shrinks current 20x and cuts heat 400x!',
    estimatedMinutes: 4,
    difficulty: 'intermediate',
    xpReward: 200,
    learningObjectivesId: [
      'Menghitung penghematan rugi panas I²R saat tegangan dinaikkan ke SUTET',
      'Memahami alur Alam EBT → Menara SUTET → Panel Lab → Cas Baterai 9V',
    ],
    learningObjectivesEn: [
      'Quantify I²R line loss reduction when transmission voltage steps up',
      'Master the full loop: Outdoor EBT → SUTET Pylon → Lab Bus → Battery Charger',
    ],
    theoryContentId: [
      'Menghubungkan PLTS/Bayu di Alam EBT ke Menara SUTET mengaktifkan jaringan bus ekspor bertegangan tinggi agar energi hemat saat dikirim jauh.',
      'Saat tombol "Pasang Stasiun Cas Lab" diklik, Panel Distribusi Lab otomatis mengalirkan daya SUTET itu untuk mengecas baterai Lab yang habis.',
    ],
    theoryContentEn: [
      'Wiring outdoor plants into a SUTET pylon exports power with tiny current and near-zero wire heat.',
      'Inside the Lab, the Distribution Bus steps power down safely to recharge depleted student batteries.',
    ],
    equations: [
      {
        formula: 'V naik 20×  ⇒  I turun 20×  ⇒  P_rugi turun 400×',
        nameId: 'Prinsip Efisiensi SUTET',
        nameEn: 'High-Voltage Transmission Rule',
        explanationId: 'Karena rugi kabel sebanding I², mengecilkan arus 20x memotong rugi panas 400x!',
        explanationEn: 'Since line heat scales with I², 20x lower current drops heat 400x!',
      },
    ],
    interactiveDemoType: 'sutet_loss',
    starterPresetId: 'ultimate-power-grid',
    quiz: [
      {
        id: 'q1_sutet',
        questionId: 'Apa fungsi utama menara transmisi SUTET saat dihubungkan dari PLTS Alam?',
        questionEn: 'Why connect outdoor solar/wind plants to a SUTET transmission tower?',
        options: [
          {
            id: 'a',
            textId: 'Menyalurkan daya jarak jauh ke Panel Lab dengan rugi kabel kecil',
            textEn: 'Transmit power efficiently to the Lab panel with low wire heat loss',
            isCorrect: true,
          },
          {
            id: 'b',
            textId: 'Sekadar tiang hiasan di atas bukit hijau',
            textEn: 'Only a decorative hill tower',
            isCorrect: false,
          },
          {
            id: 'c',
            textId: 'Membuang kelebihan listrik agar baterai jadi 0V',
            textEn: 'Dump excess electricity to drain batteries to 0V',
            isCorrect: false,
          },
        ],
        explanationId: 'SUTET mengekspor daya pembangkit Alam EBT dengan efisiensi tinggi ke Panel Distribusi Lab untuk mengecas baterai.',
        explanationEn: 'SUTET transmits clean outdoor power efficiently to recharge Lab batteries.',
      },
      {
        id: 'q2_sutet',
        questionId: 'Jika tegangan kirim dinaikkan 10x lipat untuk daya P tetap, panas kabel I²R berkurang menjadi...',
        questionEn: 'If transmission voltage jumps 10x for constant power P, wire heat I²R drops to...',
        options: [
          { id: 'a', textId: '1/100 kali semula', textEn: '1/100th of original heat', isCorrect: true },
          { id: 'b', textId: '1/10 kali semula', textEn: '1/10th of original heat', isCorrect: false },
          { id: 'c', textId: 'Tetap sama persis', textEn: 'Unchanged', isCorrect: false },
        ],
        explanationId: 'Arus turun 10x, sehingga I² turun 10² = 100 kali lipat!',
        explanationEn: 'Current drops 10x, shrinking I² heat by 100x.',
      },
    ],
  },
  {
    id: 'l5_wind_hydro_bess',
    level: 5,
    order: 3,
    titleId: 'Turbin Angin, Hidro & Gardu BESS',
    titleEn: 'Wind, Hydro & BESS Microgrids',
    summaryId: 'Padukan angin, aliran air terasering, dan BESS agar suplai Lab stabil 24 jam.',
    summaryEn: 'Combine wind, terraced water turbines, and BESS storage for non-stop clean energy.',
    analogyId: 'Kalau surya tidur malam hari, turbin angin dan air terus mengisi gardu BESS seperti tabungan cadangan kota!',
    analogyEn: 'When the sun sets, wind and hydro keep filling the BESS substation bank like an energy reservoir!',
    estimatedMinutes: 4,
    difficulty: 'intermediate',
    xpReward: 180,
    learningObjectivesId: [
      'Memanfaatkan sel air terasering Alam EBT untuk Turbin Hidro',
      'Memahami peran Gardu BESS sebagai penyangga energi hibrida',
    ],
    learningObjectivesEn: [
      'Place Hydro turbines on water terrain cells inside Outdoor EBT mode',
      'Balance intermittent renewables using BESS battery substations',
    ],
    theoryContentId: [
      'Di halaman Alam EBT, kuas "Ubah Tanah/Air" menciptakan sungai biru untuk memutar Turbin Mikro-Hidro 15V secara kontinyu.',
      'Saat sumber Surya, Angin, dan Hidro digabung ke SUTET + Gardu BESS, kapasitas suplai ke Panel Lab meningkat drastis.',
    ],
    theoryContentEn: [
      'Painting water cells in Outdoor mode powers continuous 15V Micro-Hydro generation.',
      'Stacking Solar, Wind, Hydro, and BESS delivers steady surplus power into your Lab station.',
    ],
    equations: [
      {
        formula: 'P_total = P_surya + P_angin + P_hidro',
        nameId: 'Sinergi Energi Hibrida',
        nameEn: 'Hybrid Clean Generation',
        explanationId: 'Semua pembangkit terhubung ke SUTET menyumbang arus paralel ke grid Lab.',
        explanationEn: 'Parallel outdoor generators sum cleanly onto the SUTET bus.',
      },
    ],
    interactiveDemoType: 'sutet_loss',
    starterPresetId: 'ultimate-power-grid',
    quiz: [
      {
        id: 'q1_hyb',
        questionId: 'Syarat agar Turbin Mikro-Hidro menghasilkan daya maksimal di Mode Alam EBT adalah...',
        questionEn: 'What does the Micro-Hydro turbine require in Outdoor mode?',
        options: [
          { id: 'a', textId: 'Ditempatkan pada petak Air sungai di kanvas alam', textEn: 'Placed on water terrain cells', isCorrect: true },
          { id: 'b', textId: 'Diletakkan di dalam ruang lab tertutup tanpa air', textEn: 'Indoors without water', isCorrect: false },
          { id: 'c', textId: 'Mematikan menara SUTET terlebih dahulu', textEn: 'Disconnecting SUTET towers', isCorrect: false },
        ],
        explanationId: 'Turbin Hidro butuh energi potensial aliran air pada petak Air.',
        explanationEn: 'Hydro turbines convert water flow on terrain water tiles.',
      },
      {
        id: 'q2_hyb',
        questionId: 'Apa keuntungan menyalurkan PLTS + Angin + Hidro ke satu gardu BESS & SUTET?',
        questionEn: 'Why combine Solar + Wind + Hydro through a BESS substation & SUTET?',
        options: [
          {
            id: 'a',
            textId: 'Pasokan ke Lab tetap stabil meski satu sumber cuaca menurun',
            textEn: 'Keeps Lab supply steady if wind or sunlight dips',
            isCorrect: true,
          },
          {
            id: 'b',
            textId: 'Membuat resistansi semua lampu meningkat 100x',
            textEn: 'Raises lamp resistance 100x',
            isCorrect: false,
          },
          {
            id: 'c',
            textId: 'Menghapus kebutuhan akan resistor di Lab',
            textEn: 'Eliminates resistors completely',
            isCorrect: false,
          },
        ],
        explanationId: 'Diversifikasi energi menjaga suplai listrik konstan tanpa pemadaman.',
        explanationEn: 'Multi-source hybridization ensures uninterrupted stability.',
      },
    ],
  },

  // ================= LEVEL 6: ARSITEK SOLVER MNA (500 XP) =================
  {
    id: 'l6_modified_nodal_analysis',
    level: 6,
    order: 1,
    titleId: 'X-Ray Matriks Solver MNA ([A]x = z)',
    titleEn: 'Inside the MNA Matrix Engine',
    summaryId: 'Intip otak matematika di balik simulasi Circuit Lab saat menghitung ribuan jaringan.',
    summaryEn: 'Peek inside the matrix algebra computing every node voltage and wire current.',
    analogyId: 'Solver MNA menyusun semua simpul KCL dan aturan KVL baterai ke satu papan persamaan matriks lalu memecahkannya sekaligus!',
    analogyEn: 'Modified Nodal Analysis packs every KCL node and KVL battery rule into one clean matrix equation!',
    estimatedMinutes: 5,
    difficulty: 'advanced',
    xpReward: 170,
    learningObjectivesId: [
      'Membaca blok matriks Konduktansi [G] dan Insidensi Sumber [B, C]',
      'Mengerti mengapa MNA mampu menghitung tegangan & arus sekaligus',
    ],
    learningObjectivesEn: [
      'Read Conductance [G] and Source Incidence [B, C] matrix stamps',
      'Understand how MNA solves node voltages and source currents simultaneously',
    ],
    theoryContentId: [
      'Setiap komponen resistor menaruh nilai konduktansi 1/R ke blok matriks [G] sesuai titik node tempat kakinya tersambung.',
      'Sumber tegangan 9V menambah satu variabel baru berupa arus cabang sumber (I_s) sehingga rangkaian kompleks pun terpecahkan presisi.',
    ],
    theoryContentEn: [
      'Resistors stamp conductance 1/R into block [G] based on their connected node IDs.',
      'Independent batteries append a branch current row (I_s) so voltages and currents solve together.',
    ],
    equations: [
      {
        formula: '[ G  B ; C  -R_int ] · [ V ; I_s ] = [ 0 ; E₀ ]',
        nameId: 'Sistem Matriks MNA',
        nameEn: 'MNA System Stamp',
        explanationId: 'Solusi vektor [V; I_s] menghasilkan voltase tiap titik & arus tiap sumber.',
        explanationEn: 'Solving yields every node potential V and source current I_s.',
      },
    ],
    interactiveDemoType: 'mna_matrix',
    starterPresetId: 'voltage-divider',
    quiz: [
      {
        id: 'q1_mna',
        questionId: 'Pada sistem MNA, besaran apa yang distempel oleh setiap resistor ke matriks [G]?',
        questionEn: 'What physical quantity does each resistor stamp into MNA block [G]?',
        options: [
          { id: 'a', textId: 'Konduktansi listrik G = 1 / R', textEn: 'Conductance G = 1 / R', isCorrect: true },
          { id: 'b', textId: 'Massa jenis tembaga (kg/m³)', textEn: 'Copper density', isCorrect: false },
          { id: 'c', textId: 'Suhu ruangan laboratorium', textEn: 'Ambient room temp', isCorrect: false },
        ],
        explanationId: 'Stempel nodal bekerja memakai konduktansi G = 1/R untuk membentuk persamaan arus KCL.',
        explanationEn: 'Nodal stamping sums branch conductances G = 1/R.',
      },
      {
        id: 'q2_mna',
        questionId: 'Mengapa MNA dipilih simulator modern (seperti SPICE & Circuit Lab) daripada aljabar seri-paralel manual?',
        questionEn: 'Why do modern simulators (like SPICE & Circuit Lab) run MNA instead of simple series/parallel reduction?',
        options: [
          {
            id: 'a',
            textId: 'Mampu menyelesaikan topologi bercabang kompleks, multi-baterai & loop bebas',
            textEn: 'Handles arbitrary bridges, multi-source loops & non-series meshes cleanly',
            isCorrect: true,
          },
          {
            id: 'b',
            textId: 'Supaya warna animasi terlihat lebih gelap',
            textEn: 'To darken wire animations',
            isCorrect: false,
          },
          {
            id: 'c',
            textId: 'Karena MNA hanya mendukung 1 lampu saja',
            textEn: 'Because MNA only supports one bulb',
            isCorrect: false,
          },
        ],
        explanationId: 'MNA bekerja seragam pada rangkaian jembatan, sensor, hingga mikrogrid multi-sumber.',
        explanationEn: 'MNA solves bridges, loops, and multi-source grids systematically.',
      },
    ],
  },
  {
    id: 'l6_internal_resistance',
    level: 6,
    order: 2,
    titleId: 'Trik -R_int Anti Matriks Singular',
    titleEn: 'Internal Resistance (-R_int) Stability',
    summaryId: 'Rahasia stabilitas numerik: bagaimana elemen -R_int mencegah crash pembagian nol.',
    summaryEn: 'How modeling physical battery resistance (-R_int) keeps matrix solvers crash-free.',
    analogyId: 'Tidak ada baterai ideal tanpa batas di dunia nyata! Adanya R_int membuat solver tetap waras walau siswa tidak sengaja korslet!',
    analogyEn: 'No real battery is magic infinity! Modeling R_int lets our solver survive even accidental short circuits!',
    estimatedMinutes: 4,
    difficulty: 'advanced',
    xpReward: 170,
    learningObjectivesId: [
      'Menghitung drop tegangan terminal baterai akibat R_int',
      'Memahami cara -R_int menjaga determinan matriks tetap non-singular',
    ],
    learningObjectivesEn: [
      'Calculate battery terminal voltage droop due to internal R_int',
      'See how -R_int prevents singular matrix crashes',
    ],
    theoryContentId: [
      'Jika baterai ideal (R_int = 0) dikorsletkan oleh kawat 0Ω, persamaan V = 9V dan V = 0V saling bertabrakan (matriks singular)!',
      'Menaruh nilai kecil (-R_int) di diagonal matriks MNA memodelkan sel kimia nyata sekaligus menjaga perhitungan selalu konvergen.',
    ],
    theoryContentEn: [
      'Shorting an ideal 0Ω battery yields conflicting equations (V = 9V and V = 0V), producing a singular matrix!',
      'Including real chemical internal resistance (-R_int) on the MNA diagonal keeps solving exact even under short-circuit.',
    ],
    equations: [
      {
        formula: 'V_term = E₀ - I_s · R_int',
        nameId: 'Persamaan Sel Nyata',
        nameEn: 'Physical Cell Model',
        explanationId: 'Makin besar beban arus (R_load kecil), makin terasa drop voltase di terminal.',
        explanationEn: 'Heavier draw pulls terminal voltage further below open-circuit E₀.',
      },
    ],
    interactiveDemoType: 'mna_matrix',
    starterPresetId: 'short-circuit-demo',
    quiz: [
      {
        id: 'q1_rint',
        questionId: 'Apa fungsi diagonal -R_int pada baris baterai matriks MNA?',
        questionEn: 'What does the -R_int diagonal stamp on a battery row do inside MNA?',
        options: [
          {
            id: 'a',
            textId: 'Mencegah matriks singular saat korslet & memodelkan drop tegangan nyata',
            textEn: 'Prevents singular crashes under shorts & models realistic voltage droop',
            isCorrect: true,
          },
          {
            id: 'b',
            textId: 'Menambah voltase baterai menjadi dua kali lipat gratis',
            textEn: 'Doubles free battery voltage',
            isCorrect: false,
          },
          {
            id: 'c',
            textId: 'Mematikan simulasi ketika ada resistor',
            textEn: 'Halts simulation on resistors',
            isCorrect: false,
          },
        ],
        explanationId: 'Diagonal -R_int mewakili hambatan kimiawi baterai agar sistem selalu bisa dipecahkan.',
        explanationEn: '-R_int captures battery internal chemistry and ensures solvability.',
      },
      {
        id: 'q2_rint',
        questionId: 'Baterai 9V punya R_int = 1Ω dan menarik arus 3A ke beban berat. Berapa voltase terminal V_term?',
        questionEn: 'A 9V battery (R_int = 1Ω) delivers 3A to a heavy load. Terminal voltage is...',
        options: [
          { id: 'a', textId: '6.0 Volt', textEn: '6.0 Volts', isCorrect: true },
          { id: 'b', textId: '12.0 Volt', textEn: '12.0 Volts', isCorrect: false },
          { id: 'c', textId: '9.0 Volt', textEn: '9.0 Volts', isCorrect: false },
        ],
        explanationId: 'V_term = 9V - (3A × 1Ω) = 6.0 Volt.',
        explanationEn: 'V_term = 9V - (3A × 1Ω) = 6.0 Volts.',
      },
    ],
  },
  {
    id: 'l6_smart_grid_mastery',
    level: 6,
    order: 3,
    titleId: 'Arsitek Smart Grid Alam ↔ Lab',
    titleEn: 'Smart Grid Architect: Outdoor ↔ Lab',
    summaryId: 'Integrasikan seluruh ilmu: Alam EBT bersih, SUTET minim rugi, dan pengisian aman di Lab!',
    summaryEn: 'Unite clean Outdoor generation, efficient SUTET export, and protected Lab battery charging!',
    analogyId: 'Kamu sekarang memegang kendali penuh rantai energi kota masa depan: panen di bukit hijau, ekspor lewat SUTET, cas aman di ruang Lab!',
    analogyEn: 'You now command a complete clean-energy loop: harvest outside, export via SUTET, and recharge safely inside the Lab!',
    estimatedMinutes: 5,
    difficulty: 'advanced',
    xpReward: 160,
    learningObjectivesId: [
      'Menyeimbangkan produksi EBT outdoor dengan kapasitas beban Lab',
      'Memastikan sistem proteksi & efisiensi kabel optimal',
    ],
    learningObjectivesEn: [
      'Balance outdoor clean energy generation against Lab charging demand',
      'Audit line safety, polarity, and efficiency across the dual-world grid',
    ],
    theoryContentId: [
      'Circuit Lab memisahkan ruang fisika Mode Alam (iklim matahari, angin, topografi air) dari bangku uji presisi Mode Lab melalui kopel SUTET virtual.',
      'Dengan menamatkan modul ini, kamu siap merancang jaringan mikrogrid hemat rugi daya dari hulu pembangkit hingga hilir baterai!',
    ],
    theoryContentEn: [
      'Circuit Lab isolates weather physics outdoors while coupling net grid capacity straight to your Lab bench.',
      'Completing Level 6 unlocks Senior Engineer mastery over real-world microgrid topologies.',
    ],
    equations: [
      {
        formula: 'η = P_cas_lab / P_ebt_alam × 100%',
        nameId: 'Efisiensi Total Mikrogrid',
        nameEn: 'End-to-End Grid Efficiency',
        explanationId: 'Smart Grid yang andal menjaga efisiensi pengiriman jauh tetap di atas 90%.',
        explanationEn: 'Well-engineered SUTET grids maintain > 90% end-to-end delivery efficiency.',
      },
    ],
    interactiveDemoType: 'mna_matrix',
    starterPresetId: 'ultimate-power-grid',
    quiz: [
      {
        id: 'q1_smart',
        questionId: 'Dalam arsitektur dual-dunia Circuit Lab, komponen apa yang menjadi jembatan ekspor energi Alam ke Lab?',
        questionEn: 'What links outdoor renewable plants cleanly to the indoor Lab charger?',
        options: [
          {
            id: 'a',
            textId: 'Menara Transmisi SUTET ↔ Panel Distribusi Lab',
            textEn: 'SUTET Transmission Tower ↔ Lab Distribution Panel',
            isCorrect: true,
          },
          {
            id: 'b',
            textId: 'Voltmeter seri tanpa kabel ground',
            textEn: 'A series Voltmeter without ground',
            isCorrect: false,
          },
          {
            id: 'c',
            textId: 'Kabel korsleting langsung antar kutub',
            textEn: 'A direct shorting bypass wire',
            isCorrect: false,
          },
        ],
        explanationId: 'Menara SUTET menyalurkan daya hijau dari Alam ke Panel Distribusi Lab untuk mengecas baterai.',
        explanationEn: 'SUTET towers export outdoor renewable capacity to the Lab Distribution Panel.',
      },
      {
        id: 'q2_smart',
        questionId: 'Jika beban Lab lebih besar dari pasokan surya saat mendung, komponen apa yang mencegah voltase anjlok?',
        questionEn: 'If Lab load exceeds solar generation during heavy clouds, what prevents brownouts?',
        options: [
          {
            id: 'a',
            textId: 'Cadangan energi Gardu BESS & sumber hibrida (Angin/Hidro)',
            textEn: 'BESS battery reserve & hybrid Wind/Hydro turbines',
            isCorrect: true,
          },
          {
            id: 'b',
            textId: 'Memasang kabel 0.5mm² lebih panjang',
            textEn: 'Using longer thin 0.5mm² cables',
            isCorrect: false,
          },
          {
            id: 'c',
            textId: 'Membalik polaritas semua LED',
            textEn: 'Reversing LED polarities',
            isCorrect: false,
          },
        ],
        explanationId: 'BESS dan pembangkit hibrida menstabilkan grid saat matahari redup.',
        explanationEn: 'BESS substations and multi-source generation cushion cloud dips.',
      },
    ],
  },
];

/**
 * Retrieve ordered lessons belonging to a given curriculum level.
 * Time Complexity: O(N log N) where N = total lessons (N = 14).
 */
export function getLessonsByLevel(level: number): AcademyLesson[] {
  return ACADEMY_LESSONS.filter((lesson) => lesson.level === level).sort(
    (a, b) => a.order - b.order
  );
}

/**
 * Lookup a specific Academy lesson by identifier.
 * Time Complexity: O(N) scan over 14-item static catalog.
 */
export function getLessonById(lessonId: string): AcademyLesson | undefined {
  return ACADEMY_LESSONS.find((lesson) => lesson.id === lessonId);
}
