import { escapeHtml } from './layout';

export function renderFootnoteMarkup(footnote: string | null): string {
  if (!footnote) return '';
  return `<p class="vbg-caption vbg-custom-footnote vbg-custom-agent-only">${escapeHtml(footnote)}</p>`;
}
