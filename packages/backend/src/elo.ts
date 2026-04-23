import { WhiteWinsResult, BlackWinsResult, DrawResult, GameStatus, GameType } from '@chess100com/rules';
import type { EntityManager } from 'typeorm';
import { AppDataSource } from './data-source.js';
import { Game } from './entity/Game.js';
import { UserRating } from './entity/UserRating.js';
import { calcElo, ELO_DEFAULT } from './elo-calc.js';

export interface EloUpdateResult {
  whiteBefore: number;
  blackBefore: number;
  whiteAfter: number;
  blackAfter: number;
}

function whiteScoreFromResult(result: string): number | null {
  if (result === WhiteWinsResult) return 1;
  if (result === BlackWinsResult) return 0;
  if (result === DrawResult) return 0.5;
  return null;
}

/**
 * Returns the user's rating for a given game type, falling back to
 * `ELO_DEFAULT` when no row exists yet. Use this for both snapshot-on-creation
 * and for any read-side concerns (profile, serialization). A missing row is
 * not created here — rows are only written by `applyEloUpdate` at game end.
 */
export async function getUserRating(
  userId: number,
  gameType: GameType,
  tx?: EntityManager,
): Promise<number> {
  const repo = (tx ?? AppDataSource.manager).getRepository(UserRating);
  const row = await repo.findOneBy({ userId, gameType });
  return row?.rating ?? ELO_DEFAULT;
}

/**
 * Bulk variant of `getUserRating` — single query for a batch of users under
 * the same game type. Returns a map keyed by userId; missing users map to
 * `ELO_DEFAULT`.
 */
export async function getUserRatings(
  userIds: number[],
  gameType: GameType,
): Promise<Map<number, number>> {
  const map = new Map<number, number>();
  if (userIds.length === 0) return map;
  const rows = await AppDataSource.getRepository(UserRating)
    .createQueryBuilder('ur')
    .where('ur."userId" IN (:...ids)', { ids: userIds })
    .andWhere('ur."gameType" = :type', { type: gameType })
    .getMany();
  for (const r of rows) map.set(r.userId, r.rating);
  for (const id of userIds) if (!map.has(id)) map.set(id, ELO_DEFAULT);
  return map;
}

/**
 * Returns a complete ratings map for a single user across every supported
 * game type. Variants the user has never played resolve to `ELO_DEFAULT`,
 * so clients can render a rating for every type without special-casing.
 */
export async function loadAllRatings(userId: number): Promise<Record<GameType, number>> {
  const rows = await AppDataSource.getRepository(UserRating).findBy({ userId });
  const byType = new Map<GameType, number>(rows.map(r => [r.gameType, r.rating]));
  const out = {} as Record<GameType, number>;
  for (const type of Object.values(GameType)) {
    out[type] = byType.get(type) ?? ELO_DEFAULT;
  }
  return out;
}

async function upsertRating(
  tx: EntityManager,
  userId: number,
  gameType: GameType,
  rating: number,
): Promise<void> {
  const repo = tx.getRepository(UserRating);
  const existing = await repo.findOneBy({ userId, gameType });
  if (existing) {
    existing.rating = rating;
    await repo.save(existing);
    return;
  }
  await repo.save(repo.create({ userId, gameType, rating }));
}

/**
 * Atomically updates both players' per-type ratings in `user_rating` and
 * writes the post-game snapshot to the game row. Idempotent: if
 * `whiteRatingAfter` is already set, returns the existing values without
 * touching the DB. Games without a rating snapshot on creation (e.g. from
 * before the Elo migration) are skipped.
 */
export function applyEloUpdate(gameId: string): Promise<EloUpdateResult | null> {
  return AppDataSource.transaction(async (tx) => {
    const gameRepo = tx.getRepository(Game);

    const row = await gameRepo.findOneBy({ id: gameId });
    if (!row) return null;
    if (row.status === GameStatus.Ongoing) return null;
    if (row.whiteRatingAfter !== null && row.blackRatingAfter !== null) {
      return {
        whiteBefore: row.whiteRatingBefore ?? ELO_DEFAULT,
        blackBefore: row.blackRatingBefore ?? ELO_DEFAULT,
        whiteAfter: row.whiteRatingAfter,
        blackAfter: row.blackRatingAfter,
      };
    }
    if (row.whiteRatingBefore === null || row.blackRatingBefore === null) return null;

    const whiteScore = whiteScoreFromResult(row.result);
    if (whiteScore === null) return null;

    const { whiteAfter, blackAfter } = calcElo(row.whiteRatingBefore, row.blackRatingBefore, whiteScore);

    await upsertRating(tx, row.whiteUserId, row.type, whiteAfter);
    await upsertRating(tx, row.blackUserId, row.type, blackAfter);

    row.whiteRatingAfter = whiteAfter;
    row.blackRatingAfter = blackAfter;
    await gameRepo.save(row);

    return {
      whiteBefore: row.whiteRatingBefore,
      blackBefore: row.blackRatingBefore,
      whiteAfter,
      blackAfter,
    };
  });
}
