import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: {
// loader: { '.js': 'jsx' }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});