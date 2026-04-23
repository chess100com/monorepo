import { useState, type ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { GameType } from '@chess100com/rules';

const TABS: { type: GameType; i18nKey: string }[] = [
  { type: GameType.Heirs, i18nKey: 'variants.heirs' },
];

function HeirsRules(): ReactElement {
  const { t } = useTranslation();
  return (
    <section className="variant-rules">
      <h2>{t('rules.heirs.boardTitle')}</h2>
      <p>
        <Trans i18nKey="rules.heirs.board1" components={{ 1: <code /> }} />
      </p>
      <p>
        <Trans i18nKey="rules.heirs.board2" components={{ 1: <strong />, 3: <strong /> }} />
      </p>

      <h2>{t('rules.heirs.piecesTitle')}</h2>
      <h3>{t('rules.heirs.princessTitle')}</h3>
      <p>{t('rules.heirs.princessDesc')}</p>
      <h3>{t('rules.heirs.princeTitle')}</h3>
      <p>{t('rules.heirs.princeDesc')}</p>

      <h2>{t('rules.heirs.promotionTitle')}</h2>
      <p>
        <Trans i18nKey="rules.heirs.promotionDesc" components={{ 1: <strong /> }} />
      </p>

      <h2>{t('rules.heirs.pawnsTitle')}</h2>
      <p>{t('rules.heirs.pawnsDesc')}</p>

      <h2>{t('rules.heirs.castlingTitle')}</h2>
      <p>{t('rules.heirs.castlingDesc')}</p>

      <h2>{t('rules.heirs.endgameTitle')}</h2>
      <ul>
        <li>{t('rules.heirs.endgame.checkmate')}</li>
        <li>{t('rules.heirs.endgame.stalemate')}</li>
        <li>{t('rules.heirs.endgame.threefold')}</li>
        <li>{t('rules.heirs.endgame.fiftyMove')}</li>
        <li>{t('rules.heirs.endgame.insufficient')}</li>
        <li>{t('rules.heirs.endgame.resign')}</li>
        <li>{t('rules.heirs.endgame.agreement')}</li>
      </ul>
    </section>
  );
}

export function Rules(): ReactElement {
  const { t } = useTranslation();
  const [active, setActive] = useState<GameType>(GameType.Heirs);

  return (
    <div className="page rules-page">
      <h1>{t('rules.title')}</h1>
      {TABS.length > 1 && (
        <div className="tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.type}
              role="tab"
              aria-selected={tab.type === active}
              className={`tab${tab.type === active ? ' active' : ''}`}
              onClick={() => setActive(tab.type)}
            >
              {t(tab.i18nKey)}
            </button>
          ))}
        </div>
      )}
      <div className="tab-content">
        {active === GameType.Heirs && <HeirsRules />}
      </div>
    </div>
  );
}
