import { assert, describe, it } from "vitest"
import { Utils } from "../../src/Utils"
import type { Figure} from "../../src/Shared";
import { Color } from "../../src/Shared"

describe("Utils", () => {

    it("wrong data", () => {

        assert.throw(() => Utils.getColumnIndex("Z"))
        assert.throw(() => Utils.getColumnName(0))
        assert.throw(() => Utils.getColumnName(11))
        assert.isNull(Utils.dCol("j", 1))
        assert.isNull(Utils.dCol("a", -1))
        assert.equal(Utils.dCol("a", 1), "b")
        assert.throw(() => Utils.parseCoordinate("aswert"))
        assert.throw(() => Utils.parseCoordinate(""))
        assert.throw(() => Utils.validateCoordinate({ x: Number.parseInt("asd"), y: 100 }))
        assert.throw(() => Utils.validateCoordinate({ x: 1, y: 0 }))
        assert.throw(() => Utils.validateCoordinate({ x: 1, y: 11 }))
        assert.throw(() => Utils.validateCoordinate({ x: 23, y: 2 }))
        assert.throw(() => Utils.getFigureChar(100 as Figure, Color.White))

    })
})
