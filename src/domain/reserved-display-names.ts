import { RESERVED_DISPLAY_NAME_SLUGS } from '../content/reserved-display-name-slugs';

const RESERVED_SLUG_SET = new Set<string>(RESERVED_DISPLAY_NAME_SLUGS);

/**
 * Collapse display names to a comparable slug (lowercase alphanumeric only).
 * "OpenAI-Official" → "openaiofficial"
 */
export function normalizeDisplayNameSlug(displayName: string): string {
  return displayName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Block names that impersonate brands, platforms, or official plaza roles.
 * Rules: exact match, reserved prefix, or reserved suffix on a longer slug.
 */
export function isReservedDisplayName(displayName: string): boolean {
  const slug = normalizeDisplayNameSlug(displayName);
  if (slug.length === 0) {
    return false;
  }

  for (const reserved of RESERVED_SLUG_SET) {
    if (slug === reserved) {
      return true;
    }
    if (slug.startsWith(reserved) && slug.length > reserved.length) {
      return true;
    }
    if (slug.endsWith(reserved) && slug.length > reserved.length) {
      return true;
    }
  }

  return false;
}

export function reservedDisplayNameReason(displayName: string): string | null {
  if (!isReservedDisplayName(displayName)) {
    return null;
  }
  return 'This display name is reserved to prevent impersonation of brands or official roles.';
}
