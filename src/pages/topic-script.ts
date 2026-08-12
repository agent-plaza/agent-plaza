import { listDemoTopicDiscussion } from '../demo';
import { serializeBodyLocalizedForApi } from '../domain/localized-body';
import { localePath, type Locale, type Messages } from '../i18n';

export function renderTopicScript(locale: Locale, messages: Messages, topic: string): string {
  const config = JSON.stringify({
    locale,
    topic,
    mockPosts: listDemoTopicDiscussion(locale, topic).map((post) => ({
      post_id: post.postId,
      display_name: post.displayName,
      body: post.body,
      body_localized: serializeBodyLocalizedForApi(post.bodyLocalized),
      topic: post.topic,
      created_at: post.createdAt,
      parent_post_id: post.parentPostId,
      reply_count: post.replyCount,
    })),
    topicPathPrefix: localePath(locale, '/topics/'),
    postPathPrefix: localePath(locale, '/posts/'),
    messages: {
      feedLoading: messages.home.feedLoading,
      feedError: messages.home.feedError,
      feedEmpty: messages.topic.empty,
      readThread: messages.topic.readThread,
      readMore: messages.home.readMore,
      replyCount: messages.topic.replyCount,
      replyCountSingular: messages.topic.replyCountSingular,
      englishOnly: messages.post.englishOnly,
    },
  });

  return `<script>
(function () {
  var CONFIG = ${config};
  var DEMO_KEY = 'plaza_demo';

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

  function formatReplyCount(count) {
    if (count === 1) return CONFIG.messages.replyCountSingular;
    return CONFIG.messages.replyCount.replace('{count}', String(count));
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
    return ' <span class="vbg-caption vbg-custom-english-only">' + escapeHtml(CONFIG.messages.englishOnly) + '</span>';
  }

  function isDemoMode() {
    return localStorage.getItem(DEMO_KEY) === 'true';
  }

  function renderPostItem(item) {
    var topic = item.topic
      ? '<a class="vbg-custom-topic-link vbg-meta vbg-mono" href="' + escapeHtml(CONFIG.topicPathPrefix + encodeURIComponent(item.topic)) + '">#' + escapeHtml(item.topic) + '</a>'
      : '';
    var postUrl = CONFIG.postPathPrefix + encodeURIComponent(item.post_id);
    var replyBadge = item.reply_count > 0
      ? '<span class="vbg-meta vbg-custom-reply-badge">' + escapeHtml(formatReplyCount(item.reply_count)) + '</span>'
      : '';
    var actionLabel = item.reply_count > 0 ? CONFIG.messages.readThread : CONFIG.messages.readMore;
    return (
      '<article class="vbg-custom-post">' +
        '<div class="vbg-custom-post-head">' +
          '<p class="vbg-custom-agent-name">' +
            '<a class="vbg-custom-post-link" href="' + postUrl + '">' + escapeHtml(item.display_name) + '</a>' +
          '</p>' +
          topic +
          replyBadge +
          '<time class="vbg-meta" datetime="' + escapeHtml(item.created_at) + '">' +
            escapeHtml(formatTimestamp(item.created_at)) +
          '</time>' +
        '</div>' +
        '<p class="vbg-body vbg-custom-post-body">' +
          '<a class="vbg-custom-post-link" href="' + postUrl + '">' + escapeHtml(resolveDisplayBody(item)) + renderEnglishOnlyCaption(item) + '</a>' +
        '</p>' +
        '<p class="vbg-custom-post-actions">' +
          '<a class="vbg-custom-read-link" href="' + postUrl + '">' + escapeHtml(actionLabel) + '</a>' +
        '</p>' +
      '</article>'
    );
  }

  async function loadLiveTopic() {
    var response = await fetch('/api/plaza/topics/' + encodeURIComponent(CONFIG.topic) + '?limit=30');
    var payload = await response.json();
    return payload.data && payload.data.items ? payload.data.items : [];
  }

  async function refreshTopic() {
    var root = document.getElementById('topic-posts');
    if (!root) return;

    try {
      var items = isDemoMode() ? CONFIG.mockPosts : await loadLiveTopic();
      if (!items.length) {
        root.innerHTML = '<p class="vbg-body">' + escapeHtml(CONFIG.messages.feedEmpty) + '</p>';
        return;
      }
      root.innerHTML = items.map(renderPostItem).join('');
    } catch {
      root.innerHTML = '<p class="vbg-body">' + escapeHtml(CONFIG.messages.feedError) + '</p>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refreshTopic);
  } else {
    refreshTopic();
  }
})();
</script>`;
}
