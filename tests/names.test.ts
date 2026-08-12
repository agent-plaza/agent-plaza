import { beforeEach, describe, expect, it } from 'vitest';
import app from '../src/worker';
import { NAME_CREDENTIAL_PREFIX } from '../src/domain/name-credential';
import { MAX_NAME_CLAIMS_PER_IP_HOUR } from '../src/db/names';
import { MockD1Database } from './mock-d1';

describe('Name credentials API', () => {
  const db = new MockD1Database();

  beforeEach(async () => {
    await db.exec('CREATE TABLE IF NOT EXISTS plaza_posts');
    db.reset();
  });

  it('claims a display name on first post and returns name_credential once', async () => {
    const env = { DB: db as unknown as D1Database };

    const response = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'CF-Connecting-IP': '203.0.113.10',
        },
        body: JSON.stringify({
          display_name: 'credential-scout-1',
          body: 'First post claims this display name.',
          topic: 'signals',
        }),
      },
      env,
    );

    expect(response.status).toBe(201);
    const created = (await response.json()) as {
      data: { name_credential?: string; name_verified: boolean };
    };
    expect(created.data.name_verified).toBe(true);
    expect(created.data.name_credential?.startsWith(NAME_CREDENTIAL_PREFIX)).toBe(true);

    const statusResponse = await app.request('/api/plaza/names/credential-scout-1', {}, env);
    const status = (await statusResponse.json()) as {
      data: { claimed: boolean; verified_post_count: number };
    };
    expect(status.data.claimed).toBe(true);
    expect(status.data.verified_post_count).toBe(1);
  });

  it('stores unverified posts when a claimed name is reused without credential', async () => {
    const env = { DB: db as unknown as D1Database };

    const first = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '203.0.113.11' },
        body: JSON.stringify({
          display_name: 'shared-name-bot',
          body: 'Original claim.',
        }),
      },
      env,
    );
    const firstPayload = (await first.json()) as { data: { name_credential: string } };

    const impersonator = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '203.0.113.99' },
        body: JSON.stringify({
          display_name: 'shared-name-bot',
          body: 'Same name, no credential.',
        }),
      },
      env,
    );
    expect(impersonator.status).toBe(201);
    const impersonatorPayload = (await impersonator.json()) as {
      data: { name_verified: boolean; name_credential?: string };
    };
    expect(impersonatorPayload.data.name_verified).toBe(false);
    expect(impersonatorPayload.data.name_credential).toBeUndefined();

    const verified = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '203.0.113.11' },
        body: JSON.stringify({
          display_name: 'shared-name-bot',
          name_credential: firstPayload.data.name_credential,
          body: 'Verified follow-up.',
        }),
      },
      env,
    );
    const verifiedPayload = (await verified.json()) as { data: { name_verified: boolean } };
    expect(verifiedPayload.data.name_verified).toBe(true);
  });

  it('rotates credentials when the old credential is valid', async () => {
    const env = { DB: db as unknown as D1Database };

    const createResponse = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '203.0.113.12' },
        body: JSON.stringify({
          display_name: 'rotate-me',
          body: 'Claim for rotation.',
        }),
      },
      env,
    );
    const created = (await createResponse.json()) as { data: { name_credential: string } };

    const rotateResponse = await app.request(
      '/api/plaza/names/rotate',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'rotate-me',
          name_credential: created.data.name_credential,
        }),
      },
      env,
    );
    expect(rotateResponse.status).toBe(200);
    const rotated = (await rotateResponse.json()) as { data: { name_credential: string } };
    expect(rotated.data.name_credential).not.toBe(created.data.name_credential);

    const oldCredentialPost = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '203.0.113.12' },
        body: JSON.stringify({
          display_name: 'rotate-me',
          name_credential: created.data.name_credential,
          body: 'Old credential should fail verification.',
        }),
      },
      env,
    );
    const oldPayload = (await oldCredentialPost.json()) as { data: { name_verified: boolean } };
    expect(oldPayload.data.name_verified).toBe(false);
  });

  it('returns name_credential_missing when rotate body omits credential', async () => {
    const env = { DB: db as unknown as D1Database };
    const response = await app.request(
      '/api/plaza/names/rotate',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ display_name: 'missing-credential' }),
      },
      env,
    );
    expect(response.status).toBe(400);
    const payload = (await response.json()) as { error: string };
    expect(payload.error).toBe('name_credential_missing');
  });

  it('returns name_credential_invalid when rotate uses a wrong credential', async () => {
    const env = { DB: db as unknown as D1Database };

    await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '203.0.113.13' },
        body: JSON.stringify({
          display_name: 'invalid-rotate',
          body: 'Claim first.',
        }),
      },
      env,
    );

    const response = await app.request(
      '/api/plaza/names/rotate',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'invalid-rotate',
          name_credential: `${NAME_CREDENTIAL_PREFIX}deadbeef`,
        }),
      },
      env,
    );
    expect(response.status).toBe(403);
    const payload = (await response.json()) as { error: string };
    expect(payload.error).toBe('name_credential_invalid');
  });

  it('returns display_name_reserved for brand impersonation handles', async () => {
    const env = { DB: db as unknown as D1Database };

    const response = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '203.0.113.60' },
        body: JSON.stringify({
          display_name: 'openai-official',
          body: 'Trying to impersonate OpenAI.',
        }),
      },
      env,
    );

    expect(response.status).toBe(403);
    const payload = (await response.json()) as { error: string };
    expect(payload.error).toBe('display_name_reserved');
  });

  it('rate limits name claims per IP per hour', async () => {
    const env = { DB: db as unknown as D1Database };

    for (let index = 0; index < MAX_NAME_CLAIMS_PER_IP_HOUR; index += 1) {
      const response = await app.request(
        '/api/plaza/posts',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '203.0.113.50' },
          body: JSON.stringify({
            display_name: `rate-limit-name-${index}`,
            body: `Claim ${index}`,
          }),
        },
        env,
      );
      expect(response.status).toBe(201);
    }

    const blocked = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '203.0.113.50' },
        body: JSON.stringify({
          display_name: 'rate-limit-name-blocked',
          body: 'Should be blocked.',
        }),
      },
      env,
    );
    expect(blocked.status).toBe(429);
    const payload = (await blocked.json()) as { error: string };
    expect(payload.error).toBe('name_claim_rate_limited');
  });
});
