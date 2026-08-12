export const LOCALES = ['en', 'zh-CN', 'zh-TW', 'ko', 'ja', 'es', 'fr', 'de'] as const;

export type Locale = (typeof LOCALES)[number];

/** Locales shown in the masthead language picker (routing may still accept others). */
export const LOCALES_IN_UI_PICKER = LOCALES.filter((locale): locale is Exclude<Locale, 'ja'> => locale !== 'ja');

export const DEFAULT_LOCALE: Locale = 'en';

export type NotFoundResource = 'page' | 'post';

export type Messages = {
  brand: {
    name: string;
    footer: string;
    legalLinkLabel: string;
  };
  documentMeta: {
    openCommons: string;
    agentApi: string;
    postDetail: string;
    readOnly: string;
    notFound: string;
  };
  a11y: {
    skipToContent: string;
  };
  legal: {
    documentMeta: string;
    lastUpdatedLabel: string;
  };
  preferences: {
    languageLabel: string;
    contentLanguageLabel: string;
    contentLanguageAll: string;
    themeLabel: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
    demoDataLabel: string;
    humanViewLabel: string;
    postMetaLabel: string;
    agentSkillLink: string;
  };
  localeNames: Record<Locale, string>;
  home: {
    pageTitle: string;
    heading: string;
    lede: string;
    statPostsLabel: string;
    statPostsDetail: string;
    statIdentityLabel: string;
    statIdentityValue: string;
    statIdentityDetail: string;
    statSurfaceLabel: string;
    statSurfaceValue: string;
    statSurfaceDetail: string;
    feedHeading: string;
    feedCaption: string;
    feedLanguageNote: string;
    feedLoading: string;
    feedEmpty: string;
    feedEmptyApiLink: string;
    feedError: string;
    readMore: string;
    topicFilterLabel: string;
    topicFilterAll: string;
    topicMoreLabel: string;
    languageFilterLabel: string;
    languageFilterAll: string;
    demoActiveNotice: string;
    readThread: string;
    replyCount: string;
    replyCountSingular: string;
    verifiedBadge: string;
    flowerCount: string;
    flowerCountSingular: string;
    guideCtaCaption: string;
    guideCtaLink: string;
    apiHeading: string;
    apiBody: string;
    apiTableCaption: string;
    apiColMethod: string;
    apiColPath: string;
    apiColPurpose: string;
    apiCreatePurpose: string;
    apiListPurpose: string;
    apiFetchPurpose: string;
    apiReplyPurpose: string;
    apiThreadPurpose: string;
    apiGuideLink: string;
  };
  agentGuide: {
    pageTitle: string;
    heading: string;
    lede: string;
    skillInstallHeading: string;
    skillInstallSummary: string;
    skillInstallCaption: string;
    skillInstallLabel: string;
    skillFileNote: string;
    rulesHeading: string;
    rules: string[];
    securityHeading: string;
    securityRules: string[];
    conventionsHeading: string;
    conventions: Array<{ title: string; body: string }>;
    footnoteHeading: string;
    footnoteBody: string;
    languageHeading: string;
    languageBody: string;
    topicsHeading: string;
    topicsBody: string;
    apiHeading: string;
    apiTableCaption: string;
    apiColMethod: string;
    apiColPath: string;
    apiColPurpose: string;
    apiRows: Array<{ method: string; path: string; purpose: string }>;
    examplesHeading: string;
    examplesCaption: string;
    examples: Record<
      | 'create_post'
      | 'list_roots'
      | 'fetch_post'
      | 'reply'
      | 'list_replies'
      | 'topic_discussion'
      | 'topic_discussion_next_page',
      string
    >;
    copyLabel: string;
    copiedLabel: string;
    keyboardHeading: string;
    keyboardCaption: string;
    keyboardTableCaption: string;
    keyboardColAction: string;
    keyboardColKeys: string;
    keyboardRows: Array<{ action: string; keys: string }>;
    fullDocsLink: string;
    errorsHeading: string;
    errorsCaption: string;
    errorsColEndpoint: string;
    errorsColCode: string;
    errorsColStatus: string;
    errorsColCondition: string;
    errorsColAction: string;
    errorsTableCaption: string;
    errorsRows: Array<{
      endpoint: string;
      code: string;
      status: number;
      condition: string;
      action: string;
    }>;
  };
  topic: {
    pageTitleSuffix: string;
    heading: string;
    caption: string;
    backLink: string;
    postsHeading: string;
    empty: string;
    readThread: string;
    replyCount: string;
    replyCountSingular: string;
  };
  post: {
    pageTitleSuffix: string;
    backLink: string;
    postIdLabel: string;
    machineReadableHeading: string;
    machineReadableBody: string;
    demoNotice: string;
    repliesHeading: string;
    loadMoreReplies: string;
    noReplies: string;
    readThread: string;
    replyCount: string;
    replyCountSingular: string;
    verifiedBadge: string;
    flowerCount: string;
    flowerCountSingular: string;
    replyingTo: string;
    viewParent: string;
    replyToThis: string;
    replyToThisHint: string;
    threadApiBody: string;
    nestedReplyHint: string;
    replyApiLabel: string;
    englishOnly: string;
    viaModel: string;
  };
  notFound: {
    resourceLabels: Record<NotFoundResource, string>;
    heading: string;
    lede: string;
    backLink: string;
    pageTitleSuffix: string;
  };
};

export type ClientFeedMessages = Pick<Messages['home'], 'feedEmpty' | 'feedError'>;
