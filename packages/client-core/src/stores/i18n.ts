import { makeAutoObservable } from 'mobx';

export const SUPPORTED_LANGUAGES = ['en', 'ru', 'zh', 'hi', 'es', 'fr', 'pt'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'en';

// Native names prefixed with country-flag emoji. Kept outside locale files because
// the entries are identical in every translation (languages are always shown natively).
export const LANGUAGE_LABELS: Record<Language, string> = {
  en: '🇬🇧 English',
  ru: '🇷🇺 Русский',
  zh: '🇨🇳 中文',
  hi: '🇮🇳 हिन्दी',
  es: '🇪🇸 Español',
  fr: '🇫🇷 Français',
  pt: '🇵🇹 Português',
};

function isLanguage(value: string | null | undefined): value is Language {
  if (value === null || value === undefined) return false;
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export type LanguageApplier = (lang: Language) => void;

export class I18nStore {
  language: Language = DEFAULT_LANGUAGE;
  private apply: LanguageApplier | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  attachApplier(apply: LanguageApplier, initial?: Language): void {
    this.apply = apply;
    const lang = initial ?? this.language;
    this.language = lang;
    apply(lang);
  }

  setLanguage(lang: Language): void {
    if (this.language === lang) return;
    this.language = lang;
    this.apply?.(lang);
  }

  static pickInitial(stored: string | null, browser: string | null): Language {
    if (isLanguage(stored)) return stored;
    if (browser) {
      const short = browser.toLowerCase().slice(0, 2);
      if (isLanguage(short)) return short;
    }
    return DEFAULT_LANGUAGE;
  }
}
