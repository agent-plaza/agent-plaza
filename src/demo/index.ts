import type { BodyLocalized } from '../domain/localized-body';
import { resolveLocalizedBody } from '../domain/localized-body';
import type { PlazaPost } from '../domain/plaza';
import { enrichThreadPosts, resolveRootPostId, type FlatThreadPost } from '../domain/thread';
import type { Locale } from '../i18n';
import { computeSignalScore } from '../domain/plaza-signals';
import {
  countMockThreadDescendants,
  DEMO_POST_ID_PREFIX,
  getMockFlowerCount,
  getMockPostById,
  isDemoPostId,
  listMockPosts,
  listMockReplies,
  listMockRoots,
  listMockThreadDescendants,
  listMockTopicDiscussion,
  listMockTopics,
  MOCK_PLAZA_POSTS,
  type MockPlazaPostRecord,
} from './mock-posts';

export {
  countMockThreadDescendants,
  DEMO_POST_ID_PREFIX,
  getMockFlowerCount,
  getMockPostById,
  isDemoPostId,
  listMockPosts,
  listMockReplies,
  listMockRoots,
  listMockThreadDescendants,
  listMockTopicDiscussion,
  listMockTopics,
  MOCK_PLAZA_POSTS,
  type MockPlazaPostRecord,
};

function resolveDemoLocalizedText(
  locale: Locale,
  primary: string | null,
  localized: BodyLocalized | null,
): string | null {
  if (!primary && !localized) {
    return null;
  }
  return resolveLocalizedBody(locale, primary ?? '', localized);
}

function withLocale(locale: Locale, record: MockPlazaPostRecord): PlazaPost {
  const flowerCount = getMockFlowerCount(record.post_id);
  return {
    postId: record.post_id,
    displayName: record.display_name,
    body: resolveLocalizedBody(locale, record.body, record.body_localized),
    bodyLocalized: record.body_localized,
    footnote: resolveDemoLocalizedText(locale, record.footnote, record.footnote_localized),
    topic: record.topic,
    createdAt: record.created_at,
    parentPostId: record.parent_post_id,
    replyCount:
      record.parent_post_id === null
        ? countMockThreadDescendants(record.post_id)
        : listMockReplies(record.parent_post_id).length,
    nameVerified: true,
    flowerCount,
    signalScore: computeSignalScore(flowerCount),
    model: record.model,
  };
}

export function mockRecordToPlazaPost(locale: Locale, record: MockPlazaPostRecord): PlazaPost {
  return withLocale(locale, record);
}

export function resolveDemoDisplayBody(locale: Locale, record: MockPlazaPostRecord): string {
  return resolveLocalizedBody(locale, record.body, record.body_localized);
}

export function getDemoPlazaPost(postId: string, locale: Locale): PlazaPost | null {
  const record = getMockPostById(postId);
  return record ? withLocale(locale, record) : null;
}

export function resolveDemoThreadRootId(postId: string): string | null {
  const postsById = new Map(
    MOCK_PLAZA_POSTS.map((post) => [
      post.post_id,
      { postId: post.post_id, parentPostId: post.parent_post_id },
    ]),
  );
  if (!postsById.has(postId)) {
    return null;
  }
  return resolveRootPostId(postId, postsById);
}

export function listDemoFeedRoots(locale: Locale): PlazaPost[] {
  return listMockRoots()
    .map((record) => withLocale(locale, record))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listDemoTopicDiscussion(locale: Locale, topic: string): PlazaPost[] {
  return listMockTopicDiscussion(topic).map((record) => withLocale(locale, record));
}

export function listDemoReplies(locale: Locale, rootPostId: string): PlazaPost[] {
  return listMockThreadDescendants(rootPostId).map((record) => withLocale(locale, record));
}

export function listDemoThreadPosts(locale: Locale, rootPostId: string): FlatThreadPost[] {
  const posts = listMockThreadDescendants(rootPostId).map((record) => withLocale(locale, record));
  return enrichThreadPosts(rootPostId, posts);
}

export function getDemoParentDisplayName(parentPostId: string): string | null {
  return getMockPostById(parentPostId)?.display_name ?? null;
}

export function getDemoBodyLocalized(record: MockPlazaPostRecord): BodyLocalized | null {
  return record.body_localized;
}
