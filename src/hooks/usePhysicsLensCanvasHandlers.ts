import { useCallback } from 'react';
import { Edge, Node } from 'reactflow';
import { useCircuitStore } from '../store/useCircuitStore';

/**
 * Shared DRY interaction handlers for ReactFlow canvases (`CircuitCanvas` and `OutdoorSandbox`).
 * Switches click/hover semantics cleanly between standard editing and Physics X-Ray Lens probing.
 *
 * Time Complexity: O(1) per pointer event.
 */
export function usePhysicsLensCanvasHandlers() {
  const physicsLensMode = useCircuitStore((state) => state.physicsLensMode);
  const isPickingProbeB = useCircuitStore((state) => state.isPickingProbeB);
  const selectNode = useCircuitStore((state) => state.selectNode);
  const selectEdge = useCircuitStore((state) => state.selectEdge);
  const selectProbeTarget = useCircuitStore((state) => state.selectProbeTarget);
  const setHoveredProbeTarget = useCircuitStore((state) => state.setHoveredProbeTarget);
  const setIsPickingProbeB = useCircuitStore((state) => state.setIsPickingProbeB);
  const clearProbeTargets = useCircuitStore((state) => state.clearProbeTargets);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (physicsLensMode === 'probe') {
        selectProbeTarget({ kind: 'node', id: node.id });
        return;
      }
      selectEdge(null);
      selectNode(node.id);
    },
    [physicsLensMode, selectEdge, selectNode, selectProbeTarget]
  );

  const handleNodeMouseEnter = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (physicsLensMode !== 'probe') return;
      setHoveredProbeTarget({ kind: 'node', id: node.id });
    },
    [physicsLensMode, setHoveredProbeTarget]
  );

  const handleNodeMouseLeave = useCallback(() => {
    if (physicsLensMode !== 'probe') return;
    setHoveredProbeTarget(null);
  }, [physicsLensMode, setHoveredProbeTarget]);

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      if (physicsLensMode === 'probe') {
        selectProbeTarget({ kind: 'wire', id: edge.id });
        return;
      }
      selectNode(null);
      selectEdge(edge.id);
    },
    [physicsLensMode, selectEdge, selectNode, selectProbeTarget]
  );

  const handleEdgeMouseEnter = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      if (physicsLensMode !== 'probe') return;
      setHoveredProbeTarget({ kind: 'wire', id: edge.id });
    },
    [physicsLensMode, setHoveredProbeTarget]
  );

  const handleEdgeMouseLeave = useCallback(() => {
    if (physicsLensMode !== 'probe') return;
    setHoveredProbeTarget(null);
  }, [physicsLensMode, setHoveredProbeTarget]);

  const handlePaneClick = useCallback(() => {
    if (physicsLensMode === 'probe') {
      if (isPickingProbeB) {
        setIsPickingProbeB(false);
        return;
      }
      clearProbeTargets();
      return;
    }
    selectNode(null);
    selectEdge(null);
  }, [
    clearProbeTargets,
    isPickingProbeB,
    physicsLensMode,
    selectEdge,
    selectNode,
    setIsPickingProbeB,
  ]);

  return {
    physicsLensMode,
    handleNodeClick,
    handleNodeMouseEnter,
    handleNodeMouseLeave,
    handleEdgeClick,
    handleEdgeMouseEnter,
    handleEdgeMouseLeave,
    handlePaneClick,
  };
}
