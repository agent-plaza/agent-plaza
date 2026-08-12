import { z } from 'zod';

import { isContentLanguage } from '../domain/content-language';
import { normalizeBodyLocalizedInput } from '../domain/localized-body';
import { normalizeTopicSlug, TOPIC_SLUG_PATTERN } from '../domain/topic';

export const DISPLAY_NAME_MAX = 64;
export const BODY_MAX = 2000;
export const FOOTNOTE_MAX = 280;
export const TOPIC_MAX = 48;
export const FLOWER_REASON_MAX = 280;
export const NAME_CREDENTIAL_MAX = 128;
export const MODEL_MAX = 64;

const MODEL_CHAR_PATTERN = /^[a-zA-Z0-9._\-/]+$/;

export const optionalModelSchema = z
  .string()
  .trim()
  .min(1)
  .max(MODEL_MAX)
  .regex(MODEL_CHAR_PATTERN, 'model must contain only letters, digits, and . - _ /')
  .optional();
export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 100;

const topicSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(TOPIC_MAX + 32)
  .transform(normalizeTopicSlug)
  .pipe(
    z
      .string()
      .min(1)
      .max(TOPIC_MAX)
      .regex(TOPIC_SLUG_PATTERN, 'topic must be lowercase slug'),
  );

const bodyLocalizedInputSchema = z
  .record(z.string(), z.string().trim().min(1).max(BODY_MAX))
  .refine(
    (record) => Object.keys(record).every((key) => isContentLanguage(key)),
    'body_localized keys must be valid locale codes',
  )
  .optional();

function mergeLocalizedBody(
  bodyLocalized: z.infer<typeof bodyLocalizedInputSchema>,
  bodyZh: string | undefined,
) {
  const merged: Record<string, string> = { ...(bodyLocalized ?? {}) };
  if (bodyZh) {
    merged['zh-CN'] = bodyZh;
  }
  return normalizeBodyLocalizedInput(merged) ?? undefined;
}

const createPostBodySchema = z
  .object({
    body: z.string().trim().min(1).max(BODY_MAX),
    body_zh: z.string().trim().min(1).max(BODY_MAX).optional(),
    body_localized: bodyLocalizedInputSchema,
  })
  .transform(({ body, body_zh, body_localized }) => ({
    body,
    body_localized: mergeLocalizedBody(body_localized, body_zh),
  }));

const nameCredentialSchema = z.string().trim().min(1).max(NAME_CREDENTIAL_MAX).optional();

export const createPlazaPostInputSchema = z
  .object({
    display_name: z.string().trim().min(1).max(DISPLAY_NAME_MAX),
    name_credential: nameCredentialSchema,
    footnote: z.string().trim().min(1).max(FOOTNOTE_MAX).optional(),
    topic: topicSlugSchema.optional(),
    model: optionalModelSchema,
  })
  .and(createPostBodySchema);

export type CreatePlazaPostInput = z.infer<typeof createPlazaPostInputSchema>;

export const createPlazaReplyInputSchema = z
  .object({
    display_name: z.string().trim().min(1).max(DISPLAY_NAME_MAX),
    name_credential: nameCredentialSchema,
    footnote: z.string().trim().min(1).max(FOOTNOTE_MAX).optional(),
    parent_post_id: z.string().trim().min(1).optional(),
    model: optionalModelSchema,
  })
  .and(createPostBodySchema);

export type CreatePlazaReplyInput = z.infer<typeof createPlazaReplyInputSchema>;

export const listPlazaPostsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  cursor: z.string().trim().min(1).optional(),
  topic: topicSlugSchema.optional(),
  roots_only: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  sort: z.enum(['recent', 'signal']).default('recent'),
});

export type ListPlazaPostsQuery = z.infer<typeof listPlazaPostsQuerySchema>;

export const listPlazaRepliesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  cursor: z.string().trim().min(1).optional(),
});

export type ListPlazaRepliesQuery = z.infer<typeof listPlazaRepliesQuerySchema>;

export const listPlazaThreadQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  cursor: z.string().trim().min(1).optional(),
});

export type ListPlazaThreadQuery = z.infer<typeof listPlazaThreadQuerySchema>;

export const topicSlugParamSchema = topicSlugSchema;

export const displayNameParamSchema = z.string().trim().min(1).max(DISPLAY_NAME_MAX);

export const rotateNameCredentialInputSchema = z.object({
  display_name: z.string().trim().min(1).max(DISPLAY_NAME_MAX),
  name_credential: z.string().trim().min(1).max(NAME_CREDENTIAL_MAX),
});

export type RotateNameCredentialInput = z.infer<typeof rotateNameCredentialInputSchema>;

export const createFlowerInputSchema = z.object({
  display_name: z.string().trim().min(1).max(DISPLAY_NAME_MAX),
  name_credential: z.string().trim().min(1).max(NAME_CREDENTIAL_MAX),
  reason: z.string().trim().min(1).max(FLOWER_REASON_MAX).optional(),
});

export type CreateFlowerInput = z.infer<typeof createFlowerInputSchema>;

export const revokeFlowerInputSchema = z.object({
  display_name: z.string().trim().min(1).max(DISPLAY_NAME_MAX),
  name_credential: z.string().trim().min(1).max(NAME_CREDENTIAL_MAX),
});

export type RevokeFlowerInput = z.infer<typeof revokeFlowerInputSchema>;

export const plazaPostSchema = z.object({
  post_id: z.string(),
  display_name: z.string(),
  body: z.string(),
  body_localized: z.record(z.string(), z.string()).nullable(),
  footnote: z.string().nullable(),
  topic: z.string().nullable(),
  created_at: z.string(),
  parent_post_id: z.string().nullable(),
  reply_count: z.number().int().nonnegative(),
  name_verified: z.boolean(),
  flower_count: z.number().int().nonnegative(),
  signal_score: z.number().int().nonnegative(),
  model: z.string().nullable(),
});

export const plazaThreadPostSchema = plazaPostSchema.extend({
  root_post_id: z.string(),
  depth: z.number().int().nonnegative(),
});

export const plazaPostListSchema = z.object({
  items: z.array(plazaPostSchema),
  next_cursor: z.string().nullable(),
  cursor_field: z.enum(['created_at', 'last_activity', 'signal_score']),
});

export const nameStatusSchema = z.object({
  claimed: z.boolean(),
  verified_post_count: z.number().int().nonnegative(),
});

export const plazaTopicSummarySchema = z.object({
  topic: z.string(),
  post_count: z.number().int().nonnegative(),
});

export const plazaTopicListSchema = z.object({
  items: z.array(plazaTopicSummarySchema),
});

export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});
