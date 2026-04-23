import { observer } from 'mobx-react-lite';
import { useEffect, useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GameStatus, WhiteWinsResult, BlackWinsResult, DrawResult, type GameType } from '@chess100com/rules';
import { apiFetch } from '@chess100com/client-core';
import { useStore } from '../stores/context';

interface GameSummary {
  id: string;
  type: GameType;
  white: { id: number; username: string; rating: number } | null;
  black: { id: number; username: string; rating: number } | null;
  status: GameStatus;
  result: string;
  whiteRatingBefore: number | null;
  blackRatingBefore: number | null;
  whiteRatingAfter: number | null;
  blackRatingAfter: number | null;
  createdAt: string;
  finishedAt: string | null;
}

type Outcome = 'win' | 'loss' | 'draw' | 'ongoing';

function outcomeFor(game: GameSummary, myUsername: string): Outcome {
  if (game.status === GameStatus.Ongoing) return 'ongoing';
  if (game.result === DrawResult) return 'draw';
  const iAmWhite = game.white?.username === myUsername;
  const iAmBlack = game.black?.username === myUsername;
  if (game.result === WhiteWinsResult) return iAmWhite ? 'win' : 'loss';
  if (game.result === BlackWinsResult) return iAmBlack ? 'win' : 'loss';
  return 'ongoing';
}

const STATUS_I18N: Record<GameStatus, string> = {
  [GameStatus.Ongoing]: 'game.status.ongoing',
  [GameStatus.Checkmate]: 'game.status.checkmate',
  [GameStatus.Stalemate]: 'game.status.stalemate',
  [GameStatus.ThreefoldRepetition]: 'game.status.threefold',
  [GameStatus.FiftyMoveRule]: 'game.status.fiftyMove',
  [GameStatus.InsufficientMaterial]: 'game.status.insufficient',
  [GameStatus.Resignation]: 'game.status.resignation',
  [GameStatus.Agreement]: 'game.status.agreement',
  [GameStatus.Timeout]: 'game.status.timeout',
};

function ratingDelta(game: GameSummary, myUsername: string): number | null {
  const iAmWhite = game.white?.username === myUsername;
  const before = iAmWhite ? game.whiteRatingBefore : game.blackRatingBefore;
  const after = iAmWhite ? game.whiteRatingAfter : game.blackRatingAfter;
  if (before === null || after === null) return null;
  return after - before;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

const PAGE_SIZE = 50;

export const Profile = observer((): ReactElement => {
  const { auth } = useStore();
  const { t } = useTranslation();
  const [games, setGames] = useState<GameSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ games: GameSummary[] }>(`/games/mine?limit=${PAGE_SIZE}`)
      .then(body => {
        if (cancelled) return;
        setGames(body.games);
        setHasMore(body.games.length === PAGE_SIZE);
      })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)); });
    return () => { cancelled = true; };
  }, []);

  const loadMore = async (): Promise<void> => {
    if (games === null || loadingMore) return;
    setLoadingMore(true);
    try {
      const body = await apiFetch<{ games: GameSummary[] }>(
        `/games/mine?limit=${PAGE_SIZE}&offset=${games.length}`,
      );
      setGames(prev => [...(prev ?? []), ...body.games]);
      setHasMore(body.games.length === PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingMore(false);
    }
  };

  const user = auth.user;
  if (!user) return <div className="page">{t('common.loadingAuth')}</div>;

  return (
    <div className="page profile-page">
      <h1>{user.username}</h1>
      <p className="profile-rating">
        {t('profile.rating')}: <strong>{user.rating}</strong>
      </p>

      <h2>{t('profile.myGames')}</h2>
      {error && <p className="hint">{error}</p>}
      {!error && games === null && <p className="hint">{t('common.loadingAuth')}</p>}
      {games !== null && games.length === 0 && <p className="hint">{t('profile.noGames')}</p>}
      {games !== null && games.length > 0 && (
        <ol className="profile-games">
          {games.map(g => {
            const outcome = outcomeFor(g, user.username);
            const iAmWhite = g.white?.username === user.username;
            const opponent = iAmWhite ? g.black : g.white;
            const delta = ratingDelta(g, user.username);
            const date = g.finishedAt ?? g.createdAt;
            return (
              <li key={g.id} className={`profile-game profile-game-${outcome}`}>
                <Link to={`/game/${g.id}`} className="profile-game-link">
                  <span className={`profile-outcome profile-outcome-${outcome}`}>
                    {t(`profile.outcome.${outcome}`)}
                  </span>
                  <span className="profile-game-color">
                    {t(iAmWhite ? 'game.white' : 'game.black')}
                  </span>
                  <span className="profile-game-opponent">
                    {opponent ? opponent.username : '—'}
                    {opponent && <span className="profile-game-rating"> ({opponent.rating})</span>}
                  </span>
                  <span className="profile-game-status">{t(STATUS_I18N[g.status])}</span>
                  {delta !== null && (
                    <span className={`profile-game-delta ${delta >= 0 ? 'positive' : 'negative'}`}>
                      {delta >= 0 ? `+${delta}` : String(delta)}
                    </span>
                  )}
                  <span className="profile-game-date">{formatDate(date)}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
      {games !== null && hasMore && (
        <div className="profile-load-more">
          <button onClick={() => { loadMore().catch(() => {}); }} disabled={loadingMore}>
            {loadingMore ? t('profile.loadingMore') : t('profile.loadMore')}
          </button>
        </div>
      )}
    </div>
  );
});
