import { makeAutoObservable, runInAction } from 'mobx';
import type { Socket } from 'socket.io-client';
import { GameType } from '@chess100com/rules';
import { getSocket } from '../socket';
import { apiFetch } from '../api';

export interface MatchedGame {
  gameId: string;
  color: 'white' | 'black';
  type: GameType;
}

export type QueueSizes = Partial<Record<GameType, number>>;

export interface LeaderboardEntry {
  id: number;
  username: string;
  rating: number;
}

export type LeaderboardByType = Partial<Record<GameType, LeaderboardEntry[]>>;

export interface OngoingGameSummary {
  id: string;
  type: GameType;
  myColor: 'white' | 'black';
  opponent: { id: number; username: string; rating: number } | null;
}

export const MAX_ONGOING_GAMES = 3;

export class LobbyStore {
  queueSizes: QueueSizes = {};
  selectedType: GameType = GameType.Heirs;
  inQueue = false;
  matchedGame: MatchedGame | null = null;
  leaderboard: LeaderboardByType = {};
  ongoingGames: OngoingGameSummary[] = [];
  queueError: string | null = null;

  private socket: Socket | null = null;
  private listening = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  subscribe(): void {
    if (this.listening) return;
    this.socket = getSocket();
    this.socket.on('lobby:state', this.onLobbyState);
    this.socket.on('queue:joined', this.onQueueJoined);
    this.socket.on('queue:left', this.onQueueLeft);
    this.socket.on('queue:error', this.onQueueError);
    this.socket.on('game:start', this.onGameStart);
    this.socket.emit('lobby:subscribe');
    this.listening = true;
    this.refreshLeaderboard();
    this.refreshOngoingGames();
  }

  async refreshOngoingGames(): Promise<void> {
    try {
      const res = await apiFetch<{ games: OngoingGameSummary[] }>('/games/mine/ongoing');
      runInAction(() => { this.ongoingGames = res.games; });
    } catch {
      // non-fatal; the lobby can still render without the ongoing list
    }
  }

  async refreshLeaderboard(): Promise<void> {
    try {
      const res = await apiFetch<{ top: LeaderboardByType }>('/leaderboard');
      runInAction(() => { this.leaderboard = res.top; });
    } catch {
      // non-fatal; lobby still works without the leaderboard
    }
  }

  unsubscribe(): void {
    if (!this.listening || !this.socket) return;
    this.socket.off('lobby:state', this.onLobbyState);
    this.socket.off('queue:joined', this.onQueueJoined);
    this.socket.off('queue:left', this.onQueueLeft);
    this.socket.off('queue:error', this.onQueueError);
    this.socket.off('game:start', this.onGameStart);
    this.socket.emit('lobby:unsubscribe');
    this.listening = false;
  }

  selectType(type: GameType): void {
    this.selectedType = type;
  }

  joinQueue(): void {
    this.queueError = null;
    this.socket?.emit('queue:join', { type: this.selectedType });
  }

  leaveQueue(): void {
    this.socket?.emit('queue:leave');
  }

  clearMatchedGame(): void {
    this.matchedGame = null;
  }

  get selectedQueueSize(): number {
    return this.queueSizes[this.selectedType] ?? 0;
  }

  get canJoinQueue(): boolean {
    return this.ongoingGames.length < MAX_ONGOING_GAMES;
  }

  reset(): void {
    this.unsubscribe();
    this.queueSizes = {};
    this.inQueue = false;
    this.matchedGame = null;
    this.leaderboard = {};
    this.ongoingGames = [];
    this.queueError = null;
    this.socket = null;
  }

  private onLobbyState(payload: { queueSizes?: QueueSizes; error?: string }): void {
    if (payload.queueSizes) {
      runInAction(() => { this.queueSizes = payload.queueSizes ?? {}; });
    }
  }

  private onQueueJoined(payload: { inQueue: boolean }): void {
    runInAction(() => { this.inQueue = payload.inQueue; });
  }

  private onQueueLeft(payload: { inQueue: boolean }): void {
    runInAction(() => { this.inQueue = payload.inQueue; });
  }

  private onQueueError(payload: { error?: string }): void {
    runInAction(() => { this.queueError = payload.error ?? 'Unknown error'; });
  }

  private onGameStart(payload: MatchedGame): void {
    runInAction(() => {
      this.inQueue = false;
      this.matchedGame = payload;
    });
  }
}
