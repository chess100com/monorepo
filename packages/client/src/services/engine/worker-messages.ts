export type WorkerInboundMessage =
  | { type: 'init' }
  | { type: 'cmd'; cmd: string }
  | { type: 'writeFile'; path: string; content: string };

export type WorkerOutboundMessage =
  | { type: 'ready' }
  | { type: 'line'; line: string }
  | { type: 'error'; message: string };
