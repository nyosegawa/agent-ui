import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import process from "node:process";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const reactPackageRoot = join(repoRoot, "packages", "react");
const tempRoot = await mkdtemp(join(tmpdir(), "agent-ui-package-resolution-"));

try {
  const scopeDir = join(tempRoot, "node_modules", "@nyosegawa");
  await mkdir(scopeDir, { recursive: true });
  await symlink(reactPackageRoot, join(scopeDir, "agent-ui-react"), "dir");
  await writeFile(join(tempRoot, "package.json"), JSON.stringify({ type: "module" }));
  const smokePath = join(tempRoot, "smoke.mjs");
  await writeFile(
    smokePath,
    [
      "const styles = import.meta.resolve('@nyosegawa/agent-ui-react/styles.css');",
      "const main = import.meta.resolve('@nyosegawa/agent-ui-react');",
      "let legacyStyleFailed = false;",
      "try { import.meta.resolve('@nyosegawa/agent-ui-react/style.css'); }",
      "catch { legacyStyleFailed = true; }",
      "if (!styles.endsWith('/dist/styles.css')) throw new Error(`styles resolved to ${styles}`);",
      "if (!main.endsWith('/dist/index.js')) throw new Error(`main resolved to ${main}`);",
      "if (!legacyStyleFailed) throw new Error('legacy style.css export unexpectedly resolved');",
      "console.log(JSON.stringify({ main, styles, legacyStyleFailed }, null, 2));",
    ].join("\n"),
  );
  const result = spawnSync(process.execPath, [smokePath], {
    cwd: tempRoot,
    encoding: "utf8",
    stdio: "pipe",
  });
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.stdout.write(result.stdout);
    throw new Error("package resolution smoke failed");
  }
  const css = await readFile(join(reactPackageRoot, "dist", "styles.css"), "utf8");
  if (!css.includes('@import "./styles/tokens.css";')) {
    throw new Error("dist/styles.css does not reference copied style chunks");
  }
  process.stdout.write(result.stdout);
} finally {
  await rm(tempRoot, { force: true, recursive: true });
}
