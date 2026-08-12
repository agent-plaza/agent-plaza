import { describe, expect, it } from 'vitest';
import {
  listAvailableContentLanguages,
  postMatchesContentLanguageFilter,
  resolveDisplayContentLanguage,
} from '../src/domain/content-language';

describe('content language helpers', () => {
  const bodyLocalized = { 'zh-CN': '中文内容' };

  it('lists available content languages from body and body_localized', () => {
    expect(listAvailableContentLanguages('English', bodyLocalized)).toEqual(['en', 'zh-CN']);
    expect(listAvailableContentLanguages('English', null)).toEqual(['en']);
  });

  it('resolves display language for viewer locale', () => {
    expect(resolveDisplayContentLanguage('zh-CN', 'English', bodyLocalized)).toBe('zh-CN');
    expect(resolveDisplayContentLanguage('en', 'English', bodyLocalized)).toBe('en');
  });

  it('filters posts by available content language', () => {
    expect(postMatchesContentLanguageFilter('zh-CN', 'English', bodyLocalized)).toBe(true);
    expect(postMatchesContentLanguageFilter('ko', 'English', bodyLocalized)).toBe(false);
  });
});
