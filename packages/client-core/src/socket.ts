import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { clientCoreConfig } from './config.js';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = clientCoreConfig.socketUrl
      ? io(clientCoreConfig.socketUrl, clientCoreConfig.socketOptions)
      : io(clientCoreConfig.socketOptions);
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
