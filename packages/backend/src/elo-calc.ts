export const ELO_K = 32;
export const ELO_DEFAULT = 1500;

/**
 * Classical Elo update. `whiteScore` is White's score: 1 = white wins, 0 =
 * black wins, 0.5 = draw. Returns new ratings rounded to integers. Pure — no
 * I/O and no entity imports, so it's safe to unit-test outside Docker.
 */
export function calcElo(
  whiteRating: number,
  blackRating: number,
  whiteScore: number,
  k: number = ELO_K,
): { whiteAfter: number; blackAfter: number } {
  const expectedWhite = 1 / (1 + 10 ** ((blackRating - whiteRating) / 400));
  const expectedBlack = 1 - expectedWhite;
  const blackScore = 1 - whiteScore;
  return {
    whiteAfter: Math.round(whiteRating + k * (whiteScore - expectedWhite)),
    blackAfter: Math.round(blackRating + k * (blackScore - expectedBlack)),
  };
}
