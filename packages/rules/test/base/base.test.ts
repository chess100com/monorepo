import { assert, describe, it } from "vitest"
import { Game } from "../../src/Game"
import { Utils } from "../../src/Utils"
import { StartFen, Figure, Color } from "../../src/Shared"

describe("Base position", () => {

  const c = Utils.parseCoordinate

  it("init fen get", () => {
    const game = Game.create()
    assert.equal(game.getFen(), StartFen)
  })

  it("illegal coordinates", () => {
    assert.throws(() => c("a0"))
    assert.throws(() => c("a11"))
    assert.throws(() => c("z1"))
  })

  it("cant move first by black", () => {
    const game = Game.create()
    assert.isFalse(game.canMove(c("h9"), c("h5")))
  })

  it("semimoves", () => {
    const game = Game.create()
    game.move(c("d1"), c("d3"))
    assert.equal(game.getFen(), "rnbcqksbnr/pppppppppp/10/10/10/10/10/3C6/PPPPPPPPPP/RNB1QKSBNR b KQkq - - 1 1")
  })

  it("bad fen", () => {
    assert.throw(() => Game.fromFen("rnbcqksbnr/pppppppppp/10/10/10/10/10/10/PPPPPPPPPP/RNBCQKSBNR"))
    assert.throw(() => Game.fromFen("rnbcqksbnr/pppppppppp/10/10/10/10/10/10/PPPPPPPPPP w KQkq - - 0 1"))
    assert.throw(() => Game.fromFen("rnbcqksbnr/pppppppppp/10/10/9Pp/10/10/10/PPPPPPPPPP/RNBCQKSBNR w KQkq - - 0 1"))
    assert.throw(() => Game.fromFen("rnbcqksbnr/pppppppppp/10/10/10/10/10/10/PPPPPPPPPP/RNBCQKSBNZ w KQkq - - 0 1"))
    assert.throw(() => Game.fromFen("rnbcqksbnr/pppppppppp/10/10/10/10/10/10/PPPPPPPPP/RNBCQKSBNR w KQkq - - 0 1"))
    assert.throw(() => Game.fromFen("rnbcqksbnr/pppppppppp/10/10/10/10/10/10/PPPPPPPPPP/RNBCQKSBNR a KQkq - - 0 1"))
    assert.throw(() => Game.fromFen("rnbcqksbnr/pppppppppp/10/10/10/10/10/10/PPPPPPPPPP/RNBCQKSBNR w KQkq - - a 1"))
    assert.throw(() => Game.fromFen("rnbcqksbnr/pppppppppp/10/10/10/10/10/10/PPPPPPPPPP/RNBCQKSBNR w KQkq - - 0 b"))
  })

  it("find figure", () => {
    const game = Game.create()
    const coords = game.position.findFigures(Figure.King, Color.White)
    assert.equal(coords.length, 1)
    assert.equal(coords[0].y, 1)
    assert.equal(Utils.getColumnName(coords[0].x), "f")
  })

  it("Move metadata", () => {
    const game = Game.create()
    game.move(c('a2'), c('a3'));
    assert.equal(game.moves.length, 1);
    const {
      from,
      to,
      extra,
      color,
      figure,
      number,
      fen,
      alias,
    } = game.moves[0];
    assert.equal(from.x, 1);
    assert.equal(from.y, 2);
    assert.equal(to.x, 1);
    assert.equal(to.y, 3);
    assert.deepEqual(extra, {});
    assert.equal(color, Color.White);
    assert.equal(figure, Figure.Pawn);
    assert.equal(number, 1);
    assert.equal(fen, 'rnbcqksbnr/pppppppppp/10/10/10/10/10/P9/1PPPPPPPPP/RNBCQKSBNR b KQkq - - 0 1');
    assert.equal(alias, 'a2-a3');
  });
})

