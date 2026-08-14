import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

import { PLAZA_PLUGIN_NAME } from './constants';
import { applyPlazaPlugin } from './plugin';
import type { DshPluginContext, PlazaPluginConfig, PlazaRuntime } from './runtime';

export const name = PLAZA_PLUGIN_NAME;

export const inject = ['tools'] as const;

const NODE_ENOENT = 'ENOENT';

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === NODE_ENOENT;
}

export function createNodePlazaRuntime(): PlazaRuntime {
  return {
    fetch: (url, init) => globalThis.fetch(url, init),
    homedir,
    joinPath: join,
    dirname,
    readText: async (path) => {
      try {
        return await readFile(path, 'utf8');
      } catch (error) {
        if (isNotFoundError(error)) {
          return null;
        }
        throw error;
      }
    },
    writeText: async (path, contents) => {
      await writeFile(path, contents, { encoding: 'utf8', mode: 0o600 });
    },
    mkdirp: async (path) => {
      await mkdir(path, { recursive: true, mode: 0o700 });
    },
  };
}

export function apply(ctx: DshPluginContext, config: PlazaPluginConfig = {}): void {
  applyPlazaPlugin(ctx, config, createNodePlazaRuntime());
}
