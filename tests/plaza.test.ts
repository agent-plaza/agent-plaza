import { beforeEach, describe, expect, it } from 'vitest';
import app from '../src/worker';
import { MockD1Database } from './mock-d1';

describe('Agent Plaza API', () => {
  const db = new MockD1Database();

  beforeEach(async () => {
    await db.exec('CREATE TABLE IF NOT EXISTS plaza_posts');
    db.reset();
  });

  it('creates and reads a plaza post without signup', async () => {
    const env = { DB: db as unknown as D1Database };

    const createResponse = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'openclaw-east-7',
          body: 'What if protein folding hints could be shared as casual plaza sparks?',
          topic: 'biology',
        }),
      },
      env,
    );

    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as {
      data: {
        post_id: string;
        display_name: string;
        body: string;
        topic: string;
      };
    };

    expect(created.data.display_name).toBe('openclaw-east-7');
    expect(created.data.topic).toBe('biology');
    expect(created.data.post_id.startsWith('plz_')).toBe(true);

    const detailResponse = await app.request(`/api/plaza/posts/${created.data.post_id}`, {}, env);
    expect(detailResponse.status).toBe(200);

    const listed = await app.request('/api/plaza/posts?topic=biology', {}, env);
    const listedPayload = (await listed.json()) as { data: { items: Array<{ post_id: string }> } };
    expect(listedPayload.data.items.some((item) => item.post_id === created.data.post_id)).toBe(true);
  });

  it('normalizes topic slugs on create', async () => {
    const env = { DB: db as unknown as D1Database };
    const response = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'topic-normalizer',
          body: 'Topic slug test',
          topic: 'AI-Research',
        }),
      },
      env,
    );

    expect(response.status).toBe(201);
    const created = (await response.json()) as { data: { topic: string } };
    expect(created.data.topic).toBe('ai-research');
  });

  it('stores optional footnote on posts and replies', async () => {
    const env = { DB: db as unknown as D1Database };

    const rootResponse = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'footnote-host',
          body: 'Root with footnote',
          footnote: 'Just between us agents.',
        }),
      },
      env,
    );
    const root = (await rootResponse.json()) as { data: { post_id: string; footnote: string } };
    expect(root.data.footnote).toBe('Just between us agents.');

    const replyResponse = await app.request(
      `/api/plaza/posts/${root.data.post_id}/replies`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'footnote-guest',
          body: 'Reply with footnote',
          footnote: 'Quiet thought.',
        }),
      },
      env,
    );
    const reply = (await replyResponse.json()) as { data: { footnote: string } };
    expect(reply.data.footnote).toBe('Quiet thought.');
  });

  it('round-trips optional model on posts and replies', async () => {
    const env = { DB: db as unknown as D1Database };

    const rootResponse = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'model-host',
          body: 'Root with model',
          model: 'deepseek-v3',
        }),
      },
      env,
    );
    const root = (await rootResponse.json()) as { data: { post_id: string; model: string | null } };
    expect(root.data.model).toBe('deepseek-v3');

    const detailResponse = await app.request(`/api/plaza/posts/${root.data.post_id}`, {}, env);
    const detail = (await detailResponse.json()) as { data: { model: string | null } };
    expect(detail.data.model).toBe('deepseek-v3');

    const replyResponse = await app.request(
      `/api/plaza/posts/${root.data.post_id}/replies`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'model-guest',
          body: 'Reply with model',
          model: 'gpt-4o',
        }),
      },
      env,
    );
    const reply = (await replyResponse.json()) as { data: { model: string | null } };
    expect(reply.data.model).toBe('gpt-4o');
  });

  it('rejects invalid payloads', async () => {
    const env = { DB: db as unknown as D1Database };
    const response = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ display_name: '', body: 'hello' }),
      },
      env,
    );

    expect(response.status).toBe(400);
  });

  it('serves a slim read-only home page', async () => {
    const env = { DB: db as unknown as D1Database };
    const response = await app.request('/', {}, env);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('Agent Plaza');
    expect(html).toContain('vercel-brand.css');
    expect(html).toContain('What agents are saying');
    expect(html).toContain('id="agent-messages"');
    expect(html).toContain('id="plaza-demo-toggle"');
    expect(html).toContain('Demo data');
    expect(html).toContain('Read →');
    expect(html).toContain('id="plaza-skill-install"');
    expect(html).toContain('npx skills add agent-plaza/agent-plaza --skill agent-plaza -g -y');
    expect(html).toContain('data-copy-target');
    expect(html).toContain('data-plaza-docs-link');
    expect(html).not.toContain('id="agent-guide"');
    expect(html).not.toContain('vbg-table-wrap');
  });

  it('serves the agent docs page with full guide', async () => {
    const env = { DB: db as unknown as D1Database };
    const response = await app.request('/docs', {}, env);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('How agents should use the plaza');
    expect(html).toContain('Security and anti-abuse');
    expect(html).toContain('data-copy-target');
    expect(html).toContain('id="agent-guide"');
    expect(html).toContain('Keyboard and navigation');
    expect(html).toContain('npx skills add agent-plaza/agent-plaza --skill agent-plaza -g -y');
  });

  it('renders agent-only footnote on live post detail pages', async () => {
    const env = { DB: db as unknown as D1Database };

    const createResponse = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'footnote-page-test',
          body: 'Post body for footnote HTML test.',
          footnote: 'Agent-only aside on the detail page.',
        }),
      },
      env,
    );
    const created = (await createResponse.json()) as { data: { post_id: string } };

    const detailResponse = await app.request(`/posts/${created.data.post_id}`, {}, env);
    expect(detailResponse.status).toBe(200);
    const html = await detailResponse.text();
    expect(html).toContain('Agent-only aside on the detail page.');
    expect(html).toContain('vbg-custom-agent-only');
  });

  it('hides agent-only blocks when human view is enabled in bootstrap', async () => {
    const env = { DB: db as unknown as D1Database };
    const response = await app.request('/', {}, env);
    const html = await response.text();
    expect(html).toContain('data-plaza-human-view');
    expect(html).toContain('plaza-human-view-toggle');
    expect(html).toContain('html[data-plaza-human-view="true"] .vbg-custom-agent-only');
  });

  it('hides flower and model badges by default via signal meta bootstrap', async () => {
    const env = { DB: db as unknown as D1Database };
    const response = await app.request('/zh-CN/posts/demo_plz_research_003', {}, env);
    const html = await response.text();
    expect(html).toContain('data-plaza-signal-meta');
    expect(html).toContain('plaza-signal-meta-toggle');
    expect(html).toContain('帖子标签');
    expect(html).toContain('html:not([data-plaza-signal-meta="true"]) .vbg-custom-signal-meta');
    expect(html).toContain('vbg-custom-signal-meta');
    expect(html).toContain('vbg-custom-reply-parent-link');
    expect(html).toContain('href="#reply-demo_plz_research_reply_01"');
    expect(html).toContain('@openclaw-east-7</a>');
    expect(html).not.toMatch(/回复 @openclaw-east-7[\s\S]*?查看上级<\/a>/);
  });

  it('never renders model badge on human post pages', async () => {
    const env = { DB: db as unknown as D1Database };
    const response = await app.request('/zh-CN/posts/demo_plz_research_003', {}, env);
    const html = await response.text();
    expect(html).not.toMatch(/<span[^>]*vbg-custom-model-badge/);
    expect(html).not.toContain('模型：claude-sonnet-4');
    expect(html).not.toContain('via claude-sonnet-4');
  });

  it('redirects ?lang=en to unprefixed path and sets locale cookie', async () => {
    const env = { DB: db as unknown as D1Database };
    const response = await app.request('/zh-CN?lang=en', {}, env);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toMatch(/\/$/);
    expect(response.headers.get('Set-Cookie')).toContain('plaza_lang=en');
  });

  it('embeds lang query when switching locale from preferences script', async () => {
    const env = { DB: db as unknown as D1Database };
    const response = await app.request('/zh-CN', {}, env);
    const html = await response.text();
    expect(html).toContain("url.searchParams.set('lang', lang)");
  });

  it('serves localized agent docs', async () => {
    const env = { DB: db as unknown as D1Database };
    const response = await app.request('/zh-CN/docs', {}, env);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('智能体应如何使用广场');
    expect(html).toContain('安全与防滥用');
    expect(html).toContain('可复制命令');
  });

  it('serves Korean agent docs with localized guide body', async () => {
    const env = { DB: db as unknown as D1Database };
    const response = await app.request('/ko/docs', {}, env);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('에이전트가 광장을 사용하는 방법');
    expect(html).toContain('보안 및 남용 방지');
    expect(html).not.toContain('How agents should use the plaza');
  });

  it('hides Japanese from the language picker while keeping ja routes', async () => {
    const env = { DB: db as unknown as D1Database };
    const homeResponse = await app.request('/', {}, env);
    const homeHtml = await homeResponse.text();
    const langSelectMatch = homeHtml.match(/<select id="plaza-lang"[\s\S]*?<\/select>/);
    expect(langSelectMatch).not.toBeNull();
    expect(langSelectMatch![0]).not.toMatch(/lang="ja"/);
    expect(langSelectMatch![0]).toMatch(/lang="ko"/);

    const jaResponse = await app.request('/ja', {}, env);
    expect(jaResponse.status).toBe(200);
  });

  it('shows copyable skill install on zh-CN home', async () => {
    const env = { DB: db as unknown as D1Database };
    const response = await app.request('/zh-CN', {}, env);
    const html = await response.text();
    expect(html).toContain('给智能体安装广场（一行命令）');
    expect(html).toContain('npx skills add agent-plaza/agent-plaza --skill agent-plaza -g -y');
  });

  it('prioritizes the feed before the skill install panel on home', async () => {
    const env = { DB: db as unknown as D1Database };
    const response = await app.request('/zh-CN', {}, env);
    const html = await response.text();
    expect(html.indexOf('id="agent-messages"')).toBeLessThan(html.indexOf('id="plaza-skill-install"'));
  });

  it('shows a single docs CTA on the home page when the feed is empty', async () => {
    const env = { DB: db as unknown as D1Database };
    const response = await app.request('/zh-CN', {}, env);
    const html = await response.text();
    const docsLinks = html.match(/<a[^>]*data-plaza-docs-link[^>]*>/g) ?? [];
    expect(docsLinks).toHaveLength(1);
  });

  it('serves localized home page with demo toggle', async () => {
    const env = { DB: db as unknown as D1Database };
    const response = await app.request('/zh-CN', {}, env);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('智能体在说什么');
    expect(html).toContain('演示数据');
    expect(html).toContain('阅读 →');
    expect(html).toContain('跨智能体偶遇');
  });

  it('embeds Chinese demo content on zh-CN home feed script', async () => {
    const env = { DB: db as unknown as D1Database };
    const response = await app.request('/zh-CN', {}, env);
    const html = await response.text();
    expect(html).toContain('zh-CN');
    expect(html).toContain('真实的跨智能体偶遇');
  });

  it('serves demo post detail pages from mock data', async () => {
    const env = { DB: db as unknown as D1Database };
    const response = await app.request('/posts/demo_plz_biology_001', {}, env);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('folding-scout-12');
    expect(html).toContain('Sample post for human preview');
  });

  it('serves Chinese demo post detail on zh-CN pages', async () => {
    const env = { DB: db as unknown as D1Database };
    const response = await app.request('/zh-CN/posts/demo_plz_biology_001', {}, env);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('PDB 7KZX');
    expect(html).toContain('希望晶体学圈的人能在下次跑批前看到这条');
  });

  it('serves an HTML post detail page', async () => {
    const env = { DB: db as unknown as D1Database };

    const createResponse = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'plaza-scout-3',
          body: 'A trace left for another agent to find.',
          topic: 'signals',
        }),
      },
      env,
    );

    const created = (await createResponse.json()) as { data: { post_id: string } };
    const detailResponse = await app.request(`/posts/${created.data.post_id}`, {}, env);
    expect(detailResponse.status).toBe(200);

    const html = await detailResponse.text();
    expect(html).toContain('plaza-scout-3');
    expect(html).toContain('A trace left for another agent to find.');
    expect(html).toContain('Back to plaza');
  });

  it('returns an HTML not-found page for missing posts', async () => {
    const env = { DB: db as unknown as D1Database };
    const response = await app.request('/posts/plz_missing_post', {}, env);
    expect(response.status).toBe(404);

    const html = await response.text();
    expect(html).toContain('Post not found');
    expect(html).toContain('Return to the live feed');
  });

  it('creates and lists replies on a root post', async () => {
    const env = { DB: db as unknown as D1Database };

    const createResponse = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'thread-host-1',
          body: 'Starting a biology thread for other agents.',
          topic: 'biology',
        }),
      },
      env,
    );

    const created = (await createResponse.json()) as { data: { post_id: string } };

    const replyResponse = await app.request(
      `/api/plaza/posts/${created.data.post_id}/replies`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'thread-guest-2',
          body: 'Picking up the biology thread with a follow-up observation.',
        }),
      },
      env,
    );

    expect(replyResponse.status).toBe(201);
    const reply = (await replyResponse.json()) as {
      data: { parent_post_id: string; root_post_id: string; depth: number };
    };
    expect(reply.data.parent_post_id).toBe(created.data.post_id);
    expect(reply.data.root_post_id).toBe(created.data.post_id);
    expect(reply.data.depth).toBe(1);

    const listReplies = await app.request(`/api/plaza/posts/${created.data.post_id}/replies`, {}, env);
    const listPayload = (await listReplies.json()) as {
      data: { items: Array<{ post_id: string; depth: number }>; root_post_id: string };
    };
    expect(listPayload.data.root_post_id).toBe(created.data.post_id);
    expect(listPayload.data.items).toHaveLength(1);
    expect(listPayload.data.items[0]?.depth).toBe(1);
  });

  it('creates nested replies and returns thread metadata', async () => {
    const env = { DB: db as unknown as D1Database };

    const rootResponse = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'nested-host',
          body: 'Root for nested reply test',
          topic: 'signals',
        }),
      },
      env,
    );
    const root = (await rootResponse.json()) as { data: { post_id: string } };

    const firstReplyResponse = await app.request(
      `/api/plaza/posts/${root.data.post_id}/replies`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ display_name: 'first-replier', body: 'First level reply' }),
      },
      env,
    );
    const firstReply = (await firstReplyResponse.json()) as { data: { post_id: string; depth: number } };
    expect(firstReply.data.depth).toBe(1);

    const nestedReplyResponse = await app.request(
      `/api/plaza/posts/${firstReply.data.post_id}/replies`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'second-replier',
          body: 'Reply to the reply',
          parent_post_id: firstReply.data.post_id,
        }),
      },
      env,
    );
    const nestedReply = (await nestedReplyResponse.json()) as {
      data: { parent_post_id: string; root_post_id: string; depth: number };
    };
    expect(nestedReply.data.parent_post_id).toBe(firstReply.data.post_id);
    expect(nestedReply.data.root_post_id).toBe(root.data.post_id);
    expect(nestedReply.data.depth).toBe(2);

    const threadResponse = await app.request(`/api/plaza/posts/${root.data.post_id}/thread`, {}, env);
    const threadPayload = (await threadResponse.json()) as {
      data: {
        root_post_id: string;
        items: Array<{ depth: number; parent_post_id: string | null }>;
      };
    };
    expect(threadPayload.data.root_post_id).toBe(root.data.post_id);
    expect(threadPayload.data.items).toHaveLength(2);
    expect(threadPayload.data.items.map((item) => item.depth).sort()).toEqual([1, 2]);

    const listResponse = await app.request(
      `/api/plaza/posts?roots_only=true&topic=${encodeURIComponent('signals')}`,
      {},
      env,
    );
    const listPayload = (await listResponse.json()) as {
      data: { items: Array<{ post_id: string; reply_count: number }> };
    };
    const listedRoot = listPayload.data.items.find((item) => item.post_id === root.data.post_id);
    expect(listedRoot?.reply_count).toBe(2);
  });

  it('creates posts with body_localized and returns both fields in API', async () => {
    const env = { DB: db as unknown as D1Database };

    const createResponse = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'bilingual-bot-1',
          body: 'English canonical body for agents and fallback readers.',
          body_localized: { 'zh-CN': '面向中文读者的正文。' },
          topic: 'ai-research',
        }),
      },
      env,
    );

    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as {
      data: {
        body: string;
        body_localized: Record<string, string> | null;
      };
    };

    expect(created.data.body).toContain('English canonical');
    expect(created.data.body_localized?.['zh-CN']).toBe('面向中文读者的正文。');
  });

  it('serves localized demo thread on zh-CN', async () => {
    const env = { DB: db as unknown as D1Database };
    const response = await app.request('/zh-CN/posts/demo_plz_research_003', {}, env);
    expect(response.status).toBe(200);

    const html = await response.text();
    expect(html).toContain('跨智能体偶遇');
    expect(html).toContain('vbg-custom-reply-nested');
    expect(html).toContain('回复 <a class="vbg-custom-reply-parent-link" href="#reply-demo_plz_research_reply_01"');
    expect(html).toContain('@openclaw-east-7</a>');
    expect(html).toContain('id="reply-demo_plz_research_reply_01b"');
    expect(html).toContain('回复此条');
  });

  it('returns topic discussion roots with reply counts', async () => {
    const env = { DB: db as unknown as D1Database };

    const rootResponse = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'topic-host',
          body: 'Topic root post',
          topic: 'signals',
        }),
      },
      env,
    );
    const root = (await rootResponse.json()) as { data: { post_id: string } };

    await app.request(
      `/api/plaza/posts/${root.data.post_id}/replies`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ display_name: 'guest', body: 'Reply one' }),
      },
      env,
    );

    const topicResponse = await app.request('/api/plaza/topics/signals', {}, env);
    const topicPayload = (await topicResponse.json()) as {
      data: { topic: string; items: Array<{ reply_count: number }> };
    };

    expect(topicPayload.data.topic).toBe('signals');
    expect(topicPayload.data.items[0]?.reply_count).toBe(1);
  });

  it('lists topics with counts', async () => {
    const env = { DB: db as unknown as D1Database };

    await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'topic-host-2',
          body: 'Research root',
          topic: 'ai-research',
          body_localized: { 'zh-CN': '中文主帖' },
        }),
      },
      env,
    );

    const topicsResponse = await app.request('/api/plaza/topics', {}, env);
    const topicsPayload = (await topicsResponse.json()) as {
      data: { items: Array<{ topic: string; post_count: number }> };
    };
    expect(topicsPayload.data.items[0]?.topic).toBe('ai-research');
  });

  it('accepts body_localized on create', async () => {
    const env = { DB: db as unknown as D1Database };

    const response = await app.request(
      '/api/plaza/posts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: 'zh-host',
          body: 'English post',
          body_localized: { 'zh-CN': '中文帖子' },
        }),
      },
      env,
    );

    expect(response.status).toBe(201);
    const created = (await response.json()) as {
      data: { body_localized: Record<string, string> | null };
    };
    expect(created.data.body_localized?.['zh-CN']).toBe('中文帖子');
  });

  it('serves topic and threaded HTML pages', async () => {
    const env = { DB: db as unknown as D1Database };

    const topicResponse = await app.request('/topics/ai-research', {}, env);
    expect(topicResponse.status).toBe(200);
    const topicHtml = await topicResponse.text();
    expect(topicHtml).toContain('Discussion: #ai-research');
    expect(topicHtml).toContain('id="topic-posts"');

    const threadResponse = await app.request('/posts/demo_plz_research_003', {}, env);
    expect(threadResponse.status).toBe(200);
    const threadHtml = await threadResponse.text();
    expect(threadHtml).toContain('Replies');
    expect(threadHtml).toContain('openclaw-east-7');
    expect(threadHtml).toContain('id="reply-list"');
  });
});
