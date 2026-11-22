import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Flame, Plus, RotateCcw, Snowflake, Unplug } from 'lucide-react';
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
import { BulbGraphic, PinSocketGraphic } from '../../ui/common/LabComponentArt';

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
 * Preserved for geometric calibration & unit test invariants.
 */
export const PIN_SOCKET_FRONT_LIP_CLIP_PATH =
  'polygon(0% 4.5%, 15% 5.8%, 35% 6.8%, 50% 7.0%, 65% 6.8%, 85% 5.8%, 100% 4.5%, 100% 100%, 0% 100%)';

const PIN_QUICK_BULBS: readonly { type: BulbType; labelId: string; labelEn: string }[] = [
  { type: 'halogen', labelId: 'Halogen', labelEn: 'Halogen' },
  { type: 'led_green', labelId: 'LED Hijau', labelEn: 'Green LED' },
];

/**
 * Formats electric current in milliamperes (mA) or amperes (A).
 * Time Complexity: O(1).
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
 */
function formatPowerWatts(watts: number): string {
  const absoluteWatts = Math.abs(watts);
  if (absoluteWatts === 0) return '0.00 W';
  if (absoluteWatts < 0.1) return `${(absoluteWatts * 1000).toFixed(1)} mW`;
  return `${absoluteWatts.toFixed(2)} W`;
}

/**
 * White Ceramic Bi-Pin Socket ("Fiting Keramik Bi-Pin") Node.
 * Uses unified pure-SVG PinSocketGraphic and BulbGraphic in a 3-layer depth sandwich.
 *
 * Time Complexity: O(1) render & photometric calculation.
 */
export const PinSocketNode: React.FC<NodeProps<CircuitElementData>> = ({
  id,
  data,
  selected,
}) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);
  const physicsLensMode = useCircuitStore((state) => state.physicsLensMode);
  const detachBulbFromSocket = useCircuitStore((state) => state.detachBulbFromSocket);
  const quickInstallBulbInSocket = useCircuitStore((state) => state.quickInstallBulbInSocket);
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

  const handleClass =
    '!bg-void-800 !border-2 !border-amber-400 !w-3 !h-3 !min-w-0 !min-h-0 !rounded-full transition-transform hover:scale-125';
  const handleStyle = (leftPercent: string): React.CSSProperties => ({
    left: leftPercent,
    bottom: -3,
    transform: 'translateX(-50%)',
    zIndex: 40,
  });

  return (
    <div
      className="group relative select-none"
      style={{
        width: PIN_SOCKET_NODE_SIZE.width,
        height: PIN_SOCKET_NODE_SIZE.height,
        overflow: 'visible',
      }}
    >
      {/* LAYER 1 (zIndex: 10): Socket Back Rim & Insertion Slots */}
      <div
        className={`relative h-full w-full rounded-md outline outline-1 outline-offset-2 transition-[outline-color] duration-150 ${
          selected ? 'outline-cyan-300' : 'outline-transparent group-hover:outline-cyan-400/80'
        }`}
        style={{ zIndex: 10 }}
      >
        <PinSocketGraphic
          layer={installedSpec ? 'back' : 'full'}
          className="block h-full w-full drop-shadow-sm"
        />
      </div>

      {/* NATURAL MULTI-TIER BORDERLESS BLOOM GLOW (zIndex: 14) */}
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

      {/* LAYER 2 (zIndex: 20): Installed Pin Bulb Vector Artwork */}
      {installedSpec && (
        <div
          className={`absolute left-1/2 flex items-center justify-center select-none ${
            physicsLensMode === 'probe' ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
          }`}
          style={{
            width: BULB_NODE_SIZE.width,
            height: BULB_NODE_SIZE.height,
            top: bulbTopOffset,
            transform: 'translateX(-50%)',
            zIndex: 20,
          }}
        >
          <BulbGraphic
            bulbType={installedSpec.type}
            brightness={brightness}
            isBlown={effectiveIsBlown}
            className="h-full w-full transition-all duration-300"
          />

          {effectiveIsBlown && (
            <span className="absolute right-2 top-2 z-30 h-2.5 w-2.5 rounded-full bg-danger-500 border border-pure-white" />
          )}
        </div>
      )}

      {/* LAYER 3 (zIndex: 30): Front Ceramic Body Overlay wrapping in front of lower pins */}
      {installedSpec && (
        <div
          className="pointer-events-none absolute inset-0 select-none"
          style={{ zIndex: 30 }}
        >
          <PinSocketGraphic layer="front-lip" className="block h-full w-full" />
        </div>
      )}

      {/* LAYER 4 (zIndex: 40): ELECTRICAL HANDLES */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="p1"
        title={
          isIndonesian
            ? 'Terminal Pin 1 / Anoda (+) Tab Kiri'
            : 'Pin 1 Terminal / Anode (+) Left Tab'
        }
        className={handleClass}
        style={handleStyle(PIN_SOCKET_TERMINALS.p1)}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="p2"
        title={
          isIndonesian
            ? 'Terminal Pin 2 / Katoda (-) Tab Kanan'
            : 'Pin 2 Terminal / Cathode (-) Right Tab'
        }
        className={handleClass}
        style={handleStyle(PIN_SOCKET_TERMINALS.p2)}
      />

      {/* REVERSE-BIASED LED POLARITY WARNING BADGE */}
      {data.isReverseBiased && installedSpec && (
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-500/70 bg-amber-950 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-200 shadow-md"
          style={{ bottom: -22, zIndex: 45 }}
        >
          {isIndonesian ? 'Kutub LED Terbalik (+/-)' : 'LED Reverse Polarity'}
        </div>
      )}

      {/* POPOVER TELEMETRY & CONTROLS: Shown while socket is selected */}
      {selected && (
        <NodeInfoPopover placement="bottom">
          <div className="mb-1.5 flex items-center justify-between gap-1.5">
            <div className="min-w-0">
              <div className="truncate text-xs font-bold tracking-tight text-ink">
                {isIndonesian ? 'Fiting Keramik Pin' : 'Ceramic Pin Socket'}
                <span className="ml-1 font-mono text-[10px] text-amber-400">
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
                      ? 'border-orange-500/45 bg-orange-500/15 text-orange-300'
                      : 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                  }`}
                >
                  <Flame className="h-2.5 w-2.5" aria-hidden="true" />
                  {heatLevel === 'hot' ? (isIndonesian ? 'Panas' : 'Hot') : isIndonesian ? 'Hangat' : 'Warm'}
                </span>
              ) : (
                <span className="flex shrink-0 items-center gap-0.5 rounded border border-sky-500/40 bg-sky-500/15 px-1.5 py-0.5 font-mono text-[9px] text-sky-300">
                  <Snowflake className="h-2.5 w-2.5" aria-hidden="true" />
                  {isIndonesian ? 'Dingin' : 'Cool'}
                </span>
              )
            )}
          </div>

          <div className="space-y-1 rounded-lg border border-control bg-void-950 p-2 font-mono text-[10px] tabular-nums">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-sans text-slate-400">{isIndonesian ? 'Status Lampu:' : 'Bulb State:'}</span>
              <span className={installedSpec ? 'truncate font-bold text-amber-300' : 'text-slate-400'}>
                {installedSpec
                  ? effectiveIsBlown
                    ? bulbTranslations.overloaded
                    : `${(brightness * 100).toFixed(0)}% ${bulbTranslations.brightness}`
                  : isIndonesian
                  ? 'Kosong (Tidak Menghantar)'
                  : 'Empty (Open Circuit)'}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-sans text-slate-400">{isIndonesian ? 'Tegangan (V):' : 'Voltage (V):'}</span>
              <span className="text-ink">{voltageDrop.toFixed(2)} V</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-sans text-slate-400">{isIndonesian ? 'Kuat Arus (I):' : 'Current (I):'}</span>
              <span className="text-electric-400">{formatCurrentAmperes(activeCurrentAmperes)}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-sans text-slate-400">{isIndonesian ? 'Daya Disipasi:' : 'Power:'}</span>
              <span className="text-ink">{formatPowerWatts(powerWatts)}</span>
            </div>
          </div>

          {!installedSpec ? (
            <div className="mt-2 space-y-1.5">
              <p className="text-[10px] leading-snug text-slate-400">
                {isIndonesian
                  ? 'Pasang lampu pin cepat (1 klik) atau seret lampu ke atas fiting:'
                  : 'Quick-install a pin bulb (1 tap) or drag one onto this socket:'}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {PIN_QUICK_BULBS.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => quickInstallBulbInSocket(id, item.type)}
                    className="flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-electric-600 hover:bg-electric-700 px-2 py-1.5 text-[10px] font-bold text-white transition-colors active:scale-95"
                  >
                    <Plus className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span className="truncate">{isIndonesian ? item.labelId : item.labelEn}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <p className="mt-1.5 text-[10px] leading-snug text-slate-400">
                {isIndonesian
                  ? 'Tekan tombol "Lepas Lampu" untuk melepas lampu dari fiting keramik.'
                  : 'Click "Detach Bulb" to remove the bulb from the ceramic socket.'}
              </p>

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
                    className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg bg-danger-600 hover:bg-danger-700 px-2 py-1.5 text-[10px] font-bold text-white transition-colors active:scale-95"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" /> {isIndonesian ? 'Reset' : 'Reset'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => detachBulbFromSocket(id)}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg bg-electric-600 hover:bg-electric-700 px-2 py-1.5 text-[10px] font-bold text-white transition-colors active:scale-95"
                >
                  <Unplug className="h-3 w-3" aria-hidden="true" /> {isIndonesian ? 'Lepas Lampu' : 'Detach Bulb'}
                </button>
              </div>
            </>
          )}
        </NodeInfoPopover>
      )}
    </div>
  );
};
