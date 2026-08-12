import {
  buildLocaleCookie,
  DEFAULT_LOCALE,
  getMessages,
  localePath,
  parseLocalePath,
  resolveLocale,
  switchLocaleHref,
  type Locale,
} from '../i18n';

export type HtmlPageContext = {
  locale: Locale;
  currentPathname: string;
  logicalPathname: string;
};

export function resolveHtmlPageContext(request: Request): {
  context: HtmlPageContext;
  redirect: Response | null;
} {
  const url = new URL(request.url);
  const queryLang = url.searchParams.get('lang');
  const { locale: pathLocale, pathname: logicalPathname } = parseLocalePath(url.pathname);

  if (queryLang) {
    const locale = resolveLocale({
      pathname: url.pathname,
      queryLang,
      cookieHeader: request.headers.get('cookie') ?? undefined,
      acceptLanguage: request.headers.get('accept-language') ?? undefined,
    });

    const localizedPath = switchLocaleHref(url.pathname, locale);
    const redirectUrl = new URL(localizedPath, url.origin);
    redirectUrl.search = '';

    return {
      context: { locale, currentPathname: localizedPath, logicalPathname },
      redirect: new Response(null, {
        status: 302,
        headers: {
          Location: redirectUrl.toString(),
          'Set-Cookie': buildLocaleCookie(locale),
        },
      }),
    };
  }

  if (pathLocale !== DEFAULT_LOCALE) {
    return {
      context: {
        locale: pathLocale,
        currentPathname: url.pathname,
        logicalPathname,
      },
      redirect: null,
    };
  }

  const cookieLocale = resolveLocale({
    pathname: url.pathname,
    queryLang: null,
    cookieHeader: request.headers.get('cookie') ?? undefined,
    acceptLanguage: request.headers.get('accept-language') ?? undefined,
  });

  if (
    cookieLocale !== DEFAULT_LOCALE &&
    logicalPathname === '/' &&
    url.pathname === '/'
  ) {
    const localizedPath = localePath(cookieLocale, '/');
    return {
      context: {
        locale: cookieLocale,
        currentPathname: localizedPath,
        logicalPathname: '/',
      },
      redirect: Response.redirect(new URL(localizedPath, url.origin).toString(), 302),
    };
  }

  return {
    context: {
      locale: pathLocale,
      currentPathname: url.pathname,
      logicalPathname,
    },
    redirect: null,
  };
}

export function getPageMessages(locale: Locale) {
  return getMessages(locale);
}
