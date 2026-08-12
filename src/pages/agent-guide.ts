import { SKILL_EXAMPLES } from '../content/skill-examples';
import type { Messages } from '../i18n';
import { escapeHtml } from './layout';
import { renderExampleBlock, renderSkillInstallBlock } from './skill-install-block';

export { renderSkillInstallBlock } from './skill-install-block';

type AgentGuideOptions = {
  messages: Messages;
  docsPath?: string;
  skipIntro?: boolean;
  includeSkillInstall?: boolean;
};

export function renderAgentGuideSection(options: AgentGuideOptions): string {
  const g = options.messages.agentGuide;
  const exampleLabels = g.examples;

  const examplesMarkup = SKILL_EXAMPLES.map((example) =>
    renderExampleBlock(
      example.id,
      exampleLabels[example.id],
      example.command,
      g.copyLabel,
      g.copiedLabel,
    ),
  ).join('');

  const rulesMarkup = g.rules.map((rule) => `<li class="vbg-body">${escapeHtml(rule)}</li>`).join('\n            ');

  const conventionsMarkup = g.conventions
    .map(
      (item) => `
            <div class="vbg-custom-guide-item">
              <h3 class="vbg-heading-16">${escapeHtml(item.title)}</h3>
              <p class="vbg-body">${escapeHtml(item.body)}</p>
            </div>`,
    )
    .join('');

  const keyboardMarkup = g.keyboardRows
    .map(
      (row) => `
                <tr>
                  <th scope="row">${escapeHtml(row.action)}</th>
                  <td class="vbg-mono">${escapeHtml(row.keys)}</td>
                </tr>`,
    )
    .join('');

  const apiRowsMarkup = g.apiRows
    .map(
      (row) => `
                <tr>
                  <th scope="row" class="vbg-mono">${escapeHtml(row.method)}</th>
                  <td class="vbg-mono"><a class="vbg-custom-api-link" href="${escapeHtml(row.path)}">${escapeHtml(row.path)}</a></td>
                  <td>${escapeHtml(row.purpose)}</td>
                </tr>`,
    )
    .join('');

  const errorsRowsMarkup = g.errorsRows
    .map(
      (row) => `
                <tr>
                  <td class="vbg-mono">${escapeHtml(row.endpoint)}</td>
                  <td class="vbg-mono">${escapeHtml(row.code)}</td>
                  <td>${escapeHtml(String(row.status))}</td>
                  <td>${escapeHtml(row.condition)}</td>
                  <td>${escapeHtml(row.action)}</td>
                </tr>`,
    )
    .join('');

  const docsLink = options.docsPath
    ? `<p class="vbg-body"><a class="vbg-custom-read-link" href="${escapeHtml(options.docsPath)}">${escapeHtml(g.fullDocsLink)}</a></p>`
    : '';

  const securityMarkup = g.securityRules
    .map((rule) => `<li class="vbg-body">${escapeHtml(rule)}</li>`)
    .join('\n            ');

  const introMarkup = options.skipIntro
    ? ''
    : `
          <h2 class="vbg-heading-24">${escapeHtml(g.heading)}</h2>
          <p class="vbg-lede">${escapeHtml(g.lede)}</p>`;

  const installMarkup =
    options.includeSkillInstall === false
      ? ''
      : renderSkillInstallBlock({
          messages: options.messages,
          blockId: 'guide-install',
          headingLevel: '20',
          showDocsLink: false,
        });

  const skillFileNoteMarkup =
    options.includeSkillInstall === false
      ? ''
      : `<p class="vbg-caption">${escapeHtml(g.skillFileNote)}</p>`;

  return `
        <section id="agent-guide" class="vbg-section vbg-span-12">
          ${introMarkup}
          ${installMarkup}
          ${skillFileNoteMarkup}

          <h3 class="vbg-heading-20">${escapeHtml(g.rulesHeading)}</h3>
          <ul class="vbg-flow vbg-custom-guide-list">
            ${rulesMarkup}
          </ul>

          <h3 class="vbg-heading-20">${escapeHtml(g.securityHeading)}</h3>
          <ul class="vbg-flow vbg-custom-guide-list">
            ${securityMarkup}
          </ul>

          <h3 class="vbg-heading-20">${escapeHtml(g.conventionsHeading)}</h3>
          <div class="vbg-flow vbg-custom-guide-conventions">
            ${conventionsMarkup}
          </div>

          <h3 class="vbg-heading-20">${escapeHtml(g.topicsHeading)}</h3>
          <p class="vbg-body">${escapeHtml(g.topicsBody)}</p>

          <h3 class="vbg-heading-20">${escapeHtml(g.languageHeading)}</h3>
          <p class="vbg-body">${escapeHtml(g.languageBody)}</p>

          <h3 class="vbg-heading-20">${escapeHtml(g.footnoteHeading)}</h3>
          <p class="vbg-body">${escapeHtml(g.footnoteBody)}</p>

          <h3 class="vbg-heading-20">${escapeHtml(g.apiHeading)}</h3>
          <div class="vbg-table-wrap">
            <table>
              <caption class="vbg-visually-hidden">${escapeHtml(g.apiTableCaption)}</caption>
              <thead>
                <tr>
                  <th scope="col">${escapeHtml(g.apiColMethod)}</th>
                  <th scope="col">${escapeHtml(g.apiColPath)}</th>
                  <th scope="col">${escapeHtml(g.apiColPurpose)}</th>
                </tr>
              </thead>
              <tbody>
                ${apiRowsMarkup}
              </tbody>
            </table>
          </div>

          <h3 class="vbg-heading-20">${escapeHtml(g.errorsHeading)}</h3>
          <p class="vbg-caption">${escapeHtml(g.errorsCaption)}</p>
          <div class="vbg-table-wrap">
            <table>
              <caption class="vbg-visually-hidden">${escapeHtml(g.errorsTableCaption)}</caption>
              <thead>
                <tr>
                  <th scope="col">${escapeHtml(g.errorsColEndpoint)}</th>
                  <th scope="col">${escapeHtml(g.errorsColCode)}</th>
                  <th scope="col">${escapeHtml(g.errorsColStatus)}</th>
                  <th scope="col">${escapeHtml(g.errorsColCondition)}</th>
                  <th scope="col">${escapeHtml(g.errorsColAction)}</th>
                </tr>
              </thead>
              <tbody>
                ${errorsRowsMarkup}
              </tbody>
            </table>
          </div>

          <h3 class="vbg-heading-20">${escapeHtml(g.examplesHeading)}</h3>
          <p class="vbg-caption">${escapeHtml(g.examplesCaption)}</p>
          <div class="vbg-flow vbg-custom-examples">
            ${examplesMarkup}
          </div>

          <h3 class="vbg-heading-20">${escapeHtml(g.keyboardHeading)}</h3>
          <p class="vbg-caption">${escapeHtml(g.keyboardCaption)}</p>
          <div class="vbg-table-wrap">
            <table>
              <caption class="vbg-visually-hidden">${escapeHtml(g.keyboardTableCaption)}</caption>
              <thead>
                <tr>
                  <th scope="col">${escapeHtml(g.keyboardColAction)}</th>
                  <th scope="col">${escapeHtml(g.keyboardColKeys)}</th>
                </tr>
              </thead>
              <tbody>
                ${keyboardMarkup}
              </tbody>
            </table>
          </div>
          ${docsLink}
        </section>`;
}
