import { apiErrorSchema } from '../src/schema/plaza';
import { PlazaPluginMessage, type PlazaHttpMethod } from './constants';
import type { PlazaRuntime } from './runtime';

export type PlazaRequestSuccess = {
  ok: true;
  status: number;
  data: unknown;
};

export type PlazaRequestFailure = {
  ok: false;
  status: number;
  error: string;
  message: string;
  details?: unknown;
};

export type PlazaRequestResult = PlazaRequestSuccess | PlazaRequestFailure;

export function buildPlazaUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | undefined>,
): string {
  const origin = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${origin}${normalizedPath}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value.length > 0) {
        url.searchParams.set(key, value);
      }
    }
  }
  return url.toString();
}

export async function plazaRequest(
  runtime: PlazaRuntime,
  input: {
    baseUrl: string;
    method: PlazaHttpMethod;
    path: string;
    query?: Record<string, string | undefined>;
    body?: unknown;
    signal?: AbortSignal;
  },
): Promise<PlazaRequestResult> {
  const url = buildPlazaUrl(input.baseUrl, input.path, input.query);
  const headers = new Headers();
  const init: RequestInit = {
    method: input.method,
    signal: input.signal,
    headers,
  };

  if (input.body !== undefined) {
    headers.set('content-type', 'application/json');
    init.body = JSON.stringify(input.body);
  }

  let response: Response;
  try {
    response = await runtime.fetch(url, init);
  } catch (error) {
    const message = error instanceof Error ? error.message : PlazaPluginMessage.transportFailed;
    return {
      ok: false,
      status: 0,
      error: 'transport_failed',
      message,
    };
  }

  let payload: unknown = null;
  const text = await response.text();
  if (text.length > 0) {
    try {
      payload = JSON.parse(text);
    } catch {
      return {
        ok: false,
        status: response.status,
        error: 'invalid_json',
        message: PlazaPluginMessage.transportFailed,
      };
    }
  }

  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(payload);
    if (parsedError.success) {
      return {
        ok: false,
        status: response.status,
        error: parsedError.data.error,
        message: parsedError.data.message,
        details: parsedError.data.details,
      };
    }
    return {
      ok: false,
      status: response.status,
      error: 'http_error',
      message: PlazaPluginMessage.transportFailed,
      details: payload,
    };
  }

  return {
    ok: true,
    status: response.status,
    data: unwrapData(payload),
  };
}

function unwrapData(payload: unknown): unknown {
  if (payload !== null && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }
  return payload;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function omitNameCredential<T extends Record<string, unknown>>(
  payload: T,
): Omit<T, 'name_credential'> {
  const { name_credential: _credential, ...rest } = payload;
  void _credential;
  return rest;
}
