import type { CoordinateInterface, Figure } from "./Shared";
import { ColumnNames, FigureNames, Color } from "./Shared"

export const Utils = {


    getColumnIndex: (column: string): number => {
        const index = ColumnNames.indexOf(column)
        if (index === -1) {
            throw new Error("Bad column")
        }
        return index + 1
    },

    getColumnName: (index: number): string => {
        if (index < 1 || index > 10) {
            throw new Error("Bad column index")
        }
        return ColumnNames[index - 1]
    },

    dCol: (col: string, dx: number): string | null => {
        let colIndex = Utils.getColumnIndex(col)
        colIndex += dx
        if (colIndex < 1 || colIndex > 10) {
            return null
        }
        return Utils.getColumnName(colIndex)
    },

    dCoord: (c: CoordinateInterface, dx: number, dy: number): CoordinateInterface | null => {
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

    validateCoordinate: (c: CoordinateInterface): void => {
        if (c.x < 1 || c.x > 10 || c.y < 1 || c.y > 10) {
            throw new Error("Bad coordinate")
        }
    },

    getFigureChar: (figure: Figure, color: Color): string => {
        for (const figureChar in FigureNames) {
            if (FigureNames[figureChar] === figure) {
                if (color === Color.White) {
                    return figureChar
                }
                return figureChar.toLowerCase()
            }
        }
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
