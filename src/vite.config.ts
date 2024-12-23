import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        format: 'esm',
      },
    },
  },
  optimizeDeps: {
    include: ['fluent-ffmpeg'],
  },
});

