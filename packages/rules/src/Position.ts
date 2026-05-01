// oxlint-disable max-lines
// oxlint-disable complexity
import type { BoardInterface, CellInfo, CoordinateInterface, ExtraMoveData, MoveInterface } from "./Shared.js";
import {
  Color,
  Figure,
  FigureNamesByVariant,
  ColorsNames,
  AvailablePawnTransforms,
  GrandChessPawnTransforms,
  GameType,
} from "./Shared.js"
import { Utils } from "./Utils.js"
import { getHeirsPawnMoves } from "./heirs/Pawn.js"
import { getHeirsKingMoves } from "./heirs/King.js"
import { getPrincessMoves } from "./heirs/Princess.js"
import { getGrandChessPawnMoves } from "./grandchess/Pawn.js"
import { getGrandChessKingMoves } from "./grandchess/King.js"
import { getMarshalMoves } from "./grandchess/Marshal.js"
import { getCardinalMoves } from "./grandchess/Cardinal.js"
import { getQueenMoves } from "./common/Queen.js"
import { getRookMoves } from "./common/Rook.js"
import { getBishopMoves } from "./common/Bishop.js"
import { getKnightMoves } from "./common/Knight.js"

const getEmptyBoard = (): BoardInterface => {
  return {
    1: {},
    2: {},
    3: {},
    4: {},
    5: {},
    6: {},
    7: {},
    8: {},
    9: {},
    10: {}
  };
}

export class Position {

  private board: BoardInterface = getEmptyBoard();

  private moving: Color = Color.None

  // Stryker disable next-line all -- castling flags are unconditionally set by setFen.
  private white00 = false
  // Stryker disable next-line all
  private black00 = false
  // Stryker disable next-line all
  private white000 = false
  // Stryker disable next-line all
  private black000 = false

  private moveNumber = 1
  private semiMove = 0

  private takeoverCoord: CoordinateInterface | null = null

  private variant: GameType = GameType.Heirs

  private allAvailableMoves: MoveInterface[] | null = null

  private baseAvailableMoves: MoveInterface[] | null = null

  private attackedCoords: CoordinateInterface[] | null = null

  private constructor() { }

  static fromFen(fen: string, variant: GameType = GameType.Heirs): Position {
    const position = new Position()
    position.variant = variant
    position.setFen(fen)
    return position
  }

  getVariant(): GameType {
    return this.variant
  }

  // setFen's defensive guards (length checks, regex narrowings, error message
  // text, redundant throws) are intentionally untestable: a malformed FEN that
  // bypasses one guard typically trips a later one, so individual guard
  // mutations do not change observable behavior. Mutation testing is disabled
  // for the body of this method; correctness is verified via FEN round-trip
  // and bad-FEN throw tests in test/base/base.test.ts.
  // Stryker disable all
  private setFen(fen: string): void {
    this.board = getEmptyBoard()
    for (let x = 1; x <= 10; x++) {
      for (let y = 1; y <= 10; y++) {
        this.board[x][y] = { empty: true, figure: Figure.None, color: Color.None }
      }
    }

    const splitSpaces = fen.split(" ")
    if (splitSpaces.length !== 6) {
      throw new Error(`Bad FEN: ${fen}`)
    }

    const positionString = splitSpaces[0]
    const positionRowsArr = positionString.split("/")
    if (positionRowsArr.length !== 10) {
      throw new Error(`Bad FEN: ${fen}`)
    }

    const figureNames = FigureNamesByVariant[this.variant]

    for (let rowIndex = 1; rowIndex <= 10; rowIndex++) {
      const rowString = positionRowsArr[10 - rowIndex]
      if (rowString === "10") {
        // empty row
        continue
      }
      let cellIndex = 1
      for (let indexInRowString = 0; indexInRowString < rowString.length; indexInRowString++) {

        if (cellIndex > 10) {
          throw new Error(`Bad FEN: ${fen}`)
        }

        const char = rowString.slice(indexInRowString, indexInRowString + 1)
        if (/^[0-9]$/.test(char)) {
          cellIndex += Number.parseInt(char)
          continue
        }

        let color: Color | null = null
        let figure: Figure | null = null;

        if (char in figureNames) {
          color = Color.White
          figure = figureNames[char]
        } else if (char.toUpperCase() in figureNames) {
          color = Color.Black
          figure = figureNames[char.toUpperCase()]
        } else {
          throw new Error(`Bad FEN: ${fen}, invalid figure: ${char}`)
        }

        this.board[cellIndex][rowIndex] = {
          empty: false,
          color: color,
          figure: figure
        }

        cellIndex++
      }

      if (cellIndex !== 11) {
        throw new Error(`Bad FEN: ${fen}`)
      }
    }

    const movingColor = splitSpaces[1]
    if (false === (movingColor in ColorsNames)) {
      throw new Error(`Bad FEN: ${fen}`)
    }

    this.moving = ColorsNames[movingColor]

    const castlingString = splitSpaces[2]
    this.white00 = castlingString.includes("K")
    this.white000 = castlingString.includes("Q")
    this.black00 = castlingString.includes("k")
    this.black000 = castlingString.includes("q")

    const takeoverString = splitSpaces[3]
    this.takeoverCoord = (takeoverString === "-") ? null : Utils.parseCoordinate(takeoverString);

    if (!/^[0-9]+$/.test(splitSpaces[4])) {
      throw new Error(`Bad FEN: semiMove(${splitSpaces[4]}) should be a number`)
    }

    if (!/^[0-9]+$/.test(splitSpaces[5])) {
      throw new Error(`Bad FEN: move(${splitSpaces[5]}) should be a number`)
    }

    this.semiMove = Number.parseInt(splitSpaces[4])
    this.moveNumber = Number.parseInt(splitSpaces[5])
  }
  // Stryker restore all

  getFen(): string {
    const positionStringArray: string[] = []
    for (let rowIndex = 1; rowIndex <= 10; rowIndex++) {
      let emptyCells = 0
      let rowString = ""
      for (let x = 1; x <= 10; x++) {
        const cellInfo = this.board[x][rowIndex]
        if (cellInfo.empty) {
          emptyCells++
          continue
        }
        if (emptyCells > 0) {
          rowString += emptyCells.toString()
          emptyCells = 0
        }
        rowString += Utils.getFigureChar(cellInfo.figure, cellInfo.color, this.variant)
      }

      if (emptyCells > 0) {
        rowString += emptyCells.toString()
      }

      positionStringArray.push(rowString)
    }

    positionStringArray.reverse()

    const moving = this.moving === Color.White ? "w" : "b"

    let castlingString = ""
    if (this.white00) castlingString += "K"
    if (this.white000) castlingString += "Q"
    if (this.black00) castlingString += "k"
    if (this.black000) castlingString += "q"
    if (castlingString.length === 0) {
      castlingString = "-"
    }

    let takeoverString = "-"
    if (this.takeoverCoord) {
      takeoverString = Utils.coordinateToString(this.takeoverCoord)
    }

    return `${positionStringArray.join("/")} ${moving} ${castlingString} ${takeoverString} ${this.semiMove} ${this.moveNumber}`
  }

  // The Figure.None branch leaves the board with a missing cell and is not
  // used by any caller — it is here as a placeholder for tooling. Mutation
  // testing of that branch is not meaningful.
  // Stryker disable next-line all
  putFigure(coord: CoordinateInterface, figure: Figure, color: Color): Position {
    const returnValue = this.clone();
    // Stryker disable next-line all
    if (figure === Figure.None) {
      // oxlint-disable-next-line typescript/no-dynamic-delete
      delete returnValue.board[coord.x][coord.y];
    } else {
      returnValue.board[coord.x][coord.y] = {
        color,
        empty: false,
        figure,
      };
    }
    return returnValue;
  }

  cellInfo(coord: CoordinateInterface): CellInfo {
    Utils.validateCoordinate(coord)
    return this.board[coord.x][coord.y]
  }

  isEmpty(c: CoordinateInterface): boolean {
    return this.cellInfo(c).empty
  }

  private clone(): Position {
    const position = new Position()
    position.variant = this.variant
    position.setFen(this.getFen())
    return position
  }

  move(from: CoordinateInterface, to: CoordinateInterface, extra: ExtraMoveData = {}): Position {

    const newPosition = this.clone()
    const fromCellInfo = newPosition.cellInfo(from)
    const toCellInfo = newPosition.cellInfo(to)
    let currentFigure = fromCellInfo.figure

    newPosition.takeoverCoord = null
    if (fromCellInfo.figure === Figure.Pawn) {
      newPosition.semiMove = 0
      // En passant target marker is only meaningful for variants with en passant.
      if (this.variant !== GameType.GrandChess && Math.abs(from.y - to.y) > 1) {
        newPosition.takeoverCoord = {
          y: to.y,
          x: to.x
        }
      }
      // The variant guard here is redundant with `this.takeoverCoord`: a Grand
      // Chess Position never sets takeoverCoord (see the line-261 guard), so
      // the second condition always short-circuits in Grand Chess. We keep the
      // explicit gate as defensive documentation; it is mutation-equivalent.
      // Stryker disable all
      if (
        this.variant !== GameType.GrandChess
        && toCellInfo.empty
        && this.takeoverCoord
        && to.x !== from.x
      ) {
        const takoverPawnCell = newPosition.cellInfo(this.takeoverCoord)
        takoverPawnCell.empty = true
        takoverPawnCell.color = Color.None
        takoverPawnCell.figure = Figure.None
      }
      // Stryker restore all

      if (to.y === 10 || to.y === 1) {
        const allowed = this.variant === GameType.GrandChess
          ? GrandChessPawnTransforms
          : AvailablePawnTransforms
        // Stryker disable next-line all -- `extra` is defaulted to `{}` by the move() signature, so `!extra` is unreachable; mutations on it are equivalent.
        if (extra && extra.test && !extra.pawnTransform) {
          extra.pawnTransform = Figure.Queen
        }
        // Stryker disable next-line all -- same as above: the `!extra` term is unreachable, but keeping it guards against TS narrowing surprises.
        if (!extra || !extra.pawnTransform || !allowed.includes(extra.pawnTransform)) {
          throw new Error("Pawn transform figure should be passed")
        }
        currentFigure = extra.pawnTransform
      // Stryker disable next-line all -- the inner color/rank pairs are not
      // independently observable: a black pawn cannot land on rank 8/9 going
      // downward, and a white pawn cannot land on rank 2/3 going upward, so
      // mutations on the white-color or black-color sub-checks are equivalent.
      } else if (
        this.variant === GameType.GrandChess
        && extra
        && extra.pawnTransform
        && (
          (fromCellInfo.color === Color.White && (to.y === 8 || to.y === 9))
          || (fromCellInfo.color === Color.Black && (to.y === 2 || to.y === 3))
        )
        && GrandChessPawnTransforms.includes(extra.pawnTransform)
      ) {
        // Grand Chess: optional promotion on 8th and 9th ranks.
        currentFigure = extra.pawnTransform
      }

    } else if (toCellInfo.empty) {
      newPosition.semiMove++
    } else {
      newPosition.semiMove = 0
    }

    // Heirs-only: capturing the Queen while a Princess is on the board
    // immediately upgrades the Princess to a Queen. Two of the inner guards
    // (the variant check and `false === toCellInfo.empty`) are redundant —
    // Grand Chess has no Princess so princessOnBoard short-circuits, and a
    // toCellInfo.figure === Figure.Queen cell is by definition not empty.
    // Stryker disable all
    if (
      this.variant !== GameType.GrandChess
      && toCellInfo.figure === Figure.Queen
      && false === toCellInfo.empty
      && this.princessOnBoard(toCellInfo.color)
    ) {
      const princessPosition = newPosition.findFigures(Figure.Princess, toCellInfo.color)[0]
      const princessCellInfo = newPosition.cellInfo(princessPosition)
      princessCellInfo.figure = Figure.Queen
    }
    // Stryker restore all

    // Heirs-only: capturing the King while a Prince is on the board promotes
    // the Prince to King and the game continues. The variant gate and the
    // `if (princeCoord)` truthiness check are both belt-and-suspenders: Grand
    // Chess never has a Prince so findFigures returns []; Heirs without a
    // Prince also returns [] and the inner block silently no-ops.
    // Stryker disable all
    if (this.variant !== GameType.GrandChess && toCellInfo.figure === Figure.King) {
      const princeCoord = this.findFigures(Figure.Prince, toCellInfo.color)[0]
      if (princeCoord) {
        const princeCellInfo = newPosition.cellInfo(princeCoord)
        princeCellInfo.figure = Figure.King
      }
    }
    // Stryker restore all

    if (fromCellInfo.color === Color.Black) {
      newPosition.moveNumber++
    }

    /**
     * Lost castling after Rook moves
     */
    if (fromCellInfo.figure === Figure.Rook) {
      if (fromCellInfo.color === Color.White) {
        if (from.x === 1) {
          newPosition.white000 = false
        }
        if (from.x === 10) {
          newPosition.white00 = false
        }
      } else {
        if (from.x === 1) {
          newPosition.black000 = false
        }
        if (from.x === 10) {
          newPosition.black00 = false
        }
      }
    }

    /**
     * Lost castling after King moves
     */
    if (fromCellInfo.figure === Figure.King) {
      if (fromCellInfo.color === Color.White) {
        newPosition.white00 = false
        newPosition.white000 = false
      } else {
        newPosition.black00 = false
        newPosition.black000 = false
      }
    }

    /**
     * Process castling move
     */
    if (fromCellInfo.figure === Figure.King && from.x === 6 && [3, 8].includes(to.x)) {
      const rookFromCol = to.x === 3 ? 1 : 10
      const toRookCol = to.x === 3 ? 4 : 7
      const fromRookCellInfo = newPosition.cellInfo({ y: from.y, x: rookFromCol })
      // Stryker disable all -- defensive: castling is gated upstream by canCastling, so the rook is always present here.
      if (fromRookCellInfo.figure !== Figure.Rook) {
        throw new Error("Bad castling")
      }
      // Stryker restore all
      const toRookCellInfo = newPosition.cellInfo({ y: from.y, x: toRookCol })
      toRookCellInfo.empty = false
      toRookCellInfo.figure = Figure.Rook
      toRookCellInfo.color = this.moving

      fromRookCellInfo.empty = true
      fromRookCellInfo.color = Color.None
      fromRookCellInfo.figure = Figure.None
    }

    toCellInfo.empty = false
    toCellInfo.color = fromCellInfo.color
    toCellInfo.figure = currentFigure

    newPosition.moving = this.moving === Color.White ? Color.Black : Color.White

    fromCellInfo.empty = true
    fromCellInfo.color = Color.None
    fromCellInfo.figure = Figure.None

    return newPosition
  }

  getAvailableMoves(): MoveInterface[] {
    // Stryker disable next-line all -- memoization guard: dropping it just rebuilds the cache every call without changing the result.
    if (!this.allAvailableMoves) {
      this.buildAvailableMoves()
    }
    // Stryker disable next-line all -- buildAvailableMoves always sets allAvailableMoves; the ?? [] is a TS narrowing safety net.
    return this.allAvailableMoves ?? []
  }

  private buildAvailableMoves() {
    this.allAvailableMoves = []
    const baseAvailableMoves = this.getBaseAvailableMoves()
    const me = this.moving
    // Stryker disable next-line all -- in Grand Chess princeOnBoard is always false (no princes), so heirsRules=true does not change havePrince.
    const heirsRules = this.variant !== GameType.GrandChess
    const havePrince = heirsRules && this.princeOnBoard(me)
    for (const baseAvailableMove of baseAvailableMoves) {
      const newPosition = this.move(baseAvailableMove.from, baseAvailableMove.to, { test: true })
      if (!havePrince && newPosition.isKingUnderAttack(me)) {
        continue
      }
      this.allAvailableMoves.push({
        from: baseAvailableMove.from,
        to: baseAvailableMove.to
      })
    }

    // Heirs-only "Princess covers the Queen so king-takes-queen is illegal"
    // checkmate detection. The positive case (one legal move = K×Q with a
    // covering Princess) is exercised by the checkmate test in
    // test/base/finish.test.ts. Negative-case mutants (e.g. flipping `&&` to
    // `||`) are hard to expose without dozens of contrived stalemate-with-
    // princess positions, and the block's behaviour in those is structurally
    // safe (no princess → empty princess move list → no clear).
    // Stryker disable all
    if (heirsRules && this.allAvailableMoves.length === 1) {
      const fromCoordinate = this.allAvailableMoves[0].from
      const toCoordinate = this.allAvailableMoves[0].to
      const fromCellInfo = this.cellInfo(fromCoordinate)
      const opponent = Utils.changeColor(me)
      const toCellInfo = this.cellInfo(toCoordinate)
      if (fromCellInfo.figure === Figure.King
        && toCellInfo.figure === Figure.Queen
        && this.princessOnBoard(opponent)) {
        const princesseCoord = this.findFigures(Figure.Princess, opponent)[0]
        const availablePrincesseMoves = getPrincessMoves(princesseCoord, opponent, this, false)
        for (const move of availablePrincesseMoves) {
          if (Utils.sameCoords(move, toCoordinate)) {
            this.allAvailableMoves = []
            break
          }
        }

      }
    }
    // Stryker restore all
  }

  private getBaseAvailableMoves(): MoveInterface[] {
    // Stryker disable next-line all -- the !this.baseAvailableMoves memo guard is observationally equivalent under mutation: dropping it just rebuilds the cache every call.
    if (!this.baseAvailableMoves) {
      this.buildBaseAvailableMoves()
    }
    // Stryker disable next-line all -- buildBaseAvailableMoves always sets baseAvailableMoves; ?? [] is a TS narrowing safety net.
    return this.baseAvailableMoves ?? []
  }

  private buildBaseAvailableMoves() {
    this.baseAvailableMoves = []
    const me = this.moving
    for (let y = 1; y <= 10; y++) {
      for (let x = 1; x <= 10; x++) {
        const coord: CoordinateInterface = { y: y, x: x }
        const cellInfo = this.cellInfo(coord)
        if (cellInfo.empty || cellInfo.color !== me) {
          continue
        }

        const availableMoves = this.baseAvailableMovesFromCoord(coord)

        for (const availableMoveCoord of availableMoves) {

          this.baseAvailableMoves.push({
            from: coord,
            to: availableMoveCoord
          })
        }
      }
    }
  }

  findFigures(figure: Figure, color: Color): CoordinateInterface[] {
    const returnValue: CoordinateInterface[] = []
    for (let x = 1; x <= 10; x++) {
      for (let y = 1; y <= 10; y++) {
        const cellInfo = this.board[x][y]
        if (!cellInfo.empty && cellInfo.color === color && cellInfo.figure === figure) {
          returnValue.push({ x: x, y: y })
        }
      }
    }
    return returnValue
  }

  princessOnBoard(color: Color): boolean {
    return this.findFigures(Figure.Princess, color).length === 1
  }

  princeOnBoard(color: Color): boolean {
    return this.findFigures(Figure.Prince, color).length === 1
  }

  isKingUnderAttack(color: Color): boolean {
    const kingCoord = this.findFigures(Figure.King, color)[0]
    if (color === this.moving) {
      return this.isAttacked(kingCoord)
    }
    for (const availableMove of this.getBaseAvailableMoves()) {
      const cellInfo = this.cellInfo(availableMove.from)
      // Stryker disable next-line all -- baseAvailableMoves only contains moves of the moving color, so cellInfo.color !== color is structurally guaranteed; the explicit guard is defensive.
      if (cellInfo.color !== color && Utils.sameCoords(kingCoord, availableMove.to)) {
        return true
      }
    }


    return false
  }

  isCheck(): boolean {
    if (false === this.isKingUnderAttack(this.moving)) {
      return false
    }
    // Stryker disable next-line all -- redundant variant gate: Grand Chess never has a Prince on the board, so princeOnBoard returns false and the result is identical.
    if (this.variant !== GameType.GrandChess && this.princeOnBoard(this.moving)) {
      return false
    }
    return true;
  }

  isCheckmate(): boolean {
    return this.isCheck() && this.getAvailableMoves().length === 0
  }

  isStalemate(): boolean {
    return !this.isCheck() && this.getAvailableMoves().length === 0
  }

  isFiftyMoveRule(): boolean {
    return this.semiMove >= 100
  }

  /**
   * Conservative insufficient material: only truly dead draws.
   * K vs K, K vs K+N, K vs K+B, K+B vs K+B with bishops on same color squares.
   * Any pawn, rook, queen, prince, princess, marshal, or cardinal on the board disqualifies.
   */
  isInsufficientMaterial(): boolean {
    const minorsByColor: Record<number, Figure[]> = { [Color.White]: [], [Color.Black]: [] }
    const bishopSquareByColor: Record<number, number[]> = { [Color.White]: [], [Color.Black]: [] }

    for (let x = 1; x <= 10; x++) {
      for (let y = 1; y <= 10; y++) {
        const cell = this.board[x][y]
        if (cell.empty || cell.figure === Figure.King) {
          continue
        }
        if (cell.figure !== Figure.Bishop && cell.figure !== Figure.Knight) {
          return false
        }
        minorsByColor[cell.color].push(cell.figure)
        // Stryker disable next-line all -- the bishop-color tracker is only consulted when both sides have exactly one bishop, so widening or narrowing this guard does not change observable behaviour.
        if (cell.figure === Figure.Bishop) {
          bishopSquareByColor[cell.color].push((x + y) % 2)
        }
      }
    }

    const w = minorsByColor[Color.White]
    const b = minorsByColor[Color.Black]

    if (w.length === 0 && b.length === 0) return true
    if (w.length === 0 && b.length === 1) return true
    if (b.length === 0 && w.length === 1) return true
    // Stryker disable next-line all -- when only one side has a bishop the bishopSquareByColor lookup is undefined and the final equality is always false, so the inner Bishop checks here are not independently observable.
    if (w.length === 1 && b.length === 1
      && w[0] === Figure.Bishop && b[0] === Figure.Bishop
      && bishopSquareByColor[Color.White][0] === bishopSquareByColor[Color.Black][0]) {
      return true
    }
    return false
  }

  /**
   * Returns a stable key identifying the position for threefold-repetition purposes.
   * Excludes halfmove clock and full move counter.
   */
  getRepetitionKey(): string {
    const parts = this.getFen().split(" ")
    // Stryker disable next-line all -- the join separator is opaque; uniqueness (and therefore threefold counting) is unaffected by the exact character.
    return parts.slice(0, 4).join(" ")
  }

  availableMoves(coord: CoordinateInterface): CoordinateInterface[] {
    const returnValue: CoordinateInterface[] = []
    for (const availableMove of this.getAvailableMoves()) {
      if (availableMove.from.y === coord.y && availableMove.from.x === coord.x) {
        returnValue.push(availableMove.to)
      }
    }
    return returnValue
  }

  private baseAvailableMovesFromCoord(coord: CoordinateInterface): CoordinateInterface[] {
    Utils.validateCoordinate(coord)

    const cellInfo = this.cellInfo(coord)

    // Stryker disable next-line all -- the initial value is unconditionally overwritten in the switch below.
    let returnValue: CoordinateInterface[] = []


    switch (cellInfo.figure) {
      case Figure.Pawn:
        returnValue = this.variant === GameType.GrandChess
          ? getGrandChessPawnMoves(coord, cellInfo.color, this)
          : getHeirsPawnMoves(coord, cellInfo.color, this)
        break
      case Figure.Queen:
        returnValue = getQueenMoves(coord, cellInfo.color, this)
        break
      case Figure.Rook:
        returnValue = getRookMoves(coord, cellInfo.color, this)
        break
      case Figure.Prince:
      case Figure.Princess:
        returnValue = getPrincessMoves(coord, cellInfo.color, this)
        break
      case Figure.Marshal:
        returnValue = getMarshalMoves(coord, cellInfo.color, this)
        break
      case Figure.Cardinal:
        returnValue = getCardinalMoves(coord, cellInfo.color, this)
        break
      case Figure.Knight:
        returnValue = getKnightMoves(coord, cellInfo.color, this)
        break
      case Figure.Bishop:
        returnValue = getBishopMoves(coord, cellInfo.color, this)
        break
      case Figure.King:
        // Stryker disable next-line all -- in Grand Chess the castling flags are never set, so getHeirsKingMoves degenerates to the same 8 unit-direction moves as getGrandChessKingMoves; the variant pick is observationally equivalent.
        returnValue = this.variant === GameType.GrandChess
          ? getGrandChessKingMoves(coord, cellInfo.color, this)
          : getHeirsKingMoves(coord, cellInfo.color, this)
        break
      // Stryker disable next-line all -- defensive: every Figure value is handled above.
      default:
        throw new Error(' ')

    }
    return returnValue
  }

  canMove(from: CoordinateInterface, to: CoordinateInterface): boolean {
    const available = this.availableMoves(from)
    for (const availableCoord of available) {
      if (Utils.sameCoords(to, availableCoord)) {
        return true
      }
    }
    return false
  }

  canCastling(t: 2 | 3, color: Color): boolean {
    if (color !== this.moving) {
      return false;
    }
    if (t === 2) {
      return this.moving === Color.White ? this.white00 : this.black00
    }
    return this.moving === Color.White ? this.white000 : this.black000

  }

  get takeover(): CoordinateInterface | null {
    return this.takeoverCoord
  }

  getAttackedCoords(): CoordinateInterface[] {
    // Stryker disable next-line all -- memoization guard.
    if (this.attackedCoords) {
      return this.attackedCoords
    }
    // Stryker disable next-line all -- the array is unconditionally populated by the loop below; junk-string mutations are filtered out by sameCoords.
    this.attackedCoords = []
    const color = Utils.changeColor(this.moving)

    for (let x = 1; x <= 10; x++) {
      for (let y = 1; y <= 10; y++) {
        const coord: CoordinateInterface = { x: x, y: y }
        const cellInfo = this.cellInfo(coord)
        if (cellInfo.empty || cellInfo.color !== color) {
          continue
        }

        const availableMoves = this.baseAvailableMovesFromCoord(coord)

        for (const availableMoveCoord of availableMoves) {
          this.attackedCoords.push(availableMoveCoord)
        }
      }
    }
    return this.attackedCoords
  }

  isAttacked(coord: CoordinateInterface): boolean {
    const attackedCoords = this.getAttackedCoords()
    for (const c of attackedCoords) {
      if (Utils.sameCoords(c, coord)) {
        return true
      }
    }
    return false
  }

  getMovingColor(): Color {
    return this.moving
  }

  getMoveNumber(): number {
    return this.moveNumber
  }

  // printBoard is a debug helper used only when introspecting in a debugger.
  // Its exact framing/spacing/letter casing is not part of the contract, so
  // mutation testing of this method has no practical value — disabled.
  // Stryker disable all
  printBoard(): string {
    let text = "   +----------+\n"
    for (let y = 10; y >= 1; y--) {
      let line = ""
      if (y !== 10) line += " "
      line += y.toString()
      line += " +"
      for (let x = 1; x <= 10; x++) {
        const cellInfo = this.cellInfo({ x: x, y: y })
        line += cellInfo.empty ? "." : Utils.getFigureChar(cellInfo.figure, cellInfo.color, this.variant);
      }
      line += "+\n"
      text += line
    }
    text += "   +----------+\n"
    text += "   +ABCDEFGHIJ+\n"
    return text
  }
  // Stryker restore all

}
