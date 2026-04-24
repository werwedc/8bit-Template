import { defineConfig } from 'vite';

export default defineConfig({
  // Use relative base so the build is portable (GitHub Pages subdirectory, etc.)
  base: './',

  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
  },

  server: {
    open: true,
    port: 3000,
  },
});
