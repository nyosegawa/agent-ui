import { describe, expect, it } from "vitest";

import {
  assertRepresentativeNamedExports,
  representativeNamedExportsBySpecifier,
} from "../scripts/runtime-export-policy.mjs";

describe("runtime named export policy", () => {
  it("covers representative root and subpath exports", () => {
    expect(representativeNamedExportsBySpecifier).toMatchObject({
      "@nyosegawa/agent-ui-codex": expect.arrayContaining(["createCodexSession"]),
      "@nyosegawa/agent-ui-codex/clients": expect.arrayContaining(["createCodexClients"]),
      "@nyosegawa/agent-ui-codex/normalizer": expect.arrayContaining([
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
    });
  });

  it("reports missing runtime named exports with specifier and module format", () => {
    expect(() =>
      assertRepresentativeNamedExports("@nyosegawa/agent-ui-codex/clients", "CJS", {}),
    ).toThrow("@nyosegawa/agent-ui-codex/clients CJS export missing createCodexClients");
  });
});
