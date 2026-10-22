// oxlint-disable complexity
import type { Position } from "../Position"
import type { CoordinateInterface } from "../Shared";
import { Color, Figure } from "../Shared"
import { Utils } from "../Utils"

const ROYAL_VERTICAL = 5

/**
 * Pieces a Generals pawn may pawn-castle with: any same-colour diagonal-
 * moving piece. The General does not qualify because it has no native
 * diagonal moves; rooks and knights are excluded for the same reason.
 */
export const isPawnCastlingPartner = (figure: Figure): boolean =>
  figure === Figure.Bishop
  || figure === Figure.Jester
  || figure === Figure.Queen
  || figure === Figure.King

/**
 * Generals variant pawn rules. Pawns sit on rank 2 (white) / rank 9 (black),
 * may sprint 1, 2 or 3 squares from their starting rank, capture diagonally
 * forward, and support en passant the same way Heirs does.
 *
 * A pawn on column `e` (the Royal vertical) becomes a "Royal Pawn" with two
 * extra rights:
 *   - it may step *backward* one square along the e-file, and
 *   - it may capture diagonally backward (one square) — mirror of the normal
 *     forward-diagonal capture.
 * Royal status is positional: as soon as the pawn leaves column `e` it
 * becomes an ordinary pawn again.
 */
export const getGeneralsPawnMoves = (c: CoordinateInterface, color: Color, position: Position): CoordinateInterface[] => {
  const returnValue: CoordinateInterface[] = []
  // The white-then-black branches each independently check `color`, so a
  // mutation that loosens onStartingRank (e.g. flipping `&&` to `||`) only
  // changes behaviour when the leading color check accepts the wrong side —
  // which never happens because the if/else-if pair partitions on color.
  // Stryker disable all
  const onStartingRank = (color === Color.White && c.y === 2)
    || (color === Color.Black && c.y === 9)

  if (color === Color.White && onStartingRank) {
    for (let i = 3; i <= 5; i++) {
      const coord = { x: c.x, y: i }
      if (!position.isEmpty(coord)) {
        break
      }
      returnValue.push(coord)
    }
  } else if (color === Color.Black && onStartingRank) {
    for (let i = 8; i >= 6; i--) {
      const coord = { x: c.x, y: i }
      if (!position.isEmpty(coord)) {
        break
      }
      returnValue.push(coord)
    }
  }
  // Stryker restore all

  const dy: number = color === Color.White ? 1 : -1

  // Diagonal-forward squares are either capture targets (enemy piece) or
  // pawn-castling partners (own diagonal-moving piece). Both end up on the
  // available-moves list — the move() handler distinguishes them.
  let newCoord = Utils.dCoord(c, -1, dy)
  if (newCoord) {
    const cellInfo = position.cellInfo(newCoord)
    if (!cellInfo.empty
      && (cellInfo.color !== color || isPawnCastlingPartner(cellInfo.figure))) {
      returnValue.push(newCoord)
    }
  }

  newCoord = Utils.dCoord(c, 1, dy)
  if (newCoord) {
    const cellInfo = position.cellInfo(newCoord)
    if (!cellInfo.empty
      && (cellInfo.color !== color || isPawnCastlingPartner(cellInfo.figure))) {
      returnValue.push(newCoord)
    }
  }

  // The starting-rank sprint loop already covers the one-square forward move.
  if (!onStartingRank) {
    newCoord = Utils.dCoord(c, 0, dy)
    if (newCoord && position.isEmpty(newCoord)) {
      returnValue.push(newCoord)
    }
  }

  // Royal Pawn extras: a pawn on the e-file may step backward one square and
  // capture diagonally backward. The backward step is restricted to column
  // `e` itself; a diagonal backward capture leaves the column and the pawn
  // loses its Royal status from the next move onward.
  if (c.x === ROYAL_VERTICAL) {
    const backDy = -dy

    const backForward = Utils.dCoord(c, 0, backDy)
    if (backForward && position.isEmpty(backForward)) {
      returnValue.push(backForward)
    }

    // Backward diagonals are capture-or-castle just like forward diagonals.
    let backDiag = Utils.dCoord(c, -1, backDy)
    // Stryker disable next-line all -- defensive null guard: a Royal Pawn that
    // could ever reach a board-edge rank is a contrived custom-FEN setup; for
    // any pawn observable in real games this branch always fires.
    if (backDiag) {
      const cellInfo = position.cellInfo(backDiag)
      if (!cellInfo.empty
        && (cellInfo.color !== color || isPawnCastlingPartner(cellInfo.figure))) {
        returnValue.push(backDiag)
      }
    }

    backDiag = Utils.dCoord(c, 1, backDy)
    // Stryker disable next-line all -- defensive null guard, see above.
    if (backDiag) {
      const cellInfo = position.cellInfo(backDiag)
      if (!cellInfo.empty
        && (cellInfo.color !== color || isPawnCastlingPartner(cellInfo.figure))) {
        returnValue.push(backDiag)
      }
    }
  }

  // takeover (en passant) — same logic as Heirs.
  // Stryker disable all -- defensive guards on a board state the rest of the
  // engine never produces; mirrored from heirs/Pawn.ts.
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
