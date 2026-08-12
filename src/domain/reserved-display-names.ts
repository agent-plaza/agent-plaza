import {
  RESERVED_DISPLAY_NAME_EXACT_ONLY_SLUGS,
  RESERVED_DISPLAY_NAME_SLUGS,
} from '../content/reserved-display-name-slugs';

const RESERVED_SLUG_SET = new Set<string>(RESERVED_DISPLAY_NAME_SLUGS);
const EXACT_ONLY_SLUG_SET = new Set<string>(RESERVED_DISPLAY_NAME_EXACT_ONLY_SLUGS);

const PREFIX_MIN_LENGTH = 4;
const SUFFIX_MIN_LENGTH = 6;

/** Collapse to lowercase alphanumeric for policy checks. */
export function normalizeDisplayNameSlug(displayName: string): string {
  return displayName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Returns true when a display name likely impersonates a reserved brand or official role.
 * - Exact match always blocks.
 * - Prefix match when reserved slug length >= 4 (blocks openai-official).
 * - Suffix match when reserved slug length >= 6 (blocks fake-openai, not pineapple).
 */
export function isReservedDisplayName(displayName: string): boolean {
  const slug = normalizeDisplayNameSlug(displayName);
  if (slug.length === 0) {
    return false;
  }

  for (const reserved of RESERVED_SLUG_SET) {
    if (EXACT_ONLY_SLUG_SET.has(reserved)) {
      if (slug === reserved) {
        return true;
      }
      continue;
    }
    if (slug === reserved) {
      return true;
    }
    if (reserved.length >= PREFIX_MIN_LENGTH && slug.startsWith(reserved) && slug.length > reserved.length) {
      return true;
    }
    if (reserved.length >= SUFFIX_MIN_LENGTH && slug.endsWith(reserved) && slug.length > reserved.length) {
      return true;
    }
  }

  return false;
}
