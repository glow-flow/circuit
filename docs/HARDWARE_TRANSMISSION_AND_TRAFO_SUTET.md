---
title: Gardu Trafo Cantol SUTET (12V vs 240V Step-Up) & Joule Line Loss
tags:
  - hardware-node
  - physics-engine
  - outdoor-nature
  - protection-puil
aliases:
  - Trafo SUTET & Transmission
  - HVDC Transmission Physics
---

# Gardu Trafo Cantol SUTET (12V vs 240V Step-Up) & Joule Line Loss

Parent Hub: [[README|Circuit Sandbox 4.0 Master Architecture Hub (MOC)]]  
Source Modules: `src/components/canvas/nodes/TransmissionTowerNode.tsx`, `src/physics/mnaSolver.ts`

---

## 1. Why High-Voltage Transmission Exists ($P_{loss} = I^2 R_{line}$)

In **Alam Terbuka**, the **Menara Transmisi SUTET** (`transmission-tower`) bridges outdoor renewable generators to the indoor **Panel Distribusi Lab** (`distribution-panel`) over a long-distance overhead conductor with non-zero line resistance ($R_{line} = 4.0\,\Omega$ default):

$$P_{loss} = I_{line}^2 \cdot R_{line}, \qquad \eta_{trans} = \frac{P_{load}}{P_{load} + P_{loss}} \times 100\%$$

- **Direct 12V Mode (`transmissionVoltageMode: 'direct'`)**:
  - Transmitting high power at $12\,\text{V}$ requires large current $I = P / V$, causing severe voltage drop ($\Delta V = I \cdot R_{line}$), conductor thermal stress (`isLineOverheated = true`), and heavy Joule heating loss.
- **Gardu Trafo Cantol Step-Up 240V Mode (`hasTransformer: true`, `stepUpVoltage: 240`)**:
  - Attaching the snap-on **Gardu Trafo Cantol** steps the transmission voltage up by $20\times$ ($12\,\text{V} \rightarrow 240\,\text{V}$).
  - For the same transmitted power, line current drops by $20\times$, reducing Joule power loss ($I^2 R_{line}$) by a factor of $400\times$ and restoring transmission efficiency $\eta_{trans} > 99\%$.

---

## 2. Indoor Step-Down Regulation at the Lab Distribution Panel

At the receiving end inside **Laboratorium**, the **Panel Distribusi Lab** (`distribution-panel`) steps the incoming bus voltage down to safe bench levels:
- Selectable DC Step-Down regulator ceilings (`Auto`, `3V`, `6V`, `9V`, `12V`) accessible both on the node card and in the right-hand Inspector (`InspectorPropertiesTab.tsx`).
- Coupled with the [[HARDWARE_COMPONENTS_AND_PROTECTION|PUIL MCB Breaker]] to protect indoor student experiments.

---

## 3. Connected Knowledge Nodes

- [[README]]
- [[DEVLOG_SESSION_NATURE_MODE_4.0]]
- [[ARCHITECTURE_OUTDOOR_AND_LAB_QUARANTINE]]
- [[PHYSICS_MNA_SOLVER_AND_TRANSMISSION_GRID]]
- [[PHYSICS_SOLAR_AND_OROGRAPHIC_WIND]]
- [[PHYSICS_MICROHYDRO_AND_BESS_STORAGE]]
- [[HARDWARE_COMPONENTS_AND_PROTECTION]]
- [[PEDAGOGY_ACADEMY_AND_EXPLAINABLE_TUTOR]]
