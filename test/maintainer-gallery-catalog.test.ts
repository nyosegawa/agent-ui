import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  componentCloseupCatalog,
  intentionalNonVisualPrimitiveExports,
  requiredVisualPrimitiveExports,
} from "../examples/local-react-vite/src/closeups/component-closeup-catalog";

const repoRoot = process.cwd();

function exportedNames(snapshotPath: string): Set<string> {
  const text = readFileSync(snapshotPath, "utf8");
  const names = new Set<string>();
  for (const match of text.matchAll(/export \{([^}]+)\}/g)) {
    for (const rawPart of match[1]?.split(",") ?? []) {
      const part = rawPart.trim().replace(/^type\s+/, "");
      if (!part) continue;
      const alias = /\sas\s+([A-Za-z0-9_]+)/.exec(part);
      names.add(alias?.[1] ?? part.split(/\s+/)[0] ?? part);
    }
  }
  return names;
}

describe("maintainer component close-up catalog", () => {
  it("covers every required visual primitive export", () => {
    const primitiveExports = exportedNames(
      join(repoRoot, "test/api-snapshots/react__primitives.d.ts"),
    );
    const missingFromPackage = requiredVisualPrimitiveExports.filter(
      (name) => !primitiveExports.has(name) && name !== "AgentChat",
    );
    expect(missingFromPackage).toEqual([]);

    const rootExports = exportedNames(join(repoRoot, "test/api-snapshots/react__index.d.ts"));
    expect(rootExports.has("AgentChat")).toBe(true);

    const covered = new Set(componentCloseupCatalog.flatMap((entry) => entry.covers));
    const missingFromGallery = requiredVisualPrimitiveExports.filter(
      (name) => !covered.has(name),
    );
    expect(missingFromGallery).toEqual([]);
  });

  it("classifies every public primitive export as visual or intentionally non-visual", () => {
    const primitiveExports = exportedNames(
      join(repoRoot, "test/api-snapshots/react__primitives.d.ts"),
    );
    const classified = new Set([
      ...requiredVisualPrimitiveExports,
      ...intentionalNonVisualPrimitiveExports,
    ]);
    const unclassified = [...primitiveExports].filter((name) => !classified.has(name));
    expect(unclassified).toEqual([]);
  });

  it("has unique stable close-up titles", () => {
    const titles = componentCloseupCatalog.map((entry) => entry.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
