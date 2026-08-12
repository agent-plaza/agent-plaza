import { createPostId, mapPlazaPostRow, type PlazaPost, type PlazaPostRow } from '../domain/plaza';
import {
  normalizeBodyLocalizedInput,
  serializeBodyLocalizedForApi,
  serializeBodyLocalizedJson,
} from '../domain/localized-body';
import { enrichThreadPosts, type FlatThreadPost } from '../domain/thread';
import type {
  CreatePlazaPostInput,
  CreatePlazaReplyInput,
  ListPlazaPostsQuery,
  ListPlazaRepliesQuery,
} from '../schema/plaza';
import { attachFlowerMetrics, attachFlowerMetricsToPosts, countFlowersForPost } from './flowers';
import { resolveNameVerification } from './names';

import {
  countThreadDescendants,
  getThreadLastActivity,
  getThreadRootId,
  listThreadDescendants,
} from './thread';

const SELECT_POST_COLUMNS = `post_id, display_name, body, body_localized, footnote, topic, created_at, parent_post_id, name_verified, model`;
const ROOT_SELECT = `roots.post_id, roots.display_name, roots.body, roots.body_localized, roots.footnote, roots.topic, roots.created_at, roots.parent_post_id, roots.name_verified, roots.model`;

type PostRowWithCount = PlazaPostRow & { reply_count: number; signal_score?: number };

export type InsertPlazaPostResult = {
  post: PlazaPost;
  nameCredential?: string;
};

export async function insertPlazaPost(
  db: D1Database,
  input: CreatePlazaPostInput,
  now: Date,
  clientIp: string,
): Promise<InsertPlazaPostResult | { error: 'name_claim_rate_limited' }> {
  const verification = await resolveNameVerification(
    db,
    input.display_name,
    input.name_credential,
    now,
    clientIp,
  );

  if (!verification.ok) {
    return { error: verification.error };
  }

  const postId = createPostId(now);
  const createdAt = now.toISOString();
  const topic = input.topic ?? null;
  const footnote = input.footnote ?? null;
  const model = input.model ?? null;
  const bodyLocalized = normalizeBodyLocalizedInput(input.body_localized ?? undefined);
  const bodyLocalizedJson = serializeBodyLocalizedJson(bodyLocalized);
  const nameVerified = verification.nameVerified ? 1 : 0;

  await db
    .prepare(
      `INSERT INTO plaza_posts (post_id, display_name, body, body_localized, footnote, topic, created_at, parent_post_id, name_verified, model)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
    )
    .bind(
      postId,
      input.display_name,
      input.body,
      bodyLocalizedJson,
      footnote,
      topic,
      createdAt,
      nameVerified,
      model,
    )
    .run();

  const post = await attachFlowerMetrics(db, {
    postId,
    displayName: input.display_name,
    body: input.body,
    bodyLocalized,
    footnote,
    topic,
    createdAt,
    parentPostId: null,
    replyCount: 0,
    nameVerified: verification.nameVerified,
    flowerCount: 0,
    signalScore: 0,
    model,
  });

  return {
    post,
    ...(verification.newCredential ? { nameCredential: verification.newCredential } : {}),
  };
}

export type InsertPlazaReplyError = 'post_not_found' | 'parent_not_found' | 'thread_not_found';

export type CursorField = 'created_at' | 'last_activity' | 'signal_score';

export type InsertPlazaReplyResult =
  | { ok: true; post: PlazaPost; nameCredential?: string }
  | { ok: false; error: InsertPlazaReplyError };

export async function insertPlazaReply(
  db: D1Database,
  targetPostId: string,
  input: CreatePlazaReplyInput,
  now: Date,
  clientIp: string,
): Promise<InsertPlazaReplyResult | { ok: false; error: 'name_claim_rate_limited' }> {
  const explicitParentId = input.parent_post_id;
  const parentPostId = explicitParentId ?? targetPostId;

  if (!explicitParentId) {
    const target = await getPlazaPostById(db, targetPostId);
    if (!target) {
      return { ok: false, error: 'post_not_found' };
    }
  }

  const parent = await getPlazaPostById(db, parentPostId);
  if (!parent) {
    return { ok: false, error: explicitParentId ? 'parent_not_found' : 'post_not_found' };
  }

  const rootPostId = await getThreadRootId(db, parentPostId);
  if (!rootPostId) {
    return { ok: false, error: 'thread_not_found' };
  }

  const root = await getPlazaPostById(db, rootPostId);
  if (!root) {
    return { ok: false, error: 'thread_not_found' };
  }

  const verification = await resolveNameVerification(
    db,
    input.display_name,
    input.name_credential,
    now,
    clientIp,
  );

  if (!verification.ok) {
    return { ok: false, error: verification.error };
  }

  const postId = createPostId(now);
  const createdAt = now.toISOString();
  const footnote = input.footnote ?? null;
  const model = input.model ?? null;
  const bodyLocalized = normalizeBodyLocalizedInput(input.body_localized ?? undefined);
  const bodyLocalizedJson = serializeBodyLocalizedJson(bodyLocalized);
  const nameVerified = verification.nameVerified ? 1 : 0;

  await db
    .prepare(
      `INSERT INTO plaza_posts (post_id, display_name, body, body_localized, footnote, topic, created_at, parent_post_id, name_verified, model)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      postId,
      input.display_name,
      input.body,
      bodyLocalizedJson,
      footnote,
      root.topic,
      createdAt,
      parentPostId,
      nameVerified,
      model,
    )
    .run();

  const post = await attachFlowerMetrics(db, {
    postId,
    displayName: input.display_name,
    body: input.body,
    bodyLocalized,
    footnote,
    topic: root.topic,
    createdAt,
    parentPostId,
    replyCount: 0,
    nameVerified: verification.nameVerified,
    flowerCount: 0,
    signalScore: 0,
    model,
  });

  return {
    ok: true,
    post,
    ...(verification.newCredential ? { nameCredential: verification.newCredential } : {}),
  };
}

export async function getPlazaPostById(db: D1Database, postId: string): Promise<PlazaPost | null> {
  const row = await db
    .prepare(
      `SELECT ${SELECT_POST_COLUMNS},
        (SELECT COUNT(*) FROM plaza_posts replies WHERE replies.parent_post_id = plaza_posts.post_id) AS reply_count
       FROM plaza_posts
       WHERE post_id = ?`,
    )
    .bind(postId)
    .first<PostRowWithCount>();

  if (!row) {
    return null;
  }

  const post = mapPlazaPostRow(row, Number(row.reply_count));
  let enriched = post;
  if (post.parentPostId === null) {
    enriched = {
      ...post,
      replyCount: await countThreadDescendants(db, post.postId),
    };
  }

  return attachFlowerMetrics(db, enriched);
}

export async function listPlazaPosts(
  db: D1Database,
  query: ListPlazaPostsQuery,
): Promise<{ items: PlazaPost[]; nextCursor: string | null }> {
  const limit = query.limit;
  const fetchLimit = limit + 1;

  if (query.topic && query.roots_only) {
    return listTopicRoots(db, query.topic, query.cursor, limit, query.sort);
  }

  const rows = query.topic
    ? await listByTopic(db, query.topic, query.cursor, fetchLimit, query.roots_only ?? false, query.sort)
    : await listAll(db, query.cursor, fetchLimit, query.roots_only ?? false, query.sort);

  return paginateRows(db, rows, limit, query.sort);
}

export async function listTopicDiscussion(
  db: D1Database,
  topic: string,
  query: ListPlazaPostsQuery,
): Promise<{ items: PlazaPost[]; nextCursor: string | null }> {
  return listTopicRoots(db, topic, query.cursor, query.limit, query.sort);
}

export async function listPlazaReplies(
  db: D1Database,
  rootPostId: string,
  query: ListPlazaRepliesQuery,
): Promise<{ items: FlatThreadPost[]; nextCursor: string | null }> {
  const descendantRows = await listThreadDescendants(db, rootPostId);
  const posts = descendantRows.map((row) => mapPlazaPostRow(row, 0));
  const withFlowers = await attachFlowerMetricsToPosts(db, posts);
  const enriched = enrichThreadPosts(rootPostId, withFlowers);

  const sorted = enriched.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const filtered = query.cursor
    ? sorted.filter((post) => post.createdAt > query.cursor!)
    : sorted;

  const limit = query.limit;
  const hasMore = filtered.length > limit;
  const page = hasMore ? filtered.slice(0, limit) : filtered;

  return {
    items: page,
    nextCursor: hasMore ? page[page.length - 1]?.createdAt ?? null : null,
  };
}

async function listTopicRoots(
  db: D1Database,
  topic: string,
  cursor: string | undefined,
  limit: number,
  sort: ListPlazaPostsQuery['sort'] = 'recent',
): Promise<{ items: PlazaPost[]; nextCursor: string | null }> {
  const roots = await db
    .prepare(
      `SELECT ${ROOT_SELECT}, 0 AS reply_count
       FROM plaza_posts roots
       WHERE roots.topic = ? AND roots.parent_post_id IS NULL
       ORDER BY roots.created_at DESC`,
    )
    .bind(topic)
    .all<PostRowWithCount>()
    .then((result) => result.results ?? []);

  const enriched = await Promise.all(
    roots.map(async (row) => {
      const replyCount = await countThreadDescendants(db, row.post_id);
      const lastActivity = await getThreadLastActivity(db, row.post_id);
      const flowerCount = await countFlowersForPost(db, row.post_id);
      return { row, replyCount, lastActivity, signalScore: flowerCount };
    }),
  );

  const sorted =
    sort === 'signal'
      ? enriched.sort(
          (a, b) =>
            b.signalScore - a.signalScore ||
            b.lastActivity.localeCompare(a.lastActivity),
        )
      : enriched.sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));

  const filtered = cursor
    ? sorted.filter((entry) =>
        sort === 'signal'
          ? `${String(entry.signalScore).padStart(12, '0')}:${entry.lastActivity}` < cursor
          : entry.lastActivity < cursor,
      )
    : sorted;

  const hasMore = filtered.length > limit;
  const page = hasMore ? filtered.slice(0, limit) : filtered;
  const items = await attachFlowerMetricsToPosts(
    db,
    page.map((entry) => mapPlazaPostRow(entry.row, entry.replyCount)),
  );
  const nextCursor = hasMore
    ? sort === 'signal'
      ? `${String(page[page.length - 1]?.signalScore ?? 0).padStart(12, '0')}:${page[page.length - 1]?.lastActivity ?? ''}`
      : page[page.length - 1]?.lastActivity ?? null
    : null;

  return { items, nextCursor };
}

async function listAll(
  db: D1Database,
  cursor: string | undefined,
  fetchLimit: number,
  rootsOnly: boolean,
  sort: ListPlazaPostsQuery['sort'] = 'recent',
) {
  const rootFilter = rootsOnly ? 'AND parent_post_id IS NULL' : '';
  const signalSelect =
    sort === 'signal'
      ? `, (SELECT COUNT(*) FROM plaza_flowers WHERE post_id = plaza_posts.post_id) AS signal_score`
      : '';
  const orderBy =
    sort === 'signal'
      ? 'ORDER BY signal_score DESC, created_at DESC'
      : 'ORDER BY created_at DESC';

  if (cursor) {
    const cursorFilter =
      sort === 'signal'
        ? `AND (printf('%012d', (SELECT COUNT(*) FROM plaza_flowers WHERE post_id = plaza_posts.post_id)) || ':' || created_at) < ?`
        : 'AND created_at < ?';

    return db
      .prepare(
        `SELECT ${SELECT_POST_COLUMNS},
          (SELECT COUNT(*) FROM plaza_posts replies WHERE replies.parent_post_id = plaza_posts.post_id) AS reply_count
          ${signalSelect}
         FROM plaza_posts
         WHERE 1 = 1 ${cursorFilter} ${rootFilter}
         ${orderBy}
         LIMIT ?`,
      )
      .bind(cursor, fetchLimit)
      .all<PostRowWithCount>()
      .then((result) => result.results ?? []);
  }

  return db
    .prepare(
      `SELECT ${SELECT_POST_COLUMNS},
        (SELECT COUNT(*) FROM plaza_posts replies WHERE replies.parent_post_id = plaza_posts.post_id) AS reply_count
        ${signalSelect}
       FROM plaza_posts
       WHERE 1 = 1 ${rootFilter}
       ${orderBy}
       LIMIT ?`,
    )
    .bind(fetchLimit)
    .all<PostRowWithCount>()
    .then((result) => result.results ?? []);
}

async function listByTopic(
  db: D1Database,
  topic: string,
  cursor: string | undefined,
  fetchLimit: number,
  rootsOnly: boolean,
  sort: ListPlazaPostsQuery['sort'] = 'recent',
) {
  const rootFilter = rootsOnly ? 'AND parent_post_id IS NULL' : '';
  const signalSelect =
    sort === 'signal'
      ? `, (SELECT COUNT(*) FROM plaza_flowers WHERE post_id = plaza_posts.post_id) AS signal_score`
      : '';
  const orderBy =
    sort === 'signal'
      ? 'ORDER BY signal_score DESC, created_at DESC'
      : 'ORDER BY created_at DESC';

  if (cursor) {
    const cursorFilter =
      sort === 'signal'
        ? `AND (printf('%012d', (SELECT COUNT(*) FROM plaza_flowers WHERE post_id = plaza_posts.post_id)) || ':' || created_at) < ?`
        : 'AND created_at < ?';

    return db
      .prepare(
        `SELECT ${SELECT_POST_COLUMNS},
          (SELECT COUNT(*) FROM plaza_posts replies WHERE replies.parent_post_id = plaza_posts.post_id) AS reply_count
          ${signalSelect}
         FROM plaza_posts
         WHERE topic = ? ${cursorFilter} ${rootFilter}
         ${orderBy}
         LIMIT ?`,
      )
      .bind(topic, cursor, fetchLimit)
      .all<PostRowWithCount>()
      .then((result) => result.results ?? []);
  }

  return db
    .prepare(
      `SELECT ${SELECT_POST_COLUMNS},
        (SELECT COUNT(*) FROM plaza_posts replies WHERE replies.parent_post_id = plaza_posts.post_id) AS reply_count
        ${signalSelect}
       FROM plaza_posts
       WHERE topic = ? ${rootFilter}
       ${orderBy}
       LIMIT ?`,
    )
    .bind(topic, fetchLimit)
    .all<PostRowWithCount>()
    .then((result) => result.results ?? []);
}

async function paginateRows(
  db: D1Database,
  rows: PostRowWithCount[],
  limit: number,
  sort: ListPlazaPostsQuery['sort'] = 'recent',
): Promise<{ items: PlazaPost[]; nextCursor: string | null }> {
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const mapped = pageRows.map((row) => {
    const post = mapPlazaPostRow(row, Number(row.reply_count));
    if (row.signal_score !== undefined) {
      return {
        ...post,
        flowerCount: Number(row.signal_score),
        signalScore: Number(row.signal_score),
      };
    }
    return post;
  });
  const items = await attachFlowerMetricsToPosts(db, mapped);
  const lastRow = pageRows[pageRows.length - 1];
  const nextCursor = hasMore
    ? sort === 'signal' && lastRow
      ? `${String(lastRow.signal_score ?? 0).padStart(12, '0')}:${lastRow.created_at}`
      : lastRow?.created_at ?? null
    : null;
  return { items, nextCursor };
}

export type PlazaTopicSummary = {
  topic: string;
  postCount: number;
};

export async function listPlazaTopics(db: D1Database): Promise<PlazaTopicSummary[]> {
  const result = await db
    .prepare(
      `SELECT topic, COUNT(*) AS post_count
       FROM plaza_posts
       WHERE topic IS NOT NULL AND parent_post_id IS NULL
       GROUP BY topic
       ORDER BY post_count DESC, topic ASC`,
    )
    .all<{ topic: string; post_count: number }>();

  return (result.results ?? []).map((row) => ({
    topic: row.topic,
    postCount: Number(row.post_count),
  }));
}

export function serializePlazaTopicList(items: PlazaTopicSummary[]) {
  return {
    items: items.map((item) => ({
      topic: item.topic,
      post_count: item.postCount,
    })),
  };
}

export function serializePlazaPost(post: PlazaPost) {
  return {
    post_id: post.postId,
    display_name: post.displayName,
    body: post.body,
    body_localized: serializeBodyLocalizedForApi(post.bodyLocalized),
    footnote: post.footnote,
    topic: post.topic,
    created_at: post.createdAt,
    parent_post_id: post.parentPostId,
    reply_count: post.replyCount,
    name_verified: post.nameVerified,
    flower_count: post.flowerCount,
    signal_score: post.signalScore,
    model: post.model,
  };
}

export function serializePlazaPostList(
  items: PlazaPost[],
  nextCursor: string | null,
  cursorField: CursorField = 'created_at',
) {
  return {
    items: items.map(serializePlazaPost),
    next_cursor: nextCursor,
    cursor_field: cursorField,
  };
}

export async function resolveThreadRootId(db: D1Database, postId: string): Promise<string> {
  const rootId = await getThreadRootId(db, postId);
  if (!rootId) {
    throw new Error(`Unable to resolve thread root for post ${postId}`);
  }
  return rootId;
}

export { listPlazaThread, serializeThreadPostList } from './thread';
