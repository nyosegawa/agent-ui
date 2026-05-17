import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { checkApiSnapshots, collectPublicDeclarations } from "./api-snapshot-lib.mjs";

describe("api snapshot gate", () => {
  it("fails missing, changed, and stale snapshots without --update", async () => {
    const root = await fakeRepo();
    const snapshotRoot = join(root, "test", "api-snapshots");
    await mkdir(snapshotRoot, { recursive: true });
    await writeFile(join(snapshotRoot, "core__index.d.ts"), "export const changed: number;\n");
    await writeFile(join(snapshotRoot, "core__stale.d.ts"), "export const stale: number;\n");

    await expect(checkApiSnapshots({ repoRoot: root, snapshotRoot })).rejects.toThrow(
      /missing: codex__index\.d\.ts/,
    );
    await expect(checkApiSnapshots({ repoRoot: root, snapshotRoot })).rejects.toThrow(
      /changed: core__index\.d\.ts/,
    );
    await expect(checkApiSnapshots({ repoRoot: root, snapshotRoot })).rejects.toThrow(
      /stale: core__stale\.d\.ts/,
    );
  });

  it("updates missing and changed snapshots and deletes stale snapshots with --update", async () => {
    const root = await fakeRepo();
    const snapshotRoot = join(root, "test", "api-snapshots");
    await mkdir(snapshotRoot, { recursive: true });
    await writeFile(join(snapshotRoot, "core__index.d.ts"), "export const changed: number;\n");
    await writeFile(join(snapshotRoot, "core__stale.d.ts"), "export const stale: number;\n");

    await expect(checkApiSnapshots({ repoRoot: root, snapshotRoot, update: true })).resolves.toEqual({
      changed: ["core__index.d.ts"],
      missing: [
        "codex__index.d.ts",
        "react__index.d.ts",
        "server__index.d.ts",
        "web-components__index.d.ts",
      ],
      stale: ["core__stale.d.ts"],
    });

    await expect(readFile(join(snapshotRoot, "core__index.d.ts"), "utf8")).resolves.toBe(
      "export const core: string;\n",
    );
    await expect(readFile(join(snapshotRoot, "codex__index.d.ts"), "utf8")).resolves.toBe(
      "export const codex: string;\n",
    );
    await expect(checkApiSnapshots({ repoRoot: root, snapshotRoot })).resolves.toEqual({
      changed: [],
      missing: [],
      stale: [],
    });
  });

  it("collects only declarations reachable from package exports", async () => {
    const root = await fakeRepo();
    const declarations = await collectPublicDeclarations(root);
    expect(declarations.map((entry) => entry.snapshotName)).toEqual([
      "codex__index.d.ts",
      "core__index.d.ts",
      "react__index.d.ts",
      "server__index.d.ts",
      "web-components__index.d.ts",
    ]);
  });
});

async function fakeRepo() {
  const root = await mkdir(join(tmpdir(), `agent-ui-api-snapshots-${process.pid}-${Math.random()}`), {
    recursive: true,
  });
  await fakePackage(root, "core", "@nyosegawa/agent-ui-core", "export const core: string;\n");
  await fakePackage(root, "codex", "@nyosegawa/agent-ui-codex", "export const codex: string;\n");
  for (const dir of ["react", "server", "web-components"]) {
    await fakePackage(root, dir, `@nyosegawa/agent-ui-${dir}`, "export {};\n");
  }
  return root;
}

async function fakePackage(root: string, dir: string, name: string, declaration: string) {
  const packageRoot = join(root, "packages", dir);
  await mkdir(join(packageRoot, "dist"), { recursive: true });
  await writeFile(
    join(packageRoot, "package.json"),
    JSON.stringify({
      exports: {
        ".": {
          import: { default: "./dist/index.js", types: "./dist/index.d.ts" },
          require: { default: "./dist/index.cjs", types: "./dist/index.d.cts" },
        },
      },
      name,
    }),
  );
  await writeFile(join(packageRoot, "dist", "index.d.ts"), declaration);
  await writeFile(join(packageRoot, "dist", "internal-hash.d.ts"), "export const hidden: string;\n");
}
