export interface SkillAppManifest {
  id: string;
  title: string;
  entry?: string;
  description?: string;
  mode?: "inline" | "modal" | "panel" | "fullscreen";
  tools?: SkillAppToolSpec[];
}

export interface SkillAppToolSpec {
  name: string;
  description?: string;
  inputSchema?: unknown;
}

export interface SkillAppRegistry {
  get(id: string): SkillAppManifest | undefined;
  list(): SkillAppManifest[];
  register(manifest: SkillAppManifest): void;
  update(id: string, patch: Partial<SkillAppManifest>): SkillAppManifest;
}

export type ViteManifestModule =
  | SkillAppManifest
  | SkillAppManifest[]
  | { default?: SkillAppManifest | SkillAppManifest[] };

export type ViteManifestGlob = Record<
  string,
  ViteManifestModule | (() => Promise<ViteManifestModule>)
>;

export function createSkillAppRegistry(
  manifests: SkillAppManifest[] = [],
): SkillAppRegistry {
  const byId = new Map<string, SkillAppManifest>();
  for (const manifest of manifests) byId.set(manifest.id, manifest);
  return {
    get: (id) => byId.get(id),
    list: () => Array.from(byId.values()),
    register(manifest) {
      byId.set(manifest.id, manifest);
    },
    update(id, patch) {
      const current = byId.get(id);
      if (!current) throw new Error(`Unknown skill app: ${id}`);
      const next = { ...current, ...patch, id };
      byId.set(id, next);
      return next;
    },
  };
}

export async function loadSkillAppRegistry(options: {
  fetcher?: typeof fetch;
  manifests?: SkillAppManifest[];
  remoteManifests?: string[];
  viteGlob?: ViteManifestGlob;
} = {}): Promise<SkillAppRegistry> {
  const registry = createSkillAppRegistry(options.manifests ?? []);
  for (const manifest of await loadViteGlobManifests(options.viteGlob ?? {})) {
    registry.register(manifest);
  }
  for (const url of options.remoteManifests ?? []) {
    for (const manifest of await loadRemoteSkillAppManifest(url, options.fetcher)) {
      registry.register(manifest);
    }
  }
  return registry;
}

export async function loadViteGlobManifests(
  glob: ViteManifestGlob,
): Promise<SkillAppManifest[]> {
  const manifests: SkillAppManifest[] = [];
  for (const value of Object.values(glob)) {
    const module = typeof value === "function" ? await value() : value;
    manifests.push(...normalizeSkillAppManifests(module));
  }
  return manifests;
}

export async function loadRemoteSkillAppManifest(
  url: string,
  fetcher: typeof fetch = fetch,
): Promise<SkillAppManifest[]> {
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`Failed to load skill app manifest: ${url}`);
  return normalizeSkillAppManifests((await response.json()) as unknown);
}

export function normalizeSkillAppManifests(value: unknown): SkillAppManifest[] {
  const unwrapped = unwrapDefault(value);
  const values = Array.isArray(unwrapped) ? unwrapped : [unwrapped];
  return values.flatMap((entry) => {
    const record = asRecord(entry);
    if (!record) return [];
    const id = stringValue(record.id);
    const title = stringValue(record.title) ?? stringValue(record.name);
    if (!id || !title) return [];
    return [
      {
        description: stringValue(record.description),
        entry: stringValue(record.entry),
        id,
        mode: normalizeMode(record.mode),
        title,
        tools: Array.isArray(record.tools)
          ? record.tools.flatMap(normalizeToolSpec)
          : undefined,
      },
    ];
  });
}

export const skillAppClientToolNames = [
  "open_skill_app",
  "update_skill_app",
  "request_skill_app_feedback",
] as const;

export function validateSkillAppClientToolName(name: string): void {
  if (!skillAppClientToolNames.includes(name as (typeof skillAppClientToolNames)[number])) {
    throw new Error(`Unknown skill app client tool: ${name}`);
  }
  const namespace = name.split(/[./:]/, 1)[0] ?? "";
  if (["app", "thread", "turn", "skills", "mcpServer", "account"].includes(namespace)) {
    throw new Error(`Skill app client tool uses reserved App Server namespace: ${name}`);
  }
}

export function createSkillAppClientTools(registry: SkillAppRegistry) {
  return skillAppClientToolNames.map((name) => {
    validateSkillAppClientToolName(name);
    return {
      inputSchema: { additionalProperties: true, type: "object" },
      name,
      run(input: unknown) {
        const record = asRecord(input) ?? {};
        const id = stringValue(record.id) ?? stringValue(record.target);
        if (!id) throw new Error(`${name} requires id`);
        if (name === "open_skill_app") return registry.get(id);
        if (name === "update_skill_app") return registry.update(id, asRecord(record.patch) ?? {});
        return { id, feedback: record.feedback ?? null };
      },
    };
  });
}

function normalizeToolSpec(value: unknown): SkillAppToolSpec[] {
  const record = asRecord(value);
  const name = stringValue(record?.name);
  if (!record || !name) return [];
  return [
    {
      description: stringValue(record.description),
      inputSchema: record.inputSchema ?? record.input_schema,
      name,
    },
  ];
}

function normalizeMode(value: unknown): SkillAppManifest["mode"] | undefined {
  return value === "inline" || value === "modal" || value === "panel" || value === "fullscreen"
    ? value
    : undefined;
}

function unwrapDefault(value: unknown): unknown {
  const record = asRecord(value);
  return record && "default" in record ? record.default : value;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}
