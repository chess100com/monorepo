import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { GameType } from '@chess100com/rules';
import { AppDataSource } from '../data-source.js';
import { User } from '../entity/User.js';
import { UserRating } from '../entity/UserRating.js';

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

const TOP_N = 20;
const ALL_TYPES: GameType[] = Object.values(GameType);

interface TopPlayer {
  id: number;
  username: string;
  rating: number;
}

/**
 * Top players for a given game type, sorted by that type's rating DESC with
 * username ASC as a stable tiebreaker. Only users who have a `user_rating`
 * row for the type appear — i.e. users who have finished at least one game
 * of that variant (ratings rows are written by `applyEloUpdate`).
 */
async function topForType(type: GameType): Promise<TopPlayer[]> {
  const rows = await AppDataSource.getRepository(UserRating)
    .createQueryBuilder('ur')
    .innerJoin(User, 'u', 'u.id = ur."userId"')
    .select(['u.id AS id', 'u.username AS username', 'ur.rating AS rating'])
    .where('ur."gameType" = :type', { type })
    .orderBy('ur.rating', 'DESC')
    .addOrderBy('u.username', 'ASC')
    .limit(TOP_N)
    .getRawMany<TopPlayer>();
  return rows.map(r => ({ id: Number(r.id), username: r.username, rating: Number(r.rating) }));
}

const router = Router();

router.get('/leaderboard', asyncHandler(async (_req: Request, res: Response) => {
  const entries = await Promise.all(
    ALL_TYPES.map(async t => [t, await topForType(t)] as const),
  );
  const byType = Object.fromEntries(entries) as Record<GameType, TopPlayer[]>;
  res.status(200).json({ top: byType });
}));

export default router;
