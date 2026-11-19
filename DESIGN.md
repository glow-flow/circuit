# Circuit Sandbox Design System (`DESIGN.md`)

> Design Read: Reading this as: Hardware-Instrument Lab interactive DC & renewable-energy circuit simulator for Grade 9 students and non-digital teachers (SMPN 12 Surabaya), in Oscilloscope Bench Dark Mode and Lab Notebook Paper Light Mode, dial ENERGY 2 / RHYTHM 2 / MOTION 2.

## 1. Dials & Liveliness Levers

- **Dial:** `ENERGY 2 / RHYTHM 2 / MOTION 2`
- **One Focal Point Per Screen:** The active simulation canvas (`CircuitCanvas` in Lab Mode, `OutdoorSandbox` in Alam EBT Mode) is always the dominant workspace; sidebars and floating HUDs defer cleanly without stacking on top of components.
- **Hierarchical Contrast:** Tight `font-bold` titles paired with calm slate body labels and aligned `font-mono tabular-nums` electrical readouts (`V`, `A`, `Ohm`, `W`, `Rp`) so live meters never jitter horizontally.
- **Structural Whitespace:** Header navigation groups secondary modal tools into an accessible `Alat Lab` menu on wider viewports and clean responsive tablet drawers (`768px - 1023px`) so the canvas retains at least 60% of horizontal width across desktop and tablet screens.
- **One Deliberate Accent:** Instrument Copper-Amber (`#F59E0B` dark / `#B45309` light) marks energized states, probe focus, and high-attention actions; technical Cobalt (`#38BDF8` dark / `#1D4ED8` light) anchors system navigation; status Emerald (`#34D399` / `#047857`) is reserved for Alam EBT and safe live loops; Danger Red (`#FCA5A5` / `#B91C1C`) is reserved for short circuits, thermal faults, and destructive wire cuts (`R-29`).
- **Identity Motif:** Crisp `1px` instrument calibration borders (`--c-control` / `--c-line`) and terminal polarity tags (`+` / `-`) with inline monochrome telemetry readouts shared across palette tiles, canvas nodes, inspector tabs, and probe readouts.

## 2. Typography (`R-06`, `R-31`)

- **UI Sans (`Plus Jakarta Sans`):** Chosen for clear geometric aperture and reliable diacritic legibility on Indonesian and English Grade 9 physics copy at 11px to 14px sizes, avoiding generic default rosters (`Inter`, `Geist`).
- **Instrument Mono (`IBM Plex Mono`):** Chosen for distinct `0`/`O` and `1`/`I` glyphs across multimeters, oscilloscope waveforms, Ohm's Law substitutions, and PLN electricity tariff estimates. Headings stay in Sans; Mono is scoped to real numeric telemetry, circuit IDs, and equations.

## 3. Dual-Theme Verified WCAG AA Palette (`R-25`, `R-29`, `R-34`)

All pairs below were verified with `.agents/skills/antislop-human/contrast-check.py` (normal text `>= 4.5:1`, non-text controls/borders `>= 3.0:1`):

| Semantic Token | Dark Mode (Oscilloscope Bench) | Dark AA Contrast | Light Mode (Lab Notebook Paper) | Light AA Contrast |
|---|---|---|---|---|
| `void-950` (canvas base) | `#0B0F14` | surface base | `#F5F7FA` | surface base |
| `void-900` (panel / header) | `#111722` | surface base | `#FFFFFF` | surface base |
| `void-850` (elevated card) | `#192231` | surface base | `#EEF2F6` | surface base |
| `void-800` (hover well) | `#222E42` | surface base | `#E2E8F0` | surface base |
| `ink` (primary text) | `#F1F5F9` | 14.58:1 min | `#0F172A` | 15.87:1 min |
| `slate-300` (secondary) | `#CBD5E1` | 10.76:1 min | `#334155` | 9.20:1 min |
| `slate-400` / `500` (muted) | `#94A3B8` | 6.23:1 min | `#475569` | 6.74:1 min |
| `control` (input/btn edge) | `#64748B` | 3.36:1 min (UI) | `#64748B` | 4.23:1 min (UI) |
| `electric-600` fill + `#FFFFFF` | `#1D4ED8` | 6.70:1 | `#1D4ED8` | 6.70:1 |
| `emerald-600` fill + `#FFFFFF` | `#047857` | 5.48:1 | `#047857` | 5.48:1 |
| `danger-600` fill + `#FFFFFF` | `#B91C1C` | 6.47:1 | `#B91C1C` | 6.47:1 |
| `electric-400` text on panel | `#60A5FA` | 6.28:1 min | `#1D4ED8` | 5.96:1 min |
| `amber-400` text on panel | `#FBBF24` | 9.57:1 min | `#92400E` | 6.30:1 min |
| `emerald-400` text on panel | `#34D399` | 8.31:1 min | `#065F46` | 6.83:1 min |
| `red-400` text on panel | `#F87171` | 5.78:1 min | `#991B1B` | 7.39:1 min |
| Focus ring (`:focus-visible`) | `#38BDF8` | 8.38:1 on panel | `#1D4ED8` | 6.70:1 on panel |
| `pure-white` / `white` (non-inverted) | `#FFFFFF` | solid CTA/QR | `#FFFFFF` | solid CTA/QR |

## 4. Purpose-Gate Design Rationale (`R-01` to `R-22`, `R-31`)

- **Color & Surface Hierarchy (`R-01`, `R-34`):** Pure white (`#FFFFFF`), black (`#000000`), and `scrim` (`#04070B`) never invert across themes. UI surfaces adapt through `--c-void-*` and `--c-ink`, eliminating Dark-to-Light button text inversions and inverted QR cards.
- **Glassmorphism Dose Cap (`R-10`, Project Rule Conflict Resolution):** `backdrop-blur` is strictly restricted to at most 2 floating canvas HUD pills (`OutdoorSandbox` panoramic dock and `WireConnectAssistBar`) so the terrain sky remains visible without turning modals, headers, sidebars, or popups into muddy frosted slabs.
- **Shadow & Glow Restraint (`R-12`, `R-13`):** Flat instrument chrome uses crisp 1px borders; shadows are reserved strictly for elevated modal layers and active canvas HUD bars; glow effects are removed from UI badges and cards (kept functional only for live lit bulbs/LEDs and active high-voltage focus rings, <= 2 elements).
- **Radius Discipline (`R-11`):** Workspace panels use 0px docked corners, cards/modals use `rounded-xl` (12px) or `rounded-2xl` (16px), inputs use `rounded-lg` (8px), and only compact segmented status chips or floating docks use pill rounding.
- **Grid Background Purpose (`R-07`):** Dotted canvas grid appears strictly inside the ReactFlow workbench to support magnetic snap alignment and wire routing.
- **Iconography & Arrows (`R-04`, `R-08`):** Technical schematic glyphs (`KnifeSwitchGraphic`, `ComponentGlyph`, functional Lucide circuit icons) convey polarity, waveform, thermal fault, and tool actions; decorative sparkles, stars, and emojis are omitted. Directional arrows appear only on step navigation buttons (`Back` / `Next` / `Continue`).
- **Functional Motion (`R-19`, `MOTION 2`, `R-39`):** Animated CSS electron flow, turbine blade rotation, world cloud transitions, and water short-circuit bursts signal live physical phenomena only, and pause completely under `@media (prefers-reduced-motion: reduce)`.
- **Asset Budget (`R-23`, `R-40`):** Existing `logo-circuit-sandbox.png`, component sprites (`public/assets/` + active `processed/`), and Mascot Watt assets (`public/assets/mascot/`) are preserved; unused orphan PNGs are archived to ignored `assets_backup/`, and heavy PNGs are palette-quantized so `public/assets` stays `< 1.0 MB` with explicit `width`/`height` dimensions.

## 5. Responsive Breakpoints & Canvas HUD Slot Contract (`R-03`)

- **Mobile (`< 768px`):** Compact header (`Logo`, `Lab Rangkaian | Alam EBT`, `Panduan`, `Reset`) + 5-tab bottom navigation (`+ Alat`, `Akademi`, `Contoh`, `Rumus`, `Menu Lab`) + snap bottom sheets. All canvas HUD slots avoid stacking collisions between top bars (`Outdoor` brush dock -> `WireConnectAssistBar` -> `WireActions` / node edit bar) and right/bottom probe readouts.
- **Tablet (`768px - 1023px`):** Header exposes tablet access (`Akademi`, `Contoh`, `Alat Lab` menu, `Simpan`, Theme, Language, `Panduan`, `Reset`) while `SidebarPalette` and `Inspector` open as toggleable side drawers on top of a dominant full-width canvas (keeping `#tour-panel-komponen` / `#tour-panel-inspector` accessible).
- **Desktop (`>= 1024px`):** Fixed docked left Palette (`w-64` on `lg`, `w-72` on `xl`), center canvas, right Inspector (`w-72` on `lg`, `w-80` on `xl`), with desktop header keeping `#tour-dropdown-contoh`, `Akademi`, `Alat Lab` menu (Misi, Lab Korsleting, Microgrid, Tutor, Scope, Bagikan QR), and `#tour-btn-save` cleanly grouped without pill overflow.
