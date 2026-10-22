import type { Position } from "../Position"
import type { CoordinateInterface, Color } from "../Shared"
import { getRookMoves } from "../common/Rook"
import { getKnightMoves } from "../common/Knight"

/**
 * Marshal = Rook + Knight.
 */
export const getMarshalMoves = (
  c: CoordinateInterface,
  color: Color,
  position: Position,
): CoordinateInterface[] => {
  return [
    ...getRookMoves(c, color, position),
    ...getKnightMoves(c, color, position),
  ]
}
