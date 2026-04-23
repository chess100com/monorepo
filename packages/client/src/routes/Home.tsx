import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';

export function Home(): ReactElement {
  const { t } = useTranslation();
  return (
    <div className="page home-page">
      <h1>{t('home.title')}</h1>
      <p className="home-lead">
        <Trans i18nKey="home.lead" components={{ 1: <strong />, 3: <strong />, 5: <strong /> }} />
      </p>
      <p>{t('home.intro')}</p>
      <ul className="home-features">
        <li>{t('home.features.board')}</li>
        <li>{t('home.features.pieces')}</li>
        <li>{t('home.features.online')}</li>
      </ul>
      <div className="home-actions">
        <Link to="/lobby" className="home-cta primary">{t('home.ctaPlay')}</Link>
        <Link to="/rules" className="home-cta secondary">{t('home.ctaRules')}</Link>
      </div>
    </div>
  );
}
