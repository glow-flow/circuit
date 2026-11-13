/**
 * Interactive Hands-On Tutorial & Teacher Quick-Guide Configuration (`interactiveTutorialConfig.ts`).
 *
 * Separates tutorial step definitions, reactive state completion predicates, and
 * 1-click teacher classroom actions from UI rendering (strictly adhering to DRY
 * and separation-of-concerns principles).
 *
 * Time Complexity:
 * - Mission lookup (`getInteractiveMissionByIndex`): O(1) array index access.
 * - Mission completion evaluation (`evaluateInteractiveMissionCompletion`): O(N) single pass
 *   over canvas nodes (N <= 50), zero nested loops.
 * - Teacher Quick-Action execution (`executeTeacherQuickCardAction`): O(N) preset load.
 */

import { Node } from 'reactflow';
import { CircuitElementData, WorldMode, isOutdoorOnlyComponent } from '../types/circuit';
import { useCircuitStore } from '../store/useCircuitStore';
import { createOutdoorPowerStationElements } from '../utils/outdoorSpawnUtils';
import { OUTDOOR_WORLD_MIN_WIDTH } from '../physics/terrainGrid';

export type InteractiveMissionId =
  | 'mission-1-switch'
  | 'mission-2-parallel'
  | 'mission-3-nature-grid';

export interface InteractiveTutorialMission {
  id: InteractiveMissionId;
  stepNumber: 1 | 2 | 3;
  targetWorldMode: WorldMode;
  titleId: string;
  titleEn: string;
  instructionId: string;
  instructionEn: string;
  successMessageId: string;
  successMessageEn: string;
  assistButtonLabelId: string;
  assistButtonLabelEn: string;
}

export interface TeacherQuickCard {
  id: 'basic-switch' | 'series-parallel' | 'short-circuit' | 'nature-ebt';
  badgeId: string;
  badgeEn: string;
  titleId: string;
  titleEn: string;
  descriptionId: string;
  descriptionEn: string;
  actionLabelId: string;
  actionLabelEn: string;
  accentColor: 'cyan' | 'amber' | 'emerald' | 'rose';
}

export const INTERACTIVE_TUTORIAL_MISSIONS: readonly InteractiveTutorialMission[] = [
  {
    id: 'mission-1-switch',
    stepNumber: 1,
    targetWorldMode: 'lab',
    titleId: 'Misi 1/3: Nyalakan Saklar Pisau',
    titleEn: 'Mission 1/3: Close the Knife Switch',
    instructionId:
      'Ketuk Saklar Pisau di kanvas (atau tekan tombol biru) agar lampu menyala.',
    instructionEn:
      'Tap the Knife Switch on the canvas (or press the button) to light the lamp.',
    successMessageId:
      'Saklar tertutup (ON)! Arus 9V mengalir menyalakan lampu.',
    successMessageEn:
      'Switch closed (ON)! 9V current is lighting the lamp.',
    assistButtonLabelId: 'Nyalakan Saklar',
    assistButtonLabelEn: 'Close Switch',
  },
  {
    id: 'mission-2-parallel',
    stepNumber: 2,
    targetWorldMode: 'lab',
    titleId: 'Misi 2/3: Uji 2 Lampu Paralel',
    titleEn: 'Mission 2/3: Test 2 Parallel Lamps',
    instructionId:
      'Muat 2 lampu paralel untuk melihat nyala sama terang dan pembagian arus.',
    instructionEn:
      'Load 2 parallel lamps to see equal brightness and branch current splitting.',
    successMessageId:
      'Rangkaian Paralel aktif! Kedua cabang menerima tegangan penuh.',
    successMessageEn:
      'Parallel circuit active! Both branches receive full voltage.',
    assistButtonLabelId: 'Muat 2 Lampu Paralel',
    assistButtonLabelEn: 'Load Parallel Lamps',
  },
  {
    id: 'mission-3-nature-grid',
    stepNumber: 3,
    targetWorldMode: 'outside',
    titleId: 'Misi 3/3: Pembangkit Alam 12V',
    titleEn: 'Mission 3/3: 12V Green Power Station',
    instructionId:
      'Pasang Panel Surya, Turbin Angin, dan Menara SUTET 12V dengan 1 ketukan!',
    instructionEn:
      'Deploy a 12V Solar Panel, Wind Turbine, and SUTET Tower in 1 tap!',
    successMessageId:
      'Pembangkit Alam 12V aktif menyalurkan energi bersih ke Lab!',
    successMessageEn:
      '12V Nature Station is now transmitting clean energy to the Lab!',
    assistButtonLabelId: 'Pasang PLTS 12V',
    assistButtonLabelEn: 'Spawn 12V Station',
  },
];

export const TEACHER_QUICK_CARDS: readonly TeacherQuickCard[] = [
  {
    id: 'basic-switch',
    badgeId: '9V · Saklar · Lampu',
    badgeEn: '9V · Switch · Lamp',
    titleId: '1. Saklar & Hukum Ohm',
    titleEn: '1. Switch & Ohm Law',
    descriptionId: 'Baterai 9V + saklar pisau + lampu pijar.',
    descriptionEn: '9V battery + knife switch + incandescent bulb.',
    actionLabelId: 'Buka Rangkaian',
    actionLabelEn: 'Open Circuit',
    accentColor: 'cyan',
  },
  {
    id: 'series-parallel',
    badgeId: 'Hukum I Kirchhoff',
    badgeEn: 'Kirchhoff Current Law',
    titleId: '2. Cabang Paralel',
    titleEn: '2. Parallel Branches',
    descriptionId: '2 lampu menyala sama terang, arus terbagi dua.',
    descriptionEn: '2 equally bright lamps with split branch current.',
    actionLabelId: 'Muat Paralel',
    actionLabelEn: 'Load Parallel',
    accentColor: 'amber',
  },
  {
    id: 'nature-ebt',
    badgeId: 'PLTS · Angin · SUTET',
    badgeEn: 'Solar · Wind · Grid',
    titleId: '3. Energi Alam 12V',
    titleEn: '3. 12V Green Grid',
    descriptionId: 'Surya + Turbin Angin kirim 12V gratis ke Lab.',
    descriptionEn: 'Solar + Wind Turbine feed 12V green power to Lab.',
    actionLabelId: 'Terjun ke Alam',
    actionLabelEn: 'Deploy Green Grid',
    accentColor: 'emerald',
  },
  {
    id: 'short-circuit',
    badgeId: 'Uji Bahaya 0V',
    badgeEn: '0V Hazard Demo',
    titleId: '4. Simulasi Korsleting',
    titleEn: '4. Short-Circuit Demo',
    descriptionId: 'Tutup saklar tanpa beban, lihat baterai drop 0V!',
    descriptionEn: 'Close switch with zero load, watch battery drop to 0V!',
    actionLabelId: 'Uji Korsleting',
    actionLabelEn: 'Test Short-Circuit',
    accentColor: 'rose',
  },
];

/**
 * Retrieves an interactive tutorial mission by its 0-based index with bounds validation.
 * Time Complexity: O(1)
 *
 * @param missionIndex 0-based mission step index (`0..2`)
 * @returns The matching mission configuration or undefined if out of range
 */
export function getInteractiveMissionByIndex(
  missionIndex: number
): InteractiveTutorialMission | undefined {
  if (
    typeof missionIndex !== 'number' ||
    !Number.isInteger(missionIndex) ||
    missionIndex < 0 ||
    missionIndex >= INTERACTIVE_TUTORIAL_MISSIONS.length
  ) {
    return undefined;
  }
  return INTERACTIVE_TUTORIAL_MISSIONS[missionIndex];
}

/**
 * Evaluates whether the user has completed the active interactive tutorial mission
 * by inspecting the live circuit store state in a single O(N) pass.
 *
 * Time Complexity: O(N) where N is the number of circuit nodes on the canvas.
 *
 * @param missionId Identifier of the mission being checked
 * @param nodes Active ReactFlow circuit nodes
 * @param worldMode Current world mode (`'lab'` | `'outside'`)
 * @returns True when the user's canvas state satisfies the mission objective
 */
export function evaluateInteractiveMissionCompletion(
  missionId: InteractiveMissionId,
  nodes: readonly Node<CircuitElementData>[],
  worldMode: WorldMode
): boolean {
  try {
    if (!Array.isArray(nodes)) return false;

    if (missionId === 'mission-1-switch') {
      // Completed when in Lab Mode and at least one switch node is CLOSED (isOpen === false)
      if (worldMode !== 'lab') return false;
      for (let i = 0; i < nodes.length; i++) {
        const nodeData = nodes[i]?.data;
        if (nodeData?.type === 'switch' && nodeData.isOpen === false) {
          return true;
        }
      }
      return false;
    }

    if (missionId === 'mission-2-parallel') {
      // Completed when the user has loaded a multi-lamp or multi-resistor preset (e.g. parallel-bulbs or voltage-divider)
      if (worldMode !== 'lab') return false;
      let labComponentCount = 0;
      for (let i = 0; i < nodes.length; i++) {
        const nodeData = nodes[i]?.data;
        if (
          nodeData &&
          nodeData.worldMode !== 'outside' &&
          (nodeData.type === 'socket' ||
            nodeData.type === 'bulb' ||
            nodeData.type === 'resistor')
        ) {
          labComponentCount++;
          if (labComponentCount >= 2) return true;
        }
      }
      return false;
    }

    if (missionId === 'mission-3-nature-grid') {
      // Completed when in Outdoor Mode and at least one outdoor generator is placed
      if (worldMode !== 'outside') return false;
      for (let i = 0; i < nodes.length; i++) {
        const nodeType = nodes[i]?.data?.type;
        if (
          nodeType === 'solar-panel' ||
          nodeType === 'solar_panel' ||
          nodeType === 'wind-turbine' ||
          nodeType === 'wind_turbine' ||
          nodeType === 'hydro-turbine' ||
          nodeType === 'hydro_turbine'
        ) {
          return true;
        }
      }
      return false;
    }

    return false;
  } catch (error) {
    console.warn('Error evaluating interactive mission completion:', error);
    return false;
  }
}

/**
 * Spawns the complete 12V Outdoor Power Station (Solar Panel + Wind Turbine + SUTET Tower)
 * safely into the circuit store and switches `worldMode` to `'outside'`.
 * Shared between the Nature toolbar, Interactive Tutorial Misi 3, and Teacher Quick-Card 3 (DRY).
 *
 * Time Complexity: O(N + E) where N is node count and E is edge count.
 */
export function spawnOutdoorStationAndSwitchWorld(): void {
  try {
    const state = useCircuitStore.getState();
    const isId = state.language === 'id';

    const nonOutdoorNodes = state.nodes.filter(
      (n) =>
        n.data.worldMode !== 'outside' && !isOutdoorOnlyComponent(n.data.type)
    );
    const outdoorNodeIds = new Set(
      state.nodes
        .filter(
          (n) =>
            n.data.worldMode === 'outside' || isOutdoorOnlyComponent(n.data.type)
        )
        .map((n) => n.id)
    );
    const nonOutdoorEdges = state.edges.filter(
      (e) => !outdoorNodeIds.has(e.source) && !outdoorNodeIds.has(e.target)
    );

    const { nodes: newOutdoorNodes, edges: newOutdoorEdges } =
      createOutdoorPowerStationElements({
        terrainGrid: state.terrainGrid,
        canvasWidth: OUTDOOR_WORLD_MIN_WIDTH,
        canvasHeight: 680,
        isId,
        sunlightPercent: 100,
        windSpeedPercent: 100,
      });

    useCircuitStore.setState({
      edges: [...nonOutdoorEdges, ...newOutdoorEdges],
      worldMode: 'outside',
      terrainBrush: 'cursor',
    });
    state.setNodes([...nonOutdoorNodes, ...newOutdoorNodes]);
    state.notify(
      isId
        ? 'Pembangkit Listrik Alam 12V (Panel Surya + Turbin Angin + Menara SUTET) berhasil dipasang!'
        : '12V Outdoor Power Station (Solar + Wind + SUTET Tower) deployed!'
    );
  } catch (error) {
    console.warn('Failed to spawn outdoor station:', error);
  }
}

/**
 * Prepares the canvas for Mission 1 by loading `'simple-lamp'` with its switch initially OPEN
 * (`isOpen: true`) so the teacher or student can experience tapping the switch to light the bulb.
 *
 * Time Complexity: O(N) over the preset nodes.
 */
export function prepareCanvasForInteractiveMissionOne(): void {
  try {
    const state = useCircuitStore.getState();
    state.setWorldMode('lab');
    state.loadPreset('simple-lamp');

    const updatedState = useCircuitStore.getState();
    const switchNode = updatedState.nodes.find((n) => n.data.type === 'switch');
    if (switchNode && !switchNode.data.isOpen) {
      updatedState.toggleSwitch(switchNode.id);
    }
    if (switchNode) {
      updatedState.selectNode(switchNode.id);
    }
  } catch (error) {
    console.warn('Failed to prepare canvas for Mission 1:', error);
  }
}

/**
 * Executes the 1-click assist action for a given interactive mission so non-digital users
 * never get stuck on any tutorial step.
 *
 * Time Complexity: O(N + E)
 *
 * @param missionId Active mission identifier
 */
export function executeMissionOneClickAssist(missionId: InteractiveMissionId): void {
  try {
    const state = useCircuitStore.getState();

    if (missionId === 'mission-1-switch') {
      if (state.worldMode !== 'lab') {
        state.setWorldMode('lab');
      }
      let currentNodes = useCircuitStore.getState().nodes;
      let switchNode = currentNodes.find((n) => n.data.type === 'switch');
      if (!switchNode) {
        state.loadPreset('simple-lamp');
        currentNodes = useCircuitStore.getState().nodes;
        switchNode = currentNodes.find((n) => n.data.type === 'switch');
      }
      if (switchNode && switchNode.data.isOpen) {
        state.toggleSwitch(switchNode.id);
      }
      return;
    }

    if (missionId === 'mission-2-parallel') {
      state.setWorldMode('lab');
      state.loadPreset('parallel-bulbs');
      return;
    }

    if (missionId === 'mission-3-nature-grid') {
      spawnOutdoorStationAndSwitchWorld();
    }
  } catch (error) {
    console.warn('Failed to execute mission assist:', error);
  }
}

/**
 * Executes a 1-click Teacher Quick-Card classroom setup action.
 *
 * Time Complexity: O(N + E)
 *
 * @param cardId Identifier of the selected teacher quick card
 */
export function executeTeacherQuickCardAction(
  cardId: TeacherQuickCard['id']
): void {
  try {
    const state = useCircuitStore.getState();
    switch (cardId) {
      case 'basic-switch':
        state.setWorldMode('lab');
        state.loadPreset('simple-lamp');
        break;
      case 'series-parallel':
        state.setWorldMode('lab');
        state.loadPreset('parallel-bulbs');
        break;
      case 'short-circuit':
        state.setWorldMode('lab');
        state.loadPreset('short-circuit-demo');
        break;
      case 'nature-ebt':
        spawnOutdoorStationAndSwitchWorld();
        break;
    }
  } catch (error) {
    console.warn('Failed to execute teacher quick card action:', error);
  }
}
