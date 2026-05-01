import { assert, describe, it } from "vitest"
import { Game } from "../../src/Game"
import { Utils } from "../../src/Utils"
import { Color, Figure } from "../../src/Shared"
import { Position } from "../../src/Position"
import { parseMove } from "../util"

describe("Castling", () => {

  const c = Utils.parseCoordinate

  it("Base castling", () => {

    const startFen = "1k8/10/10/10/10/10/10/10/10/R4K3R w KQ - 0 1"
    let game = Game.fromFen(startFen)
    game.move(c("f1"), c("c1"))
    assert.equal(game.getFen(), "1k8/10/10/10/10/10/10/10/10/2KR5R b - - 1 1")

    game = Game.fromFen(startFen)
    game.move(c("f1"), c("h1"))
    assert.equal(game.getFen(), "1k8/10/10/10/10/10/10/10/10/R5RK2 b - - 1 1")
  })

  it("Can`t castling with attacked field", () => {
    const game = Game.fromFen("1kr3r3/10/10/10/10/10/10/10/10/R4K3R w KQ - 0 1")
    assert.isFalse(game.canMove(c("f1"), c("c1")))
    assert.isFalse(game.canMove(c("f1"), c("h1")))
  })


  const EmptyFenWhiteMove = "10/10/10/10/10/10/10/10/10/10 w KQkq - 0 1"
  const EmptyFenBlackMove = "10/10/10/10/10/10/10/10/10/10 b KQkq - 0 1"

  it('castle-can-move-00', () => {
    const emptyCols = [7, 8, 9];
    const notAttackCols = [7, 8];
    const colors = [Color.White, Color.Black];
    for (const color of colors) {
      const myY = color === Color.White ? 1 : 10;
      const attackerY = color === Color.White ? 10 : 1;
      const attackerColor = color === Color.White ? Color.Black : Color.White;
      const getGoodPos = (fen?: string) => Position
        .fromFen(fen ?? (color === Color.White ? EmptyFenWhiteMove : EmptyFenBlackMove))
        .putFigure({ x: 6, y: myY }, Figure.King, color)
        .putFigure({ x: 10, y: myY }, Figure.Rook, color);

      const move = parseMove(`f${myY}-h${myY}`);
      assert.isTrue(getGoodPos().canMove(...move), JSON.stringify({ move, color }));
      assert.isFalse(
        getGoodPos()
          .putFigure({ x: 6, y: attackerY }, Figure.Rook, attackerColor)
          .canMove(...move),
        JSON.stringify({ move, color })
      );
      assert.isFalse(
        getGoodPos()
          .putFigure({ x: 10, y: myY }, Figure.Bishop, attackerColor)
          .canMove(...move),
        JSON.stringify({ move, color })
      );
      assert.isFalse(
        getGoodPos()
          .putFigure({ x: 10, y: myY }, Figure.Rook, attackerColor)
          .putFigure({ x: 9, y: myY }, Figure.Rook, color)
          .canMove(...move),
        JSON.stringify({ move, color })
      );
      assert.isFalse(
        getGoodPos()
          .putFigure({ x: 10, y: myY }, Figure.Bishop, color)
          .canMove(...move),
        JSON.stringify({ move, color })
      );
      assert.isFalse(
        getGoodPos(`10/10/10/10/10/10/10/10/10/10 ${color === Color.White ? 'w' : 'b'} - - 0 1`)
          .canMove(...move),
        JSON.stringify({ move, color })
      );
      for (const emptyCol of emptyCols) {
        assert.isFalse(
          getGoodPos()
            .putFigure({ x: emptyCol, y: myY }, Figure.Rook, color)
            .canMove(...move),
          JSON.stringify({ emptyCol, move, color })
        );
      }
      for (const attackerCol of notAttackCols) {
        assert.isFalse(
          getGoodPos()
            .putFigure({ x: attackerCol, y: attackerY }, Figure.Rook, attackerColor)
            .canMove(...move),
          JSON.stringify({ attackerCol, move, color })
        );
      }
    }
  });

  it('castle-move-00', () => {
    const colors = [Color.White, Color.Black];
    for (const color of colors) {
      const myY = color === Color.White ? 1 : 10;
      const position = Position
        .fromFen(color === Color.White ? EmptyFenWhiteMove : EmptyFenBlackMove)
        .putFigure({ x: 6, y: myY }, Figure.King, color)
        .putFigure({ x: 10, y: myY }, Figure.Rook, color)
        .move(...parseMove(`f${myY}-h${myY}`));
      const kingPos = position.findFigures(Figure.King, color);
      const rookPos = position.findFigures(Figure.Rook, color);
      assert.equal(kingPos.length, 1);
      assert.equal(rookPos.length, 1);
      assert.equal(kingPos[0].x, 8);
      assert.equal(kingPos[0].y, myY);
      assert.equal(rookPos[0].x, 7);
      assert.equal(rookPos[0].y, myY);
    }
  });

  it('castle-can-move-000', () => {
    const emptyCols = [2, 3, 4, 5];
    const notAttackCols = [3, 4, 5];
    const colors = [Color.White, Color.Black];
    for (const color of colors) {
      const myY = color === Color.White ? 1 : 10;
      const attackerY = color === Color.White ? 10 : 1;
      const attackerColor = color === Color.White ? Color.Black : Color.White;
      const getGoodPos = (fen?: string) => Position
        .fromFen(fen ?? (color === Color.White ? EmptyFenWhiteMove : EmptyFenBlackMove))
        .putFigure({ x: 6, y: myY }, Figure.King, color)
        .putFigure({ x: 1, y: myY }, Figure.Rook, color);

      const move = parseMove(`f${myY}-c${myY}`);
      assert.isTrue(getGoodPos().canMove(...move), JSON.stringify({ move, color }));
      assert.isFalse(
        getGoodPos()
          .putFigure({ x: 6, y: attackerY }, Figure.Rook, attackerColor)
          .canMove(...move),
        JSON.stringify({ move, color })
      );
      assert.isFalse(
        getGoodPos()
          .putFigure({ x: 1, y: myY }, Figure.Bishop, attackerColor)
          .canMove(...move),
        JSON.stringify({ move, color })
      );
      assert.isFalse(
        getGoodPos()
          .putFigure({ x: 1, y: myY }, Figure.Rook, attackerColor)
          .putFigure({ x: 2, y: myY }, Figure.Rook, color)
          .canMove(...move),
        JSON.stringify({ move, color })
      );
      assert.isFalse(
        getGoodPos()
          .putFigure({ x: 1, y: myY }, Figure.Bishop, color)
          .canMove(...move),
        JSON.stringify({ move, color })
      );
      assert.isFalse(
        getGoodPos(`10/10/10/10/10/10/10/10/10/10 ${color === Color.White ? 'w' : 'b'} - - 0 1`)
          .canMove(...move),
        JSON.stringify({ move, color })
      );
      for (const emptyCol of emptyCols) {
        assert.isFalse(
          getGoodPos()
            .putFigure({ x: emptyCol, y: myY }, Figure.Rook, color)
            .canMove(...move),
          JSON.stringify({ emptyCol, move, color })
        );
      }
      for (const attackerCol of notAttackCols) {
        assert.isFalse(
          getGoodPos()
            .putFigure({ x: attackerCol, y: attackerY }, Figure.Rook, attackerColor)
            .canMove(...move),
          JSON.stringify({ attackerCol, move, color })
        );
      }
    }
  });

  it('castle-move-00', () => {
    const colors = [Color.White, Color.Black];
    for (const color of colors) {
      const myY = color === Color.White ? 1 : 10;
      const position = Position
        .fromFen(color === Color.White ? EmptyFenWhiteMove : EmptyFenBlackMove)
        .putFigure({ x: 6, y: myY }, Figure.King, color)
        .putFigure({ x: 1, y: myY }, Figure.Rook, color)
        .move(...parseMove(`f${myY}-c${myY}`));
      const kingPos = position.findFigures(Figure.King, color);
      const rookPos = position.findFigures(Figure.Rook, color);
      assert.equal(kingPos.length, 1);
      assert.equal(rookPos.length, 1);
      assert.equal(kingPos[0].x, 3);
      assert.equal(kingPos[0].y, myY);
      assert.equal(rookPos[0].x, 4);
      assert.equal(rookPos[0].y, myY);
    }
  });

  // The lost-castling-rights logic in Position.move (after a Rook move) has
  // four branches keyed on (color × from.x). The next four cases pin each one.
  const fenAfter = (move: string, _moverColor: Color): string => {
    const startFen = "r4k3r/10/10/10/10/10/10/10/10/R4K3R w KQkq - 0 1";
    const game = Game.fromFen(startFen);
    if (move.startsWith("R") || move.startsWith("a") || move.startsWith("k")) {
      // proceed with white move
    }
    const [from, to] = parseMove(move);
    game.move(from, to);
    return game.getFen();
  };

  it("white rook moving from a1 clears the queenside flag (Q drops)", () => {
    const fen = fenAfter("a1-a3", Color.White);
    const castling = fen.split(" ")[2];
    assert.notInclude(castling, "Q");
    assert.include(castling, "K");
    assert.include(castling, "k");
    assert.include(castling, "q");
  });

  it("white rook moving from k1 clears the kingside flag (K drops)", () => {
    const fen = fenAfter("k1-k3", Color.White);
    const castling = fen.split(" ")[2];
    assert.notInclude(castling, "K");
    assert.include(castling, "Q");
    assert.include(castling, "k");
    assert.include(castling, "q");
  });

  it("black rook moving from a10 clears the black queenside flag (q drops)", () => {
    const startFen = "r4k3r/10/10/10/10/10/10/10/10/R4K3R b KQkq - 0 1";
    const game = Game.fromFen(startFen);
    game.move(c("a10"), c("a8"));
    const castling = game.getFen().split(" ")[2];
    assert.notInclude(castling, "q");
    assert.include(castling, "K");
    assert.include(castling, "Q");
    assert.include(castling, "k");
  });

  it("black rook moving from k10 clears the black kingside flag (k drops)", () => {
    const startFen = "r4k3r/10/10/10/10/10/10/10/10/R4K3R b KQkq - 0 1";
    const game = Game.fromFen(startFen);
    game.move(c("k10"), c("k8"));
    const castling = game.getFen().split(" ")[2];
    assert.notInclude(castling, "k");
    assert.include(castling, "K");
    assert.include(castling, "Q");
    assert.include(castling, "q");
  });

  it("white king moving clears only white castling flags (black flags untouched)", () => {
    const startFen = "r4k3r/10/10/10/10/10/10/10/10/R4K3R w KQkq - 0 1";
    const game = Game.fromFen(startFen);
    game.move(c("f1"), c("f2"));
    const castling = game.getFen().split(" ")[2];
    assert.notInclude(castling, "K");
    assert.notInclude(castling, "Q");
    assert.include(castling, "k");
    assert.include(castling, "q");
  });

  it("black king moving clears only black castling flags (white flags untouched)", () => {
    const startFen = "r4k3r/10/10/10/10/10/10/10/10/R4K3R b KQkq - 0 1";
    const game = Game.fromFen(startFen);
    game.move(c("f10"), c("f9"));
    const castling = game.getFen().split(" ")[2];
    assert.notInclude(castling, "k");
    assert.notInclude(castling, "q");
    assert.include(castling, "K");
    assert.include(castling, "Q");
  });

})
