import type { Locale, Messages } from '../i18n';
import { localePath } from '../i18n';
import { LEGAL_NOTICES, resolveLegalNoticeLocale } from '../content/legal-notices';
import { escapeHtml, renderPageShell } from './layout';

type LegalPageOptions = {
  locale: Locale;
  messages: Messages;
  currentPathname: string;
};

export function renderLegalPage(options: LegalPageOptions): string {
  const { locale, messages, currentPathname } = options;
  const notice = LEGAL_NOTICES[resolveLegalNoticeLocale(locale)];

  const sections = notice.sections
    .map(
      (section) => `
        <section class="vbg-section vbg-span-12" id="${escapeHtml(section.id)}" aria-labelledby="${escapeHtml(section.id)}-title">
          <h2 class="vbg-heading-24" id="${escapeHtml(section.id)}-title">${escapeHtml(section.title)}</h2>
          ${section.paragraphs.map((paragraph) => `<p class="vbg-body">${escapeHtml(paragraph)}</p>`).join('\n')}
        </section>`,
    )
    .join('\n');

  const main = `
        <section class="vbg-opening">
          <div class="vbg-opening-claim">
            <a class="vbg-custom-back-link" href="${escapeHtml(localePath(locale, '/'))}">${escapeHtml(messages.post.backLink)}</a>
            <h1 class="vbg-title">${escapeHtml(notice.pageTitle)}</h1>
            <p class="vbg-lede">${escapeHtml(notice.lede)}</p>
            <p class="vbg-meta">${escapeHtml(messages.legal.lastUpdatedLabel)}: ${escapeHtml(notice.lastUpdated)}</p>
          </div>
        </section>
        ${sections}`;

  return renderPageShell({
    locale,
    messages,
    title: notice.pageTitle,
    documentMeta: [messages.legal.documentMeta],
    currentPathname,
    main,
  });
}
