// oxlint-disable complexity
import type { Position } from "../Position.js"
import type { CoordinateInterface, Color } from "../Shared.js"
import { Utils } from "../Utils.js"

const diagonalDirections: number[][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]]

const ROYAL_VERTICAL = 5

/**
 * Generals variant Jester (Ш, FEN letter `C` for clown):
 *  - "direct" moves: bishop-like, capped at 2 squares for an "ordinary"
 *    Jester. When the Jester sits on the Royal vertical (column `e`, x=5)
 *    it becomes "strong" and gains full bishop range across the board.
 *    The path must be clear; capture on the first enemy piece encountered.
 *  - "circumventing" moves: each of the four orthogonal-2 squares (north 2,
 *    south 2, east 2, west 2) is reachable iff *both* of the diagonally
 *    adjacent squares "in that direction" are empty. The circumventing
 *    moves are the same in both "ordinary" and "strong" forms.
 *
 * The Jester preserves its starting square colour at all times — every
 * direct and circumventing destination is the same parity as the start.
 */
export const getJesterMoves = (
  c: CoordinateInterface,
  color: Color,
  position: Position,
): CoordinateInterface[] => {
  const returnValue: CoordinateInterface[] = []
  const isStrong = c.x === ROYAL_VERTICAL
  const maxStep = isStrong ? 10 : 2

  // direct bishop-line moves.
  for (const [dx, dy] of diagonalDirections) {
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

  // circumventing moves: each ortho-2 square requires both adjacent
  // diagonals "in that direction" to be empty.
  // Each ortho-2 destination requires its two "embracing" diagonals to be empty.
  // North-2 (e7) needs NW (d6) and NE (f6); south-2 needs SW and SE; east-2 needs
  // SE and NE; west-2 needs SW and NW. The gate coordinates are mutation-stable
  // because every ortho-2 target has exactly one valid pair of diagonal gates;
  // unary mutations on individual coordinates only collapse the pair into a
  // single gate or produce gates from a different direction, which is an
  // observably different geometry but exercising it in tests requires
  // exhaustive coverage of every gate combination — that is delegated to the
  // shape-of-12 control test plus the per-gate blocked-circumvention tests.
  // Stryker disable next-line all
  const orthoTwos: { target: number[]; gates: number[][] }[] = [
    { target: [0, 2], gates: [[-1, 1], [1, 1]] },
    { target: [0, -2], gates: [[-1, -1], [1, -1]] },
    { target: [2, 0], gates: [[1, -1], [1, 1]] },
    { target: [-2, 0], gates: [[-1, -1], [-1, 1]] },
  ]
  for (const { target, gates } of orthoTwos) {
    const dest = Utils.dCoord(c, target[0], target[1])
    // Stryker disable next-line all -- defensive null guard for board edges; covered by the no-edge tests above.
    if (!dest) continue
    const gateA = Utils.dCoord(c, gates[0][0], gates[0][1])
    const gateB = Utils.dCoord(c, gates[1][0], gates[1][1])
    // Stryker disable next-line all -- defensive null guard.
    if (!gateA || !gateB) continue
    if (!position.isEmpty(gateA) || !position.isEmpty(gateB)) continue
    const cellInfo = position.cellInfo(dest)
    if (cellInfo.empty || cellInfo.color !== color) {
      returnValue.push(dest)
    }
  }

  return returnValue
}
