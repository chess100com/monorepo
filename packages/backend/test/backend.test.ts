import { describe, it, expect } from 'vitest';
import { io as ioClient } from 'socket.io-client';
import { faker } from '@faker-js/faker';

const BASE_URL = `http://localhost:${process.env.TEST_PORT ?? 3000}`;

describe('Backend', () => {
  it('GET /healthcheck responds with OK', async () => {
    const res = await fetch(`${BASE_URL}/healthcheck`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe('OK');
  });

  it('socket ping/pong', async () => {
    await new Promise<void>((resolve, reject) => {
      const socket = ioClient(BASE_URL);
      const timer = setTimeout(() => {
        socket.disconnect();
        reject(new Error('Timeout waiting for pong'));
      }, 5000);

      socket.on('connect', () => {
        socket.emit('ping');
      });

      socket.on('pong', () => {
        clearTimeout(timer);
        socket.disconnect();
        resolve();
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  });
});

describe('Registration', () => {
  const username = faker.internet.username().replaceAll(/[^a-zA-Z\-_]/g, '_');
  const email = faker.internet.email();
  const password = faker.internet.password({ length: 10 });

  // Cookie jar for session persistence
  let sessionCookie = '';

  it('POST /register returns 200', async () => {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    expect(res.status).toBe(200);
  });

  it('POST /login returns 200 and sets cookie', async () => {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    expect(res.status).toBe(200);
    const cookie = res.headers.get('set-cookie');
    expect(cookie).toBeTruthy();
    sessionCookie = cookie ?? '';
  });

  it('POST /my-info returns correct username and email', async () => {
    const res = await fetch(`${BASE_URL}/my-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { username: string; email: string };
    expect(body.username).toBe(username);
    expect(body.email).toBe(email);
  });

  it('socket my-info returns correct username and email', async () => {
    await new Promise<void>((resolve, reject) => {
      const socket = ioClient(BASE_URL, {
        extraHeaders: { Cookie: sessionCookie },
      });

      const timer = setTimeout(() => {
        socket.disconnect();
        reject(new Error('Timeout waiting for my-info'));
      }, 5000);

      socket.on('connect', () => {
        socket.emit('my-info');
      });

      socket.on('my-info', (data: { username: string; email: string }) => {
        clearTimeout(timer);
        socket.disconnect();
        try {
          expect(data.username).toBe(username);
          expect(data.email).toBe(email);
          resolve();
        } catch (e) {
          reject(e);
        }
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  });
});
