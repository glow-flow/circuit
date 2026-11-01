import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
