import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';

const BASE_URL = `http://localhost:${process.env.TEST_PORT ?? 3000}`;
const MOCK_URL = process.env.EXTERNAL_MOCK_URL ?? 'http://localhost:4001';

interface Mail { subject: string; to: string; body: string; sentAt: string }

const fetchMailsFor = async (to: string): Promise<Mail[]> => {
  const res = await fetch(`${MOCK_URL}/mail/get-last`);
  if (!res.ok) throw new Error(`mock get-last failed: ${res.status}`);
  const { mails } = await res.json() as { mails: Mail[] };
  return mails.filter(m => m.to === to);
};

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => { setTimeout(resolve, ms); });

const waitForMail = async (to: string, minCount: number, timeoutMs = 5000): Promise<Mail[]> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    // oxlint-disable-next-line no-await-in-loop
    const mails = await fetchMailsFor(to);
    if (mails.length >= minCount) return mails;
    // oxlint-disable-next-line no-await-in-loop
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${minCount} mail(s) to ${to}`);
};

const extractUrl = (body: string): string => {
  const match = body.match(/https?:\/\/\S+/);
  if (!match) throw new Error(`no URL in mail body:\n${body}`);
  return match[0];
};

const extractPassword = (body: string): string => {
  // The new-password template puts the password alone on its own line,
  // preceded by the "Your new password is:" line.
  const match = body.match(/new password is:\s*\n+\s*([^\s]+)/);
  if (!match) throw new Error(`no password in mail body:\n${body}`);
  return match[1];
};

describe('Password reset flow', () => {
  it('request → click link → login with new password', async () => {
    const username = faker.internet.username().replaceAll(/[^a-zA-Z\-_]/g, '_');
    const email = `pwreset-${Date.now()}-${faker.string.alphanumeric(6).toLowerCase()}@test.example`;
    const originalPassword = faker.internet.password({ length: 10 });

    const reg = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password: originalPassword }),
    });
    expect(reg.status).toBe(200);

    const requestReset = await fetch(`${BASE_URL}/password/request-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    expect(requestReset.status).toBe(200);

    const [linkMail] = await waitForMail(email, 1);
    expect(linkMail.subject).toMatch(/reset/i);
    const resetUrl = extractUrl(linkMail.body);
    expect(resetUrl).toContain('/password/reset?code=');

    const clicked = await fetch(resetUrl);
    expect(clicked.status).toBe(200);

    const mailsAfter = await waitForMail(email, 2);
    // Mock returns newest-first; the new-password mail is the latest.
    const passwordMail = mailsAfter[0];
    expect(passwordMail.subject).toMatch(/new password/i);
    const newPassword = extractPassword(passwordMail.body);
    expect(newPassword.length).toBeGreaterThan(0);
    expect(newPassword).not.toBe(originalPassword);

    const loginNew = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: newPassword }),
    });
    expect(loginNew.status).toBe(200);

    const loginOld = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: originalPassword }),
    });
    expect(loginOld.status).toBe(401);
  });

  it('request-reset for unknown email still returns 200 (no enumeration)', async () => {
    const res = await fetch(`${BASE_URL}/password/request-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `missing-${Date.now()}@test.example` }),
    });
    expect(res.status).toBe(200);
  });

  it('reset link with invalid code returns 400', async () => {
    const res = await fetch(`${BASE_URL}/password/reset?code=not-a-real-code`);
    expect(res.status).toBe(400);
  });
});
