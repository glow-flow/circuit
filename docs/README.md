---
title: "Circuit Sandbox 4.0 Knowledge Vault"
tags:
  - index
  - circuit-sandbox
  - documentation
---

# ⚡ Circuit Sandbox 4.0 Knowledge Vault

Selamat datang di *Knowledge Vault* proyek **Circuit Sandbox**. Vault ini dirancang untuk dibuka menggunakan aplikasi **Obsidian** untuk navigasi konteks cepat, visualisasi graf hubungan berkas (*Graph View*), dan dokumentasi arsitektur sirkuit interaktif.

## 📚 Daftar Catatan & Modul

- [[DEVLOG_SESSION_NATURE_MODE_4.0]]: Catatan komprehensif sesi pengembangan Zona Alam Terbuka 4.0, perbaikan *bug* fisika tanah/lereng, optimasi kompresi aset mobile (93.3%), dan redesain UI/UX *Floating Island Dock*.
- `src/physics/`: Mesin komputasi fisika (MNA Solver, Union-Find Transmission, Cellular Automata Terrain, Orographic Wind Shear).
- `src/components/canvas/`: Kanvas sirkuit interaktif ReactFlow (Lab & Zona Alam).
- `src/store/`: Manajemen state global Zustand (`useCircuitStore.ts`).

## 🛠️ Tips Penggunaan di Obsidian
1. Buka aplikasi **Obsidian**.
2. Pilih **"Open folder as vault"** dan arahkan ke folder proyek: `C:\Users\ASUS\Desktop\circuit` (atau subfolder `docs`).
3. Tekan `Ctrl + G` di Obsidian untuk melihat peta graf visual (*Interactive Graph View*) dari seluruh keterhubungan modul.
