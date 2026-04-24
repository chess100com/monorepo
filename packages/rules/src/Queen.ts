import type { Position } from "./Position"
import type { CoordinateInterface, Color } from "./Shared"
import { Utils } from "./Utils"

const directions: number[][] = [[-1, -1], [1, 1], [1, -1], [-1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]

export function getQueenMoves(c: CoordinateInterface, color: Color, position: Position): CoordinateInterface[] {
  const returnValue: CoordinateInterface[] = []
  for (const direction of directions) {
    const dx = direction[0]
    const dy = direction[1]
    let index = 1
    while (true) {
      const newCoord = Utils.dCoord(c, dx * index, dy * index)
      if (!newCoord) {
        break
      }
      const cellInfo = position.cellInfo(newCoord)
      if (!cellInfo.empty) {
        if (cellInfo.color !== color) {
          returnValue.push(newCoord)
        }
        break
      }
      returnValue.push(newCoord)
      index++
    }
  }
  return returnValue
}
