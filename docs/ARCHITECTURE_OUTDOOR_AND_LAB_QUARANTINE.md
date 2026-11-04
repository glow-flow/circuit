---
title: Dual-World Quarantine & Virtual Grid Bus Architecture
tags:
  - architecture
  - outdoor-nature
  - hardware-node
  - protection-puil
aliases:
  - Dual-World Quarantine
  - Lab vs Outdoor Quarantine
---

# Dual-World Quarantine & Virtual Grid Bus Architecture

Parent Hub: [[README|Circuit Sandbox 4.0 Master Architecture Hub (MOC)]]  
Related Devlog: [[DEVLOG_SESSION_NATURE_MODE_4.0]]

---

## 1. Strict Component Quarantine (`worldMode`)

Circuit Sandbox 4.0 operates two physically distinct simulation environments that share a single deterministic [[PHYSICS_MNA_SOLVER_AND_TRANSMISSION_GRID|MNA Linear Circuit Solver]] state while enforcing strict spatial and palette quarantine:

| Environment | `worldMode` | Permitted Components | Excluded Components |
| :--- | :--- | :--- | :--- |
| **Alam Terbuka (Outdoor Sandbox)** | `'outside'` | `solar-panel`, `wind-turbine`, `hydro-turbine`, `bess-substation`, `transmission-tower` | All indoor bench components (`battery`, `battery9v`, `battery-holder`, `bulb`, `socket`, `resistor`, `switch`, `voltmeter`, `ammeter`) |
| **Laboratorium (Indoor Bench)** | `'lab'` | `battery`, `battery9v`, `battery-holder`, `distribution-panel` (via palette ID `transmission-tower`), `bulb`, `socket`, `resistor`, `switch`, `voltmeter`, `ammeter` | All outdoor macro-generators & grid batteries (`solar-panel`, `wind-turbine`, `hydro-turbine`, `bess-substation`) |

### Defense-in-Depth Enforcement Layers

1. **Palette Filtering (`src/components/ui/palette/usePaletteBrowser.ts`)**:
   - `OUTDOOR_ALLOWED_ENTRY_IDS`: Restricts the Outdoor palette exclusively to the 5 macro-grid entries (`solar-panel`, `wind-turbine`, `transmission-tower`, `bess-substation`, `hydro-turbine`).
   - `LAB_EXCLUDED_ENTRY_IDS`: Hides `solar-panel`, `wind-turbine`, `bess-substation`, and `hydro-turbine` when `worldMode === 'lab'`.
   - Dynamic morphing of `transmission-tower`: Appears as **Menara Transmisi** (`transmission-tower`) in Outdoor Mode and morphs into **Panel Distribusi Lab** (`distribution-panel`) in Lab Mode.
2. **Store Guard (`isOutdoorOnlyComponent` in `src/types/circuit.ts` & `src/store/useCircuitStore.ts`)**:
   - Rejects any programmatic or drag-drop attempt to spawn an outdoor-only component when `worldMode === 'lab'`.
   - Tags every node with `data.worldMode` (`'outside'` or `'lab'`).
3. **Canvas Render Quarantine (`src/components/canvas/CircuitCanvas.tsx` & `OutdoorSandbox.tsx`)**:
   - `CircuitCanvas.tsx` filters `nodes` by `!isOutdoorOnlyComponent(n.data.type) && n.data.worldMode !== 'outside'`.
   - `OutdoorSandbox.tsx` filters `nodes` by `isOutdoorOnlyComponent(n.data.type) || n.data.worldMode === 'outside'`.
4. **Preset & Save File Sanitization (`src/utils/presetStorage.ts`)**:
   - Automatically normalizes legacy/imported JSON blueprints so outdoor generators are assigned `worldMode: 'outside'` and never leak onto the Lab bench.

---

## 2. Cross-World Virtual Grid Bus Coupling

How does electrical power generated in **Alam Terbuka** reach loads inside **Laboratorium** without violating component quarantine?

- Outdoor generators ([[PHYSICS_SOLAR_AND_OROGRAPHIC_WIND|Solar Panels, Wind Turbines]], [[PHYSICS_MICROHYDRO_AND_BESS_STORAGE|Micro-Hydro Turbines, and BESS Substations]]) wire into an Outdoor **Menara Transmisi** (`transmission-tower`).
- Inside [[PHYSICS_MNA_SOLVER_AND_TRANSMISSION_GRID|mnaSolver.ts]], all active `transmission-tower` and `distribution-panel` nodes are coupled via a **Virtual Transmission Bus** modeled with realistic overhead line resistance ($R_{line} = 4.0\,\Omega$ by default) and optional [[HARDWARE_TRANSMISSION_AND_TRAFO_SUTET|Gardu Trafo Cantol SUTET Step-Up (12V to 240V)]].
- Inside the Lab, students wire their circuits from the **Panel Distribusi Lab** (`distribution-panel`), protected by a [[HARDWARE_COMPONENTS_AND_PROTECTION|PUIL Thermal/Magnetic MCB Breaker]] and a configurable DC Step-Down Regulator (`Auto`, `3V`, `6V`, `9V`, `12V`).

---

## 3. Connected Knowledge Nodes

- [[README]]
- [[DEVLOG_SESSION_NATURE_MODE_4.0]]
- [[PHYSICS_MNA_SOLVER_AND_TRANSMISSION_GRID]]
- [[PHYSICS_MICROHYDRO_AND_BESS_STORAGE]]
- [[HARDWARE_TRANSMISSION_AND_TRAFO_SUTET]]
- [[HARDWARE_COMPONENTS_AND_PROTECTION]]
- [[TESTING_AND_VERIFICATION_MATRIX]]
