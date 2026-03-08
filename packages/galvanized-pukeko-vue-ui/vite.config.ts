import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'unplugin-dts/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'GalvanizedPukekoVue',
      fileName: (format) => `vue-ui.${format}.js`,
    },
    rollupOptions: {
      external: ['vue', 'chart.js', '@ag-ui/client'],
      output: {
        globals: {
          vue: 'Vue',
          'chart.js': 'Chart',
          '@ag-ui/client': 'AgUiClient'
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
