import { assert, describe, it } from "vitest"
import { Game } from "../../src/Game"
import { Utils } from "../../src/Utils"

describe("Prince", () => {

    const c = Utils.parseCoordinate

    it("eat king", () => {
        let game = Game.create()
        game = Game.fromFen("c8k/10/10/10/10/10/10/10/9Q/9K w - - 0 0")
        game.move(c("k2"), c("k10"))
        assert.equal(game.getFen(), "k8Q/10/10/10/10/10/10/10/10/9K b - - 0 0")
    })

    it("no check if prince on board", () => {
        let game = Game.create()
        game = Game.fromFen("kQK7/10/10/10/10/10/10/10/10/c9 b - - 0 1")
        assert.isFalse(game.position.isCheck())
    })

    it("with a Prince on board, the player may make a move that leaves their own king attacked", () => {
        // White: King a1, Prince e1; Black: King a10, Rook a8 (attacks the a-file
        // and pins the white king). Without a Prince this would force the king to
        // run; with a Prince on board, white may also leave the king attacked
        // because if it is captured the Prince becomes the King.
        const game = Game.fromFen("k9/10/10/10/10/10/10/r9/10/K3C5 w - - 0 1")
        const moves = game.position.getAvailableMoves()
        // The Prince at e1 must have legal moves even though doing so would leave
        // the white King under attack from the rook.
        const princeMoves = moves.filter(m => m.from.x === 5 && m.from.y === 1)
        assert.isTrue(princeMoves.length > 0,
            "a Prince must have at least one legal move while own king is in check")
    })

})