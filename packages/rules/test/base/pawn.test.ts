import { assert, describe, it } from "vitest"
import { Figure, StartFen } from "../../src/Shared"
import { Game } from "../../src/Game"
import { Utils } from "../../src/Utils"
import { Position } from "../../src/Position"
import { parseMove } from "../util"

describe("Pawn", () => {

  const c = Utils.parseCoordinate

  it("available first pawn moves", () => {
    const game = Game.create()
    assert.isTrue(game.canMove(c("a2"), c("a3")))
    assert.isTrue(game.canMove(c("a2"), c("a4")))
    assert.isTrue(game.canMove(c("a2"), c("a5")))
    assert.isFalse(game.canMove(c("a2"), c("a6")))
    assert.isFalse(game.canMove(c("a2"), c("b3")))
  })

  it("not available big move after move", () => {
    let position = Position.fromFen(StartFen)
      .move(...parseMove('a2-a4'))
      .move(...parseMove('a9-a7'))
    assert.isFalse(position.canMove(...parseMove('a4-a3')));
    assert.isTrue(position.canMove(...parseMove('a4-a5')));
    position = position.move(...parseMove('a4-a5'))
    assert.isTrue(position.canMove(...parseMove('a7-a6')));
    assert.isFalse(position.canMove(...parseMove('a7-a8')));
  });

  it("make moves: g5 h6 gh", () => {
    const game = Game.create()
    game.move(c("g2"), c("g5"))
    assert.equal(game.getFen(), "rnbcqksbnr/pppppppppp/10/10/10/6P3/10/10/PPPPPP1PPP/RNBCQKSBNR b KQkq g5 - 0 1")
    game.move(c("h9"), c("h6"))
    assert.equal(game.getFen(), "rnbcqksbnr/ppppppp1pp/10/10/7p2/6P3/10/10/PPPPPP1PPP/RNBCQKSBNR w KQkq h6 - 0 2")
    game.move(c("g5"), c("h6"))
    assert.equal(game.getFen(), "rnbcqksbnr/ppppppp1pp/10/10/7P2/10/10/10/PPPPPP1PPP/RNBCQKSBNR b KQkq - - 0 2")
  })

  it("make illegal pawn move", () => {
    const game = Game.create()
    assert.throws(() => game.move(c("g2"), c("g6")))
    assert.throws(() => game.move(c("g2"), c("a2")))

    assert.throws(() => game.move(c("g2"), c("h3")))
    assert.throws(() => game.move(c("g2"), c("f3")))
    game.move(...parseMove('a2-a3'))

    assert.throws(() => game.move(c("g9"), c("g5")))
    assert.throws(() => game.move(c("g9"), c("g2")))

    assert.throws(() => game.move(c("g9"), c("h8")))
    assert.throws(() => game.move(c("g9"), c("f8")))

  })

  it("takeover white", () => {
    let game = Game.create()
    game = Game.fromFen("rnbcqksbnr/ppppppp1pp/10/10/6Pp2/10/10/10/PPPPPP1PPP/RNBCQKSBNR w KQkq h6 - 0 2")
    game.move(c("g6"), c("h7"))
    assert.equal(game.getFen(), "rnbcqksbnr/ppppppp1pp/10/7P2/10/10/10/10/PPPPPP1PPP/RNBCQKSBNR b KQkq - - 0 2")

    game = Game.fromFen("rnbcqksbnr/ppppppp1pp/10/P5P3/7p2/10/10/10/PPPPPP1PPP/RNBCQKSBNR w KQkq h6 - 0 2")
    assert.isFalse(game.canMove(c("a7"), c("b8")))
    game.move(c("g7"), c("h8"))
    assert.equal(game.getFen(), "rnbcqksbnr/ppppppp1pp/7P2/P9/10/10/10/10/PPPPPP1PPP/RNBCQKSBNR b KQkq - - 0 2")

    assert.isFalse(game.canMove(c("g8"), c("h9")))
  })

  it("takeover black", () => {
    let game = Game.create()
    game = Game.fromFen("rnbcqksbnr/ppppppp1pp/10/10/10/6Pp2/10/10/PPPPPP1PPP/RNBCQKSBNR b KQkq g5 - 0 2")
    game.move(c("h5"), c("g4"))
    assert.equal(game.getFen(), "rnbcqksbnr/ppppppp1pp/10/10/10/10/6p3/10/PPPPPP1PPP/RNBCQKSBNR w KQkq - - 0 3")

    game = Game.fromFen("rnbcqksbnr/ppppppp1pp/10/10/10/6P3/p6p2/10/PPPPPP1PPP/RNBCQKSBNR b KQkq g5 - 0 2")
    assert.throws(() => game.move(c("a4"), c("b3")))
    game.move(c("h4"), c("g3"))
    assert.equal(game.getFen(), "rnbcqksbnr/ppppppp1pp/10/10/10/10/p9/6p3/PPPPPP1PPP/RNBCQKSBNR w KQkq - - 0 3")

    assert.isFalse(game.canMove(c("h3"), c("g2")))
  })

  it("pawn transformations", () => {

    let game = Game.create()
    game = Game.fromFen("k9/9P/10/10/10/10/10/10/10/K9 w - - - 0 0")
    assert.throw(() => game.move(c("j9"), c("j10")), "transform figure should be passed")

    game.move(c("j9"), c("j10"), { pawnTransform: Figure.Queen })

    assert.equal(game.getFen(), "k8Q/10/10/10/10/10/10/10/10/K9 b - - - 0 0", "white pawn transform fails")

    game = Game.fromFen("k9/10/10/10/10/10/10/10/9p/K9 b - - - 0 0")
    game.move(c("j2"), c("j1"), { pawnTransform: Figure.Queen })
    assert.equal(game.getFen(), "k9/10/10/10/10/10/10/10/10/K8q w - - - 0 1", "black pawn transform fails")

    game = Game.fromFen("k9/10/10/10/10/10/10/10/9p/K9 b - - - 0 0")
    game.move(c("j2"), c("j1"), { pawnTransform: Figure.Bishop })
    assert.equal(game.getFen(), "k9/10/10/10/10/10/10/10/10/K8b w - - - 0 1", "black pawn transform fails")

  })

  it("pawn transformations with eat", () => {

    let game = Game.create()
    game = Game.fromFen("k7r1/9P/10/10/10/10/10/10/10/K9 w - - - 0 0")
    game.move(c("j9"), c("i10"), { pawnTransform: Figure.Queen })
    game = Game.fromFen("k7Q1/10/10/10/10/10/10/10/10/K9 b - - - 0 0")

    game = Game.fromFen("k9/10/10/10/10/10/10/10/9p/K7R1 b - - - 0 0")
    game.move(c("j2"), c("i1"), { pawnTransform: Figure.Queen })
    game = Game.fromFen("k9/10/10/10/10/10/10/10/10/K7q1 w - - - 0 1")

  })

  it("pawn cant move forward on not empty ceil", () => {
    let game = Game.create()

    game.move(c("g2"), c("g5"))
    game.move(c("g9"), c("g6"))
    assert.isFalse(game.canMove(c("g5"), c("g6")))
    game.move(c("a2"), c("a5"))
    assert.isFalse(game.canMove(c("g6"), c("g5")))

    game = Game.create()
    game.move(c("a2"), c("a5"))
    game.move(c("g9"), c("g6"))
    game.move(c("a5"), c("a6"))
    game.move(c("g6"), c("g5"))
    assert.isFalse(game.canMove(c("g2"), c("g5")))

    game = Game.create()
    game.move(c("a2"), c("a5"))
    game.move(c("g9"), c("g6"))
    game.move(c("a5"), c("a6"))
    assert.isFalse(game.canMove(c("a9"), c("a6")))

  })

  it('not eat my', () => {
    let pos = Position.fromFen(StartFen)
      .move(...parseMove('b2-b3'))
      .move(...parseMove('b9-b8'))
      .move(...parseMove('a2-a4'))
      .move(...parseMove('a9-a7'))
      .move(...parseMove('c2-c4'))
      .move(...parseMove('c9-c7'))
    assert.isFalse(pos.canMove(...parseMove('b3-a4')))
    assert.isFalse(pos.canMove(...parseMove('b3-c4')))
    pos = pos.move(...parseMove('b3-b4'))
    assert.isFalse(pos.canMove(...parseMove('b8-a7')))
    assert.isFalse(pos.canMove(...parseMove('b8-c7')))
  });
})

