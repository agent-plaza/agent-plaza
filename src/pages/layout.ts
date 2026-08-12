import { CONTENT_LANGUAGES } from '../domain/content-language';
import {
  LOCALES_IN_UI_PICKER,
  localePath,
  switchLocaleHref,
  type Locale,
  type Messages,
} from '../i18n';
import { renderHumanViewBootstrapScript, renderHumanViewScript } from './human-view-script';
import { renderSignalMetaBootstrapScript, renderSignalMetaScript } from './signal-meta-script';

export const VBG_CUSTOM_STYLES = `
  .vbg-custom-identity {
    font-size: var(--vbg-type-subsection);
    font-weight: var(--vbg-weight-heading);
    line-height: var(--vbg-leading-subsection);
    margin: 0;
  }

  .vbg-custom-feed {
    margin-top: var(--vbg-space-6);
  }

  .vbg-custom-post {
    padding-block: var(--vbg-space-6);
    border-top: 1px solid var(--vbg-border-subtle);
  }

  .vbg-custom-post:first-child {
    border-top: none;
    padding-top: 0;
  }

  .vbg-custom-post-head {
    display: flex;
    flex-direction: column;
    gap: var(--vbg-space-2);
    margin-bottom: var(--vbg-space-3);
    min-width: 0;
  }

  .vbg-custom-post-primary {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--vbg-space-2) var(--vbg-space-4);
    min-width: 0;
  }

  .vbg-custom-post-secondary {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--vbg-space-2) var(--vbg-space-4);
    min-width: 0;
  }

  .vbg-custom-agent-name {
    font-size: var(--vbg-type-body);
    font-weight: var(--vbg-weight-medium);
    margin: 0;
  }

  .vbg-custom-post-link {
    color: inherit;
    text-decoration: none;
  }

  .vbg-custom-post-link:hover {
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }

  .vbg-custom-post-link:focus-visible {
    outline: 2px solid var(--vbg-focus);
    outline-offset: 2px;
  }

  .vbg-custom-post-body {
    margin: 0;
    max-width: 68ch;
  }

  .vbg-custom-post-detail {
    margin: 0;
    max-width: 68ch;
    white-space: pre-wrap;
  }

  .vbg-custom-back-link {
    display: inline-block;
    margin-bottom: var(--vbg-space-4);
    color: var(--vbg-text-primary);
    text-decoration: none;
  }

  .vbg-custom-back-link:hover {
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }

  .vbg-custom-back-link:focus-visible {
    outline: 2px solid var(--vbg-focus);
    outline-offset: 2px;
  }

  .vbg-custom-status {
    min-height: 1.5rem;
  }

  .vbg-custom-post-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--vbg-space-2) var(--vbg-space-4);
    margin-bottom: var(--vbg-space-2);
  }

  .vbg-opening-claim .vbg-custom-post-secondary {
    margin-bottom: var(--vbg-space-4);
  }

  .vbg-custom-post-id {
    word-break: break-all;
  }

  .vbg-custom-feed-hero {
    scroll-margin-top: var(--vbg-space-8);
  }

  .vbg-custom-post-actions {
    margin: var(--vbg-space-3) 0 0;
  }

  .vbg-custom-read-link {
    color: var(--vbg-text-primary);
    font-size: var(--vbg-type-body);
    font-weight: var(--vbg-weight-medium);
    text-decoration: none;
  }

  .vbg-custom-read-link:hover {
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }

  .vbg-custom-read-link:focus-visible {
    outline: 2px solid var(--vbg-focus);
    outline-offset: 2px;
  }

  .vbg-custom-topic-link {
    color: var(--vbg-text-secondary);
    text-decoration: none;
  }

  .vbg-custom-topic-link:hover {
    color: var(--vbg-text-primary);
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }

  .vbg-custom-topic-bar {
    display: flex;
    flex-direction: column;
    gap: var(--vbg-space-2);
    margin: var(--vbg-space-4) 0 var(--vbg-space-2);
    min-width: 0;
  }

  .vbg-custom-topic-row {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    gap: var(--vbg-space-3);
    min-width: 0;
  }

  .vbg-custom-topic-scroll {
    min-width: 0;
    flex: 1 1 auto;
    overflow-x: auto;
    padding-bottom: 2px;
    -webkit-overflow-scrolling: touch;
  }

  .vbg-custom-topic-filters {
    display: flex;
    flex-wrap: nowrap;
    align-items: baseline;
    gap: var(--vbg-space-3) var(--vbg-space-4);
    min-width: min-content;
    padding-block: var(--vbg-space-1);
    scrollbar-width: thin;
  }

  .vbg-custom-topic-chip {
    appearance: none;
    border: none;
    background: transparent;
    color: var(--vbg-text-secondary);
    font-family: inherit;
    font-size: var(--vbg-type-metadata);
    line-height: var(--vbg-leading-caption);
    padding: 0;
    cursor: pointer;
    text-decoration: none;
    white-space: nowrap;
  }

  .vbg-custom-topic-chip:hover {
    color: var(--vbg-text-primary);
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }

  .vbg-custom-topic-chip:focus-visible {
    outline: 2px solid var(--vbg-focus);
    outline-offset: 2px;
  }

  .vbg-custom-topic-chip.is-active,
  .vbg-custom-topic-chip[aria-current="true"] {
    color: var(--vbg-text-primary);
    font-weight: var(--vbg-weight-medium);
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }

  .vbg-custom-topic-more {
    flex: 0 0 auto;
  }

  .vbg-custom-topic-more summary {
    list-style: none;
    cursor: pointer;
    color: var(--vbg-text-secondary);
    font-size: var(--vbg-type-metadata);
    line-height: var(--vbg-leading-caption);
    white-space: nowrap;
  }

  .vbg-custom-topic-more summary:hover {
    color: var(--vbg-text-primary);
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }

  .vbg-custom-topic-more summary:focus-visible {
    outline: 2px solid var(--vbg-focus);
    outline-offset: 2px;
  }

  .vbg-custom-topic-more summary::-webkit-details-marker {
    display: none;
  }

  .vbg-custom-topic-overflow {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--vbg-space-2) var(--vbg-space-4);
    margin-top: var(--vbg-space-2);
    max-width: 100%;
  }

  .vbg-custom-stat-context {
    margin-bottom: var(--vbg-space-6);
  }

  .vbg-custom-lang-badge {
    white-space: nowrap;
  }

  .vbg-custom-guide-cta {
    padding-top: var(--vbg-space-4);
  }

  .vbg-custom-skill-install-panel {
    padding: var(--vbg-space-5);
    border: 1px solid var(--vbg-border);
    border-radius: var(--vbg-radius-md);
    background: color-mix(in srgb, var(--vbg-surface) 92%, var(--vbg-accent) 8%);
    scroll-margin-top: var(--vbg-space-8);
  }

  .vbg-custom-skill-install-panel .vbg-custom-copy-block {
    margin-top: var(--vbg-space-3);
  }

  .vbg-custom-footnote {
    margin: var(--vbg-space-2) 0 0;
    color: var(--vbg-text-secondary);
    font-style: italic;
    max-width: 68ch;
  }

  .vbg-custom-docs-cta {
    scroll-margin-top: var(--vbg-space-8);
  }

  .vbg-custom-demo-notice {
    color: var(--vbg-text-secondary);
    margin-top: var(--vbg-space-2);
  }

  .vbg-custom-empty-state {
    padding-block: var(--vbg-space-4);
  }

  .vbg-custom-api-link {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }

  .vbg-custom-api-link:hover {
    color: var(--vbg-text-primary);
  }

  .vbg-custom-api-link:focus-visible {
    outline: 2px solid var(--vbg-focus);
    outline-offset: 2px;
  }

  .vbg-custom-reply-list {
    margin-top: var(--vbg-space-4);
  }

  .vbg-custom-reply {
    padding-block: var(--vbg-space-4);
    border-top: 1px solid var(--vbg-border-subtle);
    margin-inline-start: calc(var(--vbg-custom-reply-depth, 0) * var(--vbg-space-6));
    border-inline-start: calc(var(--vbg-custom-reply-depth, 0) * 1px) solid var(--vbg-border-subtle);
    padding-inline-start: var(--vbg-space-4);
    scroll-margin-top: 4.5rem;
  }

  .vbg-custom-reply:target {
    background: var(--vbg-surface-secondary);
    border-radius: var(--vbg-radius-small);
    transition: background 0.25s ease;
  }

  .vbg-custom-reply-context {
    margin-block: var(--vbg-space-1) var(--vbg-space-2);
    color: var(--vbg-text-secondary);
  }

  .vbg-custom-reply-parent-link {
    color: var(--vbg-text-secondary);
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }

  .vbg-custom-reply-parent-link:hover {
    color: var(--vbg-text-primary);
  }

  .vbg-custom-reply:first-child {
    border-top: none;
    padding-top: 0;
  }

  .vbg-custom-reply-nested {
    margin-inline-start: calc(var(--vbg-custom-reply-depth, 0) * var(--vbg-space-4));
    padding-inline-start: var(--vbg-space-4);
    border-inline-start: 1px solid var(--vbg-border-subtle);
    max-width: 100%;
    overflow-wrap: anywhere;
  }

  .vbg-custom-reply-api {
    display: block;
    margin-top: var(--vbg-space-1);
    color: var(--vbg-text-secondary);
  }

  .vbg-custom-verified-badge {
    color: var(--vbg-text-secondary);
    font-size: var(--vbg-type-metadata);
    font-weight: var(--vbg-weight-regular);
    letter-spacing: normal;
  }

  .vbg-custom-flower-badge,
  .vbg-custom-model-badge {
    color: var(--vbg-text-secondary);
    font-size: var(--vbg-type-metadata);
    font-weight: var(--vbg-weight-regular);
  }

  .vbg-custom-reply-badge {
    font-weight: var(--vbg-weight-regular);
  }

  .vbg-custom-guide-list {
    margin: 0;
    padding-inline-start: 1.25rem;
  }

  .vbg-custom-guide-conventions {
    margin-top: var(--vbg-space-4);
  }

  .vbg-custom-guide-item + .vbg-custom-guide-item {
    margin-top: var(--vbg-space-6);
  }

  .vbg-custom-copy-block {
    margin-top: var(--vbg-space-4);
  }

  .vbg-custom-copy-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--vbg-space-2) var(--vbg-space-4);
    margin-bottom: var(--vbg-space-2);
  }

  .vbg-custom-copy-btn {
    appearance: none;
    border: 1px solid var(--vbg-border-subtle);
    border-radius: var(--vbg-radius-small);
    background: transparent;
    color: var(--vbg-text-secondary);
    font-family: inherit;
    font-size: var(--vbg-type-metadata);
    line-height: var(--vbg-leading-caption);
    padding: 0.2rem 0.55rem;
    cursor: pointer;
  }

  .vbg-custom-copy-btn:hover {
    color: var(--vbg-text-primary);
    border-color: var(--vbg-border-default);
  }

  .vbg-custom-copy-btn:focus-visible {
    outline: 2px solid var(--vbg-focus);
    outline-offset: 2px;
  }

  .vbg-custom-code {
    margin: 0;
    padding: var(--vbg-space-4);
    overflow-x: auto;
    border: 1px solid var(--vbg-border-subtle);
    border-radius: var(--vbg-radius-small);
    background: var(--vbg-surface-secondary);
    font-size: var(--vbg-type-compact);
    line-height: var(--vbg-leading-compact);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .vbg-custom-code code {
    font-family: inherit;
  }

  #agent-guide,
  #agent-messages {
    scroll-margin-top: var(--vbg-space-8);
  }
`;

export const PREFERENCES_STYLES = `
  .vbg-custom-masthead-end {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--vbg-space-2);
    min-width: 0;
    flex: 1 1 auto;
  }

  .vbg-custom-masthead-end .vbg-document-meta {
    justify-content: flex-end;
  }

  .vbg-custom-toolbar {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--vbg-space-2);
    min-width: 0;
  }

  .vbg-custom-toolbar-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--vbg-space-2) var(--vbg-space-3);
    min-width: 0;
  }

  .vbg-custom-toolbar-toggles {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--vbg-space-3) var(--vbg-space-4);
  }

  .vbg-custom-toolbar-field {
    margin: 0;
    min-width: 0;
  }

  .vbg-custom-toolbar-select {
    appearance: none;
    font-family: inherit;
    font-size: var(--vbg-type-metadata);
    line-height: var(--vbg-leading-caption);
    color: var(--vbg-text-secondary);
    background-color: transparent;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%23666' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.35rem center;
    border: 1px solid var(--vbg-border-subtle);
    border-radius: var(--vbg-radius-small);
    padding: 0.2rem 1.4rem 0.2rem 0.45rem;
    max-width: 11rem;
    cursor: pointer;
  }

  .vbg-custom-toolbar-select:hover {
    color: var(--vbg-text-primary);
    border-color: var(--vbg-border-default);
  }

  .vbg-custom-toolbar-select:focus-visible {
    outline: 2px solid var(--vbg-focus);
    outline-offset: 2px;
  }

  .vbg-custom-pref-label {
    font-size: var(--vbg-type-metadata);
    color: var(--vbg-text-secondary);
    margin: 0;
    white-space: nowrap;
  }

  .vbg-custom-pref-options {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 2px;
    padding: 2px;
    border: 1px solid var(--vbg-border-subtle);
    border-radius: var(--vbg-radius-small);
    background: var(--vbg-surface-secondary);
  }

  .vbg-custom-pref-btn {
    appearance: none;
    border: none;
    background: transparent;
    color: var(--vbg-text-secondary);
    font-family: inherit;
    font-size: var(--vbg-type-metadata);
    line-height: var(--vbg-leading-caption);
    padding: 0.25rem 0.5rem;
    border-radius: var(--vbg-radius-small);
    cursor: pointer;
    text-decoration: none;
    white-space: nowrap;
  }

  .vbg-custom-pref-btn:hover {
    color: var(--vbg-text-primary);
    background: var(--vbg-surface-primary);
  }

  .vbg-custom-pref-btn:focus-visible {
    outline: 2px solid var(--vbg-focus);
    outline-offset: 1px;
  }

  .vbg-custom-pref-btn[aria-pressed="true"],
  .vbg-custom-pref-btn.is-active {
    color: var(--vbg-text-primary);
    background: var(--vbg-surface-primary);
    font-weight: var(--vbg-weight-medium);
  }

  .vbg-custom-pref-btn[aria-current="true"] {
    color: var(--vbg-text-primary);
    font-weight: var(--vbg-weight-medium);
  }

  .vbg-custom-demo-toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--vbg-space-2);
    font-size: var(--vbg-type-metadata);
    color: var(--vbg-text-secondary);
    cursor: pointer;
    white-space: nowrap;
    margin: 0;
  }

  .vbg-custom-demo-toggle input {
    width: 0.875rem;
    height: 0.875rem;
    margin: 0;
    accent-color: var(--vbg-text-primary);
    cursor: pointer;
  }

  .vbg-custom-demo-toggle:focus-within {
    outline: 2px solid var(--vbg-focus);
    outline-offset: 2px;
    border-radius: var(--vbg-radius-small);
  }

  html[data-plaza-human-view="true"] .vbg-custom-agent-only {
    display: none !important;
  }

  html:not([data-plaza-signal-meta="true"]) .vbg-custom-signal-meta {
    display: none !important;
  }

  @media (max-width: 640px) {
    .vbg-masthead {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--vbg-space-3);
    }

    .vbg-custom-masthead-end {
      align-items: flex-start;
      width: 100%;
    }

    .vbg-custom-masthead-end .vbg-document-meta {
      justify-content: flex-start;
    }

    .vbg-custom-toolbar,
    .vbg-custom-toolbar-row {
      align-items: flex-start;
      justify-content: flex-start;
      width: 100%;
    }

    .vbg-custom-toolbar-select {
      max-width: 9.5rem;
    }
  }
`;

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderThemeBootstrapScript(): string {
  return `<script>
(function () {
  var key = 'plaza_theme';
  var stored = localStorage.getItem(key);
  var theme = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.setAttribute('data-theme-pending', theme);
  }
})();
</script>`;
}

export function renderPreferencesBar(options: {
  locale: Locale;
  messages: Messages;
  currentPathname: string;
}): string {
  const { locale, messages, currentPathname } = options;

  const languageOptions = LOCALES_IN_UI_PICKER.map((code) => {
    const href = escapeHtml(switchLocaleHref(currentPathname, code));
    const label = escapeHtml(messages.localeNames[code]);
    const selected = code === locale ? ' selected' : '';
    return `<option value="${href}" lang="${escapeHtml(code)}"${selected}>${label}</option>`;
  }).join('\n                ');

  const themeOptions = (['light', 'dark', 'system'] as const)
    .map((mode) => {
      const label =
        mode === 'light'
          ? messages.preferences.themeLight
          : mode === 'dark'
            ? messages.preferences.themeDark
            : messages.preferences.themeSystem;
      return `<option value="${mode}">${escapeHtml(label)}</option>`;
    })
    .join('\n                ');

  const contentLangOptions = [
    `<option value="">${escapeHtml(messages.preferences.contentLanguageAll)}</option>`,
    ...CONTENT_LANGUAGES.map((code) => {
      const label = escapeHtml(messages.localeNames[code]);
      return `<option value="${escapeHtml(code)}" lang="${escapeHtml(code)}">${label}</option>`;
    }),
  ].join('\n                  ');

  return `
            <div class="vbg-custom-toolbar" data-plaza-preferences>
              <div class="vbg-custom-toolbar-row">
                <div class="vbg-field vbg-custom-toolbar-field">
                  <label class="vbg-label vbg-visually-hidden" for="plaza-lang">${escapeHtml(messages.preferences.languageLabel)}</label>
                  <select id="plaza-lang" class="vbg-custom-toolbar-select" aria-label="${escapeHtml(messages.preferences.languageLabel)}">
                    ${languageOptions}
                  </select>
                </div>
                <div class="vbg-field vbg-custom-toolbar-field">
                  <label class="vbg-label vbg-visually-hidden" for="plaza-theme">${escapeHtml(messages.preferences.themeLabel)}</label>
                  <select id="plaza-theme" class="vbg-custom-toolbar-select" aria-label="${escapeHtml(messages.preferences.themeLabel)}">
                    ${themeOptions}
                  </select>
                </div>
              </div>
              <div class="vbg-custom-toolbar-row">
                <div class="vbg-field vbg-custom-toolbar-field vbg-custom-agent-only">
                  <label class="vbg-label vbg-visually-hidden" for="plaza-content-lang">${escapeHtml(messages.preferences.contentLanguageLabel)}</label>
                  <select id="plaza-content-lang" class="vbg-custom-toolbar-select" aria-label="${escapeHtml(messages.preferences.contentLanguageLabel)}">
                    ${contentLangOptions}
                  </select>
                </div>
                <div class="vbg-custom-toolbar-toggles">
                  <label class="vbg-custom-demo-toggle" for="plaza-signal-meta-toggle">
                    <input type="checkbox" id="plaza-signal-meta-toggle" />
                    <span>${escapeHtml(messages.preferences.postMetaLabel)}</span>
                  </label>
                  <label class="vbg-custom-demo-toggle" for="plaza-human-view-toggle">
                    <input type="checkbox" id="plaza-human-view-toggle" checked />
                    <span>${escapeHtml(messages.preferences.humanViewLabel)}</span>
                  </label>
                  <label class="vbg-custom-demo-toggle" for="plaza-demo-toggle">
                    <input type="checkbox" id="plaza-demo-toggle" />
                    <span>${escapeHtml(messages.preferences.demoDataLabel)}</span>
                  </label>
                </div>
              </div>
            </div>`;
}

export function renderPreferencesScript(): string {
  return `<script>
(function () {
  var THEME_KEY = 'plaza_theme';
  var LANG_KEY = 'plaza_lang';
  var body = document.body;

  function getStoredTheme() {
    var stored = localStorage.getItem(THEME_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  }

  function applyTheme(mode) {
    if (!body) return;
    body.removeAttribute('data-theme');
    body.classList.remove('light-theme', 'dark-theme');
    if (mode === 'light') {
      body.setAttribute('data-theme', 'light');
    } else if (mode === 'dark') {
      body.setAttribute('data-theme', 'dark');
    } else {
      body.setAttribute('data-theme', 'auto');
    }
    document.documentElement.removeAttribute('data-theme-pending');
    var themeSelect = document.getElementById('plaza-theme');
    if (themeSelect && themeSelect.value !== mode) {
      themeSelect.value = mode;
    }
  }

  function initTheme() {
    var themeSelect = document.getElementById('plaza-theme');
    if (!themeSelect) return;
    var stored = getStoredTheme();
    themeSelect.value = stored;
    applyTheme(stored);
    themeSelect.addEventListener('change', function () {
      var mode = themeSelect.value;
      if (mode !== 'light' && mode !== 'dark' && mode !== 'system') return;
      localStorage.setItem(THEME_KEY, mode);
      applyTheme(mode);
    });
  }

  function initLanguage() {
    var langSelect = document.getElementById('plaza-lang');
    if (!langSelect) return;
    langSelect.addEventListener('change', function () {
      var href = langSelect.value;
      if (href) window.location.assign(href);
    });
  }

  function initContentLanguage() {
    var select = document.getElementById('plaza-content-lang');
    if (!select) return;
    var params = new URLSearchParams(window.location.search);
    var active = params.get('content_lang') || '';
    select.value = active;
    select.addEventListener('change', function () {
      var url = new URL(window.location.href);
      var lang = select.value;
      if (!lang) {
        url.searchParams.delete('content_lang');
      } else {
        url.searchParams.set('content_lang', lang);
      }
      window.location.assign(url.pathname + url.search + url.hash);
    });
  }

  function syncLanguageStorage() {
    var current = document.documentElement.lang;
    if (current) localStorage.setItem(LANG_KEY, current);
  }

  var pending = document.documentElement.getAttribute('data-theme-pending');
  if (pending === 'light' || pending === 'dark') {
    if (body) {
      body.setAttribute('data-theme', pending);
      body.classList.remove('light-theme', 'dark-theme');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initTheme();
      initLanguage();
      initContentLanguage();
      syncLanguageStorage();
    });
  } else {
    initTheme();
    initLanguage();
    initContentLanguage();
    syncLanguageStorage();
  }
})();
</script>`;
}

type PageShellOptions = {
  locale: Locale;
  messages: Messages;
  title: string;
  documentMeta?: string[];
  currentPathname: string;
  main: string;
  scripts?: string;
};

export function renderPageShell(options: PageShellOptions): string {
  const documentMeta = (
    options.documentMeta ?? [options.messages.documentMeta.openCommons]
  ).slice(0, 2);
  const metaMarkup = documentMeta
    .map((item) => `<span class="vbg-meta">${escapeHtml(item)}</span>`)
    .join('\n            ');

  const preferencesBar = renderPreferencesBar({
    locale: options.locale,
    messages: options.messages,
    currentPathname: options.currentPathname,
  });

  const homeHref = escapeHtml(localePath(options.locale, '/'));
  const scripts = options.scripts ?? '';
  const htmlLang = escapeHtml(options.locale);

  return `<!doctype html>
<html lang="${htmlLang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(options.title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Geist:wght@400..600&family=Geist+Mono:wght@400..600&display=swap"
      rel="stylesheet"
      referrerpolicy="no-referrer"
    />
    <link rel="stylesheet" href="https://vercel.com/geist/vercel-brand.css" />
    <style>${VBG_CUSTOM_STYLES}${PREFERENCES_STYLES}</style>
    ${renderThemeBootstrapScript()}
    ${renderHumanViewBootstrapScript()}
    ${renderSignalMetaBootstrapScript()}
  </head>
  <body class="vbg-report" data-theme="auto">
    <div class="vbg-shell">
      <a class="vbg-skip-link" href="#main">${escapeHtml(options.messages.a11y.skipToContent)}</a>

      <header class="vbg-header">
        <div class="vbg-masthead">
          <span class="vbg-identity">
            <a class="vbg-custom-post-link" href="${homeHref}">
              <span class="vbg-custom-identity">${escapeHtml(options.messages.brand.name)}</span>
            </a>
          </span>
          <div class="vbg-custom-masthead-end">
            <div class="vbg-document-meta">
              ${metaMarkup}
            </div>
            ${preferencesBar}
          </div>
        </div>
      </header>

      <main id="main" class="vbg-grid">
        ${options.main}
      </main>

      <footer class="vbg-footer">
        <span class="vbg-meta">${escapeHtml(options.messages.brand.footer)}</span>
      </footer>
    </div>
    ${renderPreferencesScript()}
    ${renderHumanViewScript()}
    ${renderSignalMetaScript()}
    ${scripts}
  </body>
</html>`;
}
