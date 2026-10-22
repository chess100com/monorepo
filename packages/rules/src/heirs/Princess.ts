import type { Position } from "../Position"
import type { CoordinateInterface, Color } from "../Shared"
import { Utils } from "../Utils"

// Stryker disable next-line all -- symmetric direction set; any unary-operator
// mutation just renames an existing direction, making the mutants equivalent.
const directions: number[][] = [[-1, -1], [1, 1], [1, -1], [-1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]];

/**
 * Princess and Prince share the same movement: up to 2 squares in any of
 * the eight directions. The Heirs variant carries both pieces; Grand Chess
 * does not have either.
 */
export const getPrincessMoves = (
  c: CoordinateInterface,
  color: Color,
  position: Position,
  checkFriendlyPieces = true
): CoordinateInterface[] => {
  const returnValue: CoordinateInterface[] = []
  for (const direction of directions) {
    const dx = direction[0]
    const dy = direction[1]
    for (let index = 1; index <= 2; index++) {
      const newCoord = Utils.dCoord(c, dx * index, dy * index)
      if (!newCoord) {
        break
      }
      const cellInfo = position.cellInfo(newCoord)
      if (!cellInfo.empty && checkFriendlyPieces) {
        if (cellInfo.color !== color) {
          returnValue.push(newCoord)
        }
      } else {
        returnValue.push(newCoord)
      }
    }
  }
  return returnValue
}
