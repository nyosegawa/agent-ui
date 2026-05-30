import { describe, expect, it } from "vitest";

import {
  assertFocusedGitClean,
  patchPackageJsonMetadata,
  patchProtocolMetadata,
  renderGeneratedReadme,
  resolveCodexSubmodule,
} from "../scripts/import-schema-lib";

const metadata = {
  codexRepo: "/tmp/codex",
  commit: "0123456789abcdef0123456789abcdef01234567",
  commitDate: "2026-05-29T00:00:00Z",
  generatedAt: "2026-05-29T01:02:03Z",
  generatorCommand: "bun --filter @nyosegawa/agent-ui-codex generate:schema",
  subject: "update app-server schema",
};

describe("schema import script preflight", () => {
  it("uses the repository Codex submodule as the only schema source", () => {
    expect(resolveCodexSubmodule()).toMatch(/agent-ui\/third_party\/codex$/);
  });

  it("rejects dirty focused upstream protocol paths", () => {
    expect(() =>
      assertFocusedGitClean(" M codex-rs/app-server/src/lib.rs\n", [
        "codex-rs/app-server",
        "codex-rs/app-server-protocol",
      ]),
    ).toThrow("codex-rs/app-server/src/lib.rs");
  });

  it("renders one captured metadata record across protocol, package, and README", () => {
    expect(
      patchProtocolMetadata(
        'export const CODEX_PROTOCOL_COMMIT = "old";\nexport const CODEX_PROTOCOL_GENERATED_AT = "old";\n',
        metadata,
      ),
    ).toContain(`CODEX_PROTOCOL_COMMIT = "${metadata.commit}"`);

    expect(
      JSON.parse(
        patchPackageJsonMetadata(
          JSON.stringify({ agentUi: { codexProtocolCommit: "old", generatedAt: "old" } }),
          metadata,
        ),
      ).agentUi,
    ).toEqual({
      codexProtocolCommit: metadata.commit,
      generatedAt: metadata.generatedAt,
    });

    const readme = renderGeneratedReadme(metadata);
    expect(readme).toMatch(/- Upstream repository: `.*tmp\/codex`/);
    expect(readme).toContain(`- Upstream commit: \`${metadata.commit}\``);
    expect(readme).toContain(`- Generated at: \`${metadata.generatedAt}\``);
  });
});
