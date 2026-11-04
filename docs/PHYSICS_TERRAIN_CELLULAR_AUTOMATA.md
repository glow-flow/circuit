---
title: 2D Cellular Automata Terrain & Hydrological Spring Engine
tags:
  - physics-engine
  - outdoor-nature
aliases:
  - Terrain Engine
  - Cellular Automata Terrain
---

# 2D Cellular Automata Terrain & Hydrological Spring Engine (`40x20`)

Parent Hub: [[README|Circuit Sandbox 4.0 Master Architecture Hub (MOC)]]  
Source Modules: `src/physics/terrainGrid.ts`, `src/physics/hydroPhysics.ts`

---

## 1. Discrete Grid Representation (`40 Columns x 20 Rows`)

The **Alam Terbuka** (`worldMode === 'outside'`) environment is backed by a $20 \times 40$ 2D cellular grid spanning a `1360px x 680px` stage (`34px x 34px` per cell):

- **`EMPTY`**: Air / sky cells permitting sunlight rays and wind flow.
- **`DIRT` & `GRASS`**: Excavatable soil cells subject to vertical gravity settlement (`stepTerrainGravity`). Exposed top-surface `DIRT` cells naturally sprout `GRASS` after 10 seconds of sunlight exposure (`DIRT_TO_GRASS_DELAY_MS`).
- **`ROCK`**: Non-erodible bedrock cliff formations (`cols 0..39` lower strata).
- **`WATER_SPRING`**: Stationary mountain spring source blocks that continuously emit fresh `WATER` cells into adjacent open spaces without falling under gravity.
- **`WATER`**: Fluid cells governed by bottom-up cellular automata rules (vertical free-fall + lateral dispersion across river basins at `cols 24..32`).

### Time & Space Complexity
- **Single CA Gravity/Fluid Step (`stepTerrainGravity`)**: $O(R \times C) = O(20 \times 40) = 800$ cell operations per tick ($< 0.15\,\text{ms}$).
- **Surface Elevation Query (`findTerrainSurfaceY`)**: $O(R \times W_{cols})$ bounded by the component's column footprint ($4\text{--}5$ columns).

---

## 2. Rigid-Body Drop Physics & Hazard Rules (`evaluateComponentDropPhysics`)

Whenever a component is placed or dragged in Outdoor Mode, `evaluateComponentDropPhysics` evaluates 4 physical constraints in $O(N + R \cdot W_{cols})$ time:

1. **Height Drop Tolerance (`MAX_SAFE_DROP_ROWS = 4.5`)**:
   - Dropping hardware from more than $4.5$ rows above the ground surface triggers `status: 'explode-height'` and spawns a kinetic impact fireball.
2. **Water Short-Circuit Hazard (`status: 'explode-water'`)**:
   - Dropping non-waterproof electrical hardware (`solar-panel`, `wind-turbine`, `bess-substation`, `transmission-tower`) onto `WATER` or `WATER_SPRING` cells causes an immediate short-circuit explosion.
   - **Immunity Exception**: The [[PHYSICS_MICROHYDRO_AND_BESS_STORAGE|Waterfall Micro-Hydro Turbine (`hydro-turbine`)]] has `isWaterImmune = true` so its Pelton runner can sit directly inside rivers and waterfalls.
3. **AABB Collision Rejection (`status: 'overlap'`)**:
   - Prevents components from stacking on top of each other; dragged nodes snap back to `previousPosition`.
4. **Gravity Surface Settlement (`status: 'settled'`)**:
   - Automatically snaps the component's base onto `surfaceY` and triggers microclimate recalculation in [[PHYSICS_SOLAR_AND_OROGRAPHIC_WIND]] and [[PHYSICS_MICROHYDRO_AND_BESS_STORAGE]].

---

## 3. Connected Knowledge Nodes

- [[README]]
- [[DEVLOG_SESSION_NATURE_MODE_4.0]]
- [[ARCHITECTURE_OUTDOOR_AND_LAB_QUARANTINE]]
- [[PHYSICS_SOLAR_AND_OROGRAPHIC_WIND]]
- [[PHYSICS_MICROHYDRO_AND_BESS_STORAGE]]
- [[TESTING_AND_VERIFICATION_MATRIX]]
