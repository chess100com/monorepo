import {
  Game as RulesGame,
  GameStatus,
  Color,
} from '@chess100com/rules';
import type {
  CoordinateInterface,
  ExtraMoveData,
  MoveMetadata,
} from '@chess100com/rules';
import type { Game as GameEntity } from './entity/Game.js';
import type { ClockSnapshot } from './clock.js';
import { redisClient } from './redis-client.js';

export type PlayerColor = 'white' | 'black';

export interface GameStateSnapshot {
  gameId: string;
  startFen: string;
  currentFen: string;
  moves: MoveMetadata[];
  status: GameStatus;
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

export const colorToString = (c: Color): PlayerColor =>
  c === Color.White ? 'white' : 'black';

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidCoord = (v: unknown): v is CoordinateInterface => {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.x === 'number' && typeof o.y === 'number'
    && o.x >= 1 && o.x <= 10 && o.y >= 1 && o.y <= 10;
};

export interface ParsedMovePayload {
  gameId: string;
  from: CoordinateInterface;
  to: CoordinateInterface;
  extra?: ExtraMoveData;
}

export const parseMovePayload = (raw: unknown): ParsedMovePayload | null => {
  if (typeof raw !== 'object' || raw === null) return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.gameId !== 'string' || !UUID_RE.test(p.gameId)) return null;
  if (!isValidCoord(p.from) || !isValidCoord(p.to)) return null;

  const parsed: ParsedMovePayload = {
    gameId: p.gameId,
    from: { x: p.from.x, y: p.from.y },
    to: { x: p.to.x, y: p.to.y },
  };

  if (p.extra !== undefined) {
    if (typeof p.extra !== 'object' || p.extra === null) return null;
    const e = p.extra as Record<string, unknown>;
    const extra: ExtraMoveData = {};
    if (e.pawnTransform !== undefined) {
      if (typeof e.pawnTransform !== 'number') return null;
      extra.pawnTransform = e.pawnTransform;
    }
    if (e.princessTransform !== undefined) {
      if (typeof e.princessTransform !== 'boolean') return null;
      extra.princessTransform = e.princessTransform;
    }
    parsed.extra = extra;
  }

  return parsed;
};

export const parseGameIdPayload = (raw: unknown): string | null => {
  if (typeof raw !== 'object' || raw === null) return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.gameId !== 'string' || !UUID_RE.test(p.gameId)) return null;
  return p.gameId;
};

/**
 * Reconstruct the in-memory rules.Game by replaying every persisted move on
 * top of the start position. The rules engine depends on full move history
 * for threefold-repetition detection, so we always replay from scratch.
 */
export const rebuildRulesGame = (row: GameEntity): RulesGame => {
  const game = RulesGame.fromFen(row.startFen);
  for (const m of row.moves) {
    game.move(m.from, m.to, m.extra);
  }
  return game;
};

export const buildGameState = (
  row: GameEntity,
  rulesGame: RulesGame,
  drawOffer: { from: PlayerColor } | null,
  clock: ClockSnapshot | null,
): GameStateSnapshot => ({
  gameId: row.id,
  startFen: row.startFen,
  currentFen: rulesGame.getFen(),
  moves: rulesGame.moves,
  // row.status / row.result are the source of truth: they already reflect
  // resignation / agreement / moves-based endings after the handler saves.
  status: row.status,
  result: row.result,
  turn: colorToString(rulesGame.position.getMovingColor()),
  check: rulesGame.position.isCheck(),
  drawOffer,
  clock,
  initialTimeMs: row.initialTimeMs,
  incrementMs: row.incrementMs,
  whiteRatingBefore: row.whiteRatingBefore,
  blackRatingBefore: row.blackRatingBefore,
  whiteRatingAfter: row.whiteRatingAfter,
  blackRatingAfter: row.blackRatingAfter,
});

/**
 * Pending-draw offers live in Redis as JSON documents keyed by gameId. A
 * single offer at a time per game; a new offer from the opposite side
 * replaces any prior one. TTL keeps stale offers from piling up when a game
 * row is deleted out-of-band.
 */
const DRAW_TTL_SEC = 60 * 60 * 24;
const drawKey = (gameId: string): string => `draw:${gameId}`;

export const getDrawOffer = async (
  gameId: string,
): Promise<{ from: PlayerColor } | null> => {
  const raw = await redisClient.call('JSON.GET', drawKey(gameId)) as string | null;
  if (!raw) return null;
  const parsed = JSON.parse(raw) as { from?: unknown };
  if (parsed.from !== 'white' && parsed.from !== 'black') return null;
  return { from: parsed.from };
};

export const setDrawOffer = async (
  gameId: string,
  from: PlayerColor,
): Promise<void> => {
  const key = drawKey(gameId);
  await redisClient.call('JSON.SET', key, '$', JSON.stringify({ from }));
  await redisClient.expire(key, DRAW_TTL_SEC);
};

export const deleteDrawOffer = async (gameId: string): Promise<void> => {
  await redisClient.del(drawKey(gameId));
};

export const isGameOngoing = (status: GameStatus): boolean =>
  status === GameStatus.Ongoing;
