import type { Position } from "./Position.js"
import type { CoordinateInterface, Color } from "./Shared.js"
import { Utils } from "./Utils.js"

const directions: number[][] = [[2, 1], [1, 2], [-1, 2], [-2, 1], [-1, -2], [-2, -1], [1, -2], [2, -1]];

export function getKnightMoves(c: CoordinateInterface, color: Color, position: Position): CoordinateInterface[] {
    const returnValue: CoordinateInterface[] = []
    for (const direction of directions) {
        const dx = direction[0]
        const dy = direction[1]
        const newCoord = Utils.dCoord(c, dx, dy)
        if (!newCoord) {
            continue
        }
        const cellInfo = position.cellInfo(newCoord)
        if (cellInfo.empty || cellInfo.color !== color) {
            returnValue.push(newCoord)
        }
    }
    return returnValue
}
