/**
 * Mission & Challenge Mode Catalog.
 * Defines 5 core interactive challenges aligned with SMP Grade 9 Science & DC electrical theory.
 * Each mission evaluates real circuit topology, net potentials, and MNA simulation outputs.
 *
 * Time Complexity: O(N + E) for graph inspection and simulation checks.
 */

import { MissionContext, MissionDefinition, MissionValidationResult } from '../types/missions';

export const MISSION_CATALOG: MissionDefinition[] = [
  // ================= MISSION 1: 3 BULBS IN PARALLEL =================
  {
    id: 'parallel-3-bulbs',
    titleId: 'Instalasi Penerangan Rumah Cerdas 3 Ruangan',
    titleEn: 'Smart Home 3-Room Parallel Lighting',
    difficulty: 'beginner',
    category: 'series_parallel',
    estimatedMinutes: 5,
    descriptionId:
      'Sebagai teknisi cilik SMPN 12 Surabaya, rancang instalasi penerangan 3 ruangan (Ruang Tamu, Kamar, Dapur) dari sumber baterai. Terapkan prinsip rangkaian paralel murni agar tiap ruangan memiliki terang cahaya maksimal dan tegangan terminal identik tanpa saling melemahkan!',
    descriptionEn:
      'As a junior technician at SMPN 12 Surabaya, design a 3-room home lighting system (Living Room, Bedroom, Kitchen) powered by a DC source. Implement pure parallel branching so every room receives identical full voltage without dimming!',
    learningObjectivesId: [
      'Membuktikan karakteristik tegangan cabang paralel bernilai identik (V = V₁ = V₂ = V₃)',
      'Mengamati pembagian kuat arus listrik pada titik percabangan (Hukum I Kirchhoff: ΣI_masuk = ΣI_keluar)',
      'Memahami alasan instalasi kelistrikan rumah tangga wajib menggunakan rangkaian paralel (jika 1 lampu dilepas, lampu lain tetap menyala)',
    ],
    learningObjectivesEn: [
      'Verify identical terminal voltage across parallel branches (V = V₁ = V₂ = V₃)',
      "Observe current division at junctions (Kirchhoff's Current Law: ΣI_in = ΣI_out)",
      'Understand why domestic building installations require parallel circuits (independent load control)',
    ],
    instructionsId: [
      '1. Pasang sumber daya Baterai (Baterai AA 1.5V, Wadah 2x AA 3V, atau Baterai Kotak 9V).',
      '2. Tempatkan 3 Fiting Lampu di kanvas dan pasang bohlam ke dalam masing-masing fiting.',
      '3. Hubungkan kutub positif baterai ke pin pertama dari ketiga fiting (gunakan Waypoint untuk percabangan kabel yang rapi).',
      '4. Hubungkan kutub negatif baterai ke pin kedua dari ketiga fiting.',
      '5. Amati: ketiga lampu harus menyala terang secara simultan dengan tegangan yang seimbang (ΔV ≤ 0.25V).',
    ],
    instructionsEn: [
      '1. Place a Battery power source (1.5V AA, 2x AA Holder 3V, or 9V Battery).',
      '2. Place 3 Lamp Sockets on the canvas and insert bulbs into each.',
      '3. Wire the battery positive terminal to pin 1 of all 3 sockets (use Waypoints for neat orthogonal branching).',
      '4. Wire the battery negative terminal to pin 2 of all 3 sockets.',
      '5. Verify: all 3 lamps must illuminate simultaneously with balanced terminal voltages (ΔV ≤ 0.25V).',
    ],
    hintsId: [
      'Rangkaian paralel membagi arus, bukan membagi tegangan. Jika lampu tampak redup atau tegangannya terbagi, periksa apakah kabel tidak sengaja terpasang secara seri.',
      'Manfaatkan fitur Waypoint (Sudut Kabel) untuk membuat percabangan instalasi rapi seperti diagram instalasi listrik rumah profesional.',
    ],
    hintsEn: [
      'Parallel circuits divide current, not voltage. If lamps appear dim or voltages drop, check that wires are not accidentally daisy-chained in series.',
      'Utilize Waypoint nodes to route orthogonal wire branches cleanly like professional architectural wiring plans.',
    ],
    objectives: [
      {
        id: 'obj_source',
        descriptionId: 'Terdapat minimal 1 sumber daya baterai aktif',
        descriptionEn: 'At least 1 active battery source is connected',
      },
      {
        id: 'obj_bulbs_count',
        descriptionId: 'Terdapat minimal 3 fiting lampu dengan bohlam terpasang',
        descriptionEn: 'At least 3 lamp sockets with inserted bulbs',
      },
      {
        id: 'obj_all_bulbs_lit',
        descriptionId: 'Ketiga lampu menyala terang secara bersamaan (arus > 5mA)',
        descriptionEn: 'All 3 bulbs glowing simultaneously (current > 5mA)',
      },
      {
        id: 'obj_parallel_voltage',
        descriptionId: 'Tegangan ketiga lampu seimbang dan identik (prinsip paralel)',
        descriptionEn: 'Terminal voltage across all 3 bulbs is balanced and equal',
      },
    ],
    validate: (context: MissionContext): MissionValidationResult => {
      const { nodes, simulation } = context;

      if (simulation.isShortCircuit) {
        return {
          isCompleted: false,
          progressPercent: 20,
          objectiveResults: [
            { objectiveId: 'obj_source', isSatisfied: true, feedbackText: 'Sumber terpasang.' },
            { objectiveId: 'obj_bulbs_count', isSatisfied: false, feedbackText: 'Rangkaian mengalami korsleting!' },
            { objectiveId: 'obj_all_bulbs_lit', isSatisfied: false, feedbackText: 'Arus terputus akibat korsleting.' },
            { objectiveId: 'obj_parallel_voltage', isSatisfied: false, feedbackText: 'Tegangan drop nol.' },
          ],
          feedbackMessage: 'Rangkaian mengalami hubungan pendek (korslet). Periksa kembali jalur kabel Anda!',
        };
      }

      // 1. Check sources
      const sources = nodes.filter(
        (n) =>
          n.data.type === 'battery' ||
          n.data.type === 'battery9v' ||
          (n.data.type === 'battery-holder' && n.data.hasBattery)
      );
      const isSourcePresent = sources.length >= 1;

      // 2. Check sockets with bulbs
      const bulbSockets = nodes.filter(
        (n) =>
          (n.data.type === 'socket' || n.data.type === 'pin-socket') &&
          n.data.installedBulb
      );
      const hasThreeBulbs = bulbSockets.length >= 3;

      // 3. Check currents
      const activeBulbs = bulbSockets.filter((socket) => {
        const current = Math.abs(simulation.branchCurrents[socket.id] ?? 0);
        return current > 0.005;
      });
      const areAllActive = activeBulbs.length >= 3;

      // 4. Check voltage equality (parallel condition: delta V between bulbs is minimal)
      let areVoltagesEqual = false;
      if (activeBulbs.length >= 3) {
        const voltages = activeBulbs.map(
          (b) => Math.abs(b.data.calculatedVoltage ?? 0)
        );
        const maxV = Math.max(...voltages);
        const minV = Math.min(...voltages);
        areVoltagesEqual = maxV > 0.5 && maxV - minV <= 0.25;
      }

      const satisfiedCount =
        (isSourcePresent ? 1 : 0) +
        (hasThreeBulbs ? 1 : 0) +
        (areAllActive ? 1 : 0) +
        (areVoltagesEqual ? 1 : 0);

      const isCompleted = satisfiedCount === 4;

      return {
        isCompleted,
        progressPercent: Math.round((satisfiedCount / 4) * 100),
        objectiveResults: [
          {
            objectiveId: 'obj_source',
            isSatisfied: isSourcePresent,
            feedbackText: isSourcePresent
              ? 'Sumber baterai aktif terdeteksi.'
              : 'Belum ada sumber baterai yang terpasang.',
          },
          {
            objectiveId: 'obj_bulbs_count',
            isSatisfied: hasThreeBulbs,
            feedbackText: hasThreeBulbs
              ? `${bulbSockets.length} fiting lampu dengan bohlam terdeteksi.`
              : `Baru ${bulbSockets.length} dari 3 fiting lampu terpasang.`,
          },
          {
            objectiveId: 'obj_all_bulbs_lit',
            isSatisfied: areAllActive,
            feedbackText: areAllActive
              ? 'Ketiga lampu dialiri arus listrik.'
              : `Baru ${activeBulbs.length} lampu yang teraliri arus listrik.`,
          },
          {
            objectiveId: 'obj_parallel_voltage',
            isSatisfied: areVoltagesEqual,
            feedbackText: areVoltagesEqual
              ? 'Tegangan antar lampu terbukti seimbang (Paralel Murni).'
              : 'Tegangan antar lampu belum sama (mungkin masih terhubung seri).',
          },
        ],
        feedbackMessage: isCompleted
          ? 'Luar biasa! Ketiga lampu berhasil dirangkai secara paralel murni!'
          : 'Lanjutkan merangkai percabangan kabel agar ketiga lampu menyala paralel.',
      };
    },
  },

  // ================= MISSION 2: RESOLVE SHORT CIRCUIT =================
  {
    id: 'resolve-short-circuit',
    titleId: 'Operasi Penyelamatan Korsleting & Proteksi MCB Lab',
    titleEn: 'Lab Short-Circuit Rescue & MCB Safety',
    difficulty: 'beginner',
    category: 'safety',
    estimatedMinutes: 4,
    descriptionId:
      'Alarm darurat berbunyi di Laboratorium Fisika! Terjadi lonjakan arus ekstrem akibat kawat bypass tanpa beban yang menghubungkan langsung kutub positif dan negatif. Mini Circuit Breaker (MCB) Panel Distribusi otomatis TRIP (anjlok) memutus daya darurat demi mencegah bahaya kebakaran kabel. Temukan kabel korslet tersebut, potong jalurnya, dan amankan instalasi!',
    descriptionEn:
      'Emergency alarm triggered in the Physics Lab! An extreme current surge occurred due to a zero-resistance bypass wire connecting positive and negative terminals directly. The MCB breaker tripped. Detect and cut the faulty bypass wire to restore safe laboratory illumination!',
    learningObjectivesId: [
      'Mengenali bahaya korsleting (short circuit) dan lonjakan arus tak terhingga (I = V / R → ∞)',
      'Mempelajari fungsi pengaman Mini Circuit Breaker (MCB) dan saklar proteksi beban',
      'Mendiagnosis titik gangguan kelistrikan pada kawat telanjang dan memulihkan rangkaian',
    ],
    learningObjectivesEn: [
      'Recognize extreme short-circuit hazards and explosive surge currents (I = V / R → ∞)',
      'Understand Mini Circuit Breaker (MCB) trip protection dynamics in distribution panels',
      'Diagnose wiring bypass faults and restore electrical circuit safety',
    ],
    instructionsId: [
      '1. Klik tombol "Muat Starter Kanvas" untuk membuka sirkuit laboratorium yang sedang mengalami korsleting.',
      '2. Amati kabel bypass yang berdenyut warna merah neon (indikasi hubungan pendek tanpa beban).',
      '3. Ketuk kabel korslet tersebut, lalu klik tombol "Putus Kabel" (ikon Gunting) untuk melenyapkan gangguan.',
      '4. Pastikan lampu penerangan laboratorium kembali menyala terang dengan arus operasional normal.',
    ],
    instructionsEn: [
      '1. Click "Load Starter Circuit" to load the short-circuited laboratory setup.',
      '2. Identify the neon-red pulsating bypass conductor connecting terminals directly.',
      '3. Tap the fault wire and click "Cut Wire" (Scissors icon) to sever the bypass fault.',
      '4. Verify the laboratory load lamp illuminates safely with normal operating current.',
    ],
    hintsId: [
      'Arus listrik selalu memilih jalur dengan hambatan terkecil (jalur pintas tanpa fiting lampu). Hilangkan kabel yang menyambungkan kutub baterai secara langsung.',
    ],
    hintsEn: [
      'Electric current strictly follows the path of minimal resistance (zero-ohm bypass). Cut the wire connecting power terminals directly without passing through a lamp socket.',
    ],
    starterCircuitName: 'short-circuit-demo',
    objectives: [
      {
        id: 'obj_no_short',
        descriptionId: 'Sistem bebas dari hubungan pendek / korsleting',
        descriptionEn: 'System is free from short-circuit faults',
      },
      {
        id: 'obj_load_powered',
        descriptionId: 'Lampu beban menerima arus listrik normal dan menyala terang',
        descriptionEn: 'Load bulb receives normal operational current and illuminates',
      },
    ],
    validate: (context: MissionContext): MissionValidationResult => {
      const { nodes, simulation } = context;

      const isNoShort = !simulation.isShortCircuit;

      const litBulbs = nodes.filter((n) => {
        if (n.data.type !== 'socket' && n.data.type !== 'pin-socket') return false;
        const current = Math.abs(simulation.branchCurrents[n.id] ?? 0);
        return current > 0.005;
      });

      const isLoadPowered = litBulbs.length >= 1;
      const isCompleted = isNoShort && isLoadPowered;

      return {
        isCompleted,
        progressPercent: (isNoShort ? 50 : 0) + (isLoadPowered ? 50 : 0),
        objectiveResults: [
          {
            objectiveId: 'obj_no_short',
            isSatisfied: isNoShort,
            feedbackText: isNoShort
              ? 'Tidak ada korsleting terdeteksi.'
              : 'Sistem masih dalam kondisi korslet berbahaya!',
          },
          {
            objectiveId: 'obj_load_powered',
            isSatisfied: isLoadPowered,
            feedbackText: isLoadPowered
              ? 'Lampu beban menyala normal.'
              : 'Lampu beban belum menyala.',
          },
        ],
        feedbackMessage: isCompleted
          ? 'Hebat! Anda berhasil melenyapkan jalur korslet dan memulihkan rangkaian!'
          : 'Cari kabel yang membuat korslet lalu potong kabelnya.',
      };
    },
  },

  // ================= MISSION 3: REPAIR REVERSED POLARITY =================
  {
    id: 'repair-reversed-led',
    titleId: 'Troubleshooting Dioda LED & Polaritas Semikonduktor',
    titleEn: 'LED Diode Polarity & Semiconductor Troubleshooting',
    difficulty: 'intermediate',
    category: 'basic',
    estimatedMinutes: 5,
    descriptionId:
      'Dioda LED merupakan komponen semikonduktor modern hemat energi yang sangat sensitif. Arus listrik hanya dapat mengalir satu arah saat Anoda (kaki positif) terhubung ke kutub positif (Forward Biased). Perbaiki rangkaian yang mengalami salah pasang polaritas (Reverse Biased) agar LED kembali memancarkan foton cahaya!',
    descriptionEn:
      'LEDs are highly efficient semiconductor diodes that conduct current in only one forward direction (Anode to positive). Repair a reversed polarity circuit (Reverse Biased) so the LED emits bright photons!',
    learningObjectivesId: [
      'Memahami sifat semikonduktor satu arah (Forward Biased vs Reverse Biased) pada Dioda LED',
      'Membedakan polaritas pin Anoda (+) dan Katoda (-) pada fiting keramik',
      'Mendiagnosis kerusakan rangkaian akibat polaritas terbalik tanpa merusak komponen',
    ],
    learningObjectivesEn: [
      'Understand unidirectional semiconductor behavior (Forward vs Reverse Biased) in LEDs',
      'Differentiate Anode (+) and Cathode (-) pins on ceramic sockets',
      'Diagnose and repair circuits suffering from reverse-bias diode conditions',
    ],
    instructionsId: [
      '1. Periksa fiting keramik yang berisi lampu LED (LED Standar, LED RGB, atau LED Hijau).',
      '2. Amati peringatan "Polaritas Terbalik (Reverse Biased)" pada indikator fiting.',
      '3. Putus kabel yang terhubung ke kaki LED, lalu balik sambungannya agar Pin 1 (Anoda) menerima tegangan positif baterai.',
      '4. Pastikan saklar tertutup (ON) dan LED memancarkan cahaya foton terang.',
    ],
    instructionsEn: [
      '1. Inspect the ceramic socket holding an LED (Standard LED, RGB, or Green LED).',
      '2. Observe the "Reverse Biased Polarity" warning indicator.',
      '3. Sever and reverse the socket wire connections so Pin 1 (Anode) connects to the positive power rail.',
      '4. Ensure the switch is ON and the LED shines brightly.',
    ],
    hintsId: [
      'LED memblokir arus sepenuhnya jika kutubnya terbalik. Pin 1 pada fiting keramik harus tersambung ke kutub positif sumber daya.',
    ],
    hintsEn: [
      'An LED diode completely blocks reverse current. Pin 1 must connect to the higher potential terminal.',
    ],
    objectives: [
      {
        id: 'obj_no_reverse',
        descriptionId: 'Tidak ada LED yang terpasang dalam kondisi polaritas terbalik',
        descriptionEn: 'No LED is connected in reverse-biased polarity',
      },
      {
        id: 'obj_led_glowing',
        descriptionId: 'Lampu LED menyala terang (Forward Biased)',
        descriptionEn: 'LED shines brightly in forward-biased mode',
      },
    ],
    validate: (context: MissionContext): MissionValidationResult => {
      const { nodes, simulation } = context;

      const hasReversed = (simulation.reverseBiasedBranches ?? []).length > 0;
      const litLeds = nodes.filter((n) => {
        if (n.data.type !== 'socket' && n.data.type !== 'pin-socket') return false;
        const bulbType =
          typeof n.data.installedBulb === 'object'
            ? n.data.installedBulb?.bulbType
            : n.data.installedBulb;
        if (!bulbType || !bulbType.startsWith('led_')) return false;
        const current = Math.abs(simulation.branchCurrents[n.id] ?? 0);
        return current > 0.005;
      });

      const isNoReverse = !hasReversed;
      const isLedGlowing = litLeds.length >= 1;
      const isCompleted = isNoReverse && isLedGlowing;

      return {
        isCompleted,
        progressPercent: (isNoReverse ? 50 : 0) + (isLedGlowing ? 50 : 0),
        objectiveResults: [
          {
            objectiveId: 'obj_no_reverse',
            isSatisfied: isNoReverse,
            feedbackText: isNoReverse
              ? 'Polaritas dioda sudah benar (Forward Biased).'
              : 'Dioda LED masih terbalik (Reverse Biased).',
          },
          {
            objectiveId: 'obj_led_glowing',
            isSatisfied: isLedGlowing,
            feedbackText: isLedGlowing
              ? 'LED berhasil menyala terang!'
              : 'LED belum memancarkan cahaya.',
          },
        ],
        feedbackMessage: isCompleted
          ? 'Selamat! Anda memahami prinsip kerja polaritas semikonduktor dioda LED!'
          : 'Tukar kawat kabel pada fiting LED agar kutub anoda menerima tegangan positif.',
      };
    },
  },

  // ================= MISSION 4: CONNECT SOLAR PANEL TO GRID =================
  {
    id: 'solar-grid-connection',
    titleId: 'Microgrid Mandiri: Pembangkit PLTS Surya ke Lab Fisika',
    titleEn: 'Renewable Microgrid: Solar PV to Lab Supply',
    difficulty: 'intermediate',
    category: 'renewable',
    estimatedMinutes: 6,
    descriptionId:
      'Wujudkan visi sekolah hijau mandiri energi SMPN 12 Surabaya! Hubungkan modul Pembangkit Listrik Tenaga Surya (PLTS) di bukit alam terbuka ke Panel Distribusi Listrik Laboratorium. Pastikan proteksi MCB aktif (ON) dan energi fotovoltaik bersih berhasil disalurkan untuk menyalakan beban fiting lampu laboratorium!',
    descriptionEn:
      "Realize SMPN 12 Surabaya's green school vision! Connect an outdoor Solar Photovoltaic (PV) module to the Lab Distribution Panel. Ensure the MCB breaker is ON and clean renewable electricity powers the laboratory fixtures!",
    learningObjectivesId: [
      'Mempelajari pemanfaatan energi fotovoltaik matahari ramah lingkungan (PLTS)',
      'Memahami integrasi sistem pembangkit mikro ke panel distribusi listrik (MCB)',
      'Mengukur penyaluran daya bersih (clean energy transfer) ke beban laboratorium',
    ],
    learningObjectivesEn: [
      'Learn solar photovoltaic renewable energy harvesting dynamics',
      'Understand microgrid integration and MCB breaker protection',
      'Measure clean renewable power delivery to classroom laboratory loads',
    ],
    instructionsId: [
      '1. Pasang 1 Panel Surya (12V) dan 1 Panel Distribusi Laboratorium (atau Menara Transmisi).',
      '2. Hubungkan kutub Panel Surya ke terminal input Panel Distribusi.',
      '3. Hubungkan terminal output Panel Distribusi ke fiting lampu beban laboratorium.',
      '4. Pastikan saklar MCB panel berada di posisi ON (tidak trip) dan intensitas radiasi matahari mencukupi.',
      '5. Amati arus listrik surya mengalir menyalakan lampu secara stabil (I > 10mA).',
    ],
    instructionsEn: [
      '1. Place 1 Solar Panel (12V) and 1 Lab Distribution Panel (or Transmission Tower).',
      '2. Wire solar panel terminals to the panel input rails.',
      '3. Wire the distribution panel output to a load lamp socket.',
      '4. Ensure the MCB breaker switch is ON and solar irradiance is active.',
      '5. Confirm steady solar electric current illuminates the load (I > 10mA).',
    ],
    hintsId: [
      'Pastikan intensitas cahaya matahari cukup (> 50%). Jika MCB trip (jatuh), periksa apakah ada kabel yang terhubung korslet antara kutub positif dan negatif.',
    ],
    hintsEn: [
      'Ensure solar sunlight irradiance is set above 50%. If the MCB trips, verify that output cables are not shorted together.',
    ],
    objectives: [
      {
        id: 'obj_solar_present',
        descriptionId: 'Panel Surya terpasang dan menerima radiasi matahari',
        descriptionEn: 'Solar Panel is placed and receiving solar irradiance',
      },
      {
        id: 'obj_mcb_active',
        descriptionId: 'MCB Panel Distribusi aktif (ON) dan tidak trip',
        descriptionEn: 'Distribution Panel MCB is ON and not tripped',
      },
      {
        id: 'obj_solar_power_flowing',
        descriptionId: 'Arus listrik dari panel surya mengalir ke beban (I > 10mA)',
        descriptionEn: 'Electric current flows from solar panel to load (I > 10mA)',
      },
    ],
    validate: (context: MissionContext): MissionValidationResult => {
      const { nodes, simulation } = context;

      const solarPanels = nodes.filter(
        (n) => n.data.type === 'solar-panel' || n.data.type === 'solar_panel'
      );
      const isSolarPresent = solarPanels.length >= 1;

      const mcbPanels = nodes.filter(
        (n) =>
          n.data.type === 'transmission-tower' || n.data.type === 'transmission_tower'
      );
      const isMcbActive = mcbPanels.some(
        (panel) => panel.data.isMcbOn !== false && !panel.data.isMcbTripped
      );

      let isSolarPowerFlowing = false;
      for (const panel of solarPanels) {
        const current = Math.abs(simulation.branchCurrents[panel.id] ?? 0);
        if (current > 0.01) {
          isSolarPowerFlowing = true;
          break;
        }
      }

      const satisfiedCount =
        (isSolarPresent ? 1 : 0) +
        (isMcbActive ? 1 : 0) +
        (isSolarPowerFlowing ? 1 : 0);

      const isCompleted = satisfiedCount === 3;

      return {
        isCompleted,
        progressPercent: Math.round((satisfiedCount / 3) * 100),
        objectiveResults: [
          {
            objectiveId: 'obj_solar_present',
            isSatisfied: isSolarPresent,
            feedbackText: isSolarPresent
              ? 'Panel Surya terpasang aktif.'
              : 'Belum ada Panel Surya di kanvas.',
          },
          {
            objectiveId: 'obj_mcb_active',
            isSatisfied: isMcbActive,
            feedbackText: isMcbActive
              ? 'Panel MCB dalam kondisi ON.'
              : 'MCB belum aktif atau dalam kondisi trip korslet.',
          },
          {
            objectiveId: 'obj_solar_power_flowing',
            isSatisfied: isSolarPowerFlowing,
            feedbackText: isSolarPowerFlowing
              ? 'Daya listrik surya berhasil tersalurkan ke beban.'
              : 'Belum ada arus listrik yang mengalir dari panel surya.',
          },
        ],
        feedbackMessage: isCompleted
          ? 'Sukses besar! Pembangkit Listrik Tenaga Surya (PLTS) terhubung aman ke instalasi!'
          : 'Lengkapi sambungan kabel dari panel surya ke MCB dan beban lampu.',
      };
    },
  },

  // ================= MISSION 5: ENERGY EFFICIENCY OPTIMIZATION =================
  {
    id: 'energy-efficiency-challenge',
    titleId: 'Audit Efisiensi Energi: Pemangkasan Daya Lampu (Max 5W)',
    titleEn: 'Energy Audit: Room Lighting Under 5 Watts',
    difficulty: 'advanced',
    category: 'efficiency',
    estimatedMinutes: 6,
    descriptionId:
      'Program Adiwiyata Mandiri SMPN 12 menantangmu memangkas pemborosan energi listrik! Nyalakan minimal 2 titik lampu ruangan secara bersamaan, tetapi total konsumsi daya TIDAK BOLEH MELEBIHI 5.0 Watt. Buktikan keunggulan efisiensi teknologi lampu LED modern dibandingkan lampu pijar konvensional yang boros daya!',
    descriptionEn:
      "SMPN 12's Eco-School program challenges you to eliminate energy waste! Illuminate at least 2 separate room light fixtures simultaneously while consuming NO MORE THAN 5.0 Watts total. Demonstrate the superior efficiency of modern LEDs over wasteful incandescent bulbs!",
    learningObjectivesId: [
      'Menganalisis perbandingan konsumsi daya lampu pijar konvensional (40W) vs lampu LED modern (1-3W)',
      'Menghitung daya listrik total sirkuit (P = V x I)',
      'Menerapkan prinsip efisiensi energi dan konservasi daya listrik untuk memangkas rekening tagihan PLN',
    ],
    learningObjectivesEn: [
      'Analyze power consumption differences between incandescent and modern LED lamps',
      'Calculate total circuit power consumption (P = V x I)',
      'Apply energy conservation principles in engineering design to minimize PLN electricity costs',
    ],
    instructionsId: [
      '1. Pasang minimal 2 Fiting Lampu yang terhubung ke sumber daya baterai.',
      '2. Pasang bohlam hemat energi: ubah jenis lampu di dalam fiting menjadi LED (LED Standar, LED RGB, LED Hijau, atau CFL Spiral).',
      '3. Pastikan kedua lampu menyala terang secara simultan.',
      '4. Periksa total daya listrik di layar: total daya wajib di bawah 5.0 Watt (P ≤ 5.0W).',
    ],
    instructionsEn: [
      '1. Wire at least 2 Lamp Sockets to your battery power source.',
      '2. Install high-efficiency bulbs: switch inserted bulb type to LED (Standard, RGB, Green LED, or CFL Spiral).',
      '3. Confirm both room fixtures illuminate brightly.',
      '4. Verify circuit total power on display: must NOT exceed 5.0 Watts total (P ≤ 5.0W).',
    ],
    hintsId: [
      'Satu bohlam pijar konvensional saja mengonsumsi hingga 40 Watt dan akan langsung mendiskualifikasi misi. Gunakan lampu LED yang hanya membutuhkan ~1 Watt per titik.',
    ],
    hintsEn: [
      'A single incandescent bulb draws up to 40 Watts and will immediately violate the power ceiling. Use LEDs which consume ~1W each.',
    ],
    objectives: [
      {
        id: 'obj_two_fixtures',
        descriptionId: 'Minimal 2 fiting lampu menyala aktif (I > 5mA)',
        descriptionEn: 'At least 2 light fixtures illuminating actively (I > 5mA)',
      },
      {
        id: 'obj_led_technology',
        descriptionId: 'Menggunakan teknologi lampu hemat energi (LED / CFL)',
        descriptionEn: 'Using high-efficiency lighting technology (LED / CFL)',
      },
      {
        id: 'obj_power_cap',
        descriptionId: 'Total konsumsi daya sirkuit di bawah 5.0 Watt (P ≤ 5W)',
        descriptionEn: 'Total circuit power consumption is under 5.0 Watts (P ≤ 5W)',
      },
    ],
    validate: (context: MissionContext): MissionValidationResult => {
      const { nodes, simulation } = context;

      if (simulation.isShortCircuit) {
        return {
          isCompleted: false,
          progressPercent: 0,
          objectiveResults: [
            { objectiveId: 'obj_two_fixtures', isSatisfied: false, feedbackText: 'Korslet!' },
            { objectiveId: 'obj_led_technology', isSatisfied: false, feedbackText: 'Korslet!' },
            { objectiveId: 'obj_power_cap', isSatisfied: false, feedbackText: 'Daya korslet melonjak!' },
          ],
          feedbackMessage: 'Rangkaian korsleting!',
        };
      }

      // 1. Check at least 2 active glowing bulbs
      const activeBulbs = nodes.filter((n) => {
        if (n.data.type !== 'socket' && n.data.type !== 'pin-socket') return false;
        const current = Math.abs(simulation.branchCurrents[n.id] ?? 0);
        return current > 0.005;
      });
      const hasTwoActive = activeBulbs.length >= 2;

      // 2. Check LED technology
      const isUsingEfficientBulbs = activeBulbs.every((socket) => {
        const bulbType =
          typeof socket.data.installedBulb === 'object'
            ? socket.data.installedBulb?.bulbType
            : socket.data.installedBulb;
        return (
          bulbType === 'led_standard' ||
          bulbType === 'led_rgb' ||
          bulbType === 'led_green' ||
          bulbType === 'cfl'
        );
      });

      // 3. Check total power constraint
      const totalPower = simulation.totalPowerDrawn;
      const isPowerUnderCap = totalPower > 0.05 && totalPower <= 5.0;

      const satisfiedCount =
        (hasTwoActive ? 1 : 0) +
        (isUsingEfficientBulbs ? 1 : 0) +
        (isPowerUnderCap ? 1 : 0);

      const isCompleted = satisfiedCount === 3;

      return {
        isCompleted,
        progressPercent: Math.round((satisfiedCount / 3) * 100),
        objectiveResults: [
          {
            objectiveId: 'obj_two_fixtures',
            isSatisfied: hasTwoActive,
            feedbackText: hasTwoActive
              ? `${activeBulbs.length} lampu menyala terang.`
              : `Baru ${activeBulbs.length} dari 2 lampu menyala.`,
          },
          {
            objectiveId: 'obj_led_technology',
            isSatisfied: isUsingEfficientBulbs,
            feedbackText: isUsingEfficientBulbs
              ? 'Semua lampu menggunakan teknologi LED hemat energi.'
              : 'Masih ada lampu pijar boros energi yang terpasang.',
          },
          {
            objectiveId: 'obj_power_cap',
            isSatisfied: isPowerUnderCap,
            feedbackText: isPowerUnderCap
              ? `Total konsumsi daya: ${totalPower.toFixed(2)} W (Lolos batas 5W).`
              : `Total daya: ${totalPower.toFixed(2)} W (Melebihi batas 5.0W).`,
          },
        ],
        feedbackMessage: isCompleted
          ? 'Sempurna! Anda berhasil menghemat energi listrik secara spektakuler menggunakan lampu LED!'
          : 'Ganti bohlam dengan LED agar total daya tidak melampaui 5 Watt.',
      };
    },
  },
];
