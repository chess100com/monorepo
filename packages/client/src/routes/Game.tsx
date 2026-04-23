import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../stores/context.js';
import { Board } from '../components/Board.js';
import { GameSidePanel } from '../components/GameSidePanel.js';

const noop = () => {};

const LoadedGame = observer(() => {
  return (
    <div className="game-layout">
      <div className="game-main">
        <Board />
      </div>
      <GameSidePanel />
    </div>
  );
});

export const Game = observer(() => {
  const { id } = useParams<{ id: string }>();
  const { game } = useStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (!id) return;
    game.init(id).catch(noop);
    return () => { game.reset(); };
  }, [id, game]);

  if (!id) return <div className="page">{t('game.invalidId')}</div>;
  if (game.loading && !game.state) return <div className="loading">{t('game.loading')}</div>;
  if (game.error && !game.state) {
    return (
      <div className="page">
        <h1>{t('game.errorTitle')}</h1>
        <p className="error">{game.error}</p>
        <Link to="/lobby">{t('game.backToLobby')}</Link>
      </div>
    );
  }
  if (!game.state) return <div className="loading">{t('game.connecting')}</div>;

  return <LoadedGame />;
});
