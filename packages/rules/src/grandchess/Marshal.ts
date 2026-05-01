import type { Position } from "../Position.js"
import type { CoordinateInterface, Color } from "../Shared.js"
import { getRookMoves } from "../common/Rook.js"
import { getKnightMoves } from "../common/Knight.js"

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
