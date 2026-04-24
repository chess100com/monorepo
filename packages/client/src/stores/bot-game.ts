import { makeAutoObservable, runInAction } from 'mobx';
import { Color, Game, GameStatus, StartFen } from '@chess100com/rules';
import type { CoordinateInterface, ExtraMoveData } from '@chess100com/rules';
import type {
  GameStateSnapshot,
  MoveRecord,
  ParsedUciMove,
  PlayerColor,
  SkillStep,
  UciEngine,
} from '@chess100com/client-core';
import { askBestMove, isPromotionTransform, setSkillLevel } from '@chess100com/client-core';

const DEFAULT_MOVETIME_MS = 1000;

export class BotGameStore {
  state: GameStateSnapshot | null = null;
  myColor: PlayerColor | null = null;
  error: string | null = null;
  skillLevel: SkillStep = 'medium';
  engineThinking = false;
  engineLoading = false;

  private game: Game | null = null;
  private engine: UciEngine | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get isMyTurn(): boolean {
    const { state, myColor } = this;
    return !!state && state.status === 'ongoing' && myColor !== null && state.turn === myColor;
  }

  setSkill(level: SkillStep): void {
    this.skillLevel = level;
    if (this.engine) setSkillLevel(this.engine, level);
  }

  async startNew(): Promise<void> {
    runInAction(() => {
      this.engineLoading = true;
      this.error = null;
    });
    try {
      if (!this.engine) {
        const [{ createWasmEngine }, iniModule] = await Promise.all([
          import('../services/engine/wasmEngine.js'),
          import('../assets/chess100.ini?raw'),
        ]);
        this.engine = await createWasmEngine(iniModule.default);
      }
      setSkillLevel(this.engine, this.skillLevel);
      const myColor: PlayerColor = Math.random() < 0.5 ? 'white' : 'black';
      const fresh = Game.create();
      runInAction(() => {
        this.game = fresh;
        this.myColor = myColor;
        this.state = this.buildSnapshot();
      });
      if (myColor === 'black') {
        await this.playBotMove();
      }
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Engine failed to start';
      });
    } finally {
      runInAction(() => { this.engineLoading = false; });
    }
  }

  move(from: CoordinateInterface, to: CoordinateInterface, extra?: ExtraMoveData): void {
    const g = this.game;
    if (!g || !this.isMyTurn) return;
    try {
      g.move(from, to, extra);
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Illegal move';
      });
      return;
    }
    runInAction(() => {
      this.state = this.buildSnapshot();
      this.error = null;
    });
    if (g.status === GameStatus.Ongoing) {
      this.playBotMove().catch(() => {});
    }
  }

  resign(): void {
    const g = this.game;
    if (!g || !this.myColor || g.status !== GameStatus.Ongoing) return;
    g.resign(this.myColor === 'white' ? Color.White : Color.Black);
    runInAction(() => { this.state = this.buildSnapshot(); });
  }

  dispose(): void {
    try {
      this.engine?.quit();
    } finally {
      this.engine = null;
    }
  }

  private async playBotMove(): Promise<void> {
    const g = this.game;
    const engine = this.engine;
    if (!g || !engine) return;
    runInAction(() => { this.engineThinking = true; });
    try {
      const fen = g.position.getFen();
      const best = await askBestMove(engine, { fen, movetimeMs: DEFAULT_MOVETIME_MS });
      let parsed: ParsedUciMove | null = best.isNone ? null : best.move;
      if (parsed) {
        const { from, to } = parsed;
        const available = g.position.availableMoves(from);
        const legal = available.some((c) => c.x === to.x && c.y === to.y);
        if (!legal) parsed = this.pickRandomLegalMove();
      } else {
        parsed = this.pickRandomLegalMove();
      }
      if (!parsed) return;
      const extra: ExtraMoveData = {};
      if (isPromotionTransform(parsed.promotion)) extra.pawnTransform = parsed.promotion;
      g.move(parsed.from, parsed.to, extra);
      runInAction(() => {
        this.state = this.buildSnapshot();
        this.error = null;
      });
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Engine error';
      });
    } finally {
      runInAction(() => { this.engineThinking = false; });
    }
  }

  private pickRandomLegalMove(): ParsedUciMove | null {
    const g = this.game;
    if (!g) return null;
    const moves = g.position.getAvailableMoves();
    if (moves.length === 0) return null;
    const m = moves[Math.floor(Math.random() * moves.length)];
    return { from: m.from, to: m.to };
  }

  private buildSnapshot(): GameStateSnapshot {
    const g = this.game;
    if (!g) throw new Error('buildSnapshot without a game');
    const moves: MoveRecord[] = g.moves.map((m, idx) => ({
      from: m.from,
      to: m.to,
      extra: m.extra,
      color: m.color,
      figure: m.figure,
      number: idx + 1,
      fen: m.fen,
      alias: m.alias,
    }));
    const turnColor: PlayerColor = g.position.getMovingColor() === Color.White ? 'white' : 'black';
    const check = g.status === GameStatus.Ongoing && g.position.isKingUnderAttack(g.position.getMovingColor());
    return {
      gameId: 'bot',
      startFen: g.startPosition ?? StartFen,
      currentFen: g.position.getFen(),
      moves,
      status: g.status,
      result: g.result,
      turn: turnColor,
      check,
      drawOffer: null,
      clock: null,
      initialTimeMs: 0,
      incrementMs: 0,
      whiteRatingBefore: null,
      blackRatingBefore: null,
      whiteRatingAfter: null,
      blackRatingAfter: null,
    };
  }
}
