import React from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Sliders, Trash2, Cpu, ShieldCheck, AlertTriangle, X } from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';

interface InspectorProps {
  isMobileDrawer?: boolean;
  onCloseMobile?: () => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  isMobileDrawer = false,
  onCloseMobile,
}) => {
  const nodes = useCircuitStore((state) => state.nodes);
  const edges = useCircuitStore((state) => state.edges);
  const selectedNodeId = useCircuitStore((state) => state.selectedNodeId);
  const updateComponentData = useCircuitStore((state) => state.updateComponentData);
  const removeComponent = useCircuitStore((state) => state.removeComponent);
  const toggleSwitch = useCircuitStore((state) => state.toggleSwitch);
  const simulation = useCircuitStore((state) => state.simulation);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const containerClasses = isMobileDrawer
    ? 'flex flex-col max-h-[70dvh] w-full bg-void-900 border-t border-white/15 rounded-t-2xl shadow-2xl select-none overflow-hidden'
    : 'hidden md:flex w-80 bg-void-900 border-l border-white/10 flex-col h-full shrink-0 select-none';

  if (!selectedNode) {
    // Global Circuit Telemetry View
    return (
      <aside className={containerClasses}>
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-electric-400" />
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Circuit Inspector
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-void-850 text-slate-400 border border-white/5">
              Global
            </span>
            {isMobileDrawer && onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg bg-void-850 text-slate-400 hover:text-white border border-white/10 active:scale-95"
                aria-label="Close inspector"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {/* Status Box */}
          <div
            className={`rounded-xl p-3 border ${
              simulation.isShortCircuit
                ? 'bg-danger-500/10 border-danger-500/30'
                : 'bg-void-950 border-white/5'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {simulation.isShortCircuit ? (
                <AlertTriangle className="w-4 h-4 text-danger-500" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              )}
              <span className="text-xs font-semibold text-slate-200">
                {simulation.isShortCircuit ? 'System Hazard' : 'Circuit Topology'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {simulation.isShortCircuit
                ? 'Dead short path drawing >10A! High risk of virtual thermal runaway.'
                : 'Circuit equations solved using Modified Nodal Analysis with partial pivoting.'}
            </p>
          </div>

          {/* Telemetry Metrics */}
          <div className="bg-void-950 rounded-xl p-3 border border-white/5 space-y-2.5 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans text-[11px]">Total Nodes:</span>
              <span className="text-slate-200">{nodes.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans text-[11px]">Wire Edges:</span>
              <span className="text-slate-200">{edges.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans text-[11px]">Power Drawn:</span>
              <span className="text-electric-400 font-bold">
                {simulation.totalPowerDrawn.toFixed(2)} W
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans text-[11px]">Max Net Potential:</span>
              <span className="text-amber-400 font-bold">
                {Math.max(0, ...Object.values(simulation.nodeVoltages)).toFixed(2)} V
              </span>
            </div>
          </div>

          {/* Educational Note */}
          <div className="p-3 rounded-xl bg-void-950/50 border border-white/5 text-[11px] text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-300">Quick Tip:</div>
            <p>
              Tap any component on the canvas to inspect its real-time voltage drop, adjust
              internal resistance, or modify power supply voltage.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  // Component Selected View
  const componentData = selectedNode.data;
  const branchCurrent = Math.abs(simulation.branchCurrents[selectedNode.id] ?? 0);

  return (
    <aside className={containerClasses}>
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Sliders className="w-4 h-4 text-electric-400 shrink-0" />
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider truncate">
            {componentData.label}
          </h2>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              removeComponent(selectedNode.id);
              if (isMobileDrawer && onCloseMobile) onCloseMobile();
            }}
            className="p-1.5 rounded-lg bg-void-850 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-white/5 transition-colors active:scale-95"
            title="Delete Component"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {isMobileDrawer && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg bg-void-850 text-slate-400 hover:text-white border border-white/10 active:scale-95"
              aria-label="Close inspector"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-5 flex-1 overflow-y-auto">
        {/* Real-time Branch Telemetry */}
        {componentData.type === 'waypoint' ? (
          <div className="bg-void-950 rounded-xl p-3 border border-white/5 space-y-2 text-xs">
            <div className="text-[10px] text-sky-400 font-sans uppercase tracking-wider font-semibold">
              Wire Anchor Joint
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Drag this anchor anywhere on the canvas to curve, loop, or bend the wire.
            </p>
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-t border-white/5 pt-2">
              <span>Impedance:</span>
              <span className="text-emerald-400">0.00 Ω (Lossless)</span>
            </div>
          </div>
        ) : (
          <div className="bg-void-950 rounded-xl p-3 border border-white/5 space-y-2 font-mono text-xs">
            <div className="text-[10px] text-slate-400 font-sans uppercase tracking-wider font-semibold">
              Live Telemetry
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans text-[11px]">Branch Current:</span>
              <span className="text-electric-400 font-bold">
                {branchCurrent < 1
                  ? `${(branchCurrent * 1000).toFixed(1)} mA`
                  : `${branchCurrent.toFixed(3)} A`}
              </span>
            </div>

            {componentData.type === 'resistor' && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-sans text-[11px]">Voltage Drop:</span>
                <span className="text-slate-200">
                  {(branchCurrent * (componentData.resistance ?? 100)).toFixed(2)} V
                </span>
              </div>
            )}

            {componentData.type === 'bulb' && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-sans text-[11px]">Power Dissipated:</span>
                <span className="text-amber-400 font-bold">
                  {(branchCurrent * branchCurrent * (componentData.resistance ?? 20)).toFixed(2)} W
                </span>
              </div>
            )}
          </div>
        )}

        {/* Battery Controls */}
        {componentData.type === 'battery' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300">Battery Potential</label>
              <span className="text-xs font-mono font-bold text-electric-400">
                {componentData.voltage ?? 9} V
              </span>
            </div>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-6 cursor-pointer"
              value={[componentData.voltage ?? 9]}
              min={1}
              max={48}
              step={0.5}
              onValueChange={([val]) => updateComponentData(selectedNode.id, { voltage: val })}
            >
              <Slider.Track className="bg-void-950 relative grow rounded-full h-2 border border-white/10">
                <Slider.Range className="absolute bg-electric-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-5 h-5 bg-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-electric-500 transition-transform active:scale-125" />
            </Slider.Root>
          </div>
        )}

        {/* Resistor Controls */}
        {componentData.type === 'resistor' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300">Resistance Value</label>
              <span className="text-xs font-mono font-bold text-amber-400">
                {componentData.resistance ?? 100} Ω
              </span>
            </div>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-6 cursor-pointer"
              value={[componentData.resistance ?? 100]}
              min={1}
              max={1000}
              step={1}
              onValueChange={([val]) => updateComponentData(selectedNode.id, { resistance: val })}
            >
              <Slider.Track className="bg-void-950 relative grow rounded-full h-2 border border-white/10">
                <Slider.Range className="absolute bg-amber-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-5 h-5 bg-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 transition-transform active:scale-125" />
            </Slider.Root>
          </div>
        )}

        {/* Light Bulb Controls */}
        {componentData.type === 'bulb' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300">Filament Resistance</label>
              <span className="text-xs font-mono font-bold text-yellow-300">
                {componentData.resistance ?? 20} Ω
              </span>
            </div>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-6 cursor-pointer"
              value={[componentData.resistance ?? 20]}
              min={5}
              max={100}
              step={1}
              onValueChange={([val]) => updateComponentData(selectedNode.id, { resistance: val })}
            >
              <Slider.Track className="bg-void-950 relative grow rounded-full h-2 border border-white/10">
                <Slider.Range className="absolute bg-yellow-400 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-5 h-5 bg-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-transform active:scale-125" />
            </Slider.Root>
          </div>
        )}

        {/* Switch Controls */}
        {componentData.type === 'switch' && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Contact Switch State</label>
            <button
              onClick={() => toggleSwitch(selectedNode.id)}
              className={`w-full py-2.5 rounded-xl font-medium text-xs transition-all active:scale-95 border ${
                componentData.isOpen
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              {componentData.isOpen ? 'Switch is OPEN (Click to Close)' : 'Switch is CLOSED (Click to Open)'}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
