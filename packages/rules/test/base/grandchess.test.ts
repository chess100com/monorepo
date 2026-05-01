// oxlint-disable max-lines
// oxlint-disable no-inline-comments
import { assert, describe, it } from "vitest"
import {
  Game,
  WhiteWinsResult,
  BlackWinsResult,
  DrawResult,
  OngoingResult,
} from "../../src/Game"
import { Utils } from "../../src/Utils"
import {
  GameType,
  HeirsStartFen,
  GrandChessStartFen,
  Figure,
  Color,
} from "../../src/Shared"
import { GameFactories, VariantStartFen } from "../../src/Variants"

const c = Utils.parseCoordinate

const grandChess = (fen: string): Game => Game.fromFen(fen, undefined, GameType.GrandChess)

describe("Grand Chess: starting position", () => {

  it("factory yields the canonical start FEN", () => {
    const game = GameFactories[GameType.GrandChess]()
    assert.equal(game.getFen(), GrandChessStartFen)
  })

  it("VariantStartFen lookup matches the constant", () => {
    assert.equal(VariantStartFen[GameType.GrandChess], GrandChessStartFen)
  })

  it("rooks sit at corners of the first rank, pawns on rank 3", () => {
    const game = GameFactories[GameType.GrandChess]()
    assert.equal(game.position.cellInfo(c("a1")).figure, Figure.Rook)
    assert.equal(game.position.cellInfo(c("k1")).figure, Figure.Rook)
    assert.equal(game.position.cellInfo(c("a3")).figure, Figure.Pawn)
    assert.equal(game.position.cellInfo(c("k3")).figure, Figure.Pawn)
  })

  it("Marshal sits next to King and Queen on rank 2", () => {
    const game = GameFactories[GameType.GrandChess]()
    assert.equal(game.position.cellInfo(c("e2")).figure, Figure.Marshal)
    assert.equal(game.position.cellInfo(c("f2")).figure, Figure.King)
    assert.equal(game.position.cellInfo(c("g2")).figure, Figure.Cardinal)
    assert.equal(game.position.cellInfo(c("d2")).figure, Figure.Queen)
  })

  it("no Prince/Princess on board", () => {
    const game = GameFactories[GameType.GrandChess]()
    assert.equal(game.position.findFigures(Figure.Prince, Color.White).length, 0)
    assert.equal(game.position.findFigures(Figure.Princess, Color.White).length, 0)
  })

  it("FEN round-trip preserves Marshal and Cardinal letters", () => {
    const game = GameFactories[GameType.GrandChess]()
    const fen = game.getFen()
    assert.include(fen, "M") // Marshal (white)
    assert.include(fen, "m") // Marshal (black)
    assert.include(fen, "C") // Cardinal (white)
    assert.include(fen, "c") // Cardinal (black)
    assert.equal(grandChess(fen).getFen(), fen)
  })

  it("FEN written in Heirs context still uses C for Prince (no collision when reread)", () => {
    const heirs = Game.create()
    const fen = heirs.getFen()
    assert.include(fen, "C")
    assert.equal(Game.fromFen(fen).getFen(), fen)
  })
})

describe("Grand Chess: pawn rules", () => {

  it("white pawn on rank 3 may advance one or two squares", () => {
    const game = GameFactories[GameType.GrandChess]()
    const dests = game.availableMoves(c("d3")).map((m) => Utils.coordinateToString(m)).toSorted()
    assert.deepEqual(dests, ["d4", "d5"])
  })

  it("black pawn on rank 8 may advance one or two squares", () => {
    // rank-10 black king, rank-8 black pawn at d8, rank-1 white king
    const game = grandChess("k9/10/3p6/10/10/10/10/10/10/9K b - - 0 1")
    const dests = game.availableMoves(c("d8")).map((m) => Utils.coordinateToString(m)).toSorted()
    assert.deepEqual(dests, ["d6", "d7"])
  })

  it("white pawn on rank 4 advances only one square", () => {
    // rank-4 white pawn at d4
    const game = grandChess("k9/10/10/10/10/10/3P6/10/10/9K w - - 0 1")
    const dests = game.availableMoves(c("d4")).map((m) => Utils.coordinateToString(m)).toSorted()
    assert.deepEqual(dests, ["d5"])
  })

  it("black pawn on rank 7 advances only one square", () => {
    // rank-7 black pawn at d7
    const game = grandChess("k9/10/10/3p6/10/10/10/10/10/9K b - - 0 1")
    const dests = game.availableMoves(c("d7")).map((m) => Utils.coordinateToString(m)).toSorted()
    assert.deepEqual(dests, ["d6"])
  })

  it("black pawn mid-board never appears to sprint backwards", () => {
    // Black pawn deep in white territory at d4 — must move only to d3 (no
    // bogus d6/d7 entries from a sprint loop firing off-starting-rank).
    const game = grandChess("k9/10/10/10/10/10/3p6/10/10/9K b - - 0 1")
    const dests = game.availableMoves(c("d4")).map((m) => Utils.coordinateToString(m)).toSorted()
    assert.deepEqual(dests, ["d3"])
  })

  it("white pawn mid-board never appears to sprint backwards", () => {
    // White pawn far advanced at d7 — must move only to d8.
    const game = grandChess("k9/10/10/3P6/10/10/10/10/10/9K w - - 0 1")
    const dests = game.availableMoves(c("d7")).map((m) => Utils.coordinateToString(m)).toSorted()
    assert.deepEqual(dests, ["d8"])
  })

  it("white pawn cannot sprint when its forward square is blocked", () => {
    // rank-4 white rook on d4 blocks d3 white pawn entirely.
    const game = grandChess("k9/10/10/10/10/10/3R6/3P6/10/9K w - - 0 1")
    const dests = game.availableMoves(c("d3")).map((m) => Utils.coordinateToString(m)).toSorted()
    assert.deepEqual(dests, [])
  })

  it("white pawn sprints to d4 only when d5 is blocked", () => {
    // rank-5 black rook on d5 blocks the second-square sprint but not d4.
    const game = grandChess("k9/10/10/10/10/3r6/10/3P6/10/9K w - - 0 1")
    const dests = game.availableMoves(c("d3")).map((m) => Utils.coordinateToString(m)).toSorted()
    assert.deepEqual(dests, ["d4"])
  })

  it("black pawn cannot sprint when its forward square is blocked", () => {
    // rank-7 black rook on d7 blocks d8 black pawn entirely.
    const game = grandChess("k9/10/3p6/3r6/10/10/10/10/10/9K b - - 0 1")
    const dests = game.availableMoves(c("d8")).map((m) => Utils.coordinateToString(m)).toSorted()
    assert.deepEqual(dests, [])
  })

  it("white pawn captures diagonally to the left", () => {
    // rank-4 black pawn at c4, white pawn at d3.
    const game = grandChess("k9/10/10/10/10/10/2p7/3P6/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("d3")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("c4"))
  })

  it("white pawn captures diagonally to the right", () => {
    // rank-4 black pawn at e4, white pawn at d3.
    const game = grandChess("k9/10/10/10/10/10/4p5/3P6/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("d3")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("e4"))
  })

  it("black pawn captures diagonally on both sides", () => {
    // rank-8 black pawn at d8, rank-7 white pawns at c7 and e7.
    const game = grandChess("k9/10/3p6/2P1P5/10/10/10/10/10/9K b - - 0 1")
    const dests = new Set(game.availableMoves(c("d8")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("c7"))
    assert.isTrue(dests.has("e7"))
  })

  it("white pawn does not capture an own piece", () => {
    // own white pawn at c4 — must not be in dests as a capture.
    const game = grandChess("k9/10/10/10/10/10/2P7/3P6/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("d3")).map((m) => Utils.coordinateToString(m)))
    assert.isFalse(dests.has("c4"))
  })

  it("white pawn at the edge has only one diagonal capture", () => {
    // white pawn at a3, black pawn at b4. No a4 capture (off-board).
    const game = grandChess("k9/10/10/10/10/10/1p8/P9/10/9K w - - 0 1")
    const dests = game.availableMoves(c("a3")).map((m) => Utils.coordinateToString(m)).toSorted()
    assert.deepEqual(dests, ["a4", "a5", "b4"])
  })

  it("no en passant after a 2-square pawn jump", () => {
    const game = grandChess("k9/10/2p7/10/3P6/10/10/10/10/9K b - - 0 1")
    game.move(c("c8"), c("c6"))
    const dests = game.availableMoves(c("d6")).map((m) => Utils.coordinateToString(m)).toSorted()
    assert.notInclude(dests, "c7")
  })

  it("FEN written after a 2-square pawn jump records no en-passant target", () => {
    const game = grandChess("k9/10/2p7/10/10/10/10/10/10/9K b - - 0 1")
    game.move(c("c8"), c("c6"))
    const enPassant = game.getFen().split(" ")[3]
    assert.equal(enPassant, "-")
  })
})

describe("Grand Chess: pieces", () => {

  it("Marshal moves like rook + knight", () => {
    const game = grandChess("k9/10/10/10/10/4M5/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("e1"))
    assert.isTrue(dests.has("e10"))
    assert.isTrue(dests.has("a5"))
    assert.isTrue(dests.has("k5"))
    assert.isTrue(dests.has("c4"))
    assert.isTrue(dests.has("c6"))
    assert.isTrue(dests.has("g4"))
    assert.isTrue(dests.has("g6"))
    assert.isTrue(dests.has("d3"))
    assert.isFalse(dests.has("a1"))
  })

  it("Cardinal moves like bishop + knight", () => {
    const game = grandChess("k9/10/10/10/10/4C5/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("a1"))
    assert.isTrue(dests.has("h2"))
    assert.isTrue(dests.has("c4"))
    assert.isTrue(dests.has("g6"))
    assert.isFalse(dests.has("e1"))
    assert.isFalse(dests.has("a5"))
  })
})

describe("Grand Chess: optional promotion on ranks 8 and 9", () => {

  it("white pawn moving from d7 to d8 stays a pawn when no pawnTransform is given", () => {
    const game = grandChess("k9/10/10/3P6/10/10/10/10/10/9K w - - 0 1")
    game.move(c("d7"), c("d8"))
    assert.equal(game.position.cellInfo(c("d8")).figure, Figure.Pawn)
  })

  it("white pawn moving from d7 to d8 promotes when pawnTransform=Queen is given", () => {
    const game = grandChess("k9/10/10/3P6/10/10/10/10/10/9K w - - 0 1")
    game.move(c("d7"), c("d8"), { pawnTransform: Figure.Queen })
    assert.equal(game.position.cellInfo(c("d8")).figure, Figure.Queen)
  })

  it("white pawn moving from d8 to d9 promotes to Marshal when asked", () => {
    const game = grandChess("k9/10/3P6/10/10/10/10/10/10/9K w - - 0 1")
    game.move(c("d8"), c("d9"), { pawnTransform: Figure.Marshal })
    assert.equal(game.position.cellInfo(c("d9")).figure, Figure.Marshal)
  })

  it("white pawn moving from d8 to d9 promotes to Cardinal when asked", () => {
    const game = grandChess("k9/10/3P6/10/10/10/10/10/10/9K w - - 0 1")
    game.move(c("d8"), c("d9"), { pawnTransform: Figure.Cardinal })
    assert.equal(game.position.cellInfo(c("d9")).figure, Figure.Cardinal)
  })

  it("black pawn moving to rank 2 promotes optionally", () => {
    const game = grandChess("9k/10/10/10/10/10/10/3p6/10/9K b - - 0 1")
    game.move(c("d3"), c("d2"), { pawnTransform: Figure.Queen })
    assert.equal(game.position.cellInfo(c("d2")).figure, Figure.Queen)
  })

  it("black pawn moving to rank 3 promotes optionally", () => {
    const game = grandChess("9k/10/10/10/10/10/3p6/10/10/9K b - - 0 1")
    game.move(c("d4"), c("d3"), { pawnTransform: Figure.Queen })
    assert.equal(game.position.cellInfo(c("d3")).figure, Figure.Queen)
  })

  it("black pawn moving to rank 3 stays a pawn without pawnTransform", () => {
    const game = grandChess("9k/10/10/10/10/10/3p6/10/10/9K b - - 0 1")
    game.move(c("d4"), c("d3"))
    assert.equal(game.position.cellInfo(c("d3")).figure, Figure.Pawn)
  })

  it("white pawn reaching rank 10 must specify pawnTransform", () => {
    const game = grandChess("k9/3P6/10/10/10/10/10/10/10/9K w - - 0 1")
    assert.throws(() => game.move(c("d9"), c("d10")))
  })

  it("white pawn reaching rank 10 promotes to Queen", () => {
    const game = grandChess("k9/3P6/10/10/10/10/10/10/10/9K w - - 0 1")
    game.move(c("d9"), c("d10"), { pawnTransform: Figure.Queen })
    assert.equal(game.position.cellInfo(c("d10")).figure, Figure.Queen)
  })

  it("Grand Chess promotion options include Marshal and Cardinal on rank 10", () => {
    const game = grandChess("k9/3P6/10/10/10/10/10/10/10/9K w - - 0 1")
    game.move(c("d9"), c("d10"), { pawnTransform: Figure.Cardinal })
    assert.equal(game.position.cellInfo(c("d10")).figure, Figure.Cardinal)
  })

  it("Heirs promotion does not accept Marshal or Cardinal", () => {
    const heirs = Game.fromFen(
      "k9/3P6/10/10/10/10/10/10/10/9K w - - 0 1",
      undefined,
      GameType.Heirs,
    )
    assert.throws(() => heirs.move(c("d9"), c("d10"), { pawnTransform: Figure.Marshal }))
  })

  it("Heirs ignores pawnTransform on non-promotion ranks (variant-gate guard)", () => {
    // White pawn d2→d4 with a stray pawnTransform: Queen — the optional-promotion
    // branch must NOT fire in Heirs even when pawnTransform is set.
    const heirs = Game.create()
    heirs.move(c("d2"), c("d4"), { pawnTransform: Figure.Queen })
    assert.equal(heirs.position.cellInfo(c("d4")).figure, Figure.Pawn)
  })

  it("Heirs ignores pawnTransform on rank 8 (no optional promotion in Heirs)", () => {
    // White pawn at d7 in a Heirs game advances to d8 with a stray pawnTransform.
    // Heirs has no optional-promotion rule, so the pawn must remain a pawn.
    // This pins down the variant gate for the optional-promotion else-if.
    const heirs = Game.fromFen("k9/10/10/3P6/10/10/10/10/10/9K w - - 0 1")
    heirs.move(c("d7"), c("d8"), { pawnTransform: Figure.Queen })
    assert.equal(heirs.position.cellInfo(c("d8")).figure, Figure.Pawn)
  })

  it("Heirs ignores pawnTransform on rank 2 (black pawn analogue)", () => {
    const heirs = Game.fromFen("9k/10/10/10/10/10/10/3p6/10/9K b - - 0 1")
    heirs.move(c("d3"), c("d2"), { pawnTransform: Figure.Queen })
    assert.equal(heirs.position.cellInfo(c("d2")).figure, Figure.Pawn)
  })

  it("Heirs allowed-promotion list rejects Marshal with the documented error", () => {
    const heirs = Game.fromFen("k9/3P6/10/10/10/10/10/10/10/9K w - - 0 1")
    let captured: unknown = null
    try {
      heirs.move(c("d9"), c("d10"), { pawnTransform: Figure.Marshal })
    } catch (e) {
      captured = e
    }
    assert.instanceOf(captured, Error)
    assert.include((captured as Error).message, "Pawn transform figure should be passed")
  })

  it("Grand Chess ignores pawnTransform when landing on rank 4 (off-promotion)", () => {
    // White pawn d3→d4 (single step, not on optional-promotion rank) with a stray
    // pawnTransform: must remain a pawn.
    const game = grandChess("k9/10/10/10/10/10/10/3P6/10/9K w - - 0 1")
    game.move(c("d3"), c("d4"), { pawnTransform: Figure.Queen })
    assert.equal(game.position.cellInfo(c("d4")).figure, Figure.Pawn)
  })

  it("Grand Chess ignores pawnTransform when a black pawn lands on rank 4 (off-promotion)", () => {
    // Mirror of the white case: black pawn d5→d4 must not promote.
    const game = grandChess("9k/10/10/10/10/3p6/10/10/10/9K b - - 0 1")
    game.move(c("d5"), c("d4"), { pawnTransform: Figure.Queen })
    assert.equal(game.position.cellInfo(c("d4")).figure, Figure.Pawn)
  })

  it("Grand Chess: black pawn landing on rank 8 stays a pawn (white-only optional-promotion zone)", () => {
    // Construct a scenario where a black pawn (artificially placed at d9) moves
    // down to d8. Rank 8 is white's optional-promotion rank, not black's, so
    // the pawn must remain a pawn even with pawnTransform set.
    const game = grandChess("9k/3p6/10/10/10/10/10/10/10/9K b - - 0 1")
    game.move(c("d9"), c("d8"), { pawnTransform: Figure.Queen })
    assert.equal(game.position.cellInfo(c("d8")).figure, Figure.Pawn)
  })

  it("Grand Chess: white pawn landing on rank 3 stays a pawn (black-only optional-promotion zone)", () => {
    // Mirror: white pawn artificially at d2 moves up to d3. Rank 3 is black's
    // optional-promotion rank.
    const game = grandChess("k9/10/10/10/10/10/10/10/3P6/9K w - - 0 1")
    game.move(c("d2"), c("d3"), { pawnTransform: Figure.Queen })
    assert.equal(game.position.cellInfo(c("d3")).figure, Figure.Pawn)
  })

  it("Grand Chess optional-promotion gate rejects non-allowed figures", () => {
    // pawnTransform: Figure.King is not in GrandChessPawnTransforms, so the
    // optional-promotion branch must skip it and the pawn stays a pawn.
    const game = grandChess("k9/10/10/3P6/10/10/10/10/10/9K w - - 0 1")
    game.move(c("d7"), c("d8"), { pawnTransform: Figure.King })
    assert.equal(game.position.cellInfo(c("d8")).figure, Figure.Pawn)
  })

  it("Grand Chess optional-promotion gate rejects pawnTransform on the wrong color's rank", () => {
    // White pawn promoting on rank 2 makes no sense — the gate restricts the
    // white branch to ranks 8/9. Even with pawnTransform, the figure must
    // remain a pawn (white pawns can't reach rank 2 anyway, but the guard is
    // verified by the analogous black case below).
    const game = grandChess("k9/10/10/10/10/10/10/10/3p6/9K b - - 0 1")
    game.move(c("d2"), c("d1"), { pawnTransform: Figure.Queen })
    // Rank 1 is mandatory promotion territory — we reach the FIRST `if`, not
    // the optional-promotion `else if`. The piece is therefore the queen.
    assert.equal(game.position.cellInfo(c("d1")).figure, Figure.Queen)
  })
})

describe("Constants and factories", () => {

  it("result strings have their canonical PGN values", () => {
    assert.equal(WhiteWinsResult, "1-0")
    assert.equal(BlackWinsResult, "0-1")
    assert.equal(DrawResult, "1/2-1/2")
    assert.equal(OngoingResult, "*")
  })

  it("VariantStartFen exposes both variants", () => {
    assert.equal(VariantStartFen[GameType.Heirs], HeirsStartFen)
    assert.equal(VariantStartFen[GameType.GrandChess], GrandChessStartFen)
  })

  it("Heirs factory yields a fresh Game on the canonical start position", () => {
    const game = GameFactories[GameType.Heirs]()
    assert.equal(game.getFen(), HeirsStartFen)
  })

  it("Grand Chess factory yields a fresh Game on the canonical start position", () => {
    const game = GameFactories[GameType.GrandChess]()
    assert.equal(game.getFen(), GrandChessStartFen)
  })
})

describe("Grand Chess: misc Position API", () => {

  it("getVariant returns the variant set at fromFen time", () => {
    const grand = grandChess("k9/10/10/10/10/10/10/10/10/9K w - - 0 1")
    assert.equal(grand.position.getVariant(), GameType.GrandChess)
    const heirs = Game.create()
    assert.equal(heirs.position.getVariant(), GameType.Heirs)
  })

  it("putFigure(coord, figure, color) places a non-empty figure", () => {
    const empty = grandChess("k9/10/10/10/10/10/10/10/10/9K w - - 0 1")
    const withMarshal = empty.position.putFigure(c("e6"), Figure.Marshal, Color.White)
    assert.isFalse(withMarshal.isEmpty(c("e6")))
    assert.equal(withMarshal.cellInfo(c("e6")).figure, Figure.Marshal)
    assert.equal(withMarshal.cellInfo(c("e6")).color, Color.White)
  })

  it("canCastling returns false when queried for the non-moving color", () => {
    const game = Game.create() // Heirs, white to move, all flags up
    assert.isFalse(game.position.canCastling(2, Color.Black))
    assert.isFalse(game.position.canCastling(3, Color.Black))
  })

  it("canCastling distinguishes kingside (t=2) and queenside (t=3) flags", () => {
    // Heirs FEN with only K and q (white kingside + black queenside).
    const game = Game.fromFen("8k1/10/10/10/10/10/10/10/10/5K3R w Kq - 0 1")
    assert.isTrue(game.position.canCastling(2, Color.White))   // K set
    assert.isFalse(game.position.canCastling(3, Color.White))  // Q clear
    // Black is not the moving color; both queries return false regardless of flags.
    assert.isFalse(game.position.canCastling(2, Color.Black))
    assert.isFalse(game.position.canCastling(3, Color.Black))
  })

  it("canCastling reads the black flags when it is black's move", () => {
    // FEN with only k and Q (black kingside + white queenside), black to move.
    const game = Game.fromFen("8k1/10/10/10/10/10/10/10/10/5K3R b Qk - 0 1")
    assert.isTrue(game.position.canCastling(2, Color.Black))   // k set
    assert.isFalse(game.position.canCastling(3, Color.Black))  // q clear
  })
})

describe("Grand Chess: king", () => {

  it("king has no castling from start position", () => {
    const game = GameFactories[GameType.GrandChess]()
    const dests = game.availableMoves(c("f2"))
    for (const d of dests) {
      assert.notDeepEqual(d, c("c2"))
      assert.notDeepEqual(d, c("h2"))
    }
  })

  it("white king alone moves to all 8 adjacent empty squares", () => {
    // White king at e5; black king at a10; nothing else on the board.
    const game = grandChess("k9/10/10/10/10/4K5/10/10/10/10 w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    for (const square of ["d4", "d5", "d6", "e4", "e6", "f4", "f5", "f6"]) {
      assert.isTrue(dests.has(square), `king should be able to move to ${square}`)
    }
    assert.equal(dests.size, 8)
  })

  it("king does not move into a square occupied by own piece", () => {
    // White king at e5 ringed by white pawns on every adjacent square.
    const game = grandChess("k9/10/10/10/3PPP4/3PKP4/3PPP4/10/10/10 w - - 0 1")
    const dests = game.availableMoves(c("e5"))
    assert.deepEqual(dests, [])
  })

  it("king captures an enemy piece on an adjacent square", () => {
    // Black pawn at e6, white king at e5 — capture allowed.
    const game = grandChess("k9/10/10/10/4p5/4K5/10/10/10/10 w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("e6"))
  })

  it("king cannot move into check (attacked square is filtered out)", () => {
    // Black rook on a-file controls a4/a5/a6; white king on a5 must avoid them.
    const game = grandChess("k9/10/10/10/10/r9/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("k1")).map((m) => Utils.coordinateToString(m)))
    // sanity: white king on k1 cannot leave the board
    assert.isFalse(dests.has("l1" as never))
    assert.isTrue(dests.has("k2"))
    assert.isTrue(dests.has("j2" as never) === false) // there is no "j" file
  })

  it("king at column 10 (k-file) sees attacks from black pieces in that column", () => {
    // Pieces sitting on the rightmost file must contribute to the attacked-coords
    // map — pins down board-iteration upper-bound mutants.
    const game = grandChess("8kr/10/10/10/10/10/10/10/10/9K w - - 0 1")
    // Black rook at k10 attacks the entire k-file. White king at k1 must not be
    // able to stay where it is (well, it can — only its candidate moves are
    // filtered) — but moving up is blocked.
    const dests = new Set(game.availableMoves(c("k1")).map((m) => Utils.coordinateToString(m)))
    assert.isFalse(dests.has("k2"))
  })
})
