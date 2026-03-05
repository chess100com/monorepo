'use strict';

const { spawn, execSync } = require('child_process');
const path = require('path');

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;
const STARTUP_TIMEOUT = 60_000;
const ROOT = path.resolve(__dirname, '..');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer(url, timeout) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`${url}/healthcheck`);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await sleep(500);
  }
  throw new Error(`Server did not start within ${timeout}ms`);
}

async function main() {
  execSync('docker compose up -d --build', { cwd: ROOT, stdio: 'inherit', env: { ...process.env, PORT: String(PORT) } });

  let exitCode = 0;
  try {
    await waitForServer(BASE_URL, STARTUP_TIMEOUT);

    const vitest = spawn(
      'npx', ['vitest', 'run', './test'],
      {
        cwd: ROOT,
        stdio: 'inherit',
        env: { ...process.env, TEST_PORT: String(PORT) },
      }
    );

    exitCode = await new Promise((resolve) => {
      vitest.on('close', resolve);
    });
  } finally {
    execSync('docker compose down', { cwd: ROOT, stdio: 'inherit' });
  }

  process.exit(exitCode ?? 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
