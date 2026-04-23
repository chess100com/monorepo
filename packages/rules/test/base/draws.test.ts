import { assert, describe, it } from "vitest"
import { Game, GameStatus, BlackWinsResult, WhiteWinsResult, DrawResult, OngoingResult } from "../../src/Game"
import { Position } from "../../src/Position"
import { Utils } from "../../src/Utils"
import { Color } from "../../src/Shared"

const c = Utils.parseCoordinate

describe("Halfmove clock", () => {
  it("increments on quiet non-pawn move", () => {
    const game = Game.create()
    game.move(c("d1"), c("d3"))
    assert.equal(game.getFen().split(" ")[4], "1")
  })

  it("resets on pawn move", () => {
    const game = Game.create()
    game.move(c("a2"), c("a3"))
    assert.equal(game.getFen().split(" ")[4], "0")
  })

  it("resets on non-pawn capture", () => {
    const game = Game.fromFen("k9/10/10/10/10/10/10/10/1p8/BN2K5 w - - 5 3")
    game.move(c("a1"), c("b2"))
    assert.equal(game.getFen().split(" ")[4], "0")
    assert.equal(game.status, GameStatus.Ongoing)
  })
})

describe("Fifty-move rule", () => {
  it("not triggered below threshold", () => {
    const pos = Position.fromFen("r8k/10/10/10/10/10/10/10/10/R8K w - - 99 50")
    assert.isFalse(pos.isFiftyMoveRule())
  })

  it("triggered at 100 halfmoves", () => {
    const pos = Position.fromFen("r8k/10/10/10/10/10/10/10/10/R8K w - - 100 50")
    assert.isTrue(pos.isFiftyMoveRule())
  })

  it("Game reaches FiftyMoveRule after crossing threshold", () => {
    const game = Game.fromFen("r8k/10/10/10/10/10/10/10/10/R8K w - - 99 50")
    assert.equal(game.status, GameStatus.Ongoing)
    game.move(c("a1"), c("b1"))
    assert.equal(game.status, GameStatus.FiftyMoveRule)
    assert.equal(game.result, DrawResult)
  })

  it("loading a FEN at threshold sets the status", () => {
    const game = Game.fromFen("r8k/10/10/10/10/10/10/10/10/R8K w - - 100 50")
    assert.equal(game.status, GameStatus.FiftyMoveRule)
    assert.equal(game.result, DrawResult)
  })
})

describe("Threefold repetition", () => {
  it("not triggered after two occurrences", () => {
    const game = Game.create()
    game.move(c("b1"), c("a3"))
    game.move(c("b10"), c("a8"))
    game.move(c("a3"), c("b1"))
    game.move(c("a8"), c("b10"))
    assert.equal(game.status, GameStatus.Ongoing)
    assert.isFalse(game.isThreefoldRepetition())
  })

  it("triggered after three occurrences of the same position", () => {
    const game = Game.create()
    for (let cycle = 0; cycle < 2; cycle++) {
      game.move(c("b1"), c("a3"))
      game.move(c("b10"), c("a8"))
      game.move(c("a3"), c("b1"))
      game.move(c("a8"), c("b10"))
    }
    assert.isTrue(game.isThreefoldRepetition())
    assert.equal(game.status, GameStatus.ThreefoldRepetition)
    assert.equal(game.result, DrawResult)
  })

  it("repetition key ignores halfmove and fullmove counters", () => {
    const a = Position.fromFen("9k/10/10/10/10/10/10/10/10/K9 w - - 0 1")
    const b = Position.fromFen("9k/10/10/10/10/10/10/10/10/K9 w - - 42 20")
    assert.equal(a.getRepetitionKey(), b.getRepetitionKey())
  })

  it("repetition key differs when castling rights differ", () => {
    const a = Position.fromFen("r4k3r/pppppppppp/10/10/10/10/10/10/PPPPPPPPPP/R4K3R w KQkq - 0 1")
    const b = Position.fromFen("r4k3r/pppppppppp/10/10/10/10/10/10/PPPPPPPPPP/R4K3R w Kkq - 0 1")
    assert.notEqual(a.getRepetitionKey(), b.getRepetitionKey())
  })
})

describe("Insufficient material", () => {
  const isInsufficient = (fen: string) => Position.fromFen(fen).isInsufficientMaterial()

  it("K vs K", () => {
    assert.isTrue(isInsufficient("9k/10/10/10/10/10/10/10/10/K9 w - - 0 1"))
  })

  it("K vs K+N", () => {
    assert.isTrue(isInsufficient("9k/10/10/10/10/10/10/10/10/KN8 w - - 0 1"))
    assert.isTrue(isInsufficient("8nk/10/10/10/10/10/10/10/10/K9 w - - 0 1"))
  })

  it("K vs K+B", () => {
    assert.isTrue(isInsufficient("9k/10/10/10/10/10/10/10/10/KB8 w - - 0 1"))
  })

  it("K+B vs K+B same color bishops", () => {
    // white bishop at a1 (1+1=2 even), black bishop at i9 (9+9=18 even): same color
    assert.isTrue(isInsufficient("10/8bk/10/10/10/10/10/10/10/B3K5 w - - 0 1"))
  })

  it("K+B vs K+B different color bishops is NOT insufficient", () => {
    // white bishop at a1 (even), black bishop at i10 (9+10=19 odd): different color
    assert.isFalse(isInsufficient("8bk/10/10/10/10/10/10/10/10/B3K5 w - - 0 1"))
  })

  it("K+N vs K+N is NOT insufficient", () => {
    assert.isFalse(isInsufficient("8nk/10/10/10/10/10/10/10/10/N3K5 w - - 0 1"))
  })

  it("a pawn is never insufficient", () => {
    assert.isFalse(isInsufficient("9k/10/10/10/10/10/10/10/P9/K9 w - - 0 1"))
  })

  it("a rook is never insufficient", () => {
    assert.isFalse(isInsufficient("9k/10/10/10/10/10/10/10/10/KR8 w - - 0 1"))
  })

  it("a queen is never insufficient", () => {
    assert.isFalse(isInsufficient("9k/10/10/10/10/10/10/10/10/KQ8 w - - 0 1"))
  })

  it("a prince is never insufficient", () => {
    assert.isFalse(isInsufficient("9k/10/10/10/10/10/10/10/10/KC8 w - - 0 1"))
  })

  it("a princess is never insufficient", () => {
    assert.isFalse(isInsufficient("9k/10/10/10/10/10/10/10/10/KS8 w - - 0 1"))
  })

  it("Game loaded from bare-kings FEN is InsufficientMaterial", () => {
    const game = Game.fromFen("9k/10/10/10/10/10/10/10/10/K9 w - - 0 1")
    assert.equal(game.status, GameStatus.InsufficientMaterial)
    assert.equal(game.result, DrawResult)
  })
})

describe("Game termination by action", () => {
  it("resign: white loses, black wins", () => {
    const game = Game.create()
    game.resign(Color.White)
    assert.equal(game.status, GameStatus.Resignation)
    assert.equal(game.result, BlackWinsResult)
  })

  it("resign: black loses, white wins", () => {
    const game = Game.create()
    game.resign(Color.Black)
    assert.equal(game.status, GameStatus.Resignation)
    assert.equal(game.result, WhiteWinsResult)
  })

  it("resign with Color.None throws", () => {
    const game = Game.create()
    assert.throw(() => game.resign(Color.None))
  })

  it("resign after game ended throws", () => {
    const game = Game.create()
    game.resign(Color.White)
    assert.throw(() => game.resign(Color.Black), /Game already ended/)
  })

  it("agreeDraw sets draw result", () => {
    const game = Game.create()
    game.agreeDraw()
    assert.equal(game.status, GameStatus.Agreement)
    assert.equal(game.result, DrawResult)
  })

  it("agreeDraw after game ended throws", () => {
    const game = Game.create()
    game.agreeDraw()
    assert.throw(() => game.agreeDraw(), /Game already ended/)
  })

  it("timeout: white flagged, black wins", () => {
    const game = Game.create()
    game.timeout(Color.White)
    assert.equal(game.status, GameStatus.Timeout)
    assert.equal(game.result, BlackWinsResult)
  })

  it("timeout: black flagged, white wins", () => {
    const game = Game.create()
    game.timeout(Color.Black)
    assert.equal(game.status, GameStatus.Timeout)
    assert.equal(game.result, WhiteWinsResult)
  })

  it("timeout with Color.None throws", () => {
    const game = Game.create()
    assert.throw(() => game.timeout(Color.None))
  })

  it("timeout after game ended throws", () => {
    const game = Game.create()
    game.resign(Color.White)
    assert.throw(() => game.timeout(Color.Black), /Game already ended/)
  })

  it("move after game ended throws", () => {
    const game = Game.create()
    game.resign(Color.White)
    assert.throw(() => game.move(c("a2"), c("a3")), /Game already ended/)
  })

  it("fresh game has Ongoing status and '*' result", () => {
    const game = Game.create()
    assert.equal(game.status, GameStatus.Ongoing)
    assert.equal(game.result, OngoingResult)
  })
})

describe("Checkmate drives result", () => {
  it("loading a black-mated FEN sets Checkmate + White wins", () => {
    const game = Game.fromFen("kQK7/10/10/10/10/10/10/10/10/10 b - - 0 1")
    assert.equal(game.status, GameStatus.Checkmate)
    assert.equal(game.result, WhiteWinsResult)
  })

  it("loading a white-mated FEN sets Checkmate + Black wins", () => {
    const game = Game.fromFen("10/10/10/10/10/10/10/10/10/Kqk7 w - - 0 1")
    assert.equal(game.status, GameStatus.Checkmate)
    assert.equal(game.result, BlackWinsResult)
  })

  it("loading a stalemate FEN sets Stalemate + draw", () => {
    const game = Game.fromFen("k9/10/KQ8/10/10/10/10/10/10/10 b - - 0 1")
    assert.equal(game.status, GameStatus.Stalemate)
    assert.equal(game.result, DrawResult)
  })
})
