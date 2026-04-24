import type { Server, Socket } from 'socket.io';
import { GameStatus, Color } from '@chess100com/rules';
import { AppDataSource } from './data-source';
import { Game } from './entity/Game';
import {
  advanceClock,
  cancelFlagTimer,
  deleteClock,
  getClockSnapshot,
  scheduleFlagTimer,
  whoFlagged,
} from './clock';
import type { FlagFallHandler } from './clock';
import {
  buildGameState,
  colorToString,
  deleteDrawOffer,
  getDrawOffer,
  parseGameIdPayload,
  parseMovePayload,
  rebuildRulesGame,
  setDrawOffer,
} from './game-runtime';
import type { PlayerColor } from './game-runtime';
import { applyEloUpdate } from './elo';

export const gameRoom = (gameId: string): string => `game:${gameId}`;

interface Authorized {
  row: Game;
  color: PlayerColor;
}

const fail = (socket: Socket, error: string): void => {
  socket.emit('game:error', { error });
};

async function authorize(
  socket: Socket,
  userId: number | null,
  gameId: string | null,
): Promise<Authorized | null> {
  if (userId === null) {
    fail(socket, 'Unauthorized');
    return null;
  }
  if (!gameId) {
    fail(socket, 'Invalid payload');
    return null;
  }
  const row = await AppDataSource.getRepository(Game).findOneBy({ id: gameId });
  if (!row) {
    fail(socket, 'Game not found');
    return null;
  }
  if (row.whiteUserId === userId) return { row, color: 'white' };
  if (row.blackUserId === userId) return { row, color: 'black' };
  fail(socket, 'Not a participant');
  return null;
}

const broadcastState = async (io: Server, row: Game): Promise<void> => {
  const rulesGame = rebuildRulesGame(row);
  const offer = await getDrawOffer(row.id);
  const turn = colorToString(rulesGame.position.getMovingColor());
  const clock = await getClockSnapshot(row.id, turn);
  io.to(gameRoom(row.id)).emit('game:state', buildGameState(row, rulesGame, offer, clock));
};

/**
 * Handles a clock timeout: the `flagged` side ran out of time while it was
 * their turn. Ends the game as `GameStatus.Timeout` and broadcasts.
 * Shared with the in-memory scheduler (fires when nobody's moving) and the
 * synchronous flag check inside the `move` handler.
 */
async function handleFlagFall(
  io: Server,
  gameId: string,
  flagged: PlayerColor,
): Promise<void> {
  const repo = AppDataSource.getRepository(Game);
  const row = await repo.findOneBy({ id: gameId });
  if (!row || row.status !== GameStatus.Ongoing) return;
  const rulesGame = rebuildRulesGame(row);
  if (rulesGame.status !== GameStatus.Ongoing) return;
  rulesGame.timeout(flagged === 'white' ? Color.White : Color.Black);
  row.status = rulesGame.status;
  row.result = rulesGame.result;
  row.finishedAt = new Date();
  await repo.save(row);
  const elo = await applyEloUpdate(row.id);
  if (elo) {
    row.whiteRatingAfter = elo.whiteAfter;
    row.blackRatingAfter = elo.blackAfter;
  }
  await deleteDrawOffer(gameId);
  await deleteClock(gameId);
  cancelFlagTimer(gameId);
  await broadcastState(io, row);
}

export function registerGameHandlers(io: Server, socket: Socket, userId: number | null): void {
  const flagHandler: FlagFallHandler = (gameId, flagged) => handleFlagFall(io, gameId, flagged);

  socket.on('game:join', async (raw: unknown) => {
    const auth = await authorize(socket, userId, parseGameIdPayload(raw));
    if (!auth) return;
    socket.join(gameRoom(auth.row.id));
    const rulesGame = rebuildRulesGame(auth.row);
    const offer = await getDrawOffer(auth.row.id);
    const turn = colorToString(rulesGame.position.getMovingColor());
    const clock = await getClockSnapshot(auth.row.id, turn);
    socket.emit('game:state', buildGameState(auth.row, rulesGame, offer, clock));
  });

  socket.on('move', async (raw: unknown) => {
    const payload = parseMovePayload(raw);
    const auth = await authorize(socket, userId, payload?.gameId ?? null);
    if (!auth || !payload) return;

    const rulesGame = rebuildRulesGame(auth.row);
    if (rulesGame.status !== GameStatus.Ongoing) {
      fail(socket, 'Game already ended');
      return;
    }
    if (colorToString(rulesGame.position.getMovingColor()) !== auth.color) {
      fail(socket, 'Not your turn');
      return;
    }

    // Flag check BEFORE rules validation: if the mover's time has already
    // run out, the game ends as a timeout loss for them regardless of
    // whether the submitted move is legal.
    const flagged = await whoFlagged(auth.row.id, auth.color);
    if (flagged !== null) {
      await handleFlagFall(io, auth.row.id, flagged);
      return;
    }

    try {
      rulesGame.move(payload.from, payload.to, payload.extra);
    } catch (err) {
      fail(socket, err instanceof Error ? err.message : 'Illegal move');
      return;
    }

    await advanceClock(auth.row.id, auth.color, auth.row.incrementMs);

    auth.row.moves = rulesGame.moves;
    auth.row.status = rulesGame.status;
    auth.row.result = rulesGame.result;
    if (rulesGame.status !== GameStatus.Ongoing) {
      auth.row.finishedAt = new Date();
    }
    await AppDataSource.getRepository(Game).save(auth.row);
    if (rulesGame.status !== GameStatus.Ongoing) {
      const elo = await applyEloUpdate(auth.row.id);
      if (elo) {
        auth.row.whiteRatingAfter = elo.whiteAfter;
        auth.row.blackRatingAfter = elo.blackAfter;
      }
    }
    // any pending draw offer is implicitly withdrawn on a move
    await deleteDrawOffer(auth.row.id);

    if (rulesGame.status === GameStatus.Ongoing) {
      const nextTurn = colorToString(rulesGame.position.getMovingColor());
      await scheduleFlagTimer(auth.row.id, nextTurn, flagHandler);
    } else {
      cancelFlagTimer(auth.row.id);
      await deleteClock(auth.row.id);
    }
    await broadcastState(io, auth.row);
  });

  socket.on('resign', async (raw: unknown) => {
    const auth = await authorize(socket, userId, parseGameIdPayload(raw));
    if (!auth) return;

    const rulesGame = rebuildRulesGame(auth.row);
    if (rulesGame.status !== GameStatus.Ongoing) {
      fail(socket, 'Game already ended');
      return;
    }
    rulesGame.resign(auth.color === 'white' ? Color.White : Color.Black);

    auth.row.status = rulesGame.status;
    auth.row.result = rulesGame.result;
    auth.row.finishedAt = new Date();
    await AppDataSource.getRepository(Game).save(auth.row);
    const elo = await applyEloUpdate(auth.row.id);
    if (elo) {
      auth.row.whiteRatingAfter = elo.whiteAfter;
      auth.row.blackRatingAfter = elo.blackAfter;
    }
    await deleteDrawOffer(auth.row.id);
    cancelFlagTimer(auth.row.id);
    await deleteClock(auth.row.id);
    await broadcastState(io, auth.row);
  });

  socket.on('draw:offer', async (raw: unknown) => {
    const auth = await authorize(socket, userId, parseGameIdPayload(raw));
    if (!auth) return;

    const rulesGame = rebuildRulesGame(auth.row);
    if (rulesGame.status !== GameStatus.Ongoing) {
      fail(socket, 'Game already ended');
      return;
    }
    await setDrawOffer(auth.row.id, auth.color);
    await broadcastState(io, auth.row);
  });

  socket.on('draw:accept', async (raw: unknown) => {
    const auth = await authorize(socket, userId, parseGameIdPayload(raw));
    if (!auth) return;

    const offer = await getDrawOffer(auth.row.id);
    if (!offer || offer.from === auth.color) {
      fail(socket, 'No draw offer to accept');
      return;
    }
    const rulesGame = rebuildRulesGame(auth.row);
    if (rulesGame.status !== GameStatus.Ongoing) {
      fail(socket, 'Game already ended');
      return;
    }
    rulesGame.agreeDraw();
    auth.row.status = rulesGame.status;
    auth.row.result = rulesGame.result;
    auth.row.finishedAt = new Date();
    await AppDataSource.getRepository(Game).save(auth.row);
    const elo = await applyEloUpdate(auth.row.id);
    if (elo) {
      auth.row.whiteRatingAfter = elo.whiteAfter;
      auth.row.blackRatingAfter = elo.blackAfter;
    }
    await deleteDrawOffer(auth.row.id);
    cancelFlagTimer(auth.row.id);
    await deleteClock(auth.row.id);
    await broadcastState(io, auth.row);
  });

  socket.on('draw:decline', async (raw: unknown) => {
    const auth = await authorize(socket, userId, parseGameIdPayload(raw));
    if (!auth) return;

    const offer = await getDrawOffer(auth.row.id);
    if (!offer || offer.from === auth.color) {
      fail(socket, 'No draw offer to decline');
      return;
    }
    await deleteDrawOffer(auth.row.id);
    await broadcastState(io, auth.row);
  });
}

/**
 * Exported so the startup path can rebuild flag timers for every game that
 * was Ongoing when the process (re)started.
 */
export function makeFlagHandler(io: Server): FlagFallHandler {
  return (gameId, flagged) => handleFlagFall(io, gameId, flagged);
}
