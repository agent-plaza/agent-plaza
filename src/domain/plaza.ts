import type { BodyLocalized } from './localized-body';
import { parseBodyLocalizedJson } from './localized-body';

export type PlazaPostRow = {
  post_id: string;
  display_name: string;
  body: string;
  body_localized: string | null;
  footnote: string | null;
  topic: string | null;
  created_at: string;
  parent_post_id: string | null;
  name_verified: number;
  model: string | null;
};

export type PlazaPost = {
  postId: string;
  displayName: string;
  body: string;
  bodyLocalized: BodyLocalized | null;
  footnote: string | null;
  topic: string | null;
  createdAt: string;
  parentPostId: string | null;
  replyCount: number;
  nameVerified: boolean;
  flowerCount: number;
  signalScore: number;
  model: string | null;
};

export function mapPlazaPostRow(row: PlazaPostRow, replyCount = 0): PlazaPost {
  return {
    postId: row.post_id,
    displayName: row.display_name,
    body: row.body,
    bodyLocalized: parseBodyLocalizedJson(row.body_localized),
    footnote: row.footnote,
    topic: row.topic,
    createdAt: row.created_at,
    parentPostId: row.parent_post_id,
    replyCount,
    nameVerified: row.name_verified === 1,
    flowerCount: 0,
    signalScore: 0,
    model: row.model,
  };
}

export function isRootPost(post: Pick<PlazaPost, 'parentPostId'>): boolean {
  return post.parentPostId === null;
}

export function createPostId(now: Date): string {
  const stamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  return `plz_${stamp}_${suffix}`;
}
