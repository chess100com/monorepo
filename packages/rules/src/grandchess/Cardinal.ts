import type { Position } from "../Position"
import type { CoordinateInterface, Color } from "../Shared"
import { getBishopMoves } from "../common/Bishop"
import { getKnightMoves } from "../common/Knight"

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
