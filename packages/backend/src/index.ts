import 'reflect-metadata';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import type { Socket } from 'socket.io';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { GameStatus, GameType, OngoingResult, VariantStartFen } from '@chess100com/rules';
import { redisClient } from './redis-client';
import { AppDataSource } from './data-source';
import { User } from './entity/User';
import { Game } from './entity/Game';
import { getUserRatings, loadAllRatings } from './elo';
import {
  getAllQueueSizes,
  leaveAllQueues,
  registerSocket,
  resetLobby,
  switchQueue,
  unregisterSocket,
} from './lobby';
import type { MatchPair, QueueSizes } from './lobby';
import { makeFlagHandler, registerGameHandlers } from './game-handlers';
import { initClock, scheduleFlagTimer } from './clock';
import { colorToString, rebuildRulesGame } from './game-runtime';
import authRouter from './routes/auth';
import gamesRouter from './routes/games';
import leaderboardRouter from './routes/leaderboard';
import passwordRouter from './routes/password';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const sessionMiddleware = session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET ?? 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true },
});

app.use(express.json());
app.use(sessionMiddleware);

app.get('/healthcheck', (_req, res) => {
  res.status(200).send('OK');
});

app.use(authRouter);
app.use(gamesRouter);
app.use(leaderboardRouter);
app.use(passwordRouter);

// Share session with socket.io
io.engine.use(sessionMiddleware);

// Fan out room emits across backend instances via Redis pub/sub. Both the
// pub and sub connections are dedicated duplicates: the main redisClient is
// used for WATCH/MULTI JSON workflows, and those must not share a connection
// with pub/sub traffic.
const pubClient = redisClient.duplicate();
const subClient = redisClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

const userRoom = (userId: number) => `user:${userId}`;
const LOBBY_ROOM = 'lobby';

const getUserId = (socket: Socket): number | null => {
  const req = socket.request as express.Request;
  const userId = (req.session as session.Session & { userId?: number }).userId;
  return userId ?? null;
};

const broadcastLobbyState = (sizes: QueueSizes): void => {
  io.to(LOBBY_ROOM).emit('lobby:state', { queueSizes: sizes });
};

// Tests need a much shorter clock than production to observe flag-fall in a
// reasonable test timeout. Env vars let us shorten the control without a
// code change (see packages/backend/docker-compose.yml in the test stack).
const DEFAULT_INITIAL_TIME_MS = Number(process.env.GAME_INITIAL_TIME_MS ?? 600_000);
const DEFAULT_INCREMENT_MS = Number(process.env.GAME_INCREMENT_MS ?? 15_000);

const MAX_ONGOING_GAMES = 3;

const isGameType = (v: unknown): v is GameType =>
  typeof v === 'string' && (Object.values(GameType) as string[]).includes(v);

const parseQueueJoinPayload = (raw: unknown): GameType | null => {
  if (typeof raw !== 'object' || raw === null) return null;
  const p = raw as Record<string, unknown>;
  return isGameType(p.type) ? p.type : null;
};

async function createAndAnnounceGame(pair: MatchPair): Promise<void> {
  const gameRepo = AppDataSource.getRepository(Game);
  const ratings = await getUserRatings([pair.whiteUserId, pair.blackUserId], pair.type);
  const whiteRating = ratings.get(pair.whiteUserId) ?? null;
  const blackRating = ratings.get(pair.blackUserId) ?? null;
  const game = gameRepo.create({
    type: pair.type,
    whiteUserId: pair.whiteUserId,
    blackUserId: pair.blackUserId,
    startFen: VariantStartFen[pair.type],
    moves: [],
    status: GameStatus.Ongoing,
    result: OngoingResult,
    finishedAt: null,
    initialTimeMs: DEFAULT_INITIAL_TIME_MS,
    incrementMs: DEFAULT_INCREMENT_MS,
    whiteRatingBefore: whiteRating,
    blackRatingBefore: blackRating,
  });
  await gameRepo.save(game);
  // Clocks are frozen until white's first move; we still pre-allocate the
  // state so the initial broadcast can include remaining time + control.
  await initClock(game.id, game.initialTimeMs);
  io.to(userRoom(pair.whiteUserId)).emit('game:start', { gameId: game.id, color: 'white', type: pair.type });
  io.to(userRoom(pair.blackUserId)).emit('game:start', { gameId: game.id, color: 'black', type: pair.type });
}

io.on('connection', (socket) => {
  const userId = getUserId(socket);
  if (userId !== null) {
    socket.join(userRoom(userId));
    // oxlint-disable-next-line no-console
    registerSocket(userId, socket.id).catch(err => console.error('registerSocket failed', err));
  }

  socket.on('disconnect', async () => {
    if (userId === null) return;
    try {
      const wasLast = await unregisterSocket(userId, socket.id);
      if (wasLast) broadcastLobbyState(await getAllQueueSizes());
    } catch (err) {
      // oxlint-disable-next-line no-console
      console.error('unregisterSocket failed', err);
    }
  });

  socket.on('ping', () => {
    socket.emit('pong');
  });

  socket.on('my-info', async () => {
    if (userId === null) {
      socket.emit('my-info', { error: 'Unauthorized' });
      return;
    }
    const user = await AppDataSource.getRepository(User).findOneBy({ id: userId });
    if (!user) {
      socket.emit('my-info', { error: 'Unauthorized' });
      return;
    }
    const ratings = await loadAllRatings(user.id);
    socket.emit('my-info', { username: user.username, email: user.email, ratings });
  });

  socket.on('lobby:subscribe', async () => {
    if (userId === null) {
      socket.emit('lobby:state', { error: 'Unauthorized' });
      return;
    }
    socket.join(LOBBY_ROOM);
    socket.emit('lobby:state', { queueSizes: await getAllQueueSizes() });
  });

  socket.on('lobby:unsubscribe', () => {
    socket.leave(LOBBY_ROOM);
  });

  socket.on('queue:join', async (raw: unknown) => {
    if (userId === null) {
      socket.emit('queue:error', { error: 'Unauthorized' });
      return;
    }
    const type = parseQueueJoinPayload(raw);
    if (type === null) {
      socket.emit('queue:error', { error: 'Invalid game type' });
      return;
    }
    const ongoingCount = await AppDataSource.getRepository(Game).count({
      where: [
        { whiteUserId: userId, status: GameStatus.Ongoing },
        { blackUserId: userId, status: GameStatus.Ongoing },
      ],
    });
    if (ongoingCount >= MAX_ONGOING_GAMES) {
      socket.emit('queue:error', { error: 'Too many ongoing games' });
      return;
    }
    const result = await switchQueue(userId, type);
    socket.emit('queue:joined', { inQueue: true, alreadyQueued: !result.added, type });
    // `switchQueue` may have touched other variant queues, so broadcast the
    // whole size map instead of just the target's size.
    broadcastLobbyState(await getAllQueueSizes());
    if (result.matched) {
      // oxlint-disable-next-line no-console
      createAndAnnounceGame(result.matched).catch(err => console.error('game creation failed', err));
    }
  });

  socket.on('queue:leave', async () => {
    if (userId === null) {
      socket.emit('queue:error', { error: 'Unauthorized' });
      return;
    }
    const wasQueued = await leaveAllQueues(userId);
    socket.emit('queue:left', { inQueue: false, wasQueued });
    if (wasQueued) broadcastLobbyState(await getAllQueueSizes());
  });

  registerGameHandlers(io, socket, userId);
});

const PORT = process.env.PORT ?? 3000;

/**
 * On (re)start we re-arm the in-memory flag-fall setTimeout for every game
 * that was still ongoing. The clock docs in Redis carry turnStartAt, so the
 * timers are re-derived correctly even if the process was down long enough
 * for somebody to flag meanwhile — the scheduled delay clamps to 0 and the
 * handler fires almost immediately.
 */
async function rearmFlagTimers(): Promise<void> {
  const handler = makeFlagHandler(io);
  const ongoing = await AppDataSource.getRepository(Game).findBy({ status: GameStatus.Ongoing });
  for (const row of ongoing) {
    const rulesGame = rebuildRulesGame(row);
    const turn = colorToString(rulesGame.position.getMovingColor());
    // oxlint-disable-next-line no-await-in-loop
    await scheduleFlagTimer(row.id, turn, handler);
  }
}

async function start() {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  await resetLobby();
  await rearmFlagTimers();
  httpServer.listen(PORT);
}

// oxlint-disable-next-line no-console unicorn/prefer-top-level-await
start().catch(console.error);

export { app, httpServer, io };
