import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { GameType } from '@chess100com/rules';

const VARIANTS: GameType[] = [GameType.Heirs, GameType.GrandChess, GameType.Generals];

export function Home(): ReactElement {
  const { t } = useTranslation();
  return (
    <div className="page home-page">
      <h1>{t('home.title')}</h1>
      <p className="home-lead">
        <Trans i18nKey="home.lead" components={{ 1: <strong /> }} />
      </p>
      <p>{t('home.intro')}</p>

      <h2>{t('home.variantsTitle')}</h2>
      <div className="home-variants">
        {VARIANTS.map((variant) => (
          <div key={variant} className="home-variant">
            <h3>{t(`variants.${variant}`)}</h3>
            <p>{t(`home.variants.${variant}`)}</p>
            <Link to={`/rules?variant=${variant}`}>{t('home.variantRulesLink')}</Link>
          </div>
        ))}
      </div>

      <ul className="home-features">
        <li>{t('home.features.board')}</li>
        <li>{t('home.features.online')}</li>
        <li>{t('home.features.bot')}</li>
      </ul>
      <div className="home-actions">
        <Link to="/lobby" className="home-cta primary">{t('home.ctaPlay')}</Link>
        <Link to="/rules" className="home-cta secondary">{t('home.ctaRules')}</Link>
      </div>
    </div>
  );
}
