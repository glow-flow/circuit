---
title: Teacher-First Mobile UI Overhaul, Creative Interactive Tutorial & Code-Rendered Switch Plan
tags:
  - ui-antislop
  - pedagogy
  - outdoor-nature
  - architecture
aliases:
  - Teacher-First UX Overhaul
  - Creative Tutorial & Code Switch Plan
---

# Teacher-First Mobile UI Overhaul, Creative Interactive Tutorial & Code-Rendered Switch Plan

Parent Hub: [[README|Circuit Sandbox 4.0 Master Architecture Hub (MOC)]]  
Related Nodes: [[UI_UX_ANTISLOP_AND_MOBILE_ENGINE]], [[PEDAGOGY_ACADEMY_AND_EXPLAINABLE_TUTOR]], [[HARDWARE_COMPONENTS_AND_PROTECTION]]

---

## 1. Root-Cause UX Audit (Why Non-Digital Teachers & Students Struggle)

Based on mobile viewport audits (`360px`–`412px` portrait priority) of the Lab and Nature pages:

1. **Unlabeled Icon-Only Clutter in Top Header (`Header.tsx`)**:
   - In mobile view, the top header packs **9 unlabeled icons** (`[Logo]`, `[🎓]`, `[📖 5]`, `[🔖]`, `[🌲 Alam]`, `[?]`, `[☀️]`, `[ID]`, `[🗑️]`).
   - A science teacher who is not digitally fluent cannot guess what `[🎓]`, `[📖 5]`, or `[🔖]` do without text labels.
2. **Duplicate Circuit Gallery Triggers (DRY UI Violation)**:
   - The Circuit Preset Gallery (`setActiveModal('gallery')`) is duplicated across **three** places on mobile:
     1. Top header `[📖 5]` (`#tour-dropdown-contoh`)
     2. Bottom navigation bar `[⊞ Galeri]` (`#tour-btn-galeri`)
     3. Inside the hub drawer (`MobileHubModal.tsx`)
3. **Invisible Academy Button**:
   - On mobile, the Academy button (`setActiveModal('academy')`) hides its `"Akademi"` text (`hidden sm:inline`), leaving only a tiny `14px` graduation cap icon squeezed next to `[📖 5]`. Users perceive it as a non-clickable decorative badge rather than the main learning curriculum.
4. **Confusing `"Menu 4.0"` Naming & Fragmented Navigation**:
   - Calling the bottom-right drawer `"Menu 4.0"` reads like generic AI buzzword jargon and fails to communicate what is inside.
   - Features are arbitrarily split between the bottom bar (`Galeri`, `Misi`, `Scope`) and the drawer (`Akademi`, `Troubleshoot`, `EBT`, `Tutor`, `Bagikan`).
5. **Ambiguous Nature Mode Toolbar (`OutdoorSandbox.tsx`)**:
   - On mobile, the floating Nature toolbar displays **11 tiny icons in a single horizontal strip** with zero text labels (`hidden md:inline`): `[✋] [🥞] [💧] [🌧️] [🧹] [↺] | [🌅] [☀️] [🌇] | [⚡ 12V] [👁️‍🗨️]`.
   - Students cannot distinguish `[💧]` (Water) from `[🌧️]` (Water Spring / Mata Air), cannot tell that `[🥞]` means Dirt (`+ Tanah`), and do not realize `[⚡ 12V]` is a 1-click button to auto-build a complete Solar + Wind + SUTET power station.
6. **Passive, Forgettable Tutorial (`src/utils/tour.ts`)**:
   - The current `driver.js` spotlight tour is a passive 10-step text-reading sequence where users repeatedly click `"Lanjut"` without performing any action, causing immediate cognitive overload and rapid forgetting.
7. **Static PNG Asset Switch (`SwitchNode.tsx`)**:
   - `SwitchNode.tsx` relies on `/assets/switch-knife.png` and merely squishes the image vertically (`scale-y-90 translate-y-[4px]`) when closed instead of animating a realistic physical knife blade rotation in pure code.

---

## 2. Three Mobile UI Architecture Options (Lab & Nature Pages)

### Option A (Recommended): "Clean Classroom Dock" (5 Labeled Bottom Tabs + 2-Mode Nature Toolbar)
- **Top Header**:
  - Left: Brand Logo.
  - Center: Labeled 2-Mode World Switcher (`[Lab Rangkaian]` | `[Ke Alam]`).
  - Right: Labeled `[? Panduan]` button + `[Reset]` button. (Secondary settings like Theme, Language, Save, and Share move into `Menu Lab`).
- **Bottom Navigation Bar (Zero Duplicates, 100% Labeled)**:
  1. **`+ Alat`** (Komponen Lab / Pembangkit Alam)
  2. **`Akademi`** (Materi & Kuis — promoted to a primary, high-visibility bottom tab!)
  3. **`Contoh`** (5 Rangkaian Siap Pakai — single canonical entry point, eliminating top/bottom duplication)
  4. **`Rumus`** (Nilai V/I/R & Kalkulator PLN)
  5. **`Menu Lab`** (Replaces `"Menu 4.0"` — organizes Misi Praktikum, Oskiloskop/Scope, Tutor Fisika, Lab Korsleting, Simpan, Bagikan, Tema Terang/Gelap, Bahasa ID/EN)
- **Nature Page Toolbar**:
  - Replaces the 11 mystery icons with a **2-Mode Labeled Switcher**:
    - **`[Mode Rangkai]`** vs **`[Ubah Tanah/Air]`** + **`[Pasang PLTS 12V]`** CTA.
    - When `Ubah Tanah/Air` is selected, labeled brush pills appear (`+Tanah`, `+Air`, `+Mata Air`, `Gali`).

### Option B: "Teacher Quick-Bar" (2-Row Header with Dedicated Academy & Contoh Bar)
- Places two large 50%-width buttons (`[AKADEMI & MATERI]` and `[CONTOH RANGKAIAN (5)]`) in a dedicated sub-header row directly below the top bar, paired with a 4-tab bottom navigation bar (`+ Tambah Alat`, `Misi & Kuis`, `Rumus & Biaya`, `Semua Fitur`).

### Option C: "Adaptive Bottom Dock" (100% Clean Nature Sky, All Nature Controls at Bottom)
- Moves all Nature Mode terrain brushes and sun-time buttons out of the sky and into a 2-row contextual bottom dock whenever `worldMode === 'outside'`.

---

## 3. Pure-Code SPST Knife Switch (`SwitchNode.tsx` & `ComponentGlyph.tsx`)

- Eliminates `/assets/switch-knife.png` dependency completely.
- Renders a tactile SVG/CSS SPST Knife Switch (`Saklar Pisau`):
  - Bakelite/slate insulated base block with brass binding posts (`p1` left, `p2` right).
  - Hinged copper knife blade with a red insulated grip that rotates smoothly via CSS transform (`rotate(-32deg)` when `isOpen === true` vs `rotate(0deg)` locked into the right brass jaw when `isOpen === false`).
  - Dynamic current flow glow and contact spark indicator when closed under active current ($I > 0$).
- Time Complexity: $O(1)$ deterministic render with zero network image fetch or alpha-matting overhead.

---

## 4. Creative "Learn-by-Doing" Interactive Tutorial & Teacher Cheat-Sheet

Instead of a passive 10-step tooltip lecture:
1. **Interactive 3-Step Hands-On Mini-Mission ("Praktikum 30 Detik")**:
   - **Step 1 (Sentuh & Nyalakan)**: Prompts the user to physically tap the Knife Switch on the canvas to close the circuit and watch the lamp ignite. Automatically advances when `isOpen` changes to `false`!
   - **Step 2 (Ubah & Amati)**: Prompts the user to tap the Lamp or load a 1-click Series vs. Parallel comparison.
   - **Step 3 (Listrik Alam ke Lab)**: Guides the user to Nature Mode with a 1-click `[Pasang Pembangkit 12V]` action and shows how SUTET powers the Lab for Rp 0 PLN cost.
2. **Visual "Kartu Contekan Guru & Siswa" (1-Tap Action Cards)**:
   - Accessible anytime via `[? Panduan]`, offering visual cards where clicking any card immediately sets up or demonstrates that feature on the canvas.

---

## 5. Implemented Modules & Verification Status (Option A Approved)

Following user approval of **Option A ("Clean Classroom Dock")**, the architecture has been modularized and implemented across the following files:

- **`src/components/ui/common/KnifeSwitchGraphic.tsx`**:
  - Reusable, 100% pure-code SVG + CSS hardware-accelerated SPST Knife Switch graphic (`rotate(-32deg)` open vs `rotate(0deg)` closed) with bakelite base, brass binding posts, copper blade, red insulated grip, and closed current glow.
  - Integrated into `src/components/canvas/nodes/SwitchNode.tsx`, `src/components/ui/palette/ComponentGlyph.tsx`, `src/constants/componentCatalog.ts`, and `src/components/ui/WelcomeModal.tsx`.
- **`src/components/ui/mobile/MobileBottomNav.tsx`**:
  - Implements the 5-tab Option A Classroom Dock (`+ Alat`, `Akademi`, `Contoh`, `Rumus`, `Menu Lab`) with clear two-line labels and zero duplicate Gallery buttons.
- **`src/components/ui/mobile/MobileHubModal.tsx`**:
  - Rebuilt `"Menu Lab & Alat Praktikum"` drawer organizing all secondary classroom tools (`Misi Praktikum`, `Oskiloskop`, `Tutor Fisika`, `Lab Korsleting`, `Lab EBT`, `Simpan`, `Bagikan & QR`, `Tema Terang/Gelap`, `Bahasa ID/EN`, `Panduan Guru`, and `Reset`).
- **`src/components/ui/Header.tsx`**:
  - Implements the Option A mobile top bar with the labeled 2-mode World Switcher (`[Lab Rangkaian]` | `[Alam EBT]`), labeled `[? Panduan]` button, and labeled `[Reset]` button.
- **`src/components/canvas/OutdoorSandbox.tsx`**:
  - Replaces the 11-icon unlabeled toolbar with Option A's 2-Mode Labeled Nature Control Dock (`[Mode Rangkai]` vs `[Ubah Tanah/Air]` + `[Pasang PLTS 12V]`, with labeled time-of-day pills `[Pagi]`, `[Siang]`, `[Sore]`, `[Kirim ke Lab ->]`, and labeled terrain brush pills `[+Tanah]`, `[+Air]`, `[+Mata Air]`, `[+Gali]`, `[Reset]`).
- **`src/tutorial/interactiveTutorialConfig.ts` & `src/components/ui/tutorial/InteractiveTutorialBanner.tsx`**:
  - Implements the 3-step hands-on interactive practice missions with $O(N)$ live state completion detection, 1-click assist actions, and 4 Teacher 1-Click Classroom Setup Cards (`TEACHER_QUICK_CARDS`).
- **`src/tutorial/__tests__/interactiveTutorialConfig.test.ts`**:
  - Unit test suite verifying $O(1)$ mission lookup, $O(N)$ reactive completion detection, 1-click assist actions, Teacher Quick-Cards, and asset-free `switch` catalog configuration.
