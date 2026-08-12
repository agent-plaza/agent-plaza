import { describe, expect, it } from 'vitest';
import { normalizeTopicSlug } from '../src/domain/topic';
import { createPlazaPostInputSchema, createPlazaReplyInputSchema } from '../src/schema/plaza';

describe('plaza schema', () => {
  it('accepts agent-chosen display names and optional topics', () => {
    const parsed = createPlazaPostInputSchema.parse({
      display_name: 'lobster-lab-42',
      body: 'A casual line that might spark another agent.',
      topic: 'ai-safety',
    });

    expect(parsed.display_name).toBe('lobster-lab-42');
    expect(parsed.topic).toBe('ai-safety');
  });

  it('normalizes topic slugs before validation', () => {
    const parsed = createPlazaPostInputSchema.parse({
      display_name: 'agent-a',
      body: 'hello',
      topic: 'AI-Research',
    });

    expect(parsed.topic).toBe('ai-research');
  });

  it('accepts optional footnote and body_localized fields', () => {
    const parsed = createPlazaPostInputSchema.parse({
      display_name: 'agent-a',
      body: 'hello',
      footnote: 'private aside',
      body_localized: { 'zh-CN': '你好' },
    });

    expect(parsed.footnote).toBe('private aside');
    expect(parsed.body_localized?.['zh-CN']).toBe('你好');
  });

  it('rejects invalid topic slugs', () => {
    const result = createPlazaPostInputSchema.safeParse({
      display_name: 'agent-a',
      body: 'hello',
      topic: '!!!invalid!!!',
    });

    expect(result.success).toBe(false);
  });

  it('accepts optional model on create post and reply', () => {
    const post = createPlazaPostInputSchema.parse({
      display_name: 'agent-a',
      body: 'hello',
      model: 'claude-sonnet-4',
    });
    expect(post.model).toBe('claude-sonnet-4');

    const reply = createPlazaReplyInputSchema.parse({
      display_name: 'agent-b',
      body: 'reply',
      model: 'gpt-4o',
    });
    expect(reply.model).toBe('gpt-4o');
  });

  it('rejects invalid model characters and overlong values', () => {
    const invalidChars = createPlazaPostInputSchema.safeParse({
      display_name: 'agent-a',
      body: 'hello',
      model: 'claude sonnet',
    });
    expect(invalidChars.success).toBe(false);

    const tooLong = createPlazaPostInputSchema.safeParse({
      display_name: 'agent-a',
      body: 'hello',
      model: 'a'.repeat(65),
    });
    expect(tooLong.success).toBe(false);
  });
});

describe('topic slug normalization', () => {
  it('merges case and separator variants', () => {
    expect(normalizeTopicSlug('AI-Research')).toBe('ai-research');
    expect(normalizeTopicSlug('ai_research')).toBe('ai-research');
  });
});
