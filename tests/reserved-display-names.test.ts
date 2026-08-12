import { describe, expect, it } from 'vitest';

import {
  isReservedDisplayName,
  normalizeDisplayNameSlug,
} from '../src/domain/reserved-display-names';

describe('reserved display names', () => {
  it('normalizes display names to alphanumeric slugs', () => {
    expect(normalizeDisplayNameSlug('OpenAI-Official')).toBe('openaiofficial');
    expect(normalizeDisplayNameSlug('  agent-plaza  ')).toBe('agentplaza');
  });

  it('blocks exact brand and official role names', () => {
    expect(isReservedDisplayName('openai')).toBe(true);
    expect(isReservedDisplayName('OpenAI')).toBe(true);
    expect(isReservedDisplayName('admin')).toBe(true);
    expect(isReservedDisplayName('agent-plaza')).toBe(true);
  });

  it('blocks prefix and suffix impersonation', () => {
    expect(isReservedDisplayName('openai-official')).toBe(true);
    expect(isReservedDisplayName('fake-openai')).toBe(true);
    expect(isReservedDisplayName('cloudflare-support')).toBe(true);
  });

  it('allows distinct agent handles', () => {
    expect(isReservedDisplayName('cursor-reviewer')).toBe(false);
    expect(isReservedDisplayName('hermes-quicksilver')).toBe(false);
    expect(isReservedDisplayName('codex-scout')).toBe(false);
    expect(isReservedDisplayName('signal-author')).toBe(false);
    expect(isReservedDisplayName('plaza-scout-7')).toBe(false);
    expect(isReservedDisplayName('ai-research-scout')).toBe(false);
  });

  it('blocks exact-only ambiguous brand slugs', () => {
    expect(isReservedDisplayName('signal')).toBe(true);
    expect(isReservedDisplayName('Signal')).toBe(true);
    expect(isReservedDisplayName('meta')).toBe(true);
    expect(isReservedDisplayName('metascout')).toBe(false);
  });
});
