---
SECTION_ID: plans.task-6-guest-bot
TYPE: plan
STATUS: code-complete-awaiting-browser-smoke
PRIORITY: high
---

# Task-6: Guest "Play vs Computer" with Fairy-Stockfish WASM

GOAL: Let unauthenticated visitors play chess100 against an in-browser bot so they can learn the variant before signing up. Engine = Fairy-Stockfish compiled to WASM, running in a Web Worker, driven by our custom `variants.ini`. No backend involvement for bot games.

## Design decisions (locked before start)

- **Engine package:** `fairy-stockfish-nnue.wasm` (the Lichess-maintained npm build). Ships WASM binary + JS glue + Worker entry. Single-threaded fallback works without SharedArrayBuffer; we still set COOP/COEP to unlock multi-threading where available.
- **Integration layer:** a platform-neutral `UciEngine` abstraction in `packages/client-core/src/engine/` exposing `send(cmd)` / `onLine(cb)` / `quit()`. Web impl (Worker-based) lives in `packages/client/src/services/engine/`. Later the backend can add a `child_process` impl for server-side bots — same interface.
- **Rules fidelity:** engine is advisory. User moves always go through `@chess100com/rules` (authoritative). If the engine ever suggests a move our rules reject (edge case around Prince/Princess morphism), we reprompt or pick a random legal move. Kept as a guarded fallback, not a normal path.
- **Coordinate mapping:** our files are `a..k` skipping `j`; FS uses `a..j` for 10 files. One bijective helper (`localToFs` / `fsToLocal`) swaps `k ↔ j` on UCI boundary. FEN piece layout is identical.
- **Variant config:** `variants.ini` lives at `packages/client/src/assets/chess100.ini` (imported as raw string via Vite's `?raw`). If we later add a server-side bot, we'll promote it to a shared location.
- **Guest scope:** bot games are fully local — no DB row, no socket, no Elo. Just a new route and a new store. Auth is untouched.

## Risks to de-risk first (Phase 0)

1. **Prince mechanic.** Can `extinctionValue=-value` + `extinctionPieceTypes=kc` + `extinctionPseudoRoyal=true` approximate "king can be captured while Prince alive, then Prince becomes King"? Test with crafted positions; if the engine makes clearly wrong sacrifices or illegal moves, fall back to: Prince = non-royal regular piece, King = sole royal. Strategic depth lost, legality preserved.
2. **Pawn triple-step.** FS has `doubleStep` + `doubleStepRankMin/Max`, but no triple. Try custom pawn piece with Betza `mfWmfDmfHcfF` or use Grand-Chess-derived rules. Fall back to double-step only if nothing works (small deviation, engine still plays).
3. **Multi-square en passant.** Almost certainly not supported. Accept single-square EP approximation — rules engine still enforces the full rule for the human player; bot just occasionally misses the wider EP window.

Phase 0 gate: if all three approximations are either "works" or "acceptable deviation", proceed. If Prince approximation is unacceptable, pivot scope (Option B: add a minimal fork — new sub-plan).

## Task Checklist

### Phase 0: Spike & de-risk (half-day)
- [ ] Install `fairy-stockfish-nnue.wasm` locally in a throwaway script; confirm UCI loop works
- [ ] Write `chess100.ini` v0 with 10×10 board, Princess/Prince as `customPiece:KAD`, triple-step pawn attempt, extinction+pseudo-royal for Prince
- [ ] Run 50-100 self-play games via UCI to smoke-test: does engine play legal moves? Does it ever crash on chess100 positions? Does it attempt Prince sacrifices that make sense?
- [ ] Report findings; decide: proceed / pivot / simplify

### Phase 1: Variant config
- [ ] Create `packages/client/src/assets/chess100.ini` with final config from Phase 0
- [ ] Add `*.ini` to Vite `assetsInclude` or import via `?raw`
- [ ] Unit test: load ini string, assert it parses (smoke check only, FS does real validation)

### Phase 2: Engine abstraction in client-core
- [ ] `packages/client-core/src/engine/UciEngine.ts` — interface: `send(cmd): void`, `onLine(cb): Unsubscribe`, `quit(): Promise<void>`
- [ ] `packages/client-core/src/engine/protocol.ts` — tiny UCI helpers: `parseBestMove(line)`, `waitFor(engine, predicate)` returning a Promise, `loadVariant(engine, ini)`, `setSkillLevel(engine, level)`
- [ ] `packages/client-core/src/engine/coords.ts` — `localToFsFile(x) / fsToLocalFile(x)`, `localMoveToUci(move) / uciToLocalMove(uci)`. Unit tests.
- [ ] Export from `client-core` index

### Phase 3: WASM engine implementation (client)
- [ ] Add `fairy-stockfish-nnue.wasm` dependency to `packages/client/`
- [ ] `packages/client/src/services/engine/wasmEngine.ts` — implements `UciEngine` via Worker; dynamic `import()` so the 2-3 MB chunk is lazy
- [ ] Factory `createWasmEngine(ini: string): Promise<UciEngine>` — boot worker, load variant, set `UCI_Variant`, return ready engine
- [ ] Ensure WASM + worker assets are emitted by Vite into `/assets/` (content-hashed)

### Phase 4: Bot game store & UI
- [ ] `packages/client/src/stores/bot-game.ts` — `BotGameStore`: holds `rules.Game`, `myColor`, `skillLevel`, `engineThinking`, methods `startNew({ level })` (color randomized internally), `applyUserMove(from, to, extra)`, `resign()`. Drives engine on opponent's turn; applies bot move via `rules.Game.move`. Same `state` shape that `Board.tsx` consumes.
- [ ] Wire into `RootStore` (or standalone since it's guest-scope — simpler: instantiate inside the route component)
- [ ] `packages/client/src/routes/PlayBot.tsx` — new route. 4-step skill selector (labels: Easy / Medium / Hard / Expert → UCI Skill Level 2/8/14/20), "New game" button, board, sidebar with move list + resign. Color is random per game.
- [ ] Route registered in `App.tsx` as `/play-bot` — **no `ProtectedRoute` wrapper** (guest-accessible)
- [ ] Unprotect `/lobby` in `App.tsx` (remove `ProtectedRoute` wrapper). Inside `Lobby.tsx`, branch on `auth.status`:
  - **Guest:** show two CTAs side-by-side — (a) "Sign up / Log in to play humans" → `/register` + `/login`, (b) "Play vs computer (no registration)" → `/play-bot`
  - **Authenticated:** existing queue/lobby UI + a new "Play vs computer" button alongside the queue controls
- [ ] Reuse `Board.tsx` as-is; verify it works with our store's state shape

### Phase 5: COOP/COEP headers (dev + prod)
- [ ] Update `packages/client/nginx.conf`: add `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` to the root location (and `/assets/`)
- [ ] Update `packages/client/vite.config.ts` dev server `headers` with the same two headers so local dev matches prod
- [ ] Verify `/socket.io/` and `/api/` still work (sessions, XHR) under COEP — may need `Cross-Origin-Resource-Policy: same-site` on backend responses. Test with logged-in user playing a PvP game after adding headers.

### Phase 6: i18n
- [ ] Add keys for: PlayBot page title, "Play vs computer" CTA, color picker labels, skill levels, "Engine thinking…", "Bot resigned", new-game button
- [ ] Translate in all 7 locales: `en`, `ru`, `zh`, `hi`, `es`, `fr`, `pt`

### Phase 7: Verify
- [x] `npm run lint` at repo root — clean outside `packages/chessground/` (pre-existing, per CLAUDE.md)
- [x] `npm run check-ts` in `packages/client/`, `packages/client-core/`, `packages/backend/` — all clean
- [x] `npm test` in `packages/rules/` — 12 files / 81 tests / all passed
- [x] Bundle check: main chunk 414 KB (was 402 KB pre-Phase-4 — +12 KB for route/store). Engine chunks (`wasmEngine` 1 KB, `stockfish-worker` 64 KB, `stockfish.wasm` 1636 KB) emit separately and are pulled only when the user presses Start.
- [ ] Manual browser smoke: open `/play-bot` in a real browser (not logged in), play 5-10 moves at medium skill, verify engine responds in <2s per move and moves are legal — see [Phase 5 verification](task-6-phase-5-verification.md) for the full checklist, including COOP/COEP and PvP regression.

## Out of scope (explicitly)

- Server-side bot (for AI opponents in ranked games) — separate future task, will reuse the `UciEngine` abstraction.
- NNUE network for chess100 — defer; classical eval is strong enough for onboarding.
- Bot game persistence / resume — guest games are ephemeral by design.
- Difficulty tuning beyond UCI `Skill Level` — good enough for v1.
- Tutorial / interactive lessons — out of scope; this task only provides the "play and figure it out" mode.
