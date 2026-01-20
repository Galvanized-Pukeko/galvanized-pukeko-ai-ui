import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    {
      name: 'print-kitchensink',
      configureServer(server) {
        if (server.config.server.open) {
          console.log(`Kitchen sink: http://localhost:${server.config.server.port}${server.config.server.open}`);
        }
      }
    }
  ],
  build: {
    outDir: fileURLToPath(new URL('dist/client', import.meta.url)),
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@galvanized-pukeko-ai-ui/web-lib/style.css': fileURLToPath(new URL('../galvanized-pukeko-web-lib/src/assets/global.css', import.meta.url)),
      '@galvanized-pukeko-ai-ui/web-lib': fileURLToPath(new URL('../galvanized-pukeko-web-lib/src', import.meta.url))
    },
    preserveSymlinks: true
  },
  server: {
    port: 5555
  }
});
