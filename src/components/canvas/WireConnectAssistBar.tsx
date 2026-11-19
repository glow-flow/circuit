import React, { useMemo } from 'react';
import { Cable, Navigation, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { WorldMode } from '../../types/circuit';
import {
  findQuickWireTargets,
  getHandleDisplayName,
  scrollOutdoorViewportToX,
} from '../../utils/canvasWireAssist';

interface WireConnectAssistBarProps {
  worldScope: WorldMode;
  viewportWindow?: { left: number; right: number };
}

/**
 * Floating 2-Tap Wiring & Off-Screen Target Quick-Connect Bar.
 *
 * Appears automatically whenever the user taps any terminal pin (`+`, `-`, `Pin 1`, `Pin 2`).
 * Allows teenage learners on narrow phone screens to connect off-screen components
 * (like Micro-Hydro -> Transmission Tower across a 1360px world) in 1 tap without struggling
 * with continuous single-finger dragging across screen borders.
 *
 * Time Complexity: O(N log N + E) only while a pin is armed; O(1) null render otherwise.
 */
export const WireConnectAssistBar: React.FC<WireConnectAssistBarProps> = ({
  worldScope,
  viewportWindow,
}) => {
  const pendingWireStart = useCircuitStore((state) => state.pendingWireStart);
  const nodes = useCircuitStore((state) => state.nodes);
  const edges = useCircuitStore((state) => state.edges);
  const language = useCircuitStore((state) => state.language);
  const completePendingWireConnection = useCircuitStore(
    (state) => state.completePendingWireConnection
  );
  const clearPendingWireStart = useCircuitStore((state) => state.clearPendingWireStart);
  const notify = useCircuitStore((state) => state.notify);

  const isId = language === 'id';

  const sourceInfo = useMemo(() => {
    if (!pendingWireStart || pendingWireStart.worldScope !== worldScope) return null;
    const node = nodes.find((n) => n.id === pendingWireStart.nodeId);
    if (!node) return null;
    return {
      label: node.data?.label || String(node.data?.type || 'Component'),
      pinLabel: getHandleDisplayName(pendingWireStart.handleId, isId),
      handleId: pendingWireStart.handleId,
    };
  }, [pendingWireStart, worldScope, nodes, isId]);

  const quickTargets = useMemo(() => {
    if (!pendingWireStart || pendingWireStart.worldScope !== worldScope) return [];
    return findQuickWireTargets(nodes, edges, pendingWireStart, viewportWindow, isId).slice(0, 4);
  }, [pendingWireStart, worldScope, nodes, edges, viewportWindow, isId]);

  if (!sourceInfo || !pendingWireStart) return null;

  return (
    <div
      data-testid="wire-connect-assist-bar"
      onPointerDown={(e) => e.stopPropagation()}
      className={`pointer-events-auto z-40 max-w-[95vw] sm:max-w-[540px] rounded-2xl bg-void-900/90 backdrop-blur-md border border-control shadow-xl px-3 py-2 flex flex-col gap-1.5 animate-scale-up ${
        worldScope === 'outside'
          ? 'absolute top-[98px] left-1/2 -translate-x-1/2 md:top-[64px]'
          : 'fixed top-[60px] left-1/2 -translate-x-1/2'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Cable className="w-3.5 h-3.5 text-electric-400 shrink-0" aria-hidden="true" />
          <span className="text-[11px] font-semibold text-ink truncate">
            {isId ? 'Sambung dari ' : 'Connect from '}
            <span className="text-electric-400 font-bold">
              {sourceInfo.label} ({sourceInfo.pinLabel})
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={clearPendingWireStart}
          className="min-h-[32px] px-2.5 py-1 rounded-lg bg-void-850 hover:bg-void-800 text-ink border border-control text-[10px] font-semibold flex items-center gap-1 active:scale-95 transition-colors cursor-pointer shrink-0"
          aria-label={isId ? 'Batalkan sambungan kabel' : 'Cancel wiring'}
        >
          <X className="w-3 h-3" aria-hidden="true" />
          <span>{isId ? 'Batal' : 'Cancel'}</span>
        </button>
      </div>

      {quickTargets.length > 0 ? (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
            {isId ? 'Ketuk tujuan:' : 'Tap target:'}
          </span>
          {quickTargets.map((target) => (
            <div key={`${target.nodeId}-${target.handleId}`} className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                data-testid={`quick-wire-${target.nodeId}`}
                onClick={() => {
                  const connected = completePendingWireConnection(target.nodeId, target.handleId);
                  if (connected) {
                    notify(
                      isId
                        ? `Kabel tersambung: ${sourceInfo.label} (${sourceInfo.pinLabel}) -> ${target.componentLabel} (${target.handleLabel})`
                        : `Connected: ${sourceInfo.label} (${sourceInfo.pinLabel}) -> ${target.componentLabel} (${target.handleLabel})`
                    );
                  }
                }}
                className={`min-h-[36px] px-2.5 py-1 rounded-lg text-[10.5px] font-semibold border flex items-center gap-1.5 active:scale-95 transition-colors cursor-pointer whitespace-nowrap ${
                  target.isPriorityTower
                    ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500 text-white'
                    : 'bg-void-950 hover:bg-void-850 border-control text-ink'
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-mono font-black text-white ${
                    target.isPositive ? 'bg-[#DC2626]' : 'bg-[#2563EB]'
                  }`}
                >
                  {target.isPositive ? '+' : '-'}
                </span>
                <span className="max-w-[115px] truncate">{target.componentLabel}</span>
                {target.isOffscreen && (
                  <span className="text-[9px] font-mono text-copper-text flex items-center">
                    {target.offscreenDirection === 'left' ? (
                      <ArrowLeft className="w-2.5 h-2.5" aria-hidden="true" />
                    ) : (
                      <ArrowRight className="w-2.5 h-2.5" aria-hidden="true" />
                    )}
                  </span>
                )}
              </button>

              {worldScope === 'outside' && target.isOffscreen && (
                <button
                  type="button"
                  onClick={() => scrollOutdoorViewportToX(target.nodeCenterX, 'smooth')}
                  aria-label={
                    isId
                      ? `Geser kamera ke ${target.componentLabel}`
                      : `Pan camera to ${target.componentLabel}`
                  }
                  title={
                    isId
                      ? `Geser kamera ke ${target.componentLabel}`
                      : `Pan camera to ${target.componentLabel}`
                  }
                  className="min-w-[36px] min-h-[36px] p-1 rounded-lg bg-void-950 hover:bg-void-850 border border-control text-amber-400 flex items-center justify-center active:scale-95 cursor-pointer"
                >
                  <Navigation className="w-3 h-3" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-slate-400">
          {isId
            ? 'Ketuk pin komponen lain di layar, atau tambah Menara Transmisi dari + EBT.'
            : 'Tap another component pin on canvas, or add a Transmission Tower from + EBT.'}
        </p>
      )}
    </div>
  );
};
