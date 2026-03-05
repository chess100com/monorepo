import { assert, describe, it } from "vitest"
import { Game } from "../../src/Game"
import { Utils } from "../../src/Utils"

describe("Prince", () => {

    const c = Utils.parseCoordinate

    it("eat king", () => {
        let game = Game.create()
        game = Game.fromFen("c8k/10/10/10/10/10/10/10/9Q/9K w - - - 0 0")
        game.move(c("j2"), c("j10"))
        assert.equal(game.getFen(), "k8Q/10/10/10/10/10/10/10/10/9K b - - - 1 0")
    })

    it("no check if prince on board", () => {
        let game = Game.create()
        game = Game.fromFen("kQK7/10/10/10/10/10/10/10/10/c9 b - - - 0 1")
        assert.isFalse(game.position.isCheck())
    })

})