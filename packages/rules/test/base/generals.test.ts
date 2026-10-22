// oxlint-disable max-lines
// oxlint-disable no-inline-comments
import { assert, describe, it } from "vitest"
import { Game } from "../../src/Game"
import { Utils } from "../../src/Utils"
import { GameType, GeneralsStartFen, Figure, Color } from "../../src/Shared"
import { Position } from "../../src/Position"
import { GameFactories, VariantStartFen } from "../../src/Variants"
import { parseMove } from "../util"

const c = Utils.parseCoordinate

const generals = (fen: string): Game => Game.fromFen(fen, undefined, GameType.Generals)

const generalsPos = (fen: string): Position => Position.fromFen(fen, GameType.Generals)

describe("Generals: starting position", () => {

  it("factory yields the canonical start FEN", () => {
    const game = GameFactories[GameType.Generals]()
    assert.equal(game.getFen(), GeneralsStartFen)
  })

  it("VariantStartFen lookup matches the constant", () => {
    assert.equal(VariantStartFen[GameType.Generals], GeneralsStartFen)
  })

  it("standard 8 traditional pieces plus 2 new pieces fill the back rank", () => {
    const game = GameFactories[GameType.Generals]()
    assert.equal(game.position.cellInfo(c("a1")).figure, Figure.Rook)
    assert.equal(game.position.cellInfo(c("b1")).figure, Figure.Knight)
    assert.equal(game.position.cellInfo(c("c1")).figure, Figure.Bishop)
    assert.equal(game.position.cellInfo(c("d1")).figure, Figure.Jester)
    assert.equal(game.position.cellInfo(c("e1")).figure, Figure.King)
    assert.equal(game.position.cellInfo(c("f1")).figure, Figure.Queen)
    assert.equal(game.position.cellInfo(c("g1")).figure, Figure.General)
    assert.equal(game.position.cellInfo(c("h1")).figure, Figure.Bishop)
    assert.equal(game.position.cellInfo(c("i1")).figure, Figure.Knight)
    assert.equal(game.position.cellInfo(c("k1")).figure, Figure.Rook)
  })

  it("pawns fill the second and ninth ranks", () => {
    const game = GameFactories[GameType.Generals]()
    for (const file of "abcdefghik") {
      assert.equal(game.position.cellInfo(c(`${file}2`)).figure, Figure.Pawn)
      assert.equal(game.position.cellInfo(c(`${file}9`)).figure, Figure.Pawn)
    }
  })

  it("FEN round-trips with G for General and C for Jester", () => {
    const game = GameFactories[GameType.Generals]()
    const fen = game.getFen()
    assert.include(fen, "G") // General (white)
    assert.include(fen, "g") // General (black)
    assert.include(fen, "C") // Jester (white) — letter borrowed from "clown"
    assert.include(fen, "c") // Jester (black)
    assert.equal(generals(fen).getFen(), fen)
  })

  it("no Heirs Prince/Princess, no Grand Chess Marshal/Cardinal", () => {
    const game = GameFactories[GameType.Generals]()
    assert.equal(game.position.findFigures(Figure.Prince, Color.White).length, 0)
    assert.equal(game.position.findFigures(Figure.Princess, Color.White).length, 0)
    assert.equal(game.position.findFigures(Figure.Marshal, Color.White).length, 0)
    assert.equal(game.position.findFigures(Figure.Cardinal, Color.White).length, 0)
  })
})

describe("Generals: pawn rules", () => {

  it("white pawn on rank 2 may advance one, two or three squares", () => {
    const game = GameFactories[GameType.Generals]()
    const dests = game.availableMoves(c("d2")).map((m) => Utils.coordinateToString(m)).toSorted()
    assert.deepEqual(dests, ["d3", "d4", "d5"])
  })

  it("black pawn on rank 9 may advance one, two or three squares", () => {
    const fen = "k9/3p6/10/10/10/10/10/10/10/9K b - - 0 1"
    const game = generals(fen)
    const dests = game.availableMoves(c("d9")).map((m) => Utils.coordinateToString(m)).toSorted()
    assert.deepEqual(dests, ["d6", "d7", "d8"])
  })

  it("pawn captures diagonally forward", () => {
    // Black pawn at c3 (one diagonal forward from white d2). Set up an empty
    // position with kings + relevant pieces.
    const game = generals("k9/10/10/10/10/10/10/2p7/3P6/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("d2")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("c3"))
  })

  it("white pawn off starting rank has only one forward move (no sprint)", () => {
    // White pawn at d5 — off the starting rank, so it must only advance one
    // square to d6 (no sprint to d7/d8, no bogus backward moves).
    const game = generals("k9/10/10/10/10/3P6/10/10/10/9K w - - 0 1")
    const dests = game.availableMoves(c("d5")).map((m) => Utils.coordinateToString(m)).toSorted()
    assert.deepEqual(dests, ["d6"])
  })

  it("black pawn off starting rank has only one forward move (no sprint)", () => {
    const game = generals("9k/10/10/10/3p6/10/10/10/10/9K b - - 0 1")
    const dests = game.availableMoves(c("d6")).map((m) => Utils.coordinateToString(m)).toSorted()
    assert.deepEqual(dests, ["d5"])
  })

  it("white pawn off starting rank does not capture on diagonals where there is no enemy", () => {
    const game = generals("k9/10/10/10/10/3P6/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("d5")).map((m) => Utils.coordinateToString(m)))
    assert.isFalse(dests.has("c6"))
    assert.isFalse(dests.has("e6"))
  })

  it("white pawn off starting rank does not advance into an occupied square", () => {
    // Own white piece at d6 blocks the forward push; pawn at d5 has no moves.
    const game = generals("k9/10/10/10/3P6/3P6/10/10/10/9K w - - 0 1")
    const dests = game.availableMoves(c("d5")).map((m) => Utils.coordinateToString(m)).toSorted()
    assert.deepEqual(dests, [])
  })

  it("white pawn does not capture an own piece diagonally", () => {
    const game = generals("k9/10/10/10/2P1P5/3P6/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("d5")).map((m) => Utils.coordinateToString(m)))
    assert.isFalse(dests.has("c6"))
    assert.isFalse(dests.has("e6"))
  })

  it("white pawn at the edge file has only one diagonal capture target", () => {
    // White pawn at a2; black piece at b3.
    const game = generals("k9/10/10/10/10/10/10/1p8/P9/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("a2")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("b3"))
  })

  it("white pawn cannot sprint past a blocker on rank 3", () => {
    // White pawn at d2, white rook at d3 (own piece blocks d3 entirely).
    const game = generals("k9/10/10/10/10/10/10/3R6/3P6/9K w - - 0 1")
    const dests = game.availableMoves(c("d2")).map((m) => Utils.coordinateToString(m)).toSorted()
    assert.deepEqual(dests, [])
  })

  it("white pawn sprints to d3 only when d4 is blocked", () => {
    // Black rook at d4 blocks the second-square sprint but not d3.
    const game = generals("k9/10/10/10/10/10/3r6/10/3P6/9K w - - 0 1")
    const dests = game.availableMoves(c("d2")).map((m) => Utils.coordinateToString(m)).toSorted()
    assert.deepEqual(dests, ["d3"])
  })
})

describe("Generals: King and castling", () => {

  it("ordinary king has eight unit-direction moves on an open board", () => {
    // Off the Royal vertical the king is "ordinary" (1-square moves).
    const game = generals("k9/10/10/10/10/3K6/10/10/10/10 w - - 0 1")
    const dests = new Set(game.availableMoves(c("d5")).map((m) => Utils.coordinateToString(m)))
    for (const sq of ["c4", "c5", "c6", "d4", "d6", "e4", "e5", "e6"]) {
      assert.isTrue(dests.has(sq), `king should be able to move to ${sq}`)
    }
    assert.equal(dests.size, 8)
  })

  it("ordinary king does not move into a square occupied by an own piece", () => {
    const game = generals("k9/10/10/10/3P6/3K6/10/10/10/10 w - - 0 1")
    const dests = new Set(game.availableMoves(c("d5")).map((m) => Utils.coordinateToString(m)))
    assert.isFalse(dests.has("d6"))
  })

  it("ordinary king captures an adjacent enemy piece", () => {
    const game = generals("k9/10/10/10/3p6/3K6/10/10/10/10 w - - 0 1")
    const dests = new Set(game.availableMoves(c("d5")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("d6"))
  })

  it("short castle: king e1→b1 and rook a1→c1", () => {
    // Empty back rank apart from the king at e1 and rook at a1.
    const game = generals("4k5/10/10/10/10/10/10/10/10/R3K5 w Qq - 0 1")
    assert.isTrue(game.canMove(c("e1"), c("b1")))
    game.move(c("e1"), c("b1"))
    assert.equal(game.position.cellInfo(c("b1")).figure, Figure.King)
    assert.equal(game.position.cellInfo(c("c1")).figure, Figure.Rook)
    assert.isTrue(game.position.cellInfo(c("a1")).empty)
    assert.isTrue(game.position.cellInfo(c("e1")).empty)
  })

  it("long castle: king e1→h1 and rook k1→g1", () => {
    const game = generals("4k5/10/10/10/10/10/10/10/10/4K4R w Kk - 0 1")
    assert.isTrue(game.canMove(c("e1"), c("h1")))
    game.move(c("e1"), c("h1"))
    assert.equal(game.position.cellInfo(c("h1")).figure, Figure.King)
    assert.equal(game.position.cellInfo(c("g1")).figure, Figure.Rook)
    assert.isTrue(game.position.cellInfo(c("k1")).empty)
    assert.isTrue(game.position.cellInfo(c("e1")).empty)
  })

  it("short castle blocked by an attacked square between king and destination", () => {
    // Rook sitting on c10 attacks the c-file, so king cannot pass through c1.
    const game = generals("2r1k5/10/10/10/10/10/10/10/10/R3K5 w Qq - 0 1")
    assert.isFalse(game.canMove(c("e1"), c("b1")))
  })

  it("long castle blocked by a piece on the king's path", () => {
    // Black bishop on f1 sits in the king's path during long castle.
    const game = generals("4k5/10/10/10/10/10/10/10/10/4Kb3R w Kk - 0 1")
    assert.isFalse(game.canMove(c("e1"), c("h1")))
  })

  it("white king moving clears only the white castling flags", () => {
    const game = generals("4k5/10/10/10/10/10/10/10/10/R3K4R w KQkq - 0 1")
    game.move(c("e1"), c("e2"))
    const castling = game.getFen().split(" ")[2]
    assert.notInclude(castling, "K")
    assert.notInclude(castling, "Q")
    assert.include(castling, "k")
    assert.include(castling, "q")
  })

  it("white rook on a1 moving clears the Q flag (a-side)", () => {
    const game = generals("4k5/10/10/10/10/10/10/10/10/R3K4R w KQkq - 0 1")
    game.move(c("a1"), c("a3"))
    const castling = game.getFen().split(" ")[2]
    assert.notInclude(castling, "Q")
    assert.include(castling, "K")
  })

  it("white rook on k1 moving clears the K flag (k-side)", () => {
    const game = generals("4k5/10/10/10/10/10/10/10/10/R3K4R w KQkq - 0 1")
    game.move(c("k1"), c("k3"))
    const castling = game.getFen().split(" ")[2]
    assert.notInclude(castling, "K")
    assert.include(castling, "Q")
  })

  // Comprehensive guard coverage for both castles and both colours, mirroring
  // the heirs/castling.test.ts pattern. The goal is to hit every "return false"
  // branch in generals/King.ts.
  const EmptyFenWhiteMove = "10/10/10/10/10/10/10/10/10/10 w KQkq - 0 1"
  const EmptyFenBlackMove = "10/10/10/10/10/10/10/10/10/10 b KQkq - 0 1"

  it("castle-short guards (king e→b, rook a→c, FEN flag Q/q)", () => {
    const emptyCols = [2, 3, 4]
    const notAttackCols = [2, 3, 4]
    const colors = [Color.White, Color.Black]
    for (const color of colors) {
      const myY = color === Color.White ? 1 : 10
      const attackerY = color === Color.White ? 10 : 1
      const attackerColor = color === Color.White ? Color.Black : Color.White
      const tag = color === Color.White ? 'w' : 'b'
      const baseFen = color === Color.White ? EmptyFenWhiteMove : EmptyFenBlackMove
      const getGoodPos = (fen?: string): Position => generalsPos(fen ?? baseFen)
        .putFigure({ x: 5, y: myY }, Figure.King, color)
        .putFigure({ x: 1, y: myY }, Figure.Rook, color)

      const move = parseMove(`e${myY}-b${myY}`)

      // Positive: short castle is legal in the clean position.
      assert.isTrue(getGoodPos().canMove(...move), JSON.stringify({ tag, move }))

      // King-already-in-check: place an enemy rook attacking the king file.
      assert.isFalse(
        getGoodPos()
          .putFigure({ x: 5, y: attackerY }, Figure.Rook, attackerColor)
          .canMove(...move),
        JSON.stringify({ tag, scenario: 'king in check', move }),
      )

      // Wrong piece at the rook square (Bishop instead of Rook) — flag still
      // says Q/q but the rook isn't there, so the rookCell.figure check fires.
      assert.isFalse(
        getGoodPos()
          .putFigure({ x: 1, y: myY }, Figure.Bishop, color)
          .canMove(...move),
        JSON.stringify({ tag, scenario: 'wrong piece at corner', move }),
      )

      // Enemy rook at the corner square — same flag set, but rookCell.color check
      // rejects the castle because the rook belongs to the wrong side.
      assert.isFalse(
        getGoodPos()
          .putFigure({ x: 1, y: myY }, Figure.Rook, attackerColor)
          .canMove(...move),
        JSON.stringify({ tag, scenario: 'enemy rook at corner', move }),
      )

      // Castling flag missing: empty FEN with `-` castling.
      assert.isFalse(
        getGoodPos(`10/10/10/10/10/10/10/10/10/10 ${tag} - - 0 1`).canMove(...move),
        JSON.stringify({ tag, scenario: 'no castling flag', move }),
      )

      // A piece sitting on each empty-path column blocks the castle.
      for (const emptyCol of emptyCols) {
        assert.isFalse(
          getGoodPos()
            .putFigure({ x: emptyCol, y: myY }, Figure.Rook, color)
            .canMove(...move),
          JSON.stringify({ tag, scenario: 'path blocked', emptyCol, move }),
        )
      }

      // An attacker controlling each not-attack column rejects the castle.
      for (const attackerCol of notAttackCols) {
        assert.isFalse(
          getGoodPos()
            .putFigure({ x: attackerCol, y: attackerY }, Figure.Rook, attackerColor)
            .canMove(...move),
          JSON.stringify({ tag, scenario: 'attacker', attackerCol, move }),
        )
      }
    }
  })

  it("castle-long guards (king e→h, rook k→g, FEN flag K/k)", () => {
    const emptyCols = [6, 7, 8, 9]
    const notAttackCols = [6, 7, 8]
    const colors = [Color.White, Color.Black]
    for (const color of colors) {
      const myY = color === Color.White ? 1 : 10
      const attackerY = color === Color.White ? 10 : 1
      const attackerColor = color === Color.White ? Color.Black : Color.White
      const tag = color === Color.White ? 'w' : 'b'
      const baseFen = color === Color.White ? EmptyFenWhiteMove : EmptyFenBlackMove
      const getGoodPos = (fen?: string): Position => generalsPos(fen ?? baseFen)
        .putFigure({ x: 5, y: myY }, Figure.King, color)
        .putFigure({ x: 10, y: myY }, Figure.Rook, color)

      const move = parseMove(`e${myY}-h${myY}`)

      assert.isTrue(getGoodPos().canMove(...move), JSON.stringify({ tag, move }))

      assert.isFalse(
        getGoodPos()
          .putFigure({ x: 5, y: attackerY }, Figure.Rook, attackerColor)
          .canMove(...move),
        JSON.stringify({ tag, scenario: 'king in check', move }),
      )
      assert.isFalse(
        getGoodPos()
          .putFigure({ x: 10, y: myY }, Figure.Bishop, color)
          .canMove(...move),
        JSON.stringify({ tag, scenario: 'wrong piece at corner', move }),
      )
      assert.isFalse(
        getGoodPos()
          .putFigure({ x: 10, y: myY }, Figure.Rook, attackerColor)
          .canMove(...move),
        JSON.stringify({ tag, scenario: 'enemy rook at corner', move }),
      )
      assert.isFalse(
        getGoodPos(`10/10/10/10/10/10/10/10/10/10 ${tag} - - 0 1`).canMove(...move),
        JSON.stringify({ tag, scenario: 'no castling flag', move }),
      )
      for (const emptyCol of emptyCols) {
        assert.isFalse(
          getGoodPos()
            .putFigure({ x: emptyCol, y: myY }, Figure.Rook, color)
            .canMove(...move),
          JSON.stringify({ tag, scenario: 'path blocked', emptyCol, move }),
        )
      }
      for (const attackerCol of notAttackCols) {
        assert.isFalse(
          getGoodPos()
            .putFigure({ x: attackerCol, y: attackerY }, Figure.Rook, attackerColor)
            .canMove(...move),
          JSON.stringify({ tag, scenario: 'attacker', attackerCol, move }),
        )
      }
    }
  })

  it("castle-short places king on b and rook on c (move outcome)", () => {
    const colors = [Color.White, Color.Black]
    for (const color of colors) {
      const myY = color === Color.White ? 1 : 10
      const baseFen = color === Color.White ? EmptyFenWhiteMove : EmptyFenBlackMove
      const position = generalsPos(baseFen)
        .putFigure({ x: 5, y: myY }, Figure.King, color)
        .putFigure({ x: 1, y: myY }, Figure.Rook, color)
        .move(...parseMove(`e${myY}-b${myY}`))
      const kingPos = position.findFigures(Figure.King, color)
      const rookPos = position.findFigures(Figure.Rook, color)
      assert.equal(kingPos.length, 1)
      assert.equal(rookPos.length, 1)
      assert.equal(kingPos[0].x, 2)
      assert.equal(kingPos[0].y, myY)
      assert.equal(rookPos[0].x, 3)
      assert.equal(rookPos[0].y, myY)
    }
  })

  it("castle-long places king on h and rook on g (move outcome)", () => {
    const colors = [Color.White, Color.Black]
    for (const color of colors) {
      const myY = color === Color.White ? 1 : 10
      const baseFen = color === Color.White ? EmptyFenWhiteMove : EmptyFenBlackMove
      const position = generalsPos(baseFen)
        .putFigure({ x: 5, y: myY }, Figure.King, color)
        .putFigure({ x: 10, y: myY }, Figure.Rook, color)
        .move(...parseMove(`e${myY}-h${myY}`))
      const kingPos = position.findFigures(Figure.King, color)
      const rookPos = position.findFigures(Figure.Rook, color)
      assert.equal(kingPos.length, 1)
      assert.equal(rookPos.length, 1)
      assert.equal(kingPos[0].x, 8)
      assert.equal(kingPos[0].y, myY)
      assert.equal(rookPos[0].x, 7)
      assert.equal(rookPos[0].y, myY)
    }
  })
})

describe("Generals: General piece (Г / FEN G)", () => {

  it("rook-like 1 and 2 square orthogonal moves on open board", () => {
    const game = generals("k9/10/10/10/10/4G5/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    // direct ortho-1 and ortho-2 in all four directions
    for (const sq of [
      "e4", "e3", "e6", "e7",
      "d5", "c5", "f5", "g5",
    ]) {
      assert.isTrue(dests.has(sq), `expected direct rook-1-2 dest ${sq}`)
    }
  })

  it("circumventing diagonal-1 moves require both adjacent orthogonals empty", () => {
    const game = generals("k9/10/10/10/10/4G5/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    for (const sq of ["d4", "d6", "f4", "f6"]) {
      assert.isTrue(dests.has(sq), `expected circumventing dest ${sq}`)
    }
  })

  it("does not move along long diagonals (only the 1-square circumventing diagonals)", () => {
    const game = generals("k9/10/10/10/10/4G5/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isFalse(dests.has("a1"))
    assert.isFalse(dests.has("c3"))
    assert.isFalse(dests.has("g7"))
  })

  it("ordinary General controls exactly 12 squares from the centre on an empty board", () => {
    // Off the Royal vertical the General is "ordinary" — 8 rook-1-2 squares
    // plus 4 circumventing diagonals.
    const game = generals("k9/10/10/10/10/3G6/10/10/10/9K w - - 0 1")
    const dests = game.availableMoves(c("d5"))
    assert.equal(dests.length, 12)
  })

  it("circumventing diagonal blocked when the orthogonal next to it is occupied", () => {
    // White piece on e6 (own colour, blocks both ortho-up and the "going around"
    // path on both NW and NE diagonals).
    const game = generals("k9/10/10/10/4P5/4G5/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    // d6 requires both d5 and e6 empty; e6 is blocked → d6 unreachable.
    assert.isFalse(dests.has("d6"))
    assert.isFalse(dests.has("f6"))
  })

  it("rook-2 path blocked by intervening piece — only rook-1 dest in that direction", () => {
    // Black knight at e7 blocks the path; e6 still reachable, e7 capturable, e8 not.
    const game = generals("k9/10/10/4n5/10/4G5/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("e6"))
    assert.isTrue(dests.has("e7")) // capture
    assert.isFalse(dests.has("e8"))
  })

  it("captures enemy piece on circumventing square", () => {
    // d6 is the circumventing target; gates d5 and e6 must be empty.
    const game = generals("k9/10/10/10/3p6/4G5/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("d6"))
  })

  it("does not capture an own piece on circumventing square", () => {
    // Own white pawn on d6 — circumventing should not include d6 as a target.
    const game = generals("k9/10/10/10/3P6/4G5/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isFalse(dests.has("d6"))
  })

  it("from a corner square has fewer moves (no off-board destinations)", () => {
    const game = generals("k9/10/10/10/10/10/10/10/10/G8K w - - 0 1")
    const dests = new Set(game.availableMoves(c("a1")).map((m) => Utils.coordinateToString(m)))
    // Direct: a2, a3, b1, c1.
    assert.isTrue(dests.has("a2"))
    assert.isTrue(dests.has("a3"))
    assert.isTrue(dests.has("b1"))
    assert.isTrue(dests.has("c1"))
    // Circumventing: only b2 (NE) is on-board; SW, NW, SE diagonals are off the
    // board.
    assert.isTrue(dests.has("b2"))
  })

  it("does not capture an own piece on the rook-1-2 path", () => {
    // Own white pawn at e7 — General must not include e7 as a destination.
    const game = generals("k9/10/10/4P5/10/4G5/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isFalse(dests.has("e7"))
    // The rook ray stops at the friendly piece — e6 is still reachable.
    assert.isTrue(dests.has("e6"))
  })

  it("captures an enemy piece on the rook-1-2 path", () => {
    // Black pawn at e7 is reachable as a capture.
    const game = generals("k9/10/10/4p5/10/4G5/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("e7"))
  })
})

describe("Generals: Jester piece (Ш / FEN C for clown)", () => {

  it("bishop-like 1 and 2 square diagonal moves on open board", () => {
    const game = generals("k9/10/10/10/10/4C5/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    for (const sq of [
      "d4", "c3", "f4", "g3",
      "d6", "c7", "f6", "g7",
    ]) {
      assert.isTrue(dests.has(sq), `expected diagonal dest ${sq}`)
    }
  })

  it("circumventing ortho-2 moves require both adjacent diagonals empty", () => {
    const game = generals("k9/10/10/10/10/4C5/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    for (const sq of ["e3", "e7", "c5", "g5"]) {
      assert.isTrue(dests.has(sq), `expected circumventing dest ${sq}`)
    }
  })

  it("ordinary Jester controls exactly 12 squares from the centre on an empty board", () => {
    // Off the Royal vertical the Jester is "ordinary" — 8 bishop-1-2 squares
    // plus 4 circumventing ortho-2 squares.
    const game = generals("k9/10/10/10/10/3C6/10/10/10/9K w - - 0 1")
    const dests = game.availableMoves(c("d5"))
    assert.equal(dests.length, 12)
  })

  it("does not move orthogonally one square (only ortho-2 via circumventing)", () => {
    const game = generals("k9/10/10/10/10/4C5/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isFalse(dests.has("e4"))
    assert.isFalse(dests.has("e6"))
    assert.isFalse(dests.has("d5"))
    assert.isFalse(dests.has("f5"))
  })

  it("does not jump over an adjacent diagonal piece", () => {
    // Black pawn at d6 blocks the NW diagonal — c7 unreachable; d6 is captured.
    const game = generals("k9/10/10/10/3p6/4C5/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("d6"))    // capture
    assert.isFalse(dests.has("c7"))   // path blocked
  })

  it("circumventing ortho-2 is blocked when one of the adjacent diagonals is occupied", () => {
    // d6 occupied → circumventing to e7 (requires d6 and f6 empty) and to c5
    // (requires d6 and d4 empty) are both unreachable.
    const game = generals("k9/10/10/10/3P6/4C5/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isFalse(dests.has("e7"))
    assert.isFalse(dests.has("c5"))
    // The other circumventing squares (e3, g5) only depend on the lower/right
    // diagonals so they remain reachable.
    assert.isTrue(dests.has("e3"))
    assert.isTrue(dests.has("g5"))
  })

  it("stays on its starting colour: every reachable square has the same parity", () => {
    const game = generals("k9/10/10/10/10/4C5/10/10/10/9K w - - 0 1")
    const start = c("e5")
    const startParity = (start.x + start.y) % 2
    for (const dest of game.availableMoves(start)) {
      const parity = (dest.x + dest.y) % 2
      assert.equal(parity, startParity,
        `Jester moved off its colour: ${Utils.coordinateToString(dest)}`)
    }
  })

  it("captures enemy on diagonal-2 square", () => {
    const game = generals("k9/10/10/2p7/10/4C5/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("c7"))
  })

  it("does not capture own piece on the circumventing square", () => {
    // White piece on e7 — but to reach e7 both d6 and f6 must be empty AND e7
    // must be enemy or empty. With white on e7, even if path open, no capture.
    const game = generals("k9/10/10/4P5/10/4C5/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isFalse(dests.has("e7"))
  })

  it("captures an enemy piece on the circumventing ortho-2 square", () => {
    // Black pawn at e7 (north-2), gates d6 and f6 are empty → e7 capturable.
    const game = generals("k9/10/10/4p5/10/4C5/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("e7"))
  })

  it("does not capture an own piece on the bishop-1-2 path", () => {
    // Own white pawn at c3 (SW two squares) — must not be in dests.
    const game = generals("k9/10/10/10/10/4C5/10/2P7/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isFalse(dests.has("c3"))
    // d4 still reachable along the same diagonal direction.
    assert.isTrue(dests.has("d4"))
  })

  it("captures an enemy piece on the bishop-1-2 path", () => {
    // Ordinary Jester at d5 captures black pawn at b3 along the diagonal.
    const game = generals("k9/10/10/10/10/3C6/10/1p8/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("d5")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("b3"))
  })

  it("south-2 (e3) blocked when SW gate is occupied", () => {
    // Black pawn at d4 occupies the SW gate. The south-2 ortho-2 destination
    // requires both d4 and f4 empty; with d4 occupied, e3 is unreachable.
    const game = generals("k9/10/10/10/10/4C5/3p6/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    // d4 (the SW gate) is occupied; e3 (south-2) requires d4 and f4 empty → unreachable.
    assert.isFalse(dests.has("e3"))
    // c5 (west-2) requires d4 and d6 empty; d4 is occupied → also unreachable.
    assert.isFalse(dests.has("c5"))
    // e7 (north-2) requires d6 and f6 empty — both empty → reachable.
    assert.isTrue(dests.has("e7"))
    // g5 (east-2) requires f4 and f6 empty — both empty → reachable.
    assert.isTrue(dests.has("g5"))
  })

  it("east-2 (g5) blocked when SE gate is occupied", () => {
    // Black piece at f4 (SE of e5) occupies the SE gate.
    const game = generals("k9/10/10/10/10/4C5/5p4/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    // g5 (east-2) requires f4 and f6 empty; f4 occupied → unreachable.
    assert.isFalse(dests.has("g5"))
    // e3 (south-2) requires d4 and f4 empty; f4 occupied → unreachable.
    assert.isFalse(dests.has("e3"))
  })
})

describe("Generals: Royal vertical (column e) makes pieces strong", () => {

  it("Strong General has full rook range across the board", () => {
    // Strong General at e5: full e-file + full rank-5 + 4 circumventing diagonals.
    const game = generals("k9/10/10/10/10/4G5/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    // far rook destinations
    assert.isTrue(dests.has("e1"))
    assert.isTrue(dests.has("e10"))
    assert.isTrue(dests.has("a5"))
    assert.isTrue(dests.has("k5"))
    // mid-range still present
    assert.isTrue(dests.has("e2"))
    assert.isTrue(dests.has("e3"))
    // circumventing diagonal-1 still works
    assert.isTrue(dests.has("d4"))
    assert.isTrue(dests.has("d6"))
    assert.isTrue(dests.has("f4"))
    assert.isTrue(dests.has("f6"))
    // Total: 9 (e-file minus self) + 9 (rank 5 minus self) + 4 (circumventing).
    assert.equal(dests.size, 22)
  })

  it("Strong General rook ray is blocked by an enemy piece (capture stops the ray)", () => {
    const game = generals("k9/10/10/10/4p5/4G5/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("e6"))   // capture
    assert.isFalse(dests.has("e7"))  // ray blocked
    assert.isFalse(dests.has("e10")) // ray blocked
  })

  it("Strong Jester has full bishop range across the board", () => {
    // White king parked on a remote square so the Jester's far diagonals are
    // not blocked by the king. Black king is at column 1 to keep it out of the
    // diagonals from e5 (a1, k10, etc.).
    const game = generals("k9/10/10/10/10/4C5/10/10/10/K9 w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    // far diagonal destinations — every Jester diagonal traversed to its end.
    assert.isTrue(dests.has("a9"))
    assert.isTrue(dests.has("h2"))
    assert.isTrue(dests.has("i9"))
    assert.isTrue(dests.has("k10"))
    // circumventing ortho-2 still works.
    assert.isTrue(dests.has("e3"))
    assert.isTrue(dests.has("e7"))
    assert.isTrue(dests.has("c5"))
    assert.isTrue(dests.has("g5"))
    // every dest stays on the Jester's starting colour.
    const startParity = (5 + 5) % 2
    for (const dest of game.availableMoves(c("e5"))) {
      assert.equal((dest.x + dest.y) % 2, startParity)
    }
  })

  it("Strong Jester diagonal ray is blocked by an enemy piece", () => {
    // Black knight at b2 sits on the SW diagonal — the strong Jester captures it
    // but cannot reach a1 beyond.
    const game = generals("k9/10/10/10/10/4C5/10/10/1n8/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("b2"))   // capture
    assert.isFalse(dests.has("a1"))  // beyond
  })

  it("Strong King controls 16 squares: 1-2 in every direction", () => {
    const game = generals("k9/10/10/10/10/4K5/10/10/10/10 w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    // 8 unit-direction squares (1 step) plus 8 two-step squares.
    for (const sq of ["d4", "d5", "d6", "e4", "e6", "f4", "f5", "f6",
                      "c3", "c5", "c7", "e3", "e7", "g3", "g5", "g7"]) {
      assert.isTrue(dests.has(sq), `strong king should reach ${sq}`)
    }
    assert.equal(dests.size, 16)
  })

  it("Strong King cannot jump over an intermediate piece", () => {
    // Own white pawn at e6 blocks the king's two-step move to e7.
    const game = generals("k9/10/10/10/4P5/4K5/10/10/10/10 w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    // The intermediate own pawn blocks both e6 and e7.
    assert.isFalse(dests.has("e6"))
    assert.isFalse(dests.has("e7"))
    // Other directions still work.
    assert.isTrue(dests.has("e3"))
    assert.isTrue(dests.has("d5"))
  })

  it("Strong King captures an enemy piece on the 2-square reach", () => {
    // Black pawn at e7 — the king can reach it via empty e6.
    const game = generals("k9/10/10/4p5/10/4K5/10/10/10/10 w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("e7"))
  })

  it("Royal Pawn (column e) may step backward one square", () => {
    // White pawn on e4. As a Royal Pawn it may step backward to e3.
    const game = generals("k9/10/10/10/10/10/4P5/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e4")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("e3"))
  })

  it("Royal Pawn does not step backward when the square is occupied", () => {
    const game = generals("k9/10/10/10/10/10/4P5/4P5/10/9K w - - 0 1")
    // Wait — that places own white pawns on both e4 and e3 (or somewhere else
    // depending on FEN row ordering). Let me decode: row 7 (rank 4) has 4P5 —
    // P at e4. Row 8 (rank 3) has 4P5 — P at e3.
    const dests = new Set(game.availableMoves(c("e4")).map((m) => Utils.coordinateToString(m)))
    assert.isFalse(dests.has("e3"))
  })

  it("Royal Pawn captures diagonally backward (left)", () => {
    // White pawn on e5; black piece at d4 (one diagonal step BACKWARD-LEFT for white).
    const game = generals("k9/10/10/10/10/4P5/3p6/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("d4"))
  })

  it("Royal Pawn captures diagonally backward (right)", () => {
    // White pawn on e5; black piece at f4.
    const game = generals("k9/10/10/10/10/4P5/5p4/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("f4"))
  })

  it("Royal Pawn does not capture an own piece on the backward-left diagonal", () => {
    const game = generals("k9/10/10/10/10/4P5/3P6/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isFalse(dests.has("d4"))
  })

  it("Royal Pawn does not capture an own piece on the backward-right diagonal", () => {
    const game = generals("k9/10/10/10/10/4P5/5P4/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    assert.isFalse(dests.has("f4"))
  })

  it("Royal Pawn does not move to an empty backward-diagonal square (only captures)", () => {
    const game = generals("k9/10/10/10/10/4P5/10/10/10/9K w - - 0 1")
    const dests = new Set(game.availableMoves(c("e5")).map((m) => Utils.coordinateToString(m)))
    // Empty squares on backward diagonals are NOT valid pawn moves (only captures).
    assert.isFalse(dests.has("d4"))
    assert.isFalse(dests.has("f4"))
  })

  it("Black Royal Pawn moves forward (down) and backward (up) along column e", () => {
    // Black pawn on e6 (off starting rank). Forward = e5, backward = e7.
    const game = generals("9k/10/10/10/4p5/10/10/10/10/9K b - - 0 1")
    const dests = new Set(game.availableMoves(c("e6")).map((m) => Utils.coordinateToString(m)))
    assert.isTrue(dests.has("e5"))
    assert.isTrue(dests.has("e7"))
  })

  it("Pawn off the Royal vertical loses backward rights", () => {
    // White pawn at d4 (NOT on column e). It has only the standard forward move
    // (and no diagonal captures here).
    const game = generals("k9/10/10/10/10/10/3P6/10/10/9K w - - 0 1")
    const dests = game.availableMoves(c("d4")).map((m) => Utils.coordinateToString(m)).toSorted()
    assert.deepEqual(dests, ["d5"])
  })
})

describe("Generals: extended en passant", () => {

  // Black king parked on the a-file out of the bishop's diagonals (a10 is not
  // on any bishop ray from e5, so the black side is not in check at start).
  const enPassantFen = "k9/1p8/10/10/10/4B5/10/10/10/9K b - - 0 1"

  it("a Bishop captures a sprinting pawn by moving onto the skipped square", () => {
    const game = generals(enPassantFen)
    game.move(c("b9"), c("b7"))
    assert.equal(game.position.cellInfo(c("b7")).figure, Figure.Pawn)
    game.move(c("e5"), c("b8"))
    assert.equal(game.position.cellInfo(c("b8")).figure, Figure.Bishop)
    assert.isTrue(game.position.cellInfo(c("b7")).empty,
      "sprinted pawn at the takeover landing must be removed")
  })

  it("an enemy non-pawn piece moving to the wrong column does not trigger en passant", () => {
    const game = generals(enPassantFen)
    game.move(c("b9"), c("b7"))
    // Bishop e5 → c7 is a normal diagonal move (not on the b-file). The
    // sprinted pawn at b7 must remain in place.
    game.move(c("e5"), c("c7"))
    assert.equal(game.position.cellInfo(c("b7")).figure, Figure.Pawn)
  })

  it("a pawn-on-pawn en passant still works for Generals (regression)", () => {
    // Black sprints b9 → b7; white pawn at c7 captures en passant by moving to b8.
    // Capturing pawn must be on the rank one above the takeover landing.
    const game = generals("k9/1p8/10/2P7/10/10/10/10/10/9K b - - 0 1")
    game.move(c("b9"), c("b7"))
    game.move(c("c7"), c("b8"))
    assert.equal(game.position.cellInfo(c("b8")).figure, Figure.Pawn)
    assert.equal(game.position.cellInfo(c("b8")).color, Color.White)
    assert.isTrue(game.position.cellInfo(c("b7")).empty)
  })

  it("extended en passant only fires in Generals (Heirs uses pawn-only)", () => {
    // In Heirs the same scenario must not let a Bishop capture-en-passant.
    const heirs = Game.fromFen(
      enPassantFen,
      undefined,
      GameType.Heirs,
    )
    heirs.move(c("b9"), c("b7"))
    heirs.move(c("e5"), c("b8"))
    // The pawn must remain on b7 — Heirs has no extended en passant.
    assert.equal(heirs.position.cellInfo(c("b7")).figure, Figure.Pawn)
  })
})

describe("Generals: throne rule", () => {

  // Black king at a10, white king at e9, white pawn at b3 (avoids K-vs-K
  // insufficient material). White to move and step the king onto e10.
  const whiteThroneFen = "k9/4K5/10/10/10/10/10/1P8/10/10 w - - 0 1"

  it("white king reaching e10 receives a new pawn on rank 2", () => {
    const game = generals(whiteThroneFen)
    game.move(c("e9"), c("e10"), { thronePawnPlacement: { x: 3, y: 2 } })
    assert.equal(game.position.cellInfo(c("e10")).figure, Figure.King)
    assert.equal(game.position.cellInfo(c("c2")).figure, Figure.Pawn)
    assert.equal(game.position.cellInfo(c("c2")).color, Color.White)
  })

  it("black king reaching e1 receives a new pawn on rank 9", () => {
    // Mirror of the white case: black king at e2, white king at a1, black
    // pawn at i9 (avoids K-vs-K insufficient material). Black to move.
    const game = generals("10/8p1/10/10/10/10/10/10/4k5/K9 b - - 0 1")
    game.move(c("e2"), c("e1"), { thronePawnPlacement: { x: 5, y: 9 } })
    assert.equal(game.position.cellInfo(c("e1")).figure, Figure.King)
    assert.equal(game.position.cellInfo(c("e9")).figure, Figure.Pawn)
    assert.equal(game.position.cellInfo(c("e9")).color, Color.Black)
  })

  it("throne rule requires placement on the player's pawn rank", () => {
    const game = generals(whiteThroneFen)
    // Placement on rank 3 (not the pawn rank) → throws.
    assert.throws(() => game.move(c("e9"), c("e10"),
      { thronePawnPlacement: { x: 3, y: 3 } }))
  })

  it("throne rule throws when no placement is supplied", () => {
    const game = generals(whiteThroneFen)
    assert.throws(() => game.move(c("e9"), c("e10")))
  })

  it("throne rule throws when placement square is occupied", () => {
    // Pawn rank 2 already has a piece at b2 — placement there must throw.
    const game = generals("k9/4K5/10/10/10/10/10/10/1P8/10 w - - 0 1")
    assert.throws(() => game.move(c("e9"), c("e10"),
      { thronePawnPlacement: { x: 2, y: 2 } }))
  })

  it("throne rule fires only on the FIRST landing on the opposite throne", () => {
    const game = generals(whiteThroneFen)
    game.move(c("e9"), c("e10"), { thronePawnPlacement: { x: 3, y: 2 } })
    // Black king at a10 may move to b10 (one square right).
    game.move(c("a10"), c("b10"))
    // White king at e10 retreats to e9.
    game.move(c("e10"), c("e9"))
    game.move(c("b10"), c("a10"))
    // White king re-enters e10 — throne already claimed; placement not needed.
    game.move(c("e9"), c("e10"))
    assert.equal(game.position.cellInfo(c("e10")).figure, Figure.King)
    let pawnCount = 0
    for (let x = 1; x <= 10; x++) {
      if (game.position.cellInfo({ x, y: 2 }).figure === Figure.Pawn) pawnCount++
    }
    // Only the original pawn at b3 (not on rank 2) plus the throne-spawned pawn
    // at c2 — i.e. exactly one pawn on rank 2.
    assert.equal(pawnCount, 1)
  })
})

describe("Generals: pawn castling", () => {

  // Black king on a10 (out of any threats from typical pawn-castling test
  // setups). White king at k1.
  const blackKingFen = "k9/10/10/10/10/10/10/10/10/9K"

  it("pawn castles forward-left with an own bishop on the diagonal", () => {
    // White pawn at e3, white bishop at d4. Pawn castles: pawn → d4, bishop → e3.
    const game = generals("k9/10/10/10/10/10/3B6/4P5/10/9K w - - 0 1")
    game.move(c("e3"), c("d4"))
    assert.equal(game.position.cellInfo(c("d4")).figure, Figure.Pawn)
    assert.equal(game.position.cellInfo(c("e3")).figure, Figure.Bishop)
  })

  it("pawn castles forward-right with an own queen on the diagonal", () => {
    // White pawn at e3 (rank 3), white queen at f4 (rank 4). Pawn castles → swap.
    const game = generals("k9/10/10/10/10/10/5Q4/4P5/10/9K w - - 0 1")
    game.move(c("e3"), c("f4"))
    assert.equal(game.position.cellInfo(c("f4")).figure, Figure.Pawn)
    assert.equal(game.position.cellInfo(c("e3")).figure, Figure.Queen)
  })

  it("pawn castles forward with an own jester on the diagonal", () => {
    const game = generals("k9/10/10/10/10/10/3C6/4P5/10/9K w - - 0 1")
    game.move(c("e3"), c("d4"))
    assert.equal(game.position.cellInfo(c("d4")).figure, Figure.Pawn)
    assert.equal(game.position.cellInfo(c("e3")).figure, Figure.Jester)
  })

  it("pawn cannot castle with an own General (no diagonal moves)", () => {
    const game = generals("k9/10/10/10/10/10/3G6/4P5/10/9K w - - 0 1")
    assert.isFalse(game.canMove(c("e3"), c("d4")))
  })

  it("pawn cannot castle with an own Rook (no diagonal moves)", () => {
    const game = generals("k9/10/10/10/10/10/3R6/4P5/10/9K w - - 0 1")
    assert.isFalse(game.canMove(c("e3"), c("d4")))
  })

  it("pawn cannot castle with an own Knight (no diagonal moves)", () => {
    const game = generals("k9/10/10/10/10/10/3N6/4P5/10/9K w - - 0 1")
    assert.isFalse(game.canMove(c("e3"), c("d4")))
  })

  it("Royal Pawn castles backward with an own piece on the diagonal", () => {
    // White Royal Pawn at e5; white bishop at d4 (one diagonal BACKWARD-LEFT).
    const game = generals("k9/10/10/10/10/4P5/3B6/10/10/9K w - - 0 1")
    game.move(c("e5"), c("d4"))
    assert.equal(game.position.cellInfo(c("d4")).figure, Figure.Pawn)
    assert.equal(game.position.cellInfo(c("e5")).figure, Figure.Bishop)
  })

  it("after a forward pawn-castle the moving side hands turn over", () => {
    const game = generals("k9/10/10/10/10/10/3B6/4P5/10/9K w - - 0 1")
    game.move(c("e3"), c("d4"))
    // Black now to move: black king at a10 may move to b10.
    assert.doesNotThrow(() => game.move(c("a10"), c("b10")))
  })
})
