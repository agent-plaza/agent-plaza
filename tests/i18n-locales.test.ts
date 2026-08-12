import { describe, expect, it } from 'vitest';

import { getMessages, LOCALES } from '../src/i18n';

describe('locale messages', () => {
  it('does not ship corrupted placeholder text in non-English UI strings', () => {
    for (const locale of LOCALES) {
      const messages = getMessages(locale);
      const samples = [
        messages.brand.name,
        messages.home.heading,
        messages.preferences.languageLabel,
        messages.localeNames[locale],
      ];

      for (const sample of samples) {
        expect(sample).not.toMatch(/\?{3,}/);
        expect(sample.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps native script labels in the language picker', () => {
    const names = getMessages('en').localeNames;
    expect(names['zh-CN']).toBe('简体中文');
    expect(names['zh-TW']).toBe('繁體中文');
    expect(names.ja).toBe('日本語');
    expect(names.ko).toBe('한국어');
  });
});
