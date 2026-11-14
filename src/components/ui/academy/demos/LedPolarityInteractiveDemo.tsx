import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useCircuitStore } from '../../../../store/useCircuitStore';
import { MiniLabFrame } from './MiniLabFrame';

type MeterMode = 'voltmeter_parallel' | 'ammeter_series' | 'ammeter_parallel_short';

/**
 * Interactive LED Polarity & Multimeter Probe Placement SVG Micro-Lab.
 * Visualizes Forward/Reverse Bias diode behavior, current limiting resistors, and Ammeter shorting hazards.
 *
 * Time Complexity: O(1).
 */
export const LedPolarityInteractiveDemo: React.FC = () => {
  const language = useCircuitStore((state) => state.language);
  const isId = language === 'id';

  const [isForwardBias, setIsForwardBias] = useState<boolean>(false);
  const [hasResistor, setHasResistor] = useState<boolean>(true);
  const [meterMode, setMeterMode] = useState<MeterMode>('voltmeter_parallel');
  const [testedSafeMeter, setTestedSafeMeter] = useState<boolean>(false);

  const isMeterShort = meterMode === 'ammeter_parallel_short';
  const vSource = 5.0;
  const vLedDrop = 2.0;
  const rSourceAndMeterOhms = 0.3; // 0.25Ω supply R_int + 0.05Ω ammeter shunt
  const rUnclampedLedOhms = 15.0; // Low dynamic bulk resistance when LED driven without limiting resistor

  let currentMa = 0;
  let measuredLedVoltage = 0;
  let statusBadge = '';

  if (isMeterShort) {
    currentMa = (vSource / rSourceAndMeterOhms) * 1000;
    measuredLedVoltage = 0;
    statusBadge = isId ? 'KORSLET! R_ammeter ≈ 0 Ω' : 'SHORT! R_ammeter ≈ 0 Ω';
  } else if (!isForwardBias) {
    currentMa = 0;
    // By KVL with I = 0 across 220Ω resistor (V_R = 0V), full 5.0V source potential appears across open reverse diode
    measuredLedVoltage = vSource;
    statusBadge = isId ? 'TERBLOKIR (Reverse Bias · V_oc = 5V)' : 'BLOCKED (Reverse Bias · V_oc = 5V)';
  } else if (!hasResistor) {
    currentMa = ((vSource - vLedDrop) / rUnclampedLedOhms) * 1000;
    measuredLedVoltage = vSource;
    statusBadge = isId ? 'OVERLOAD! LED Rusak Tanpa Resistor' : 'OVERLOAD! Missing Resistor';
  } else {
    currentMa = ((vSource - vLedDrop) / 220) * 1000;
    measuredLedVoltage = vLedDrop;
    statusBadge = isId ? 'MENYALA AMAN (Forward Bias)' : 'LIT SAFELY (Forward Bias)';
  }

  const isChallengeMet = isForwardBias && hasResistor && !isMeterShort && testedSafeMeter;

  return (
    <MiniLabFrame
      title={isId ? 'Lab Visual: Polaritas LED & Alat Ukur' : 'Visual Lab: LED Polarity & Meters'}
      formula={isForwardBias ? 'Anoda(+) → Katoda(-)' : 'Reverse Blocking'}
      challengeText={
        isChallengeMet
          ? isId
            ? 'Berhasil! LED forward bias menyala aman dengan Resistor 220 Ω & alat ukur benar.'
            : 'Success! Forward-biased LED lights safely with 220 Ω resistor & proper meter.'
          : isId
          ? 'Misi Mini: Balik LED jadi Forward Bias, pasang Resistor 220Ω, & uji Ammeter Seri.'
          : 'Mini Goal: Flip LED to Forward Bias, keep 220Ω resistor on, and test Series Ammeter.'
      }
      isChallengeMet={isChallengeMet}
    >
      {/* Interactive SVG Circuit */}
      <div className="rounded-xl bg-void-900 border border-white/10 p-2.5">
        <svg viewBox="0 0 360 140" className="w-full h-auto max-h-40 select-none">
          {/* Wire Loop */}
          <path
            d="M 48 42 L 310 42 L 310 108 L 48 108 Z"
            fill="none"
            stroke={
              isMeterShort
                ? '#f43f5e'
                : isForwardBias && hasResistor
                ? '#10b981'
                : isForwardBias
                ? '#fb923c'
                : '#475569'
            }
            strokeWidth="2.5"
          />

          {/* 5V Battery Left */}
          <rect
            x="22"
            y="48"
            width="52"
            height="54"
            rx="9"
            fill="#090d16"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />
          <text x="48" y="69" textAnchor="middle" fill="#7dd3fc" fontSize="11" fontWeight="700" fontFamily="JetBrains Mono, monospace">
            +5V
          </text>
          <text x="48" y="88" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="JetBrains Mono, monospace">
            GND
          </text>

          {/* Resistor 220 Ohm */}
          <rect
            x="102"
            y="28"
            width="68"
            height="28"
            rx="6"
            fill="#0f172a"
            stroke={hasResistor ? '#fbbf24' : '#f43f5e'}
            strokeWidth="1.5"
            strokeDasharray={hasResistor ? undefined : '4 3'}
          />
          <text
            x="136"
            y="46"
            textAnchor="middle"
            fill={hasResistor ? '#fde68a' : '#fda4af'}
            fontSize="10"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            {hasResistor ? '220 Ω' : '0 Ω (Bypass)'}
          </text>

          {/* Clickable Diode / LED Symbol */}
          <g onClick={() => setIsForwardBias((v) => !v)} className="cursor-pointer">
            {isForwardBias && !isMeterShort && (
              <circle
                cx="236"
                cy="42"
                r="22"
                fill={hasResistor ? '#10b981' : '#f43f5e'}
                fillOpacity="0.32"
              />
            )}
            <rect
              x="206"
              y="22"
              width="60"
              height="40"
              rx="8"
              fill="#090d16"
              stroke={isForwardBias ? '#10b981' : '#f43f5e'}
              strokeWidth="1.6"
            />
            {isForwardBias ? (
              <>
                <polygon points="223,32 223,52 243,42" fill="#34d399" />
                <line x1="244" y1="31" x2="244" y2="53" stroke="#e2e8f0" strokeWidth="2.5" />
                <text x="217" y="31" fill="#34d399" fontSize="8" fontWeight="700">+</text>
                <text x="251" y="31" fill="#94a3b8" fontSize="8" fontWeight="700">-</text>
              </>
            ) : (
              <>
                <polygon points="247,32 247,52 227,42" fill="#fb7185" />
                <line x1="226" y1="31" x2="226" y2="53" stroke="#e2e8f0" strokeWidth="2.5" />
                <text x="217" y="31" fill="#fb7185" fontSize="8" fontWeight="700">-</text>
                <text x="250" y="31" fill="#94a3b8" fontSize="8" fontWeight="700">+</text>
              </>
            )}
          </g>

          {/* Meter Visual Box Bottom */}
          <g transform="translate(120, 88)">
            <rect
              x="0"
              y="0"
              width="140"
              height="38"
              rx="8"
              fill="#090d16"
              stroke={isMeterShort ? '#f43f5e' : '#38bdf8'}
              strokeWidth="1.6"
            />
            <text
              x="70"
              y="15"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="8.5"
              fontWeight="600"
            >
              {meterMode === 'voltmeter_parallel'
                ? isId ? 'VOLTMETER (Paralel · R≈∞)' : 'VOLTMETER (Parallel · R≈∞)'
                : meterMode === 'ammeter_series'
                ? isId ? 'AMMETER (Seri · R≈0)' : 'AMMETER (Series · R≈0)'
                : isId ? 'AMMETER PARALEL (BAHAYA!)' : 'PARALLEL AMMETER (SHORT!)'}
            </text>
            <text
              x="70"
              y="30"
              textAnchor="middle"
              fill={isMeterShort ? '#fb7185' : isForwardBias ? '#34d399' : '#e2e8f0'}
              fontSize="11"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
            >
              {meterMode === 'voltmeter_parallel'
                ? `V_led = ${measuredLedVoltage.toFixed(2)} V`
                : `I = ${currentMa.toFixed(1)} mA`}
            </text>
          </g>

          {/* Status Banner */}
          <text
            x="236"
            y="77"
            textAnchor="middle"
            fill={isMeterShort || !isForwardBias || !hasResistor ? '#fda4af' : '#6ee7b7'}
            fontSize="9"
            fontWeight="700"
          >
            {statusBadge}
          </text>
        </svg>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setIsForwardBias((v) => !v)}
          className={`min-h-[42px] rounded-xl border px-3 py-1.5 flex items-center justify-center gap-1.5 font-semibold text-xs transition-all active:scale-95 ${
            isForwardBias
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {isForwardBias
            ? isId ? 'Forward Bias (+ ke +)' : 'Forward Bias'
            : isId ? 'Balik Kaki LED' : 'Flip LED Polarity'}
        </button>

        <button
          type="button"
          onClick={() => setHasResistor((v) => !v)}
          className={`min-h-[42px] rounded-xl border px-3 py-1.5 font-semibold text-xs transition-all active:scale-95 ${
            hasResistor
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
              : 'bg-void-900 border-white/10 text-slate-400 hover:text-slate-200'
          }`}
        >
          {hasResistor
            ? isId ? 'Resistor 220Ω: ON' : '220Ω Resistor: ON'
            : isId ? 'Pasang Resistor 220Ω' : 'Add 220Ω Resistor'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {(
          [
            ['voltmeter_parallel', isId ? 'Voltmeter Paralel' : 'Parallel Volt'],
            ['ammeter_series', isId ? 'Ammeter Seri' : 'Series Amp'],
            ['ammeter_parallel_short', isId ? 'Ammeter Paralel' : 'Parallel Amp!'],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            onClick={() => {
              setMeterMode(mode);
              if (mode === 'ammeter_series') setTestedSafeMeter(true);
            }}
            className={`min-h-[38px] rounded-lg border px-2 py-1 text-[11px] font-semibold transition-all active:scale-95 ${
              meterMode === mode
                ? mode === 'ammeter_parallel_short'
                  ? 'bg-rose-500/25 border-rose-500/60 text-rose-200'
                  : 'bg-electric-500/20 border-electric-500/50 text-electric-200'
                : 'bg-void-900 border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </MiniLabFrame>
  );
};
