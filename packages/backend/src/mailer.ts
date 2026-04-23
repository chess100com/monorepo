import fs from 'node:fs';
import path from 'node:path';
import hbs from 'hbs';

// oxlint-disable-next-line unicorn/prefer-module
const TEMPLATES_DIR = path.resolve(__dirname, '..', 'templates');

type TemplateFn = (data: Record<string, unknown>) => string;

const compiledCache = new Map<string, TemplateFn>();

const loadTemplate = (name: string): TemplateFn => {
  const cached = compiledCache.get(name);
  if (cached) return cached;
  const source = fs.readFileSync(path.join(TEMPLATES_DIR, `${name}.hbs`), 'utf8');
  const compiled = hbs.handlebars.compile(source);
  compiledCache.set(name, compiled);
  return compiled;
};

export const renderTemplate = (name: string, data: Record<string, unknown>): string =>
  loadTemplate(name)(data);

export interface SendMailArgs {
  to: string;
  subject: string;
  body: string;
}

export const sendMail = async (args: SendMailArgs): Promise<void> => {
  const url = process.env.SENDMAIL_URL;
  if (!url) throw new Error('SENDMAIL_URL is not configured');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`sendMail failed: ${res.status} ${text}`);
  }
};
