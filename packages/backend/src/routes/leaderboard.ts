import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { GameType } from '@chess100com/rules';
import { AppDataSource } from '../data-source';
import { User } from '../entity/User';
import { Game } from '../entity/Game';

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

async function topForType(type: GameType): Promise<TopPlayer[]> {
  const userRepo = AppDataSource.getRepository(User);
  // Filter to users who have played at least one game of this type; sort by
  // rating DESC, then username ASC for a stable tiebreaker. The participants
  // subquery covers both colors in one pass.
  const rows = await userRepo
    .createQueryBuilder('u')
    .select(['u.id AS id', 'u.username AS username', 'u.rating AS rating'])
    .where(qb => {
      const sub = qb.subQuery()
        .select('g."whiteUserId"')
        .from(Game, 'g')
        .where('g.type = :type')
        .getQuery();
      const sub2 = qb.subQuery()
        .select('g2."blackUserId"')
        .from(Game, 'g2')
        .where('g2.type = :type')
        .getQuery();
      return `u.id IN (${sub} UNION ${sub2})`;
    })
    .setParameter('type', type)
    .orderBy('u.rating', 'DESC')
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
