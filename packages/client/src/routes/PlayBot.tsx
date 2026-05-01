import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { GameType } from '@chess100com/rules';
import type { GameStateSnapshot, PlayerColor, SkillStep } from '@chess100com/client-core';
import { Board } from '../components/Board';
import { BotGameStore } from '../stores/bot-game';
import { trackGoal } from '../services/analytics';

const VARIANT_OPTIONS: GameType[] = Object.values(GameType);

const VARIANT_I18N: Record<GameType, string> = {
  [GameType.Heirs]: 'variants.heirs',
  [GameType.GrandChess]: 'variants.grandchess',
};

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

const SKILL_STEPS: SkillStep[] = ['easy', 'medium', 'hard', 'expert'];

function colorLabel(t: TFunction, c: PlayerColor): string {
  return c === 'white' ? t('game.white') : t('game.black');
}

function startButtonLabel(t: TFunction, store: BotGameStore): string {
  if (store.engineLoading) return t('playBot.loadingEngine');
  if (store.state) return t('playBot.newGame');
  return t('playBot.start');
}

const PlayBotIntro = observer(() => {
  const { t } = useTranslation();
  return <p>{t('playBot.intro')}</p>;
});

const VariantPicker = observer(({ store, disabled }: { store: BotGameStore; disabled: boolean }) => {
  const { t } = useTranslation();
  if (VARIANT_OPTIONS.length <= 1) return null;
  return (
    <label className="variant-select">
      <span>{t('lobby.variantLabel')}</span>
      <select
        value={store.variant}
        onChange={(e) => store.setVariant(e.target.value as GameType)}
        disabled={disabled}
      >
        {VARIANT_OPTIONS.map(type => (
          <option key={type} value={type}>{t(VARIANT_I18N[type])}</option>
        ))}
      </select>
    </label>
  );
});

const SkillPicker = observer(({ store, disabled }: { store: BotGameStore; disabled: boolean }) => {
  const { t } = useTranslation();
  return (
    <div className="skill-picker">
      <span className="skill-picker-label">{t('playBot.skillLabel')}</span>
      <div className="skill-picker-options">
        {SKILL_STEPS.map((step) => (
          <label key={step} className={`skill-option${store.skillLevel === step ? ' active' : ''}`}>
            <input
              type="radio"
              name="skill"
              value={step}
              checked={store.skillLevel === step}
              disabled={disabled}
              onChange={() => store.setSkill(step)}
            />
            <span>{t(`playBot.skill.${step}`)}</span>
          </label>
        ))}
      </div>
    </div>
  );
});

const ActiveGameInfo = observer(({ store, state }: { store: BotGameStore; state: GameStateSnapshot }) => {
  const { t } = useTranslation();
  const statusText = STATUS_I18N_KEYS[state.status] ? t(STATUS_I18N_KEYS[state.status]) : state.status;
  const isOngoing = state.status === 'ongoing';
  return (
    <>
      <p>
        <Trans
          i18nKey="playBot.playingAs"
          values={{ color: colorLabel(t, store.myColor ?? 'white') }}
          components={{ 1: <strong /> }}
        />
      </p>
      <h3>{statusText}</h3>
      {state.result !== '*' && <p className="result">{t('game.result', { result: state.result })}</p>}
      {isOngoing && (
        <p>
          <Trans
            i18nKey="game.turn"
            values={{ color: colorLabel(t, state.turn) }}
            components={{ 1: <strong /> }}
          />
          {store.isMyTurn && t('game.myTurn')}
        </p>
      )}
      {store.engineThinking && <p className="hint">{t('playBot.engineThinking')}</p>}
      {isOngoing && (
        <div className="actions">
          <button className="secondary" onClick={() => store.resign()}>{t('game.resign')}</button>
        </div>
      )}
      {state.moves.length > 0 && (
        <>
          <h3>{t('game.movesTitle')}</h3>
          <ol className="moves">
            {state.moves.map((m, i) => <li key={i}>{m.alias}</li>)}
          </ol>
        </>
      )}
      {store.error && <p className="error">{store.error}</p>}
    </>
  );
});

const BotSidePanel = observer(({ store }: { store: BotGameStore }) => {
  const { t } = useTranslation();
  const state = store.state;

  return (
    <aside className="game-side">
      <div className="game-side-body">
        <h2>{t('playBot.title')}</h2>

        <VariantPicker store={store} disabled={store.engineLoading || store.engineThinking} />

        <SkillPicker store={store} disabled={store.engineLoading || store.engineThinking} />

        <button
          onClick={() => {
            trackGoal('play_bot_start');
            store.startNew().catch(() => {});
          }}
          disabled={store.engineLoading}
        >
          {startButtonLabel(t, store)}
        </button>

        {state && <ActiveGameInfo store={store} state={state} />}
      </div>
    </aside>
  );
});

export const PlayBot = observer(() => {
  const [store] = useState(() => new BotGameStore());
  useEffect(() => () => store.dispose(), [store]);

  return (
    <div className="game-layout">
      <div className="game-main">
        {store.state
          ? <Board game={store} />
          : <div className="loading"><PlayBotIntro /></div>}
      </div>
      <BotSidePanel store={store} />
    </div>
  );
});
