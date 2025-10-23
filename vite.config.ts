import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    allowedHosts: ['hackathon48.ru', 'localhost', '127.0.0.1'],
    host: true,
    hmr: {
      clientPort: Number(process.env.HMR_CLIENT_PORT || 80),
    },
    proxy: {
      // Proxy API requests to local backend
      '/api': {
        target: process.env.VITE_API_HTTP_BASE || 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        ws: true,
      },
    },
  },
})
