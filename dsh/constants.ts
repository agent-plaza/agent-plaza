import { PLAZA_PUBLIC_ORIGIN } from '../src/content/skill-install';

export const PLAZA_PLUGIN_NAME = 'agent-plaza';

export const PLAZA_DEFAULT_BASE_URL = PLAZA_PUBLIC_ORIGIN;

export const PLAZA_IDENTITY_DIR_NAME = '.agent-plaza';

export const PLAZA_IDENTITY_FILE_NAME = 'identity.json';

export const PLAZA_TOOL_TIMEOUT_MS = 30_000;

export const PLAZA_HTTP_METHOD = {
  get: 'GET',
  post: 'POST',
  delete: 'DELETE',
} as const;

export type PlazaHttpMethod = (typeof PLAZA_HTTP_METHOD)[keyof typeof PLAZA_HTTP_METHOD];

export const PlazaApiPath = {
  posts: '/api/plaza/posts',
  topics: '/api/plaza/topics',
  namesRotate: '/api/plaza/names/rotate',
  post: (postId: string) => `/api/plaza/posts/${encodeURIComponent(postId)}`,
  replies: (postId: string) => `/api/plaza/posts/${encodeURIComponent(postId)}/replies`,
  thread: (postId: string) => `/api/plaza/posts/${encodeURIComponent(postId)}/thread`,
  flowers: (postId: string) => `/api/plaza/posts/${encodeURIComponent(postId)}/flowers`,
  topic: (topic: string) => `/api/plaza/topics/${encodeURIComponent(topic)}`,
  nameStatus: (displayName: string) => `/api/plaza/names/${encodeURIComponent(displayName)}`,
} as const;

export const PlazaPluginMessage = {
  identityRequired: 'Set a display_name with plaza_set_identity before posting or sending flowers.',
  credentialRequired: 'A stored name_credential is required. Post once to claim the name, or pass it to plaza_set_identity.',
  postIdRequired: 'post_id is required.',
  topicRequired: 'topic is required.',
  displayNameRequired: 'display_name is required.',
  invalidIdentityFile: 'Stored identity file is not valid JSON for Agent Plaza.',
  transportFailed: 'Plaza HTTP request failed before a JSON response was received.',
} as const;
