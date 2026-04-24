---
SECTION_ID: plans.task-6-phase-0-findings
TYPE: plan
STATUS: complete
PRIORITY: high
---

# Task-6 Phase 0 — Fairy-Stockfish chess100 spike findings

Decision: **GO — proceed to Phase 1.** Engine is viable for the guest-vs-computer MVP without forking. All deviations from chess100 rules have practical mitigations that live in the UCI wrapper, not the engine.

## What was verified

- **Engine boots and loads variant via `VariantPath` + `UCI_Variant`.** `fairy-stockfish-nnue.wasm` v1.1.11 from npm. WASM binary ~1.6 MB; needs `wasmBinary` option in Node because undici can't `fetch` absolute fs paths. In the browser it'll load via Emscripten's `locateFile` (default for script-relative URLs) without this workaround.
- **Self-play cross-validation clean.** 10 games × up to 120 plies, every UCI `bestmove` applied through `@chess100com/rules`. After the castling fix (see below) 10/10 games had zero rule rejections.
- **Princess / Prince as custom leapers.** `customPiece1 = c:KAD` and `customPiece2 = s:KAD` (King + Alfil + Dabbabah — 1 or 2 squares in all 8 directions, jumping over pieces). FS's move generation matches our `getPrincessMoves`.

## Issues found and resolved in Phase 0

**Castling notation.** Initial ini used `castlingKingsideFile = j` (meant as rook file) — FS interpreted this as the king's destination, producing an unusual palatial castling where king ended on the rook's square. Symptom: FS emitted and accepted `f1a1` as castling, but the resulting position (king on a1, rook on b1) differed from chess100 (king on c1, rook on d1). Fix: use the right option names.

```ini
castlingKingFile = f
castlingKingsideFile = h              # king destination kingside
castlingQueensideFile = c             # king destination queenside
castlingRookKingsideFile = j          # rook origin kingside (FS j = our k)
castlingRookQueensideFile = a         # rook origin queenside
```

After the fix FS emits castling as `f1c1` / `f1h1` / `f10c10` / `f10h10`, matching our `Position.ts` castling handler exactly. No translation needed.

## Deviations that stay (and how we handle them)

### Prince mechanic (pseudo-royal + extinction)

Our rule: while Prince is alive, the King is not royal — it can be captured, and the Prince upgrades to a King on capture. FS's closest analog:

```ini
extinctionValue = loss
extinctionPieceTypes = kc
extinctionPseudoRoyal = true
```

FS's pseudo-royal semantics are **stricter** than chess100's. In crafted positions where our rules would let the king stay attacked (because the prince is safe and the threatened king is non-royal), FS sometimes returns `bestmove (none)` — it thinks it's mated. This is rare in casual play but possible.

**Mitigation (in engine wrapper):** if FS returns `(none)` for a non-terminal position (our rules report `GameStatus.Ongoing`), the wrapper falls back to a random move from `Position.getAvailableMoves()`. Keeps the engine playing instead of forfeiting.

FS also won't actively sacrifice the king to save material via prince-upgrade. For a learning-oriented guest bot this is desirable — new players shouldn't have to grasp that tactic to start.

### Princess → Queen morphism

Our rule: when a Queen is captured while the owner has a Princess on the board, the Princess instantly becomes a Queen (same move). FS has no equivalent.

**Mitigation (architectural):** drive the engine in **FEN mode**, not move-history mode. Every turn the wrapper sends `position fen <currentFenFromRules>` instead of `position startpos moves ...`. Our rules already carry the morphism in their FEN, so FS always sees the correct piece types even though it doesn't understand the rule. Drawback: FS loses repetition history, so it can't search toward threefold-repetition draws — acceptable for a casual bot.

### Pawn triple-step + multi-square en passant

Our rule: pawns can advance 1–3 squares from the home rank, and en passant captures any square the pawn skipped. Current ini has plain `doubleStep = true` + standard single-square EP. The engine will never push 3 from home, and will miss wider EP captures.

For the guest bot this is fine (the human player can still triple-step and use wide EP — authoritative rules apply on human moves; the bot just plays a slightly restricted subset for itself).

## Final ini for Phase 1

```ini
[chess100:chess]
maxRank = 10
maxFile = 10
startFen = rnbcqksbnr/pppppppppp/10/10/10/10/10/10/PPPPPPPPPP/RNBCQKSBNR w KQkq - 0 1

customPiece1 = c:KAD
customPiece2 = s:KAD

promotionPieceTypes = qrbn

castling = true
castlingKingFile = f
castlingKingsideFile = h
castlingQueensideFile = c
castlingRookKingsideFile = j
castlingRookQueensideFile = a

doubleStep = true
doubleStepRankMin = 2
doubleStepRankMax = 2
enPassant = true

extinctionValue = loss
extinctionPieceTypes = kc
extinctionPseudoRoyal = true
```

## Engine wrapper invariants (for Phase 2–3)

1. **Always drive via FEN, never via startpos+moves.** Sidesteps Princess morphism, simplifies state.
2. **Coordinate mapping: our `k` ↔ FS `j`.** All other file letters identical. Apply on both directions of UCI boundary.
3. **Castling is already in king-to-destination form** — no translation on either direction.
4. **Pawn promotion suffix** (`...q`, `...r`, `...b`, `...n`) maps 1:1 to our `pawnTransform` in `ExtraMoveData`. Default missing suffix → no promotion.
5. **Fallback on `(none)`:** if our rules say the game is still going, pick a random move from `Position.getAvailableMoves()`. Log a warning so we can investigate patterns.
6. **Validate every engine move through our rules before applying.** If rejected, fall back to random legal move. Log for investigation. Should essentially never fire after Phase 0.
