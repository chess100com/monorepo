import { assert, describe, it } from "vitest"
import { Game } from "../../src/Game"
import { Utils } from "../../src/Utils"
import type { CoordinateInterface } from "../../src/Shared"

describe("Light figures moves", () => {

    const c = Utils.parseCoordinate
    const dc = Utils.dCoord

    it("bishop", () => {

        let game = Game.create()
        game = Game.fromFen("k9/10/10/10/5B4/10/10/10/10/9K w - - - 0 0")
        assert.isTrue(game.canMove(c("f6"), c("a1")), "f6a1")
        assert.isTrue(game.canMove(c("f6"), c("j10")), "f6j10")
        assert.isTrue(game.canMove(c("f6"), c("b10")), "f6b10")
        assert.isTrue(game.canMove(c("f6"), c("j2")), "f6j2")
        assert.isFalse(game.canMove(c("f6"), c("f10")), "f6f10")
        assert.isFalse(game.canMove(c("f6"), c("f1")), "f6f1")
        assert.isFalse(game.canMove(c("f6"), c("a6")), "f6a6")
        assert.isFalse(game.canMove(c("f6"), c("j6")), "f6j6")

        game = Game.fromFen("k9/10/10/4p1P3/5B4/4P1p3/10/10/10/9K w - - - 0 0")
        assert.isTrue(game.canMove(c("f6"), c("e7")), "f6e7")
        assert.isTrue(game.canMove(c("f6"), c("g5")), "f6g5")
        assert.isFalse(game.canMove(c("f6"), c("g7")), "f6g7")
        assert.isFalse(game.canMove(c("f6"), c("e5")), "f6e5")
        assert.isFalse(game.canMove(c("f6"), c("d8")), "f6d8")
        assert.isFalse(game.canMove(c("f6"), c("h4")), "f6h4")
        assert.isFalse(game.canMove(c("f6"), c("h8")), "f6h8")
        assert.isFalse(game.canMove(c("f6"), c("d4")), "f6d4")

    })

    it("knight", () => {

        let game = Game.create()
        game = Game.fromFen("k9/10/10/10/5N4/10/10/10/10/9K w - - - 0 0")
        const coord = c("f6")
        const empty: CoordinateInterface = { x: -1, y: -2 };
        assert.isTrue(game.canMove(coord, dc(coord, 1, 2) ?? empty))
        assert.isTrue(game.canMove(coord, dc(coord, 2, 1) ?? empty))
        assert.isTrue(game.canMove(coord, dc(coord, -1, 2) ?? empty))
        assert.isTrue(game.canMove(coord, dc(coord, -2, 1) ?? empty))
        assert.isTrue(game.canMove(coord, dc(coord, 1, -2) ?? empty))
        assert.isTrue(game.canMove(coord, dc(coord, 2, -1) ?? empty))
        assert.isTrue(game.canMove(coord, dc(coord, -1, -2) ?? empty))
        assert.isTrue(game.canMove(coord, dc(coord, -2, -1) ?? empty))

        game = Game.fromFen("k9/10/10/10/10/10/10/2p7/2P7/N8K w - - - 0 0")
        assert.isTrue(game.canMove(c("a1"), c("b3")))
        assert.isFalse(game.canMove(c("a1"), c("c2")))


    })

})
