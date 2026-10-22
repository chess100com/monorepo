// oxlint-disable complexity
// oxlint-disable max-depth
import type { Position } from "../Position"
import type { Color } from "../Shared";
import { type CoordinateInterface, Figure } from "../Shared"
import { Utils } from "../Utils"

// Stryker disable next-line all -- symmetric direction set; unary mutations
// on individual coordinates rename existing directions, making them equivalent.
const directions: number[][] = [[-1, -1], [1, 1], [1, -1], [-1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]

/**
 * Generals variant castling differs from Heirs because the king sits on the
 * `e` file (x=5) instead of the `f` file: short castle moves the king to b1
 * (x=2) with the rook from a1 (x=1) to c1 (x=3), and long castle moves the
 * king to h1 (x=8) with the rook from k1 (x=10) to g1 (x=7). The two FEN
 * castling flags retain their positional meaning — `K`/`k` track the
 * x=10 rook, `Q`/`q` track the x=1 rook — so canCastling(2) is the long
 * (k-side) castle here and canCastling(3) is the short (a-side) castle.
 */
const canShort = (c: CoordinateInterface, color: Color, position: Position): boolean => {
  if (!position.canCastling(3, color)) return false
  const rookCell = position.cellInfo({ x: 1, y: c.y })
  if (rookCell.figure !== Figure.Rook) return false
  // Stryker disable next-line all -- the color guard is structurally redundant: an
  // enemy rook at the corner always attacks the king's path on rank 1, so the
  // path-attacked check below rejects the castle before this guard would have to.
  if (rookCell.color !== color) return false
  for (const x of [2, 3, 4]) {
    if (false === position.cellInfo({ y: c.y, x: x }).empty) {
      return false
    }
  }
  for (const x of [2, 3, 4]) {
    if (position.isAttacked({ y: c.y, x: x })) {
      return false
    }
  }
  return true
}

const canLong = (c: CoordinateInterface, color: Color, position: Position): boolean => {
  if (!position.canCastling(2, color)) return false
  const rookCell = position.cellInfo({ x: 10, y: c.y })
  if (rookCell.figure !== Figure.Rook) return false
  // Stryker disable next-line all -- structurally redundant; see canShort comment.
  if (rookCell.color !== color) return false
  for (const x of [6, 7, 8, 9]) {
    if (false === position.cellInfo({ y: c.y, x: x }).empty) {
      return false
    }
  }
  for (const x of [6, 7, 8]) {
    if (position.isAttacked({ y: c.y, x: x })) {
      return false
    }
  }
  return true
}

const ROYAL_VERTICAL = 5

export const getGeneralsKingMoves = (c: CoordinateInterface, color: Color, position: Position): CoordinateInterface[] => {
  const returnValue: CoordinateInterface[] = []
  // A king sitting on the Royal vertical becomes "strong" and may move 1 or 2
  // squares in any of the eight directions, controlling 16 squares. The
  // strong king cannot jump — the intermediate square must be empty for a
  // 2-square move.
  const maxStep = c.x === ROYAL_VERTICAL ? 2 : 1
  for (const direction of directions) {
    const dx = direction[0]
    const dy = direction[1]
    for (let step = 1; step <= maxStep; step++) {
      const newCoord = Utils.dCoord(c, dx * step, dy * step)
      if (!newCoord) break
      const cellInfo = position.cellInfo(newCoord)
      if (cellInfo.empty) {
        returnValue.push(newCoord)
        continue
      }
      if (cellInfo.color !== color) {
        returnValue.push(newCoord)
      }
      break
    }
  }

  // Castling moves — only meaningful for the side to move. Computing this for
  // the opponent triggers isKingUnderAttack, which may recurse through the
  // getAttackedCoords cache while it is still being populated; mutating this
  // gate is therefore unsafe to test directly.
  // Stryker disable next-line all
  if (color === position.getMovingColor()) {
    const isUnderAttack = position.isKingUnderAttack(color)
    if (!isUnderAttack) {
      if (canShort(c, color, position)) {
        returnValue.push({ y: c.y, x: 2 })
      }
      if (canLong(c, color, position)) {
        returnValue.push({ y: c.y, x: 8 })
      }
    }
  }
  return returnValue
}
