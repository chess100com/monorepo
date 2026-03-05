import { assert, describe, it } from "vitest"
import { Game } from "../../src/Game"
import { Utils } from "../../src/Utils"
import { Color, Figure } from "../../src/Shared"
import { Position } from "../../src/Position"
import { parseMove } from "../util"

describe("Castling", () => {

  const c = Utils.parseCoordinate

  it("Base castling", () => {

    const startFen = "1k8/10/10/10/10/10/10/10/10/R4K3R w KQ - - 0 1"
    let game = Game.fromFen(startFen)
    game.move(c("f1"), c("c1"))
    assert.equal(game.getFen(), "1k8/10/10/10/10/10/10/10/10/2KR5R b - - - 1 1")

    game = Game.fromFen(startFen)
    game.move(c("f1"), c("h1"))
    assert.equal(game.getFen(), "1k8/10/10/10/10/10/10/10/10/R5RK2 b - - - 1 1")
  })

  it("Can`t castling with attacked field", () => {
    const game = Game.fromFen("1kr3r3/10/10/10/10/10/10/10/10/R4K3R w KQ - - 0 1")
    assert.isFalse(game.canMove(c("f1"), c("c1")))
    assert.isFalse(game.canMove(c("f1"), c("h1")))
  })


  const EmptyFenWhiteMove = "10/10/10/10/10/10/10/10/10/10 w KQkq - - 0 1"
  const EmptyFenBlackMove = "10/10/10/10/10/10/10/10/10/10 b KQkq - - 0 1"

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
        getGoodPos(`10/10/10/10/10/10/10/10/10/10 ${color === Color.White ? 'w' : 'b'} - - - 0 1`)
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
        getGoodPos(`10/10/10/10/10/10/10/10/10/10 ${color === Color.White ? 'w' : 'b'} - - - 0 1`)
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

})
