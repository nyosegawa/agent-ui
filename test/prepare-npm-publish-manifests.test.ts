import { describe, expect, it } from "vitest";

import { normalizePublishManifest } from "../scripts/prepare-npm-publish-manifests.mjs";

describe("prepare npm publish manifests", () => {
  it("rewrites internal workspace ranges to npm semver ranges", () => {
    expect(
      normalizePublishManifest({
        name: "@nyosegawa/agent-ui-react",
        version: "0.1.1",
        dependencies: {
          "@codemirror/state": "^6.6.0",
          "@nyosegawa/agent-ui-codex": "workspace:^0.1.1",
          "@nyosegawa/agent-ui-core": "workspace:*",
        },
      }),
    ).toMatchObject({
      dependencies: {
        "@codemirror/state": "^6.6.0",
        "@nyosegawa/agent-ui-codex": "^0.1.1",
        "@nyosegawa/agent-ui-core": "0.1.1",
      },
    });
  });
});
