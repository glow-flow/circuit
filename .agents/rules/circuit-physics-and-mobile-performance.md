---
description: Strict guidelines for physics spatial anchoring, mobile asset budgets, and outdoor canvas UI/UX.
always_on: true
---

# Circuit Physics Anchoring & Mobile Performance Guidelines

## 1. Physics Bounding Box & DOM Calibration Invariant
- **Rule**: Every canvas node must have its visual DOM container height strictly calibrated to match its entry in `COMPONENT_DIMENSIONS` in `src/physics/terrainGrid.ts`.
- **Ground Offset**: Always use `groundOffset = 0` when settling outdoor components on terrain surfaces. Never introduce arbitrary pixel sinking offsets that submerge mounting stakes or electrical terminals into dirt layers.
- **Terminal Clearance**: Source and target handles (positive/negative terminals) must always remain visually elevated above the terrain turf line so users can effortlessly drag wires on mobile touchscreens.

## 2. Terrain Slope Footprint Sampling
- **Rule**: When querying `findTerrainSurfaceY`, wide components with overhanging structures (such as wind turbine blades or solar panel tilt wings) must NOT sample their full visual bounding box width across terrain columns.
- **Footprint Anchor**: Sample strictly the physical ground contact zone:
  - `wind-turbine`: Central mast footprint ($0.42 - 0.58$ of width).
  - `solar-panel`: Support stakes footprint ($0.35 - 0.65$ of width).
  - This prevents premature cliff drops or floating bases when placed near terrain slopes.

## 3. Mobile Cold Load & Static Asset Budget
- **Budget**: Total static asset payload in `public/assets/` must NEVER exceed 1.0 MB.
- **Optimization Pipeline**: All photographic or rendered sprites must be resampled and quantized (PNG-8 / LANCZOS palette quantization) with unreferenced source backups kept strictly outside `public/` in an ignored directory (`assets_backup/`).
- **HTTP Caching**: All static assets must be served with immutable caching headers (`Cache-Control: public, max-age=31536000, immutable`) defined in `vercel.json`.

## 4. Anti-Slop Mobile Panoramic UI/UX
- **Screen Real Estate**: On mobile portrait screens, top floating UI controls must never stack into multiple opaque bars. Total vertical consumption must not exceed 60px.
- **Floating Island Dock**: Consolidate toolbars into a single-row translucent glass pill dock (`bg-void-950/90 backdrop-blur-xl border border-white/20`).
- **Scenic Mode Requirement**: Always provide a one-tap scenic view toggle (`Eye` / `EyeOff`) that collapses toolbars into a minimal badge, granting users 100% unobstructed view of the canvas, sky, and landscape.
- **Tactile Transitions**: Touch targets must be $\ge 44 \times 44\text{px}$ with `active:scale-95` tactile click feedback.

## 5. Mobile Modal Control Bars & Dropdown Anti-Collision (`360px` Viewport Invariant)
- **No Sibling Select Collision**: Never place a `flex-1` `<select>` dropdown and a secondary action toolbar on the same horizontal flex row on mobile without explicit vertical stacking (`flex-col sm:flex-row items-stretch sm:items-center`).
- **Bounded Select Widths**: Every `<select>` inside a modal or toolbar must use `w-full sm:w-auto min-w-0 truncate` so long `<option>` labels never blow out flex containers or clip adjacent labels (such as `"Target Probe:"`).
- **Localized Select Options**: Component selector `<option>` elements must always resolve labels through `getComponentDisplayName(node.data, language)` from `src/utils/nodeLocalization.ts` instead of rendering raw `node.data.label` or `node.data.type`.

## 6. Strict Bilingual Localization Completeness (`isId` Audit Gate)
- **Zero Untranslated English Leakage in `id` Mode**: Before marking any UI modal, card, or feature complete, audit every text node, paragraph, role title, badge, `<option>` label, chip (`ALL` / `SEMUA`, `Peak` / `Puncak`), and `aria-label`/`title` attribute to ensure 100% parity between `language === 'id'` and `language === 'en'`.
- **No Bilingual Duplication in Single-Language Mode**: When `isId` is active, render strictly the Indonesian copy (and strictly English when `!isId`) rather than leaving untranslated English paragraphs stacked above Indonesian translations.
- **Catalog & Localization Sync**: Every new `ComponentType` added to the simulation must simultaneously register its default `id` and `en` display names in `DEFAULT_LABEL_PAIRS` within `src/utils/nodeLocalization.ts`.
