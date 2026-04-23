import type { CoordinateInterface, Figure, ExtraMoveData } from "./Shared.js";
import { StartFen, Color } from "./Shared.js"
import { Position } from "./Position.js"
import { Utils } from "./Utils.js"

export enum GameStatus {
  Ongoing = "ongoing",
  Checkmate = "checkmate",
  Stalemate = "stalemate",
  ThreefoldRepetition = "threefold-repetition",
  FiftyMoveRule = "fifty-move-rule",
  InsufficientMaterial = "insufficient-material",
  Resignation = "resignation",
  Agreement = "agreement",
  Timeout = "timeout",
}

export const OngoingResult = "*"
export const WhiteWinsResult = "1-0"
export const BlackWinsResult = "0-1"
export const DrawResult = "1/2-1/2"

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
  result = OngoingResult
  status: GameStatus = GameStatus.Ongoing
  fromPosition = false
  startPosition: string | null = null;
  moves: MoveMetadata[] = []

  private repetitionCounts = new Map<string, number>()

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
    this.registerPositionForRepetition()
    this.refreshStatus()
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
    if (this.status !== GameStatus.Ongoing) {
      throw new Error(`Game already ended: ${this.status}`)
    }
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
    this.registerPositionForRepetition()
    this.refreshStatus()
  }

  resign(color: Color): void {
    if (this.status !== GameStatus.Ongoing) {
      throw new Error(`Game already ended: ${this.status}`)
    }
    if (color !== Color.White && color !== Color.Black) {
      throw new Error("Only White or Black can resign")
    }
    this.status = GameStatus.Resignation
    this.result = color === Color.White ? BlackWinsResult : WhiteWinsResult
  }

  agreeDraw(): void {
    if (this.status !== GameStatus.Ongoing) {
      throw new Error(`Game already ended: ${this.status}`)
    }
    this.status = GameStatus.Agreement
    this.result = DrawResult
  }

  timeout(color: Color): void {
    if (this.status !== GameStatus.Ongoing) {
      throw new Error(`Game already ended: ${this.status}`)
    }
    if (color !== Color.White && color !== Color.Black) {
      throw new Error("Only White or Black can time out")
    }
    this.status = GameStatus.Timeout
    this.result = color === Color.White ? BlackWinsResult : WhiteWinsResult
  }

  isThreefoldRepetition(): boolean {
    for (const count of this.repetitionCounts.values()) {
      if (count >= 3) return true
    }
    return false
  }

  private registerPositionForRepetition(): void {
    const key = this.position.getRepetitionKey()
    this.repetitionCounts.set(key, (this.repetitionCounts.get(key) ?? 0) + 1)
  }

  private refreshStatus(): void {
    if (this.position.isCheckmate()) {
      this.status = GameStatus.Checkmate
      this.result = this.position.getMovingColor() === Color.White ? BlackWinsResult : WhiteWinsResult
      return
    }
    if (this.position.isStalemate()) {
      this.status = GameStatus.Stalemate
      this.result = DrawResult
      return
    }
    if (this.isThreefoldRepetition()) {
      this.status = GameStatus.ThreefoldRepetition
      this.result = DrawResult
      return
    }
    if (this.position.isFiftyMoveRule()) {
      this.status = GameStatus.FiftyMoveRule
      this.result = DrawResult
      return
    }
    if (this.position.isInsufficientMaterial()) {
      this.status = GameStatus.InsufficientMaterial
      this.result = DrawResult
      return
    }
    this.status = GameStatus.Ongoing
    this.result = OngoingResult
  }

  private getMoveAlias(_oldPosition: Position, _newPosition: Position, from: CoordinateInterface, to: CoordinateInterface, _extra?: ExtraMoveData): string {
    return `${Utils.coordinateToString(from)}-${Utils.coordinateToString(to)}`
  }
}
