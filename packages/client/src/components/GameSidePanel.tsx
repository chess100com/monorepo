import { observer } from 'mobx-react-lite';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { PlayerColor } from '@chess100com/client-core';
import { useStore } from '../stores/context.js';
import { GameClock } from './GameClock.js';

const STATUS_I18N_KEYS: Record<string, string> = {
  ongoing: 'game.status.ongoing',
  checkmate: 'game.status.checkmate',
  stalemate: 'game.status.stalemate',
  'threefold-repetition': 'game.status.threefold',
  'fifty-move-rule': 'game.status.fiftyMove',
  'insufficient-material': 'game.status.insufficient',
  resignation: 'game.status.resignation',
  agreement: 'game.status.agreement',
  timeout: 'game.status.timeout',
};

function colorLabel(t: TFunction, c: PlayerColor): string {
  return c === 'white' ? t('game.white') : t('game.black');
}

function ratingLabel(before: number | null, after: number | null): string | null {
  if (before === null) return null;
  if (after === null) return String(before);
  const delta = after - before;
  const sign = delta > 0 ? '+' : '';
  return `${before} → ${after} (${sign}${delta})`;
}

const PlayerRow = observer(({ color }: { color: PlayerColor }) => {
  const { game, auth } = useStore();
  const { t } = useTranslation();
  const state = game.state;
  if (!state) return null;

  const isMine = game.myColor === color;
  const meta = color === 'white' ? game.metadata?.white : game.metadata?.black;
  const name = meta?.username ?? (isMine ? auth.user?.username ?? t('game.you') : t('game.opponent'));
  const isOngoing = state.status === 'ongoing';
  const active = !!(state.clock?.started && state.clock.turn === color && isOngoing);

  const before = color === 'white' ? state.whiteRatingBefore : state.blackRatingBefore;
  const after = color === 'white' ? state.whiteRatingAfter : state.blackRatingAfter;
  const rating = ratingLabel(before, after);

  return (
    <div className="player-row">
      <span className="player-label">
        <strong className="player-name">{name}</strong>
        {rating && <span className="player-rating">{rating}</span>}
        <span className="player-color">{t('game.colorLabel', { color: colorLabel(t, color) })}</span>
      </span>
      <GameClock clock={state.clock ?? null} side={color} receivedAt={game.stateReceivedAt} active={active} />
    </div>
  );
});

const DrawOfferSection = observer(() => {
  const { game } = useStore();
  const { t } = useTranslation();
  const state = game.state;
  if (!state || state.status !== 'ongoing') return null;

  if (game.incomingDrawOffer) {
    return (
      <div className="draw-offer incoming">
        <p>{t('game.incomingDraw')}</p>
        <div className="actions">
          <button onClick={() => game.acceptDraw()}>{t('game.accept')}</button>
          <button className="secondary" onClick={() => game.declineDraw()}>{t('game.decline')}</button>
        </div>
      </div>
    );
  }
  if (game.hasOutgoingDrawOffer) {
    return <p className="hint">{t('game.outgoingDraw')}</p>;
  }
  return null;
});

const GameActions = observer(() => {
  const { game } = useStore();
  const { t } = useTranslation();
  const state = game.state;
  if (!state) return null;

  const canAct = state.status === 'ongoing' && game.myColor !== null;
  const canOfferDraw = canAct && !game.incomingDrawOffer && !game.hasOutgoingDrawOffer;
  if (!canOfferDraw) return null;

  return (
    <div className="actions">
      <button onClick={() => game.offerDraw()}>{t('game.offerDraw')}</button>
      <button className="secondary" onClick={() => game.resign()}>{t('game.resign')}</button>
    </div>
  );
});

export const GameSidePanel = observer(() => {
  const { game } = useStore();
  const { t } = useTranslation();
  const state = game.state;
  if (!state) return null;

  const myColor: PlayerColor = game.myColor ?? 'white';
  const oppColor: PlayerColor = myColor === 'white' ? 'black' : 'white';
  const isOngoing = state.status === 'ongoing';
  const statusKey = STATUS_I18N_KEYS[state.status];
  const statusText = statusKey ? t(statusKey) : state.status;

  return (
    <aside className="game-side">
      <PlayerRow color={oppColor} />

      <div className="game-side-body">
        <h2>{statusText}</h2>
        {state.result !== '*' && <p className="result">{t('game.result', { result: state.result })}</p>}
        {isOngoing && (
          <p>
            <Trans
              i18nKey="game.turn"
              values={{ color: colorLabel(t, state.turn) }}
              components={{ 1: <strong /> }}
            />
            {game.isMyTurn && t('game.myTurn')}
          </p>
        )}

        <DrawOfferSection />
        <GameActions />

        <h3>{t('game.movesTitle')}</h3>
        <ol className="moves">
          {state.moves.map((m, i) => (
            <li key={i}>{m.alias}</li>
          ))}
        </ol>

        {game.error && <p className="error">{game.error}</p>}

        <Link to="/lobby">{t('game.backToLobby')}</Link>
      </div>

      <PlayerRow color={myColor} />
    </aside>
  );
});
