import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { In } from 'typeorm';
import { GameStatus } from '@chess100com/rules';
import { AppDataSource } from '../data-source';
import { Game } from '../entity/Game';
import { User } from '../entity/User';

type SessionWithUser = Express.Request['session'] & { userId?: number };

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const requireAuth = (req: Request): number | null => {
  const userId = (req.session as SessionWithUser).userId;
  return userId ?? null;
};

const serializeGame = (game: Game, players: Map<number, User>) => {
  const white = players.get(game.whiteUserId);
  const black = players.get(game.blackUserId);
  const lastMove = game.moves.at(-1);
  return {
    id: game.id,
    type: game.type,
    white: white ? { id: white.id, username: white.username, rating: white.rating } : null,
    black: black ? { id: black.id, username: black.username, rating: black.rating } : null,
    startFen: game.startFen,
    currentFen: lastMove?.fen ?? game.startFen,
    moves: game.moves,
    status: game.status,
    result: game.result,
    initialTimeMs: game.initialTimeMs,
    incrementMs: game.incrementMs,
    whiteRatingBefore: game.whiteRatingBefore,
    blackRatingBefore: game.blackRatingBefore,
    whiteRatingAfter: game.whiteRatingAfter,
    blackRatingAfter: game.blackRatingAfter,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    finishedAt: game.finishedAt,
  };
};

const router = Router();

const parseLimit = (raw: unknown): number | undefined => {
  if (typeof raw !== 'string') return undefined;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.min(n, 200);
};

const parseOffset = (raw: unknown): number | undefined => {
  if (typeof raw !== 'string') return undefined;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
};

router.get('/games/mine/ongoing', asyncHandler(async (req: Request, res: Response) => {
  const userId = requireAuth(req);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const gameRepo = AppDataSource.getRepository(Game);
  const games = await gameRepo.find({
    where: [
      { whiteUserId: userId, status: GameStatus.Ongoing },
      { blackUserId: userId, status: GameStatus.Ongoing },
    ],
    order: { createdAt: 'DESC' },
  });

  const opponentIds = new Set<number>();
  for (const g of games) {
    opponentIds.add(g.whiteUserId === userId ? g.blackUserId : g.whiteUserId);
  }
  const opponents = opponentIds.size > 0
    ? await AppDataSource.getRepository(User).findBy({ id: In([...opponentIds]) })
    : [];
  const opponentMap = new Map(opponents.map(u => [u.id, u]));

  const items = games.map(g => {
    const myColor: 'white' | 'black' = g.whiteUserId === userId ? 'white' : 'black';
    const opponentId = myColor === 'white' ? g.blackUserId : g.whiteUserId;
    const opponent = opponentMap.get(opponentId);
    return {
      id: g.id,
      type: g.type,
      myColor,
      opponent: opponent
        ? { id: opponent.id, username: opponent.username, rating: opponent.rating }
        : null,
      createdAt: g.createdAt,
    };
  });

  res.status(200).json({ games: items });
}));

router.get('/games/mine', asyncHandler(async (req: Request, res: Response) => {
  const userId = requireAuth(req);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const limit = parseLimit(req.query.limit);
  const offset = parseOffset(req.query.offset);

  const gameRepo = AppDataSource.getRepository(Game);
  const games = await gameRepo.find({
    where: [{ whiteUserId: userId }, { blackUserId: userId }],
    order: { createdAt: 'DESC' },
    take: limit,
    skip: offset,
  });

  const userIds = new Set<number>();
  for (const g of games) {
    userIds.add(g.whiteUserId);
    userIds.add(g.blackUserId);
  }
  const users = userIds.size > 0
    ? await AppDataSource.getRepository(User).findBy({ id: In([...userIds]) })
    : [];
  const playerMap = new Map(users.map(u => [u.id, u]));

  res.status(200).json({ games: games.map(g => serializeGame(g, playerMap)) });
}));

router.get('/games/:id', asyncHandler(async (req: Request, res: Response) => {
  const userId = requireAuth(req);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { id } = req.params;
  if (!UUID_RE.test(id)) {
    res.status(400).json({ error: 'Invalid game id' });
    return;
  }

  const game = await AppDataSource.getRepository(Game).findOneBy({ id });
  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  const users = await AppDataSource.getRepository(User).findBy({
    id: In([game.whiteUserId, game.blackUserId]),
  });
  const playerMap = new Map(users.map(u => [u.id, u]));

  res.status(200).json(serializeGame(game, playerMap));
}));

export default router;
