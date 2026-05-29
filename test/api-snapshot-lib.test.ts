import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { checkApiSnapshots } from "../scripts/api-snapshot-lib.mjs";

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
      /Run bun run build or bun run validate:packages/,
    );
  });
});
