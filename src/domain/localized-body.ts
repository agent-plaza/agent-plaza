import { LOCALES, type Locale } from '../i18n/types';

import type { ContentLanguage } from './content-language';

export type BodyLocalized = Partial<Record<ContentLanguage, string>>;

const BODY_LOCALIZED_KEY_SET = new Set<string>(LOCALES);

export function isBodyLocalizedKey(key: string): key is ContentLanguage {
  return BODY_LOCALIZED_KEY_SET.has(key);
}

export function normalizeBodyLocalizedInput(
  input: Record<string, string> | undefined,
): BodyLocalized | null {
  if (!input) {
    return null;
  }

  const normalized: BodyLocalized = {};
  for (const [key, value] of Object.entries(input)) {
    if (!isBodyLocalizedKey(key)) {
      continue;
    }
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      normalized[key] = trimmed;
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : null;
}

export function parseBodyLocalizedJson(raw: string | null): BodyLocalized | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }

    const normalized: BodyLocalized = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!isBodyLocalizedKey(key) || typeof value !== 'string') {
        continue;
      }
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        normalized[key] = trimmed;
      }
    }

    return Object.keys(normalized).length > 0 ? normalized : null;
  } catch {
    return null;
  }
}

export function serializeBodyLocalizedJson(bodyLocalized: BodyLocalized | null): string | null {
  if (!bodyLocalized || Object.keys(bodyLocalized).length === 0) {
    return null;
  }
  return JSON.stringify(bodyLocalized);
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

export function resolveLocalizedBody(
  locale: Locale,
  body: string,
  bodyLocalized: BodyLocalized | null,
): string {
  for (const preferred of localePreferenceOrder(locale)) {
    if (preferred === 'en') {
      if (body.trim().length > 0) {
        return body;
      }
      const englishLocalized = bodyLocalized?.en;
      if (englishLocalized) {
        return englishLocalized;
      }
      continue;
    }

    const localized = bodyLocalized?.[preferred];
    if (localized) {
      return localized;
    }
  }

  if (bodyLocalized) {
    for (const lang of LOCALES) {
      const text = bodyLocalized[lang];
      if (text) {
        return text;
      }
    }
  }

  return body;
}

export function lacksLocaleTranslation(
  locale: Locale,
  bodyLocalized: BodyLocalized | null,
): boolean {
  if (locale === 'en') {
    return false;
  }

  for (const preferred of localePreferenceOrder(locale)) {
    if (preferred === 'en') {
      continue;
    }
    if (bodyLocalized?.[preferred]) {
      return false;
    }
  }

  return true;
}

export function serializeBodyLocalizedForApi(bodyLocalized: BodyLocalized | null): Record<string, string> | null {
  if (!bodyLocalized || Object.keys(bodyLocalized).length === 0) {
    return null;
  }

  const serialized: Record<string, string> = {};
  for (const lang of LOCALES) {
    const text = bodyLocalized[lang];
    if (text) {
      serialized[lang] = text;
    }
  }

  return Object.keys(serialized).length > 0 ? serialized : null;
}
