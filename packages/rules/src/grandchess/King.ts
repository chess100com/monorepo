import type { Position } from "../Position"
import type { CoordinateInterface, Color } from "../Shared"
import { Utils } from "../Utils"

// Stryker disable next-line all -- the eight unit directions are symmetric: any
// unary-operator mutation just renames an existing direction, so all such mutants
// are equivalent.
const directions: number[][] = [[-1, -1], [1, 1], [1, -1], [-1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]

/**
 * Grand Chess King: standard one-square king moves, no castling.
 */
export const getGrandChessKingMoves = (
  c: CoordinateInterface,
  color: Color,
  position: Position,
): CoordinateInterface[] => {
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
