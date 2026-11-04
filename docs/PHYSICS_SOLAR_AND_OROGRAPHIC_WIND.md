---
title: 1D Topographic Ray-Casting & Hellmann Orographic Wind Shear
tags:
  - physics-engine
  - outdoor-nature
  - hardware-node
aliases:
  - Solar Ray-Casting
  - Orographic Wind Shear
---

# 1D Topographic Ray-Casting & Hellmann Orographic Wind Shear

Parent Hub: [[README|Circuit Sandbox 4.0 Master Architecture Hub (MOC)]]  
Source Module: `src/physics/terrainClimateEngine.ts`

---

## 1. Solar Ephemeris & 1D Topographic Shadow Ray-Casting

In **Alam Terbuka**, solar panels (`solar-panel`) do not merely output a static voltage. Their irradiance is dynamically modulated by the sun's ephemeris (`sunTimeOfDay`: `'morning'` at $35^\circ$ East, `'noon'` at $75^\circ$ Zenith, `'afternoon'` at $35^\circ$ West) and the surrounding [[PHYSICS_TERRAIN_CELLULAR_AUTOMATA|2D Terrain Grid]]:

1. **Ray Marching (`cast1DTopographicShadowRay`)**:
   - Traces a ray from the solar panel's photovoltaic receiver coordinates $(x_{rec}, y_{rec})$ toward the active sun position $(x_{sun}, y_{sun})$ across all $C = 40$ terrain columns.
   - If any solid terrain column (`DIRT`, `GRASS`, `ROCK`) rises above the ray's altitude at that column, the panel is occluded (`isShaded = true`).
2. **Diffuse Sky Irradiance Ratio (`DIFFUSE_SHADING_RATIO = 0.15`)**:
   - Unshaded panels receive $E_{eff} = E_{base}$ (up to $100\% \rightarrow 12.0\,\text{V}$).
   - Shaded panels drop to $15\%$ diffuse sky radiation ($E_{eff} = 0.15 \cdot E_{base}$), teaching students why hilltop or un-occluded placement matters and triggering the [[HARDWARE_COMPONENTS_AND_PROTECTION|Schottky Blocking Diode]] when paired in parallel with unshaded generators.
   - User slider adjustments update `baseSunlight` so temporary terrain shadows never overwrite the user's baseline irradiance setting.

---

## 2. Hellmann Power-Law Orographic Wind Shear

Wind turbines (`wind-turbine`) respond to topographic elevation via the **Hellmann Power-Law Wind Profile** (`calculateOrographicWindShear`):

$$v_{eff}(y) = v_{base} \cdot \left( \frac{h_{hub}(y)}{h_{ref}} \right)^{\alpha}$$

- **Hilltop Acceleration**: Placing a wind turbine on an elevated ridge increases $h_{hub}$ relative to the valley baseline $h_{ref}$, yielding up to a $+45\%$ wind shear bonus (`windShearMultiplier > 1.0`) and boosting output toward the $12.0\,\text{V}$ rated ceiling.
- **Valley Sheltering Penalty**: Placing a wind turbine in a deep excavated trench reduces $h_{hub}$, resulting in a negative `elevationBonusPercent` and lower generator EMF in [[PHYSICS_MNA_SOLVER_AND_TRANSMISSION_GRID|mnaSolver.ts]].

---

## 3. Connected Knowledge Nodes

- [[README]]
- [[DEVLOG_SESSION_NATURE_MODE_4.0]]
- [[PHYSICS_TERRAIN_CELLULAR_AUTOMATA]]
- [[PHYSICS_MNA_SOLVER_AND_TRANSMISSION_GRID]]
- [[PHYSICS_MICROHYDRO_AND_BESS_STORAGE]]
- [[HARDWARE_TRANSMISSION_AND_TRAFO_SUTET]]
- [[HARDWARE_COMPONENTS_AND_PROTECTION]]
- [[TESTING_AND_VERIFICATION_MATRIX]]
