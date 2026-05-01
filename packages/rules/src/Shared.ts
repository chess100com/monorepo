// oxlint-disable typescript/no-empty-object-type
// oxlint-disable typescript/ban-types

/**
 * Variants of 10x10 chess supported by this engine. Add new entries here as
 * new variants are implemented; keep the enum's string values stable because
 * they are persisted on the Game row and emitted over the wire.
 */
export enum GameType {
    Heirs = "heirs",
    GrandChess = "grandchess",
}

export const HeirsStartFen = "rnbcqksbnr/pppppppppp/10/10/10/10/10/10/PPPPPPPPPP/RNBCQKSBNR w KQkq - 0 1"
export const GrandChessStartFen = "r8r/1nbqmkcbn1/pppppppppp/10/10/10/10/PPPPPPPPPP/1NBQMKCBN1/R8R w - - 0 1"

/**
 * Backwards-compatible alias kept for callers that import the original
 * Heirs-only constant. New code should pull the FEN from VariantStartFen.
 */
export const StartFen = HeirsStartFen

export enum Figure {
    Pawn = 1,
    Bishop = 2,
    Knight = 3,
    Rook = 4,
    Queen = 5,
    King = 6,
    Prince = 7,
    Princess = 8,
    Marshal = 9,
    Cardinal = 10,
    None = 0
}

export enum Color {
    White = 1,
    Black = 2,
    None = 0,
}

export const ColorsNames: { [key: string]: Color } = {
    w: Color.White,
    b: Color.Black,
}

/**
 * FEN letters per variant. The Heirs variant uses C for Prince and S for
 * Princess; Grand Chess reuses C for Cardinal and adds M for Marshal. The
 * letter "C" is therefore variant-overloaded — Position knows which variant
 * it is parsing and consults the matching map.
 */
export const FigureNamesByVariant: Record<GameType, { [key: string]: Figure }> = {
    [GameType.Heirs]: {
        R: Figure.Rook,
        N: Figure.Knight,
        B: Figure.Bishop,
        C: Figure.Prince,
        S: Figure.Princess,
        Q: Figure.Queen,
        K: Figure.King,
        P: Figure.Pawn,
    },
    [GameType.GrandChess]: {
        R: Figure.Rook,
        N: Figure.Knight,
        B: Figure.Bishop,
        M: Figure.Marshal,
        C: Figure.Cardinal,
        Q: Figure.Queen,
        K: Figure.King,
        P: Figure.Pawn,
    },
}

/**
 * Heirs letter map kept exported for legacy callers (Utils.getFigureChar
 * delegates to it when no variant context is available).
 */
export const FigureNames: { [key: string]: Figure } = FigureNamesByVariant[GameType.Heirs]

export interface CellInfo {
    empty: boolean
    color: Color
    figure: Figure
}

export interface BaseBoardInterface { [key: number]: { [key: number]: CellInfo } }

export interface BoardInterface extends BaseBoardInterface {
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
}

/**
 * Interface for coordinates on board
 * Starts from 1, end with 10
 * x: 1..10 (a..k)
 * y: 1..10
 * {x:2,y:2} it is "b2" coordinate
 */
export interface CoordinateInterface {
    readonly x: number,
    readonly y: number
}

export const ColumnNames: string[] = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "k"]

export interface MoveInterface {
    readonly from: CoordinateInterface,
    readonly to: CoordinateInterface
}

export interface ExtraMoveData {
    pawnTransform?: Figure
    princessTransform?: boolean,
    test?: boolean
}

export const AvailablePawnTransforms: Figure[] = [Figure.Queen, Figure.Bishop, Figure.Knight, Figure.Rook]

/**
 * Pieces a Grand Chess pawn may promote to. We use the same set as Heirs but
 * extend it with the two new long-range pieces; promotion to Marshal or
 * Cardinal is part of the Grand Chess ruleset.
 */
export const GrandChessPawnTransforms: Figure[] = [
    Figure.Queen, Figure.Marshal, Figure.Cardinal,
    Figure.Rook, Figure.Bishop, Figure.Knight,
]
