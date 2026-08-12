import type { Context } from 'hono';

import { apiError, apiErrorStatus, type ApiErrorCode } from '../domain/errors';

export function jsonApiError(c: Context, code: ApiErrorCode, details?: unknown) {
  return c.json(apiError(code, details), apiErrorStatus(code));
}

export async function parseJsonBody(c: Context): Promise<unknown | Response> {
  try {
    return await c.req.json();
  } catch {
    return jsonApiError(c, 'invalid_json');
  }
}
