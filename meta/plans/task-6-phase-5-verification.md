---
SECTION_ID: plans.task-6-phase-5-verification
TYPE: plan
STATUS: pending-verification
PRIORITY: high
---

# Task-6 Phase 5 — COOP/COEP verification checklist

Phase 5 enabled cross-origin isolation by adding `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` to the SPA shell and `/assets/` in both dev (Vite) and prod (nginx). Automated curl confirms the headers emit correctly. The items below need a running stack to verify at runtime.

## Automated (already done)

- [x] `curl -sI http://localhost:4173/` under `vite preview` returns both COOP + COEP.
- [x] `curl -sI http://localhost:4173/assets/stockfish-*.wasm` returns both COOP + COEP + `Content-Type: application/wasm`.
- [x] Client build is clean (`npm run build`, `npm run check-ts`, `npm run lint`).

## Manual — dev stack (needs backend running)

Start backend: `cd packages/backend && docker compose up -d --build`, then `cd packages/client && npm run dev`. Open `http://localhost:5173`.

- [ ] In DevTools Console: `window.crossOriginIsolated === true`. If `false`, COEP is failing for some subresource — Network panel will show which asset blocked.
- [ ] Register a user → ratings hydrate → enter Lobby: `AuthenticatedLobby` renders, queue size visible, leaderboards load. (Verifies `/api/*` + `/socket.io/` same-origin survive COEP.)
- [ ] Join queue from two browser sessions → match starts → play 3+ moves on both sides. Check DevTools Network: `game:state` events flow over WS, no CORP errors. (Verifies Socket.IO + session cookie still work.)
- [ ] Log out → Lobby flips to `GuestLobby` with two CTAs ("Sign up / Log in" + "Play vs computer").
- [ ] Click "Play vs computer" → PlayBot route loads → click "Start" → engine chunk downloads (DevTools Network: `stockfish-*.js`, `stockfish-*.wasm`, `stockfish-worker-*.js`) → bot plays a move within ~1s.
- [ ] Regression: existing ongoing game (from earlier) still replayable → `Game.tsx` uses refactored `<Board game={game} />` correctly.

## Manual — prod stack (docker-compose at repo root)

`docker compose up --build` from repo root. Open `http://localhost:8080`.

- [ ] Same DevTools check: `crossOriginIsolated === true`.
- [ ] All dev-stack checks above, but against the nginx-fronted stack.
- [ ] Hard refresh `/play-bot` — engine chunks load from `/assets/` with the COOP/COEP headers (nginx location `/assets/` path).

## Rollback trigger

If ANY of the following shows up, back off COEP (drop it, keep COOP only — single-threaded WASM still works):

- `crossOriginIsolated === false` AND no obvious fix in Network panel.
- PvP breaks (socket disconnect, session cookie stops flowing, API 4xx on previously-working endpoints).
- Chessground pieces / fonts / other bundled assets fail to load with "NotSameOriginAfterDefaultedToSameOriginByCoep" or similar in Network panel.

To back off: remove the `Cross-Origin-Embedder-Policy` lines from [nginx.conf](packages/client/nginx.conf) and the `Cross-Origin-Embedder-Policy` key from `CROSS_ORIGIN_ISOLATION_HEADERS` in [vite.config.ts](packages/client/vite.config.ts). Keep COOP — it's harmless and gives us some isolation. The engine still runs single-threaded; lose ~2-3x search speed, gain rollout safety.

## Known non-issues

- Proxy locations `/api/` and `/socket.io/` intentionally do NOT carry COOP/COEP — they pass backend responses through untouched. COEP only affects subresource loads INTO the isolated page, and same-origin requests (which is what the browser sees after nginx/Vite proxy) need no CORP.
- CORP `same-origin` on `/assets/` is a belt-and-suspenders addition — same-origin resources don't strictly need it under COEP, but it costs nothing.
