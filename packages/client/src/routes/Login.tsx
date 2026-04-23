import { observer } from 'mobx-react-lite';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../stores/context';

export const Login = observer(() => {
  const { auth } = useStore();
  const { t } = useTranslation();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (auth.status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from ?? '/lobby';
    return <Navigate to={from} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await auth.login(email, password);
  }

  return (
    <div className="page">
      <h1>{t('auth.loginTitle')}</h1>
      <form onSubmit={onSubmit}>
        <label>
          {t('auth.email')}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          {t('auth.password')}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        <button type="submit" disabled={auth.pending}>
          {auth.pending ? t('auth.loginSubmitting') : t('auth.loginSubmit')}
        </button>
      </form>
      {auth.error && <p className="error">{auth.error}</p>}
      <p>
        <Link to="/forgot-password">{t('auth.forgotPasswordLink')}</Link>
      </p>
      <p>
        {t('auth.noAccount')} <Link to="/register">{t('auth.registerLink')}</Link>
      </p>
    </div>
  );
});
