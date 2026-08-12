import { beforeEach, describe, expect, it } from 'vitest';
import app from '../src/worker';
import { NAME_CREDENTIAL_PREFIX } from '../src/domain/name-credential';
import { MAX_FLOWERS_PER_NAME_HOUR } from '../src/db/flowers';
import { MockD1Database } from './mock-d1';

async function claimName(
  env: { DB: D1Database },
  displayName: string,
  ip = '203.0.113.20',
): Promise<string> {
  const response = await app.request(
    '/api/plaza/posts',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'CF-Connecting-IP': ip },
      body: JSON.stringify({
        display_name: displayName,
        body: `Claim ${displayName}`,
        topic: 'signals',
      }),
    },
    env,
  );
  const payload = (await response.json()) as { data: { name_credential: string; post_id: string } };
  return payload.data.name_credential;
}

async function createPost(
  env: { DB: D1Database },
  displayName: string,
  body: string,
  nameCredential?: string,
): Promise<string> {
  const response = await app.request(
    '/api/plaza/posts',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '203.0.113.21' },
      body: JSON.stringify({
        display_name: displayName,
        name_credential: nameCredential,
        body,
        topic: 'signals',
      }),
    },
    env,
  );
  const payload = (await response.json()) as { data: { post_id: string } };
  return payload.data.post_id;
}

describe('Flowers API', () => {
  const db = new MockD1Database();

  beforeEach(async () => {
    await db.exec('CREATE TABLE IF NOT EXISTS plaza_posts');
    db.reset();
  });

  it('adds a flower and exposes flower_count on the post', async () => {
    const env = { DB: db as unknown as D1Database };
    const authorCredential = await claimName(env, 'flower-author');
    const postId = await createPost(env, 'flower-author', 'Root post', authorCredential);

    const reactorCredential = await claimName(env, 'flower-reactor', '203.0.113.22');
    await createPost(env, 'flower-reactor', 'Verified history post', reactorCredential);

    const flowerResponse = await app.request(
      `/api/plaza/posts/${postId}/flowers`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'flower-reactor',
          name_credential: reactorCredential,
          reason: 'Useful trace.',
        }),
      },
      env,
    );
    expect(flowerResponse.status).toBe(201);
    const flowerPayload = (await flowerResponse.json()) as {
      data: { flower_count: number; signal_score: number };
    };
    expect(flowerPayload.data.flower_count).toBe(1);
    expect(flowerPayload.data.signal_score).toBe(1);

    const detailResponse = await app.request(`/api/plaza/posts/${postId}`, {}, env);
    const detail = (await detailResponse.json()) as {
      data: { flower_count: number; signal_score: number };
    };
    expect(detail.data.flower_count).toBe(1);
    expect(detail.data.signal_score).toBe(1);
  });

  it('rejects flowering own post', async () => {
    const env = { DB: db as unknown as D1Database };
    const credential = await claimName(env, 'self-flower');
    const postId = await createPost(env, 'self-flower', 'My post', credential);

    const response = await app.request(
      `/api/plaza/posts/${postId}/flowers`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'self-flower',
          name_credential: credential,
        }),
      },
      env,
    );
    expect(response.status).toBe(400);
    const payload = (await response.json()) as { error: string };
    expect(payload.error).toBe('flower_own_post');
  });

  it('rejects duplicate flowers from the same display name', async () => {
    const env = { DB: db as unknown as D1Database };
    const authorCredential = await claimName(env, 'dup-author');
    const postId = await createPost(env, 'dup-author', 'Target post', authorCredential);

    const reactorCredential = await claimName(env, 'dup-reactor', '203.0.113.23');
    await createPost(env, 'dup-reactor', 'Verified history', reactorCredential);

    const first = await app.request(
      `/api/plaza/posts/${postId}/flowers`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'dup-reactor',
          name_credential: reactorCredential,
        }),
      },
      env,
    );
    expect(first.status).toBe(201);

    const duplicate = await app.request(
      `/api/plaza/posts/${postId}/flowers`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'dup-reactor',
          name_credential: reactorCredential,
        }),
      },
      env,
    );
    expect(duplicate.status).toBe(409);
    const payload = (await duplicate.json()) as { error: string };
    expect(payload.error).toBe('flower_duplicate');
  });

  it('revokes a flower with DELETE', async () => {
    const env = { DB: db as unknown as D1Database };
    const authorCredential = await claimName(env, 'revoke-author');
    const postId = await createPost(env, 'revoke-author', 'Target post', authorCredential);

    const reactorCredential = await claimName(env, 'revoke-reactor', '203.0.113.24');
    await createPost(env, 'revoke-reactor', 'Verified history', reactorCredential);

    await app.request(
      `/api/plaza/posts/${postId}/flowers`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'revoke-reactor',
          name_credential: reactorCredential,
        }),
      },
      env,
    );

    const revokeResponse = await app.request(
      `/api/plaza/posts/${postId}/flowers`,
      {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'revoke-reactor',
          name_credential: reactorCredential,
        }),
      },
      env,
    );
    expect(revokeResponse.status).toBe(200);
    const revoked = (await revokeResponse.json()) as { data: { flower_count: number } };
    expect(revoked.data.flower_count).toBe(0);
  });

  it('blocks flowers on demo posts', async () => {
    const env = { DB: db as unknown as D1Database };
    const response = await app.request(
      '/api/plaza/posts/demo_plz_biology_001/flowers',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'demo-reactor',
          name_credential: `${NAME_CREDENTIAL_PREFIX}demo`,
        }),
      },
      env,
    );
    expect(response.status).toBe(403);
    const payload = (await response.json()) as { error: string };
    expect(payload.error).toBe('demo_post_readonly');
  });

  it('sorts feed by signal score when sort=signal', async () => {
    const env = { DB: db as unknown as D1Database };

    const authorCredential = await claimName(env, 'signal-author');
    const lowPostId = await createPost(env, 'signal-author', 'Low signal post', authorCredential);
    const highPostId = await createPost(env, 'signal-author', 'High signal post', authorCredential);

    const reactorNames = ['signal-reactor-a', 'signal-reactor-b', 'signal-reactor-c'];
    for (const reactorName of reactorNames) {
      const reactorCredential = await claimName(env, reactorName, `203.0.113.3${reactorNames.indexOf(reactorName)}`);
      await createPost(env, reactorName, 'Verified history', reactorCredential);
      await app.request(
        `/api/plaza/posts/${highPostId}/flowers`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            display_name: reactorName,
            name_credential: reactorCredential,
          }),
        },
        env,
      );
    }

    const soloCredential = await claimName(env, 'signal-reactor-solo', '203.0.113.35');
    await createPost(env, 'signal-reactor-solo', 'Verified history', soloCredential);
    await app.request(
      `/api/plaza/posts/${lowPostId}/flowers`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'signal-reactor-solo',
          name_credential: soloCredential,
        }),
      },
      env,
    );

    const listResponse = await app.request('/api/plaza/posts?roots_only=true&sort=signal', {}, env);
    const listPayload = (await listResponse.json()) as {
      data: { items: Array<{ post_id: string; signal_score: number }>; cursor_field: string };
    };
    expect(listPayload.data.cursor_field).toBe('signal_score');
    expect(listPayload.data.items[0]?.post_id).toBe(highPostId);
    expect(listPayload.data.items[0]?.signal_score).toBeGreaterThan(
      listPayload.data.items.find((item) => item.post_id === lowPostId)?.signal_score ?? 0,
    );
  });

  it('rate limits flowers per display name per hour', async () => {
    const env = { DB: db as unknown as D1Database };
    const authorCredential = await claimName(env, 'rate-flower-author');
    const reactorCredential = await claimName(env, 'rate-flower-reactor', '203.0.113.26');
    await createPost(env, 'rate-flower-reactor', 'Verified history', reactorCredential);

    for (let index = 0; index < MAX_FLOWERS_PER_NAME_HOUR; index += 1) {
      const postId = await createPost(
        env,
        'rate-flower-author',
        `Target ${index}`,
        authorCredential,
      );
      const response = await app.request(
        `/api/plaza/posts/${postId}/flowers`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            display_name: 'rate-flower-reactor',
            name_credential: reactorCredential,
          }),
        },
        env,
      );
      expect(response.status).toBe(201);
    }

    const blockedPostId = await createPost(
      env,
      'rate-flower-author',
      'Blocked target',
      authorCredential,
    );
    const blocked = await app.request(
      `/api/plaza/posts/${blockedPostId}/flowers`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'rate-flower-reactor',
          name_credential: reactorCredential,
        }),
      },
      env,
    );
    expect(blocked.status).toBe(429);
    const payload = (await blocked.json()) as { error: string };
    expect(payload.error).toBe('flower_rate_limited');
  });
});
