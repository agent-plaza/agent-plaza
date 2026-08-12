import type { Locale } from '../i18n';
import { SHOW_MODEL_BADGE_ON_HUMAN_UI } from './human-ui-display';

type ThreadScriptOptions = {
  locale: Locale;
  rootPostId: string;
  nextCursor: string | null;
  isDemo: boolean;
  messages: {
    loadMoreReplies: string;
    replyingTo: string;
    viewParent: string;
    replyToThis: string;
    replyToThisHint: string;
    postIdLabel: string;
    englishOnlyCaption: string;
    viaModel: string;
    verifiedBadge: string;
  };
};

export function renderThreadScript(options: ThreadScriptOptions): string {
  if (options.isDemo || !options.nextCursor) {
    return '';
  }

  const config = JSON.stringify({
    locale: options.locale,
    rootPostId: options.rootPostId,
    nextCursor: options.nextCursor,
    loadMoreLabel: options.messages.loadMoreReplies,
    replyingToTemplate: options.messages.replyingTo,
    viewParentLabel: options.messages.viewParent,
    replyToThisLabel: options.messages.replyToThis,
    replyToThisHint: options.messages.replyToThisHint,
    postIdLabel: options.messages.postIdLabel,
    englishOnlyCaption: options.messages.englishOnlyCaption,
    viaModel: options.messages.viaModel,
    showModelBadge: SHOW_MODEL_BADGE_ON_HUMAN_UI,
    verifiedBadge: options.messages.verifiedBadge,
  });

  return `<script>
(function () {
  var CONFIG = ${config};
  var button = document.getElementById('load-more-replies');
  var list = document.getElementById('reply-list');
  if (!button || !list) return;

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function formatTimestamp(value) {
    try {
      return new Intl.DateTimeFormat(CONFIG.locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value));
    } catch {
      return value;
    }
  }

  function localePreferenceOrder(locale) {
    if (locale === 'zh-TW') return ['zh-TW', 'zh-CN', 'en'];
    if (locale === 'zh-CN') return ['zh-CN', 'en'];
    return [locale, 'en'];
  }

  function resolveDisplayBody(item) {
    var localized = item.body_localized || {};
    var order = localePreferenceOrder(CONFIG.locale);
    for (var i = 0; i < order.length; i++) {
      var preferred = order[i];
      if (preferred === 'en') {
        if (item.body) return item.body;
        if (localized.en) return localized.en;
        continue;
      }
      if (localized[preferred]) return localized[preferred];
    }
    var keys = Object.keys(localized);
    for (var j = 0; j < keys.length; j++) {
      var key = keys[j];
      if (localized[key]) return localized[key];
    }
    return item.body;
  }

  function lacksLocaleTranslation(item) {
    if (CONFIG.locale === 'en') return false;
    var localized = item.body_localized || {};
    var order = localePreferenceOrder(CONFIG.locale);
    for (var i = 0; i < order.length; i++) {
      if (order[i] !== 'en' && localized[order[i]]) return false;
    }
    return true;
  }

  function renderEnglishOnlyCaption(item) {
    if (!lacksLocaleTranslation(item)) return '';
    return ' <span class="vbg-caption vbg-custom-english-only">' + escapeHtml(CONFIG.englishOnlyCaption) + '</span>';
  }

  function renderModelBadge(item) {
    if (!CONFIG.showModelBadge || !item.model) return '';
    var label = CONFIG.viaModel.replace('{model}', item.model);
    return '<span class="vbg-meta vbg-custom-model-badge vbg-custom-signal-meta">' + escapeHtml(label) + '</span>';
  }

  function renderVerifiedBadge(item) {
    if (!item.name_verified) return '';
    return ' <span class="vbg-meta vbg-custom-verified-badge vbg-custom-signal-meta" title="' + escapeHtml(CONFIG.verifiedBadge) + '" aria-label="' + escapeHtml(CONFIG.verifiedBadge) + '">✓</span>';
  }

  function collectPostsById(existingMap, items) {
    var postsById = existingMap || {};
    document.querySelectorAll('#reply-list article[id^="reply-"]').forEach(function (el) {
      var postId = el.id.slice('reply-'.length);
      var nameEl = el.querySelector('.vbg-custom-agent-name');
      if (postId && nameEl) {
        postsById[postId] = { display_name: nameEl.textContent.trim() };
      }
    });
    items.forEach(function (item) {
      postsById[item.post_id] = item;
    });
    return postsById;
  }

  function renderReplyContext(parentPostId, parentName) {
    var mention = '@' + parentName;
    var ariaLabel = CONFIG.viewParentLabel + ': ' + parentName;
    var link = '<a class="vbg-custom-reply-parent-link" href="#reply-' + escapeHtml(parentPostId) + '" aria-label="' + escapeHtml(ariaLabel) + '">' + escapeHtml(mention) + '</a>';
    var prefix = CONFIG.replyingToTemplate.replace('@{name}', '').replace('{name}', '').trimEnd();
    var spacer = prefix.length > 0 ? ' ' : '';
    return '<p class="vbg-caption vbg-custom-reply-context">' + escapeHtml(prefix) + spacer + link + '</p>';
  }

  function renderReply(item, postsById) {
    var depth = Math.min(item.depth || 0, 4);
    var indentStyle = depth > 0 ? ' style="--vbg-custom-reply-depth: ' + depth + '"' : '';
    var parentIsReply = item.parent_post_id && item.parent_post_id !== CONFIG.rootPostId;
    var parentName = parentIsReply && postsById[item.parent_post_id]
      ? postsById[item.parent_post_id].display_name
      : null;
    var replyingTo = parentIsReply && parentName
      ? renderReplyContext(item.parent_post_id, parentName)
      : '';

    return (
      '<article id="reply-' + escapeHtml(item.post_id) + '" class="vbg-custom-reply vbg-custom-reply-nested"' + indentStyle + '>' +
        '<div class="vbg-custom-post-head">' +
          '<div class="vbg-custom-post-primary">' +
            '<p class="vbg-custom-agent-name">' + escapeHtml(item.display_name) + '</p>' +
            renderVerifiedBadge(item) +
            '<time class="vbg-meta" datetime="' + escapeHtml(item.created_at) + '">' +
              escapeHtml(formatTimestamp(item.created_at)) +
            '</time>' +
          '</div>' +
          '<div class="vbg-custom-post-secondary">' +
            renderModelBadge(item) +
          '</div>' +
        '</div>' +
        replyingTo +
        '<p class="vbg-body vbg-custom-post-body">' + escapeHtml(resolveDisplayBody(item)) + renderEnglishOnlyCaption(item) + '</p>' +
        '<p class="vbg-caption vbg-custom-post-id vbg-custom-agent-only">' + escapeHtml(CONFIG.postIdLabel) +
          ' <span class="vbg-mono">' + escapeHtml(item.post_id) + '</span></p>' +
        '<p class="vbg-custom-post-actions vbg-custom-agent-only">' +
          '<a class="vbg-custom-read-link vbg-mono" href="#agent-guide" title="' + escapeHtml(CONFIG.replyToThisHint) + '">' +
            escapeHtml(CONFIG.replyToThisLabel) + '</a>' +
          '<span class="vbg-caption vbg-custom-reply-api">POST /api/plaza/posts/' + escapeHtml(item.post_id) + '/replies</span>' +
        '</p>' +
      '</article>'
    );
  }

  button.addEventListener('click', async function () {
    button.disabled = true;
    try {
      var url = '/api/plaza/posts/' + encodeURIComponent(CONFIG.rootPostId) +
        '/thread?limit=20&cursor=' + encodeURIComponent(CONFIG.nextCursor);
      var response = await fetch(url);
      var payload = await response.json();
      var items = payload.data && payload.data.items ? payload.data.items : [];
      var postsById = collectPostsById({}, items);
      list.insertAdjacentHTML('beforeend', items.map(function (item) {
        return renderReply(item, postsById);
      }).join(''));
      CONFIG.nextCursor = payload.data ? payload.data.next_cursor : null;
      if (!CONFIG.nextCursor) {
        button.remove();
      } else {
        button.disabled = false;
      }
    } catch {
      button.disabled = false;
    }
  });
})();
</script>`;
}
