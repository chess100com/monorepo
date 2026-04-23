import { assert, describe, it } from "vitest"
import { Game } from "../../src/Game.js"
import { Utils } from "../../src/Utils.js"
import { Color } from "../../src/Shared.js"

describe("Princess", () => {

    const c = Utils.parseCoordinate

    it("is on board", () => {
        let game = Game.create()

        game = Game.fromFen("ks8/10/10/10/9q/10/7Q2/10/10/9K w - - 0 0")

        assert.isTrue(game.position.princessOnBoard(Color.Black))
    })

    it("princess transforms to queen immediately on queen capture", () => {

        let game = Game.create()

        game = Game.fromFen("ks8/10/10/10/9q/10/7Q2/10/10/9K w - - 0 0")
        game.move(c("h4"), c("k6"))

        assert.equal(game.getFen(), "kq8/10/10/10/9Q/10/10/10/10/9K b - - 0 0")
    })

    it("transformed queen moves as queen (black)", () => {

        let game = Game.create()

        game = Game.fromFen("ks8/10/10/10/9q/10/7Q2/10/10/9K w - - 0 0")
        game.move(c("h4"), c("k6"))

        assert.isTrue(game.canMove(c("b10"), c("b1")), "b10b1")
        game.move(c("b10"), c("b1"))
        assert.equal(game.getFen(), "k9/10/10/10/9Q/10/10/10/10/1q7K w - - 1 1")
    })

    it("other-figure move keeps transformed queen in place (black)", () => {

        let game = Game.create()

        game = Game.fromFen("ks8/10/10/10/9q/10/7Q2/10/10/9K w - - 0 0")
        game.move(c("h4"), c("k6"))
        game.move(c("a10"), c("a9"))
        assert.equal(game.getFen(), "1q8/k9/10/10/9Q/10/10/10/10/9K w - - 1 1")
    })

    it("transformed queen moves as queen (white)", () => {

        let game = Game.create()

        game = Game.fromFen("KS8/10/10/10/9Q/10/7q2/10/10/9k b - - 0 0")
        game.move(c("h4"), c("k6"))

        assert.isTrue(game.canMove(c("b10"), c("b1")), "b10b1")
        game.move(c("b10"), c("b1"))
        assert.equal(game.getFen(), "K9/10/10/10/9q/10/10/10/10/1Q7k b - - 1 1")
    })


})