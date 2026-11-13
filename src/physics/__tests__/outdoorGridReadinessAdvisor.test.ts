import { describe, it, expect, beforeEach } from 'vitest';
import { Edge, Node } from 'reactflow';
import { CircuitElementData } from '../../types/circuit';
import { evaluateOutdoorGridReadiness } from '../outdoorGridReadinessAdvisor';
import { buildLabChargingStationMerge } from '../../utils/labChargingStationUtils';
import { createDefaultOutdoorTerrain } from '../terrainGrid';
import { createOutdoorPowerStationElements } from '../../utils/outdoorSpawnUtils';
import { useCircuitStore } from '../../store/useCircuitStore';

describe('Outdoor Power Plant + SUTET -> Lab Charging Bridge', () => {
  beforeEach(() => {
    useCircuitStore.getState().clearCanvas();
  });

  it('triggers readiness popup in Outdoor Mode when an active generator is wired to SUTET', () => {
    const terrain = createDefaultOutdoorTerrain();
    const station = createOutdoorPowerStationElements({
      sunlightPercent: 100,
      windSpeedPercent: 80,
      terrainGrid: terrain,
    });

    const advisory = evaluateOutdoorGridReadiness(
      station.nodes,
      station.edges,
      'outside',
      'id'
    );

    expect(advisory.isReadyToSupplyLab).toBe(true);
    expect(advisory.wiredGeneratorCount).toBe(2);
    expect(advisory.busVoltageVolts).toBeGreaterThanOrEqual(12);
    expect(advisory.popupSubtitle).toMatch(/cas baterai|mengecas baterai/i);
  });

  it('does NOT trigger when in Lab Mode or when generator and SUTET are unwired', () => {
    const terrain = createDefaultOutdoorTerrain();
    const station = createOutdoorPowerStationElements({
      sunlightPercent: 100,
      windSpeedPercent: 80,
      terrainGrid: terrain,
    });

    // Wrong world mode ('lab')
    expect(
      evaluateOutdoorGridReadiness(station.nodes, station.edges, 'lab', 'id')
        .isReadyToSupplyLab
    ).toBe(false);

    // Unwired nodes in Outdoor Mode
    expect(
      evaluateOutdoorGridReadiness(station.nodes, [], 'outside', 'id')
        .isReadyToSupplyLab
    ).toBe(false);

    // Nighttime zero-voltage generators wired to SUTET
    const darkNodes: Node<CircuitElementData>[] = station.nodes.map((node) =>
      node.data.type === 'solar-panel' || node.data.type === 'wind-turbine'
        ? { ...node, data: { ...node.data, voltage: 0, calculatedVoltage: 0 } }
        : node
    );
    expect(
      evaluateOutdoorGridReadiness(darkNodes, station.edges, 'outside', 'id')
        .isReadyToSupplyLab
    ).toBe(false);
  });

  it('handles edge cases cleanly when nodes or edges are malformed/empty', () => {
    const res = evaluateOutdoorGridReadiness([], [], 'outside', 'en');
    expect(res.isReadyToSupplyLab).toBe(false);
    expect(res.wiredGeneratorCount).toBe(0);
  });

  it('non-destructively merges a Lab Distribution Panel + depleted 9V charger alongside existing Lab circuit', () => {
    const terrain = createDefaultOutdoorTerrain();
    const station = createOutdoorPowerStationElements({
      sunlightPercent: 100,
      windSpeedPercent: 90,
      terrainGrid: terrain,
    });

    const existingLabLamp: Node<CircuitElementData> = {
      id: 'existing_bulb_1',
      type: 'socket',
      position: { x: 100, y: 120 },
      data: {
        id: 'existing_bulb_1',
        type: 'socket',
        worldMode: 'lab',
        label: 'Lampu Lab Lama',
      },
    };
    const existingEdges: Edge[] = [...station.edges];

    const merged = buildLabChargingStationMerge(
      [...station.nodes, existingLabLamp],
      existingEdges,
      'id'
    );

    expect(merged.spawnedNewStation).toBe(true);
    expect(merged.panelId).toBeTruthy();
    expect(merged.batteryId).toBeTruthy();
    // Preserves outdoor station AND existing lab bulb
    expect(merged.nodes.some((n) => n.id === 'existing_bulb_1')).toBe(true);
    expect(merged.nodes.filter((n) => n.data.worldMode === 'outside')).toHaveLength(3);
    // Adds Lab panel + depleted battery + 2 connecting wires
    const spawnedBattery = merged.nodes.find((n) => n.id === merged.batteryId);
    expect(spawnedBattery?.data.currentCharge).toBe(15);
    expect(spawnedBattery?.data.chargeState).toBe('charging');
    expect(merged.edges).toHaveLength(station.edges.length + 2);
  });

  it('deploys Lab charging station from Zustand store and activates MNA charging current', () => {
    const store = useCircuitStore.getState();
    const station = createOutdoorPowerStationElements({
      sunlightPercent: 100,
      windSpeedPercent: 90,
      terrainGrid: store.terrainGrid,
    });
    store.loadCustomCircuit(station.nodes, station.edges, 'outside');
    expect(useCircuitStore.getState().worldMode).toBe('outside');

    useCircuitStore.getState().deployOutdoorChargingStationInLab();

    const updated = useCircuitStore.getState();
    expect(updated.worldMode).toBe('lab');
    const labBattery = updated.nodes.find(
      (n) => n.data.worldMode === 'lab' && n.data.type === 'battery9v'
    );
    expect(labBattery).toBeDefined();
    expect(labBattery?.data.chargeState).toBe('charging');
    expect(Math.abs(labBattery?.data.calculatedCurrent ?? 0)).toBeGreaterThan(0.1);
  });
});
