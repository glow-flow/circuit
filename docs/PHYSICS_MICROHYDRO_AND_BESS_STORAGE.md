---
title: Pelton Micro-Hydro Electromechanics & LFP BESS Storage (1.0 kWh)
tags:
  - physics-engine
  - outdoor-nature
  - hardware-node
aliases:
  - Micro-Hydro & BESS
  - Pelton Turbine & BESS Substation
---

# Pelton Micro-Hydro Electromechanics & LFP BESS Storage (1.0 kWh)

Parent Hub: [[README|Circuit Sandbox 4.0 Master Architecture Hub (MOC)]]  
Source Modules: `src/physics/hydroPhysics.ts`, `src/physics/batterySoC.ts`, `src/components/canvas/nodes/HydroTurbineNode.tsx`, `src/components/canvas/nodes/BessSubstationNode.tsx`

---

## 1. Waterfall & River Micro-Hydro Generator (`hydro-turbine`)

The **Turbin Air Mikrohidro** (`hydro-turbine`) converts gravitational potential energy of flowing water in the [[PHYSICS_TERRAIN_CELLULAR_AUTOMATA|2D Terrain Grid]] into DC electrical power:

$$P_{hydro} = \eta \cdot \rho \cdot g \cdot Q \cdot H$$

- **$\eta = 0.78$**: Pelton impulse runner + permanent-magnet stator conversion efficiency (`HYDRO_RUNNER_EFFICIENCY`).
- **$\rho = 1000\,\text{kg/m}^3$**: Density of freshwater (`WATER_DENSITY_KG_M3`).
- **$g = 9.81\,\text{m/s}^2$**: Gravitational acceleration (`GRAVITY_ACCELERATION_M_S2`).
- **$Q \in [0, 0.004]\,\text{m}^3/\text{s}$**: Volumetric flow rate scaled by `waterFlowRate` ($0\text{--}100\%$).
- **$H \in [0.5, 5.0]\,\text{m}$**: Effective hydraulic head drop (`hydraulicHeadMeters`) derived from vertical waterfall cascade height or river basin kinetic flow (`cols 24..32`).

### Water Contact & Manual Valve Override Semantics
- **In River / Waterfall (`waterFlow.hasWaterContact === true`)**: Automatically senses terrain water flow and generates $11.9\text{--}24.0\,\text{V}$ DC with rotor speed $150\text{--}450\,\text{RPM}$.
- **Manual Valve Override (`manualWaterFlowRate`)**: Users can throttle the test water valve slider (`0%..100%`) inside the Micro-Hydro modal or right-hand Inspector.
- **Dry Land Reset**: Dragging the turbine onto dry land clears `manualWaterFlowRate` and resets `hasWaterContact = false`, `waterFlowRate = 0%`, `voltage = 0V`, and `rpm = 0`.

---

## 2. Grid-Scale LFP BESS Substation (`bess-substation`)

The **Gardu Baterai BESS** (`bess-substation`) models a $1.0\,\text{kWh}$ ($1000\,\text{Wh}$), $12.8\,\text{V}$ nominal Lithium Iron Phosphate ($\text{LiFePO}_4$) energy storage container:

- **Ultra-Low Internal Resistance**: $R_{int} = 0.04\,\Omega$ to support multi-ampere microgrid buffering.
- **Coulomb Counting & State Classification (`tickBatteryCharge`)**:
  - Dynamically switches between `'charging'` (when parallel solar/wind/hydro bus voltage exceeds BESS terminal EMF), `'discharging'` (when supplying downstream loads via [[HARDWARE_TRANSMISSION_AND_TRAFO_SUTET|Transmission Towers]]), `'idle'`, `'fully_charged'`, and `'depleted'`.
- **Non-Compounding Low-SoC Voltage Sag (`computeEffectiveBatteryVoltage`)**:
  - Above $20\%$ SoC, maintains flat $12.8\,\text{V}$ LFP plateau.
  - Below $20\%$ SoC, scales effective EMF linearly in [[PHYSICS_MNA_SOLVER_AND_TRANSMISSION_GRID|mnaSolver.ts]] without mutating `node.data.voltage`, preventing exponential decay across repeated solver passes.

---

## 3. Connected Knowledge Nodes

- [[README]]
- [[DEVLOG_SESSION_NATURE_MODE_4.0]]
- [[ARCHITECTURE_OUTDOOR_AND_LAB_QUARANTINE]]
- [[PHYSICS_TERRAIN_CELLULAR_AUTOMATA]]
- [[PHYSICS_MNA_SOLVER_AND_TRANSMISSION_GRID]]
- [[PHYSICS_SOLAR_AND_OROGRAPHIC_WIND]]
- [[HARDWARE_TRANSMISSION_AND_TRAFO_SUTET]]
- [[TESTING_AND_VERIFICATION_MATRIX]]
