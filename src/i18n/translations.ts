/**
 * Localization & Educational Dictionary for Circuit Sandbox.
 *
 * Tailored specifically for:
 * 1. Guru & Siswa SMP Kelas 9 (Materi IPA: Listrik Dinamis, Hukum Ohm, Rangkaian Seri & Paralel, Daya Listrik)
 * 2. Hobiis & Pembuat Blueprint Rangkaian Lampu Sederhana
 */

export type AppLanguage = 'id' | 'en';

export interface TranslationDictionary {
  header: {
    appSubtitle: string;
    selectPreset: string;
    presetSimpleLamp: string;
    presetSeriesDivider: string;
    presetParallelBulbs: string;
    presetShortCircuit: string;
    resetTitle: string;
    statusShort: string;
    statusStable: string;
    clearAll: string;
    clearTitle: string;
    langToggleTitle: string;
  };
  mobileNav: {
    addPart: string;
    inspector: string;
  };
  palette: {
    title: string;
    subtitleDesktop: string;
    subtitleMobile: string;
    tipConnect: string;
    tipWaypoint: string;
    items: {
      battery: { label: string; description: string; badge: string };
      holder: { label: string; description: string; badge: string };
      resistor: { label: string; description: string };
      bulb: { label: string; description: string; badge: string };
      switch: { label: string; description: string };
      ground: { label: string; description: string };
      voltmeter: { label: string; description: string };
      ammeter: { label: string; description: string };
    };
  };
  nodes: {
    battery: {
      title: string;
      dragHint: string;
      voltage: string;
      current: string;
    };
    holder: {
      title: string;
      dropNow: string;
      filledCount: string;
      emptyHint: string;
      insertBtn: string;
      ejectBtn: string;
      outputVoltage: string;
      seriesTag: string;
      singleTag: string;
      emptyTag: string;
      current: string;
    };
    bulb: {
      title: string;
      overloaded: string;
      replaceBtn: string;
      brightness: string;
      power: string;
      current: string;
    };
    resistor: {
      title: string;
      resistance: string;
      voltageDrop: string;
      current: string;
    };
    switch: {
      title: string;
      openBadge: string;
      closedBadge: string;
      clickToClose: string;
      clickToOpen: string;
    };
    ground: {
      title: string;
      subtitle: string;
    };
    voltmeter: {
      title: string;
      probeDiff: string;
    };
    ammeter: {
      title: string;
      seriesCurrent: string;
    };
  };
  inspector: {
    title: string;
    globalBadge: string;
    hazardTitle: string;
    hazardDesc: string;
    normalTitle: string;
    normalDesc: string;
    totalComponents: string;
    totalWires: string;
    totalPower: string;
    maxVoltage: string;
    formulaTitle: string;
    formulaOhm: string;
    formulaPower: string;
    formulaSeries: string;
    quickTipTitle: string;
    quickTipDesc: string;
    deleteTitle: string;
    waypointTitle: string;
    waypointDesc: string;
    waypointImpedance: string;
    waypointLossless: string;
    liveTelemetry: string;
    branchCurrent: string;
    voltageDrop: string;
    powerDissipated: string;
    batteryVoltageLabel: string;
    holderCellsLabel: string;
    holderOutputLabel: string;
    holderGuide: string;
    holderInsertBtn: string;
    holderEjectBtn: string;
    resistorLabel: string;
    bulbResistanceLabel: string;
    switchStateLabel: string;
    switchOpenBtn: string;
    switchClosedBtn: string;
  };
  wire: {
    cutWire: string;
    cutWireShort: string;
    wireSelected: string;
    wireResistance: string;
    idealWire: string;
    tapToCut: string;
    deleteWireSuccess: string;
    fromTo: string;
  };
}

export const TRANSLATIONS: Record<AppLanguage, TranslationDictionary> = {
  id: {
    header: {
      appSubtitle: 'Lab IPA Kelas 9 & Blueprint Listrik',
      selectPreset: 'Pilih Contoh Rangkaian...',
      presetSimpleLamp: '1. Rangkaian Lampu Sederhana (3V)',
      presetSeriesDivider: '2. Rangkaian Seri (Pembagi Tegangan)',
      presetParallelBulbs: '3. Rangkaian Lampu Paralel',
      presetShortCircuit: '4. Demo Korsleting (Hubung Singkat)',
      resetTitle: 'Muat Ulang Rangkaian Awal',
      statusShort: 'KORSLETING! (>10A)',
      statusStable: 'Rangkaian Aman',
      clearAll: 'Bersihkan',
      clearTitle: 'Hapus Semua Komponen di Kanvas',
      langToggleTitle: 'Ganti Bahasa (Indonesia / Inggris)',
    },
    mobileNav: {
      addPart: 'Tambah Alat',
      inspector: 'Info & Rumus',
    },
    palette: {
      title: 'Komponen Listrik',
      subtitleDesktop: 'Geser atau klik alat untuk menaruh di kanvas',
      subtitleMobile: 'Ketuk komponen di bawah untuk menaruh ke kanvas',
      tipConnect: 'Tarik garis dari titik bulat (kutub) untuk menyambung kabel.',
      tipWaypoint:
        '💡 Ketuk 2x pada kabel untuk membuat Penjepit Tekukan agar jalur kabel rapi seperti blueprint!',
      items: {
        battery: {
          label: 'Baterai AA 1.5V',
          description: 'Baterai 1.5V satuan. Geser masuk ke Wadah Baterai atau sambung langsung',
          badge: '1.5V',
        },
        holder: {
          label: 'Wadah Baterai (2x AA)',
          description: 'Tempat 2 baterai AA seri (total 3.0V) dengan pegas otomatis',
          badge: 'Wadah',
        },
        resistor: {
          label: 'Resistor (Hambatan)',
          description: 'Penghambat arus listrik sesuai Hukum Ohm (V = I × R)',
        },
        bulb: {
          label: 'Lampu Bohlam',
          description: 'Menyala makin terang saat daya listrik (P = I²R) makin besar',
          badge: 'Menyala',
        },
        switch: {
          label: 'Saklar Listrik',
          description: 'Menyambung (ON) atau memutus (OFF) aliran arus listrik',
        },
        ground: {
          label: 'Ground (Titik 0V)',
          description: 'Titik acuan tegangan 0 Volt pada rangkaian',
        },
        voltmeter: {
          label: 'Voltmeter Digital',
          description: 'Mengukur tegangan / beda potensial listrik (dipasang paralel)',
        },
        ammeter: {
          label: 'Amperemeter Digital',
          description: 'Mengukur kuat arus listrik yang mengalir (dipasang seri)',
        },
      },
    },
    nodes: {
      battery: {
        title: 'Baterai AA',
        dragHint: 'Geser ke Wadah Baterai untuk pasang',
        voltage: 'Tegangan:',
        current: 'Kuat Arus:',
      },
      holder: {
        title: 'Wadah AA (2x)',
        dropNow: 'Lepas untuk pasang baterai!',
        filledCount: 'Terisi:',
        emptyHint: 'Kosong (Geser Baterai AA ke sini)',
        insertBtn: '+1.5V',
        ejectBtn: 'Lepas',
        outputVoltage: 'Tegangan:',
        seriesTag: '(Seri)',
        singleTag: '(1 Sel)',
        emptyTag: '(Kosong)',
        current: 'Kuat Arus:',
      },
      bulb: {
        title: 'Lampu',
        overloaded: 'PUTUS! Arus Terlalu Besar',
        replaceBtn: 'Ganti Bohlam Baru',
        brightness: 'Terang:',
        power: 'Daya (P):',
        current: 'Arus (I):',
      },
      resistor: {
        title: 'Resistor',
        resistance: 'Hambatan (R):',
        voltageDrop: 'Tegangan (V):',
        current: 'Kuat Arus (I):',
      },
      switch: {
        title: 'Saklar Listrik',
        openBadge: 'TERBUKA (OFF)',
        closedBadge: 'TERTUTUP (ON)',
        clickToClose: 'Sambung Saklar (ON)',
        clickToOpen: 'Putus Saklar (OFF)',
      },
      ground: {
        title: 'Ground (0V)',
        subtitle: 'Titik Acuan 0V',
      },
      voltmeter: {
        title: 'Voltmeter',
        probeDiff: 'Beda Potensial (V)',
      },
      ammeter: {
        title: 'Amperemeter',
        seriesCurrent: 'Kuat Arus Seri (I)',
      },
    },
    inspector: {
      title: 'Panel Info & Rumus IPA',
      globalBadge: 'Ringkasan',
      hazardTitle: 'Bahaya Korsleting!',
      hazardDesc:
        'Arus melebihi 10 Ampere karena kutub (+) dan (-) tersambung tanpa hambatan! Kabel bisa panas & terbakar.',
      normalTitle: 'Rangkaian Berjalan Normal',
      normalDesc:
        'Tegangan (V) dan Kuat Arus (I) dihitung otomatis secara real-time dengan Hukum Ohm & Hukum Kirchhoff.',
      totalComponents: 'Jumlah Komponen:',
      totalWires: 'Jumlah Kabel:',
      totalPower: 'Total Daya (P):',
      maxVoltage: 'Tegangan Maks (V):',
      formulaTitle: '📘 Rumus Cepat IPA Kelas 9:',
      formulaOhm: 'V = I × R  (Tegangan = Arus × Hambatan)',
      formulaPower: 'P = V × I = I² × R  (Daya Listrik dalam Watt)',
      formulaSeries: 'Baterai Seri: V_total = V₁ + V₂ (1.5V + 1.5V = 3.0V)',
      quickTipTitle: 'Tips Blueprint & Praktikum:',
      quickTipDesc:
        'Ketuk komponen apa saja di kanvas untuk mengubah nilai Volt, Ohm (Ω), atau melihat arus listriknya.',
      deleteTitle: 'Hapus Komponen Ini',
      waypointTitle: 'Penjepit Tekukan Kabel',
      waypointDesc:
        'Geser titik penjepit ini ke mana saja untuk merapikan atau membengkokkan jalur kabel blueprint-mu.',
      waypointImpedance: 'Hambatan Kabel:',
      waypointLossless: '0.00 Ω (Tanpa Rugi)',
      liveTelemetry: 'Hasil Pengukuran Langsung',
      branchCurrent: 'Kuat Arus (I):',
      voltageDrop: 'Tegangan (V = I×R):',
      powerDissipated: 'Daya Lampu (P):',
      batteryVoltageLabel: 'Tegangan Baterai (V)',
      holderCellsLabel: 'Jumlah Baterai AA',
      holderOutputLabel: 'Tegangan Keluar (Seri):',
      holderGuide:
        'Geser komponen Baterai AA 1.5V ke atas wadah ini di kanvas (otomatis berputar 180° & menekan per), atau klik tombol di bawah:',
      holderInsertBtn: '+ Isi Baterai (1.5V)',
      holderEjectBtn: 'Keluarkan Baterai',
      resistorLabel: 'Nilai Hambatan Resistor (R)',
      bulbResistanceLabel: 'Hambatan Filamen Lampu (R)',
      switchStateLabel: 'Posisi Saklar Listrik',
      switchOpenBtn: 'Saklar TERBUKA / Mati (Klik untuk Nyalakan)',
      switchClosedBtn: 'Saklar TERTUTUP / Nyala (Klik untuk Matikan)',
    },
    wire: {
      cutWire: 'Gunting / Putus Kabel',
      cutWireShort: 'Putus Kabel',
      wireSelected: 'Kabel Rangkaian Terpilih',
      wireResistance: 'Hambatan Kabel:',
      idealWire: '0.00 Ω (Ideal / Lossless)',
      tapToCut: 'Ketuk tombol merah untuk memutus kabel ini',
      deleteWireSuccess: 'Kabel berhasil diputus!',
      fromTo: 'Menghubungkan:',
    },
  },
  en: {
    header: {
      appSubtitle: 'Grade 9 Physics Lab & Circuit Blueprint',
      selectPreset: 'Select Circuit Preset...',
      presetSimpleLamp: '1. Simple Lamp Circuit (3V)',
      presetSeriesDivider: '2. Series Voltage Divider',
      presetParallelBulbs: '3. Parallel Lamps Circuit',
      presetShortCircuit: '4. Short-Circuit Hazard Demo',
      resetTitle: 'Reset Default Circuit',
      statusShort: 'SHORT CIRCUIT! (>10A)',
      statusStable: 'Circuit Stable',
      clearAll: 'Clear',
      clearTitle: 'Clear All Components',
      langToggleTitle: 'Switch Language (Indonesian / English)',
    },
    mobileNav: {
      addPart: 'Add Part',
      inspector: 'Inspector',
    },
    palette: {
      title: 'Component Palette',
      subtitleDesktop: 'Drag or click to place onto the canvas',
      subtitleMobile: 'Tap any part below to place it onto the canvas',
      tipConnect: 'Drag between circular pins to connect wires.',
      tipWaypoint:
        '💡 Double-click any wire to add an Anchor Pin. Drag it to bend or route your blueprint cables!',
      items: {
        battery: {
          label: '1.5V AA Battery',
          description: 'Single 1.5V AA cell. Drag onto Holder or wire directly',
          badge: '1.5V',
        },
        holder: {
          label: 'Dual AA Holder',
          description: 'Holds 2x AA cells in series (3.0V) with spring contacts',
          badge: 'Holder',
        },
        resistor: {
          label: 'Resistor',
          description: 'Limits current according to Ohm’s Law (V = I × R)',
        },
        bulb: {
          label: 'Light Bulb',
          description: 'Glows brighter as dissipated power (P = I²R) increases',
          badge: 'Glows',
        },
        switch: {
          label: 'SPST Switch',
          description: 'Toggleable contact blade to open/close circuits',
        },
        ground: {
          label: 'Earth Ground (0V)',
          description: 'Defines 0V reference point for the circuit',
        },
        voltmeter: {
          label: 'Digital Voltmeter',
          description: 'Measures potential difference in Volts (wire in parallel)',
        },
        ammeter: {
          label: 'Digital Ammeter',
          description: 'Measures current in Amperes (wire in series)',
        },
      },
    },
    nodes: {
      battery: {
        title: 'AA Cell',
        dragHint: 'Drag onto Holder to insert',
        voltage: 'Voltage:',
        current: 'Current:',
      },
      holder: {
        title: 'AA Holder (2x)',
        dropNow: 'Drop to insert AA cell!',
        filledCount: 'Cells:',
        emptyHint: 'Empty (Drop AA Cell here)',
        insertBtn: '+1.5V',
        ejectBtn: 'Eject',
        outputVoltage: 'Output:',
        seriesTag: '(Series)',
        singleTag: '(1 Cell)',
        emptyTag: '(Empty)',
        current: 'Current:',
      },
      bulb: {
        title: 'Lamp',
        overloaded: 'BLOWN! Current Overload',
        replaceBtn: 'Replace Bulb',
        brightness: 'Brightness:',
        power: 'Power (P):',
        current: 'Current (I):',
      },
      resistor: {
        title: 'Resistor',
        resistance: 'Resistance (R):',
        voltageDrop: 'Voltage (V):',
        current: 'Current (I):',
      },
      switch: {
        title: 'SPST Switch',
        openBadge: 'OPEN (OFF)',
        closedBadge: 'CLOSED (ON)',
        clickToClose: 'Close Switch (ON)',
        clickToOpen: 'Open Switch (OFF)',
      },
      ground: {
        title: 'Ground (0V)',
        subtitle: '0V Reference',
      },
      voltmeter: {
        title: 'Voltmeter',
        probeDiff: 'Potential Diff (V)',
      },
      ammeter: {
        title: 'Ammeter',
        seriesCurrent: 'Series Current (I)',
      },
    },
    inspector: {
      title: 'Circuit Inspector',
      globalBadge: 'Overview',
      hazardTitle: 'Short Circuit Hazard!',
      hazardDesc:
        'Current exceeds 10A due to a direct low-resistance path between (+) and (-)!',
      normalTitle: 'Circuit Normal',
      normalDesc:
        'Voltages (V) and Currents (I) are solved in real-time using Ohm’s Law & Kirchhoff’s Laws.',
      totalComponents: 'Components:',
      totalWires: 'Wires:',
      totalPower: 'Total Power (P):',
      maxVoltage: 'Max Voltage (V):',
      formulaTitle: '📘 Grade 9 Physics Formulas:',
      formulaOhm: 'V = I × R  (Voltage = Current × Resistance)',
      formulaPower: 'P = V × I = I² × R  (Electrical Power in Watts)',
      formulaSeries: 'Series Cells: V_total = V₁ + V₂ (1.5V + 1.5V = 3.0V)',
      quickTipTitle: 'Blueprint & Lab Tip:',
      quickTipDesc:
        'Tap any component on the canvas to adjust its Voltage, Resistance (Ω), or inspect live current.',
      deleteTitle: 'Delete Component',
      waypointTitle: 'Wire Anchor Pin',
      waypointDesc:
        'Drag this anchor anywhere to route, curve, or organize your circuit blueprint wires.',
      waypointImpedance: 'Wire Resistance:',
      waypointLossless: '0.00 Ω (Ideal)',
      liveTelemetry: 'Live Measurements',
      branchCurrent: 'Current (I):',
      voltageDrop: 'Voltage Drop (V):',
      powerDissipated: 'Lamp Power (P):',
      batteryVoltageLabel: 'Battery Voltage (V)',
      holderCellsLabel: 'Inserted AA Cells',
      holderOutputLabel: 'Series Output:',
      holderGuide:
        'Drag a 1.5V AA Battery onto this holder on the canvas (auto-rotates 180° & compresses spring), or use the buttons below:',
      holderInsertBtn: '+ Insert AA (1.5V)',
      holderEjectBtn: 'Eject AA Cell',
      resistorLabel: 'Resistance Value (R)',
      bulbResistanceLabel: 'Filament Resistance (R)',
      switchStateLabel: 'Switch State',
      switchOpenBtn: 'Switch is OPEN / OFF (Click to Turn ON)',
      switchClosedBtn: 'Switch is CLOSED / ON (Click to Turn OFF)',
    },
    wire: {
      cutWire: 'Cut / Remove Wire',
      cutWireShort: 'Cut Wire',
      wireSelected: 'Selected Wire Edge',
      wireResistance: 'Wire Resistance:',
      idealWire: '0.00 Ω (Ideal / Lossless)',
      tapToCut: 'Tap the red button to cut this wire',
      deleteWireSuccess: 'Wire successfully removed!',
      fromTo: 'Connecting:',
    },
  },
};
