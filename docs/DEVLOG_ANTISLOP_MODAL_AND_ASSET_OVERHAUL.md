---
title: Anti-Slop Modal Architecture, DRY Refactoring & 5-Screen Audit Devlog
tags:
  - ui-antislop
  - hub
  - pedagogy
  - hardware-node
aliases:
  - Anti-Slop 5-Screen Audit
  - Modal DRY Refactoring Devlog
---

# Anti-Slop Modal Architecture, DRY Refactoring & 5-Screen Audit Devlog

Parent Hub: [[README|Circuit Sandbox 4.0 Master Architecture Hub (MOC)]]  
Related Docs: [[UI_UX_ANTISLOP_AND_MOBILE_ENGINE]], [[ASSET_PIPELINE_NANO_BANANA_AND_ALPHA_MATTING]], [[PEDAGOGY_ACADEMY_AND_EXPLAINABLE_TUTOR]], [[DEVLOG_SESSION_NATURE_MODE_4.0]]

---

## 1. Design Read & Calibration (`ENERGY 2 / RHYTHM 2 / MOTION 1`)

Following a comprehensive mobile screenshot audit across 5 core application screens, we executed a full `/antislop` overhaul guided by the **Tactile Hardware-Instrument Visual Language** (inspired by Tektronix benchtop meters and Dieter Rams / Braun industrial panels):

- **Single Primary Interactive Accent (`R-01`, `R-29`)**: Standardized all navigation tabs, active states, and primary CTAs onto `electric-500` (`#38bdf8`) over deep neutral slate surfaces (`void-950` / `void-900`), purging multi-color rainbow cards, neon box-shadows, and decorative capsule badges.
- **Typography & Scannable Hierarchy (`R-06`)**: Paired `'Geist', 'Inter', system-ui` (`tracking-tight`, `leading-[1.15]`) for educational prose with `'JetBrains Mono'` strictly reserved for equations, live telemetry (`V`, `A`, `Ω`, `W`), and SNI/IEC standard codes.
- **Zero Em-Dashes & Zero Decorative Emojis (`R-02`, `R-04`)**: Purged all em-dashes and decorative emojis (`🔥`, `📚`, `★`) across 14 UI modules.

---

## 2. DRY Modularization & $O(1)$ Algorithmic Optimizations

To prevent bloated component files and enforce **Don't Repeat Yourself (DRY)** engineering principles:

1. **Shared Industrial Modal Header (`src/components/ui/common/LabModalHeader.tsx`)**:
   - Replaces duplicated header markup across `ExplainableTutorModal.tsx`, `AcademyModal.tsx`, `CreditsModal.tsx`, and `RenewableLabModal.tsx`.
   - Removes glowing left-hand icon boxes and `CIRCUIT 4.0` capsule pills, providing an optional monochrome technical eyebrow, a `rightSlot` for view switchers, and a `44x44px` WCAG AA close button in $O(1)$ render complexity.
2. **Extracted Science Validation & 19 Datasheet Citations (`src/components/ui/credits/CreditsScienceReferenceSection.tsx`)**:
   - Extracted 230+ lines of SNI/IEC/PUIL reference tables and expandable accordions out of `CreditsModal.tsx`, reducing `CreditsModal.tsx` by over 60%.
3. **Extracted Microgrid Power Flow Panel (`src/components/ui/renewable/MicrogridBalancePanel.tsx`)**:
   - Separated the 5-column real-time power balance telemetry grid (`Solar PV`, `Wind Turbine`, `Common DC Bus`, `BESS Storage`, `Consumer Load`) from the interactive simulation controls in `RenewableLabModal.tsx`.
4. **$O(1)$ Set-Based Curriculum Progress Lookups (`AcademyModal.tsx`)**:
   - Replaced repeated `.includes()` array scans inside lesson and badge render loops with memoized `Set` instances (`completedLessonSet`, `unlockedBadgeSet`), guaranteeing $O(1)$ lookup per item.

---

## 3. Screen-by-Screen Root-Cause Audit & Resolution

### Screen #1: Explainable Physics Tutor (`ExplainableTutorModal.tsx`)
- **Slop Symptoms**: Glowing blue calculator box in header, 4 rainbow telemetry pills (`Vs: 0V`, `Req: 0.0Ω`, `I: 0.0mA`, `P: 0W`) displayed even when the canvas was completely empty, truncated summary sentence (`...unt...`), and a dead-end empty state with `0` count pills on every tab.
- **Resolution**:
  - Hid the telemetry readout strip when `analysis.topology === 'empty'`.
  - Removed text truncation on the topology summary and replaced the dead-end empty box with an **Actionable Empty State** featuring a one-tap *"Muat Rangkaian Contoh (Hukum Ohm)"* (`loadPreset('series_basic')`) CTA button.

### Screen #2: Circuit Academy (`AcademyModal.tsx`)
- **Slop Symptoms**: 4 rainbow stat cards (`Award` blue, `Zap` yellow, `CheckCircle2` green, `Flame` orange + duplicate `🔥` emoji), crowded `IPA Kelas 9 & SMK` header pill, and a blue `★ REKOMENDASI BERIKUTNYA` box stacked directly above the identical blue lesson card for *Hukum Ohm & Aliran Arus Listrik*.
- **Resolution**:
  - Replaced the 4 rainbow icon cards with a clean, single-accent 4-column monospace telemetry strip (`Tingkat`, `Pengalaman`, `Selesai`, `Konsistensi`).
  - Removed the duplicate recommendation banner above the lesson list and integrated a concise `Selanjutnya` / `Up Next` badge directly inside the recommended lesson card.

### Screen #3: Developers & Contributors (`CreditsModal.tsx`)
- **Slop Symptoms**: Multi-color neon glow borders per person (blue glow for Kenzie, green glow + green `★` sub-box for Achmad Sandy, amber pill for Advisor Ibu Uki) and `📚` emojis on every datasheet citation.
- **Resolution**:
  - Implemented an **Editorial Roster Layout**: unified `bg-void-950 border-white/10` cards (with subtle `border-electric-500/35` for the Team Lead), left-bordered editorial callout for massive contributor notes, and clean monospace badges including `Nano Banana 2.1` and `Google Antigravity (Harness Rekayasa)`.

### Screen #4: Renewable Energy & Microgrid Digital Twin (`RenewableLabModal.tsx`)
- **Slop Symptoms**: Squished mobile header (vertically stretched `Sun` icon pill, 3-line wrapped title, `CIRCUIT 4.0` badge, floating green `Trees` icon button next to `X`) and a 6-card scenario grid with truncated titles (`...`) followed immediately by a large banner repeating the selected scenario title and `60W Load` pill.
- **Resolution**:
  - Adopted `LabModalHeader` and merged the 6-card grid + duplicate banner into a unified **Scenario Selector & Integrated Deployment Dock** with full untruncated titles and a single *"Pasang Pembangkit di Alam Terbuka"* CTA bar.

### Screen #5: Component Palette & Canvas Hardware Nodes (`usePaletteBrowser.ts`, `PaletteTile.tsx`, `PaletteDetailBar.tsx`)
- **Slop Symptoms**: `Panel Distribusi Lab` rendered a neon 4-color code SVG over a dot-grid because `usePaletteBrowser.ts` line 98 overrode `transmission-tower` in `lab` mode with `image: undefined, glyph: 'distribution-panel'`. Additionally, `switch`, `voltmeter`, `ammeter`, and `ground` lacked physical PNG assets, and `PaletteDetailBar.tsx` clipped component descriptions to a single line on mobile.
- **Resolution**:
  - Wired `/assets/distribution-panel.png` in `usePaletteBrowser.ts` and connected all 5 new [[ASSET_PIPELINE_NANO_BANANA_AND_ALPHA_MATTING|Nano Banana 2.1 hardware PNGs]] across `componentCatalog.ts`, `VoltmeterNode.tsx`, `AmmeterNode.tsx`, `GroundNode.tsx`, `SwitchNode.tsx`, and `PresetThumbnail.tsx` with explicit `width`/`height` attributes (`R-40`) and defensive `onError` fallbacks (`R-27`).

---

## 4. Connected Knowledge Nodes

- [[README]]
- [[UI_UX_ANTISLOP_AND_MOBILE_ENGINE]]
- [[ASSET_PIPELINE_NANO_BANANA_AND_ALPHA_MATTING]]
- [[DEVLOG_SESSION_NATURE_MODE_4.0]]
- [[PEDAGOGY_ACADEMY_AND_EXPLAINABLE_TUTOR]]
- [[TESTING_AND_VERIFICATION_MATRIX]]
