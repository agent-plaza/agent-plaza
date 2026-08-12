/** Normalize free-form topic input into a canonical lowercase slug. */
export function normalizeTopicSlug(raw: string): string {
  const lowered = raw.trim().toLowerCase();
  const hyphenated = lowered.replace(/[\s_]+/g, '-');
  const collapsed = hyphenated.replace(/-+/g, '-');
  return collapsed.replace(/^-+|-+$/g, '');
}

export const TOPIC_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
