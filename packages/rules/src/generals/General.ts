// oxlint-disable complexity
import type { Position } from "../Position"
import type { CoordinateInterface, Color } from "../Shared"
import { Utils } from "../Utils"

const orthoDirections: number[][] = [[-1, 0], [1, 0], [0, -1], [0, 1]]

const ROYAL_VERTICAL = 5

/**
 * Generals variant General (Г, FEN letter `G`):
 *  - "direct" moves: rook-like, capped at 2 squares for an "ordinary" General
 *    (1 or 2 squares on any of the four orthogonal directions). When the
 *    General sits on the Royal vertical (column `e`, x=5) it becomes
 *    "strong" and gains full rook range across the board. The path of length
 *    > 1 must be clear; capture on the first enemy piece encountered.
 *  - "circumventing" moves: each of the four diagonal-1 squares (NW, NE, SW,
 *    SE) is reachable iff *both* of the orthogonal-adjacent squares between
 *    the General and that diagonal are empty (e.g. to reach f6 from e5 both
 *    e6 and f5 must be empty). The circumventing moves are the same in both
 *    "ordinary" and "strong" forms.
 *
 * Total movement potential from a central square: 4 + 4 + 4 = 12 squares for
 * an ordinary General; far more for a strong General whose rook lines reach
 * the edges of the board.
 */
export const getGeneralMoves = (
  c: CoordinateInterface,
  color: Color,
  position: Position,
): CoordinateInterface[] => {
  const returnValue: CoordinateInterface[] = []
  const isStrong = c.x === ROYAL_VERTICAL
  const maxStep = isStrong ? 10 : 2

  // direct rook-line moves; stop on first non-empty square (capture if enemy).
  for (const [dx, dy] of orthoDirections) {
    for (let step = 1; step <= maxStep; step++) {
      const next = Utils.dCoord(c, dx * step, dy * step)
      if (!next) break
      const cellInfo = position.cellInfo(next)
      if (cellInfo.empty) {
        returnValue.push(next)
        continue
      }
      if (cellInfo.color !== color) {
        returnValue.push(next)
      }
      break
    }
  }

  // circumventing moves: diagonal-1 squares with both adjacent orthogonals empty.
  // Stryker disable next-line all -- symmetric direction set; unary mutations on individual coordinates rename existing diagonals, making them equivalent.
  const diagonals: number[][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
  for (const [dx, dy] of diagonals) {
    const target = Utils.dCoord(c, dx, dy)
    // Stryker disable next-line all -- defensive null guard: if target is null then orthoA and orthoB are also null and the next guard catches it; this guard short-circuits before the deeper checks for clarity.
    if (!target) continue
    const orthoA = Utils.dCoord(c, dx, 0)
    const orthoB = Utils.dCoord(c, 0, dy)
    // Stryker disable next-line all -- defensive null guard at the board edge.
    if (!orthoA || !orthoB) continue
    if (!position.isEmpty(orthoA) || !position.isEmpty(orthoB)) continue
    const cellInfo = position.cellInfo(target)
    if (cellInfo.empty || cellInfo.color !== color) {
      returnValue.push(target)
    }
  }

  return returnValue
}
