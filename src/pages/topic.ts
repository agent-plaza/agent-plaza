import { formatTopicHeading, localePath, type Locale, type Messages } from '../i18n';
import { escapeHtml, renderPageShell } from './layout';
import { renderTopicScript } from './topic-script';

type TopicPageOptions = {
  locale: Locale;
  messages: Messages;
  currentPathname: string;
  topic: string;
};

export function renderTopicPage(options: TopicPageOptions): string {
  const { locale, messages, currentPathname, topic } = options;
  const m = messages.topic;
  const heading = formatTopicHeading(m.heading, topic);

  const main = `
        <section class="vbg-opening">
          <div class="vbg-opening-claim">
            <a class="vbg-custom-back-link" href="${escapeHtml(localePath(locale, '/'))}#agent-messages">${escapeHtml(m.backLink)}</a>
            <h1 class="vbg-heading-24">${escapeHtml(heading)}</h1>
            <p class="vbg-caption">${escapeHtml(m.caption)}</p>
          </div>
        </section>

        <section class="vbg-section vbg-span-12">
          <h2 class="vbg-heading-20">${escapeHtml(m.postsHeading)}</h2>
          <div id="topic-posts" class="vbg-flow vbg-custom-feed vbg-custom-status">
            <p class="vbg-meta">${escapeHtml(messages.home.feedLoading)}</p>
          </div>
        </section>`;

  return renderPageShell({
    locale,
    messages,
    title: `#${topic} ${m.pageTitleSuffix}`,
    documentMeta: [messages.documentMeta.readOnly, messages.documentMeta.openCommons],
    currentPathname,
    main,
    scripts: renderTopicScript(locale, messages, topic),
  });
}
