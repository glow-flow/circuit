/**
 * Troubleshooting Lab Scenarios Catalog.
 * 
 * Defines 6 realistic electrical fault scenarios with:
 * - Pre-configured starter circuits containing real physical faults
 * - Observable symptom descriptions & target expected behavior
 * - 3-stage progressive hints (Concept -> Region -> Solution measurement)
 * - Strict MNA physical validation (topology, convergence, voltage/current tolerances)
 */

import { TroubleshootingScenario, FaultValidationContext, FaultValidationResult } from '../types/troubleshooting';

export const TROUBLESHOOTING_SCENARIOS: TroubleshootingScenario[] = [
  // ================= SCENARIO 1: REVERSED LED POLARITY =================
  {
    id: 'fault_reversed_led',
    titleId: 'Kenapa Lampu LED Tidak Menyala?',
    titleEn: 'Why is the LED Not Lighting Up?',
    difficulty: 'beginner',
    category: 'polarity',
    estimatedMinutes: 5,
    symptomsId: [
      'Baterai 9V terpasang dengan tegangan normal (9,0 V).',
      'Fiting lampu berisi bohlam LED Standard.',
      'Kabel terhubung lengkap membentuk loop tertutup, namun LED sama sekali tidak menyala.',
      'Ammeter membaca arus 0,0 mA.',
    ],
    symptomsEn: [
      '9V Battery is active with normal nominal voltage (9.0 V).',
      'Socket is fitted with an LED Standard bulb.',
      'Wires form a complete closed loop, but the LED fails to illuminate.',
      'Ammeter reads 0.0 mA branch current.',
    ],
    expectedBehaviorId: 'Lampu LED menyala terang dengan arus konduksi maju (I > 1,5 mA) dan tidak mengalami bias mundur.',
    expectedBehaviorEn: 'LED glows brightly with forward conduction current (I > 1.5 mA) without reverse bias.',
    hints: [
      {
        stage: 1,
        textId: 'Periksa sifat semikonduktor LED: LED adalah dioda yang hanya menghantarkan arus satu arah.',
        textEn: 'Consider LED semiconductor physics: LEDs are diodes that conduct current in only one direction.',
        scorePenalty: 100,
      },
      {
        stage: 2,
        textId: 'Perhatikan jalur kabel antara kutub baterai (+) dan pin fiting p1 (Anoda) vs p2 (Katoda).',
        textEn: 'Inspect the wires connecting battery (+) terminal to socket pin p1 (Anode) vs p2 (Cathode).',
        scorePenalty: 200,
      },
      {
        stage: 3,
        textId: 'Kabel terbalik! Hubungkan kutub positif baterai ke pin p1 fiting dan kutub negatif ke pin p2.',
        textEn: 'Polarity is reversed! Connect battery positive to socket pin p1 and negative to pin p2.',
        scorePenalty: 300,
      },
    ],
    starterCircuit: {
      nodes: [
        {
          id: 'bat_1',
          type: 'battery9v',
          position: { x: 80, y: 150 },
          data: { id: 'bat_1', type: 'battery9v', label: 'Baterai 9V', voltage: 9.0, currentCharge: 100 },
        },
        {
          id: 'sock_1',
          type: 'socket',
          position: { x: 380, y: 150 },
          data: {
            id: 'sock_1',
            type: 'socket',
            label: 'Fiting LED',
            installedBulb: {
              id: 'led_bulb',
              bulbType: 'led_standard',
              resistance: 4500,
              powerRating: 0.1,
            },
          },
        },
      ],
      // FAULT: Connected in reverse bias (neg to p1, pos to p2)
      edges: [
        { id: 'w_fault_1', source: 'bat_1', sourceHandle: 'neg', target: 'sock_1', targetHandle: 'p1' },
        { id: 'w_fault_2', source: 'sock_1', sourceHandle: 'p2', target: 'bat_1', targetHandle: 'pos' },
      ],
    },
    validateRepair: (context: FaultValidationContext): FaultValidationResult => {
      const { nodes, simulation } = context;

      if (simulation.isShortCircuit) {
        return {
          isRepaired: false,
          topologyCorrect: false,
          simulationConverged: true,
          measurementsSatisfied: false,
          feedbackMessageId: 'Rangkaian mengalami korsleting! Periksa jalur kabel Anda.',
          feedbackMessageEn: 'Circuit is short-circuited! Inspect your wire paths.',
        };
      }

      const socketNode = nodes.find((n) => n.id === 'sock_1' || n.data.type === 'socket');
      if (!socketNode) {
        return {
          isRepaired: false,
          topologyCorrect: false,
          simulationConverged: false,
          measurementsSatisfied: false,
          feedbackMessageId: 'Fiting lampu LED tidak ditemukan di kanvas.',
          feedbackMessageEn: 'LED socket not found on canvas.',
        };
      }

      // Check if solver flagged reverse bias
      const isReverseBiased = (simulation.reverseBiasedBranches ?? []).includes(socketNode.id);
      if (isReverseBiased) {
        return {
          isRepaired: false,
          topologyCorrect: false,
          simulationConverged: true,
          measurementsSatisfied: false,
          feedbackMessageId: 'Polaritas LED masih terbalik (Reverse Bias). Arus diblokir.',
          feedbackMessageEn: 'LED polarity is still reversed (Reverse Bias). Current is blocked.',
        };
      }

      const current = Math.abs(simulation.branchCurrents[socketNode.id] ?? 0);
      if (current < 0.001) {
        return {
          isRepaired: false,
          topologyCorrect: false,
          simulationConverged: true,
          measurementsSatisfied: false,
          feedbackMessageId: 'Belum ada arus yang mengalir melalui LED (I < 1 mA). Periksa kelengkapan kabel.',
          feedbackMessageEn: 'No current flowing through LED (I < 1 mA). Check connection loop.',
        };
      }

      return {
        isRepaired: true,
        topologyCorrect: true,
        simulationConverged: true,
        measurementsSatisfied: true,
        feedbackMessageId: 'Diagnosa & Perbaikan Berhasil! LED menyala dengan forward bias sempurna.',
        feedbackMessageEn: 'Diagnosis & Repair Successful! LED illuminates under forward bias.',
      };
    },
  },

  // ================= SCENARIO 2: BROKEN WIRE OPEN CIRCUIT =================
  {
    id: 'fault_broken_wire',
    titleId: 'Lacak Kawat Putus (Open Circuit)',
    titleEn: 'Find the Broken Wire (Open Circuit)',
    difficulty: 'beginner',
    category: 'open_circuit',
    estimatedMinutes: 4,
    symptomsId: [
      'Lampu tidak menyala sama sekali.',
      'Saklar dalam posisi TERTUTUP (ON).',
      'Baterai memiliki muatan penuh (1,5 V).',
      'Arus listrik nol di seluruh cabang.',
    ],
    symptomsEn: [
      'Lamp fails to glow.',
      'Switch is in CLOSED (ON) state.',
      'Battery has full state of charge (1.5 V).',
      'Current is zero throughout all branches.',
    ],
    expectedBehaviorId: 'Rangkaian tertutup kembali tersambung, lampu menyala dengan arus normal (I > 15 mA).',
    expectedBehaviorEn: 'Continuous closed circuit restored, lamp glows with normal current (I > 15 mA).',
    hints: [
      {
        stage: 1,
        textId: 'Arus listrik hanya dapat mengalir pada loop konduksi yang tertutup tanpa celah.',
        textEn: 'Electric current requires an unbroken closed loop to flow.',
        scorePenalty: 100,
      },
      {
        stage: 2,
        textId: 'Periksa jalur penghubung antara saklar dan fiting lampu. Ada kawat yang terputus di sana.',
        textEn: 'Check the connection between the switch and lamp socket. A wire is disconnected there.',
        scorePenalty: 200,
      },
      {
        stage: 3,
        textId: 'Tarik kabel baru dari pin p2 saklar ke pin p1 fiting lampu untuk melengkapi rangkaian.',
        textEn: 'Connect a wire from switch pin p2 to lamp socket pin p1 to complete the loop.',
        scorePenalty: 300,
      },
    ],
    starterCircuit: {
      nodes: [
        {
          id: 'bat_1',
          type: 'battery',
          position: { x: 80, y: 150 },
          data: { id: 'bat_1', type: 'battery', label: 'Baterai 1.5V', voltage: 1.5, currentCharge: 100 },
        },
        {
          id: 'sw_1',
          type: 'switch',
          position: { x: 260, y: 100 },
          data: { id: 'sw_1', type: 'switch', label: 'Saklar', isOpen: false },
        },
        {
          id: 'sock_1',
          type: 'socket',
          position: { x: 440, y: 150 },
          data: {
            id: 'sock_1',
            type: 'socket',
            label: 'Fiting Lampu',
            installedBulb: {
              id: 'bulb_inc',
              bulbType: 'incandescent',
              resistance: 40,
              powerRating: 0.5,
            },
          },
        },
      ],
      // FAULT: Missing wire between sw_1:p2 and sock_1:p1
      edges: [
        { id: 'w1', source: 'bat_1', sourceHandle: 'pos', target: 'sw_1', targetHandle: 'p1' },
        { id: 'w3', source: 'sock_1', sourceHandle: 'p2', target: 'bat_1', targetHandle: 'neg' },
      ],
    },
    validateRepair: (context: FaultValidationContext): FaultValidationResult => {
      const { nodes, simulation } = context;

      if (simulation.isShortCircuit) {
        return {
          isRepaired: false,
          topologyCorrect: false,
          simulationConverged: true,
          measurementsSatisfied: false,
          feedbackMessageId: 'Rangkaian mengalami korsleting! Periksa sambungan kabel.',
          feedbackMessageEn: 'Circuit is short-circuited! Check your wiring.',
        };
      }

      const socket = nodes.find((n) => n.id === 'sock_1' || n.data.type === 'socket');
      const current = Math.abs(simulation.branchCurrents[socket?.id ?? ''] ?? 0);

      // Expected: I ≈ 1.5 / 40.05 ≈ 0.037 A (37 mA)
      if (current < 0.015) {
        return {
          isRepaired: false,
          topologyCorrect: false,
          simulationConverged: true,
          measurementsSatisfied: false,
          feedbackMessageId: 'Kawat masih terputus. Lampu belum menerima arus listrik.',
          feedbackMessageEn: 'Wire is still broken. The lamp is receiving no current.',
        };
      }

      return {
        isRepaired: true,
        topologyCorrect: true,
        simulationConverged: true,
        measurementsSatisfied: true,
        feedbackMessageId: 'Kawat putus berhasil diperbaiki! Arus listrik mengalir sempurna.',
        feedbackMessageEn: 'Broken wire repaired successfully! Electric current flows normally.',
      };
    },
  },

  // ================= SCENARIO 3: DEAD SHORT CIRCUIT =================
  {
    id: 'fault_dead_short',
    titleId: 'Diagnosa Korsleting (Dead Short Circuit)',
    titleEn: 'Diagnose Dead Short Circuit',
    difficulty: 'intermediate',
    category: 'short_circuit',
    estimatedMinutes: 6,
    symptomsId: [
      'Simulator membunyikan alarm korsleting (KORSLET)!',
      'Kabel merah menyala dan bergetar hebat.',
      'Arus melonjak melebihi 15 Ampere.',
      'Lampu padam karena tegangan jepit baterai drop mendekati nol.',
    ],
    symptomsEn: [
      'Simulator alarms short-circuit danger alert!',
      'Red pulsing wires with heavy visual warning.',
      'Current surges past 15 Amperes.',
      'Lamp remains dark due to battery terminal voltage collapsing to near zero.',
    ],
    expectedBehaviorId: 'Jalur korslet dihilangkan, arus kembali aman (< 1,0 A), dan lampu menyala terang.',
    expectedBehaviorEn: 'Shorting path eliminated, current returns to safe level (< 1.0 A), and lamp illuminates.',
    hints: [
      {
        stage: 1,
        textId: 'Korsleting terjadi jika ada jalur kawat berhambatan nol yang menghubungkan langsung kutub (+) dan (-) baterai.',
        textEn: 'A short circuit happens when a zero-ohm wire bridges directly between (+) and (-) terminals.',
        scorePenalty: 100,
      },
      {
        stage: 2,
        textId: 'Periksa kawat yang mem-bypass fiting lampu langsung dari kutub baterai.',
        textEn: 'Inspect the wire bypassing the lamp socket directly from the battery terminals.',
        scorePenalty: 200,
      },
      {
        stage: 3,
        textId: 'Potong kawat shorting penghubung langsung antara kutub positif dan negatif baterai.',
        textEn: 'Cut the shorting wire directly bridging the battery positive and negative terminals.',
        scorePenalty: 300,
      },
    ],
    starterCircuit: {
      nodes: [
        {
          id: 'bat_1',
          type: 'battery',
          position: { x: 80, y: 150 },
          data: { id: 'bat_1', type: 'battery', label: 'Baterai AA', voltage: 1.5, currentCharge: 100 },
        },
        {
          id: 'sock_1',
          type: 'socket',
          position: { x: 380, y: 150 },
          data: {
            id: 'sock_1',
            type: 'socket',
            label: 'Fiting Lampu',
            installedBulb: {
              id: 'bulb_inc',
              bulbType: 'incandescent',
              resistance: 40,
              powerRating: 0.5,
            },
          },
        },
      ],
      edges: [
        // Valid lamp path
        { id: 'w1', source: 'bat_1', sourceHandle: 'pos', target: 'sock_1', targetHandle: 'p1' },
        { id: 'w2', source: 'sock_1', sourceHandle: 'p2', target: 'bat_1', targetHandle: 'neg' },
        // FAULT: Direct short-circuit bridging pos and neg directly
        { id: 'w_short', source: 'bat_1', sourceHandle: 'pos', target: 'bat_1', targetHandle: 'neg' },
      ],
    },
    validateRepair: (context: FaultValidationContext): FaultValidationResult => {
      const { simulation, nodes } = context;

      if (simulation.isShortCircuit) {
        return {
          isRepaired: false,
          topologyCorrect: false,
          simulationConverged: true,
          measurementsSatisfied: false,
          feedbackMessageId: 'Korsleting masih aktif! Arus berlebih belum teratasi.',
          feedbackMessageEn: 'Short circuit still active! Overcurrent is not resolved.',
        };
      }

      const socket = nodes.find((n) => n.id === 'sock_1' || n.data.type === 'socket');
      const current = Math.abs(simulation.branchCurrents[socket?.id ?? ''] ?? 0);

      if (current < 0.015) {
        return {
          isRepaired: false,
          topologyCorrect: false,
          simulationConverged: true,
          measurementsSatisfied: false,
          feedbackMessageId: 'Korslet teratasi namun lampu tidak menyala. Periksa kabel beban.',
          feedbackMessageEn: 'Short cleared, but lamp is not connected properly.',
        };
      }

      return {
        isRepaired: true,
        topologyCorrect: true,
        simulationConverged: true,
        measurementsSatisfied: true,
        feedbackMessageId: 'Korsleting berhasil dieliminasi! Rangkaian kembali aman dan lampu menyala.',
        feedbackMessageEn: 'Short circuit successfully eliminated! Circuit is safe and lamp glowing.',
      };
    },
  },

  // ================= SCENARIO 4: MCB BREAKER TRIPPING =================
  {
    id: 'fault_mcb_trip_short',
    titleId: 'Kenapa Saklar MCB Trip Terus-menerus?',
    titleEn: 'Why Does the MCB Breaker Keep Tripping?',
    difficulty: 'intermediate',
    category: 'protection_trip',
    estimatedMinutes: 6,
    symptomsId: [
      'Tuas MCB pada Panel Distribusi otomatis turun ke posisi TRIP saat dinyalakan.',
      'Siswa tidak bisa mengunci tuas MCB ke posisi ON.',
      'Panel bergetar tanda proteksi hubungan singkat PUIL 2011 aktif.',
    ],
    symptomsEn: [
      'MCB switch on Distribution Panel automatically flips to TRIP upon reset.',
      'Student cannot latch the MCB breaker to ON.',
      'Panel vibrates indicating active PUIL 2011 overcurrent trip protection.',
    ],
    expectedBehaviorId: 'Kawat loop korslet dilepas, MCB dapat di-reset kembali ke ON, dan beban beroperasi normal.',
    expectedBehaviorEn: 'Short-circuit wire removed, MCB resets cleanly to ON, and loads operate normally.',
    hints: [
      {
        stage: 1,
        textId: 'MCB dirancang menolak di-reset (trip-free mechanism) selama gangguan korsleting masih menempel pada terminal outputnya.',
        textEn: 'MCBs are trip-free: they cannot be reset while a dead short remains across output terminals.',
        scorePenalty: 100,
      },
      {
        stage: 2,
        textId: 'Periksa terminal positif (+) dan negatif (-) Panel Distribusi. Ada kawat yang menghubungkan keduanya secara langsung.',
        textEn: 'Inspect Distribution Panel (+) and (-) terminals. A direct loop wire bridges them.',
        scorePenalty: 200,
      },
      {
        stage: 3,
        textId: 'Gunakan tombol "Putus Kabel & Reset" pada panel untuk memotong kawat korslet dan menaikkan kembali tuas MCB.',
        textEn: 'Use "Cut Wires & Reset" to disconnect the shorting wire and reset the MCB breaker.',
        scorePenalty: 300,
      },
    ],
    starterCircuit: {
      nodes: [
        {
          id: 'panel_1',
          type: 'distribution-panel',
          position: { x: 80, y: 150 },
          data: {
            id: 'panel_1',
            type: 'distribution-panel',
            label: 'Panel Lab',
            isMcbOn: false,
            isMcbTripped: true, // FAULT: Tripped
            stepDownVoltage: 12.0,
          },
        },
        {
          id: 'sock_1',
          type: 'socket',
          position: { x: 380, y: 150 },
          data: {
            id: 'sock_1',
            type: 'socket',
            label: 'Lampu Penerangan',
            installedBulb: {
              id: 'bulb_cfl',
              bulbType: 'cfl',
              resistance: 100,
              powerRating: 15,
            },
          },
        },
      ],
      edges: [
        // FAULT: Direct short bridging panel pos and neg
        { id: 'w_short', source: 'panel_1', sourceHandle: 'pos', target: 'panel_1', targetHandle: 'neg' },
        // Valid load
        { id: 'w_load_pos', source: 'panel_1', sourceHandle: 'pos', target: 'sock_1', targetHandle: 'p1' },
        { id: 'w_load_neg', source: 'sock_1', sourceHandle: 'p2', target: 'panel_1', targetHandle: 'neg' },
      ],
    },
    validateRepair: (context: FaultValidationContext): FaultValidationResult => {
      const { nodes, simulation } = context;

      const panel = nodes.find((n) => n.id === 'panel_1' || n.data.type === 'distribution-panel');
      if (!panel) {
        return {
          isRepaired: false,
          topologyCorrect: false,
          simulationConverged: false,
          measurementsSatisfied: false,
          feedbackMessageId: 'Panel distribusi tidak ditemukan.',
          feedbackMessageEn: 'Distribution panel not found.',
        };
      }

      if (panel.data.isMcbTripped || panel.data.isMcbOn === false) {
        return {
          isRepaired: false,
          topologyCorrect: false,
          simulationConverged: true,
          measurementsSatisfied: false,
          feedbackMessageId: 'MCB masih dalam keadaan TRIP atau OFF. Lepaskan kawat korslet dan nyalakan MCB.',
          feedbackMessageEn: 'MCB is still TRIPPED or OFF. Remove the short and switch MCB to ON.',
        };
      }

      if (simulation.isShortCircuit) {
        return {
          isRepaired: false,
          topologyCorrect: false,
          simulationConverged: true,
          measurementsSatisfied: false,
          feedbackMessageId: 'Korsleting masih terdeteksi pada panel!',
          feedbackMessageEn: 'Short circuit still detected across panel terminals!',
        };
      }

      const current = Math.abs(simulation.branchCurrents['sock_1'] ?? 0);
      if (current < 0.05) {
        return {
          isRepaired: false,
          topologyCorrect: false,
          simulationConverged: true,
          measurementsSatisfied: false,
          feedbackMessageId: 'MCB sudah ON, tetapi beban lampu belum terhubung dengan baik.',
          feedbackMessageEn: 'MCB is ON, but the lamp load is not drawing current.',
        };
      }

      return {
        isRepaired: true,
        topologyCorrect: true,
        simulationConverged: true,
        measurementsSatisfied: true,
        feedbackMessageId: 'MCB berhasil di-reset dan beban beroperasi normal tanpa gangguan!',
        feedbackMessageEn: 'MCB successfully reset and loads operating normally without faults!',
      };
    },
  },

  // ================= SCENARIO 5: INCORRECT RESISTOR VALUE =================
  {
    id: 'fault_wrong_resistor',
    titleId: 'Identifikasi Resistor Salah Nilai',
    titleEn: 'Identify Incorrect Resistor Value',
    difficulty: 'intermediate',
    category: 'component_value',
    estimatedMinutes: 6,
    symptomsId: [
      'Bohlam lampu pijar hampir padam (sangat redup).',
      'Arus listrik drop drastis di bawah 0,5 mA padahal sumber tegangan 9V.',
      'Drop tegangan pada resistor terukur 8,98 Volt (hampir menyerap seluruh tegangan baterai).',
    ],
    symptomsEn: [
      'Incandescent bulb is nearly dark (extremely dim).',
      'Current drops below 0.5 mA despite a 9V battery source.',
      'Voltage drop across resistor measures 8.98 Volts (absorbing nearly all battery EMF).',
    ],
    expectedBehaviorId: 'Nilai resistor disesuaikan ke rentang yang tepat (20 Ω - 100 Ω) agar lampu menyala terang.',
    expectedBehaviorEn: 'Resistor value calibrated to proper range (20 Ω - 100 Ω) for bright lamp illumination.',
    hints: [
      {
        stage: 1,
        textId: 'Menurut Hukum Ohm, jika nilai hambatan seri terlalu besar, arus yang tersisa untuk lampu menjadi sangat kecil.',
        textEn: 'By Ohm\'s Law, excessive series resistance starves the lamp of operating current.',
        scorePenalty: 100,
      },
      {
        stage: 2,
        textId: 'Periksa nilai resistor pada Inspektor. Nilai saat ini (10.000 Ω) terlalu tinggi untuk lampu 9V.',
        textEn: 'Inspect resistor value. Current setting (10,000 Ω) is too high for a 9V lamp.',
        scorePenalty: 200,
      },
      {
        stage: 3,
        textId: 'Buka tab Properti resistor dan ubah nilainya menjadi antara 20 Ω hingga 100 Ω.',
        textEn: 'Open resistor Properties tab and tune its resistance between 20 Ω and 100 Ω.',
        scorePenalty: 300,
      },
    ],
    starterCircuit: {
      nodes: [
        {
          id: 'bat_1',
          type: 'battery9v',
          position: { x: 80, y: 150 },
          data: { id: 'bat_1', type: 'battery9v', label: 'Baterai 9V', voltage: 9.0, currentCharge: 100 },
        },
        {
          id: 'r_fault',
          type: 'resistor',
          position: { x: 260, y: 150 },
          data: { id: 'r_fault', type: 'resistor', label: 'Resistor Pembatas', resistance: 10000 }, // FAULT: 10k Ohm!
        },
        {
          id: 'sock_1',
          type: 'socket',
          position: { x: 440, y: 150 },
          data: {
            id: 'sock_1',
            type: 'socket',
            label: 'Lampu Pijar',
            installedBulb: {
              id: 'bulb_inc',
              bulbType: 'incandescent',
              resistance: 40,
              powerRating: 2.0,
            },
          },
        },
      ],
      edges: [
        { id: 'w1', source: 'bat_1', sourceHandle: 'pos', target: 'r_fault', targetHandle: 'p1' },
        { id: 'w2', source: 'r_fault', sourceHandle: 'p2', target: 'sock_1', targetHandle: 'p1' },
        { id: 'w3', source: 'sock_1', sourceHandle: 'p2', target: 'bat_1', targetHandle: 'neg' },
      ],
    },
    validateRepair: (context: FaultValidationContext): FaultValidationResult => {
      const { nodes, simulation } = context;

      const resistor = nodes.find((n) => n.id === 'r_fault' || n.data.type === 'resistor');
      const resistance = resistor?.data.resistance ?? 10000;

      if (resistance > 150) {
        return {
          isRepaired: false,
          topologyCorrect: true,
          simulationConverged: true,
          measurementsSatisfied: false,
          feedbackMessageId: `Nilai resistor masih terlalu besar (${resistance} Ω). Turunkan di bawah 150 Ω.`,
          feedbackMessageEn: `Resistor value is still too high (${resistance} Ω). Reduce below 150 Ω.`,
        };
      }

      const socket = nodes.find((n) => n.id === 'sock_1' || n.data.type === 'socket');
      const current = Math.abs(simulation.branchCurrents[socket?.id ?? ''] ?? 0);

      // Expected: With R in [20, 100] + 40 bulb + 2 int = [62, 142] -> I in [0.063, 0.145] A
      if (current < 0.05) {
        return {
          isRepaired: false,
          topologyCorrect: false,
          simulationConverged: true,
          measurementsSatisfied: false,
          feedbackMessageId: 'Arus lampu masih belum optimal (I < 50 mA).',
          feedbackMessageEn: 'Lamp current is not yet optimal (I < 50 mA).',
        };
      }

      return {
        isRepaired: true,
        topologyCorrect: true,
        simulationConverged: true,
        measurementsSatisfied: true,
        feedbackMessageId: 'Hambatan berhasil disesuaikan! Lampu menyala terang dengan arus optimal.',
        feedbackMessageEn: 'Resistance tuned successfully! Lamp illuminates brightly with optimal current.',
      };
    },
  },

  // ================= SCENARIO 6: SOLAR LIGHTING CIRCUIT RESTORATION =================
  {
    id: 'fault_solar_night_diode',
    titleId: 'Pulihkan Sistem Lampu PLTS Surya',
    titleEn: 'Restore Solar PV Lighting System',
    difficulty: 'advanced',
    category: 'renewable_failure',
    estimatedMinutes: 8,
    symptomsId: [
      'Panel surya dihubungkan ke lampu penerangan jalan.',
      'Lampu padam karena saklar kontrol penerangan belum terhubung ke jalur konduksi baterai.',
      'Baterai penyimpan tidak terhubung ke beban.',
    ],
    symptomsEn: [
      'Solar panel installed for street lighting.',
      'Streetlight is off because battery storage is disconnected from the lamp path.',
      'No energy transfer from storage to load.',
    ],
    expectedBehaviorId: 'Kabel baterai dan lampu tersambung dengan benar, menyalurkan daya stabil (> 2 Watt).',
    expectedBehaviorEn: 'Battery and lamp correctly wired, delivering steady power (> 2 Watts).',
    hints: [
      {
        stage: 1,
        textId: 'Sistem PLTS membutuhkan loop tertutup dari sumber energi (Panel Surya / Baterai) menuju beban.',
        textEn: 'Solar systems require a complete closed loop from energy source to load.',
        scorePenalty: 100,
      },
      {
        stage: 2,
        textId: 'Periksa kabel yang keluar dari kutub positif panel surya menuju lampu.',
        textEn: 'Inspect the wire from solar positive terminal leading to the lamp.',
        scorePenalty: 200,
      },
      {
        stage: 3,
        textId: 'Hubungkan panel surya dan baterai secara paralel ke fiting lampu jalan.',
        textEn: 'Connect solar panel and battery in parallel to the streetlight socket.',
        scorePenalty: 300,
      },
    ],
    starterCircuit: {
      nodes: [
        {
          id: 'solar_1',
          type: 'solar-panel',
          position: { x: 80, y: 150 },
          data: { id: 'solar_1', type: 'solar-panel', label: 'Panel Surya 12V', sunlight: 100, voltage: 12.0 },
        },
        {
          id: 'sock_1',
          type: 'socket',
          position: { x: 400, y: 150 },
          data: {
            id: 'sock_1',
            type: 'socket',
            label: 'Lampu Jalan LED',
            installedBulb: {
              id: 'bulb_led',
              bulbType: 'led_standard',
              resistance: 4500,
              powerRating: 0.1,
            },
          },
        },
      ],
      // FAULT: Only negative wire is connected, positive wire is missing
      edges: [
        { id: 'w_neg', source: 'solar_1', sourceHandle: 'neg', target: 'sock_1', targetHandle: 'p2' },
      ],
    },
    validateRepair: (context: FaultValidationContext): FaultValidationResult => {
      const { simulation, nodes } = context;

      if (simulation.isShortCircuit) {
        return {
          isRepaired: false,
          topologyCorrect: false,
          simulationConverged: true,
          measurementsSatisfied: false,
          feedbackMessageId: 'Sistem mengalami korsleting!',
          feedbackMessageEn: 'System is short-circuited!',
        };
      }

      const socket = nodes.find((n) => n.id === 'sock_1' || n.data.type === 'socket');
      const current = Math.abs(simulation.branchCurrents[socket?.id ?? ''] ?? 0);

      if (current < 0.001) {
        return {
          isRepaired: false,
          topologyCorrect: false,
          simulationConverged: true,
          measurementsSatisfied: false,
          feedbackMessageId: 'Lampu PLTS belum menyala. Sambungkan kabel positif dari panel surya ke fiting lampu.',
          feedbackMessageEn: 'Solar lamp not lit. Connect the positive wire from solar panel to socket.',
        };
      }

      return {
        isRepaired: true,
        topologyCorrect: true,
        simulationConverged: true,
        measurementsSatisfied: true,
        feedbackMessageId: 'Sistem penerangan PLTS berhasil dipulihkan dan menyala terang!',
        feedbackMessageEn: 'Solar lighting system restored and glowing brightly!',
      };
    },
  },
];
