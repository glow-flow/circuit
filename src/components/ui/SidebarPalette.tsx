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
import { TRANSLATIONS } from '../../i18n/translations';

interface SidebarPaletteProps {
  isMobileDrawer?: boolean;
  onCloseMobile?: () => void;
}

export const SidebarPalette: React.FC<SidebarPaletteProps> = ({
  isMobileDrawer = false,
  onCloseMobile,
}) => {
  const addComponent = useCircuitStore((state) => state.addComponent);
  const language = useCircuitStore((state) => state.language);
  const t = TRANSLATIONS[language].palette;

  const paletteItems: {
    type: ComponentType;
    label: string;
    description: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    {
      type: 'battery',
      label: t.items.battery.label,
      description: t.items.battery.description,
      icon: <Battery className="w-4 h-4 text-electric-400" />,
      badge: t.items.battery.badge,
    },
    {
      type: 'battery9v',
      label: t.items.battery9v.label,
      description: t.items.battery9v.description,
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      badge: t.items.battery9v.badge,
    },
    {
      type: 'battery-holder',
      label: t.items.holder.label,
      description: t.items.holder.description,
      icon: <BatteryCharging className="w-4 h-4 text-emerald-400" />,
      badge: t.items.holder.badge,
    },
    {
      type: 'resistor',
      label: t.items.resistor.label,
      description: t.items.resistor.description,
      icon: <Activity className="w-4 h-4 text-amber-400" />,
    },
    {
      type: 'bulb',
      label: t.items.bulb.label,
      description: t.items.bulb.description,
      icon: <Lightbulb className="w-4 h-4 text-yellow-300" />,
      badge: t.items.bulb.badge,
    },
    {
      type: 'switch',
      label: t.items.switch.label,
      description: t.items.switch.description,
      icon: <ToggleLeft className="w-4 h-4 text-emerald-400" />,
    },
    {
      type: 'ground',
      label: t.items.ground.label,
      description: t.items.ground.description,
      icon: <Minimize2 className="w-4 h-4 text-emerald-400" />,
    },
    {
      type: 'voltmeter',
      label: t.items.voltmeter.label,
      description: t.items.voltmeter.description,
      icon: <Gauge className="w-4 h-4 text-electric-400" />,
    },
    {
      type: 'ammeter',
      label: t.items.ammeter.label,
      description: t.items.ammeter.description,
      icon: <Zap className="w-4 h-4 text-neon-400" />,
    },
  ];

  const onDragStart = (event: React.DragEvent, nodeType: ComponentType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleItemClick = (type: ComponentType) => {
    const offsetX = 200 + Math.floor(Math.random() * 120);
    const offsetY = 120 + Math.floor(Math.random() * 120);
    addComponent(type, { x: offsetX, y: offsetY });
    if (isMobileDrawer && onCloseMobile) {
      onCloseMobile();
    }
  };

  if (isMobileDrawer) {
    return (
      <div className="flex flex-col max-h-[72dvh] bg-void-900 border-t border-white/15 rounded-t-2xl shadow-2xl select-none overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              {t.title}
            </h2>
            <p className="text-[11px] text-slate-400">{t.subtitleMobile}</p>
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
          {paletteItems.map((item) => (
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
          {t.title}
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5">{t.subtitleDesktop}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {paletteItems.map((item) => (
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
          <span>{t.tipConnect}</span>
        </div>
        <div className="text-[10px] text-sky-400/90 pl-5 leading-tight">
          {t.tipWaypoint}
        </div>
      </div>
    </aside>
  );
};
