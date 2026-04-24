/// <reference types="vite/client" />

// Emscripten-generated UMD module with no bundled types. We only use
// `Stockfish(opts) -> Promise<EmscriptenModule>` and the FS/postMessage surface.
declare module 'fairy-stockfish-nnue.wasm/stockfish.js' {
  interface StockfishModule {
    postMessage(cmd: string): void;
    addMessageListener?(listener: (line: string) => void): void;
    removeMessageListener?(listener: (line: string) => void): void;
    print?: (line: string) => void;
    FS: {
      writeFile(path: string, data: string | Uint8Array): void;
    };
  }
  interface StockfishOptions {
    wasmBinary?: ArrayBufferView | ArrayBuffer;
    locateFile?: (file: string, prefix: string) => string;
    print?: (line: string) => void;
    // Emscripten pthread option — URL or Blob of the stockfish.js glue that
    // pthread workers will `importScripts()` to load. Required when our ESM
    // worker strips `_scriptDir` / `document.currentScript`.
    mainScriptUrlOrBlob?: string | Blob;
  }
  const Stockfish: (opts?: StockfishOptions) => Promise<StockfishModule>;
  export default Stockfish;
}
