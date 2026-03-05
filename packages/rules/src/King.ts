// oxlint-disable complexity
// oxlint-disable max-depth
import type { Position } from "./Position"
import type { Color } from "./Shared";
import { type CoordinateInterface, Figure } from "./Shared"
import { Utils } from "./Utils"

const directions: number[][] = [[-1, -1], [1, 1], [1, -1], [-1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]


const can00 = (c: CoordinateInterface, color: Color, position: Position): boolean => {
	if (!position.canCastling(2, color)) return false;
	const rookCell = position.cellInfo({ x: 10, y: c.y });
	if (rookCell.figure !== Figure.Rook) return false;
	// Stryker disable next-line ConditionalExpression
	if (rookCell.color !== color) return false;
	for (const x of [7, 8, 9]) {
		if (false === position.cellInfo({ y: c.y, x: x }).empty) {
			return false;
		}
	}
	for (const x of [7, 8]) {
		if (position.isAttacked({ y: c.y, x: x })) {
			return false;
		}
	}
	return true;
};

const can000 = (c: CoordinateInterface, color: Color, position: Position): boolean => {
	if (!position.canCastling(3, color)) return false;
	const rookCell = position.cellInfo({ x: 1, y: c.y });
	if (rookCell.figure !== Figure.Rook) return false;
	// Stryker disable next-line ConditionalExpression
	if (rookCell.color !== color) return false;
	for (const x of [2, 3, 4, 5]) {
		if (false === position.cellInfo({ y: c.y, x: x }).empty) {
			return false;
		}
	}
	for (const x of [3, 4, 5]) {
		if (position.isAttacked({ y: c.y, x: x })) {
			return false;
		}
	}
	return true;
};

export const getKingMoves = (c: CoordinateInterface, color: Color, position: Position): CoordinateInterface[] => {
	const returnValue: CoordinateInterface[] = []
	for (const direction of directions) {
		const dx = direction[0]
		const dy = direction[1]
		const newCoord = Utils.dCoord(c, dx, dy)
		if (!newCoord) {
			continue
		}
		const cellInfo = position.cellInfo(newCoord)
		if (cellInfo.empty || cellInfo.color !== color) {
			returnValue.push(newCoord)
		}
	}

	/**
	 * Castling moves
	 */
	const isUnderAttack = position.isKingUnderAttack(color);
	if (!isUnderAttack) {
		if (can00(c, color, position)) {
			returnValue.push({ y: c.y, x: 8 });
		}
		if (can000(c, color, position)) {
			returnValue.push({ y: c.y, x: 3 });
		}
	}
	/*const y = c.y
	if (can00 && !isUnderAttack) {
		const rookCell = position.cellInfo({ x: 10, y });
		if (rookCell.color !== color || rookCell.figure !== Figure.Rook) {
			can00 = false;
		} else {
			for (const x of [7, 8, 9]) {
				if (false === position.cellInfo({ y: y, x: x }).empty) {
					can00 = false
					break
				}
			}
		}
		if (can00) {
			for (const x of [7, 8]) {
				if (position.isAttacked({ y: y, x: x })) {
					can00 = false
					break
				}
			}
		}
		if (can00) {
			returnValue.push({ y: y, x: 8 })
		}
	}
	if (can000 && !isUnderAttack) {
		const rookCell = position.cellInfo({ x: 1, y });
		if (rookCell.color !== color || rookCell.figure !== Figure.Rook) {
			can000 = false;
		} else {
			for (const x of [2, 3, 4, 5]) {
				if (false === position.cellInfo({ y: y, x: x }).empty) {
					can000 = false
					break
				}
			}
		}

		if (can000) {
			for (const x of [3, 4, 5]) {
				if (position.isAttacked({ y: y, x: x })) {
					can000 = false
					break
				}
			}
		}
		if (can000) {
			returnValue.push({ y: y, x: 3 })
		}
	}*/
	return returnValue
}
