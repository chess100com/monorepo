import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { GameType } from '@chess100com/rules';
import type { LeaderboardEntry, OngoingGameSummary } from '@chess100com/client-core';
import { MAX_ONGOING_GAMES } from '@chess100com/client-core';
import { useStore } from '../stores/context';

const VARIANT_I18N: Record<GameType, string> = {
  [GameType.Heirs]: 'variants.heirs',
};

const VARIANT_OPTIONS: GameType[] = Object.values(GameType);

function Leaderboard({ label, entries }: { label: string; entries: LeaderboardEntry[] | undefined }) {
  const { t } = useTranslation();
  return (
    <div className="leaderboard">
      <h3>{t('lobby.leaderboardTitle', { label })}</h3>
      {(!entries || entries.length === 0) ? (
        <p className="hint">{t('lobby.leaderboardEmpty')}</p>
      ) : (
        <ol className="leaderboard-list">
          {entries.map(p => (
            <li key={p.id}>
              <span className="leaderboard-name">{p.username}</span>
              <span className="leaderboard-rating">{p.rating}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function OngoingGames({ games }: { games: OngoingGameSummary[] }) {
  const { t } = useTranslation();
  if (games.length === 0) return null;
  return (
    <div className="ongoing-games">
      <h3>{t('lobby.ongoingTitle')}</h3>
      <ul className="ongoing-games-list">
        {games.map(g => (
          <li key={g.id}>
            <Link to={`/game/${g.id}`}>
              {t('lobby.ongoingVs', {
                opponent: g.opponent?.username ?? t('lobby.ongoingUnknownOpponent'),
                color: t(`game.${g.myColor}`),
                variant: t(`variants.${g.type}`),
              })}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const Lobby = observer(() => {
  const { auth, lobby } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    lobby.subscribe();
    return () => { lobby.unsubscribe(); };
  }, [lobby]);

  useEffect(() => {
    if (lobby.matchedGame) {
      const { gameId } = lobby.matchedGame;
      lobby.clearMatchedGame();
      navigate(`/game/${gameId}`);
    }
  }, [lobby.matchedGame, lobby, navigate]);

  const username = auth.user?.username ?? '';
  const rating = auth.user?.ratings[lobby.selectedType];

  return (
    <div className="page">
      <h1>{t('lobby.title')}</h1>
      <p>
        {rating === undefined ? (
          <Trans i18nKey="lobby.greeting" values={{ username }} components={{ 1: <strong /> }} />
        ) : (
          <Trans
            i18nKey="lobby.greetingWithRating"
            values={{ username, rating }}
            components={{ 1: <strong />, 3: <strong /> }}
          />
        )}
      </p>

      <OngoingGames games={lobby.ongoingGames} />

      <div className="queue-state">
        {VARIANT_OPTIONS.length > 1 && (
          <label className="variant-select">
            <span>{t('lobby.variantLabel')}</span>
            <select
              value={lobby.selectedType}
              onChange={(e) => lobby.selectType(e.target.value as GameType)}
              disabled={lobby.inQueue}
            >
              {VARIANT_OPTIONS.map(type => (
                <option key={type} value={type}>{t(VARIANT_I18N[type])}</option>
              ))}
            </select>
          </label>
        )}

        <p>
          <Trans
            i18nKey="lobby.inQueue"
            values={{ count: lobby.selectedQueueSize }}
            components={{ 1: <strong /> }}
          />
        </p>

        {!lobby.canJoinQueue && !lobby.inQueue && (
          <p className="hint">{t('lobby.tooManyGames', { max: MAX_ONGOING_GAMES })}</p>
        )}

        {lobby.queueError && (
          <p className="error">{lobby.queueError}</p>
        )}

        {lobby.inQueue ? (
          <>
            <p className="hint">{t('lobby.searching')}</p>
            <button onClick={() => lobby.leaveQueue()}>{t('lobby.cancel')}</button>
          </>
        ) : (
          <button onClick={() => lobby.joinQueue()} disabled={!lobby.canJoinQueue}>
            {t('lobby.play')}
          </button>
        )}
      </div>

      <hr />

      <div className="leaderboards">
        {VARIANT_OPTIONS.map(type => (
          <Leaderboard key={type} label={t(VARIANT_I18N[type])} entries={lobby.leaderboard[type]} />
        ))}
      </div>

      <hr />
      <button className="secondary" onClick={() => auth.logout()}>
        {t('lobby.logout')}
      </button>
    </div>
  );
});
