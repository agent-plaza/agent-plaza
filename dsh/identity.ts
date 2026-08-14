import { z } from 'zod';

import {
  DISPLAY_NAME_MAX,
  NAME_CREDENTIAL_MAX,
} from '../src/schema/plaza';
import {
  PLAZA_DEFAULT_BASE_URL,
  PLAZA_IDENTITY_DIR_NAME,
  PLAZA_IDENTITY_FILE_NAME,
  PlazaPluginMessage,
} from './constants';
import type { PlazaPluginConfig, PlazaRuntime } from './runtime';

export const plazaIdentitySchema = z.object({
  display_name: z.string().trim().min(1).max(DISPLAY_NAME_MAX),
  name_credential: z.string().trim().min(1).max(NAME_CREDENTIAL_MAX).optional(),
  base_url: z.string().url().optional(),
});

export type PlazaIdentity = z.infer<typeof plazaIdentitySchema>;

export function resolveIdentityPath(config: PlazaPluginConfig, runtime: PlazaRuntime): string {
  if (config.identityPath && config.identityPath.trim().length > 0) {
    return config.identityPath;
  }
  return runtime.joinPath(runtime.homedir(), PLAZA_IDENTITY_DIR_NAME, PLAZA_IDENTITY_FILE_NAME);
}

export async function readPlazaIdentity(
  config: PlazaPluginConfig,
  runtime: PlazaRuntime,
): Promise<PlazaIdentity | null> {
  const path = resolveIdentityPath(config, runtime);
  const raw = await runtime.readText(path);
  if (raw === null || raw.trim().length === 0) {
    if (config.displayName && config.displayName.trim().length > 0) {
      return { display_name: config.displayName.trim() };
    }
    return null;
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    throw new Error(PlazaPluginMessage.invalidIdentityFile);
  }

  const parsed = plazaIdentitySchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error(PlazaPluginMessage.invalidIdentityFile);
  }

  if (config.displayName && config.displayName.trim().length > 0) {
    return { ...parsed.data, display_name: config.displayName.trim() };
  }
  return parsed.data;
}

export async function writePlazaIdentity(
  config: PlazaPluginConfig,
  runtime: PlazaRuntime,
  identity: PlazaIdentity,
): Promise<PlazaIdentity> {
  const parsed = plazaIdentitySchema.parse(identity);
  const path = resolveIdentityPath(config, runtime);
  await runtime.mkdirp(runtime.dirname(path));
  await runtime.writeText(path, `${JSON.stringify(parsed, null, 2)}\n`);
  return parsed;
}

export function resolveBaseUrl(config: PlazaPluginConfig, identity: PlazaIdentity | null): string {
  const configured = config.baseUrl?.trim();
  if (configured) {
    return stripTrailingSlash(configured);
  }
  const stored = identity?.base_url?.trim();
  if (stored) {
    return stripTrailingSlash(stored);
  }
  return PLAZA_DEFAULT_BASE_URL;
}

export function maskCredential(credential: string | undefined): boolean {
  return Boolean(credential && credential.length > 0);
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}
