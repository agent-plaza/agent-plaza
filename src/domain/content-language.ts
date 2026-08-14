import { LOCALES, type Locale } from '../i18n/types';

export const CONTENT_LANGUAGES = [...LOCALES] as const;

export type ContentLanguage = (typeof CONTENT_LANGUAGES)[number];

type LocalizedTextMap = Partial<Record<ContentLanguage, string>>;

const CONTENT_LANGUAGE_SET = new Set<string>(CONTENT_LANGUAGES);

export function isContentLanguage(value: string): value is ContentLanguage {
  return CONTENT_LANGUAGE_SET.has(value);
}

export function normalizeContentLanguage(raw: string): ContentLanguage | null {
  const trimmed = raw.trim();
  return isContentLanguage(trimmed) ? trimmed : null;
}

/** Demo posts use dedicated Chinese copy; other non-English UI locales fall back to English demos. */
export function resolveDemoContentLocale(locale: Locale): 'en' | 'zh-CN' {
  if (locale === 'zh-CN' || locale === 'zh-TW') {
    return 'zh-CN';
  }
  return 'en';
}

export function formatContentLanguageLabel(
  lang: ContentLanguage,
  localeNames: Record<Locale, string>,
): string {
  return localeNames[lang];
}

function localePreferenceOrder(locale: Locale): ContentLanguage[] {
  if (locale === 'zh-TW') {
    return ['zh-TW', 'zh-CN', 'en'];
  }
  if (locale === 'zh-CN') {
    return ['zh-CN', 'en'];
  }
  return [locale, 'en'];
}

export function listAvailableContentLanguages(
  body: string,
  bodyLocalized: LocalizedTextMap | null,
): ContentLanguage[] {
  const available = new Set<ContentLanguage>();
  if (body.trim().length > 0) {
    available.add('en');
  }
  if (bodyLocalized) {
    for (const lang of CONTENT_LANGUAGES) {
      if (bodyLocalized[lang]) {
        available.add(lang);
      }
    }
  }
  return CONTENT_LANGUAGES.filter((lang) => available.has(lang));
}

export function resolveDisplayContentLanguage(
  locale: Locale,
  body: string,
  bodyLocalized: LocalizedTextMap | null,
): ContentLanguage {
  for (const preferred of localePreferenceOrder(locale)) {
    if (preferred === 'en') {
      if (body.trim().length > 0) {
        return 'en';
      }
      if (bodyLocalized?.en) {
        return 'en';
      }
      continue;
    }
    if (bodyLocalized?.[preferred]) {
      return preferred;
    }
  }

  if (bodyLocalized) {
    for (const lang of LOCALES) {
      if (bodyLocalized[lang]) {
        return lang;
      }
    }
  }

  return 'en';
}

export function postMatchesContentLanguageFilter(
  filterLang: ContentLanguage,
  body: string,
  bodyLocalized: LocalizedTextMap | null,
): boolean {
  return listAvailableContentLanguages(body, bodyLocalized).includes(filterLang);
}
