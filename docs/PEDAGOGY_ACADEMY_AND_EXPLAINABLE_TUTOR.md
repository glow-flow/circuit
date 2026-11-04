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

1. **Topology Classification**: Identifies series loops, parallel branches, open circuits, short circuits, and virtual transmission links in $O(V + E)$ time.
2. **Step-by-Step Mathematical Proofs**:
   - Derives equivalent resistance ($R_{eq}$), Kirchhoff's Voltage Law ($\sum V = 0$), Kirchhoff's Current Law ($\sum I_{in} = \sum I_{out}$), and Joule power dissipation ($P = V \cdot I = I^2 R$) using the live component values on canvas.
3. **Physical Phenomena & What-If Analysis**:
   - Explains active [[HARDWARE_COMPONENTS_AND_PROTECTION|Schottky Blocking Diodes, LED Reverse Bias, and PUIL MCB Trips]], plus interactive *"What-If"* sensitivity predictions when resistance or source EMF is doubled/halved.

---

## 2. Structured Competency Curriculum

- **Circuit Academy (`AcademyModal.tsx`)**: Multi-level interactive physics curriculum with live Ohm's Law, Voltage Divider, and Joule Power sandboxes, equations, and XP competency quizzes.
- **Practical Missions (`MissionModal.tsx`)**: Real-time graph topology validators that verify student circuits against target voltage, current, and power criteria.
- **Fault Troubleshooting Lab (`TroubleshootingModal.tsx`)**: Diagnostic challenges where students locate hidden faults (blown filaments, reversed LEDs, shorted jumpers, tripped MCBs) with staged hint penalties.

---

## 3. Connected Knowledge Nodes

- [[README]]
- [[PHYSICS_MNA_SOLVER_AND_TRANSMISSION_GRID]]
- [[HARDWARE_COMPONENTS_AND_PROTECTION]]
- [[HARDWARE_TRANSMISSION_AND_TRAFO_SUTET]]
- [[UI_UX_ANTISLOP_AND_MOBILE_ENGINE]]
- [[TESTING_AND_VERIFICATION_MATRIX]]
