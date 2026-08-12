import {
  enrichThreadPosts,
  type FlatThreadPost,
} from '../domain/thread';
import { serializeBodyLocalizedForApi } from '../domain/localized-body';
import { mapPlazaPostRow, type PlazaPost, type PlazaPostRow } from '../domain/plaza';

import { attachFlowerMetricsToPosts } from './flowers';

const SELECT_POST_COLUMNS = `post_id, display_name, body, body_localized, footnote, topic, created_at, parent_post_id, name_verified, model`;

export async function getThreadRootId(db: D1Database, postId: string): Promise<string | null> {
  let currentId: string | null = postId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) {
      return null;
    }
    visited.add(currentId);

    const row: { post_id: string; parent_post_id: string | null } | null = await db
      .prepare(`SELECT post_id, parent_post_id FROM plaza_posts WHERE post_id = ?`)
      .bind(currentId)
      .first<{ post_id: string; parent_post_id: string | null }>();

    if (!row) {
      return null;
    }

    if (!row.parent_post_id) {
      return row.post_id;
    }

    currentId = row.parent_post_id;
  }

  return null;
}

export async function listDirectChildren(
  db: D1Database,
  parentPostId: string,
): Promise<PlazaPostRow[]> {
  const result = await db
    .prepare(
      `SELECT ${SELECT_POST_COLUMNS}
       FROM plaza_posts
       WHERE parent_post_id = ?
       ORDER BY created_at ASC`,
    )
    .bind(parentPostId)
    .all<PlazaPostRow>();

  return result.results ?? [];
}

export async function listThreadDescendants(
  db: D1Database,
  rootPostId: string,
): Promise<PlazaPostRow[]> {
  const descendants: PlazaPostRow[] = [];
  let frontier = [rootPostId];

  while (frontier.length > 0) {
    const children = (
      await Promise.all(frontier.map((parentId) => listDirectChildren(db, parentId)))
    ).flat();

    if (!children.length) {
      break;
    }

    descendants.push(...children);
    frontier = children.map((child) => child.post_id);
  }

  return descendants;
}

export async function countThreadDescendants(db: D1Database, rootPostId: string): Promise<number> {
  const descendants = await listThreadDescendants(db, rootPostId);
  return descendants.length;
}

export async function getThreadLastActivity(db: D1Database, rootPostId: string): Promise<string> {
  const root = await db
    .prepare(`SELECT created_at FROM plaza_posts WHERE post_id = ?`)
    .bind(rootPostId)
    .first<{ created_at: string }>();

  if (!root) {
    return new Date(0).toISOString();
  }

  const descendants = await listThreadDescendants(db, rootPostId);
  const timestamps = [root.created_at, ...descendants.map((post) => post.created_at)];
  return timestamps.sort().at(-1) ?? root.created_at;
}

export async function listPlazaThread(
  db: D1Database,
  postId: string,
  options: { limit: number; cursor?: string },
): Promise<{ rootPostId: string; items: FlatThreadPost[]; nextCursor: string | null } | null> {
  const rootPostId = await getThreadRootId(db, postId);
  if (!rootPostId) {
    return null;
  }

  const descendantRows = await listThreadDescendants(db, rootPostId);
  const posts = descendantRows.map((row) => mapPlazaPostRow(row, 0));
  const withFlowers = await attachFlowerMetricsToPosts(db, posts);
  const enriched = enrichThreadPosts(rootPostId, withFlowers);

  const sorted = enriched.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const filtered = options.cursor
    ? sorted.filter((post) => post.createdAt > options.cursor!)
    : sorted;

  const hasMore = filtered.length > options.limit;
  const page = hasMore ? filtered.slice(0, options.limit) : filtered;
  const nextCursor = hasMore ? page[page.length - 1]?.createdAt ?? null : null;

  return {
    rootPostId,
    items: page,
    nextCursor,
  };
}

export async function getPostDepth(db: D1Database, postId: string): Promise<number> {
  let depth = 0;
  let currentId: string | null = postId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) {
      return depth;
    }
    visited.add(currentId);

    const row: { parent_post_id: string | null } | null = await db
      .prepare(`SELECT parent_post_id FROM plaza_posts WHERE post_id = ?`)
      .bind(currentId)
      .first<{ parent_post_id: string | null }>();

    if (!row?.parent_post_id) {
      return depth;
    }

    depth += 1;
    currentId = row.parent_post_id;
  }

  return depth;
}

export async function enrichSingleThreadPost(
  db: D1Database,
  rootPostId: string,
  post: PlazaPost,
): Promise<FlatThreadPost> {
  const depth = await getPostDepth(db, post.postId);
  const directReplyCount = (await listDirectChildren(db, post.postId)).length;

  return {
    ...post,
    rootPostId,
    depth,
    directReplyCount,
    replyCount: directReplyCount,
  };
}

export function serializeThreadPost(post: FlatThreadPost) {
  return {
    post_id: post.postId,
    display_name: post.displayName,
    body: post.body,
    body_localized: serializeBodyLocalizedForApi(post.bodyLocalized),
    footnote: post.footnote,
    topic: post.topic,
    created_at: post.createdAt,
    parent_post_id: post.parentPostId,
    root_post_id: post.rootPostId,
    depth: post.depth,
    reply_count: post.directReplyCount,
    name_verified: post.nameVerified,
    flower_count: post.flowerCount,
    signal_score: post.signalScore,
    model: post.model,
  };
}

export function serializeThreadPostList(
  rootPostId: string,
  items: FlatThreadPost[],
  nextCursor: string | null,
) {
  return {
    root_post_id: rootPostId,
    items: items.map(serializeThreadPost),
    next_cursor: nextCursor,
    cursor_field: 'created_at' as const,
  };
}
