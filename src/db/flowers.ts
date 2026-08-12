import { hourBucket } from '../domain/name-credential';
import { computeSignalScore } from '../domain/plaza-signals';
import type { PlazaPost } from '../domain/plaza';
import { countVerifiedPostsByName, verifyNameCredential } from './names';

export const MAX_FLOWERS_PER_NAME_HOUR = 10;
export const FLOWER_REASON_MAX = 280;

export type FlowerRow = {
  post_id: string;
  reactor_name: string;
  reason: string | null;
  created_at: string;
};

export async function countFlowersForPost(db: D1Database, postId: string): Promise<number> {
  const row = await db
    .prepare(`SELECT COUNT(*) AS count FROM plaza_flowers WHERE post_id = ?`)
    .bind(postId)
    .first<{ count: number }>();
  return Number(row?.count ?? 0);
}

export async function attachFlowerMetrics(db: D1Database, post: PlazaPost): Promise<PlazaPost> {
  const flowerCount = await countFlowersForPost(db, post.postId);
  return {
    ...post,
    flowerCount,
    signalScore: computeSignalScore(flowerCount),
  };
}

export async function attachFlowerMetricsToPosts(db: D1Database, posts: PlazaPost[]): Promise<PlazaPost[]> {
  if (posts.length === 0) {
    return posts;
  }

  const postIds = posts.map((post) => post.postId);
  const placeholders = postIds.map(() => '?').join(', ');
  const result = await db
    .prepare(
      `SELECT post_id, COUNT(*) AS flower_count
       FROM plaza_flowers
       WHERE post_id IN (${placeholders})
       GROUP BY post_id`,
    )
    .bind(...postIds)
    .all<{ post_id: string; flower_count: number }>();

  const counts = new Map<string, number>();
  for (const row of result.results ?? []) {
    counts.set(row.post_id, Number(row.flower_count));
  }

  return posts.map((post) => {
    const flowerCount = counts.get(post.postId) ?? 0;
    return {
      ...post,
      flowerCount,
      signalScore: computeSignalScore(flowerCount),
    };
  });
}

async function incrementFlowerRate(db: D1Database, reactorName: string, now: Date): Promise<number> {
  const bucket = hourBucket(now);
  await db
    .prepare(
      `INSERT INTO plaza_flower_rate (reactor_name, hour_bucket, flower_count)
       VALUES (?, ?, 1)
       ON CONFLICT(reactor_name, hour_bucket) DO UPDATE SET flower_count = flower_count + 1`,
    )
    .bind(reactorName, bucket)
    .run();

  const row = await db
    .prepare(`SELECT flower_count FROM plaza_flower_rate WHERE reactor_name = ? AND hour_bucket = ?`)
    .bind(reactorName, bucket)
    .first<{ flower_count: number }>();

  return Number(row?.flower_count ?? 1);
}

export type InsertFlowerError =
  | 'post_not_found'
  | 'flower_own_post'
  | 'flower_duplicate'
  | 'name_credential_missing'
  | 'name_credential_invalid'
  | 'name_credential_required'
  | 'flower_rate_limited';

export type InsertFlowerResult =
  | { ok: true; flowerCount: number; signalScore: number }
  | { ok: false; error: InsertFlowerError };

export async function insertFlower(
  db: D1Database,
  postId: string,
  reactorName: string,
  nameCredential: string | undefined,
  reason: string | null,
  now: Date,
): Promise<InsertFlowerResult> {
  const post = await db
    .prepare(`SELECT post_id, display_name FROM plaza_posts WHERE post_id = ?`)
    .bind(postId)
    .first<{ post_id: string; display_name: string }>();

  if (!post) {
    return { ok: false, error: 'post_not_found' };
  }

  if (post.display_name === reactorName) {
    return { ok: false, error: 'flower_own_post' };
  }

  const existingFlower = await db
    .prepare(`SELECT post_id FROM plaza_flowers WHERE post_id = ? AND reactor_name = ?`)
    .bind(postId, reactorName)
    .first<{ post_id: string }>();

  if (existingFlower) {
    return { ok: false, error: 'flower_duplicate' };
  }

  if (!nameCredential) {
    return { ok: false, error: 'name_credential_missing' };
  }

  const credentialValid = await verifyNameCredential(db, reactorName, nameCredential);
  if (!credentialValid) {
    return { ok: false, error: 'name_credential_invalid' };
  }

  const verifiedPostCount = await countVerifiedPostsByName(db, reactorName);
  if (verifiedPostCount < 1) {
    return { ok: false, error: 'name_credential_required' };
  }

  const flowerCountInWindow = await incrementFlowerRate(db, reactorName, now);
  if (flowerCountInWindow > MAX_FLOWERS_PER_NAME_HOUR) {
    return { ok: false, error: 'flower_rate_limited' };
  }

  await db
    .prepare(
      `INSERT INTO plaza_flowers (post_id, reactor_name, reason, created_at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(postId, reactorName, reason, now.toISOString())
    .run();

  const flowerCount = await countFlowersForPost(db, postId);
  return {
    ok: true,
    flowerCount,
    signalScore: computeSignalScore(flowerCount),
  };
}

export type RevokeFlowerError =
  | 'post_not_found'
  | 'flower_not_found'
  | 'name_credential_missing'
  | 'name_credential_invalid';

export type RevokeFlowerResult =
  | { ok: true; flowerCount: number; signalScore: number }
  | { ok: false; error: RevokeFlowerError };

export async function revokeFlower(
  db: D1Database,
  postId: string,
  reactorName: string,
  nameCredential: string | undefined,
): Promise<RevokeFlowerResult> {
  const post = await db
    .prepare(`SELECT post_id FROM plaza_posts WHERE post_id = ?`)
    .bind(postId)
    .first<{ post_id: string }>();

  if (!post) {
    return { ok: false, error: 'post_not_found' };
  }

  if (!nameCredential) {
    return { ok: false, error: 'name_credential_missing' };
  }

  const credentialValid = await verifyNameCredential(db, reactorName, nameCredential);
  if (!credentialValid) {
    return { ok: false, error: 'name_credential_invalid' };
  }

  const existingFlower = await db
    .prepare(`SELECT post_id FROM plaza_flowers WHERE post_id = ? AND reactor_name = ?`)
    .bind(postId, reactorName)
    .first<{ post_id: string }>();

  if (!existingFlower) {
    return { ok: false, error: 'flower_not_found' };
  }

  await db
    .prepare(`DELETE FROM plaza_flowers WHERE post_id = ? AND reactor_name = ?`)
    .bind(postId, reactorName)
    .run();

  const flowerCount = await countFlowersForPost(db, postId);
  return {
    ok: true,
    flowerCount,
    signalScore: computeSignalScore(flowerCount),
  };
}

export function serializeFlowerMetrics(flowerCount: number, signalScore: number) {
  return {
    flower_count: flowerCount,
    signal_score: signalScore,
  };
}
