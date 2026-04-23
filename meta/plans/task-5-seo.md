---
SECTION_ID: plans.task-5-seo
TYPE: plan
STATUS: in_progress
PRIORITY: medium
---

# Task-5: SEO — prerendered Home and Rules pages across all locales

GOAL: Сделать [Home.tsx](packages/client/src/routes/Home.tsx) и [Rules.tsx](packages/client/src/routes/Rules.tsx) индексируемыми во всех 7 поддерживаемых языках (`en, ru, zh, hi, es, fr, pt`). Поисковик должен получать уже отрендеренный HTML с переводами, корректными `<title>`, `meta description`, `canonical` и `hreflang`, без переписывания на Next.js.

## Подход

Пререндер на этапе `vite build`: собственный Node-скрипт в [packages/client/scripts/prerender.ts](packages/client/scripts/prerender.ts), который использует `ReactDOMServer.renderToString` + `StaticRouter`, синхронно подгружает словарь нужного локаля через `i18n.addResourceBundle` (в обход lazy-backend из [services/i18n.ts](packages/client/src/services/i18n.ts)) и пишет 14 HTML-файлов поверх `dist/`:

```
dist/index.html                  ← en (/)
dist/rules/index.html            ← en (/rules)
dist/ru/index.html               ← ru (/ru)
dist/ru/rules/index.html         ← ru (/ru/rules)
dist/zh/index.html, dist/zh/rules/index.html
dist/hi/…, dist/es/…, dist/fr/…, dist/pt/…
```

Клиент на этих страницах **гидрируется** (`hydrateRoot` вместо `createRoot`), чтобы не было flash of untranslated content и React не выкинул hydration mismatch. На всех остальных путях (`/lobby`, `/game/:id`, `/profile`, `/login`, …) отдаётся универсальный `dist/index.html` с дефолтным языком — те страницы за авторизацией, SEO им не нужен.

Английский — каноничный без префикса (`/`, `/rules`); остальные 6 языков под префиксом (`/ru/…`, `/zh/…` и т.д.) с `hreflang` alternates и `x-default` → en.

## Главные tradeoff'ы и ловушки

- **Язык теперь часть URL, а не только стора.** При заходе на `/ru/rules` приложение должно инициализироваться на `ru`, не обращаясь к `localStorage`. localStorage остаётся fallback'ом только для корня `/` и приватных путей.
- **Гидрация требует, чтобы SSR и клиент рендерили одинаково.** Значит в `main.tsx` до `hydrateRoot` язык должен быть уже применён (как и сейчас через `await initI18n`), только источник языка — URL, а не только `readStoredLanguage()`.
- **MobX сторы / сокет не должны запускаться на сервере.** Socket singleton ([services/socket.ts](packages/client/src/services/socket.ts)) создаётся лениво на первом обращении — пререндер Home/Rules к нему не обращается, значит трогать не нужно. Но если вдруг какой-то компонент на пути рендера обращается к `auth.user`, нам это ок — `AuthStore` в начальном состоянии `'unknown'` рендерит публичный шапку, что и нужно для индексации. Hydration mismatch после `auth.hydrate()` — штатный ре-рендер, не ошибка.
- **`Layout`'s `<select>` переключатель** должен делать `navigate()` на тот же маршрут в новом языке (`/rules` → `/fr/rules`), а не только `i18nStore.setLanguage`. Иначе URL и контент разъедутся.
- **Все внутренние `<Link>`/`<NavLink>`** на `/`, `/rules` нужно обернуть в helper `localePath(path)`, который добавляет префикс текущего языка (кроме `en`).
- **nginx** сейчас делает `try_files $uri $uri/ /index.html`. Именно это нам и нужно: `/ru/rules` → попробует `$uri` (нет), потом `$uri/` → найдёт `dist/ru/rules/index.html`. Менять nginx не придётся — важно только, чтобы скрипт клал файлы как `<path>/index.html`.
- **Lazy-locale backend** в `services/i18n.ts` использует `import.meta.glob`. В Node-скрипте пререндера этого API нет — придётся либо импортировать словари напрямую (`import en from '../src/services/locales/en'`), либо прогнать скрипт через Vite SSR (`createServer({ server: { middlewareMode: true } }).ssrLoadModule`). Рекомендую SSR-режим Vite — так меньше расходится с продом и не придётся ручного реестра словарей.
- **Home и Rules используют `<Trans components={{ 1: <strong /> }}>`.** Это работает в SSR из коробки, но нужно проверить на первом прогоне, что никаких обращений к `window`/`document` внутри нет.

## Task Checklist

### Phase 1: Роутинг по языкам (без пререндера, проверяем SPA-часть)

- [ ] Добавить helper [packages/client/src/services/locale-url.ts](packages/client/src/services/locale-url.ts) с `parseLocaleFromPath(pathname): { lang, rest }` и `localePath(path, lang)` (для `en` префикс не добавляет).
- [ ] Обновить [App.tsx](packages/client/src/App.tsx): публичные роуты (`/`, `/rules`, `/login`, `/register`, `/forgot-password`) продублировать под `/:lang/*`, где `:lang ∈ SUPPORTED_LANGUAGES \ {en}`. Приватные (`/lobby`, `/game/:id`, `/profile`) остаются без префикса.
- [ ] Компонент-обёртка `<LocaleGate>` на префиксных роутах: читает `:lang` из `useParams`, вызывает `i18nStore.setLanguage(lang)` в `useEffect`, пока синхронизация не прошла — рендерит `null` (или `children` если `i18n.language === lang`).
- [ ] Обновить [Layout.tsx](packages/client/src/components/Layout.tsx):
  - `onLangChange` делает `navigate(localePath(restOfCurrentPath, newLang))`, плюс `i18nStore.setLanguage`.
  - Все `to="/"`, `to="/rules"` обернуть в `localePath(...)`.
- [ ] Обновить [main.tsx](packages/client/src/main.tsx): начальный язык выбирать в приоритете URL > localStorage > browser > default. То есть `I18nStore.pickInitial(fromUrl, stored, browser)` — расширить `pickInitial` ещё одним аргументом в [client-core i18n store](packages/client-core/src/stores/i18n.ts).
- [ ] Проверить руками: `npm run dev`, зайти на `/fr/rules`, переключить язык селектором на `ru` → URL становится `/ru/rules`, контент переводится, обновление страницы сохраняет язык.

### Phase 2: Мета-теги

- [ ] `npm i react-helmet-async` в `packages/client`.
- [ ] Обернуть `<App>` в `<HelmetProvider>` в [main.tsx](packages/client/src/main.tsx).
- [ ] Создать [packages/client/src/components/SeoHead.tsx](packages/client/src/components/SeoHead.tsx) — принимает `path` (абсолютный, например `/rules`), рендерит:
  - `<title>`, `<meta name="description">` из `t('seo.<page>.title'/'description')`
  - `<link rel="canonical" href="{ORIGIN}{localePath(path, currentLang)}"/>`
  - 7 × `<link rel="alternate" hreflang="…" href="…"/>` + `hreflang="x-default"` → en
  - OpenGraph: `og:title`, `og:description`, `og:locale`, `og:url`, `og:type=website`.
- [ ] Использовать `<SeoHead path="/" />` в `Home.tsx` и `<SeoHead path="/rules" />` в `Rules.tsx`.
- [ ] Добавить ключи `seo.home.title`, `seo.home.description`, `seo.rules.title`, `seo.rules.description` во все 7 словарей в [packages/client/src/services/locales/](packages/client/src/services/locales/).
- [ ] `ORIGIN` — env-переменная `VITE_PUBLIC_ORIGIN` (например `https://chess100.com`), с дефолтом `''` для dev.

### Phase 3: Скрипт пререндера

- [ ] Добавить devDeps в [packages/client/package.json](packages/client/package.json): `tsx` (для запуска TS-скрипта в Node).
- [ ] Написать [packages/client/scripts/prerender.ts](packages/client/scripts/prerender.ts):
  1. Считать `dist/index.html` как шаблон.
  2. Через `vite.createServer({ server: { middlewareMode: true } })` сделать `ssrLoadModule('/src/services/locales/<lang>.ts')` для каждого языка → получить словарь.
  3. Для каждой пары `(lang, path)` из `{en,ru,zh,…} × {/, /rules}`:
     - создать свежий i18next instance, зарегистрировать словарь через `addResourceBundle(lang, 'translation', dict)`, `changeLanguage(lang)`;
     - обернуть `<App>` в `<StaticRouter location={localePath(path, lang)}>` + `<HelmetProvider context={helmetCtx}>` + `<I18nextProvider i18n={instance}>`;
     - `renderToString` → получить `appHtml`;
     - из `helmetCtx.helmet` достать `title`, `meta`, `link` strings, вставить в `<head>` шаблона;
     - `appHtml` вставить в `<div id="root">…</div>`;
     - также выставить в шаблоне `<html lang="{lang}">`;
     - записать в `dist/{localePath(path,lang)}/index.html`.
  4. Закрыть vite-сервер.
- [ ] Обновить `scripts.build` в [package.json](packages/client/package.json) на `tsc -b && vite build && tsx scripts/prerender.ts`.
- [ ] `createRoot` → `hydrateRoot` в [main.tsx](packages/client/src/main.tsx).

### Phase 4: Sitemap + robots

- [ ] В том же `prerender.ts` сгенерировать `dist/sitemap.xml` с 2 `<url>` блоками (home, rules), у каждого 7 `<xhtml:link rel="alternate" hreflang="…">` + `x-default`.
- [ ] Создать статический [packages/client/public/robots.txt](packages/client/public/robots.txt) (Vite копирует `public/*` в `dist/`):
  ```
  User-agent: *
  Allow: /
  Disallow: /lobby
  Disallow: /game/
  Disallow: /profile
  Disallow: /login
  Disallow: /register
  Disallow: /forgot-password
  Sitemap: {VITE_PUBLIC_ORIGIN}/sitemap.xml
  ```
  (URL в `Sitemap:` подставить на этапе пререндера тем же скриптом — т.е. robots.txt тоже генерируем, не кладём в `public/`).

### Phase 5: Проверка

- [ ] `npm run build` в `packages/client` — должен собраться и создать все 14 HTML + sitemap.xml + robots.txt.
- [ ] Глазами проверить `dist/ru/rules/index.html`: в `<head>` есть русский `<title>`, description, canonical на `/ru/rules`, все `hreflang`; в `<body>` — русский контент правил.
- [ ] `docker compose up --build` из корня, зайти `curl http://localhost:8080/fr/` и `curl http://localhost:8080/zh/rules` — HTML содержит переводы до выполнения JS.
- [ ] В браузере: зайти на `/ru/rules`, убедиться что React гидрирует без ошибок в консоли (особенно про hydration mismatch).
- [ ] `npm run lint` и `npm run check-ts` в `packages/client`.
- [ ] `meta/plans/task-5-seo.md` STATUS: in_progress → done.

## Не входит в задачу

- Динамический SSR (каждый запрос рендерится на лету) — избыточно, у нас только 2 статические публичные страницы.
- Индексация лидерборда / профилей / сыгранных партий — если понадобится позже, это отдельная задача (там нужен реальный SSR либо периодический ре-пререндер).
- Проксирование поисковых ботов в отдельный puppeteer-сервис — не нужно, раз HTML уже статический.
