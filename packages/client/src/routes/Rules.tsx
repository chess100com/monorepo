import type { ReactElement } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { GameType } from '@chess100com/rules';

const TABS: { type: GameType; i18nKey: string }[] = [
  { type: GameType.Heirs, i18nKey: 'variants.heirs' },
  { type: GameType.GrandChess, i18nKey: 'variants.grandchess' },
  { type: GameType.Generals, i18nKey: 'variants.generals' },
];

function Endings(): ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <h2>{t('rules.endgameTitle')}</h2>
      <ul>
        <li>{t('rules.endgame.checkmate')}</li>
        <li>{t('rules.endgame.stalemate')}</li>
        <li>{t('rules.endgame.threefold')}</li>
        <li>{t('rules.endgame.fiftyMove')}</li>
        <li>{t('rules.endgame.insufficient')}</li>
        <li>{t('rules.endgame.resign')}</li>
        <li>{t('rules.endgame.agreement')}</li>
      </ul>
    </>
  );
}

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

      <Endings />
    </section>
  );
}

function GrandChessRules(): ReactElement {
  const { t } = useTranslation();
  return (
    <section className="variant-rules">
      <h2>{t('rules.grandchess.boardTitle')}</h2>
      <p>
        <Trans i18nKey="rules.grandchess.board1" components={{ 1: <code /> }} />
      </p>
      <p>
        <Trans i18nKey="rules.grandchess.board2" components={{ 1: <strong />, 3: <strong /> }} />
      </p>

      <h2>{t('rules.grandchess.piecesTitle')}</h2>
      <h3>{t('rules.grandchess.marshalTitle')}</h3>
      <p>{t('rules.grandchess.marshalDesc')}</p>
      <h3>{t('rules.grandchess.cardinalTitle')}</h3>
      <p>{t('rules.grandchess.cardinalDesc')}</p>

      <h2>{t('rules.grandchess.pawnsTitle')}</h2>
      <p>{t('rules.grandchess.pawnsDesc')}</p>

      <h2>{t('rules.grandchess.promotionTitle')}</h2>
      <p>
        <Trans i18nKey="rules.grandchess.promotionDesc" components={{ 1: <strong />, 3: <strong /> }} />
      </p>

      <h2>{t('rules.grandchess.castlingTitle')}</h2>
      <p>{t('rules.grandchess.castlingDesc')}</p>

      <Endings />
    </section>
  );
}

function GeneralsRules(): ReactElement {
  const { t } = useTranslation();
  return (
    <section className="variant-rules">
      <h2>{t('rules.generals.boardTitle')}</h2>
      <p>
        <Trans i18nKey="rules.generals.board1" components={{ 1: <code /> }} />
      </p>
      <p>
        <Trans i18nKey="rules.generals.board2" components={{ 1: <strong />, 3: <strong /> }} />
      </p>

      <h2>{t('rules.generals.royalTitle')}</h2>
      <p>
        <Trans i18nKey="rules.generals.royalDesc" components={{ 1: <code />, 3: <strong /> }} />
      </p>

      <h2>{t('rules.generals.piecesTitle')}</h2>
      <h3>{t('rules.generals.generalTitle')}</h3>
      <p>{t('rules.generals.generalDesc')}</p>
      <p>
        <Trans i18nKey="rules.generals.generalStrong" components={{ 1: <strong /> }} />
      </p>
      <h3>{t('rules.generals.jesterTitle')}</h3>
      <p>{t('rules.generals.jesterDesc')}</p>
      <p>
        <Trans i18nKey="rules.generals.jesterStrong" components={{ 1: <strong /> }} />
      </p>

      <h2>{t('rules.generals.kingTitle')}</h2>
      <p>
        <Trans i18nKey="rules.generals.kingStrong" components={{ 1: <strong /> }} />
      </p>
      <p>
        <Trans i18nKey="rules.generals.kingThrone" components={{ 1: <strong /> }} />
      </p>

      <h2>{t('rules.generals.pawnsTitle')}</h2>
      <p>{t('rules.generals.pawnsDesc')}</p>
      <p>
        <Trans i18nKey="rules.generals.royalPawn" components={{ 1: <strong /> }} />
      </p>
      <p>{t('rules.generals.promotionDesc')}</p>

      <h2>{t('rules.generals.pawnCastlingTitle')}</h2>
      <p>{t('rules.generals.pawnCastlingDesc')}</p>

      <h2>{t('rules.generals.castlingTitle')}</h2>
      <p>{t('rules.generals.castlingDesc')}</p>

      <Endings />
    </section>
  );
}

export function Rules(): ReactElement {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('variant');
  const active = TABS.find((tab) => tab.type === requested)?.type ?? GameType.Heirs;

  return (
    <div className="page rules-page">
      <h1>{t('rules.title')}</h1>
      <div className="tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.type}
            role="tab"
            aria-selected={tab.type === active}
            className={`tab${tab.type === active ? ' active' : ''}`}
            onClick={() => setSearchParams({ variant: tab.type }, { replace: true })}
          >
            {t(tab.i18nKey)}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {active === GameType.Heirs && <HeirsRules />}
        {active === GameType.GrandChess && <GrandChessRules />}
        {active === GameType.Generals && <GeneralsRules />}
      </div>
    </div>
  );
}
