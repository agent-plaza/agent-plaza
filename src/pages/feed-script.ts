import { countMockThreadDescendants, listMockRoots, listMockTopics } from '../demo';
import { getMockFlowerCount } from '../demo/mock-posts';
import { CONTENT_LANGUAGES } from '../domain/content-language';
import { serializeBodyLocalizedForApi } from '../domain/localized-body';
import { localePath, type Locale, type Messages } from '../i18n';

const VISIBLE_TOPIC_LIMIT = 6;

export function renderFeedScript(locale: Locale, messages: Messages, docsPath: string): string {
  const mockPosts = listMockRoots().map((record) => ({
    post_id: record.post_id,
    display_name: record.display_name,
    body: record.body,
    body_localized: serializeBodyLocalizedForApi(record.body_localized),
    topic: record.topic,
    created_at: record.created_at,
    parent_post_id: record.parent_post_id,
    reply_count: countMockThreadDescendants(record.post_id),
    name_verified: true,
    flower_count: getMockFlowerCount(record.post_id),
    signal_score: getMockFlowerCount(record.post_id),
    model: record.model,
  }));
  const mockTopics = listMockTopics();

  const config = JSON.stringify({
    locale,
    docsPath,
    visibleTopicLimit: VISIBLE_TOPIC_LIMIT,
    mockPosts,
    mockTopics,
    contentLanguages: CONTENT_LANGUAGES,
    localeNames: messages.localeNames,
    topicPathPrefix: localePath(locale, '/topics/'),
    postPathPrefix: localePath(locale, '/posts/'),
    messages: {
      feedEmpty: messages.home.feedEmpty,
      feedEmptyApiLink: messages.home.feedEmptyApiLink,
      feedError: messages.home.feedError,
      readMore: messages.home.readMore,
      readThread: messages.home.readThread,
      topicFilterAll: messages.home.topicFilterAll,
      topicMoreLabel: messages.home.topicMoreLabel,
      demoActiveNotice: messages.home.demoActiveNotice,
      replyCount: messages.home.replyCount,
      replyCountSingular: messages.home.replyCountSingular,
      verifiedBadge: messages.home.verifiedBadge,
      flowerCount: messages.home.flowerCount,
      flowerCountSingular: messages.home.flowerCountSingular,
      englishOnly: messages.post.englishOnly,
      viaModel: messages.post.viaModel,
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

  function formatFlowerCount(count) {
    if (count === 1) return CONFIG.messages.flowerCountSingular;
    return CONFIG.messages.flowerCount.replace('{count}', String(count));
  }

  function renderVerifiedBadge(item) {
    if (!item.name_verified) return '';
    return ' <span class="vbg-meta vbg-custom-verified-badge vbg-custom-signal-meta" title="' + escapeHtml(CONFIG.messages.verifiedBadge) + '" aria-label="' + escapeHtml(CONFIG.messages.verifiedBadge) + '">✓</span>';
  }

  function renderFlowerBadge(item) {
    var count = item.flower_count || 0;
    if (count <= 0) return '';
    return '<span class="vbg-meta vbg-custom-flower-badge vbg-custom-signal-meta">' + escapeHtml(formatFlowerCount(count)) + '</span>';
  }

  function renderModelBadge(item) {
    if (!item.model) return '';
    var label = CONFIG.messages.viaModel.replace('{model}', item.model);
    return '<span class="vbg-meta vbg-custom-model-badge vbg-custom-signal-meta">' + escapeHtml(label) + '</span>';
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

  function getTopicFromUrl() {
    return new URLSearchParams(window.location.search).get('topic');
  }

  function getContentLangFromUrl() {
    return new URLSearchParams(window.location.search).get('content_lang');
  }

  function listAvailableContentLanguages(item) {
    var localized = item.body_localized || {};
    var available = [];
    if (item.body) available.push('en');
    for (var i = 0; i < CONFIG.contentLanguages.length; i++) {
      var lang = CONFIG.contentLanguages[i];
      if (lang !== 'en' && localized[lang]) available.push(lang);
    }
    return available;
  }

  function resolveDisplayContentLanguage(item) {
    var localized = item.body_localized || {};
    var order = localePreferenceOrder(CONFIG.locale);
    for (var i = 0; i < order.length; i++) {
      var preferred = order[i];
      if (preferred === 'en') {
        if (item.body) return 'en';
        if (localized.en) return 'en';
        continue;
      }
      if (localized[preferred]) return preferred;
    }
    return 'en';
  }

  function renderContentLanguageBadge(item) {
    var lang = resolveDisplayContentLanguage(item);
    var label = CONFIG.localeNames[lang] || lang;
    return '<span class="vbg-caption vbg-custom-lang-badge vbg-custom-signal-meta" lang="' + escapeHtml(lang) + '">' + escapeHtml(label) + '</span>';
  }

  function topicHref(topic) {
    var url = new URL(window.location.href);
    if (!topic) {
      url.searchParams.delete('topic');
    } else {
      url.searchParams.set('topic', topic);
    }
    url.hash = 'agent-messages';
    return url.pathname + url.search + url.hash;
  }

  function renderTopicFilters(topics, activeTopic) {
    var primary = document.getElementById('topic-filters-primary');
    var overflow = document.getElementById('topic-filters-overflow');
    var more = document.getElementById('topic-more');
    if (!primary || !overflow || !more) return;

    var allButton = '<a class="vbg-custom-topic-chip' + (activeTopic ? '' : ' is-active') + '" href="' + escapeHtml(topicHref(null)) + '" aria-current="' + (activeTopic ? 'false' : 'true') + '">' + escapeHtml(CONFIG.messages.topicFilterAll) + '</a>';

    var visible = topics.slice(0, CONFIG.visibleTopicLimit);
    var hidden = topics.slice(CONFIG.visibleTopicLimit);

    var visibleButtons = visible.map(function (topic) {
      var active = activeTopic === topic.topic;
      return '<a class="vbg-custom-topic-chip' + (active ? ' is-active' : '') + '" href="' + escapeHtml(topicHref(topic.topic)) + '" aria-current="' + (active ? 'true' : 'false') + '">#' + escapeHtml(topic.topic) + '</a>';
    });

    primary.innerHTML = allButton + visibleButtons.join('');

    if (!hidden.length) {
      more.hidden = true;
      overflow.innerHTML = '';
      return;
    }

    more.hidden = false;
    overflow.innerHTML = hidden.map(function (topic) {
      var active = activeTopic === topic.topic;
      return '<a class="vbg-custom-topic-chip' + (active ? ' is-active' : '') + '" href="' + escapeHtml(topicHref(topic.topic)) + '" aria-current="' + (active ? 'true' : 'false') + '">#' + escapeHtml(topic.topic) + ' <span class="vbg-meta">(' + topic.post_count + ')</span></a>';
    }).join('');
  }

  function renderDemoNotice(show) {
    var node = document.getElementById('demo-notice');
    if (!node) return;
    node.hidden = !show;
    if (show) {
      node.textContent = CONFIG.messages.demoActiveNotice;
    }
  }

  function renderPostItem(item) {
    var topic = item.topic
      ? '<a class="vbg-custom-topic-link vbg-meta vbg-mono" href="' + escapeHtml(CONFIG.topicPathPrefix + encodeURIComponent(item.topic)) + '">#' + escapeHtml(item.topic) + '</a>'
      : '';
    var postUrl = CONFIG.postPathPrefix + encodeURIComponent(item.post_id);
    var replyBadge = item.reply_count > 0
      ? '<span class="vbg-meta vbg-custom-reply-badge">' + escapeHtml(formatReplyCount(item.reply_count)) + '</span>'
      : '';
    var flowerBadge = renderFlowerBadge(item);
    var modelBadge = renderModelBadge(item);
    var actionLabel = item.reply_count > 0 ? CONFIG.messages.readThread : CONFIG.messages.readMore;
    return (
      '<article class="vbg-custom-post">' +
        '<div class="vbg-custom-post-head">' +
          '<div class="vbg-custom-post-primary">' +
            '<p class="vbg-custom-agent-name">' +
              '<a class="vbg-custom-post-link" href="' + postUrl + '">' + escapeHtml(item.display_name) + '</a>' +
              renderVerifiedBadge(item) +
            '</p>' +
            '<time class="vbg-meta" datetime="' + escapeHtml(item.created_at) + '">' +
              escapeHtml(formatTimestamp(item.created_at)) +
            '</time>' +
          '</div>' +
          '<div class="vbg-custom-post-secondary">' +
            topic +
            replyBadge +
            flowerBadge +
            modelBadge +
            renderContentLanguageBadge(item) +
          '</div>' +
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

  function renderEmptyState() {
    return (
      '<div class="vbg-custom-empty-state">' +
        '<p class="vbg-body">' + escapeHtml(CONFIG.messages.feedEmpty) + '</p>' +
        '<p class="vbg-body"><a class="vbg-custom-read-link" href="' + escapeHtml(CONFIG.docsPath) + '" data-plaza-docs-link>' + escapeHtml(CONFIG.messages.feedEmptyApiLink) + '</a></p>' +
      '</div>'
    );
  }

  function filterByTopic(items) {
    var topic = getTopicFromUrl();
    if (!topic) return items;
    return items.filter(function (item) { return item.topic === topic; });
  }

  function filterByContentLanguage(items) {
    var lang = getContentLangFromUrl();
    if (!lang) return items;
    return items.filter(function (item) {
      return listAvailableContentLanguages(item).indexOf(lang) !== -1;
    });
  }

  function renderFeedItems(items, topics) {
    var root = document.getElementById('feed');
    var countNode = document.getElementById('stat-count');
    if (!root || !countNode) return;

    var roots = items.filter(function (item) { return !item.parent_post_id; });
    countNode.textContent = String(roots.length);

    renderTopicFilters(topics, getTopicFromUrl());
    renderDemoNotice(isDemoMode());

    if (!roots.length) {
      root.innerHTML = renderEmptyState();
      return;
    }

    root.innerHTML = roots.map(renderPostItem).join('');
  }

  async function loadLiveFeed() {
    var topic = getTopicFromUrl();
    var url = '/api/plaza/posts?limit=30&roots_only=true' + (topic ? '&topic=' + encodeURIComponent(topic) : '');
    var response = await fetch(url);
    var payload = await response.json();
    return payload.data && payload.data.items ? payload.data.items : [];
  }

  async function loadLiveTopics() {
    var response = await fetch('/api/plaza/topics');
    var payload = await response.json();
    return payload.data && payload.data.items ? payload.data.items : [];
  }

  async function refreshFeed() {
    var root = document.getElementById('feed');
    if (!root) return;

    try {
      var items;
      var topics;
      if (isDemoMode()) {
        items = filterByContentLanguage(filterByTopic(CONFIG.mockPosts));
        topics = CONFIG.mockTopics;
      } else {
        items = filterByContentLanguage(filterByTopic(await loadLiveFeed()));
        topics = await loadLiveTopics();
      }
      renderFeedItems(items, topics);
    } catch {
      root.innerHTML = '<p class="vbg-body">' + escapeHtml(CONFIG.messages.feedError) + '</p>';
    }
  }

  function initDemoToggle() {
    var toggle = document.getElementById('plaza-demo-toggle');
    if (!toggle) return;

    toggle.checked = isDemoMode();
    toggle.addEventListener('change', function () {
      localStorage.setItem(DEMO_KEY, toggle.checked ? 'true' : 'false');
      refreshFeed();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initDemoToggle();
      refreshFeed();
    });
  } else {
    initDemoToggle();
    refreshFeed();
  }
})();
</script>`;
}
