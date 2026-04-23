import { WhiteWinsResult, BlackWinsResult, DrawResult, GameStatus } from '@chess100com/rules';
import { AppDataSource } from './data-source';
import { Game } from './entity/Game';
import { User } from './entity/User';
import { calcElo, ELO_DEFAULT } from './elo-calc';

export interface EloUpdateResult {
  whiteBefore: number;
  blackBefore: number;
  whiteAfter: number;
  blackAfter: number;
}

function whiteScoreFromResult(result: string): number | null {
  if (result === WhiteWinsResult) return 1;
  if (result === BlackWinsResult) return 0;
  if (result === DrawResult) return 0.5;
  return null;
}

/**
 * Atomically updates both players' ratings and writes the post-game snapshot
 * to the game row. Idempotent: if `whiteRatingAfter` is already set, returns
 * the existing values without touching the DB. Games without a rating
 * snapshot on creation (e.g. from before the Elo migration) are skipped.
 */
export function applyEloUpdate(gameId: string): Promise<EloUpdateResult | null> {
  return AppDataSource.transaction(async (tx) => {
    const gameRepo = tx.getRepository(Game);
    const userRepo = tx.getRepository(User);

    const row = await gameRepo.findOneBy({ id: gameId });
    if (!row) return null;
    if (row.status === GameStatus.Ongoing) return null;
    if (row.whiteRatingAfter !== null && row.blackRatingAfter !== null) {
      return {
        whiteBefore: row.whiteRatingBefore ?? ELO_DEFAULT,
        blackBefore: row.blackRatingBefore ?? ELO_DEFAULT,
        whiteAfter: row.whiteRatingAfter,
        blackAfter: row.blackRatingAfter,
      };
    }
    if (row.whiteRatingBefore === null || row.blackRatingBefore === null) return null;

    const whiteScore = whiteScoreFromResult(row.result);
    if (whiteScore === null) return null;

    const { whiteAfter, blackAfter } = calcElo(row.whiteRatingBefore, row.blackRatingBefore, whiteScore);

    const whiteUser = await userRepo.findOneBy({ id: row.whiteUserId });
    const blackUser = await userRepo.findOneBy({ id: row.blackUserId });
    if (!whiteUser || !blackUser) return null;

    whiteUser.rating = whiteAfter;
    blackUser.rating = blackAfter;
    await userRepo.save(whiteUser);
    await userRepo.save(blackUser);

    row.whiteRatingAfter = whiteAfter;
    row.blackRatingAfter = blackAfter;
    await gameRepo.save(row);

    return {
      whiteBefore: row.whiteRatingBefore,
      blackBefore: row.blackRatingBefore,
      whiteAfter,
      blackAfter,
    };
  });
}
