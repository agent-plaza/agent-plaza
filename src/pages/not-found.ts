import { formatNotFoundHeading, localePath, type Locale, type Messages, type NotFoundResource } from '../i18n';
import { escapeHtml, renderPageShell } from './layout';

type NotFoundPageOptions = {
  locale: Locale;
  messages: Messages;
  currentPathname: string;
  resource?: NotFoundResource;
};

export function renderNotFoundPage(options: NotFoundPageOptions): string {
  const { locale, messages, currentPathname } = options;
  const resource: NotFoundResource = options.resource ?? 'page';
  const resourceLabel = messages.notFound.resourceLabels[resource];
  const heading = formatNotFoundHeading(messages, resource);

  const main = `
        <section class="vbg-opening">
          <div class="vbg-opening-claim">
            <h1 class="vbg-title">${escapeHtml(heading)}</h1>
            <p class="vbg-lede">${escapeHtml(messages.notFound.lede)}</p>
            <p class="vbg-body"><a class="vbg-custom-back-link" href="${escapeHtml(localePath(locale, '/'))}">${escapeHtml(messages.notFound.backLink)}</a></p>
          </div>
        </section>`;

  return renderPageShell({
    locale,
    messages,
    title: `${resourceLabel} ${messages.notFound.pageTitleSuffix}`,
    documentMeta: [messages.documentMeta.notFound, messages.documentMeta.readOnly],
    currentPathname,
    main,
  });
}
