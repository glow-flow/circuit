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
Source Modules: `src/physics/hydroPhysics.ts`, `src/physics/batterySoC.ts`, `src/physics/mnaSolver.ts`, `src/components/canvas/nodes/HydroTurbineNode.tsx`, `src/components/canvas/nodes/BessSubstationNode.tsx`

---

## 1. Waterfall & River Micro-Hydro Generator (`hydro-turbine`)

The **Turbin Air Mikrohidro** (`hydro-turbine`) converts gravitational potential energy of flowing water in the [[PHYSICS_TERRAIN_CELLULAR_AUTOMATA|2D Terrain Grid]] into DC electrical power:

$$P_{hydro} = \eta \cdot \rho \cdot g \cdot Q \cdot H$$

- **$\eta = 0.82$**: Pelton impulse runner + permanent-magnet stator conversion efficiency (`HYDRO_RUNNER_EFFICIENCY`).
- **$\rho = 1000\,\text{kg/m}^3$**: Density of freshwater (`WATER_DENSITY_KG_M3`).
- **$g = 9.81\,\text{m/s}^2$**: Gravitational acceleration (`GRAVITY_ACCELERATION_M_S2`).
- **$Q \in [0, 0.004]\,\text{m}^3/\text{s}$**: Volumetric flow rate scaled by `waterFlowRate` ($0\text{--}100\%$).
- **$H \in [0.5, 5.0]\,\text{m}$**: Effective hydraulic head drop (`hydraulicHeadMeters`) derived from vertical waterfall cascade height or river basin kinetic flow (`cols 24..32`).
- **Integrated DC AVR (Automatic Voltage Regulator)**:
  - Up to $30\,\text{W}$, open-circuit voltage scales as $12.0 \cdot \sqrt{P_{hydro} / 30}$.
  - Above $30\,\text{W}$ (high river or waterfall head), an internal DC AVR regulates open-circuit EMF between $12.0\,\text{V}$ and $13.8\,\text{V}$, and clamps the shared microgrid bus output to $12.0\,\text{V}$ in [[PHYSICS_MNA_SOLVER_AND_TRANSMISSION_GRID|mnaSolver.ts]] so parallel $12\,\text{V}$ Solar Panels and $12\,\text{V}$ Wind Turbines are never falsely locked out by reverse-bias diodes.

### Riverbed Submersion & `208x208` Structural Frame
- **Enlarged Structural Footprint (`208x208 px`)**: The A-frame hydro turbine (`HYDRO_NODE_SIZE_PX = 208`) and its Pelton runner (`98px` diameter centered at `top: 16.5%`) are scaled to match the visual hierarchy of outdoor infrastructure (`wind-turbine`, `transmission-tower`, `bess-substation`).
- **Riverbed Gravity Settling (`waterIsSolid: false`)**: In `findTerrainSurfaceY` (`src/physics/terrainGrid.ts`), `hydro-turbine` penetrates `'WATER'` cells (`rows 15..17`) and settles directly onto the solid `'DIRT'` riverbed (`row 18`, `y = 612px`), while `evaluateComponentDropPhysics` measures drop distance against the water surface (`row 15`) so water cushions the landing without causing structural fall damage.
- **Submerged Waterline Overlay (`measureSubmergedDepthPx`)**: Calculates the exact pixel depth of the lower A-frame submerged beneath the river surface (`~102px` in the default 3-row river basin) and renders a translucent cyan waterline shimmer across the submerged frame.

---

## 2. Grid-Scale LFP BESS Substation (`bess-substation`)

The **Gardu Baterai BESS** (`bess-substation`) models a $1.0\,\text{kWh}$ ($1000\,\text{Wh}$), $12.8\,\text{V}$ nominal Lithium Iron Phosphate ($\text{LiFePO}_4$) energy storage container with an integrated **Bidirectional MPPT Charge Controller** and **BMS (Battery Management System)**:

- **Discharge Mode (`MENYALURKAN`)**:
  - When renewable generators drop below $4.0\,\text{V}$ (nighttime, hill shadow, calm wind, or dry river), BESS discharges at $12.8\,\text{V}$ with ultra-low discharge resistance $R_{dis} = 0.04\,\Omega$ to keep downstream [[HARDWARE_TRANSMISSION_AND_TRAFO_SUTET|Transmission Towers]] and Lab loads powered without interruption.
- **Bidirectional MPPT Charging Mode (`MENGISI`, $\text{SoC} < 100\%$)**:
  - When active renewable generators ($\ge 4.0\,\text{V}$ from Solar, Wind, or Micro-Hydro) are connected to the same bus and $\text{SoC} < 100\%$, the BESS MPPT converter steps down its internal charging counter-EMF below the generator bus voltage and regulates charging current via Constant-Current (CC) control ($R_{chg,base} = 0.8\,\Omega$, $I_{max} = 3.5\,\text{A}$).
  - Prevents uncontrolled $29.20\,\text{A}$ overcurrent spikes and eliminates false `"Korslet!"` (`isShortCircuit`) alarms on generators charging the BESS.
- **BMS Full-Charge Cut-Off (`SIAGA / PENUH`, $\text{SoC} = 100\%$)**:
  - Once BESS reaches $100\%$ SoC while renewable generators are active on the bus, the BMS opens the charging path ($I_{bess} = 0\,\text{A}$, `chargeState = 'idle'`) so the battery never overcharges and daytime generators feed the Lab directly.
- **Non-Compounding Low-SoC Voltage Sag (`computeEffectiveBatteryVoltage`)**:
  - Above $20\%$ SoC, maintains flat $12.8\,\text{V}$ LFP plateau.
  - Below $20\%$ SoC, scales effective EMF linearly without mutating `node.data.voltage`.

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
