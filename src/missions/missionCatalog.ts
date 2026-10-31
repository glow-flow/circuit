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
    titleId: 'Tantangan 3 Lampu Paralel',
    titleEn: '3 Bulbs in Parallel Challenge',
    difficulty: 'beginner',
    category: 'series_parallel',
    estimatedMinutes: 5,
    descriptionId:
      'Rancang rangkaian listrik yang menghubungkan 3 fiting lampu secara paralel ke sumber baterai. Pastikan ketiga lampu menyala terang secara simultan dengan tegangan yang sama.',
    descriptionEn:
      'Design a DC circuit connecting 3 lamp sockets in parallel to a battery. Ensure all 3 bulbs illuminate simultaneously with identical terminal voltage.',
    learningObjectivesId: [
      'Memahami karakteristik percabangan rangkaian paralel',
      'Membuktikan bahwa tegangan tiap cabang paralel bernilai sama (V = V₁ = V₂ = V₃)',
      'Mengamati pembagian kuat arus listrik pada titik percabangan (Hukum I Kirchhoff)',
    ],
    learningObjectivesEn: [
      'Understand parallel circuit branch characteristics',
      'Verify that terminal voltage is identical across parallel branches (V = V₁ = V₂ = V₃)',
      'Observe current division at junctions (Kirchhoff\'s Current Law)',
    ],
    instructionsId: [
      '1. Pasang 1 Wadah Baterai 2x AA (3V) atau Baterai 9V.',
      '2. Letakkan 3 Fiting Lampu di kanvas dan pasang lampu ke dalam fiting.',
      '3. Hubungkan kutub positif baterai ke kaki pertama dari ketiga fiting.',
      '4. Hubungkan kutub negatif baterai ke kaki kedua dari ketiga fiting.',
    ],
    instructionsEn: [
      '1. Place 1x 2-Cell AA Battery Holder (3V) or 9V Battery.',
      '2. Place 3 Lamp Sockets onto canvas and insert bulbs.',
      '3. Wire the battery positive terminal to the first pin of all 3 sockets.',
      '4. Wire the battery negative terminal to the second pin of all 3 sockets.',
    ],
    hintsId: [
      'Gunakan Waypoint (Sudut Kabel) untuk merapikan percabangan kawat kabel.',
      'Pastikan tidak ada lampu yang belum terpasang ke dalam fiting.',
    ],
    hintsEn: [
      'Use Waypoint nodes to cleanly branch the wiring conductors.',
      'Ensure every bulb is firmly seated in a socket holder.',
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
    titleId: 'Detektif Bahaya Korsleting',
    titleEn: 'Short-Circuit Detective',
    difficulty: 'beginner',
    category: 'safety',
    estimatedMinutes: 4,
    descriptionId:
      'Sebuah rangkaian mengalami korsleting akibat jalur kawat kabel tanpa beban yang menghubungkan langsung kutub positif dan negatif. Temukan kawat korslet tersebut dan putus kabelnya agar lampu menyala aman!',
    descriptionEn:
      'A circuit has suffered a catastrophic short circuit due to a zero-resistance bypass wire. Identify the fault wire and cut it so the lamp operates safely!',
    learningObjectivesId: [
      'Mengenali bahaya korsleting (short circuit) pada instalasi listrik',
      'Mempelajari mengapa arus listrik memilih jalur dengan hambatan terendah (I = V / R)',
      'Memahami fungsi pemutus sirkuit dan cara mengamankan instalasi',
    ],
    learningObjectivesEn: [
      'Recognize electrical short circuit hazards',
      'Understand why electric current routes through the path of least resistance (I = V / R)',
      'Learn how to isolate faults and restore safe circuit operation',
    ],
    instructionsId: [
      '1. Amati jalur kabel yang berwarna merah neon (indikasi korslet).',
      '2. Ketuk kawat bypass yang korslet untuk memilihnya.',
      '3. Tekan tombol "Putus Kabel" (ikon Gunting) untuk memotong jalur korslet.',
      '4. Pastikan lampu pijar kembali menyala terang secara normal.',
    ],
    instructionsEn: [
      '1. Look for wires highlighted in neon red with hazard pulse.',
      '2. Click/tap the faulty bypass wire to select it.',
      '3. Click the "Cut Wire" (Scissors icon) button to remove the fault.',
      '4. Verify the incandescent lamp glows normally.',
    ],
    hintsId: [
      'Korsleting terjadi jika ada kawat yang menghubungkan langsung kutub baterai tanpa melewati fiting lampu.',
    ],
    hintsEn: [
      'A short circuit occurs when a conductor directly connects power terminals bypassing the load.',
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
    titleId: 'Troubleshooting Polaritas Dioda LED',
    titleEn: 'Troubleshooting LED Diode Polarity',
    difficulty: 'intermediate',
    category: 'basic',
    estimatedMinutes: 5,
    descriptionId:
      'Sebuah lampu LED dihubungkan dengan polaritas terbalik (Anoda terhubung ke negatif, Katoda terhubung ke positif). Dioda memblokir arus listrik sehingga lampu padam. Perbaiki polaritas kabel agar LED memancarkan cahaya!',
    descriptionEn:
      'An LED lamp was wired with reversed polarity (Anode to negative, Cathode to positive). The semiconductor diode blocks current flow. Fix wire polarity so the LED shines!',
    learningObjectivesId: [
      'Memahami sifat semikonduktor satu arah pada Dioda Pemancar Cahaya (LED)',
      'Membedakan kutub Anoda (positif) dan Katoda (negatif)',
      'Mendiagnosis kerusakan rangkaian akibat polaritas terbalik',
    ],
    learningObjectivesEn: [
      'Understand unidirectional semiconductor behavior in Light Emitting Diodes (LED)',
      'Differentiate Anode (positive) and Cathode (negative) pins',
      'Diagnose and repair circuits suffering from reverse-bias conditions',
    ],
    instructionsId: [
      '1. Periksa fiting keramik yang berisi lampu LED.',
      '2. Perhatikan peringatan "Polaritas Terbalik (Reverse Biased)".',
      '3. Putus kabel yang salah arah dan hubungkan Pin 1 (Anoda) ke kutub Positif sumber baterai.',
      '4. Pastikan saklar tertutup (ON) dan LED memancarkan cahaya.',
    ],
    instructionsEn: [
      '1. Inspect the socket containing the LED bulb.',
      '2. Notice the "Reverse Biased Polarity" warning in the inspector.',
      '3. Re-route wires so Pin 1 (Anode) connects to the Positive terminal.',
      '4. Close the switch and confirm the LED emits light.',
    ],
    hintsId: [
      'LED hanya bisa menghantarkan listrik saat tegangan Pin 1 lebih tinggi dari Pin 2.',
    ],
    hintsEn: [
      'An LED only conducts electric current when Pin 1 potential is strictly greater than Pin 2.',
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
    titleId: 'Integrasi PLTS Panel Surya ke MCB',
    titleEn: 'Solar PV Integration to MCB Panel',
    difficulty: 'intermediate',
    category: 'renewable',
    estimatedMinutes: 6,
    descriptionId:
      'Hubungkan modul Panel Surya (PLTS) ke Panel Distribusi Laboratorium (MCB). Pastikan saklar MCB dalam posisi aktif (ON) dan energi bersih tersalurkan ke beban fiting lampu.',
    descriptionEn:
      'Connect a Solar PV module to the Lab Distribution Panel (MCB). Ensure the breaker switch is ON and renewable energy flows to the load socket.',
    learningObjectivesId: [
      'Mempelajari pemanfaatan energi surya ramah lingkungan (PLTS)',
      'Memahami fungsi pengaman Mini Circuit Breaker (MCB) pada instalasi listrik',
      'Mengintegrasikan pembangkit energi terbarukan ke beban laboratorium',
    ],
    learningObjectivesEn: [
      'Learn solar photovoltaic renewable energy harvesting',
      'Understand MCB circuit breaker protection in distribution panels',
      'Integrate renewable generators into classroom laboratory loads',
    ],
    instructionsId: [
      '1. Pasang 1 Panel Surya dan 1 Panel Distribusi Listrik (MCB).',
      '2. Hubungkan kutub panel surya ke terminal input MCB.',
      '3. Hubungkan terminal output MCB ke fiting lampu beban.',
      '4. Pastikan saklar MCB di panel berada pada posisi ON (tidak trip).',
    ],
    instructionsEn: [
      '1. Place 1 Solar Panel and 1 Lab Distribution Panel (MCB).',
      '2. Wire solar panel terminals to the panel input.',
      '3. Wire the panel output to a load lamp socket.',
      '4. Ensure the MCB breaker switch is ON and not tripped.',
    ],
    hintsId: [
      'Pastikan intensitas cahaya matahari cukup (> 50%).',
      'Jika MCB trip (jatuh), periksa apakah ada kabel yang terhubung korslet.',
    ],
    hintsEn: [
      'Ensure solar irradiance sunlight is set above 50%.',
      'If the MCB trips, check for short-circuit faults between positive and negative.',
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
    titleId: 'Tantangan Efisiensi Energi Hijau',
    titleEn: 'Green Energy Efficiency Challenge',
    difficulty: 'advanced',
    category: 'efficiency',
    estimatedMinutes: 6,
    descriptionId:
      'Nyalakan minimal 2 titik lampu ruangan secara bersamaan dengan total konsumsi daya MAKSIMAL 5 Watt. Ganti lampu pijar konvensional yang boros energi dengan lampu LED hemat energi!',
    descriptionEn:
      'Illuminate at least 2 separate room light fixtures simultaneously consuming NO MORE THAN 5 Watts total. Replace inefficient incandescent lamps with modern LEDs!',
    learningObjectivesId: [
      'Menganalisis perbandingan konsumsi daya lampu pijar vs LED',
      'Menghitung daya listrik total (P = V x I)',
      'Menerapkan prinsip efisiensi energi dan konservasi daya listrik',
    ],
    learningObjectivesEn: [
      'Analyze power consumption differences between incandescent and LED lighting',
      'Calculate total circuit power (P = V x I)',
      'Apply energy conservation principles in engineering design',
    ],
    instructionsId: [
      '1. Pasang minimal 2 Fiting Lampu yang terhubung ke sumber daya baterai.',
      '2. Ubah jenis lampu di dalam fiting menjadi LED (LED Standar, LED RGB, atau LED Hijau).',
      '3. Pastikan kedua lampu menyala terang.',
      '4. Periksa total daya listrik di layar: total daya TIDAK BOLEH melebihi 5.0 Watt.',
    ],
    instructionsEn: [
      '1. Wire at least 2 Lamp Sockets to your power source.',
      '2. Change the inserted bulb type to high-efficiency LEDs (Standard LED, RGB, or Green LED).',
      '3. Confirm both fixtures are illuminating.',
      '4. Verify circuit total power: must NOT exceed 5.0 Watts total.',
    ],
    hintsId: [
      'Lampu pijar mengonsumsi hingga 40W, sedangkan LED hanya membutuhkan ~1W untuk menyala terang.',
    ],
    hintsEn: [
      'Incandescent bulbs consume up to 40W each, whereas LEDs consume only ~1W for high luminous output.',
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
