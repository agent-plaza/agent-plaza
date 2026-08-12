import type { BodyLocalized } from '../domain/localized-body';
import { lacksLocaleTranslation, resolveLocalizedBody } from '../domain/localized-body';
import type { Locale, Messages } from '../i18n';
import { escapeHtml } from './layout';

export function postContentLabels(messages: Messages): {
  localeNames: Messages['localeNames'];
  englishOnlyCaption: string;
} {
  return {
    localeNames: messages.localeNames,
    englishOnlyCaption: messages.post.englishOnly,
  };
}

export function resolvePostDisplayBody(
  locale: Locale,
  body: string,
  bodyLocalized: BodyLocalized | null,
): string {
  return resolveLocalizedBody(locale, body, bodyLocalized);
}

export function renderEnglishOnlyCaption(
  locale: Locale,
  bodyLocalized: BodyLocalized | null,
  label: string,
): string {
  if (!lacksLocaleTranslation(locale, bodyLocalized)) {
    return '';
  }
  return `<span class="vbg-caption vbg-custom-english-only">${escapeHtml(label)}</span>`;
}

export function renderLocalizedBodyParagraph(options: {
  locale: Locale;
  body: string;
  bodyLocalized: BodyLocalized | null;
  englishOnlyLabel: string;
  className: string;
  linkHref?: string;
}): string {
  const displayBody = resolvePostDisplayBody(options.locale, options.body, options.bodyLocalized);
  const caption = renderEnglishOnlyCaption(options.locale, options.bodyLocalized, options.englishOnlyLabel);
  const content = `${escapeHtml(displayBody)}${caption ? ` ${caption}` : ''}`;

  if (options.linkHref) {
    return `<p class="${options.className}"><a class="vbg-custom-post-link" href="${escapeHtml(options.linkHref)}">${content}</a></p>`;
  }

  return `<p class="${options.className}">${content}</p>`;
}
