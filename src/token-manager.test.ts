import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { TokenManager } from './token-manager.js';

const managedEnvironment = [
  'STRAVA_ACCESS_TOKEN',
  'STRAVA_REFRESH_TOKEN',
  'STRAVA_EXPIRES_AT',
  'STRAVA_CLIENT_ID',
  'STRAVA_CLIENT_SECRET',
  'STRAVA_TOKEN_FILE',
] as const;

test('persists and reloads the latest Strava tokens', async () => {
  const originalEnvironment = Object.fromEntries(
    managedEnvironment.map((key) => [key, process.env[key]])
  );
  const directory = mkdtempSync(join(tmpdir(), 'strava-token-manager-'));
  const tokenFile = join(directory, 'tokens.json');

  try {
    process.env.STRAVA_CLIENT_ID = 'client-id';
    process.env.STRAVA_CLIENT_SECRET = 'client-secret';
    process.env.STRAVA_ACCESS_TOKEN = 'persisted-access-token';
    process.env.STRAVA_REFRESH_TOKEN = 'persisted-refresh-token';
    process.env.STRAVA_EXPIRES_AT = '4102444800';
    process.env.STRAVA_TOKEN_FILE = tokenFile;

    const firstManager = new TokenManager();
    assert.equal(await firstManager.getValidToken(), 'persisted-access-token');
    assert.deepEqual(JSON.parse(readFileSync(tokenFile, 'utf8')), {
      accessToken: 'persisted-access-token',
      refreshToken: 'persisted-refresh-token',
      expiresAt: 4102444800,
    });

    process.env.STRAVA_ACCESS_TOKEN = 'stale-environment-access-token';
    process.env.STRAVA_REFRESH_TOKEN = 'stale-environment-refresh-token';

    const reloadedManager = new TokenManager();
    assert.equal(await reloadedManager.getValidToken(), 'persisted-access-token');
  } finally {
    for (const key of managedEnvironment) {
      const originalValue = originalEnvironment[key];
      if (originalValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalValue;
      }
    }
    rmSync(directory, { recursive: true, force: true });
  }
});
