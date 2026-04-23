// oxlint-disable max-lines
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { AsyncLocalStorage } from 'node:async_hooks';
import { faker } from '@faker-js/faker';
import type * as ClientCoreNS from '@chess100com/client-core';

const BASE_URL = `http://localhost:${process.env.TEST_PORT ?? 3000}`;

// Each "session" gets its own cookie bag. A global fetch wrapper reads/writes
// the bag via AsyncLocalStorage so client-core's `apiFetch` — which uses the
// global `fetch` — can transparently carry session cookies across calls
// without modifying the library. Node's built-in fetch has no cookie jar.
interface CookieBag { cookie: string }
const cookieStore = new AsyncLocalStorage<CookieBag>();
const realFetch = globalThis.fetch.bind(globalThis);

beforeAll(() => {
  globalThis.fetch = async (input, init) => {
    const bag = cookieStore.getStore();
    if (!bag) return realFetch(input, init);
    const headers = new Headers(init?.headers);
    if (bag.cookie) headers.set('Cookie', bag.cookie);
    const res = await realFetch(input, { ...init, headers });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) bag.cookie = setCookie;
    return res;
  };
});

afterAll(() => {
  globalThis.fetch = realFetch;
});

type ClientCore = typeof ClientCoreNS;

interface Session {
  core: ClientCore;
  root: InstanceType<ClientCore['RootStore']>;
  bag: CookieBag;
  username: string;
}

// Every session loads its own fresh copy of `@chess100com/client-core`. The
// library holds module-level singletons (`clientCoreConfig`, the socket in
// `getSocket()`), so two concurrent users in one process need two module
// instances. `vi.resetModules()` clears the cache; the next dynamic import
// re-executes the whole dependency graph, giving each session an isolated
// config and socket.
async function createSession(): Promise<Session> {
  vi.resetModules();
  const core = await import('@chess100com/client-core');
  const bag: CookieBag = { cookie: '' };
  core.configureClientCore({
    // Backend is reached directly in tests (no nginx /api prefix stripping).
    apiBase: BASE_URL,
    socketUrl: BASE_URL,
    socketOptions: { withCredentials: true, autoConnect: true },
  });
  const root = new core.RootStore();
  return { core, root, bag, username: '' };
}

function randomUsername(): string {
  return faker.internet.username().replaceAll(/[^a-zA-Z\-_]/g, '_') || 'user';
}

async function registerWithCore(s: Session): Promise<void> {
  const username = randomUsername();
  const email = faker.internet.email();
  const password = faker.internet.password({ length: 10 });

  const ok = await cookieStore.run(s.bag, () =>
    s.root.auth.register(username, email, password));
  if (!ok) throw new Error(s.root.auth.error ?? 'register failed');

  // The cookie is only available after /login. Fold it into socketOptions so
  // that the socket handshake (which happens on the first getSocket() call)
  // carries the session cookie. Lowercase `cookie` is deliberate: engine.io-
  // client mutates `extraHeaders` on the first handshake by wrapping a string
  // `cookie` into an array (for its node-side cookie-jar logic). An uppercase
  // `Cookie` is left as-is and would get clobbered by an empty `cookie: []`
  // sibling on reconnect; the lowercase form survives that mutation cleanly.
  s.core.configureClientCore({
    socketOptions: {
      ...s.core.clientCoreConfig.socketOptions,
      extraHeaders: { cookie: s.bag.cookie },
    },
  });
  s.username = username;
}

// Cross-module MobX reactions are unreliable (each session has its own mobx
// instance via resetModules), so tests poll observables directly instead of
// using `when()`. Reading an observable value works from any module.
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

async function waitUntil(pred: () => boolean, timeoutMs = 5000): Promise<void> {
  const start = Date.now();
  while (!pred()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`waitUntil timed out after ${timeoutMs}ms`);
    }
    // oxlint-disable-next-line no-await-in-loop
    await sleep(25);
  }
}

function cleanupSession(s: Session): void {
  s.root.game.reset();
  s.root.lobby.reset();
  s.core.disconnectSocket();
}

describe('client-core end-to-end via backend container', () => {
  it('registers a user and hydrates auth state', async () => {
    const session = await createSession();
    try {
      await registerWithCore(session);

      expect(session.root.auth.status).toBe('authenticated');
      expect(session.root.auth.user?.username).toBe(session.username);
      expect(session.root.auth.error).toBeNull();
    } finally {
      cleanupSession(session);
    }
  });

  it('runs the full register → lobby → match → play → resign flow', async () => {
    const alice = await createSession();
    const bob = await createSession();

    try {
      await registerWithCore(alice);
      await registerWithCore(bob);

      // Enter the lobby. subscribe() emits 'lobby:subscribe' and the server
      // answers with the current queueSizes snapshot.
      alice.root.lobby.subscribe();
      bob.root.lobby.subscribe();

      await waitUntil(() => Object.keys(alice.root.lobby.queueSizes).length > 0);
      await waitUntil(() => Object.keys(bob.root.lobby.queueSizes).length > 0);
      expect(alice.root.lobby.queueSizes.heirs).toBeGreaterThanOrEqual(0);

      // Default selectedType is GameType.Heirs — the only shipped variant.
      alice.root.lobby.joinQueue();
      bob.root.lobby.joinQueue();

      // Both sockets receive a game:start broadcast; the lobby store stores it
      // in `matchedGame`.
      await waitUntil(() => alice.root.lobby.matchedGame !== null);
      await waitUntil(() => bob.root.lobby.matchedGame !== null);

      const aMatch = alice.root.lobby.matchedGame;
      const bMatch = bob.root.lobby.matchedGame;
      if (!aMatch || !bMatch) throw new Error('matchedGame missing after waitUntil');
      expect(aMatch.gameId).toBe(bMatch.gameId);
      expect(aMatch.color).not.toBe(bMatch.color);
      expect(['white', 'black']).toContain(aMatch.color);

      // Load game metadata (HTTP, needs cookie) and join the game room.
      await Promise.all([
        cookieStore.run(alice.bag, () => alice.root.game.init(aMatch.gameId)),
        cookieStore.run(bob.bag, () => bob.root.game.init(bMatch.gameId)),
      ]);

      await waitUntil(() => alice.root.game.state !== null);
      await waitUntil(() => bob.root.game.state !== null);

      expect(alice.root.game.state?.gameId).toBe(aMatch.gameId);
      expect(alice.root.game.state?.moves).toEqual([]);
      expect(alice.root.game.state?.turn).toBe('white');
      expect(alice.root.game.state?.status).toBe('ongoing');
      expect(alice.root.game.myColor).toBe(aMatch.color);

      const white = aMatch.color === 'white' ? alice : bob;
      const black = aMatch.color === 'white' ? bob : alice;

      expect(white.root.game.isMyTurn).toBe(true);
      expect(black.root.game.isMyTurn).toBe(false);

      // a2-a3: the classic one-square pawn push on the 10x10 board.
      white.root.game.move({ x: 1, y: 2 }, { x: 1, y: 3 });

      await waitUntil(() => (white.root.game.state?.moves.length ?? 0) === 1);
      await waitUntil(() => (black.root.game.state?.moves.length ?? 0) === 1);

      expect(white.root.game.state?.moves[0].alias).toBe('a2-a3');
      expect(white.root.game.state?.turn).toBe('black');
      expect(black.root.game.state?.turn).toBe('black');
      expect(black.root.game.isMyTurn).toBe(true);

      // Black resigns; both sides observe the terminal state.
      black.root.game.resign();

      await waitUntil(() => white.root.game.state?.status === 'resignation');
      await waitUntil(() => black.root.game.state?.status === 'resignation');

      expect(white.root.game.state?.result).toBe('1-0');
      expect(black.root.game.state?.result).toBe('1-0');
    } finally {
      cleanupSession(alice);
      cleanupSession(bob);
    }
  });

  it('reconnects mid-game: state rehydrates and a move from the new socket goes through', async () => {
    const alice = await createSession();
    const bob = await createSession();

    try {
      await registerWithCore(alice);
      await registerWithCore(bob);

      alice.root.lobby.subscribe();
      bob.root.lobby.subscribe();
      alice.root.lobby.joinQueue();
      bob.root.lobby.joinQueue();

      await waitUntil(() => alice.root.lobby.matchedGame !== null);
      await waitUntil(() => bob.root.lobby.matchedGame !== null);

      const aMatch = alice.root.lobby.matchedGame;
      const bMatch = bob.root.lobby.matchedGame;
      if (!aMatch || !bMatch) throw new Error('matchedGame missing after waitUntil');

      await Promise.all([
        cookieStore.run(alice.bag, () => alice.root.game.init(aMatch.gameId)),
        cookieStore.run(bob.bag, () => bob.root.game.init(bMatch.gameId)),
      ]);

      await waitUntil(() => alice.root.game.state !== null);
      await waitUntil(() => bob.root.game.state !== null);

      const white = aMatch.color === 'white' ? alice : bob;
      const black = aMatch.color === 'white' ? bob : alice;

      // white plays a2-a3 — it's now black's turn
      white.root.game.move({ x: 1, y: 2 }, { x: 1, y: 3 });
      await waitUntil(() => (black.root.game.state?.moves.length ?? 0) === 1);

      const fenBeforeReconnect = black.root.game.state?.currentFen;
      expect(fenBeforeReconnect).toBeTruthy();
      expect(black.root.game.isMyTurn).toBe(true);

      // Simulate a network drop on black's side. disconnectSocket() tears
      // down the module-level singleton; init() below re-creates it via
      // getSocket() and rejoins the game room. socket.io-client mutates the
      // options object with internal bookkeeping (transports, cookie jar,
      // parsed URL parts); spreading that back in confuses the next connect,
      // so we hand init() a clean options object.
      black.core.disconnectSocket();
      black.root.game.reset();
      expect(black.root.game.state).toBeNull();
      black.core.configureClientCore({
        socketOptions: {
          withCredentials: true,
          autoConnect: true,
          forceNew: true,
          extraHeaders: { cookie: black.bag.cookie },
        },
      });

      await cookieStore.run(black.bag, () => black.root.game.init(bMatch.gameId));
      await waitUntil(() => black.root.game.state !== null);

      expect(black.root.game.state?.gameId).toBe(bMatch.gameId);
      expect(black.root.game.state?.moves.length).toBe(1);
      expect(black.root.game.state?.currentFen).toBe(fenBeforeReconnect);
      expect(black.root.game.state?.turn).toBe('black');
      expect(black.root.game.state?.status).toBe('ongoing');
      expect(black.root.game.myColor).toBe('black');
      expect(black.root.game.isMyTurn).toBe(true);

      // The reconnected store can drive a move; both sides observe the result.
      black.root.game.move({ x: 1, y: 9 }, { x: 1, y: 8 });

      await waitUntil(() => (white.root.game.state?.moves.length ?? 0) === 2);
      await waitUntil(() => (black.root.game.state?.moves.length ?? 0) === 2);

      expect(black.root.game.state?.moves[1].alias).toBe('a9-a8');
      expect(black.root.game.state?.turn).toBe('white');
      expect(black.root.game.state?.currentFen).not.toBe(fenBeforeReconnect);
      expect(white.root.game.state?.currentFen).toBe(black.root.game.state?.currentFen);
      expect(white.root.game.isMyTurn).toBe(true);
    } finally {
      cleanupSession(alice);
      cleanupSession(bob);
    }
  });

  it('auto-reconnect after transport drop: same socket survives and state resumes', async () => {
    const alice = await createSession();
    const bob = await createSession();

    try {
      await registerWithCore(alice);
      await registerWithCore(bob);

      alice.root.lobby.subscribe();
      bob.root.lobby.subscribe();
      alice.root.lobby.joinQueue();
      bob.root.lobby.joinQueue();

      await waitUntil(() => alice.root.lobby.matchedGame !== null);
      await waitUntil(() => bob.root.lobby.matchedGame !== null);

      const aMatch = alice.root.lobby.matchedGame;
      const bMatch = bob.root.lobby.matchedGame;
      if (!aMatch || !bMatch) throw new Error('matchedGame missing after waitUntil');

      await Promise.all([
        cookieStore.run(alice.bag, () => alice.root.game.init(aMatch.gameId)),
        cookieStore.run(bob.bag, () => bob.root.game.init(bMatch.gameId)),
      ]);
      await waitUntil(() => alice.root.game.state !== null);
      await waitUntil(() => bob.root.game.state !== null);

      const white = aMatch.color === 'white' ? alice : bob;
      const black = aMatch.color === 'white' ? bob : alice;

      white.root.game.move({ x: 1, y: 2 }, { x: 1, y: 3 });
      await waitUntil(() => (black.root.game.state?.moves.length ?? 0) === 1);

      const blackSocket = black.core.getSocket();
      const sidBefore = blackSocket.id;
      expect(blackSocket.connected).toBe(true);

      // Yank the engine transport without touching the Socket singleton or
      // calling socket.disconnect() — this simulates a TCP drop (wifi blip).
      // socket.io-client's Manager keeps skipReconnect=false and auto-reconnects
      // using the opts captured when io() was first called.
      blackSocket.io.engine.close();
      await waitUntil(() => !blackSocket.connected);
      await waitUntil(() => blackSocket.connected, 10_000);

      // Same Socket instance (same listeners wired up in GameStore.init still
      // point at it); server assigned a fresh sid after the reconnect.
      expect(black.core.getSocket()).toBe(blackSocket);
      expect(blackSocket.id).not.toBe(sidBefore);

      // The server drops room memberships when the underlying socket closes,
      // so the client has to re-emit game:join to re-enter game:<id> before
      // subsequent broadcasts reach it. Wait for the join response so the
      // server has definitely registered the new socket in the room by the
      // time we trigger the next broadcast.
      const rejoined = new Promise<void>(resolve => {
        blackSocket.once('game:state', () => resolve());
      });
      blackSocket.emit('game:join', { gameId: bMatch.gameId });
      await rejoined;

      // Black plays from the reconnected socket — the move reaches the server
      // and the server broadcast lands on both sides through the in-room
      // delivery (black is back in the room; white never left it).
      black.root.game.move({ x: 1, y: 9 }, { x: 1, y: 8 });
      await waitUntil(() => (white.root.game.state?.moves.length ?? 0) === 2);
      await waitUntil(() => (black.root.game.state?.moves.length ?? 0) === 2);

      expect(black.root.game.state?.moves[1].alias).toBe('a9-a8');
      expect(black.root.game.state?.turn).toBe('white');
      expect(white.root.game.state?.currentFen).toBe(black.root.game.state?.currentFen);

      // And the opponent's broadcast still reaches the reconnected listener.
      white.root.game.move({ x: 2, y: 2 }, { x: 2, y: 3 });
      await waitUntil(() => (black.root.game.state?.moves.length ?? 0) === 3);

      expect(black.root.game.state?.moves[2].alias).toBe('b2-b3');
      expect(black.root.game.state?.turn).toBe('black');
      expect(black.root.game.isMyTurn).toBe(true);
    } finally {
      cleanupSession(alice);
      cleanupSession(bob);
    }
  });
});
