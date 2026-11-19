import { useCallback, useEffect, useRef } from 'react';
import { Connection, OnConnectEnd, OnConnectStart } from 'reactflow';
import { useCircuitStore } from '../store/useCircuitStore';
import { WorldMode } from '../types/circuit';
import { extractPointerClientPoint } from '../utils/canvasWireAssist';
import { getComponentDisplayName } from '../utils/nodeLocalization';

const TAP_MAX_DISTANCE_PX = 16;

interface ConnectAttemptState {
  nodeId: string;
  handleId: string;
  handleType?: 'source' | 'target' | null;
  startPoint: { clientX: number; clientY: number } | null;
  didConnect: boolean;
}

/**
 * Shared ReactFlow connection hook providing BOTH classic drag-to-wire AND
 * mobile-friendly Two-Tap Pin Wiring ("Tap Pin A -> Pan/Jump -> Tap Pin B").
 *
 * Also reports wire-drag activity changes cleanly so panoramic worlds can auto-pan
 * near left/right screen edges while holding a wire.
 *
 * Time Complexity: O(1) per pointer event.
 */
export function useTapToConnectHandlers(
  worldScope: WorldMode,
  options?: {
    onWireDragActiveChange?: (isActive: boolean) => void;
    isProbeMode?: boolean;
  }
) {
  const onConnectStore = useCircuitStore((state) => state.onConnect);
  const setPendingWireStart = useCircuitStore((state) => state.setPendingWireStart);
  const clearPendingWireStart = useCircuitStore((state) => state.clearPendingWireStart);
  const completePendingWireConnection = useCircuitStore(
    (state) => state.completePendingWireConnection
  );
  const notify = useCircuitStore((state) => state.notify);
  const language = useCircuitStore((state) => state.language);

  const attemptRef = useRef<ConnectAttemptState | null>(null);
  const dragCallbackRef = useRef(options?.onWireDragActiveChange);
  dragCallbackRef.current = options?.onWireDragActiveChange;

  // Cancel pending wire on Escape key so keyboard & desktop users stay in full control
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearPendingWireStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearPendingWireStart]);

  const handleConnectStart: OnConnectStart = useCallback(
    (event, params) => {
      if (options?.isProbeMode || !params.nodeId) return;

      attemptRef.current = {
        nodeId: params.nodeId,
        handleId: params.handleId || 'pos',
        handleType: params.handleType ?? 'source',
        startPoint: extractPointerClientPoint(event),
        didConnect: false,
      };
      dragCallbackRef.current?.(true);
    },
    [options?.isProbeMode]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (attemptRef.current) {
        attemptRef.current.didConnect = true;
      }
      onConnectStore(connection);
    },
    [onConnectStore]
  );

  const handleConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      dragCallbackRef.current?.(false);

      const attempt = attemptRef.current;
      attemptRef.current = null;
      if (!attempt || attempt.didConnect || options?.isProbeMode) return;

      const endPoint = extractPointerClientPoint(event);
      let movedDistance = 0;
      if (attempt.startPoint && endPoint) {
        movedDistance = Math.hypot(
          endPoint.clientX - attempt.startPoint.clientX,
          endPoint.clientY - attempt.startPoint.clientY
        );
      }

      // Only convert quick taps (not long aborted drags into empty space) into 2-tap pin actions
      if (movedDistance > TAP_MAX_DISTANCE_PX) return;

      const currentPending = useCircuitStore.getState().pendingWireStart;
      if (currentPending && currentPending.worldScope === worldScope) {
        completePendingWireConnection(attempt.nodeId, attempt.handleId);
        return;
      }

      setPendingWireStart({
        nodeId: attempt.nodeId,
        handleId: attempt.handleId,
        handleType: attempt.handleType,
        worldScope,
      });

      const isId = language === 'id';
      const sourceNode = useCircuitStore
        .getState()
        .nodes.find((n) => n.id === attempt.nodeId);
      const label = sourceNode
        ? getComponentDisplayName(sourceNode.data, language)
        : attempt.nodeId;
      notify(
        isId
          ? `Pin ${label} (${attempt.handleId === 'neg' ? '-' : attempt.handleId === 'pos' ? '+' : attempt.handleId}) dipilih. Ketuk pin tujuan atau tombol sambung cepat!`
          : `Pin ${label} selected. Tap any target pin or quick-connect chip!`
      );
    },
    [
      completePendingWireConnection,
      language,
      notify,
      options?.isProbeMode,
      setPendingWireStart,
      worldScope,
    ]
  );

  return {
    handleConnectStart,
    handleConnect,
    handleConnectEnd,
  };
}

/**
 * Lightweight selector hook returning the active pending pin handle ID for one specific node
 * (or null when this node is inactive). Re-renders ONLY when this node's pin state flips.
 * Time Complexity: O(1).
 */
export function usePendingPinHandleForNode(nodeId: string): string | null {
  return useCircuitStore((state) =>
    state.pendingWireStart?.nodeId === nodeId ? state.pendingWireStart.handleId : null
  );
}
