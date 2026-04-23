import { makeAutoObservable, runInAction } from 'mobx';
import type { Socket } from 'socket.io-client';
import type { CoordinateInterface, ExtraMoveData } from '@chess100com/rules';
import { getSocket } from '../socket.js';
import { apiFetch } from '../api.js';

export type PlayerColor = 'white' | 'black';

export interface MoveRecord {
  from: CoordinateInterface;
  to: CoordinateInterface;
  extra: ExtraMoveData;
  color: number;
  figure: number;
  number: number;
  fen: string;
  alias: string;
}

export interface ClockSnapshot {
  whiteMs: number;
  blackMs: number;
  turn: PlayerColor;
  started: boolean;
}

export interface GameStateSnapshot {
  gameId: string;
  startFen: string;
  currentFen: string;
  moves: MoveRecord[];
  status: string;
  result: string;
  turn: PlayerColor;
  check: boolean;
  drawOffer: { from: PlayerColor } | null;
  clock: ClockSnapshot | null;
  initialTimeMs: number;
  incrementMs: number;
  whiteRatingBefore: number | null;
  blackRatingBefore: number | null;
  whiteRatingAfter: number | null;
  blackRatingAfter: number | null;
}

export interface GameMetadata {
  id: string;
  white: { id: number; username: string; rating: number } | null;
  black: { id: number; username: string; rating: number } | null;
}

export class GameStore {
  gameId: string | null = null;
  metadata: GameMetadata | null = null;
  state: GameStateSnapshot | null = null;
  // Millisecond timestamp captured the moment we received `state`. Clock UI
  // uses this as the baseline for ticking the active side down locally
  // between server broadcasts.
  stateReceivedAt = 0;
  myColor: PlayerColor | null = null;
  error: string | null = null;
  loading = false;

  private socket: Socket | null = null;
  private listening = false;

  private readonly getMyUsername: () => string | undefined;

  constructor(getMyUsername: () => string | undefined) {
    this.getMyUsername = getMyUsername;
    makeAutoObservable(this, { getMyUsername: false } as never, { autoBind: true });
  }

  async init(gameId: string): Promise<void> {
    this.reset();
    this.gameId = gameId;
    this.loading = true;
    try {
      const metadata = await apiFetch<GameMetadata>(`/games/${gameId}`);
      runInAction(() => {
        this.metadata = metadata;
        const me = this.getMyUsername();
        if (me) {
          if (metadata.white?.username === me) this.myColor = 'white';
          else if (metadata.black?.username === me) this.myColor = 'black';
        }
      });
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Failed to load game';
      });
      return;
    } finally {
      runInAction(() => { this.loading = false; });
    }

    this.socket = getSocket();
    if (!this.listening) {
      this.socket.on('game:state', this.onState);
      this.socket.on('game:error', this.onError);
      this.listening = true;
    }
    this.socket.emit('game:join', { gameId });
  }

  leave(): void {
    if (this.listening && this.socket) {
      this.socket.off('game:state', this.onState);
      this.socket.off('game:error', this.onError);
    }
    this.listening = false;
    this.socket = null;
  }

  reset(): void {
    this.leave();
    this.gameId = null;
    this.metadata = null;
    this.state = null;
    this.stateReceivedAt = 0;
    this.myColor = null;
    this.error = null;
  }

  move(from: CoordinateInterface, to: CoordinateInterface, extra?: ExtraMoveData): void {
    if (!this.gameId) return;
    this.socket?.emit('move', { gameId: this.gameId, from, to, extra });
  }

  resign(): void {
    if (!this.gameId) return;
    this.socket?.emit('resign', { gameId: this.gameId });
  }

  offerDraw(): void {
    if (!this.gameId) return;
    this.socket?.emit('draw:offer', { gameId: this.gameId });
  }

  acceptDraw(): void {
    if (!this.gameId) return;
    this.socket?.emit('draw:accept', { gameId: this.gameId });
  }

  declineDraw(): void {
    if (!this.gameId) return;
    this.socket?.emit('draw:decline', { gameId: this.gameId });
  }

  get isMyTurn(): boolean {
    return this.state?.status === 'ongoing' && this.myColor !== null && this.state.turn === this.myColor;
  }

  get incomingDrawOffer(): boolean {
    return !!this.state?.drawOffer && this.state.drawOffer.from !== this.myColor;
  }

  get hasOutgoingDrawOffer(): boolean {
    return !!this.state?.drawOffer && this.state.drawOffer.from === this.myColor;
  }

  private onState(payload: GameStateSnapshot): void {
    if (payload.gameId !== this.gameId) return;
    const receivedAt = Date.now();
    runInAction(() => {
      this.state = payload;
      this.stateReceivedAt = receivedAt;
      this.error = null;
    });
  }

  private onError(payload: { error: string }): void {
    runInAction(() => { this.error = payload.error; });
  }
}
