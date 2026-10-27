import React from 'react';
import {
  Battery,
  BatteryCharging,
  Activity,
  Lightbulb,
  ToggleLeft,
  Minimize2,
  Gauge,
  Zap,
  Info,
  X,
} from 'lucide-react';
import { ComponentType } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';

interface PaletteItem {
  type: ComponentType;
  label: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'battery',
    label: '1.5V AA Battery',
    category: 'Sources',
    description: 'Single 1.5V AA cell. Drag onto Holder or wire directly',
    icon: <Battery className="w-4 h-4 text-electric-400" />,
    badge: '1.5V',
  },
  {
    type: 'battery-holder',
    label: 'Dual AA Holder',
    category: 'Sources',
    description: 'Wadah 2x baterai AA seri (1.5V / 3.0V) dengan pegas',
    icon: <BatteryCharging className="w-4 h-4 text-emerald-400" />,
    badge: 'Holder',
  },
  {
    type: 'resistor',
    label: 'Resistor',
    category: 'Passive Loads',
    description: 'Limits current according to Ohm’s Law (100Ω)',
    icon: <Activity className="w-4 h-4 text-amber-400" />,
  },
  {
    type: 'bulb',
    label: 'Incandescent Lamp',
    category: 'Passive Loads',
    description: 'Lights up dynamically based on dissipated power (I²R)',
    icon: <Lightbulb className="w-4 h-4 text-yellow-300" />,
    badge: 'Glows',
  },
  {
    type: 'switch',
    label: 'SPST Switch',
    category: 'Controls',
    description: 'Toggleable contact blade to open/close circuits',
    icon: <ToggleLeft className="w-4 h-4 text-emerald-400" />,
  },
  {
    type: 'ground',
    label: 'Earth Ground (0V)',
    category: 'Reference',
    description: 'Defines 0V potential reference point',
    icon: <Minimize2 className="w-4 h-4 text-emerald-400" />,
  },
  {
    type: 'voltmeter',
    label: 'Digital Voltmeter',
    category: 'Meters',
    description: 'High impedance (10MΩ) voltage probe',
    icon: <Gauge className="w-4 h-4 text-electric-400" />,
  },
  {
    type: 'ammeter',
    label: 'Digital Ammeter',
    category: 'Meters',
    description: 'In-line series current meter (1mΩ)',
    icon: <Zap className="w-4 h-4 text-neon-400" />,
  },
];

interface SidebarPaletteProps {
  isMobileDrawer?: boolean;
  onCloseMobile?: () => void;
}

export const SidebarPalette: React.FC<SidebarPaletteProps> = ({
  isMobileDrawer = false,
  onCloseMobile,
}) => {
  const addComponent = useCircuitStore((state) => state.addComponent);

  const onDragStart = (event: React.DragEvent, nodeType: ComponentType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleItemClick = (type: ComponentType) => {
    // Spawn on canvas with slight jitter so multiple taps don't overlap
    const offsetX = 200 + Math.floor(Math.random() * 120);
    const offsetY = 120 + Math.floor(Math.random() * 120);
    addComponent(type, { x: offsetX, y: offsetY });
    if (isMobileDrawer && onCloseMobile) {
      onCloseMobile();
    }
  };

  if (isMobileDrawer) {
    return (
      <div className="flex flex-col max-h-[70dvh] bg-void-900 border-t border-white/15 rounded-t-2xl shadow-2xl select-none overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Add Circuit Component
            </h2>
            <p className="text-[11px] text-slate-400">
              Tap any part below to place it onto the canvas
            </p>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg bg-void-850 text-slate-400 hover:text-white border border-white/10 active:scale-95"
              aria-label="Close palette"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 xs:grid-cols-2 gap-2">
          {PALETTE_ITEMS.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => handleItemClick(item.type)}
              className="text-left group flex items-start gap-2.5 p-2.5 rounded-xl bg-void-950/80 border border-white/10 hover:border-electric-500/40 active:bg-void-800 transition-all duration-150 active:scale-95 shadow-sm"
            >
              <div className="p-2 rounded-lg bg-void-900 border border-white/10 group-hover:border-electric-500/30 shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-slate-100 truncate">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-electric-500/10 text-electric-400 border border-electric-500/20 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
                  {item.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <aside className="hidden md:flex w-64 bg-void-900 border-r border-white/10 flex-col h-full shrink-0 select-none">
      <div className="p-3.5 border-b border-white/10">
        <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
          Component Palette
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Drag or click to add to canvas
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {PALETTE_ITEMS.map((item) => (
          <div
            key={item.type}
            onDragStart={(e) => onDragStart(e, item.type)}
            onClick={() => handleItemClick(item.type)}
            draggable
            className="group flex items-start gap-2.5 p-2.5 rounded-xl bg-void-950/70 border border-white/5 hover:border-electric-500/40 hover:bg-void-850 cursor-grab active:cursor-grabbing transition-all duration-150 active:scale-95 shadow-sm"
          >
            <div className="p-2 rounded-lg bg-void-900 border border-white/10 group-hover:border-electric-500/30 group-hover:bg-electric-500/10 transition-colors">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 group-hover:text-electric-400 transition-colors">
                  {item.label}
                </span>
                {item.badge && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-electric-500/10 text-electric-400 border border-electric-500/20">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick instructions footer */}
      <div className="p-3 border-t border-white/10 bg-void-950/50 space-y-1.5">
        <div className="flex items-start gap-2 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-electric-400 shrink-0 mt-0.5" />
          <span>Connect pins by dragging wires.</span>
        </div>
        <div className="text-[10px] text-sky-400/90 pl-5 leading-tight">
          💡 Double-click any wire to add an <b>Anchor Bend</b>. Drag it to bend or curl the cable!
        </div>
      </div>
    </aside>
  );
};
