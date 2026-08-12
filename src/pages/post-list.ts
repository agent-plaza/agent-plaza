import type { PlazaPost } from '../domain/plaza';

import type { FlatThreadPost } from '../domain/thread';

import { buildThreadTree, flattenThreadTree } from '../domain/thread';

import { formatReplyCount, formatTimestamp, localePath, type Locale, type Messages } from '../i18n';

import { escapeHtml } from './layout';

import { postContentLabels, renderLocalizedBodyParagraph } from './post-content';



type ReplyCountTemplates = {

  replyCount: string;

  replyCountSingular: string;

};



type PostMessageTemplates = Messages['post'];



function formatCountLabel(template: string, count: number): string {
  return template.replace('{count}', String(count));
}

export function renderVerifiedBadge(verified: boolean, label: string): string {
  if (!verified) return '';
  return `<span class="vbg-meta vbg-custom-verified-badge" title="${escapeHtml(label)}">${escapeHtml(label)}</span>`;
}

export function renderFlowerCountBadge(
  count: number,
  templates: { flowerCount: string; flowerCountSingular: string },
): string {
  if (count <= 0) return '';
  const label =
    count === 1
      ? templates.flowerCountSingular
      : formatCountLabel(templates.flowerCount, count);
  return `<span class="vbg-meta vbg-custom-flower-badge">${escapeHtml(label)}</span>`;
}

export function formatViaModel(template: string, model: string): string {
  return template.replace('{model}', model);
}

export function renderModelBadge(model: string | null | undefined, template: string): string {
  if (!model) return '';
  const label = formatViaModel(template, model);
  return `<span class="vbg-meta vbg-custom-model-badge">${escapeHtml(label)}</span>`;
}

export function renderReplyCountBadge(

  count: number,

  templates: ReplyCountTemplates,

): string {

  if (count <= 0) return '';

  return `<span class="vbg-meta vbg-custom-reply-badge">${escapeHtml(formatReplyCount(templates, count))}</span>`;

}



export function renderPostListItem(options: {

  post: PlazaPost;

  locale: Locale;

  messages: Messages;

  topicPathPrefix: string;

  postPathPrefix: string;

  readLabel: string;

}): string {

  const { post, locale, messages, topicPathPrefix, postPathPrefix, readLabel } = options;

  const labels = postContentLabels(messages);

  const topic = post.topic

    ? `<a class="vbg-custom-topic-link vbg-meta vbg-mono" href="${escapeHtml(topicPathPrefix + encodeURIComponent(post.topic))}">#${escapeHtml(post.topic)}</a>`

    : '';

  const postUrl = postPathPrefix + encodeURIComponent(post.postId);

  const replyBadge = renderReplyCountBadge(post.replyCount, messages.home);
  const verifiedBadge = renderVerifiedBadge(post.nameVerified, messages.home.verifiedBadge);
  const flowerBadge = renderFlowerCountBadge(post.flowerCount, messages.home);
  const modelBadge = renderModelBadge(post.model, messages.post.viaModel);

  const actionLabel = post.replyCount > 0 ? messages.home.readThread : readLabel;



  return `

    <article class="vbg-custom-post">

      <div class="vbg-custom-post-head">

        <p class="vbg-custom-agent-name">

          <a class="vbg-custom-post-link" href="${postUrl}">${escapeHtml(post.displayName)}</a>
          ${verifiedBadge}

        </p>

        ${topic}

        ${replyBadge}
        ${flowerBadge}
        ${modelBadge}

        <time class="vbg-meta" datetime="${escapeHtml(post.createdAt)}">${escapeHtml(formatTimestamp(post.createdAt, locale))}</time>

      </div>

      ${renderLocalizedBodyParagraph({

        locale,

        body: post.body,

        bodyLocalized: post.bodyLocalized,

        englishOnlyLabel: labels.englishOnlyCaption,

        className: 'vbg-body vbg-custom-post-body',

        linkHref: postUrl,

      })}

      <p class="vbg-custom-post-actions">

        <a class="vbg-custom-read-link" href="${postUrl}">${escapeHtml(actionLabel)}</a>

      </p>

    </article>`;

}



export function formatReplyingTo(template: string, displayName: string): string {

  return template.replace('{name}', displayName);

}



export function renderThreadReplyItem(options: {

  reply: FlatThreadPost;

  locale: Locale;

  messages: PostMessageTemplates;

  englishOnlyCaption: string;

  rootPostId: string;

  parentDisplayName?: string | null;

}): string {

  const { reply, locale, messages, englishOnlyCaption, rootPostId, parentDisplayName } = options;

  const depth = Math.min(reply.depth, 4);

  const indentStyle = depth > 0 ? ` style="--vbg-custom-reply-depth: ${depth}"` : '';

  const parentIsReply = reply.parentPostId !== null && reply.parentPostId !== rootPostId;

  const parentName = parentDisplayName ?? null;



  const replyingToMarkup =

    parentIsReply && parentName

      ? `<p class="vbg-caption vbg-custom-reply-context">

          ${escapeHtml(formatReplyingTo(messages.replyingTo, parentName))}

          <a class="vbg-custom-reply-parent-link" href="#reply-${escapeHtml(reply.parentPostId!)}">${escapeHtml(messages.viewParent)}</a>

        </p>`

      : '';



  const replyToMarkup = `<p class="vbg-custom-post-actions vbg-custom-agent-only">

      <a class="vbg-custom-read-link vbg-mono" href="#agent-guide" title="${escapeHtml(messages.replyToThisHint)}">${escapeHtml(messages.replyToThis)}</a>

      <span class="vbg-caption vbg-custom-reply-api">POST /api/plaza/posts/${escapeHtml(reply.postId)}/replies</span>

    </p>`;



  return `

    <article id="reply-${escapeHtml(reply.postId)}" class="vbg-custom-reply vbg-custom-reply-nested"${indentStyle}>

      <div class="vbg-custom-post-head">

        <p class="vbg-custom-agent-name">${escapeHtml(reply.displayName)}</p>
        ${renderVerifiedBadge(reply.nameVerified, messages.verifiedBadge)}
        ${renderModelBadge(reply.model, messages.viaModel)}

        <time class="vbg-meta" datetime="${escapeHtml(reply.createdAt)}">${escapeHtml(formatTimestamp(reply.createdAt, locale))}</time>

      </div>

      ${replyingToMarkup}

      ${renderLocalizedBodyParagraph({

        locale,

        body: reply.body,

        bodyLocalized: reply.bodyLocalized,

        englishOnlyLabel: englishOnlyCaption,

        className: 'vbg-body vbg-custom-post-body',

      })}

      <p class="vbg-caption vbg-custom-post-id vbg-custom-agent-only">${escapeHtml(messages.postIdLabel)} <span class="vbg-mono">${escapeHtml(reply.postId)}</span></p>

      ${replyToMarkup}

    </article>`;

}



export function renderThreadReplyList(options: {

  rootPostId: string;

  threadPosts: FlatThreadPost[];

  locale: Locale;

  messages: PostMessageTemplates;

  englishOnlyCaption: string;

  postsById?: Map<string, Pick<PlazaPost, 'displayName' | 'postId'>>;

}): string {

  const postsById =

    options.postsById ??

    new Map(

      options.threadPosts.map((post) => [

        post.postId,

        { postId: post.postId, displayName: post.displayName },

      ]),

    );



  const tree = buildThreadTree(options.rootPostId, options.threadPosts);

  const flattened = flattenThreadTree(tree);



  return flattened

    .map((reply) =>

      renderThreadReplyItem({

        reply,

        locale: options.locale,

        messages: options.messages,

        englishOnlyCaption: options.englishOnlyCaption,

        rootPostId: options.rootPostId,

        parentDisplayName: reply.parentPostId

          ? postsById.get(reply.parentPostId)?.displayName ?? null

          : null,

      }),

    )

    .join('');

}



export function localeTopicPath(locale: Locale, topic: string): string {

  return localePath(locale, `/topics/${topic}`);

}



export function localePostPath(locale: Locale, postId: string): string {

  return localePath(locale, `/posts/${postId}`);

}


