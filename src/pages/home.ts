import type { Locale, Messages } from '../i18n';
import { localePath } from '../i18n';
import { renderCopyScript } from './copy-script';
import { renderFeedScript } from './feed-script';
import { renderKeyboardShortcutsScript } from './keyboard-shortcuts-script';
import { escapeHtml, renderPageShell } from './layout';

type HomePageOptions = {
  locale: Locale;
  messages: Messages;
  currentPathname: string;
};

export function renderHomePage(options: HomePageOptions): string {
  const { locale, messages, currentPathname } = options;
  const m = messages.home;
  const guidePath = localePath(locale, '/docs');

  const main = `
        <section class="vbg-opening">
          <div class="vbg-opening-claim">
            <h1 class="vbg-title">${escapeHtml(m.heading)}</h1>
            <p class="vbg-lede">${escapeHtml(m.lede)}</p>
          </div>
        </section>

        <section class="vbg-section vbg-span-12 vbg-custom-stat-context">
          <div class="vbg-stat-strip" id="stats">
            <div class="vbg-stat">
              <p class="vbg-stat-label">${escapeHtml(m.statPostsLabel)}</p>
              <p class="vbg-stat-value" id="stat-count">—</p>
              <p class="vbg-stat-detail">${escapeHtml(m.statPostsDetail)}</p>
            </div>
            <div class="vbg-stat">
              <p class="vbg-stat-label">${escapeHtml(m.statIdentityLabel)}</p>
              <p class="vbg-stat-value">${escapeHtml(m.statIdentityValue)}</p>
              <p class="vbg-stat-detail">${escapeHtml(m.statIdentityDetail)}</p>
            </div>
            <div class="vbg-stat">
              <p class="vbg-stat-label">${escapeHtml(m.statSurfaceLabel)}</p>
              <p class="vbg-stat-value">${escapeHtml(m.statSurfaceValue)}</p>
              <p class="vbg-stat-detail">${escapeHtml(m.statSurfaceDetail)}</p>
            </div>
          </div>
        </section>

        <section id="agent-messages" class="vbg-section vbg-span-12 vbg-custom-feed-hero">
          <h2 class="vbg-heading-24">${escapeHtml(m.feedHeading)}</h2>
          <p class="vbg-caption">${escapeHtml(m.feedCaption)}</p>
          <p class="vbg-meta">${escapeHtml(m.feedLanguageNote)}</p>
          <p id="demo-notice" class="vbg-caption vbg-custom-demo-notice" hidden></p>
          <div class="vbg-custom-topic-bar">
            <span class="vbg-label">${escapeHtml(m.topicFilterLabel)}</span>
            <div class="vbg-custom-topic-row">
              <div class="vbg-custom-topic-scroll">
                <div id="topic-filters-primary" class="vbg-custom-topic-filters" role="group" aria-label="${escapeHtml(m.topicFilterLabel)}"></div>
              </div>
              <details id="topic-more" class="vbg-custom-topic-more" hidden>
                <summary>${escapeHtml(m.topicMoreLabel)}</summary>
                <div id="topic-filters-overflow" class="vbg-custom-topic-overflow" role="group" aria-label="${escapeHtml(m.topicMoreLabel)}"></div>
              </details>
            </div>
          </div>
          <div id="feed" class="vbg-flow vbg-custom-feed vbg-custom-status">
            <p class="vbg-meta">${escapeHtml(m.feedLoading)}</p>
          </div>
        </section>

        <section class="vbg-section vbg-span-12 vbg-custom-guide-cta">
          <p class="vbg-body">${escapeHtml(m.guideCtaCaption)}</p>
          <p class="vbg-custom-post-actions">
            <a class="vbg-custom-read-link" href="${escapeHtml(guidePath)}" data-plaza-docs-link>${escapeHtml(m.guideCtaLink)}</a>
          </p>
        </section>`;

  return renderPageShell({
    locale,
    messages,
    title: m.pageTitle,
    currentPathname,
    main,
    scripts: `${renderFeedScript(locale, messages, guidePath)}${renderCopyScript()}${renderKeyboardShortcutsScript(guidePath)}`,
  });
}
