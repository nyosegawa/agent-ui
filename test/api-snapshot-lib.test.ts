import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  checkApiSnapshots,
  normalizeDeclarationSnapshot,
} from "../scripts/api-snapshot-lib.mjs";

const packageDirs = ["core", "codex", "react", "server", "web-components"];

describe("API snapshot checks", () => {
  it("reports missing built declarations before reading snapshots", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "agent-ui-api-snapshots-"));
    const snapshotRoot = join(repoRoot, "test", "api-snapshots");
    await mkdir(snapshotRoot, { recursive: true });

    for (const dir of packageDirs) {
      const packageRoot = join(repoRoot, "packages", dir);
      await mkdir(packageRoot, { recursive: true });
      await writeFile(
        join(packageRoot, "package.json"),
        JSON.stringify({
          exports: {
            ".": {
              import: {
                default: "./dist/index.js",
                types: "./dist/index.d.ts",
              },
              require: {
                default: "./dist/index.cjs",
                types: "./dist/index.d.cts",
              },
            },
          },
          name: `@nyosegawa/agent-ui-${dir}`,
        }),
      );
    }

    await expect(checkApiSnapshots({ repoRoot, snapshotRoot })).rejects.toThrow(
      /Run bun run build:packages or bun run validate:packages/,
    );
  });

  it("normalizes private declaration chunk names for readable snapshot diffs", () => {
    expect(
      normalizeDeclarationSnapshot(
        "import { A } from './method-params-Cp7iY5rD.js';\nexport { B } from './protocol-iDYFX3vA.js';\n",
      ),
    ).toBe(
      "import { A } from './method-params-<chunk>.js';\nexport { B } from './protocol-<chunk>.js';\n",
    );
  });

  it("requires import and require declarations to stay semantically aligned", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "agent-ui-api-snapshots-"));
    const snapshotRoot = join(repoRoot, "test", "api-snapshots");
    await mkdir(snapshotRoot, { recursive: true });

    for (const dir of packageDirs) {
      const packageRoot = join(repoRoot, "packages", dir);
      await mkdir(join(packageRoot, "dist"), { recursive: true });
      await writeFile(
        join(packageRoot, "package.json"),
        JSON.stringify({
          exports: {
            ".": {
              import: {
                default: "./dist/index.js",
                types: "./dist/index.d.ts",
              },
              require: {
                default: "./dist/index.cjs",
                types: "./dist/index.d.cts",
              },
            },
          },
          name: `@nyosegawa/agent-ui-${dir}`,
        }),
      );
      await writeFile(join(packageRoot, "dist", "index.d.ts"), "export type Value = string;\n");
      await writeFile(
        join(packageRoot, "dist", "index.d.cts"),
        dir === "codex" ? "export type Value = number;\n" : "export type Value = string;\n",
      );
      await writeFile(join(snapshotRoot, `${dir}__index.d.ts`), "export type Value = string;\n");
    }

    await expect(checkApiSnapshots({ repoRoot, snapshotRoot })).rejects.toThrow(
      /Declaration condition parity failed.*@nyosegawa\/agent-ui-codex/s,
    );
  });
});
