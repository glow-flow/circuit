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
    titleId: 'Misi Praktikum 1/3: Sentuh & Nyalakan Saklar Pisau!',
    titleEn: 'Practice 1/3: Tap & Close the Knife Switch!',
    instructionId:
      'Ketuk langsung Saklar Pisau di tengah kanvas (atau tekan tombol bantu di kanan) agar arus 9V mengalir dan menyalakan lampu!',
    instructionEn:
      'Tap the Knife Switch directly on the canvas (or press the assist button) to close the circuit and light up the lamp!',
    successMessageId:
      'Bagus sekali! Saklar tertutup (ON) dan arus mengalir menyalakan lampu.',
    successMessageEn:
      'Great job! The switch is closed (ON) and current is lighting the lamp.',
    assistButtonLabelId: 'Nyalakan Saklar (1-Klik)',
    assistButtonLabelEn: 'Close Switch (1-Click)',
  },
  {
    id: 'mission-2-parallel',
    stepNumber: 2,
    targetWorldMode: 'lab',
    titleId: 'Misi Praktikum 2/3: Coba Rangkaian Paralel & Rumus',
    titleEn: 'Practice 2/3: Try Parallel Circuit & Formulas',
    instructionId:
      'Ketuk tab [Contoh] di bawah untuk memuat rangkaian siap ajar, atau klik tombol di samping untuk langsung membandingkan 2 lampu Paralel!',
    instructionEn:
      'Tap [Examples] below to load a classroom circuit, or click the quick button to immediately compare 2 Parallel lamps!',
    successMessageId:
      'Mantap! Rangkaian percobaan berhasil dimuat dan siap dianalisis.',
    successMessageEn:
      'Awesome! The comparison circuit is loaded and ready for analysis.',
    assistButtonLabelId: 'Muat 2 Lampu Paralel',
    assistButtonLabelEn: 'Load Parallel Lamps',
  },
  {
    id: 'mission-3-nature-grid',
    stepNumber: 3,
    targetWorldMode: 'outside',
    titleId: 'Misi Praktikum 3/3: Kirim Listrik Gratis dari Alam ke Lab!',
    titleEn: 'Practice 3/3: Send Free Green Energy from Nature to Lab!',
    instructionId:
      'Pindah ke [Alam EBT] di atas lalu ketuk [Pasang PLTS 12V] untuk menerjunkan Panel Surya, Turbin Angin, dan Menara SUTET otomatis!',
    instructionEn:
      'Switch to [Outdoor EBT] at the top and tap [Spawn 12V Station] to deploy a Solar Panel, Wind Turbine, and SUTET Tower!',
    successMessageId:
      'Luar biasa! Pembangkit Alam 12V sudah aktif menyalurkan energi bersih ke Lab!',
    successMessageEn:
      'Amazing! The 12V Outdoor Power Station is now transmitting clean energy to the Lab!',
    assistButtonLabelId: 'Pasang Pembangkit Alam 12V',
    assistButtonLabelEn: 'Spawn 12V Nature Station',
  },
];

export const TEACHER_QUICK_CARDS: readonly TeacherQuickCard[] = [
  {
    id: 'basic-switch',
    badgeId: 'Materi Dasar · Kelas 9',
    badgeEn: 'Core Concept · Grade 9',
    titleId: '1. Rangkaian Dasar & Saklar Pisau',
    titleEn: '1. Basic Circuit & Knife Switch',
    descriptionId:
      'Siapkan baterai 9V, saklar pisau, dan lampu pijar. Cocok untuk menjelaskan rangkaian terbuka vs tertutup di depan kelas.',
    descriptionEn:
      'Sets up a 9V battery, knife switch, and incandescent lamp. Ideal for demonstrating open vs. closed circuits.',
    actionLabelId: 'Buka di Kanvas Lab',
    actionLabelEn: 'Open on Lab Canvas',
    accentColor: 'cyan',
  },
  {
    id: 'series-parallel',
    badgeId: 'Perbandingan Nyala Lampu',
    badgeEn: 'Brightness Comparison',
    titleId: '2. Rangkaian Cabang Paralel',
    titleEn: '2. Parallel Branch Circuit',
    descriptionId:
      'Langsung tampilkan 2 lampu paralel yang menyala sama terang beserta pembagian kuat arus (Hukum I Kirchhoff).',
    descriptionEn:
      'Immediately displays 2 equally bright parallel lamps and branch current splitting (Kirchhoff Current Law).',
    actionLabelId: 'Muat Contoh Paralel',
    actionLabelEn: 'Load Parallel Example',
    accentColor: 'amber',
  },
  {
    id: 'nature-ebt',
    badgeId: 'Energi Terbarukan (PLTS & Angin)',
    badgeEn: 'Renewable Microgrid',
    titleId: '3. Pembangkit Alam 12V & SUTET',
    titleEn: '3. 12V Nature Power Station & Grid',
    descriptionId:
      'Terjun ke Zona Alam Terbuka lengkap dengan Panel Surya, Turbin Angin, dan Menara SUTET yang menyalurkan listrik gratis ke Lab.',
    descriptionEn:
      'Jump to the Outdoor Sandbox with a pre-wired Solar Panel, Wind Turbine, and SUTET Tower feeding the Lab.',
    actionLabelId: 'Pasang Pembangkit Alam',
    actionLabelEn: 'Deploy Nature Station',
    accentColor: 'emerald',
  },
  {
    id: 'short-circuit',
    badgeId: 'Keamanan Listrik PUIL',
    badgeEn: 'Electrical Safety',
    titleId: '4. Simulasi Korsleting & Pembagi Tegangan',
    titleEn: '4. Short-Circuit & Voltage Divider',
    descriptionId:
      'Tunjukkan bahaya hubungan singkat (korsleting) tanpa beban atau cara kerja resistor membagi tegangan listrik.',
    descriptionEn:
      'Demonstrate short-circuit hazards without a load or how series resistors divide voltage.',
    actionLabelId: 'Muat Demo Korsleting',
    actionLabelEn: 'Load Short-Circuit Demo',
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
