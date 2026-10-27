import React, { useEffect } from 'react';
import { Header } from './components/ui/Header';
import { SidebarPalette } from './components/ui/SidebarPalette';
import { CircuitCanvas } from './components/canvas/CircuitCanvas';
import { Inspector } from './components/ui/Inspector';
import { useCircuitStore } from './store/useCircuitStore';

export const App: React.FC = () => {
  const loadPreset = useCircuitStore((state) => state.loadPreset);
  const nodes = useCircuitStore((state) => state.nodes);

  // Initialize with the Simple Lamp & Switch circuit preset on first mount
  useEffect(() => {
    if (nodes.length === 0) {
      loadPreset('simple-lamp');
    }
  }, [loadPreset, nodes.length]);

  return (
    <div className="flex flex-col h-screen min-h-[100dvh] w-screen bg-void-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Utility Header */}
      <Header />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Left Component Palette */}
        <SidebarPalette />

        {/* Central React Flow Canvas */}
        <main className="flex-1 relative h-full">
          <CircuitCanvas />
        </main>

        {/* Right Inspector & Telemetry */}
        <Inspector />
      </div>
    </div>
  );
};

export default App;
