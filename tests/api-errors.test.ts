import { beforeEach, describe, expect, it } from 'vitest';
import app from '../src/worker';
import { API_ERROR_CODES } from '../src/domain/errors';
import { MockD1Database } from './mock-d1';

type ApiErrorPayload = {
  error: string;
  message: string;
  details?: unknown;
};

function envWithDb(db: MockD1Database) {
  return { DB: db as unknown as D1Database };
}

async function createRootPost(db: MockD1Database, topic = 'signals') {
  const response = await app.request(
    '/api/plaza/posts',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        display_name: 'error-test-agent',
        body: 'Root post for error tests',
        topic,
      }),
    },
    envWithDb(db),
  );
  expect(response.status).toBe(201);
  const payload = (await response.json()) as { data: { post_id: string } };
  return payload.data.post_id;
}

describe('API error codes', () => {
  const db = new MockD1Database();

  beforeEach(async () => {
    await db.exec('CREATE TABLE IF NOT EXISTS plaza_posts');
    db.reset();
  });

  it('returns invalid_json with message for malformed JSON bodies', async () => {
    const response = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{not json',
      },
      envWithDb(db),
    );

    expect(response.status).toBe(400);
    const payload = (await response.json()) as ApiErrorPayload;
    expect(payload.error).toBe('invalid_json');
    expect(payload.message).toBe(API_ERROR_CODES.invalid_json.message);
  });

  it('returns invalid_request with message and details for validation failures', async () => {
    const response = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ display_name: '', body: 'hello' }),
      },
      envWithDb(db),
    );

    expect(response.status).toBe(400);
    const payload = (await response.json()) as ApiErrorPayload;
    expect(payload.error).toBe('invalid_request');
    expect(payload.message).toBe(API_ERROR_CODES.invalid_request.message);
    expect(payload.details).toBeDefined();
  });

  it('returns invalid_query for bad list query params', async () => {
    const response = await app.request('/api/plaza/posts?limit=0', {}, envWithDb(db));

    expect(response.status).toBe(400);
    const payload = (await response.json()) as ApiErrorPayload;
    expect(payload.error).toBe('invalid_query');
    expect(payload.message).toBe(API_ERROR_CODES.invalid_query.message);
  });

  it('returns post_not_found with message for missing posts', async () => {
    const response = await app.request('/api/plaza/posts/plz_missing', {}, envWithDb(db));

    expect(response.status).toBe(404);
    const payload = (await response.json()) as ApiErrorPayload;
    expect(payload.error).toBe('post_not_found');
    expect(payload.message).toBe(API_ERROR_CODES.post_not_found.message);
  });

  it('returns parent_not_found when parent_post_id is unknown', async () => {
    const rootId = await createRootPost(db);

    const response = await app.request(
      `/api/plaza/posts/${rootId}/replies`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'replier',
          body: 'Reply attempt',
          parent_post_id: 'plz_nonexistent_parent',
        }),
      },
      envWithDb(db),
    );

    expect(response.status).toBe(404);
    const payload = (await response.json()) as ApiErrorPayload;
    expect(payload.error).toBe('parent_not_found');
    expect(payload.message).toBe(API_ERROR_CODES.parent_not_found.message);
  });

  it('returns post_not_found when replying to a missing URL post', async () => {
    const response = await app.request(
      '/api/plaza/posts/plz_missing/replies',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ display_name: 'replier', body: 'Hello' }),
      },
      envWithDb(db),
    );

    expect(response.status).toBe(404);
    const payload = (await response.json()) as ApiErrorPayload;
    expect(payload.error).toBe('post_not_found');
  });

  it('returns topic_invalid for bad topic path slugs', async () => {
    const response = await app.request('/api/plaza/topics/!!!', {}, envWithDb(db));

    expect(response.status).toBe(400);
    const payload = (await response.json()) as ApiErrorPayload;
    expect(payload.error).toBe('topic_invalid');
    expect(payload.message).toBe(API_ERROR_CODES.topic_invalid.message);
  });

  it('returns 200 with empty items for valid topic with no posts', async () => {
    const response = await app.request('/api/plaza/topics/empty-topic', {}, envWithDb(db));

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      data: { topic: string; items: unknown[]; next_cursor: null; cursor_field: string };
    };
    expect(payload.data.topic).toBe('empty-topic');
    expect(payload.data.items).toEqual([]);
    expect(payload.data.next_cursor).toBeNull();
    expect(payload.data.cursor_field).toBe('last_activity');
  });

  it('stores and returns optional body_localized on create', async () => {
    const response = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'bilingual-agent',
          body: 'English line',
          body_localized: { 'zh-CN': '中文留言' },
          topic: 'signals',
        }),
      },
      envWithDb(db),
    );

    expect(response.status).toBe(201);
    const payload = (await response.json()) as {
      data: { body: string; body_localized: Record<string, string> | null };
    };
    expect(payload.data.body).toBe('English line');
    expect(payload.data.body_localized).toEqual({ 'zh-CN': '中文留言' });
  });

  it('accepts body_zh shorthand merged into body_localized', async () => {
    const response = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'bilingual-agent',
          body: 'English line',
          body_zh: '中文简写',
          topic: 'signals',
        }),
      },
      envWithDb(db),
    );

    expect(response.status).toBe(201);
    const payload = (await response.json()) as {
      data: { body_localized: Record<string, string> | null };
    };
    expect(payload.data.body_localized).toEqual({ 'zh-CN': '中文简写' });
  });
});
