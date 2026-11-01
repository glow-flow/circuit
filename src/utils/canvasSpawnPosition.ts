/**
 * Canvas Spawn Positioning Utilities.
 * 
 * Provides camera-centered spawn coordinate calculation for new components placed
 * from the component palette ("Tambah Alat").
 * 
 * In Lab Mode:
 * Projects the visible center of the React Flow canvas to world coordinates via
 * `reactFlowInstance.screenToFlowPosition`, taking pan offset and zoom into account,
 * with slight jitter so consecutively placed components don't stack directly on top.
 * 
 * In Outdoor Mode:
 * Uses the horizontal scroll offset of `#outdoor-scroll-viewport` to find the exact
 * center of what the user is currently viewing, centering the component and
 * calculating safe ground landing coordinates without accidental height explosion.
 * 
 * Time Complexity:
 * - Lab Mode: O(1) DOM rect lookup + matrix transform.
 * - Outdoor Mode: O(1) scroll lookup + O(1) candidate generation (9 candidates max).
 */

import { ReactFlowInstance } from 'reactflow';
import { ComponentType, TerrainCellType } from '../types/circuit';
import {
  COMPONENT_DIMENSIONS,
  DEFAULT_COMPONENT_DIMENSION,
  findTerrainSurfaceY,
  OUTDOOR_WORLD_MIN_WIDTH,
} from '../physics/terrainGrid';

/**
 * Calculates camera-centered graph coordinates for placing a new component in Lab Mode.
 * 
 * Time Complexity: O(1).
 * 
 * @param reactFlowInstance - Active React Flow instance or null
 * @param componentType - Optional component type to adjust bounding box offset
 * @returns { x: number, y: number } Flow coordinates centered on the user's current camera view
 */
export function getLabCanvasSpawnPosition(
  reactFlowInstance: ReactFlowInstance | null,
  componentType?: ComponentType
): { x: number; y: number } {
  try {
    if (reactFlowInstance) {
      const doc = typeof document !== 'undefined' ? document : (globalThis as any).document;
      const win = typeof window !== 'undefined' ? window : (globalThis as any).window;

      // Find the React Flow canvas DOM element
      const reactFlowElement =
        doc?.querySelector ? (doc.querySelector('.react-flow') as HTMLElement | null) : null;

      const containerRect = reactFlowElement?.getBoundingClientRect ? reactFlowElement.getBoundingClientRect() : null;
      const screenCenterX = containerRect
        ? containerRect.left + containerRect.width / 2
        : win ? win.innerWidth / 2 : 400;
      const screenCenterY = containerRect
        ? containerRect.top + containerRect.height / 2
        : win ? win.innerHeight / 2 : 300;

      // Convert screen client coordinates to React Flow graph coordinates
      const flowCenterCoordinate = reactFlowInstance.screenToFlowPosition({
        x: screenCenterX,
        y: screenCenterY,
      });

      // Half-size offsets so component spawns centered around flowCenter rather than top-left corner
      const isDistributionPanel =
        componentType === 'distribution-panel' || componentType === 'distribution_panel';
      const halfWidth = isDistributionPanel ? 110 : 45;
      const halfHeight = isDistributionPanel ? 150 : 55;

      // Small jitter (+-20px) to prevent identical consecutive spawns from perfectly overlapping
      const randomJitterX = Math.round((Math.random() - 0.5) * 40);
      const randomJitterY = Math.round((Math.random() - 0.5) * 40);

      return {
        x: Math.round(flowCenterCoordinate.x - halfWidth + randomJitterX),
        y: Math.round(flowCenterCoordinate.y - halfHeight + randomJitterY),
      };
    }
  } catch (error) {
    console.warn(
      '[canvasSpawnPosition] Failed to compute camera flow position, using fallback:',
      error
    );
  }

  // Graceful fallback when ReactFlow instance is not yet initialized or in headless tests
  return {
    x: 200 + Math.floor(Math.random() * 80),
    y: 120 + Math.floor(Math.random() * 80),
  };
}

/**
 * Computes camera-centered candidate spawn positions for placing a component in Outdoor Mode.
 * Generates candidate positions radiating outward from the visible camera center so the
 * component always appears in the user's field of view, while checking ground elevations
 * to prevent accidental height-drop explosions.
 * 
 * Time Complexity: O(1) for candidate array generation with up to 9 candidates.
 * 
 * @param componentType - Type of component being placed (e.g. 'solar-panel', 'wind-turbine')
 * @param terrainGrid - Optional 2D terrain grid to calculate safe drop heights
 * @returns Object with world dimensions and array of candidate positions in camera view
 */
export function computeOutdoorSpawnCandidates(
  componentType: ComponentType,
  terrainGrid?: TerrainCellType[][]
): {
  worldContainerWidth: number;
  worldContainerHeight: number;
  candidatePositions: Array<{ x: number; y: number }>;
} {
  const doc = typeof document !== 'undefined' ? document : (globalThis as any).document;
  const win = typeof window !== 'undefined' ? window : (globalThis as any).window;

  const worldStageElement = doc?.getElementById ? doc.getElementById('outdoor-world-stage') : null;
  const scrollViewportElement =
    doc?.getElementById ? doc.getElementById('outdoor-scroll-viewport') : null;

  const stageRect = worldStageElement?.getBoundingClientRect ? worldStageElement.getBoundingClientRect() : null;
  const worldContainerWidth =
    stageRect && stageRect.width > 400 ? stageRect.width : OUTDOOR_WORLD_MIN_WIDTH;
  const worldContainerHeight =
    stageRect && stageRect.height > 250 ? stageRect.height : 680;

  const currentScrollLeft = scrollViewportElement?.scrollLeft ?? 0;
  const visibleViewportWidth =
    scrollViewportElement?.clientWidth ?? (win ? win.innerWidth : 400);

  // Exact horizontal center of what the user is currently viewing:
  const cameraCenterHorizontalX = currentScrollLeft + visibleViewportWidth / 2;

  // Outdoor component dimensions
  const componentDimension =
    COMPONENT_DIMENSIONS[componentType] ?? DEFAULT_COMPONENT_DIMENSION;
  const halfComponentWidth = componentDimension.width / 2;

  // Base centered horizontal position in world coordinates
  const baseCenteredX = Math.round(cameraCenterHorizontalX - halfComponentWidth);
  const clampedBaseX = Math.max(
    24,
    Math.min(worldContainerWidth - componentDimension.width - 24, baseCenteredX)
  );

  // Compute safe drop Y elevation close to the ground surface to prevent height explosion
  const computeSafeDropY = (candidateX: number): number => {
    if (terrainGrid && terrainGrid.length > 0) {
      const surfaceMetrics = findTerrainSurfaceY(
        {
          x: candidateX,
          y: 0,
          width: componentDimension.width,
          height: componentDimension.height,
        },
        terrainGrid,
        worldContainerWidth,
        worldContainerHeight
      );
      // Position slightly above settled point (e.g. 20px) so dropRows < 1 (safe drop threshold is 4.5 rows)
      const settledY = Math.max(
        8,
        Math.round(surfaceMetrics.surfaceY - componentDimension.height + 6)
      );
      return Math.max(16, settledY - 20);
    }
    // Fallback if terrainGrid not provided: ~45% down the container
    return Math.round(worldContainerHeight * 0.45);
  };

  // Generate candidate positions radiating from clampedBaseX: center, left, right, left-further, right-further...
  // All candidates remain centered around the user's current camera view!
  const horizontalOffsets = [0, -75, 75, -150, 150, -225, 225, -300, 300];
  const candidatePositions: Array<{ x: number; y: number }> = [];

  for (const offset of horizontalOffsets) {
    const candidateX = Math.max(
      24,
      Math.min(worldContainerWidth - componentDimension.width - 24, clampedBaseX + offset)
    );
    // Prevent duplicate entries caused by clamping at edges
    if (!candidatePositions.some((pos) => Math.abs(pos.x - candidateX) < 10)) {
      candidatePositions.push({
        x: candidateX,
        y: computeSafeDropY(candidateX),
      });
    }
  }

  // Ensure there is at least one candidate
  if (candidatePositions.length === 0) {
    candidatePositions.push({
      x: clampedBaseX,
      y: computeSafeDropY(clampedBaseX),
    });
  }

  return {
    worldContainerWidth,
    worldContainerHeight,
    candidatePositions,
  };
}
