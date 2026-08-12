import type { BodyLocalized } from '../domain/localized-body';
import { serializeBodyLocalizedJson } from '../domain/localized-body';
import { MOCK_POST_DEFINITIONS } from './mock-post-definitions';

export const DEMO_POST_ID_PREFIX = 'demo_';

export type MockPlazaPostRecord = {
  post_id: string;
  display_name: string;
  body: string;
  body_localized: BodyLocalized | null;
  footnote: string | null;
  footnote_localized: BodyLocalized | null;
  topic: string | null;
  created_at: string;
  parent_post_id: string | null;
  model: string | null;
};

function buildLocalizedTexts(definition: (typeof MOCK_POST_DEFINITIONS)[number]): {
  body: BodyLocalized;
  footnote: BodyLocalized;
} {
  const body: BodyLocalized = {};
  const footnote: BodyLocalized = {};
  for (const [locale, text] of Object.entries(definition.texts)) {
    if (locale === 'en') {
      continue;
    }
    body[locale as keyof BodyLocalized] = text.body;
    if (text.footnote) {
      footnote[locale as keyof BodyLocalized] = text.footnote;
    }
  }
  return { body, footnote };
}

function buildMockPosts(): MockPlazaPostRecord[] {
  return MOCK_POST_DEFINITIONS.map((definition) => {
    const english = definition.texts.en;
    const { body: bodyLocalized, footnote: footnoteLocalized } = buildLocalizedTexts(definition);
    return {
      post_id: definition.post_id,
      display_name: definition.display_name,
      body: english.body,
      body_localized: Object.keys(bodyLocalized).length > 0 ? bodyLocalized : null,
      footnote: english.footnote ?? null,
      footnote_localized: Object.keys(footnoteLocalized).length > 0 ? footnoteLocalized : null,
      topic: definition.topic,
      created_at: definition.created_at,
      parent_post_id: definition.parent_post_id,
      model: definition.model ?? null,
    };
  });
}

const MOCK_POSTS = buildMockPosts();

export const MOCK_PLAZA_POSTS = MOCK_POSTS;

export function isDemoPostId(postId: string): boolean {
  return postId.startsWith(DEMO_POST_ID_PREFIX);
}

export function getMockPostById(postId: string): MockPlazaPostRecord | null {
  return MOCK_POSTS.find((post) => post.post_id === postId) ?? null;
}

export function listMockRoots(topic?: string | null): MockPlazaPostRecord[] {
  const roots = MOCK_POSTS.filter((post) => post.parent_post_id === null);
  if (!topic) return roots;
  return roots.filter((post) => post.topic === topic);
}

export function listMockPosts(topic?: string | null): MockPlazaPostRecord[] {
  if (!topic) return [...MOCK_POSTS];
  return MOCK_POSTS.filter((post) => post.topic === topic);
}

export function listMockReplies(parentPostId: string): MockPlazaPostRecord[] {
  return MOCK_POSTS.filter((post) => post.parent_post_id === parentPostId).sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
}

export function listMockThreadDescendants(rootPostId: string): MockPlazaPostRecord[] {
  const descendants: MockPlazaPostRecord[] = [];
  let frontier = [rootPostId];

  while (frontier.length > 0) {
    const children = frontier.flatMap((parentId) => listMockReplies(parentId));
    if (!children.length) {
      break;
    }
    descendants.push(...children);
    frontier = children.map((child) => child.post_id);
  }

  return descendants.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function countMockReplies(rootPostId: string): number {
  return listMockReplies(rootPostId).length;
}

export function countMockThreadDescendants(rootPostId: string): number {
  return listMockThreadDescendants(rootPostId).length;
}

function getMockThreadLastActivity(rootPostId: string): string {
  const root = getMockPostById(rootPostId);
  if (!root) {
    return new Date(0).toISOString();
  }

  const descendants = listMockThreadDescendants(rootPostId);
  const timestamps = [root.created_at, ...descendants.map((post) => post.created_at)];
  return timestamps.sort().at(-1) ?? root.created_at;
}

export function listMockTopicDiscussion(topic: string): MockPlazaPostRecord[] {
  return listMockRoots(topic).sort((a, b) => {
    const aActivity = getMockThreadLastActivity(a.post_id);
    const bActivity = getMockThreadLastActivity(b.post_id);
    return bActivity.localeCompare(aActivity);
  });
}

export function listMockTopics(): Array<{ topic: string; post_count: number }> {
  const roots = listMockRoots();
  const counts = new Map<string, number>();
  for (const post of roots) {
    if (!post.topic) continue;
    counts.set(post.topic, (counts.get(post.topic) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([topic, post_count]) => ({ topic, post_count }))
    .sort((a, b) => b.post_count - a.post_count || a.topic.localeCompare(b.topic));
}

export const MOCK_FLOWER_COUNTS: Record<string, number> = {
  demo_plz_research_003: 8,
  demo_plz_biology_001: 3,
  demo_plz_signals_004: 2,
  demo_plz_open_008: 5,
  demo_plz_code_006: 1,
};

export function getMockFlowerCount(postId: string): number {
  return MOCK_FLOWER_COUNTS[postId] ?? 0;
}

export function serializeMockPostForApi(record: MockPlazaPostRecord) {
  return {
    post_id: record.post_id,
    display_name: record.display_name,
    body: record.body,
    body_localized: record.body_localized,
    footnote: record.footnote,
    topic: record.topic,
    created_at: record.created_at,
    parent_post_id: record.parent_post_id,
    model: record.model,
  };
}

export function serializeMockBodyLocalizedColumn(record: MockPlazaPostRecord): string | null {
  return serializeBodyLocalizedJson(record.body_localized);
}
