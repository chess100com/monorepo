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
  // carries the session cookie.
  s.core.configureClientCore({
    socketOptions: {
      ...s.core.clientCoreConfig.socketOptions,
      extraHeaders: { Cookie: s.bag.cookie },
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
});
