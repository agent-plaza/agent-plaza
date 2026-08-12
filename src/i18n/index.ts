import { withHomeDefaults } from './home-messages';
import { de } from './messages/de';
import { en } from './messages/en';
import { es } from './messages/es';
import { fr } from './messages/fr';
import { ja } from './messages/ja';
import { ko } from './messages/ko';
import { zhCN } from './messages/zh-CN';
import { zhTW } from './messages/zh-TW';
import { DEFAULT_LOCALE, LOCALES, LOCALES_IN_UI_PICKER, type Locale, type Messages, type NotFoundResource } from './types';

export { DEFAULT_LOCALE, LOCALES, LOCALES_IN_UI_PICKER, type Locale, type Messages, type NotFoundResource };

const MESSAGES: Record<Locale, Messages> = {
  en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  ko,
  ja,
  es,
  fr,
  de,
};

export const LOCALE_COOKIE = 'plaza_lang';
export const THEME_STORAGE_KEY = 'plaza_theme';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function getMessages(locale: Locale): Messages {
  const messages = MESSAGES[locale];
  return {
    ...messages,
    home: withHomeDefaults(messages.home, locale),
  };
}

export function formatNotFoundHeading(messages: Messages, resource: NotFoundResource): string {
  return messages.notFound.heading.replace('{resource}', messages.notFound.resourceLabels[resource]);
}

export function formatReplyCount(
  templates: { replyCount: string; replyCountSingular: string },
  count: number,
): string {
  if (count === 1) return templates.replyCountSingular;
  return templates.replyCount.replace('{count}', String(count));
}

export function formatTopicHeading(template: string, topic: string): string {
  return template.replace('{topic}', topic).replace('#{topic}', `#${topic}`);
}

export function formatTimestamp(value: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

/** Build a localized path. English uses unprefixed paths. */
export function localePath(locale: Locale, pathname: string): string {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (locale === DEFAULT_LOCALE) {
    return normalized === '/' ? '/' : normalized;
  }
  if (normalized === '/') {
    return `/${locale}`;
  }
  return `/${locale}${normalized}`;
}

const LOCALE_PREFIX_PATTERN = new RegExp(`^/(${LOCALES.filter((l) => l !== DEFAULT_LOCALE).join('|')})(?=/|$)`);

export type ParsedLocalePath = {
  locale: Locale;
  pathname: string;
};

/** Strip an optional non-default locale prefix from a pathname. */
export function parseLocalePath(pathname: string): ParsedLocalePath {
  const match = LOCALE_PREFIX_PATTERN.exec(pathname);
  if (!match) {
    return { locale: DEFAULT_LOCALE, pathname };
  }

  const locale = match[1];
  if (!isLocale(locale) || locale === DEFAULT_LOCALE) {
    return { locale: DEFAULT_LOCALE, pathname };
  }

  const rest = pathname.slice(match[0].length) || '/';
  return { locale, pathname: rest.startsWith('/') ? rest : `/${rest}` };
}

function parseAcceptLanguage(header: string | undefined): Locale | null {
  if (!header) return null;

  const candidates = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return { tag: tag.trim(), q: Number.isFinite(q) ? q : 0 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of candidates) {
    if (isLocale(tag)) return tag;
    const primary = tag.split('-')[0];
    const match = LOCALES.find((locale) => locale === tag || locale.startsWith(`${primary}-`) || locale === primary);
    if (match) return match;
  }

  return null;
}

export function resolveLocaleFromCookie(cookieHeader: string | undefined): Locale | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`));
  if (!match) return null;
  const value = decodeURIComponent(match[1].trim());
  return isLocale(value) ? value : null;
}

export function resolveLocale(options: {
  pathname: string;
  queryLang: string | null;
  cookieHeader: string | undefined;
  acceptLanguage: string | undefined;
}): Locale {
  if (options.queryLang && isLocale(options.queryLang)) {
    return options.queryLang;
  }

  const fromPath = parseLocalePath(options.pathname).locale;
  if (fromPath !== DEFAULT_LOCALE) {
    return fromPath;
  }

  const fromCookie = resolveLocaleFromCookie(options.cookieHeader);
  if (fromCookie) return fromCookie;

  const fromAccept = parseAcceptLanguage(options.acceptLanguage);
  if (fromAccept) return fromAccept;

  return DEFAULT_LOCALE;
}

export function buildLocaleCookie(locale: Locale): string {
  return `${LOCALE_COOKIE}=${encodeURIComponent(locale)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function switchLocaleHref(currentPathname: string, targetLocale: Locale): string {
  const { pathname } = parseLocalePath(currentPathname);
  return localePath(targetLocale, pathname);
}

export function toHtmlLang(locale: Locale): string {
  return locale;
}
