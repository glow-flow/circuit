---
title: Anti-Slop Industrial UI Design System & Mobile 60fps Engine
tags:
  - ui-antislop
  - architecture
aliases:
  - Anti-Slop UI System
  - Mobile 60fps Engine
---

# Anti-Slop Industrial UI Design System & Mobile 60fps Engine

Parent Hub: [[README|Circuit Sandbox 4.0 Master Architecture Hub (MOC)]]  
Related Devlog: [[DEVLOG_SESSION_NATURE_MODE_4.0]]

---

## 1. Anti-Slop Industrial Engineering Aesthetic (`/antislop`)

Circuit Sandbox 4.0 strictly enforces an industrial instrumentation aesthetic inspired by hardware oscilloscopes and SCADA microgrid consoles:

- **Zero AI-Slop Visual Clutter**:
  - Zero `Sparkles` icons, zero purple/violet neon gradients (`purple-*` / `violet-*` purged across the entire UI), zero decorative emojis in toast notifications or buttons, and zero AI-prose em-dashes in UI copy.
- **Calibrated Telemetry Color Semantics**:
  - **Deep Slate Base (`void-950` / `void-900`)**: Low-glare dark instrumentation background.
  - **Electric Sky / Cyan (`electric-400` / `cyan-400`)**: Primary interactive controls, active current telemetry, and hydro/wind flow.
  - **Amber (`amber-400`)**: Solar irradiance and thermal/filament warnings.
  - **Emerald (`emerald-400`)**: Closed switches, normal operating state, and [[PHYSICS_MICROHYDRO_AND_BESS_STORAGE|BESS State of Charge]].
  - **Red (`red-400`)**: Short-circuit hazards and [[HARDWARE_COMPONENTS_AND_PROTECTION|PUIL MCB Trips]].
- **Tactile Physics & Typography**:
  - All interactive controls implement physical scale feedback (`active:scale-95`), `tabular-nums` monospace telemetry readouts, and WCAG AA contrast ratios.

---

## 2. Mobile 60fps Viewport & Touch Ergonomics

- **Dynamic Viewport Sizing (`h-[100dvh]`)**: Eliminates mobile browser address-bar layout jumps.
- **Unified DRY Component Palette & Inspector**:
  - `SidebarPalette.tsx` and `PropertyInspector.tsx` share a single modular body across desktop sidebars and mobile bottom-sheet drawers (`MobileBottomNav.tsx`).
- **Camera-Centered Spawn & Pure Physics Probing (`src/utils/canvasSpawnPosition.ts`)**:
  - Places new components directly in the user's current scroll/pan viewport while purely probing [[PHYSICS_TERRAIN_CELLULAR_AUTOMATA|terrain drop physics]] so placement never triggers accidental water or height explosions.
- **Mobile Modal Control Ergonomics & Anti-Collision (`360px` Portrait Invariant)**:
  - Verified on real-world mobile viewports by Lead Mobile Tester **Achmad Sandy Pratama**: modal control bars containing `<select>` dropdowns alongside secondary action buttons (such as `OscilloscopeModal.tsx`) must stack vertically on mobile (`flex-col sm:flex-row items-stretch sm:items-center`) with bounded select widths (`w-full sm:w-auto min-w-0 truncate`) so labels (`"Target Probe:"`) and buttons (`Jeda` / `Pause`) never collide or clip.
- **Strict Bilingual (`id` / `en`) Localization Architecture**:
  - Every modal (`CreditsModal.tsx`, `OscilloscopeModal.tsx`, `AcademyModal.tsx`, etc.) enforces 100% language parity without English copy leakage in Indonesian mode (`language === 'id'`).
  - Dynamic component labels across canvas nodes, inspector headers, and oscilloscope probe dropdowns resolve in $O(1)$ time via `getComponentDisplayName(node.data, language)` in `src/utils/nodeLocalization.ts`.

---

## 3. Shared DRY Modal Architecture & Tactile Hardware Assets

- **Unified `LabModalHeader.tsx` (`src/components/ui/common/LabModalHeader.tsx`)**:
  - Eliminates duplicated modal header code across `ExplainableTutorModal.tsx`, `AcademyModal.tsx`, `CreditsModal.tsx`, and `RenewableLabModal.tsx` (documented in [[DEVLOG_ANTISLOP_MODAL_AND_ASSET_OVERHAUL]]).
  - Replaces glowing icon boxes and decorative `CIRCUIT 4.0` capsule badges with clean typographic hierarchy (`leading-[1.15]`), optional monochrome technical eyebrows, and `44x44px` accessible close buttons.
- **Tactile Hardware PNG Assets via Nano Banana 2.1**:
  - All code-generated neon `<svg>` icons in the component palette and canvas nodes (`switch`, `voltmeter`, `ammeter`, `ground`, `distribution-panel`, and `logo-circuit-sandbox`) have been replaced with semi-realistic 2D hardware illustrations processed via the [[ASSET_PIPELINE_NANO_BANANA_AND_ALPHA_MATTING|BFS Exterior Flood-Fill & Slit-Guard Alpha-Matting Pipeline]].
  - Every `<img>` element enforces explicit `width` and `height` attributes (`R-40`) to prevent Cumulative Layout Shift (CLS) and includes a defensive `onError` structural fallback (`R-27`).

- **Pure-Code SPST Knife Switch (`src/components/ui/common/KnifeSwitchGraphic.tsx`)**:
  - The SPST Knife Switch (`switch`) renders 100% in pure SVG + CSS (`KnifeSwitchGraphic.tsx`) with zero external PNG asset dependency, featuring a bakelite base, brass binding posts, a pivoting copper knife blade (`rotate(-32deg)` open vs `rotate(0deg)` closed), red insulated grip, and closed current glow.

---

## 4. Teacher-First Mobile Classroom Dock (Option A) & Interactive Tutorial

Documented in detail in [[UX_TEACHER_FIRST_OVERHAUL_AND_TUTORIAL_PLAN]]:

- **Option A Mobile Bottom Navigation (`src/components/ui/mobile/MobileBottomNav.tsx`)**:
  - Replaces the 6-tab icon bar and `"Menu 4.0"` jargon with 5 clearly labeled classroom tabs (`+ Alat`, `Akademi`, `Contoh`, `Rumus`, `Menu Lab`) with subtitles and zero duplicate Gallery triggers.
- **Option A Mobile Top Header (`src/components/ui/Header.tsx`)**:
  - Features a labeled 2-Mode World Switcher (`[Lab Rangkaian]` | `[Alam EBT]`), labeled `[? Panduan]` button, and labeled `[Reset]` button on mobile (`360px`–`412px`).
- **2-Mode Labeled Nature Control Dock (`src/components/canvas/OutdoorSandbox.tsx`)**:
  - Replaces the 11-icon unlabeled strip with a 2-row labeled dock: Row 1 provides `[Mode Rangkai]` vs `[Ubah Tanah/Air]` + `[Pasang PLTS 12V]`, while Row 2 contextually displays labeled Sun Time pills (`[Pagi]`, `[Siang]`, `[Sore]`, `[Kirim ke Lab ->]`) or labeled Terrain Brush pills (`[+Tanah]`, `[+Air]`, `[+Mata Air]`, `[+Gali]`, `[Reset]`).
- **Interactive "Learn-by-Doing" Tutorial & Teacher Quick-Cards (`src/tutorial/interactiveTutorialConfig.ts`, `src/components/ui/tutorial/InteractiveTutorialBanner.tsx`, `src/components/ui/WelcomeModal.tsx`)**:
  - Provides 3 hands-on practice missions with $O(N)$ live state completion detection and 1-click assist buttons, plus 4 Teacher 1-Click Classroom Setup Cards (`basic-switch`, `series-parallel`, `nature-ebt`, `short-circuit`).

---

## 5. Connected Knowledge Nodes

- [[README]]
- [[PHYSICS_LENS_XRAY_AND_SCIENTIFIC_AUDIT]]
- [[UX_TEACHER_FIRST_OVERHAUL_AND_TUTORIAL_PLAN]]
- [[DEVLOG_SESSION_NATURE_MODE_4.0]]
- [[DEVLOG_ANTISLOP_MODAL_AND_ASSET_OVERHAUL]]
- [[ASSET_PIPELINE_NANO_BANANA_AND_ALPHA_MATTING]]
- [[ARCHITECTURE_OUTDOOR_AND_LAB_QUARANTINE]]
- [[PHYSICS_TERRAIN_CELLULAR_AUTOMATA]]
- [[PEDAGOGY_ACADEMY_AND_EXPLAINABLE_TUTOR]]
- [[TESTING_AND_VERIFICATION_MATRIX]]
