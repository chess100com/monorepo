import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND = process.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

// Required for SharedArrayBuffer (multi-threaded WASM in the in-browser chess
// engine). Mirrored in packages/client/nginx.conf for production.
const CROSS_ORIGIN_ISOLATION_HEADERS = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

export default defineConfig({
  plugins: [react()],
  build: {
    // Emscripten pthread worker (stockfish.worker.js) is ~3 KB — under the
    // default 4 KB inline threshold. It must be loaded via a real HTTP URL
    // (importScripts), so never inline it as a data URL.
    assetsInlineLimit: (filePath) => filePath.endsWith('stockfish.worker.js') ? false : undefined,
  },
  server: {
    port: 5173,
    headers: CROSS_ORIGIN_ISOLATION_HEADERS,
    proxy: {
      '/api': {
        target: BACKEND,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/socket.io': {
        target: BACKEND,
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    headers: CROSS_ORIGIN_ISOLATION_HEADERS,
  },
});
