import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

import {
  assertRepresentativeNamedExports,
  representativeNamedExportsBySpecifier,
} from "../scripts/runtime-export-policy.mjs";
import * as reactRoot from "@nyosegawa/agent-ui-react";

describe("runtime named export policy", () => {
  it("covers representative root and subpath exports", () => {
    expect(representativeNamedExportsBySpecifier).toMatchObject({
      "@nyosegawa/agent-ui-codex": expect.arrayContaining(["createCodexSession"]),
      "@nyosegawa/agent-ui-codex/clients": expect.arrayContaining(["createCodexClients"]),
      "@nyosegawa/agent-ui-codex/normalizer": expect.arrayContaining([
        "normalizeThreadLoadedListResponse",
        "normalizeThreadListResponse",
        "normalizeThreadResumeResponse",
      ]),
      "@nyosegawa/agent-ui-codex/request-builders": expect.arrayContaining([
        "threadStartParams",
      ]),
      "@nyosegawa/agent-ui-codex/session": expect.arrayContaining(["createCodexSession"]),
      "@nyosegawa/agent-ui-codex/websocket": expect.arrayContaining([
        "createCodexWebSocketTransport",
      ]),
      "@nyosegawa/agent-ui-react": expect.arrayContaining(["AgentChat"]),
      "@nyosegawa/agent-ui-react/headless": expect.arrayContaining([
        "useAgentComposerController",
      ]),
      "@nyosegawa/agent-ui-react/primitives": expect.arrayContaining([
        "AgentMessageList",
      ]),
    });
  });

  it("reports missing runtime named exports with specifier and module format", () => {
    expect(() =>
      assertRepresentativeNamedExports("@nyosegawa/agent-ui-codex/clients", "CJS", {}),
    ).toThrow("@nyosegawa/agent-ui-codex/clients CJS export missing createCodexClients");
  });

  it("keeps React root limited to the preset API", () => {
    expect(Object.keys(reactRoot).sort()).toEqual([
      "AgentChat",
      "AgentI18nProvider",
      "AgentProvider",
      "agentI18nDictionaries",
      "agentLocales",
      "defaultAgentComponents",
      "interpolate",
      "interpolationVariables",
      "normalizeAgentLocale",
      "useAgentI18n",
    ]);
  });

  it("keeps browser-safe entrypoints away from Node stdio imports", () => {
    const repoRoot = join(import.meta.dirname, "..");
    const browserEntrypoints = [
      "packages/codex/src/websocket.ts",
      "packages/codex/src/request-builders.ts",
      "packages/codex/src/normalizer.ts",
      "packages/react/src/index.ts",
      "packages/react/src/headless.ts",
      "packages/react/src/primitives.ts",
      "packages/web-components/src/index.tsx",
    ];
    const visited = collectRuntimeSourceGraph(repoRoot, browserEntrypoints);
    const browserSource = [...visited]
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    expect(browserSource).not.toMatch(/from ["']node:(?:stream|readline|child_process)["']/);
    expect(browserSource).not.toMatch(/from ["']execa["']/);
    expect(browserSource).not.toContain("./stdio-transport");
    expect([...visited].map((file) => normalize(file))).not.toContain(
      normalize(join(repoRoot, "packages/codex/src/stdio-transport.ts")),
    );
  });
});

function collectRuntimeSourceGraph(repoRoot: string, entrypoints: string[]): Set<string> {
  const visited = new Set<string>();
  const queue = entrypoints.map((entrypoint) => join(repoRoot, entrypoint));
  while (queue.length > 0) {
    const file = queue.pop();
    if (!file || visited.has(file)) continue;
    visited.add(file);
    const source = readFileSync(file, "utf8");
    for (const specifier of runtimeSpecifiers(source)) {
      const resolved = resolveSourceSpecifier(repoRoot, file, specifier);
      if (resolved) queue.push(resolved);
    }
  }
  return visited;
}

function runtimeSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const fromPattern = /(?:^|\n)\s*(import|export)\s+(type\s+)?[\s\S]*?\sfrom\s+["']([^"']+)["']/g;
  for (const match of source.matchAll(fromPattern)) {
    if (match[2]) continue;
    specifiers.push(match[3]);
  }
  const sideEffectPattern = /(?:^|\n)\s*import\s+["']([^"']+)["']/g;
  for (const match of source.matchAll(sideEffectPattern)) {
    specifiers.push(match[1]);
  }
  return specifiers;
}

function resolveSourceSpecifier(
  repoRoot: string,
  fromFile: string,
  specifier: string,
): string | undefined {
  if (specifier === "@nyosegawa/agent-ui-codex") {
    throw new Error("Browser-safe entrypoints must not import the Codex root facade.");
  }
  if (specifier.startsWith("@nyosegawa/agent-ui-server")) {
    throw new Error("Browser-safe entrypoints must not import server bridge helpers.");
  }
  if (specifier === "@nyosegawa/agent-ui-core") {
    return resolveExistingSource(join(repoRoot, "packages/core/src/index"));
  }
  if (specifier === "@nyosegawa/agent-ui-react") {
    return resolveExistingSource(join(repoRoot, "packages/react/src/index"));
  }
  if (specifier === "@nyosegawa/agent-ui-web-components") {
    return resolveExistingSource(join(repoRoot, "packages/web-components/src/index"));
  }
  if (specifier.startsWith("@nyosegawa/agent-ui-codex/")) {
    const subpath = specifier.slice("@nyosegawa/agent-ui-codex/".length);
    return resolveExistingSource(join(repoRoot, "packages/codex/src", subpath));
  }
  if (specifier.startsWith("@nyosegawa/agent-ui-react/")) {
    if (specifier === "@nyosegawa/agent-ui-react/styles.css") return undefined;
    const subpath = specifier.slice("@nyosegawa/agent-ui-react/".length);
    return resolveExistingSource(join(repoRoot, "packages/react/src", subpath));
  }
  if (specifier.startsWith(".")) {
    const resolved = resolveExistingSource(join(dirname(fromFile), specifier));
    if (!resolved && !specifier.endsWith(".css")) {
      throw new Error(`Unable to resolve local browser-safe import ${specifier} from ${fromFile}`);
    }
    return resolved;
  }
  return undefined;
}

function resolveExistingSource(basePath: string): string | undefined {
  const candidates = [
    `${basePath}.ts`,
    `${basePath}.tsx`,
    basePath,
    join(basePath, "index.ts"),
    join(basePath, "index.tsx"),
  ];
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
}
