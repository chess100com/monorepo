import { assert, describe, it } from "vitest"
import { Game } from "../../src/Game"

describe("Game finish", () => {

    it("checkmate", () => {

        const positions = [
            "kQK7/10/10/10/10/10/10/10/10/10 b - - - 0 1",
            "kr8/ppN7/10/10/10/10/10/10/10/K9 b - - - 0 1",
            "kQ7S/10/10/10/10/10/10/10/10/K9 b - - - 0 1",
            "k9/Q9/p9/S9/10/10/10/10/10/K9 b - - - 0 1"
        ]
        for (const position of positions) {
            let game = Game.create()
            game = Game.fromFen(position)
            assert.isTrue(game.position.isCheckmate(), `Position ${position} should be a checkmate`)
        }
    })

    it("stalemate by no moves", () => {

        const positions = [
            "k9/10/KQ8/10/10/10/10/10/10/10 b - - - 0 1"
        ]

        for (const position of positions) {
            let game = Game.create()
            game = Game.fromFen(position)
            assert.isTrue(game.position.isStalemate(), `Position ${position} should be a stalemate`)
        }
    })

})
