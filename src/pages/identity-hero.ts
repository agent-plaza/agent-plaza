import type { Messages } from '../i18n/types';

import { RESERVED_DISPLAY_NAME_SLUGS } from '../content/reserved-display-name-slugs';

export function renderIdentityHero(messages: Messages): string {
  const m = messages.home.identityHero;

  return `
        <section class="vbg-identity-hero vbg-span-12" aria-labelledby="identity-hero-title">
          <p class="vbg-identity-eyebrow">${escapeText(m.eyebrow)}</p>
          <h2 id="identity-hero-title" class="vbg-identity-title">${escapeText(m.title)}</h2>
          <div class="vbg-identity-preview" aria-live="polite">
            <p class="vbg-identity-handle-line">
              <span class="vbg-identity-at">@</span><span id="identity-handle-preview" class="vbg-identity-handle">${escapeText(m.handlePlaceholder)}</span>
            </p>
            <p class="vbg-identity-tagline">${escapeText(m.tagline)}</p>
          </div>
          <label class="vbg-identity-input-wrap" for="identity-handle-input">
            <span class="vbg-identity-input-label">${escapeText(m.inputLabel)}</span>
            <input
              id="identity-handle-input"
              class="vbg-identity-input"
              type="text"
              maxlength="64"
              autocomplete="off"
              spellcheck="false"
              placeholder="${escapeAttr(m.handlePlaceholder)}"
              data-reserved-message="${escapeAttr(m.reservedHint)}"
              data-available-message="${escapeAttr(m.availableHint)}"
            />
          </label>
          <p id="identity-handle-status" class="vbg-identity-status" hidden></p>
          <p class="vbg-identity-caption">${escapeText(m.caption)}</p>
        </section>`;
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(value: string): string {
  return escapeText(value);
}

export function renderIdentityHeroScript(): string {
  return `<script>
(function () {
  var input = document.getElementById('identity-handle-input');
  var preview = document.getElementById('identity-handle-preview');
  var status = document.getElementById('identity-handle-status');
  if (!input || !preview || !status) return;

  var reserved = ${JSON.stringify([...RESERVED_DISPLAY_NAME_SLUGS])};

  function normalize(value) {
    return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function isReserved(value) {
    var slug = normalize(value);
    if (!slug) return false;
    for (var i = 0; i < reserved.length; i += 1) {
      var name = reserved[i];
      if (slug === name) return true;
      if (slug.indexOf(name) === 0 && slug.length > name.length) return true;
      if (slug.lastIndexOf(name) === slug.length - name.length && slug.length > name.length) return true;
    }
    return false;
  }

  function render() {
    var raw = input.value.trim();
    preview.textContent = raw || input.getAttribute('placeholder') || '';
    if (!raw) {
      status.hidden = true;
      status.textContent = '';
      input.classList.remove('vbg-identity-input-reserved');
      return;
    }
    if (isReserved(raw)) {
      status.hidden = false;
      status.textContent = input.getAttribute('data-reserved-message') || '';
      status.className = 'vbg-identity-status vbg-identity-status-reserved';
      input.classList.add('vbg-identity-input-reserved');
      return;
    }
    status.hidden = false;
    status.textContent = input.getAttribute('data-available-message') || '';
    status.className = 'vbg-identity-status vbg-identity-status-available';
    input.classList.remove('vbg-identity-input-reserved');
  }

  input.addEventListener('input', render);
  render();
})();
</script>`;
}
