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

## 3. Connected Knowledge Nodes

- [[README]]
- [[DEVLOG_SESSION_NATURE_MODE_4.0]]
- [[ARCHITECTURE_OUTDOOR_AND_LAB_QUARANTINE]]
- [[PHYSICS_TERRAIN_CELLULAR_AUTOMATA]]
- [[PEDAGOGY_ACADEMY_AND_EXPLAINABLE_TUTOR]]
- [[TESTING_AND_VERIFICATION_MATRIX]]
