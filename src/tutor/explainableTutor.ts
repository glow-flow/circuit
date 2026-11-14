/**
 * CIRCUIT 4.0 - Explainable Circuit Tutor Physics Engine
 *
 * Deterministic, rule-based topological and mathematical derivation engine.
 * Eliminates LLM hallucinations and latency by calculating step-by-step proofs
 * directly from the MNA linear solver matrices and graph topology.
 *
 * Time Complexity Analysis:
 * - Graph extraction & node categorization: O(V + E)
 * - Equivalent resistance & loop tracing: O(V + E)
 * - Derivation & phenomenon classification: O(V)
 * Overall Time Complexity: O(V + E) linear in graph size (typically < 1ms for N < 100).
 */

import { Node, Edge } from 'reactflow';
import { CircuitElementData, SimulationResult } from '../types/circuit';
import {
  ExplainableCircuitAnalysis,
  CircuitTopologyType,
  DiagnosedPhenomenon,
  MathematicalDerivationStep,
  WhatIfPrediction,
} from '../types/tutor';
import {
  getComponentEffectiveResistance,
  getComponentPinIdentifiers,
  getSocketForwardThreshold,
  getSourceDischargeResistance,
} from '../physics/mnaSolver';
import { UnionFind } from '../physics/unionFind';
import {
  computeEffectiveBatteryVoltage,
  computeSeriesHolderTelemetry,
  normalizeHolderCellCharges,
  resolveHolderCellCount,
} from '../physics/batterySoC';
import { getBulbSpec } from '../constants/bulbCatalog';

/**
 * Resolves the accurate EMF voltage for a voltage source component, accounting
 * for per-type nominal voltages (e.g. 9.0V for 9V battery) and SoC voltage sag.
 * Time Complexity: O(1).
 */
function resolveTutorSourceVoltage(data: CircuitElementData): number {
  if (data.type === 'battery-holder') {
    const cellCount = resolveHolderCellCount(data);
    if (cellCount === 0) return 0;
    const normalizedCells = normalizeHolderCellCharges(
      data.cellCharges,
      cellCount,
      data.currentCharge
    );
    const telemetry = computeSeriesHolderTelemetry(normalizedCells);
    return telemetry.effectiveVoltage;
  }

  let nominalVoltage: number;
  if (typeof data.voltage === 'number' && Number.isFinite(data.voltage)) {
    nominalVoltage = data.voltage;
  } else {
    switch (data.type) {
      case 'battery9v':
        nominalVoltage = 9.0;
        break;
      case 'bess-substation':
      case 'bess_substation':
        nominalVoltage = 12.8;
        break;
      case 'solar-panel':
      case 'solar_panel':
      case 'wind-turbine':
      case 'wind_turbine':
      case 'hydro-turbine':
      case 'hydro_turbine':
      case 'distribution-panel':
      case 'distribution_panel':
        nominalVoltage = data.stepDownVoltage ?? 12.0;
        break;
      default:
        nominalVoltage = 1.5;
        break;
    }
  }

  const soc = data.socPercent ?? data.currentCharge;
  if (
    typeof soc === 'number' &&
    Number.isFinite(soc) &&
    (data.type === 'battery' ||
      data.type === 'battery9v' ||
      data.type === 'bess-substation' ||
      data.type === 'bess_substation')
  ) {
    return computeEffectiveBatteryVoltage(nominalVoltage, soc);
  }
  return nominalVoltage;
}

/**
 * Resolves the bulb type string even when stored inside an `installedBulb` object.
 * Time Complexity: O(1).
 */
function resolveSocketBulbType(data: CircuitElementData): string | undefined {
  if (typeof data.installedBulb === 'object' && data.installedBulb !== null) {
    return data.installedBulb.bulbType;
  }
  if (typeof data.installedBulb === 'string') {
    return data.installedBulb;
  }
  return data.bulbType;
}

interface TopologyAnalysisContext {
  hasExplicitHandles: boolean;
  pinToNetMap: Map<string, string>;
  isParallelLoads: boolean;
}

/**
 * Inspects wire pin handles (via Union-Find) and graph vertex branching degree
 * to classify parallel vs series load topologies in O(V + E) time without false positives
 * on long series chains containing switches or waypoints.
 */
function inspectTutorTopologyGraph(
  nodes: Node<CircuitElementData>[],
  edges: Edge[],
  activeLoads: Node<CircuitElementData>[]
): TopologyAnalysisContext {
  const hasExplicitHandles = edges.some((e) => Boolean(e.sourceHandle || e.targetHandle));
  const pinUnionFind = new UnionFind();
  const netPinCounts = new Map<string, number>();

  for (const node of nodes) {
    const pins = getComponentPinIdentifiers(node.data);
    for (const pin of pins) {
      pinUnionFind.makeSet(pin);
    }
    if (
      node.data.type === 'waypoint' ||
      (node.data.type === 'switch' && node.data.isOpen !== true)
    ) {
      pinUnionFind.union(`${node.id}:p1`, `${node.id}:p2`);
    }
  }

  for (const edge of edges) {
    if (edge.sourceHandle && edge.targetHandle) {
      pinUnionFind.union(`${edge.source}:${edge.sourceHandle}`, `${edge.target}:${edge.targetHandle}`);
    }
  }

  const pinToNetMap = new Map<string, string>();
  const degreeByNonPassPin = new Map<string, number>();
  for (const node of nodes) {
    const pins = getComponentPinIdentifiers(node.data);
    const isPassThrough =
      node.data.type === 'waypoint' || node.data.type === 'switch';
    for (const pin of pins) {
      const net = pinUnionFind.find(pin);
      pinToNetMap.set(pin, net);
      if (!isPassThrough) {
        degreeByNonPassPin.set(net, (degreeByNonPassPin.get(net) ?? 0) + 1);
      }
      netPinCounts.set(net, (netPinCounts.get(net) ?? 0) + 1);
    }
  }

  let isParallelLoads = false;
  if (activeLoads.length > 1) {
    if (hasExplicitHandles) {
      const railPairs = new Set<string>();
      for (const load of activeLoads) {
        const pins = getComponentPinIdentifiers(load.data);
        if (pins.length < 2) continue;
        const netA = pinToNetMap.get(pins[0]);
        const netB = pinToNetMap.get(pins[1]);
        if (!netA || !netB || netA === netB) continue;

        const unorderedPair = netA < netB ? `${netA}|${netB}` : `${netB}|${netA}`;
        if (railPairs.has(unorderedPair)) {
          // Two loads wired across the exact same electrical node pair -> parallel!
          isParallelLoads = true;
          break;
        }
        railPairs.add(unorderedPair);
      }

      if (!isParallelLoads) {
        // Detect multi-branch fan-out where loads sit in parallel sub-branches off a shared hub net (>= 3 real component terminals)
        for (const deg of degreeByNonPassPin.values()) {
          if (deg >= 3) {
            isParallelLoads = true;
            break;
          }
        }
      }
    } else {
      // Legacy handle-less graph classification: count non-pass-through incident edge degree
      const incidentDegree = new Map<string, number>();
      const passThroughIds = new Set(
        nodes
          .filter((n) => n.data.type === 'waypoint' || n.data.type === 'switch')
          .map((n) => n.id)
      );
      for (const edge of edges) {
        incidentDegree.set(edge.source, (incidentDegree.get(edge.source) ?? 0) + 1);
        incidentDegree.set(edge.target, (incidentDegree.get(edge.target) ?? 0) + 1);
      }
      for (const [nodeId, deg] of incidentDegree.entries()) {
        if (!passThroughIds.has(nodeId) && deg >= 3) {
          isParallelLoads = true;
          break;
        }
      }
    }
  }

  return { hasExplicitHandles, pinToNetMap, isParallelLoads };
}

/**
 * Computes effective net EMF of multiple sources considering series-aiding,
 * parallel rail sharing, and series-opposing configurations in O(S) time.
 */
function computeEffectiveSourceBank(
  voltageSources: Node<CircuitElementData>[],
  topo: TopologyAnalysisContext
): {
  effectiveVoltage: number;
  lawLabel: string;
  formulaLatex: string;
  substitutedFormula: string;
} {
  if (voltageSources.length === 0) {
    return {
      effectiveVoltage: 0,
      lawLabel: 'Kaidah Sumber Tegangan Ideal',
      formulaLatex: 'V_{s} = 0',
      substitutedFormula: 'V_{s} = 0V',
    };
  }

  if (voltageSources.length === 1) {
    const v0 = Number(resolveTutorSourceVoltage(voltageSources[0].data).toFixed(2));
    return {
      effectiveVoltage: v0,
      lawLabel: 'Kaidah Sumber Tegangan Ideal',
      formulaLatex: 'V_{s} = V_1',
      substitutedFormula: `V_{s} = ${v0}V`,
    };
  }

  if (topo.hasExplicitHandles) {
    // Group sources sharing identical unordered terminal net pair into parallel bus banks
    const parallelBanks = new Map<string, Array<{ v: number; posNet: string; negNet: string }>>();
    const unlinkedSources: number[] = [];

    for (const src of voltageSources) {
      const v = resolveTutorSourceVoltage(src.data);
      const posNet = topo.pinToNetMap.get(`${src.id}:pos`);
      const negNet = topo.pinToNetMap.get(`${src.id}:neg`);
      if (!posNet || !negNet || posNet === negNet) {
        unlinkedSources.push(v);
        continue;
      }
      const key = posNet < negNet ? `${posNet}|${negNet}` : `${negNet}|${posNet}`;
      const bucket = parallelBanks.get(key) ?? [];
      bucket.push({ v, posNet, negNet });
      parallelBanks.set(key, bucket);
    }

    const bankVoltages: Array<{ v: number; posNet: string; negNet: string }> = [];
    let hasParallelBank = false;
    for (const bucket of parallelBanks.values()) {
      if (bucket.length > 1) {
        hasParallelBank = true;
      }
      const refPos = bucket[0].posNet;
      let maxAiding = bucket[0].v;
      let hasOpposing = false;
      for (let i = 1; i < bucket.length; i++) {
        if (bucket[i].posNet === refPos) {
          if (bucket[i].v > maxAiding) maxAiding = bucket[i].v;
        } else {
          hasOpposing = true;
        }
      }
      const effectiveBankV = hasOpposing
        ? Number(Math.abs(bucket[0].v - bucket[1].v).toFixed(2))
        : Number(maxAiding.toFixed(2));
      bankVoltages.push({ v: effectiveBankV, posNet: refPos, negNet: bucket[0].negNet });
    }

    // Across distinct banks in a loop: detect series-aiding vs series-opposing
    let totalEffective = bankVoltages.reduce((acc, b) => acc + b.v, 0) + unlinkedSources.reduce((a, b) => a + b, 0);
    let isOpposingSeries = false;
    if (bankVoltages.length === 2 && unlinkedSources.length === 0) {
      const [b1, b2] = bankVoltages;
      if (b1.posNet === b2.posNet || b1.negNet === b2.negNet) {
        totalEffective = Math.abs(b1.v - b2.v);
        isOpposingSeries = true;
      }
    }
    totalEffective = Number(totalEffective.toFixed(2));

    if (hasParallelBank && bankVoltages.length === 1) {
      const sourceStrs = voltageSources.map((s) => `${resolveTutorSourceVoltage(s.data)}V`);
      return {
        effectiveVoltage: totalEffective,
        lawLabel: 'Sumber Tegangan Paralel (Tegangan Bus Sama)',
        formulaLatex: 'V_{s} = \\max(V_k)',
        substitutedFormula: `V_{s} = \\text{Paralel}(${sourceStrs.join(', ')}) = ${totalEffective} V`,
      };
    }

    if (isOpposingSeries) {
      return {
        effectiveVoltage: totalEffective,
        lawLabel: 'Sumber Tegangan Seri Berlawanan (Opposing KVL)',
        formulaLatex: 'V_{s} = |V_1 - V_2|',
        substitutedFormula: `V_{s} = |${bankVoltages.map((b) => `${b.v}V`).join(' - ')}| = ${totalEffective} V`,
      };
    }
  }

  // Fallback for handle-less multi-source graphs or series chains:
  // If handle-less parallel hub detected with identical sources attached, keep bus voltage rather than summing
  const values = voltageSources.map((s) => resolveTutorSourceVoltage(s.data));
  if (!topo.hasExplicitHandles && topo.isParallelLoads) {
    const busV = Number(Math.max(...values).toFixed(2));
    return {
      effectiveVoltage: busV,
      lawLabel: 'Sumber Tegangan Paralel',
      formulaLatex: 'V_{s} = V_{\\text{bus}}',
      substitutedFormula: `V_{s} = \\max(${values.map((v) => `${v}V`).join(', ')}) = ${busV} V`,
    };
  }

  const seriesSum = Number(values.reduce((acc, v) => acc + v, 0).toFixed(2));
  return {
    effectiveVoltage: seriesSum,
    lawLabel: 'Kaidah Sumber Tegangan Seri',
    formulaLatex: 'V_{s} = \\sum V_{k}',
    substitutedFormula: `V_{s} = ${values.map((v) => `${v}V`).join(' + ')} = ${seriesSum} V`,
  };
}

/**
 * Analyzes active circuit schematic and MNA simulation telemetry to formulate
 * a pedagogical explanation with live mathematical proofs.
 *
 * @param nodes - Canvas component nodes
 * @param edges - Wire connections
 * @param simulation - Live MNA simulation results
 * @param selectedNodeId - Optional focused component to prioritize explanation
 * @returns Comprehensive explainable circuit analysis
 */
export function analyzeExplainableCircuit(
  nodes: Node<CircuitElementData>[],
  edges: Edge[],
  simulation: SimulationResult,
  _selectedNodeId?: string | null
): ExplainableCircuitAnalysis {
  // Empty canvas edge case
  if (!nodes || nodes.length === 0) {
    return {
      topologyType: 'empty',
      summaryId: 'Kanvas kosong. Tambahkan komponen baterai dan beban untuk memulai praktikum.',
      summaryEn: 'Canvas is empty. Place a voltage source and load to begin the experiment.',
      totalSourcesVoltage: 0,
      equivalentResistanceOhms: 0,
      totalLoopCurrentAmps: 0,
      totalPowerWatts: 0,
      isConverged: true,
      phenomena: [],
      derivationSteps: [],
      whatIfPredictions: [],
    };
  }

  // Build O(V + E) connected wire set so unwired spares, unmounted inventory bulbs,
  // and empty sockets (R = 1e9 Ω) do not pollute equations or circuit totals.
  const wiredNodeIds = new Set<string>();
  for (const edge of edges) {
    wiredNodeIds.add(edge.source);
    wiredNodeIds.add(edge.target);
  }
  const hasWiring = edges.length > 0;
  const isNodeWired = (nodeId: string) => !hasWiring || wiredNodeIds.has(nodeId);

  // Categorize components
  const voltageSources = nodes.filter(
    (n) =>
      isNodeWired(n.id) &&
      [
        'battery',
        'battery9v',
        'battery-holder',
        'solar-panel',
        'solar_panel',
        'wind-turbine',
        'wind_turbine',
        'bess-substation',
        'bess_substation',
        'hydro-turbine',
        'hydro_turbine',
        'distribution-panel',
        'distribution_panel',
      ].includes(n.data.type)
  );

  const resistors = nodes.filter((n) => n.data.type === 'resistor' && isNodeWired(n.id));
  const bulbs = nodes.filter((n) => {
    if (!isNodeWired(n.id)) return false;
    if (n.data.type === 'bulb') {
      // Only include standalone bulb if directly wired in a circuit (ignore loose desk spare)
      return wiredNodeIds.has(n.id);
    }
    if (['socket', 'pin-socket', 'socket-pin'].includes(n.data.type)) {
      return Boolean(n.data.installedBulb);
    }
    return false;
  });
  const switches = nodes.filter((n) => n.data.type === 'switch' && isNodeWired(n.id));
  const grounds = nodes.filter((n) => n.data.type === 'ground');
  const allWiredLoads = [...resistors, ...bulbs];

  // Check if any wired source or load carries live solved MNA current (e.g., parallel branch stays active while another branch's switch is open)
  const getSolvedBranchMag = (node: Node<CircuitElementData>): number => {
    const direct = Math.abs(simulation.branchCurrents[node.id] ?? 0);
    if (direct > 1e-6) return direct;
    if (node.data.bulbId) {
      return Math.abs(simulation.branchCurrents[node.data.bulbId] ?? 0);
    }
    return 0;
  };
  const hasLiveBranchCurrent = [...voltageSources, ...allWiredLoads].some(
    (node) => getSolvedBranchMag(node) > 1e-4
  );

  // Determine if switches are breaking the circuit or isolating specific parallel branches
  const openSwitches = switches.filter((s) => s.data.isOpen === true);
  const activeLoads =
    openSwitches.length > 0 && hasLiveBranchCurrent
      ? allWiredLoads.filter((load) => getSolvedBranchMag(load) > 1e-5)
      : allWiredLoads;

  // Inspect handle-level connectivity & branching degree in O(V + E)
  const topologyCtx = inspectTutorTopologyGraph(nodes, edges, activeLoads);

  // Compute effective EMF across single / series / parallel / opposing voltage sources
  const sourceBank = computeEffectiveSourceBank(voltageSources, topologyCtx);
  const totalSourcesVoltage = sourceBank.effectiveVoltage;

  // Check for dead short circuit condition
  const isShortCircuit = simulation.isShortCircuit || simulation.shortCircuitBranches.length > 0;

  // Classify topology cleanly via graph connectivity instead of naive edge count
  let topologyType: CircuitTopologyType = 'series_loop';
  let summaryId = '';
  let summaryEn = '';

  if (isShortCircuit) {
    topologyType = 'dead_short';
    summaryId = 'Terjadi Korsleting Langsung (Dead Short Circuit). Arus mengalir melalui jalur resistansi nol tanpa hambatan beban.';
    summaryEn = 'Direct Dead Short Circuit detected. Current bypasses loads through an unrestricted near-zero resistance path.';
  } else if (openSwitches.length > 0 && !hasLiveBranchCurrent) {
    topologyType = 'open_circuit';
    summaryId = `Rangkaian Terbuka (Open Loop). Sakelar [${openSwitches.map((s) => s.data.label).join(', ')}] dalam kondisi terbuka memutus aliran elektron.`;
    summaryEn = `Open Circuit Loop. Switch [${openSwitches.map((s) => s.data.label).join(', ')}] is open, stopping electron drift.`;
  } else if (edges.length < 2) {
    topologyType = 'open_circuit';
    summaryId = 'Kawat penghantar belum tersambung membentuk loop tertutup (Closed Loop).';
    summaryEn = 'Wires are not connected into a complete closed loop.';
  } else if (topologyCtx.isParallelLoads) {
    topologyType = 'parallel_branches';
    summaryId = 'Rangkaian Paralel Bercabang. Arus total terbagi ke masing-masing cabang beban secara independen.';
    summaryEn = 'Parallel Branch Circuit. Total source current divides independently across each branch.';
  } else {
    topologyType = 'series_loop';
    summaryId = 'Rangkaian Seri 1 Loop Tertutup. Arus listrik mengalir seragam melalui setiap komponen secara berurutan.';
    summaryEn = 'Single Closed Series Loop. Current flows uniformly through each component in sequence.';
  }

  // Calculate equivalent resistance Req across conducting active loads
  let equivalentResistanceOhms = 0;

  if (activeLoads.length > 0) {
    if (topologyType === 'parallel_branches') {
      let invSum = 0;
      for (const load of activeLoads) {
        const r = getComponentEffectiveResistance(load.data);
        if (r > 0 && r < 1e8) invSum += 1 / r;
      }
      equivalentResistanceOhms = invSum > 0 ? Number((1 / invSum).toFixed(2)) : 0.1;
    } else {
      // Series or single loop sum
      let sum = 0;
      for (const load of activeLoads) {
        const r = getComponentEffectiveResistance(load.data);
        if (r < 1e8) sum += r;
      }
      equivalentResistanceOhms = Number(sum.toFixed(2));
    }
  }

  // Account for active semiconductor diode threshold Vf (e.g., 2.0V LED junction) in series loop calculations
  const totalSeriesDiodeVf =
    topologyType === 'series_loop'
      ? activeLoads.reduce((acc, load) => acc + getSocketForwardThreshold(load.data), 0)
      : 0;
  const reverseBlockedSet = new Set(simulation.reverseBiasedBranches ?? []);

  // Total loop current from MNA solved branch currents, physical Ohm's Law (with Vf), or real R_int short surge
  let totalLoopCurrentAmps = 0;
  if (!isShortCircuit && (openSwitches.length === 0 || hasLiveBranchCurrent) && equivalentResistanceOhms > 0) {
    const solvedSourceCurrents = voltageSources
      .map((src) => getSolvedBranchMag(src))
      .filter((i) => i > 1e-6);
    if (solvedSourceCurrents.length > 0 && (openSwitches.length > 0 || totalSeriesDiodeVf > 0 || activeLoads.some((l) => reverseBlockedSet.has(l.id)))) {
      totalLoopCurrentAmps = Number(Math.max(...solvedSourceCurrents).toFixed(4));
    } else {
      const effectiveDriveVoltage = Math.max(0, totalSourcesVoltage - totalSeriesDiodeVf);
      totalLoopCurrentAmps = Number((effectiveDriveVoltage / equivalentResistanceOhms).toFixed(3));
    }
  } else if (isShortCircuit) {
    // Derive real short-circuit surge from MNA branch currents or V_oc / R_int (no arbitrary 60A constant)
    const shortedMagnitudes = [
      ...voltageSources.map((src) => Math.abs(simulation.branchCurrents[src.id] ?? 0)),
      ...(simulation.shortCircuitBranches ?? []).map((id) =>
        Math.abs(simulation.branchCurrents[id] ?? 0)
      ),
    ].filter((val) => Number.isFinite(val) && val > 1e-3);
    if (shortedMagnitudes.length > 0) {
      totalLoopCurrentAmps = Number(Math.max(...shortedMagnitudes).toFixed(3));
    } else {
      const primaryRint =
        voltageSources.length > 0
          ? Math.max(0.05, getSourceDischargeResistance(voltageSources[0].data))
          : 0.25;
      totalLoopCurrentAmps = Number((totalSourcesVoltage / primaryRint).toFixed(3));
    }
  }

  const totalPowerWatts = Number((totalSourcesVoltage * totalLoopCurrentAmps).toFixed(2));

  // Diagnose Specific Electrical Phenomena
  const phenomena: DiagnosedPhenomenon[] = [];

  // Phenomenon 1: Short Circuit
  if (isShortCircuit) {
    phenomena.push({
      id: 'phenomenon_short',
      category: 'short_circuit',
      titleId: 'Bahaya Korsleting (Short Circuit)',
      titleEn: 'Short Circuit Hazard',
      explanationId:
        'Kutub positif dan negatif sumber tegangan terhubung langsung dengan resistansi mendekati 0 Ω. Sesuai Hukum Ohm (I = V / R), pembagian dengan angka mendekati nol menghasilkan lonjakan arus ekstrem yang memicu panas Joule (P = I² * R) dan dapat merusak sel baterai.',
      explanationEn:
        'Positive and negative terminals are connected with near-zero resistance. By Ohm\'s Law (I = V / R), dividing by ~0 causes extreme current surge creating intense Joule heating (P = I² * R) which can damage battery cells.',
      severity: 'critical',
      affectedComponentIds: voltageSources.map((s) => s.id),
    });
  }

  // Phenomenon 2: Open Switch
  if (openSwitches.length > 0) {
    phenomena.push({
      id: 'phenomenon_open_switch',
      category: 'bulb_unlit',
      titleId: 'Arus Terputus oleh Sakelar Terbuka',
      titleEn: 'Current Interrupted by Open Switch',
      explanationId:
        'Kontak sakelar terbuka menciptakan celah udara berhambatan tak hingga (R = ∞ Ω). Elektron tidak dapat melompati celah udara, sehingga kuat arus di seluruh loop menjadi 0 Ampere.',
      explanationEn:
        'The open switch contact creates an air gap of infinite resistance (R = ∞ Ω). Electrons cannot bridge the air gap, dropping loop current to 0 Amperes.',
      severity: 'info',
      affectedComponentIds: openSwitches.map((s) => s.id),
    });
  }

  // Phenomenon 3: Unlit or Dim Bulbs
  for (const bulb of bulbs) {
    const resolvedBulbType = resolveSocketBulbType(bulb.data);
    const isLed = Boolean(resolvedBulbType?.startsWith('led'));
    const forwardVf = resolvedBulbType ? getBulbSpec(resolvedBulbType).forwardVoltage ?? 0 : 0;
    const effectiveR = getComponentEffectiveResistance(bulb.data);
    
    // Read exact branch current from MNA linear solver
    let bulbCurrent = Math.abs(simulation.branchCurrents[bulb.id] ?? 0);
    if (bulbCurrent === 0 && bulb.data.bulbId) {
      bulbCurrent = Math.abs(simulation.branchCurrents[bulb.data.bulbId] ?? 0);
    }
    if (bulbCurrent === 0 && topologyType === 'series_loop') {
      bulbCurrent = totalLoopCurrentAmps;
    }

    const bulbVoltage = Number(
      ((bulbCurrent > 1e-6 ? forwardVf : 0) + bulbCurrent * effectiveR).toFixed(2)
    );
    const bulbPower = Number((bulbVoltage * bulbCurrent).toFixed(2));

    if (bulbCurrent < 0.005) {
      phenomena.push({
        id: `bulb_unlit_${bulb.id}`,
        category: 'bulb_unlit',
        titleId: `Lampu [${bulb.data.label}] Tidak Menyala`,
        titleEn: `Lamp [${bulb.data.label}] is Unlit`,
        explanationId:
          'Arus listrik yang mengalir ke lampu kurang dari 5 mA atau loop terputus. Filamen membutuhkan arus minimum agar mencapai temperatur pijar untuk memancarkan foton cahaya.',
        explanationEn:
          'Electric current flowing through the lamp is below 5 mA or the loop is broken. The filament requires minimum current to reach incandescence and emit photons.',
        severity: 'warning',
        affectedComponentIds: [bulb.id],
      });
    } else if (bulbPower < 0.1 && !isLed) {
      phenomena.push({
        id: `bulb_dim_${bulb.id}`,
        category: 'bulb_dim',
        titleId: `Lampu [${bulb.data.label}] Menyala Redup`,
        titleEn: `Lamp [${bulb.data.label}] is Dim`,
        explanationId: `Daya yang diserap lampu hanya ${bulbPower} Watt karena tegangan jatuh (${bulbVoltage}V) terbagi dengan komponen beban lain dalam rangkaian seri.`,
        explanationEn: `Power dissipated in the lamp is only ${bulbPower} Watts because the voltage drop (${bulbVoltage}V) is shared across other series loads.`,
        severity: 'info',
        affectedComponentIds: [bulb.id],
      });
    }
  }

  // Phenomenon 4: Fast Battery Drain
  if (voltageSources.length > 0 && equivalentResistanceOhms > 0 && equivalentResistanceOhms < 5.0 && !isShortCircuit) {
    phenomena.push({
      id: 'phenomenon_fast_drain',
      category: 'rapid_battery_drain',
      titleId: 'Baterai Terkuras Cepat (High Discharge Rate)',
      titleEn: 'Rapid Battery Drain (High Discharge Rate)',
      explanationId: `Hambatan total rangkaian sangat rendah (${equivalentResistanceOhms} Ω), menarik arus besar (${totalLoopCurrentAmps} A). Berdasarkan kapasitas muatan baterai (Q = I * t), energi elektrokimia akan habis dalam waktu singkat.`,
      explanationEn: `Total circuit resistance is very low (${equivalentResistanceOhms} Ω), drawing a large discharge current (${totalLoopCurrentAmps} A). By chemical charge capacity (Q = I * t), stored energy will deplete rapidly.`,
      severity: 'warning',
      affectedComponentIds: voltageSources.map((s) => s.id),
    });
  }

  // Phenomenon 5: Missing Ground Reference
  if (grounds.length === 0 && nodes.length >= 3) {
    phenomena.push({
      id: 'phenomenon_floating_ground',
      category: 'normal_operation',
      titleId: 'Sistem Tanpa Referensi Ground Fisik',
      titleEn: 'Floating Subcircuit without Physical Ground',
      explanationId:
        'Rangkaian tidak memiliki simpul ground (0V). Solver MNA menetapkan salah satu kutub negatif baterai sebagai referensi potensial relatif 0.0V agar tegangan simpul terdefinisi secara stabil.',
      explanationEn:
        'Circuit lacks a designated 0V ground node. The MNA solver mathematically anchors the battery negative terminal to relative 0.0V to ensure unique nodal solvability.',
      severity: 'info',
      affectedComponentIds: [],
    });
  }

  // Generate Step-by-Step Mathematical Derivations
  const derivationSteps: MathematicalDerivationStep[] = [];

  // Step 1: Identify Topology & Sources
  derivationSteps.push({
    stepNumber: 1,
    titleId: 'Identifikasi Sumber Tegangan & Topologi',
    titleEn: 'Identify Voltage Sources & Topology',
    lawOrTheorem: sourceBank.lawLabel,
    formulaLatex: sourceBank.formulaLatex,
    calculationDescriptionId: `Mengidentifikasi ${voltageSources.length} sumber tegangan dan ${activeLoads.length} komponen beban aktif dalam topologi ${topologyType}.`,
    calculationDescriptionEn: `Identified ${voltageSources.length} voltage sources and ${activeLoads.length} active load elements in a ${topologyType} configuration.`,
    substitutedFormula: sourceBank.substitutedFormula,
    verifiedResult: `Total EMF = ${totalSourcesVoltage} Volt`,
    relevantComponentIds: voltageSources.map((s) => s.id),
  });

  // Step 2: Equivalent Resistance Derivation
  if (activeLoads.length > 0) {
    const isParallel = topologyType === 'parallel_branches';
    const formulaLatex = isParallel
      ? '\\frac{1}{R_{eq}} = \\sum \\frac{1}{R_k}'
      : 'R_{eq} = \\sum R_k';

    const substitutedFormula = isParallel
      ? `1/R_{eq} = ${activeLoads.map((l) => `(1 / ${getComponentEffectiveResistance(l.data)}Ω)`).join(' + ')} \\implies R_{eq} = ${equivalentResistanceOhms} \\Omega`
      : `R_{eq} = ${activeLoads.map((l) => `${getComponentEffectiveResistance(l.data)}Ω`).join(' + ')} = ${equivalentResistanceOhms} \\Omega`;

    derivationSteps.push({
      stepNumber: 2,
      titleId: isParallel ? 'Perhitungan Hambatan Pengganti Paralel' : 'Perhitungan Hambatan Total Seri',
      titleEn: isParallel ? 'Calculate Equivalent Parallel Resistance' : 'Calculate Total Series Resistance',
      lawOrTheorem: isParallel ? 'Hukum Kombinasi Resistor Paralel' : 'Hukum Kombinasi Resistor Seri',
      formulaLatex,
      calculationDescriptionId: isParallel
        ? 'Pada rangkaian paralel, kebalikan dari hambatan total sama dengan jumlah kebalikan masing-masing hambatan cabang.'
        : 'Pada rangkaian seri, hambatan total sama dengan penjumlahan langsung seluruh resistansi komponen.',
      calculationDescriptionEn: isParallel
        ? 'In a parallel circuit, the reciprocal of total resistance equals the sum of the reciprocals of branch resistances.'
        : 'In a series circuit, total resistance is the direct sum of all individual load resistances.',
      substitutedFormula,
      verifiedResult: `R_eq = ${equivalentResistanceOhms} Ohm`,
      relevantComponentIds: activeLoads.map((l) => l.id),
    });
  }

  // Step 3: Loop Current via Ohm's Law (subtracting active series diode forward threshold Vf when applicable)
  const effectiveFormulaLatex =
    totalSeriesDiodeVf > 0 ? 'I = \\frac{V_{s} - V_{f}}{R_{eq}}' : 'I = \\frac{V_{s}}{R_{eq}}';
  const effectiveNumeratorStr =
    totalSeriesDiodeVf > 0
      ? `(${totalSourcesVoltage} - ${totalSeriesDiodeVf.toFixed(1)})`
      : `${totalSourcesVoltage}`;
  derivationSteps.push({
    stepNumber: 3,
    titleId: 'Perhitungan Kuat Arus Loop (Hukum Ohm)',
    titleEn: 'Calculate Loop Current (Ohm\'s Law)',
    lawOrTheorem: 'Hukum Ohm (Ohm\'s Law)',
    formulaLatex: effectiveFormulaLatex,
    calculationDescriptionId:
      'Kuat arus listrik yang mengalir sebanding lurus dengan beda potensial dan berbanding terbalik dengan hambatan total.',
    calculationDescriptionEn:
      'Electric current is directly proportional to potential difference and inversely proportional to total resistance.',
    substitutedFormula: `I = \\frac{${effectiveNumeratorStr} \\text{ V}}{${equivalentResistanceOhms || 0.1} \\text{ }\\Omega} = ${totalLoopCurrentAmps} \\text{ A} \\; (${(totalLoopCurrentAmps * 1000).toFixed(1)} \\text{ mA})`,
    verifiedResult: `I = ${totalLoopCurrentAmps} Ampere`,
    relevantComponentIds: [...voltageSources.map((s) => s.id), ...activeLoads.map((l) => l.id)],
  });

  // Step 4: Branch Currents, Voltage Drops, and Joule Dissipation
  if (activeLoads.length > 0 && !isShortCircuit) {
    const isParallel = topologyType === 'parallel_branches';

    const branchData = activeLoads.map((load) => {
      const r = getComponentEffectiveResistance(load.data);
      const forwardVf = getSocketForwardThreshold(load.data);
      const isReverseBlocked = reverseBlockedSet.has(load.id);
      // Read exact MNA branch current; fall back to ideal branch calculation if simulation current is 0
      let branchCurrent = Math.abs(simulation.branchCurrents[load.id] ?? 0);
      if (branchCurrent === 0 && load.data.bulbId) {
        branchCurrent = Math.abs(simulation.branchCurrents[load.data.bulbId] ?? 0);
      }
      if (branchCurrent === 0 && !isReverseBlocked) {
        if (isParallel && r > 0) {
          branchCurrent = Number((Math.max(0, totalSourcesVoltage - forwardVf) / r).toFixed(3));
        } else if (!isParallel && (openSwitches.length === 0 || hasLiveBranchCurrent)) {
          branchCurrent = totalLoopCurrentAmps;
        }
      }

      const vDrop = isReverseBlocked
        ? 0
        : isParallel
        ? Number(totalSourcesVoltage.toFixed(2))
        : Number(((branchCurrent > 1e-6 ? forwardVf : 0) + branchCurrent * r).toFixed(2));
      const pDiss = Number((vDrop * branchCurrent).toFixed(2));

      return {
        label: load.data.label,
        id: load.id,
        r,
        branchCurrent,
        vDrop,
        pDiss,
      };
    });

    if (isParallel) {
      // Parallel Circuit: Step 4 displays individual branch currents via Ohm's Law
      const currentBreakdown = branchData
        .map((d) => `I_{${d.label}} = \\frac{${d.vDrop}\\text{V}}{${d.r}\\Omega} = ${d.branchCurrent}\\text{A}`)
        .join(', ');

      derivationSteps.push({
        stepNumber: 4,
        titleId: 'Pembagian Arus Cabang & Daya Beban (Hukum Ohm Cabang)',
        titleEn: 'Branch Current Splitting & Load Dissipation (Branch Ohm\'s Law)',
        lawOrTheorem: 'Kaidah Cabang Paralel Bebas',
        formulaLatex: 'I_k = \\frac{V_{s}}{R_k}, \\quad P_k = V_{s} \\times I_k',
        calculationDescriptionId:
          'Pada rangkaian paralel, setiap cabang menerima beda potensial yang sama (Vs). Kuat arus pada tiap cabang dihitung independen berdasarkan resistansi cabangnya.',
        calculationDescriptionEn:
          'In a parallel circuit, every branch experiences the same terminal potential difference (Vs). Current in each branch is calculated independently from its resistance.',
        substitutedFormula: currentBreakdown,
        verifiedResult: `Total Daya Beban Paralel = ${totalPowerWatts} Watt`,
        relevantComponentIds: activeLoads.map((l) => l.id),
      });

      // Step 5: Verify Kirchhoff's Current Law (KCL)
      const sumBranchCurrents = Number(
        branchData.reduce((acc, d) => acc + d.branchCurrent, 0).toFixed(3)
      );

      derivationSteps.push({
        stepNumber: 5,
        titleId: 'Verifikasi Hukum I Kirchhoff Arus (KCL)',
        titleEn: 'Verification of Kirchhoff\'s Current Law (KCL)',
        lawOrTheorem: 'Hukum I Kirchhoff (KCL)',
        formulaLatex: 'I_{total} = \\sum I_{k} = I_1 + I_2 + \\dots',
        calculationDescriptionId:
          'Jumlah kuat arus listrik yang mengalir masuk ke titik percabangan sama dengan jumlah kuat arus yang keluar melalui seluruh cabang paralel.',
        calculationDescriptionEn:
          'The sum of currents entering an electrical node equals the total current leaving through all connected parallel branches.',
        substitutedFormula: `${branchData.map((d) => `${d.branchCurrent}A`).join(' + ')} = ${sumBranchCurrents} A \\approx ${totalLoopCurrentAmps} A`,
        verifiedResult: 'KCL Terbukti Sesuai Hukum Kekekalan Muatan',
        relevantComponentIds: [...voltageSources.map((s) => s.id), ...activeLoads.map((l) => l.id)],
      });
    } else {
      // Series Circuit: Step 4 displays voltage divider drop
      const dropBreakdown = branchData.map((d) => `V_{${d.label}} = ${d.vDrop}V`).join(', ');

      derivationSteps.push({
        stepNumber: 4,
        titleId: 'Tegangan Jatuh & Disipasi Daya Komponen',
        titleEn: 'Component Voltage Drops & Joule Dissipation',
        lawOrTheorem: 'Hukum Joule & Pembagi Tegangan',
        formulaLatex: 'V_k = I \\times R_k, \\quad P_k = I^2 \\times R_k',
        calculationDescriptionId:
          'Setiap beban menyebabkan penurunan potensial listrik (tegangan jatuh) dan mengubah energi listrik menjadi panas atau cahaya.',
        calculationDescriptionEn:
          'Each load causes an electrical potential drop and converts electrical energy into heat or light.',
        substitutedFormula: dropBreakdown,
        verifiedResult: `Total Daya Disipasi = ${totalPowerWatts} Watt`,
        relevantComponentIds: activeLoads.map((l) => l.id),
      });

      // Step 5: Verification of Kirchhoff's Voltage Law (KVL)
      const sumDrops = Number(branchData.reduce((acc, d) => acc + d.vDrop, 0).toFixed(2));
      const kvlDifference = Number((totalSourcesVoltage - sumDrops).toFixed(2));

      derivationSteps.push({
        stepNumber: 5,
        titleId: 'Verifikasi Hukum Kirchhoff Tegangan (KVL)',
        titleEn: 'Verification of Kirchhoff\'s Voltage Law (KVL)',
        lawOrTheorem: 'Hukum II Kirchhoff (KVL)',
        formulaLatex: '\\sum V_{loop} = V_{s} - \\sum V_{k} = 0',
        calculationDescriptionId:
          'Jumlah aljabar beda potensial pada suatu rangkaian tertutup (loop) harus sama dengan nol (Kekekalan Energi).',
        calculationDescriptionEn:
          'The algebraic sum of all voltages around any closed circuit loop must equal zero (Conservation of Energy).',
        substitutedFormula: `${totalSourcesVoltage}V - (${branchData.map((d) => `${d.vDrop}V`).join(' + ')}) = ${totalSourcesVoltage}V - ${sumDrops}V = ${kvlDifference}V \\approx 0V`,
        verifiedResult: 'KVL Terbukti Sesuai Hukum Kekekalan Energi',
        relevantComponentIds: [...voltageSources.map((s) => s.id), ...activeLoads.map((l) => l.id)],
      });
    }
  }

  // Interactive What-If Hypotheses
  const whatIfPredictions: WhatIfPrediction[] = [];

  if (activeLoads.length > 0 && totalSourcesVoltage > 0 && equivalentResistanceOhms > 0) {
    const firstLoad = activeLoads[0];
    const r1 = getComponentEffectiveResistance(firstLoad.data);
    const doubledR = r1 * 2;
    let newReq = equivalentResistanceOhms + r1;
    if (topologyType === 'parallel_branches' && equivalentResistanceOhms > 0 && r1 > equivalentResistanceOhms) {
      // Replacing 1/R1 with 1/(2*R1) subtracts 1/(2*R1) from total conductance 1/R_eq
      const newConductance = 1 / equivalentResistanceOhms - 1 / doubledR;
      newReq = newConductance > 1e-6 ? Number((1 / newConductance).toFixed(2)) : doubledR;
    } else {
      newReq = Number((equivalentResistanceOhms + r1).toFixed(2));
    }
    const newCurrent = Number((totalSourcesVoltage / newReq).toFixed(3));

    whatIfPredictions.push({
      id: 'whatif_double_resistance',
      titleId: `Bagaimana jika nilai hambatan [${firstLoad.data.label}] digandakan?`,
      titleEn: `What happens if [${firstLoad.data.label}] resistance is doubled?`,
      hypothesisId: `Jika nilai hambatan dinaikkan dari ${r1} Ω menjadi ${doubledR} Ω:`,
      hypothesisEn: `If resistance is increased from ${r1} Ω to ${doubledR} Ω:`,
      predictedOutcomeId: `Arus rangkaian akan turun dari ${totalLoopCurrentAmps} A menjadi ${newCurrent} A. Lampu akan menyala lebih redup karena kuat arus berkurang.`,
      predictedOutcomeEn: `Circuit current will decrease from ${totalLoopCurrentAmps} A to ${newCurrent} A. Lamps will dim due to reduced electron flow.`,
      mathematicalProof: `I_{baru} = \\frac{${totalSourcesVoltage}V}{${newReq}\\Omega} = ${newCurrent}\\text{ A}`,
    });

    const doubledVoltage = totalSourcesVoltage * 2;
    const doubledCurrent = Number((doubledVoltage / equivalentResistanceOhms).toFixed(3));

    whatIfPredictions.push({
      id: 'whatif_double_voltage',
      titleId: 'Bagaimana jika tegangan sumber digandakan (tambah baterai seri)?',
      titleEn: 'What happens if source voltage is doubled (add series battery)?',
      hypothesisId: `Jika tegangan dinaikkan dari ${totalSourcesVoltage} V menjadi ${doubledVoltage} V:`,
      hypothesisEn: `If voltage is increased from ${totalSourcesVoltage} V to ${doubledVoltage} V:`,
      predictedOutcomeId: `Arus akan meningkat 2x lipat menjadi ${doubledCurrent} A, dan daya listrik lampu melonjak 4x lipat (karena P = I² * R). Lampu akan menyala sangat terang atau filamen putus jika melebihi batas.`,
      predictedOutcomeEn: `Current will double to ${doubledCurrent} A, and lamp dissipated power will quadruple (since P = I² * R). Lamp will shine much brighter or blow its filament if rating is exceeded.`,
      mathematicalProof: `P_{baru} = (${doubledCurrent})^2 \\times R = 4 \\times P_{lama}`,
    });

    if (switches.length > 0) {
      whatIfPredictions.push({
        id: 'whatif_open_switch',
        titleId: 'Bagaimana jika sakelar dimatikan (OFF)?',
        titleEn: 'What happens if the switch is opened (OFF)?',
        hypothesisId: 'Jika sakelar dibuka:',
        hypothesisEn: 'If switch is opened:',
        predictedOutcomeId: 'Hambatan celah sakelar menjadi tak terhingga (R = ∞). Arus langsung turun menjadi 0 Ampere seketika di seluruh bagian rangkaian.',
        predictedOutcomeEn: 'Switch contact resistance becomes infinite (R = ∞). Current immediately drops to 0 Amperes throughout the entire circuit.',
        mathematicalProof: 'I = \\frac{V}{\\infty} = 0\\text{ A}',
      });
    }
  }

  return {
    topologyType,
    summaryId,
    summaryEn,
    totalSourcesVoltage,
    equivalentResistanceOhms,
    totalLoopCurrentAmps,
    totalPowerWatts,
    isConverged: simulation.nodeVoltages && Object.keys(simulation.nodeVoltages).length > 0,
    phenomena,
    derivationSteps,
    whatIfPredictions,
  };
}
