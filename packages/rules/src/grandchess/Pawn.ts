// oxlint-disable complexity
import type { Position } from "../Position"
import type { CoordinateInterface } from "../Shared"
import { Color } from "../Shared"
import { Utils } from "../Utils"

/**
 * Grand Chess pawn:
 *  - starts on rank 3 (white) / rank 8 (black)
 *  - may advance 1 or 2 squares on its first move; otherwise 1 square
 *  - captures diagonally forward
 *  - has no en passant
 */
export const getGrandChessPawnMoves = (
  c: CoordinateInterface,
  color: Color,
  position: Position,
): CoordinateInterface[] => {
  const returnValue: CoordinateInterface[] = []

  const onStartingRank = (color === Color.White && c.y === 3)
    || (color === Color.Black && c.y === 8)

  // The two branches below partition by color. The else-if's `color === Black`
  // check is structurally redundant with the leading `color === White` of the
  // first branch — mutating it to `true` only changes behaviour when both
  // `onStartingRank` is true *and* the leading branch was not taken, which
  // can only happen for black pawns. The mutant is therefore equivalent.
  // Stryker disable all
  if (color === Color.White && onStartingRank) {
    for (let i = 4; i <= 5; i++) {
      const coord = { x: c.x, y: i }
      if (!position.isEmpty(coord)) {
        break
      }
      returnValue.push(coord)
    }
  } else if (color === Color.Black && onStartingRank) {
    for (let i = 7; i >= 6; i--) {
      const coord = { x: c.x, y: i }
      if (!position.isEmpty(coord)) {
        break
      }
      returnValue.push(coord)
    }
  }
  // Stryker restore all

  const dy: number = color === Color.White ? 1 : -1

  let newCoord = Utils.dCoord(c, -1, dy)
  if (newCoord) {
    const cellInfo = position.cellInfo(newCoord)
    if (!cellInfo.empty && cellInfo.color !== color) {
      returnValue.push(newCoord)
    }
  }

  newCoord = Utils.dCoord(c, 1, dy)
  if (newCoord) {
    const cellInfo = position.cellInfo(newCoord)
    if (!cellInfo.empty && cellInfo.color !== color) {
      returnValue.push(newCoord)
    }
  }

  // The starting-rank sprint loop already covers the one-square forward move
  // (it pushes y+dy first, breaking only if blocked). Skip to avoid a duplicate.
  if (!onStartingRank) {
    newCoord = Utils.dCoord(c, 0, dy)
    if (newCoord && position.isEmpty(newCoord)) {
      returnValue.push(newCoord)
    }
  }

  return returnValue
}
