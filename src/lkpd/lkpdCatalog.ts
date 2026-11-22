import { LkpdMissionId, LkpdPacketDefinition } from './lkpdTypes';

/**
 * Strictly 5 Kurikulum Merdeka (Fase D, IPA Kelas IX) LKPD packets mapped 1-to-1
 * to the 5 existing validated missions in MISSION_CATALOG.
 */
export const LKPD_CATALOG: ReadonlyArray<LkpdPacketDefinition> = [
  {
    lkpdCode: 'LKPD-01',
    missionId: 'parallel-3-bulbs',
    order: 1,
    fase: 'Fase D',
    gradeLabelId: 'IPA Kelas IX SMP/MTs',
    gradeLabelEn: 'Grade 9 Science (SMP/MTs)',
    shortLabelId: 'Paralel 3 Lampu',
    shortLabelEn: '3-Lamp Parallel',
    topicId: 'Rangkaian Paralel & Hukum I Kirchhoff pada Penerangan Rumah',
    topicEn: "Parallel Circuits & Kirchhoff's Current Law in Home Lighting",
    capaianPembelajaranId:
      'Peserta didik menganalisis sifat rangkaian listrik paralel serta pembagian arus pada titik percabangan dalam instalasi penerangan rumah tangga.',
    capaianPembelajaranEn:
      'Students analyze parallel circuit voltage equality and junction current division in household lighting installations.',
    tujuanPembelajaranId: [
      'Merangkai minimal 3 lampu secara paralel murni dari sumber tegangan DC.',
      'Membuktikan tegangan ujung setiap cabang paralel bernilai seimbang (selisih <= 0,25 V).',
      'Menjelaskan alasan instalasi rumah tangga memakai rangkaian paralel, bukan seri.',
    ],
    tujuanPembelajaranEn: [
      'Wire at least 3 lamps in pure parallel from a DC battery source.',
      'Verify balanced terminal voltage across all parallel branches (delta <= 0.25 V).',
      'Explain why household lighting uses parallel wiring instead of series.',
    ],
    p5DimensionsId: ['Bernalar Kritis', 'Mandiri'],
    p5DimensionsEn: ['Critical Reasoning', 'Independent'],
    formulaHighlight: 'V_total = V1 = V2 = V3  |  I_total = I1 + I2 + I3',
    estimatedMinutes: 15,
    kkmScore: 75,
    rubric: [
      {
        objectiveId: 'obj_source',
        weight: 25,
        labelId: 'Sumber tegangan baterai terpasang aktif',
        labelEn: 'Active battery power source installed',
      },
      {
        objectiveId: 'obj_bulbs_count',
        weight: 25,
        labelId: 'Minimal 3 fiting dengan bohlam terpasang',
        labelEn: 'At least 3 lamp sockets with bulbs installed',
      },
      {
        objectiveId: 'obj_all_bulbs_lit',
        weight: 25,
        labelId: 'Ketiga lampu menyala bersamaan (I > 5 mA)',
        labelEn: 'All 3 lamps glowing simultaneously (I > 5 mA)',
      },
      {
        objectiveId: 'obj_parallel_voltage',
        weight: 25,
        labelId: 'Tegangan ketiga lampu seimbang (paralel murni)',
        labelEn: 'Balanced voltage across all 3 lamps (pure parallel)',
      },
    ],
    reflectionPrompts: [
      {
        id: 'ref_1',
        questionId: 'Apa yang terjadi pada dua lampu lain jika satu lampu pada rangkaian paralel dilepas? Jelaskan alasannya.',
        questionEn: 'What happens to the other two lamps if one bulb in a parallel circuit is removed? Explain why.',
        placeholderId: 'Tulis jawaban singkat berdasarkan hasil pengamatan kanvas...',
        placeholderEn: 'Write a concise answer based on your canvas observation...',
      },
      {
        id: 'ref_2',
        questionId: 'Catat tegangan pada tiap lampu dari inspektor. Mengapa nilainya hampir sama dengan tegangan sumber?',
        questionEn: 'Record each lamp voltage from the inspector. Why does it match the source voltage?',
        placeholderId: 'Contoh: V1 = 3.0 V, V2 = 3.0 V, V3 = 3.0 V karena...',
        placeholderEn: 'Example: V1 = 3.0 V, V2 = 3.0 V, V3 = 3.0 V because...',
      },
    ],
  },
  {
    lkpdCode: 'LKPD-02',
    missionId: 'resolve-short-circuit',
    order: 2,
    fase: 'Fase D',
    gradeLabelId: 'IPA Kelas IX SMP/MTs',
    gradeLabelEn: 'Grade 9 Science (SMP/MTs)',
    shortLabelId: 'Korsleting MCB',
    shortLabelEn: 'Short & MCB',
    topicId: 'Keselamatan Kelistrikan, Korsleting & Proteksi MCB',
    topicEn: 'Electrical Safety, Short-Circuit Faults & MCB Protection',
    capaianPembelajaranId:
      'Peserta didik mengidentifikasi penyebab hubungan pendek (korsleting), risiko panas berlebih, dan peran pemutus arus (MCB) untuk keselamatan listrik.',
    capaianPembelajaranEn:
      'Students identify short-circuit causes, thermal fire risks, and the role of circuit breakers (MCB) in electrical safety.',
    tujuanPembelajaranId: [
      'Menemukan jalur pintas tanpa hambatan (bypass) yang menyebabkan lonjakan arus.',
      'Memutus jalur korsleting tanpa memutus jalur beban utama.',
      'Memulihkan nyala lampu laboratorium pada arus kerja yang aman.',
    ],
    tujuanPembelajaranEn: [
      'Locate the zero-resistance bypass path causing an extreme current surge.',
      'Sever the short-circuit wire without disconnecting the main lamp branch.',
      'Restore normal laboratory lamp illumination at safe operating current.',
    ],
    p5DimensionsId: ['Bernalar Kritis', 'Kreatif'],
    p5DimensionsEn: ['Critical Reasoning', 'Creative'],
    formulaHighlight: 'I = V / R  (R -> 0 menyebabkan lonjakan I dan panas P = I^2 * R)',
    estimatedMinutes: 12,
    kkmScore: 75,
    rubric: [
      {
        objectiveId: 'obj_no_short',
        weight: 50,
        labelId: 'Rangkaian bebas dari hubungan pendek (korsleting)',
        labelEn: 'Circuit cleared of short-circuit fault',
      },
      {
        objectiveId: 'obj_load_powered',
        weight: 50,
        labelId: 'Lampu beban menyala dengan arus kerja normal',
        labelEn: 'Load lamp powered at normal operating current',
      },
    ],
    reflectionPrompts: [
      {
        id: 'ref_1',
        questionId: 'Mengapa lampu padam saat terjadi kabel bypass yang menghubungkan kutub positif dan negatif baterai langsung?',
        questionEn: 'Why did the lamp turn off when a bypass wire shorted the battery terminals directly?',
        placeholderId: 'Jelaskan hubungannya dengan hambatan jalur pintas...',
        placeholderEn: 'Explain in terms of bypass resistance and current path...',
      },
      {
        id: 'ref_2',
        questionId: 'Apa fungsi utama MCB pada panel listrik rumah atau laboratorium sekolah saat terjadi korsleting?',
        questionEn: 'What is the main function of an MCB breaker in a home or school lab panel during a short circuit?',
        placeholderId: 'Tulis peran pengaman MCB terhadap risiko kebakaran kabel...',
        placeholderEn: 'Describe how the MCB prevents wire overheating and fire...',
      },
    ],
  },
  {
    lkpdCode: 'LKPD-03',
    missionId: 'repair-reversed-led',
    order: 3,
    fase: 'Fase D',
    gradeLabelId: 'IPA Kelas IX SMP/MTs',
    gradeLabelEn: 'Grade 9 Science (SMP/MTs)',
    shortLabelId: 'Polaritas LED',
    shortLabelEn: 'LED Polarity',
    topicId: 'Polaritas Dioda LED & Sifat Semikonduktor Satu Arah',
    topicEn: 'LED Diode Polarity & Unidirectional Semiconductor Behavior',
    capaianPembelajaranId:
      'Peserta didik membedakan perilaku komponen semikonduktor (LED) terhadap arah arus listrik dan memperbaiki kesalahan pemasangan polaritas.',
    capaianPembelajaranEn:
      'Students distinguish unidirectional semiconductor behavior in LEDs and repair reversed-polarity wiring faults.',
    tujuanPembelajaranId: [
      'Mengidentifikasi kondisi panjar mundur (reverse biased) pada lampu LED.',
      'Menghubungkan kaki Anoda (+) LED ke potensial positif dan Katoda (-) ke negatif.',
      'Membuktikan LED hanya mengalirkan arus pada kondisi panjar maju (forward biased).',
    ],
    tujuanPembelajaranEn: [
      'Identify a reverse-biased LED fault condition.',
      'Connect the LED Anode (+) to higher potential and Cathode (-) to negative.',
      'Verify that LEDs conduct current only under forward bias.',
    ],
    p5DimensionsId: ['Bernalar Kritis', 'Mandiri'],
    p5DimensionsEn: ['Critical Reasoning', 'Independent'],
    formulaHighlight: 'Forward Bias: V_anoda > V_katoda  |  Reverse Bias: I = 0 A',
    estimatedMinutes: 15,
    kkmScore: 75,
    rubric: [
      {
        objectiveId: 'obj_no_reverse',
        weight: 50,
        labelId: 'Tidak ada LED dalam kondisi polaritas terbalik',
        labelEn: 'No LED remains in reverse-biased polarity',
      },
      {
        objectiveId: 'obj_led_glowing',
        weight: 50,
        labelId: 'Lampu LED menyala terang pada panjar maju',
        labelEn: 'LED illuminates brightly under forward bias',
      },
    ],
    reflectionPrompts: [
      {
        id: 'ref_1',
        questionId: 'Apa perbedaan bohlam pijar biasa dengan lampu LED jika posisi kutub positif dan negatif baterai dibalik?',
        questionEn: 'How does an LED differ from a standard incandescent bulb when battery polarity is reversed?',
        placeholderId: 'Bandingkan sifat filamen resistor dengan dioda semikonduktor...',
        placeholderEn: 'Compare resistive filament behavior with a semiconductor diode...',
      },
      {
        id: 'ref_2',
        questionId: 'Kaki manakah pada LED yang wajib terhubung ke kutub positif sumber daya agar cahaya menyala?',
        questionEn: 'Which LED terminal must connect to the positive supply rail for the diode to emit light?',
        placeholderId: 'Sebutkan nama kutub dan alasannya...',
        placeholderEn: 'Name the terminal and explain briefly...',
      },
    ],
  },
  {
    lkpdCode: 'LKPD-04',
    missionId: 'solar-grid-connection',
    order: 4,
    fase: 'Fase D',
    gradeLabelId: 'IPA Kelas IX SMP/MTs',
    gradeLabelEn: 'Grade 9 Science (SMP/MTs)',
    shortLabelId: 'PLTS Microgrid',
    shortLabelEn: 'Solar PV Grid',
    topicId: 'Energi Terbarukan: Integrasi PLTS Surya & Distribusi MCB',
    topicEn: 'Renewable Energy: Solar PV Microgrid & MCB Distribution',
    capaianPembelajaranId:
      'Peserta didik merancang penyaluran energi listrik dari pembangkit energi terbarukan (PLTS) menuju beban melalui panel distribusi terproteksi.',
    capaianPembelajaranEn:
      'Students design renewable solar photovoltaic power delivery to loads through a protected distribution panel.',
    tujuanPembelajaranId: [
      'Menghubungkan modul Panel Surya (PLTS) ke panel distribusi MCB.',
      'Memastikan proteksi MCB berada pada status aktif (ON) tanpa trip.',
      'Mengukur penyaluran arus daya surya menuju lampu beban (> 10 mA).',
    ],
    tujuanPembelajaranEn: [
      'Wire a Solar PV panel to a distribution MCB panel.',
      'Verify MCB protection remains active (ON) without tripping.',
      'Measure steady solar current delivery to the load (> 10 mA).',
    ],
    p5DimensionsId: ['Bernalar Kritis', 'Beriman & Berakhlak Mulia (Peduli Lingkungan)'],
    p5DimensionsEn: ['Critical Reasoning', 'Environmental Stewardship'],
    formulaHighlight: 'P_surya = V_pv x I_pv  (Energi Matahari -> Energi Listrik DC)',
    estimatedMinutes: 18,
    kkmScore: 75,
    rubric: [
      {
        objectiveId: 'obj_solar_present',
        weight: 30,
        labelId: 'Panel Surya terpasang aktif menerima radiasi matahari',
        labelEn: 'Solar panel installed and receiving sunlight irradiance',
      },
      {
        objectiveId: 'obj_mcb_active',
        weight: 30,
        labelId: 'Panel Distribusi / MCB dalam posisi ON (tidak trip)',
        labelEn: 'Distribution panel MCB is ON and not tripped',
      },
      {
        objectiveId: 'obj_solar_power_flowing',
        weight: 40,
        labelId: 'Arus listrik dari panel surya mengalir ke beban (I > 10 mA)',
        labelEn: 'Solar current flows to load (I > 10 mA)',
      },
    ],
    reflectionPrompts: [
      {
        id: 'ref_1',
        questionId: 'Bagaimana perubahan intensitas cahaya matahari (siang vs mendung) memengaruhi kuat arus dan daya yang dihasilkan PLTS?',
        questionEn: 'How does changing sunlight intensity (sunny vs cloudy) affect solar current and power output?',
        placeholderId: 'Tulis hubungan intensitas cahaya dengan arus/daya PLTS...',
        placeholderEn: 'Describe how irradiance changes PV current and wattage...',
      },
      {
        id: 'ref_2',
        questionId: 'Mengapa sistem PLTS sekolah memerlukan baterai penyimpanan (BESS) atau panel distribusi MCB?',
        questionEn: 'Why does a school solar microgrid need battery storage (BESS) or an MCB distribution panel?',
        placeholderId: 'Jelaskan fungsi keamanan atau ketersediaan daya saat malam...',
        placeholderEn: 'Explain protection or energy continuity when sunlight drops...',
      },
    ],
  },
  {
    lkpdCode: 'LKPD-05',
    missionId: 'energy-efficiency-challenge',
    order: 5,
    fase: 'Fase D',
    gradeLabelId: 'IPA Kelas IX SMP/MTs',
    gradeLabelEn: 'Grade 9 Science (SMP/MTs)',
    shortLabelId: 'Audit <= 5W',
    shortLabelEn: 'Audit <= 5W',
    topicId: 'Audit Daya Listrik (P = V x I) & Penghematan Tagihan PLN',
    topicEn: 'Electrical Power Audit (P = V x I) & Electricity Bill Conservation',
    capaianPembelajaranId:
      'Peserta didik menghitung daya dan energi listrik serta menerapkan pemilihan lampu hemat energi untuk menekan konsumsi daya di bawah batas 5,0 Watt.',
    capaianPembelajaranEn:
      'Students calculate electric power and energy and select efficient lighting technology to keep total load power at or below 5.0 Watts.',
    tujuanPembelajaranId: [
      'Menyalakan minimal 2 titik lampu secara bersamaan dalam satu rangkaian.',
      'Memilih teknologi lampu hemat energi (LED atau CFL) menggantikan bohlam pijar.',
      'Membuktikan total konsumsi daya rangkaian berada di bawah 5,0 W.',
    ],
    tujuanPembelajaranEn: [
      'Illuminate at least 2 light fixtures simultaneously in one circuit.',
      'Select efficient LED or CFL lamps instead of incandescent bulbs.',
      'Verify total circuit power consumption stays at or below 5.0 W.',
    ],
    p5DimensionsId: ['Bernalar Kritis', 'Kreatif'],
    p5DimensionsEn: ['Critical Reasoning', 'Creative'],
    formulaHighlight: 'P = V x I  |  W = P x t (kWh)  |  Target: P_total <= 5,0 W',
    estimatedMinutes: 18,
    kkmScore: 75,
    rubric: [
      {
        objectiveId: 'obj_two_fixtures',
        weight: 30,
        labelId: 'Minimal 2 titik lampu menyala bersamaan (I > 5 mA)',
        labelEn: 'At least 2 light fixtures glowing simultaneously (I > 5 mA)',
      },
      {
        objectiveId: 'obj_led_technology',
        weight: 35,
        labelId: 'Seluruh lampu menggunakan teknologi hemat energi (LED/CFL)',
        labelEn: 'All active lamps use high-efficiency LED or CFL bulbs',
      },
      {
        objectiveId: 'obj_power_cap',
        weight: 35,
        labelId: 'Total daya rangkaian <= 5,0 Watt',
        labelEn: 'Total circuit power draw <= 5.0 Watts',
      },
    ],
    reflectionPrompts: [
      {
        id: 'ref_1',
        questionId: 'Catat total daya (Watt) rangkaian LED kamu dan bandingkan dengan jika memakai 2 lampu pijar. Mana yang lebih hemat energi?',
        questionEn: 'Record your LED circuit total wattage and compare it to 2 incandescent bulbs. Which saves more energy?',
        placeholderId: 'Contoh: 2 lampu LED = 0,6 W, sedangkan lampu pijar...',
        placeholderEn: 'Example: 2 LED lamps = 0.6 W, whereas incandescent...',
      },
      {
        id: 'ref_2',
        questionId: 'Jika rangkaian hemat energi tersebut dinyalakan 8 jam setiap hari selama 30 hari, bagaimana dampaknya terhadap tagihan listrik rumah?',
        questionEn: 'If your efficient circuit runs 8 hours daily for 30 days, how does it affect the monthly electricity bill?',
        placeholderId: 'Hubungkan dengan rumus W = P x t dan biaya per kWh...',
        placeholderEn: 'Relate to W = P x t and monthly kWh cost...',
      },
    ],
  },
];

export function getLkpdPacketByMissionId(missionId: string): LkpdPacketDefinition | undefined {
  return LKPD_CATALOG.find((packet) => packet.missionId === missionId);
}

export function isLkpdMissionId(value: string): value is LkpdMissionId {
  return LKPD_CATALOG.some((packet) => packet.missionId === value);
}
