import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { rootStore, I18nStore } from '@chess100com/client-core';
import { StoreProvider } from './stores/context.js';
import { App } from './App.js';
import { applyLanguage, detectBrowserLanguage, initI18n, readStoredLanguage } from './services/i18n.js';
import '@chess100com/chessground/assets/chessground.base.css';
import '@chess100com/chessground/assets/chessground.brown.css';
import '@chess100com/chessground/assets/chessground.cburnett.css';
import './styles.css';

const initial = I18nStore.pickInitial(readStoredLanguage(), detectBrowserLanguage());

// Wait for the initial locale chunk to load before mounting React, so the first
// paint renders with translations in place (no flash of raw i18n keys).
// eslint-disable-next-line unicorn/prefer-top-level-await -- Vite target doesn't support TLA
initI18n(initial).finally(() => {
  rootStore.i18n.attachApplier(applyLanguage, initial);

  const root = document.querySelector('#root');
  if (!root) throw new Error('root element missing');

  createRoot(root).render(
    <StrictMode>
      <StoreProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StoreProvider>
    </StrictMode>,
  );
});
