---
title: Kalibrasi Turbin Mikrohidro, Pin Anti-Ketutupan & Kabel Lintas Kamera HP
tags:
  - hub
  - physics-engine
  - outdoor-nature
  - ui-antislop
aliases:
  - Hydro & Mobile Wiring Fix Devlog
  - Devlog Turbin & Kabel Lintas Kamera
---

# Kalibrasi Turbin Mikrohidro, Pin Anti-Ketutupan & Kabel Lintas Kamera HP

Parent Hub: [[README|Circuit Sandbox 4.0 Master Architecture Hub (MOC)]]  
Related Notes: [[PHYSICS_MICROHYDRO_AND_BESS_STORAGE]], [[UI_UX_ANTISLOP_AND_MOBILE_ENGINE]], [[PHYSICS_LENS_XRAY_AND_SCIENTIFIC_AUDIT]], [[TESTING_AND_VERIFICATION_MATRIX]], [[DEVLOG_SESSION_NATURE_MODE_4.0]]  
Commit Utama: `d2379d6`

---

## Ringkasan Masalah yang Diselesaikan

Catatan ini mendokumentasikan 3 perbaikan utama dari kendala penggunaan **Mode Alam EBT di layar HP (`360px`)**:

1. **Turbin air kurang akurat (`100% · 12.1V` di air menggenang/datar)** — sungai datar tanpa air terjun sempat menghasilkan daya lebih tinggi daripada air terjun pendek 1–2 blok di atas kincir.
2. **Pin `+` dan `-` ketutupan air dan tombol bawah** — terminal turbin berada di dasar (`bottom: 6px`) di dalam air sungai sekaligus tertindih dock `[ Normal | Termal | Probe ]` dan bar kamera bawah.
3. **Menara Transmisi di luar kamera susah dipasang & disambung kabel** — sulit menarik satu kabel terus-menerus melintasi kanvas `1360px` pada layar HP `360px` saat kamera sedang menyorot sungai.

---

## 1. Kalibrasi Fisika Turbin Mikrohidro (`src/physics/hydroPhysics.ts`)

- **Tiga Tingkat Aliran yang Masuk Akal (`HydroFlowRegime`):**
  1. `puddle` (**Genangan**): genangan dangkal atau sempit ($H \le 0.27\,\text{m}$, debit $\le 35\%$).
  2. `river` (**Sungai Datar**): aliran kanal menerus di dasar sungai (`cols 24..32`), dibatasi di bawah `12.0V` nominal ($H \le 0.88\,\text{m}$, daya $< 30\,\text{W}$, sekitar `11.3V`).
  3. `waterfall` (**Air Terjun**): air jatuh dari atas poros kincir Pelton (`waterfallDropRows >= 1`) digabung dukungan kanal di bawahnya (`waterfallDropRows + channelSupportRows`), sehingga air terjun selalu menghasilkan daya & tegangan (`12.1V`–`13.8V` AVR) lebih tinggi dari sungai datar.
- **Deteksi Lebar Roda Kincir (`HYDRO_RUNNER_WIDTH_RATIO = 0.47`):** Pemindaian kolom air disamakan persis dengan diameter roda Pelton (`47%` lebar komponen `208px`), sehingga air yang menyentuh tepi kanan/kiri roda tetap terdeteksi.
- **Pelabelan Status & Slider Manual (`HydroTurbineNode.tsx`, `terrainClimateEngine.ts`):**
  - Badge status di atas turbin menampilkan kondisi aliran nyata (`Genangan`, `Sungai`, atau `Terjun`).
  - Slider tinggi jatuh air di Inspector menyimpan `manualHydraulicHeadMeters` di `CircuitElementData` sehingga tidak langsung tertimpa kembali oleh tick medan, lalu direset otomatis saat komponen dipindahkan (`settleOutdoorNodeAfterDrag`).

---

## 2. Pin Terminal Bebas Halangan (`HydroTurbineNode.tsx`, `PhysicsLensDock.tsx`)

- **Pin Turbin Dinaikkan ke Bagian Kering (`top: 44%`):** Kutub `+` (kiri `34%`) dan `-` (kanan `66%`) dipindah dari dasar (`bottom: 6px`) ke jembatan rangka atas yang kering dengan ukuran tombol sentuh diperbesar (`!w-7 !h-7 md:!w-6 !h-6`) serta efek kedip saat aktif dipilih.
- **Pin Komponen Alam Lain Lebih Jelas:** Pin `+`/`-` pada `SolarPanelNode.tsx`, `WindTurbineNode.tsx`, `BessSubstationNode.tsx`, dan `TransmissionTowerNode.tsx` dinaikkan sedikit dari garis rumput/tanah dan diperbesar target sentuhnya di layar HP.
- **Relokasi Bar Lensa HP (`PhysicsLensDock.tsx`, `ProbeReadoutHud.tsx`):** Pada mode `outside` di layar kecil, `[ Normal | Termal | Probe ]` dipindah ke bagian langit kiri atas (`top-[54px] left-2`) dan kartu pembacaan Probe di `top-[98px]`, membebaskan seluruh area sungai dan terminal bawah.

---

## 3. Sambung Kabel Lintas Kamera & Navigasi Menara (`canvasWireAssist.ts`)

Diimplementasikan bersama antara `OutdoorSandbox.tsx` dan `CircuitCanvas.tsx` (DRY via `useTapToConnectHandlers.ts` dan `WireConnectAssistBar.tsx`):

- **Two-Tap Pin Wiring ("Ketuk Pin A → Pilih/Geser → Ketuk Pin B"):**
  - Ketuk sekali pin mana saja untuk memilih pin awal (`pendingWireStart` di `useCircuitStore.ts`).
  - Pengguna bisa menggeser kamera atau memakai bar bantuan, lalu ketuk pin tujuan untuk menyambung kabel (mendukung batal lewat `Escape`, ketuk ulang pin yang sama, atau ketuk kanvas kosong; menolak self-loop serta kabel ganda).
- **Bar Sambung Cepat (`WireConnectAssistBar.tsx`):**
  - Saat pin awal aktif, muncul bar mengambang yang langsung memprioritaskan `Menara Transmisi` (`findQuickWireTargets`), termasuk ikon arah panah jika menara sedang berada di luar layar HP.
- **Radar Mini & Lompat Cepat (`#tour-outdoor-camera`):**
  - Menambahkan titik warna radar posisi Surya, Angin, Mikrohidro, BESS, dan Menara Transmisi (`buildOutdoorRadarMarkers`) beserta tombol cepat `← Menara` / `Menara →` (`findNearestOffscreenTowerJump`).
- **Auto-Pan Pinggir Layar & Kamera Ikut Komponen Baru:**
  - Menarik kabel atau komponen ke pinggir kiri/kanan layar memicu geser otomatis `requestAnimationFrame` (`computeEdgeAutoPanVelocity`).
  - Menambah komponen dari menu `+ EBT` (`SidebarPalette.tsx`) otomatis menggeser viewport ke komponen baru (`scrollOutdoorViewportToX`).

---

## Verifikasi Terkait

- **Unit Test (`npx vitest run`):** `53 passed (53)` file test, `382 passed (382)` test lulus (`src/physics/__tests__/bessAndHydro.test.ts` + `src/utils/__tests__/canvasWireAssist.test.ts`).
- **Build Produksi (`npm run build`):** `tsc && vite build` selesai sukses (exit code 0).
