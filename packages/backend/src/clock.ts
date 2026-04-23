import { redisClient } from './redis-client.js';
import type { PlayerColor } from './game-runtime.js';

interface ClockDoc {
  whiteMs: number;
  blackMs: number;
  // epoch ms when the side currently on move started thinking; null while
  // the clock is not running yet (pre-first-move state).
  turnStartAt: number | null;
  // false until white plays their first move. Before then both clocks are
  // frozen — white's first move is free (no deduction, no increment).
  started: boolean;
}

export interface ClockSnapshot {
  whiteMs: number;
  blackMs: number;
  turn: PlayerColor;
  started: boolean;
}

const CLOCK_TTL_SEC = 60 * 60 * 24 * 7;
const clockKey = (gameId: string): string => `clock:${gameId}`;

async function readDoc(gameId: string): Promise<ClockDoc | null> {
  const raw = await redisClient.call('JSON.GET', clockKey(gameId)) as string | null;
  if (!raw) return null;
  return JSON.parse(raw) as ClockDoc;
}

async function writeDoc(gameId: string, doc: ClockDoc): Promise<void> {
  const key = clockKey(gameId);
  await redisClient.call('JSON.SET', key, '$', JSON.stringify(doc));
  await redisClient.expire(key, CLOCK_TTL_SEC);
}

export async function initClock(gameId: string, initialMs: number): Promise<void> {
  await writeDoc(gameId, {
    whiteMs: initialMs,
    blackMs: initialMs,
    turnStartAt: null,
    started: false,
  });
}

export async function deleteClock(gameId: string): Promise<void> {
  await redisClient.del(clockKey(gameId));
}

const snapshotFromDoc = (doc: ClockDoc, turn: PlayerColor, now: number): ClockSnapshot => {
  if (!doc.started || doc.turnStartAt === null) {
    return { whiteMs: doc.whiteMs, blackMs: doc.blackMs, turn, started: false };
  }
  const elapsed = Math.max(0, now - doc.turnStartAt);
  return {
    whiteMs: turn === 'white' ? Math.max(0, doc.whiteMs - elapsed) : doc.whiteMs,
    blackMs: turn === 'black' ? Math.max(0, doc.blackMs - elapsed) : doc.blackMs,
    turn,
    started: true,
  };
};

/**
 * Live-computed snapshot for broadcast: the side whose turn it is has their
 * clock decremented by (now - turnStartAt). Returns null if the clock has
 * never been initialized — caller should treat that as "no clock state".
 */
export async function getClockSnapshot(
  gameId: string,
  turn: PlayerColor,
  now: number = Date.now(),
): Promise<ClockSnapshot | null> {
  const doc = await readDoc(gameId);
  if (!doc) return null;
  return snapshotFromDoc(doc, turn, now);
}

/**
 * Returns `turn` if the side currently on the move has flagged (clock has
 * started AND their remaining time is <= 0 at `now`). Otherwise null.
 * Pure read, no mutation.
 */
export async function whoFlagged(
  gameId: string,
  turn: PlayerColor,
  now: number = Date.now(),
): Promise<PlayerColor | null> {
  const doc = await readDoc(gameId);
  if (!doc || !doc.started || doc.turnStartAt === null) return null;
  const remaining = turn === 'white' ? doc.whiteMs : doc.blackMs;
  return now - doc.turnStartAt >= remaining ? turn : null;
}

/**
 * Apply the time accounting for a legal move by `mover`. Caller is expected
 * to have already verified that `mover` has not flagged (via `whoFlagged`)
 * and that the move itself is legal. Returns a snapshot reflecting the new
 * clock state; the opponent is now on the move.
 *
 * Pre-first-move (white's first move): clock transitions to started, nothing
 * is deducted from white, no increment is awarded, and black's clock starts
 * ticking from `now`. This matches the "free first move" rule.
 */
export async function advanceClock(
  gameId: string,
  mover: PlayerColor,
  incrementMs: number,
  now: number = Date.now(),
): Promise<ClockSnapshot> {
  const doc = await readDoc(gameId);
  if (!doc) throw new Error(`clock state missing for game ${gameId}`);

  if (!doc.started) {
    if (mover !== 'white') {
      throw new Error(`pre-first-move clock advanced by ${mover} (expected white)`);
    }
    const next: ClockDoc = {
      whiteMs: doc.whiteMs,
      blackMs: doc.blackMs,
      started: true,
      turnStartAt: now,
    };
    await writeDoc(gameId, next);
    return { whiteMs: next.whiteMs, blackMs: next.blackMs, turn: 'black', started: true };
  }

  if (doc.turnStartAt === null) {
    throw new Error(`started clock for ${gameId} has null turnStartAt`);
  }
  const elapsed = Math.max(0, now - doc.turnStartAt);
  const moverBefore = mover === 'white' ? doc.whiteMs : doc.blackMs;
  const moverAfter = Math.max(0, moverBefore - elapsed) + incrementMs;
  const next: ClockDoc = {
    whiteMs: mover === 'white' ? moverAfter : doc.whiteMs,
    blackMs: mover === 'black' ? moverAfter : doc.blackMs,
    started: true,
    turnStartAt: now,
  };
  await writeDoc(gameId, next);
  const nextTurn: PlayerColor = mover === 'white' ? 'black' : 'white';
  return { whiteMs: next.whiteMs, blackMs: next.blackMs, turn: nextTurn, started: true };
}

// ---- In-memory flag-fall scheduler ------------------------------------
//
// Per-game setTimeout handles fire when the side on the move is projected
// to run out of time. These are derived state: Redis is authoritative, and
// on server restart callers must re-schedule timers for every ongoing game
// via `scheduleFlagTimer`.

const flagTimers = new Map<string, NodeJS.Timeout>();

export function cancelFlagTimer(gameId: string): void {
  const handle = flagTimers.get(gameId);
  if (handle) {
    clearTimeout(handle);
    flagTimers.delete(gameId);
  }
}

export type FlagFallHandler = (gameId: string, flagged: PlayerColor) => Promise<void>;

/**
 * Cancels any prior timer for `gameId`, then — if the clock has started —
 * schedules a setTimeout that fires when `turn`'s remaining time is expected
 * to reach zero. The handler is called once; it is responsible for ending
 * the game and broadcasting. No-op if the clock is not started yet or the
 * clock doc is missing.
 */
export async function scheduleFlagTimer(
  gameId: string,
  turn: PlayerColor,
  handler: FlagFallHandler,
): Promise<void> {
  cancelFlagTimer(gameId);
  const doc = await readDoc(gameId);
  if (!doc || !doc.started || doc.turnStartAt === null) return;
  const remaining = turn === 'white' ? doc.whiteMs : doc.blackMs;
  const elapsed = Date.now() - doc.turnStartAt;
  const delay = Math.max(0, remaining - elapsed);
  const timer = setTimeout(() => {
    flagTimers.delete(gameId);
    // oxlint-disable-next-line no-console
    handler(gameId, turn).catch(err => console.error('flag-fall handler failed', gameId, err));
  }, delay);
  flagTimers.set(gameId, timer);
}
