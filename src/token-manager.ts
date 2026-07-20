import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class TokenManager {
  private accessToken: string;
  private refreshToken: string;
  private expiresAt: number;
  private clientId: string;
  private clientSecret: string;
  private tokenFile?: string;

  constructor() {
    this.accessToken = process.env.STRAVA_ACCESS_TOKEN || '';
    this.refreshToken = process.env.STRAVA_REFRESH_TOKEN || '';
    this.expiresAt = parseInt(process.env.STRAVA_EXPIRES_AT || '0');
    this.clientId = process.env.STRAVA_CLIENT_ID || '';
    this.clientSecret = process.env.STRAVA_CLIENT_SECRET || '';
    this.tokenFile = process.env.STRAVA_TOKEN_FILE;

    if (this.tokenFile) {
      this.loadStoredTokens();
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET must be set');
    }

    if (!this.accessToken || !this.refreshToken) {
      throw new Error('STRAVA_ACCESS_TOKEN and STRAVA_REFRESH_TOKEN must be set. Run setup-auth.ts first.');
    }

    if (this.tokenFile) {
      this.persistTokens();
    }
  }

  async getValidToken(): Promise<string> {
    // If token expires within 1 hour, refresh it
    const oneHour = 60 * 60;
    const currentTime = Math.floor(Date.now() / 1000);

    if (currentTime > this.expiresAt - oneHour) {
      await this.refresh();
    }

    return this.accessToken;
  }

  private async refresh(): Promise<void> {
    console.log('Refreshing Strava access token...');

    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${response.status} ${error}`);
    }

    const data = await response.json() as {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    };

    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.expiresAt = data.expires_at;
    this.persistTokens();

    console.log('Token refreshed successfully');
  }

  private loadStoredTokens(): void {
    if (!this.tokenFile) {
      return;
    }

    try {
      const stored = JSON.parse(readFileSync(this.tokenFile, 'utf8')) as StoredTokens;

      if (!stored.accessToken || !stored.refreshToken || !Number.isFinite(stored.expiresAt)) {
        throw new Error('token file is missing required values');
      }

      this.accessToken = stored.accessToken;
      this.refreshToken = stored.refreshToken;
      this.expiresAt = stored.expiresAt;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to read STRAVA_TOKEN_FILE: ${message}`);
      }
    }
  }

  private persistTokens(): void {
    if (!this.tokenFile) {
      return;
    }

    const temporaryFile = `${this.tokenFile}.${process.pid}.${randomUUID()}.tmp`;
    mkdirSync(dirname(this.tokenFile), { recursive: true });
    writeFileSync(temporaryFile, JSON.stringify({
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      expiresAt: this.expiresAt,
    }), { mode: 0o600 });
    renameSync(temporaryFile, this.tokenFile);
  }
}
