import { AvailablePawnTransforms, ColumnNames, Figure } from '@chess100com/rules';
import type { CoordinateInterface } from '@chess100com/rules';

const FS_FILE_LETTERS = 'abcdefghij';

export function localFileLetterToFs(letter: string): string {
  return letter === 'k' ? 'j' : letter;
}

export function fsFileLetterToLocal(letter: string): string {
  return letter === 'j' ? 'k' : letter;
}

export function coordToFsSquare(coord: CoordinateInterface): string {
  const localLetter = ColumnNames[coord.x - 1];
  if (!localLetter) throw new Error(`Bad x coordinate: ${coord.x}`);
  return `${localFileLetterToFs(localLetter)}${coord.y}`;
}

export function fsSquareToCoord(sq: string): CoordinateInterface {
  const letter = sq[0];
  const rankStr = sq.slice(1);
  const localLetter = fsFileLetterToLocal(letter);
  const x = ColumnNames.indexOf(localLetter) + 1;
  const y = Number(rankStr);
  if (x < 1 || x > 10 || !Number.isInteger(y) || y < 1 || y > 10) {
    throw new Error(`Bad FS square: ${sq}`);
  }
  return { x, y };
}

const PROMO_LETTER_TO_FIGURE: Record<string, Figure> = {
  q: Figure.Queen,
  r: Figure.Rook,
  b: Figure.Bishop,
  n: Figure.Knight,
};

export interface ParsedUciMove {
  from: CoordinateInterface;
  to: CoordinateInterface;
  promotion?: Figure;
}

// FS UCI move: `<from><to>[promo]`, where each square is 2–3 chars (rank can be 1..10).
// Try both (2-char, 2-char), (2-char, 3-char), (3-char, 2-char), (3-char, 3-char); accept
// the first split where both squares are valid FS squares and any trailing char is a promo.
export function parseUciMove(uci: string): ParsedUciMove {
  const squareRe = /^[a-j]([1-9]|10)$/;
  for (const firstLen of [3, 2]) {
    const fromSq = uci.slice(0, firstLen);
    if (!squareRe.test(fromSq)) continue;
    const rest = uci.slice(firstLen);
    for (const secondLen of [3, 2]) {
      if (secondLen > rest.length) continue;
      const toSq = rest.slice(0, secondLen);
      if (!squareRe.test(toSq)) continue;
      const promoLetter = rest.slice(secondLen);
      if (promoLetter && !(promoLetter in PROMO_LETTER_TO_FIGURE)) continue;
      const parsed: ParsedUciMove = {
        from: fsSquareToCoord(fromSq),
        to: fsSquareToCoord(toSq),
      };
      if (promoLetter) parsed.promotion = PROMO_LETTER_TO_FIGURE[promoLetter];
      return parsed;
    }
  }
  throw new Error(`Cannot parse UCI move: ${uci}`);
}

export function isPromotionTransform(figure: Figure | undefined): figure is Figure {
  return figure !== undefined && AvailablePawnTransforms.includes(figure);
}

// Named export strictly so tests/docs can depend on the 10-letter FS alphabet.
export { FS_FILE_LETTERS };
