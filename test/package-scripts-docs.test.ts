import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_ONE_SHOT_METHODS } from "../packages/server/src/one-shot-rpc-policy";

function readRepoFile(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

type PackageJson = {
  exports?: Record<string, unknown>;
  name: string;
  scripts?: Record<string, string>;
};

const validationScripts = [
  "validate:fast",
  "validate:protocol",
  "validate:packages",
  "validate:e2e",
  "validate:release",
];

describe("package script documentation", () => {
  const packageJson = JSON.parse(readRepoFile("package.json")) as PackageJson;

  it("keeps test:fixtures documented as the core fixture runner", () => {
    expect(packageJson.scripts?.["test:core-fixtures"]).toBe(
      "bun test packages/core/test",
    );
    expect(packageJson.scripts?.["test:fixtures"]).toBe("bun run test:core-fixtures");

    const testingDocs = readRepoFile("docs/architecture/testing.md");
    const protocolDocs = readRepoFile("docs/reference/codex-protocol.md");

    expect(testingDocs).toContain("bun run test:core-fixtures");
    expect(testingDocs).toContain("core reducer/state fixture gate");
    expect(protocolDocs).toContain("bun run test:core-fixtures");
    expect(protocolDocs).toContain("compatibility alias");
  });

  it("keeps validate:packages docs aligned with the script order", () => {
    expect(packageJson.scripts?.["validate:packages"]).toBe(
      "bun run build && bun run test:packlist && bun run test:node-compat && bun run publint && bun run attw",
    );
    expect(packageJson.scripts?.["validate:release"]).toBe(
      "bun run validate:fast && bun run validate:protocol && bun run validate:packages && bun run check:dead-code && bun run test:api-snapshots && bun run test:package-resolution",
    );

    const testingDocs = readRepoFile("docs/architecture/testing.md");
    expect(testingDocs).toContain(
      "`test:packlist`, `test:node-compat`, `publint`, then `attw`",
    );
    expect(testingDocs).toContain(
      "packlist smoke, Node\n  compatibility smoke, `publint`, and `arethetypeswrong`",
    );
    expect(testingDocs).toMatch(
      /`validate:release` does not repeat\s+`test:node-compat` after `validate:packages`/,
    );
  });

  it("keeps Codex hook policy docs aligned with package scripts", () => {
    expect(packageJson.scripts?.["test:hooks"]).toBe(
      "vitest run test/codex-hooks-repo-policy.test.ts",
    );

    const testingDocs = readRepoFile("docs/architecture/testing.md");
    const hookDocs = readRepoFile("docs/maintenance/codex-hooks.md");

    expect(testingDocs).toContain("bun run test:hooks");
    expect(hookDocs).toContain("bun run test:hooks");
    expect(hookDocs).toContain(".codex/hooks.json");
    expect(hookDocs).toContain("scripts/codex-hooks/repo-policy.mjs");
  });

  it("keeps public skill docs aligned with package scripts", () => {
    expect(packageJson.scripts?.["test:skills"]).toBe(
      "vitest run test/agent-ui-skill.test.ts",
    );

    const testingDocs = readRepoFile("docs/architecture/testing.md");
    const skillDocs = readRepoFile("docs/maintenance/agent-ui-skills.md");

    expect(testingDocs).toContain("bun run test:skills");
    expect(skillDocs).toContain("bun run test:skills");
    expect(skillDocs).toContain("skills/agent-ui/SKILL.md");
    expect(skillDocs).toContain("gh skill install nyosegawa/agent-ui agent-ui");
    expect(skillDocs).toContain("npx skills add nyosegawa/agent-ui --skill agent-ui");
  });

  it("keeps repository skill docs aligned with package scripts", () => {
    expect(packageJson.scripts?.["test:repo-skills"]).toBe(
      "vitest run test/repository-skills.test.ts",
    );

    const testingDocs = readRepoFile("docs/architecture/testing.md");
    const skillDocs = readRepoFile("docs/maintenance/repository-skills.md");

    expect(testingDocs).toContain("bun run test:repo-skills");
    expect(skillDocs).toContain("bun run test:repo-skills");
    expect(skillDocs).toContain(".agents/skills/agent-ui-review/");
    expect(skillDocs).toContain(".agents/skills/release-validation/");
    expect(skillDocs).toContain(".agents/skills/example-authoring/");
    expect(skillDocs).toContain(".agents/skills/browser-qa/");
  });

  it("keeps validation command docs aligned with root package scripts", () => {
    const testingDocs = readRepoFile("docs/architecture/testing.md");
    const ciDocs = readRepoFile("docs/maintenance/ci-cd.md");
    const docsReadme = readRepoFile("docs/README.md");
    const rootReadme = readRepoFile("README.md");

    expect(ciDocs).toContain("Required PR Checks");
    expect(ciDocs).toContain("Local Fallback");
    expect(docsReadme).toContain("./maintenance/ci-cd.md");
    expect(rootReadme).toContain("./docs/maintenance/ci-cd.md");

    for (const script of validationScripts) {
      const command = packageJson.scripts?.[script];
      expect(command, script).toBeTypeOf("string");
      expect(testingDocs, script).toContain(`bun run ${script}`);
      for (const child of childBunScripts(command ?? "")) {
        expect(testingDocs, `${script} -> ${child}`).toContain(child);
      }
    }
  });

  it("keeps package lists aligned with workspace package manifests", () => {
    const packageNames = publicPackageManifests().map((manifest) => manifest.name);
    for (const docsPath of [
      "README.md",
      "docs/README.md",
      "docs/reference/package-exports.md",
    ]) {
      const docs = readRepoFile(docsPath);
      for (const packageName of packageNames) {
        expect(docs, `${docsPath} missing ${packageName}`).toContain(packageName);
      }
    }
  });

  it("keeps package export docs aligned with package export maps", () => {
    const packageExportsDocs = readRepoFile("docs/reference/package-exports.md");
    const listedSubpaths = [
      ...packageExportsDocs.matchAll(/^- `(@nyosegawa\/agent-ui[^`]+)`$/gm),
    ]
      .map((match) => match[1])
      .sort();

    expect(listedSubpaths).toEqual(publicExportSpecifiers());
    expect(packageExportsDocs).toMatch(
      /type-only surface at `@nyosegawa\/agent-ui-codex\/stable-types`/,
    );
  });

  it("keeps one-shot RPC docs aligned with the default allowlist", () => {
    const serverBridgeDocs = readRepoFile("docs/reference/server-bridge.md");
    expect(extractDocumentedList(serverBridgeDocs, "Default one-shot methods:")).toEqual(
      [...DEFAULT_ONE_SHOT_METHODS].sort(),
    );
    expect(serverBridgeDocs).toContain("before App Server is spawned");
  });

  it("keeps upload default docs aligned with user-facing behavior", () => {
    const serverBridgeDocs = readRepoFile("docs/reference/server-bridge.md");
    const uploadSource = readRepoFile("packages/server/src/upload.ts");

    expect(uploadSource).toContain("const DEFAULT_MAX_UPLOAD_BYTES = 16 * 1024 * 1024");
    expect(uploadSource).toContain("const DEFAULT_UPLOAD_TTL_MS = 60 * 60 * 1000");
    expect(uploadSource).toContain(
      "application\\/octet-stream|image\\/[-+.\\w]+|text\\/plain",
    );
    expect(uploadSource).toContain("contentType && !isAllowedContentType(contentType)");

    expect(serverBridgeDocs).toContain("missing `content-type` is accepted");
    expect(serverBridgeDocs).toContain(
      "`application/octet-stream`, `image/*`, or `text/plain`",
    );
    expect(serverBridgeDocs).toContain("16 MB default limit");
    expect(serverBridgeDocs).toContain("one hour default TTL");
  });
});

function publicPackageManifests(): PackageJson[] {
  const packagesDir = new URL("../packages", import.meta.url);
  return readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      return JSON.parse(
        readFileSync(join(packagesDir.pathname, entry.name, "package.json"), "utf8"),
      ) as PackageJson;
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function publicExportSpecifiers(): string[] {
  return publicPackageManifests()
    .flatMap((manifest) => {
      return Object.keys(manifest.exports ?? {}).map((subpath) => {
        return subpath === "." ? manifest.name : `${manifest.name}/${subpath.slice(2)}`;
      });
    })
    .sort();
}

function childBunScripts(command: string): string[] {
  return [...command.matchAll(/\bbun run ([\w:-]+)/g)]
    .map((match) => match[1])
    .filter((script): script is string => Boolean(script))
    .filter((script) => !validationScripts.includes(script));
}

function extractDocumentedList(markdown: string, marker: string): string[] {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === marker);
  if (start === -1) throw new Error(`Missing list marker: ${marker}`);
  const values: string[] = [];
  for (const line of lines.slice(start + 1)) {
    const match = /^- `([^`]+)`/.exec(line.trim());
    if (match?.[1]) {
      values.push(match[1]);
      continue;
    }
    if (values.length > 0 && line.trim() !== "") break;
  }
  return values.sort();
}
