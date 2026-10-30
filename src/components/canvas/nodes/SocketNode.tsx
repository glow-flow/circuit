import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Flame, RotateCcw, Snowflake, Unplug } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import {
  canBulbFitSocket,
  computeBulbPhotometrics,
  getBulbSpec,
} from '../../../constants/bulbCatalog';
import {
  BULB_NODE_SIZE,
  SOCKET_FRONT_LIP_CLIP_PATH,
  SOCKET_NODE_SIZE,
  getInstalledBulbTopOffset,
} from '../../../utils/socketSnap';
import { TRANSLATIONS } from '../../../i18n/translations';
import { NodeInfoPopover } from './NodeInfoPopover';

/**
 * Horizontal positions (percentage of socket node width) for the two bottom brass screw terminals.
 * p1 = Positive / Terminal 1 (Left brass terminal)
 * p2 = Negative / Terminal 2 (Right brass terminal)
 */
const SOCKET_TERMINALS = { p1: '29%', p2: '71%' } as const;

/** Formats current in mA (< 1 A) or A. */
function formatCurrent(amperes: number): string {
  if (amperes === 0) return '0 mA';
  if (amperes < 0.001) return `${(amperes * 1000).toFixed(2)} mA`;
  if (amperes < 1) return `${(amperes * 1000).toFixed(1)} mA`;
  return `${amperes.toFixed(2)} A`;
}

/** Formats electrical power in mW (< 0.1 W) or W. */
function formatPower(watts: number): string {
  if (watts === 0) return '0.00 W';
  if (watts < 0.1) return `${(watts * 1000).toFixed(1)} mW`;
  return `${watts.toFixed(2)} W`;
}

/**
 * Bulb Socket ("Fiting Lampu") Node for screw-base (ulir) bulbs.
 *
 * Electrical Architecture:
 * - SocketNode possesses the ONLY 2 electrical handles (Positif & Negatif) at the bottom.
 * - When empty: acts as an OPEN CIRCUIT (resistance = Infinity, 0 current).
 * - When a bulb is snapped: conducts electrical current through the installed bulb.
 *
 * Visual Snapping Architecture:
 * - The installed bulb is rendered with `position: absolute` directly inside the socket node.
 * - Fixed width & height matching BULB_NODE_SIZE (88px x 104px) to PREVENT any collapsing or squishing.
 * - `zIndex: 20` (higher than the socket's `zIndex: 10`).
 * - `top: -72px` and `transform: translateX(-50%)` positions the metal screw thread neatly inside the socket mouth.
 *
 * Time Complexity: O(1) render & photometric calculation.
 *
 * @param props - React Flow NodeProps containing component data and selection state
 * @returns React component representing the socket and any installed lamp
 */
export const SocketNode: React.FC<NodeProps<CircuitElementData>> = ({ id, data, selected }) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);
  const detachBulbFromSocket = useCircuitStore((state) => state.detachBulbFromSocket);
  const updateComponentData = useCircuitStore((state) => state.updateComponentData);

  const isIndonesian = language === 'id';
  const t = TRANSLATIONS[language].nodes.bulb;

  // Extract installed bulb data
  const installedBulb = data.installedBulb;
  const isInstalledBulbObject = Boolean(installedBulb && typeof installedBulb === 'object');
  const installedBulbObj = isInstalledBulbObject
    ? (installedBulb as import('../../../types/circuit').InstalledBulbData)
    : null;

  const installedBulbType: import('../../../constants/bulbCatalog').BulbType | undefined =
    installedBulbObj
      ? installedBulbObj.bulbType
      : typeof installedBulb === 'string'
      ? (installedBulb as import('../../../constants/bulbCatalog').BulbType)
      : undefined;

  // Strictly enforce screw-base requirement: only bulbs designed for E27 sockets can mount
  const rawSpec = installedBulbType ? getBulbSpec(installedBulbType) : undefined;
  const installedSpec = rawSpec && canBulbFitSocket(rawSpec.type) ? rawSpec : undefined;
  const isBlown = Boolean(
    (installedBulbObj && installedBulbObj.isBlown) || data.isBlown
  );

  const resistance = installedSpec
    ? (installedBulbObj?.resistance ?? installedSpec.resistance)
    : 1e9;

  const current = Math.abs(simulation.branchCurrents[id] ?? data.calculatedCurrent ?? 0);

  // Compute photometrics (brightness, heat, power, voltage drop) only if bulb is installed
  const photometrics = installedSpec
    ? computeBulbPhotometrics(current, resistance, installedSpec)
    : { powerWatts: 0, voltageDrop: 0, brightness: 0, heatLevel: 'cold' as const, isOverloaded: false };

  const { powerWatts, voltageDrop, brightness, heatLevel, isOverloaded } = photometrics;
  const effectiveIsBlown = isBlown || isOverloaded;

  const handleClass =
    '!bg-void-800 !border-2 !border-amber-400 !w-2.5 !h-2.5 !min-w-0 !min-h-0 !rounded-full transition-transform hover:scale-125';
  const handleStyle = (leftPercent: string): React.CSSProperties => ({
    left: leftPercent,
    bottom: -3,
    transform: 'translateX(-50%)',
    zIndex: 40,
  });

  // Pure optical appearance on the PNG: NO drop-shadow on the image itself to prevent bounding box clipping!
  const bulbImageFilter = effectiveIsBlown
    ? 'grayscale(100%) brightness(0.42) contrast(1.15)'
    : brightness > 0.01
    ? `brightness(${0.96 + brightness * 0.42}) saturate(${1.0 + brightness * 0.35})`
    : 'saturate(0.45) brightness(0.76) contrast(1.04)';

  const bulbTopOffset = getInstalledBulbTopOffset(installedSpec?.type);

  return (
    <div
      className="group relative select-none"
      style={{
        width: SOCKET_NODE_SIZE.width,
        height: SOCKET_NODE_SIZE.height,
        overflow: 'visible',
      }}
    >
      {/* 
        =======================================================================
        3-LAYER DEPTH SANDWICH FOR REALISTIC E27 SOCKET + BULB ASSEMBLY
        -----------------------------------------------------------------------
        Layer 1 (zIndex: 10): Full Socket Back Rim & Body + Inner Cavity Shadow (zIndex: 15)
        Layer 2 (zIndex: 20): Installed Bulb (full 92x112 size, never collapses)
        Layer 3 (zIndex: 30): Clipped Front Lip of Socket wrapping IN FRONT of the bulb's threads
        =======================================================================
      */}

      {/* LAYER 1 (zIndex: 10): Socket Back Rim & Base Artwork */}
      <div
        className={`relative h-full w-full rounded-lg outline outline-1 outline-offset-2 transition-[outline-color] duration-150 ${
          selected ? 'outline-cyan-300' : 'outline-transparent group-hover:outline-cyan-400/80'
        }`}
        style={{ zIndex: 10 }}
      >
        <img
          src="/assets/socket.png"
          alt={isIndonesian ? 'Fiting lampu ulir' : 'Screw bulb socket'}
          draggable={false}
          className="pointer-events-none block h-full w-full select-none object-contain"
        />

        {/* LAYER 1.5 (zIndex: 15): Dark inner cavity occlusion so empty copper threads don't peek around the bulb neck */}
        {installedSpec && (
          <div
            className="pointer-events-none absolute rounded-full"
            style={{
              left: '10%',
              top: '5%',
              width: '80%',
              height: '18%',
              background:
                'radial-gradient(ellipse at center, #090a0d 55%, rgba(9,10,13,0.92) 80%, transparent 100%)',
              zIndex: 15,
            }}
          />
        )}
      </div>

      {/* NATURAL MULTI-TIER GLOW (zIndex: 14): Zero rectangular boundary clipping */}
      {installedSpec && !effectiveIsBlown && brightness > 0.01 && (
        <div
          className="pointer-events-none absolute select-none"
          style={{
            left: '50%',
            top: bulbTopOffset + 40,
            transform: 'translate(-50%, -50%)',
            zIndex: 14,
            width: 0,
            height: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Tier 3: Soft ambient atmospheric radiance (190px - 280px) */}
          <div
            className="absolute rounded-full transition-all duration-300"
            style={{
              width: Math.round(190 + brightness * 90),
              height: Math.round(190 + brightness * 90),
              background: `radial-gradient(circle, ${installedSpec.glowColor} 0%, rgba(0,0,0,0) 70%)`,
              opacity: Math.min(0.85, 0.25 + brightness * 0.6),
              filter: 'blur(22px)',
            }}
          />
          {/* Tier 2: Glass globe corona (75px - 120px) */}
          <div
            className="absolute rounded-full transition-all duration-300"
            style={{
              width: Math.round(75 + brightness * 45),
              height: Math.round(75 + brightness * 45),
              background: `radial-gradient(circle, ${installedSpec.glowColor} 15%, rgba(0,0,0,0) 72%)`,
              opacity: Math.min(0.9, 0.4 + brightness * 0.5),
              filter: 'blur(8px)',
            }}
          />
          {/* Tier 1: Specular optical core / filament center (32px - 50px) */}
          <div
            className="absolute rounded-full transition-all duration-300"
            style={{
              width: Math.round(32 + brightness * 18),
              height: Math.round(32 + brightness * 18),
              background: `radial-gradient(circle, rgba(255,255,255,0.95) 0%, ${installedSpec.glowColor} 55%, rgba(0,0,0,0) 80%)`,
              opacity: Math.min(1.0, 0.5 + brightness * 0.5),
              filter: 'blur(3px)',
            }}
          />
        </div>
      )}

      {/* LAYER 2 (zIndex: 20): Installed Bulb Artwork (Fixed 92x112 size — never shrinks or collapses) */}
      {installedSpec && (
        <div
          className="pointer-events-none absolute left-1/2 flex items-center justify-center select-none"
          style={{
            width: BULB_NODE_SIZE.width,
            height: BULB_NODE_SIZE.height,
            top: bulbTopOffset,
            transform: 'translateX(-50%)',
            zIndex: 20,
          }}
        >
          <img
            src={installedSpec.image}
            alt={isIndonesian ? installedSpec.label : installedSpec.labelEn}
            draggable={false}
            className={`pointer-events-none select-none object-contain transition-all duration-300 ${
              installedSpec.imageRotated
                ? 'absolute left-1/2 top-1/2 h-[76px] w-[106px] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90'
                : 'relative h-full w-full'
            }`}
            style={{
              filter: bulbImageFilter,
              opacity: effectiveIsBlown ? 0.55 : brightness > 0.01 ? 1 : 0.94,
              clipPath: installedSpec.imageRotated ? undefined : 'inset(0 0 6% 0)',
            }}
          />

          {/* Subtle ambient occlusion shadow on the screw thread where it enters the socket mouth */}
          <div
            className="pointer-events-none absolute"
            style={{
              left: '31%',
              width: '38%',
              bottom: '6%',
              height: '18%',
              background:
                'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.38) 55%, rgba(0,0,0,0.75) 100%)',
            }}
          />

          {effectiveIsBlown && (
            <span className="absolute right-2 top-2 z-30 h-2.5 w-2.5 animate-pulse rounded-full bg-red-500 shadow-glow-danger" />
          )}
        </div>
      )}

      {/* LAYER 3 (zIndex: 30): Socket Front Lip Overlay (occludes lower bulb screw threads inside the socket) */}
      {installedSpec && (
        <div
          className="pointer-events-none absolute inset-0 select-none"
          style={{ zIndex: 30 }}
        >
          <img
            src="/assets/socket.png"
            alt=""
            aria-hidden="true"
            draggable={false}
            className="pointer-events-none block h-full w-full select-none object-contain"
            style={{
              clipPath: SOCKET_FRONT_LIP_CLIP_PATH,
            }}
          />
        </div>
      )}

      {/* 
        ELECTRICAL HANDLES (zIndex: 40): 
        Only the SocketNode has wire connection handles, located at the bottom brass screws.
      */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="p1"
        title={isIndonesian ? 'Terminal Positif (+) / Pin 1' : 'Positive (+) Terminal / Pin 1'}
        className={handleClass}
        style={handleStyle(SOCKET_TERMINALS.p1)}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="p2"
        title={isIndonesian ? 'Terminal Negatif (-) / Pin 2' : 'Negative (-) Terminal / Pin 2'}
        className={handleClass}
        style={handleStyle(SOCKET_TERMINALS.p2)}
      />

      {/* POPOVER TELEMETRY & CONTROLS: Only while selected */}
      {selected && (
        <NodeInfoPopover placement="bottom">
          <div className="mb-1.5 flex items-center justify-between gap-1.5">
            <div className="min-w-0">
              <div className="truncate text-xs font-bold tracking-tight text-slate-100">
                {isIndonesian ? 'Fiting Lampu' : 'Bulb Socket'}
                <span className="ml-1 font-mono text-[10px] text-cyan-300">
                  {isIndonesian ? '(Ulir E27)' : '(Screw E27)'}
                </span>
              </div>
              <div className="truncate text-[10px] text-slate-400">
                {installedSpec
                  ? `${isIndonesian ? installedSpec.label : installedSpec.labelEn} (${resistance}Ω)`
                  : isIndonesian
                  ? 'Kosong (Open Circuit)'
                  : 'Empty (Open Circuit)'}
              </div>
            </div>

            {installedSpec && (
              heatLevel === 'hot' || heatLevel === 'warm' ? (
                <span
                  className={`flex shrink-0 items-center gap-0.5 rounded border px-1.5 py-0.5 font-mono text-[9px] ${
                    heatLevel === 'hot'
                      ? 'border-orange-500/30 bg-orange-500/15 text-orange-300'
                      : 'border-amber-500/25 bg-amber-500/10 text-amber-300'
                  }`}
                >
                  <Flame className="h-2.5 w-2.5" />
                  {heatLevel === 'hot' ? (isIndonesian ? 'Panas' : 'Hot') : isIndonesian ? 'Hangat' : 'Warm'}
                </span>
              ) : (
                <span className="flex shrink-0 items-center gap-0.5 rounded border border-sky-500/20 bg-sky-500/10 px-1.5 py-0.5 font-mono text-[9px] text-sky-300">
                  <Snowflake className="h-2.5 w-2.5" />
                  {isIndonesian ? 'Dingin' : 'Cool'}
                </span>
              )
            )}
          </div>

          <div className="space-y-1 rounded-lg border border-white/5 bg-void-950/85 p-2 font-mono text-[10px]">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-sans text-slate-400">{isIndonesian ? 'Status Lampu:' : 'Bulb State:'}</span>
              <span className={installedSpec ? 'truncate font-bold text-amber-300' : 'text-slate-500'}>
                {installedSpec
                  ? effectiveIsBlown
                    ? `💥 ${t.overloaded}`
                    : `${(brightness * 100).toFixed(0)}% ${t.brightness}`
                  : isIndonesian
                  ? 'Kosong (Tidak Menghantar)'
                  : 'Empty (Open Circuit)'}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-sans text-slate-400">{isIndonesian ? 'Tegangan (V):' : 'Voltage (V):'}</span>
              <span className="text-slate-200">{voltageDrop.toFixed(2)} V</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-sans text-slate-400">{isIndonesian ? 'Kuat Arus (I):' : 'Current (I):'}</span>
              <span className="text-electric-400">{formatCurrent(current)}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-sans text-slate-400">{isIndonesian ? 'Daya Disipasi:' : 'Power:'}</span>
              <span className="text-slate-200">{formatPower(powerWatts)}</span>
            </div>
          </div>

          <p className="mt-1.5 text-[10px] leading-snug text-slate-400">
            {installedSpec
              ? isIndonesian
                ? 'Tekan tombol "Lepas" untuk melepas lampu dari fiting.'
                : 'Click "Unscrew" to detach the bulb back into canvas.'
              : isIndonesian
              ? 'Seret lampu ulir ke atas fiting ini untuk memasangnya.'
              : 'Drag a screw-base bulb onto this socket to install it.'}
          </p>

          {installedSpec && (
            <div className="mt-2 flex gap-1.5">
              {effectiveIsBlown && (
                <button
                  type="button"
                  onClick={() => {
                    if (installedBulbObj) {
                      updateComponentData(id, {
                        installedBulb: { ...installedBulbObj, isBlown: false },
                        isBlown: false,
                      });
                    } else {
                      updateComponentData(id, { isBlown: false });
                    }
                  }}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded border border-red-500/50 bg-red-950/90 px-1.5 py-1 text-[10px] font-bold text-red-200 transition-colors hover:bg-red-900 active:scale-95"
                >
                  <RotateCcw className="h-3 w-3" /> {isIndonesian ? 'Reset' : 'Reset'}
                </button>
              )}
              <button
                type="button"
                onClick={() => detachBulbFromSocket(id)}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded border border-cyan-400/40 bg-cyan-500/10 px-1.5 py-1 text-[10px] font-bold text-cyan-200 transition-colors hover:bg-cyan-500/20 active:scale-95"
              >
                <Unplug className="h-3 w-3" /> {isIndonesian ? 'Lepas Lampu' : 'Unscrew Bulb'}
              </button>
            </div>
          )}
        </NodeInfoPopover>
      )}
    </div>
  );
};
