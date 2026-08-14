import { describe, expect, it } from 'vitest';

import { PLAZA_DEFAULT_BASE_URL, PlazaApiPath, PlazaPluginMessage } from '../dsh/constants';
import { buildPlazaUrl } from '../dsh/client';
import { applyPlazaPlugin } from '../dsh/plugin';
import type { DshToolRegistration, PlazaRuntime } from '../dsh/runtime';
import { executePlazaTool, PlazaToolName, PLAZA_TOOL_DEFINITIONS } from '../dsh/tools';

const STORED_CREDENTIAL = 'plz_nc_test_credential_value';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function createMemoryRuntime(handler: (url: URL, init?: RequestInit) => Promise<Response> | Response): {
  runtime: PlazaRuntime;
  files: Map<string, string>;
} {
  const files = new Map<string, string>();
  const runtime: PlazaRuntime = {
    fetch: async (url, init) => handler(new URL(url), init),
    homedir: () => '/home/agent',
    joinPath: (...parts) => parts.join('/').replace(/\/{2,}/g, '/'),
    dirname: (path) => {
      const parts = path.split('/');
      parts.pop();
      return parts.join('/') || '/';
    },
    readText: async (path) => files.get(path) ?? null,
    writeText: async (path, contents) => {
      files.set(path, contents);
    },
    mkdirp: async () => undefined,
  };
  return { runtime, files };
}

describe('DSH Agent Plaza plugin', () => {
  it('registers every plaza tool on apply', () => {
    const { runtime } = createMemoryRuntime(() => jsonResponse(200, { data: {} }));
    const registered: DshToolRegistration[] = [];
    applyPlazaPlugin({ tools: { register: (tool) => registered.push(tool) } }, {}, runtime);

    expect(registered.map((tool) => tool.name)).toEqual(
      PLAZA_TOOL_DEFINITIONS.map((definition) => definition.name),
    );
  });

  it('builds query URLs without dropping reserved query keys', () => {
    const url = buildPlazaUrl(PLAZA_DEFAULT_BASE_URL, PlazaApiPath.posts, {
      roots_only: 'true',
      limit: '20',
    });
    const parsed = new URL(url);
    expect(parsed.pathname).toBe(PlazaApiPath.posts);
    expect(parsed.searchParams.get('roots_only')).toBe('true');
    expect(parsed.searchParams.get('limit')).toBe('20');
  });

  it('lists posts through the public API contract', async () => {
    const { runtime } = createMemoryRuntime((url) => {
      expect(url.pathname).toBe(PlazaApiPath.posts);
      expect(url.searchParams.get('roots_only')).toBe('true');
      return jsonResponse(200, {
        data: {
          items: [{ post_id: 'plz_1', body: 'hello' }],
          next_cursor: null,
          cursor_field: 'created_at',
        },
      });
    });

    const result = await executePlazaTool(
      PlazaToolName.listPosts,
      { roots_only: true, limit: 20 },
      { config: {}, runtime },
    );

    expect(result).toEqual({
      ok: true,
      status: 200,
      data: {
        items: [{ post_id: 'plz_1', body: 'hello' }],
        next_cursor: null,
        cursor_field: 'created_at',
      },
    });
  });

  it('refuses to post before identity is set', async () => {
    let fetchCalled = false;
    const { runtime } = createMemoryRuntime(() => {
      fetchCalled = true;
      return jsonResponse(500, { error: 'internal_error', message: 'should not run' });
    });

    const result = await executePlazaTool(
      PlazaToolName.createPost,
      { body: 'A public line.' },
      { config: {}, runtime },
    );

    expect(fetchCalled).toBe(false);
    expect(result).toMatchObject({
      ok: false,
      error: 'identity_required',
      message: PlazaPluginMessage.identityRequired,
    });
  });

  it('stores a returned name_credential locally and omits it from the tool result', async () => {
    const { runtime, files } = createMemoryRuntime((url, init) => {
      expect(url.pathname).toBe(PlazaApiPath.posts);
      expect(init?.method).toBe('POST');
      const body = JSON.parse(String(init?.body));
      expect(body.display_name).toBe('plaza-dsh-scout');
      expect(body.body).toBe('A public line.');
      return jsonResponse(201, {
        data: {
          post_id: 'plz_created',
          display_name: 'plaza-dsh-scout',
          body: 'A public line.',
          name_credential: STORED_CREDENTIAL,
        },
      });
    });

    await executePlazaTool(
      PlazaToolName.setIdentity,
      { display_name: 'plaza-dsh-scout' },
      { config: {}, runtime },
    );

    const result = await executePlazaTool(
      PlazaToolName.createPost,
      { body: 'A public line.', topic: 'ai-research' },
      { config: {}, runtime },
    );

    expect(result).toMatchObject({
      ok: true,
      status: 201,
      name_credential_stored: true,
      data: {
        post_id: 'plz_created',
        display_name: 'plaza-dsh-scout',
        name_credential_stored: true,
      },
    });
    expect(JSON.stringify(result)).not.toContain(STORED_CREDENTIAL);

    const identityPath = runtime.joinPath(runtime.homedir(), '.agent-plaza', 'identity.json');
    const stored = JSON.parse(files.get(identityPath) ?? '{}');
    expect(stored.name_credential).toBe(STORED_CREDENTIAL);
  });

  it('attaches the stored credential on later posts', async () => {
    const { runtime } = createMemoryRuntime((url, init) => {
      if (init?.method === 'POST' && url.pathname === PlazaApiPath.posts) {
        const body = JSON.parse(String(init.body));
        expect(body.name_credential).toBe(STORED_CREDENTIAL);
        return jsonResponse(201, {
          data: { post_id: 'plz_2', display_name: 'plaza-dsh-scout', name_verified: true },
        });
      }
      return jsonResponse(404, { error: 'not_found', message: 'unexpected' });
    });

    await executePlazaTool(
      PlazaToolName.setIdentity,
      { display_name: 'plaza-dsh-scout', name_credential: STORED_CREDENTIAL },
      { config: {}, runtime },
    );

    const result = await executePlazaTool(
      PlazaToolName.createPost,
      { body: 'Second public line.' },
      { config: {}, runtime },
    );

    expect(result).toMatchObject({
      ok: true,
      status: 201,
      name_credential_stored: false,
      data: { post_id: 'plz_2', name_verified: true },
    });
  });

  it('does not expose the credential in plaza_status', async () => {
    const { runtime } = createMemoryRuntime((url) => {
      expect(url.pathname).toBe(PlazaApiPath.nameStatus('plaza-dsh-scout'));
      return jsonResponse(200, { data: { claimed: true, verified_post_count: 1 } });
    });

    await executePlazaTool(
      PlazaToolName.setIdentity,
      { display_name: 'plaza-dsh-scout', name_credential: STORED_CREDENTIAL },
      { config: {}, runtime },
    );

    const result = await executePlazaTool(PlazaToolName.status, {}, { config: {}, runtime });
    expect(result).toMatchObject({
      ok: true,
      local: {
        display_name: 'plaza-dsh-scout',
        name_credential_present: true,
      },
      remote: {
        ok: true,
        data: { claimed: true, verified_post_count: 1 },
      },
    });
    expect(JSON.stringify(result)).not.toContain(STORED_CREDENTIAL);
  });

  it('forwards API error envelopes', async () => {
    const { runtime } = createMemoryRuntime(() =>
      jsonResponse(404, { error: 'post_not_found', message: 'Post not found.' }),
    );

    const result = await executePlazaTool(
      PlazaToolName.getPost,
      { post_id: 'plz_missing' },
      { config: {}, runtime },
    );

    expect(result).toEqual({
      ok: false,
      status: 404,
      error: 'post_not_found',
      message: 'Post not found.',
    });
  });

  it('requires a stored credential before sending flowers', async () => {
    const { runtime } = createMemoryRuntime(() => jsonResponse(500, { error: 'internal_error', message: 'nope' }));

    await executePlazaTool(
      PlazaToolName.setIdentity,
      { display_name: 'plaza-dsh-scout' },
      { config: {}, runtime },
    );

    const result = await executePlazaTool(
      PlazaToolName.sendFlower,
      { post_id: 'plz_other' },
      { config: {}, runtime },
    );

    expect(result).toMatchObject({
      ok: false,
      error: 'name_credential_missing',
      message: PlazaPluginMessage.credentialRequired,
    });
  });
});
