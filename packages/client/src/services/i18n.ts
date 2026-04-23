import i18n, { type BackendModule, type ReadCallback, type ResourceKey } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANGUAGE, type Language } from '@chess100com/client-core';

export const LANGUAGE_STORAGE_KEY = 'chess100.lang';

// Vite emits a separate chunk per matching file, so each locale ships as its own
// lazily-loaded module instead of being bundled into the main entry.
const localeLoaders = import.meta.glob<Record<string, ResourceKey>>('./locales/*.ts');

const lazyBackend: BackendModule = {
  type: 'backend',
  init: () => {},
  read: (language: string, _namespace: string, callback: ReadCallback) => {
    const loader = localeLoaders[`./locales/${language}.ts`];
    if (!loader) {
      callback(new Error(`Unknown locale: ${language}`), false);
      return;
    }
    loader()
      .then((mod) => { callback(null, mod[language]); })
      .catch((err: unknown) => { callback(err as Error, false); });
  },
};

export function readStoredLanguage(): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function persistLanguage(lang: Language): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  } catch {
    // ignore — storage might be blocked in private mode
  }
}

export function detectBrowserLanguage(): string | null {
  if (typeof navigator === 'undefined') return null;
  return navigator.language ?? null;
}

const noop = (): void => {};

export function initI18n(initial: Language): Promise<unknown> {
  return i18n.use(lazyBackend).use(initReactI18next).init({
    lng: initial,
    fallbackLng: DEFAULT_LANGUAGE,
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: { escapeValue: false },
    returnNull: false,
    // Off because we await init() in main.tsx before rendering; subsequent
    // changeLanguage() calls keep rendering the old dict until the new one
    // resolves, so there's no flash of untranslated content.
    react: { useSuspense: false },
  });
}

export function applyLanguage(lang: Language): void {
  i18n.changeLanguage(lang).catch(noop);
  persistLanguage(lang);
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', lang);
  }
}

export { i18n };
