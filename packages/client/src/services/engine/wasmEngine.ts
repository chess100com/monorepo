// oxlint-disable unicorn/require-post-message-target-origin
// Worker.postMessage's second arg is a transfer list, not a targetOrigin.
import type { UciEngine, UciLineListener, UciUnsubscribe } from '@chess100com/client-core';
import { initUci, loadChess100Variant } from '@chess100com/client-core';

import type { WorkerInboundMessage, WorkerOutboundMessage } from './worker-messages.js';

const WORKER_READY_TIMEOUT_MS = 15_000;

function spawnWorker(): Worker {
  // oxlint-disable-next-line unicorn/relative-url-style -- Vite's worker URL pattern requires `./`
  return new Worker(new URL('./stockfish-worker.ts', import.meta.url), { type: 'module' });
}

function createEngineFromWorker(worker: Worker): UciEngine {
  const listeners = new Set<UciLineListener>();
  worker.addEventListener('message', (event: MessageEvent<WorkerOutboundMessage>) => {
    const msg = event.data;
    if (msg.type === 'line') {
      for (const l of listeners) l(msg.line);
    }
  });
  const post = (msg: WorkerInboundMessage): void => worker.postMessage(msg);
  return {
    send(cmd: string): void {
      post({ type: 'cmd', cmd });
    },
    onLine(listener: UciLineListener): UciUnsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    writeFile(path: string, content: string): void {
      post({ type: 'writeFile', path, content });
    },
    quit(): void {
      try {
        post({ type: 'cmd', cmd: 'quit' });
      } finally {
        worker.terminate();
      }
    },
  };
}

function waitForWorkerReady(worker: Worker): Promise<void> {
  return new Promise((resolve, reject) => {
    const state: { timer: ReturnType<typeof setTimeout> | null } = { timer: null };
    const onMessage = (event: MessageEvent<WorkerOutboundMessage>): void => {
      if (event.data.type !== 'ready' && event.data.type !== 'error') return;
      if (state.timer !== null) clearTimeout(state.timer);
      worker.removeEventListener('message', onMessage);
      if (event.data.type === 'ready') resolve();
      else reject(new Error(event.data.message));
    };
    state.timer = setTimeout(() => {
      worker.removeEventListener('message', onMessage);
      reject(new Error(`Worker boot timed out after ${WORKER_READY_TIMEOUT_MS}ms`));
    }, WORKER_READY_TIMEOUT_MS);
    worker.addEventListener('message', onMessage);
    worker.postMessage({ type: 'init' } satisfies WorkerInboundMessage);
  });
}

// Boots a Fairy-Stockfish Web Worker, loads the chess100 variant, and returns
// a ready-to-use UciEngine. The caller owns the engine; call `quit()` to tear down.
export async function createWasmEngine(ini: string): Promise<UciEngine> {
  const worker = spawnWorker();
  await waitForWorkerReady(worker);
  const engine = createEngineFromWorker(worker);
  await initUci(engine);
  await loadChess100Variant(engine, ini);
  return engine;
}
