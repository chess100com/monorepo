# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

npm workspaces monorepo for a 10×10 chess variant ("chess100"). Packages under [packages/](packages/):

- [packages/rules/](packages/rules/) — pure TypeScript game engine for two 10×10 chess variants on a shared board geometry. Exports `Game`, `Position`, `GameStatus`, `GameType`, shared types, `StartFen` (Heirs alias), `HeirsStartFen`, `GrandChessStartFen`, `GameFactories`, `VariantStartFen`. No runtime deps. FENs always use the standard **6 space-separated fields** — [Position.setFen()](packages/rules/src/Position.ts) throws if `splitSpaces.length !== 6`. The `Game` class tracks terminal states (`GameStatus.Checkmate`/`Stalemate`/`ThreefoldRepetition`/`FiftyMoveRule`/`InsufficientMaterial`/`Resignation`/`Agreement`) and blocks `move()` after the game ends.
  - **Heirs** (`GameType.Heirs`) — the original variant. Two extra pieces: `Prince` (FEN letter `C`) and `Princess` (`S`). Start FEN: `rnbcqksbnr/pppppppppp/10/...`. Castling enabled. Pawns sprint 1–3 squares from rank 2/9 with en passant. When a Queen is captured while the opponent has a Princess, the Princess is immediately promoted to a Queen in the same move; when the King is captured while the opponent has a Prince, the Prince becomes the King and the game continues.
  - **Grand Chess** (`GameType.GrandChess`) — Christian Freeling's 1984 variant. Two extra pieces: `Marshal` (Rook+Knight, FEN letter `M`) and `Cardinal` (Bishop+Knight, FEN letter `C`). Start FEN: `r8r/1nbqmkcbn1/pppppppppp/10/.../1NBQMKCBN1/R8R w - - 0 1` — rooks at corners of rank 1/10, the rest of the back rank on rank 2/9 (slot order `N B Q M K C B N`, `a` and `k` empty), pawns on rank 3/8. No castling, no en passant. Pawns sprint 1 or 2 squares from rank 3/8. Optional pawn promotion on ranks 8/9, mandatory on rank 10; Grand Chess accepts a wider promotion set (`GrandChessPawnTransforms`: Queen, Marshal, Cardinal, Rook, Bishop, Knight). No Prince/Princess specials.
  - **Letter `C` is variant-overloaded** — Heirs reads `C` as Prince, Grand Chess as Cardinal. Disambiguation lives in `FigureNamesByVariant` in [Shared.ts](packages/rules/src/Shared.ts); `Position` carries its variant and consults the matching map. Always pass the variant to `Position.fromFen(fen, variant)` / `Game.fromFen(fen, metadata, variant)` — both default to `GameType.Heirs` for backwards-compat with old call sites.
  - **Source layout** under [packages/rules/src/](packages/rules/src/): variant-shared piece moves in [common/](packages/rules/src/common/) (Bishop, Knight, Rook, Queen); Heirs-specific in [heirs/](packages/rules/src/heirs/) (Pawn with sprint+en-passant, King with castling, Princess — used for both Prince and Princess); Grand Chess-specific in [grandchess/](packages/rules/src/grandchess/) (Pawn, King without castling, Marshal, Cardinal). When adding a new variant, follow the same pattern: add an entry to `GameType` and `FigureNamesByVariant`, drop variant-specific move generators under `src/<variant>/`, register a factory in [Variants.ts](packages/rules/src/Variants.ts), and branch in `Position.baseAvailableMovesFromCoord` / `Position.move`.
- [packages/backend/](packages/backend/) — Express + Socket.IO server. Postgres via TypeORM for `User` and `Game` entities. Redis-backed `express-session` shared between HTTP and Socket.IO (see [index.ts](packages/backend/src/index.ts) — `io.engine.use(sessionMiddleware)`). Depends on `@chess100com/rules` (workspace) for move validation. Runs on **Node 24** (tsconfig target `ES2023`).
- [packages/client/](packages/client/) — Vite + React 18 + TypeScript + MobX 6 + react-router v6 SPA. Depends on `@chess100com/rules` (for client-side legal-move dests) and `@chess100com/chessground` (workspace) for board rendering. Talks to backend via `/api/*` (HTTP) and `/socket.io/` (WebSocket). Uses `credentials: 'include'` on fetch so the shared session cookie flows through.
- [packages/chessground/](packages/chessground/) — vendored fork of lichess-org/chessground adapted for the 10×10 board. Scoped as `@chess100com/chessground` to avoid colliding with the upstream `chessground` package on npm (upstream README inside the directory still shows the unscoped import — ignore that, consumers use the scoped name). Independent toolchain (ESM, eslint, prettier, esbuild). Keep its local conventions; do not apply repo-root tooling here. Its `prepare` script recompiles TS during `npm install`, so copying the whole directory (including `src/`) is required before install in Docker.
- [packages/external-mock/](packages/external-mock/) — standalone Express HTTP mock of external services used by tests (mail first, more to come). Scoped as `@chess100com/external-mock`. No persistence — emails are held in an in-memory array that resets on process restart. Listens on `PORT` (default `4000`). Runnable via `npm start` (ts-node); the `src/index.ts` module also exports `app`, `httpServer`, `resetMails`, `getMails`, and the `Mail` type, so tests can embed the app via supertest instead of hitting the network. Shipped in both the root and backend-test compose stacks; tests call it from the host via `EXTERNAL_MOCK_URL` (default `http://localhost:4001` in the backend test setup, mapped from container port `4000`).

Tasks and plans live outside code: [tasks/](tasks/) holds user-authored task briefs, [meta/plans/](meta/plans/) holds per-task plans, [meta/rules/](meta/rules/) holds repo conventions.

## Commands

Root:
- `npm run lint` — oxlint over the whole repo (config: [.oxlintrc.json](.oxlintrc.json)). `scripts/*.js` is ignored. All four packages are linted by the same config.
- `npm run lint-fix` — oxlint with `--fix`.
- `docker compose up --build` (from repo root) — brings up the full stack (client on port 8080, backend, postgres with `pgdata` volume, redis) using [docker-compose.yml](docker-compose.yml). Client nginx serves the built SPA and proxies `/api/*` → `backend:3000/*` (prefix stripped) and `/socket.io/` (with WS upgrade). Intended for local end-to-end runs, not dev — there is no HMR.

[packages/rules/](packages/rules/):
- `npm test` — `vitest run ./test` (unit tests, no infra needed).
- `npm run test-watch` — vitest watch mode.
- `npm run stryker` — mutation testing.

[packages/backend/](packages/backend/):
- `npm test` — runs [scripts/setup-tests.js](packages/backend/scripts/setup-tests.js): `docker compose up -d --build` (using the backend-local [docker-compose.yml](packages/backend/docker-compose.yml) — context is repo root so `@chess100com/rules` is reachable), polls `/healthcheck` on port 3001, runs `vitest run ./test`, then `docker compose down`. **The server under test runs inside Docker, not via ts-node.** Tests target `http://localhost:${TEST_PORT}`.
- `npm start` — `ts-node src/index.ts` (local dev only; requires Postgres + Redis reachable).
- `npm run check-ts` — `tsc --noEmit`.
- `npm run migration:generate` / `migration:run` — TypeORM CLI against [src/data-source.ts](packages/backend/src/data-source.ts). Migrations live in [src/migration/](packages/backend/src/migration/) and are auto-run on startup via `AppDataSource.runMigrations()` in [index.ts](packages/backend/src/index.ts). **Naming convention:** files are `YYYY-MM-DD-hh-mm-ss-<Name>.ts` and class names end with `YYYYMMDDHHMMSS` matching the file date (e.g. file `2026-04-24-10-15-30-AddFoo.ts` → class `AddFoo20260424101530`). TypeORM's `migration:generate` produces the legacy `<unix-ms>-<Name>.ts` + `<Name><unix-ms>` — rename the file and the class's trailing digits to the date-time format after generating. The trailing digits are required: TypeORM does `substr(-13)` on the class name to extract the sort/tracking timestamp, so the suffix must stay purely numeric and long enough (14 digits of YYYYMMDDHHMMSS leaves 13 parseable chars after the leading century digit is sliced off, and sorts correctly as long as all dates share the same millennium).

[packages/client/](packages/client/):
- `npm run dev` — Vite dev server on port 5173. Proxies `/api` (rewriting the prefix away) and `/socket.io` to `VITE_BACKEND_URL` (default `http://localhost:3001`). Pair it with a running backend (e.g. `cd packages/backend && docker compose up -d --build`) for HMR dev.
- `npm run build` — `tsc -b && vite build` → `dist/` (gitignored).
- `npm run check-ts` — `tsc --noEmit`.
- `npm run preview` — serve the built `dist/` locally.

[packages/chessground/](packages/chessground/):
- `npm run compile` — `tsc --sourceMap --declaration`.
- `npm run bundle` — esbuild ESM bundle to `dist/chessground.min.js`.
- `npm run dist` — compile then bundle.
- `npm run lint` — eslint (separate from root oxlint).
- `npm run format` / `check-format` — prettier.

[packages/external-mock/](packages/external-mock/):
- `npm start` — `ts-node src/index.ts`. Listens on `PORT` (default `4000`).
- `npm run check-ts` — `tsc --noEmit`.
- Endpoints: `GET /healthcheck` → `OK`; `POST /mail/send` with JSON `{subject, to, body}` (all required strings) stores an entry and returns `{ok:true}` — rejects with `400` if any field is missing or non-string; `GET /mail/get-last` returns `{mails: Mail[]}` with up to 10 most-recent mails, newest first, where `Mail = {subject, to, body, sentAt}` and `sentAt` is an ISO timestamp set at send time.
- Adding a new mock service: create `src/<service>.ts` that exports an Express `Router` (plus optional store-reset helpers) and mount it in [src/index.ts](packages/external-mock/src/index.ts) alongside `mailRouter`. Keep storage in-memory and export a `reset<Foo>()` helper so tests can isolate runs.
- Dockerized in both compose files. Backend reaches it at `http://external-mock:4000/mail/send` via `SENDMAIL_URL`. In the backend test compose the container port `4000` is mapped to host `${EXTERNAL_MOCK_PORT:-4001}` so tests can read mails back from the host (see `EXTERNAL_MOCK_URL` in [scripts/setup-tests.js](packages/backend/scripts/setup-tests.js)).

### Running a single test

- rules: `npx vitest run ./test/base/pawn.test.ts` (or `-t "test name"`).
- backend: single tests still need the docker stack up. Either run `npm test` (full flow) or start `docker compose up -d --build` manually inside `packages/backend/`, then `TEST_PORT=3001 npx vitest run ./test/backend.test.ts -t "pattern"`, then `docker compose down`.

## After any task (from [meta/rules/after-task.md](meta/rules/after-task.md))

In the package directory you changed, run and fix errors from:
1. `npm test` (where defined — rules and backend)
2. `npm run lint` (root; the 500+ errors in `packages/chessground/` are pre-existing, ignore them)
3. `npm run check-ts` (where defined — backend and client)

## Keep CLAUDE.md current

After any **structural** change to the repo, update this file in the same commit. The bar is: a future agent reading only CLAUDE.md should still get an accurate map of the codebase. Triggers that count as "structural":
- A new package, a new top-level folder under [packages/<pkg>/src/](packages/), or a meaningful renaming/reshuffle of existing folders.
- A new game variant, piece, or rule branch in the rules engine.
- A new database column, migration, or persisted field that other code reads.
- A new socket event, API route, or change to an existing event/route's payload shape.
- A new convention, lint rule, or non-obvious gotcha you had to learn the hard way.
- A change to how a package is built, started, tested, or deployed (Docker, scripts, env vars).

Pure bug fixes, dependency bumps, copy tweaks, and additive code that follows existing patterns don't need a CLAUDE.md update. When in doubt, add a one-liner — concise notes are cheap, missing context is expensive.

## Conventions worth knowing

### Imports

- **Relative imports have no extension** in `.ts` / `.tsx` files (e.g. `import { foo } from './bar';`, not `'./bar.js'`). Every package's module resolution (`commonjs` / `node` / `bundler`) resolves extensionless specifiers. VSCode's [.vscode/settings.json](.vscode/settings.json) sets `"js/ts.preferences.importModuleSpecifierEnding": "minimal"` so auto-imports follow suit. This applies across all packages except `packages/chessground/` — it's an ESM package compiled to `dist/` by plain `tsc`, so it keeps `.js` specifiers (Node ESM needs them at runtime).
- Package-name imports (`@chess100com/rules`, `express`, …) stay as-is. Asset/CSS/JSON imports keep their actual extension (`'./styles.css'`, `'./data.json'`).

### Rules engine

- Coordinates are 1-indexed on both axes (`x: 1..10` → files `a..k` skipping `j`, `y: 1..10`). See `CoordinateInterface` in [Shared.ts](packages/rules/src/Shared.ts).
- `Position` is treated as immutable-ish: `position.move(...)` returns a new `Position`; `Game.move` replaces `this.position`. Many expensive computations are memoized in private fields (`allAvailableMoves`, `baseAvailableMoves`, `attackedCoords`) — clone/reset these if you add mutation paths.
- `Position` carries its variant in a private `variant` field; `clone()` copies it. `getVariant()` exposes it to the per-piece move generators (e.g. Pawn branches on it for starting rank / en passant). Don't reach for `GameType.Heirs` as a hardcoded default in new code — accept and forward the active variant.
- Halfmove clock (`semiMove` in FEN field 5) resets on pawn moves **and captures** — both together.
- `Position.getRepetitionKey()` returns the first 4 FEN fields (everything except halfmove + fullmove counters) — that's the key used for threefold-repetition counting in `Game`.
- `Game.refreshStatus()` is called after construction and after every move; priority is checkmate > stalemate > threefold > 50-move > insufficient-material. Resignation/agreement are set by `resign(color)`/`agreeDraw()` and cannot be derived from move history — consumers persisting game state must carry `status`/`result` separately.
- `getHeirsKingMoves` skips the castling block when `color !== position.getMovingColor()` to avoid a recursive-caching pitfall in `getAttackedCoords`. Grand Chess uses `getGrandChessKingMoves` which has no castling logic at all.
- Heirs-only specials (Princess→Queen on Queen capture, Prince→King on King capture, "single legal move that's a King-takes-Queen but Princess covers" → checkmate) live in `Position.move` and `Position.buildAvailableMoves` and are gated behind `this.variant !== GameType.GrandChess`. Adding a new variant means deciding which of these to keep — don't assume.
- Stryker directives (`// Stryker disable next-line ...`) are intentional — don't strip them.
- oxlint has `max-lines-per-function: 300`, `max-nested-callbacks: 5`, `max-depth: 4`, `max-lines` (file-level) at 300. [Position.ts](packages/rules/src/Position.ts) top-of-file disables `max-lines` and `complexity`; the variant-specific Pawn files keep `// oxlint-disable complexity` because of the branching diagonal/forward/sprint logic. Other files shouldn't need to.
- Don't add `// @ts-check` to `.js` files ([meta/rules/js-files.md](meta/rules/js-files.md)).

### Backend

- Backend sessions: the same `sessionMiddleware` is mounted on Express and on `io.engine`. To read a user from a socket, cast `socket.request as express.Request` and read `req.session.userId` (see [index.ts](packages/backend/src/index.ts) — extracted as `getUserId(socket)`).
- DTOs: `class-transformer`'s `plainToInstance` runs before `class-validator`'s `validate` — keep that order when adding routes.
- `User.username_unique` must be the lowercased username and is the unique constraint for case-insensitive collisions; `email` is independently unique.
- The `Game` entity ([src/entity/Game.ts](packages/backend/src/entity/Game.ts)) uses a UUID primary key (`@PrimaryGeneratedColumn('uuid')`, served by Postgres `gen_random_uuid()`). Stores `type` (`GameType`, defaults to `Heirs`), `startFen`, full `moves` as `jsonb`, and `status`/`result`/`finishedAt`. FKs to `user.id` for white/black.
- **Rehydration:** persisted games are restored by `RulesGame.fromFen(startFen, undefined, row.type)` then replaying every entry in `moves[]` (see `rebuildRulesGame` in [src/game-runtime.ts](packages/backend/src/game-runtime.ts)). The variant **must** be passed — without it the rules engine defaults to Heirs and FEN parsing for Grand Chess pieces (`M`, `C`-as-Cardinal) goes wrong. The replay is required so the rules engine's threefold-repetition history is correct. Don't try to shortcut by only loading the latest FEN.
- `GameStateSnapshot.type` carries the variant out to the client so the board (Chessground) and the client-side move-validator (`computeDests`/`isPromotion`) can configure themselves the same way the server did.
- **State-broadcast source of truth:** `buildGameState` reads `status`/`result` from the DB row, not from the rebuilt rules game. The rules game only sees moves, so it would report `Ongoing` for resigned/agreed games — be careful if you add new terminal states on the `Game` row.
- **Server is authoritative for moves.** Socket move handlers in [src/game-handlers.ts](packages/backend/src/game-handlers.ts) always validate through `rules.Game.move()` before persisting and broadcasting `game:state` to the `game:<id>` room. Errors go only to the requesting socket as `game:error`.
- **Matchmaking:** [src/lobby.ts](packages/backend/src/lobby.ts) is an in-memory singleton FIFO queue. Two users queued → random color assignment → emits `match` event → handler in [index.ts](packages/backend/src/index.ts) creates the DB row and emits `game:start` to both `user:<id>` rooms. Queue state is in-memory only; restarting the backend loses queued players but not games.
- **Draw offers:** in-memory `Map<gameId, {from: PlayerColor}>` in [src/game-runtime.ts](packages/backend/src/game-runtime.ts). Cleared on accept, decline, or next move. Not persisted — survives a disconnected player reconnecting (same process lifetime) but not a server restart.
- **Outbound email:** POSTed to `SENDMAIL_URL` (an HTTP endpoint accepting `{to, subject, body}` — `@chess100com/external-mock` in dev/tests). The helper lives in [src/mailer.ts](packages/backend/src/mailer.ts) and uses Node 24's global `fetch`; it throws on non-2xx so routes surface failures as 500. Templates are compiled once and cached (`hbs.handlebars.compile`) — files sit in [packages/backend/templates/](packages/backend/templates/) with `.hbs` extension and are copied into the Docker image. These are **plain-text** emails, so use triple-stash `{{{url}}}` whenever you emit a URL or anything containing `=`/`&` — the default `{{...}}` HTML-escapes and will break links in mail clients that don't decode entities.
- **Password reset** ([src/routes/password.ts](packages/backend/src/routes/password.ts)): `POST /password/request-reset` always responds `{ok:true}` regardless of whether the email exists (no account enumeration); when it does exist, a `randomUUID` code is stored in Redis at `pwreset:<code>` with TTL 1h, and a link to `${API_PUBLIC_URL}password/reset?code=...` is emailed. The `GET /password/reset?code=...` handler consumes the code (single-use — deleted before password work so it can't be replayed), generates a new `base64url` password, bcrypts it onto the user, emails the plaintext, and returns a plain-text `text/plain` 200. `API_PUBLIC_URL` is the user-facing base for these links — point it at whatever origin clicks on the mail will actually reach (in backend tests: `http://localhost:3001/`; in the root stack: the nginx origin via `API_PUBLIC_URL` env, default `http://localhost:${PORT}/api/`).

### Socket events

Client → server: `ping`, `my-info`, `lobby:subscribe` / `lobby:unsubscribe`, `queue:join` / `queue:leave`, `game:join`, `move`, `resign`, `draw:offer` / `draw:accept` / `draw:decline`.

Server → client: `pong`, `my-info`, `lobby:state`, `queue:joined` / `queue:left` / `queue:error`, `game:start`, `game:state` (broadcast to game room), `game:error` (per-socket).

Payload shapes and parsers live in [src/game-runtime.ts](packages/backend/src/game-runtime.ts) (`parseMovePayload`, `parseGameIdPayload`) and [src/lobby.ts](packages/backend/src/lobby.ts).

### Client

- `@chess100com/rules` and `@chess100com/chessground` are workspace deps. Both Dockerfile stages and Vite resolve them via the workspace symlinks in root `node_modules`. Deep imports like `@chess100com/chessground/api`, `@chess100com/chessground/types`, and `@chess100com/chessground/assets/chessground.base.css` are routed by the package's `exports` map.
- Stores live in [src/stores/](packages/client/src/stores/) and are composed in `RootStore`, exposed via React Context ([stores/context.tsx](packages/client/src/stores/context.tsx)). `GameStore` receives `getMyUsername` as a callback from `RootStore` to avoid a direct `AuthStore` dependency (which would cause a construction cycle).
- The socket singleton ([src/services/socket.ts](packages/client/src/services/socket.ts)) auto-connects on first access and is disconnected by `AuthStore.logout()`; the next authenticated page regenerates it.
- The board component ([src/components/Board.tsx](packages/client/src/components/Board.tsx)) mounts Chessground once via `useRef` and re-applies full config on every `GameStore.state` change. Legal `dests` are computed locally via `Position.fromFen(fen, variant).getAvailableMoves()` — the server still validates. On `game:error` the component snaps the board back to the authoritative FEN. The variant comes from `state.type` and is forwarded both to `computeDests`/`isPromotion` (rules engine) and to Chessground via the `variant: 'heirs' | 'grandchess'` config field — without it Chessground misparses the `c`/`C` letter for Grand Chess games.
- Pawn promotion is auto-Queen in MVP (chessground doesn't emit a promotion choice; see `isPromotion` + `AutoPawnPromotion` in [src/services/chess.ts](packages/client/src/services/chess.ts)). Grand Chess's optional 8th/9th-rank promotion is supported by the rules engine but not yet exposed in the UI — `isPromotion` only triggers on the mandatory last rank.
- File/rank keys for Chessground are from the alphabet `abcdefghik` (10 letters, skipping `j`) and ranks `1..10` — `coordToKey({x:10,y:10}) === 'k10'`.
- **Chessground variant plumbing:** chessground's [src/types.ts](packages/chessground/src/types.ts) declares `type Variant = 'heirs' | 'grandchess'` and the role list includes `marshal` and `cardinal`. [src/fen.ts](packages/chessground/src/fen.ts) holds a per-variant letter→role map (`rolesByVariant`); `read(fen, variant)` consults it, defaulting to Heirs. Sprites for Marshal/Cardinal live in [assets/chessground.cburnett.css](packages/chessground/assets/chessground.cburnett.css) (one rule per piece+color, base64-embedded SVG — same pattern as the existing pieces).
- **i18n:** `i18next` + `react-i18next`. Translation resources are TS dicts at [packages/client/src/services/locales/](packages/client/src/services/locales/) (one file per language) — don't inline user-facing strings in components, add a key and `t('…')`. Text with embedded markup (`<strong>`, `<code>`, …) uses `<Trans>` with numbered `components={{ 1: <strong /> }}` — the key must use the same numbers (e.g. `<1>…</1>`). The active language lives in `I18nStore` ([packages/client-core/src/stores/i18n.ts](packages/client-core/src/stores/i18n.ts)) — `client-core` is platform-agnostic and must not import `i18next`, so the store exposes `attachApplier(apply, initial)` that the web app wires up in [main.tsx](packages/client/src/main.tsx) with `applyLanguage` from [src/services/i18n.ts](packages/client/src/services/i18n.ts). `applyLanguage` does three things: `i18n.changeLanguage`, `localStorage['chess100.lang']`, `document.documentElement.lang`. Supported languages are `SUPPORTED_LANGUAGES` (`en`, `ru`, `zh`, `hi`, `es`, `fr`, `pt`); default is `en`. The language switcher is a `<select>` in [Layout.tsx](packages/client/src/components/Layout.tsx) bound to `i18nStore.language`. Native-name labels (flag emoji + endonym) live in `LANGUAGE_LABELS` in [client-core/src/stores/i18n.ts](packages/client-core/src/stores/i18n.ts) — kept outside per-locale dicts because they're identical in every translation, and rendered directly from the constant in the switcher (not via `t(…)`).
- **Lazy locale loading.** Locale files are **not** bundled into the main chunk. [services/i18n.ts](packages/client/src/services/i18n.ts) registers a custom i18next `BackendModule` that resolves each locale via `import.meta.glob('./locales/*.ts')` — Vite emits one chunk per file, fetched on first use. [main.tsx](packages/client/src/main.tsx) awaits `initI18n(initial)` before calling `createRoot().render()`, so first paint already has translations in place; subsequent `changeLanguage()` calls run async with `useSuspense: false`, keeping the old dict rendered until the new chunk lands (no flash of untranslated content). Adding a new language: create `src/services/locales/<code>.ts` with a default-exported dict (the glob picks it up automatically), add `<code>` to `SUPPORTED_LANGUAGES` and `LANGUAGE_LABELS` in client-core — no change to `i18n.ts` is needed.

### Build / dev URLs

- Vite dev: `http://localhost:5173`, proxies `/api` (prefix stripped) and `/socket.io` to `VITE_BACKEND_URL` (default `http://localhost:3001`). Backend must be running separately.
- Full-stack compose: `http://localhost:8080` (override with `PORT=...`). Single origin, nginx fronts both. Sessions work because the cookie path is `/` and all traffic is one origin.
