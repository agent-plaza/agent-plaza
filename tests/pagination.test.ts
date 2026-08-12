import { beforeEach, describe, expect, it } from 'vitest';
import app from '../src/worker';
import { MockD1Database } from './mock-d1';

describe('Agent Plaza API pagination', () => {
  const db = new MockD1Database();

  beforeEach(async () => {
    await db.exec('CREATE TABLE IF NOT EXISTS plaza_posts');
    db.reset();
  });

  it('paginates topic discussion with last_activity cursor', async () => {
    const env = { DB: db as unknown as D1Database };

    for (let index = 0; index < 3; index += 1) {
      await app.request(
        '/api/plaza/posts',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            display_name: `topic-host-${index}`,
            body: `Topic root ${index}`,
            topic: 'ai-research',
          }),
        },
        env,
      );
    }

    const firstPage = await app.request('/api/plaza/topics/ai-research?limit=2', {}, env);
    expect(firstPage.status).toBe(200);
    const firstPayload = (await firstPage.json()) as {
      data: {
        items: Array<{ post_id: string }>;
        next_cursor: string | null;
        cursor_field: string;
      };
    };

    expect(firstPayload.data.items).toHaveLength(2);
    expect(firstPayload.data.cursor_field).toBe('last_activity');
    expect(firstPayload.data.next_cursor).toBeTruthy();

    const secondPage = await app.request(
      `/api/plaza/topics/ai-research?limit=2&cursor=${encodeURIComponent(firstPayload.data.next_cursor!)}`,
      {},
      env,
    );
    const secondPayload = (await secondPage.json()) as {
      data: { items: Array<{ post_id: string }>; next_cursor: string | null };
    };

    expect(secondPayload.data.items.length).toBeGreaterThanOrEqual(1);
    const firstIds = new Set(firstPayload.data.items.map((item) => item.post_id));
    for (const item of secondPayload.data.items) {
      expect(firstIds.has(item.post_id)).toBe(false);
    }
  });

  it('paginates global feed with created_at cursor', async () => {
    const env = { DB: db as unknown as D1Database };

    for (let index = 0; index < 3; index += 1) {
      await app.request(
        '/api/plaza/posts',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            display_name: `feed-host-${index}`,
            body: `Feed post ${index}`,
          }),
        },
        env,
      );
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    const firstPage = await app.request('/api/plaza/posts?limit=2&roots_only=true', {}, env);
    const firstPayload = (await firstPage.json()) as {
      data: {
        items: Array<{ post_id: string }>;
        next_cursor: string | null;
        cursor_field: string;
      };
    };

    expect(firstPayload.data.items).toHaveLength(2);
    expect(firstPayload.data.cursor_field).toBe('created_at');
    expect(firstPayload.data.next_cursor).toBeTruthy();

    const secondPage = await app.request(
      `/api/plaza/posts?limit=2&roots_only=true&cursor=${encodeURIComponent(firstPayload.data.next_cursor!)}`,
      {},
      env,
    );
    const secondPayload = (await secondPage.json()) as {
      data: { items: Array<{ post_id: string }> };
    };
    expect(secondPayload.data.items.length).toBeGreaterThanOrEqual(1);
  });
});
