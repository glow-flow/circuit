---
title: Deterministic Vitest Verification Matrix (360 Tests)
tags:
  - architecture
  - physics-engine
  - protection-puil
  - outdoor-nature
aliases:
  - Verification Matrix
  - Unit Test Suite
---

# Deterministic Vitest Verification Matrix (360 Tests)

Parent Hub: [[README|Circuit Sandbox 4.0 Master Architecture Hub (MOC)]]  
Related Devlogs: [[DEVLOG_SESSION_NATURE_MODE_4.0]], [[DEVLOG_ANTISLOP_MODAL_AND_ASSET_OVERHAUL]], [[PHYSICS_LENS_XRAY_AND_SCIENTIFIC_AUDIT]]

---

## 1. Test Suite Architecture (`npx vitest run`)

All physics engines, store actions, quarantine boundaries, hardware asset bindings, and pedagogical validators are verified across **52 deterministic test files** (**360 tests**):

| Subsystem | Primary Test Suites | Verified Invariants |
| :--- | :--- | :--- |
| **Physics X-Ray Lens & Audit** | `physicsLensEngine.test.ts`, `physicsLensStore.test.ts`, `scientificAuditFixes.test.ts`, `wireEdgePhysics.test.ts`, `PinSocketNode.test.ts` | FLIR thermal Joule dissipation, wired ground MNA pin potentials, Dual-Probe $\Delta V$, fitted-bulb `resolveLensNodeAnchorBox` bounds, Probe popover/select lock, LED $V_f$ knee & energy conservation |
| **Dual-World Quarantine** | `outdoorModeStrictIsolation.test.ts`, `usePaletteBrowser.test.ts`, `componentCatalog.test.ts` | Strict separation of `'outside'` vs `'lab'` nodes, palette filtering, preset sanitization |
| **MNA Solver & Grid Bus** | `mnaSolver.test.ts`, `transmissionPhysics.test.ts`, `virtualGridAndWindTurbine.test.ts` | $Ax = z$ accuracy, virtual grid coupling, $240\,\text{V}$ step-up Joule loss reduction, Schottky diodes |
| **2D Terrain & Microclimate** | `terrainGrid.test.ts`, `terrainClimateEngine.test.ts`, `anchoredSunAndRiverbed.test.ts`, `solarPanelStore.test.ts` | World-anchored sun finite ray-casting, surface-hugging shadow bands, Hellmann wind shear, gravity drop tolerance |
| **Micro-Hydro & BESS** | `bessAndHydro.test.ts`, `anchoredSunAndRiverbed.test.ts`, `batterySoC.test.ts` | $P = \eta \rho g Q H$, `208x208` riverbed settling (`row 18`), `measureSubmergedDepthPx`, manual valve override, dry-land 0V reset |
| **Spawn & Mobile UI** | `canvasSpawnPosition.test.ts`, `outdoorSpawnUtils.test.ts`, `CreditsModal.test.ts` | Camera-centered spawn coordinates, dry-terrace candidate prioritization, bilingual localization & Nano Banana 2.1 harness badges |
| **Pedagogy & Protection** | `explainableTutor.test.ts`, `academyProgress.test.ts`, `troubleshootingValidation.test.ts`, `missionValidator.test.ts` | KCL/KVL proof generation, PUIL MCB trip & one-tap jumper cut recovery |

---

## 2. Connected Knowledge Nodes

- [[README]]
- [[PHYSICS_LENS_XRAY_AND_SCIENTIFIC_AUDIT]]
- [[DEVLOG_SESSION_NATURE_MODE_4.0]]
- [[DEVLOG_ANTISLOP_MODAL_AND_ASSET_OVERHAUL]]
- [[ASSET_PIPELINE_NANO_BANANA_AND_ALPHA_MATTING]]
- [[ARCHITECTURE_OUTDOOR_AND_LAB_QUARANTINE]]
- [[PHYSICS_MNA_SOLVER_AND_TRANSMISSION_GRID]]
- [[PHYSICS_TERRAIN_CELLULAR_AUTOMATA]]
- [[PHYSICS_SOLAR_AND_OROGRAPHIC_WIND]]
- [[PHYSICS_MICROHYDRO_AND_BESS_STORAGE]]
- [[HARDWARE_COMPONENTS_AND_PROTECTION]]
- [[HARDWARE_TRANSMISSION_AND_TRAFO_SUTET]]
- [[PEDAGOGY_ACADEMY_AND_EXPLAINABLE_TUTOR]]
- [[UI_UX_ANTISLOP_AND_MOBILE_ENGINE]]
