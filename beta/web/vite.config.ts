import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The beta runs on its own port so the current Flask site (8080) is untouched.
export default defineConfig({
  plugins: [react()],
  server: { port: 5180, strictPort: true },
  build: {
    rollupOptions: {
      // ECharts and its renderer in their own chunk, cached separately from app code.
      output: { manualChunks: (id: string) => (/node_modules[\/](echarts|zrender)[\/]/.test(id) ? 'echarts' : undefined) },
    },
  },
});
