import { observer } from 'mobx-react-lite';
import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../stores/context.js';

export const ForgotPassword = observer(() => {
  const { auth } = useStore();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  if (auth.status === 'authenticated') {
    return <Navigate to="/lobby" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = await auth.requestPasswordReset(email);
    if (ok) setSent(true);
  }

  return (
    <div className="page">
      <h1>{t('auth.forgotPasswordTitle')}</h1>
      {sent ? (
        <p>{t('auth.forgotPasswordSent')}</p>
      ) : (
        <form onSubmit={onSubmit}>
          <label>
            {t('auth.email')}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <button type="submit" disabled={auth.pending}>
            {auth.pending ? t('auth.forgotPasswordSubmitting') : t('auth.forgotPasswordSubmit')}
          </button>
        </form>
      )}
      {auth.error && <p className="error">{auth.error}</p>}
      <p>
        <Link to="/login">{t('auth.loginLink')}</Link>
      </p>
    </div>
  );
});
