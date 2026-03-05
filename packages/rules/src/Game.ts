import type { CoordinateInterface, Figure, ExtraMoveData, Color } from "./Shared";
import { StartFen } from "./Shared"
import { Position } from "./Position"
import { Utils } from "./Utils"

export interface MoveMetadata {
  from: CoordinateInterface,
  to: CoordinateInterface,
  extra: ExtraMoveData,
  color: Color,
  figure: Figure,
  number: number,
  fen: string,
  alias: string
}

export interface GameMetaData {
  event?: string,
  site?: string,
  date?: string,
  round?: string,
  white?: string,
  black?: string
}

export interface CreateGameProps {
  metadata?: GameMetaData
  fen?: string
}

export class Game {

  event = ""
  site = ""
  date = ""
  round = ""
  white = ""
  black = ""
  result = "*"
  fromPosition = false
  startPosition: string | null = null;
  moves: MoveMetadata[] = []


  position: Position;

  private constructor(props?: CreateGameProps) {
    // Stryker disable next-line OptionalChaining
    // Stryker disable next-line ConditionalExpression
    if (props?.metadata) {
      this.setMetadata(props.metadata);
    }
    // Stryker disable next-line OptionalChaining
    // Stryker disable next-line ConditionalExpression
    if (props?.fen) {
      this.startPosition = props.fen
      this.fromPosition = true
      this.position = Position.fromFen(props.fen)
    } else {
      this.position = Position.fromFen(StartFen);
    }
  }

  static create(metadata?: GameMetaData): Game {
    return new Game({ metadata });
  }

  static fromFen(fen: string, metadata?: GameMetaData): Game {
    return new Game({ fen, metadata });
  }

  private setMetadata(metadata?: GameMetaData) {
    // Stryker disable next-line ConditionalExpression
    if (!metadata) return;
    if (metadata.event) this.event = metadata.event;
    if (metadata.site) this.site = metadata.site;
    if (metadata.date) this.date = metadata.date;
    if (metadata.white) this.white = metadata.white;
    if (metadata.black) this.black = metadata.black;
    if (metadata.round) this.round = metadata.round;
  }

  getFen(): string {
    return this.position.getFen()
  }

  /*
  getPGN(): string {
    return ""
  }
  */

  /**
   * Get all available moves from one coordinate
   */
  availableMoves(coord: CoordinateInterface): CoordinateInterface[] {
    return this.position.availableMoves(coord)
  }

  /**
   * Check if current player can move from one coordinate to another
   */
  canMove(from: CoordinateInterface, to: CoordinateInterface): boolean {
    return this.position.canMove(from, to)
  }

  /**
   * Make move 
   */
  move(from: CoordinateInterface, to: CoordinateInterface, extra?: ExtraMoveData): void {
    Utils.validateCoordinate(from)
    Utils.validateCoordinate(to)
    if (!this.canMove(from, to)) {
      throw new Error(`Illegal move ${Utils.coordinateToString(from)}->${Utils.coordinateToString(to)} in position ${this.position.getFen()}`)
    }
    const oldPosition = this.position
    this.position = this.position.move(from, to, extra)

    const moveMetadata: MoveMetadata = {
      from: from,
      to: to,
      extra: extra || {},
      color: oldPosition.getMovingColor(),
      figure: oldPosition.cellInfo(from).figure,
      number: this.position.getMoveNumber(),
      fen: this.position.getFen(),
      alias: this.getMoveAlias(oldPosition, this.position, from, to, extra)
    }

    this.moves.push(moveMetadata)
  }

  /** 
   * Converting moves like {x:1,y:1}, {x:2,y:2} to human readable format
   * using in PGN
   */
  private getMoveAlias(oldPosition: Position, newPosition: Position, from: CoordinateInterface, to: CoordinateInterface, _?: ExtraMoveData): string {
    return `${Utils.coordinateToString(from)}-${Utils.coordinateToString(to)}`
    /*let returnValue: string = ""
    let fromCellInfo = oldPosition.cellInfo(from)
    let toCellInfo = oldPosition.cellInfo(to)
    let takeString = toCellInfo.empty ? "" : "x"
    if (fromCellInfo.figure === Figure.Pawn) {
        if (from.x !== from.y) {
            returnValue = Utils.getColumnName(from.x).concat(takeString, Utils.getColumnName(to.x), to.y.toString())
        } else {
            returnValue = Utils.getColumnName(to.x).concat(takeString, to.y.toString())
        }
    } else {
        let allAvailableMoves = oldPosition.getAvailableMoves()
        let availableDuplicates: Array<CoordinateInterface> = []
        let refineString = ""
        for (let availableMove of allAvailableMoves) {
            if (Utils.sameCoords(to, availableMove.to)) {
                continue
            }
            let cellInfo = oldPosition.cellInfo(availableMove.from)
            if (cellInfo.figure !== fromCellInfo.figure) {
                continue
            }
            availableDuplicates.push(availableMove.from)
        }
        let sameRow = false
        let sameColumn = false
        for (let availableDuplicate of availableDuplicates) {
            sameRow = sameRow && availableDuplicate.y === from.y
            sameColumn = sameColumn && availableDuplicate.x === from.x
        }
        if (sameRow && sameColumn) {
            refineString = Utils.coordinateToString(from)
        } else if (sameRow) {
            refineString = from.y.toString()
        } else if (sameColumn) {
            refineString = Utils.getColumnName(from.x)
        }
        let toCoordinateString = Utils.coordinateToString(to)
        returnValue = returnValue.concat(Utils.getFigureChar(fromCellInfo.figure, fromCellInfo.color), refineString, takeString, toCoordinateString)
    }

    if (false === newPosition.isCheckmate() && newPosition.isCheck()) {
        returnValue = returnValue.concat("+")
    }*/

    // return returnValue
  }
  /*
  private getMoveFromAlias(position: Position, moveString: string): MoveInterface {
    const moveStringArray = moveString.split("-")
    return {
      from: Utils.parseCoordinate(moveStringArray[0]),
      to: Utils.parseCoordinate(moveStringArray[1])
    }
  }
  */

  /**
   * Cancel last move
   */
  /*
  cancelMove(): void {
    if (this.moves.length === 0) {
      throw new Error("No moves to cancel")
    }
    this.moves.pop()
    this.position = Position.fromFen(this.moves[this.moves.length - 1].fen)
  }
  */
  /*
  getPositionAtMove(moveNumber: number, color: Color): Position {
    let returnMove: MoveMetadata | null = null
    for (const move of this.moves) {
      if (move.number === moveNumber && move.color === color) {
        returnMove = move
        break
      }
    }
    if (!returnMove) {
      throw new Error("Move not found")
    }
    return Position.fromFen(returnMove.fen)
  }
  */

  setPrincessTransformRejected(rejected: boolean): void {
    this.position.setPrincessTransformRejected(rejected)
  }
}
