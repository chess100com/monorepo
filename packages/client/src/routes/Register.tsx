import { observer } from 'mobx-react-lite';
import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../stores/context.js';

export const Register = observer(() => {
  const { auth } = useStore();
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (auth.status === 'authenticated') {
    return <Navigate to="/lobby" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await auth.register(username, email, password);
  }

  return (
    <div className="page">
      <h1>{t('auth.registerTitle')}</h1>
      <form onSubmit={onSubmit}>
        <label>
          {t('auth.name')}
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            pattern="[a-zA-Z\-_]+"
            title={t('auth.namePattern')}
            autoComplete="username"
          />
        </label>
        <label>
          {t('auth.email')}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          {t('auth.passwordHint')}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        <button type="submit" disabled={auth.pending}>
          {auth.pending ? t('auth.registerSubmitting') : t('auth.registerSubmit')}
        </button>
      </form>
      {auth.error && <p className="error">{auth.error}</p>}
      <p>
        {t('auth.haveAccount')} <Link to="/login">{t('auth.loginLink')}</Link>
      </p>
    </div>
  );
});
