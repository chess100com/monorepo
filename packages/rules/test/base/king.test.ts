import { assert, describe, it } from "vitest"
import { Game } from "../../src/Game"
import { Utils } from "../../src/Utils"
import { parseMove } from "../util"

describe("King moves", () => {

  const c = Utils.parseCoordinate

  it("base moves", () => {

    let game = Game.fromFen("k9/10/10/10/9Q/10/10/10/10/9K w - - - 0 0")
    assert.isTrue(game.canMove(c("j1"), c("j2")), "j1j2")
    assert.isTrue(game.canMove(c("j1"), c("i1")), "j1i1")
    assert.isTrue(game.canMove(c("j1"), c("i2")), "j1i2")
    assert.isFalse(game.canMove(c("j1"), c("a1")), "j1a1")

    game = Game.fromFen("k9/10/10/10/9Q/10/10/8p1/7PK1/10 w - - - 0 0")
    assert.isTrue(game.canMove(c("i2"), c("i3")), "i2i3")
    assert.isFalse(game.canMove(c("i2"), c("h2")), "i2h2")

    game = Game.fromFen("k9/10/10/10/10/10/10/10/1K8/10 w - - - 0 0");
    const testMoves = ['b2-a1', 'b2-a2', 'b2-a3', 'b2-b3', 'b2-c3', 'b2-c2', 'b2-c1', 'b2-b1'];
    for (const move of testMoves) {
      const [coord1, coord2] = move.split('-')
      assert.isTrue(game.canMove(c(coord1), c(coord2)), move)
    }

    game = Game.fromFen("k9/10/10/10/10/10/10/10/1KR7/10 w - - - 0 0");
    assert.isFalse(game.canMove(...parseMove('b2-c2')))
  })


})
