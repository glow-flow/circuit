---
title: Nature Mode 4.0 Engineering Devlog & Bug Resolution Record
tags:
  - hub
  - outdoor-nature
  - physics-engine
  - hardware-node
aliases:
  - Nature Mode 4.0 Devlog
---

# Nature Mode 4.0: Engineering Devlog & Audit Record

Parent Hub: [[README|Circuit Sandbox 4.0 Master Architecture Hub (MOC)]]

This document tracks the multi-phase architecture of **Nature Mode (Alam Terbuka)**, the **Dual-World Quarantine**, **BESS Substation**, **Waterfall Micro-Hydro**, and the full root-cause audit of all simulation and UI edge cases.

---

## 1. Architectural Subsystems Linked to This Session

1. **Dual-World Quarantine (`worldMode`)**:
   - Documented in [[ARCHITECTURE_OUTDOOR_AND_LAB_QUARANTINE]].
   - Enforces strict separation between Outdoor renewable macro-infrastructure and Indoor Lab bench components.
2. **2D Terrain & Hydrological Cellular Automata (`40x20` Grid)**:
   - Documented in [[PHYSICS_TERRAIN_CELLULAR_AUTOMATA]].
   - Implements gravity-settled soil (`DIRT`), grass conversion (`GRASS`), solid cliff bedrock (`ROCK`), stationary mountain springs (`WATER_SPRING`), and fluid cellular automata (`WATER`).
3. **Topographic Microclimate Physics**:
   - Documented in [[PHYSICS_SOLAR_AND_OROGRAPHIC_WIND]].
   - Combines 1D topographic shadow ray-casting ($E_{eff} = E_{base} \cdot 0.15$ when occluded) with Hellmann power-law orographic wind shear ($v(h) = v_0 \cdot (h/h_0)^\alpha$).
4. **Hydroelectrics & Electrochemical Grid Storage**:
   - Documented in [[PHYSICS_MICROHYDRO_AND_BESS_STORAGE]].
   - Implements Pelton turbine mechanics ($P = \eta \rho g Q H$) and 1.0 kWh $\text{LiFePO}_4$ BESS Coulomb counting.
5. **High-Voltage Transmission & PUIL Protection**:
   - Documented in [[HARDWARE_TRANSMISSION_AND_TRAFO_SUTET]] and [[HARDWARE_COMPONENTS_AND_PROTECTION]].
   - Couples outdoor `transmission-tower` nodes to indoor `distribution-panel` nodes across the [[PHYSICS_MNA_SOLVER_AND_TRANSMISSION_GRID|MNA Solver Virtual Grid Bus]].
6. **Industrial Anti-Slop UI & Mobile Ergonomics**:
   - Documented in [[UI_UX_ANTISLOP_AND_MOBILE_ENGINE]] and verified by [[TESTING_AND_VERIFICATION_MATRIX]].

---

## 2. Root-Cause Audit & Fixes Applied in Final Review

### Fix A: Pure Candidate Probing for Outdoor Palette Placement
- **Symptom**: Clicking *"Taruh di Kanvas"* (`handlePlace` in `SidebarPalette.tsx`) for `bess-substation` after spawning the 12V Power Station caused false water explosions or false success toasts when nearby candidates overlapped existing nodes or touched the river (`cols 24..32`).
- **Root Cause**: `SidebarPalette.tsx` invoked the side-effecting `placeOutdoorComponent` store action inside a candidate search loop, and `computeOutdoorSpawnCandidates` (`src/utils/canvasSpawnPosition.ts`) did not filter out water-hazard columns for non-hydro components.
- **Resolution**:
  - `computeOutdoorSpawnCandidates` now inspects `findTerrainSurfaceY(...).hitWater` and prioritizes dry terrace coordinates for all non-water-immune components, including stage-wide terrace anchors (`x = 630, 440, 240, 40, 1140`).
  - `SidebarPalette.tsx` now probes candidates using the pure `evaluateComponentDropPhysics` function (`status === 'settled'`) before calling `placeOutdoorComponent` once, and only fires the placement toast when `placedSuccessfully === true`.

### Fix B: Micro-Hydro River Contact vs. Manual Valve Override & Dry-Land Reset
- **Symptom**:
  1. Dragging a `hydro-turbine` from the river (`col 27`, `100%` flow) onto dry land (`col 6`) left `waterFlowRate` stuck at `100%` (`11.9V`, `238 RPM` on bone-dry land).
  2. Dragging the `Debit Aliran Air (Q)` slider inside `HydroTurbineNode.tsx` while the turbine was in the river had no effect because `applyTerrainMicroclimateToNodes` immediately overwrote `waterFlowRate` back to `waterFlow.flowPercentage` (`100%`).
- **Resolution**:
  - Added `manualWaterFlowRate?: number` to `CircuitElementData` (`src/types/circuit.ts`).
  - In `applyTerrainMicroclimateToNodes` (`src/physics/terrainClimateEngine.ts`), when `manualWaterFlowRate` is set by the user's valve slider, it takes precedence; otherwise, flow is `waterFlow.flowPercentage` when `waterFlow.hasWaterContact === true` and strictly `0` on dry land.
  - In `settleOutdoorNodeAfterDrag` (`src/store/useCircuitStore.ts`), `manualWaterFlowRate` is cleared (`undefined`) whenever a node settles at a new terrain coordinate so moving between river and dry land immediately reflects physical terrain contact.

### Fix C: Right-Hand Inspector Controls (`InspectorPropertiesTab.tsx`)
- **Resolution**:
  - Updated the Solar Panel irradiance slider to write `baseSunlight: val, sunlight: val` so `applyTerrainMicroclimateToNodes` preserves the user's slider setting.
  - Added full Inspector property controls for `bess-substation` (SoC slider + 1000 Wh Recharge button), `hydro-turbine` (Water Flow Q & Hydraulic Head H sliders), and `distribution-panel` (MCB breaker switch + DC Step-Down voltage selector).

---

## 3. Related Vault Nodes

- [[README]]
- [[ARCHITECTURE_OUTDOOR_AND_LAB_QUARANTINE]]
- [[PHYSICS_MNA_SOLVER_AND_TRANSMISSION_GRID]]
- [[PHYSICS_TERRAIN_CELLULAR_AUTOMATA]]
- [[PHYSICS_SOLAR_AND_OROGRAPHIC_WIND]]
- [[PHYSICS_MICROHYDRO_AND_BESS_STORAGE]]
- [[HARDWARE_COMPONENTS_AND_PROTECTION]]
- [[HARDWARE_TRANSMISSION_AND_TRAFO_SUTET]]
- [[PEDAGOGY_ACADEMY_AND_EXPLAINABLE_TUTOR]]
- [[UI_UX_ANTISLOP_AND_MOBILE_ENGINE]]
- [[TESTING_AND_VERIFICATION_MATRIX]]
