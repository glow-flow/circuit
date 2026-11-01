import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getLabCanvasSpawnPosition,
  computeOutdoorSpawnCandidates,
} from '../canvasSpawnPosition';
import { useCircuitStore } from '../../store/useCircuitStore';
import { createDefaultOutdoorTerrain } from '../../physics/terrainGrid';

describe('canvasSpawnPosition utilities', () => {
  describe('getLabCanvasSpawnPosition', () => {
    it('uses screenToFlowPosition when reactFlowInstance is available', () => {
      const mockScreenToFlowPosition = vi.fn().mockReturnValue({ x: 500, y: 350 });
      const mockInstance = {
        screenToFlowPosition: mockScreenToFlowPosition,
      } as any;

      const position = getLabCanvasSpawnPosition(mockInstance, 'bulb');

      expect(mockScreenToFlowPosition).toHaveBeenCalled();
      // Flow center is (500, 350), bulb half offset is (-45, -55) plus jitter (+-20)
      expect(position.x).toBeGreaterThanOrEqual(500 - 45 - 25);
      expect(position.x).toBeLessThanOrEqual(500 - 45 + 25);
      expect(position.y).toBeGreaterThanOrEqual(350 - 55 - 25);
      expect(position.y).toBeLessThanOrEqual(350 - 55 + 25);
    });

    it('applies larger center offset for distribution-panel', () => {
      const mockScreenToFlowPosition = vi.fn().mockReturnValue({ x: 600, y: 400 });
      const mockInstance = {
        screenToFlowPosition: mockScreenToFlowPosition,
      } as any;

      const position = getLabCanvasSpawnPosition(mockInstance, 'distribution-panel');

      expect(mockScreenToFlowPosition).toHaveBeenCalled();
      // Distribution panel offset is (-110, -150) plus jitter (+-20)
      expect(position.x).toBeGreaterThanOrEqual(600 - 110 - 25);
      expect(position.x).toBeLessThanOrEqual(600 - 110 + 25);
      expect(position.y).toBeGreaterThanOrEqual(400 - 150 - 25);
      expect(position.y).toBeLessThanOrEqual(400 - 150 + 25);
    });

    it('gracefully returns fallback coordinates when instance is null', () => {
      const position = getLabCanvasSpawnPosition(null, 'bulb');

      expect(position.x).toBeGreaterThanOrEqual(200);
      expect(position.x).toBeLessThanOrEqual(280);
      expect(position.y).toBeGreaterThanOrEqual(120);
      expect(position.y).toBeLessThanOrEqual(200);
    });
  });

  describe('computeOutdoorSpawnCandidates', () => {
    let originalDoc: any;
    let originalWin: any;

    beforeEach(() => {
      originalDoc = (globalThis as any).document;
      originalWin = (globalThis as any).window;

      (globalThis as any).window = {
        innerWidth: 400,
        innerHeight: 700,
      };

      (globalThis as any).document = {
        getElementById: (id: string) => {
          if (id === 'outdoor-scroll-viewport') {
            return {
              scrollLeft: 500,
              clientWidth: 400,
            };
          }
          if (id === 'outdoor-world-stage') {
            return {
              getBoundingClientRect: () => ({ width: 1360, height: 680 }),
            };
          }
          return null;
        },
        querySelector: () => null,
      };
    });

    afterEach(() => {
      (globalThis as any).document = originalDoc;
      (globalThis as any).window = originalWin;
    });

    it('generates candidates centered around scroll viewport camera position', () => {
      const terrainGrid = createDefaultOutdoorTerrain(20, 40);
      const { candidatePositions, worldContainerWidth } = computeOutdoorSpawnCandidates(
        'solar-panel',
        terrainGrid
      );

      expect(worldContainerWidth).toBe(1360);
      expect(candidatePositions.length).toBeGreaterThan(0);

      // Camera center is scrollLeft + clientWidth / 2 = 500 + 200 = 700.
      // Solar panel width = 144, so base center = 700 - 72 = 628.
      const firstCandidate = candidatePositions[0];
      expect(firstCandidate.x).toBe(628);

      // All candidates should be clamped within container bounds [24, 1360 - 144 - 24 = 1192]
      for (const candidate of candidatePositions) {
        expect(candidate.x).toBeGreaterThanOrEqual(24);
        expect(candidate.x).toBeLessThanOrEqual(1192);
        expect(candidate.y).toBeGreaterThan(0);
      }
    });

    it('radiates candidate offsets symmetrically around camera center', () => {
      (globalThis as any).document = {
        getElementById: (id: string) => {
          if (id === 'outdoor-scroll-viewport') {
            return {
              scrollLeft: 600,
              clientWidth: 400,
            };
          }
          if (id === 'outdoor-world-stage') {
            return {
              getBoundingClientRect: () => ({ width: 1360, height: 680 }),
            };
          }
          return null;
        },
        querySelector: () => null,
      };

      const { candidatePositions } = computeOutdoorSpawnCandidates('wind-turbine');

      // Camera center = 600 + 200 = 800. Wind turbine width = 144 -> base = 800 - 72 = 728.
      expect(candidatePositions[0].x).toBe(728);

      // Subsequent candidates should branch left and right
      expect(candidatePositions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ x: 728 - 75 }),
          expect.objectContaining({ x: 728 + 75 }),
        ])
      );
    });
  });

  describe('useCircuitStore.addComponent camera-centered default placement', () => {
    beforeEach(() => {
      useCircuitStore.setState({ nodes: [], edges: [], language: 'id' });
    });

    it('automatically uses camera spawn position when position argument is omitted', () => {
      const mockScreenToFlowPosition = vi.fn().mockReturnValue({ x: 450, y: 320 });
      useCircuitStore.setState({
        reactFlowInstance: {
          screenToFlowPosition: mockScreenToFlowPosition,
        } as any,
      });

      useCircuitStore.getState().addComponent('battery');
      const [placedNode] = useCircuitStore.getState().nodes;

      expect(placedNode).toBeDefined();
      expect(mockScreenToFlowPosition).toHaveBeenCalled();
      // Placed near flow center
      expect(placedNode.position.x).toBeGreaterThan(350);
      expect(placedNode.position.y).toBeGreaterThan(200);
    });
  });
});
