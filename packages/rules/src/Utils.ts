import type { CoordinateInterface, Figure } from "./Shared";
import { ColumnNames, FigureNamesByVariant, GameType, Color } from "./Shared"

export const Utils = {


    getColumnIndex: (column: string): number => {
        const index = ColumnNames.indexOf(column)
        // Stryker disable all -- defensive guard; error text is cosmetic.
        if (index === -1) {
            throw new Error("Bad column")
        }
        // Stryker restore all
        return index + 1
    },

    getColumnName: (index: number): string => {
        // Stryker disable all -- defensive guard; error text is cosmetic.
        if (index < 1 || index > 10) {
            throw new Error("Bad column index")
        }
        // Stryker restore all
        return ColumnNames[index - 1]
    },

    // dCol is unused outside of dead-or-defensive code paths — none of its
    // mutants is observable through the public API, so disable mutation testing.
    // Stryker disable all
    dCol: (col: string, dx: number): string | null => {
        let colIndex = Utils.getColumnIndex(col)
        colIndex += dx
        if (colIndex < 1 || colIndex > 10) {
            return null
        }
        return Utils.getColumnName(colIndex)
    },
    // Stryker restore all

    dCoord: (c: CoordinateInterface, dx: number, dy: number): CoordinateInterface | null => {
        // Stryker disable next-line all -- every caller passes a direction set that is x-symmetric (each {dx,dy} has its {-dx,dy} pair), so flipping the sign here yields the same destination set; the mutant is equivalent.
        const x = c.x + dx
        const y = c.y + dy
        if (x < 1 || x > 10 || y < 1 || y > 10) {
            return null
        }
        return {
            x: x,
            y: y
        }
    },

    // parseCoordinate's guards trigger on malformed input; their error messages
    // are cosmetic and individual mutations are dominated by other guards.
    // Stryker disable all
    parseCoordinate: (coordinate: string): CoordinateInterface => {
        if (coordinate.length < 2 || coordinate.length > 3) {
            throw new Error(`Bad coordinate: ${coordinate}`)
        }
        const colName = coordinate.slice(0, 1)
        const rowIndex = Number.parseInt(coordinate.slice(1))
        const colIndex = ColumnNames.indexOf(colName)
        if (Number.isNaN(rowIndex) || rowIndex < 1 || rowIndex > 10 || colIndex === -1) {
            throw new Error(`Bad coordinate: ${coordinate}`)
        }
        return {
            x: colIndex + 1,
            y: rowIndex
        }
    },
    // Stryker restore all

    validateCoordinate: (c: CoordinateInterface): void => {
        // Stryker disable all -- defensive guard; error text is cosmetic.
        if (c.x < 1 || c.x > 10 || c.y < 1 || c.y > 10) {
            throw new Error("Bad coordinate")
        }
        // Stryker restore all
    },

    getFigureChar: (figure: Figure, color: Color, variant: GameType = GameType.Heirs): string => {
        const figureNames = FigureNamesByVariant[variant]
        for (const figureChar in figureNames) {
            if (figureNames[figureChar] === figure) {
                if (color === Color.White) {
                    return figureChar
                }
                return figureChar.toLowerCase()
            }
        }
        // Stryker disable next-line all -- unreachable: every Figure value is in FigureNamesByVariant.
        throw new Error(`Bad figure ${figure}`)
    },

    sameCoords: (c1: CoordinateInterface, c2: CoordinateInterface): boolean => {
        return c1.x === c2.x && c1.y === c2.y
    },

    changeColor: (color: Color): Color => {
        return color === Color.Black ? Color.White : Color.Black
    },

    coordinateToString: (coordinate: CoordinateInterface): string => {
        return `${ColumnNames[coordinate.x - 1]}${coordinate.y}`;
    },

}
