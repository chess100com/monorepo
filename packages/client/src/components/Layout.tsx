import { observer } from 'mobx-react-lite';
import type { ChangeEvent, ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, type Language } from '@chess100com/client-core';
import { useStore } from '../stores/context';

function navClass({ isActive }: { isActive: boolean }): string {
  return `nav-link${isActive ? ' active' : ''}`;
}

export const Layout = observer(({ children }: { children: ReactNode }) => {
  const { auth, i18n: i18nStore } = useStore();
  const { t } = useTranslation();

  function onLangChange(e: ChangeEvent<HTMLSelectElement>): void {
    i18nStore.setLanguage(e.target.value as Language);
  }

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <div className="top-nav-inner">
          <div className="top-nav-links">
            <NavLink to="/" end className={navClass}>{t('nav.home')}</NavLink>
            <NavLink to="/lobby" className={navClass}>{t('nav.play')}</NavLink>
            <NavLink to="/rules" className={navClass}>{t('nav.rules')}</NavLink>
          </div>
          <div className="top-nav-user">
            <select
              className="nav-lang"
              value={i18nStore.language}
              onChange={onLangChange}
              aria-label={t('nav.language')}
            >
              {SUPPORTED_LANGUAGES.map((code) => (
                <option key={code} value={code}>{LANGUAGE_LABELS[code]}</option>
              ))}
            </select>
            {auth.status === 'authenticated' ? (
              <>
                <NavLink to="/profile" className={navClass}>
                  <span className="nav-user">
                    {auth.user?.username}
                    {auth.user && <span className="nav-user-rating"> · {auth.user.rating}</span>}
                  </span>
                </NavLink>
                <button className="nav-link nav-link-button" onClick={() => auth.logout()}>
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">{t('nav.login')}</Link>
                <Link to="/register" className="nav-link">{t('nav.register')}</Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="app-content">{children}</main>
    </div>
  );
});
