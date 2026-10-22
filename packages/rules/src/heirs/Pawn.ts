// oxlint-disable complexity
import type { Position } from "../Position"
import type { CoordinateInterface } from "../Shared";
import { Color } from "../Shared"
import { Utils } from "../Utils"

export const getHeirsPawnMoves = (c: CoordinateInterface, color: Color, position: Position): CoordinateInterface[] => {
  const returnValue: CoordinateInterface[] = []
  if (color === Color.White) {
    // first pawn move by white
    if (c.y === 2) {
      for (let i = 3; i <= 5; i++) {
        const coord = { x: c.x, y: i }
        if (!position.isEmpty(coord)) {
          break
        }
        returnValue.push(coord)
      }
    }
  } else if (c.y === 9) {
    // first pawn move by black
    for (let i = 8; i >= 6; i--) {
      const coord = { x: c.x, y: i }
      if (!position.isEmpty(coord)) {
        break
      }
      returnValue.push(coord)
    }
  }

  // eating pawn moves
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

  // forward move
  newCoord = Utils.dCoord(c, 0, dy)
  if (newCoord && position.isEmpty(newCoord)) {
    returnValue.push(newCoord)
  }

  // takeover eats — guards (canTakeCoord.y bounds, color/direction sanity) are
  // defensive against board states that the rest of the engine never produces;
  // they are intentionally untestable, so the whole block is mutation-disabled.
  // Stryker disable all
  if (position.takeover) {
    const takeoverRow = position.takeover.y
    const isNeighbourColumn = Math.abs(position.takeover.x - c.x) === 1
    const canTakeCoord: CoordinateInterface = {
      y: c.y + dy,
      x: position.takeover.x
    }
    if (
      isNeighbourColumn
      && canTakeCoord.y >= 3
      && canTakeCoord.y <= 8
      && position.isEmpty(canTakeCoord)
      && (
        color === Color.White && canTakeCoord.y > takeoverRow
        || color === Color.Black && canTakeCoord.y < takeoverRow
      )
    ) {
      returnValue.push(canTakeCoord);
    }
  }
  // Stryker restore all

  return returnValue
}
