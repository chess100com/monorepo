import { assert, describe, it } from "vitest"
import { Game } from "../../src/Game"
import { Utils } from "../../src/Utils"

describe("Heavy figures moves", () => {

    const c = Utils.parseCoordinate

    it("queen moves", () => {

        let game = Game.create()

        game = Game.fromFen("k9/10/10/10/5Q4/10/10/10/10/9K w - - - 0 0")
        assert.isTrue(game.fromPosition);

        assert.isTrue(game.canMove(c("f6"), c("a1")), "f6a1")
        assert.isTrue(game.canMove(c("f6"), c("j10")), "f6j10")
        assert.isTrue(game.canMove(c("f6"), c("b10")), "f6b10")
        assert.isTrue(game.canMove(c("f6"), c("j2")), "f6j2")
        assert.isTrue(game.canMove(c("f6"), c("f10")), "f6f10")
        assert.isTrue(game.canMove(c("f6"), c("f1")), "f6f1")
        assert.isTrue(game.canMove(c("f6"), c("a6")), "f6a6")
        assert.isTrue(game.canMove(c("f6"), c("j6")), "f6j6")

        const availableMoves = game.availableMoves(c("f6"))
        assert.equal(availableMoves.length, 35)

        game = Game.fromFen("k9/10/10/4p1P3/5Q4/4P1p3/10/10/10/9K w - - - 0 0")
        assert.isTrue(game.canMove(c("f6"), c("e7")), "f6e7")
        assert.isTrue(game.canMove(c("f6"), c("g5")), "f6g5")
        assert.isFalse(game.canMove(c("f6"), c("g7")), "f6g7")
        assert.isFalse(game.canMove(c("f6"), c("e5")), "f6e5")
        assert.isFalse(game.canMove(c("f6"), c("d8")), "f6d8")
        assert.isFalse(game.canMove(c("f6"), c("h4")), "f6h4")
        assert.isFalse(game.canMove(c("f6"), c("h8")), "f6h8")
        assert.isFalse(game.canMove(c("f6"), c("d4")), "f6d4")

    })

    it("rook moves", () => {

        let game = Game.create()
        game = Game.fromFen("k9/10/10/10/5R4/10/10/10/10/9K w - - - 0 0")
        assert.isTrue(game.canMove(c("f6"), c("f10")), "f6f10")
        assert.isTrue(game.canMove(c("f6"), c("f1")), "f6f1")
        assert.isTrue(game.canMove(c("f6"), c("a6")), "f6a6")
        assert.isTrue(game.canMove(c("f6"), c("j6")), "f6j6")

        game = Game.fromFen("k9/10/10/5P4/4PRp3/5p4/10/10/10/9K w - - - 0 0")
        assert.isTrue(game.canMove(c("f6"), c("g6")), "f6g6")
        assert.isTrue(game.canMove(c("f6"), c("f5")), "f6f5")
        assert.isFalse(game.canMove(c("f6"), c("f7")), "f6f7")
        assert.isFalse(game.canMove(c("f6"), c("e6")), "f6e6")
        assert.isFalse(game.canMove(c("f6"), c("h6")), "f6h6")
        assert.isFalse(game.canMove(c("f6"), c("f4")), "f6f4")
        assert.isFalse(game.canMove(c("f6"), c("f8")), "f6f8")
        assert.isFalse(game.canMove(c("f6"), c("d6")), "f6d6")


    })

    it("princess moves", () => {

        let game = Game.create()
        game = Game.fromFen("k9/9Q/10/10/10/10/10/C9/10/9K w - - - 0 0")
        assert.isTrue(game.canMove(c("a3"), c("a4")), "a3a4")
        assert.isTrue(game.canMove(c("a3"), c("a5")), "a3a5")
        assert.isTrue(game.canMove(c("a3"), c("b4")), "a3b4")
        assert.isTrue(game.canMove(c("a3"), c("c5")), "a3c5")
        assert.isTrue(game.canMove(c("a3"), c("b3")), "a3b3")
        assert.isTrue(game.canMove(c("a3"), c("c3")), "a3c3")
        assert.isTrue(game.canMove(c("a3"), c("a2")), "a3a2")
        assert.isTrue(game.canMove(c("a3"), c("a1")), "a3a1")
        assert.isTrue(game.canMove(c("a3"), c("b2")), "a3b2")
        assert.isTrue(game.canMove(c("a3"), c("c1")), "a3c1")
        assert.isFalse(game.canMove(c("a3"), c("a6")), "a3c1")
        assert.isFalse(game.canMove(c("a3"), c("b5")), "a3b5")

        game = Game.fromFen("k9/9Q/10/10/2p7/1PCp6/2P7/10/10/9K w - - - 0 0")
        assert.isTrue(game.canMove(c("c5"), c("c6")), "c5c6")
        assert.isTrue(game.canMove(c("c5"), c("c7")), "c5c7")
        assert.isTrue(game.canMove(c("c5"), c("d5")), "c5d5")
        assert.isTrue(game.canMove(c("c5"), c("d6")), "c5d6")
        assert.isFalse(game.canMove(c("c5"), c("b5")), "c5b5")
        assert.isTrue(game.canMove(c("c5"), c("a5")), "c5a5")
        assert.isTrue(game.canMove(c("c5"), c("c3")), "c5c3")

    })

})
