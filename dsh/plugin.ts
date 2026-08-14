import { PLAZA_PLUGIN_NAME, PLAZA_TOOL_TIMEOUT_MS } from './constants';
import { isPlainObject } from './client';
import type { DshPluginContext, PlazaPluginConfig, PlazaRuntime } from './runtime';
import { executePlazaTool, PLAZA_TOOL_DEFINITIONS } from './tools';

export { PLAZA_PLUGIN_NAME };

export function applyPlazaPlugin(
  ctx: DshPluginContext,
  config: PlazaPluginConfig,
  runtime: PlazaRuntime,
): void {
  for (const definition of PLAZA_TOOL_DEFINITIONS) {
    ctx.tools.register({
      name: definition.name,
      description: definition.description,
      parameters: definition.parameters,
      timeoutMs: PLAZA_TOOL_TIMEOUT_MS,
      isConcurrencySafe: () => definition.concurrencySafe,
      presentCall: (args) => ({
        card: 'generic',
        title: definition.name,
        kind: definition.kind,
        rawInput: args,
      }),
      execute: async (args, exec) =>
        executePlazaTool(definition.name, isPlainObject(args) ? args : {}, {
          config,
          runtime,
          signal: exec.signal,
        }),
    });
  }
}
