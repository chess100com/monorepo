import { pos2key, invRanks } from './util.js';
import * as cg from './types.js';

export const initial: cg.FEN = 'rnbcqksbnr/pppppppppp/10/10/10/10/10/10/PPPPPPPPPP/RNBCQKSBNR w KQkq - - 0 1';

/**
 * FEN letter to role per variant. The Heirs variant uses `c` for Prince and
 * `s` for Princess; Grand Chess reuses `c` for Cardinal and adds `m` for
 * Marshal. The "C" letter is variant-overloaded — callers must pass the
 * active variant when reading a FEN.
 */
const rolesByVariant: Record<cg.Variant, { [letter: string]: cg.Role }> = {
  heirs: {
    p: 'pawn',
    r: 'rook',
    n: 'knight',
    b: 'bishop',
    q: 'queen',
    k: 'king',
    s: 'princess',
    c: 'prince',
  },
  grandchess: {
    p: 'pawn',
    r: 'rook',
    n: 'knight',
    b: 'bishop',
    q: 'queen',
    k: 'king',
    m: 'marshal',
    c: 'cardinal',
  },
};

/**
 * Role → FEN letter. We use a single map because each role has a stable
 * letter (prince and cardinal both happen to share `c`, but a board never
 * carries both at once — the active variant rules that out).
 */
const letters: { [role in cg.Role]: string } = {
  pawn: 'p',
  rook: 'r',
  knight: 'n',
  bishop: 'b',
  queen: 'q',
  king: 'k',
  princess: 's',
  prince: 'c',
  marshal: 'm',
  cardinal: 'c',
};

export function read(fen: cg.FEN, variant: cg.Variant = 'heirs'): cg.Pieces {
  if (fen === 'start') fen = initial;
  const pieces: cg.Pieces = new Map();
  const roles = rolesByVariant[variant];
  let row = 9,
    col = 0;
  for (const c of fen) {
    switch (c) {
      case ' ':
      case '[':
        return pieces;
      case '/':
        --row;
        if (row < 0) return pieces;
        col = 0;
        break;
      case '~': {
        const piece = pieces.get(pos2key([col - 1, row]));
        if (piece) piece.promoted = true;
        break;
      }
      default: {
        const nb = c.charCodeAt(0);
        if (nb < 58) col += nb - 48;
        else {
          const role = c.toLowerCase();
          pieces.set(pos2key([col, row]), {
            role: roles[role],
            color: c === role ? 'black' : 'white',
          });
          ++col;
        }
      }
    }
  }
  return pieces;
}

export function write(pieces: cg.Pieces): cg.FEN {
  return invRanks
    .map(y =>
      cg.files
        .map(x => {
          const piece = pieces.get((x + y) as cg.Key);
          if (piece) {
            let p = letters[piece.role];
            if (piece.color === 'white') p = p.toUpperCase();
            if (piece.promoted) p += '~';
            return p;
          } else return '1';
        })
        .join(''),
    )
    .join('/')
    .replace(/1{2,}/g, s => s.length.toString());
}
