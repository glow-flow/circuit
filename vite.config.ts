import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { circuitPwaPrecachePlugin } from './scripts/vitePwaPrecachePlugin.ts';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), circuitPwaPrecachePlugin()],
  server: {
    host: '0.0.0.0',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@reactflow') || id.includes('node_modules/reactflow')) return 'vendor-reactflow';
          if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
          if (id.includes('node_modules/driver.js')) return 'vendor-driver';
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
