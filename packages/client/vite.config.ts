import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND = process.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

// Required for SharedArrayBuffer (multi-threaded WASM in the in-browser chess
// engine). Mirrored in packages/client/nginx.conf for production.
const CROSS_ORIGIN_ISOLATION_HEADERS = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const PREVIEW_SOURCE = resolve(__dirname, 'src/assets/preview.png');

// The og:image / twitter:image links in index.html point at /preview.png with
// a stable name (no content hash) so social-media crawlers that don't run JS
// can still resolve it. This plugin emits it at build time and serves it from
// the source file in dev.
function previewImagePlugin(): Plugin {
  return {
    name: 'preview-image',
    buildStart() {
      this.emitFile({
        type: 'asset',
        fileName: 'preview.png',
        source: readFileSync(PREVIEW_SOURCE),
      });
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/preview.png') {
          res.setHeader('Content-Type', 'image/png');
          res.end(readFileSync(PREVIEW_SOURCE));
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), previewImagePlugin()],
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
