/**
 * Zustand State Store for Circuit Sandbox.
 * 
 * Manages nodes, edges, simulation loop, active selection,
 * component parameter adjustments, and preset circuits.
 */

import { create } from 'zustand';
import {
  Node,
  Edge,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import {
  CircuitElementData,
  ComponentType,
  ExplosionEvent,
  PlacementOptions,
  SimulationResult,
  TerrainBrushTool,
  TerrainCellType,
  WireConnection,
  WorldMode,
} from '../types/circuit';
import {
  getSolarPanelVoltage,
  SOLAR_PANEL_INTERNAL_RESISTANCE,
} from '../physics/solarPanel';
import {
  createDefaultOutdoorTerrain,
  evaluateComponentDropPhysics,
  evaluateGrassGrowth,
  GRID_COLS,
  GRID_ROWS,
  settleTerrainGravityImmediate,
  stepTerrainGravity,
} from '../physics/terrainGrid';
import {
  isTransmissionNodeActive,
  SHORT_CIRCUIT_CURRENT_THRESHOLD,
  solveCircuitMNA,
} from '../physics/mnaSolver';
import {
  computeEffectiveBatteryVoltage,
  determineBatteryChargeState,
  getDefaultBatteryCapacity,
  stepBatteryCharge,
} from '../physics/batterySoC';
import {
  BulbType,
  canBulbFitSocket,
  canBulbFitPinSocket,
  computeBulbPhotometrics,
  getBulbSpec,
} from '../constants/bulbCatalog';
import {
  REJECT_PUSH_DISTANCE,
  SOCKET_NOTICES,
  findNearestFreeSocket,
  getBulbSnapPosition,
  removeSnapEdges,
} from '../utils/socketSnap';
import { AppLanguage } from '../i18n/translations';
import {
  CustomCircuitPreset,
  createUltimatePowerGridPreset,
  loadCustomPresetsFromStorage,
  saveCustomPresetsToStorage,
  saveWorkspaceAutosave,
} from '../utils/presetStorage';
import { checkPanelDirectShort } from '../utils/circuitShortCircuitUtils';

interface CircuitState {
  nodes: Node<CircuitElementData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  simulation: SimulationResult;
  isSimulating: boolean;
  language: AppLanguage;
  customPresets: CustomCircuitPreset[];
  fitViewTrigger: number;

  // World Mode & CSS Cloud Transition State
  worldMode: WorldMode;
  isTransitioningWorld: boolean;
  transitionTargetMode: WorldMode | null;
  setWorldMode: (worldMode: WorldMode) => void;
  triggerWorldTransition: (targetMode?: WorldMode) => void;

  // Outdoor Sandbox 2D Terrain Grid & Physics State
  terrainGrid: TerrainCellType[][];
  dirtExposureMap: Record<string, number>;
  terrainBrush: TerrainBrushTool;
  explosions: ExplosionEvent[];
  setTerrainBrush: (brush: TerrainBrushTool) => void;
  paintTerrainCell: (
    row: number,
    col: number,
    cellType: TerrainCellType,
    immediateGravity?: boolean
  ) => void;
  tickTerrainPhysics: (nowMs?: number) => void;
  settleAllTerrainGravity: () => void;
  resetOutdoorTerrain: () => void;
  placeOutdoorComponent: (
    type: ComponentType,
    position: { x: number; y: number },
    containerSize: { width: number; height: number },
    options?: PlacementOptions
  ) => boolean;
  settleOutdoorNodeAfterDrag: (
    nodeId: string,
    previousPosition: { x: number; y: number },
    containerSize: { width: number; height: number }
  ) => void;
  dismissExplosion: (explosionId: string) => void;

  /** Transient UI toast (e.g. "wrong lamp base"); `id` changes on every notify so timers restart. */
  notification: { id: number; message: string } | null;

  // Socket (fiting) snapping & notifications
  notify: (message: string) => void;
  dismissNotification: () => void;
  settleBulbAfterDrag: (bulbId: string) => void;
  detachBulbFromSocket: (bulbId: string) => void;
  syncSnappedBulbPosition: (socketId: string, socketPosition: { x: number; y: number }) => void;

  // React Flow Handlers
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (
    updater:
      | Node<CircuitElementData>[]
      | ((prevNodes: Node<CircuitElementData>[]) => Node<CircuitElementData>[])
  ) => void;

  // Circuit Operations
  setLanguage: (language: AppLanguage) => void;
  addComponent: (
    type: ComponentType,
    position: { x: number; y: number },
    options?: PlacementOptions
  ) => void;
  updateComponentData: (id: string, partialData: Partial<CircuitElementData>) => void;
  setBulbType: (id: string, bulbType: BulbType) => void;
  removeComponent: (id: string) => void;
  removeEdge: (edgeId: string) => void;
  disconnectNodeWires: (nodeId: string) => void;
  resetLabPanelMcb: (id: string) => boolean;
  disconnectAndResetMcb: (id: string) => void;
  insertBatteryIntoHolder: (batteryNodeId: string, holderNodeId: string) => void;
  ejectBatteryFromHolder: (holderNodeId: string) => void;
  splitEdgeWithWaypoint: (edgeId: string, position: { x: number; y: number }) => void;
  splitEdgeAtMidpoint: (edgeId: string) => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  toggleSwitch: (id: string) => void;
  clearCanvas: () => void;
  setIsSimulating: (isSimulating: boolean) => void;
  runSimulation: () => void;
  loadPreset: (
    presetName:
      | 'simple-lamp'
      | 'voltage-divider'
      | 'parallel-bulbs'
      | 'short-circuit-demo'
      | 'ultimate-power-grid'
  ) => void;
  saveCustomPreset: (name: string) => void;
  loadCustomPreset: (presetId: string) => void;
  deleteCustomPreset: (presetId: string) => void;

  // Battery State of Charge (SoC) Operations
  tickBatteryCharge: (deltaSeconds?: number) => void;
  rechargeBattery: (nodeId: string) => void;
  rechargeAllBatteries: () => void;
  startBatteryInterval: () => () => void;
}

const DEFAULT_SIMULATION: SimulationResult = {
  nodeVoltages: {},
  branchCurrents: {},
  isShortCircuit: false,
  shortCircuitBranches: [],
  totalPowerDrawn: 0,
  timestamp: Date.now(),
};

/**
 * Executes MNA physics solver across current store state and persists autosave backup.
 * Synchronizes real-time branch current, voltage drop, and dissipated power (P = I^2 * R)
 * into each node's data object.
 * Time Complexity: O(N + M^3) where N is node count and M is active MNA matrix dimension.
 */
function recalculateCircuit(
  nodes: Node<CircuitElementData>[],
  edges: Edge[]
): { simulation: SimulationResult; updatedNodes: Node<CircuitElementData>[] } {
  // Detached bulbs (screw-base, halogen, and led_green) cannot connect wires directly.
  // All standalone bulbs are passive inventory items awaiting placement into sockets.
  const standalonePassiveBulbIds = new Set(
    nodes
      .filter((node) => node.data.type === 'bulb')
      .map((node) => node.id)
  );
  const validEdges = edges.filter(
    (edge) =>
      edge.source !== edge.target &&
      !standalonePassiveBulbIds.has(edge.source) &&
      !standalonePassiveBulbIds.has(edge.target)
  );

  let workingNodes = nodes;
  let components: CircuitElementData[] = workingNodes.map((node) => node.data);
  const wires: WireConnection[] = validEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    sourceHandle: edge.sourceHandle ?? 'p1',
    target: edge.target,
    targetHandle: edge.targetHandle ?? 'p2',
  }));

  let simulation = solveCircuitMNA({ components, wires });

  // Automatic MCB Short-Circuit Protection (Standar PUIL):
  // If a short circuit occurs across the virtual grid or directly across a Lab Distribution Panel's terminals,
  // automatically trip the MCB to interrupt the fault current and protect laboratory equipment.
  const overloadedLabPanelIds = new Set(
    workingNodes
      .filter((n) => {
        if (!isTransmissionNodeActive(n.data) || n.data.worldMode === 'outside') return false;
        // Direct terminal short circuit (pos and neg bridged directly or via the same junction)
        const isDirectShorted = checkPanelDirectShort(n.id, wires).isShorted;
        // Overcurrent fault from grid
        const isOvercurrent =
          simulation.isShortCircuit &&
          Math.abs(simulation.branchCurrents[n.id] ?? 0) > SHORT_CIRCUIT_CURRENT_THRESHOLD;

        return isDirectShorted || isOvercurrent;
      })
      .map((n) => n.id)
  );

  if (overloadedLabPanelIds.size > 0) {
    workingNodes = workingNodes.map((n) =>
      overloadedLabPanelIds.has(n.id)
        ? {
            ...n,
            data: {
              ...n.data,
              isMcbOn: false,
              isMcbTripped: true,
            },
          }
        : n
    );
    components = workingNodes.map((node) => node.data);
    simulation = solveCircuitMNA({ components, wires });
  }

  // Update node data with calculated voltages, currents, power, and thermal overload status
  const activeTowersCount = workingNodes.filter((n) => isTransmissionNodeActive(n.data)).length;
  const maxGridVoltage = Math.max(0, ...Object.values(simulation.nodeVoltages));
  const reverseBiasedSet = new Set(simulation.reverseBiasedBranches ?? []);
  const blockedGeneratorSet = new Set(simulation.blockedGeneratorIds ?? []);

  const updatedNodes = workingNodes.map((node) => {
    const branchCurrent = simulation.branchCurrents[node.id] ?? 0;
    const isShortCircuit = simulation.shortCircuitBranches.includes(node.id);

    if (node.data.type === 'socket' || node.data.type === 'pin-socket' || node.data.type === 'socket-pin') {
      const installedBulb = node.data.installedBulb;
      const isReverseBiased = reverseBiasedSet.has(node.id);
      if (installedBulb) {
        const bulbType =
          typeof installedBulb === 'object' ? installedBulb.bulbType : installedBulb;
        const spec = getBulbSpec(bulbType);
        const effectiveResistance =
          (typeof installedBulb === 'object' ? installedBulb.resistance : undefined) ??
          node.data.resistance ??
          spec.resistance;
        const { powerWatts, voltageDrop, isOverloaded } = computeBulbPhotometrics(
          branchCurrent,
          effectiveResistance,
          spec
        );
        const isBlown = Boolean(
          (typeof installedBulb === 'object' && installedBulb.isBlown) ||
            node.data.isBlown ||
            isOverloaded ||
            Math.abs(branchCurrent) > 2.5
        );

        const updatedInstalledBulb =
          typeof installedBulb === 'object'
            ? {
                ...installedBulb,
                isBlown,
                power: powerWatts,
                resistance: effectiveResistance,
              }
            : {
                id: node.data.bulbId ?? `bulb_${node.id}`,
                bulbType,
                resistance: effectiveResistance,
                power: powerWatts,
                isBlown,
              };

        return {
          ...node,
          data: {
            ...node.data,
            bulbType,
            resistance: effectiveResistance,
            installedBulb: updatedInstalledBulb,
            calculatedCurrent: branchCurrent,
            calculatedVoltage: voltageDrop,
            calculatedPower: powerWatts,
            isShortCircuit,
            isBlown,
            isReverseBiased,
          },
        };
      } else {
        return {
          ...node,
          data: {
            ...node.data,
            calculatedCurrent: 0,
            calculatedVoltage: 0,
            calculatedPower: 0,
            isShortCircuit: false,
            isReverseBiased: false,
          },
        };
      }
    }

    if (node.data.type === 'bulb') {
      const spec = getBulbSpec(node.data.bulbType);
      const effectiveResistance = node.data.resistance ?? spec.resistance;

      // Standalone bulbs (screw-base, halogen, led_green) are purely inventory items and NEVER conduct current without socket
      return {
        ...node,
        data: {
          ...node.data,
          bulbType: node.data.bulbType ?? 'incandescent',
          resistance: effectiveResistance,
          powerRating: node.data.powerRating ?? spec.maxPower,
          power: 0,
          calculatedCurrent: 0,
          calculatedVoltage: 0,
          calculatedPower: 0,
          isShortCircuit: false,
        },
      };
    }

    if (node.data.type === 'solar-panel' || node.data.type === 'solar_panel') {
      const sunlight = node.data.sunlight ?? 100;
      const outputVoltage = node.data.voltage ?? getSolarPanelVoltage(sunlight);
      const outputPower = Math.abs(branchCurrent * outputVoltage);
      const isBlockingDiodeActive = blockedGeneratorSet.has(node.id);

      return {
        ...node,
        data: {
          ...node.data,
          sunlight,
          voltage: outputVoltage,
          calculatedCurrent: branchCurrent,
          calculatedVoltage: outputVoltage,
          calculatedPower: outputPower,
          isShortCircuit,
          isBlockingDiodeActive,
        },
      };
    }

    if (node.data.type === 'wind-turbine' || node.data.type === 'wind_turbine') {
      const speed = node.data.speed ?? 50;
      const outputVoltage = (speed / 100) * 12.0;
      const outputPower = Math.abs(branchCurrent * outputVoltage);
      const isBlockingDiodeActive = blockedGeneratorSet.has(node.id);

      return {
        ...node,
        data: {
          ...node.data,
          speed,
          voltage: outputVoltage,
          calculatedCurrent: branchCurrent,
          calculatedVoltage: outputVoltage,
          calculatedPower: outputPower,
          isShortCircuit,
          isBlockingDiodeActive,
        },
      };
    }

    if (node.data.type === 'transmission-tower' || node.data.type === 'transmission_tower') {
      const isActive = isTransmissionNodeActive(node.data);
      const effectiveConnectedCount = isActive ? activeTowersCount : 1;
      const busVoltage = isActive && activeTowersCount > 1 ? maxGridVoltage : 0;

      return {
        ...node,
        data: {
          ...node.data,
          isMcbOn: node.data.isMcbOn ?? true,
          isMcbTripped: node.data.isMcbTripped ?? false,
          stepDownVoltage: node.data.stepDownVoltage ?? null,
          towerConnectedCount: effectiveConnectedCount,
          calculatedCurrent: branchCurrent,
          calculatedVoltage: busVoltage,
          calculatedPower: busVoltage * Math.abs(branchCurrent),
          isShortCircuit,
        },
      };
    }

    if (
      node.data.type === 'battery' ||
      node.data.type === 'battery9v' ||
      node.data.type === 'battery-holder'
    ) {
      const currentCharge = node.data.currentCharge ?? 100;
      const capacity =
        node.data.capacity ??
        getDefaultBatteryCapacity(node.data.type, node.data.batteryCount);
      const chargeState = determineBatteryChargeState(branchCurrent);
      const nominalBase =
        node.data.type === 'battery9v'
          ? node.data.voltage ?? 9.0
          : node.data.type === 'battery-holder'
          ? (node.data.batteryCount ?? (node.data.hasBattery ? 2 : 0)) * 1.5
          : node.data.voltage ?? 1.5;
      const effectiveVoltage = computeEffectiveBatteryVoltage(nominalBase, currentCharge);

      return {
        ...node,
        data: {
          ...node.data,
          currentCharge,
          capacity,
          chargeState,
          calculatedCurrent: branchCurrent,
          calculatedVoltage: effectiveVoltage,
          isShortCircuit,
        },
      };
    }

    return {
      ...node,
      data: {
        ...node.data,
        calculatedCurrent: branchCurrent,
        isShortCircuit,
      },
    };
  });

  saveWorkspaceAutosave(updatedNodes, validEdges);

  return { simulation, updatedNodes };
}

export const useCircuitStore = create<CircuitState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  simulation: DEFAULT_SIMULATION,
  isSimulating: true,
  language: 'id',
  customPresets: loadCustomPresetsFromStorage(),
  fitViewTrigger: 0,
  notification: null,

  // World Mode & CSS Cloud Transition State
  worldMode: 'lab',
  isTransitioningWorld: false,
  transitionTargetMode: null,

  // Outdoor Sandbox 2D Terrain Grid (40x20)
  terrainGrid: createDefaultOutdoorTerrain(GRID_ROWS, GRID_COLS),
  dirtExposureMap: {},
  terrainBrush: 'cursor',
  explosions: [],

  setWorldMode: (worldMode: WorldMode) => {
    set({
      worldMode,
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },

  triggerWorldTransition: (targetMode?: WorldMode) => {
    if (get().isTransitioningWorld) return;
    const nextMode: WorldMode = targetMode ?? (get().worldMode === 'lab' ? 'outside' : 'lab');

    set({
      isTransitioningWorld: true,
      transitionTargetMode: nextMode,
      selectedNodeId: null,
      selectedEdgeId: null,
    });

    if (typeof window === 'undefined') {
      set({
        worldMode: nextMode,
        isTransitioningWorld: false,
        transitionTargetMode: null,
      });
      return;
    }

    // 0.5s - 1.5s: Cloud fully covers screen -> switch worldMode at 1.0s midpoint
    window.setTimeout(() => {
      set({ worldMode: nextMode });
    }, 1000);

    // 1.5s - 2.0s: Cloud fades out -> complete transition at 2.0s
    window.setTimeout(() => {
      set({
        isTransitioningWorld: false,
        transitionTargetMode: null,
      });
    }, 2000);
  },

  setTerrainBrush: (brush: TerrainBrushTool) => {
    set({ terrainBrush: brush });
  },

  paintTerrainCell: (
    row: number,
    col: number,
    cellType: TerrainCellType,
    immediateGravity: boolean = false
  ) => {
    const currentGrid = get().terrainGrid;
    if (
      row < 0 ||
      row >= currentGrid.length ||
      col < 0 ||
      col >= (currentGrid[0]?.length ?? 0)
    ) {
      return;
    }
    if (currentGrid[row][col] === cellType && !immediateGravity) return;

    const updatedGrid = currentGrid.map((r, rIdx) =>
      rIdx === row ? r.map((c, cIdx) => (cIdx === col ? cellType : c)) : [...r]
    );

    // If a GRASS cell directly below the newly painted non-empty cell is now covered, revert it to DIRT
    if (cellType !== 'EMPTY' && row + 1 < updatedGrid.length && updatedGrid[row + 1][col] === 'GRASS') {
      updatedGrid[row + 1][col] = 'DIRT';
    }

    const finalGrid = immediateGravity
      ? settleTerrainGravityImmediate(updatedGrid)
      : updatedGrid;

    // Reset exposure tracking for modified column so 3s timer starts fresh when settled
    const nextExposureMap = { ...get().dirtExposureMap };
    delete nextExposureMap[`${row},${col}`];

    set({
      terrainGrid: finalGrid,
      dirtExposureMap: nextExposureMap,
    });
  },

  tickTerrainPhysics: (nowMs: number = Date.now()) => {
    const currentGrid = get().terrainGrid;
    const { nextGrid: afterGravityGrid, moved } = stepTerrainGravity(currentGrid);
    const {
      nextGrid: afterGrassGrid,
      nextExposureMap,
      changed: grassChanged,
    } = evaluateGrassGrowth(afterGravityGrid, get().dirtExposureMap, nowMs);

    if (moved || grassChanged) {
      set({
        terrainGrid: afterGrassGrid,
        dirtExposureMap: nextExposureMap,
      });
    }
  },

  settleAllTerrainGravity: () => {
    const settled = settleTerrainGravityImmediate(get().terrainGrid);
    set({ terrainGrid: settled });
  },

  resetOutdoorTerrain: () => {
    set({
      terrainGrid: createDefaultOutdoorTerrain(GRID_ROWS, GRID_COLS),
      dirtExposureMap: {},
    });
  },

  dismissExplosion: (explosionId: string) => {
    set({
      explosions: get().explosions.filter((exp) => exp.id !== explosionId),
    });
  },

  placeOutdoorComponent: (
    type: ComponentType,
    position: { x: number; y: number },
    containerSize: { width: number; height: number },
    options?: PlacementOptions
  ) => {
    const isId = get().language === 'id';
    const outcome = evaluateComponentDropPhysics(
      position,
      type,
      null,
      get().nodes,
      get().terrainGrid,
      containerSize
    );

    if (outcome.status === 'explode-height') {
      const explosionId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const explosionEvent: ExplosionEvent = {
        id: explosionId,
        x: outcome.impactBox.x,
        y: outcome.impactBox.y,
        width: outcome.impactBox.width,
        height: outcome.impactBox.height,
        label: type,
        reason: 'height',
        createdAt: Date.now(),
      };
      set({ explosions: [...get().explosions, explosionEvent] });
      get().notify(
        isId
          ? 'Komponen Hancur karena Jatuh dari Ketinggian!'
          : 'Component Destroyed from Falling Too High!'
      );
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          get().dismissExplosion(explosionId);
        }, 1200);
      }
      return false;
    }

    if (outcome.status === 'explode-water') {
      const explosionId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const explosionEvent: ExplosionEvent = {
        id: explosionId,
        x: outcome.impactBox.x,
        y: outcome.impactBox.y,
        width: outcome.impactBox.width,
        height: outcome.impactBox.height,
        label: type,
        reason: 'water',
        createdAt: Date.now(),
      };
      set({ explosions: [...get().explosions, explosionEvent] });
      get().notify('Komponen Korsleting/Hancur karena Air!');
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          get().dismissExplosion(explosionId);
        }, 1200);
      }
      return false;
    }

    if (outcome.status === 'overlap') {
      get().notify(
        isId
          ? `Penempatan ditolak: Bertabrakan dengan ${outcome.collidingNode.data.label}!`
          : `Placement rejected: Overlaps with ${outcome.collidingNode.data.label}!`
      );
      return false;
    }

    // Valid placement: automatically settled onto the terrain surface by gravity
    get().addComponent(type, outcome.settledPosition, options);
    return true;
  },

  settleOutdoorNodeAfterDrag: (
    nodeId: string,
    previousPosition: { x: number; y: number },
    containerSize: { width: number; height: number }
  ) => {
    const currentNodes = get().nodes;
    const draggedNode = currentNodes.find((n) => n.id === nodeId);
    if (!draggedNode) return;

    const isId = get().language === 'id';
    const outcome = evaluateComponentDropPhysics(
      draggedNode.position,
      draggedNode.data.type,
      nodeId,
      currentNodes,
      get().terrainGrid,
      containerSize
    );

    // 1. Height Tolerance Rule: If dropped from too high above ground -> Explode on impact!
    if (outcome.status === 'explode-height') {
      const explosionId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const explosionEvent: ExplosionEvent = {
        id: explosionId,
        x: outcome.impactBox.x,
        y: outcome.impactBox.y,
        width: outcome.impactBox.width,
        height: outcome.impactBox.height,
        label: draggedNode.data.label,
        reason: 'height',
        createdAt: Date.now(),
      };
      set({ explosions: [...get().explosions, explosionEvent] });
      get().removeComponent(nodeId);
      get().notify(
        isId
          ? 'Komponen Hancur karena Jatuh dari Ketinggian!'
          : 'Component Destroyed from Falling Too High!'
      );

      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          get().dismissExplosion(explosionId);
        }, 1200);
      }
      return;
    }

    // 2. Water Rule: If dropped on WATER grid cell -> Explode, remove component, and notify!
    if (outcome.status === 'explode-water') {
      const explosionId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const explosionEvent: ExplosionEvent = {
        id: explosionId,
        x: outcome.impactBox.x,
        y: outcome.impactBox.y,
        width: outcome.impactBox.width,
        height: outcome.impactBox.height,
        label: draggedNode.data.label,
        reason: 'water',
        createdAt: Date.now(),
      };
      set({ explosions: [...get().explosions, explosionEvent] });
      get().removeComponent(nodeId);
      get().notify('Komponen Korsleting/Hancur karena Air!');

      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          get().dismissExplosion(explosionId);
        }, 1200);
      }
      return;
    }

    // 3. Overlap Rule: If bounding box collides with another component -> reject & return to previousPosition
    if (outcome.status === 'overlap') {
      set({
        nodes: currentNodes.map((n) =>
          n.id === nodeId ? { ...n, position: { ...previousPosition } } : n
        ),
      });
      get().notify(
        isId
          ? `Posisi ditolak: Bertabrakan dengan ${outcome.collidingNode.data.label}!`
          : `Position rejected: Overlaps with ${outcome.collidingNode.data.label}!`
      );
      return;
    }

    // 4. Gravity Settlement: Snap component's Y onto the terrain surface so it never floats in mid-air
    if (
      draggedNode.position.x !== outcome.settledPosition.x ||
      draggedNode.position.y !== outcome.settledPosition.y
    ) {
      set({
        nodes: currentNodes.map((n) =>
          n.id === nodeId ? { ...n, position: { ...outcome.settledPosition } } : n
        ),
      });
    }
  },

  notify: (message: string) => {
    set({ notification: { id: Date.now(), message } });
  },

  dismissNotification: () => {
    set({ notification: null });
  },

  setLanguage: (language: AppLanguage) => {
    set({ language });
  },

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  setNodes: (updater) => {
    const currentNodes = get().nodes;
    const nextRawNodes = typeof updater === 'function' ? updater(currentNodes) : updater;
    const { simulation, updatedNodes } = recalculateCircuit(nextRawNodes, get().edges);
    set({
      nodes: updatedNodes,
      simulation,
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    const nextEdges = applyEdgeChanges(changes, get().edges);
    const { simulation, updatedNodes } = recalculateCircuit(get().nodes, nextEdges);
    const isSelectedEdgeStillPresent = nextEdges.some((e) => e.id === get().selectedEdgeId);
    set({
      edges: nextEdges,
      simulation,
      nodes: updatedNodes,
      selectedEdgeId: isSelectedEdgeStillPresent ? get().selectedEdgeId : null,
    });
  },

  onConnect: (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    const isId = get().language === 'id';

    // Prevent accidental self-loop wires (e.g. dragging + directly to - on the same Transmission Tower or component)
    if (connection.source === connection.target) {
      get().notify(
        isId
          ? 'Kabel dibatalkan: Tidak bisa menghubungkan kutub (+) langsung ke (-) pada komponen yang sama!'
          : 'Wire cancelled: Cannot connect (+) directly to (-) on the same component!'
      );
      return;
    }

    const currentNodes = get().nodes;
    const sourceNode = currentNodes.find((n) => n.id === connection.source);
    const targetNode = currentNodes.find((n) => n.id === connection.target);

    // Standalone bulbs CANNOT be wired directly (must be snapped into their respective sockets).
    // Pin-base bulbs ('halogen', 'led_green') must go into ceramic pin sockets; screw-base into E27 sockets.
    const sourceIsPassive = sourceNode?.data.type === 'bulb';
    const targetIsPassive = targetNode?.data.type === 'bulb';

    if (sourceIsPassive || targetIsPassive) {
      const passiveNode = sourceIsPassive ? sourceNode : targetNode;
      const isPinBulb =
        passiveNode?.data.bulbType === 'halogen' || passiveNode?.data.bulbType === 'led_green';
      get().notify(
        isPinBulb
          ? (isId
              ? 'Lampu pin (Halogen & LED Indikator) harus dipasang ke fiting pin keramik terlebih dahulu!'
              : 'Pin-base bulbs (Halogen & Indicator LED) must be installed into a ceramic pin socket first!')
          : (isId
              ? 'Lampu ulir (E27) harus dipasang ke fiting lampu (Socket) terlebih dahulu!'
              : 'Screw-base bulbs (E27) must be installed into a lamp socket first!')
      );
      return;
    }

    const customEdge: Edge = {
      ...connection,
      id: `wire_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'wire',
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    };

    const nextEdges = addEdge(customEdge, get().edges);
    const { simulation, updatedNodes } = recalculateCircuit(currentNodes, nextEdges);

    set({
      edges: nextEdges,
      simulation,
      nodes: updatedNodes,
    });
  },

  addComponent: (
    type: ComponentType,
    position: { x: number; y: number },
    options?: PlacementOptions
  ) => {
    const componentId = `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const isId = get().language === 'id';
    const activeWorldMode = get().worldMode;
    let defaultData: CircuitElementData = {
      id: componentId,
      type,
      worldMode: activeWorldMode,
      label: type.charAt(0).toUpperCase() + type.slice(1),
    };

    switch (type) {
      case 'battery':
        defaultData = {
          ...defaultData,
          voltage: 1.5,
          capacity: 1000,
          currentCharge: 100,
          chargeState: 'idle',
          label: isId ? 'Baterai AA 1.5V' : '1.5V AA Battery',
        };
        break;
      case 'battery9v':
        defaultData = {
          ...defaultData,
          voltage: 9.0,
          internalResistance: 2.0,
          capacity: 500,
          currentCharge: 100,
          chargeState: 'idle',
          label: isId ? 'Baterai 9V' : '9V Battery',
        };
        break;
      case 'battery-holder':
        defaultData = {
          ...defaultData,
          hasBattery: false,
          batteryCount: 0,
          voltage: 0,
          capacity: 2000,
          currentCharge: 100,
          chargeState: 'idle',
          label: isId ? 'Wadah Baterai AA' : 'Dual AA Holder',
        };
        break;
      case 'solar-panel':
      case 'solar_panel': {
        const defaultSunlight = 100;
        const v = getSolarPanelVoltage(defaultSunlight);
        defaultData = {
          ...defaultData,
          type: 'solar-panel',
          sunlight: defaultSunlight,
          voltage: v,
          internalResistance: SOLAR_PANEL_INTERNAL_RESISTANCE,
          label: isId ? 'Panel Surya' : 'Solar Panel',
        };
        break;
      }
      case 'transmission-tower':
      case 'transmission_tower':
        defaultData = {
          ...defaultData,
          type: 'transmission-tower',
          isMcbOn: true,
          isMcbTripped: false,
          stepDownVoltage: null,
          label:
            activeWorldMode === 'outside'
              ? isId
                ? 'Menara Transmisi'
                : 'Transmission Tower'
              : isId
              ? 'Panel Distribusi Lab'
              : 'Lab Distribution Panel',
        };
        break;
      case 'wind-turbine':
      case 'wind_turbine': {
        const defaultSpeed = 50;
        const outVoltage = (defaultSpeed / 100) * 12.0;
        defaultData = {
          ...defaultData,
          type: 'wind-turbine',
          speed: defaultSpeed,
          voltage: outVoltage,
          internalResistance: 0.1,
          label: isId ? 'Turbin Angin' : 'Wind Turbine',
        };
        break;
      }
      case 'resistor':
        defaultData = {
          ...defaultData,
          resistance: 100,
          label: isId ? 'Resistor 100Ω' : '100Ω Resistor',
        };
        break;
      case 'bulb': {
        const chosenBulbSpec = getBulbSpec(options?.bulbType);
        defaultData = {
          ...defaultData,
          bulbType: chosenBulbSpec.type,
          resistance: chosenBulbSpec.resistance,
          power: 0,
          powerRating: chosenBulbSpec.maxPower,
          label: isId ? chosenBulbSpec.label : chosenBulbSpec.labelEn,
        };
        break;
      }
      case 'switch':
        defaultData = {
          ...defaultData,
          isOpen: false,
          label: isId ? 'Saklar Listrik' : 'SPST Switch',
        };
        break;
      case 'ground':
        defaultData = {
          ...defaultData,
          label: isId ? 'Ground (0V)' : '0V Earth Ground',
        };
        break;
      case 'voltmeter':
        defaultData = {
          ...defaultData,
          label: isId ? 'Voltmeter Digital' : 'Digital Voltmeter',
        };
        break;
      case 'ammeter':
        defaultData = {
          ...defaultData,
          label: isId ? 'Amperemeter Digital' : 'Digital Ammeter',
        };
        break;
      case 'socket':
        defaultData = {
          ...defaultData,
          label: isId ? 'Fiting Lampu (Ulir)' : 'Bulb Socket (Screw)',
        };
        break;
      case 'pin-socket':
        defaultData = {
          ...defaultData,
          label: isId ? 'Fiting Keramik Putih' : 'Ceramic Pin Socket',
        };
        break;
    }

    const newNode: Node<CircuitElementData> = {
      id: componentId,
      type,
      position,
      data: defaultData,
    };

    const nextNodes = [...get().nodes, newNode];
    const { simulation, updatedNodes } = recalculateCircuit(nextNodes, get().edges);

    set({
      nodes: updatedNodes,
      simulation,
      selectedNodeId: componentId,
    });
  },

  updateComponentData: (id: string, partialData: Partial<CircuitElementData>) => {
    const nextNodes = get().nodes.map((node) => {
      if (node.id === id) {
        return {
          ...node,
          data: {
            ...node.data,
            ...partialData,
          },
        };
      }
      return node;
    });

    const { simulation, updatedNodes } = recalculateCircuit(nextNodes, get().edges);
    set({
      nodes: updatedNodes,
      simulation,
    });
  },

  setBulbType: (id: string, bulbType: BulbType) => {
    const nextSpec = getBulbSpec(bulbType);
    const isId = get().language === 'id';
    const targetNode = get().nodes.find(
      (n) =>
        n.id === id ||
        n.data.bulbId === id ||
        (n.data.installedBulb &&
          typeof n.data.installedBulb === 'object' &&
          n.data.installedBulb.id === id)
    );
    if (!targetNode) return;

    if (targetNode.data.type === 'socket') {
      if (!canBulbFitSocket(nextSpec.type)) {
        get().detachBulbFromSocket(targetNode.id);
        get().notify(SOCKET_NOTICES.detachedByType[isId ? 'id' : 'en']);
        return;
      }
      if (targetNode.data.installedBulb) {
        const existingBulb =
          typeof targetNode.data.installedBulb === 'object'
            ? targetNode.data.installedBulb
            : { id: `bulb_${Date.now()}` };
        get().updateComponentData(targetNode.id, {
          installedBulb: {
            ...existingBulb,
            bulbType: nextSpec.type,
            resistance: nextSpec.resistance,
            powerRating: nextSpec.maxPower,
            isBlown: false,
            label: isId ? nextSpec.label : nextSpec.labelEn,
          },
        });
      }
      return;
    }

    if (targetNode.data.type === 'pin-socket') {
      if (!canBulbFitPinSocket(nextSpec.type)) {
        get().detachBulbFromSocket(targetNode.id);
        get().notify(
          isId
            ? 'Lampu dilepas dari fiting keramik karena bukan tipe pin (Halogen & LED Indikator).'
            : 'Bulb detached from ceramic socket because it is not a pin-base bulb (Halogen & Indicator LED).'
        );
        return;
      }
      if (targetNode.data.installedBulb) {
        const existingBulb =
          typeof targetNode.data.installedBulb === 'object'
            ? targetNode.data.installedBulb
            : { id: `bulb_${Date.now()}` };
        get().updateComponentData(targetNode.id, {
          installedBulb: {
            ...existingBulb,
            bulbType: nextSpec.type,
            resistance: nextSpec.resistance,
            powerRating: nextSpec.maxPower,
            isBlown: false,
            label: isId ? nextSpec.label : nextSpec.labelEn,
          },
        });
      }
      return;
    }

    const wasSnapped = Boolean(targetNode.data.socketId);
    get().updateComponentData(id, {
      bulbType: nextSpec.type,
      label: isId ? nextSpec.label : nextSpec.labelEn,
      resistance: nextSpec.resistance,
      powerRating: nextSpec.maxPower,
      isBlown: false,
    });

    // A pin-base bulb cannot stay in a screw socket
    if (wasSnapped && !canBulbFitSocket(nextSpec.type)) {
      get().detachBulbFromSocket(id);
      get().notify(SOCKET_NOTICES.detachedByType[isId ? 'id' : 'en']);
    }
  },

  removeComponent: (id: string) => {
    const targetNode = get().nodes.find((n) => n.id === id);
    let nextEdges = [...get().edges];

    // Auto-heal wires when deleting a waypoint anchor
    if (targetNode?.data.type === 'waypoint') {
      const incomingEdge = nextEdges.find((e) => e.target === id);
      const outgoingEdge = nextEdges.find((e) => e.source === id);

      if (incomingEdge && outgoingEdge) {
        const bridgedEdge: Edge = {
          id: `wire_${Date.now()}_healed`,
          type: 'wire',
          source: incomingEdge.source,
          sourceHandle: incomingEdge.sourceHandle,
          target: outgoingEdge.target,
          targetHandle: outgoingEdge.targetHandle,
        };
        nextEdges = nextEdges.filter(
          (e) => e.id !== incomingEdge.id && e.id !== outgoingEdge.id
        );
        nextEdges.push(bridgedEdge);
      } else {
        nextEdges = nextEdges.filter((e) => e.source !== id && e.target !== id);
      }
    } else {
      nextEdges = nextEdges.filter((e) => e.source !== id && e.target !== id);
    }

    // Release any bulb/socket pairing that involved the removed node (snap wires were
    // already dropped by the edge filters above because they touch the removed node).
    const nextNodes = get()
      .nodes.filter((node) => node.id !== id)
      .map((node) => {
        if (node.data.bulbId === id) {
          return { ...node, data: { ...node.data, bulbId: undefined } };
        }
        if (node.data.socketId === id) {
          return { ...node, data: { ...node.data, socketId: undefined } };
        }
        return node;
      });
    const { simulation, updatedNodes } = recalculateCircuit(nextNodes, nextEdges);

    set({
      nodes: updatedNodes,
      edges: nextEdges,
      simulation,
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    });
  },

  /**
   * Called when the user releases a dragged bulb.
   * - If dropped near a free socket and base matches ('screw'), snaps into the socket.
   * - The bulb is absorbed into SocketNode.installedBulb and rendered inside SocketNode.
   * - If base is incompatible ('pin', like Halogen), rejects with notice and pushes away.
   * Time Complexity: O(N + E).
   *
   * @param bulbId - Id of the bulb node that was just dropped
   */
  settleBulbAfterDrag: (bulbId: string) => {
    try {
      const currentNodes = get().nodes;
      const bulbNode = currentNodes.find((n) => n.id === bulbId && n.data.type === 'bulb');
      if (!bulbNode) return;
      const isId = get().language === 'id';

      // Find nearest free socket (supports both 'socket' and 'pin-socket') within SNAP_RADIUS
      const targetSocket = findNearestFreeSocket(bulbNode, currentNodes);
      if (!targetSocket) return;

      const isPinSocket = targetSocket.data.type === 'pin-socket';
      const bulbType = bulbNode.data.bulbType ?? 'incandescent';

      if (isPinSocket) {
        // Pin socket only allows halogen (or compatible pin bulb)
        if (!canBulbFitPinSocket(bulbType)) {
          set({
            nodes: currentNodes.map((n) =>
              n.id === bulbId
                ? {
                    ...n,
                    position: {
                      x: targetSocket.position.x + REJECT_PUSH_DISTANCE,
                      y: targetSocket.position.y,
                    },
                  }
                : n
            ),
          });
          get().notify(SOCKET_NOTICES.pinOnly[isId ? 'id' : 'en']);
          return;
        }
      } else {
        // Standard E27 socket only allows screw-base bulbs
        if (!canBulbFitSocket(bulbType)) {
          set({
            nodes: currentNodes.map((n) =>
              n.id === bulbId
                ? {
                    ...n,
                    position: {
                      x: targetSocket.position.x + REJECT_PUSH_DISTANCE,
                      y: targetSocket.position.y,
                    },
                  }
                : n
            ),
          });
          get().notify(SOCKET_NOTICES.screwOnly[isId ? 'id' : 'en']);
          return;
        }
      }

      const installedBulb = {
        id: bulbId,
        bulbType,
        resistance: bulbNode.data.resistance,
        powerRating: bulbNode.data.powerRating,
        isBlown: bulbNode.data.isBlown,
        label: bulbNode.data.label,
      };

      // Absorb the bulb into target socket and remove standalone bulb node
      const nextNodes = currentNodes
        .filter((n) => n.id !== bulbId)
        .map((n) => {
          if (n.id === targetSocket.id) {
            return {
              ...n,
              data: {
                ...n.data,
                installedBulb,
                bulbId,
              },
            };
          }
          return n;
        });

      const nextEdges = removeSnapEdges(get().edges, bulbId);
      const { simulation, updatedNodes } = recalculateCircuit(nextNodes, nextEdges);

      set({
        nodes: updatedNodes,
        edges: nextEdges,
        simulation,
        selectedNodeId: targetSocket.id,
      });
    } catch (error) {
      console.warn('Failed to settle bulb after drag:', error);
    }
  },

  /**
   * Detaches a bulb from its socket (E27 socket or ceramic pin socket):
   * - Clears installedBulb from socket node (socket becomes open circuit).
   * - Restores the bulb as a separate standalone node on the canvas (no handles, purely inventory item).
   * Time Complexity: O(N + E).
   *
   * @param identifier - Id of the socket or the bulb to detach
   */
  detachBulbFromSocket: (identifier: string) => {
    try {
      const currentNodes = get().nodes;
      const isId = get().language === 'id';

      // Find socket holding this bulb or socket with this id
      const targetSocket = currentNodes.find(
        (n) =>
          (n.data.type === 'socket' || n.data.type === 'pin-socket') &&
          (n.id === identifier ||
            n.data.bulbId === identifier ||
            (n.data.installedBulb &&
              typeof n.data.installedBulb === 'object' &&
              n.data.installedBulb.id === identifier))
      );

      if (!targetSocket || !targetSocket.data.installedBulb) {
        // Fallback for standalone bulb node if any socketId reference lingers
        const nextNodes = currentNodes.map((n) => {
          if (n.id === identifier) return { ...n, data: { ...n.data, socketId: undefined } };
          if (n.data.bulbId === identifier) return { ...n, data: { ...n.data, bulbId: undefined, installedBulb: undefined } };
          return n;
        });
        const nextEdges = removeSnapEdges(get().edges, identifier);
        const { simulation, updatedNodes } = recalculateCircuit(nextNodes, nextEdges);
        set({ nodes: updatedNodes, edges: nextEdges, simulation });
        return;
      }

      const installed = targetSocket.data.installedBulb;
      const bulbType: BulbType =
        typeof installed === 'object' ? installed.bulbType : (installed ?? 'incandescent');
      const bulbId: string =
        (typeof installed === 'object' ? installed.id : targetSocket.data.bulbId) ||
        `bulb_${Date.now()}`;
      const spec = getBulbSpec(bulbType);
      const resistance = typeof installed === 'object' ? installed.resistance : undefined;
      const powerRating = typeof installed === 'object' ? installed.powerRating : undefined;
      const isBlown = typeof installed === 'object' ? installed.isBlown : false;

      // Restore detached bulb as a standalone node on canvas (purely inventory, NO handles)
      const detachedBulbNode: Node<CircuitElementData> = {
        id: bulbId,
        type: 'bulb',
        position: {
          x: targetSocket.position.x + 120,
          y: targetSocket.position.y - 10,
        },
        data: {
          id: bulbId,
          type: 'bulb',
          bulbType,
          resistance: resistance ?? spec.resistance,
          powerRating: powerRating ?? spec.maxPower,
          isBlown,
          label: isId ? spec.label : spec.labelEn,
        },
      };

      // Clear the socket so it becomes open circuit
      const nextNodes = currentNodes.map((n) => {
        if (n.id === targetSocket.id) {
          return {
            ...n,
            data: {
              ...n.data,
              installedBulb: undefined,
              bulbId: undefined,
            },
          };
        }
        return n;
      });

      nextNodes.push(detachedBulbNode);

      const nextEdges = removeSnapEdges(get().edges, bulbId);
      const { simulation, updatedNodes } = recalculateCircuit(nextNodes, nextEdges);

      set({
        nodes: updatedNodes,
        edges: nextEdges,
        simulation,
        selectedNodeId: detachedBulbNode.id,
      });
    } catch (error) {
      console.warn('Failed to detach bulb from socket:', error);
    }
  },

  /**
   * Moves the bulb screwed into a socket together with that socket while it is being dragged.
   * Position-only update (no physics solve) so dragging stays smooth. O(N).
   *
   * @param socketId - Socket being dragged
   * @param socketPosition - Socket's current top-left position
   */
  syncSnappedBulbPosition: (socketId: string, socketPosition: { x: number; y: number }) => {
    const socketNode = get().nodes.find((n) => n.id === socketId);
    const attachedBulbId = socketNode?.data.bulbId;
    if (!attachedBulbId) return;
    const snapPosition = getBulbSnapPosition(socketPosition);
    set({
      nodes: get().nodes.map((n) =>
        n.id === attachedBulbId ? { ...n, position: snapPosition } : n
      ),
    });
  },

  insertBatteryIntoHolder: (batteryNodeId: string, holderNodeId: string) => {
    const currentNodes = get().nodes;
    const holderNode = currentNodes.find(
      (n) => n.id === holderNodeId && n.data.type === 'battery-holder'
    );
    const batteryNode = currentNodes.find(
      (n) => n.id === batteryNodeId && n.data.type === 'battery'
    );

    if (!holderNode || !batteryNode) return;

    const currentCount = holderNode.data.batteryCount ?? (holderNode.data.hasBattery ? 2 : 0);
    if (currentCount >= 2) return; // Holder already full (max 2 AA cells)

    const nextCount = Math.min(2, currentCount + 1);
    const nextVoltage = nextCount * 1.5;

    // Remove the dropped BatteryNode and any edges connected to it
    const nextEdges = get().edges.filter(
      (edge) => edge.source !== batteryNodeId && edge.target !== batteryNodeId
    );
    const nextNodes = currentNodes
      .filter((node) => node.id !== batteryNodeId)
      .map((node) => {
        if (node.id === holderNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              hasBattery: true,
              batteryCount: nextCount,
              voltage: nextVoltage,
            },
          };
        }
        return node;
      });

    const { simulation, updatedNodes } = recalculateCircuit(nextNodes, nextEdges);

    set({
      nodes: updatedNodes,
      edges: nextEdges,
      simulation,
      selectedNodeId: holderNodeId,
    });
  },

  ejectBatteryFromHolder: (holderNodeId: string) => {
    const currentNodes = get().nodes;
    const holderNode = currentNodes.find(
      (n) => n.id === holderNodeId && n.data.type === 'battery-holder'
    );
    if (!holderNode) return;

    const currentCount = holderNode.data.batteryCount ?? (holderNode.data.hasBattery ? 2 : 0);
    if (currentCount <= 0) return;

    const nextCount = Math.max(0, currentCount - 1);
    const nextVoltage = nextCount * 1.5;

    const ejectedId = `battery_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const ejectedBatteryNode: Node<CircuitElementData> = {
      id: ejectedId,
      type: 'battery',
      position: {
        x: holderNode.position.x - 160,
        y: holderNode.position.y + (currentCount === 2 ? 0 : 40),
      },
      data: {
        id: ejectedId,
        type: 'battery',
        voltage: 1.5,
        capacity: 1000,
        currentCharge: holderNode.data.currentCharge ?? 100,
        chargeState: 'idle',
        label: get().language === 'id' ? 'Baterai AA 1.5V' : '1.5V AA Battery',
      },
    };

    const nextNodes = [
      ...currentNodes.map((node) => {
        if (node.id === holderNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              hasBattery: nextCount > 0,
              batteryCount: nextCount,
              voltage: nextVoltage,
            },
          };
        }
        return node;
      }),
      ejectedBatteryNode,
    ];

    const { simulation, updatedNodes } = recalculateCircuit(nextNodes, get().edges);

    set({
      nodes: updatedNodes,
      simulation,
      selectedNodeId: holderNodeId,
    });
  },

  splitEdgeWithWaypoint: (edgeId: string, position: { x: number; y: number }) => {
    const currentEdges = get().edges;
    const targetEdge = currentEdges.find((e) => e.id === edgeId);
    if (!targetEdge) return;

    const waypointId = `wp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const waypointNode: Node<CircuitElementData> = {
      id: waypointId,
      type: 'waypoint',
      position: { x: position.x - 10, y: position.y - 10 },
      data: {
        id: waypointId,
        type: 'waypoint',
        worldMode: get().worldMode,
        label: 'Anchor',
      },
    };

    const edgeToWaypoint: Edge = {
      id: `wire_${Date.now()}_a`,
      type: 'wire',
      source: targetEdge.source,
      sourceHandle: targetEdge.sourceHandle,
      target: waypointId,
      targetHandle: 'p1',
    };

    const edgeFromWaypoint: Edge = {
      id: `wire_${Date.now()}_b`,
      type: 'wire',
      source: waypointId,
      sourceHandle: 'p2',
      target: targetEdge.target,
      targetHandle: targetEdge.targetHandle,
    };

    const remainingEdges = currentEdges.filter((e) => e.id !== edgeId);
    const nextEdges = [...remainingEdges, edgeToWaypoint, edgeFromWaypoint];
    const nextNodes = [...get().nodes, waypointNode];

    const { simulation, updatedNodes } = recalculateCircuit(nextNodes, nextEdges);

    set({
      nodes: updatedNodes,
      edges: nextEdges,
      simulation,
      selectedNodeId: waypointId,
      selectedEdgeId: null,
    });
  },

  /**
   * Splits an existing wire edge at the geometric midpoint between its source and target nodes.
   * Useful for single-tap mobile users via the top floating toolbar.
   * Time Complexity: O(N + E)
   */
  splitEdgeAtMidpoint: (edgeId: string) => {
    const currentEdges = get().edges;
    const currentNodes = get().nodes;
    const targetEdge = currentEdges.find((e) => e.id === edgeId);
    if (!targetEdge) return;

    const sourceNode = currentNodes.find((n) => n.id === targetEdge.source);
    const targetNode = currentNodes.find((n) => n.id === targetEdge.target);

    const midX =
      sourceNode && targetNode
        ? (sourceNode.position.x + targetNode.position.x) / 2 + 60
        : 300;
    const midY =
      sourceNode && targetNode
        ? (sourceNode.position.y + targetNode.position.y) / 2 + 60
        : 200;

    get().splitEdgeWithWaypoint(edgeId, { x: midX, y: midY });
  },

  /**
   * Removes a wire connection between components and immediately recalculates the circuit.
   * Time Complexity: O(E) where E is the number of wire edges (typically < 50).
   * @param edgeId Unique identifier of the edge to be removed
   */
  removeEdge: (edgeId: string) => {
    const currentEdges = get().edges;
    const nextEdges = currentEdges.filter((edge) => edge.id !== edgeId);
    if (nextEdges.length === currentEdges.length) return; // Edge not found

    const nextSelectedEdgeId = get().selectedEdgeId === edgeId ? null : get().selectedEdgeId;
    const { simulation, updatedNodes } = recalculateCircuit(get().nodes, nextEdges);

    set({
      edges: nextEdges,
      simulation,
      nodes: updatedNodes,
      selectedEdgeId: nextSelectedEdgeId,
    });
  },

  /**
   * Disconnects and removes all user wire edges attached to a specific component node.
   * Useful when a wire is hard to tap on mobile or when clearing a component's connections.
   * Time Complexity: O(E + N) where E is edge count and N is node count.
   *
   * @param nodeId - Target component node ID whose wires should be removed
   */
  disconnectNodeWires: (nodeId: string) => {
    const currentEdges = get().edges;
    const nextEdges = currentEdges.filter(
      (edge) =>
        edge.data?.isSnapWire ||
        (edge.source !== nodeId && edge.target !== nodeId && edge.source !== edge.target)
    );
    if (nextEdges.length === currentEdges.length) return;

    const { simulation, updatedNodes } = recalculateCircuit(get().nodes, nextEdges);
    const isId = get().language === 'id';

    set({
      edges: nextEdges,
      simulation,
      nodes: updatedNodes,
      selectedEdgeId: null,
    });
    get().notify(
      isId
        ? 'Semua kabel pada komponen ini berhasil diputus!'
        : 'All wires on this component have been disconnected!'
    );
  },

  /**
   * Resets the MCB safety breaker on an indoor Lab Distribution Panel.
   * If the output wires are still physically short-circuited (dead short), the PUIL safety
   * mechanism will immediately trip the breaker again to protect equipment. In this case,
   * it alerts the user with an actionable educational explanation instead of failing silently.
   *
   * Time Complexity: O(N + M^3) where N is node count and M is MNA matrix dimension.
   *
   * @param id - Unique node ID of the target Lab Distribution Panel
   * @returns boolean indicating whether reset succeeded (false if active short circuit blocked it)
   */
  resetLabPanelMcb: (id: string): boolean => {
    const isId = get().language === 'id';
    const targetNode = get().nodes.find((node) => node.id === id);
    if (!targetNode) return false;

    // Tentatively arm the MCB
    const candidateNodes = get().nodes.map((node) =>
      node.id === id
        ? {
            ...node,
            data: {
              ...node.data,
              isMcbOn: true,
              isMcbTripped: false,
            },
          }
        : node
    );

    const { simulation, updatedNodes } = recalculateCircuit(candidateNodes, get().edges);
    const resultingNode = updatedNodes.find((node) => node.id === id);
    const isStillTripped = Boolean(resultingNode?.data.isMcbTripped);

    set({
      nodes: updatedNodes,
      simulation,
    });

    if (isStillTripped) {
      get().notify(
        isId
          ? '⚠️ Gagal reset MCB! Kabel (+) dan (-) masih korsleting langsung. Putus atau pisahkan kabel terlebih dahulu!'
          : '⚠️ MCB Reset Failed! Output wires (+) and (-) are still short-circuited. Disconnect shorted wire first!'
      );
      return false;
    }

    get().notify(
      isId
        ? '✅ Tuas MCB Panel Distribusi Lab: ON (Aliran Listrik Terhubung)'
        : '✅ Lab Distribution Panel MCB: ON (Grid Connected)'
    );
    return true;
  },

  /**
   * One-tap recovery: Disconnects all wires attached to the Lab Distribution Panel and
   * resets the MCB breaker to ON. Solves the issue where shorted wires are hard to deselect on mobile.
   *
   * Time Complexity: O(E + N + M^3) where E is edge count, N is node count, and M is MNA dimension.
   *
   * @param id - Unique node ID of the target Lab Distribution Panel
   */
  disconnectAndResetMcb: (id: string) => {
    const isId = get().language === 'id';
    const currentEdges = get().edges;
    const nextEdges = currentEdges.filter(
      (edge) =>
        edge.data?.isSnapWire ||
        (edge.source !== id && edge.target !== id && edge.source !== edge.target)
    );

    const candidateNodes = get().nodes.map((node) =>
      node.id === id
        ? {
            ...node,
            data: {
              ...node.data,
              isMcbOn: true,
              isMcbTripped: false,
            },
          }
        : node
    );

    const { simulation, updatedNodes } = recalculateCircuit(candidateNodes, nextEdges);

    set({
      edges: nextEdges,
      nodes: updatedNodes,
      simulation,
      selectedEdgeId: null,
    });

    get().notify(
      isId
        ? '✅ Kabel korslet dilepas & MCB Panel Distribusi berhasil di-reset (ON)!'
        : '✅ Shorted wires removed & Lab MCB successfully reset (ON)!'
    );
  },

  selectNode: (id: string | null) => {
    set({
      selectedNodeId: id,
      selectedEdgeId: id ? null : get().selectedEdgeId,
      edges: id ? get().edges.map((edge) => ({ ...edge, selected: false })) : get().edges,
    });
  },

  selectEdge: (id: string | null) => {
    set({
      selectedEdgeId: id,
      selectedNodeId: id ? null : get().selectedNodeId,
      edges: get().edges.map((edge) => ({
        ...edge,
        selected: edge.id === id,
      })),
    });
  },

  toggleSwitch: (id: string) => {
    const targetNode = get().nodes.find((n) => n.id === id);
    if (!targetNode || targetNode.data.type !== 'switch') return;

    get().updateComponentData(id, { isOpen: !targetNode.data.isOpen });
  },

  clearCanvas: () => {
    saveWorkspaceAutosave([], []);
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      simulation: DEFAULT_SIMULATION,
    });
  },

  setIsSimulating: (isSimulating: boolean) => {
    set({ isSimulating });
  },

  runSimulation: () => {
    const { simulation, updatedNodes } = recalculateCircuit(get().nodes, get().edges);
    set({ simulation, nodes: updatedNodes });
  },

  tickBatteryCharge: (deltaSeconds = 1) => {
    const state = get();
    if (!state.isSimulating) return;

    let hasChanged = false;
    const currentNodes = state.nodes;

    const nextNodes = currentNodes.map((node) => {
      if (
        node.data.type !== 'battery' &&
        node.data.type !== 'battery9v' &&
        node.data.type !== 'battery-holder'
      ) {
        return node;
      }

      // For holder, only process if it actually has batteries inserted
      if (
        node.data.type === 'battery-holder' &&
        (!node.data.hasBattery || (node.data.batteryCount ?? 0) <= 0)
      ) {
        return node;
      }

      const currentCharge = node.data.currentCharge ?? 100;
      const capacity =
        node.data.capacity ??
        getDefaultBatteryCapacity(node.data.type, node.data.batteryCount);
      const branchCurrent = state.simulation.branchCurrents[node.id] ?? 0;

      const { newCharge, chargeState } = stepBatteryCharge(
        currentCharge,
        capacity,
        branchCurrent,
        deltaSeconds
      );

      // Check if charge changed or state changed
      if (
        Math.abs(newCharge - currentCharge) > 1e-4 ||
        chargeState !== node.data.chargeState
      ) {
        hasChanged = true;
        return {
          ...node,
          data: {
            ...node.data,
            currentCharge: newCharge,
            capacity,
            chargeState,
          },
        };
      }

      return node;
    });

    if (hasChanged) {
      const { simulation, updatedNodes } = recalculateCircuit(nextNodes, state.edges);
      set({
        nodes: updatedNodes,
        simulation,
      });
    }
  },

  rechargeBattery: (nodeId: string) => {
    const nextNodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            currentCharge: 100,
            chargeState: 'idle' as const,
          },
        };
      }
      return node;
    });
    const { simulation, updatedNodes } = recalculateCircuit(nextNodes, get().edges);
    set({ nodes: updatedNodes, simulation });
  },

  rechargeAllBatteries: () => {
    const nextNodes = get().nodes.map((node) => {
      if (
        node.data.type === 'battery' ||
        node.data.type === 'battery9v' ||
        node.data.type === 'battery-holder'
      ) {
        return {
          ...node,
          data: {
            ...node.data,
            currentCharge: 100,
            chargeState: 'idle' as const,
          },
        };
      }
      return node;
    });
    const { simulation, updatedNodes } = recalculateCircuit(nextNodes, get().edges);
    set({ nodes: updatedNodes, simulation });
  },

  startBatteryInterval: () => {
    if (typeof window === 'undefined') {
      return () => {};
    }
    const intervalId = window.setInterval(() => {
      get().tickBatteryCharge(1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  },

  loadPreset: (presetName) => {
    let presetNodes: Node<CircuitElementData>[] = [];
    let presetEdges: Edge[] = [];

    if (presetName === 'simple-lamp') {
      presetNodes = [
        {
          id: 'bat_extra',
          type: 'battery',
          position: { x: -220, y: 150 },
          data: { id: 'bat_extra', type: 'battery', voltage: 1.5, label: 'Baterai AA 1.5V' },
        },
        {
          id: 'holder_1',
          type: 'battery-holder',
          position: { x: 20, y: 110 },
          data: {
            id: 'holder_1',
            type: 'battery-holder',
            hasBattery: true,
            batteryCount: 2,
            voltage: 3.0,
            label: 'Wadah AA (3.0V)',
          },
        },
        {
          id: 'sw_1',
          type: 'switch',
          position: { x: 340, y: 20 },
          data: { id: 'sw_1', type: 'switch', isOpen: false, label: 'Saklar Utama' },
        },
        {
          id: 'bulb_1',
          type: 'socket',
          position: { x: 660, y: 185 },
          data: {
            id: 'bulb_1',
            type: 'socket',
            bulbType: 'incandescent',
            resistance: 800,
            powerRating: 40,
            label: 'Fiting + Lampu Pijar',
            installedBulb: {
              id: 'bulb_1_unit',
              bulbType: 'incandescent',
              resistance: 800,
              powerRating: 40,
              label: 'Lampu Pijar',
            },
          },
        },
        {
          id: 'wp_s1',
          type: 'waypoint',
          position: { x: 840, y: 430 },
          data: { id: 'wp_s1', type: 'waypoint', label: 'Sudut Kanan Bawah' },
        },
        {
          id: 'wp_s2',
          type: 'waypoint',
          position: { x: 115, y: 430 },
          data: { id: 'wp_s2', type: 'waypoint', label: 'Sudut Kiri Bawah' },
        },
      ];
      presetEdges = [
        { id: 'e1', source: 'holder_1', sourceHandle: 'pos', target: 'sw_1', targetHandle: 'p1', type: 'wire' },
        { id: 'e2', source: 'sw_1', sourceHandle: 'p2', target: 'bulb_1', targetHandle: 'p1', type: 'wire' },
        { id: 'e3', source: 'bulb_1', sourceHandle: 'p2', target: 'wp_s1', targetHandle: 'p1', type: 'wire' },
        { id: 'e4', source: 'wp_s1', sourceHandle: 'p2', target: 'wp_s2', targetHandle: 'p1', type: 'wire' },
        { id: 'e5', source: 'wp_s2', sourceHandle: 'p2', target: 'holder_1', targetHandle: 'neg', type: 'wire' },
      ];
    } else if (presetName === 'voltage-divider') {
      // Textbook SERI Circuit: V source on Left, R1 on Top, R2 on Right, R3 on Bottom (I = I1 = I2 = I3)
      presetNodes = [
        {
          id: 'holder_1',
          type: 'battery-holder',
          position: { x: 20, y: 190 },
          data: {
            id: 'holder_1',
            type: 'battery-holder',
            hasBattery: true,
            batteryCount: 2,
            voltage: 3.0,
            label: 'Sumber V (3.0V)',
          },
        },
        {
          id: 'bulb_1',
          type: 'socket',
          position: { x: 400, y: 65 },
          data: {
            id: 'bulb_1',
            type: 'socket',
            bulbType: 'incandescent',
            resistance: 800,
            powerRating: 40,
            label: 'Fiting + Lampu Pijar 1',
            installedBulb: {
              id: 'bulb_1_unit',
              bulbType: 'incandescent',
              resistance: 800,
              powerRating: 40,
              label: 'Lampu Pijar',
            },
          },
        },
        {
          id: 'bulb_2',
          type: 'socket',
          position: { x: 760, y: 245 },
          data: {
            id: 'bulb_2',
            type: 'socket',
            bulbType: 'incandescent',
            resistance: 800,
            powerRating: 40,
            label: 'Fiting + Lampu Pijar 2',
            installedBulb: {
              id: 'bulb_2_unit',
              bulbType: 'incandescent',
              resistance: 800,
              powerRating: 40,
              label: 'Lampu Pijar',
            },
          },
        },
        {
          id: 'bulb_3',
          type: 'socket',
          position: { x: 400, y: 465 },
          data: {
            id: 'bulb_3',
            type: 'socket',
            bulbType: 'incandescent',
            resistance: 800,
            powerRating: 40,
            label: 'Fiting + Lampu Pijar 3',
            installedBulb: {
              id: 'bulb_3_unit',
              bulbType: 'incandescent',
              resistance: 800,
              powerRating: 40,
              label: 'Lampu Pijar',
            },
          },
        },
        {
          id: 'wp_tl',
          type: 'waypoint',
          position: { x: 115, y: 110 },
          data: { id: 'wp_tl', type: 'waypoint', label: 'Sudut Atas Kiri' },
        },
        {
          id: 'wp_tr',
          type: 'waypoint',
          position: { x: 690, y: 110 },
          data: { id: 'wp_tr', type: 'waypoint', label: 'Sudut Atas Kanan' },
        },
        {
          id: 'wp_br',
          type: 'waypoint',
          position: { x: 950, y: 510 },
          data: { id: 'wp_br', type: 'waypoint', label: 'Sudut Bawah Kanan' },
        },
        {
          id: 'wp_bl',
          type: 'waypoint',
          position: { x: 115, y: 510 },
          data: { id: 'wp_bl', type: 'waypoint', label: 'Sudut Bawah Kiri' },
        },
      ];
      presetEdges = [
        { id: 's1', source: 'holder_1', sourceHandle: 'pos', target: 'wp_tl', targetHandle: 'p1', type: 'wire' },
        { id: 's2', source: 'wp_tl', sourceHandle: 'p2', target: 'bulb_1', targetHandle: 'p1', type: 'wire' },
        { id: 's3', source: 'bulb_1', sourceHandle: 'p2', target: 'wp_tr', targetHandle: 'p1', type: 'wire' },
        { id: 's4', source: 'wp_tr', sourceHandle: 'p2', target: 'bulb_2', targetHandle: 'p1', type: 'wire' },
        { id: 's5', source: 'bulb_2', sourceHandle: 'p2', target: 'wp_br', targetHandle: 'p1', type: 'wire' },
        { id: 's6', source: 'wp_br', sourceHandle: 'p2', target: 'bulb_3', targetHandle: 'p2', type: 'wire' },
        { id: 's7', source: 'bulb_3', sourceHandle: 'p1', target: 'wp_bl', targetHandle: 'p1', type: 'wire' },
        { id: 's8', source: 'wp_bl', sourceHandle: 'p2', target: 'holder_1', targetHandle: 'neg', type: 'wire' },
      ];
    } else if (presetName === 'parallel-bulbs') {
      // Textbook PARALEL Circuit: V source on Left, 3 Side-by-Side Parallel Branches (R1, R2, R3) with Top & Bottom Rails
      presetNodes = [
        {
          id: 'holder_1',
          type: 'battery-holder',
          position: { x: 20, y: 170 },
          data: {
            id: 'holder_1',
            type: 'battery-holder',
            hasBattery: true,
            batteryCount: 2,
            voltage: 3.0,
            label: 'Sumber V (3.0V)',
          },
        },
        {
          id: 'bulb_1',
          type: 'socket',
          position: { x: 370, y: 235 },
          data: {
            id: 'bulb_1',
            type: 'socket',
            bulbType: 'incandescent',
            resistance: 800,
            powerRating: 40,
            label: 'Fiting + Lampu Pijar',
            installedBulb: {
              id: 'bulb_1_unit',
              bulbType: 'incandescent',
              resistance: 800,
              powerRating: 40,
              label: 'Lampu Pijar',
            },
          },
        },
        {
          id: 'bulb_2',
          type: 'socket',
          position: { x: 660, y: 235 },
          data: {
            id: 'bulb_2',
            type: 'socket',
            bulbType: 'edison',
            resistance: 1200,
            powerRating: 30,
            label: 'Fiting + Lampu Edison',
            installedBulb: {
              id: 'bulb_2_unit',
              bulbType: 'edison',
              resistance: 1200,
              powerRating: 30,
              label: 'Lampu Edison',
            },
          },
        },
        {
          id: 'bulb_3',
          type: 'socket',
          position: { x: 950, y: 235 },
          data: {
            id: 'bulb_3',
            type: 'socket',
            bulbType: 'led_rgb',
            resistance: 6000,
            powerRating: 7,
            label: 'Fiting + Smart LED',
            installedBulb: {
              id: 'bulb_3_unit',
              bulbType: 'led_rgb',
              resistance: 6000,
              powerRating: 7,
              label: 'Smart LED',
            },
          },
        },
        // Top Rail Junctions (+)
        {
          id: 'wp_top_1',
          type: 'waypoint',
          position: { x: 320, y: 50 },
          data: { id: 'wp_top_1', type: 'waypoint', label: 'Simpul Atas 1' },
        },
        {
          id: 'wp_top_2',
          type: 'waypoint',
          position: { x: 610, y: 50 },
          data: { id: 'wp_top_2', type: 'waypoint', label: 'Simpul Atas 2' },
        },
        {
          id: 'wp_top_3',
          type: 'waypoint',
          position: { x: 900, y: 50 },
          data: { id: 'wp_top_3', type: 'waypoint', label: 'Simpul Atas 3' },
        },
        // Bottom Rail Junctions (-)
        {
          id: 'wp_bot_1',
          type: 'waypoint',
          position: { x: 550, y: 490 },
          data: { id: 'wp_bot_1', type: 'waypoint', label: 'Simpul Bawah 1' },
        },
        {
          id: 'wp_bot_2',
          type: 'waypoint',
          position: { x: 840, y: 490 },
          data: { id: 'wp_bot_2', type: 'waypoint', label: 'Simpul Bawah 2' },
        },
        {
          id: 'wp_bot_3',
          type: 'waypoint',
          position: { x: 1130, y: 490 },
          data: { id: 'wp_bot_3', type: 'waypoint', label: 'Simpul Bawah 3' },
        },
      ];
      presetEdges = [
        // Top Rail (+)
        { id: 'p_t1', source: 'holder_1', sourceHandle: 'pos', target: 'wp_top_1', targetHandle: 'p1', type: 'wire' },
        { id: 'p_t2', source: 'wp_top_1', sourceHandle: 'p2', target: 'wp_top_2', targetHandle: 'p1', type: 'wire' },
        { id: 'p_t3', source: 'wp_top_2', sourceHandle: 'p2', target: 'wp_top_3', targetHandle: 'p1', type: 'wire' },
        // Branch Inputs (from Top Rail into R1, R2, R3)
        { id: 'p_in1', source: 'wp_top_1', sourceHandle: 'p2', target: 'bulb_1', targetHandle: 'p1', type: 'wire' },
        { id: 'p_in2', source: 'wp_top_2', sourceHandle: 'p2', target: 'bulb_2', targetHandle: 'p1', type: 'wire' },
        { id: 'p_in3', source: 'wp_top_3', sourceHandle: 'p2', target: 'bulb_3', targetHandle: 'p1', type: 'wire' },
        // Branch Outputs (from R1, R2, R3 down to Bottom Rail)
        { id: 'p_out1', source: 'bulb_1', sourceHandle: 'p2', target: 'wp_bot_1', targetHandle: 'p1', type: 'wire' },
        { id: 'p_out2', source: 'bulb_2', sourceHandle: 'p2', target: 'wp_bot_2', targetHandle: 'p1', type: 'wire' },
        { id: 'p_out3', source: 'bulb_3', sourceHandle: 'p2', target: 'wp_bot_3', targetHandle: 'p1', type: 'wire' },
        // Bottom Rail (-) returning to Holder (-)
        { id: 'p_b3', source: 'wp_bot_3', sourceHandle: 'p2', target: 'wp_bot_2', targetHandle: 'p1', type: 'wire' },
        { id: 'p_b2', source: 'wp_bot_2', sourceHandle: 'p2', target: 'wp_bot_1', targetHandle: 'p1', type: 'wire' },
        { id: 'p_b1', source: 'wp_bot_1', sourceHandle: 'p2', target: 'holder_1', targetHandle: 'neg', type: 'wire' },
      ];
    } else if (presetName === 'short-circuit-demo') {
      presetNodes = [
        {
          id: 'holder_1',
          type: 'battery-holder',
          position: { x: 80, y: 150 },
          data: {
            id: 'holder_1',
            type: 'battery-holder',
            hasBattery: true,
            batteryCount: 2,
            voltage: 3.0,
            label: 'Wadah AA (3.0V)',
          },
        },
        {
          id: 'sw_1',
          type: 'switch',
          position: { x: 420, y: 200 },
          data: { id: 'sw_1', type: 'switch', isOpen: true, label: 'Saklar Korsleting' },
        },
      ];
      presetEdges = [
        { id: 'e1', source: 'holder_1', sourceHandle: 'pos', target: 'sw_1', targetHandle: 'p1', type: 'wire' },
        { id: 'e2', source: 'sw_1', sourceHandle: 'p2', target: 'holder_1', targetHandle: 'neg', type: 'wire' },
      ];
    } else if (presetName === 'ultimate-power-grid') {
      const ultimatePreset = createUltimatePowerGridPreset(get().language);
      presetNodes = ultimatePreset.nodes;
      presetEdges = ultimatePreset.edges;
    }

    const { simulation, updatedNodes } = recalculateCircuit(presetNodes, presetEdges);
    set({
      nodes: updatedNodes,
      edges: presetEdges,
      simulation,
      selectedNodeId: null,
      selectedEdgeId: null,
      fitViewTrigger: get().fitViewTrigger + 1,
    });
  },

  /**
   * Saves the current canvas nodes and edges as a named custom preset in browser localStorage.
   */
  saveCustomPreset: (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const newPreset: CustomCircuitPreset = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: trimmedName,
      createdAt: Date.now(),
      nodes: get().nodes.map((node) => ({ ...node, selected: false })),
      edges: get().edges.map((edge) => ({ ...edge, selected: false })),
    };

    const nextPresets = [newPreset, ...get().customPresets];
    saveCustomPresetsToStorage(nextPresets);
    set({ customPresets: nextPresets });
  },

  /**
   * Loads a user-saved custom preset by ID onto the canvas and recalculates MNA physics.
   */
  loadCustomPreset: (presetId: string) => {
    const targetPreset = get().customPresets.find((p) => p.id === presetId);
    if (!targetPreset) return;

    const { simulation, updatedNodes } = recalculateCircuit(
      targetPreset.nodes,
      targetPreset.edges
    );
    set({
      nodes: updatedNodes,
      edges: targetPreset.edges,
      simulation,
      selectedNodeId: null,
      selectedEdgeId: null,
      fitViewTrigger: get().fitViewTrigger + 1,
    });
  },

  /**
   * Deletes a user-saved custom preset from browser localStorage.
   */
  deleteCustomPreset: (presetId: string) => {
    const nextPresets = get().customPresets.filter((p) => p.id !== presetId);
    saveCustomPresetsToStorage(nextPresets);
    set({ customPresets: nextPresets });
  },
}));

