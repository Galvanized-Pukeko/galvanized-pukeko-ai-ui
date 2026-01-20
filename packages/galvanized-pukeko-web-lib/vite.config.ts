import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'GalvanizedPukekoWebLib',
      fileName: (format) => `web-lib.${format}.js`,
    },
    rollupOptions: {
      external: ['vue', 'chart.js'],
      output: {
        globals: {
          vue: 'Vue',
          'chart.js': 'Chart'
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
});
