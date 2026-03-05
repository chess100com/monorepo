import { assert, describe, it } from "vitest"
import { Game } from "../../src/Game"
import { Utils } from "../../src/Utils"
import { Color } from "../../src/Shared"

describe("Princess", () => {

    const c = Utils.parseCoordinate

    it("is on board", () => {
        let game = Game.create()

        game = Game.fromFen("ks8/10/10/10/9q/10/7Q2/10/10/9K w - - - 0 0")

        assert.isTrue(game.position.princessOnBoard(Color.Black))
    })

    it("set princess transform withoung eating, throw", () => {
        const game = Game.create()
        assert.throw(() => game.setPrincessTransformRejected(true))
    })

    it("just eaten", () => {

        let game = Game.create()

        game = Game.fromFen("ks8/10/10/10/9q/10/7Q2/10/10/9K w - - - 0 0")
        game.move(c("h4"), c("j6"))

        assert.isTrue(game.position.isQueenJustEaten)
        assert.equal(game.getFen(), "ks8/10/10/10/9Q/10/10/10/10/9K b - - x 1 0")

    })

    it("transform approved by black", () => {

        let game = Game.create()

        game = Game.fromFen("ks8/10/10/10/9q/10/7Q2/10/10/9K w - - - 0 0")
        game.move(c("h4"), c("j6"))

        assert.isTrue(game.canMove(c("b10"), c("b1")), "b10b1")
        game.move(c("b10"), c("b1"))
        assert.equal(game.getFen(), "k9/10/10/10/9Q/10/10/10/10/1q7K w - - - 2 1")
    })

    it("transform approved by black, move by another figure", () => {

        let game = Game.create()

        game = Game.fromFen("ks8/10/10/10/9q/10/7Q2/10/10/9K w - - - 0 0")
        game.move(c("h4"), c("j6"))
        game.move(c("a10"), c("a9"))
        assert.equal(game.getFen(), "1q8/k9/10/10/9Q/10/10/10/10/9K w - - - 2 1")
    })

    it("transform approved by white", () => {

        let game = Game.create()

        game = Game.fromFen("KS8/10/10/10/9Q/10/7q2/10/10/9k b - - - 0 0")
        game.move(c("h4"), c("j6"))

        assert.isTrue(game.canMove(c("b10"), c("b1")), "b10b1")
        game.move(c("b10"), c("b1"))
        assert.equal(game.getFen(), "K9/10/10/10/9q/10/10/10/10/1Q7k b - - - 2 1")
    })


    it("transform rejected by black", () => {

        let game = Game.create()

        game = Game.fromFen("ks8/10/10/10/9q/10/7Q2/10/10/9K w - - - 0 0")
        game.move(c("h4"), c("j6"))

        game.setPrincessTransformRejected(true)
        assert.isTrue(game.position.isPrincessTransformRejceted)
        assert.isFalse(game.canMove(c("b10"), c("b1")), "b10b1")
        game.move(c("b10"), c("b8"))

        assert.equal(game.getFen(), "k9/10/1s8/10/9Q/10/10/10/10/9K w - - b 2 1")
    })

    it("transform rejected by white", () => {

        let game = Game.create()

        game = Game.fromFen("KS8/10/10/10/9Q/10/7q2/10/10/9k b - - - 0 0")
        game.move(c("h4"), c("j6"))

        game.setPrincessTransformRejected(true)
        assert.isFalse(game.canMove(c("b10"), c("b1")), "b10b1")
        game.move(c("b10"), c("b8"))

        assert.equal(game.getFen(), "K9/10/1S8/10/9q/10/10/10/10/9k b - - w 2 1")
    })

    it("fen with all rejected", () => {

        let game = Game.create()
        const fen = "ks8/10/10/10/9q/10/7Q2/10/10/9K w - - wb 0 0"
        game = Game.fromFen(fen)
        assert.equal(game.getFen(), fen)
    })

})