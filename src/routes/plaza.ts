import { Hono } from 'hono';

import { isDemoPostId } from '../demo';
import { insertFlower, revokeFlower, serializeFlowerMetrics } from '../db/flowers';
import {
  getNameStatus,
  rotateNameCredential,
  serializeNameStatus,
} from '../db/names';
import {
  getPlazaPostById,
  insertPlazaPost,
  insertPlazaReply,
  listPlazaPosts,
  listPlazaReplies,
  listPlazaThread,
  listPlazaTopics,
  listTopicDiscussion,
  resolveThreadRootId,
  serializePlazaPost,
  serializePlazaPostList,
  serializePlazaTopicList,
  serializeThreadPostList,
} from '../db/plaza';
import { serializeThreadPost, enrichSingleThreadPost } from '../db/thread';
import {
  createFlowerInputSchema,
  createPlazaPostInputSchema,
  createPlazaReplyInputSchema,
  displayNameParamSchema,
  listPlazaPostsQuerySchema,
  listPlazaRepliesQuerySchema,
  listPlazaThreadQuerySchema,
  revokeFlowerInputSchema,
  rotateNameCredentialInputSchema,
  topicSlugParamSchema,
} from '../schema/plaza';
import { getClientIp } from './client-ip';
import { jsonApiError, parseJsonBody } from './responses';

type Bindings = {
  DB: D1Database;
};

function serializeCreatePostResponse(result: {
  post: Parameters<typeof serializePlazaPost>[0];
  nameCredential?: string;
}) {
  return {
    ...serializePlazaPost(result.post),
    ...(result.nameCredential ? { name_credential: result.nameCredential } : {}),
  };
}

export function createPlazaApp() {
  const app = new Hono<{ Bindings: Bindings }>();

  app.post('/api/plaza/posts', async (c) => {
    const body = await parseJsonBody(c);
    if (body instanceof Response) {
      return body;
    }

    const parsed = createPlazaPostInputSchema.safeParse(body);
    if (!parsed.success) {
      return jsonApiError(c, 'invalid_request', parsed.error.flatten());
    }

    const result = await insertPlazaPost(c.env.DB, parsed.data, new Date(), getClientIp(c));
    if ('error' in result) {
      return jsonApiError(c, result.error);
    }

    return c.json({ data: serializeCreatePostResponse(result) }, 201);
  });

  app.get('/api/plaza/posts', async (c) => {
    const parsed = listPlazaPostsQuerySchema.safeParse({
      limit: c.req.query('limit'),
      cursor: c.req.query('cursor'),
      topic: c.req.query('topic'),
      roots_only: c.req.query('roots_only'),
      sort: c.req.query('sort'),
    });

    if (!parsed.success) {
      return jsonApiError(c, 'invalid_query', parsed.error.flatten());
    }

    const result = await listPlazaPosts(c.env.DB, parsed.data);
    const cursorField =
      parsed.data.sort === 'signal' ? 'signal_score' : ('created_at' as const);
    return c.json({
      data: serializePlazaPostList(result.items, result.nextCursor, cursorField),
    });
  });

  app.get('/api/plaza/topics', async (c) => {
    const topics = await listPlazaTopics(c.env.DB);
    return c.json({ data: serializePlazaTopicList(topics) });
  });

  app.get('/api/plaza/topics/:topic', async (c) => {
    const topicResult = topicSlugParamSchema.safeParse(c.req.param('topic'));

    if (!topicResult.success) {
      return jsonApiError(c, 'topic_invalid', topicResult.error.flatten());
    }

    const parsed = listPlazaPostsQuerySchema.safeParse({
      limit: c.req.query('limit'),
      cursor: c.req.query('cursor'),
      sort: c.req.query('sort'),
    });

    if (!parsed.success) {
      return jsonApiError(c, 'invalid_query', parsed.error.flatten());
    }

    const result = await listTopicDiscussion(c.env.DB, topicResult.data, parsed.data);
    const cursorField =
      parsed.data.sort === 'signal' ? 'signal_score' : ('last_activity' as const);
    return c.json({
      data: {
        topic: topicResult.data,
        ...serializePlazaPostList(result.items, result.nextCursor, cursorField),
      },
    });
  });

  app.get('/api/plaza/posts/:postId', async (c) => {
    const post = await getPlazaPostById(c.env.DB, c.req.param('postId'));

    if (!post) {
      return jsonApiError(c, 'post_not_found');
    }

    return c.json({ data: serializePlazaPost(post) });
  });

  app.post('/api/plaza/posts/:postId/replies', async (c) => {
    const body = await parseJsonBody(c);
    if (body instanceof Response) {
      return body;
    }

    const parsed = createPlazaReplyInputSchema.safeParse(body);
    if (!parsed.success) {
      return jsonApiError(c, 'invalid_request', parsed.error.flatten());
    }

    const replyResult = await insertPlazaReply(
      c.env.DB,
      c.req.param('postId'),
      parsed.data,
      new Date(),
      getClientIp(c),
    );

    if (!replyResult.ok) {
      return jsonApiError(c, replyResult.error);
    }

    const rootPostId = await resolveThreadRootId(c.env.DB, replyResult.post.postId);
    const enriched = await enrichSingleThreadPost(c.env.DB, rootPostId, replyResult.post);

    return c.json(
      {
        data: {
          ...serializeThreadPost(enriched),
          ...(replyResult.nameCredential ? { name_credential: replyResult.nameCredential } : {}),
        },
      },
      201,
    );
  });

  app.get('/api/plaza/posts/:postId/replies', async (c) => {
    const targetPost = await getPlazaPostById(c.env.DB, c.req.param('postId'));

    if (!targetPost) {
      return jsonApiError(c, 'post_not_found');
    }

    const rootPostId = await resolveThreadRootId(c.env.DB, targetPost.postId);
    const parsed = listPlazaRepliesQuerySchema.safeParse({
      limit: c.req.query('limit'),
      cursor: c.req.query('cursor'),
    });

    if (!parsed.success) {
      return jsonApiError(c, 'invalid_query', parsed.error.flatten());
    }

    const result = await listPlazaReplies(c.env.DB, rootPostId, parsed.data);
    return c.json({
      data: serializeThreadPostList(rootPostId, result.items, result.nextCursor),
    });
  });

  app.get('/api/plaza/posts/:postId/thread', async (c) => {
    const parsed = listPlazaThreadQuerySchema.safeParse({
      limit: c.req.query('limit'),
      cursor: c.req.query('cursor'),
    });

    if (!parsed.success) {
      return jsonApiError(c, 'invalid_query', parsed.error.flatten());
    }

    const result = await listPlazaThread(c.env.DB, c.req.param('postId'), parsed.data);

    if (!result) {
      return jsonApiError(c, 'post_not_found');
    }

    return c.json({
      data: serializeThreadPostList(result.rootPostId, result.items, result.nextCursor),
    });
  });

  app.post('/api/plaza/names/rotate', async (c) => {
    const body = await parseJsonBody(c);
    if (body instanceof Response) {
      return body;
    }

    const parsed = rotateNameCredentialInputSchema.safeParse(body);
    if (!parsed.success) {
      const missingCredential = !(
        typeof body === 'object' &&
        body !== null &&
        'name_credential' in body &&
        typeof (body as { name_credential?: unknown }).name_credential === 'string' &&
        (body as { name_credential: string }).name_credential.trim().length > 0
      );
      if (missingCredential) {
        return jsonApiError(c, 'name_credential_missing', parsed.error.flatten());
      }
      return jsonApiError(c, 'invalid_request', parsed.error.flatten());
    }

    const result = await rotateNameCredential(
      c.env.DB,
      parsed.data.display_name,
      parsed.data.name_credential,
      new Date(),
    );

    if (!result.ok) {
      if (result.error === 'name_not_claimed') {
        return jsonApiError(c, 'name_not_claimed');
      }
      return jsonApiError(c, 'name_credential_invalid');
    }

    return c.json({
      data: {
        display_name: parsed.data.display_name,
        name_credential: result.nameCredential,
      },
    });
  });

  app.get('/api/plaza/names/:displayName', async (c) => {
    const parsed = displayNameParamSchema.safeParse(c.req.param('displayName'));
    if (!parsed.success) {
      return jsonApiError(c, 'invalid_request', parsed.error.flatten());
    }

    const status = await getNameStatus(c.env.DB, parsed.data);
    return c.json({ data: serializeNameStatus(status) });
  });

  app.post('/api/plaza/posts/:postId/flowers', async (c) => {
    const postId = c.req.param('postId');
    if (isDemoPostId(postId)) {
      return jsonApiError(c, 'demo_post_readonly');
    }

    const body = await parseJsonBody(c);
    if (body instanceof Response) {
      return body;
    }

    const parsed = createFlowerInputSchema.safeParse(body);
    if (!parsed.success) {
      const missingCredential = !(
        typeof body === 'object' &&
        body !== null &&
        'name_credential' in body &&
        typeof (body as { name_credential?: unknown }).name_credential === 'string' &&
        (body as { name_credential: string }).name_credential.trim().length > 0
      );
      if (missingCredential) {
        return jsonApiError(c, 'name_credential_missing', parsed.error.flatten());
      }
      return jsonApiError(c, 'invalid_request', parsed.error.flatten());
    }

    const result = await insertFlower(
      c.env.DB,
      postId,
      parsed.data.display_name,
      parsed.data.name_credential,
      parsed.data.reason ?? null,
      new Date(),
    );

    if (!result.ok) {
      return jsonApiError(c, result.error);
    }

    return c.json(
      {
        data: {
          post_id: postId,
          reactor_name: parsed.data.display_name,
          ...serializeFlowerMetrics(result.flowerCount, result.signalScore),
        },
      },
      201,
    );
  });

  app.delete('/api/plaza/posts/:postId/flowers', async (c) => {
    const postId = c.req.param('postId');
    if (isDemoPostId(postId)) {
      return jsonApiError(c, 'demo_post_readonly');
    }

    const body = await parseJsonBody(c);
    if (body instanceof Response) {
      return body;
    }

    const parsed = revokeFlowerInputSchema.safeParse(body);
    if (!parsed.success) {
      const missingCredential = !(
        typeof body === 'object' &&
        body !== null &&
        'name_credential' in body &&
        typeof (body as { name_credential?: unknown }).name_credential === 'string' &&
        (body as { name_credential: string }).name_credential.trim().length > 0
      );
      if (missingCredential) {
        return jsonApiError(c, 'name_credential_missing', parsed.error.flatten());
      }
      return jsonApiError(c, 'invalid_request', parsed.error.flatten());
    }

    const result = await revokeFlower(
      c.env.DB,
      postId,
      parsed.data.display_name,
      parsed.data.name_credential,
    );

    if (!result.ok) {
      if (result.error === 'flower_not_found') {
        return jsonApiError(c, 'flower_not_found');
      }
      return jsonApiError(c, result.error);
    }

    return c.json({
      data: {
        post_id: postId,
        reactor_name: parsed.data.display_name,
        ...serializeFlowerMetrics(result.flowerCount, result.signalScore),
      },
    });
  });

  return app;
}
