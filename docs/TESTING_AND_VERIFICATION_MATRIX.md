---
title: Deterministic Vitest Verification Matrix (307 Tests)
tags:
  - architecture
  - physics-engine
  - protection-puil
  - outdoor-nature
aliases:
  - Verification Matrix
  - Unit Test Suite
---

# Deterministic Vitest Verification Matrix (307 Tests)

Parent Hub: [[README|Circuit Sandbox 4.0 Master Architecture Hub (MOC)]]  
Related Devlog: [[DEVLOG_SESSION_NATURE_MODE_4.0]]

---

## 1. Test Suite Architecture (`npx vitest run --no-isolate`)

All physics engines, store actions, quarantine boundaries, and pedagogical validators are verified by **43 deterministic test suites** (`307` individual assertions):

| Subsystem | Primary Test Suites | Verified Invariants |
| :--- | :--- | :--- |
| **Dual-World Quarantine** | `outdoorModeStrictIsolation.test.ts`, `usePaletteBrowser.test.ts`, `componentCatalog.test.ts` | Strict separation of `'outside'` vs `'lab'` nodes, palette filtering, preset sanitization |
| **MNA Solver & Grid Bus** | `mnaSolver.test.ts`, `transmissionPhysics.test.ts`, `virtualGridAndWindTurbine.test.ts` | $Ax = z$ accuracy, virtual grid coupling, $240\,\text{V}$ step-up Joule loss reduction, Schottky diodes |
| **2D Terrain & Microclimate** | `terrainGrid.test.ts`, `terrainClimateEngine.test.ts`, `anchoredSunAndRiverbed.test.ts`, `solarPanelStore.test.ts` | World-anchored sun finite ray-casting, surface-hugging shadow bands, Hellmann wind shear, gravity drop tolerance |
| **Micro-Hydro & BESS** | `bessAndHydro.test.ts`, `anchoredSunAndRiverbed.test.ts`, `batterySoC.test.ts` | $P = \eta \rho g Q H$, `208x208` riverbed settling (`row 18`), `measureSubmergedDepthPx`, manual valve override, dry-land 0V reset |
| **Spawn & Mobile UI** | `canvasSpawnPosition.test.ts`, `outdoorSpawnUtils.test.ts` | Camera-centered spawn coordinates, dry-terrace candidate prioritization, non-overlapping power station layout |
| **Pedagogy & Protection** | `explainableTutor.test.ts`, `academyProgress.test.ts`, `troubleshootingValidation.test.ts`, `missionValidator.test.ts` | KCL/KVL proof generation, PUIL MCB trip & one-tap jumper cut recovery |

---

## 2. Connected Knowledge Nodes

- [[README]]
- [[DEVLOG_SESSION_NATURE_MODE_4.0]]
- [[ARCHITECTURE_OUTDOOR_AND_LAB_QUARANTINE]]
- [[PHYSICS_MNA_SOLVER_AND_TRANSMISSION_GRID]]
- [[PHYSICS_TERRAIN_CELLULAR_AUTOMATA]]
- [[PHYSICS_SOLAR_AND_OROGRAPHIC_WIND]]
- [[PHYSICS_MICROHYDRO_AND_BESS_STORAGE]]
- [[HARDWARE_COMPONENTS_AND_PROTECTION]]
- [[HARDWARE_TRANSMISSION_AND_TRAFO_SUTET]]
- [[PEDAGOGY_ACADEMY_AND_EXPLAINABLE_TUTOR]]
- [[UI_UX_ANTISLOP_AND_MOBILE_ENGINE]]
