---
title: Explainable Circuit Physics Tutor, Academy & Troubleshooting Lab
tags:
  - pedagogy
  - physics-engine
  - protection-puil
aliases:
  - Explainable Physics Tutor
  - Academy & Troubleshooting Lab
---

# Explainable Circuit Physics Tutor, Academy & Troubleshooting Lab

Parent Hub: [[README|Circuit Sandbox 4.0 Master Architecture Hub (MOC)]]  
Source Modules: `src/tutor/explainableTutor.ts`, `src/academy/academyCatalog.ts`, `src/troubleshooting/troubleshootingCatalog.ts`, `src/missions/missionCatalog.ts`

---

## 1. Deterministic Explainable Physics Tutor (`explainableTutor.ts`)

Unlike generic LLM chatbots that hallucinate equations, the **Explainable Circuit Physics Tutor** (`ExplainableTutorModal.tsx`) inspects the live [[PHYSICS_MNA_SOLVER_AND_TRANSMISSION_GRID|MNA Solver]] graph and generates deterministic, step-by-step mathematical derivations:

1. **Topology Classification**: Filters out unwired bench spares and empty sockets (`1e9 Ω`) in $O(V + E)$ time while keeping live parallel branches conducting when an open switch isolates only a sibling branch.
2. **Step-by-Step Mathematical Proofs**:
   - Derives equivalent resistance ($R_{eq}$), diode threshold adjustments ($V_s - V_f$), real MNA/$R_{int}$ short-circuit surge ($V_{oc}/R_{int}$), Kirchhoff's Voltage Law ($\sum V = 0$), Kirchhoff's Current Law ($\sum I_{in} = \sum I_{out}$), and component-aware Inspector formulas (`physicsEquationHelper.ts`).
3. **Physical Phenomena & What-If Analysis**:
   - Explains active [[HARDWARE_COMPONENTS_AND_PROTECTION|Schottky Blocking Diodes, LED Reverse Bias, and PUIL MCB Trips]], plus interactive *"What-If"* sensitivity predictions when resistance or source EMF is doubled/halved, paired with physically accurate Academy SVG micro-labs (true $e^-$ $(-) \to (+)$ electron drift, $5.00\,\text{V}$ KVL reverse-biased LED open drop, post-trip $0\,\text{A}$ MCB readout).

---

## 2. Structured Competency Curriculum

- **Circuit Academy (`AcademyModal.tsx`)**: Multi-level interactive physics curriculum with live Ohm's Law, Voltage Divider, and Joule Power sandboxes, equations, and XP competency quizzes.
- **Practical Missions (`MissionModal.tsx`)**: Real-time graph topology validators that verify student circuits against target voltage, current, and power criteria.
- **Fault Troubleshooting Lab (`TroubleshootingModal.tsx`)**: Diagnostic challenges where students locate hidden faults (blown filaments, reversed LEDs, shorted jumpers, tripped MCBs) with staged hint penalties.

---

## 3. Connected Knowledge Nodes

- [[README]]
- [[MASCOT_AND_DUOLINGO_ACADEMY_DESIGN]]
- [[OUTDOOR_TO_LAB_CHARGING_BRIDGE]]
- [[PHYSICS_MNA_SOLVER_AND_TRANSMISSION_GRID]]
- [[HARDWARE_COMPONENTS_AND_PROTECTION]]
- [[HARDWARE_TRANSMISSION_AND_TRAFO_SUTET]]
- [[UI_UX_ANTISLOP_AND_MOBILE_ENGINE]]
- [[TESTING_AND_VERIFICATION_MATRIX]]
