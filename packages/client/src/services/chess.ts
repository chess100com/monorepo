import { Position, Figure } from '@chess100com/rules';
import type { CoordinateInterface } from '@chess100com/rules';
import type { Key } from '@chess100com/chessground/types';

const FILES = 'abcdefghik';

export function coordToKey(c: CoordinateInterface): Key {
  return `${FILES[c.x - 1]}${c.y}` as Key;
}

export function keyToCoord(k: string): CoordinateInterface {
  const file = k[0];
  const rank = Number(k.slice(1));
  return { x: FILES.indexOf(file) + 1, y: rank };
}

export function computeDests(fen: string): Map<Key, Key[]> {
  const position = Position.fromFen(fen);
  const dests = new Map<Key, Key[]>();
  for (const m of position.getAvailableMoves()) {
    const from = coordToKey(m.from);
    const to = coordToKey(m.to);
    const list = dests.get(from);
    if (list) {
      list.push(to);
    } else {
      dests.set(from, [to]);
    }
  }
  return dests;
}

/**
 * Returns true when the given move is a pawn pushing to the promotion rank
 * (y=10 for white pawn, y=1 for black pawn). MVP: always auto-promote to Queen.
 */
export function isPromotion(fen: string, from: CoordinateInterface, to: CoordinateInterface): boolean {
  const position = Position.fromFen(fen);
  const cell = position.cellInfo(from);
  if (cell.empty || cell.figure !== Figure.Pawn) return false;
  return to.y === 10 || to.y === 1;
}

export const AutoPawnPromotion: Figure = Figure.Queen;
