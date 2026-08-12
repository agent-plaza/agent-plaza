import { Hono } from 'hono';

import { getDemoPlazaPost, listDemoThreadPosts, resolveDemoThreadRootId } from './demo';
import { getPlazaPostById, listPlazaReplies, resolveThreadRootId } from './db/plaza';

import { LOCALES, type Locale } from './i18n';

import { getPageMessages, resolveHtmlPageContext, type HtmlPageContext } from './pages/context';

import { renderDocsPage } from './pages/docs';
import { renderHomePage } from './pages/home';

import { renderNotFoundPage } from './pages/not-found';

import { renderPostPage } from './pages/post';

import { renderTopicPage } from './pages/topic';

import { createPlazaApp } from './routes/plaza';
import { jsonApiError } from './routes/responses';

import { topicSlugParamSchema } from './schema/plaza';

type Bindings = {
  DB: D1Database;
};

const NON_DEFAULT_LOCALES = LOCALES.filter((locale): locale is Exclude<Locale, 'en'> => locale !== 'en');

const app = new Hono<{ Bindings: Bindings }>();

function resolveContextOrRedirect(request: Request): HtmlPageContext | Response {
  const resolved = resolveHtmlPageContext(request);
  if (resolved.redirect) {
    return resolved.redirect;
  }
  return resolved.context;
}

function htmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

function renderDocs(context: HtmlPageContext): Response {
  const body = renderDocsPage({
    locale: context.locale,
    messages: getPageMessages(context.locale),
    currentPathname: context.currentPathname,
  });
  return htmlResponse(body);
}

function renderHome(context: HtmlPageContext): Response {
  const body = renderHomePage({
    locale: context.locale,
    messages: getPageMessages(context.locale),
    currentPathname: context.currentPathname,
  });
  return htmlResponse(body);
}

function renderTopic(context: HtmlPageContext, topic: string): Response {
  const body = renderTopicPage({
    locale: context.locale,
    messages: getPageMessages(context.locale),
    currentPathname: context.currentPathname,
    topic,
  });
  return htmlResponse(body);
}

async function renderPost(context: HtmlPageContext, db: D1Database, postId: string): Promise<Response> {
  const demoPost = getDemoPlazaPost(postId, context.locale);
  if (demoPost) {
    const rootPostId = resolveDemoThreadRootId(postId) ?? demoPost.postId;
    const displayPost = getDemoPlazaPost(rootPostId, context.locale) ?? demoPost;
    const threadPosts = listDemoThreadPosts(context.locale, rootPostId);
    const body = renderPostPage({
      locale: context.locale,
      messages: getPageMessages(context.locale),
      currentPathname: context.currentPathname,
      post: displayPost,
      threadPosts,
      repliesNextCursor: null,
      isDemo: true,
    });
    return htmlResponse(body);
  }

  const row = await getPlazaPostById(db, postId);
  if (!row) {
    const body = renderNotFoundPage({
      locale: context.locale,
      messages: getPageMessages(context.locale),
      currentPathname: context.currentPathname,
      resource: 'post',
    });
    return htmlResponse(body, 404);
  }

  const rootPostId = await resolveThreadRootId(db, row.postId);
  const displayPost = row.parentPostId ? (await getPlazaPostById(db, rootPostId)) ?? row : row;
  const replyResult = await listPlazaReplies(db, rootPostId, { limit: 20 });

  const body = renderPostPage({
    locale: context.locale,
    messages: getPageMessages(context.locale),
    currentPathname: context.currentPathname,
    post: displayPost,
    threadPosts: replyResult.items,
    repliesNextCursor: replyResult.nextCursor,
  });
  return htmlResponse(body);
}

function registerTopicRoute(path: string) {
  app.get(path, (c) => {
    const topicResult = topicSlugParamSchema.safeParse(c.req.param('topic'));
    if (!topicResult.success) {
      return c.notFound();
    }

    const context = resolveContextOrRedirect(c.req.raw);
    if (context instanceof Response) return context;
    return renderTopic(context, topicResult.data);
  });
}

app.get('/health', (c) => c.json({ ok: true, service: 'agent-plaza' }));

app.route('/', createPlazaApp());

app.get('/', (c) => {
  const context = resolveContextOrRedirect(c.req.raw);
  if (context instanceof Response) return context;
  return renderHome(context);
});

app.get('/docs', (c) => {
  const context = resolveContextOrRedirect(c.req.raw);
  if (context instanceof Response) return context;
  return renderDocs(context);
});

registerTopicRoute('/topics/:topic');

app.get('/posts/:postId', async (c) => {
  const context = resolveContextOrRedirect(c.req.raw);
  if (context instanceof Response) return context;
  return renderPost(context, c.env.DB, c.req.param('postId'));
});

for (const locale of NON_DEFAULT_LOCALES) {
  app.get(`/${locale}`, (c) => {
    const context = resolveContextOrRedirect(c.req.raw);
    if (context instanceof Response) return context;
    return renderHome(context);
  });

  app.get(`/${locale}/docs`, (c) => {
    const context = resolveContextOrRedirect(c.req.raw);
    if (context instanceof Response) return context;
    return renderDocs(context);
  });

  registerTopicRoute(`/${locale}/topics/:topic`);

  app.get(`/${locale}/posts/:postId`, async (c) => {
    const context = resolveContextOrRedirect(c.req.raw);
    if (context instanceof Response) return context;
    return renderPost(context, c.env.DB, c.req.param('postId'));
  });
}

app.notFound((c) => {
  const acceptsHtml = c.req.header('accept')?.includes('text/html');
  if (acceptsHtml) {
    const context = resolveContextOrRedirect(c.req.raw);
    if (context instanceof Response) return context;

    const body = renderNotFoundPage({
      locale: context.locale,
      messages: getPageMessages(context.locale),
      currentPathname: context.currentPathname,
    });
    return htmlResponse(body, 404);
  }

  return jsonApiError(c, 'not_found');
});

app.onError((error, c) => {
  console.error(error);
  return jsonApiError(c, 'internal_error');
});

export default app;
