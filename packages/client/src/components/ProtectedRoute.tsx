import { observer } from 'mobx-react-lite';
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../stores/context.js';

export const ProtectedRoute = observer(({ children }: { children: ReactNode }) => {
  const { auth } = useStore();
  const { t } = useTranslation();
  const location = useLocation();

  if (auth.status === 'unknown') {
    return <div className="loading">{t('common.loadingAuth')}</div>;
  }
  if (auth.status === 'anonymous') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
});
