import { defineConfig } from 'vite';
import chunkCycleDetector from 'vite-plugin-chunk-cycle-detector';
import path from 'path';

export default defineConfig({
  plugins: [ chunkCycleDetector({
    showCircleImportModuleDetail: true,
  })],
  root: './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 100,
    rollupOptions: {
      output: {
        manualChunks: {
          'chunk-a': ['./src/a.js'],
          'chunk-b': ['./src/b.js']
        }
      }
    }
  },
  resolve: {
    alias: {
      'vite-plugin-chunk-cycle-detector': path.resolve(__dirname, '../dist/index.mjs')
    }
  }
});