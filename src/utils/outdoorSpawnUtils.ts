import { Node, Edge } from 'reactflow';
import { CircuitElementData, TerrainCellType } from '../types/circuit';
import {
  findTerrainSurfaceY,
  getComponentBoundingBox,
  OUTDOOR_WORLD_MIN_WIDTH,
} from '../physics/terrainGrid';

export interface OutdoorPowerStationOptions {
  sunlightPercent?: number;
  windSpeedPercent?: number;
  isId?: boolean;
  terrainGrid: TerrainCellType[][];
  canvasWidth?: number;
  canvasHeight?: number;
}

export interface OutdoorPowerStationResult {
  nodes: Node<CircuitElementData>[];
  edges: Edge[];
}

/**
 * Creates standardized, physically grounded outdoor renewable power generation nodes
 * and grid-tied transmission wires for the Outdoor Sandbox environment.
 *
 * Performance / Complexity:
 * - Time Complexity: O(1) constant component generation and 3-column terrain surface queries.
 * - Space Complexity: O(1) allocation for 3 nodes and 4 interconnect wires.
 *
 * @param options - Configuration containing terrain grid and optional sunlight/wind levels
 * @returns Ready-to-mount outdoor nodes and wires
 */
export function createOutdoorPowerStationElements(
  options: OutdoorPowerStationOptions
): OutdoorPowerStationResult {
  const {
    sunlightPercent = 100,
    windSpeedPercent = 100,
    isId = true,
    terrainGrid,
    canvasWidth = OUTDOOR_WORLD_MIN_WIDTH,
    canvasHeight = 680,
  } = options;

  const effectiveWidth = Math.max(OUTDOOR_WORLD_MIN_WIDTH, canvasWidth);
  const effectiveHeight = Math.max(300, canvasHeight);

  const solarId = `solar_out_${Date.now()}`;
  const turbineId = `wind_out_${Date.now() + 1}`;
  const towerId = `tower_out_${Date.now() + 2}`;

  // Horizontal coordinates across the elevated grassy terrace (columns 1..17), leaving cols 18..23 open for BESS/extra units
  const solarX = 40;
  const turbineX = 240;
  const towerX = 440;

  const computeGroundedY = (
    x: number,
    type: 'solar-panel' | 'wind-turbine' | 'transmission-tower'
  ): number => {
    const boundingBox = getComponentBoundingBox({ x, y: 0 }, type);
    const { surfaceY } = findTerrainSurfaceY(
      boundingBox,
      terrainGrid,
      effectiveWidth,
      effectiveHeight,
      type
    );
    return Math.max(8, Math.round(surfaceY - boundingBox.height));
  };

  const nodes: Node<CircuitElementData>[] = [
    {
      id: solarId,
      type: 'solar-panel',
      position: { x: solarX, y: computeGroundedY(solarX, 'solar-panel') },
      data: {
        id: solarId,
        type: 'solar-panel',
        worldMode: 'outside',
        sunlight: Math.max(0, Math.min(100, sunlightPercent)),
        voltage: 12.0,
        internalResistance: 0.2,
        label: isId ? 'Panel Surya Alam' : 'Outdoor Solar Panel',
      },
    },
    {
      id: turbineId,
      type: 'wind-turbine',
      position: { x: turbineX, y: computeGroundedY(turbineX, 'wind-turbine') },
      data: {
        id: turbineId,
        type: 'wind-turbine',
        worldMode: 'outside',
        speed: Math.max(0, Math.min(100, windSpeedPercent)),
        voltage: 12.0,
        internalResistance: 0.1,
        label: isId ? 'Turbin Angin Alam' : 'Outdoor Wind Turbine',
      },
    },
    {
      id: towerId,
      type: 'transmission-tower',
      position: { x: towerX, y: computeGroundedY(towerX, 'transmission-tower') },
      data: {
        id: towerId,
        type: 'transmission-tower',
        worldMode: 'outside',
        label: isId ? 'Menara Transmisi Luar' : 'Outdoor Transmission Tower',
      },
    },
  ];

  const timestamp = Date.now();
  const edges: Edge[] = [
    {
      id: `wire_out_solar_pos_${timestamp}`,
      type: 'wire',
      source: solarId,
      sourceHandle: 'pos',
      target: towerId,
      targetHandle: 'pos',
    },
    {
      id: `wire_out_solar_neg_${timestamp + 1}`,
      type: 'wire',
      source: solarId,
      sourceHandle: 'neg',
      target: towerId,
      targetHandle: 'neg',
    },
    {
      id: `wire_out_wind_pos_${timestamp + 2}`,
      type: 'wire',
      source: turbineId,
      sourceHandle: 'pos',
      target: towerId,
      targetHandle: 'pos',
    },
    {
      id: `wire_out_wind_neg_${timestamp + 3}`,
      type: 'wire',
      source: turbineId,
      sourceHandle: 'neg',
      target: towerId,
      targetHandle: 'neg',
    },
  ];

  return { nodes, edges };
}
