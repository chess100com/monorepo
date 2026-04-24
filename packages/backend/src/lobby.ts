import { GameType } from '@chess100com/rules';
import { redisClient } from './redis-client';

// Dedicated connection for WATCH/MULTI transactions. It must not be shared
// with other code paths (session store, pub/sub, simple JSON.GET/SET) because
// (a) any command interleaved between MULTI and EXEC gets pulled into the
// transaction on the same connection, and (b) EXEC clears all WATCH state on
// the connection, so two concurrent WATCH/MULTI sequences on one connection
// would let the second one commit unconditionally.
const txClient = redisClient.duplicate();

const queueKey = (type: GameType): string => `lobby:queue:${type}`;
const activeKey = (userId: number): string => `lobby:active:${userId}`;
const ALL_VARIANTS: GameType[] = Object.values(GameType);

// In-process mutex: serializes all mutateJson calls so only one WATCH/MULTI
// sequence holds txClient at a time. Required for single-instance correctness;
// multi-instance deployments would additionally need distributed locking,
// which MVP doesn't target.
let mutateChain: Promise<unknown> = Promise.resolve();
const noop = (): void => {};

interface QueueDoc { members: number[]; }
interface ActiveDoc { sockets: string[]; }

export interface MatchPair {
  whiteUserId: number;
  blackUserId: number;
  type: GameType;
}

export interface EnqueueResult {
  added: boolean;
  size: number;
  matched: MatchPair | null;
}

export interface LeaveResult {
  removed: boolean;
  size: number;
}

export type QueueSizes = Record<GameType, number>;

/**
 * Atomic read-modify-write over a RedisJSON document. WATCH+MULTI gives us
 * optimistic concurrency: if anyone else mutates the same key between our
 * read and our write, EXEC returns null and we retry. No Lua involved.
 */
async function mutateJson<T, R>(
  key: string,
  empty: T,
  fn: (cur: T) => { next: T; result: R },
): Promise<R> {
  const prev = mutateChain;
  let done: () => void = noop;
  mutateChain = new Promise<void>(resolve => { done = resolve; });
  try {
    await prev;
    const maxAttempts = 20;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // oxlint-disable-next-line no-await-in-loop
      await txClient.watch(key);
      // oxlint-disable-next-line no-await-in-loop
      const raw = await txClient.call('JSON.GET', key) as string | null;
      const cur = raw ? JSON.parse(raw) as T : empty;
      const { next, result } = fn(cur);
      const multi = txClient.multi();
      multi.call('JSON.SET', key, '$', JSON.stringify(next));
      // oxlint-disable-next-line no-await-in-loop
      const res = await multi.exec();
      if (res !== null) return result;
    }
    throw new Error(`mutateJson: too much contention on ${key}`);
  } finally {
    done();
  }
}

export function enqueue(userId: number, type: GameType): Promise<EnqueueResult> {
  return mutateJson<QueueDoc, EnqueueResult>(queueKey(type), { members: [] }, (cur) => {
    const alreadyIn = cur.members.includes(userId);
    const members = alreadyIn ? [...cur.members] : [...cur.members, userId];
    let matched: MatchPair | null = null;
    if (members.length >= 2) {
      const a = members.shift() as number;
      const b = members.shift() as number;
      const aIsWhite = Math.random() < 0.5;
      matched = {
        whiteUserId: aIsWhite ? a : b,
        blackUserId: aIsWhite ? b : a,
        type,
      };
    }
    return {
      next: { members },
      result: { added: !alreadyIn, size: members.length, matched },
    };
  });
}

export function leaveQueue(userId: number, type: GameType): Promise<LeaveResult> {
  return mutateJson<QueueDoc, LeaveResult>(queueKey(type), { members: [] }, (cur) => {
    const idx = cur.members.indexOf(userId);
    if (idx === -1) {
      return { next: cur, result: { removed: false, size: cur.members.length } };
    }
    const members = [...cur.members.slice(0, idx), ...cur.members.slice(idx + 1)];
    return { next: { members }, result: { removed: true, size: members.length } };
  });
}

/**
 * Pulls `userId` out of every variant queue. Used on socket-last-disconnect
 * and as the cleanup step of `switchQueue`. Returns true if the user was in
 * any queue; a user is normally in only one queue at a time, so most of the
 * per-variant `leaveQueue` calls are no-ops.
 */
export async function leaveAllQueues(userId: number): Promise<boolean> {
  let anyRemoved = false;
  for (const type of ALL_VARIANTS) {
    // oxlint-disable-next-line no-await-in-loop
    const res = await leaveQueue(userId, type);
    if (res.removed) anyRemoved = true;
  }
  return anyRemoved;
}

/**
 * Moves `userId` into the queue for `type`, first removing them from any
 * other variant queue they might be in. The switch is not cross-key atomic,
 * but there is a single mutex around all mutateJson work so the steps are
 * serialized with respect to other lobby operations.
 */
export async function switchQueue(userId: number, type: GameType): Promise<EnqueueResult> {
  for (const other of ALL_VARIANTS) {
    if (other !== type) {
      // oxlint-disable-next-line no-await-in-loop
      await leaveQueue(userId, other);
    }
  }
  return enqueue(userId, type);
}

export async function queueSize(type: GameType): Promise<number> {
  const raw = await redisClient.call('JSON.GET', queueKey(type)) as string | null;
  if (!raw) return 0;
  return (JSON.parse(raw) as QueueDoc).members.length;
}

export async function getAllQueueSizes(): Promise<QueueSizes> {
  const out = {} as QueueSizes;
  for (const type of ALL_VARIANTS) {
    // oxlint-disable-next-line no-await-in-loop
    out[type] = await queueSize(type);
  }
  return out;
}

export async function registerSocket(userId: number, socketId: string): Promise<void> {
  await mutateJson<ActiveDoc, boolean>(activeKey(userId), { sockets: [] }, (cur) => {
    const sockets = cur.sockets.includes(socketId) ? cur.sockets : [...cur.sockets, socketId];
    return { next: { sockets }, result: true };
  });
}

/**
 * On the user's last live socket, deletes the presence record and pulls them
 * out of every variant queue. Returns true if this was indeed the last
 * socket (so the caller can broadcast updated queue sizes), false otherwise.
 */
export async function unregisterSocket(
  userId: number,
  socketId: string,
): Promise<boolean> {
  const key = activeKey(userId);
  const nowEmpty = await mutateJson<ActiveDoc, boolean>(key, { sockets: [] }, (cur) => {
    const sockets = cur.sockets.filter(s => s !== socketId);
    return { next: { sockets }, result: sockets.length === 0 };
  });
  if (!nowEmpty) return false;
  await redisClient.del(key);
  await leaveAllQueues(userId);
  return true;
}

/**
 * Wipes lobby state carried over from a prior process. Safe for single-instance
 * deployments: any remembered socket id is dead after a restart, so the queue
 * would hold ghost users otherwise. Not safe for multi-instance — it would wipe
 * sibling state.
 */
export async function resetLobby(): Promise<void> {
  const queueKeys = ALL_VARIANTS.map(t => queueKey(t));
  await redisClient.del(...queueKeys);
  const stream = redisClient.scanStream({ match: 'lobby:active:*', count: 100 });
  for await (const keys of stream) {
    if (keys.length > 0) await redisClient.del(...keys);
  }
}
