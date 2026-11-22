import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Flame, Plus, RotateCcw, Snowflake, Unplug } from 'lucide-react';
import { CircuitElementData } from '../../../types/circuit';
import { useCircuitStore } from '../../../store/useCircuitStore';
import {
  BulbType,
  canBulbFitSocket,
  computeBulbPhotometrics,
  getBulbSpec,
} from '../../../constants/bulbCatalog';
import {
  BULB_NODE_SIZE,
  SOCKET_NODE_SIZE,
  getInstalledBulbTopOffset,
} from '../../../utils/socketSnap';
import { TRANSLATIONS } from '../../../i18n/translations';
import { NodeInfoPopover } from './NodeInfoPopover';
import { BulbGraphic, E27SocketGraphic } from '../../ui/common/LabComponentArt';

/**
 * Horizontal positions (percentage of socket node width) for the two bottom brass screw terminals.
 * p1 = Positive / Terminal 1 (Left brass terminal)
 * p2 = Negative / Terminal 2 (Right brass terminal)
 */
const SOCKET_TERMINALS = { p1: '29%', p2: '71%' } as const;

const E27_QUICK_BULBS: readonly { type: BulbType; labelId: string; labelEn: string }[] = [
  { type: 'led_standard', labelId: 'LED', labelEn: 'LED' },
  { type: 'incandescent', labelId: 'Pijar', labelEn: 'Incandescent' },
  { type: 'cfl', labelId: 'Neon CFL', labelEn: 'CFL' },
];

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
 * - SocketNode possesses the ONLY 2 electrical handles (p1 & p2) at the bottom brass screws.
 * - When empty: acts as an OPEN CIRCUIT (resistance = Infinity, 0 current) and offers 1-tap bulb installation.
 * - When a bulb is mounted: conducts electrical current through the installed bulb.
 *
 * Time Complexity: O(1) render & photometric calculation.
 */
export const SocketNode: React.FC<NodeProps<CircuitElementData>> = ({ id, data, selected }) => {
  const simulation = useCircuitStore((state) => state.simulation);
  const language = useCircuitStore((state) => state.language);
  const physicsLensMode = useCircuitStore((state) => state.physicsLensMode);
  const detachBulbFromSocket = useCircuitStore((state) => state.detachBulbFromSocket);
  const quickInstallBulbInSocket = useCircuitStore((state) => state.quickInstallBulbInSocket);
  const updateComponentData = useCircuitStore((state) => state.updateComponentData);

  const isIndonesian = language === 'id';
  const t = TRANSLATIONS[language].nodes.bulb;

  // Extract installed bulb data
  const installedBulb = data.installedBulb;
  const isInstalledBulbObject = Boolean(installedBulb && typeof installedBulb === 'object');
  const installedBulbObj = isInstalledBulbObject
    ? (installedBulb as import('../../../types/circuit').InstalledBulbData)
    : null;

  const installedBulbType: BulbType | undefined =
    installedBulbObj
      ? installedBulbObj.bulbType
      : typeof installedBulb === 'string'
      ? (installedBulb as BulbType)
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
    '!bg-void-800 !border-2 !border-amber-400 !w-3 !h-3 !min-w-0 !min-h-0 !rounded-full transition-transform hover:scale-125';
  const handleStyle = (leftPercent: string): React.CSSProperties => ({
    left: leftPercent,
    bottom: -3,
    transform: 'translateX(-50%)',
    zIndex: 40,
  });

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
      {/* LAYER 1 (zIndex: 10): Socket Back Rim & Recessed Cavity */}
      <div
        className={`relative h-full w-full rounded-lg outline outline-1 outline-offset-2 transition-[outline-color] duration-150 ${
          selected ? 'outline-cyan-300' : 'outline-transparent group-hover:outline-cyan-400/80'
        }`}
        style={{ zIndex: 10 }}
      >
        <E27SocketGraphic
          layer={installedSpec ? 'back' : 'full'}
          hasBulb={Boolean(installedSpec)}
          className="block h-full w-full drop-shadow-sm"
        />
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

      {/* LAYER 2 (zIndex: 20): Installed Bulb Vector Artwork */}
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

      {/* LAYER 3 (zIndex: 30): Socket Front Collar Overlay (wraps in front of bulb screw threads) */}
      {installedSpec && (
        <div
          className="pointer-events-none absolute inset-0 select-none"
          style={{ zIndex: 30 }}
        >
          <E27SocketGraphic layer="front-lip" hasBulb={true} className="block h-full w-full" />
        </div>
      )}

      {/* ELECTRICAL HANDLES (zIndex: 40) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="p1"
        title={
          isIndonesian
            ? 'Terminal Positif (+) / Anoda LED (Pin 1)'
            : 'Positive (+) Terminal / LED Anode (Pin 1)'
        }
        className={handleClass}
        style={handleStyle(SOCKET_TERMINALS.p1)}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="p2"
        title={
          isIndonesian
            ? 'Terminal Negatif (-) / Katoda LED (Pin 2)'
            : 'Negative (-) Terminal / LED Cathode (Pin 2)'
        }
        className={handleClass}
        style={handleStyle(SOCKET_TERMINALS.p2)}
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

      {/* POPOVER TELEMETRY & CONTROLS: Only while selected */}
      {selected && (
        <NodeInfoPopover placement="bottom">
          <div className="mb-1.5 flex items-center justify-between gap-1.5">
            <div className="min-w-0">
              <div className="truncate text-xs font-bold tracking-tight text-ink">
                {isIndonesian ? 'Fiting Lampu' : 'Bulb Socket'}
                <span className="ml-1 font-mono text-[10px] text-electric-400">
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
                    ? t.overloaded
                    : `${(brightness * 100).toFixed(0)}% ${t.brightness}`
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
              <span className="text-electric-400">{formatCurrent(current)}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-sans text-slate-400">{isIndonesian ? 'Daya Disipasi:' : 'Power:'}</span>
              <span className="text-ink">{formatPower(powerWatts)}</span>
            </div>
          </div>

          {!installedSpec ? (
            <div className="mt-2 space-y-1.5">
              <p className="text-[10px] leading-snug text-slate-400">
                {isIndonesian
                  ? 'Pasang lampu ulir cepat (1 klik) atau seret lampu ke atas fiting:'
                  : 'Quick-install a screw bulb (1 tap) or drag one onto this socket:'}
              </p>
              <div className="grid grid-cols-3 gap-1">
                {E27_QUICK_BULBS.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => quickInstallBulbInSocket(id, item.type)}
                    className="flex cursor-pointer items-center justify-center gap-0.5 rounded-lg bg-electric-600 hover:bg-electric-700 px-1.5 py-1.5 text-[10px] font-bold text-white transition-colors active:scale-95"
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
                  ? 'Tekan tombol "Lepas Lampu" untuk melepas lampu dari fiting.'
                  : 'Click "Unscrew Bulb" to detach the bulb back onto the canvas.'}
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
                  <Unplug className="h-3 w-3" aria-hidden="true" /> {isIndonesian ? 'Lepas Lampu' : 'Unscrew Bulb'}
                </button>
              </div>
            </>
          )}
        </NodeInfoPopover>
      )}
    </div>
  );
};
