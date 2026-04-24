import type { UciEngine } from './UciEngine.js';
import { parseUciMove, type ParsedUciMove } from './coords.js';

const DEFAULT_UCI_TIMEOUT_MS = 10_000;
const DEFAULT_MOVE_TIMEOUT_MS = 20_000;

export function waitForLine(
  engine: UciEngine,
  predicate: (line: string) => boolean,
  timeoutMs: number = DEFAULT_UCI_TIMEOUT_MS,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const state: {
      timer: ReturnType<typeof setTimeout> | null;
      unsub: (() => void) | null;
    } = { timer: null, unsub: null };
    const cleanup = (): void => {
      if (state.timer !== null) clearTimeout(state.timer);
      state.unsub?.();
    };
    state.unsub = engine.onLine((line) => {
      if (!predicate(line)) return;
      cleanup();
      resolve(line);
    });
    state.timer = setTimeout(() => {
      cleanup();
      reject(new Error(`UCI wait timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

export async function initUci(engine: UciEngine): Promise<void> {
  engine.send('uci');
  await waitForLine(engine, (l) => l === 'uciok');
}

export async function waitReady(engine: UciEngine): Promise<void> {
  engine.send('isready');
  await waitForLine(engine, (l) => l === 'readyok');
}

export async function loadChess100Variant(engine: UciEngine, ini: string): Promise<void> {
  engine.writeFile('/chess100.ini', ini);
  engine.send('setoption name VariantPath value /chess100.ini');
  engine.send('setoption name UCI_Variant value chess100');
  await waitReady(engine);
}

// UCI Skill Level is -20..20 on Fairy-Stockfish. We expose a 4-step UX ladder,
// mapped to sensible engine values. Expert keeps strength at max (Elo-limited
// variants are ineffective without a variant-aware NNUE, which we don't ship).
export type SkillStep = 'easy' | 'medium' | 'hard' | 'expert';

export const SKILL_STEP_TO_UCI: Record<SkillStep, number> = {
  easy: -10,
  medium: 0,
  hard: 10,
  expert: 20,
};

export function setSkillLevel(engine: UciEngine, step: SkillStep): void {
  engine.send(`setoption name Skill Level value ${SKILL_STEP_TO_UCI[step]}`);
}

export interface BestMove {
  raw: string;
  move: ParsedUciMove | null;
  isNone: boolean;
}

const NONE_TOKENS = new Set(['(none)', '0000']);

export function parseBestMoveLine(line: string): BestMove {
  // Shape: `bestmove <move> [ponder <move>]` or `bestmove (none)` / `bestmove 0000`.
  const parts = line.split(/\s+/);
  const raw = parts[1] ?? '';
  if (NONE_TOKENS.has(raw)) {
    return { raw, move: null, isNone: true };
  }
  return { raw, move: parseUciMove(raw), isNone: false };
}

export interface AskBestMoveParams {
  fen: string;
  movetimeMs: number;
  timeoutMs?: number;
}

// FEN-driven mode: send the current rules FEN each turn. Chess100's
// Princess-morphism and Prince mechanics live in our authoritative rules,
// and the engine only needs the position as of now — no move history.
export async function askBestMove(engine: UciEngine, params: AskBestMoveParams): Promise<BestMove> {
  engine.send('ucinewgame');
  engine.send(`position fen ${params.fen}`);
  engine.send(`go movetime ${params.movetimeMs}`);
  const line = await waitForLine(
    engine,
    (l) => l.startsWith('bestmove'),
    params.timeoutMs ?? DEFAULT_MOVE_TIMEOUT_MS,
  );
  return parseBestMoveLine(line);
}
