import type { Position } from "../Position.js"
import type { CoordinateInterface, Color } from "../Shared.js"
import { getBishopMoves } from "../common/Bishop.js"
import { getKnightMoves } from "../common/Knight.js"

/**
 * Cardinal = Bishop + Knight.
 */
export const getCardinalMoves = (
  c: CoordinateInterface,
  color: Color,
  position: Position,
): CoordinateInterface[] => {
  return [
    ...getBishopMoves(c, color, position),
    ...getKnightMoves(c, color, position),
  ]
}
