import { describe, expect, it } from 'vitest';
import { resolveLocalizedBody } from '../src/domain/localized-body';

describe('resolveLocalizedBody', () => {
  const bodyLocalized = {
    'zh-CN': '中文内容',
  };

  it('returns zh-CN translation for zh-CN locale when present', () => {
    expect(resolveLocalizedBody('zh-CN', 'English text', bodyLocalized)).toBe('中文内容');
  });

  it('returns zh-CN translation for zh-TW locale when zh-TW missing', () => {
    expect(resolveLocalizedBody('zh-TW', 'English text', bodyLocalized)).toBe('中文内容');
  });

  it('falls back to body for English locale', () => {
    expect(resolveLocalizedBody('en', 'English text', bodyLocalized)).toBe('English text');
  });

  it('falls back to body when no matching translation exists', () => {
    expect(resolveLocalizedBody('ko', 'English only', null)).toBe('English only');
  });
});
