---
title: Modified Nodal Analysis (MNA) Solver & Virtual Grid Bus
tags:
  - physics-engine
  - hardware-node
  - architecture
aliases:
  - MNA Solver
  - Modified Nodal Analysis
---

# Modified Nodal Analysis (MNA) Solver & Virtual Grid Bus

Parent Hub: [[README|Circuit Sandbox 4.0 Master Architecture Hub (MOC)]]  
Source Module: `src/physics/mnaSolver.ts`

---

## 1. Mathematical Formulation ($Ax = z$)

Circuit Sandbox 4.0 solves arbitrary DC and quasi-dynamic electrical networks using **Modified Nodal Analysis (MNA)**. Given $N$ non-reference electrical nets and $M$ independent voltage sources, the solver constructs the $(N + M) \times (N + M)$ linear system:

$$\begin{bmatrix} G & B \\ C & D \end{bmatrix} \begin{bmatrix} v \\ i_V \end{bmatrix} = \begin{bmatrix} i_s \\ e_s \end{bmatrix}$$

- **$G \in \mathbb{R}^{N \times N}$**: Nodal conductance matrix populated from resistors, bulb filaments, ammeter shunts ($R_{shunt} = 0.001\,\Omega$), voltmeter sense impedances ($R_{sense} = 10\,\text{M}\Omega$), and closed switches ($R_{on} = 0.001\,\Omega$).
- **$B, C$**: Incidence matrices coupling independent voltage sources to their positive (`pos`) and negative (`neg`) terminal nets.
- **$e_s \in \mathbb{R}^M$**: Electromotive force (EMF) vector for batteries, solar panels, wind turbines, micro-hydro generators, and BESS substations.

### Algorithmic Complexity
- **Net Discovery (Union-Find / BFS)**: $O(V + E)$ where $V$ is terminal pins and $E$ is wire edges.
- **Gaussian Elimination with Partial Pivoting**: $O((N + M)^3)$ worst-case time complexity, $O((N + M)^2)$ space complexity. Because typical student and microgrid circuits satisfy $N + M \le 40$, a full solve completes in $< 0.4\,\text{ms}$, sustaining 60fps interactive dragging on mid-range mobile devices.

---

## 2. Iterative Semiconductor & Protection Passes

A single linear solve is insufficient when non-linear protection elements are present. `solveCircuit` executes bounded fixed-point passes for:

1. **Schottky Blocking Diodes on Renewable Generators**:
   - Prevents higher-voltage sources (e.g., a 12.8V [[PHYSICS_MICROHYDRO_AND_BESS_STORAGE|BESS Substation]] or 12V [[PHYSICS_SOLAR_AND_OROGRAPHIC_WIND|Solar Panel]]) from driving reverse current into a shaded solar panel or calm wind turbine.
   - If the solver detects reverse current ($I_{gen} < -10^{-4}\,\text{A}$) through a renewable generator, `blockedGeneratorIds` marks the generator's internal Schottky diode as reverse-biased (open circuit) and re-solves.
2. **LED Polarity Verification (`reverseBiasedBranches`)**:
   - Checks anode-to-cathode potential difference ($V_{p1} - V_{p2}$) on semiconductor LED bulbs (`led_standard`, `led_rgb`, `led_green`). If reverse-biased, current is blocked without damaging the LED.
3. **PUIL MCB Overcurrent Auto-Trip**:
   - Evaluates branch currents leaving [[ARCHITECTURE_OUTDOOR_AND_LAB_QUARANTINE|Lab Distribution Panels]] (`distribution-panel`). If a dead short or severe overload is detected, `isMcbTripped` latches `true` and isolates the indoor circuit.

---

## 3. Connected Knowledge Nodes

- [[README]]
- [[ARCHITECTURE_OUTDOOR_AND_LAB_QUARANTINE]]
- [[PHYSICS_SOLAR_AND_OROGRAPHIC_WIND]]
- [[PHYSICS_MICROHYDRO_AND_BESS_STORAGE]]
- [[HARDWARE_TRANSMISSION_AND_TRAFO_SUTET]]
- [[HARDWARE_COMPONENTS_AND_PROTECTION]]
- [[PEDAGOGY_ACADEMY_AND_EXPLAINABLE_TUTOR]]
- [[TESTING_AND_VERIFICATION_MATRIX]]
