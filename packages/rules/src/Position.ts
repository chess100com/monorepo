// oxlint-disable max-lines
// oxlint-disable complexity
import type { BoardInterface, CellInfo, CoordinateInterface, ExtraMoveData, MoveInterface } from "./Shared";
import { Color, Figure, FigureNames, ColorsNames, AvailablePawnTransforms } from "./Shared"
import { Utils } from "./Utils"
import { getPawnMoves } from "./Pawn"
import { getQueenMoves } from "./Queen"
import { getRookMoves } from "./Rook"
import { getPrincessMoves } from "./Princess"
import { getBishopMoves } from "./Bishop"
import { getKnightMoves } from "./Knight"
import { getKingMoves } from "./King";

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

  private white00 = false
  private black00 = false
  private white000 = false
  private black000 = false

  private moveNumber = 1
  private semiMove = 0

  private queenJustEaten = false
  private princessTransformJustRejected = false

  private whitePrincessTransformRejected = false
  private blackPrincessTransformRejected = false

  private takeoverCoord: CoordinateInterface | null = null

  private allAvailableMoves: MoveInterface[] | null = null

  private baseAvailableMoves: MoveInterface[] | null = null

  private attackedCoords: CoordinateInterface[] | null = null

  private constructor() { }

  static fromFen(fen: string): Position {
    const position = new Position()
    position.setFen(fen)
    return position
  }

  private setFen(fen: string): void {
    this.board = getEmptyBoard()
    for (let x = 1; x <= 10; x++) {
      for (let y = 1; y <= 10; y++) {
        this.board[x][y] = { empty: true, figure: Figure.None, color: Color.None }
      }
    }

    const splitSpaces = fen.split(" ")
    if (splitSpaces.length !== 7) {
      throw new Error(`Bad FEN: ${fen}`)
    }

    const positionString = splitSpaces[0]
    const positionRowsArr = positionString.split("/")
    if (positionRowsArr.length !== 10) {
      throw new Error(`Bad FEN: ${fen}`)
    }

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

        if (char in FigureNames) {
          color = Color.White
          figure = FigureNames[char]
        } else if (char.toUpperCase() in FigureNames) {
          color = Color.Black
          figure = FigureNames[char.toUpperCase()]
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

    const princessDataString = splitSpaces[4]
    if (princessDataString !== "-") {
      if (princessDataString.includes("x")) {
        this.queenJustEaten = true
      }
      if (princessDataString.includes("w")) {
        this.whitePrincessTransformRejected = true
      }
      if (princessDataString.includes("b")) {
        this.blackPrincessTransformRejected = true
      }
    }

    if (!/^[0-9]+$/.test(splitSpaces[5])) {
      throw new Error(`Bad FEN: semiMove(${splitSpaces[5]}) should be a number`)
    }

    if (!/^[0-9]+$/.test(splitSpaces[6])) {
      throw new Error(`Bad FEN: move(${splitSpaces[6]}) should be a number`)
    }

    this.semiMove = Number.parseInt(splitSpaces[5])
    this.moveNumber = Number.parseInt(splitSpaces[6])
  }

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
        rowString += Utils.getFigureChar(cellInfo.figure, cellInfo.color)
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

    let princessString = ""
    if (this.queenJustEaten) princessString += "x"
    if (this.whitePrincessTransformRejected) princessString += "w"
    if (this.blackPrincessTransformRejected) princessString += "b"
    if (princessString.length === 0) princessString = "-"

    let takeoverString = "-"
    if (this.takeoverCoord) {
      takeoverString = Utils.coordinateToString(this.takeoverCoord)
    }

    return `${positionStringArray.join("/")} ${moving} ${castlingString} ${takeoverString} ${princessString} ${this.semiMove} ${this.moveNumber}`
  }

  putFigure(coord: CoordinateInterface, figure: Figure, color: Color): Position {
    const returnValue = this.clone();
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
    position.setFen(this.getFen())
    return position
  }

  move(from: CoordinateInterface, to: CoordinateInterface, extra: ExtraMoveData = {}): Position {

    const newPosition = this.clone()
    newPosition.queenJustEaten = false
    const fromCellInfo = newPosition.cellInfo(from)
    const toCellInfo = newPosition.cellInfo(to)
    let currentFigure = fromCellInfo.figure

    newPosition.takeoverCoord = null
    if (fromCellInfo.figure === Figure.Pawn) {
      newPosition.semiMove = 0
      if (Math.abs(from.y - to.y) > 1) {
        newPosition.takeoverCoord = {
          y: to.y,
          x: to.x
        }
      }
      if (toCellInfo.empty && this.takeoverCoord && to.x !== from.x) {
        const takoverPawnCell = newPosition.cellInfo(this.takeoverCoord)
        takoverPawnCell.empty = true
        takoverPawnCell.color = Color.None
        takoverPawnCell.figure = Figure.None
      }

      if (to.y === 10 || to.y === 1) {
        if (extra && extra.test && !extra.pawnTransform) {
          extra.pawnTransform = Figure.Queen
        }
        if (!extra || !extra.pawnTransform || !AvailablePawnTransforms.includes(extra.pawnTransform)) {
          throw new Error("Pawn transform figure should be passed")
        }
        currentFigure = extra.pawnTransform
      }

    } else {
      newPosition.semiMove++
    }

    if (this.queenJustEaten) {
      if (this.princessTransformJustRejected) {
        if (fromCellInfo.color === Color.White) {
          newPosition.whitePrincessTransformRejected = true
        } else {
          newPosition.blackPrincessTransformRejected = true
        }
      } else {
        const princessPosition = newPosition.findFigures(Figure.Princess, fromCellInfo.color)[0]
        const princessCellInfo = newPosition.cellInfo(princessPosition)
        if (from.y === princessPosition.y && from.x === princessPosition.x) {
          currentFigure = Figure.Queen
        } else {
          princessCellInfo.figure = Figure.Queen
        }
      }
    }

    if (toCellInfo.figure === Figure.Queen && false === toCellInfo.empty && this.princessOnBoard(toCellInfo.color)) {
      newPosition.queenJustEaten = true
    }

    if (toCellInfo.figure === Figure.King) {
      const princeCoord = this.findFigures(Figure.Prince, toCellInfo.color)[0]
      if (princeCoord) {
        const princeCellInfo = newPosition.cellInfo(princeCoord)
        princeCellInfo.figure = Figure.King
      }
    }

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
      if (fromRookCellInfo.figure !== Figure.Rook) {
        throw new Error("Bad castling")
      }
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
    if (!this.allAvailableMoves) {
      this.buildAvailableMoves()
    }
    return this.allAvailableMoves ?? []
  }

  private buildAvailableMoves() {
    this.allAvailableMoves = []
    const baseAvailableMoves = this.getBaseAvailableMoves()
    const me = this.moving
    const havePrince = this.princeOnBoard(me)
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

    // 1) if only one available move
    // 2) if this move only by king
    // 3) if this move king eat queen
    // 4) if quen covered by princesse
    // then no available moves -> checkmate
    if (this.allAvailableMoves.length === 1) {
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
  }

  private getBaseAvailableMoves(): MoveInterface[] {
    if (!this.baseAvailableMoves) {
      this.buildBaseAvailableMoves()
    }
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
    if (this.princeOnBoard(this.moving)) {
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

    let returnValue: CoordinateInterface[] = []


    switch (cellInfo.figure) {
      case Figure.Pawn:
        returnValue = getPawnMoves(coord, cellInfo.color, this)
        break
      case Figure.Queen:
        returnValue = getQueenMoves(coord, cellInfo.color, this)
        break
      case Figure.Rook:
        returnValue = getRookMoves(coord, cellInfo.color, this)
        break
      case Figure.Prince:
        returnValue = getPrincessMoves(coord, cellInfo.color, this)
        break
      case Figure.Princess:
        returnValue = (this.queenJustEaten && false === this.princessTransformJustRejected)
          ? getQueenMoves(coord, cellInfo.color, this)
          : getPrincessMoves(coord, cellInfo.color, this);
        break
      case Figure.Knight:
        returnValue = getKnightMoves(coord, cellInfo.color, this)
        break
      case Figure.Bishop:
        returnValue = getBishopMoves(coord, cellInfo.color, this)
        break
      case Figure.King:
        returnValue = getKingMoves(coord, cellInfo.color, this)
        break
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

  get isQueenJustEaten(): boolean {
    return this.queenJustEaten
  }

  get isPrincessTransformRejceted(): boolean {
    return this.princessTransformJustRejected
  }

  setPrincessTransformRejected(rejected: boolean): void {
    if (!this.queenJustEaten) {
      throw new Error("Queen not have been just eaten")
    }
    this.princessTransformJustRejected = rejected
    this.buildAvailableMoves()
  }

  getAttackedCoords(): CoordinateInterface[] {
    if (this.attackedCoords) {
      return this.attackedCoords
    }
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

  printBoard(): string {
    let text = "   +----------+\n"
    for (let y = 10; y >= 1; y--) {
      let line = ""
      if (y !== 10) line += " "
      line += y.toString()
      line += " +"
      for (let x = 1; x <= 10; x++) {
        const cellInfo = this.cellInfo({ x: x, y: y })
        line += cellInfo.empty ? "." : Utils.getFigureChar(cellInfo.figure, cellInfo.color);
      }
      line += "+\n"
      text += line
    }
    text += "   +----------+\n"
    text += "   +ABCDEFGHIJ+\n"
    return text
  }

}
