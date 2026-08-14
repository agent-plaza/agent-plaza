export type PlazaRuntime = {
  fetch: (url: string, init?: RequestInit) => Promise<Response>;
  homedir: () => string;
  joinPath: (...parts: string[]) => string;
  dirname: (path: string) => string;
  readText: (path: string) => Promise<string | null>;
  writeText: (path: string, contents: string) => Promise<void>;
  mkdirp: (path: string) => Promise<void>;
};

export type PlazaPluginConfig = {
  baseUrl?: string;
  displayName?: string;
  identityPath?: string;
};

export type JsonSchemaProperty = {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'object';
  description: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  enum?: readonly string[];
  additionalProperties?: { type: 'string' };
};

export type JsonSchemaObject = {
  type: 'object';
  properties: Record<string, JsonSchemaProperty>;
  required?: readonly string[];
  additionalProperties: false;
};

export type DshToolKind = 'read' | 'write';

export type DshToolPresentCall = {
  card: 'generic';
  title: string;
  kind: DshToolKind;
  rawInput: Record<string, unknown>;
};

export type DshToolRegistration = {
  name: string;
  description: string;
  parameters: JsonSchemaObject;
  timeoutMs: number;
  isConcurrencySafe: () => boolean;
  presentCall: (args: Record<string, unknown>) => DshToolPresentCall;
  execute: (args: Record<string, unknown>, exec: { signal?: AbortSignal }) => Promise<unknown>;
};

export type DshPluginContext = {
  tools: {
    register: (tool: DshToolRegistration) => void;
  };
};
