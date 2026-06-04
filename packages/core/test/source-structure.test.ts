import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const coreSrc = join(__dirname, "..", "src");
const coreTest = __dirname;

const stateDomainFiles = [
  "account",
  "apps",
  "common",
  "connection",
  "diagnostics",
  "hooks",
  "item",
  "models",
  "run-settings",
  "server-requests",
  "skills",
  "thread",
  "turn",
  "usage",
];

const eventDomainFiles = [
  "account",
  "apps",
  "connection",
  "diagnostics",
  "hooks",
  "item",
  "models",
  "run-settings",
  "server-requests",
  "skills",
  "thread",
  "turn",
  "usage",
];

const reducerDomainFiles = [
  "account",
  "apps",
  "connection",
  "diagnostics",
  "hooks",
  "item",
  "models",
  "run-settings",
  "server-requests",
  "shared",
  "skills",
  "thread",
  "turn",
  "usage",
];

const storeFiles = [
  "apps",
  "connection",
  "diagnostics",
  "item",
  "server-request",
  "thread-entity",
  "thread-lifecycle",
  "turn",
  "usage",
];

describe("Core package source structure", () => {
  it("keeps normalized state types split by product domain", () => {
    const barrel = readFileSync(join(coreSrc, "state.ts"), "utf8");

    for (const domain of stateDomainFiles) {
      expect(existsSync(join(coreSrc, "state", `${domain}.ts`))).toBe(true);
      expect(barrel).toContain(`export type * from "./state/${domain}";`);
    }
  });

  it("keeps normalized event unions split by product domain", () => {
    const barrel = readFileSync(join(coreSrc, "events.ts"), "utf8");

    for (const domain of eventDomainFiles) {
      expect(existsSync(join(coreSrc, "events", `${domain}.ts`))).toBe(true);
      expect(barrel).toContain(`export type * from "./events/${domain}";`);
    }
  });

  it("keeps normalized reducer logic split by product domain", () => {
    const compositionRoot = readFileSync(join(coreSrc, "reducer.ts"), "utf8");

    for (const domain of reducerDomainFiles) {
      expect(existsSync(join(coreSrc, "reducer", `${domain}.ts`))).toBe(true);
    }

    expect(compositionRoot).toContain("reduceConnectionEvent");
    expect(compositionRoot).toContain("reduceThreadEvent");
    expect(compositionRoot).toContain("reduceServerRequestEvent");
  });

  it("keeps normalized stores explicit by product domain", () => {
    const root = readFileSync(join(coreSrc, "index.ts"), "utf8");

    for (const store of storeFiles) {
      expect(existsSync(join(coreSrc, "stores", `${store}.ts`))).toBe(true);
    }

    for (const store of storeFiles) {
      expect(root).not.toContain(`export * from "./stores/${store}";`);
    }
  });

  it("keeps core tests protocol-neutral", () => {
    const forbiddenPatterns = [
      /@nyosegawa\/agent-ui-codex/,
      /\.\.\/\.\.\/codex\//,
      /normalizeCodexServerMessage/,
      /parseJsonRpcLine/,
      /fixtures\/app-server\/v2-jsonrpc/,
    ];

    for (const file of sourceFiles(coreTest).filter((file) => file !== __filename)) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbiddenPatterns) {
        expect(source, `${file} must not match ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it("keeps stored-history pagination free of destructive snapshot replacement", () => {
    const forbiddenPatterns = [
      /turn\/snapshot/,
    ];

    for (const file of sourceFiles(coreSrc)) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbiddenPatterns) {
        expect(source, `${file} must not match ${pattern}`).not.toMatch(pattern);
      }
    }
  });
});

function sourceFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith(".ts") || path.endsWith(".tsx") ? [path] : [];
  });
}
