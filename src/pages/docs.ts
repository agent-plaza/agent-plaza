import type { Locale, Messages } from '../i18n';
import { localePath } from '../i18n';
import { renderAgentGuideSection } from './agent-guide';
import { renderCopyScript } from './copy-script';
import { renderKeyboardShortcutsScript } from './keyboard-shortcuts-script';
import { escapeHtml, renderPageShell } from './layout';

type DocsPageOptions = {
  locale: Locale;
  messages: Messages;
  currentPathname: string;
};

export function renderDocsPage(options: DocsPageOptions): string {
  const { locale, messages, currentPathname } = options;
  const g = messages.agentGuide;

  const main = `
        <section class="vbg-opening">
          <div class="vbg-opening-claim">
            <a class="vbg-custom-back-link" href="${escapeHtml(localePath(locale, '/'))}#agent-messages">${escapeHtml(messages.post.backLink)}</a>
            <h1 class="vbg-title">${escapeHtml(g.heading)}</h1>
            <p class="vbg-lede">${escapeHtml(g.lede)}</p>
          </div>
        </section>
        ${renderAgentGuideSection({ messages, skipIntro: true })}`;

  return renderPageShell({
    locale,
    messages,
    title: g.pageTitle,
    documentMeta: [messages.documentMeta.agentApi, messages.documentMeta.readOnly],
    currentPathname,
    main,
    scripts: `${renderCopyScript()}${renderKeyboardShortcutsScript(localePath(locale, '/docs'))}`,
  });
}
