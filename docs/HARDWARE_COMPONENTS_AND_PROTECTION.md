---
title: SNI/IEC Hardware Catalog, Schottky Diodes & PUIL MCB Protection
tags:
  - hardware-node
  - protection-puil
  - physics-engine
aliases:
  - Hardware & Protection
  - PUIL MCB & Schottky Diodes
---

# SNI/IEC Hardware Catalog, Schottky Diodes & PUIL MCB Protection

Parent Hub: [[README|Circuit Sandbox 4.0 Master Architecture Hub (MOC)]]  
Source Modules: `src/constants/componentCatalog.ts`, `src/constants/bulbCatalog.ts`, `src/constants/datasheetCitations.ts`

---

## 1. Standards-Backed Component Specifications (SNI / IEC / PUIL)

Every electrical component in Circuit Sandbox 4.0 is parameterized from real industrial datasheets (`src/constants/datasheetCitations.ts`):

- **Luminaires (`BULB_CATALOG`)**:
  - Incandescent Tungsten ($60\,\text{W}$, $240\,\Omega$, SNI IEC 60064)
  - Halogen Quartz ($42\,\text{W}$, $340\,\Omega$, IEC 60357)
  - Vintage Edison Carbon Filament ($40\,\text{W}$, $360\,\Omega$)
  - Compact Fluorescent / CFL ($15\,\text{W}$, $960\,\Omega$, SNI IEC 60969)
  - Standard SMD LED ($9\,\text{W}$, $3555\,\Omega$, SNI IEC 62560)
  - Smart RGB LED ($7\,\text{W}$, $6000\,\Omega$, IEC 62612)
  - Mini Green Indicator LED G4 ($1.2\,\text{W}$, $120\,\Omega$ at $12\,\text{V}$ DC)
- **Energy Sources**:
  - AA Alkaline Cell ($1.5\,\text{V}$, $1000\,\text{mAh}$, IEC 60086-2)
  - 9V Prismatic Alkaline Battery ($9.0\,\text{V}$, $R_{int} = 2.0\,\Omega$, $500\,\text{mAh}$)
  - Dual AA Series Holder ($0\,\text{V} / 1.5\,\text{V} / 3.0\,\text{V}$ depending on inserted cell count)

---

## 2. Three-Tier Protection & Failure Physics

1. **PUIL 2011 / IEC 60898-1 Thermal-Magnetic MCB (`distribution-panel`)**:
   - Monitors downstream Lab current fed from the [[ARCHITECTURE_OUTDOOR_AND_LAB_QUARANTINE|Virtual Grid Bus]].
   - Automatically trips (`isMcbTripped = true`) upon detecting a dead short circuit across output terminals, preventing catastrophic equipment fire.
   - Includes a one-tap **Cut Shorting Jumper & Reset MCB** (`disconnectAndResetMcb`) recovery workflow for mobile ergonomics.
2. **Schottky Blocking Diode (`isBlockingDiodeActive`)**:
   - Integrated into [[PHYSICS_SOLAR_AND_OROGRAPHIC_WIND|Solar Panels & Wind Turbines]] and [[PHYSICS_MICROHYDRO_AND_BESS_STORAGE|Micro-Hydro Generators]] to block reverse current backfeed during multi-source parallel operation.
3. **Thermal Overpower Burnout (`isBlown`) & Polarity Guard (`isReverseBiased`)**:
   - Exceeding a bulb's rated power ceiling ($P > 1.5 \cdot P_{rated}$) blows the filament (`isBlown = true`, open circuit).
   - Reversing anode/cathode connections on LED bulbs triggers `isReverseBiased = true` in [[PHYSICS_MNA_SOLVER_AND_TRANSMISSION_GRID|mnaSolver.ts]] without destroying the semiconductor junction.

---

## 3. Connected Knowledge Nodes

- [[README]]
- [[ARCHITECTURE_OUTDOOR_AND_LAB_QUARANTINE]]
- [[PHYSICS_MNA_SOLVER_AND_TRANSMISSION_GRID]]
- [[HARDWARE_TRANSMISSION_AND_TRAFO_SUTET]]
- [[PEDAGOGY_ACADEMY_AND_EXPLAINABLE_TUTOR]]
- [[TESTING_AND_VERIFICATION_MATRIX]]
