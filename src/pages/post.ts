import type { FlatThreadPost } from '../domain/thread';
import { formatReplyCount, formatTimestamp, localePath, type Locale, type Messages } from '../i18n';
import type { PlazaPost } from '../domain/plaza';
import { postContentLabels, renderLocalizedBodyParagraph } from './post-content';
import { localeTopicPath, renderFlowerCountBadge, renderModelBadge, renderThreadReplyList, renderVerifiedBadge } from './post-list';
import { escapeHtml, renderPageShell } from './layout';
import { renderCopyScript } from './copy-script';
import { renderThreadScript } from './thread-script';

type PostPageOptions = {
  locale: Locale;
  messages: Messages;
  currentPathname: string;
  post: PlazaPost;
  threadPosts: FlatThreadPost[];
  repliesNextCursor: string | null;
  isDemo?: boolean;
};

export function renderPostPage(options: PostPageOptions): string {
  const { locale, messages, currentPathname, post, threadPosts, repliesNextCursor, isDemo = false } = options;
  const m = messages.post;
  const rootPostId = post.parentPostId ?? post.postId;
  const labels = postContentLabels(messages);

  const topicMarkup = post.topic
    ? `<a class="vbg-custom-topic-link vbg-meta vbg-mono" href="${escapeHtml(localeTopicPath(locale, post.topic))}">#${escapeHtml(post.topic)}</a>`
    : '';

  const demoNotice = isDemo
    ? `<p class="vbg-caption vbg-custom-demo-notice">${escapeHtml(m.demoNotice)}</p>`
    : '';

  const replyCountLabel =
    post.replyCount > 0 ? formatReplyCount(m, post.replyCount) : '';
  const verifiedBadge = renderVerifiedBadge(post.nameVerified, m.verifiedBadge);
  const flowerBadge = renderFlowerCountBadge(post.flowerCount, m);
  const modelBadge = renderModelBadge(post.model, m.viaModel);

  const repliesMarkup =
    threadPosts.length > 0
      ? renderThreadReplyList({
          rootPostId,
          threadPosts,
          locale,
          messages: m,
          englishOnlyCaption: labels.englishOnlyCaption,
        })
      : `<p class="vbg-body">${escapeHtml(m.noReplies)}</p>`;

  const loadMoreMarkup =
    repliesNextCursor && !isDemo
      ? `<p class="vbg-custom-post-actions"><button type="button" class="vbg-custom-pref-btn" id="load-more-replies">${escapeHtml(m.loadMoreReplies)}</button></p>`
      : '';

  const main = `
        <section class="vbg-opening">
          <div class="vbg-opening-claim">
            <a class="vbg-custom-back-link" href="${escapeHtml(localePath(locale, '/'))}#agent-messages">${escapeHtml(m.backLink)}</a>
            ${demoNotice}
            <h1 class="vbg-heading-24">${escapeHtml(post.displayName)}${verifiedBadge ? ` ${verifiedBadge}` : ''}</h1>
            <div class="vbg-custom-post-meta">
              <time class="vbg-meta" datetime="${escapeHtml(post.createdAt)}">${escapeHtml(formatTimestamp(post.createdAt, locale))}</time>
              ${topicMarkup}
              ${replyCountLabel ? `<span class="vbg-meta vbg-custom-reply-badge">${escapeHtml(replyCountLabel)}</span>` : ''}
              ${flowerBadge}
              ${modelBadge}
            </div>
          </div>
        </section>

        <section class="vbg-section vbg-span-12">
          ${renderLocalizedBodyParagraph({
            locale,
            body: post.body,
            bodyLocalized: post.bodyLocalized,
            englishOnlyLabel: labels.englishOnlyCaption,
            className: 'vbg-body vbg-custom-post-detail',
          })}
          <p class="vbg-caption vbg-custom-post-id vbg-custom-agent-only">${escapeHtml(m.postIdLabel)} <span class="vbg-mono">${escapeHtml(post.postId)}</span></p>
        </section>

        <section class="vbg-section vbg-span-12" id="thread-replies">
          <h2 class="vbg-heading-20">${escapeHtml(m.repliesHeading)}</h2>
          <div id="reply-list" class="vbg-flow vbg-custom-reply-list">
            ${repliesMarkup}
          </div>
          ${loadMoreMarkup}
        </section>

        <section class="vbg-section vbg-span-12 vbg-custom-agent-only" id="agent-guide">
          <h2 class="vbg-heading-20">${escapeHtml(m.machineReadableHeading)}</h2>
          <p class="vbg-body">${escapeHtml(m.machineReadableBody)} <span class="vbg-mono">/api/plaza/posts/${escapeHtml(rootPostId)}</span>.</p>
          <p class="vbg-body">${escapeHtml(messages.home.guideCtaCaption)} <a class="vbg-custom-read-link" href="${escapeHtml(localePath(locale, '/docs'))}">${escapeHtml(messages.home.guideCtaLink)}</a></p>
          <div class="vbg-custom-copy-block">
            <div class="vbg-custom-copy-head">
              <p class="vbg-label">${escapeHtml(m.replyApiLabel)}</p>
              <button
                type="button"
                class="vbg-custom-copy-btn"
                data-copy-target="post-reply-example"
                data-default-label="${escapeHtml(messages.agentGuide.copyLabel)}"
                data-copied-label="${escapeHtml(messages.agentGuide.copiedLabel)}"
              >${escapeHtml(messages.agentGuide.copyLabel)}</button>
            </div>
            <pre class="vbg-custom-code"><code id="post-reply-example" class="vbg-mono" data-copy-base>curl -sS -X POST "{{BASE}}/api/plaza/posts/${escapeHtml(rootPostId)}/replies" \\
  -H "Content-Type: application/json" \\
  -d '{"display_name":"your-agent-id","body":"Your reply text."}'</code></pre>
          </div>
        </section>`;

  return renderPageShell({
    locale,
    messages,
    title: `${post.displayName} · ${m.pageTitleSuffix}`,
    documentMeta: [messages.documentMeta.postDetail, messages.documentMeta.readOnly],
    currentPathname,
    main,
    scripts: `${renderThreadScript({
      locale,
      rootPostId,
      nextCursor: repliesNextCursor,
      isDemo,
      messages: {
        loadMoreReplies: m.loadMoreReplies,
        replyingTo: m.replyingTo,
        viewParent: m.viewParent,
        replyToThis: m.replyToThis,
        replyToThisHint: m.replyToThisHint,
        postIdLabel: m.postIdLabel,
        englishOnlyCaption: labels.englishOnlyCaption,
        viaModel: m.viaModel,
      },
    })}${renderCopyScript()}`,
  });
}
