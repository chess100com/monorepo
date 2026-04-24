/// <reference lib="webworker" />
// oxlint-disable unicorn/require-post-message-target-origin
// The lint rule targets window.postMessage (cross-origin); Worker.postMessage's
// second arg is a transfer list, not a targetOrigin, so the rule mis-applies here.

import Stockfish from 'fairy-stockfish-nnue.wasm/stockfish.js';
import wasmUrl from 'fairy-stockfish-nnue.wasm/stockfish.wasm?url';
import pthreadWorkerUrl from 'fairy-stockfish-nnue.wasm/stockfish.worker.js?url';
// Emscripten reads `mainScriptUrlOrBlob || _scriptDir` to tell pthread workers
// which script to `importScripts()`. `_scriptDir` is only populated in classic
// scripts (document.currentScript) or Node (__filename); in an ESM worker it
// stays undefined, so pthread workers get `urlOrBlob === undefined` and crash
// at `URL.createObjectURL`. We hand them the bundled stockfish.js asset URL.
import stockfishJsUrl from 'fairy-stockfish-nnue.wasm/stockfish.js?url';

import type { WorkerInboundMessage, WorkerOutboundMessage } from './worker-messages.js';

declare const self: DedicatedWorkerGlobalScope;

type StockfishEngine = Awaited<ReturnType<typeof Stockfish>>;

let engine: StockfishEngine | null = null;
const queuedCommands: string[] = [];
const queuedFiles: { path: string; content: string }[] = [];

function post(msg: WorkerOutboundMessage): void {
  self.postMessage(msg);
}

async function boot(): Promise<void> {
  const started = await Stockfish({
    mainScriptUrlOrBlob: stockfishJsUrl,
    locateFile: (file) => {
      if (file.endsWith('.wasm')) return wasmUrl;
      // Emscripten's pthread runtime requests this when SharedArrayBuffer is available.
      if (file.endsWith('.worker.js')) return pthreadWorkerUrl;
      return file;
    },
  });
  if (started.addMessageListener) {
    started.addMessageListener((line) => post({ type: 'line', line: String(line) }));
  } else {
    const original = started.print;
    started.print = (line: string) => {
      post({ type: 'line', line: String(line) });
      if (original) original(line);
    };
  }
  engine = started;
  for (const f of queuedFiles) engine.FS.writeFile(f.path, f.content);
  queuedFiles.length = 0;
  for (const cmd of queuedCommands) engine.postMessage(cmd);
  queuedCommands.length = 0;
  post({ type: 'ready' });
}

self.addEventListener('message', (event: MessageEvent<WorkerInboundMessage>) => {
  const msg = event.data;
  switch (msg.type) {
    case 'init':
      boot().catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        post({ type: 'error', message });
      });
      break;
    case 'cmd':
      if (engine) engine.postMessage(msg.cmd);
      else queuedCommands.push(msg.cmd);
      break;
    case 'writeFile':
      if (engine) engine.FS.writeFile(msg.path, msg.content);
      else queuedFiles.push({ path: msg.path, content: msg.content });
      break;
    default:
      msg satisfies never;
  }
});
