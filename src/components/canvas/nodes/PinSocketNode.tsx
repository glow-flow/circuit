import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Flame, RotateCcw, Snowflake, Unplug } from 'lucide-react';
import { CircuitElementData, InstalledBulbData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import {
  BulbType,
  canBulbFitPinSocket,
  computeBulbPhotometrics,
  getBulbSpec,
} from '../../../constants/bulbCatalog';
import { BULB_NODE_SIZE, getInstalledBulbTopOffset } from '../../../utils/socketSnap';
import { TRANSLATIONS } from '../../../i18n/translations';
import { NodeInfoPopover } from './NodeInfoPopover';

/**
 * Calibrated size (px) for the ceramic bi-pin socket node.
 * Proportional to the physical white ceramic socket body (width ~38px, height ~58px).
 */
export const PIN_SOCKET_NODE_SIZE = { width: 38, height: 58 } as const;

/**
 * Horizontal positions (percentage of socket node width) for the two bottom copper terminal tabs.
 * p1 = Left copper terminal tab
 * p2 = Right copper terminal tab
 */
export const PIN_SOCKET_TERMINALS = { p1: '28%', p2: '72%' } as const;

/**
 * Top offset (px) for an installed Halogen bulb inside the PinSocketNode.
 * Calibrated so the metal contact pins penetrate DOWN into the top insertion slots,
 * while the dark collar rests flush against the ceramic mouth with zero gap.
 */
export const HALOGEN_BULB_TOP_OFFSET = getInstalledBulbTopOffset('halogen');

/**
 * Polygon clip-path tracing the front ceramic lip of the bi-pin socket.
 * Used on Layer 3 (zIndex: 30) so the front ceramic socket wall wraps in front of
 * the halogen bulb's lower contact pin plane, creating realistic physical insertion depth.
 */
export const PIN_SOCKET_FRONT_LIP_CLIP_PATH =
  'polygon(0% 4.5%, 15% 5.8%, 35% 6.8%, 50% 7.0%, 65% 6.8%, 85% 5.8%, 100% 4.5%, 100% 100%, 0% 100%)';

/**
 * Formats electric current in milliamperes (mA) or amperes (A).
 * Time Complexity: O(1).
 *
 * @param amperes - Current value in Amperes
 * @returns Formatted human-readable current string
 */
function formatCurrentAmperes(amperes: number): string {
  const absoluteAmperes = Math.abs(amperes);
  if (absoluteAmperes === 0) return '0 mA';
  if (absoluteAmperes < 0.001) return `${(absoluteAmperes * 1000).toFixed(2)} mA`;
  if (absoluteAmperes < 1) return `${(absoluteAmperes * 1000).toFixed(1)} mA`;
  return `${absoluteAmperes.toFixed(2)} A`;
}

/**
 * Formats dissipated electrical power in milliwatts (mW) or watts (W).
 * Time Complexity: O(1).
 *
 * @param watts - Power value in Watts
 * @returns Formatted human-readable power string
 */
function formatPowerWatts(watts: number): string {
  const absoluteWatts = Math.abs(watts);
  if (absoluteWatts === 0) return '0.00 W';
  if (absoluteWatts < 0.1) return `${(absoluteWatts * 1000).toFixed(1)} mW`;
  return `${absoluteWatts.toFixed(2)} W`;
}

/**
 * White Ceramic Bi-Pin Socket ("Fiting Keramik Bi-Pin") Node.
 *
 * Electrical Architecture:
 * - Only PinSocketNode has wire handles for halogen wiring (p1 and p2 at bottom copper tabs).
 * - When empty: acts as an OPEN CIRCUIT (resistance = Infinity / 1GΩ, 0 current).
 * - When Halogen bulb is inserted: conducts current through the halogen filament (R ≈ 1500Ω).
 *
 * 3-Layer Depth Sandwich Architecture:
 * - Layer 1 (zIndex: 10): White ceramic socket back & body (`/assets/socket-pin.png`).
 * - Layer 1.5 (zIndex: 15): Dark inner cavity shadow at the top insertion slot area.
 * - Layer 2 (zIndex: 20): Installed Halogen bulb (`/assets/bulb-halogen.png`) with pins penetrating down.
 * - Layer 3 (zIndex: 30): Front ceramic socket lip overlay with `clipPath` wrapping in front of bulb pins.
 * - Layer 4 (zIndex: 40): Electrical connection handles at bottom copper tabs.
 *
 * Photometrics & Optical Architecture:
 * - Multi-tier radial bloom glow rendered with zero rectangular clipping.
 * - Natural heat dissipation states (Cold, Warm, Hot, Overheat).
 *
 * Time Complexity: O(1) render & photometric calculation.
 *
 * @param props - React Flow NodeProps containing circuit element data and selection state
 * @returns React component representing the ceramic bi-pin socket and any installed halogen lamp
 */
export const PinSocketNode: React.FC<NodeProps<CircuitElementData>> = ({
  id,
  data,
  selected,
}) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);
  const detachBulbFromSocket = useCircuitStore((state) => state.detachBulbFromSocket);
  const updateComponentData = useCircuitStore((state) => state.updateComponentData);

  const isIndonesian = language === 'id';
  const bulbTranslations = TRANSLATIONS[language].nodes.bulb;

  // Extract installed bulb data safely
  const rawInstalledBulb = data.installedBulb;
  const isInstalledBulbObject = Boolean(
    rawInstalledBulb && typeof rawInstalledBulb === 'object'
  );
  const installedBulbObj = isInstalledBulbObject
    ? (rawInstalledBulb as InstalledBulbData)
    : null;

  const installedBulbType: BulbType | undefined = installedBulbObj
    ? installedBulbObj.bulbType
    : typeof rawInstalledBulb === 'string'
    ? (rawInstalledBulb as BulbType)
    : undefined;

  // Ceramic bi-pin socket strictly accepts pin-base bulbs (halogen or green indicator LED)
  const candidateSpec = installedBulbType ? getBulbSpec(installedBulbType) : undefined;
  const installedSpec =
    candidateSpec && (candidateSpec.baseType === 'pin' || canBulbFitPinSocket(candidateSpec.type))
      ? candidateSpec
      : undefined;

  const bulbTopOffset = getInstalledBulbTopOffset(installedSpec?.type);

  const isBlown = Boolean(
    (installedBulbObj && installedBulbObj.isBlown) || data.isBlown
  );

  const effectiveResistanceOhms = installedSpec
    ? (installedBulbObj?.resistance ?? data.resistance ?? installedSpec.resistance)
    : 1e9;

  const activeCurrentAmperes = Math.abs(
    simulation.branchCurrents[id] ?? data.calculatedCurrent ?? 0
  );

  // Compute photometrics (brightness, heat, power, voltage drop)
  const photometrics = installedSpec
    ? computeBulbPhotometrics(activeCurrentAmperes, effectiveResistanceOhms, installedSpec)
    : {
        powerWatts: 0,
        voltageDrop: 0,
        brightness: 0,
        heatLevel: 'cold' as const,
        isOverloaded: false,
      };

  const { powerWatts, voltageDrop, brightness, heatLevel, isOverloaded } = photometrics;
  const effectiveIsBlown = isBlown || isOverloaded;

  // Handle styling matching project design standards
  const handleClass =
    '!bg-void-800 !border-2 !border-amber-400 !w-2.5 !h-2.5 !min-w-0 !min-h-0 !rounded-full transition-transform hover:scale-125';
  const handleStyle = (leftPercent: string): React.CSSProperties => ({
    left: leftPercent,
    bottom: -3,
    transform: 'translateX(-50%)',
    zIndex: 40,
  });

  // Pure optical filter: NO drop-shadow on the image itself to prevent bounding box clipping
  const bulbImageFilter = effectiveIsBlown
    ? 'grayscale(100%) brightness(0.42) contrast(1.15)'
    : brightness > 0.01
    ? `brightness(${0.96 + brightness * 0.42}) saturate(${1.0 + brightness * 0.35})`
    : 'saturate(0.45) brightness(0.76) contrast(1.04)';

  return (
    <div
      className="group relative select-none"
      style={{
        width: PIN_SOCKET_NODE_SIZE.width,
        height: PIN_SOCKET_NODE_SIZE.height,
        overflow: 'visible',
      }}
    >
      {/* 
        =======================================================================
        3-LAYER DEPTH SANDWICH FOR CERAMIC BI-PIN SOCKET + HALOGEN BULB
        -----------------------------------------------------------------------
        Layer 1 (zIndex: 10): White ceramic socket back & body + inner cavity shadow
        Layer 2 (zIndex: 20): Installed Halogen bulb penetrating down into slots
        Layer 3 (zIndex: 30): Front ceramic socket lip overlay wrapping in front of bulb pins
        Layer 4 (zIndex: 40): Bottom electrical handles on copper tabs
        =======================================================================
      */}

      {/* LAYER 1 (zIndex: 10): Socket Back Rim & Ceramic Body Artwork */}
      <div
        className={`relative h-full w-full rounded-md outline outline-1 outline-offset-2 transition-[outline-color] duration-150 ${
          selected ? 'outline-cyan-300' : 'outline-transparent group-hover:outline-cyan-400/80'
        }`}
        style={{ zIndex: 10 }}
      >
        <img
          src="/assets/socket-pin.png"
          alt={isIndonesian ? 'Fiting keramik bi-pin' : 'Ceramic bi-pin socket'}
          draggable={false}
          className="pointer-events-none block h-full w-full select-none object-contain"
        />

        {/* LAYER 1.5 (zIndex: 15): Dark inner cavity shadow at the top insertion slot area */}
        {installedSpec && (
          <div
            className="pointer-events-none absolute rounded-sm"
            style={{
              left: '18%',
              top: '4%',
              width: '64%',
              height: '14%',
              background:
                'radial-gradient(ellipse at center, #090a0d 55%, rgba(9,10,13,0.92) 85%, transparent 100%)',
              zIndex: 15,
            }}
          />
        )}
      </div>

      {/* NATURAL MULTI-TIER BORDERLESS BLOOM GLOW (zIndex: 14): Zero bounding box clipping */}
      {installedSpec && !effectiveIsBlown && brightness > 0.01 && (
        <div
          className="pointer-events-none absolute select-none"
          style={{
            left: '50%',
            top: bulbTopOffset + (installedSpec.type === 'led_green' ? 25 : 44),
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
          {/* Tier 2: Glass envelope corona (75px - 120px) */}
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

      {/* LAYER 2 (zIndex: 20): Installed Pin Bulb Artwork (Fixed size, pins penetrate down) */}
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
            className="pointer-events-none relative h-full w-full select-none object-contain transition-all duration-300"
            style={{
              filter: bulbImageFilter,
              opacity: effectiveIsBlown ? 0.55 : brightness > 0.01 ? 1 : 0.94,
            }}
          />

          {effectiveIsBlown && (
            <span className="absolute right-2 top-2 z-30 h-2.5 w-2.5 animate-pulse rounded-full bg-red-500 shadow-glow-danger" />
          )}
        </div>
      )}

      {/* LAYER 3 (zIndex: 30): Front Ceramic Lip Overlay (wraps in front of lower pin plane) */}
      {installedSpec && (
        <div
          className="pointer-events-none absolute inset-0 select-none"
          style={{ zIndex: 30 }}
        >
          <img
            src="/assets/socket-pin.png"
            alt=""
            aria-hidden="true"
            draggable={false}
            className="pointer-events-none block h-full w-full select-none object-contain"
            style={{
              clipPath: PIN_SOCKET_FRONT_LIP_CLIP_PATH,
            }}
          />
        </div>
      )}

      {/* 
        LAYER 4 (zIndex: 40): ELECTRICAL HANDLES
        PinSocketNode possesses the wire connection handles directly on the bottom copper tabs.
      */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="p1"
        title={isIndonesian ? 'Terminal Pin 1 / Tab Tembaga Kiri' : 'Pin 1 Terminal / Left Copper Tab'}
        className={handleClass}
        style={handleStyle(PIN_SOCKET_TERMINALS.p1)}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="p2"
        title={isIndonesian ? 'Terminal Pin 2 / Tab Tembaga Kanan' : 'Pin 2 Terminal / Right Copper Tab'}
        className={handleClass}
        style={handleStyle(PIN_SOCKET_TERMINALS.p2)}
      />

      {/* POPOVER TELEMETRY & CONTROLS: Shown while socket is selected */}
      {selected && (
        <NodeInfoPopover placement="bottom">
          <div className="mb-1.5 flex items-center justify-between gap-1.5">
            <div className="min-w-0">
              <div className="truncate text-xs font-bold tracking-tight text-slate-100">
                {isIndonesian ? 'Fiting Keramik Pin' : 'Ceramic Pin Socket'}
                <span className="ml-1 font-mono text-[10px] text-amber-300">
                  {installedSpec?.type === 'led_green'
                    ? (isIndonesian ? '(LED Indikator)' : '(Indicator LED)')
                    : (isIndonesian ? '(G4 / Halogen)' : '(G4 / Halogen)')}
                </span>
              </div>
              <div className="truncate text-[10px] text-slate-400">
                {installedSpec
                  ? `${isIndonesian ? installedSpec.label : installedSpec.labelEn} (${effectiveResistanceOhms}Ω)`
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
                    ? `💥 ${bulbTranslations.overloaded}`
                    : `${(brightness * 100).toFixed(0)}% ${bulbTranslations.brightness}`
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
              <span className="text-electric-400">{formatCurrentAmperes(activeCurrentAmperes)}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-sans text-slate-400">{isIndonesian ? 'Daya Disipasi:' : 'Power:'}</span>
              <span className="text-slate-200">{formatPowerWatts(powerWatts)}</span>
            </div>
          </div>

          <p className="mt-1.5 text-[10px] leading-snug text-slate-400">
            {installedSpec
              ? isIndonesian
                ? 'Tekan tombol "Lepas Lampu" untuk melepas lampu halogen dari fiting keramik.'
                : 'Click "Detach Bulb" to remove the halogen bulb from the ceramic socket.'
              : isIndonesian
              ? 'Seret lampu halogen kapsul ke atas fiting ini untuk memasangnya.'
              : 'Drag a halogen capsule bulb onto this socket to install it.'}
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
                className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded border border-amber-400/40 bg-amber-500/10 px-1.5 py-1 text-[10px] font-bold text-amber-200 transition-colors hover:bg-amber-500/20 active:scale-95"
              >
                <Unplug className="h-3 w-3" /> {isIndonesian ? 'Lepas Lampu' : 'Detach Bulb'}
              </button>
            </div>
          )}
        </NodeInfoPopover>
      )}
    </div>
  );
};
