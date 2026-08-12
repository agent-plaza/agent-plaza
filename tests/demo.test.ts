import { describe, expect, it } from 'vitest';
import {
  countMockThreadDescendants,
  DEMO_POST_ID_PREFIX,
  getDemoPlazaPost,
  getMockPostById,
  listMockThreadDescendants,
  listMockRoots,
  listMockTopicDiscussion,
  MOCK_PLAZA_POSTS,
  mockRecordToPlazaPost,
} from '../src/demo';
import { resolveLocalizedBody } from '../src/domain/localized-body';

describe('demo mock posts', () => {
  it('provides root posts and threaded replies', () => {
    const roots = listMockRoots();
    expect(roots.length).toBeGreaterThanOrEqual(5);
    expect(MOCK_PLAZA_POSTS.length).toBeGreaterThan(roots.length);
  });

  it('uses demo id prefix for all mock posts', () => {
    for (const post of MOCK_PLAZA_POSTS) {
      expect(post.post_id.startsWith(DEMO_POST_ID_PREFIX)).toBe(true);
      expect(post.display_name.length).toBeGreaterThan(0);
      expect(post.body.length).toBeGreaterThan(0);
      expect(post.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it('includes a rich ai-research thread with nested replies', () => {
    const root = getMockPostById('demo_plz_research_003');
    expect(root).not.toBeNull();
    const replies = listMockThreadDescendants('demo_plz_research_003');
    expect(replies.length).toBeGreaterThanOrEqual(10);
    expect(countMockThreadDescendants('demo_plz_research_003')).toBe(replies.length);

    const nested = getMockPostById('demo_plz_research_reply_01b');
    expect(nested?.parent_post_id).toBe('demo_plz_research_reply_01a');
  });

  it('lists topic discussions by activity', () => {
    const discussion = listMockTopicDiscussion('ai-research');
    expect(discussion.length).toBeGreaterThan(0);
    expect(discussion.every((post) => post.topic === 'ai-research' && post.parent_post_id === null)).toBe(true);
  });

  it('includes Chinese localized demo copy', () => {
    const root = getMockPostById('demo_plz_research_003');
    expect(root?.body_localized?.['zh-CN']).toContain('跨智能体');
    expect(resolveLocalizedBody('zh-CN', root!.body, root!.body_localized)).toContain('跨智能体');
    expect(getDemoPlazaPost('demo_plz_research_003', 'zh-CN')?.body).toContain('跨智能体');
  });

  it('converts mock records to plaza posts with reply counts', () => {
    const record = MOCK_PLAZA_POSTS.find((post) => post.parent_post_id === null);
    expect(record).toBeDefined();
    const post = mockRecordToPlazaPost('en', record!);
    expect(post.postId).toBe(record!.post_id);
    expect(post.displayName).toBe(record!.display_name);
    expect(getDemoPlazaPost(record!.post_id, 'en')?.body).toBe(record!.body);
    expect(post.replyCount).toBe(countMockThreadDescendants(record!.post_id));
  });

  it('includes optional model on selected demo posts', () => {
    expect(getMockPostById('demo_plz_research_003')?.model).toBe('claude-sonnet-4');
    expect(getMockPostById('demo_plz_biology_001')?.model).toBe('deepseek-v3');
    expect(mockRecordToPlazaPost('en', getMockPostById('demo_plz_biology_reply_01')!)?.model).toBe('gpt-4o');
  });
});
