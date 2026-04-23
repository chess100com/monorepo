// oxlint-disable max-lines
import { describe, it, expect } from 'vitest';
import { io as ioClient } from 'socket.io-client';
import { faker } from '@faker-js/faker';

const BASE_URL = `http://localhost:${process.env.TEST_PORT ?? 3000}`;

describe('Backend', () => {
  it('GET /healthcheck responds with OK', async () => {
    const res = await fetch(`${BASE_URL}/healthcheck`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe('OK');
  });

  it('socket ping/pong', async () => {
    await new Promise<void>((resolve, reject) => {
      const socket = ioClient(BASE_URL);
      const timer = setTimeout(() => {
        socket.disconnect();
        reject(new Error('Timeout waiting for pong'));
      }, 5000);

      socket.on('connect', () => {
        socket.emit('ping');
      });

      socket.on('pong', () => {
        clearTimeout(timer);
        socket.disconnect();
        resolve();
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  });
});

describe('Registration', () => {
  const username = faker.internet.username().replaceAll(/[^a-zA-Z\-_]/g, '_');
  const email = faker.internet.email();
  const password = faker.internet.password({ length: 10 });

  // Cookie jar for session persistence
  let sessionCookie = '';

  it('POST /register returns 200', async () => {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    expect(res.status).toBe(200);
  });

  it('POST /login returns 200 and sets cookie', async () => {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    expect(res.status).toBe(200);
    const cookie = res.headers.get('set-cookie');
    expect(cookie).toBeTruthy();
    sessionCookie = cookie ?? '';
  });

  it('POST /my-info returns correct username and email', async () => {
    const res = await fetch(`${BASE_URL}/my-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { username: string; email: string; rating: number };
    expect(body.username).toBe(username);
    expect(body.email).toBe(email);
    expect(body.rating).toBe(1500);
  });

  it('socket my-info returns correct username and email', async () => {
    await new Promise<void>((resolve, reject) => {
      const socket = ioClient(BASE_URL, {
        extraHeaders: { Cookie: sessionCookie },
      });

      const timer = setTimeout(() => {
        socket.disconnect();
        reject(new Error('Timeout waiting for my-info'));
      }, 5000);

      socket.on('connect', () => {
        socket.emit('my-info');
      });

      socket.on('my-info', (data: { username: string; email: string }) => {
        clearTimeout(timer);
        socket.disconnect();
        try {
          expect(data.username).toBe(username);
          expect(data.email).toBe(email);
          resolve();
        } catch (e) {
          reject(e);
        }
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  });
});

describe('Games REST', () => {
  const username = faker.internet.username().replaceAll(/[^a-zA-Z\-_]/g, '_');
  const email = faker.internet.email();
  const password = faker.internet.password({ length: 10 });
  let sessionCookie = '';

  it('signs up and logs in a user', async () => {
    const reg = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    expect(reg.status).toBe(200);

    const login = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    expect(login.status).toBe(200);
    sessionCookie = login.headers.get('set-cookie') ?? '';
    expect(sessionCookie).toBeTruthy();
  });

  it('GET /games/mine without auth returns 401', async () => {
    const res = await fetch(`${BASE_URL}/games/mine`);
    expect(res.status).toBe(401);
  });

  it('GET /games/:id without auth returns 401', async () => {
    const res = await fetch(`${BASE_URL}/games/00000000-0000-0000-0000-000000000000`);
    expect(res.status).toBe(401);
  });

  it('GET /games/mine returns empty list for a fresh user', async () => {
    const res = await fetch(`${BASE_URL}/games/mine`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { games: unknown[] };
    expect(body.games).toEqual([]);
  });

  it('GET /games/:id with malformed id returns 400', async () => {
    const res = await fetch(`${BASE_URL}/games/not-a-uuid`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(400);
  });

  it('GET /games/:id for non-existent game returns 404', async () => {
    const res = await fetch(`${BASE_URL}/games/00000000-0000-0000-0000-000000000000`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(404);
  });
});

interface AuthedSession {
  username: string;
  email: string;
  cookie: string;
}

async function registerAndLogin(): Promise<AuthedSession> {
  const username = faker.internet.username().replaceAll(/[^a-zA-Z\-_]/g, '_');
  const email = faker.internet.email();
  const password = faker.internet.password({ length: 10 });

  const reg = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  if (reg.status !== 200) throw new Error(`register failed: ${reg.status}`);

  const login = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (login.status !== 200) throw new Error(`login failed: ${login.status}`);
  const cookie = login.headers.get('set-cookie') ?? '';
  if (!cookie) throw new Error('no session cookie');

  return { username, email, cookie };
}

function connectSocket(cookie?: string) {
  return ioClient(BASE_URL, {
    extraHeaders: cookie ? { Cookie: cookie } : undefined,
    forceNew: true,
  });
}

function waitFor<T>(socket: ReturnType<typeof ioClient>, event: string, timeoutMs = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeoutMs);
    socket.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

describe('Lobby and matchmaking', () => {
  it('queue:join without auth emits an error', async () => {
    const socket = connectSocket();
    try {
      const reply = await new Promise<{ error?: string }>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), 5000);
        socket.on('connect', () => socket.emit('queue:join', { type: 'heirs' }));
        socket.on('queue:error', (data: { error?: string }) => {
          clearTimeout(timer);
          resolve(data);
        });
      });
      expect(reply.error).toBe('Unauthorized');
    } finally {
      socket.disconnect();
    }
  });

  it('queue:join with an unknown type emits an error', async () => {
    const user = await registerAndLogin();
    const socket = connectSocket(user.cookie);
    try {
      await new Promise<void>(resolve => { socket.on('connect', () => resolve()); });
      const reply = await new Promise<{ error?: string }>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), 5000);
        socket.once('queue:error', (data: { error?: string }) => {
          clearTimeout(timer);
          resolve(data);
        });
        socket.emit('queue:join', { type: 'bogus-variant' });
      });
      expect(reply.error).toBe('Invalid game type');
    } finally {
      socket.disconnect();
    }
  });

  it('two queued players are matched into a new Game', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();

    const aliceSocket = connectSocket(alice.cookie);
    const bobSocket = connectSocket(bob.cookie);

    try {
      await Promise.all([
        new Promise<void>(resolve => { aliceSocket.on('connect', () => resolve()); }),
        new Promise<void>(resolve => { bobSocket.on('connect', () => resolve()); }),
      ]);

      const aliceStartP = waitFor<{ gameId: string; color: 'white' | 'black' }>(aliceSocket, 'game:start');
      const bobStartP = waitFor<{ gameId: string; color: 'white' | 'black' }>(bobSocket, 'game:start');

      aliceSocket.emit('queue:join', { type: 'heirs' });
      bobSocket.emit('queue:join', { type: 'heirs' });

      const [aliceStart, bobStart] = await Promise.all([aliceStartP, bobStartP]);

      expect(aliceStart.gameId).toBe(bobStart.gameId);
      expect(aliceStart.color).not.toBe(bobStart.color);
      expect(['white', 'black']).toContain(aliceStart.color);

      // verify the game got persisted and can be fetched by either player
      const res = await fetch(`${BASE_URL}/games/${aliceStart.gameId}`, {
        headers: { Cookie: alice.cookie },
      });
      expect(res.status).toBe(200);
      const body = await res.json() as {
        id: string;
        white: { username: string };
        black: { username: string };
        status: string;
        result: string;
        currentFen: string;
        moves: unknown[];
      };
      expect(body.id).toBe(aliceStart.gameId);
      expect(body.status).toBe('ongoing');
      expect(body.result).toBe('*');
      expect(body.moves).toEqual([]);
      expect(body.currentFen).toContain('rnbcqksbnr');

      const whiteUsername = aliceStart.color === 'white' ? alice.username : bob.username;
      const blackUsername = aliceStart.color === 'white' ? bob.username : alice.username;
      expect(body.white.username).toBe(whiteUsername);
      expect(body.black.username).toBe(blackUsername);
    } finally {
      aliceSocket.disconnect();
      bobSocket.disconnect();
    }
  });

  it('queue:leave takes the user out of the queue', async () => {
    const user = await registerAndLogin();
    const socket = connectSocket(user.cookie);

    try {
      await new Promise<void>(resolve => { socket.on('connect', () => resolve()); });

      const joined = await new Promise<{ inQueue: boolean }>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout joining')), 5000);
        socket.once('queue:joined', (data: { inQueue: boolean }) => {
          clearTimeout(timer);
          resolve(data);
        });
        socket.emit('queue:join', { type: 'heirs' });
      });
      expect(joined.inQueue).toBe(true);

      const left = await new Promise<{ inQueue: boolean; wasQueued: boolean }>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout leaving')), 5000);
        socket.once('queue:left', (data: { inQueue: boolean; wasQueued: boolean }) => {
          clearTimeout(timer);
          resolve(data);
        });
        socket.emit('queue:leave');
      });
      expect(left.inQueue).toBe(false);
      expect(left.wasQueued).toBe(true);
    } finally {
      socket.disconnect();
    }
  });

  it('lobby:subscribe receives queue size updates', async () => {
    const observer = await registerAndLogin();
    const player = await registerAndLogin();

    const observerSocket = connectSocket(observer.cookie);
    const playerSocket = connectSocket(player.cookie);

    try {
      await Promise.all([
        new Promise<void>(resolve => { observerSocket.on('connect', () => resolve()); }),
        new Promise<void>(resolve => { playerSocket.on('connect', () => resolve()); }),
      ]);

      interface LobbyStateEvt { queueSizes: Record<string, number> }
      const initial = await new Promise<LobbyStateEvt>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout initial lobby:state')), 5000);
        observerSocket.once('lobby:state', (data: LobbyStateEvt) => {
          clearTimeout(timer);
          resolve(data);
        });
        observerSocket.emit('lobby:subscribe');
      });
      expect(initial.queueSizes.heirs).toBe(0);

      const afterJoin = await new Promise<LobbyStateEvt>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout after join')), 5000);
        observerSocket.once('lobby:state', (data: LobbyStateEvt) => {
          clearTimeout(timer);
          resolve(data);
        });
        playerSocket.emit('queue:join', { type: 'heirs' });
      });
      expect(afterJoin.queueSizes.heirs).toBe(1);

      // clean up the queue so subsequent tests start from 0
      playerSocket.emit('queue:leave');
      await new Promise<void>(resolve => { playerSocket.once('queue:left', () => resolve()); });
    } finally {
      observerSocket.disconnect();
      playerSocket.disconnect();
    }
  });
});

interface GameStateEvt {
  gameId: string;
  currentFen: string;
  moves: { from: { x: number; y: number }; to: { x: number; y: number }; alias: string }[];
  status: string;
  result: string;
  turn: 'white' | 'black';
  check: boolean;
  drawOffer: { from: 'white' | 'black' } | null;
  clock: { whiteMs: number; blackMs: number; turn: 'white' | 'black'; started: boolean } | null;
  initialTimeMs: number;
  incrementMs: number;
}

describe('Game play over socket', () => {
  async function queueUpPair() {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();
    const aliceSocket = connectSocket(alice.cookie);
    const bobSocket = connectSocket(bob.cookie);
    await Promise.all([
      new Promise<void>(resolve => { aliceSocket.on('connect', () => resolve()); }),
      new Promise<void>(resolve => { bobSocket.on('connect', () => resolve()); }),
    ]);
    const aliceStartP = waitFor<{ gameId: string; color: 'white' | 'black' }>(aliceSocket, 'game:start');
    const bobStartP = waitFor<{ gameId: string; color: 'white' | 'black' }>(bobSocket, 'game:start');
    aliceSocket.emit('queue:join', { type: 'heirs' });
    bobSocket.emit('queue:join', { type: 'heirs' });
    const [aliceStart] = await Promise.all([aliceStartP, bobStartP]);
    const whiteSocket = aliceStart.color === 'white' ? aliceSocket : bobSocket;
    const blackSocket = aliceStart.color === 'white' ? bobSocket : aliceSocket;
    return { gameId: aliceStart.gameId, whiteSocket, blackSocket, sockets: [aliceSocket, bobSocket] };
  }

  function bothJoin(gameId: string, whiteSocket: ReturnType<typeof connectSocket>, blackSocket: ReturnType<typeof connectSocket>) {
    const whiteStateP = waitFor<GameStateEvt>(whiteSocket, 'game:state');
    const blackStateP = waitFor<GameStateEvt>(blackSocket, 'game:state');
    whiteSocket.emit('game:join', { gameId });
    blackSocket.emit('game:join', { gameId });
    return Promise.all([whiteStateP, blackStateP]);
  }

  it('game:join delivers initial state to both players', async () => {
    const { gameId, whiteSocket, blackSocket, sockets } = await queueUpPair();
    try {
      const [whiteState, blackState] = await bothJoin(gameId, whiteSocket, blackSocket);
      expect(whiteState.gameId).toBe(gameId);
      expect(whiteState.moves).toEqual([]);
      expect(whiteState.turn).toBe('white');
      expect(whiteState.status).toBe('ongoing');
      expect(whiteState.drawOffer).toBeNull();
      expect(blackState.turn).toBe('white');
    } finally {
      for (const s of sockets) s.disconnect();
    }
  });

  it('a legal move from white is persisted and broadcast to both', async () => {
    const { gameId, whiteSocket, blackSocket, sockets } = await queueUpPair();
    try {
      await bothJoin(gameId, whiteSocket, blackSocket);

      const whiteAfter = waitFor<GameStateEvt>(whiteSocket, 'game:state');
      const blackAfter = waitFor<GameStateEvt>(blackSocket, 'game:state');
      whiteSocket.emit('move', { gameId, from: { x: 1, y: 2 }, to: { x: 1, y: 3 } });
      const [wState, bState] = await Promise.all([whiteAfter, blackAfter]);

      expect(wState.moves.length).toBe(1);
      expect(wState.moves[0].alias).toBe('a2-a3');
      expect(wState.turn).toBe('black');
      expect(bState.moves.length).toBe(1);
    } finally {
      for (const s of sockets) s.disconnect();
    }
  });

  it('rejects a move made by the wrong side', async () => {
    const { gameId, whiteSocket, blackSocket, sockets } = await queueUpPair();
    try {
      await bothJoin(gameId, whiteSocket, blackSocket);
      const errP = waitFor<{ error: string }>(blackSocket, 'game:error');
      // black tries to move a black pawn while it's white's turn
      blackSocket.emit('move', { gameId, from: { x: 1, y: 9 }, to: { x: 1, y: 8 } });
      const err = await errP;
      expect(err.error).toBe('Not your turn');
    } finally {
      for (const s of sockets) s.disconnect();
    }
  });

  it('rejects an illegal move from the right side', async () => {
    const { gameId, whiteSocket, blackSocket, sockets } = await queueUpPair();
    try {
      await bothJoin(gameId, whiteSocket, blackSocket);
      const errP = waitFor<{ error: string }>(whiteSocket, 'game:error');
      // a2 to a10 in one move: illegal
      whiteSocket.emit('move', { gameId, from: { x: 1, y: 2 }, to: { x: 1, y: 10 } });
      const err = await errP;
      expect(err.error).toMatch(/Illegal move/);
    } finally {
      for (const s of sockets) s.disconnect();
    }
  });

  it('resign ends the game and broadcasts the final state', async () => {
    const { gameId, whiteSocket, blackSocket, sockets } = await queueUpPair();
    try {
      await bothJoin(gameId, whiteSocket, blackSocket);

      const whiteAfter = waitFor<GameStateEvt>(whiteSocket, 'game:state');
      const blackAfter = waitFor<GameStateEvt>(blackSocket, 'game:state');
      whiteSocket.emit('resign', { gameId });
      const [wState, bState] = await Promise.all([whiteAfter, blackAfter]);

      expect(wState.status).toBe('resignation');
      expect(wState.result).toBe('0-1');
      expect(bState.result).toBe('0-1');
    } finally {
      for (const s of sockets) s.disconnect();
    }
  });

  it('draw offer + accept ends the game by agreement', async () => {
    const { gameId, whiteSocket, blackSocket, sockets } = await queueUpPair();
    try {
      await bothJoin(gameId, whiteSocket, blackSocket);

      const offerWhiteP = waitFor<GameStateEvt>(whiteSocket, 'game:state');
      const offerBlackP = waitFor<GameStateEvt>(blackSocket, 'game:state');
      whiteSocket.emit('draw:offer', { gameId });
      const [wOffer, bOffer] = await Promise.all([offerWhiteP, offerBlackP]);
      expect(wOffer.drawOffer).toEqual({ from: 'white' });
      expect(bOffer.drawOffer).toEqual({ from: 'white' });

      const acceptWhiteP = waitFor<GameStateEvt>(whiteSocket, 'game:state');
      const acceptBlackP = waitFor<GameStateEvt>(blackSocket, 'game:state');
      blackSocket.emit('draw:accept', { gameId });
      const [wAccepted, bAccepted] = await Promise.all([acceptWhiteP, acceptBlackP]);
      expect(wAccepted.status).toBe('agreement');
      expect(wAccepted.result).toBe('1/2-1/2');
      expect(bAccepted.drawOffer).toBeNull();
    } finally {
      for (const s of sockets) s.disconnect();
    }
  });

  it('draw offer by the same side cannot be self-accepted', async () => {
    const { gameId, whiteSocket, blackSocket, sockets } = await queueUpPair();
    try {
      await bothJoin(gameId, whiteSocket, blackSocket);

      const offerStateP = waitFor<GameStateEvt>(whiteSocket, 'game:state');
      whiteSocket.emit('draw:offer', { gameId });
      await offerStateP;

      const errP = waitFor<{ error: string }>(whiteSocket, 'game:error');
      whiteSocket.emit('draw:accept', { gameId });
      const err = await errP;
      expect(err.error).toBe('No draw offer to accept');
    } finally {
      for (const s of sockets) s.disconnect();
    }
  });

  it('move clears a pending draw offer', async () => {
    const { gameId, whiteSocket, blackSocket, sockets } = await queueUpPair();
    try {
      await bothJoin(gameId, whiteSocket, blackSocket);

      const offerP = waitFor<GameStateEvt>(blackSocket, 'game:state');
      whiteSocket.emit('draw:offer', { gameId });
      const offered = await offerP;
      expect(offered.drawOffer).toEqual({ from: 'white' });

      const afterMoveP = waitFor<GameStateEvt>(blackSocket, 'game:state');
      whiteSocket.emit('move', { gameId, from: { x: 1, y: 2 }, to: { x: 1, y: 3 } });
      const afterMove = await afterMoveP;
      expect(afterMove.drawOffer).toBeNull();
      expect(afterMove.moves.length).toBe(1);
    } finally {
      for (const s of sockets) s.disconnect();
    }
  });

  it('plays four alternating halfmoves, turn and fen advance correctly', async () => {
    const { gameId, whiteSocket, blackSocket, sockets } = await queueUpPair();
    try {
      await bothJoin(gameId, whiteSocket, blackSocket);

      const plies: { mover: ReturnType<typeof connectSocket>; from: { x: number; y: number }; to: { x: number; y: number }; expectedTurn: 'white' | 'black'; expectedCount: number }[] = [
        { mover: whiteSocket, from: { x: 1, y: 2 }, to: { x: 1, y: 3 }, expectedTurn: 'black', expectedCount: 1 },
        { mover: blackSocket, from: { x: 1, y: 9 }, to: { x: 1, y: 8 }, expectedTurn: 'white', expectedCount: 2 },
        { mover: whiteSocket, from: { x: 2, y: 2 }, to: { x: 2, y: 3 }, expectedTurn: 'black', expectedCount: 3 },
        { mover: blackSocket, from: { x: 2, y: 9 }, to: { x: 2, y: 8 }, expectedTurn: 'white', expectedCount: 4 },
      ];

      let previousFen = '';
      for (const ply of plies) {
        const p = waitFor<GameStateEvt>(blackSocket, 'game:state');
        ply.mover.emit('move', { gameId, from: ply.from, to: ply.to });
        // oxlint-disable-next-line no-await-in-loop
        const state = await p;
        expect(state.moves.length).toBe(ply.expectedCount);
        expect(state.turn).toBe(ply.expectedTurn);
        expect(state.currentFen).not.toBe(previousFen);
        previousFen = state.currentFen;
      }
    } finally {
      for (const s of sockets) s.disconnect();
    }
  });

  it('game:join after reconnect returns the current state with full move history', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();
    const aliceSocket = connectSocket(alice.cookie);
    const bobSocket = connectSocket(bob.cookie);

    try {
      await Promise.all([
        new Promise<void>(resolve => { aliceSocket.on('connect', () => resolve()); }),
        new Promise<void>(resolve => { bobSocket.on('connect', () => resolve()); }),
      ]);
      const aliceStartP = waitFor<{ gameId: string; color: 'white' | 'black' }>(aliceSocket, 'game:start');
      const bobStartP = waitFor<{ gameId: string; color: 'white' | 'black' }>(bobSocket, 'game:start');
      aliceSocket.emit('queue:join', { type: 'heirs' });
      bobSocket.emit('queue:join', { type: 'heirs' });
      const [aliceStart] = await Promise.all([aliceStartP, bobStartP]);
      const gameId = aliceStart.gameId;

      const whitePlayer = aliceStart.color === 'white' ? alice : bob;
      const whiteSocket = aliceStart.color === 'white' ? aliceSocket : bobSocket;
      const blackSocket = aliceStart.color === 'white' ? bobSocket : aliceSocket;

      await bothJoin(gameId, whiteSocket, blackSocket);

      const state1P = waitFor<GameStateEvt>(blackSocket, 'game:state');
      whiteSocket.emit('move', { gameId, from: { x: 1, y: 2 }, to: { x: 1, y: 3 } });
      await state1P;

      const state2P = waitFor<GameStateEvt>(whiteSocket, 'game:state');
      blackSocket.emit('move', { gameId, from: { x: 1, y: 9 }, to: { x: 1, y: 8 } });
      const afterBlack = await state2P;
      expect(afterBlack.moves.length).toBe(2);
      const expectedFen = afterBlack.currentFen;

      // white disconnects, reconnects with the same session
      whiteSocket.disconnect();
      const reconnected = connectSocket(whitePlayer.cookie);
      await new Promise<void>(resolve => { reconnected.on('connect', () => resolve()); });

      try {
        const recoveredP = waitFor<GameStateEvt>(reconnected, 'game:state');
        reconnected.emit('game:join', { gameId });
        const recovered = await recoveredP;
        expect(recovered.gameId).toBe(gameId);
        expect(recovered.moves.length).toBe(2);
        expect(recovered.currentFen).toBe(expectedFen);
        expect(recovered.turn).toBe('white');
      } finally {
        reconnected.disconnect();
      }
    } finally {
      aliceSocket.disconnect();
      bobSocket.disconnect();
    }
  });

  it('a resigned game shows up in GET /games/mine with final status', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();
    const aliceSocket = connectSocket(alice.cookie);
    const bobSocket = connectSocket(bob.cookie);

    try {
      await Promise.all([
        new Promise<void>(resolve => { aliceSocket.on('connect', () => resolve()); }),
        new Promise<void>(resolve => { bobSocket.on('connect', () => resolve()); }),
      ]);
      const aliceStartP = waitFor<{ gameId: string; color: 'white' | 'black' }>(aliceSocket, 'game:start');
      const bobStartP = waitFor<{ gameId: string; color: 'white' | 'black' }>(bobSocket, 'game:start');
      aliceSocket.emit('queue:join', { type: 'heirs' });
      bobSocket.emit('queue:join', { type: 'heirs' });
      const [aliceStart] = await Promise.all([aliceStartP, bobStartP]);
      const gameId = aliceStart.gameId;

      const whiteSocket = aliceStart.color === 'white' ? aliceSocket : bobSocket;
      const blackSocket = aliceStart.color === 'white' ? bobSocket : aliceSocket;
      await bothJoin(gameId, whiteSocket, blackSocket);

      const endP = waitFor<GameStateEvt>(whiteSocket, 'game:state');
      whiteSocket.emit('resign', { gameId });
      await endP;

      const res = await fetch(`${BASE_URL}/games/mine`, { headers: { Cookie: alice.cookie } });
      expect(res.status).toBe(200);
      const body = await res.json() as { games: { id: string; status: string; result: string; finishedAt: string | null }[] };
      const mine = body.games.find(g => g.id === gameId);
      expect(mine).toBeTruthy();
      expect(mine?.status).toBe('resignation');
      expect(mine?.result).toBe('0-1');
      expect(mine?.finishedAt).toBeTruthy();
    } finally {
      aliceSocket.disconnect();
      bobSocket.disconnect();
    }
  });
});

describe('Clock', () => {
  async function queueUpPair() {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();
    const aliceSocket = connectSocket(alice.cookie);
    const bobSocket = connectSocket(bob.cookie);
    await Promise.all([
      new Promise<void>(resolve => { aliceSocket.on('connect', () => resolve()); }),
      new Promise<void>(resolve => { bobSocket.on('connect', () => resolve()); }),
    ]);
    const aliceStartP = waitFor<{ gameId: string; color: 'white' | 'black' }>(aliceSocket, 'game:start');
    const bobStartP = waitFor<{ gameId: string; color: 'white' | 'black' }>(bobSocket, 'game:start');
    aliceSocket.emit('queue:join', { type: 'heirs' });
    bobSocket.emit('queue:join', { type: 'heirs' });
    const [aliceStart] = await Promise.all([aliceStartP, bobStartP]);
    const whiteSocket = aliceStart.color === 'white' ? aliceSocket : bobSocket;
    const blackSocket = aliceStart.color === 'white' ? bobSocket : aliceSocket;
    return { gameId: aliceStart.gameId, whiteSocket, blackSocket, sockets: [aliceSocket, bobSocket] };
  }

  function bothJoin(gameId: string, whiteSocket: ReturnType<typeof connectSocket>, blackSocket: ReturnType<typeof connectSocket>) {
    const whiteStateP = waitFor<GameStateEvt>(whiteSocket, 'game:state');
    const blackStateP = waitFor<GameStateEvt>(blackSocket, 'game:state');
    whiteSocket.emit('game:join', { gameId });
    blackSocket.emit('game:join', { gameId });
    return Promise.all([whiteStateP, blackStateP]);
  }

  it('initial state carries clock frozen at the configured initial time', async () => {
    const { gameId, whiteSocket, blackSocket, sockets } = await queueUpPair();
    try {
      const [wState] = await bothJoin(gameId, whiteSocket, blackSocket);
      // packages/backend/docker-compose.yml sets GAME_INITIAL_TIME_MS=3000 for tests
      expect(wState.initialTimeMs).toBe(3000);
      expect(wState.incrementMs).toBe(0);
      expect(wState.clock).not.toBeNull();
      expect(wState.clock?.started).toBe(false);
      expect(wState.clock?.whiteMs).toBe(3000);
      expect(wState.clock?.blackMs).toBe(3000);
    } finally {
      for (const s of sockets) s.disconnect();
    }
  });

  it("white's first move is free and starts black's clock", async () => {
    const { gameId, whiteSocket, blackSocket, sockets } = await queueUpPair();
    try {
      await bothJoin(gameId, whiteSocket, blackSocket);
      const afterP = waitFor<GameStateEvt>(blackSocket, 'game:state');
      whiteSocket.emit('move', { gameId, from: { x: 1, y: 2 }, to: { x: 1, y: 3 } });
      const after = await afterP;
      expect(after.turn).toBe('black');
      expect(after.clock?.started).toBe(true);
      // White's first move is free: whiteMs stayed at the initial 3000ms.
      expect(after.clock?.whiteMs).toBe(3000);
      // Black is now on the clock; remaining is <= initial, very close to it.
      expect(after.clock?.blackMs).toBeLessThanOrEqual(3000);
      expect(after.clock?.blackMs).toBeGreaterThan(2500);
    } finally {
      for (const s of sockets) s.disconnect();
    }
  });

  it('flag-fall fires via setTimeout and ends the game as Timeout', async () => {
    const { gameId, whiteSocket, blackSocket, sockets } = await queueUpPair();
    try {
      await bothJoin(gameId, whiteSocket, blackSocket);

      // White's first move starts black's clock at ~3000ms. Nobody moves
      // after that, so the server's scheduled setTimeout should fire and
      // end the game as Timeout (black flagged) roughly 3s later.
      const blackStartedP = waitFor<GameStateEvt>(blackSocket, 'game:state');
      whiteSocket.emit('move', { gameId, from: { x: 1, y: 2 }, to: { x: 1, y: 3 } });
      await blackStartedP;

      const flaggedP = waitFor<GameStateEvt>(whiteSocket, 'game:state', 6000);
      const flagged = await flaggedP;
      expect(flagged.status).toBe('timeout');
      // Black ran out of time → white wins.
      expect(flagged.result).toBe('1-0');
    } finally {
      for (const s of sockets) s.disconnect();
    }
  });
});

interface GameStateWithRatings extends GameStateEvt {
  whiteRatingBefore: number | null;
  blackRatingBefore: number | null;
  whiteRatingAfter: number | null;
  blackRatingAfter: number | null;
}

describe('Leaderboard', () => {
  it('GET /leaderboard is public (no auth required)', async () => {
    const res = await fetch(`${BASE_URL}/leaderboard`);
    expect(res.status).toBe(200);
    const body = await res.json() as { top: Record<string, unknown[]> };
    expect(body.top).toBeTruthy();
    expect(Array.isArray(body.top.heirs)).toBe(true);
  });

  it('includes participants of a finished game, ordered by rating DESC', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();
    const aliceSocket = connectSocket(alice.cookie);
    const bobSocket = connectSocket(bob.cookie);

    try {
      await Promise.all([
        new Promise<void>(resolve => { aliceSocket.on('connect', () => resolve()); }),
        new Promise<void>(resolve => { bobSocket.on('connect', () => resolve()); }),
      ]);
      const aliceStartP = waitFor<{ gameId: string; color: 'white' | 'black' }>(aliceSocket, 'game:start');
      const bobStartP = waitFor<{ gameId: string; color: 'white' | 'black' }>(bobSocket, 'game:start');
      aliceSocket.emit('queue:join', { type: 'heirs' });
      bobSocket.emit('queue:join', { type: 'heirs' });
      const [aliceStart] = await Promise.all([aliceStartP, bobStartP]);

      const whiteSocket = aliceStart.color === 'white' ? aliceSocket : bobSocket;
      const blackSocket = aliceStart.color === 'white' ? bobSocket : aliceSocket;
      const joinedP = waitFor<GameStateEvt>(whiteSocket, 'game:state');
      whiteSocket.emit('game:join', { gameId: aliceStart.gameId });
      blackSocket.emit('game:join', { gameId: aliceStart.gameId });
      await joinedP;

      const endP = waitFor<GameStateEvt>(whiteSocket, 'game:state');
      whiteSocket.emit('resign', { gameId: aliceStart.gameId });
      await endP;

      const res = await fetch(`${BASE_URL}/leaderboard`, { headers: { Cookie: alice.cookie } });
      expect(res.status).toBe(200);
      const body = await res.json() as { top: Record<string, { id: number; username: string; rating: number }[]> };
      const list = body.top.heirs;
      expect(list).toBeTruthy();
      expect(list.length).toBeLessThanOrEqual(20);
      expect(list.length).toBeGreaterThan(0);
      // strictly non-increasing rating ordering
      for (let i = 1; i < list.length; i++) {
        expect(list[i - 1].rating).toBeGreaterThanOrEqual(list[i].rating);
      }
      // the winner of this match (1516) is high enough to sit in the top-20
      const winnerName = aliceStart.color === 'white' ? bob.username : alice.username;
      const winner = list.find(p => p.username === winnerName);
      expect(winner).toBeTruthy();
      expect(winner?.rating).toBe(1516);
    } finally {
      aliceSocket.disconnect();
      bobSocket.disconnect();
    }
  });
});

describe('Rating', () => {
  it('resignation updates both players ratings and exposes delta in final state', async () => {
    const alice = await registerAndLogin();
    const bob = await registerAndLogin();
    const aliceSocket = connectSocket(alice.cookie);
    const bobSocket = connectSocket(bob.cookie);

    try {
      await Promise.all([
        new Promise<void>(resolve => { aliceSocket.on('connect', () => resolve()); }),
        new Promise<void>(resolve => { bobSocket.on('connect', () => resolve()); }),
      ]);
      const aliceStartP = waitFor<{ gameId: string; color: 'white' | 'black' }>(aliceSocket, 'game:start');
      const bobStartP = waitFor<{ gameId: string; color: 'white' | 'black' }>(bobSocket, 'game:start');
      aliceSocket.emit('queue:join', { type: 'heirs' });
      bobSocket.emit('queue:join', { type: 'heirs' });
      const [aliceStart] = await Promise.all([aliceStartP, bobStartP]);
      const gameId = aliceStart.gameId;

      const whiteSocket = aliceStart.color === 'white' ? aliceSocket : bobSocket;
      const blackSocket = aliceStart.color === 'white' ? bobSocket : aliceSocket;
      const joinWhiteP = waitFor<GameStateEvt>(whiteSocket, 'game:state');
      const joinBlackP = waitFor<GameStateEvt>(blackSocket, 'game:state');
      whiteSocket.emit('game:join', { gameId });
      blackSocket.emit('game:join', { gameId });
      await Promise.all([joinWhiteP, joinBlackP]);

      const endP = waitFor<GameStateWithRatings>(whiteSocket, 'game:state');
      whiteSocket.emit('resign', { gameId });
      const end = await endP;

      expect(end.status).toBe('resignation');
      expect(end.result).toBe('0-1');
      expect(end.whiteRatingBefore).toBe(1500);
      expect(end.blackRatingBefore).toBe(1500);
      // equal-rated: K=32, loser −16, winner +16
      expect(end.whiteRatingAfter).toBe(1484);
      expect(end.blackRatingAfter).toBe(1516);

      const winnerCookie = aliceStart.color === 'white' ? bob.cookie : alice.cookie;
      const loserCookie = aliceStart.color === 'white' ? alice.cookie : bob.cookie;

      const winnerRes = await fetch(`${BASE_URL}/my-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: winnerCookie },
      });
      const winnerInfo = await winnerRes.json() as { rating: number };
      expect(winnerInfo.rating).toBe(1516);

      const loserRes = await fetch(`${BASE_URL}/my-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: loserCookie },
      });
      const loserInfo = await loserRes.json() as { rating: number };
      expect(loserInfo.rating).toBe(1484);
    } finally {
      aliceSocket.disconnect();
      bobSocket.disconnect();
    }
  });
});
