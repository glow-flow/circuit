import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CircuitElementData } from '../../../types/circuit';
import { Radio, Zap } from 'lucide-react';
import { useCircuitStore } from '../../../store/useCircuitStore';
import { PanelDistribusiNode } from './PanelDistribusiNode';

/**
 * TransmissionTowerNode Component.
 *
 * Dual-Environment Real-World Electrical Representation (Standar PUIL / PLN):
 * 1. Outdoor Mode (`data.worldMode === 'outside'`):
 *    Renders an overhead high-voltage transmission pylon (Menara Transmisi SUTET)
 *    with upper ceramic insulator terminals.
 * 2. Indoor Lab Mode (`data.worldMode !== 'outside'`):
 *    Delegates to `PanelDistribusiNode` (Hybrid UI: realistic hardware panel asset
 *    with interactive digital screen, MCB toggle, stepped DC selector, and banana binding posts).
 *
 * Time Complexity: O(1) render.
 */
export const TransmissionTowerNode: React.FC<NodeProps<CircuitElementData>> = memo((props) => {
  const { data, selected } = props;
  const isOutdoorTower = data.worldMode === 'outside';

  if (!isOutdoorTower) {
    return <PanelDistribusiNode {...props} />;
  }

  return <OutdoorTowerView {...props} selected={selected} />;
});

TransmissionTowerNode.displayName = 'TransmissionTowerNode';

/**
 * Outdoor High-Voltage Transmission Pylon View.
 */
const OutdoorTowerView: React.FC<NodeProps<CircuitElementData>> = memo(({ data, selected }) => {
  const language = useCircuitStore((state) => state.language);
  const isId = language === 'id';

  const isMcbOn = data.isMcbOn !== false && !data.isMcbTripped;
  const connectedCount = data.towerConnectedCount ?? 1;
  const isGridConnected = isMcbOn && connectedCount > 1;

  const currentAmperes = Math.abs(data.calculatedCurrent ?? 0);
  const busVoltage = data.calculatedVoltage ?? 0;
  const currentDisplay =
    currentAmperes >= 1
      ? `${currentAmperes.toFixed(2)} A`
      : `${Math.round(currentAmperes * 1000)} mA`;

  return (
    <div
      className={`relative flex flex-col items-center select-none transition-all duration-200 group w-[132px] pointer-events-none ${
        selected ? 'filter drop-shadow-[0_0_18px_rgba(34,211,238,0.55)]' : ''
      }`}
    >
      {/* Top Floating Status & Telemetry Pill (Above Pylon) */}
      <div
        className={`mb-1 px-2.5 py-1 rounded-2xl text-[10px] font-mono font-bold tracking-tight shadow-[0_8px_20px_rgba(0,0,0,0.45)] backdrop-blur-md border transition-all duration-300 z-30 pointer-events-auto cursor-grab active:cursor-grabbing ${
          isGridConnected
            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-400/50 shadow-[0_0_14px_rgba(16,185,129,0.35)]'
            : 'bg-void-950/90 text-slate-200 border-white/20'
        }`}
      >
        <div className="flex items-center gap-1 whitespace-nowrap">
          {isGridConnected ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <Zap className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>
                {isId
                  ? `Grid → Lab (${busVoltage.toFixed(1)}V)`
                  : `Grid → Lab (${busVoltage.toFixed(1)}V)`}
                {currentAmperes > 0.001 ? ` · ${currentDisplay}` : ''}
              </span>
            </>
          ) : (
            <>
              <Radio className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>
                {isId ? 'Standby (Pasang Panel di Lab)' : 'Standby (Place Panel in Lab)'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* High-Resolution Transparent Transmission Tower Pylon Graphic (288:510 aspect -> 112x198)
          pointer-events-none on the wide box so wires under the cross-arms are never blocked! */}
      <div className="relative w-[112px] h-[198px] flex items-end justify-center overflow-visible pointer-events-none">
        {/* Narrow Central Steel Spine Drag Hitbox (38px wide) so users can drag the tower while wires on the sides stay clickable */}
        <div
          className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-[38px] pointer-events-auto cursor-grab active:cursor-grabbing z-20"
          title={isId ? 'Geser Menara Transmisi' : 'Drag Transmission Tower'}
        />

        <img
          src="/assets/transmission-tower.png"
          alt={isId ? 'Menara Transmisi' : 'Transmission Tower'}
          className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_6px_10px_rgba(0,0,0,0.55)]"
          draggable={false}
        />

        {/* High-Voltage Corona Glow on Top & Middle Cross-Arm Ceramic Insulators when active */}
        {isGridConnected && (
          <>
            <span
              className="absolute w-2.5 h-2.5 rounded-full bg-cyan-300/80 blur-[2px] animate-ping pointer-events-none"
              style={{ left: '19.1%', top: '22%', transform: 'translate(-50%, -50%)' }}
            />
            <span
              className="absolute w-2.5 h-2.5 rounded-full bg-cyan-300/80 blur-[2px] animate-ping pointer-events-none"
              style={{ left: '80.7%', top: '22%', transform: 'translate(-50%, -50%)' }}
            />
          </>
        )}

        {/* Electrical Current Flow Glow Indicator */}
        {currentAmperes > 0.001 && (
          <div
            className="absolute inset-x-5 top-6 bottom-6 rounded-full pointer-events-none bg-cyan-400/15 blur-xl animate-pulse"
            aria-hidden="true"
          />
        )}

        {/* ====================================================================
            OVERHEAD CERAMIC INSULATOR TERMINALS (ACCURATELY AT UPPER CROSS-ARMS!)
            Left Cross-Arm Insulator Tip: x = 12.7%, y = 51.5% -> Positive (+)
            Right Cross-Arm Insulator Tip: x = 87.0%, y = 51.5% -> Negative (-)
           ==================================================================== */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="pos"
          style={{
            left: '12.7%',
            top: '51.5%',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
          }}
          className="!w-5 !h-5 !bg-red-500 !border-2 !border-white !rounded-full shadow-[0_0_14px_rgba(239,68,68,0.95)] hover:!scale-125 transition-transform cursor-crosshair z-40 flex items-center justify-center pointer-events-auto"
          title={isId ? 'Isolator Kutub Positif (+)' : 'Positive Insulator Terminal (+)'}
        >
          <span className="text-[10px] font-mono font-black text-white leading-none pointer-events-none">
            +
          </span>
        </Handle>

        <Handle
          type="source"
          position={Position.Bottom}
          id="neg"
          style={{
            left: '87.0%',
            top: '51.5%',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
          }}
          className="!w-5 !h-5 !bg-sky-500 !border-2 !border-white !rounded-full shadow-[0_0_14px_rgba(56,189,248,0.95)] hover:!scale-125 transition-transform cursor-crosshair z-40 flex items-center justify-center pointer-events-auto"
          title={isId ? 'Isolator Kutub Negatif (-)' : 'Negative Insulator Terminal (-)'}
        >
          <span className="text-[11px] font-mono font-black text-white leading-none pointer-events-none">
            -
          </span>
        </Handle>
      </div>
    </div>
  );
});

OutdoorTowerView.displayName = 'OutdoorTowerView';
