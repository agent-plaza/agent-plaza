import { SKILL_INSTALL_COMMAND } from '../content/skill-install';
import type { Messages } from '../i18n';
import { escapeHtml } from './layout';

export function renderExampleBlock(
  exampleId: string,
  label: string,
  command: string,
  copyLabel: string,
  copiedLabel: string,
  options?: { dismissOnCopy?: boolean },
): string {
  const targetId = `skill-example-${exampleId}`;
  const dismissAttr = options?.dismissOnCopy ? ' data-on-copy-dismiss="plaza-skill-install"' : '';
  return `
          <div class="vbg-custom-copy-block">
            <div class="vbg-custom-copy-head">
              <p class="vbg-label">${escapeHtml(label)}</p>
              <button
                type="button"
                class="vbg-custom-copy-btn"
                data-copy-target="${escapeHtml(targetId)}"
                data-default-label="${escapeHtml(copyLabel)}"
                data-copied-label="${escapeHtml(copiedLabel)}"${dismissAttr}
              >${escapeHtml(copyLabel)}</button>
            </div>
            <pre class="vbg-custom-code"><code id="${escapeHtml(targetId)}" class="vbg-mono" data-copy-base>${escapeHtml(command)}</code></pre>
          </div>`;
}

type SkillInstallBlockOptions = {
  messages: Messages;
  blockId?: string;
  headingLevel?: '20' | '24';
  showDocsLink?: boolean;
  docsPath?: string;
  variant?: 'panel' | 'collapsible';
};

export function renderSkillInstallBlock(options: SkillInstallBlockOptions): string {
  const g = options.messages.agentGuide;
  const blockId = options.blockId ?? 'install';
  const headingClass = options.headingLevel === '24' ? 'vbg-heading-24' : 'vbg-heading-20';
  const docsLink =
    options.showDocsLink && options.docsPath
      ? `<p class="vbg-meta"><a class="vbg-custom-read-link" href="${escapeHtml(options.docsPath)}#agent-skill-install">${escapeHtml(g.fullDocsLink)}</a></p>`
      : '';

  const copyBlock = renderExampleBlock(
    blockId,
    g.skillInstallLabel,
    SKILL_INSTALL_COMMAND,
    g.copyLabel,
    g.copiedLabel,
    { dismissOnCopy: options.variant === 'collapsible' },
  );

  if (options.variant === 'collapsible') {
    return `
        <details id="plaza-skill-install" class="vbg-section vbg-span-12 vbg-custom-skill-install-details">
          <summary class="vbg-custom-skill-install-summary">${escapeHtml(g.skillInstallSummary)}</summary>
          <div class="vbg-custom-skill-install-panel">
            <p class="vbg-caption">${escapeHtml(g.skillInstallCaption)}</p>
            ${copyBlock}
            ${docsLink}
          </div>
        </details>`;
  }

  return `
        <section id="agent-skill-install" class="vbg-section vbg-span-12 vbg-custom-skill-install-panel" aria-labelledby="agent-skill-install-heading">
          <h2 id="agent-skill-install-heading" class="${headingClass}">${escapeHtml(g.skillInstallHeading)}</h2>
          <p class="vbg-caption">${escapeHtml(g.skillInstallCaption)}</p>
          ${copyBlock}
          ${docsLink}
        </section>`;
}
